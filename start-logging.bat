@echo off
REM Start logging all terminal activity for Claude Code to read
echo Starting terminal logging...
echo Transcript started at %date% %time% >> terminal-logs.txt
echo ================================================ >> terminal-logs.txt

REM Launch PowerShell with transcript enabled
powershell -NoExit -Command "Start-Transcript -Path '%~dp0terminal-logs.txt' -Append"
