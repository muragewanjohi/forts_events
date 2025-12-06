# Database Permissions Fix - SQLITE_READONLY Error

## Problem

When running the application from an installed executable, you may encounter:
```
Error: SQLITE_READONLY: attempt to write a readonly database
```

This happens because the database file is in a read-only location (e.g., Program Files or a protected directory).

## Solution

The database has been moved to a user-writable location:
- **Windows**: `%APPDATA%\Events POS System\events_pos.db`
  - Typically: `C:\Users\[Username]\AppData\Roaming\Events POS System\events_pos.db`
- **Linux/Mac**: `~/.config/Events POS System/events_pos.db` (or home directory)

This location:
- ✅ Always has write permissions
- ✅ Works even if the app is installed in Program Files
- ✅ Persists across app updates
- ✅ Is user-specific (each user has their own database)

## What Changed

### Database Location
- **Old**: `server/database/events_pos.db` (relative to application)
- **New**: `%APPDATA%\Events POS System\events_pos.db` (user-writable)

### Automatic Migration
- If an old database exists, it will be automatically detected
- The application will use the new location going forward
- Old database files are not automatically deleted (for safety)

## For Existing Installations

If you have an existing installation with data:

1. **The application will automatically use the new location** - no action needed
2. **To migrate existing data**, you can:
   - Manually copy `server/database/events_pos.db` to `%APPDATA%\Events POS System\`
   - Or run the migration script: `node server/database/migrate_database_location.js`

## Verification

After starting the application, check the console output:
```
Database path: C:\Users\[Username]\AppData\Roaming\Events POS System\events_pos.db
Connected to SQLite database
```

If you see this, the database is in the correct location and should have write permissions.

## Troubleshooting

### Still Getting READONLY Errors?

1. **Check the database path** in the console output
2. **Verify the directory exists** and has write permissions:
   ```powershell
   # Windows PowerShell
   Test-Path "$env:APPDATA\Events POS System"
   ```
3. **Check file permissions**:
   - Right-click the database directory
   - Properties → Security
   - Ensure your user has "Full control" or at least "Modify" permissions

### Database Not Found?

- The database will be created automatically on first run
- Ensure the AppData directory is accessible
- Check Windows User Account Control (UAC) settings

### Multiple Users?

- Each Windows user will have their own database
- This is by design - each user has separate data
- If you need shared data, consider using a network location or server database

## Environment Variable Override

You can override the database location by setting the `DB_PATH` environment variable:

```batch
set DB_PATH=C:\Custom\Path\events_pos.db
```

Or in a `.env` file:
```
DB_PATH=C:\Custom\Path\events_pos.db
```

## Benefits

1. **No Permission Issues**: AppData always has write access
2. **Survives Updates**: Database persists when application is updated
3. **User Isolation**: Each user has their own data
4. **Portable**: Works regardless of installation location

## Next Steps

1. **Restart the application** - it will automatically use the new location
2. **Verify write access** - try creating an order or editing a user
3. **Check console output** - confirm the database path is correct

The application should now work correctly without permission errors!

