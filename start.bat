@echo off
echo ========================================
echo Starting Mek Tycoon Development Servers
echo ========================================
echo.
echo Next.js will run on: http://localhost:3100
echo Convex Dashboard: https://dashboard.convex.dev
echo.
echo Press Ctrl+C to stop both servers
echo ========================================
echo.

cd /d "%~dp0"
npm run dev:all