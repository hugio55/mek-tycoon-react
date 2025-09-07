@echo off
set ANTHROPIC_API_KEY=YOUR_API_KEY_HERE

echo ========================================
echo  AUTO-IMPLEMENTING BLOCK GAME
echo ========================================
echo.
echo This will create a working block game at:
echo   src/app/scrap-yard/block-game/page.tsx
echo.
echo And add it to the Scrap Yard menu
echo.

cd /d "%~dp0"

node mek-swarm-auto.js "Create a fully functional Three.js block stacking game with glass-morphism UI, score tracking, and game over screen. Make it a complete, playable game." "src/app/scrap-yard/block-game/page.tsx"

echo.
echo ========================================
echo Block game implementation complete!
echo Check http://localhost:3100/scrap-yard/block-game
echo ========================================

pause