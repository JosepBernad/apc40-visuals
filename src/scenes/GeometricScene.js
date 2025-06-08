import * as THREE from 'three';
import { Scene } from './Scene.js';

export class GeometricScene extends Scene {
  constructor() {
    super('Geometric');
    this.shapes = [];
    this.gridLines = [];
    this.time = 0;
    this.glowMeshes = [];
    
    // Add scene-specific parameters
    this.parameters = {
      ...this.parameters,
      speed: 0.5,
      complexity: 0.5,
      scale: 0.5,
      rotation: 0.5,
      glow: 0.5,
      wireframe: 0,
      metalness: 0.8,
      roughness: 0.2
    };
  }

  setup() {
    // Set fog for depth
    this.scene.fog = new THREE.Fog(0x000000, 10, 50);
    
    // Add ambient light with color
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    // Add multiple directional lights for better shading
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.camera.near = 0.1;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    this.scene.add(mainLight);

    // Add rim lighting
    const rimLight1 = new THREE.DirectionalLight(0x00ffff, 0.5);
    rimLight1.position.set(-5, 0, -5);
    this.scene.add(rimLight1);

    const rimLight2 = new THREE.DirectionalLight(0xff00ff, 0.5);
    rimLight2.position.set(5, 0, -5);
    this.scene.add(rimLight2);

    // Enable shadows on renderer
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create grid
    this.createGrid();

    // Create geometric shapes
    this.createShapes();

    // Add bloom effect simulation with emissive materials
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.5;
  }

  createGrid() {
    // Create a more sophisticated grid with gradient opacity
    const gridSize = 30;
    const divisions = 30;
    const gridGeometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];

    for (let i = -gridSize / 2; i <= gridSize / 2; i += gridSize / divisions) {
      const alpha = 1 - Math.abs(i) / (gridSize / 2);
      
      // Horizontal lines
      vertices.push(-gridSize / 2, 0, i);
      vertices.push(gridSize / 2, 0, i);
      colors.push(0.2, 0.2, 0.3, alpha, 0.2, 0.2, 0.3, alpha);
      
      // Vertical lines
      vertices.push(i, 0, -gridSize / 2);
      vertices.push(i, 0, gridSize / 2);
      colors.push(0.2, 0.2, 0.3, alpha, 0.2, 0.2, 0.3, alpha);
    }

    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    gridGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
    
