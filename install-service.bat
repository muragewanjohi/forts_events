@echo off
REM Install Events POS as Windows Service using NSSM
REM This allows the application to run automatically on startup

title Events POS - Install Service

echo ========================================
echo   Events POS - Windows Service Installer
echo ========================================
echo.

REM Check if NSSM is available
where nssm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo NSSM (Non-Sucking Service Manager) is required to install as a service.
    echo.
    echo Please download NSSM from: https://nssm.cc/download
    echo Extract it and add to PATH, or place nssm.exe in this directory.
    echo.
    pause
    exit /b 1
)

REM Get the current directory (full path)
set "APP_DIR=%~dp0"
set "APP_DIR=%APP_DIR:~0,-1%"

echo Installing Events POS as Windows Service...
echo Application Directory: %APP_DIR%
echo.

REM Install the service
nssm install EventsPOS "%APP_DIR%\node.exe" "%APP_DIR%\launcher.js"
nssm set EventsPOS AppDirectory "%APP_DIR%"
nssm set EventsPOS DisplayName "Events POS System"
nssm set EventsPOS Description "Offline-first Point of Sale system for event management"
nssm set EventsPOS Start SERVICE_AUTO_START
nssm set EventsPOS AppStdout "%APP_DIR%\logs\service.log"
nssm set EventsPOS AppStderr "%APP_DIR%\logs\service-error.log"

REM Create logs directory if it doesn't exist
if not exist "%APP_DIR%\logs" mkdir "%APP_DIR%\logs"

echo.
echo Service installed successfully!
echo.
echo To start the service: net start EventsPOS
echo To stop the service: net stop EventsPOS
echo To remove the service: nssm remove EventsPOS confirm
echo.
pause

