@echo off
REM Change to the script's directory (where this .bat file is located)
cd /d "%~dp0"

cls
echo.
echo ================================================================
echo            GIT BRANCH STATUS CHECK
echo ================================================================
echo.

REM Get current branch
for /f "delims=" %%i in ('git branch --show-current 2^>nul') do set CURRENT_BRANCH=%%i

REM Check if git command worked
if "%CURRENT_BRANCH%"=="" (
    echo   ERROR: Could not detect git branch
    echo   Make sure you're in a git repository
    echo.
    timeout /t 4 /nobreak >nul
    exit /b
)

echo   Current Branch: %CURRENT_BRANCH%
echo.

REM Compare to expected branch
if "%CURRENT_BRANCH%"=="custom-minting-system" (
    powershell -command "Write-Host '  STATUS: OK - You are on the CORRECT branch' -ForegroundColor Green"
    echo.
) else (
    powershell -command "Write-Host '  WARNING: You are NOT on your main working branch!' -ForegroundColor Red"
    echo.
    echo   Expected: custom-minting-system
    echo   Current:  %CURRENT_BRANCH%
    echo.
    echo   This may be an old or experimental branch.
    echo   Consider switching to custom-minting-system before working.
    echo.
)

echo ================================================================
echo.
echo Window will close in 4 seconds...
timeout /t 4 /nobreak >nul
