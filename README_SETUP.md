# 🚀 Mek Tycoon Setup Guide

## Quick Start (2 terminals needed)

### Terminal 1: Start Convex Backend
```bash
cd "C:\Users\Ben Meyers\Documents\Mek Tycoon\mek-tycoon-react"
npx convex dev
```

**First time setup:**
1. When prompted "Welcome to Convex! Would you like to login?", type: **y** and press Enter
2. It will open a browser - login or create account
3. Choose: **Create a new project**
4. Enter project name: **mek-tycoon** (or press Enter for default)
5. Choose team (or create new one)
6. Wait for "Watching for file changes..." message
7. You'll see: `✔ Deployed Convex functions to https://[something].convex.cloud`

**IMPORTANT:** Copy the URL shown (like `https://wooden-fox-123.convex.cloud`)

### Update Environment File
1. Open `.env.local` file in the project
2. Add your Convex URL:
```
NEXT_PUBLIC_CONVEX_URL=https://wooden-fox-123.convex.cloud
```
(Replace with YOUR actual URL from Terminal 1)

### Terminal 2: Start Next.js
```bash
cd "C:\Users\Ben Meyers\Documents\Mek Tycoon\mek-tycoon-react"
npm run dev
```

### Open Browser
Go to: **http://localhost:3000**

## What You'll See
- **Home Page**: Landing page with game info
- **Start Crafting Button**: Takes you to `/crafting`
- **Crafting Page**: Real-time crafting interface

## Troubleshooting

### "Module not found" errors?
```bash
npm install
```

### "NEXT_PUBLIC_CONVEX_URL not defined"?
- Make sure you added the URL to `.env.local`
- Restart the Next.js server (Ctrl+C and `npm run dev` again)

### Convex errors?
- Make sure Terminal 1 shows "Watching for file changes..."
- Check that the URL in `.env.local` matches Terminal 1's output

## Features to Try
1. **Crafting Page** - Select recipes and start crafting
2. **Real-time Updates** - Watch timers count down
3. **Multiple Slots** - Run multiple crafts at once
4. **Speed Up** - Pay gold to finish instantly

## Next Development Steps
```bash
# Make changes, then commit
git add .
git commit -m "your message"

# View history
git log --oneline
```