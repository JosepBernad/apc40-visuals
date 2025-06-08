import * as THREE from 'three';
import { Scene } from './Scene.js';

export class WaveScene extends Scene {
  constructor() {
    super('Waves');
    this.waveMesh = null;
    this.time = 0;
    this.gridSize = 100;
    this.gridSegments = 100;
    
    // Add scene-specific parameters
    this.parameters = {
      ...this.parameters,
      frequency: 0.5,
      amplitude: 0.5,
      speed: 0.5
    };
  }

  setup() {
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
        color1: { value: new THREE.Color(0x0000ff) },
        color2: { value: new THREE.Color(0xff00ff) },
        audioInfluence: { value: 0 }
      },
      vertexShader: `
        uniform float time;
        uniform float frequency;
        uniform float amplitude;
        uniform float audioInfluence;
        varying vec2 vUv;
        varying float vElevation;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Create wave effect
          float wave1 = sin(pos.x * frequency + time) * amplitude;
          float wave2 = sin(pos.y * frequency * 0.8 + time * 1.2) * amplitude * 0.8;
          float wave3 = sin(length(pos.xy) * frequency * 0.5 - time * 0.8) * amplitude * 0.5;
          
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
    
    // Add secondary wave layer
    const secondaryMaterial = material.clone();
    secondaryMaterial.uniforms.color1.value = new THREE.Color(0x00ff00);
    secondaryMaterial.uniforms.color2.value = new THREE.Color(0xffff00);
    secondaryMaterial.transparent = true;
    secondaryMaterial.opacity = 0.3;
    
    const secondaryWave = new THREE.Mesh(geometry.clone(), secondaryMaterial);
    secondaryWave.rotation.x = -Math.PI / 2;
    secondaryWave.position.y = 5;
    this.scene.add(secondaryWave);
    
    this.secondaryWave = secondaryWave;
  }

  update(deltaTime) {
    this.time += deltaTime;
    
    if (this.waveMesh) {
      // Update main wave
      this.waveMesh.material.uniforms.time.value = this.time * this.parameters.speed;
      this.waveMesh.material.uniforms.frequency.value = this.parameters.frequency * 0.2;
      this.waveMesh.material.uniforms.amplitude.value = this.parameters.amplitude * 10;
      
      // Update secondary wave
      if (this.secondaryWave) {
        this.secondaryWave.material.uniforms.time.value = this.time * this.parameters.speed * 1.2;
        this.secondaryWave.material.uniforms.frequency.value = this.parameters.frequency * 0.15;
        this.secondaryWave.material.uniforms.amplitude.value = this.parameters.amplitude * 8;
      }
      
      // Audio reactivity
      if (this.audioData) {
        const audioInfluence = (this.audioData.bass || 0) * 0.5 + (this.audioData.mid || 0) * 0.3;
        this.waveMesh.material.uniforms.audioInfluence.value = audioInfluence;
        
        if (this.secondaryWave) {
          this.secondaryWave.material.uniforms.audioInfluence.value = audioInfluence * 0.8;
        }
      }
    }
    
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
      
      if (this.secondaryWave) {
        const hue3 = (value * 360 + 90) % 360;
        const hue4 = (value * 360 + 270) % 360;
        const color3 = this.hueToRgb(hue3);
        const color4 = this.hueToRgb(hue4);
        
        this.secondaryWave.material.uniforms.color1.value.setRGB(color3.r, color3.g, color3.b);
        this.secondaryWave.material.uniforms.color2.value.setRGB(color4.r, color4.g, color4.b);
      }
    }
  }
} 