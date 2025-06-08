export class LFOManager {
  constructor() {
    this.lfos = new Map(); // Map of controlName -> LFO config
    this.time = 0;
  }

  // Add or update an LFO for a control
  setLFO(controlName, config = {}) {
    const defaultConfig = {
      active: true,
      frequency: 0.5, // Hz
      amplitude: 0.3, // 0-1, how much to modulate
      offset: 0.5, // Center point 0-1
      waveform: 'sine', // sine, triangle, square, sawtooth
      phase: 0 // Phase offset in radians
    };

    this.lfos.set(controlName, { ...defaultConfig, ...config });
  }

  // Remove an LFO
  removeLFO(controlName) {
    this.lfos.delete(controlName);
  }

  // Toggle LFO on/off
  toggleLFO(controlName, active) {
    const lfo = this.lfos.get(controlName);
    if (lfo) {
      lfo.active = active;
    } else if (active) {
      // Create new LFO if toggling on
      this.setLFO(controlName, { active: true });
    }
  }

  // Update LFO time and calculate values
  update(deltaTime) {
    this.time += deltaTime;
    
    const modulations = new Map();
    
    for (const [controlName, lfo] of this.lfos) {
      if (lfo.active) {
        const value = this.calculateLFOValue(lfo);
        modulations.set(controlName, value);
      }
    }
    
    return modulations;
  }

  calculateLFOValue(lfo) {
    const phase = this.time * lfo.frequency * 2 * Math.PI + lfo.phase;
    let wave = 0;

    switch (lfo.waveform) {
      case 'sine':
        wave = Math.sin(phase);
        break;
      case 'triangle':
        wave = (2 / Math.PI) * Math.asin(Math.sin(phase));
        break;
      case 'square':
        wave = Math.sign(Math.sin(phase));
        break;
      case 'sawtooth':
        wave = 2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5));
        break;
      default:
        wave = Math.sin(phase);
    }

    // Scale and offset the wave
    const scaledWave = wave * lfo.amplitude;
    const finalValue = Math.max(0, Math.min(1, lfo.offset + scaledWave));
    
    return finalValue;
  }

  // Get LFO state for a control
  getLFOState(controlName) {
    const lfo = this.lfos.get(controlName);
    return lfo ? lfo.active : false;
  }

  // Get all active LFOs
  getActiveLFOs() {
    const active = [];
    for (const [controlName, lfo] of this.lfos) {
      if (lfo.active) {
        active.push(controlName);
      }
    }
    return active;
  }

  // Reset all LFOs
  reset() {
    this.lfos.clear();
    this.time = 0;
  }
} 