import * as THREE from 'three';
import { Scene } from './Scene.js';

export class ParticleScene extends Scene {
  constructor() {
    super('Particles');
    this.particleSystem = null;
    this.particleCount = 5000;
    this.time = 0;
    
    // Add scene-specific parameters
    this.parameters = {
      ...this.parameters,
      count: 0.5,
      speed: 0.5,
      spread: 0.5,
      size: 0.5,
      turbulence: 0.5,
      trail: 0
    };
  }

  setup() {
    // Clean up any existing particle system first
    if (this.particleSystem) {
      this.scene.remove(this.particleSystem);
      if (this.particleSystem.geometry) {
        this.particleSystem.geometry.dispose();
      }
      if (this.particleSystem.material) {
        this.particleSystem.material.dispose();
      }
      this.particleSystem = null;
    }
    
    // Reset time
    this.time = 0;
    
    // Create particle system
    this.createParticles();
    
    // Set camera position
    this.camera.position.z = 30;
  }

  createParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const velocities = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      
      // Initial positions
      positions[i3] = (Math.random() - 0.5) * 50;
      positions[i3 + 1] = (Math.random() - 0.5) * 50;
      positions[i3 + 2] = (Math.random() - 0.5) * 50;
      
      // Initial velocities
      velocities[i3] = (Math.random() - 0.5) * 0.1;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
      
      // Initial colors
      colors[i3] = 1;
      colors[i3 + 1] = 1;
      colors[i3 + 2] = 1;
      
      // Sizes
      sizes[i] = Math.random() * 2 + 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Create shader material for particles
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: window.devicePixelRatio }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 velocity;
        varying vec3 vColor;
        uniform float time;
        uniform float pixelRatio;
        
        void main() {
          vColor = color;
          vec3 pos = position;
          
          // Add some wave motion
          pos.x += sin(time + position.y * 0.1) * 0.5;
          pos.y += cos(time + position.x * 0.1) * 0.5;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.particleSystem);
  }

  update(deltaTime) {
    this.time += deltaTime;

    if (this.particleSystem) {
      // Update shader uniforms
      this.particleSystem.material.uniforms.time.value = this.time * this.parameters.speed;
      
      // Update particle positions
      const positions = this.particleSystem.geometry.attributes.position.array;
      const velocities = this.particleSystem.geometry.attributes.velocity.array;
      
      const activeCount = Math.floor(this.particleCount * this.parameters.count);
      const spreadFactor = this.parameters.spread * 50;
      
      for (let i = 0; i < this.particleCount; i++) {
        const i3 = i * 3;
        
        if (i < activeCount) {
          // Particle should be active
          
          // If particle was hidden (Y position at -1000), reset it
          if (positions[i3 + 1] < -500) {
            positions[i3] = (Math.random() - 0.5) * spreadFactor;
            positions[i3 + 1] = (Math.random() - 0.5) * spreadFactor;
            positions[i3 + 2] = (Math.random() - 0.5) * spreadFactor;
            
            velocities[i3] = (Math.random() - 0.5) * 0.1;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
          }
          
          // Update positions based on velocity
          positions[i3] += velocities[i3] * this.parameters.speed;
          positions[i3 + 1] += velocities[i3 + 1] * this.parameters.speed;
          positions[i3 + 2] += velocities[i3 + 2] * this.parameters.speed;
          
          // Wrap around
          if (Math.abs(positions[i3]) > spreadFactor) positions[i3] *= -1;
          if (Math.abs(positions[i3 + 1]) > spreadFactor) positions[i3 + 1] *= -1;
          if (Math.abs(positions[i3 + 2]) > spreadFactor) positions[i3 + 2] *= -1;
          
          // Audio reactivity
          if (this.audioData && this.audioData.bass) {
            const audioInfluence = this.audioData.bass * 2;
            velocities[i3 + 1] += (Math.random() - 0.5) * audioInfluence * 0.01;
          }
        } else {
          // Hide inactive particles
          positions[i3 + 1] = -1000;
        }
      }
      
      this.particleSystem.geometry.attributes.position.needsUpdate = true;
      this.particleSystem.geometry.attributes.velocity.needsUpdate = true;
      
      // Rotate particle system
      this.particleSystem.rotation.y += 0.001 * this.parameters.speed;
    }
  }

  onParameterChange(name, value) {
    if (name === 'hue' && this.particleSystem) {
      const colors = this.particleSystem.geometry.attributes.color.array;
      const color = this.hueToRgb(value * 360);
      
      for (let i = 0; i < this.particleCount; i++) {
        const i3 = i * 3;
        // Add some variation
        const variation = 0.2;
        colors[i3] = color.r + (Math.random() - 0.5) * variation;
        colors[i3 + 1] = color.g + (Math.random() - 0.5) * variation;
        colors[i3 + 2] = color.b + (Math.random() - 0.5) * variation;
      }
      
      this.particleSystem.geometry.attributes.color.needsUpdate = true;
    }
  }

  // Override to return available controls for this scene
  getControls() {
    return {
      knobs: [
        { name: 'deviceKnob1', parameter: 'count', value: this.parameters.count, label: 'Particle Count' },
        { name: 'deviceKnob2', parameter: 'speed', value: this.parameters.speed, label: 'Speed' },
        { name: 'deviceKnob3', parameter: 'spread', value: this.parameters.spread, label: 'Spread' },
        { name: 'deviceKnob4', parameter: 'hue', value: this.parameters.hue, label: 'Color' },
        { name: 'deviceKnob5', parameter: 'size', value: this.parameters.size, label: 'Particle Size' },
        { name: 'deviceKnob6', parameter: 'turbulence', value: this.parameters.turbulence, label: 'Turbulence' }
      ],
      buttons: [
        { name: 'row2[0]', parameter: 'trail', value: this.parameters.trail, label: 'Trail Effect' }
      ],
      faders: [
        { name: 'master', parameter: 'intensity', value: this.parameters.intensity, label: 'Master Intensity' }
      ]
    };
  }

  destroy() {
    // Clean up particle system
    if (this.particleSystem) {
      this.scene.remove(this.particleSystem);
      if (this.particleSystem.geometry) {
        this.particleSystem.geometry.dispose();
      }
      if (this.particleSystem.material) {
        this.particleSystem.material.dispose();
      }
      this.particleSystem = null;
    }
    
    // Call parent destroy
    super.destroy();
  }
} 