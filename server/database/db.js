const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const os = require('os');

// Determine database path - use user-writable location
// Priority: 1) Environment variable, 2) AppData folder, 3) Application directory (fallback)
function getDatabasePath() {
  // Check if DB_PATH is set in environment
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }
  
  // Use AppData for user-writable location (works even in Program Files installations)
  const appDataPath = process.env.APPDATA || 
                     (os.platform() === 'win32' ? path.join(os.homedir(), 'AppData', 'Roaming') : os.homedir());
  
  // Create Events POS directory in AppData
  const dbDir = path.join(appDataPath, 'Events POS System');
  
  // Ensure directory exists
  if (!fs.existsSync(dbDir)) {
    try {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`Created database directory: ${dbDir}`);
    } catch (error) {
      console.error(`Failed to create database directory: ${dbDir}`, error);
      // Fallback to application directory
      return path.join(__dirname, 'events_pos.db');
    }
  }
  
  return path.join(dbDir, 'events_pos.db');
}

const DB_PATH = getDatabasePath();

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
  } catch (error) {
    console.error(`Failed to create database directory: ${dbDir}`, error);
    throw new Error(`Cannot create database directory: ${dbDir}. Please check permissions.`);
  }
}

console.log(`Database path: ${DB_PATH}`);

// Create database connection with write permissions
// Use OPEN_READWRITE | OPEN_CREATE flags to ensure write access
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    console.error('Database path:', DB_PATH);
    console.error('Please ensure the directory has write permissions.');
    throw err;
  } else {
    console.log('Connected to SQLite database');
    console.log('Database location:', DB_PATH);
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Promisify database methods for async/await
db.promisify = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          console.error('Database run error:', err);
          console.error('SQL:', sql);
          console.error('Params:', params);
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  },
  
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          console.error('Database get error:', err);
          console.error('SQL:', sql);
          console.error('Params:', params);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },
  
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Database all error:', err);
          console.error('SQL:', sql);
          console.error('Params:', params);
          reject(err);
        } else {
          resolve(rows);
        }
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

