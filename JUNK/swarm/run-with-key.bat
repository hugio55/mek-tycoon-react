@echo off
set ANTHROPIC_API_KEY=YOUR_API_KEY_HERE

echo ========================================
echo    MEK TYCOON AUTONOMOUS SWARM
echo ========================================
echo.
echo API Key is set!
echo.

cd /d "%~dp0"

echo Testing configuration...
node test-swarm.js

echo.
echo Starting swarm in 3 seconds...
timeout /t 3 /nobreak >nul

echo.
echo Dashboard will be available at: http://localhost:4200
echo.

if "%~1"=="" (
    node mek-swarm.js "Create a Three.js tower stacking mini-game with glass-morphism UI"
) else (
    node mek-swarm.js %*
)

pause