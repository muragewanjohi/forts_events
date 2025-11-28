// Migration script to add categories support to existing database
const { db } = require('./db');

async function migrate() {
  try {
    console.log('Running migration: Add categories support...');
    
    // Check if categories table exists
    const categoriesExist = await db.promisify.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='categories'"
    );
    
    if (categoriesExist.length === 0) {
      // Create categories table
      await db.promisify.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Categories table created.');
    } else {
      console.log('Categories table already exists.');
    }
    
    // Check if items table has category_id column
    const itemsInfo = await db.promisify.all("PRAGMA table_info(items)");
    
    const hasCategoryId = itemsInfo.some(col => col.name === 'category_id');
    const hasCategoryText = itemsInfo.some(col => col.name === 'category');
    
    if (!hasCategoryId && hasCategoryText) {
      // Add category_id column
      await db.promisify.run(`
        ALTER TABLE items ADD COLUMN category_id INTEGER REFERENCES categories(id)
      `);
      await db.promisify.run(`
        CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id)
      `);
      
      // Migrate existing category text to categories table and update items
      const items = await db.promisify.all('SELECT DISTINCT category FROM items WHERE category IS NOT NULL AND category != ""');
      
      for (const item of items) {
        if (item.category) {
          // Create category if it doesn't exist
          let category = await db.promisify.get('SELECT id FROM categories WHERE name = ?', [item.category]);
          
          if (!category) {
            const result = await db.promisify.run(
              'INSERT INTO categories (name) VALUES (?)',
              [item.category]
            );
            category = { id: result.lastID };
          }
          
          // Update items with this category
          await db.promisify.run(
            'UPDATE items SET category_id = ? WHERE category = ?',
            [category.id, item.category]
          );
        }
      }
      
      // Drop old category column (SQLite doesn't support DROP COLUMN directly)
      // We'll keep it for now but category_id will be used
      console.log('Migrated existing categories. Old category column kept for compatibility.');
    } else if (!hasCategoryId) {
      // Just add the column if category text column doesn't exist
      await db.promisify.run(`
        ALTER TABLE items ADD COLUMN category_id INTEGER REFERENCES categories(id)
      `);
      await db.promisify.run(`
        CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id)
      `);
      console.log('Added category_id column to items.');
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();

