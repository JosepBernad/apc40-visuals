import * as THREE from 'three';
import { Scene } from './Scene.js';

export class GeometricScene extends Scene {
  constructor() {
    super('Geometric');
    this.shapes = [];
    this.gridLines = [];
    this.time = 0;
    
    // Add scene-specific parameters
    this.parameters = {
      ...this.parameters,
      speed: 0.5,
      complexity: 0.5,
      scale: 0.5
    };
  }

  setup() {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Create grid
    this.createGrid();

    // Create geometric shapes
    this.createShapes();
  }

  createGrid() {
    const gridSize = 20;
    const divisions = 20;
    const gridGeometry = new THREE.BufferGeometry();
    const vertices = [];

    for (let i = -gridSize / 2; i <= gridSize / 2; i += gridSize / divisions) {
      // Horizontal lines
      vertices.push(-gridSize / 2, 0, i);
      vertices.push(gridSize / 2, 0, i);
      
      // Vertical lines
      vertices.push(i, 0, -gridSize / 2);
      vertices.push(i, 0, gridSize / 2);
    }

    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    
    const gridMaterial = new THREE.LineBasicMaterial({ 
      color: 0x444444,
      transparent: true,
      opacity: 0.3
    });
    
    const grid = new THREE.LineSegments(gridGeometry, gridMaterial);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = -2;
    this.scene.add(grid);
    this.gridLines.push(grid);
  }

  createShapes() {
    const geometries = [
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.OctahedronGeometry(0.7),
      new THREE.TetrahedronGeometry(0.8),
      new THREE.IcosahedronGeometry(0.6)
    ];

    const positions = [
      { x: -2, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 0, z: -2 },
      { x: 0, y: 0, z: 2 }
    ];

    geometries.forEach((geometry, index) => {
      const material = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        wireframe: false,
        transparent: true,
        opacity: 0.8
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(positions[index].x, positions[index].y, positions[index].z);
      
      this.shapes.push({
        mesh: mesh,
        basePosition: { ...positions[index] },
        rotationSpeed: { x: 0.01, y: 0.02, z: 0 }
      });
      
      this.scene.add(mesh);
    });

    // Add central complex shape
    const complexGeometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
    const complexMaterial = new THREE.MeshPhongMaterial({
      color: 0xff00ff,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });
    
    const complexMesh = new THREE.Mesh(complexGeometry, complexMaterial);
    this.shapes.push({
      mesh: complexMesh,
      basePosition: { x: 0, y: 0, z: 0 },
      rotationSpeed: { x: 0.005, y: 0.01, z: 0.005 }
    });
    
    this.scene.add(complexMesh);
  }

  update(deltaTime) {
    this.time += deltaTime;

    // Update shapes
    this.shapes.forEach((shape, index) => {
      const { mesh, basePosition, rotationSpeed } = shape;
      
      // Rotation
      mesh.rotation.x += rotationSpeed.x * this.parameters.speed;
      mesh.rotation.y += rotationSpeed.y * this.parameters.speed;
      mesh.rotation.z += rotationSpeed.z * this.parameters.speed;
      
      // Scale based on complexity
      const scale = 0.5 + this.parameters.scale + (this.parameters.complexity * 0.5);
      mesh.scale.set(scale, scale, scale);
      
      // Audio reactive movement
      if (this.audioData && this.audioData.bass) {
        const audioOffset = this.audioData.bass * 0.5;
        mesh.position.y = basePosition.y + Math.sin(this.time * 2 + index) * audioOffset;
      } else {
        mesh.position.y = basePosition.y + Math.sin(this.time * 2 + index) * 0.2;
      }
    });

    // Rotate camera slightly
    const cameraRadius = 5 + (this.parameters.complexity * 3);
    this.camera.position.x = Math.sin(this.time * 0.1) * cameraRadius;
    this.camera.position.z = Math.cos(this.time * 0.1) * cameraRadius;
    this.camera.lookAt(0, 0, 0);
  }

  onParameterChange(name, value) {
    if (name === 'hue') {
      const color = this.hueToRgb(value * 360);
      this.shapes.forEach((shape, index) => {
        // Vary the hue slightly for each shape
        const shapeHue = (value * 360 + index * 30) % 360;
        const shapeColor = this.hueToRgb(shapeHue);
        shape.mesh.material.color.setRGB(shapeColor.r, shapeColor.g, shapeColor.b);
      });
    }
  }
} 