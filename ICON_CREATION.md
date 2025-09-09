# QuikMirror Icon Creation Guide

## Overview
This document describes the process for creating the green QM icons for QuikMirror application.

## Icon Requirements
Based on Issue #1, the app needs:
- A green circular background
- White "QM" letters (Q and M) prominently displayed
- Multiple sizes for system tray and application use

## Generated Files

### SVG Source
- `quikm_logo.svg` - Master SVG file with green circular background and white QM letters

### Icon Generator
- `icon-generator.html` - Browser-based tool to convert SVG to PNG files
- `scripts/create-icons.cjs` - Node.js script that creates the HTML generator

## How to Create Icons

1. Open `icon-generator.html` in any modern web browser
2. Right-click on each canvas element showing the rendered icon
3. Save each as PNG with the corresponding filename
4. Place the PNG files in `src-tauri/icons/` directory

## Required Icon Sizes

The following PNG files are needed for full Tauri/Electron support:

- `16x16.png` - Small system tray icon
- `32x32.png` - Standard system tray icon
- `44x44.png`, `89x89.png`, `107x107.png`, `142x142.png`, `150x150.png` - Windows Store logos
- `128x128.png`, `128x128@2x.png` - Standard app icons
- `256x256.png`, `284x284.png`, `310x310.png` - Large app icons
- `icon.ico` - Windows executable icon (can be created from 256x256.png)
- `icon.icns` - macOS app icon (if needed)

## Current Status

- ✅ SVG master file created with green QM design
- ✅ HTML icon generator tool created
- ✅ App configuration updated to reference new icons
- 🔄 PNG files need to be manually generated using the HTML tool
- 🔄 ICO and ICNS files need to be created from PNG sources

## Design Specifications

- **Background**: Green circular background (#10B981 with #059669 stroke)
- **Letters**: White "QM" letters with 8px stroke width
- **Q Design**: Circle with diagonal tail in bottom-right
- **M Design**: Two vertical lines connected by inverted V at top
- **Overall**: Clean, modern design suitable for system tray display

## Next Steps

1. Use the HTML generator to create all required PNG files
2. Convert the 256x256.png to .ico format for Windows
3. Test the icons in both system tray and application contexts
4. Update any remaining configuration references if needed
