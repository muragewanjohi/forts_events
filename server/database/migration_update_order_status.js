// Migration script to update order status constraint to include new statuses
const { db } = require('./db');

async function migrate() {
  try {
    console.log('Running migration: Update order status constraint...');
    
    // Check current constraint
    const tableInfo = await db.promisify.all("PRAGMA table_info(orders)");
    const statusColumn = tableInfo.find(col => col.name === 'status');
    
    if (!statusColumn) {
      console.log('Status column not found, skipping migration.');
      process.exit(0);
    }

    // SQLite doesn't support ALTER TABLE to modify CHECK constraints
    // We need to recreate the table with the new constraint
    
    // Step 1: Create new table with updated constraint
    await db.promisify.run(`
      CREATE TABLE IF NOT EXISTS orders_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        waiter_id INTEGER NOT NULL,
        cashier_id INTEGER,
        table_id INTEGER,
        order_type TEXT DEFAULT 'dine_in' CHECK(order_type IN ('dine_in', 'takeaway')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
        payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'refunded')),
        payment_method TEXT CHECK(payment_method IN ('cash', 'mpesa')),
        total_amount REAL NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        paid_at DATETIME,
        FOREIGN KEY (waiter_id) REFERENCES users(id),
        FOREIGN KEY (cashier_id) REFERENCES users(id),
        FOREIGN KEY (table_id) REFERENCES tables(id)
      )
    `);

    // Step 2: Copy data from old table to new table
    const rowCount = await db.promisify.get('SELECT COUNT(*) as count FROM orders');
    if (rowCount.count > 0) {
      await db.promisify.run(`
        INSERT INTO orders_new 
        (id, order_number, waiter_id, cashier_id, table_id, order_type, status, payment_status, 
         payment_method, total_amount, created_at, completed_at, paid_at)
        SELECT 
        id, order_number, waiter_id, cashier_id, table_id, 
        COALESCE(order_type, 'dine_in') as order_type,
        status, 
        COALESCE(payment_status, 'pending') as payment_status,
        payment_method, total_amount, created_at, completed_at, paid_at
        FROM orders
      `);
      console.log(`Migrated ${rowCount.count} orders to new table.`);
    }

    // Step 3: Drop old table
    await db.promisify.run('DROP TABLE orders');

    // Step 4: Rename new table
    await db.promisify.run('ALTER TABLE orders_new RENAME TO orders');

    // Step 5: Recreate indexes
    await db.promisify.run('CREATE INDEX IF NOT EXISTS idx_orders_waiter ON orders(waiter_id)');
    await db.promisify.run('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
    await db.promisify.run('CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)');
    await db.promisify.run('CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id)');

    console.log('Order status constraint updated successfully!');
    console.log('New valid statuses: pending, preparing, ready, completed, cancelled');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();

