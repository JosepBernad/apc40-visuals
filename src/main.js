import './style.css'
import { MidiController } from './midi/MidiController.js'
import { AudioAnalyzer } from './audio/AudioAnalyzer.js'
import { SceneManager } from './scenes/SceneManager.js'
import { ControlPanel } from './ui/ControlPanel.js'
import midiMappings from './config/midi-mappings.json'

class App {
  constructor() {
    this.midiController = new MidiController()
    this.audioAnalyzer = new AudioAnalyzer()
    this.sceneManager = null
    this.controlPanel = new ControlPanel()
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
    
    // Initialize control panel
    this.controlPanel.init()
    
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
    
    // Update control panel with initial scene controls
    this.updateControlPanel()
    
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
        this.updateControlPanel()
      }
      // Handle button controls for current scene
      else if (data.row === 'row2') {
        const currentScene = this.sceneManager.getCurrentScene()
        if (currentScene) {
          const buttonName = `${data.row}[${data.index}]`
          // Toggle button parameters (0 or 1)
          const currentValue = currentScene.parameters[this.getParameterForControl(buttonName)] || 0
          const newValue = currentValue > 0.5 ? 0 : 1
          this.updateSceneParameter(buttonName, newValue)
        }
      }
    })

    // Knob controls - now handling all 8 knobs
    this.midiController.on('knob', (data) => {
      this.updateSceneParameter(data.name, data.value)
    })

    // Fader controls
    this.midiController.on('fader', (data) => {
      if (data.name === 'master') {
        // Master fader controls overall intensity
        const currentScene = this.sceneManager.getCurrentScene()
        if (currentScene) {
          currentScene.setIntensity(data.value)
          this.controlPanel.updateControlValue(data.name, data.value)
        }
      } else {
        // Other faders can be mapped to scene parameters
        this.updateSceneParameter(data.name, data.value)
      }
    })

    // Crossfader for transition speed
    this.midiController.on('crossfader', (data) => {
      // Map crossfader to transition duration (0-2 seconds)
      const duration = data.value * 2000
      this.sceneManager.setTransitionDuration(duration)
    })
  }

  updateSceneParameter(controlName, value) {
    const currentScene = this.sceneManager.getCurrentScene()
    if (!currentScene) return

    // Get the parameter name for this control
    const parameter = this.getParameterForControl(controlName)
    if (parameter) {
      this.sceneManager.updateSceneParameter(parameter, value)
      this.controlPanel.updateControlValue(controlName, value)
    }
  }

  getParameterForControl(controlName) {
    const currentScene = this.sceneManager.getCurrentScene()
    if (!currentScene) return null

    const controls = currentScene.getControls()
    const allControls = [
      ...controls.knobs,
      ...controls.buttons,
      ...controls.faders
    ]

    const control = allControls.find(c => c.name === controlName)
    return control ? control.parameter : null
  }

  updateControlPanel() {
    const currentScene = this.sceneManager.getCurrentScene()
    if (currentScene) {
      const controls = currentScene.getControls()
      this.controlPanel.updateControls(controls)
    }
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
        this.updateControlPanel()
      })
    })

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowLeft':
          this.sceneManager.previousScene()
          this.updateControlPanel()
          break
        case 'ArrowRight':
          this.sceneManager.nextScene()
          this.updateControlPanel()
          break
        case '1':
        case '2':
        case '3':
          const sceneIndex = parseInt(e.key) - 1
          this.sceneManager.switchToScene(sceneIndex)
          this.updateControlPanel()
          break
        case 'h':
        case 'H':
          // Toggle control panel visibility
          this.controlPanel.toggle()
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
