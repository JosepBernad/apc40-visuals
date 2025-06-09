# APC40 Visual Controller

A professional real-time visual controller built with Three.js, designed for live performance with APC40 MIDI controllers. Features multiple stunning visual scenes with real-time parameter control, LFO automation, and audio reactivity.

![APC40 Visual Controller](https://img.shields.io/badge/Status-Active-brightgreen) ![Three.js](https://img.shields.io/badge/Three.js-r158-blue) ![Vite](https://img.shields.io/badge/Vite-6.3.5-purple) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🎨 Visual Scenes
- **5 Professional Scenes**: Waves, Particles, Tunnel, Crystal, and Geometric
- **Real-time Rendering**: 60fps performance with Three.js WebGL
- **Audio Reactivity**: Responds to bass, mid, and high frequencies
- **Theme Support**: Light and dark mode compatibility
- **Smooth Transitions**: Seamless scene switching with fade effects

### 🎛️ Control System
- **APC40 MIDI Support**: Full integration with Akai APC40 controllers
- **8 Knobs + 8 Buttons**: Per-scene parameter mapping
- **LFO Automation**: Built-in Low Frequency Oscillators for automated control
- **Keyboard Shortcuts**: Quick scene switching and parameter control
- **UI Controls**: Mouse/touch interface for all parameters

### 🔊 Audio Integration
- **Real-time Analysis**: Live audio input processing
- **Frequency Separation**: Bass, mid, high frequency reactive elements
- **Visual Feedback**: Audio levels displayed in real-time
- **Toggle Control**: Easy audio input on/off switching

### 🎭 Scene Details

#### 🌊 **Waves Scene**
- Animated wave surfaces with shader-based displacement
- Multiple wave layers with customizable frequency and amplitude
- Wireframe toggle and distortion effects
- **Parameters**: frequency, amplitude, speed, waveCount, distortion, wireframe

#### ✨ **Particles Scene**
- GPU-accelerated particle system with 5000+ particles
- Custom shaders with vertex colors and size variation
- Deterministic animations for LFO compatibility
- **Parameters**: count, speed, spread, size, turbulence, trail

#### 🚇 **Tunnel Scene**
- Flying through procedural geometric tunnels
- Dynamic lighting with moving colored lights
- Particle effects and camera shake
- **Parameters**: speed, complexity, radius, segments, glow, turbulence, particles

#### 💎 **Crystal Scene**
- Crystalline structures with realistic refraction
- Prismatic lighting system with orbital colored lights
- Volumetric light beams and growth animations
- **Parameters**: growth, complexity, refraction, prismatic, resonance, transparency, facets

#### 🔷 **Geometric Scene**
- 3D geometric shapes with metallic PBR materials
- Multiple primitive shapes with glow effects
- Grid floor and dynamic lighting with shadows
- **Parameters**: speed, complexity, scale, rotation, glow, wireframe, metalness, roughness

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Modern web browser with WebGL support
- (Optional) APC40 MIDI controller

### Installation

```bash
# Clone the repository
git clone https://github.com/JosepBernad/apc40-visuals.git
cd apc40-visuals

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎮 Usage

### Keyboard Controls
- **1-5**: Switch between scenes
- **←/→**: Previous/Next scene
- **A**: Toggle audio input
- **H**: Toggle UI visibility
- **F**: Toggle fullscreen mode
- **M**: Switch theme mode

### MIDI Setup
1. Connect your APC40 controller via USB
2. Allow MIDI access in your browser
3. The controller will automatically map to scene parameters
4. Use knobs, buttons, and faders for real-time control

### Scene Parameters
All parameters are normalized (0.0 to 1.0) for consistent control:
- **intensity**: Master opacity/intensity
- **hue**: Color hue (0=red, 0.33=green, 0.66=blue)
- **speed**: Animation speed multiplier
- **complexity**: Scene detail/complexity level

## 🛠️ Development

### Project Structure
```
src/
├── scenes/           # Visual scene implementations
│   ├── Scene.js      # Base scene class
│   ├── WaveScene.js  # Wave surface animations
│   ├── ParticleScene.js # GPU particle system
│   ├── TunnelScene.js   # Tunnel flying experience
│   ├── CrystalScene.js  # Crystal formations
│   ├── GeometricScene.js # 3D geometric shapes
│   └── SceneManager.js   # Scene switching logic
├── audio/            # Audio analysis and LFO
├── midi/             # MIDI controller integration
├── ui/               # User interface components
├── config/           # Configuration files
├── main.js           # Application entry point
└── style.css         # Styling and themes
```

### Creating New Scenes

1. **Extend the Base Scene Class**:
```javascript
import * as THREE from 'three';
import { Scene } from './Scene.js';

export class YourScene extends Scene {
  constructor() {
    super('YourSceneName');
    this.parameters = {
      ...this.parameters,
      yourParam: 0.5
    };
  }

  setup() {
    // Initialize scene objects
  }

  update(deltaTime) {
    // Animation loop
  }

  onParameterChange(name, value) {
    // Handle parameter changes
  }

  getControls() {
    // Return MIDI/UI mappings
  }
}
```

2. **Register in SceneManager**:
```javascript
import { YourScene } from './YourScene.js';

// Add to scenes array
this.scenes = [
  // ... existing scenes
  new YourScene()
];
```

### Performance Guidelines
- Target 60fps on modern hardware
- Use BufferGeometry for large datasets
- Dispose geometries and materials properly
- Implement efficient cleanup in `destroy()`

### Audio Reactivity
Access real-time audio data in your scenes:
```javascript
if (this.audioData) {
  const bassEnergy = this.audioData.bass;     // 0-1
  const midEnergy = this.audioData.mid;       // 0-1
  const highEnergy = this.audioData.high;     // 0-1
  const average = this.audioData.average;     // 0-1
  const spectrum = this.audioData.spectrum;   // Full spectrum array
}
```

## 🎛️ MIDI Mapping

### APC40 Layout
```
┌─────────────────────────────────────────┐
│  [K1] [K2] [K3] [K4] [K5] [K6] [K7] [K8] │ Device Knobs
│                                         │
│  [B1] [B2] [B3] [B4] [B5] [B6] [B7] [B8] │ Scene Buttons
│                                         │
│  [F1] [F2] [F3] [F4] [F5] [F6] [F7] [F8] │ Channel Faders
│                                    [MF] │ Master Fader
└─────────────────────────────────────────┘
```

### Default Mappings
- **Device Knobs**: Scene-specific parameters (speed, complexity, etc.)
- **Scene Buttons**: Toggle parameters (wireframe, effects)
- **Channel Faders**: Additional scene controls
- **Master Fader**: Global intensity control

## 🎨 Themes

The application supports multiple themes:
- **Light Mode**: Clean, bright interface
- **Dark Mode**: Professional, low-light interface
- **System**: Follows OS preference

Themes affect both UI and scene backgrounds for optimal viewing.

## 🔧 Configuration

### Audio Settings
- **Sample Rate**: 44.1kHz default
- **Buffer Size**: 2048 samples
- **Frequency Bands**: 32-band analysis
- **Smoothing**: Configurable audio smoothing

### Performance Settings
- **Target FPS**: 60fps
- **Render Quality**: Adjustable via device pixel ratio
- **Shadow Quality**: Configurable shadow mapping
- **Post-Processing**: Optional bloom and effects

## 📱 Browser Compatibility

- **Chrome**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Full support (iOS 13+)
- **Edge**: Full support

**Requirements**:
- WebGL 2.0 support
- Web Audio API
- WebMIDI API (for MIDI controllers)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-scene`)
3. Commit your changes (`git commit -m 'Add amazing scene'`)
4. Push to the branch (`git push origin feature/amazing-scene`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Test scenes with both mouse and MIDI control
- Ensure 60fps performance on target hardware
- Include proper resource cleanup
- Document new parameters and features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Three.js** - 3D graphics library
- **Vite** - Build tool and development server
- **Web Audio API** - Real-time audio analysis
- **WebMIDI API** - MIDI controller integration

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/JosepBernad/apc40-visuals/issues)
- **Discussions**: [GitHub Discussions](https://github.com/JosepBernad/apc40-visuals/discussions)
- **Documentation**: Built-in scene creation guide (click + button in UI)

---

**Built for live performance. Designed for creativity. Powered by the web.** 