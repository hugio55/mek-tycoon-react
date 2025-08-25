@echo off
echo ==================================================
echo MEK TYCOON - STABLE VIEWER INSTANCE
echo ==================================================
echo.
echo This runs a READ-ONLY viewer on port 3200
echo Multiple agents can modify files without interrupting this viewer
echo.
echo Viewer URL: http://localhost:3200
echo Dev URL:    http://localhost:3100
echo.
echo Press Ctrl+C to stop the viewer
echo.
echo Starting in 3 seconds...
timeout /t 3 /nobreak >nul

set NEXT_TELEMETRY_DISABLED=1
npm run dev:stable