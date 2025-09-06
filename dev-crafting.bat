@echo off
title DEV: CRAFTING PAGE - localhost:3100/crafting
echo ============================================
echo Starting Development Server for CRAFTING PAGE
echo ============================================
echo.
echo Page URL: http://localhost:3100/crafting
echo.

REM Open the page in Chrome after a short delay
start /b cmd /c "timeout /t 5 >nul && start chrome http://localhost:3100/crafting"

REM Start the dev server
npm run dev:all