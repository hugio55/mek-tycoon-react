@echo off
echo Mek Tycoon Swarm - Workflow Runner
echo ==================================
echo.
echo Available Workflows:
echo.
echo 1. new-feature    - Implement a new UI feature
echo 2. minigame       - Create a new Three.js minigame
echo 3. crafting-system - Enhance crafting system UI
echo.
set /p workflow="Enter workflow name or number: "

if "%workflow%"=="1" set workflow=new-feature
if "%workflow%"=="2" set workflow=minigame
if "%workflow%"=="3" set workflow=crafting-system

echo.
echo Describe the task for the swarm:
set /p task=""

echo.
echo Starting workflow: %workflow%
echo Task: %task%
echo.

claude-swarm workflow --config swarm/mek-tycoon-swarm.json --workflow %workflow% --task "%task%"

pause