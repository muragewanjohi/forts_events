# Events POS - Installer Creation Guide

This guide walks you through creating a Windows installer for the Events POS system.

## Quick Start (Simplest Method)

### Method 1: Portable Version (No Installer Needed)

1. **Prepare the package:**
   ```bash
   npm run package
   ```

2. **Create portable version:**
   ```bash
   node scripts/create-portable.js
   ```

3. **Zip the `portable` folder** and distribute it.

4. **User instructions:**
   - Extract the zip file
   - Install Node.js from https://nodejs.org/ (if not already installed)
   - Double-click `start.bat`
   - Open browser to http://localhost:3000

### Method 2: Windows Installer (Inno Setup)

#### Prerequisites

1. **Install Inno Setup:**
   - Download from: https://jrsoftware.org/isinfo.php
   - Install Inno Setup Compiler

2. **Install Node.js** (for building):
   - Download from: https://nodejs.org/

#### Steps

1. **Prepare the package:**
   ```bash
   npm run package
   ```
   This creates a `package` directory with all necessary files.

2. **Open Inno Setup Compiler**

3. **Open the script:**
   - File → Open
   - Select `installer.iss` from the project root

4. **Review settings:**
   - App name, version, etc. are already configured
   - Default installation path: `C:\Program Files\Events POS System`

5. **Build the installer:**
   - Click **Build** → **Compile** (or press F9)
   - The installer will be created in the `installer` directory

6. **Test the installer:**
   - Run the installer on a test machine
   - Verify installation and functionality

## What Gets Installed

The installer includes:
- ✅ All application files
- ✅ Built frontend (client/dist)
- ✅ All Node.js dependencies (node_modules)
- ✅ Database initialization script
- ✅ Startup scripts (start.bat)
- ✅ Service installer (install-service.bat)

**Note:** Node.js itself is NOT bundled by default. Users must install Node.js separately, OR you can bundle it (see below).

## Bundling Node.js (Optional)

To create a completely standalone installer that doesn't require Node.js:

### Option A: Download Node.js Portable

1. Download Node.js Windows x64 from https://nodejs.org/
2. Extract or use a portable version
3. Place the Node.js files in a `nodejs` directory:
   ```
   project-root/
   ├── nodejs/
   │   ├── node.exe
   │   ├── npm
   │   └── ... (other Node.js files)
   ```

4. Update `start.bat` to use bundled Node.js:
   ```batch
   "%~dp0nodejs\node.exe" launcher.js
   ```

5. Update `installer.iss` to include Node.js:
   ```iss
   [Files]
   Source: "nodejs\*"; DestDir: "{app}\nodejs"; Flags: ignoreversion recursesubdirs
   ```

### Option B: Use Node.js Installer in Inno Setup

You can run the Node.js installer as part of the setup:

```iss
[Run]
Filename: "{tmp}\nodejs-installer.msi"; Parameters: "/quiet"; StatusMsg: "Installing Node.js..."; Check: not IsNodeInstalled
```

## Installation Options for End Users

### Standard Installation

1. Run the installer
2. Follow the wizard
3. Launch from desktop shortcut
4. Application starts automatically

**Default credentials:**
- Username: `admin`
- Password: `admin123`

### Windows Service Installation (Advanced)

For automatic startup on boot:

1. Install the application normally
2. Download NSSM from https://nssm.cc/download
3. Run `install-service.bat` as Administrator
4. Service will start on system boot

## Customization

### Change Installation Path

Edit `installer.iss`:
```iss
DefaultDirName={autopf}\{#MyAppName}
```
Change to:
```iss
DefaultDirName={commonpf}\{#MyAppName}  ; Program Files
DefaultDirName={localappdata}\{#MyAppName}  ; User's AppData
```

### Add License File

1. Create a `LICENSE.txt` file
2. Update `installer.iss`:
   ```iss
   LicenseFile=LICENSE.txt
   ```

### Add Application Icon

1. Create or obtain an `.ico` file
2. Update `installer.iss`:
   ```iss
   SetupIconFile=icon.ico
   ```

### Change Default Port

Users can change the port by creating a `.env` file:
```env
PORT=3001
```

## Testing Checklist

Before distributing:

- [ ] Test on clean Windows 10 installation
- [ ] Test on clean Windows 11 installation
- [ ] Verify all features work after installation
- [ ] Test database initialization
- [ ] Test network access from other devices
- [ ] Verify firewall configuration
- [ ] Test uninstallation
- [ ] Verify no leftover files after uninstall

## Distribution

### File Size Considerations

- **Without Node.js:** ~50-100 MB
- **With Node.js:** ~150-200 MB

### Distribution Methods

1. **Direct download:** Host installer on website/cloud storage
2. **USB drive:** Copy installer to USB for on-site installation
3. **Network share:** Place on shared network drive

## Troubleshooting

### Installer Fails to Create

- Check Inno Setup is installed correctly
- Verify all source files exist in `package` directory
- Check for file path length issues (Windows 260 char limit)

### Application Won't Start After Installation

- Verify Node.js is installed: `node --version`
- Check `logs` directory for errors
- Run `start.bat` manually to see error messages
- Verify port 3000 is not in use

### Network Access Issues

- Check Windows Firewall settings
- Verify application is bound to `0.0.0.0` (all interfaces)
- Test with `netstat -an | findstr 3000`

## Support Files

- `PACKAGING.md` - Detailed packaging documentation
- `TROUBLESHOOTING.md` - Common issues and solutions
- `README.md` - Application documentation

## Next Steps

After creating the installer:

1. Test thoroughly on target systems
2. Create user documentation
3. Prepare installation instructions
4. Set up support channels
5. Consider auto-update mechanism (future enhancement)

