@echo off
REM Start production development server on port 3100 with production database

echo.
echo ========================================
echo   PRODUCTION ENVIRONMENT (Port 3100)
echo   Database: rare-dinosaur-331 (prod)
echo   Branch: master
echo ========================================
echo.

REM Use default port 3100 and production database from .env.local
npm run dev:all
