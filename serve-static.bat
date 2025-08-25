@echo off
echo Building static version of the site...
call npm run build

echo.
echo Starting static server on port 3200...
echo You can view the stable version at: http://localhost:3200
echo.
echo This version won't change while development happens on port 3100
echo Press Ctrl+C to stop the server
echo.

npx serve out -l 3200