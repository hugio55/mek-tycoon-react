@echo off
echo Starting Chrome debug mode with your existing profile...
echo.
echo This will open a NEW Chrome window with debugging enabled.
echo Your existing Chrome windows will remain open.
echo.

start chrome --remote-debugging-port=9222 http://localhost:3100

echo.
echo Chrome debug window opened!
echo You can now run: node console-reader.js
echo.
pause