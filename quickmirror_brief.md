# QuickMirror - Complete Development Briefing for Warp.dev AI Agent

## Project Overview
**QuickMirror** is a Windows system tray utility for quick camera/microphone validation before video calls. This document contains complete requirements and implementation details for AI-assisted development.

**Timeline**: Single evening build (8 hours)  
**Target**: MVP with installer and auto-updater  
**Tech Stack**: Tauri + Vanilla TypeScript (no React)

---

## Product Requirements Document (PRD)

### Executive Summary
QuickMirror eliminates "can you see/hear me?" moments by providing instant camera/microphone validation from the system tray.

### Target Users
- Remote workers using Teams, Zoom, Google Meet
- Anyone wanting quick appearance/audio checks before calls

### Core MVP Features

#### 1. System Tray Integration
- **Icon**: Custom tray icon for QuickMirror
- **Single-click**: Opens main interface window
- **Right-click menu**: "Open QuickMirror", "Exit"
- **Hide behavior**: Close window hides to tray (doesn't exit)

#### 2. Main Interface (Ultra-Simple)
```
┌─────────────────────────────┐
│ QuickMirror            [×] │
├─────────────────────────────┤
│                             │
│    [Camera Preview Area]    │
│         280x180px           │
│                             │
├─────────────────────────────┤
│ Camera: [Dropdown ▼]        │
│ Microphone: [Dropdown ▼]    │
│ Audio: [████████░░] 80%     │
│ Status: Camera OK           │
└─────────────────────────────┘
```
- **Window Size**: Fixed 320x300px
- **Position**: Center screen
- **Resizable**: No
- **Always on top**: No

#### 3. Camera Preview
- **Live feed**: Real-time camera preview
- **Device selection**: Dropdown if multiple cameras available
- **Status display**: "Camera OK", "Camera In Use", "No Camera"
- **Error handling**: Clear messages for common issues

#### 4. Audio Testing
- **Real-time meter**: Horizontal progress bar showing mic levels
- **Device selection**: Dropdown if multiple microphones
- **Visual feedback**: Smooth level updates
- **No recording**: Just level display for MVP

#### 5. Installation & Updates
- **MSI Installer**: Windows Installer package
- **Auto-updater**: Check GitHub releases on startup
- **Uninstaller**: Standard Windows Add/Remove Programs
- **Update notification**: Simple dialog with download link

### Technical Requirements

#### Platform Support
- **Windows 10** (1903+) and **Windows 11**
- **Architecture**: x64 and ARM64
- **Permissions**: Camera and microphone access

#### Performance Targets
- **Memory**: <30MB active, <20MB hibernated
- **CPU**: <5% active, <1% hibernated
- **Startup**: <1 second window open time

#### Installation Features
- Start menu shortcut
- Optional desktop shortcut
- Optional auto-start with Windows
- Complete uninstall capability

---

## Technical Implementation Details

### Technology Stack
- **Frontend**: Vanilla TypeScript + HTML + CSS (no frameworks)
- **Backend**: Rust (Tauri framework)
- **Bundler**: Tauri MSI bundler (built-in)
- **Updates**: Tauri updater plugin with GitHub releases
- **Media**: WebRTC getUserMedia API + Web Audio API

### Project Structure
```
quickmirror/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs           # Main app + system tray
│   │   ├── lib.rs            # Library exports
│   │   └── commands.rs       # Tauri commands
│   ├── Cargo.toml            # Rust dependencies
│   ├── tauri.conf.json       # App config + updater
│   └── icons/                # App icons
├── src/
│   ├── index.html            # Single HTML file
│   ├── main.ts               # Main TypeScript logic
│   ├── camera.ts             # Camera management
│   ├── audio.ts              # Audio visualization
│   └── style.css             # Simple styling
├── package.json              # Node dependencies
└── vite.config.ts            # Build config
```

### Key Dependencies

#### Frontend (package.json)
```json
{
  "name": "quickmirror",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tauri dev",
    "build": "tauri build",
    "bundle": "tauri build --bundles msi"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.0.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

#### Backend (Cargo.toml)
```toml
[package]
name = "quickmirror"
version = "1.0.0"
edition = "2021"

[dependencies]
tauri = { version = "2.0", features = ["system-tray", "updater"] }
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.0", features = ["macros"] }

[dependencies.windows]
version = "0.54"
features = [
  "Win32_Media_MediaFoundation",
  "Win32_System_Com"
]
```

### Configuration Files

#### Tauri Config (tauri.conf.json)
```json
{
  "productName": "QuickMirror",
  "version": "1.0.0",
  "identifier": "com.quickmirror.app",
  "app": {
    "windows": [
      {
        "label": "main",
        "width": 320,
        "height": 300,
        "resizable": false,
        "center": true,
        "title": "QuickMirror",
        "visible": false,
        "skipTaskbar": true
      }
    ]
  },
  "bundle": {
    "active": true,
    "category": "Utility",
    "targets": ["msi"],
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256"
    }
  },
  "updater": {
    "active": true,
    "endpoints": ["https://github.com/USERNAME/quickmirror/releases/latest/download/latest.json"],
    "dialog": true
  },
  "systemTray": {
    "iconPath": "icons/icon.ico",
    "iconAsTemplate": false
  }
}
```

---

## Implementation Guide

### Development Timeline (8 Hours)

#### Phase 1: Project Setup (1 hour)
1. Initialize Tauri project with vanilla TypeScript template
2. Configure system tray in tauri.conf.json
3. Set up basic window that shows/hides
4. Test tray click functionality

#### Phase 2: System Tray Logic (1 hour)
1. Implement system tray menu (Open, Exit)
2. Handle left-click to show window
3. Handle window close to hide (not exit)
4. Test tray behavior

#### Phase 3: Camera Preview (2 hours)
1. Create camera preview HTML video element
2. Implement getUserMedia for camera access
3. Add camera device enumeration and selection
4. Handle camera errors and in-use detection
5. Test with multiple cameras

#### Phase 4: Audio Visualization (2 hours)
1. Set up Web Audio API for microphone access
2. Create real-time audio level visualization
3. Implement microphone device selection
4. Add smooth progress bar animation
5. Test audio level responsiveness

#### Phase 5: Polish & Package (1.5 hours)
1. Style the interface with simple CSS
2. Add status messages and error handling
3. Test hibernation behavior (resource release)
4. Final UI polish and testing

#### Phase 6: Installer & Updates (0.5 hours)
1. Configure MSI bundling
2. Set up GitHub releases updater
3. Test installer generation
4. Create initial release

### Core Implementation Patterns

#### System Tray (Rust)
```rust
use tauri::{SystemTray, SystemTrayMenu, SystemTrayMenuItem, SystemTrayEvent};

