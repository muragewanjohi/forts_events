# Quick Start Guide

## 🚀 Running the Full Application

### Option 1: Run Backend and Frontend Separately

**Terminal 1 - Backend:**
```bash
# Install dependencies (if not done)
npm install

# Initialize database (first time only)
npm run init-db

# Start backend server
npm start
```

Backend runs on: `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd client

# Install dependencies (if not done)
npm install

# Start frontend dev server
npm run dev
```

Frontend runs on: `http://localhost:5173`

### Option 2: Production Build

**Build Frontend:**
```bash
cd client
npm run build
```

**Serve Frontend from Backend:**
The backend is already configured to serve static files from `client/dist` when built.

After building, just run:
```bash
npm start
```

Then access the app at: `http://localhost:3000`

## 📱 Accessing from Tablets

1. **Find your laptop's IP address:**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. **On tablet browser, go to:**
   - Development: `http://[YOUR_IP]:5173`
   - Production: `http://[YOUR_IP]:3000`

3. **Configure firewall** to allow connections on ports 3000 and 5173

## 🔑 Default Login

- **Username**: `admin`
- **Password**: `admin123`

⚠️ Change this immediately after first login!

## ✅ What's Working

- ✅ Backend API (Node.js + Express + SQLite)
- ✅ Frontend (React + Vite)
- ✅ Authentication & Authorization
- ✅ User Management
- ✅ POS Order Placement
- ✅ Order Management
- ✅ Reports (Item Sales & Staff Performance)
- ✅ Inventory Management
- ✅ Transfers
- ✅ Real-time Updates (Socket.io)
- ✅ PWA Support (offline-ready)

## 🎯 Next Steps

1. Test all features
2. Add more waiters and items
3. Place test orders
4. Generate reports
5. Configure for production deployment

## 🐛 Troubleshooting

**Port already in use?**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill
```

**Can't connect from tablet?**
- Ensure both devices on same WiFi
- Check firewall settings
- Verify server is running
- Try accessing from laptop first

**Database errors?**
```bash
# Re-initialize (⚠️ deletes all data)
rm server/database/events_pos.db
npm run init-db
```