    const gridMaterial = new THREE.LineBasicMaterial({ 
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    const grid = new THREE.LineSegments(gridGeometry, gridMaterial);
    grid.position.y = -3;
    this.scene.add(grid);
    this.gridLines.push(grid);

    // Add a reflective floor
    const floorGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x050505,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.8
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.01;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  createShapes() {
    const geometries = [
      new THREE.BoxGeometry(1, 1, 1, 3, 3, 3),
      new THREE.OctahedronGeometry(0.7, 1),
      new THREE.TetrahedronGeometry(0.8, 2),
      new THREE.IcosahedronGeometry(0.6, 1),
      new THREE.DodecahedronGeometry(0.7, 0)
    ];

    const positions = [
      { x: -3, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      { x: 0, y: 0, z: -3 },
      { x: 0, y: 0, z: 3 },
      { x: 0, y: 2, z: 0 }
    ];

    geometries.forEach((geometry, index) => {
      // Main material - metallic with emissive
      const material = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        metalness: this.parameters.metalness,
        roughness: this.parameters.roughness,
        emissive: 0x00ff00,
        emissiveIntensity: 0.2,
        wireframe: false
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(positions[index].x, positions[index].y, positions[index].z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      // Create glow effect with larger geometry
      const glowGeometry = geometry.clone();
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.scale.multiplyScalar(1.2);
      mesh.add(glowMesh);
      this.glowMeshes.push(glowMesh);
      
      this.shapes.push({
        mesh: mesh,
        glowMesh: glowMesh,
        basePosition: { ...positions[index] },
        rotationSpeed: { 
          x: 0.01 * (1 + index * 0.2), 
          y: 0.02 * (1 + index * 0.1), 
          z: 0.005 * (1 + index * 0.15) 
        },
        phase: index * Math.PI / 3
      });
      
      this.scene.add(mesh);
    });

    // Add central complex shape - Torus Knot
    const complexGeometry = new THREE.TorusKnotGeometry(1.5, 0.4, 128, 16);
    const complexMaterial = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xff00ff,
      emissiveIntensity: 0.3,
      wireframe: false
    });
    
    const complexMesh = new THREE.Mesh(complexGeometry, complexMaterial);
    complexMesh.castShadow = true;
    complexMesh.receiveShadow = true;
    
    // Add glow to complex mesh
    const complexGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const complexGlowMesh = new THREE.Mesh(complexGeometry.clone(), complexGlowMaterial);
    complexGlowMesh.scale.multiplyScalar(1.1);
    complexMesh.add(complexGlowMesh);
    
    this.shapes.push({
      mesh: complexMesh,
      glowMesh: complexGlowMesh,
      basePosition: { x: 0, y: 0, z: 0 },
      rotationSpeed: { x: 0.005, y: 0.01, z: 0.005 },
      phase: 0
    });
    
    this.scene.add(complexMesh);
  }

  update(deltaTime) {
    this.time += deltaTime;

    // Update shapes with more sophisticated animation
    this.shapes.forEach((shape, index) => {
      const { mesh, glowMesh, basePosition, rotationSpeed, phase } = shape;
      
      // Rotation with variable speed
      const rotationMultiplier = this.parameters.speed * (1 + this.parameters.rotation);
      mesh.rotation.x += rotationSpeed.x * rotationMultiplier;
      mesh.rotation.y += rotationSpeed.y * rotationMultiplier;
      mesh.rotation.z += rotationSpeed.z * rotationMultiplier;
      
      // Scale based on complexity
      const scale = 0.5 + this.parameters.scale + (this.parameters.complexity * 0.5);
      const pulseScale = scale + Math.sin(this.time * 2 + phase) * 0.1 * this.parameters.complexity;
      mesh.scale.set(pulseScale, pulseScale, pulseScale);
      
      // Floating motion
      const floatSpeed = 1 + this.parameters.speed;
      const floatAmount = 0.5 + this.parameters.complexity * 0.5;
      
      // Audio reactive movement
      if (this.audioData && this.audioData.bass) {
        const audioOffset = this.audioData.bass * 2 * floatAmount;
        mesh.position.y = basePosition.y + 
          Math.sin(this.time * floatSpeed + phase) * floatAmount + 
          audioOffset;
        
        // Glow intensity based on audio
        if (glowMesh) {
          glowMesh.material.opacity = 0.1 + this.audioData.bass * 0.3 * this.parameters.glow;
        }
      } else {
        mesh.position.y = basePosition.y + Math.sin(this.time * floatSpeed + phase) * floatAmount;
      }
      
      // Update glow scale
      if (glowMesh) {
        const glowScale = 1.1 + this.parameters.glow * 0.3;
        glowMesh.scale.set(glowScale, glowScale, glowScale);
      }
      
      // Update material properties
      if (mesh.material.metalness !== undefined) {
        mesh.material.metalness = this.parameters.metalness;
        mesh.material.roughness = this.parameters.roughness;
        mesh.material.wireframe = this.parameters.wireframe > 0.5;
      }
    });

    // Camera movement - more dynamic
    const cameraRadius = 8 + (this.parameters.complexity * 4);
    const cameraSpeed = 0.1 * this.parameters.speed;
    const cameraHeight = 3 + Math.sin(this.time * 0.5) * 2 * this.parameters.complexity;
    
    this.camera.position.x = Math.sin(this.time * cameraSpeed) * cameraRadius;
    this.camera.position.z = Math.cos(this.time * cameraSpeed) * cameraRadius;
    this.camera.position.y = cameraHeight;
    this.camera.lookAt(0, 0, 0);

    // Update grid opacity based on complexity
    this.gridLines.forEach(grid => {
      grid.material.opacity = 0.3 + this.parameters.complexity * 0.4;
    });
  }

  onParameterChange(name, value) {
    if (name === 'hue') {
      const color = this.hueToRgb(value * 360);
      this.shapes.forEach((shape, index) => {
        // Vary the hue slightly for each shape
        const shapeHue = (value * 360 + index * 60) % 360;
        const shapeColor = this.hueToRgb(shapeHue);
        
        if (shape.mesh.material.color) {
          shape.mesh.material.color.setRGB(shapeColor.r, shapeColor.g, shapeColor.b);
        }
        if (shape.mesh.material.emissive) {
          shape.mesh.material.emissive.setRGB(shapeColor.r * 0.5, shapeColor.g * 0.5, shapeColor.b * 0.5);
        }
        if (shape.glowMesh) {
          shape.glowMesh.material.color.setRGB(shapeColor.r, shapeColor.g, shapeColor.b);
        }
      });
    }
  }

  // Override to return available controls for this scene
  getControls() {
    return {
      knobs: [
        { name: 'deviceKnob1', parameter: 'speed', value: this.parameters.speed, label: 'Speed' },
        { name: 'deviceKnob2', parameter: 'complexity', value: this.parameters.complexity, label: 'Complexity' },
        { name: 'deviceKnob3', parameter: 'scale', value: this.parameters.scale, label: 'Scale' },
        { name: 'deviceKnob4', parameter: 'hue', value: this.parameters.hue, label: 'Color' },
        { name: 'deviceKnob5', parameter: 'rotation', value: this.parameters.rotation, label: 'Rotation' },
        { name: 'deviceKnob6', parameter: 'glow', value: this.parameters.glow, label: 'Glow' },
        { name: 'deviceKnob7', parameter: 'metalness', value: this.parameters.metalness, label: 'Metalness' },
        { name: 'deviceKnob8', parameter: 'roughness', value: this.parameters.roughness, label: 'Roughness' }
      ],
      buttons: [
        { name: 'row2[0]', parameter: 'wireframe', value: this.parameters.wireframe, label: 'Wireframe Toggle' }
      ],
      faders: [
        { name: 'master', parameter: 'intensity', value: this.parameters.intensity, label: 'Master Intensity' }
      ]
    };
  }
} 