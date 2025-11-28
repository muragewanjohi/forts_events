# Events Module - Implementation Plan

## System Overview

Based on the requirements, this is an offline-first POS system for event management with:
- Inventory management (Main Store → Bar/Counters)
- Point of Sale (POS) with multiple user accounts
- **User management** (Add/Remove waiters, cashiers, bartenders)
- Order management (pending/completed) - **All orders tagged to waiters**
- Real-time reporting (sales, stock levels, staff performance by waiter)
- Dashboard with analytics

## Recommended Architecture

### Technology Stack

**Backend:**
- **Node.js** with Express.js or Fastify
- **SQLite** or **PostgreSQL** (SQLite better for offline, PostgreSQL if you need better multi-user support)
- **Socket.io** for real-time updates across devices
- **Printer integration** (node-printer or similar)

**Frontend:**
- **React** or **Vue.js** (lightweight SPA)
- **PWA (Progressive Web App)** for offline capability
- **Service Workers** for offline data sync
- **IndexedDB** for local storage

**Additional Tools:**
- **Electron** (optional) - for desktop app on the server laptop
- **Puppeteer** or **jsPDF** for PDF generation
- **ExcelJS** for Excel export
- **Socket.io-client** for real-time communication

## Offline-First Strategy

### 1. **Service Worker + IndexedDB**
- Cache all static assets (HTML, CSS, JS)
- Store orders, inventory, and transactions in IndexedDB
- Queue API requests when offline, sync when online
- Use background sync API for reliable sync

### 2. **Database Replication**
- SQLite on each device with periodic sync
- Or use a master-slave setup where server is master
- Implement conflict resolution for concurrent edits

### 3. **Data Sync Strategy**
```
Tablet (Offline) → IndexedDB → Queue → Sync to Server (when connected)
Server → Broadcast updates → All connected tablets update
```

## Local Network Setup

### Option 1: Simple HTTP Server (Recommended for Start)
```javascript
// Server runs on laptop at IP: 192.168.1.100:3000
// Tablets connect via: http://192.168.1.100:3000
```

**Setup Steps:**
1. Laptop and tablets on same WiFi network
2. Find laptop's local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Configure Node.js server to bind to `0.0.0.0` (all interfaces)
4. Tablets access via `http://[LAPTOP_IP]:3000`

### Option 2: Local DNS (Advanced)
- Set up local DNS server (dnsmasq) or use hosts file
- Access via friendly name: `http://events-server.local`

### Network Configuration
```javascript
// server.js
const express = require('express');
const app = express();

// Bind to all network interfaces
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Access from tablets: http://[YOUR_IP]:${PORT}`);
});
```

## Hosting on Laptop as Server

### Option 1: Node.js Process Manager (PM2)
```bash
npm install -g pm2
pm2 start server.js --name events-server
pm2 startup  # Auto-start on boot
pm2 save
```

### Option 2: Windows Service (NSSM)
- Use NSSM (Non-Sucking Service Manager) to run Node.js as Windows service
- Auto-starts on laptop boot

### Option 3: Docker (Optional)
- Containerize the application
- Easier deployment and management

### Firewall Configuration
- Allow incoming connections on port 3000 (or chosen port)
- Windows Firewall: Add inbound rule for Node.js

## Open-Source POS Options to Consider

### 1. **Unicenta oPOS** (Java-based)
- **Pros:** Mature, feature-rich, supports offline
- **Cons:** Java stack, might be complex to modify
- **License:** GPL

### 2. **Openbravo POS** (Java-based)
- **Pros:** Well-documented, modular
- **Cons:** Java stack
- **License:** Openbravo Public License

### 3. **Floreant POS** (Java-based)
- **Pros:** Simple, easy to customize
- **Cons:** Less active development
- **License:** GPL

### 4. **Loyverse POS** (Cloud-based)
- **Cons:** Requires internet, not suitable for offline

### 5. **Custom Build (Recommended)**
Given your specific requirements (offline-first, Node.js, local network), **building from scratch** might be better because:
- Full control over offline functionality
- Node.js stack as requested
- Tailored to exact requirements
- Modern tech stack (React, Node.js, SQLite)

## Recommended Implementation Approach

### Phase 1: Core Backend (Week 1-2)
```
├── server/
│   ├── routes/
│   │   ├── inventory.js
│   │   ├── orders.js
│   │   ├── pos.js
│   │   ├── reports.js
│   │   ├── transfers.js
│   │   └── users.js (User management)
│   ├── models/
│   │   ├── Item.js
│   │   ├── Order.js
│   │   ├── Transfer.js
│   │   └── User.js
│   ├── database/
│   │   └── db.js (SQLite setup)
│   └── server.js
```

### Phase 2: Frontend POS (Week 2-3)
- React SPA with PWA capabilities
- **User login/authentication**
- **Waiter selection for orders** (required field)
- Order placement interface
- Payment confirmation
- Print integration

### Phase 3: User Management & Inventory (Week 3-4)
- **User management interface** (Add/Edit/Remove waiters)
- **Role-based access control**
- Main store management
- Import functionality (CSV/Excel)
- Transfer module

### Phase 4: Reports & Dashboard (Week 4-5)
- Real-time sales reports
- **Item sales report** (by item with quantities)
- **Waiter/Cashier/Bartender performance report** (with payment method breakdown)
- Stock reports
- Export (PDF/Excel)

### Phase 5: Offline Sync (Week 5-6)
- Service Worker implementation
- IndexedDB integration
- Sync queue and conflict resolution

## Database Schema (SQLite)

```sql
-- Items/Inventory
CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  cost_per_item REAL,
  stock_main_store INTEGER DEFAULT 0,
  stock_bar INTEGER DEFAULT 0,
  stock_counter INTEGER DEFAULT 0,
  category TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Transfers
