@echo off
title DEV: ACHIEVEMENTS - localhost:3100/achievements
echo =================================================
echo Starting Development Server for ACHIEVEMENTS PAGE
echo =================================================
echo.
echo Page URL: http://localhost:3100/achievements
echo.

REM Open the page in Chrome after a short delay
start /b cmd /c "timeout /t 5 >nul && start chrome http://localhost:3100/achievements"

REM Start the dev server
npm run dev:all