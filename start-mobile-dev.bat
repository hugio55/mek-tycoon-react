@echo off
REM Launch dev server in first terminal
start "Mek Tycoon - Dev Server" cmd /k "cd /d "%~dp0" && npm run dev:all"

REM Wait 2 seconds for dev server to start
timeout /t 2 /nobreak >nul

REM Launch tunnel in second terminal
start "Mek Tycoon - Tunnel" cmd /k "cd /d "%~dp0" && npm run tunnel"

echo Both terminals launched!
echo Dev Server: Terminal 1
echo Tunnel URL: Terminal 2 (wait for URL to appear)
timeout /t 3 /nobreak >nul
