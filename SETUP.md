# Setup Instructions

## Initial Setup

1. **Install Node.js** (v16 or higher recommended)
   - Download from: https://nodejs.org/

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Initialize Database**
   ```bash
   npm run init-db
   ```
   This will:
   - Create the SQLite database
   - Set up all tables
   - Create default admin user (username: `admin`, password: `admin123`)

4. **Configure Environment** (Optional)
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to customize port, host, or JWT secret.

5. **Start Server**
   ```bash
   npm start
   ```
   Or for development:
   ```bash
   npm run dev
   ```

## Network Configuration

### Finding Your IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**Mac/Linux:**
```bash
ifconfig
# or
ip addr
```

### Firewall Configuration

**Windows:**
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port `3000`
6. Allow the connection
7. Apply to all profiles
8. Name it "Events POS Server"

**Mac:**
```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

## Testing the API

### Using curl

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Create Waiter:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"username":"naomi","full_name":"NAOMI","password":"password123","role":"waiter"}'
```

**Create Order:**
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "waiter_id": 2,
    "items": [{"item_id": 1, "quantity": 2}],
    "payment_method": "cash"
  }'
```

### Using Postman or Insomnia

Import the API endpoints and test:
- Base URL: `http://localhost:3000/api`
- Authentication: Bearer Token (get from `/api/auth/login`)

## Running as a Service

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the server
pm2 start server/server.js --name events-pos

# Make it start on boot
pm2 startup
pm2 save

# Useful commands
pm2 list          # List running processes
pm2 logs events-pos  # View logs
pm2 restart events-pos  # Restart
pm2 stop events-pos    # Stop
```

### Using NSSM (Windows Service)

1. Download NSSM from: https://nssm.cc/download
2. Extract and run `nssm install EventsPOS`
3. Configure:
   - Path: `C:\Program Files\nodejs\node.exe`
   - Startup directory: `C:\Dev\events`
   - Arguments: `server/server.js`
4. Start the service from Services app

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill
```

### Database Locked
- Close any database viewers
- Restart the server
- Check file permissions

### Cannot Connect from Tablet
1. Verify laptop and tablet are on same WiFi
2. Check firewall settings
3. Verify server is bound to `0.0.0.0` (not `127.0.0.1`)
4. Try accessing from laptop first: `http://localhost:3000/api/health`

## Next Steps

1. ✅ Backend API is ready
2. Test all endpoints
3. Build frontend (React PWA)
4. Add offline sync
5. Configure printer

