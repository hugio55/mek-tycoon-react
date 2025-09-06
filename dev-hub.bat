@echo off
title DEV: HUB PAGE - localhost:3100/hub
echo ========================================
echo Starting Development Server for HUB PAGE
echo ========================================
echo.
echo Page URL: http://localhost:3100/hub
echo.

REM Open the page in Chrome after a short delay
start /b cmd /c "timeout /t 5 >nul && start chrome http://localhost:3100/hub"

REM Start the dev server
npm run dev:all