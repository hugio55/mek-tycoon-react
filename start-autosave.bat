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

REM Check current branch status
for /f "delims=" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i

REM Check if detached HEAD or wrong branch
if "%CURRENT_BRANCH%"=="" (
    powershell -ExecutionPolicy Bypass -File show-branch-warning.ps1 -WarningType detached
) else if not "%CURRENT_BRANCH%"=="custom-minting-system" (
    powershell -ExecutionPolicy Bypass -File show-branch-warning.ps1 -WarningType wrong -CurrentBranch "%CURRENT_BRANCH%"
)

git diff --quiet
if %errorlevel% neq 0 (
    if "%CURRENT_BRANCH%"=="" (
        echo [%time%] ^>^> Changes detected. Committing...
        git add .
        git commit -m "Auto-save: %date% %time%"
        echo [%time%] ^>^> Commit successful!
    ) else if not "%CURRENT_BRANCH%"=="custom-minting-system" (
        echo [%time%] ^>^> Changes detected. Committing...
        git add .
        git commit -m "Auto-save: %date% %time%"
        echo [%time%] ^>^> Commit successful!
    ) else (
        echo [%time%] ^>^> Changes detected. Committing...
        git add .
        git commit -m "Auto-save: %date% %time%"
        echo [%time%] ^>^> Commit successful!
    )
) else (
    echo [%time%] No changes to commit.
)
echo.

goto loop
