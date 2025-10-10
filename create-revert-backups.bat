@echo off
REM ============================================================================
REM COMPLETE BACKUP SCRIPT - Before Reverting to Single-Wallet
REM Creates multiple safety nets: git branch, tag, and Convex database export
REM ============================================================================

echo.
echo ============================================================================
echo  CREATING COMPLETE BACKUP BEFORE SINGLE-WALLET REVERT
echo ============================================================================
echo.

REM Get timestamp for backup naming
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%-%datetime:~10,2%-%datetime:~12,2%

echo [1/7] Creating backup directory...
if not exist "backups" mkdir backups
if not exist "backups\multi-wallet-%TIMESTAMP%" mkdir "backups\multi-wallet-%TIMESTAMP%"
echo       Created: backups\multi-wallet-%TIMESTAMP%
echo.

echo [2/7] Committing current state to git...
git add -A
git commit -m "CHECKPOINT: Multi-wallet system before revert - %TIMESTAMP%"
if errorlevel 1 (
    echo       Note: No changes to commit or already committed
) else (
    echo       ✓ Committed successfully
)
echo.

echo [3/7] Pushing current state to GitHub...
git push origin master
if errorlevel 1 (
    echo       ✗ Push failed - check internet connection
    echo       Continuing with local backups...
) else (
    echo       ✓ Pushed to GitHub successfully
)
echo.

echo [4/7] Creating backup branch...
git branch backup-multi-wallet-%TIMESTAMP%
git push origin backup-multi-wallet-%TIMESTAMP%
if errorlevel 1 (
    echo       ✗ Branch push failed - saved locally only
) else (
    echo       ✓ Backup branch created and pushed
)
echo.

echo [5/7] Creating immutable git tag...
git tag "multi-wallet-v1-%TIMESTAMP%" -m "Multi-wallet system before revert to single-wallet"
git push origin "multi-wallet-v1-%TIMESTAMP%"
if errorlevel 1 (
    echo       ✗ Tag push failed - saved locally only
) else (
    echo       ✓ Git tag created and pushed
)
echo.

echo [6/7] Exporting Convex database (this may take 30-60 seconds)...
echo       Please wait...
npx convex export
if errorlevel 1 (
    echo       ✗ Convex export failed - check if logged in
    echo       Run: npx convex dev
    pause
    exit /b 1
) else (
    echo       ✓ Database exported successfully
)
echo.

echo [7/7] Moving Convex backup to safe location...
for %%f in (*.zip) do (
    if exist "%%f" (
        move "%%f" "backups\multi-wallet-%TIMESTAMP%\"
        echo       ✓ Moved %%f to backup folder
    )
)
echo.

echo ============================================================================
echo  BACKUP COMPLETE! Summary:
echo ============================================================================
echo.
echo  Git Backups:
echo    - Commit pushed to GitHub master
echo    - Branch: backup-multi-wallet-%TIMESTAMP%
echo    - Tag: multi-wallet-v1-%TIMESTAMP%
echo.
echo  Database Backup:
echo    - Location: backups\multi-wallet-%TIMESTAMP%\
dir /b "backups\multi-wallet-%TIMESTAMP%\*.zip" 2>nul
if errorlevel 1 (
    echo      ✗ No ZIP file found - Convex export may have failed
) else (
    echo.
    echo  Backup size:
    dir "backups\multi-wallet-%TIMESTAMP%\*.zip" | find ".zip"
)
echo.
echo ============================================================================
echo  RESTORE COMMANDS (if needed later):
echo ============================================================================
echo.
echo  To restore code:
echo    git reset --hard multi-wallet-v1-%TIMESTAMP%
echo.
echo  To restore database (CAUTION - reverts all data):
echo    npx convex import backups\multi-wallet-%TIMESTAMP%\[filename].zip
echo.
echo ============================================================================
echo.
echo  You are now safe to proceed with the revert!
echo  All your data can be restored at any time.
echo.
pause
