# Quick Installer Creation Reference

## 🚀 Quick Steps (After Making Changes)

```bash
# 1. Prepare the package (builds everything)
npm run package

# 2. Open Inno Setup Compiler
#    → File → Open → Select installer.iss
#    → Build → Compile (F9)

# 3. Find installer: installer\EventsPOS-Setup.exe
```

## 📋 Detailed Steps

### 1. Make Your Changes
Edit code in `client/src/` or `server/`

### 2. Test Locally
```bash
npm run dev
```

### 3. Prepare Package
```bash
npm run package
```
⏱️ Takes 2-5 minutes

### 4. Create Installer
- Open **Inno Setup Compiler**
- Open `installer.iss`
- Press **F9** (or Build → Compile)

### 5. Find Installer
Location: `installer\EventsPOS-Setup.exe`

## ⚠️ Important

- **Always run `npm run package` after code changes**
- **Don't edit files in the `package` folder** (they get overwritten)
- **Test the installer before distributing**

## 📦 What Gets Included

✅ All application files  
✅ Built frontend  
✅ All dependencies (node_modules)  
✅ Startup scripts  

❌ Node.js (users must install separately)

## 🐛 Troubleshooting

**Package fails?** → Check Node.js is installed  
**Inno Setup fails?** → Make sure you ran `npm run package` first  
**App won't start?** → Verify Node.js is installed on target system  

---

**Full Guide:** See `CREATE_INSTALLER_GUIDE.md` for detailed instructions

