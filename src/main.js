import './style.css'
import { MidiController } from './midi/MidiController.js'
import { AudioAnalyzer } from './audio/AudioAnalyzer.js'
import { SceneManager } from './scenes/SceneManager.js'
import midiMappings from './config/midi-mappings.json'

class App {
  constructor() {
    this.midiController = new MidiController()
    this.audioAnalyzer = new AudioAnalyzer()
    this.sceneManager = null
    this.audioActive = false
    this.lastFrameTime = 0
  }

  async init() {
    console.log('Initializing APC40 Visual Controller...')
    
    // Get container
    const container = document.getElementById('canvas-container')
    if (!container) {
      console.error('Canvas container not found')
      return
    }

    // Initialize scene manager
    this.sceneManager = new SceneManager(container)
    
    // Initialize MIDI
    const midiInitialized = await this.midiController.init()
    if (midiInitialized) {
      this.setupMidiListeners()
    }
    
    // Initialize audio
    const audioInitialized = await this.audioAnalyzer.init()
    if (audioInitialized) {
      this.setupAudioToggle()
    }
    
    // Setup UI listeners
    this.setupUIListeners()
    
    // Start scene manager
    this.sceneManager.start()
    
    // Start animation loop
    this.animate()
    
    console.log('Initialization complete')
  }

  setupMidiListeners() {
    // Connection status
    this.midiController.on('connection', (data) => {
      const status = document.getElementById('midi-status')
      if (status) {
        status.textContent = data.connected ? 'MIDI: Connected' : 'MIDI: Disconnected'
        status.style.color = data.connected ? '#4CAF50' : '#f44336'
      }
    })

    // Scene selection buttons
    this.midiController.on('sceneButton', (data) => {
      // Map button to scene based on configuration
      if (data.row === 'row1' && data.index < 3) {
        this.sceneManager.switchToScene(data.index)
      }
    })

    // Knob controls
    this.midiController.on('knob', (data) => {
      const currentScene = this.sceneManager.getCurrentScene()
      if (!currentScene) return

      // Map knobs to scene parameters based on current scene
      const sceneName = currentScene.name.toLowerCase()
      const mappings = midiMappings.mappings.scenes[sceneName]
      
      if (mappings && mappings.parameters) {
        for (const [param, knobName] of Object.entries(mappings.parameters)) {
          if (data.name === knobName) {
            this.sceneManager.updateSceneParameter(param, data.value)
          }
        }
      }
    })

    // Fader controls
    this.midiController.on('fader', (data) => {
      if (data.name === 'master') {
        // Master fader controls overall intensity
        const currentScene = this.sceneManager.getCurrentScene()
        if (currentScene) {
          currentScene.setIntensity(data.value)
        }
      }
    })

    // Crossfader for transition speed
    this.midiController.on('crossfader', (data) => {
      // Map crossfader to transition duration (0-2 seconds)
      const duration = data.value * 2000
      this.sceneManager.setTransitionDuration(duration)
    })
  }

  setupAudioToggle() {
    // Toggle audio with a keyboard shortcut or button
    document.addEventListener('keydown', async (e) => {
      if (e.key === 'a' || e.key === 'A') {
        if (this.audioActive) {
          this.audioAnalyzer.stop()
          this.audioActive = false
          this.updateAudioStatus(false)
        } else {
          const started = await this.audioAnalyzer.start()
          if (started) {
            this.audioActive = true
            this.updateAudioStatus(true)
          }
        }
      }
    })
  }

  updateAudioStatus(active) {
    const status = document.getElementById('audio-status')
    if (status) {
      status.textContent = active ? 'Audio: Active' : 'Audio: Inactive'
      status.style.color = active ? '#4CAF50' : '#666'
    }
  }

  setupUIListeners() {
    // Scene buttons
    const sceneButtons = document.querySelectorAll('.scene-btn')
    sceneButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        this.sceneManager.switchToScene(index)
      })
    })

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowLeft':
          this.sceneManager.previousScene()
          break
        case 'ArrowRight':
          this.sceneManager.nextScene()
          break
        case '1':
        case '2':
        case '3':
          const sceneIndex = parseInt(e.key) - 1
          this.sceneManager.switchToScene(sceneIndex)
          break
      }
    })
  }

  animate() {
    requestAnimationFrame(() => this.animate())
    
    // Calculate delta time
    const currentTime = performance.now()
    const deltaTime = (currentTime - this.lastFrameTime) / 1000
    this.lastFrameTime = currentTime
    
    // Update audio data
    if (this.audioActive && this.audioAnalyzer.isRunning()) {
      const audioData = {
        bass: this.audioAnalyzer.getBassEnergy(),
        mid: this.audioAnalyzer.getMidEnergy(),
        high: this.audioAnalyzer.getHighEnergy(),
        average: this.audioAnalyzer.getAverageFrequency(),
        spectrum: this.audioAnalyzer.getFrequencyData()
      }
      
      this.sceneManager.updateAudioData(audioData)
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new App()
  app.init()
})
