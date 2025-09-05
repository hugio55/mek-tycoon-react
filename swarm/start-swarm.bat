@echo off
echo ========================================
echo    MEK TYCOON AUTONOMOUS SWARM
echo ========================================
echo.

:: Check if API key is set
if "%ANTHROPIC_API_KEY%"=="" (
    echo ERROR: ANTHROPIC_API_KEY not set!
    echo.
    echo Please set your API key first:
    echo   set ANTHROPIC_API_KEY=your-api-key-here
    echo.
    pause
    exit /b 1
)

echo Installing dependencies...
cd /d "%~dp0"
call npm install

echo.
echo Starting swarm...
echo Dashboard will be available at: http://localhost:4200
echo.

:: Run with a default task or accept command line argument
if "%~1"=="" (
    node mek-swarm.js "Create an engaging Three.js mini-game for Mek Tycoon where players stack blocks to earn essence. Include glass-morphism UI elements and smooth animations."
) else (
    node mek-swarm.js %*
)

pause
