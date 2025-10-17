@echo off
echo ============================================
echo Mek Tycoon - Development Server with Monitoring
echo ============================================
echo.
echo Starting dev server and log monitor...
echo Logs will be saved to: logs\monitor-summary.log
echo.
echo Press Ctrl+C to stop monitoring and view summary
echo ============================================
echo.

npm run dev:all | python monitor-logs.py
