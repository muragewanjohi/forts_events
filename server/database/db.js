const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'events_pos.db');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Promisify database methods for async/await
db.promisify = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

// Initialize database schema and create default admin user
async function initDatabase() {
  return new Promise((resolve, reject) => {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    db.exec(schema, async (err) => {
      if (err) {
        console.error('Error initializing database:', err.message);
        reject(err);
        return;
      }
      
      console.log('Database schema initialized');
      
      // Create default admin user if it doesn't exist
      try {
        const adminExists = await db.promisify.get(
          'SELECT id FROM users WHERE username = ?',
          ['admin']
        );
        
        if (!adminExists) {
          const bcrypt = require('bcryptjs');
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
      } catch (userError) {
        console.error('Error creating admin user:', userError);
        // Don't reject - schema is initialized, admin user creation can be done manually
      }
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('Created uploads directory');
      }
      
      resolve();
    });
  });
}

// Close database connection
function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
        reject(err);
      } else {
        console.log('Database connection closed');
        resolve();
      }
    });
  });
}

module.exports = {
  db,
  initDatabase,
  closeDatabase,
  DB_PATH
};

