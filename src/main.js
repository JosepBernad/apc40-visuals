import './style.css'
import { MidiController } from './midi/MidiController.js'
import { AudioAnalyzer } from './audio/AudioAnalyzer.js'
import { SceneManager } from './scenes/SceneManager.js'
import { ControlPanel } from './ui/ControlPanel.js'
import { LFOManager } from './audio/LFOManager.js'
import midiMappings from './config/midi-mappings.json'

class App {
  constructor() {
    this.midiController = new MidiController()
    this.audioAnalyzer = new AudioAnalyzer()
    this.sceneManager = null
    this.controlPanel = new ControlPanel()
    this.lfoManager = new LFOManager()
    this.audioActive = false
    this.lastFrameTime = 0
    this.fullscreenMode = false
  }

  async init() {
    console.log('Initializing APC40 Visual Controller...')
    
    // Initialize theme
    this.initTheme()
    
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

  initTheme() {
    // Get saved theme or default to system
    const savedTheme = localStorage.getItem('theme') || 'system'
    
    // Apply the saved theme
    this.applyTheme(savedTheme)
    this.updateThemeIcon(savedTheme)
    
    // Setup dropdown toggle
    const themeToggle = document.getElementById('theme-toggle')
    const themeDropdown = document.getElementById('theme-dropdown')
    
    if (themeToggle && themeDropdown) {
      // Toggle dropdown on click
      themeToggle.addEventListener('click', (e) => {
        e.stopPropagation()
        const isOpen = themeDropdown.classList.contains('show')
        if (isOpen) {
          this.closeThemeDropdown()
        } else {
          this.openThemeDropdown()
        }
      })
      
      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        this.closeThemeDropdown()
      })
      
      // Prevent dropdown from closing when clicking inside
      themeDropdown.addEventListener('click', (e) => {
        e.stopPropagation()
      })
    }
    
    // Listen for theme option clicks
    const themeOptions = document.querySelectorAll('.theme-option')
    themeOptions.forEach(option => {
      option.addEventListener('click', () => {
        const theme = option.dataset.theme
        localStorage.setItem('theme', theme)
        this.applyTheme(theme)
        this.updateThemeIcon(theme)
        this.updateThemeOptions(theme)
        this.closeThemeDropdown()
      })
    })
    
