// QuickMirror main TypeScript entry point
import { CameraManager } from './camera';

let cameraManager: CameraManager | null = null;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('QuickMirror initializing...');
  
  // Get UI elements
  const videoElement = document.getElementById('camera-preview') as HTMLVideoElement;
  const closeButton = document.getElementById('close-btn');
  const cameraSelect = document.getElementById('camera-select') as HTMLSelectElement;
  
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
  
  // Set up close button (hide to tray behavior)
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      // Note: In full Tauri app, this would hide to system tray
      console.log('Close button clicked - would hide to tray');
      window.close();
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
    
    // Add camera options
    devices.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `Camera ${index + 1}`;
      cameraSelect.appendChild(option);
    });
    
  } catch (error) {
    console.error('Failed to populate camera devices:', error);
  }
}

// Cleanup function for when window closes/hides
function cleanup(): void {
  if (cameraManager) {
    cameraManager.stopCamera();
  }
}

// Set up cleanup on window beforeunload
window.addEventListener('beforeunload', cleanup);

console.log('QuickMirror main.ts loaded');
