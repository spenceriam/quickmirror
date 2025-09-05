// QuickMirror main TypeScript entry point
import { CameraManager } from './camera';
import { AudioManager } from './audio';

// Declare Electron API types
declare global {
  interface Window {
    electronAPI?: {
      onQuickCameraTest: (callback: () => void) => void;
      onQuickMicrophoneTest: (callback: () => void) => void;
      minimizeToTray: () => void;
      removeAllListeners: (channel: string) => void;
    };
    platform?: {
      isWindows: boolean;
      isMac: boolean;
      isLinux: boolean;
    };
  }
}

let cameraManager: CameraManager | null = null;
let audioManager: AudioManager | null = null;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('QuickMirror initializing...');
  
  // Get UI elements
  const videoElement = document.getElementById('camera-preview') as HTMLVideoElement;
  const appContainer = document.getElementById('app-container');
  const minimizeButton = document.getElementById('minimize-btn');
  const maximizeButton = document.getElementById('maximize-btn');
  const closeButton = document.getElementById('close-btn');
  const cameraSelect = document.getElementById('camera-select') as HTMLSelectElement;
  const micSelect = document.getElementById('mic-select') as HTMLSelectElement;
  const statusIndicator = document.getElementById('status-indicator');
  const audioVisualizer = document.getElementById('audio-visualizer');
  const visualizerBars = audioVisualizer?.querySelectorAll('.visualizer-bar') as NodeListOf<HTMLElement>;
  
  if (videoElement) {
    // Initialize camera manager
    cameraManager = new CameraManager(videoElement);
    
    // Try to populate camera devices and start default camera
    try {
      await populateCameraDevices();
      await cameraManager.startCamera();
    } catch (error) {
      console.error('Failed to initialize camera:', error);
    }
  }
  
  // Initialize audio manager for microphone visualization
  audioManager = new AudioManager();
  try {
    await populateMicrophoneDevices();
    await audioManager.initialize();
  } catch (error) {
    console.error('Failed to initialize audio:', error);
  }
  
  // Set up window controls
  if (minimizeButton && window.electronAPI) {
    minimizeButton.addEventListener('click', () => {
      console.log('Minimize button clicked');
      cleanup(); // Release devices before hiding
      window.electronAPI.minimizeToTray();
    });
  }
  
  if (maximizeButton && window.electronAPI) {
    maximizeButton.addEventListener('click', () => {
      console.log('Maximize button clicked');
      // For now, just hide to tray - could implement actual maximize later
      window.electronAPI.minimizeToTray();
    });
  }
  
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      console.log('Close button clicked - hiding to tray');
      if (window.electronAPI) {
        window.electronAPI.minimizeToTray();
      } else {
        window.close();
      }
    });
  }
  
  // Set up audio visualizer
  if (audioManager && visualizerBars) {
    startAudioVisualization();
  }
  
  // Set up status indicator behavior
  if (statusIndicator) {
    // Show status briefly on initialization
    statusIndicator.classList.add('show');
    setTimeout(() => {
      statusIndicator.classList.remove('show');
    }, 3000);
  }
  
  // Set up Electron API listeners if available
  if (window.electronAPI) {
    console.log('Electron API available - setting up tray listeners');
    
    // Listen for system tray quick actions
    window.electronAPI.onQuickCameraTest(() => {
      console.log('Quick camera test requested from tray');
      startCameraTest();
    });
    
    window.electronAPI.onQuickMicrophoneTest(() => {
      console.log('Quick microphone test requested from tray');
      startMicrophoneTest();
    });
  }
  
  // Set up camera device selection
  if (cameraSelect) {
    cameraSelect.addEventListener('change', async (event) => {
      const target = event.target as HTMLSelectElement;
      const deviceId = target.value;
      
      if (cameraManager && deviceId) {
        try {
          await cameraManager.switchCamera(deviceId);
        } catch (error) {
          console.error('Failed to switch camera:', error);
        }
      }
    });
  }
  
  // Set up microphone device selection
  if (micSelect) {
    micSelect.addEventListener('change', async (event) => {
      const target = event.target as HTMLSelectElement;
      const deviceId = target.value;
      
      if (audioManager && deviceId) {
        try {
          await audioManager.switchMicrophone(deviceId);
        } catch (error) {
          console.error('Failed to switch microphone:', error);
        }
      }
    });
  }
});

