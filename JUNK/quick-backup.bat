@echo off
echo Creating quick backup...

REM Get current date and time
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set backup_name=backup-%datetime:~0,8%-%datetime:~8,6%

REM Create the backup commit
git add -A 2>nul
git commit -m "Quick backup: %backup_name%" 2>nul

if %errorlevel% == 0 (
    echo.
    echo ✅ Backup created successfully!
    echo Backup ID: %backup_name%
    echo.
    echo To restore this backup later, use:
    echo git log --oneline
    echo git checkout [commit-hash]
) else (
    echo ✓ No changes to backup (everything already saved)
)

echo.
pause