CREATE TABLE transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_location TEXT NOT NULL, -- 'main_store'
  to_location TEXT NOT NULL, -- 'bar' or 'counter'
  item_id INTEGER,
  quantity INTEGER,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Orders
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE,
  waiter_id INTEGER NOT NULL, -- REQUIRED: waiter who took the order
  cashier_id INTEGER, -- cashier who processed payment (can be same as waiter)
  status TEXT DEFAULT 'pending', -- 'pending', 'completed'
  payment_method TEXT, -- 'cash', 'mpesa', 'card'
  total_amount REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (waiter_id) REFERENCES users(id),
  FOREIGN KEY (cashier_id) REFERENCES users(id)
);

-- Order Items
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER,
  item_id INTEGER,
  quantity INTEGER,
  price REAL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Users (Staff)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT, -- Display name (e.g., "NAOMI")
  password_hash TEXT,
  role TEXT NOT NULL, -- 'waiter', 'cashier', 'bartender', 'admin'
  is_active INTEGER DEFAULT 1, -- 1 = active, 0 = inactive (soft delete)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Key Features Implementation

### 1. Offline Order Placement
```javascript
// Client-side: Store in IndexedDB when offline
async function placeOrder(orderData) {
  if (navigator.onLine) {
    await api.post('/orders', orderData);
  } else {
    await offlineQueue.add('order', orderData);
    // Show confirmation to user
  }
}
```

### 2. Real-time Updates (Socket.io)
```javascript
// Server broadcasts to all connected tablets
io.on('connection', (socket) => {
  socket.on('order:create', async (order) => {
    const savedOrder = await saveOrder(order);
    io.emit('order:new', savedOrder); // Broadcast to all
  });
});
```

### 3. Print Integration
```javascript
// Use node-printer or direct printer API
const printer = require('node-printer');
function printOrder(order) {
  const receipt = formatReceipt(order);
  printer.printDirect({
    data: receipt,
    printer: 'POS_Printer',
    type: 'RAW'
  });
}
```

### 4. User Management (Waiters/Staff)
```javascript
// Backend: User management routes
// POST /api/users - Create new waiter/cashier/bartender
// GET /api/users - List all users (with filtering by role)
// GET /api/users/:id - Get user details
// PUT /api/users/:id - Update user
// DELETE /api/users/:id - Soft delete (set is_active = 0)

// Example: Create waiter
app.post('/api/users', async (req, res) => {
  const { username, full_name, password, role } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  
  const user = await db.run(`
    INSERT INTO users (username, full_name, password_hash, role)
    VALUES (?, ?, ?, ?)
  `, [username, full_name, passwordHash, role]);
  
  res.json({ id: user.lastID, username, full_name, role });
});

// Example: List active waiters
app.get('/api/users', async (req, res) => {
  const { role, active_only = true } = req.query;
  let query = 'SELECT id, username, full_name, role FROM users WHERE 1=1';
  const params = [];
  
  if (active_only) {
    query += ' AND is_active = 1';
  }
  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }
  
  const users = await db.all(query, params);
  res.json(users);
});
```

### 5. Order with Waiter Tagging
```javascript
// When creating an order, waiter_id is REQUIRED
async function createOrder(orderData) {
  const { waiter_id, items, payment_method } = orderData;
  
  if (!waiter_id) {
    throw new Error('Waiter ID is required for all orders');
  }
  
  const order = await db.run(`
    INSERT INTO orders (order_number, waiter_id, payment_method, total_amount, status)
    VALUES (?, ?, ?, ?, 'pending')
  `, [generateOrderNumber(), waiter_id, payment_method, calculateTotal(items)]);
  
  // Insert order items...
  return order;
}
```