    // Update active option
    this.updateThemeOptions(savedTheme)
    
    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const currentTheme = localStorage.getItem('theme') || 'system'
        if (currentTheme === 'system') {
          this.applyTheme('system')
        }
      })
    }
  }

  openThemeDropdown() {
    const themeToggle = document.getElementById('theme-toggle')
    const themeDropdown = document.getElementById('theme-dropdown')
    if (themeToggle && themeDropdown) {
      themeToggle.classList.add('active')
      themeDropdown.style.display = 'block'
      // Force reflow
      themeDropdown.offsetHeight
      themeDropdown.classList.add('show')
    }
  }

  closeThemeDropdown() {
    const themeToggle = document.getElementById('theme-toggle')
    const themeDropdown = document.getElementById('theme-dropdown')
    if (themeToggle && themeDropdown) {
      themeToggle.classList.remove('active')
      themeDropdown.classList.remove('show')
      setTimeout(() => {
        if (!themeDropdown.classList.contains('show')) {
          themeDropdown.style.display = 'none'
        }
      }, 200)
    }
  }

  updateThemeIcon(theme) {
    // Hide all icons
    document.getElementById('theme-icon-system').style.display = 'none'
    document.getElementById('theme-icon-light').style.display = 'none'
    document.getElementById('theme-icon-dark').style.display = 'none'
    
    // Show active icon
    document.getElementById(`theme-icon-${theme}`).style.display = 'block'
    
    // Update theme toggle data attribute
    const themeToggle = document.getElementById('theme-toggle')
    if (themeToggle) {
      themeToggle.setAttribute('data-current-theme', theme)
    }
  }

  updateThemeOptions(activeTheme) {
    const themeOptions = document.querySelectorAll('.theme-option')
    themeOptions.forEach(option => {
      if (option.dataset.theme === activeTheme) {
        option.classList.add('active')
      } else {
        option.classList.remove('active')
      }
    })
  }

  applyTheme(theme) {
    const body = document.body
    
    if (theme === 'dark') {
      body.classList.add('dark-theme')
    } else if (theme === 'light') {
      body.classList.remove('dark-theme')
    } else if (theme === 'system') {
      // Check system preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        body.classList.add('dark-theme')
      } else {
        body.classList.remove('dark-theme')
      }
    }
  }

  setupMidiListeners() {
    // Connection status
    this.midiController.on('connection', (data) => {
      const status = document.getElementById('midi-status')
      if (status) {
        status.textContent = data.connected ? 'MIDI: Connected' : 'MIDI: Disconnected'
        if (data.connected) {
          status.style.color = '#34c759'
        } else {
          status.style.color = '#ff3b30'
        }
      }
    })

    // Scene selection buttons
    this.midiController.on('sceneButton', (data) => {
      // Map button to scene based on configuration
      if (data.row === 'row1' && data.index < 3) {
        this.sceneManager.switchToScene(data.index, false, () => {
          this.updateControlPanel()
        })
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
          // Update the intensity parameter so it's reflected in controls
          currentScene.setParameter('intensity', data.value)
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

  updateSceneParameter(controlName, value, isLFO = false) {
    const currentScene = this.sceneManager.getCurrentScene()
    if (!currentScene) return

    // Get the parameter name for this control
    const parameter = this.getParameterForControl(controlName)
    if (parameter) {
      this.sceneManager.updateSceneParameter(parameter, value)
      // Update control panel for both manual and LFO changes
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
      if (active) {
        status.style.color = '#34c759'
      } else {
        status.style.color = '#86868b'
      }
    }
  }

  setupUIListeners() {
    // Scene buttons
    const sceneButtons = document.querySelectorAll('.scene-btn')
    sceneButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        this.sceneManager.switchToScene(index, false, () => {
          this.updateControlPanel()
        })
      })
    })

    // Listen for fullscreen toggle from control panel
    window.addEventListener('toggleFullscreen', () => {
      this.toggleFullscreenMode()
    })

    // Listen for control panel button clicks
    window.addEventListener('controlPanelUpdate', (e) => {
      const { controlName, value } = e.detail
      this.updateSceneParameter(controlName, value)
    })

    // Listen for LFO toggle events
    window.addEventListener('lfoToggle', (e) => {
      const { controlName, active } = e.detail
      this.lfoManager.toggleLFO(controlName, active)
      console.log(`LFO ${active ? 'enabled' : 'disabled'} for ${controlName}`)
    })

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowLeft':
          this.sceneManager.previousScene(() => {
            this.updateControlPanel()
          })
          break
        case 'ArrowRight':
          this.sceneManager.nextScene(() => {
            this.updateControlPanel()
          })
          break
        case '1':
        case '2':
        case '3':
          const sceneIndex = parseInt(e.key) - 1
          this.sceneManager.switchToScene(sceneIndex, false, () => {
            this.updateControlPanel()
          })
          break
        case 'h':
        case 'H':
          // Toggle full screen mode
          this.toggleFullscreenMode()
          break
      }
    })
  }

  toggleFullscreenMode() {
    this.fullscreenMode = !this.fullscreenMode
    
    // Toggle all UI elements
    const sceneSelector = document.getElementById('scene-selector')
    const status = document.querySelector('.status')
    const helpOverlay = document.querySelector('.help-overlay')
    
    if (this.fullscreenMode) {
      // Hide all UI elements
      sceneSelector.classList.add('hidden-ui')
      status.classList.add('hidden-ui')
      helpOverlay.classList.add('hidden-ui')
      this.controlPanel.container.classList.add('hidden')
      
      // Update canvas container to full screen
      const canvasContainer = document.getElementById('canvas-container')
      canvasContainer.classList.add('fullscreen')
    } else {
      // Show all UI elements
      sceneSelector.classList.remove('hidden-ui')
      status.classList.remove('hidden-ui')
      helpOverlay.classList.remove('hidden-ui')
      this.controlPanel.container.classList.remove('hidden')
      
      // Reset canvas container
      const canvasContainer = document.getElementById('canvas-container')
      canvasContainer.classList.remove('fullscreen')
    }
    
    // Update control panel toggle button
    const toggleBtn = this.controlPanel.container.querySelector('.toggle-btn')
    if (toggleBtn) {
      toggleBtn.textContent = this.fullscreenMode ? '▶' : '◀'
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate())
    
    // Calculate delta time
    const currentTime = performance.now()
    const deltaTime = (currentTime - this.lastFrameTime) / 1000
    this.lastFrameTime = currentTime
    
    // Update LFO modulations
    const lfoModulations = this.lfoManager.update(deltaTime)
    
    // Apply LFO modulations to scene parameters
    if (lfoModulations.size > 0) {
      for (const [controlName, value] of lfoModulations) {
        this.updateSceneParameter(controlName, value, true) // true indicates LFO source
      }
    }
    
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

  resetAllParameters() {
    console.log('PANIC! Resetting all parameters to defaults...')
    
    const currentScene = this.sceneManager.getCurrentScene()
    if (!currentScene) return
    
    // Reset all LFOs
    this.lfoManager.reset()
    
    // Define default values for each scene type
    const defaultValues = {
      'Geometric': {
        speed: 0.5,
        complexity: 0.5,
        scale: 0.5,
        rotation: 0.5,
        glow: 0.5,
        wireframe: 0,
        metalness: 0.8,
        roughness: 0.2,
        hue: 0,
        intensity: 1
      },
      'Particles': {
        count: 0.5,
        speed: 0.5,
        spread: 0.5,
        size: 0.5,
        turbulence: 0.5,
        trail: 0,
        hue: 0,
        intensity: 1
      },
      'Waves': {
        frequency: 0.5,
        amplitude: 0.5,
        speed: 0.5,
        waveCount: 0.5,
        distortion: 0.5,
        wireframe: 0,
        hue: 0,
        intensity: 1
      }
    }
    
    const defaults = defaultValues[currentScene.name]
    if (defaults) {
      // Reset all parameters
      Object.keys(defaults).forEach(param => {
        currentScene.setParameter(param, defaults[param])
      })
      
      // Update control panel to reflect reset values
      this.updateControlPanel()
      
      // Visual feedback - flash the scene
      currentScene.setIntensity(0.2)
      setTimeout(() => {
        currentScene.setIntensity(defaults.intensity)
      }, 100)
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new App()
  window.app = app // Expose globally for control panel access
  app.init()
})
