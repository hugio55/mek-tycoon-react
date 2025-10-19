@echo off
REM Start staging development server on port 3200 with staging database

echo.
echo ========================================
echo   STAGING ENVIRONMENT (Port 3200)
echo   Database: brave-dodo-490 (staging)
echo   Branch: essence-system
echo ========================================
echo.

REM Backup production .env.local
copy /Y .env.local .env.local.prod.backup >nul

REM Replace with staging env
copy /Y .env.local.staging .env.local >nul

echo [STAGING] Using brave-dodo-490 database
echo.

REM Start both servers using concurrently with explicit port
npx concurrently "npx next dev -p 3200 -H 0.0.0.0" "npx convex dev --typecheck=disable --url https://brave-dodo-490.convex.cloud"

REM Restore production .env.local on exit
copy /Y .env.local.prod.backup .env.local >nul
del .env.local.prod.backup >nul
