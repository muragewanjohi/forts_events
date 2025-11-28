// Migration script to add payment_status column to existing database
const { db } = require('./db');

async function migrate() {
  try {
    console.log('Running migration: Add payment_status to orders table...');
    
    // Check if column already exists
    const tableInfo = await db.promisify.all(
      "PRAGMA table_info(orders)"
    );
    
    const hasPaymentStatus = tableInfo.some(col => col.name === 'payment_status');
    
    if (!hasPaymentStatus) {
      // Add payment_status column
      await db.promisify.run(
        `ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'refunded'))`
      );
      
      // Update existing orders: if status is 'completed', set payment_status to 'paid'
      await db.promisify.run(
        `UPDATE orders SET payment_status = 'paid' WHERE status = 'completed' AND payment_status IS NULL`
      );
      
      console.log('Migration completed successfully!');
    } else {
      console.log('Column payment_status already exists, skipping migration.');
    }
    
    // Add paid_at column if it doesn't exist
    const hasPaidAt = tableInfo.some(col => col.name === 'paid_at');
    if (!hasPaidAt) {
      await db.promisify.run(
        `ALTER TABLE orders ADD COLUMN paid_at DATETIME`
      );
      console.log('Added paid_at column.');
    }
    
    // Update status constraint to include new statuses
    // Note: SQLite doesn't support modifying CHECK constraints easily
    // This is a limitation - new databases will have the correct constraint
    
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();

