# Port Configuration

## Fixed Ports
- **Next.js Development Server**: Port 3100
- **Convex**: Uses its own ports (managed by Convex CLI)

## Starting the Application

### Option 1: Single Command (Recommended)
Run both servers simultaneously:

**Windows Command Prompt:**
```cmd
start.bat
```

**Windows PowerShell:**
```powershell
.\start.ps1
```

**Or using npm:**
```bash
npm run dev:all
```

### Option 2: Separate Terminals
If you prefer separate terminals for each service:

**Terminal 1 - Next.js:**
```bash
npm run dev
```

**Terminal 2 - Convex:**
```bash
npm run dev:convex
```

## Available Scripts

| Script | Description | Port |
|--------|-------------|------|
| `npm run dev` | Start Next.js dev server only | 3100 |
| `npm run dev:convex` | Start Convex backend only | Auto |
| `npm run dev:all` | Start both servers together | 3100 + Auto |
| `npm start` | Production Next.js server | 3100 |

## Why Port 3100?
- Avoids conflicts with common ports (3000, 3001, 8080)
- Easy to remember
- Consistent across all environments

## Troubleshooting

### Port Already in Use
If port 3100 is already in use:

1. Find the process using the port:
```cmd
netstat -ano | findstr :3100
```

2. Kill the process (replace PID with actual process ID):
```cmd
taskkill /PID <PID> /F
```

### Change Port
To change the port, edit `package.json`:
```json
"dev": "next dev -p YOUR_PORT",
"start": "next start -p YOUR_PORT"
```

## Benefits of This Setup
✅ No more random port switching
✅ Consistent URLs for bookmarks
✅ Easy to remember port number
✅ Single command to start everything
✅ Works with both CMD and PowerShell