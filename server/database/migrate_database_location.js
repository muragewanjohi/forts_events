// Migration script to move database from application directory to AppData
const fs = require('fs');
const path = require('path');
const os = require('os');

const oldDbPath = path.join(__dirname, 'events_pos.db');
const appDataPath = process.env.APPDATA || 
                   (os.platform() === 'win32' ? path.join(os.homedir(), 'AppData', 'Roaming') : os.homedir());
const newDbDir = path.join(appDataPath, 'Events POS System');
const newDbPath = path.join(newDbDir, 'events_pos.db');

async function migrate() {
  try {
    console.log('Checking for existing database...');
    
    // Check if old database exists
    if (!fs.existsSync(oldDbPath)) {
      console.log('No existing database found in application directory.');
      console.log('Database will be created in:', newDbPath);
      return;
    }

    // Check if new database already exists
    if (fs.existsSync(newDbPath)) {
      console.log('Database already exists in new location:', newDbPath);
      console.log('Skipping migration.');
      return;
    }

    // Create new directory
    if (!fs.existsSync(newDbDir)) {
      fs.mkdirSync(newDbDir, { recursive: true });
      console.log('Created directory:', newDbDir);
    }

    // Copy database file
    console.log('Migrating database...');
    console.log('  From:', oldDbPath);
    console.log('  To:', newDbPath);
    
    fs.copyFileSync(oldDbPath, newDbPath);
    console.log('✅ Database migrated successfully!');
    console.log('\nNote: The old database file still exists in the application directory.');
    console.log('You can delete it after verifying the new location works correctly.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\nThe application will try to create a new database in:', newDbPath);
    process.exit(1);
  }
}

migrate();

