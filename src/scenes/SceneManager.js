import { GeometricScene } from './GeometricScene.js';
import { ParticleScene } from './ParticleScene.js';
import { WaveScene } from './WaveScene.js';
import { TunnelScene } from './TunnelScene.js';
import { CrystalScene } from './CrystalScene.js';

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.scenes = [];
    this.currentSceneIndex = 0;
    this.currentScene = null;
    this.transitioning = false;
    this.transitionDuration = 1000; // ms
    
    // Initialize scenes
    this.initScenes();
  }

  initScenes() {
    // Create all scenes - reordered with WaveScene first and GeometricScene last
    this.scenes = [
      new WaveScene(),      // Was last, now first
      new TunnelScene(),    // New scene
      new CrystalScene(),   // New scene
      new ParticleScene(),  // Stays in middle
      new GeometricScene()  // Was first, now last
    ];
  }

  start() {
    if (this.scenes.length > 0) {
      this.switchToScene(0);
    }
  }

  switchToScene(index, immediate = false, callback = null) {
    if (index < 0 || index >= this.scenes.length) return;
    if (this.transitioning && !immediate) return;
    if (index === this.currentSceneIndex && this.currentScene) return;

    this.transitioning = true;
    const newScene = this.scenes[index];

    if (this.currentScene) {
      // Fade out current scene
      if (!immediate) {
        this.fadeOut(this.currentScene, () => {
          this.currentScene.destroy();
          this.activateNewScene(newScene, index, callback);
        });
      } else {
        this.currentScene.destroy();
        this.activateNewScene(newScene, index, callback);
      }
    } else {
      this.activateNewScene(newScene, index, callback);
    }
  }

  activateNewScene(scene, index, callback = null) {
    // Initialize and start new scene
    scene.init(this.container);
    scene.start();
    
    this.currentScene = scene;
    this.currentSceneIndex = index;
    
    // Call the callback after scene is set but before fade in
    if (callback) {
      callback();
    }
    
    // Fade in new scene
    this.fadeIn(scene, () => {
      this.transitioning = false;
    });
    
    // Update UI
    this.updateSceneButtons(index);
  }

  fadeOut(scene, callback) {
    const startTime = Date.now();
    const startOpacity = scene.parameters.intensity;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / this.transitionDuration, 1);
      
      scene.setIntensity(startOpacity * (1 - progress));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        callback();
      }
    };
    
    animate();
  }

  fadeIn(scene, callback) {
    const startTime = Date.now();
    scene.setIntensity(0);
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / this.transitionDuration, 1);
      
      scene.setIntensity(progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        callback();
      }
    };
    
    animate();
  }

  updateSceneButtons(activeIndex) {
    const buttons = document.querySelectorAll('.scene-btn');
    buttons.forEach((btn, index) => {
      if (index === activeIndex) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  getCurrentScene() {
    return this.currentScene;
  }

  getSceneByName(name) {
    return this.scenes.find(scene => scene.name === name);
  }

  getSceneIndex(name) {
    return this.scenes.findIndex(scene => scene.name === name);
  }

  nextScene(callback = null) {
    const nextIndex = (this.currentSceneIndex + 1) % this.scenes.length;
    this.switchToScene(nextIndex, false, callback);
  }

  previousScene(callback = null) {
    const prevIndex = (this.currentSceneIndex - 1 + this.scenes.length) % this.scenes.length;
    this.switchToScene(prevIndex, false, callback);
  }

  setTransitionDuration(duration) {
    this.transitionDuration = Math.max(0, duration);
  }

  // Handle scene parameter updates
  updateSceneParameter(parameterName, value) {
    if (this.currentScene) {
      this.currentScene.setParameter(parameterName, value);
    }
  }

  // Update audio data for current scene
  updateAudioData(audioData) {
    if (this.currentScene) {
      this.currentScene.setAudioData(audioData);
    }
  }

  destroy() {
    if (this.currentScene) {
      this.currentScene.destroy();
    }
    this.scenes = [];
    this.currentScene = null;
  }
} 