@echo off
:: Claude with audio notification when waiting
:: This plays a beep every 30 seconds while claude is running
:: to remind you to check if it's waiting for input

echo Starting Claude with periodic reminder beeps...
echo.

:: Start claude in background
start "" /B claude %*

:: Play a beep every 30 seconds as a reminder
:loop
timeout /t 30 /nobreak >nul 2>&1
powershell -Command "[console]::beep(600, 150)"
goto loop