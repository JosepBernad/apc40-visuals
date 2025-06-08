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
      const item = this.createControlItem(fader, 'fader');
      fadersList.appendChild(item);
    });
  }

  getMidiNumber(controlName, type) {
    // Import the MIDI mappings to get the actual MIDI numbers
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
      item.addEventListener('click', () => {
        const newValue = control.value > 0.5 ? 0 : 1;
        // Dispatch event to update the parameter
        window.dispatchEvent(new CustomEvent('controlPanelUpdate', {
          detail: { controlName: control.name, value: newValue }
        }));
      });
    }
    
    item.innerHTML = `
      <div class="control-info">
        <span class="control-label">${control.label}</span>
        <div class="control-name-group">
          <span class="control-name">${control.name}</span>
          ${midiNumber ? `<span class="midi-chip">${midiNumber}</span>` : ''}
        </div>
      </div>
      <div class="control-value-wrapper">
        <div class="control-value">
          <div class="value-bar" style="width: ${value}%"></div>
        </div>
      </div>
    `;
    
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
      this.updateControls(this.controls);
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
        width: 420px;
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

      .control-panel.hidden {
        opacity: 0;
        filter: blur(10px);
        pointer-events: none;
      }

      .control-panel.hidden .toggle-btn {
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
        padding: 20px;
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

      .knobs-list,
      .buttons-list,
      .faders-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .control-item {
        margin-bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 0.5px solid rgba(0, 0, 0, 0.1);
        border-radius: 10px;
        padding: 14px 16px;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
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
        gap: 4px;
        margin-bottom: 8px;
      }

      .control-name-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .control-name {
        font-family: 'SF Mono', Monaco, 'Courier New', monospace;
        color: #007aff;
        font-size: 11px;
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

      body.dark-theme .midi-chip {
        background: rgba(0, 122, 255, 0.2);
      }

      .control-label {
        color: #1d1d1f;
        font-weight: 600;
        font-size: 13px;
        line-height: 1.2;
      }

      body.dark-theme .control-label {
        color: #f5f5f7;
      }

      .control-value-wrapper {
        position: relative;
      }

      .control-value {
        position: relative;
        height: 6px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
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
        border-radius: 3px;
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
    `;
    document.head.appendChild(style);
  }

  destroy() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
} 