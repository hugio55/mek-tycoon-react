@echo off
echo Deploying Discord bot to Fly.io...
cd /d "%~dp0"
flyctl deploy
echo.
echo Deployment complete!
pause
