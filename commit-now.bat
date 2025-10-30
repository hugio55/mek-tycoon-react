@echo off
echo Manual commit triggered...
echo.

REM Check if there are any changes
git diff --quiet
if %errorlevel% neq 0 (
    git add .
    git commit -m "Manual save: %date% %time%"
    echo.
    echo ✓ Commit successful!
) else (
    echo No changes to commit.
)

echo.
timeout /t 2 >nul
