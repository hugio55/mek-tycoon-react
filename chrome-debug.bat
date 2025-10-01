@echo off
echo Starting Chrome in debug mode...
echo.
echo Close all Chrome windows first, then press any key to continue...
pause > nul

start chrome --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome-debug" http://localhost:3100

echo.
echo Chrome started with debugging enabled!
echo You can now run: node console-reader.js
echo.
pause