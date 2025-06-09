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
    
    // Setup opacity slider
    this.setupOpacitySlider()
    
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

  cycleThemeMode() {
    const currentTheme = localStorage.getItem('theme') || 'system'
    const themes = ['light', 'dark']
    
    // If current theme is system or not in our cycle, default to light
    let nextTheme
    if (currentTheme === 'light') {
      nextTheme = 'dark'
    } else {
      nextTheme = 'light'
    }
    
    // Save and apply the new theme
    localStorage.setItem('theme', nextTheme)
    this.applyTheme(nextTheme)
    this.updateThemeIcon(nextTheme)
    this.updateThemeOptions(nextTheme)
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

    // Special handling for master intensity
    if (controlName === 'master') {
      currentScene.setIntensity(value)
      currentScene.setParameter('intensity', value)
      this.controlPanel.updateControlValue(controlName, value)
      return
    }

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

    // Scene creation guide
    const sceneAddBtn = document.getElementById('scene-add-btn')
    const sceneGuideOverlay = document.getElementById('scene-guide-overlay')
    const sceneGuideClose = document.getElementById('scene-guide-close')
    const sceneGuideCopy = document.getElementById('scene-guide-copy')

    if (sceneAddBtn && sceneGuideOverlay && sceneGuideClose) {
      // Show guide overlay
      sceneAddBtn.addEventListener('click', () => {
        sceneGuideOverlay.style.display = 'flex'
        // Force reflow
        sceneGuideOverlay.offsetHeight
        sceneGuideOverlay.classList.add('show')
      })

      // Close guide overlay
      const closeGuide = () => {
        sceneGuideOverlay.classList.remove('show')
        setTimeout(() => {
          sceneGuideOverlay.style.display = 'none'
        }, 300)
      }

      sceneGuideClose.addEventListener('click', closeGuide)
      
      // Copy guide as Markdown
      if (sceneGuideCopy) {
        sceneGuideCopy.addEventListener('click', async () => {
          const markdownContent = this.generateSceneGuideMarkdown()
          
          try {
            await navigator.clipboard.writeText(markdownContent)
            
            // Visual feedback
            const originalText = sceneGuideCopy.innerHTML
            sceneGuideCopy.classList.add('copied')
            sceneGuideCopy.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Copied!
            `
            
            setTimeout(() => {
              sceneGuideCopy.classList.remove('copied')
              sceneGuideCopy.innerHTML = originalText
            }, 2000)
            
          } catch (err) {
            console.error('Failed to copy to clipboard:', err)
            // Fallback for older browsers
            this.fallbackCopyToClipboard(markdownContent)
          }
        })
      }
      
      // Close when clicking outside content
      sceneGuideOverlay.addEventListener('click', (e) => {
        if (e.target === sceneGuideOverlay) {
          closeGuide()
        }
      })

      // Close with Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sceneGuideOverlay.classList.contains('show')) {
          closeGuide()
        }
      })
    }

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

    // Listen for LFO configuration updates
    window.addEventListener('lfoConfigUpdate', (e) => {
      const { controlName, config } = e.detail
      this.lfoManager.setLFO(controlName, config)
      console.log(`LFO config updated for ${controlName}:`, config)
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
        case 'm':
        case 'M':
          // Cycle through theme modes
          this.cycleThemeMode()
          break
      }
    })
  }

  setupOpacitySlider() {
    const opacitySlider = document.getElementById('help-opacity-slider')
    const opacityValue = document.getElementById('opacity-value')
    
    if (opacitySlider && opacityValue) {
      // Load saved opacity or default to 100%
      const savedOpacity = localStorage.getItem('ui-opacity') || '100'
      opacitySlider.value = savedOpacity
      opacityValue.textContent = `${savedOpacity}%`
      this.setUIOpacity(savedOpacity / 100)
      
      // Handle slider changes
      opacitySlider.addEventListener('input', (e) => {
        const opacity = e.target.value
        opacityValue.textContent = `${opacity}%`
        this.setUIOpacity(opacity / 100)
        localStorage.setItem('ui-opacity', opacity)
      })
    }
  }

  setUIOpacity(opacity) {
    // Get all UI elements except the canvas/scene
    const uiElements = [
      document.querySelector('.help-overlay'),
      document.getElementById('scene-selector'),
      document.querySelector('.status'),
      document.querySelector('.control-panel')
    ]
    
    // Apply opacity to all UI elements
    uiElements.forEach(element => {
      if (element) {
        element.style.opacity = opacity
      }
    })
    
    // Also apply to any scene guide overlay if it exists
    const sceneGuideOverlay = document.getElementById('scene-guide-overlay')
    if (sceneGuideOverlay) {
      sceneGuideOverlay.style.opacity = opacity
    }
    
    // Keep opacity control elements more visible
    // Calculate enhanced opacity for the control (minimum 70%, maximum 100%)
    const controlOpacity = Math.max(0.7, opacity)
    const opacityControl = document.querySelector('.opacity-control')
    if (opacityControl) {
      opacityControl.style.opacity = controlOpacity
    }
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

  generateSceneGuideMarkdown() {
    return `# APC40 Visual Controller - Scene Creation Guide

## Project Overview
This is a professional APC40 MIDI visual controller built with Three.js, featuring real-time parameter control, LFO automation, and audio reactivity. The system supports multiple visual scenes that can be switched between and controlled via MIDI or UI controls.

## Architecture

### Base Scene Class (\`src/scenes/Scene.js\`)
All scenes must extend the base \`Scene\` class which provides:

**Core Properties:**
- \`this.name\` - Scene name (string)
- \`this.scene\` - THREE.Scene instance
- \`this.camera\` - THREE.PerspectiveCamera
- \`this.renderer\` - THREE.WebGLRenderer
- \`this.parameters\` - Object containing all controllable parameters
- \`this.audioData\` - Real-time audio analysis data
- \`this.time\` - Animation time counter

**Required Methods to Override:**
- \`setup()\` - Initialize scene objects, lighting, materials
- \`update(deltaTime)\` - Animation loop, update objects based on parameters
- \`onParameterChange(name, value)\` - Handle real-time parameter changes
- \`getControls()\` - Return control mapping for UI/MIDI
- \`destroy()\` - Clean up resources

**Built-in Features:**
- Theme-responsive background (white for light mode, black for dark mode)
- Automatic resize handling
- Resource cleanup
- Intensity control (master opacity)
- Utility method \`hueToRgb(h)\` for color conversion

### Parameter System
Parameters are normalized values (0.0 to 1.0) that control scene behavior:

**Standard Parameters (all scenes should have):**
- \`intensity\` (0-1) - Master intensity/opacity
- \`hue\` (0-1) - Color hue (0=red, 0.33=green, 0.66=blue)

**Common Parameters:**
- \`speed\` (0-1) - Animation speed multiplier
- \`complexity\` (0-1) - Scene complexity/detail level
- \`scale\` (0-1) - Object size scaling
- \`wireframe\` (0-1) - Toggle wireframe mode (>0.5 = on)

### Control Mapping
The \`getControls()\` method must return an object with three arrays:

\`\`\`javascript
getControls() {
  return {
    knobs: [
      { name: 'deviceKnob1', parameter: 'speed', value: this.parameters.speed, label: 'Speed' },
      { name: 'deviceKnob2', parameter: 'complexity', value: this.parameters.complexity, label: 'Complexity' },
      // ... up to 8 knobs (deviceKnob1-8)
    ],
    buttons: [
      { name: 'row2[0]', parameter: 'wireframe', value: this.parameters.wireframe, label: 'Wireframe' },
      // ... up to 8 buttons (row2[0-7])
    ],
    faders: [
      { name: 'master', parameter: 'intensity', value: this.parameters.intensity, label: 'Master Intensity' }
      // ... additional faders if needed
    ]
  };
}
\`\`\`

### Audio Reactivity
Audio data is available in \`this.audioData\` with properties:
- \`bass\` (0-1) - Low frequency energy
- \`mid\` (0-1) - Mid frequency energy  
- \`high\` (0-1) - High frequency energy
- \`average\` (0-1) - Overall frequency average
- \`spectrum\` - Full frequency spectrum array

### Scene Registration
To add a new scene:

1. Create the scene file in \`src/scenes/\`
2. Import and add to \`SceneManager.js\`:
\`\`\`javascript
import { YourNewScene } from './YourNewScene.js';

// In initScenes():
this.scenes = [
  new GeometricScene(),
  new ParticleScene(), 
  new WaveScene(),
  new YourNewScene() // Add here
];
\`\`\`

3. Add scene button to \`index.html\` if more than 3 scenes total

## Existing Scene Examples

### GeometricScene
- **Focus**: 3D geometric shapes with metallic materials
- **Features**: Multiple primitive shapes, glow effects, grid floor, dynamic lighting
- **Parameters**: speed, complexity, scale, rotation, glow, wireframe, metalness, roughness
- **Techniques**: PBR materials, shadow mapping, emissive materials, camera orbiting

### ParticleScene  
- **Focus**: GPU particle system with shader-based rendering
- **Features**: 5000+ particles, custom shaders, deterministic color variations
- **Parameters**: count, speed, spread, size, turbulence, trail
- **Techniques**: BufferGeometry, ShaderMaterial, additive blending, vertex colors

### WaveScene
- **Focus**: Animated wave surfaces with distortion effects
- **Features**: Multiple wave layers, shader-based displacement, wireframe toggle
- **Parameters**: frequency, amplitude, speed, waveCount, distortion, wireframe  
- **Techniques**: PlaneGeometry with vertex displacement, custom uniforms, layer management

## Technical Requirements

### Performance
- Target 60fps on modern hardware
- Efficient resource management (dispose geometries/materials)
- Use BufferGeometry for large datasets
- Implement proper cleanup in \`destroy()\`

### Visual Quality
- Support both light and dark themes
- Smooth parameter transitions
- Audio-reactive elements
- Professional aesthetic suitable for live performance

### Parameter Handling
- All parameters normalized 0-1
- Immediate response to changes (no interpolation)
- Deterministic behavior for LFO automation
- Meaningful parameter ranges and effects

## Scene Creation Template

\`\`\`javascript
import * as THREE from 'three';
import { Scene } from './Scene.js';

export class YourScene extends Scene {
  constructor() {
    super('YourSceneName');
    
    // Scene-specific properties
    this.yourObjects = [];
    this.time = 0;
    
    // Define parameters
    this.parameters = {
      ...this.parameters, // Include base parameters
      yourParam1: 0.5,
      yourParam2: 0.5,
      // ... more parameters
    };
  }

  setup() {
    // Clean up existing objects
    this.cleanup();
    
    // Reset time
    this.time = 0;
    
    // Create scene objects
    this.createYourObjects();
    
    // Setup lighting
    this.setupLighting();
    
    // Configure camera
    this.camera.position.set(x, y, z);
  }

  update(deltaTime) {
    this.time += deltaTime;
    
    // Update objects based on parameters
    // Apply audio reactivity
    // Animate camera if needed
  }

  onParameterChange(name, value) {
    // Handle specific parameter changes
    if (name === 'hue') {
      // Update colors
    }
    // Handle other parameters
  }

  getControls() {
    return {
      knobs: [/* your knob mappings */],
      buttons: [/* your button mappings */],
      faders: [
        { name: 'master', parameter: 'intensity', value: this.parameters.intensity, label: 'Master Intensity' }
      ]
    };
  }

  cleanup() {
    // Dispose of existing objects
  }

  destroy() {
    this.cleanup();
    super.destroy();
  }
}
\`\`\`

## Best Practices

**Resource Management:**
- Always dispose geometries and materials in cleanup
- Remove objects from scene before disposing
- Use object pools for frequently created/destroyed objects

**Parameter Design:**
- Make parameters have visible, meaningful effects
- Use full 0-1 range effectively
- Consider parameter interactions and combinations

**Audio Reactivity:**
- Use bass for impact effects (scale, intensity)
- Use mid/high for detail animations
- Smooth audio data to avoid jitter

**Visual Design:**
- Consider both light and dark theme backgrounds
- Use appropriate materials for the aesthetic
- Implement smooth animations and transitions

## Advanced Techniques

**Shader Materials:**
- Custom vertex/fragment shaders for unique effects
- Uniforms for parameter control
- Time-based animations

**Post-Processing:**
- Bloom effects for glow
- Color grading for mood
- Distortion effects

**Procedural Generation:**
- Algorithm-based object creation
- Noise functions for organic movement
- Mathematical patterns and fractals

## Scene Ideas & Inspiration

### Potential Scene Concepts:
1. **Tunnel/Corridor** - Flying through geometric tunnels
2. **Fractal** - Recursive mathematical patterns
3. **Liquid/Fluid** - Flowing, organic shapes
4. **Crystal** - Crystalline structures with refraction
5. **Space** - Cosmic scenes with stars/planets
6. **Abstract** - Non-representational artistic forms
7. **Mechanical** - Industrial/steampunk aesthetics
8. **Nature** - Organic, plant-like growth patterns
9. **Digital** - Glitch effects, data visualization
10. **Minimal** - Clean, simple geometric forms

### Technical Challenges to Explore:
- Instanced rendering for performance
- Compute shaders for complex simulations
- Ray marching for volumetric effects
- Physics-based animations
- Procedural textures and materials

## Final Notes

- Focus on creating visually striking scenes suitable for live performance
- Ensure smooth real-time control via MIDI/UI
- Test with LFO automation to ensure stable behavior
- Consider the overall aesthetic consistency with existing scenes
- Document any special requirements or dependencies

The goal is to create professional-quality visual scenes that respond beautifully to real-time control and enhance live musical performances.`
  }

  fallbackCopyToClipboard(text) {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      document.execCommand('copy')
      console.log('Fallback copy successful')
    } catch (err) {
      console.error('Fallback copy failed:', err)
    }
    
    document.body.removeChild(textArea)
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new App()
  window.app = app // Expose globally for control panel access
  app.init()
})
