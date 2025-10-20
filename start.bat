@echo off
REM Start staging development server on port 3200

echo.
echo ========================================
echo   STAGING ENVIRONMENT (Port 3200)
echo   Database: brave-dodo-490 (staging)
echo   Branch: essence-system
echo ========================================
echo.

REM Start both Next.js and Convex
npx concurrently "npx next dev -p 3200 -H 0.0.0.0" "npx convex dev --typecheck=disable --url https://brave-dodo-490.convex.cloud"
