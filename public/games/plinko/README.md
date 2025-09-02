# Plinko Game

A browser-based Plinko/Pachinko game with realistic physics built using Matter.js.

## Features
- Real physics simulation using Matter.js
- Black and yellow industrial theme
- Single ball drop or 10-ball rapid drop mode
- Pyramid peg layout with alternating offset pattern
- 10 scoring zones with multipliers (100x, 50x, 10x, 5x, 2x)
- Glowing pegs when hit by balls
- Mobile-optimized design (9:16 aspect ratio)

## How to Run

### Option 1: Simple HTTP Server (Recommended)
1. Install Node.js if not already installed
2. Open terminal/command prompt in this folder
3. Run: `npx http-server -p 8080`
4. Open browser to: http://localhost:8080

### Option 2: Python HTTP Server
1. Open terminal in this folder
2. Run: `python3 -m http.server 8080`
3. Open browser to: http://localhost:8080

### Option 3: Direct File Opening
Simply double-click `index.html` to open in your browser
(Note: Some browsers may have restrictions with local files)

## Files
- `index.html` - Main game page
- `game.js` - Game logic and physics
- `README.md` - This file

## Controls
- **DROP BALL** - Drops a single ball from center
- **DROP 10** - Drops 10 balls in rapid succession for statistical distribution testing

## Technologies Used
- Matter.js (v0.19.0) - Physics engine
- HTML5 Canvas - Rendering
- Vanilla JavaScript - Game logic

## Browser Compatibility
Works on all modern browsers (Chrome, Firefox, Safari, Edge)