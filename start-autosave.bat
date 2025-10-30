@echo off
echo Starting auto-commit every 3 minutes...
echo Press Ctrl+C to stop (or run stop-autosave.bat)
echo.

:loop
timeout /t 180 /nobreak >nul

REM Check if there are any changes
git diff --quiet
if %errorlevel% neq 0 (
    echo [%date% %time%] Changes detected, committing...
    git add .
    git commit -m "Auto-save: %date% %time%"
    echo Committed successfully.
) else (
    echo [%date% %time%] No changes to commit.
)

goto loop
