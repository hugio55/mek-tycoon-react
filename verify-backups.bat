@echo off
REM ============================================================================
REM VERIFY BACKUPS - Check that all safety nets are in place
REM ============================================================================

echo.
echo ============================================================================
echo  VERIFYING BACKUP SAFETY NETS
echo ============================================================================
echo.

set SAFE=1

echo [1/4] Checking for backup branches on GitHub...
git branch -r | findstr "backup-multi-wallet"
if errorlevel 1 (
    echo       ✗ No backup branch found on GitHub
    set SAFE=0
) else (
    echo       ✓ Backup branch exists
)
echo.

echo [2/4] Checking for git tags...
git tag | findstr "multi-wallet-v1"
if errorlevel 1 (
    echo       ✗ No backup tag found
    set SAFE=0
) else (
    echo       ✓ Backup tag exists
)
echo.

echo [3/4] Checking for Convex database backup...
if not exist "backups" (
    echo       ✗ No backups folder found
    set SAFE=0
) else (
    dir /b /s backups\*.zip 2>nul | findstr .
    if errorlevel 1 (
        echo       ✗ No database backup ZIP file found
        set SAFE=0
    ) else (
        echo       ✓ Database backup exists
        echo.
        echo       Latest backup:
        for /f %%f in ('dir /b /s backups\*.zip') do (
            echo       %%f
            dir "%%f" | find ".zip"
        )
    )
)
echo.

echo [4/4] Checking current commit is on GitHub...
git log -1 --oneline
git fetch origin
git rev-list HEAD..origin/master >nul 2>&1
if errorlevel 1 (
    echo       ✓ Current commit is pushed to GitHub
) else (
    echo       ⚠ Local commits not pushed (might be intentional)
)
echo.

echo ============================================================================
if %SAFE%==1 (
    echo  ✓✓✓ ALL BACKUPS VERIFIED - SAFE TO PROCEED ✓✓✓
) else (
    echo  ✗✗✗ SOME BACKUPS MISSING - REVIEW ABOVE ✗✗✗
)
echo ============================================================================
echo.
pause
