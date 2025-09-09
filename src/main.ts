// QuikMirror main TypeScript entry point
import { CameraManager } from './camera';

// Declare Electron API types
declare global {
  interface Window {
    electronAPI?: {
      minimizeToTray: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      setAnchorState: (anchored: boolean) => void;
      getAnchorState: () => Promise<boolean>;
      resetPosition: () => void;
      onAnchorStateChanged: (callback: (anchored: boolean) => void) => void;
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
let isAnchored = false; // Track anchor state in renderer
let anchorButton: HTMLButtonElement | null = null;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('QuikMirror initializing...');
  
  // Get UI elements
  const videoElement = document.getElementById('camera-preview') as HTMLVideoElement;
  const appContainer = document.getElementById('app-container');
  const minimizeButton = document.getElementById('minimize-btn');
  const maximizeButton = document.getElementById('maximize-btn');
  const closeButton = document.getElementById('close-btn');
  const cameraSelect = document.getElementById('camera-select') as HTMLSelectElement;
  const statusIndicator = document.getElementById('status-indicator');
  anchorButton = document.getElementById('anchor-btn') as HTMLButtonElement;
  
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
      window.electronAPI.maximizeWindow();
    });
  }
  
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      console.log('Close button clicked');
      if (window.electronAPI) {
        window.electronAPI.closeWindow();
      } else {
        window.close();
      }
    });
  }
  
  // Set up anchor button
  if (anchorButton && window.electronAPI) {
    anchorButton.addEventListener('click', async () => {
      console.log('Anchor button clicked');
      const newAnchorState = !isAnchored;
      window.electronAPI.setAnchorState(newAnchorState);
    });
    
    // Initialize anchor state from main process
    try {
      isAnchored = await window.electronAPI.getAnchorState();
      updateAnchorButtonState();
    } catch (error) {
      console.error('Failed to get initial anchor state:', error);
    }
    
    // Listen for anchor state changes from main process
    window.electronAPI.onAnchorStateChanged((anchored) => {
      isAnchored = anchored;
      updateAnchorButtonState();
    });
  }
  
  // Set up status indicator behavior (hidden by default)
  if (statusIndicator) {
    // Keep status indicator hidden unless there's an error
    statusIndicator.classList.remove('show');
  }
  
  
  // Native select change handlers are replaced by custom dropdown events
  
});

// Populate camera devices dropdown (and custom dropdown UI)
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
      ensureCustomSelect(cameraSelect, async (deviceId) => {
        if (cameraManager && deviceId) {
          await cameraManager.switchCamera(deviceId);
        }
      });
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
      const truncatedName = truncateDeviceName(cleanedName);
      option.textContent = truncatedName; // Truncated name in native select (hidden)
      option.title = cleanedName; // Full name on hover
      option.setAttribute('data-full-name', cleanedName); // Store full name
      cameraSelect.appendChild(option);
    });

    // Initialize or refresh custom dropdown linked to cameraSelect
    ensureCustomSelect(cameraSelect, async (deviceId) => {
      if (cameraManager && deviceId) {
        await cameraManager.switchCamera(deviceId);
      }
    });
    
  } catch (error) {
    console.error('Failed to populate camera devices:', error);
  }
}

// Microphone support removed

// Cleanup function for when window closes/hides
function cleanup(): void {
  if (cameraManager) {
    cameraManager.stopCamera();
  }
}

// Set up cleanup on window beforeunload
window.addEventListener('beforeunload', cleanup);


  
  
    
      
      
        
        
    
  

// Utility function to clean device names
function cleanDeviceName(name: string): string {
  // Remove "Default - " prefix if present
  let cleaned = name.replace(/^Default\s*-\s*/i, '');
  return cleaned.trim();
}

