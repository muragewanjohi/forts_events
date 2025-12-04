// Migration script to fix transfers table schema
// Removes old from_location and to_location TEXT columns
// and ensures from_location_id and to_location_id are NOT NULL
const { db } = require('./db');

async function migrate() {
  try {
    console.log('Running migration: Fix transfers table schema...');
    
    // Check current table structure
    const transfersInfo = await db.promisify.all("PRAGMA table_info(transfers)");
    const columnNames = transfersInfo.map(col => col.name);
    
    console.log('Current columns:', columnNames);
    
    const hasFromLocationId = columnNames.includes('from_location_id');
    const hasToLocationId = columnNames.includes('to_location_id');
    const hasFromLocation = columnNames.includes('from_location');
    const hasToLocation = columnNames.includes('to_location');
    
    // Step 1: Ensure new columns exist
    if (!hasFromLocationId) {
      console.log('Adding from_location_id column...');
      await db.promisify.run(`
        ALTER TABLE transfers ADD COLUMN from_location_id INTEGER REFERENCES locations(id)
      `);
    }
    
    if (!hasToLocationId) {
      console.log('Adding to_location_id column...');
      await db.promisify.run(`
        ALTER TABLE transfers ADD COLUMN to_location_id INTEGER REFERENCES locations(id)
      `);
    }
    
    // Step 2: Migrate data from old columns to new columns if needed
    if (hasFromLocation && hasFromLocationId) {
      console.log('Migrating data from from_location to from_location_id...');
      // Get all unique location names from old column
      const oldLocations = await db.promisify.all(
        'SELECT DISTINCT from_location FROM transfers WHERE from_location IS NOT NULL AND from_location_id IS NULL'
      );
      
      for (const oldLoc of oldLocations) {
        const locationName = oldLoc.from_location;
        // Map old location names to new location names
        let newLocationName = locationName;
        if (locationName === 'main_store' || locationName === 'Main Store') {
          newLocationName = 'Main Store';
        } else if (locationName === 'bar' || locationName === 'Bar') {
          newLocationName = 'Bar';
        } else if (locationName === 'counter' || locationName === 'Counter') {
          newLocationName = 'Counter';
        }
        
        const location = await db.promisify.get(
          'SELECT id FROM locations WHERE name = ?',
          [newLocationName]
        );
        
        if (location) {
          await db.promisify.run(
            'UPDATE transfers SET from_location_id = ? WHERE from_location = ? AND from_location_id IS NULL',
            [location.id, locationName]
          );
        }
      }
    }
    
    if (hasToLocation && hasToLocationId) {
      console.log('Migrating data from to_location to to_location_id...');
      const oldLocations = await db.promisify.all(
        'SELECT DISTINCT to_location FROM transfers WHERE to_location IS NOT NULL AND to_location_id IS NULL'
      );
      
      for (const oldLoc of oldLocations) {
        const locationName = oldLoc.to_location;
        let newLocationName = locationName;
        if (locationName === 'bar' || locationName === 'Bar') {
          newLocationName = 'Bar';
        } else if (locationName === 'counter' || locationName === 'Counter') {
          newLocationName = 'Counter';
        }
        
        const location = await db.promisify.get(
          'SELECT id FROM locations WHERE name = ?',
          [newLocationName]
        );
        
        if (location) {
          await db.promisify.run(
            'UPDATE transfers SET to_location_id = ? WHERE to_location = ? AND to_location_id IS NULL',
            [location.id, locationName]
          );
        }
      }
    }
    
    // Step 3: Drop old columns (SQLite doesn't support DROP COLUMN directly, so we need to recreate the table)
    if (hasFromLocation || hasToLocation) {
      console.log('Removing old columns by recreating table...');
      
      // Create new table with correct schema
      await db.promisify.run(`
        CREATE TABLE IF NOT EXISTS transfers_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          from_location_id INTEGER NOT NULL,
          to_location_id INTEGER NOT NULL,
          item_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL CHECK(quantity > 0),
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'cancelled')),
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
          FOREIGN KEY (from_location_id) REFERENCES locations(id),
          FOREIGN KEY (to_location_id) REFERENCES locations(id),
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `);
      
      // Copy data from old table to new table (only rows with valid location_ids)
      await db.promisify.run(`
        INSERT INTO transfers_new 
        (id, from_location_id, to_location_id, item_id, quantity, status, created_by, created_at, completed_at)
        SELECT 
          id, from_location_id, to_location_id, item_id, quantity, status, created_by, created_at, completed_at
        FROM transfers
        WHERE from_location_id IS NOT NULL AND to_location_id IS NOT NULL
      `);
      
      // Drop old table
      await db.promisify.run('DROP TABLE transfers');
      
      // Rename new table
      await db.promisify.run('ALTER TABLE transfers_new RENAME TO transfers');
      
      // Recreate indexes
      await db.promisify.run(`
        CREATE INDEX IF NOT EXISTS idx_transfers_from_location ON transfers(from_location_id)
      `);
      await db.promisify.run(`
        CREATE INDEX IF NOT EXISTS idx_transfers_to_location ON transfers(to_location_id)
      `);
      
      console.log('Table recreated with correct schema.');
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();

