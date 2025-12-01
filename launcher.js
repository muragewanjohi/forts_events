// Launcher application that starts both server and client
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const os = require('os');

const SERVER_PORT = process.env.PORT || 3000;
const SERVER_PATH = path.resolve(__dirname, 'server', 'server.js');
const CLIENT_BUILD_PATH = path.resolve(__dirname, 'client', 'dist');

// Check if client is built
if (!fs.existsSync(CLIENT_BUILD_PATH)) {
  console.log('⚠️  Client not built. Building now...');
  const buildProcess = spawn('npm', ['run', 'build'], {
    cwd: path.resolve(__dirname, 'client'),
    stdio: 'inherit',
    shell: false // Don't use shell to avoid path issues
  });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      startServer();
    } else {
      console.error('❌ Failed to build client');
      process.exit(1);
    }
  });
} else {
  startServer();
}

function startServer() {
  console.log('🚀 Starting Events POS Server...\n');
  
  // Start the server - use absolute path
  const serverPath = SERVER_PATH;
  console.log(`Starting server from: ${serverPath}`);
  
  const serverProcess = spawn('node', [serverPath], {
    cwd: path.resolve(__dirname),
    stdio: 'inherit',
    shell: false, // Don't use shell to avoid path issues with spaces
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });

  // Wait for server to be ready
  waitForServer(() => {
    console.log('\n✅ Server is ready!');
    console.log(`\n📍 Access the application at:`);
    console.log(`   Local: http://localhost:${SERVER_PORT}`);
    getLocalIPs().forEach(ip => {
      console.log(`   Network: http://${ip}:${SERVER_PORT}`);
    });
    console.log(`\n📋 Default Admin Credentials:`);
    console.log(`   Username: admin`);
    console.log(`   Password: admin123`);
    console.log(`\n⚠️  Press Ctrl+C to stop the server\n`);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down server...');
    serverProcess.kill();
    process.exit(0);
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

  serverProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`\n❌ Server exited with code ${code}`);
      process.exit(code);
    }
  });
}

function waitForServer(callback, maxAttempts = 30) {
  let attempts = 0;
  
  const checkServer = () => {
    attempts++;
    const req = http.get(`http://localhost:${SERVER_PORT}`, (res) => {
      callback();
    });
    
    req.on('error', () => {
      if (attempts < maxAttempts) {
        setTimeout(checkServer, 1000);
      } else {
        console.error('❌ Server failed to start within timeout');
        process.exit(1);
      }
    });
  };
  
  // Start checking after a short delay
  setTimeout(checkServer, 2000);
}

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  
  return ips;
}

