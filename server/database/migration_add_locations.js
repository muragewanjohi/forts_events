// Migration script to add locations support to existing database
const { db } = require('./db');

async function migrate() {
  try {
    console.log('Running migration: Add locations support...');
    
    // Check if locations table exists
    const locationsExist = await db.promisify.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='locations'"
    );
    
    if (locationsExist.length === 0) {
      // Create locations table
      await db.promisify.run(`
        CREATE TABLE IF NOT EXISTS locations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('source', 'destination', 'both')),
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Locations table created.');
      
      // Create default locations
      await db.promisify.run(
        `INSERT INTO locations (name, type, description) VALUES (?, ?, ?)`,
        ['Main Store', 'source', 'Main storage location']
      );
      await db.promisify.run(
        `INSERT INTO locations (name, type, description) VALUES (?, ?, ?)`,
        ['Bar', 'destination', 'Bar location']
      );
      await db.promisify.run(
        `INSERT INTO locations (name, type, description) VALUES (?, ?, ?)`,
        ['Counter', 'destination', 'Counter location']
      );
      console.log('Default locations created (Main Store, Bar, Counter).');
    } else {
      console.log('Locations table already exists.');
    }
    
    // Check if transfers table has location_id columns
    const transfersInfo = await db.promisify.all("PRAGMA table_info(transfers)");
    
    const hasFromLocationId = transfersInfo.some(col => col.name === 'from_location_id');
    const hasToLocationId = transfersInfo.some(col => col.name === 'to_location_id');
    const hasFromLocation = transfersInfo.some(col => col.name === 'from_location');
    const hasToLocation = transfersInfo.some(col => col.name === 'to_location');
    
    if (!hasFromLocationId && hasFromLocation) {
      // Add from_location_id column
      await db.promisify.run(`
        ALTER TABLE transfers ADD COLUMN from_location_id INTEGER REFERENCES locations(id)
      `);
      
      // Migrate existing from_location values
      const mainStore = await db.promisify.get('SELECT id FROM locations WHERE name = ?', ['Main Store']);
      if (mainStore) {
        await db.promisify.run(
          'UPDATE transfers SET from_location_id = ? WHERE from_location = ?',
          [mainStore.id, 'main_store']
        );
      }
      
      await db.promisify.run(`
        CREATE INDEX IF NOT EXISTS idx_transfers_from_location ON transfers(from_location_id)
      `);
      console.log('Added from_location_id column to transfers.');
    }
    
    if (!hasToLocationId && hasToLocation) {
      // Add to_location_id column
      await db.promisify.run(`
        ALTER TABLE transfers ADD COLUMN to_location_id INTEGER REFERENCES locations(id)
      `);
      
      // Migrate existing to_location values
      const bar = await db.promisify.get('SELECT id FROM locations WHERE name = ?', ['Bar']);
      const counter = await db.promisify.get('SELECT id FROM locations WHERE name = ?', ['Counter']);
      
      if (bar) {
        await db.promisify.run(
          'UPDATE transfers SET to_location_id = ? WHERE to_location = ?',
          [bar.id, 'bar']
        );
      }
      if (counter) {
        await db.promisify.run(
          'UPDATE transfers SET to_location_id = ? WHERE to_location = ?',
          [counter.id, 'counter']
        );
      }
      
      await db.promisify.run(`
        CREATE INDEX IF NOT EXISTS idx_transfers_to_location ON transfers(to_location_id)
      `);
      console.log('Added to_location_id column to transfers.');
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();

