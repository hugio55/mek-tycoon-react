@echo off
echo.
echo ═══════════════════════════════════════════════════════════════
echo           CURRENT GIT BRANCH STATUS
echo ═══════════════════════════════════════════════════════════════
echo.
for /f %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo   Current Branch: %CURRENT_BRANCH%
echo.
if "%CURRENT_BRANCH%"=="custom-minting-system" (
    echo   ✓ You are on the CORRECT branch
    echo.
) else (
    echo   ⚠️  WARNING: You are NOT on your main working branch!
    echo   ⚠️  Expected: custom-minting-system
    echo   ⚠️  Current:  %CURRENT_BRANCH%
    echo.
    echo   This may be an old or experimental branch.
    echo   Consider switching to custom-minting-system before working.
    echo.
)
echo ═══════════════════════════════════════════════════════════════
echo.
pause
