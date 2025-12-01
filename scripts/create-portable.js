// Script to create a portable version of the application
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORTABLE_DIR = path.join(__dirname, '..', 'portable');

console.log('📦 Creating portable version...\n');

// Clean previous portable build
if (fs.existsSync(PORTABLE_DIR)) {
  fs.rmSync(PORTABLE_DIR, { recursive: true, force: true });
}

// Create portable directory
fs.mkdirSync(PORTABLE_DIR, { recursive: true });

// Run the package script first
console.log('Running package script...');
execSync('npm run package', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

// Copy package to portable
const packageDir = path.join(__dirname, '..', 'package');
copyDir(packageDir, PORTABLE_DIR);

// Create a README for portable version
const portableReadme = `# Events POS System - Portable Version

## Requirements

- Node.js 16 or higher must be installed on the system
- Windows 7 or higher

## Quick Start

1. Extract this folder to any location (e.g., C:\\EventsPOS)
2. Double-click \`start.bat\`
3. Open your browser to http://localhost:3000
4. Login with:
   - Username: admin
   - Password: admin123

## Network Access

To access from tablets on the same network:
1. Find your computer's IP address (run \`ipconfig\` in Command Prompt)
2. Access from tablets: http://[YOUR_IP]:3000

## First Time Setup

On first run, the database will be automatically initialized.

## Stopping the Application

Press Ctrl+C in the command window, or close the window.

## Troubleshooting

- If port 3000 is in use, edit \`.env\` file and change PORT
- Ensure Windows Firewall allows connections on port 3000
- Check \`logs\` directory for error logs
`;

fs.writeFileSync(path.join(PORTABLE_DIR, 'README.txt'), portableReadme);

console.log('\n✅ Portable version created!');
console.log(`📁 Location: ${PORTABLE_DIR}`);
console.log('\nYou can now zip this directory for distribution.\n');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

