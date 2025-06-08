import midiMappings from '../config/midi-mappings.json';

export class MidiController {
  constructor() {
    this.midiAccess = null;
    this.input = null;
    this.listeners = new Map();
    this.values = new Map(); // Store current values
    this.connected = false;
  }

  async init() {
    try {
      if (!navigator.requestMIDIAccess) {
        throw new Error('Web MIDI API not supported');
      }

      this.midiAccess = await navigator.requestMIDIAccess();
      this.setupInputs();
      
      // Listen for device changes
      this.midiAccess.onstatechange = () => this.setupInputs();
      
      return true;
    } catch (error) {
      console.error('MIDI initialization failed:', error);
      return false;
    }
  }

  setupInputs() {
    // Clear existing input
    if (this.input) {
      this.input.onmidimessage = null;
    }

    // Find APC40
    for (const input of this.midiAccess.inputs.values()) {
      if (input.name.includes('APC40')) {
        this.input = input;
        this.input.onmidimessage = (e) => this.handleMidiMessage(e);
        this.connected = true;
        this.notifyListeners('connection', { connected: true });
        console.log('APC40 connected:', input.name);
        return;
      }
    }

    // No APC40 found
    this.connected = false;
    this.notifyListeners('connection', { connected: false });
  }

  handleMidiMessage(event) {
    const [status, data1, data2] = event.data;
    const channel = status & 0x0F;
    const command = status & 0xF0;

    // Note On
    if (command === 0x90 && data2 > 0) {
      this.handleNoteOn(channel, data1, data2);
    }
    // Note Off
    else if (command === 0x80 || (command === 0x90 && data2 === 0)) {
      this.handleNoteOff(channel, data1);
    }
    // Control Change
    else if (command === 0xB0) {
      this.handleControlChange(channel, data1, data2);
    }
  }

  handleNoteOn(channel, note, velocity) {
    // Check if this is a scene button
    const sceneButtons = midiMappings.controls.sceneButtons.notes;
    for (const [row, notes] of Object.entries(sceneButtons)) {
      const index = notes.indexOf(note);
      if (index !== -1) {
        this.notifyListeners('sceneButton', { 
          row: row, 
          index: index, 
          note: note,
          velocity: velocity 
        });
        return;
      }
    }

    // Generic note on
    this.notifyListeners('noteOn', { channel, note, velocity });
  }

  handleNoteOff(channel, note) {
    this.notifyListeners('noteOff', { channel, note });
  }

  handleControlChange(channel, control, value) {
    // Store the value
    this.values.set(`cc_${control}`, value / 127); // Normalize to 0-1

    // Check knobs
    const knobs = midiMappings.controls.knobs.controls;
    for (const [name, cc] of Object.entries(knobs)) {
      if (cc === control) {
        this.notifyListeners('knob', { 
          name: name, 
          value: value / 127, // Normalize to 0-1
          rawValue: value 
        });
        return;
      }
    }

    // Check faders
    const faders = midiMappings.controls.faders.controls;
    for (const [name, cc] of Object.entries(faders)) {
      if (cc === control) {
        this.notifyListeners('fader', { 
          name: name, 
          value: value / 127, // Normalize to 0-1
          rawValue: value 
        });
        return;
      }
    }

    // Check crossfader
    if (control === midiMappings.controls.crossfader.control) {
      this.notifyListeners('crossfader', { 
        value: value / 127, // Normalize to 0-1
        rawValue: value 
      });
      return;
    }

    // Generic CC
    this.notifyListeners('cc', { channel, control, value });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  getValue(controlName) {
    // Get current value of a control
    const knobs = midiMappings.controls.knobs.controls;
    const faders = midiMappings.controls.faders.controls;
    
    if (knobs[controlName]) {
      return this.values.get(`cc_${knobs[controlName]}`) || 0;
    }
    if (faders[controlName]) {
      return this.values.get(`cc_${faders[controlName]}`) || 0;
    }
    if (controlName === 'crossfader') {
      return this.values.get(`cc_${midiMappings.controls.crossfader.control}`) || 0;
    }
    
    return 0;
  }

  isConnected() {
    return this.connected;
  }
} 