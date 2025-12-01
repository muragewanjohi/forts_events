# Quick Installation Guide for End Users

## For Non-Technical Users

### Option 1: Using the Installer (Recommended)

1. **Download the installer:**
   - File: `EventsPOS-Setup.exe`
   - Save it to your Desktop or Downloads folder

2. **Run the installer:**
   - Double-click `EventsPOS-Setup.exe`
   - Click "Yes" if Windows asks for permission
   - Follow the installation wizard
   - Click "Install" when ready

3. **Install Node.js (if prompted):**
   - If you see a message about Node.js, download it from: https://nodejs.org/
   - Download the "LTS" version (recommended)
   - Run the Node.js installer
   - Restart your computer if asked

4. **Start the application:**
   - Look for "Events POS System" on your Desktop or Start Menu
   - Double-click to start
   - A window will open showing the server is starting
   - Wait for the message "Server is ready!"

5. **Open in your browser:**
   - Open any web browser (Chrome, Edge, Firefox)
   - Go to: http://localhost:3000
   - Login with:
     - Username: `admin`
     - Password: `admin123`

6. **Change the password:**
   - After first login, go to Users page
   - Change the admin password immediately!

### Option 2: Portable Version

1. **Extract the zip file:**
   - Download `EventsPOS-Portable.zip`
   - Right-click and select "Extract All..."
   - Extract to a folder (e.g., `C:\EventsPOS`)

2. **Install Node.js:**
   - Download from: https://nodejs.org/
   - Install the LTS version
   - Restart your computer

3. **Start the application:**
   - Open the extracted folder
   - Double-click `start.bat`
   - Wait for "Server is ready!" message

4. **Open in browser:**
   - Go to: http://localhost:3000
   - Login with admin/admin123

## Accessing from Tablets

1. **Find your computer's IP address:**
   - Press `Windows Key + R`
   - Type `cmd` and press Enter
   - Type `ipconfig` and press Enter
   - Look for "IPv4 Address" (e.g., 192.168.1.100)

2. **On your tablet:**
   - Connect to the same Wi-Fi network as your computer
   - Open a web browser
   - Go to: `http://[YOUR_IP]:3000`
   - Example: `http://192.168.1.100:3000`

3. **If it doesn't work:**
   - Check Windows Firewall settings
   - Make sure tablet and computer are on the same network
   - Try turning off Windows Firewall temporarily to test

## Troubleshooting

### "Node.js is not found"
- Download and install Node.js from https://nodejs.org/
- Choose the LTS version
- Restart your computer after installation

### "Port 3000 is already in use"
- Another program is using port 3000
- Close other applications
- Or contact support to change the port

### "Cannot access from tablet"
- Make sure both devices are on the same Wi-Fi network
- Check Windows Firewall allows connections on port 3000
- Verify the IP address is correct

### Application won't start
- Check if Node.js is installed: Open Command Prompt, type `node --version`
- Look for error messages in the startup window
- Check the `logs` folder for error files

## Getting Help

- Check the `TROUBLESHOOTING.md` file
- Review error messages in the `logs` folder
- Contact your system administrator

## Default Login

- **Username:** admin
- **Password:** admin123

⚠️ **IMPORTANT:** Change this password immediately after first login!

