@echo off
cd /d "%~dp0"
echo ========================================
echo AUTO-COMMIT STARTED
echo Checking every 3 minutes...
echo Press Ctrl+C to stop (or run stop-autosave.bat)
echo ========================================
echo.

:loop
echo [%time%] Waiting 3 minutes...
timeout /t 180 /nobreak >nul

echo [%time%] Checking for changes...
git diff --quiet
if %errorlevel% neq 0 (
    echo [%time%] ^>^> Changes detected! Committing...
    git add .
    git commit -m "Auto-save: %date% %time%"
    echo [%time%] ^>^> Commit successful!
) else (
    echo [%time%] No changes to commit.
)
echo.

goto loop
