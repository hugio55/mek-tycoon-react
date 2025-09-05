@echo off
echo Mek Tycoon Swarm - Interactive Chat
echo ====================================
echo.
echo Choose an agent to chat with:
echo.
echo 1. UI/UX Architect (Lead)
echo 2. React/Next.js Specialist  
echo 3. CSS Animation Expert
echo 4. Three.js Game Developer
echo 5. Asset & Data Manager
echo 6. Component Library Architect
echo 7. Game Mechanics Developer
echo.
set /p choice="Enter number (1-7): "

if "%choice%"=="1" set agent=architect
if "%choice%"=="2" set agent=react-dev
if "%choice%"=="3" set agent=css-animator
if "%choice%"=="4" set agent=threejs-dev
if "%choice%"=="5" set agent=asset-manager
if "%choice%"=="6" set agent=component-lib
if "%choice%"=="7" set agent=game-mechanics

if "%agent%"=="" (
    echo Invalid choice!
    pause
    exit /b 1
)

echo.
echo Starting chat with %agent%...
echo Type 'exit' to quit
echo.

claude-swarm chat --config swarm/mek-tycoon-swarm.json --agent %agent%

pause