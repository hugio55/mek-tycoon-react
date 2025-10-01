@echo off
echo Starting Browser Automation Monitor...
echo.

REM Check if puppeteer is installed
npm list puppeteer >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Puppeteer...
    call npm install puppeteer
    echo.
)

echo Starting browser monitor with dev server...
node browser-monitor.js

pause