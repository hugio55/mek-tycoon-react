@echo off
cd /d "%~dp0"

echo ========================================
echo   Fly.io Secrets Updater (Safe Version)
echo ========================================
echo.
echo This script reads from .env and updates Fly.io secrets.
echo IMPORTANT: Make sure .env file exists and contains:
echo   - DISCORD_BOT_TOKEN
echo   - DISCORD_CLIENT_ID
echo   - DISCORD_GUILD_ID
echo   - NEXT_PUBLIC_CONVEX_URL
echo   - WEBSITE_URL
echo.

if not exist .env (
    echo ERROR: .env file not found!
    echo Please create .env file in discord-bot folder.
    pause
    exit /b 1
)

echo Reading secrets from .env file...
echo.

REM Read environment variables from .env file
for /f "tokens=1,2 delims==" %%a in (.env) do (
    set "%%a=%%b"
)

if "%DISCORD_BOT_TOKEN%"=="" (
    echo ERROR: DISCORD_BOT_TOKEN not found in .env
    pause
    exit /b 1
)

echo Setting secrets in Fly.io...
echo.

flyctl secrets set ^
    DISCORD_BOT_TOKEN="%DISCORD_BOT_TOKEN%" ^
    DISCORD_CLIENT_ID="%DISCORD_CLIENT_ID%" ^
    DISCORD_GUILD_ID="%DISCORD_GUILD_ID%" ^
    NEXT_PUBLIC_CONVEX_URL="%NEXT_PUBLIC_CONVEX_URL%" ^
    WEBSITE_URL="%WEBSITE_URL%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   SUCCESS! Secrets updated in Fly.io
    echo   Bot will restart automatically
    echo ========================================
) else (
    echo.
    echo ERROR: Failed to set secrets
)

echo.
pause
