# Dual Development Environment Setup (Git Worktrees)

## Overview
Run production and staging environments simultaneously using Git Worktrees - two separate directories sharing one git repository.

## Quick Start

### Terminal 1: Production Environment
```bash
cd "C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react"

# Start production server
start.bat

# Opens: http://localhost:3100
# Database: rare-dinosaur-331 (production)
# Branch: master
```

### Terminal 2: Staging Environment
```bash
cd "C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react-staging"

# Start staging server
start.bat

# Opens: http://localhost:3200
# Database: brave-dodo-490 (staging)
# Branch: essence-system
```

## What You Get

✅ **Port 3100** - Production code (master branch) with production database
✅ **Port 3200** - Staging code (essence-system branch) with staging database
✅ **Both running at once** - no need to switch branches or restart
✅ **Side-by-side testing** - open both in browser tabs
✅ **Instant hot-reload** - changes reflect immediately in both environments
✅ **Separate .env.local files** - no configuration conflicts

## How It Works

**Git Worktrees** create two separate working directories that share the same git repository:
- `mek-tycoon-react/` - Main directory (master branch)
- `mek-tycoon-react-staging/` - Worktree directory (essence-system branch)

Each directory has:
- Its own `.env.local` file
- Its own `node_modules/`
- Its own development server
- But they share the same git history

## Workflow Examples

### Fixing a Production Bug
1. Go to Terminal 1 (Port 3100 - mek-tycoon-react directory)
2. Switch to master branch: `git checkout master`
3. Make the fix
4. Test on localhost:3100
5. Commit: `git commit -m "Fix production bug"`
6. Push: `git push origin master`
7. Production deploys automatically

### Working on Essence System
1. Go to Terminal 2 (Port 3200 - mek-tycoon-react-staging directory)
2. Already on essence-system branch
3. Make changes
4. Test on localhost:3200 (uses staging database)
5. Commit: `git commit -m "Add essence feature"`
6. Push: `git push origin essence-system`
7. Preview deployment updates automatically

### Comparing Production vs Staging
1. Open http://localhost:3100 (production)
2. Open http://localhost:3200 (staging)
3. See differences side-by-side in real-time

## Important Notes

- **Each directory is independent** - changes in one don't affect the other
- **Both use the same git repo** - commits/branches are shared
- **No file conflicts** - each has its own .env.local
- **No port conflicts** - different ports (3100 vs 3200)
- **Instant feedback** - no waiting for Vercel deploys

## Managing Worktrees

### List all worktrees
```bash
git worktree list
```

### Remove staging worktree (if needed)
```bash
cd "C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react"
git worktree remove ../mek-tycoon-react-staging
```

### Recreate staging worktree
```bash
cd "C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react"
git worktree add -b essence-system-worktree ../mek-tycoon-react-staging essence-system
cd ../mek-tycoon-react-staging
npm install
```
