# Installation Permissions Fix

## Problem

When installing to `Program Files (x86)`, Windows requires administrator privileges to create directories and write files. This causes `npm install` to fail with `EPERM` errors.

## Solutions

### Solution 1: Install to User Directory (Recommended)

The installer has been updated to install to `%LOCALAPPDATA%\Events POS System` instead of `Program Files`. This location:
- ✅ Doesn't require admin rights for normal operations
- ✅ Is user-writable
- ✅ Still accessible from Start Menu and Desktop shortcuts

**To use this:**
1. Rebuild the installer with the updated `installer.iss`
2. The default installation path will now be: `C:\Users\[Username]\AppData\Local\Events POS System`

### Solution 2: Include Dependencies in Package

The packaging script has been updated to include `node_modules` in the distribution package. This means:
- ✅ No need to run `npm install` after installation
- ✅ Faster startup
- ✅ No permission issues

**To use this:**
1. Run `npm run package` to create the package with dependencies
2. The `node_modules` folders will be included in the installer

### Solution 3: Run as Administrator

If you must install to Program Files:
1. Right-click `start.bat`
2. Select "Run as Administrator"
3. This will allow npm to create directories in Program Files

### Solution 4: Manual Installation Location

During installation:
1. Click "Browse" when prompted for installation directory
2. Choose a user-writable location like:
   - `C:\EventsPOS`
   - `C:\Users\[Username]\EventsPOS`
   - `D:\EventsPOS` (if you have another drive)

## Recommended Approach

**Best Practice:** Use Solution 1 + Solution 2:
- Install to user directory (no admin needed)
- Include dependencies in package (no npm install needed)

This provides the best user experience for non-technical users.

## Updating Existing Installation

If you've already installed to Program Files and are getting errors:

1. **Option A:** Uninstall and reinstall to the new default location
2. **Option B:** Run `start.bat` as Administrator (right-click → Run as Administrator)
3. **Option C:** Manually install dependencies:
   ```cmd
   cd "C:\Program Files (x86)\Events POS System"
   npm install
   cd client
   npm install
   ```

## Verification

After installation, verify:
1. `node_modules` folder exists in installation directory
2. `client\node_modules` folder exists
3. `start.bat` runs without permission errors

