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

  createControlItem(control, type) {
    const item = document.createElement('div');
    item.className = 'control-item';
    
    const value = Math.round(control.value * 100);
    const displayValue = type === 'button' ? (control.value > 0.5 ? 'ON' : 'OFF') : `${value}%`;
    
    item.innerHTML = `
      <div class="control-info">
        <span class="control-name">${control.name}</span>
        <span class="control-label">${control.label}</span>
      </div>
      <div class="control-value">
        <div class="value-bar" style="width: ${value}%"></div>
        <span class="value-text">${displayValue}</span>
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
        bottom: 20px;
        right: 20px;
        width: 320px;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: #fff;
        font-size: 12px;
        transition: transform 0.3s ease;
        z-index: 1000;
      }

      .control-panel.hidden {
        transform: translateX(calc(100% - 40px));
      }

      .control-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .control-panel-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
      }

      .toggle-btn {
        background: none;
        border: none;
        color: #fff;
        cursor: pointer;
        font-size: 16px;
        padding: 4px 8px;
        opacity: 0.7;
        transition: opacity 0.2s;
      }

      .toggle-btn:hover {
        opacity: 1;
      }

      .control-panel-content {
        padding: 16px;
        max-height: 400px;
        overflow-y: auto;
      }

      .control-section {
        margin-bottom: 20px;
      }

      .control-section:last-child {
        margin-bottom: 0;
      }

      .control-section h4 {
        margin: 0 0 12px 0;
        font-size: 12px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.6);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .control-item {
        margin-bottom: 12px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        padding: 10px 12px;
      }

      .control-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
      }

      .control-name {
        font-family: monospace;
        color: #4CAF50;
        font-size: 11px;
      }

      .control-label {
        color: rgba(255, 255, 255, 0.8);
      }

      .control-value {
        position: relative;
        height: 20px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: hidden;
      }

      .value-bar {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: linear-gradient(90deg, #4CAF50, #8BC34A);
        transition: width 0.2s ease;
      }

      .value-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 10px;
        font-weight: 500;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      }

      .control-panel-content::-webkit-scrollbar {
        width: 4px;
      }

      .control-panel-content::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
      }

      .control-panel-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
      }

      .control-panel-content::-webkit-scrollbar-thumb:hover {
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