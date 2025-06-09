export class ControlPanel {
  constructor() {
    this.container = null;
    this.isVisible = true;
    this.controls = null;
  }

  init() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'control-panel';
    this.container.className = 'control-panel';
    
    // Create content area
    const content = document.createElement('div');
    content.className = 'control-panel-content';
    content.innerHTML = `
      <div class="control-section">
        <h4>Knobs</h4>
        <div class="knobs-list"></div>
      </div>
      <div class="control-section">
        <h4>Buttons</h4>
        <div class="buttons-list"></div>
      </div>
      <div class="control-section">
        <h4>Faders</h4>
        <div class="faders-list"></div>
      </div>
    `;
    
    this.container.appendChild(content);
    document.body.appendChild(this.container);
    
    // Add toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-btn';
    toggleBtn.innerHTML = '◀';
    toggleBtn.title = 'Toggle Fullscreen';
    toggleBtn.addEventListener('click', () => {
      // Dispatch a custom event that main.js can listen to
      window.dispatchEvent(new Event('toggleFullscreen'));
    });
    this.container.appendChild(toggleBtn);
    
    // Add styles
    this.addStyles();
  }

  updateControls(controls) {
    if (!this.container) return;
    
    this.controls = controls;
    
    // Update knobs
    const knobsList = this.container.querySelector('.knobs-list');
    knobsList.innerHTML = '';
    controls.knobs.forEach(knob => {
      // Add LFO state to control data
      knob.lfoActive = this.getLFOState(knob.name);
      const item = this.createControlItem(knob, 'knob');
      knobsList.appendChild(item);
    });
    
    // Update buttons
    const buttonsList = this.container.querySelector('.buttons-list');
    buttonsList.innerHTML = '';
    controls.buttons.forEach(button => {
      const item = this.createControlItem(button, 'button');
      buttonsList.appendChild(item);
    });
    
    // Update faders
    const fadersList = this.container.querySelector('.faders-list');
    fadersList.innerHTML = '';
    controls.faders.forEach(fader => {
      // Add LFO state to control data
      fader.lfoActive = this.getLFOState(fader.name);
      const item = this.createControlItem(fader, 'fader');
      fadersList.appendChild(item);
    });
  }

  getMidiNumber(controlName, type) {
    // Check for custom mapping first
    const customNumber = this.getCustomMidiNumber(controlName, type);
    if (customNumber !== undefined) {
      return type === 'button' ? `Note ${customNumber}` : `CC ${customNumber}`;
    }

    // Fall back to default MIDI mappings
    const midiMappings = {
      knobs: {
        deviceKnob1: 16,
        deviceKnob2: 17,
        deviceKnob3: 18,
        deviceKnob4: 19,
        deviceKnob5: 20,
        deviceKnob6: 21,
        deviceKnob7: 22,
        deviceKnob8: 23
      },
      faders: {
        track1: 48,
        track2: 49,
        track3: 50,
        track4: 51,
        track5: 52,
        track6: 53,
        track7: 54,
        track8: 55,
        master: 14
      },
      buttons: {
        'row1': [53, 54, 55, 56, 57, 58, 59, 60],
        'row2': [45, 46, 47, 48, 49, 50, 51, 52],
        'row3': [37, 38, 39, 40, 41, 42, 43, 44],
        'row4': [29, 30, 31, 32, 33, 34, 35, 36],
        'row5': [21, 22, 23, 24, 25, 26, 27, 28]
      }
    };

    if (type === 'knob' && midiMappings.knobs[controlName]) {
      return `CC ${midiMappings.knobs[controlName]}`;
    } else if (type === 'fader' && midiMappings.faders[controlName]) {
      return `CC ${midiMappings.faders[controlName]}`;
    } else if (type === 'button' && controlName.includes('[')) {
      // Parse button format like "row2[0]"
      const match = controlName.match(/row(\d)\[(\d)\]/);
      if (match) {
        const row = `row${match[1]}`;
        const index = parseInt(match[2]);
        if (midiMappings.buttons[row] && midiMappings.buttons[row][index]) {
          return `Note ${midiMappings.buttons[row][index]}`;
        }
      }
    }
    return '';
  }

  createControlItem(control, type) {
    const item = document.createElement('div');
    item.className = 'control-item';
    
    const value = Math.round(control.value * 100);
    const isOn = control.value > 0.5;
    const midiNumber = this.getMidiNumber(control.name, type);
    
    // Add button-specific classes
    if (type === 'button') {
      item.className += ' control-item-button';
      item.className += isOn ? ' button-on' : ' button-off';
      
      // Add click handler for buttons
      item.addEventListener('click', (e) => {
        // Don't trigger if clicking on MIDI chip
        if (e.target.classList.contains('midi-chip') || e.target.classList.contains('editable')) {
          return;
        }
        
        const newValue = control.value > 0.5 ? 0 : 1;
        // Dispatch event to update the parameter
        window.dispatchEvent(new CustomEvent('controlPanelUpdate', {
          detail: { controlName: control.name, value: newValue }
        }));
      });
    }
    
    // Check if this control has LFO capability (knobs and faders)
    const hasLFO = type === 'knob' || type === 'fader';
    const lfoActive = control.lfoActive || false;
    
    item.innerHTML = `
      <div class="control-info">
        <div class="control-header">
          <span class="control-label">${control.label}</span>
          ${hasLFO ? `<button class="lfo-toggle ${lfoActive ? 'active' : ''}" data-control="${control.name}">
            <span class="lfo-icon-off">⏻</span>
            <span class="lfo-icon-on">⏻</span>
          </button>` : ''}
        </div>
        <div class="control-name-group">
          ${midiNumber ? `<span class="midi-chip editable" data-control="${control.name}" data-type="${type}" title="Click to edit MIDI number">${midiNumber}</span>` : ''}
        </div>
      </div>
      <div class="control-value-wrapper">
        <div class="control-value">
          <div class="value-bar" style="width: ${value}%"></div>
        </div>
      </div>
    `;
    
    // Add LFO toggle event listener if applicable
    if (hasLFO) {
      const lfoButton = item.querySelector('.lfo-toggle');
      
      // Left click - toggle on/off
      lfoButton.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Get current LFO state dynamically
        const currentLfoState = this.getLFOState(control.name);
        const newLfoState = !currentLfoState;
        
        lfoButton.classList.toggle('active', newLfoState);
        
        // Update visual state immediately
        const valueBar = item.querySelector('.value-bar');
        if (valueBar) {
          if (newLfoState) {
            valueBar.classList.add('lfo-modulated');
          } else {
            valueBar.classList.remove('lfo-modulated');
          }
        }
        
        // Dispatch LFO toggle event
        window.dispatchEvent(new CustomEvent('lfoToggle', {
          detail: { controlName: control.name, active: newLfoState }
        }));
      });
      
      // Right click - show configuration dropdown
      lfoButton.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showLFOConfigDropdown(control.name, lfoButton);
      });

      // Add tooltip functionality
      lfoButton.addEventListener('mouseenter', (e) => {
        this.showLFOTooltip(e.target, 'Toggle LFO (Right-click to configure)');
      });

      lfoButton.addEventListener('mouseleave', () => {
        this.hideLFOTooltip();
      });
    }

    // Add MIDI chip editing functionality
    const midiChip = item.querySelector('.midi-chip.editable');
    if (midiChip) {
      midiChip.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editMidiNumber(midiChip, control.name, type);
      });
    }
    
    return item;
  }

  updateControlValue(controlName, value) {
    if (!this.controls) return;
    
    // Find and update the control
    const allControls = [
      ...this.controls.knobs,
      ...this.controls.buttons,
      ...this.controls.faders
    ];
    
    const control = allControls.find(c => c.name === controlName);
    if (control) {
      control.value = value;
      
      // Update the visual representation in the DOM
      this.updateControlVisual(controlName, value);
    }
  }

  updateControlVisual(controlName, value) {
    if (!this.container) return;
    
    // Find the control item in the DOM by looking for elements with data-control attribute
    const controlItems = this.container.querySelectorAll('.control-item');
    
    for (const item of controlItems) {
      // Look for any element with data-control attribute matching the controlName
      const controlElement = item.querySelector(`[data-control="${controlName}"]`);
      if (controlElement) {
        // Update the value bar
        const valueBar = item.querySelector('.value-bar');
        if (valueBar) {
          const percentage = Math.round(value * 100);
          valueBar.style.width = `${percentage}%`;
          
          // Check current LFO state and update visual effect accordingly
          const lfoButton = item.querySelector('.lfo-toggle');
          const isLfoActive = lfoButton && lfoButton.classList.contains('active');
          
          if (isLfoActive) {
            valueBar.classList.add('lfo-modulated');
          } else {
            valueBar.classList.remove('lfo-modulated');
          }
        }
        
        // Update button state if it's a button
        const isButton = item.classList.contains('control-item-button');
        if (isButton) {
          const isOn = value > 0.5;
          item.classList.toggle('button-on', isOn);
          item.classList.toggle('button-off', !isOn);
        }
        
        break;
      }
    }
  }

  toggle() {
    this.isVisible = !this.isVisible;
    this.container.classList.toggle('hidden', !this.isVisible);
    const toggleBtn = this.container.querySelector('.toggle-btn');
    toggleBtn.textContent = this.isVisible ? '◀' : '▶';
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .control-panel {
        position: fixed;
        top: 52px;
        right: 0;
        bottom: 0;
        width: 800px;
        background: transparent;
        color: #1d1d1f;
        font-size: 13px;
        transition: opacity 0.3s ease, filter 0.3s ease;
        z-index: 999;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        opacity: 1;
        filter: blur(0px);
      }

      body.dark-theme .control-panel {
        color: #f5f5f7;
      }

      .control-panel.hidden-ui .toggle-btn {
        opacity: 1;
        filter: blur(0px);
        pointer-events: all;
      }

      .toggle-btn {
        position: absolute;
        top: 20px;
        left: -40px;
        width: 32px;
        height: 32px;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 0.5px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px 0 0 8px;
        color: #007aff;
        cursor: pointer;
        font-size: 16px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.08);
      }

      body.dark-theme .toggle-btn {
        background: rgba(29, 29, 31, 0.9);
        border-color: rgba(255, 255, 255, 0.1);
        box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.3);
      }

      .toggle-btn:hover {
        background: rgba(255, 255, 255, 1);
        transform: translateX(-2px);
      }

      body.dark-theme .toggle-btn:hover {
        background: rgba(29, 29, 31, 1);
      }

      .control-panel-content {
        padding: 32px;
        overflow-y: auto;
        flex: 1;
      }

      .control-section {
        margin-bottom: 32px;
      }

      .control-section:last-child {
        margin-bottom: 0;
      }

      .control-section h4 {
        margin: 0 0 16px 0;
        font-size: 11px;
        font-weight: 600;
        color: #86868b;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .knobs-list {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
      }

      .buttons-list,
      .faders-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }

      .control-item {
        margin-bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 0.5px solid rgba(0, 0, 0, 0.1);
        border-radius: 10px;
        padding: 16px 20px;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        min-height: 80px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      body.dark-theme .control-item {
        background: rgba(29, 29, 31, 0.9);
        border-color: rgba(255, 255, 255, 0.1);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .control-item:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      body.dark-theme .control-item:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .control-info {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 12px;
      }

      .control-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }

      .control-name-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .control-name {
        font-family: 'SF Mono', Monaco, 'Courier New', monospace;
        color: #007aff;
        font-size: 12px;
        font-weight: 500;
      }

      .midi-chip {
        display: inline-block;
        padding: 2px 6px;
        background: rgba(0, 122, 255, 0.1);
        color: #007aff;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        font-family: 'SF Mono', Monaco, 'Courier New', monospace;
      }

      .midi-chip.editable {
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
      }

      .midi-chip.editable:hover {
        background: rgba(0, 122, 255, 0.2);
        border-color: #007aff;
        transform: scale(1.05);
      }

      body.dark-theme .midi-chip {
        background: rgba(0, 122, 255, 0.2);
      }

      body.dark-theme .midi-chip.editable:hover {
        background: rgba(0, 122, 255, 0.3);
      }

      .control-label {
        color: #1d1d1f;
        font-weight: 600;
        font-size: 14px;
        line-height: 1.2;
        flex: 1;
      }

      body.dark-theme .control-label {
        color: #f5f5f7;
      }

      .control-value-wrapper {
        position: relative;
      }

      .control-value {
        position: relative;
        height: 8px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 4px;
        overflow: hidden;
      }

      body.dark-theme .control-value {
        background: rgba(255, 255, 255, 0.1);
      }

      .value-bar {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: #007aff;
        transition: width 0.2s ease;
        border-radius: 4px;
      }

      .button-state {
        position: absolute;
        top: -20px;
        right: 0;
        font-size: 11px;
        font-weight: 600;
        color: #86868b;
      }

      /* Button-specific styles */
      .control-item-button {
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .control-item-button.button-on {
        border: 1.5px solid #ffb84d !important;
        box-shadow: 0 0 12px rgba(255, 180, 60, 0.3), 0 2px 8px rgba(255, 180, 60, 0.15) !important;
        transform: scale(1.05) !important;
      }

      body.dark-theme .control-item-button.button-on {
        border: 1.5px solid #ffb84d !important;
        box-shadow: 0 0 12px rgba(255, 180, 60, 0.3), 0 2px 8px rgba(255, 180, 60, 0.15) !important;
      }

      .control-item-button.button-on:hover {
        border-color: #ffb84d !important;
        box-shadow: 0 0 16px rgba(255, 180, 60, 0.4), 0 2px 12px rgba(255, 180, 60, 0.25) !important;
        transform: scale(1.05) !important;
      }

      body.dark-theme .control-item-button.button-on:hover {
        border-color: #ffb84d !important;
        box-shadow: 0 0 16px rgba(255, 180, 60, 0.4), 0 2px 12px rgba(255, 180, 60, 0.25) !important;
      }



      /* Hide value bar for buttons */
      .control-item-button .control-value {
        display: none;
      }

      .control-panel-content::-webkit-scrollbar {
        width: 6px;
      }

      .control-panel-content::-webkit-scrollbar-track {
        background: transparent;
      }

      .control-panel-content::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
      }

      .control-panel-content::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.3);
      }

      body.dark-theme .control-panel-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
      }
      
      body.dark-theme .control-panel-content::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .lfo-toggle {
        background: rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 6px;
        padding: 4px;
        font-size: 12px;
        font-weight: 600;
        color: #666;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }

      body.dark-theme .lfo-toggle {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
        color: #999;
      }

      .lfo-toggle:hover {
        background: rgba(0, 0, 0, 0.15);
        border-color: rgba(0, 0, 0, 0.3);
      }

      body.dark-theme .lfo-toggle:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
      }

      .lfo-toggle.active {
        background: linear-gradient(135deg, #ff9500, #ffb347);
        border: 1.5px solid #ff9500;
        color: white;
        box-shadow: 0 0 12px rgba(255, 149, 0, 0.4), 0 2px 8px rgba(255, 149, 0, 0.2);
        transform: scale(1.05);
      }

      .lfo-toggle.active:hover {
        background: linear-gradient(135deg, #e6850e, #ff9500);
        border-color: #e6850e;
        box-shadow: 0 0 16px rgba(255, 149, 0, 0.5), 0 2px 12px rgba(255, 149, 0, 0.3);
      }

      .lfo-icon-off,
      .lfo-icon-on {
        position: absolute;
        transition: all 0.2s ease;
        font-size: 12px;
        line-height: 1;
      }

      .lfo-toggle.active .lfo-icon-on {
        font-size: 13px;
        text-shadow: 0 0 2px rgba(255, 255, 255, 0.3);
        filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.2));
      }

      .lfo-toggle .lfo-icon-off {
        opacity: 1;
      }

      .lfo-toggle .lfo-icon-on {
        opacity: 0;
      }

      .lfo-toggle.active .lfo-icon-off {
        opacity: 0;
      }

      .lfo-toggle.active .lfo-icon-on {
        opacity: 1;
      }

      .value-bar.lfo-modulated {
        background: linear-gradient(90deg, #ff9500, #007aff);
        animation: lfo-pulse 2s ease-in-out infinite;
      }

      @keyframes lfo-pulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
      }

      .lfo-config-dropdown {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 0.5px solid rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        min-width: 250px;
        font-size: 12px;
        overflow: hidden;
      }

      body.dark-theme .lfo-config-dropdown {
        background: rgba(29, 29, 31, 0.95);
        border-color: rgba(255, 255, 255, 0.1);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      }

      .lfo-config-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: rgba(0, 0, 0, 0.05);
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        font-weight: 600;
        color: #1d1d1f;
      }

      body.dark-theme .lfo-config-header {
        background: rgba(255, 255, 255, 0.05);
        border-bottom-color: rgba(255, 255, 255, 0.1);
        color: #f5f5f7;
      }

      .lfo-config-close {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .lfo-config-close:hover {
        background: rgba(0, 0, 0, 0.1);
        color: #333;
      }

      body.dark-theme .lfo-config-close {
        color: #999;
      }

      body.dark-theme .lfo-config-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ccc;
      }

      .lfo-config-content {
        padding: 16px;
      }

      .lfo-config-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .lfo-config-row:last-child {
        margin-bottom: 0;
      }

      .lfo-config-row label {
        min-width: 70px;
        font-weight: 500;
        color: #1d1d1f;
      }

      body.dark-theme .lfo-config-row label {
        color: #f5f5f7;
      }

      .lfo-config-row input[type="range"] {
        flex: 1;
        height: 4px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 2px;
        outline: none;
        -webkit-appearance: none;
      }

      body.dark-theme .lfo-config-row input[type="range"] {
        background: rgba(255, 255, 255, 0.1);
      }

      .lfo-config-row input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        background: #007aff;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .lfo-config-row input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: #007aff;
        border-radius: 50%;
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .lfo-config-row select {
        flex: 1;
        padding: 6px 8px;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.8);
        color: #1d1d1f;
        font-size: 12px;
        outline: none;
      }

      body.dark-theme .lfo-config-row select {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
        color: #f5f5f7;
      }

      .lfo-frequency-value,
      .lfo-amplitude-value,
      .lfo-offset-value {
        min-width: 45px;
        text-align: right;
        font-family: 'SF Mono', Monaco, 'Courier New', monospace;
        font-size: 11px;
        color: #666;
      }

      body.dark-theme .lfo-frequency-value,
      body.dark-theme .lfo-amplitude-value,
      body.dark-theme .lfo-offset-value {
        color: #999;
      }

      /* Custom tooltip styles */
      .lfo-tooltip-global {
        position: fixed;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 500;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
        z-index: 99999;
        transform: translateX(-50%);
      }

      body.dark-theme .lfo-tooltip-global {
        background: rgba(255, 255, 255, 0.9);
        color: #1d1d1f;
      }

      .lfo-tooltip-global::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: rgba(0, 0, 0, 0.9);
      }

      body.dark-theme .lfo-tooltip-global::after {
        border-top-color: rgba(255, 255, 255, 0.9);
      }

      .lfo-tooltip-global.show {
        opacity: 1;
      }

      /* MIDI Edit Dropdown Styles */
      .midi-edit-dropdown {
        background: rgba(255, 255, 255, 1);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 0.5px solid rgba(0, 0, 0, 0.1);
        border-radius: 10px;
        padding: 4px;
        min-width: 200px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        z-index: 1001;
        font-size: 12px;
        overflow: hidden;
      }

      body.dark-theme .midi-edit-dropdown {
        background: rgba(29, 29, 31, 1);
        border-color: rgba(255, 255, 255, 0.1);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
      }

      .midi-edit-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: rgba(0, 0, 0, 0.05);
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        font-weight: 600;
        color: #1d1d1f;
      }

      body.dark-theme .midi-edit-header {
        background: rgba(255, 255, 255, 0.05);
        border-bottom-color: rgba(255, 255, 255, 0.1);
        color: #f5f5f7;
      }

      .midi-edit-close {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .midi-edit-close:hover {
        background: rgba(0, 0, 0, 0.1);
        color: #333;
      }

      body.dark-theme .midi-edit-close {
        color: #999;
      }

      body.dark-theme .midi-edit-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ccc;
      }

      .midi-edit-content {
        padding: 16px;
      }

      .midi-edit-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .midi-edit-row label {
        min-width: 50px;
        font-weight: 500;
        color: #1d1d1f;
      }

      body.dark-theme .midi-edit-row label {
        color: #f5f5f7;
      }

      .midi-number-input {
        flex: 1;
        padding: 6px 8px;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.8);
        color: #1d1d1f;
        font-size: 12px;
        font-family: 'SF Mono', Monaco, 'Courier New', monospace;
        font-weight: 600;
        text-align: center;
        outline: none;
        width: 60px;
      }

      body.dark-theme .midi-number-input {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
        color: #f5f5f7;
      }

      .midi-number-input:focus {
        border-color: #007aff;
        box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
      }

      /* Button-specific styles */
      .control-item-button {
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .control-item-button.button-on {
        background: rgba(52, 199, 89, 0.9);
        border-color: rgba(52, 199, 89, 0.3);
      }

      body.dark-theme .control-item-button.button-on {
        background: rgba(52, 199, 89, 0.8);
        border-color: rgba(52, 199, 89, 0.5);
      }

      .control-item-button.button-on:hover {
        background: rgba(52, 199, 89, 1);
        box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);
      }

      body.dark-theme .control-item-button.button-on:hover {
        background: rgba(52, 199, 89, 0.9);
        box-shadow: 0 4px 12px rgba(52, 199, 89, 0.4);
      }

      .control-item-button.button-on .control-name,
      .control-item-button.button-on .control-label {
        color: white;
      }

      .control-item-button.button-on .midi-chip {
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }

      .control-item-button.button-on .control-value {
        background: rgba(255, 255, 255, 0.2);
      }

      .control-item-button.button-on .value-bar {
        background: white;
      }

      /* Hide value bar for buttons */
      .control-item-button .control-value {
        display: none;
      }

    `;
    document.head.appendChild(style);
  }

  showLFOTooltip(button, text) {
    // Create tooltip if it doesn't exist
    if (!this.globalTooltip) {
      this.globalTooltip = document.createElement('div');
      this.globalTooltip.className = 'lfo-tooltip-global';
      document.body.appendChild(this.globalTooltip);
    }

    // Set text and position
    this.globalTooltip.textContent = text;
    
    // Get button position
    const buttonRect = button.getBoundingClientRect();
    
    // Position tooltip above the button
    this.globalTooltip.style.left = `${buttonRect.left + buttonRect.width / 2}px`;
    this.globalTooltip.style.top = `${buttonRect.top - 35}px`;
    
    // Show tooltip
    this.globalTooltip.classList.add('show');
  }

  hideLFOTooltip() {
    if (this.globalTooltip) {
      this.globalTooltip.classList.remove('show');
    }
  }

  destroy() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    
    // Clean up global tooltip
    if (this.globalTooltip) {
      this.globalTooltip.remove();
      this.globalTooltip = null;
    }
  }

  getLFOState(controlName) {
    // This will be called from the main app to get LFO state
    // For now, return false - this will be updated when we integrate with LFOManager
    return window.app?.lfoManager?.getLFOState(controlName) || false;
  }

  showLFOConfigDropdown(controlName, lfoButton) {
    // Remove any existing dropdown
    this.closeLFOConfigDropdown();
    
    // Get current LFO configuration
    const lfoConfig = window.app?.lfoManager?.lfos?.get(controlName) || {
      frequency: 0.5,
      amplitude: 0.3,
      offset: 0.5,
      waveform: 'sine'
    };
    
    // Create dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'lfo-config-dropdown';
    dropdown.innerHTML = `
      <div class="lfo-config-header">
        <span>LFO Settings</span>
        <button class="lfo-config-close">×</button>
      </div>
      <div class="lfo-config-content">
        <div class="lfo-config-row">
          <label>Frequency</label>
          <input type="range" class="lfo-frequency" min="0.1" max="5" step="0.1" value="${lfoConfig.frequency}">
          <span class="lfo-frequency-value">${lfoConfig.frequency.toFixed(1)} Hz</span>
        </div>
        <div class="lfo-config-row">
          <label>Amplitude</label>
          <input type="range" class="lfo-amplitude" min="0" max="1" step="0.05" value="${lfoConfig.amplitude}">
          <span class="lfo-amplitude-value">${Math.round(lfoConfig.amplitude * 100)}%</span>
        </div>
        <div class="lfo-config-row">
          <label>Offset</label>
          <input type="range" class="lfo-offset" min="0" max="1" step="0.05" value="${lfoConfig.offset}">
          <span class="lfo-offset-value">${Math.round(lfoConfig.offset * 100)}%</span>
        </div>
        <div class="lfo-config-row">
          <label>Waveform</label>
          <select class="lfo-waveform">
            <option value="sine" ${lfoConfig.waveform === 'sine' ? 'selected' : ''}>Sine</option>
            <option value="triangle" ${lfoConfig.waveform === 'triangle' ? 'selected' : ''}>Triangle</option>
            <option value="square" ${lfoConfig.waveform === 'square' ? 'selected' : ''}>Square</option>
            <option value="sawtooth" ${lfoConfig.waveform === 'sawtooth' ? 'selected' : ''}>Sawtooth</option>
          </select>
        </div>
      </div>
    `;
    
    // Position dropdown relative to button
    const buttonRect = lfoButton.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${buttonRect.bottom + 5}px`;
    dropdown.style.zIndex = '10000';
    
    // Add to DOM first to get dimensions
    document.body.appendChild(dropdown);
    
    // Get dropdown dimensions
    const dropdownRect = dropdown.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    // Calculate optimal horizontal position
    let leftPosition = buttonRect.left;
    
    // Check if dropdown would overflow on the right
    if (leftPosition + dropdownRect.width > viewportWidth - 10) {
      // Position dropdown to the left of the button instead
      leftPosition = buttonRect.right - dropdownRect.width;
      
      // If it still overflows on the left, clamp to viewport
      if (leftPosition < 10) {
        leftPosition = 10;
      }
    }
    
    dropdown.style.left = `${leftPosition}px`;
    
    this.currentLFODropdown = dropdown;
    
    // Add event listeners
    this.setupLFOConfigListeners(dropdown, controlName);
    
    // Close dropdown when clicking outside
    setTimeout(() => {
      document.addEventListener('click', this.closeLFOConfigDropdown.bind(this));
    }, 0);
  }

  setupLFOConfigListeners(dropdown, controlName) {
    const frequencySlider = dropdown.querySelector('.lfo-frequency');
    const amplitudeSlider = dropdown.querySelector('.lfo-amplitude');
    const offsetSlider = dropdown.querySelector('.lfo-offset');
    const waveformSelect = dropdown.querySelector('.lfo-waveform');
    const closeButton = dropdown.querySelector('.lfo-config-close');
    
    const frequencyValue = dropdown.querySelector('.lfo-frequency-value');
    const amplitudeValue = dropdown.querySelector('.lfo-amplitude-value');
    const offsetValue = dropdown.querySelector('.lfo-offset-value');
    
    // Update frequency
    frequencySlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      frequencyValue.textContent = `${value.toFixed(1)} Hz`;
      this.updateLFOConfig(controlName, { frequency: value });
    });
    
    // Update amplitude
    amplitudeSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      amplitudeValue.textContent = `${Math.round(value * 100)}%`;
      this.updateLFOConfig(controlName, { amplitude: value });
    });
    
    // Update offset
    offsetSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      offsetValue.textContent = `${Math.round(value * 100)}%`;
      this.updateLFOConfig(controlName, { offset: value });
    });
    
    // Update waveform
    waveformSelect.addEventListener('change', (e) => {
      this.updateLFOConfig(controlName, { waveform: e.target.value });
    });
    
    // Close button
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeLFOConfigDropdown();
    });
    
    // Prevent dropdown from closing when clicking inside
    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  updateLFOConfig(controlName, config) {
    // Dispatch event to update LFO configuration
    window.dispatchEvent(new CustomEvent('lfoConfigUpdate', {
      detail: { controlName, config }
    }));
  }

  closeLFOConfigDropdown() {
    if (this.currentLFODropdown) {
      this.currentLFODropdown.remove();
      this.currentLFODropdown = null;
      document.removeEventListener('click', this.closeLFOConfigDropdown.bind(this));
    }
  }

  editMidiNumber(chipElement, controlName, type) {
    // Remove any existing dropdown
    this.closeMidiEditDropdown();
    
    // Extract number from CC/Note format
    const currentText = chipElement.textContent;
    const currentNumber = currentText.replace(/^(CC|Note)\s+/, '');
    const midiType = type === 'button' ? 'Note' : 'CC';
    
    // Create dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'midi-edit-dropdown';
    dropdown.innerHTML = `
      <div class="midi-edit-header">
        <span>MIDI Number</span>
        <button class="midi-edit-close">×</button>
      </div>
      <div class="midi-edit-content">
        <div class="midi-edit-row">
          <input type="number" class="midi-number-input" min="0" max="127" value="${currentNumber}">
        </div>
      </div>
    `;
    
    // Position dropdown relative to chip
    const chipRect = chipElement.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${chipRect.bottom + 5}px`;
    dropdown.style.zIndex = '10000';
    
    // Add to DOM first to get dimensions
    document.body.appendChild(dropdown);
    
    // Get dropdown dimensions
    const dropdownRect = dropdown.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    // Calculate optimal horizontal position
    let leftPosition = chipRect.left;
    
    // Check if dropdown would overflow on the right
    if (leftPosition + dropdownRect.width > viewportWidth - 10) {
      // Position dropdown to the left of the chip instead
      leftPosition = chipRect.right - dropdownRect.width;
      
      // If it still overflows on the left, clamp to viewport
      if (leftPosition < 10) {
        leftPosition = 10;
      }
    }
    
    dropdown.style.left = `${leftPosition}px`;
    
    this.currentMidiDropdown = dropdown;
    
    // Focus input and select text
    const input = dropdown.querySelector('.midi-number-input');
    setTimeout(() => {
      input.focus();
      input.select();
    }, 100);
    
    // Event handlers
    const saveValue = () => {
      const newValue = parseInt(input.value);
      if (newValue >= 0 && newValue <= 127) {
        this.updateMidiMapping(controlName, type, newValue);
        chipElement.textContent = `${midiType} ${newValue}`;
        this.closeMidiEditDropdown();
      } else {
        input.style.borderColor = '#ff3b30';
        input.focus();
      }
    };
    
    // Auto-save on input change
    input.addEventListener('input', () => {
      const newValue = parseInt(input.value);
      if (newValue >= 0 && newValue <= 127) {
        input.style.borderColor = '';
        this.updateMidiMapping(controlName, type, newValue);
        chipElement.textContent = `${midiType} ${newValue}`;
      } else {
        input.style.borderColor = '#ff3b30';
      }
    });
    
    // Close button
    dropdown.querySelector('.midi-edit-close').addEventListener('click', () => {
      this.closeMidiEditDropdown();
    });
    
    // Keyboard events
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveValue();
      } else if (e.key === 'Escape') {
        this.closeMidiEditDropdown();
      }
    });
    
    // Prevent dropdown from closing when clicking inside
    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Close dropdown when clicking outside
    setTimeout(() => {
      document.addEventListener('click', this.closeMidiEditDropdown.bind(this));
    }, 0);
  }

  closeMidiEditDropdown() {
    if (this.currentMidiDropdown) {
      this.currentMidiDropdown.remove();
      this.currentMidiDropdown = null;
      document.removeEventListener('click', this.closeMidiEditDropdown.bind(this));
    }
  }

  updateMidiMapping(controlName, type, midiNumber) {
    // Get current custom mappings or create new object
    const customMappings = JSON.parse(localStorage.getItem('customMidiMappings') || '{}');
    
    if (!customMappings[type]) {
      customMappings[type] = {};
    }
    
    customMappings[type][controlName] = midiNumber;
    
    // Save to localStorage
    localStorage.setItem('customMidiMappings', JSON.stringify(customMappings));
    
    // Notify the main app about the mapping change
    window.dispatchEvent(new CustomEvent('midiMappingUpdate', {
      detail: { controlName, type, midiNumber }
    }));
    
    console.log(`Updated MIDI mapping: ${controlName} (${type}) -> #${midiNumber}`);
  }

  getCustomMidiNumber(controlName, type) {
    const customMappings = JSON.parse(localStorage.getItem('customMidiMappings') || '{}');
    return customMappings[type] && customMappings[type][controlName];
  }
} 