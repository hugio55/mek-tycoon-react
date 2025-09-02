@echo off
set ANTHROPIC_API_KEY=YOUR_API_KEY_HERE

echo ========================================
echo    DEBUGGING BLOCK GAME
echo ========================================
echo.

cd /d "%~dp0"

node mek-swarm.js "URGENT DEBUG: The block stacking game at src/app/scrap-yard/block-game/BlockGame.tsx is broken. When user clicks Start, no blocks appear to be moving. When spacebar is pressed, the score goes to 1 immediately, then game over on next press. The blocks should be moving side to side. Please read the file and identify why the blocks aren't visually moving and fix it."

pause