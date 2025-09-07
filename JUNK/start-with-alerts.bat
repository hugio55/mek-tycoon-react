@echo off
echo Starting Mek Tycoon with audio alerts for prompts...
echo.
echo This will play a sound when the console needs your input!
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0alert-on-prompt.ps1" -Command "npm run dev:all"
pause