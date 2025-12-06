@echo off
echo.
echo ============================================
echo   Syncing public folder to Cloudflare R2
echo ============================================
echo.

"C:\Users\Ben Meyers\Tools\rclone.exe" sync public r2:mek-tycoon-2 --progress --transfers 8

echo.
echo ============================================
echo   Sync complete!
echo ============================================
echo.
pause
