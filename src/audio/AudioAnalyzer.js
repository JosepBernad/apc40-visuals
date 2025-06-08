export class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.dataArray = null;
    this.isActive = false;
    this.smoothingFactor = 0.8;
  }

  async init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256; // 128 frequency bins
      this.analyser.smoothingTimeConstant = this.smoothingFactor;
      
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      
      return true;
    } catch (error) {
      console.error('Audio initialization failed:', error);
      return false;
    }
  }

  async start() {
    if (this.isActive) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false 
        } 
      });
      
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);
      this.isActive = true;
      
      return true;
    } catch (error) {
      console.error('Failed to access microphone:', error);
      return false;
    }
  }

  stop() {
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    this.isActive = false;
  }

  getFrequencyData() {
    if (!this.isActive) return null;
    
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  getAverageFrequency() {
    const data = this.getFrequencyData();
    if (!data) return 0;
    
    const sum = data.reduce((acc, val) => acc + val, 0);
    return sum / data.length / 255; // Normalize to 0-1
  }

  getBassEnergy() {
    const data = this.getFrequencyData();
    if (!data) return 0;
    
    // Bass frequencies are in the first ~10% of the spectrum
    const bassEnd = Math.floor(data.length * 0.1);
    let sum = 0;
    
    for (let i = 0; i < bassEnd; i++) {
      sum += data[i];
    }
    
    return sum / bassEnd / 255; // Normalize to 0-1
  }

  getMidEnergy() {
    const data = this.getFrequencyData();
    if (!data) return 0;
    
    // Mid frequencies are from ~10% to ~40%
    const midStart = Math.floor(data.length * 0.1);
    const midEnd = Math.floor(data.length * 0.4);
    let sum = 0;
    
    for (let i = midStart; i < midEnd; i++) {
      sum += data[i];
    }
    
    return sum / (midEnd - midStart) / 255; // Normalize to 0-1
  }

  getHighEnergy() {
    const data = this.getFrequencyData();
    if (!data) return 0;
    
    // High frequencies are from ~40% to end
    const highStart = Math.floor(data.length * 0.4);
    let sum = 0;
    
    for (let i = highStart; i < data.length; i++) {
      sum += data[i];
    }
    
    return sum / (data.length - highStart) / 255; // Normalize to 0-1
  }

  getSpectralCentroid() {
    const data = this.getFrequencyData();
    if (!data) return 0;
    
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < data.length; i++) {
      weightedSum += i * data[i];
      magnitudeSum += data[i];
    }
    
    return magnitudeSum > 0 ? (weightedSum / magnitudeSum) / data.length : 0;
  }

  setSmoothingFactor(factor) {
    this.smoothingFactor = Math.max(0, Math.min(1, factor));
    if (this.analyser) {
      this.analyser.smoothingTimeConstant = this.smoothingFactor;
    }
  }

  isRunning() {
    return this.isActive;
  }
} 