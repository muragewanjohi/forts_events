// Migration script to add mpesa_reference column to orders table
const { db } = require('./db');

async function migrate() {
  try {
    console.log('Running migration: Add mpesa_reference to orders...');
    
    // Check if column already exists
    const tableInfo = await db.promisify.all("PRAGMA table_info(orders)");
    const hasMpesaReference = tableInfo.some(col => col.name === 'mpesa_reference');
    
    if (hasMpesaReference) {
      console.log('mpesa_reference column already exists.');
    } else {
      // Add mpesa_reference column
      await db.promisify.run(`
        ALTER TABLE orders ADD COLUMN mpesa_reference TEXT
      `);
      console.log('Added mpesa_reference column to orders table.');
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();

