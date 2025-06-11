import * as THREE from 'three';
import { Scene } from './Scene.js';

export class CrystalScene extends Scene {
  constructor() {
    super('Crystal');
    this.crystals = [];
    this.prisms = [];
    this.lightBeams = [];
    this.time = 0;
    this.growthPhase = 0;
    
    // Add scene-specific parameters
    this.parameters = {
      ...this.parameters,
      growth: 0.5,
      complexity: 0.5,
      refraction: 0.7,
      prismatic: 0.6,
      resonance: 0.4,
      wireframe: 0,
      transparency: 0.8,
      facets: 0.5
    };
  }

  setup() {
    // Clean up existing objects
    this.cleanup();
    
    // Reset time
    this.time = 0;
    this.growthPhase = 0;
    
    // Set fog for atmospheric effect
    this.scene.fog = new THREE.Fog(0x000011, 10, 100);
    
    // Add ambient light with cool tone
    const ambientLight = new THREE.AmbientLight(0x404080, 0.4);
    this.scene.add(ambientLight);

    // Add prismatic lighting setup
    this.createPrismaticLights();
    
    // Create crystal formations
    this.createCrystalFormations();
    
    // Create light beam effects
    this.createLightBeams();
    
    // Position camera
    this.camera.position.set(8, 6, 8);
    this.camera.lookAt(0, 0, 0);
  }

  createPrismaticLights() {
    // Create multiple colored lights for prismatic effects
    const lightColors = [
      { color: 0xff0040, position: { x: 5, y: 8, z: 5 } },
      { color: 0x00ff80, position: { x: -5, y: 6, z: -3 } },
      { color: 0x4080ff, position: { x: 3, y: 10, z: -5 } },
      { color: 0xff8000, position: { x: -3, y: 4, z: 6 } },
      { color: 0x8000ff, position: { x: 0, y: 12, z: 0 } }
    ];
    
    lightColors.forEach((lightData, index) => {
      const light = new THREE.PointLight(lightData.color, 2, 30);
      light.position.set(lightData.position.x, lightData.position.y, lightData.position.z);
      
      // Add light helper sphere
      const helperGeometry = new THREE.SphereGeometry(0.1);
      const helperMaterial = new THREE.MeshBasicMaterial({ 
        color: lightData.color,
        transparent: true,
        opacity: 0.8
      });
      const helper = new THREE.Mesh(helperGeometry, helperMaterial);
      light.add(helper);
      
      this.scene.add(light);
      this.prisms.push({ 
        type: 'light', 
        object: light, 
        helper: helper,
        basePosition: { ...lightData.position },
        orbitRadius: 2 + index * 0.5,
        orbitSpeed: 0.5 + index * 0.2
      });
    });
  }

  createCrystalFormations() {
    // Create main crystal cluster
    this.createCrystalCluster(0, 0, 0, 3, 'main');
    
    // Create satellite crystals
    const satellitePositions = [
      { x: 6, y: 0, z: 3 },
      { x: -4, y: 0, z: -5 },
      { x: 3, y: 0, z: -6 },
      { x: -6, y: 0, z: 2 }
    ];
    
    satellitePositions.forEach((pos, index) => {
      this.createCrystalCluster(pos.x, pos.y, pos.z, 1.5 + index * 0.3, 'satellite');
    });
  }

  createCrystalCluster(x, y, z, scale, type) {
    const crystalCount = type === 'main' ? 8 : 4;
    const baseSize = scale;
    
    for (let i = 0; i < crystalCount; i++) {
      const crystal = this.createSingleCrystal(baseSize * (0.5 + Math.random() * 0.5));
      
      // Position crystals in cluster
      const angle = (i / crystalCount) * Math.PI * 2;
      const radius = scale * (0.5 + Math.random() * 0.5);
      const height = Math.random() * scale * 0.5;
      
      crystal.position.set(
        x + Math.cos(angle) * radius,
        y + height,
        z + Math.sin(angle) * radius
      );
      
      // Random rotation
      crystal.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      this.scene.add(crystal);
      this.crystals.push({
        mesh: crystal,
        type: type,
        basePosition: { x: crystal.position.x, y: crystal.position.y, z: crystal.position.z },
        baseScale: crystal.scale.x,
        growthPhase: Math.random() * Math.PI * 2,
        resonancePhase: Math.random() * Math.PI * 2,
        rotationAxis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize()
      });
    }
  }