fn main() {
    let tray_menu = SystemTrayMenu::new()
        .add_item(SystemTrayMenuItem::new("Open QuickMirror", "show"))
        .add_native_item(SystemTrayMenuItemType::Separator)
        .add_item(SystemTrayMenuItem::new("Exit", "quit"));

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| {
            match event {
                SystemTrayEvent::LeftClick { .. } => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                SystemTrayEvent::MenuItemClick { id, .. } => {
                    match id.as_str() {
                        "show" => {
                            let window = app.get_window("main").unwrap();
                            window.show().unwrap();
                        }
                        "quit" => std::process::exit(0),
                        _ => {}
                    }
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("Failed to run app");
}
```

#### Camera Management (TypeScript)
```typescript
export class CameraManager {
    private video: HTMLVideoElement;
    private stream: MediaStream | null = null;
    private currentDeviceId: string | null = null;

    constructor(videoElement: HTMLVideoElement) {
        this.video = videoElement;
    }

    async startCamera(deviceId?: string): Promise<void> {
        try {
            const constraints: MediaStreamConstraints = {
                video: {
                    width: 280,
                    height: 180,
                    deviceId: deviceId ? { exact: deviceId } : undefined
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            await this.video.play();
            this.currentDeviceId = deviceId || null;
            this.updateStatus('Camera OK');
        } catch (error) {
            console.error('Camera access failed:', error);
            if (error.name === 'NotAllowedError') {
                this.updateStatus('Camera permission denied');
            } else if (error.name === 'NotFoundError') {
                this.updateStatus('No camera found');
            } else {
                this.updateStatus('Camera unavailable');
            }
        }
    }

    stopCamera(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            this.video.srcObject = null;
            this.updateStatus('Camera stopped');
        }
    }

    async getDevices(): Promise<MediaDeviceInfo[]> {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => device.kind === 'videoinput');
    }

    private updateStatus(message: string): void {
        const statusElement = document.getElementById('camera-status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }
}
```

#### Audio Visualization (TypeScript)
```typescript
export class AudioManager {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private microphone: MediaStreamAudioSourceNode | null = null;
    private dataArray: Uint8Array | null = null;
    private animationId: number | null = null;

    async initialize(deviceId?: string): Promise<void> {
        try {
            const constraints: MediaStreamConstraints = {
                audio: {
                    deviceId: deviceId ? { exact: deviceId } : undefined
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            this.audioContext = new AudioContext();
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            
            this.microphone.connect(this.analyser);
            this.analyser.fftSize = 256;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
            this.updateLevel();
        } catch (error) {
            console.error('Audio access failed:', error);
            this.updateAudioStatus('Microphone unavailable');
        }
    }

    private updateLevel(): void {
        if (!this.analyser || !this.dataArray) return;

        this.analyser.getByteFrequencyData(this.dataArray);
        const average = this.dataArray.reduce((a, b) => a + b) / this.dataArray.length;
        const level = Math.min(100, (average / 128) * 100);
        
        const progressBar = document.getElementById('audio-level') as HTMLProgressElement;
        if (progressBar) {
            progressBar.value = level;
        }
        
        this.animationId = requestAnimationFrame(() => this.updateLevel());
    }

    stop(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.microphone) {
            this.microphone.disconnect();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
    }

    async getDevices(): Promise<MediaDeviceInfo[]> {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => device.kind === 'audioinput');
    }

    private updateAudioStatus(message: string): void {
        console.log('Audio status:', message);
    }
}
```

#### Basic HTML Structure
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>QuickMirror</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="title">QuickMirror</span>
            <button id="close-btn" class="close-btn">×</button>
        </div>
        
        <div class="camera-section">
            <video id="camera-preview" autoplay muted></video>
        </div>
        
        <div class="controls">
            <div class="control-row">
                <label for="camera-select">Camera:</label>
                <select id="camera-select"></select>
            </div>
            
            <div class="control-row">
                <label for="mic-select">Microphone:</label>
                <select id="mic-select"></select>
            </div>
            
            <div class="control-row">
                <label>Audio:</label>
                <progress id="audio-level" max="100" value="0"></progress>
            </div>
            
            <div class="status-row">
                <span id="camera-status">Initializing...</span>
            </div>
        </div>
    </div>
    
    <script type="module" src="main.ts"></script>
</body>
</html>
```

---

## AI Agent Instructions

### Primary Development Tasks
1. **Set up Tauri project** with vanilla TypeScript template
2. **Implement system tray** with show/hide behavior
3. **Create camera preview** with device selection
4. **Add audio visualization** with microphone selection
5. **Configure MSI installer** and updater system
6. **Test and polish** the complete application

### Key Implementation Notes
- Keep UI extremely simple - fixed layout, no complex interactions
- Use Web APIs for camera/audio - no additional libraries needed
- Focus on reliability over features for this MVP
- Ensure proper resource cleanup when window closes
- Test with multiple cameras and microphones if available

### Error Handling Priorities
1. Camera permission denied
2. Camera in use by another app
3. No camera/microphone found
4. Device switching failures

### Build Commands
```bash
npm run dev          # Development with hot reload
npm run build        # Production build
npm run bundle       # Generate MSI installer
```

### Success Criteria
- ✅ App starts in system tray
- ✅ Single click opens camera preview
- ✅ Camera and microphone selection works
- ✅ Audio levels display in real-time
- ✅ Close button hides to tray
- ✅ MSI installer generates successfully
- ✅ Memory usage under 30MB when active

---

This briefing document contains everything needed to build QuickMirror in a single evening using AI-assisted development.