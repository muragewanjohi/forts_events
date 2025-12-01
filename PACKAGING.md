# Packaging Events POS for Distribution

This guide explains how to create a Windows installer for the Events POS system that can be installed on any Windows laptop, even without Node.js pre-installed.

## Overview

The packaging process creates:
1. A bundled application with all dependencies
2. A Windows installer (using Inno Setup)
3. Optional: Bundled Node.js runtime

## Prerequisites

### For Creating the Installer

1. **Node.js** (for building)
   - Download from: https://nodejs.org/
   - Version 16 or higher

2. **Inno Setup** (for creating Windows installer)
   - Download from: https://jrsoftware.org/isinfo.php
   - Install Inno Setup Compiler

3. **Optional: NSSM** (for Windows Service installation)
   - Download from: https://nssm.cc/download
   - Extract to a folder in PATH or place in project directory

## Step-by-Step Packaging Process

### Step 1: Prepare the Package

Run the packaging script to prepare all files:

```bash
npm run package
```

This will:
- Install all dependencies
- Build the client application
- Copy all necessary files to a `package` directory
- Create the distribution structure

### Step 2: Download Node.js for Bundling (Optional)

If you want to bundle Node.js with the installer:

1. Download Node.js Windows x64 installer from https://nodejs.org/
2. Extract it or use the portable version
3. Place Node.js files in a `nodejs` directory at the project root
4. Update `installer.iss` to include Node.js files

**Alternative:** Require users to install Node.js separately (recommended for smaller installer size)

### Step 3: Create the Installer

1. Open **Inno Setup Compiler**
2. Open `installer.iss` from the project root
3. Click **Build** → **Compile** (or press F9)
4. The installer will be created in the `installer` directory

### Step 4: Test the Installer

1. Run the installer on a clean Windows machine (or VM)
2. Verify:
   - Application installs correctly
   - `start.bat` launches the application
   - Application is accessible at http://localhost:3000
   - Database initializes on first run

## Installation Options

### Option 1: Standard Installation (Recommended)

**Requirements:**
- User must have Node.js installed (or bundled with installer)

**Installation Steps:**
1. Run the installer
2. Follow the installation wizard
3. Launch from desktop shortcut or Start Menu
4. Application starts automatically

### Option 2: Windows Service Installation

**Requirements:**
- NSSM (Non-Sucking Service Manager) must be available

**Installation Steps:**
1. Run the installer
2. Run `install-service.bat` as Administrator
3. Service will start automatically on system boot

## File Structure After Installation

```
C:\Program Files\Events POS System\
├── client/
│   ├── dist/          # Built frontend
│   └── public/        # Static assets
├── server/            # Backend application
│   ├── database/      # Database files
│   └── routes/        # API routes
├── uploads/           # File uploads directory
├── logs/              # Application logs
├── node_modules/      # Dependencies
├── launcher.js        # Application launcher
├── start.bat          # Startup script
├── install-service.bat # Service installer
└── package.json       # Project configuration
```

## Configuration

### Environment Variables

Create a `.env` file in the installation directory to customize:

```env
PORT=3000
HOST=0.0.0.0
JWT_SECRET=your-secret-key-here
NODE_ENV=production
```

### Firewall Configuration

The installer should automatically configure Windows Firewall, but if not:

1. Open **Windows Defender Firewall**
2. Click **Advanced settings**
3. Add **Inbound Rule** for port 3000 (TCP)
4. Allow connection for all profiles

## Distribution Checklist

Before distributing the installer:

- [ ] Test on clean Windows 10/11 installation
- [ ] Verify all dependencies are included
- [ ] Test database initialization
- [ ] Verify network access from other devices
- [ ] Test all major features (POS, Orders, Reports)
- [ ] Include installation instructions
- [ ] Create user manual/documentation
- [ ] Test uninstallation process

## Troubleshooting

### "Node.js is not found"

**Solution:** 
- Ensure Node.js is installed system-wide, OR
- Bundle Node.js with the installer

### "Port 3000 is already in use"

**Solution:**
- Edit `.env` file and change PORT to another value (e.g., 3001)
- Restart the application

### "Cannot access from tablets"

**Solutions:**
1. Check Windows Firewall settings
2. Verify laptop and tablets are on same network
3. Check laptop's IP address: `ipconfig`
4. Access from tablet: `http://[LAPTOP_IP]:3000`

### "Database initialization fails"

**Solution:**
- Ensure the `server/database` directory has write permissions
- Run `npm run init-db` manually

## Advanced: Bundling Node.js

To create a completely standalone installer:

1. Download Node.js portable or extract from installer
2. Place in `nodejs` directory
3. Update `start.bat` to use bundled Node.js:
   ```batch
   "%~dp0nodejs\node.exe" launcher.js
   ```
4. Update `installer.iss` to include Node.js files

## Alternative: Portable Version

Instead of an installer, you can create a portable version:

1. Run `npm run package`
2. Zip the `package` directory
3. Include instructions to:
   - Extract to any location
   - Run `start.bat`
   - (Optional) Install Node.js if not present

## Support

For issues or questions:
- Check `TROUBLESHOOTING.md`
- Review application logs in `logs` directory
- Check Windows Event Viewer for service errors

