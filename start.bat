@echo off
REM Events POS System - Startup Script
REM This script starts the Events POS application

title Events POS System

echo ========================================
echo   Events POS System - Starting...
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: package.json not found. Please run this script from the Events POS directory.
    pause
    exit /b 1
)

REM Check if node_modules exists
REM Note: Dependencies should be included in the installer package
REM If node_modules doesn't exist, try to install (may require admin rights)
if not exist "node_modules" (
    echo WARNING: node_modules not found. Attempting to install dependencies...
    echo This may require Administrator privileges if installed in Program Files.
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ERROR: Failed to install dependencies
        echo.
        echo This is likely a permissions issue. Solutions:
        echo 1. Run this script as Administrator (Right-click -^> Run as Administrator)
        echo 2. Reinstall the application to a user-writable location
        echo 3. Contact your system administrator
        echo.
        pause
        exit /b 1
    )
)

REM Check if client node_modules exists
if not exist "client\node_modules" (
    echo WARNING: Client node_modules not found. Attempting to install...
    cd client
    call npm install
    cd ..
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ERROR: Failed to install client dependencies
        echo Please run this script as Administrator or reinstall to a different location.
        echo.
        pause
        exit /b 1
    )
)

REM Check if database exists, if not initialize it
if not exist "server\database\events.db" (
    echo Initializing database...
    call npm run init-db
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to initialize database
        pause
        exit /b 1
    )
)

REM Build client if not built
if not exist "client\dist" (
    echo Building client...
    cd client
    call npm run build
    cd ..
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to build client
        pause
        exit /b 1
    )
)

REM Start the launcher
echo.
echo Starting Events POS System...
echo.
REM Use quoted path to handle spaces in directory names
node "%~dp0launcher.js"

pause

