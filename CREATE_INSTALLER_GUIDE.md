# How to Create the Installer (EXE) - Step-by-Step Guide

This guide walks you through creating a Windows installer (EXE file) for the Events POS system after making any changes to the code.

## 📋 Prerequisites

Before you start, make sure you have:

1. **Node.js installed** (for building)
   - Download from: https://nodejs.org/
   - Version 16 or higher recommended

2. **Inno Setup installed** (for creating the installer)
   - Download from: https://jrsoftware.org/isinfo.php
   - Install "Inno Setup Compiler"

## 🚀 Step-by-Step Process

### Step 1: Make Your Code Changes

Make any changes you need to the code:
- Frontend changes (in `client/src/`)
- Backend changes (in `server/`)
- Configuration changes
- etc.

### Step 2: Test Your Changes Locally

Before packaging, test that everything works:

```bash
# Start the development server
npm run dev
```

Or use the launcher:

```bash
npm run launch
```

Verify all features work correctly.

### Step 3: Prepare the Package

This step builds the client, installs all dependencies, and prepares everything for packaging:

```bash
npm run package
```

**What this does:**
- ✅ Installs all root dependencies (`npm install`)
- ✅ Installs all client dependencies (`cd client && npm install`)
- ✅ Builds the React frontend (`cd client && npm run build`)
- ✅ Copies all necessary files to the `package` directory
- ✅ Includes all `node_modules` (dependencies are pre-installed)

**Expected output:**
```
📦 Preparing Events POS for packaging...

1. Installing dependencies...
✅ Dependencies installed

2. Installing client dependencies...
✅ Client dependencies installed

3. Building client...
✅ Client built

4. Copying files to package directory...
   ✓ server
   ✓ client/dist
   ✓ client/public
   ✓ node_modules
   ✓ client/node_modules
   ... (more files)

✅ Package prepared successfully!
📁 Package location: C:\Dev\events\package
```

**Time:** This step takes 2-5 minutes depending on your system.

### Step 4: Open Inno Setup Compiler

1. Open **Inno Setup Compiler** from your Start Menu
2. You should see the Inno Setup Compiler window

### Step 5: Open the Installer Script

1. In Inno Setup Compiler, go to **File → Open**
2. Navigate to your project folder: `C:\Dev\events`
3. Select the file: `installer.iss`
4. Click **Open**

### Step 6: Review the Installer Settings (Optional)

The `installer.iss` file is already configured, but you can review:

- **App Name:** "Events POS System"
- **Version:** "1.0.0" (update if needed)
- **Installation Path:** `%LOCALAPPDATA%\Events POS System` (user-writable location)
- **Output Directory:** `installer` folder

### Step 7: Build the Installer

1. In Inno Setup Compiler, click **Build → Compile** (or press **F9**)
2. Wait for the compilation to complete

**Expected output:**
```
Compiling [Code] section...
Compiling [Setup] section...
Compiling [Files] section...
...
Successfully compiled: C:\Dev\events\installer\EventsPOS-Setup.exe
```

### Step 8: Find Your Installer

The installer will be created in:

```
C:\Dev\events\installer\EventsPOS-Setup.exe
```

This is the file you can distribute to users!

## 📦 What's Included in the Installer

The installer includes:
- ✅ All application files
- ✅ Built frontend (React app compiled to static files)
- ✅ All Node.js dependencies (pre-installed `node_modules`)
- ✅ Database initialization scripts
- ✅ Startup scripts (`start.bat`)
- ✅ Service installer (`install-service.bat`)

**Note:** Node.js itself is NOT bundled. Users must install Node.js separately from https://nodejs.org/

## 🧪 Testing the Installer

Before distributing, test the installer:

1. **On a clean system** (or VM):
   - Install Node.js first (if not already installed)
   - Run the installer
   - Verify installation completes successfully

2. **Test the application:**
   - Launch from desktop shortcut or Start Menu
   - Open browser to http://localhost:3000
   - Login with default credentials:
     - Username: `admin`
     - Password: `admin123`
   - Test key features (POS, Orders, Reports, etc.)

3. **Test network access:**
   - Find the laptop's IP address: `ipconfig`
   - Access from another device: `http://[LAPTOP_IP]:3000`
   - Verify it works

## 🔄 Quick Reference Checklist

After making changes, follow these steps:

- [ ] **Step 1:** Make your code changes
- [ ] **Step 2:** Test changes locally (`npm run dev` or `npm run launch`)
- [ ] **Step 3:** Run `npm run package` to prepare the package
- [ ] **Step 4:** Open Inno Setup Compiler
- [ ] **Step 5:** Open `installer.iss` file
- [ ] **Step 6:** Build → Compile (F9)
- [ ] **Step 7:** Find installer in `installer\EventsPOS-Setup.exe`
- [ ] **Step 8:** Test the installer on a clean system

## ⚠️ Common Issues & Solutions

### Issue: "Package script fails"

**Solution:**
- Make sure you're in the project root directory
- Check that Node.js is installed: `node --version`
- Try deleting `node_modules` and running `npm install` manually

### Issue: "Inno Setup can't find files"

**Solution:**
- Make sure you ran `npm run package` first
- Verify the `package` directory exists and has files
- Check that `installer.iss` points to the correct `package` directory

### Issue: "Installer is too large"

**Solution:**
- The installer includes all `node_modules` (this is normal)
- Size is typically 50-150 MB
- This ensures users don't need to run `npm install`

### Issue: "Application won't start after installation"

**Solution:**
- Verify Node.js is installed on the target system
- Check the `logs` directory for error messages
- Run `start.bat` manually to see error output
- Ensure port 3000 is not in use

## 📝 Important Notes

1. **Always run `npm run package` after making changes** - This ensures the latest code is included

2. **The `package` directory is temporary** - It gets recreated each time you run `npm run package`

3. **Don't edit files in the `package` directory** - Changes will be overwritten. Always edit source files and re-run `npm run package`

4. **Version numbers** - Update the version in `installer.iss` if you want to track different releases:
   ```iss
   #define MyAppVersion "1.0.1"  ; Change this
   ```

5. **Installation location** - The installer installs to `%LOCALAPPDATA%\Events POS System` (typically `C:\Users\[Username]\AppData\Local\Events POS System`) to avoid permission issues

## 🎯 Summary

**The complete process in one command sequence:**

```bash
# 1. Make your changes (edit code files)

# 2. Test locally
npm run dev

# 3. Prepare package
npm run package

# 4. Open Inno Setup Compiler → Open installer.iss → Build → Compile (F9)

# 5. Find installer: installer\EventsPOS-Setup.exe
```

That's it! The installer is ready to distribute.

## 📚 Additional Resources

- `PACKAGING.md` - Detailed packaging documentation
- `INSTALLER_GUIDE.md` - Advanced installer customization
- `TROUBLESHOOTING.md` - Common issues and solutions
- `README.md` - Application documentation

---

**Remember:** After making ANY changes to the code, you MUST run `npm run package` before creating a new installer!

