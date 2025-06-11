import * as THREE from 'three';
import { Scene } from './Scene.js';

export class TunnelScene extends Scene {
  constructor() {
    super('Tunnel');
    this.tunnelSegments = [];
    this.particles = [];
    this.time = 0;
    this.tunnelSpeed = 0;
    this.cameraZ = 0;
    
    // Add scene-specific parameters
    this.parameters = {
      ...this.parameters,
      speed: 0.5,
      complexity: 0.5,
      radius: 0.5,
      segments: 0.5,
      glow: 0.5,
      wireframe: 0,
      turbulence: 0.3,
      particles: 0.7
    };
  }

  setup() {
    // Clean up existing objects
    this.cleanup();
    
    // Reset time and position
    this.time = 0;
    this.cameraZ = 0;
    
    // Set fog for depth
    this.scene.fog = new THREE.Fog(0x000000, 5, 50);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x202040, 0.3);
    this.scene.add(ambientLight);

    // Add moving lights inside tunnel
    this.createTunnelLights();
    
    // Create tunnel segments
    this.createTunnel();
    
    // Create particle system
    this.createParticles();
    
    // Position camera
    this.camera.position.set(0, 0, 0);
    this.camera.lookAt(0, 0, -10);
  }

  createTunnelLights() {
    // Create multiple colored lights that move through the tunnel
    const colors = [0xff0080, 0x0080ff, 0x80ff00, 0xff8000];
    
    colors.forEach((color, index) => {
      const light = new THREE.PointLight(color, 2, 20);
      light.position.set(
        Math.cos(index * Math.PI / 2) * 3,
        Math.sin(index * Math.PI / 2) * 3,
        -10 - index * 15
      );
      this.scene.add(light);
      this.tunnelSegments.push({ type: 'light', object: light, baseZ: light.position.z });
    });
  }

  createTunnel() {
    const segmentCount = 20;
    const segmentLength = 5;
    
    for (let i = 0; i < segmentCount; i++) {
      this.createTunnelSegment(i * segmentLength);
    }
  }

  createTunnelSegment(zPosition) {
    const sides = 6 + Math.floor(this.parameters.complexity * 6); // 6-12 sides
    const radius = 3 + this.parameters.radius * 2; // 3-5 radius
    
    // Create ring geometry
    const ringGeometry = new THREE.RingGeometry(radius * 0.8, radius, sides);
    
    // Create material with emissive properties
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x004444,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      wireframe: this.parameters.wireframe > 0.5
    });
    
    const ring = new THREE.Mesh(ringGeometry, material);
    ring.position.z = -zPosition;
    ring.rotation.z = Math.random() * Math.PI * 2;
    
    // Create glow effect
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const glowRing = new THREE.Mesh(ringGeometry.clone(), glowMaterial);
    glowRing.scale.multiplyScalar(1.2);
    ring.add(glowRing);
    
    this.scene.add(ring);
    this.tunnelSegments.push({
      type: 'ring',
      object: ring,
      glowRing: glowRing,
      baseZ: -zPosition,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      pulsePhase: Math.random() * Math.PI * 2
    });
    
    // Add connecting struts
    if (this.parameters.complexity > 0.3) {
      this.createTunnelStruts(ring, radius, sides);
    }
  }

  createTunnelStruts(parentRing, radius, sides) {
    const strutCount = Math.floor(sides / 2);
    
    for (let i = 0; i < strutCount; i++) {
      const angle = (i / strutCount) * Math.PI * 2;
      const strutGeometry = new THREE.CylinderGeometry(0.05, 0.05, radius * 0.4);
      const strutMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0080,
        emissive: 0x440020,
        emissiveIntensity: 0.3,
        metalness: 0.9,
        roughness: 0.1
      });
      
      const strut = new THREE.Mesh(strutGeometry, strutMaterial);
      strut.position.set(
        Math.cos(angle) * radius * 0.6,
        Math.sin(angle) * radius * 0.6,
        0
      );
      strut.rotation.z = angle + Math.PI / 2;
      
      parentRing.add(strut);
    }
  }

  createParticles() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random position in tunnel
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 4;
      
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = Math.sin(angle) * radius;
      positions[i3 + 2] = -Math.random() * 100;
      
      // Random colors
      const hue = Math.random();
      const color = this.hueToRgb(hue * 360);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      
      sizes[i] = Math.random() * 2 + 1;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float time;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - (dist * 2.0);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);
    this.particles.push(particles);
  }

  update(deltaTime) {
    this.time += deltaTime;
    
    // Update tunnel speed
    this.tunnelSpeed = 5 + this.parameters.speed * 15; // 5-20 units per second
    this.cameraZ -= this.tunnelSpeed * deltaTime;
    
    // Update tunnel segments
    this.tunnelSegments.forEach((segment, index) => {
      if (segment.type === 'ring') {
        const { object, glowRing, rotationSpeed, pulsePhase } = segment;
        
        // Rotation
        object.rotation.z += rotationSpeed * this.parameters.speed;
        
        // Pulsing scale
        const pulse = 1 + Math.sin(this.time * 3 + pulsePhase) * 0.1 * this.parameters.complexity;
        object.scale.set(pulse, pulse, 1);
        
        // Audio reactivity
        if (this.audioData && this.audioData.bass) {
          const audioScale = 1 + this.audioData.bass * 0.3;
          object.scale.multiplyScalar(audioScale);
          
          // Glow intensity
          if (glowRing) {
            glowRing.material.opacity = 0.1 + this.audioData.bass * 0.4 * this.parameters.glow;
          }
        }
        
        // Move segment forward when it goes behind camera
        if (object.position.z > this.cameraZ + 10) {
          object.position.z -= 100; // Move to back of tunnel
        }
        
        // Update material properties
        object.material.wireframe = this.parameters.wireframe > 0.5;
        
        // Turbulence effect
        if (this.parameters.turbulence > 0.1) {
          const turbulence = this.parameters.turbulence * 0.5;
          object.position.x = Math.sin(this.time * 2 + index) * turbulence;
          object.position.y = Math.cos(this.time * 1.5 + index) * turbulence;
        }
        
      } else if (segment.type === 'light') {
        const { object, baseZ } = segment;
        
        // Move light forward
        object.position.z = baseZ + this.cameraZ;
        
        // Reset light position when it goes too far
        if (object.position.z > this.cameraZ + 20) {
          object.position.z -= 100;
        }
        
        // Animate light intensity
        object.intensity = 1 + Math.sin(this.time * 4 + index) * 0.5;
        
        // Audio reactive intensity
        if (this.audioData && this.audioData.mid) {
          object.intensity *= (1 + this.audioData.mid);
        }
      }
    });
    
    // Update particles
    this.particles.forEach(particleSystem => {
      const positions = particleSystem.geometry.attributes.position.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        // Move particles forward
        positions[i + 2] += this.tunnelSpeed * deltaTime;
        
        // Reset particle when it goes behind camera
        if (positions[i + 2] > this.cameraZ + 5) {
          positions[i + 2] -= 100;
          
          // Randomize position
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 4;
          positions[i] = Math.cos(angle) * radius;
          positions[i + 1] = Math.sin(angle) * radius;
        }
        
        // Turbulence
        if (this.parameters.turbulence > 0.1) {
          const turbulence = this.parameters.turbulence * 0.1;
          positions[i] += (Math.random() - 0.5) * turbulence;
          positions[i + 1] += (Math.random() - 0.5) * turbulence;
        }
      }
      
      particleSystem.geometry.attributes.position.needsUpdate = true;
      particleSystem.material.uniforms.time.value = this.time;
      
      // Control particle visibility
      particleSystem.visible = this.parameters.particles > 0.5;
    });
    
    // Update camera position
    this.camera.position.z = this.cameraZ;
    
    // Camera shake based on audio
    if (this.audioData && this.audioData.high) {
      const shake = this.audioData.high * 0.1;
      this.camera.position.x = (Math.random() - 0.5) * shake;
      this.camera.position.y = (Math.random() - 0.5) * shake;
    }
  }

  onParameterChange(name, value) {
    if (name === 'hue') {
      const color = this.hueToRgb(value * 360);
      
      this.tunnelSegments.forEach(segment => {
        if (segment.type === 'ring') {
          segment.object.material.color.setRGB(color.r, color.g, color.b);
          segment.object.material.emissive.setRGB(color.r * 0.3, color.g * 0.3, color.b * 0.3);
          if (segment.glowRing) {
            segment.glowRing.material.color.setRGB(color.r, color.g, color.b);
          }
        }
      });
    } else if (name === 'complexity' || name === 'radius') {
      // Recreate tunnel with new parameters
      this.setup();
    }
  }

  getControls() {
    return {
      knobs: [
        { name: 'deviceKnob1', parameter: 'speed', value: this.parameters.speed, label: 'Speed' },
        { name: 'deviceKnob2', parameter: 'complexity', value: this.parameters.complexity, label: 'Complexity' },
        { name: 'deviceKnob3', parameter: 'radius', value: this.parameters.radius, label: 'Radius' },
        { name: 'deviceKnob4', parameter: 'hue', value: this.parameters.hue, label: 'Color' },
        { name: 'deviceKnob5', parameter: 'segments', value: this.parameters.segments, label: 'Segments' },
        { name: 'deviceKnob6', parameter: 'glow', value: this.parameters.glow, label: 'Glow' },
        { name: 'deviceKnob7', parameter: 'turbulence', value: this.parameters.turbulence, label: 'Turbulence' },
        { name: 'deviceKnob8', parameter: 'particles', value: this.parameters.particles, label: 'Particles' }
      ],
      buttons: [
        { name: 'row2[0]', parameter: 'wireframe', value: this.parameters.wireframe, label: 'Wireframe' }
      ],
      faders: [
        { name: 'track1', parameter: 'intensity', value: this.parameters.intensity, label: 'Master Intensity' },
        { name: 'track2', parameter: 'speed', value: this.parameters.speed, label: 'Speed' },
        { name: 'track3', parameter: 'complexity', value: this.parameters.complexity, label: 'Complexity' },
        { name: 'track4', parameter: 'radius', value: this.parameters.radius, label: 'Radius' },
        { name: 'track5', parameter: 'hue', value: this.parameters.hue, label: 'Color' },
        { name: 'track6', parameter: 'segments', value: this.parameters.segments, label: 'Segments' },
        { name: 'track7', parameter: 'glow', value: this.parameters.glow, label: 'Glow' },
        { name: 'track8', parameter: 'turbulence', value: this.parameters.turbulence, label: 'Turbulence' }
      ]
    };
  }

  cleanup() {
    // Clean up tunnel segments
    this.tunnelSegments.forEach(segment => {
      if (segment.object) {
        this.scene.remove(segment.object);
        if (segment.object.geometry) segment.object.geometry.dispose();
        if (segment.object.material) segment.object.material.dispose();
      }
    });
    this.tunnelSegments = [];
    
    // Clean up particles
    this.particles.forEach(particleSystem => {
      this.scene.remove(particleSystem);
      if (particleSystem.geometry) particleSystem.geometry.dispose();
      if (particleSystem.material) particleSystem.material.dispose();
    });
    this.particles = [];
  }

  destroy() {
    this.cleanup();
    super.destroy();
  }
} 