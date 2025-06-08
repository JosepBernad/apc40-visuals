import * as THREE from 'three';

export class Scene {
  constructor(name) {
    this.name = name;
    this.scene = new THREE.Scene();
    this.camera = null;
    this.renderer = null;
    this.container = null;
    this.animationId = null;
    this.parameters = {
      intensity: 1,
      hue: 0
    };
    this.audioData = null;
  }

  init(container) {
    this.container = container;
    
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);
    
    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;
    
    // Handle resize
    window.addEventListener('resize', () => this.handleResize());
    
    // Scene-specific initialization
    this.setup();
  }

  setup() {
    // Override in subclasses
  }

  update(deltaTime) {
    // Override in subclasses
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    const deltaTime = 0.016; // Assume 60fps for now
    this.update(deltaTime);
    this.render();
  }

  start() {
    if (!this.animationId) {
      this.animate();
    }
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  destroy() {
    this.stop();
    
    // Clean up Three.js resources
    this.scene.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    
    if (this.renderer) {
      this.renderer.dispose();
      if (this.container && this.renderer.domElement) {
        this.container.removeChild(this.renderer.domElement);
      }
    }
    
    window.removeEventListener('resize', () => this.handleResize());
  }

  handleResize() {
    if (!this.container) return;
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }

  setParameter(name, value) {
    if (this.parameters.hasOwnProperty(name)) {
      this.parameters[name] = value;
      this.onParameterChange(name, value);
    }
  }

  onParameterChange(name, value) {
    // Override in subclasses to handle parameter changes
  }

  setAudioData(audioData) {
    this.audioData = audioData;
  }

  setIntensity(value) {
    this.parameters.intensity = value;
    this.renderer.domElement.style.opacity = value;
  }

  // Get available controls for this scene
  getControls() {
    // Override in subclasses
    return {
      knobs: [],
      buttons: [],
      faders: []
    };
  }

  // Utility method to convert hue to RGB
  hueToRgb(h) {
    const s = 1;
    const l = 0.5;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }

    return {
      r: r + m,
      g: g + m,
      b: b + m
    };
  }
} 