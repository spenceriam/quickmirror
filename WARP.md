# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

QuickMirror is a Windows system tray utility built with Tauri + Vanilla TypeScript that provides instant camera/microphone validation before video calls. It's designed as an 8-hour MVP build targeting Windows 10/11 users who need quick appearance/audio checks.

## Architecture

### Technology Stack
- **Frontend**: Vanilla TypeScript + HTML + CSS (no React/frameworks)
- **Backend**: Rust with Tauri framework v2.0
- **Bundler**: Tauri MSI bundler for Windows installation
- **Updates**: Tauri updater plugin with GitHub releases
- **Media APIs**: WebRTC getUserMedia API + Web Audio API

### Project Structure
```
quickmirror/
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # System tray + window management
│   │   ├── lib.rs          # Library exports
│   │   └── commands.rs     # Tauri commands for frontend
│   ├── Cargo.toml          # Rust dependencies
│   ├── tauri.conf.json     # App config + updater settings
│   └── icons/              # System tray + app icons
├── src/                    # Frontend TypeScript
│   ├── index.html          # Single HTML interface
│   ├── main.ts             # App initialization + UI logic
│   ├── camera.ts           # Camera device management
│   ├── audio.ts            # Audio visualization + mic handling
│   └── style.css           # Simple fixed-layout styling
├── package.json            # Node.js dependencies + scripts
└── vite.config.ts          # Build configuration
```

### Core Architecture Patterns

#### System Tray Integration
- Single-click opens main window (show/focus)
- Right-click menu: "Open QuickMirror", "Exit"
- Window close hides to tray (doesn't exit application)
- Uses Tauri's SystemTray API with custom menu handling

#### Media Device Management
- **Camera**: WebRTC getUserMedia for live preview (280x180px)
- **Audio**: Web Audio API analyser for real-time level visualization
- **Device Selection**: Dropdown menus for multiple cameras/microphones
- **Resource Cleanup**: Proper stream disposal when window hidden

#### Window Management
- Fixed 320x300px window, non-resizable, centered
- Hidden on startup (launches to tray only)
- skipTaskbar: true to prevent taskbar appearance

## Development Commands

### Core Development
```powershell
# Install Tauri CLI and dependencies
npm install

# Development with hot reload
npm run dev

# Production build
npm run build

# Generate MSI installer
npm run bundle
# or
tauri build --bundles msi
```

### Project Initialization (if not done)
```powershell
# Create new Tauri project with vanilla TypeScript
npm create tauri-app@latest quickmirror --template vanilla-ts

# Install system tray and updater features
cargo add tauri --features system-tray,updater
```

### Testing & Validation
```powershell
# Test camera/microphone access in development
npm run dev

# Validate MSI installer generation
npm run bundle
# Check: src-tauri/target/release/bundle/msi/

# Test system tray behavior
# - Verify tray icon appears
# - Test left-click (show window)
# - Test right-click menu
# - Verify close hides to tray
```

## Key Implementation Details

### Critical Tauri Configuration
The `tauri.conf.json` must include:
- `systemTray` configuration with icon path
- Window `visible: false` and `skipTaskbar: true`
- MSI bundler settings for Windows installation
- Updater endpoints for GitHub releases

### Essential Frontend Classes
- **CameraManager**: Device enumeration, stream management, error handling
- **AudioManager**: Real-time level analysis, device selection, visualization
- **Main App**: UI initialization, device dropdown population, status updates

### Performance Targets
- Memory: <30MB active, <20MB when hidden
- CPU: <5% active, <1% when hidden  
- Startup: <1 second window open time

### Error Handling Priority
1. Camera permission denied
2. Camera in use by another application
3. No camera/microphone devices found
4. Device switching failures
5. Resource cleanup on window hide

### Resource Management
- **Camera streams**: Stop all tracks when window closes/hides
- **Audio context**: Close AudioContext to free resources
- **Animation frames**: Cancel requestAnimationFrame loops
- **Device listeners**: Clean up mediaDevices event handlers

## Build & Distribution

### MSI Installer Features
- Start menu shortcut creation
- Optional desktop shortcut
- Optional Windows startup registration
- Complete uninstall via Add/Remove Programs
- Windows Installer (.msi) format for enterprise compatibility

### Auto-updater Integration
- Check GitHub releases on app startup
- Dialog-based update notification
- Automatic download of new versions
- Requires GitHub release with proper update manifest

### Windows Compatibility
- **Target**: Windows 10 (1903+) and Windows 11
- **Architecture**: x64 and ARM64 builds
- **Permissions**: Camera and microphone access required

## Development Guidelines

### UI Constraints
- Keep interface ultra-simple: fixed layout, minimal interactions  
- 320x300px window size (non-resizable)
- Camera preview exactly 280x180px
- Horizontal progress bar for audio levels
- Status text for camera state feedback

### Code Organization
- Use vanilla TypeScript classes (no frameworks)
- Separate concerns: camera.ts, audio.ts, main.ts
- Keep Rust backend minimal: focus on system tray logic
- No additional libraries beyond Tauri requirements

### Testing Approach
- Test with multiple camera devices if available
- Verify microphone level responsiveness
- Test system tray behavior across Windows versions
- Validate resource cleanup when switching devices
- Ensure MSI installer works on clean Windows systems

## Common Issues & Solutions

### Camera Access Problems
- Check Windows camera privacy settings
- Verify camera not in use by other applications
- Test with different camera devices if available
- Handle getUserMedia promise rejections properly

### System Tray Issues
- Ensure icon file exists at specified path
- Verify SystemTray import in main.rs
- Test tray menu item click handlers
- Check window show/hide state management

### Build Problems
- Verify Rust toolchain supports Windows targets
- Check Tauri CLI version compatibility (v2.0)
- Ensure all dependencies in Cargo.toml and package.json
- Validate tauri.conf.json syntax

This WARP.md focuses on the unique aspects of building a Tauri-based Windows system tray application with media device integration, avoiding generic development practices while highlighting the specific architectural decisions and constraints of QuickMirror.
