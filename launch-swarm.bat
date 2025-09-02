@echo off
cls
echo ==================================================
echo     MEK TYCOON MULTI-AGENT SWARM LAUNCHER
echo ==================================================
echo.
echo Starting 7 specialized AI agents:
echo   - UI/UX Architect (Lead)
echo   - React/Next.js Specialist
echo   - CSS Animation Expert
echo   - Three.js Game Developer
echo   - Asset and Data Manager
echo   - Component Library Architect
echo   - Game Mechanics Developer
echo.
echo Each agent will open in its own window for parallel work!
echo ==================================================
echo.

REM Check if Ruby is installed
ruby --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Ruby is not installed!
    echo.
    echo Please run install-swarm.ps1 first:
    echo   1. Open PowerShell as Administrator
    echo   2. Run: Set-ExecutionPolicy Bypass -Scope Process
    echo   3. Run: C:\Users\Ben Meyers\Documents\Mek Tycoon\install-swarm.ps1
    echo.
    pause
    exit /b 1
)

REM Check if claude_swarm gem is installed
gem list claude_swarm -i >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing claude_swarm gem...
    gem install claude_swarm
)

echo Launching swarm...
echo.
claude-swarm

pause