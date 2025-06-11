import * as THREE from 'three';
import { Scene } from './Scene.js';

export class WaveScene extends Scene {
  constructor() {
    super('Waves');
    this.waveMesh = null;
    this.time = 0;
    this.gridSize = 100;
    this.gridSegments = 100;
    this.waveLayers = [];
    
    // Add scene-specific parameters
    this.parameters = {
      ...this.parameters,
      frequency: 0.5,
      amplitude: 0.5,
      speed: 0.5,
      waveCount: 0.5,
      distortion: 0.5,
      wireframe: 0
    };
  }

  setup() {
    // Clean up any existing wave layers first
    if (this.waveLayers.length > 0) {
      this.waveLayers.forEach(layer => {
        this.scene.remove(layer);
        if (layer.geometry) layer.geometry.dispose();
        if (layer.material) layer.material.dispose();
      });
      this.waveLayers = [];
    }
    
    this.waveMesh = null;
    
    // Reset time
    this.time = 0;
    
    // Create wave mesh
    this.createWave();
    
    // Position camera
    this.camera.position.set(0, 20, 30);
    this.camera.lookAt(0, 0, 0);
    
    // Add fog for depth
    this.scene.fog = new THREE.Fog(0x000000, 20, 100);
  }

  createWave() {
    // Create plane geometry
    const geometry = new THREE.PlaneGeometry(
      this.gridSize, 
      this.gridSize, 
      this.gridSegments, 
      this.gridSegments
    );
    
    // Create shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        frequency: { value: 0.1 },
        amplitude: { value: 5 },
        distortion: { value: 0 },
        color1: { value: new THREE.Color(0x0000ff) },
        color2: { value: new THREE.Color(0xff00ff) },
        audioInfluence: { value: 0 }
      },
      vertexShader: `
        uniform float time;
        uniform float frequency;
        uniform float amplitude;
        uniform float distortion;
        uniform float audioInfluence;
        varying vec2 vUv;
        varying float vElevation;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Add distortion to position
          float distX = pos.x + sin(pos.y * 0.1 + time * 0.5) * distortion * 10.0;
          float distY = pos.y + cos(pos.x * 0.1 + time * 0.3) * distortion * 10.0;
          
          // Create wave effect with distorted coordinates
          float wave1 = sin(distX * frequency + time) * amplitude;
          float wave2 = sin(distY * frequency * 0.8 + time * 1.2) * amplitude * 0.8;
          float wave3 = sin(length(vec2(distX, distY)) * frequency * 0.5 - time * 0.8) * amplitude * 0.5;
          
          // Combine waves
          float elevation = wave1 + wave2 + wave3;
          
          // Add audio influence
          elevation += audioInfluence * sin(pos.x * 0.1 + pos.y * 0.1) * 10.0;
          
          pos.z = elevation;
          vElevation = elevation;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        uniform float amplitude;
        varying vec2 vUv;
        varying float vElevation;
        
        void main() {
          // Create gradient based on elevation
          float mixFactor = (vElevation + amplitude * 3.0) / (amplitude * 6.0);
          mixFactor = clamp(mixFactor, 0.0, 1.0);
          
          vec3 color = mix(color1, color2, mixFactor);
          
          // Add some glow effect
          float glow = 1.0 - abs(vElevation) / (amplitude * 3.0);
          glow = pow(glow, 2.0);
          
          color += vec3(glow * 0.2);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      wireframe: true,
      side: THREE.DoubleSide
    });
    
    this.waveMesh = new THREE.Mesh(geometry, material);
    this.waveMesh.rotation.x = -Math.PI / 2;
    this.scene.add(this.waveMesh);
    
    // Create multiple wave layers
    this.waveLayers = [this.waveMesh];
    
    // Add up to 4 additional wave layers
    for (let i = 1; i < 5; i++) {
      const layerMaterial = material.clone();
      const hueOffset = i * 72; // 360/5 for evenly spaced hues
      const hue1 = (hueOffset) % 360;
      const hue2 = (hueOffset + 180) % 360;
      const color1 = this.hueToRgb(hue1);
      const color2 = this.hueToRgb(hue2);
      
      layerMaterial.uniforms.color1.value = new THREE.Color(color1.r, color1.g, color1.b);
      layerMaterial.uniforms.color2.value = new THREE.Color(color2.r, color2.g, color2.b);
      layerMaterial.transparent = true;
      layerMaterial.opacity = 0.3;
      
      const layerMesh = new THREE.Mesh(geometry.clone(), layerMaterial);
      layerMesh.rotation.x = -Math.PI / 2;
      layerMesh.position.y = i * 3;
      layerMesh.visible = false; // Start hidden
      
      this.scene.add(layerMesh);
      this.waveLayers.push(layerMesh);
    }
  }

  update(deltaTime) {
    this.time += deltaTime;
    
    // Update wave layer visibility based on waveCount parameter
    const activeLayerCount = Math.floor(this.parameters.waveCount * 4) + 1; // 1 to 5 layers
    this.waveLayers.forEach((layer, index) => {
      if (index < activeLayerCount) {
        layer.visible = true;
        // Update each layer
        layer.material.uniforms.time.value = this.time * this.parameters.speed * (1 + index * 0.2);
        layer.material.uniforms.frequency.value = this.parameters.frequency * 0.2 * (1 - index * 0.1);
        layer.material.uniforms.amplitude.value = this.parameters.amplitude * 20 * (1 - index * 0.2);
        layer.material.uniforms.distortion.value = this.parameters.distortion;
        
        // Update wireframe mode
        layer.material.wireframe = this.parameters.wireframe > 0.5;
        
        // Audio reactivity
        if (this.audioData) {
          const audioInfluence = (this.audioData.bass || 0) * 0.5 + (this.audioData.mid || 0) * 0.3;
          layer.material.uniforms.audioInfluence.value = audioInfluence * (1 - index * 0.2);
        }
      } else {
        layer.visible = false;
      }
    });
    
    // Rotate camera around the scene
    const cameraRadius = 40;
    this.camera.position.x = Math.sin(this.time * 0.1) * cameraRadius;
    this.camera.position.z = Math.cos(this.time * 0.1) * cameraRadius;
    this.camera.position.y = 20 + Math.sin(this.time * 0.2) * 10;
    this.camera.lookAt(0, 0, 0);
  }

  onParameterChange(name, value) {
    if (name === 'hue') {
      const hue1 = value * 360;
      const hue2 = (value * 360 + 180) % 360;
      
      const color1 = this.hueToRgb(hue1);
      const color2 = this.hueToRgb(hue2);
      
      if (this.waveMesh) {
        this.waveMesh.material.uniforms.color1.value.setRGB(color1.r, color1.g, color1.b);
        this.waveMesh.material.uniforms.color2.value.setRGB(color2.r, color2.g, color2.b);
      }
      
      if (this.waveLayers.length > 1) {
        for (let i = 1; i < this.waveLayers.length; i++) {
          const layer = this.waveLayers[i];
          layer.material.uniforms.color1.value.setRGB(color1.r, color1.g, color1.b);
          layer.material.uniforms.color2.value.setRGB(color2.r, color2.g, color2.b);
        }
      }
    }
    
    if (name === 'wireframe') {
      const isWireframe = value > 0.5;
      
      // Update all wave layers
      this.waveLayers.forEach(layer => {
        layer.material.wireframe = isWireframe;
      });
    }
  }

  // Override to return available controls for this scene
  getControls() {
    return {
      knobs: [
        { name: 'deviceKnob1', parameter: 'frequency', value: this.parameters.frequency, label: 'Frequency' },
        { name: 'deviceKnob2', parameter: 'amplitude', value: this.parameters.amplitude, label: 'Amplitude' },
        { name: 'deviceKnob3', parameter: 'speed', value: this.parameters.speed, label: 'Speed' },
        { name: 'deviceKnob4', parameter: 'hue', value: this.parameters.hue, label: 'Color' },
        { name: 'deviceKnob5', parameter: 'waveCount', value: this.parameters.waveCount, label: 'Wave Layers' },
        { name: 'deviceKnob6', parameter: 'distortion', value: this.parameters.distortion, label: 'Distortion' }
      ],
      buttons: [
        { name: 'row2[0]', parameter: 'wireframe', value: this.parameters.wireframe, label: 'Wireframe' }
      ],
      faders: [
        { name: 'track1', parameter: 'intensity', value: this.parameters.intensity, label: 'Master Intensity' },
        { name: 'track2', parameter: 'frequency', value: this.parameters.frequency, label: 'Frequency' },
        { name: 'track3', parameter: 'amplitude', value: this.parameters.amplitude, label: 'Amplitude' },
        { name: 'track4', parameter: 'speed', value: this.parameters.speed, label: 'Speed' },
        { name: 'track5', parameter: 'hue', value: this.parameters.hue, label: 'Color' },
        { name: 'track6', parameter: 'waveCount', value: this.parameters.waveCount, label: 'Wave Layers' },
        { name: 'track7', parameter: 'distortion', value: this.parameters.distortion, label: 'Distortion' },
        { name: 'track8', parameter: 'wireframe', value: this.parameters.wireframe, label: 'Wireframe' }
      ]
    };
  }

  destroy() {
    // Clean up wave layers
    if (this.waveLayers.length > 0) {
      this.waveLayers.forEach(layer => {
        this.scene.remove(layer);
        if (layer.geometry) layer.geometry.dispose();
        if (layer.material) layer.material.dispose();
      });
      this.waveLayers = [];
    }
    
    this.waveMesh = null;
    
    // Call parent destroy
    super.destroy();
  }
} 