@echo off
echo Stopping auto-commit...

REM Kill any running start-autosave.bat processes
taskkill /FI "WINDOWTITLE eq *start-autosave*" /F >nul 2>&1

echo Auto-commit stopped.
timeout /t 2 >nul