// Utility function to truncate device names for display
function truncateDeviceName(name: string, maxLength: number = 30): string {
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

// Custom dropdown implementation
class CustomSelect {
  private select: HTMLSelectElement;
  private container: HTMLDivElement;
  private trigger: HTMLDivElement;
  private menu: HTMLDivElement;
  private onSelect: (value: string) => void;
  private isOpen = false;

  constructor(select: HTMLSelectElement, onSelect: (value: string) => void) {
    this.select = select;
    this.onSelect = onSelect;
    this.container = document.createElement('div');
    this.container.className = 'custom-select';

    // Insert container before the select and move select inside
    this.select.classList.add('native-select-hidden');
    const parent = this.select.parentElement!;
    parent.insertBefore(this.container, this.select);
    this.container.appendChild(this.select);

    // Create trigger
    this.trigger = document.createElement('div');
    this.trigger.className = 'custom-select__trigger';
    this.trigger.tabIndex = 0;

    const caret = document.createElement('span');
    caret.className = 'custom-select__caret';
    caret.textContent = '▾';

    this.trigger.appendChild(document.createElement('span'));
    this.trigger.appendChild(caret);

    // Create menu
    this.menu = document.createElement('div');
    this.menu.className = 'custom-select__menu';

    this.container.appendChild(this.trigger);
    this.container.appendChild(this.menu);

    this.buildMenuItems();
    this.syncTriggerLabel();

    // Events
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Prevent window dragging when interacting with menu
    this.menu.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    document.addEventListener('click', () => this.close());

    this.select.addEventListener('change', () => {
      // If value changed programmatically, sync trigger
      this.syncTriggerLabel();
      this.highlightActive();
    });
  }

  refresh() {
    this.buildMenuItems();
    this.syncTriggerLabel();
  }

  private buildMenuItems() {
    this.menu.innerHTML = '';
    const options = Array.from(this.select.options);
    options.forEach((opt, index) => {
      const item = document.createElement('div');
      item.className = 'custom-select__item';
      const fullName = opt.getAttribute('data-full-name') || opt.textContent || '';
      item.textContent = fullName; // full label with wrapping
      item.setAttribute('data-value', opt.value);
      item.setAttribute('role', 'option');
      item.title = fullName;

      item.addEventListener('click', async (e) => {
        e.stopPropagation();
        const value = opt.value;
        if (this.select.value !== value) {
          this.select.value = value;
          this.syncTriggerLabel();
          this.highlightActive();
          await this.onSelect(value);
        }
        this.close();
      });

      this.menu.appendChild(item);
    });

    this.highlightActive();
  }

  private syncTriggerLabel() {
    const selected = this.select.options[this.select.selectedIndex];
    const full = selected?.getAttribute('data-full-name') || selected?.textContent || '';
    const truncated = truncateDeviceName(full);
    (this.trigger.firstChild as HTMLElement).textContent = truncated;
  }

  private highlightActive() {
    const value = this.select.value;
    this.menu.querySelectorAll('.custom-select__item').forEach(el => {
      const item = el as HTMLElement;
      if (item.getAttribute('data-value') === value) item.classList.add('active');
      else item.classList.remove('active');
    });
  }

  private toggle() {
    this.isOpen ? this.close() : this.open();
  }

  private open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.container.classList.add('open');

    // Decide whether to open up or down based on available space
    const rect = this.trigger.getBoundingClientRect();
    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    const margin = 12; // small safety margin
    const spaceBelow = Math.max(0, viewportH - rect.bottom - margin);
    const spaceAbove = Math.max(0, rect.top - margin);

    const preferUp = spaceBelow < 160 && spaceAbove > spaceBelow; // heuristic
    this.container.classList.toggle('open-up', preferUp);

    const available = preferUp ? spaceAbove : spaceBelow;
    const maxH = Math.max(120, Math.min(260, available));
    this.menu.style.maxHeight = `${maxH}px`;
  }

  private close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.container.classList.remove('open');
  }
}

// Maintain instance for camera only
let cameraDropdown: CustomSelect | null = null;

