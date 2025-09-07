@echo off
title Mek Tycoon - Auto Save System
echo ========================================
echo    MEK TYCOON AUTO-SAVE SYSTEM
echo ========================================
echo.
echo This will auto-save your work every 30 minutes
echo Press Ctrl+C to stop
echo.
powershell -ExecutionPolicy Bypass -File autosave.ps1
pause