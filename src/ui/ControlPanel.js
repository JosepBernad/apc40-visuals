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
    
    // Create header
    const header = document.createElement('div');
    header.className = 'control-panel-header';
    header.innerHTML = `
      <h3>Scene Controls</h3>
      <button class="toggle-btn" title="Toggle Panel">◀</button>
    `;
    
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
    
    this.container.appendChild(header);
    this.container.appendChild(content);
    document.body.appendChild(this.container);
    
    // Setup toggle functionality
    const toggleBtn = header.querySelector('.toggle-btn');
    toggleBtn.addEventListener('click', () => this.toggle());
    
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
        master: 56
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
    const displayValue = type === 'button' ? (control.value > 0.5 ? 'ON' : 'OFF') : '';
    const midiNumber = this.getMidiNumber(control.name, type);
    
    item.innerHTML = `
      <div class="control-info">
        <div class="control-name-group">
          <span class="control-name">${control.name}</span>
          ${midiNumber ? `<span class="midi-chip">${midiNumber}</span>` : ''}
        </div>
        <span class="control-label">${control.label}</span>
      </div>
      <div class="control-value-wrapper">
        ${type === 'button' ? `<span class="button-state">${displayValue}</span>` : ''}
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
        width: 380px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border-left: 0.5px solid rgba(0, 0, 0, 0.1);
        color: #1d1d1f;
        font-size: 13px;
        transition: transform 0.3s ease;
        z-index: 999;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      @media (prefers-color-scheme: dark) {
        .control-panel {
          background: rgba(29, 29, 31, 0.95);
          border-left-color: rgba(255, 255, 255, 0.1);
          color: #f5f5f7;
        }
      }

      .control-panel.hidden {
        transform: translateX(100%);
      }

      .control-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
        background: rgba(0, 0, 0, 0.02);
        flex-shrink: 0;
      }

      @media (prefers-color-scheme: dark) {
        .control-panel-header {
          border-bottom-color: rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
        }
      }

      .control-panel-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        letter-spacing: -0.01em;
      }

      .toggle-btn {
        background: none;
        border: none;
        color: #007aff;
        cursor: pointer;
        font-size: 18px;
        padding: 4px 8px;
        transition: opacity 0.2s;
        border-radius: 6px;
      }

      .toggle-btn:hover {
        background: rgba(0, 122, 255, 0.1);
      }

      .control-panel-content {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
      }

      .control-section {
        margin-bottom: 24px;
      }

      .control-section:last-child {
        margin-bottom: 0;
      }

      .control-section h4 {
        margin: 0 0 12px 0;
        font-size: 11px;
        font-weight: 600;
        color: #86868b;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .control-item {
        margin-bottom: 12px;
        background: rgba(0, 0, 0, 0.04);
        border-radius: 10px;
        padding: 12px 16px;
        transition: background 0.2s ease;
      }

      @media (prefers-color-scheme: dark) {
        .control-item {
          background: rgba(255, 255, 255, 0.06);
        }
      }

      .control-item:hover {
        background: rgba(0, 0, 0, 0.06);
      }

      @media (prefers-color-scheme: dark) {
        .control-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }
      }

      .control-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        align-items: center;
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

      @media (prefers-color-scheme: dark) {
        .midi-chip {
          background: rgba(0, 122, 255, 0.2);
        }
      }

      .control-label {
        color: #1d1d1f;
        font-weight: 500;
      }

      @media (prefers-color-scheme: dark) {
        .control-label {
          color: #f5f5f7;
        }
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

      @media (prefers-color-scheme: dark) {
        .control-value {
          background: rgba(255, 255, 255, 0.1);
        }
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

      @media (prefers-color-scheme: dark) {
        .control-panel-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .control-panel-content::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
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