// Populate camera devices dropdown
async function populateCameraDevices(): Promise<void> {
  if (!cameraManager) return;
  
  const cameraSelect = document.getElementById('camera-select') as HTMLSelectElement;
  if (!cameraSelect) return;
  
  try {
    const devices = await cameraManager.getDevices();
    
    // Clear existing options
    cameraSelect.innerHTML = '';
    
    if (devices.length === 0) {
      const option = document.createElement('option');
      option.textContent = 'No cameras found';
      cameraSelect.appendChild(option);
      return;
    }
    
    // Sort devices - default first
    const sortedDevices = devices.sort((a, b) => {
      const aIsDefault = isDefaultDevice(a.label || '');
      const bIsDefault = isDefaultDevice(b.label || '');
      if (aIsDefault && !bIsDefault) return -1;
      if (!aIsDefault && bIsDefault) return 1;
      return 0;
    });
    
    // Add camera options
    sortedDevices.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      const deviceName = device.label || `Camera ${index + 1}`;
      const cleanedName = cleanDeviceName(deviceName);
      option.textContent = cleanedName; // Cleaned name in dropdown
      option.title = cleanedName; // Full cleaned name on hover
      cameraSelect.appendChild(option);
    });
    
  } catch (error) {
    console.error('Failed to populate camera devices:', error);
  }
}

// Populate microphone devices dropdown
async function populateMicrophoneDevices(): Promise<void> {
  if (!audioManager) return;
  
  const micSelect = document.getElementById('mic-select') as HTMLSelectElement;
  if (!micSelect) return;
  
  try {
    const devices = await audioManager.getDevices();
    
    // Clear existing options
    micSelect.innerHTML = '';
    
    if (devices.length === 0) {
      const option = document.createElement('option');
      option.textContent = 'No microphones found';
      micSelect.appendChild(option);
      return;
    }
    
    // Sort devices - default first
    const sortedDevices = devices.sort((a, b) => {
      const aIsDefault = isDefaultDevice(a.label || '');
      const bIsDefault = isDefaultDevice(b.label || '');
      if (aIsDefault && !bIsDefault) return -1;
      if (!aIsDefault && bIsDefault) return 1;
      return 0;
    });
    
    // Add microphone options
    sortedDevices.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      const deviceName = device.label || `Microphone ${index + 1}`;
      const cleanedName = cleanDeviceName(deviceName);
      option.textContent = cleanedName; // Cleaned name in dropdown
      option.title = cleanedName; // Full cleaned name on hover
      micSelect.appendChild(option);
    });
    
  } catch (error) {
    console.error('Failed to populate microphone devices:', error);
  }
}

// Cleanup function for when window closes/hides
function cleanup(): void {
  if (cameraManager) {
    cameraManager.stopCamera();
  }
  if (audioManager) {
    audioManager.stop();
  }
}

// Set up cleanup on window beforeunload
window.addEventListener('beforeunload', cleanup);

// Helper functions for tray quick actions
function startCameraTest(): void {
  if (cameraManager) {
    console.log('Starting camera test...');
    cameraManager.startCamera().catch(error => {
      console.error('Failed to start camera test:', error);
    });
  }
}

function startMicrophoneTest(): void {
  if (audioManager) {
    console.log('Starting microphone test...');
    audioManager.initialize().catch(error => {
      console.error('Failed to start microphone test:', error);
    });
  }
}

// Audio visualizer function - 4 bars
function startAudioVisualization(): void {
  const audioVisualizer = document.getElementById('audio-visualizer');
  const visualizerBars = audioVisualizer?.querySelectorAll('.visualizer-bar') as NodeListOf<HTMLElement>;
  
  if (!visualizerBars || !audioManager) return;
  
  function updateVisualizer(): void {
    if (!audioManager) return;
    
    try {
      // Get audio level from audio manager (0-100)
      const audioLevel = audioManager.getAudioLevel ? audioManager.getAudioLevel() : 0;
      
      // Update visualizer bars based on audio level
      visualizerBars.forEach((bar, index) => {
        const threshold = (index + 1) * (100 / visualizerBars.length);
        const isActive = audioLevel > threshold;
        
        if (isActive) {
          const height = Math.min(24, (audioLevel / 100) * 24 + 4);
          bar.style.height = `${height}px`;
          bar.classList.add('active');
        } else {
          bar.style.height = '4px';
          bar.classList.remove('active');
        }
      });
    } catch (error) {
      // Silently handle errors to avoid spam
    }
    
    requestAnimationFrame(updateVisualizer);
  }
  
  updateVisualizer();
}

// Utility function to clean device names
function cleanDeviceName(name: string): string {
  // Remove "Default - " prefix if present
  let cleaned = name.replace(/^Default\s*-\s*/i, '');
  return cleaned.trim();
}

// Utility function to truncate device names for display
function truncateDeviceName(name: string, maxLength: number = 20): string {
  const cleaned = cleanDeviceName(name);
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return cleaned.substring(0, maxLength) + '...';
}

// Check if device is default
function isDefaultDevice(name: string): boolean {
  return name.toLowerCase().includes('default');
}

console.log('QuickMirror main.ts loaded with Electron support');
