@echo off
cd /d "%~dp0"

echo ========================================
echo   Full Deployment (Convex + Discord Bot)
echo ========================================
echo.

echo Step 1/2: Deploying Convex database schema...
echo.
cd ..
call npx convex deploy --typecheck=disable -y
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Convex deployment failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 2/2: Deploying Discord bot to Fly.io...
echo.
cd discord-bot
call flyctl deploy
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Fly.io deployment failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCCESS! Full deployment complete
echo ========================================
echo.
echo Bot should be online in ~60 seconds
echo Check logs with: flyctl logs
echo.
pause
