# Events POS System

Offline-first Point of Sale system for event management with inventory, order tracking, and reporting.

## Features

- ✅ **User Management** - Add/remove waiters, cashiers, bartenders
- ✅ **Inventory Management** - Main store with transfers to bar/counters
- ✅ **POS System** - Order placement with waiter tagging
- ✅ **Order Management** - Track pending and completed orders
- ✅ **Real-time Reports** - Item sales and staff performance reports
- ✅ **Export Reports** - PDF and Excel export
- ✅ **Offline Support** - Works without internet connection
- ✅ **Local Network** - Tablets connect via local intranet

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite
- **Real-time**: Socket.io
- **Authentication**: JWT
- **Reports**: ExcelJS, jsPDF

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize Database

```bash
npm run init-db
```

This creates the database schema and a default admin user:
- Username: `admin`
- Password: `admin123`

⚠️ **Change the admin password after first login!**

### 3. Start Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start on `http://0.0.0.0:3000`, accessible from:
- Local: `http://localhost:3000`
- Network: `http://[YOUR_IP]:3000`

## Local Network Setup

1. **Find your laptop's IP address:**
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`

2. **Connect tablets to same WiFi network**

3. **Access from tablets:**
   - Open browser: `http://[LAPTOP_IP]:3000`
   - Example: `http://192.168.1.100:3000`

4. **Configure firewall:**
   - Allow incoming connections on port 3000
   - Windows: Add inbound rule in Windows Firewall

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/verify` - Verify token

### Users
- `GET /api/users` - List users (query: `?role=waiter&active_only=true`)
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user (admin only)
- `GET /api/users/:id/stats` - Get user statistics

### Orders
- `GET /api/orders` - List orders (query: `?status=pending&waiter_id=1`)
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order (requires `waiter_id`, `items`, `payment_method`)
- `PATCH /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/complete` - Complete order

### Reports
- `GET /api/reports/item-sales` - Item sales report
- `GET /api/reports/staff-sales` - Staff performance report
- `GET /api/reports/item-sales/export/excel` - Export item sales as Excel
- `GET /api/reports/item-sales/export/pdf` - Export item sales as PDF
- `GET /api/reports/staff-sales/export/excel` - Export staff sales as Excel
- `GET /api/reports/staff-sales/export/pdf` - Export staff sales as PDF

## Project Structure

```
events-pos/
├── server/
│   ├── database/
│   │   ├── db.js          # Database connection
│   │   ├── schema.sql     # Database schema
│   │   └── init.js        # Database initialization
│   ├── models/
│   │   ├── User.js        # User model
│   │   ├── Order.js      # Order model
│   │   └── Item.js       # Item model
│   ├── routes/
│   │   ├── auth.js       # Authentication routes
│   │   ├── users.js      # User management routes
│   │   ├── orders.js     # Order routes
│   │   └── reports.js    # Report routes
│   ├── middleware/
│   │   └── auth.js       # Authentication middleware
│   └── server.js         # Main server file
├── client/              # Frontend (to be implemented)
├── package.json
└── README.md
```

## Database Schema

- **users** - Staff (waiters, cashiers, bartenders, admins)
- **items** - Inventory items
- **orders** - Orders (linked to waiters)
- **order_items** - Order line items
- **transfers** - Inventory transfers (main store → bar/counters)

## Development

### Running as Windows Service

Use PM2 or NSSM to run the server as a service that starts on boot:

```bash
npm install -g pm2
pm2 start server/server.js --name events-pos
pm2 startup
pm2 save
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=3000
HOST=0.0.0.0
JWT_SECRET=your-secret-key-change-in-production
```

## Running the Application

### Development Mode

**Backend:**
```bash
npm install
npm run init-db  # First time only
npm start
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```

Access frontend at: `http://localhost:5173`

### Production Mode

```bash
# Build frontend
cd client
npm run build

# Start backend (serves frontend automatically)
cd ..
npm start
```

Access at: `http://localhost:3000`

See [START.md](START.md) for detailed instructions.

## Next Steps

1. ✅ Backend API complete
2. ✅ Frontend implementation (React PWA)
3. ✅ Real-time updates with Socket.io
4. ✅ All core features implemented
5. ⏳ Enhanced offline sync with IndexedDB
6. ⏳ Print integration
7. ⏳ Production deployment optimization

## License

ISC