  createSingleCrystal(size) {
    // Create crystal geometry with multiple facets
    const facetCount = 6 + Math.floor(this.parameters.facets * 6); // 6-12 facets
    const height = size * (1.5 + Math.random() * 0.5);
    
    // Create custom crystal geometry
    const geometry = new THREE.ConeGeometry(size * 0.6, height, facetCount);
    
    // Create refractive material
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.05,
      transmission: this.parameters.transparency,
      transparent: true,
      opacity: 0.9,
      ior: 1.5, // Index of refraction for crystal
      thickness: size * 0.5,
      envMapIntensity: 1.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      wireframe: this.parameters.wireframe > 0.5
    });
    
    const crystal = new THREE.Mesh(geometry, material);
    
    // Add inner glow effect
    const glowGeometry = geometry.clone();
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x80c0ff,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.scale.multiplyScalar(0.95);
    crystal.add(glow);
    
    return crystal;
  }

  createLightBeams() {
    // Create volumetric light beam effects
    const beamCount = 5;
    
    for (let i = 0; i < beamCount; i++) {
      const beamGeometry = new THREE.ConeGeometry(0.1, 10, 8, 1, true);
      const beamMaterial = new THREE.MeshBasicMaterial({
        color: 0x80c0ff,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      
      const beam = new THREE.Mesh(beamGeometry, beamMaterial);
      beam.position.set(
        (Math.random() - 0.5) * 10,
        5 + Math.random() * 5,
        (Math.random() - 0.5) * 10
      );
      beam.rotation.x = Math.PI;
      
      this.scene.add(beam);
      this.lightBeams.push({
        mesh: beam,
        baseOpacity: 0.1,
        pulsePhase: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01
      });
    }
  }

  update(deltaTime) {
    this.time += deltaTime;
    this.growthPhase += deltaTime * this.parameters.growth;
    
    // Update crystals
    this.crystals.forEach((crystal, index) => {
      const { mesh, basePosition, baseScale, growthPhase, resonancePhase, rotationAxis } = crystal;
      
      // Growth animation
      const growth = 0.8 + Math.sin(this.growthPhase + growthPhase) * 0.2 * this.parameters.growth;
      mesh.scale.setScalar(baseScale * growth);
      
      // Resonance effect
      if (this.audioData && this.audioData.mid) {
        const resonance = 1 + this.audioData.mid * this.parameters.resonance;
        mesh.scale.multiplyScalar(resonance);
      }
      
      // Floating motion
      const floatAmount = 0.3 * this.parameters.complexity;
      mesh.position.y = basePosition.y + Math.sin(this.time + resonancePhase) * floatAmount;
      
      // Rotation
      const rotationSpeed = 0.5 * this.parameters.complexity;
      mesh.rotateOnAxis(rotationAxis, deltaTime * rotationSpeed);
      
      // Update material properties
      if (mesh.material.transmission !== undefined) {
        mesh.material.transmission = this.parameters.transparency;
        mesh.material.wireframe = this.parameters.wireframe > 0.5;
      }
      
      // Audio reactive color shifting
      if (this.audioData && this.audioData.high) {
        const colorShift = this.audioData.high * 0.5;
        mesh.material.color.setHSL(
          (this.parameters.hue + colorShift) % 1,
          0.8,
          0.9
        );
      }
    });
    
    // Update prismatic lights
    this.prisms.forEach((prism, index) => {
      if (prism.type === 'light') {
        const { object, basePosition, orbitRadius, orbitSpeed } = prism;
        
        // Orbital motion
        const angle = this.time * orbitSpeed + index * Math.PI / 3;
        object.position.x = basePosition.x + Math.cos(angle) * orbitRadius * this.parameters.prismatic;
        object.position.z = basePosition.z + Math.sin(angle) * orbitRadius * this.parameters.prismatic;
        object.position.y = basePosition.y + Math.sin(this.time * 2 + index) * 2;
        
        // Intensity modulation
        object.intensity = 1 + Math.sin(this.time * 3 + index) * 0.5;
        
        // Audio reactive intensity
        if (this.audioData && this.audioData.bass) {
          object.intensity *= (1 + this.audioData.bass * 2);
        }
      }
    });
    
    // Update light beams
    this.lightBeams.forEach((beam, index) => {
      const { mesh, baseOpacity, pulsePhase, rotationSpeed } = beam;
      
      // Pulsing opacity
      const pulse = Math.sin(this.time * 2 + pulsePhase);
      mesh.material.opacity = baseOpacity + pulse * 0.05 * this.parameters.refraction;
      
      // Rotation
      mesh.rotation.y += rotationSpeed;
      
      // Audio reactive scaling
      if (this.audioData && this.audioData.average) {
        const scale = 1 + this.audioData.average * 0.5;
        mesh.scale.set(scale, 1, scale);
      }
    });
    
    // Camera movement
    const cameraRadius = 12 + this.parameters.complexity * 5;
    const cameraSpeed = 0.1 + this.parameters.growth * 0.1;
    const cameraHeight = 6 + Math.sin(this.time * 0.3) * 3;
    
    this.camera.position.x = Math.sin(this.time * cameraSpeed) * cameraRadius;
    this.camera.position.z = Math.cos(this.time * cameraSpeed) * cameraRadius;
    this.camera.position.y = cameraHeight;
    this.camera.lookAt(0, 2, 0);
  }

  onParameterChange(name, value) {
    if (name === 'hue') {
      // Update crystal colors
      this.crystals.forEach(crystal => {
        const hue = value;
        crystal.mesh.material.color.setHSL(hue, 0.8, 0.9);
        
        // Update inner glow
        if (crystal.mesh.children.length > 0) {
          crystal.mesh.children[0].material.color.setHSL(hue, 1.0, 0.7);
        }
      });
      
      // Update light beam colors
      this.lightBeams.forEach(beam => {
        beam.mesh.material.color.setHSL(value, 0.8, 0.8);
      });
      
    } else if (name === 'complexity' || name === 'facets') {
      // Recreate crystals with new complexity
      this.setup();
    }
  }

  getControls() {
    return {
      knobs: [
        { name: 'deviceKnob1', parameter: 'growth', value: this.parameters.growth, label: 'Growth' },
        { name: 'deviceKnob2', parameter: 'complexity', value: this.parameters.complexity, label: 'Complexity' },
        { name: 'deviceKnob3', parameter: 'refraction', value: this.parameters.refraction, label: 'Refraction' },
        { name: 'deviceKnob4', parameter: 'hue', value: this.parameters.hue, label: 'Color' },
        { name: 'deviceKnob5', parameter: 'prismatic', value: this.parameters.prismatic, label: 'Prismatic' },
        { name: 'deviceKnob6', parameter: 'resonance', value: this.parameters.resonance, label: 'Resonance' },
        { name: 'deviceKnob7', parameter: 'transparency', value: this.parameters.transparency, label: 'Transparency' },
        { name: 'deviceKnob8', parameter: 'facets', value: this.parameters.facets, label: 'Facets' }
      ],
      buttons: [
        { name: 'row2[0]', parameter: 'wireframe', value: this.parameters.wireframe, label: 'Wireframe' }
      ],
      faders: [
        { name: 'track1', parameter: 'intensity', value: this.parameters.intensity, label: 'Master Intensity' },
        { name: 'track2', parameter: 'growth', value: this.parameters.growth, label: 'Growth' },
        { name: 'track3', parameter: 'complexity', value: this.parameters.complexity, label: 'Complexity' },
        { name: 'track4', parameter: 'refraction', value: this.parameters.refraction, label: 'Refraction' },
        { name: 'track5', parameter: 'hue', value: this.parameters.hue, label: 'Color' },
        { name: 'track6', parameter: 'prismatic', value: this.parameters.prismatic, label: 'Prismatic' },
        { name: 'track7', parameter: 'resonance', value: this.parameters.resonance, label: 'Resonance' },
        { name: 'track8', parameter: 'transparency', value: this.parameters.transparency, label: 'Transparency' }
      ]
    };
  }

  cleanup() {
    // Clean up crystals
    this.crystals.forEach(crystal => {
      if (crystal.mesh) {
        this.scene.remove(crystal.mesh);
        if (crystal.mesh.geometry) crystal.mesh.geometry.dispose();
        if (crystal.mesh.material) crystal.mesh.material.dispose();
        
        // Clean up children (glow effects)
        crystal.mesh.children.forEach(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      }
    });
    this.crystals = [];
    
    // Clean up prisms (lights)
    this.prisms.forEach(prism => {
      if (prism.object) {
        this.scene.remove(prism.object);
        if (prism.helper) {
          if (prism.helper.geometry) prism.helper.geometry.dispose();
          if (prism.helper.material) prism.helper.material.dispose();
        }
      }
    });
    this.prisms = [];
    
    // Clean up light beams
    this.lightBeams.forEach(beam => {
      if (beam.mesh) {
        this.scene.remove(beam.mesh);
        if (beam.mesh.geometry) beam.mesh.geometry.dispose();
        if (beam.mesh.material) beam.mesh.material.dispose();
      }
    });
    this.lightBeams = [];
  }

  destroy() {
    this.cleanup();
    super.destroy();
  }
} 