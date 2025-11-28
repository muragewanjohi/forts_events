# Troubleshooting Guide

## "Error saving category" Issue

If you're getting an error when trying to save a category, follow these steps:

### Step 1: Verify Database Migration

Run the categories migration:
```bash
npm run migrate-categories
```

You should see:
```
Running migration: Add categories support...
Categories table created.
Migration completed successfully!
```

### Step 2: Restart the Server

After running migrations, restart your server:
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm start
```

### Step 3: Check Server Logs

When you try to save a category, check the server console for detailed error messages. The improved error handling will now show:
- The actual error message
- Whether the table exists
- Database connection issues

### Step 4: Verify Database

Check if the categories table exists:
```bash
# Using SQLite command line (if installed)
sqlite3 server/database/events_pos.db "SELECT name FROM sqlite_master WHERE type='table' AND name='categories';"
```

### Step 5: Check Browser Console

Open browser DevTools (F12) and check the Console tab for:
- Network errors
- API response details
- JavaScript errors

### Common Issues

1. **"Categories table does not exist"**
   - Solution: Run `npm run migrate-categories`

2. **"Category name already exists"**
   - Solution: Use a different category name

3. **"Category name is required"**
   - Solution: Make sure you entered a name in the form

4. **Network/CORS errors**
   - Solution: Ensure server is running on port 3000
   - Check that frontend is connecting to correct API URL

5. **Authentication errors**
   - Solution: Make sure you're logged in as admin
   - Try logging out and logging back in

### Testing the API Directly

You can test the categories endpoint directly using curl or Postman:

```bash
# First, login to get a token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Then create a category (replace YOUR_TOKEN with the token from above)
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Test Category","description":"Test"}'
```

### Still Having Issues?

1. Check server logs for detailed error messages
2. Verify database file exists: `server/database/events_pos.db`
3. Try re-initializing the database:
   ```bash
   # Backup first!
   mv server/database/events_pos.db server/database/events_pos.db.backup
   npm run init-db
   npm run migrate-categories
   ```

