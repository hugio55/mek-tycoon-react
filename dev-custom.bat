@echo off
set page=%1
if "%page%"=="" set /p page="Enter page path (e.g., /mek-selector): "

title DEV: CUSTOM PAGE - localhost:3100%page%
echo ================================================
echo Starting Development Server for CUSTOM PAGE
echo ================================================
echo.
echo Page URL: http://localhost:3100%page%
echo.

REM Open the page in Chrome after a short delay
start /b cmd /c "timeout /t 5 >nul && start chrome http://localhost:3100%page%"

REM Start the dev server
npm run dev:all