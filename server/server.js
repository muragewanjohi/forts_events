const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const { initDatabase } = require('./database/db');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const reportRoutes = require('./routes/reports');
const inventoryRoutes = require('./routes/inventory');
const transferRoutes = require('./routes/transfers');
const tableRoutes = require('./routes/tables');
const categoryRoutes = require('./routes/categories');
const locationRoutes = require('./routes/locations');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Bind to all interfaces for local network access

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from client (when frontend is built)
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}
app.use(express.static(path.join(__dirname, '../client/public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve index.html for all non-API routes (SPA routing)
// This must be after all API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const indexPath = path.join(__dirname, '../client/dist/index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend not built. Please run: cd client && npm run build');
    }
  }
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Listen for order creation
  socket.on('order:create', async (orderData) => {
    try {
      const Order = require('./models/Order');
      const order = await Order.create(orderData);
      // Broadcast to all connected clients
      io.emit('order:new', order);
    } catch (error) {
      socket.emit('order:error', { error: error.message });
    }
  });

  // Listen for order status updates
  socket.on('order:update', async (data) => {
    try {
      const Order = require('./models/Order');
      const order = await Order.updateStatus(data.id, data.status, data.cashier_id);
      // Broadcast to all connected clients
      io.emit('order:updated', order);
    } catch (error) {
      socket.emit('order:error', { error: error.message });
    }
  });
});

// Make io available to routes if needed
app.set('io', io);

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    console.log('Database initialized');

    server.listen(PORT, HOST, () => {
      console.log(`\n🚀 Events POS Server running!`);
      console.log(`📍 Local: http://localhost:${PORT}`);
      console.log(`🌐 Network: http://${getLocalIP()}:${PORT}`);
      console.log(`\n📋 Default Admin Credentials:`);
      console.log(`   Username: admin`);
      console.log(`   Password: admin123`);
      console.log(`   ⚠️  Change password after first login!\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Get local IP address
function getLocalIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  const { closeDatabase } = require('./database/db');
  await closeDatabase();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();

