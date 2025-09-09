const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, globalShortcut } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
try {
  if (require('electron-squirrel-startup')) {
    app.quit();
  }
} catch (error) {
  // electron-squirrel-startup not available, continue normally
}

let mainWindow;
let tray;
let isAnchored = true; // Start anchored as per requirement
let centerPosition = null; // Store center position when anchored

// Window positioning utilities
function getTaskbarInfo() {
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { workArea, bounds } = primaryDisplay;
  
  // Calculate taskbar position and height
  const taskbarHeight = bounds.height - workArea.height;
  const taskbarWidth = bounds.width - workArea.width;
  
  return {
    workArea,
    bounds,
    taskbarHeight: Math.max(taskbarHeight, 0),
    taskbarWidth: Math.max(taskbarWidth, 0),
    taskbarPosition: {
      bottom: workArea.y + workArea.height < bounds.height,
      top: workArea.y > 0,
      left: workArea.x > 0,
      right: workArea.x + workArea.width < bounds.width
    }
  };
}

function positionWindowBottomRight() {
  if (!mainWindow) return;
  
  const { workArea } = getTaskbarInfo();
  const [windowWidth, windowHeight] = mainWindow.getSize();
  const padding = 20; // Distance from screen edge
  
  const x = workArea.x + workArea.width - windowWidth - padding;
  const y = workArea.y + workArea.height - windowHeight - padding;
  
  mainWindow.setPosition(x, y);
}

function positionWindowCenter() {
  if (!mainWindow) return;
  
  if (centerPosition) {
    // Restore saved center position
    mainWindow.setPosition(centerPosition.x, centerPosition.y);
  } else {
    // Calculate center position
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { bounds } = primaryDisplay;
    const [windowWidth, windowHeight] = mainWindow.getSize();
    
    const x = Math.floor((bounds.width - windowWidth) / 2);
    const y = Math.floor((bounds.height - windowHeight) / 2);
    
    mainWindow.setPosition(x, y);
  }
}

function setAnchorState(anchored) {
  if (isAnchored === anchored) return;
  
  isAnchored = anchored;
  
  if (anchored) {
    // Save current position as center position before anchoring
    const [x, y] = mainWindow.getPosition();
    centerPosition = { x, y };
    
    // Move to bottom-right
    positionWindowBottomRight();
    
    // Make window non-movable
    mainWindow.setMovable(false);
  } else {
    // Make window movable
    mainWindow.setMovable(true);
    
    // Move to center
    positionWindowCenter();
  }
  
  // Notify renderer process
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('anchor-state-changed', anchored);
  }
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 640,
    height: 360,
    minWidth: 480,
    minHeight: 270,
    frame: false, // Remove native window frame
    transparent: true, // Enable transparency for rounded corners
    hasShadow: true, // Enable drop shadow
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, '../src-tauri/icons/icon.ico'),
    show: false, // Don't show until positioned
    skipTaskbar: true, // Don't show in taskbar initially
    resizable: true,
    center: false, // Don't center the window
    roundedCorners: true, // Windows 11 rounded corners
    titleBarStyle: 'hidden' // Hide title bar but keep window controls
  });

  // Load the built frontend
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Hide window when closed, don't quit the app
  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  // Show/hide from taskbar based on window visibility
  mainWindow.on('show', () => {
    mainWindow.setSkipTaskbar(false);
  });

  mainWindow.on('hide', () => {
    mainWindow.setSkipTaskbar(true);
  });
  
  // Position window at bottom-right on startup (anchored by default)
  mainWindow.once('ready-to-show', () => {
    // Small delay to ensure window is fully initialized
    setTimeout(() => {
      positionWindowBottomRight();
      mainWindow.setMovable(false); // Start as non-movable since anchored
      mainWindow.show(); // Show window after positioning
      console.log('Window positioned at bottom-right, anchored, and shown');
    }, 100);
  });
};

const createTray = () => {
  // Create system tray icon
  const iconPath = path.join(__dirname, '../src-tauri/icons/32x32.png');
  let trayIcon;
  
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      // Fallback to ICO if PNG fails
      trayIcon = nativeImage.createFromPath(path.join(__dirname, '../src-tauri/icons/icon.ico'));
    }
  } catch (error) {
    console.warn('Could not load tray icon:', error);
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  
  // Set tooltip
  tray.setToolTip('QuikMirror - Camera & Microphone Checker');
  
  // Create context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show QuikMirror',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: 'Hide QuikMirror',
      click: () => {
        mainWindow.hide();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  
  // Double-click to show/hide window
  tray.on('double-click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
};

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  const { screen } = require('electron');
  
  createWindow();
  createTray();
  
  // Listen for display changes to reposition anchored window
  screen.on('display-added', () => {
    if (isAnchored && mainWindow) {
      setTimeout(() => positionWindowBottomRight(), 100);
    }
  });
  
  screen.on('display-removed', () => {
    if (isAnchored && mainWindow) {
      setTimeout(() => positionWindowBottomRight(), 100);
    }
  });
  
  screen.on('display-metrics-changed', () => {
    if (isAnchored && mainWindow) {
      setTimeout(() => positionWindowBottomRight(), 100);
    }
  });
  
  // IPC handlers for window controls
  ipcMain.on('minimize-to-tray', () => {
    if (mainWindow) mainWindow.hide();
  });

  ipcMain.on('maximize-window', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });

  ipcMain.on('close-window', () => {
    if (mainWindow) mainWindow.hide();
  });
  
  // Anchor functionality IPC handlers
  ipcMain.on('set-anchor-state', (event, anchored) => {
    setAnchorState(anchored);
  });
  
  ipcMain.on('get-anchor-state', (event) => {
    event.reply('anchor-state-response', isAnchored);
  });
  
  ipcMain.on('reset-position', () => {
    positionWindowCenter();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (!app.isQuiting) {
      // Don't quit, just hide to tray
      return;
    }
    app.quit();
  }
});

// Function to position window to bottom-right corner
function positionToBottomRight() {
  if (!mainWindow) return;
  
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const { x: screenX, y: screenY } = primaryDisplay.workArea;
  
  const windowBounds = mainWindow.getBounds();
  const margin = 20; // Distance from screen edge
  
  // Position at bottom-right, above taskbar
  const newX = screenX + screenWidth - windowBounds.width - margin;
  const newY = screenY + screenHeight - windowBounds.height - margin;
  
  mainWindow.setPosition(newX, newY);
  console.log(`Positioned window to bottom-right: ${newX}, ${newY}`);
}

// Clean up global shortcuts when app quits
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// macOS specific behavior
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, url) => {
    navigationEvent.preventDefault();
    console.log('Blocked navigation to:', url);
  });
});
