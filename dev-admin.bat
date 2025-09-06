@echo off
title DEV: ADMIN PAGE - localhost:3100/admin
echo ==========================================
echo Starting Development Server for ADMIN PAGE
echo ==========================================
echo.
echo Page URL: http://localhost:3100/admin
echo.

REM Open the page in Chrome after a short delay
start /b cmd /c "timeout /t 5 >nul && start chrome http://localhost:3100/admin"

REM Start the dev server
npm run dev:all