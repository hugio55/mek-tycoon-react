@echo off
title Mek Tycoon - Restore Backup
echo ========================================
echo    RESTORE FROM BACKUP
echo ========================================
echo.
echo Recent backups and saves:
echo.
git log --oneline -10
echo.
echo ========================================
echo.
echo To restore a specific version:
echo 1. Note the commit hash (like 3f23bf4)
echo 2. Close this window
echo 3. Run: git checkout [hash]
echo.
echo To create a recovery branch:
echo Run: git checkout -b recovery-branch [hash]
echo.
pause