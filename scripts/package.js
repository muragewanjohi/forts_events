// Build script to prepare the application for packaging
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const PACKAGE_DIR = path.join(__dirname, '..', 'package');

console.log('📦 Preparing Events POS for packaging...\n');

// Clean previous builds
if (fs.existsSync(DIST_DIR)) {
  console.log('Cleaning previous build...');
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}

if (fs.existsSync(PACKAGE_DIR)) {
  console.log('Cleaning previous package...');
  fs.rmSync(PACKAGE_DIR, { recursive: true, force: true });
}

// Create package directory
fs.mkdirSync(PACKAGE_DIR, { recursive: true });

console.log('1. Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('✅ Dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install dependencies');
  process.exit(1);
}

console.log('2. Installing client dependencies...');
try {
  execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..', 'client') });
  console.log('✅ Client dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install client dependencies');
  process.exit(1);
}

console.log('3. Building client...');
try {
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..', 'client') });
  console.log('✅ Client built\n');
} catch (error) {
  console.error('❌ Failed to build client');
  process.exit(1);
}

console.log('4. Copying files to package directory...');

// Files and directories to copy
const filesToCopy = [
  'server',
  'client/dist',
  'client/public',
  'client/package.json',
  'client/package-lock.json',
  'node_modules',
  'client/node_modules',
  'package.json',
  'package-lock.json',
  'launcher.js',
  'start.bat',
  'install-service.bat',
  '.env.example',
  'README.md'
];

// Directories to create
const dirsToCreate = [
  'server/database',
  'uploads',
  'logs'
];

filesToCopy.forEach(item => {
  const src = path.join(__dirname, '..', item);
  const dest = path.join(PACKAGE_DIR, item);
  
  if (fs.existsSync(src)) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      // Copy node_modules (dependencies are included in package)
      copyDir(src, dest);
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
    console.log(`   ✓ ${item}`);
  } else {
    console.log(`   ⚠ ${item} not found (will be created on first run)`);
  }
});

dirsToCreate.forEach(dir => {
  const dest = path.join(PACKAGE_DIR, dir);
  fs.mkdirSync(dest, { recursive: true });
  console.log(`   ✓ Created ${dir}`);
});

// Create a README for the package
const packageReadme = `# Events POS System - Installation Package

## Quick Start

1. Run \`start.bat\` to start the application
2. Open your browser to http://localhost:3000
3. Login with:
   - Username: admin
   - Password: admin123

## Installation as Windows Service (Optional)

1. Download NSSM from https://nssm.cc/download
2. Run \`install-service.bat\`
3. The service will start automatically on system boot

## Network Access

To access from tablets on the same network:
1. Find your computer's IP address (run \`ipconfig\` in Command Prompt)
2. Access from tablets: http://[YOUR_IP]:3000

## Troubleshooting

- If port 3000 is in use, edit \`.env\` file and change the PORT
- Check \`logs\` directory for error logs
- Ensure Windows Firewall allows connections on port 3000
`;

fs.writeFileSync(path.join(PACKAGE_DIR, 'INSTALL.txt'), packageReadme);

console.log('\n✅ Package prepared successfully!');
console.log(`📁 Package location: ${PACKAGE_DIR}`);
console.log('\nNext steps:');
console.log('1. Download Node.js Windows installer');
console.log('2. Use Inno Setup to create installer (see installer.iss)');
console.log('3. Bundle Node.js with the installer\n');

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

