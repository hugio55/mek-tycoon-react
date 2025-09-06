@echo off
title MEK TYCOON - Development Menu
cls
echo ================================================
echo         MEK TYCOON DEVELOPMENT MENU
echo ================================================
echo.
echo Choose which page to develop:
echo.
echo   1. HUB Page         (localhost:3100/hub)
echo   2. CRAFTING Page    (localhost:3100/crafting)
echo   3. PROFILE Page     (localhost:3100/profile)
echo   4. ADMIN Page       (localhost:3100/admin)
echo   5. ACHIEVEMENTS     (localhost:3100/achievements)
echo   6. Custom URL       (Enter your own page)
echo.
echo   0. Exit
echo.
echo ================================================
set /p choice="Enter your choice (0-6): "

if "%choice%"=="1" (
    call dev-hub.bat
) else if "%choice%"=="2" (
    call dev-crafting.bat
) else if "%choice%"=="3" (
    call dev-profile.bat
) else if "%choice%"=="4" (
    call dev-admin.bat
) else if "%choice%"=="5" (
    call dev-achievements.bat
) else if "%choice%"=="6" (
    set /p page="Enter page path (e.g., /mek-selector): "
    call dev-custom.bat %page%
) else if "%choice%"=="0" (
    exit
) else (
    echo Invalid choice. Please try again.
    timeout /t 2 >nul
    call dev-menu.bat
)