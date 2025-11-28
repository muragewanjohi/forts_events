// Migration script to add tables support to existing database
const { db } = require('./db');

async function migrate() {
  try {
    console.log('Running migration: Add tables support...');
    
    // Check if tables table exists
    const tablesExist = await db.promisify.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='tables'"
    );
    
    if (tablesExist.length === 0) {
      // Create tables table
      await db.promisify.run(`
        CREATE TABLE IF NOT EXISTS tables (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          table_number TEXT UNIQUE NOT NULL,
          capacity INTEGER DEFAULT 4,
          status TEXT DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'reserved', 'out_of_service')),
          location TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await db.promisify.run(`
        CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status)
      `);
      
      console.log('Tables table created.');
    } else {
      console.log('Tables table already exists.');
    }
    
    // Check if orders table has table_id and order_type columns
    const ordersInfo = await db.promisify.all("PRAGMA table_info(orders)");
    
    const hasTableId = ordersInfo.some(col => col.name === 'table_id');
    const hasOrderType = ordersInfo.some(col => col.name === 'order_type');
    
    if (!hasTableId) {
      await db.promisify.run(`
        ALTER TABLE orders ADD COLUMN table_id INTEGER REFERENCES tables(id)
      `);
      await db.promisify.run(`
        CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id)
      `);
      console.log('Added table_id column to orders.');
    }
    
    if (!hasOrderType) {
      await db.promisify.run(`
        ALTER TABLE orders ADD COLUMN order_type TEXT DEFAULT 'dine_in' CHECK(order_type IN ('dine_in', 'takeaway'))
      `);
      console.log('Added order_type column to orders.');
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();