function ensureCustomSelect(select: HTMLSelectElement, onSelect: (value: string) => void) {
  if (select.id === 'camera-select') {
    if (!cameraDropdown) cameraDropdown = new CustomSelect(select, onSelect);
    else cameraDropdown.refresh();
  }
}

// Helper function to update anchor button visual state
function updateAnchorButtonState(): void {
  const appContainer = document.getElementById('app-container');
  
  if (!anchorButton || !appContainer) return;
  
  if (isAnchored) {
    anchorButton.classList.add('anchored');
    anchorButton.title = 'Unanchor from bottom-right corner';
    appContainer.classList.add('anchored');
  } else {
    anchorButton.classList.remove('anchored');
    anchorButton.title = 'Anchor to bottom-right corner';
    appContainer.classList.remove('anchored');
  }
}

// Helper function to position window to bottom-right
function positionToBottomRight(): void {
  // This will be handled by the main process based on anchor state
  // For now, just update the visual state
  console.log('Positioning to bottom-right');
}

// Context menu implementation
function showContextMenu(x: number, y: number): void {
  // Remove any existing context menu
  const existingMenu = document.querySelector('.context-menu');
  if (existingMenu) {
    existingMenu.remove();
  }
  
  // Create context menu
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.position = 'fixed';
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.style.backgroundColor = 'rgba(40, 40, 40, 0.95)';
  menu.style.border = '1px solid #555';
  menu.style.borderRadius = '4px';
  menu.style.padding = '4px 0';
  menu.style.minWidth = '120px';
  menu.style.zIndex = '10000';
  menu.style.fontSize = '13px';
  menu.style.color = 'white';
  menu.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  menu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
  
  // Anchor/Unanchor menu item
  const anchorItem = document.createElement('div');
  anchorItem.className = 'context-menu-item';
  anchorItem.textContent = isAnchored ? 'Unanchor' : 'Anchor';
  anchorItem.style.padding = '6px 12px';
  anchorItem.style.cursor = 'pointer';
  anchorItem.style.transition = 'background-color 0.1s';
  
  anchorItem.addEventListener('mouseenter', () => {
    anchorItem.style.backgroundColor = 'rgba(100, 100, 100, 0.8)';
  });
  anchorItem.addEventListener('mouseleave', () => {
    anchorItem.style.backgroundColor = '';
  });
  
  anchorItem.addEventListener('click', () => {
    if (window.electronAPI) {
      const newAnchorState = !isAnchored;
      isAnchored = newAnchorState;
      window.electronAPI.setAnchorState(isAnchored);
      updateAnchorButtonState();
      
      if (isAnchored) {
        positionToBottomRight();
      } else {
        window.electronAPI.resetPosition();
      }
    }
    menu.remove();
  });
  
  // Reset position menu item
  const resetItem = document.createElement('div');
  resetItem.className = 'context-menu-item';
  resetItem.textContent = 'Reset Position';
  resetItem.style.padding = '6px 12px';
  resetItem.style.cursor = 'pointer';
  resetItem.style.transition = 'background-color 0.1s';
  
  resetItem.addEventListener('mouseenter', () => {
    resetItem.style.backgroundColor = 'rgba(100, 100, 100, 0.8)';
  });
  resetItem.addEventListener('mouseleave', () => {
    resetItem.style.backgroundColor = '';
  });
  
  resetItem.addEventListener('click', () => {
    if (window.electronAPI) {
      window.electronAPI.resetPosition();
      // The anchor state will be updated by the main process
    }
    menu.remove();
  });
  
  menu.appendChild(anchorItem);
  menu.appendChild(resetItem);
  document.body.appendChild(menu);
  
  // Close menu when clicking outside
  const closeMenu = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };
  
  // Delay to prevent immediate closing
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 0);
}


console.log('QuickMirror main.ts loaded with Electron support');