### 6. Report Generation (with Waiter Data)
```javascript
// Waiter/Cashier/Bartender Report
async function generateStaffReport(startDate, endDate) {
  const report = await db.all(`
    SELECT 
      u.id,
      u.full_name AS account,
      COALESCE(SUM(CASE WHEN o.payment_method = 'card' THEN o.total_amount ELSE 0 END), 0) AS card_sales,
      COALESCE(SUM(CASE WHEN o.payment_method = 'cash' THEN o.total_amount ELSE 0 END), 0) AS cash,
      COALESCE(SUM(CASE WHEN o.payment_method = 'mpesa' THEN o.total_amount ELSE 0 END), 0) AS mpesa,
      COALESCE(SUM(o.total_amount), 0) AS total_sales
    FROM users u
    LEFT JOIN orders o ON u.id = o.waiter_id 
      AND o.status = 'completed'
      AND o.created_at BETWEEN ? AND ?
    WHERE u.role IN ('waiter', 'cashier', 'bartender') AND u.is_active = 1
    GROUP BY u.id, u.full_name
    ORDER BY total_sales DESC
  `, [startDate, endDate]);
  
  return report.map((row, index) => ({
    number: index + 1,
    account: row.account,
    card_sales: row.card_sales,
    cash: row.cash,
    mpesa: row.mpesa,
    total_sales: row.total_sales
  }));
}

// PDF using jsPDF
const { jsPDF } = require('jspdf');
function generateSalesReport(data) {
  const doc = new jsPDF();
  // Add table with data
  doc.save('sales-report.pdf');
}

// Excel using ExcelJS
const ExcelJS = require('exceljs');
async function generateExcelReport(data) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sales');
  // Add data
  await workbook.xlsx.writeFile('sales.xlsx');
}
```

## Security Considerations

1. **Local Network Only**: Bind to local IP, not public
2. **Authentication**: Simple JWT or session-based auth
3. **Role-Based Access Control**: 
   - Admin: Full access (user management, reports, inventory)
   - Waiter: Can place orders, view own orders
   - Cashier: Can process payments, view orders
   - Bartender: Can place orders, view bar inventory
4. **Password Security**: Hash passwords with bcrypt
5. **Data Encryption**: Encrypt sensitive data at rest
6. **Backup**: Regular SQLite backups to external drive
7. **User Deactivation**: Soft delete users to maintain order history

## Deployment Checklist

- [ ] Node.js installed on laptop
- [ ] Database initialized
- [ ] **Default admin user created**
- [ ] Server starts on boot (PM2/NSSM)
- [ ] Firewall configured
- [ ] Laptop and tablets on same network
- [ ] Static IP for laptop (recommended)
- [ ] PWA installed on tablets
- [ ] Printer configured
- [ ] **Waiters/cashiers/bartenders added to system**
- [ ] Backup strategy in place

## Next Steps

1. **Decide**: Build from scratch or modify existing POS
2. **Setup**: Initialize Node.js project structure
3. **Database**: Create SQLite schema
4. **MVP**: Build basic POS order placement
5. **Test**: Test offline functionality
6. **Deploy**: Setup on laptop and test with tablets

## User Management Features

### Admin Interface for Managing Staff

**Add Waiter/Cashier/Bartender:**
- Full name (e.g., "NAOMI")
- Username (for login)
- Password
- Role selection (waiter, cashier, bartender, admin)
- Active/Inactive status

**Edit User:**
- Update name, password, role
- Activate/Deactivate account

**Remove User:**
- Soft delete (set `is_active = 0`)
- Prevents deletion if user has active orders
- Historical orders remain linked to user

### Order-Waiter Relationship

**Critical Requirements:**
1. **Every order MUST have a waiter_id** - Cannot create order without selecting waiter
2. **Waiter selection at POS** - When placing order, waiter must be selected
3. **Reports filter by waiter** - All reports can filter by specific waiter
4. **Payment tracking** - Track which payment method was used per order

### API Endpoints for User Management

```
POST   /api/users              - Create new user
GET    /api/users              - List all users (query: ?role=waiter&active_only=true)
GET    /api/users/:id          - Get user details
PUT    /api/users/:id          - Update user
DELETE /api/users/:id          - Deactivate user (soft delete)
GET    /api/users/:id/orders   - Get all orders for a user
GET    /api/users/:id/stats    - Get sales stats for a user
```

### Frontend Components Needed

```
client/src/
├── components/
│   ├── UserManagement/
│   │   ├── UserList.jsx          - List all users
│   │   ├── UserForm.jsx          - Add/Edit user form
│   │   ├── UserCard.jsx          - User display card
│   │   └── WaiterSelector.jsx    - Dropdown for selecting waiter
│   └── ...
├── pages/
│   ├── UsersPage.jsx             - User management page (admin only)
│   └── ...
```

## Recommended Project Structure

```
events-pos/
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── users.js          - User management routes
│   │   │   ├── inventory.js
│   │   │   ├── orders.js
│   │   │   ├── pos.js
│   │   │   ├── reports.js
│   │   │   └── transfers.js
│   │   ├── models/
│   │   │   ├── Item.js
│   │   │   ├── Order.js
│   │   │   ├── Transfer.js
│   │   │   └── User.js
│   │   ├── services/
│   │   │   ├── userService.js    - User business logic
│   │   │   └── reportService.js   - Report generation
│   │   ├── middleware/
│   │   │   ├── auth.js            - Authentication
│   │   │   └── roleCheck.js       - Role-based access
│   │   └── utils/
│   ├── database/
│   │   └── schema.sql
│   └── server.js
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UserManagement/
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── UsersPage.jsx
│   │   │   └── ...
│   │   ├── services/
│   │   ├── utils/
│   │   └── sw.js (Service Worker)
│   └── public/
├── shared/ (if using TypeScript)
└── package.json
```

Would you like me to start building the initial project structure?

