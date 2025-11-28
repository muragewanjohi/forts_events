const { initDatabase, closeDatabase } = require('./db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function initialize() {
  try {
    console.log('Initializing database...');
    await initDatabase();
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Created uploads directory');
    }
    
    // Create default admin user if it doesn't exist
    const { db } = require('./db');
    const adminExists = await db.promisify.get(
      'SELECT id FROM users WHERE username = ?',
      ['admin']
    );
    
    if (!adminExists) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await db.promisify.run(
        `INSERT INTO users (username, full_name, password_hash, role)
         VALUES (?, ?, ?, ?)`,
        ['admin', 'Administrator', passwordHash, 'admin']
      );
      console.log('Default admin user created:');
      console.log('  Username: admin');
      console.log('  Password: admin123');
      console.log('  ⚠️  Please change the password after first login!');
    } else {
      console.log('Admin user already exists');
    }
    
    console.log('Database initialization complete!');
    await closeDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Initialization error:', error);
    process.exit(1);
  }
}

initialize();
