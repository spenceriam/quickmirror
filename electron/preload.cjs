const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeToTray: () => {
    ipcRenderer.send('minimize-to-tray');
  },
  maximizeWindow: () => {
    ipcRenderer.send('maximize-window');
  },
  closeWindow: () => {
    ipcRenderer.send('close-window');
  },
  // Anchor operations
  setAnchorState: (anchored) => {
    ipcRenderer.send('set-anchor-state', anchored);
  },
  getAnchorState: () => {
    return new Promise((resolve) => {
      ipcRenderer.once('anchor-state-response', (event, anchored) => {
        resolve(anchored);
      });
      ipcRenderer.send('get-anchor-state');
    });
  },
  resetPosition: () => {
    ipcRenderer.send('reset-position');
  },
  onAnchorStateChanged: (callback) => {
    ipcRenderer.on('anchor-state-changed', (event, anchored) => callback(anchored));
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
