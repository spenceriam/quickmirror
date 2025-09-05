const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // System tray quick actions
  onQuickCameraTest: (callback) => {
    ipcRenderer.on('quick-camera-test', callback);
  },
  onQuickMicrophoneTest: (callback) => {
    ipcRenderer.on('quick-microphone-test', callback);
  },
  
  // Window controls
  minimizeToTray: () => {
    ipcRenderer.send('minimize-to-tray');
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Platform detection
contextBridge.exposeInMainWorld('platform', {
  isWindows: process.platform === 'win32',
  isMac: process.platform === 'darwin',
  isLinux: process.platform === 'linux'
});

// Version info
contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
});
