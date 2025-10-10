@echo off
cd /d "%~dp0"
echo ========================================
echo   .env File Verification
echo ========================================
echo.

if not exist .env (
    echo ERROR: .env file not found!
    pause
    exit /b 1
)

echo Reading .env file...
echo.

for /f "tokens=1,2 delims==" %%a in (.env) do (
    if "%%a"=="DISCORD_BOT_TOKEN" (
        echo %%a = [Found - length unknown]
        set "token=%%b"
    ) else (
        echo %%a = %%b
    )
)

echo.
echo ========================================
echo Validation:
echo ========================================

if "%token%"=="" (
    echo [ERROR] DISCORD_BOT_TOKEN is missing or empty!
) else (
    echo [OK] DISCORD_BOT_TOKEN is set
)

if "%DISCORD_CLIENT_ID%"=="" (
    echo [ERROR] DISCORD_CLIENT_ID is missing or empty!
) else (
    echo [OK] DISCORD_CLIENT_ID is set
)

if "%DISCORD_GUILD_ID%"=="" (
    echo [ERROR] DISCORD_GUILD_ID is missing or empty!
) else (
    echo [OK] DISCORD_GUILD_ID is set
)

if "%NEXT_PUBLIC_CONVEX_URL%"=="" (
    echo [ERROR] NEXT_PUBLIC_CONVEX_URL is missing or empty!
) else (
    echo [OK] NEXT_PUBLIC_CONVEX_URL is set
)

if "%WEBSITE_URL%"=="" (
    echo [ERROR] WEBSITE_URL is missing or empty!
) else (
    echo [OK] WEBSITE_URL is set
)

echo.
echo ========================================
echo.
echo NOTE: If DISCORD_BOT_TOKEN shows as "Invalid Token"
echo in Fly.io logs, you need to generate a NEW token from:
echo https://discord.com/developers/applications
echo.
pause
