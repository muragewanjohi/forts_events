# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Initialize Database
```bash
npm run init-db
```

This creates:
- ✅ Database with all tables
- ✅ Default admin user (username: `admin`, password: `admin123`)

### Step 3: Start Server
```bash
npm start
```

Server will be available at:
- **Local**: http://localhost:3000
- **Network**: http://[YOUR_IP]:3000

## 📱 Connect from Tablets

1. **Find your laptop's IP:**
   - Windows: Run `ipconfig` in PowerShell
   - Look for "IPv4 Address" (e.g., `192.168.1.100`)

2. **On tablet browser, go to:**
   ```
   http://192.168.1.100:3000
   ```

3. **Allow firewall access** (if prompted):
   - Windows: Allow Node.js through firewall
   - Or manually allow port 3000

## 🔑 Default Login

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Change this password immediately after first login!**

## 🧪 Test the API

### Login and Get Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "full_name": "Administrator",
    "role": "admin"
  }
}
```

### Create a Waiter
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "username": "naomi",
    "full_name": "NAOMI",
    "password": "password123",
    "role": "waiter"
  }'
```

### Create an Item
```bash
curl -X POST http://localhost:3000/api/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "MANYATTA",
    "sku": "MANY001",
    "cost_per_item": 350,
    "category": "Drinks",
    "stock_main_store": 100
  }'
```

### Create an Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "waiter_id": 2,
    "items": [
      {"item_id": 1, "quantity": 2}
    ],
    "payment_method": "cash"
  }'
```

## 📊 View Reports

### Item Sales Report
```
GET http://localhost:3000/api/reports/item-sales
```

### Staff Sales Report
```
GET http://localhost:3000/api/reports/staff-sales
```

### Export as Excel
```
GET http://localhost:3000/api/reports/item-sales/export/excel
GET http://localhost:3000/api/reports/staff-sales/export/excel
```

### Export as PDF
```
GET http://localhost:3000/api/reports/item-sales/export/pdf
GET http://localhost:3000/api/reports/staff-sales/export/pdf
```

## 🎯 Next Steps

1. ✅ Backend is ready!
2. Add more waiters/items through API
3. Test order creation
4. Generate reports
5. Build frontend (coming next)

## 🆘 Troubleshooting

**Port in use?**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Can't connect from tablet?**
- Check both devices are on same WiFi
- Verify firewall allows port 3000
- Try `http://localhost:3000/api/health` from laptop first

**Database errors?**
```bash
# Re-initialize database (⚠️ deletes all data)
rm server/database/events_pos.db
npm run init-db
```

## 📚 Full Documentation

See [README.md](README.md) and [SETUP.md](SETUP.md) for detailed information.

