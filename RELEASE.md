# Release Process Documentation

This document describes how to create releases for QuickMirror using the GitHub Actions workflow.

## GitHub Actions Workflow

The project uses a **manual-trigger only** workflow to control GitHub Actions usage costs. The workflow builds Windows installers for all three supported architectures.

### Supported Architectures

- **ia32** (32-bit): Windows 10/11 - Compatible with older systems
- **x64** (64-bit): Windows 10/11 - Intel/AMD processors (most common)
- **arm64**: Windows 11 ARM64 - Native ARM performance (Surface Pro X, etc.)

### How to Trigger a Release Build

1. **Go to GitHub Actions**: Navigate to your repository → Actions tab
2. **Select the workflow**: Click "Build Windows Installers" 
3. **Click "Run workflow"**
4. **Configure options**:
   - **Create GitHub Release**: `true` (default) to create a release, `false` for testing builds
   - **Release version tag**: Leave empty to use package.json version, or specify (e.g., `v1.0.1`)
   - **Mark as pre-release**: `false` (default) for stable releases, `true` for beta/RC

### Workflow Process

The workflow performs these steps:

1. **Build Matrix**: Builds installers for ia32, x64, and arm64 simultaneously
2. **Frontend Build**: Compiles TypeScript/CSS with Vite
3. **Electron Build**: Packages with electron-builder for each architecture  
4. **Code Signing**: Automatically signs executables with Windows certificates
5. **Artifact Upload**: Stores installers as GitHub artifacts (30-day retention)
6. **Release Creation**: Creates GitHub release with all installers
7. **Checksum Generation**: Creates SHA256 checksums for security verification

### Generated Files

For each release, you'll get:

- `QuickMirror-Setup-v1.0.0-ia32.exe` - 32-bit installer (~91 MB)
- `QuickMirror-Setup-v1.0.0-x64.exe` - 64-bit installer (~96 MB)  
- `QuickMirror-Setup-v1.0.0-arm64.exe` - ARM64 installer (~90 MB)
- `checksums.txt` - SHA256 checksums for verification

### Cost Management Features

- **Manual trigger only**: No automatic builds on push/PR
- **Efficient caching**: Caches Electron downloads and dependencies
- **Selective artifacts**: Only uploads essential files
- **Concurrent builds**: Uses matrix strategy for faster completion

### Testing Without Release

To build without creating a GitHub release:

1. Set **Create GitHub Release** to `false`
2. Artifacts will be available in the Actions run for 30 days
3. Download and test installers before creating official releases

## Local Development Builds

For development and testing:

```bash
# Build all architectures locally
npm run dist

# Build specific architecture  
npm run dist -- --win --x64     # Most common
npm run dist -- --win --arm64   # ARM64 testing
npm run dist -- --win --ia32    # Legacy compatibility

# Development with hot reload
npm run dev
```

## Architecture Selection Guide

### For Users

- **Unsure?** → Use **x64** installer (works on most systems)
- **ARM Surface/PC** → Use **arm64** for best performance, x64 as fallback
- **Old/32-bit system** → Use **ia32** installer

### For Developers

- **x64** builds work via emulation on ARM64 Windows
- **arm64** builds provide 20-30% better performance on ARM hardware
- **ia32** builds ensure maximum compatibility with legacy systems

## Troubleshooting

### Build Failures

1. **Check Node.js version**: Ensure Actions uses Node.js 20+
2. **Review dependencies**: Verify electron-builder configuration
3. **Inspect logs**: GitHub Actions provides detailed build logs
4. **Test locally first**: Use `npm run dist` before triggering Actions

### Release Issues

1. **Tag conflicts**: Ensure version tags are unique
2. **Asset upload failures**: Check file paths in workflow
3. **Checksum problems**: Verify file integrity after download

### Cost Concerns

- Each full build uses ~30-45 minutes of runner time
- Windows runners cost more than Linux/macOS
- Use sparingly for official releases only
- Test thoroughly with local builds first

## Security Notes

- All installers are code-signed automatically
- SHA256 checksums provided for integrity verification
- GitHub releases include full build provenance
- No secrets or credentials stored in repository
