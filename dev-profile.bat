@echo off
title DEV: PROFILE PAGE - localhost:3100/profile
echo ============================================
echo Starting Development Server for PROFILE PAGE
echo ============================================
echo.
echo Page URL: http://localhost:3100/profile
echo.

REM Open the page in Chrome after a short delay
start /b cmd /c "timeout /t 5 >nul && start chrome http://localhost:3100/profile"

REM Start the dev server
npm run dev:all