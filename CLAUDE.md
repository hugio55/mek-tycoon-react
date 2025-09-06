# Mek Tycoon - Project Instructions

## Quick Start Command
When user says "start it up" or similar, run:
```bash
cd "C:\Users\Ben Meyers\Documents\Mek Tycoon\mek-tycoon-react" && npm run dev:all
```
This starts both Next.js (port 3100) and Convex in one terminal.

## Project Overview
Mek Tycoon is a web-based idle/tycoon game featuring collectible Mek NFTs. The game combines resource management, crafting, and collection mechanics with a sleek, futuristic UI.

## Tech Stack
- **Frontend**: Next.js 15.4.6 (App Router), React, TypeScript
- **Styling**: Tailwind CSS v3 (NOT v4!) with custom glass-morphism effects
- **Database**: Convex (real-time backend)
- **Blockchain**: Cardano (wallet integration via MeshSDK - currently disabled)

## CRITICAL: Tailwind CSS Version Management
**⚠️ ALWAYS CHECK FIRST: This project uses Tailwind CSS v3, NOT v4!**

### If styles appear broken (plain text appearance):
1. **IMMEDIATELY CHECK** package.json for Tailwind version (must be ^3.x.x, NOT ^4.x.x)
2. **FIX IMMEDIATELY** if wrong:
   ```bash
   npm uninstall tailwindcss @tailwindcss/postcss
   npm install -D tailwindcss@^3 postcss autoprefixer
   rm -rf .next
   npm run dev:all
   ```

### Required Config Files (DO NOT DELETE):
- `tailwind.config.ts` - v3 configuration
- `postcss.config.mjs` - Must use `{tailwindcss: {}, autoprefixer: {}}`
- `src/app/globals.css` - Must use `@tailwind base/components/utilities`

### NEVER USE:
- `npm update` (can break version locks)
- `npm install tailwindcss@latest` (installs v4)
- `@import "tailwindcss"` syntax (v4 only)
- `@theme inline` directive (v4 only)
- `@tailwindcss/postcss` package (v4 only)

### ALWAYS USE:
- `npm ci` when possible (respects lock file)
- `npm install` without version specifier (respects package.json)
- Check CRITICAL_DEPENDENCIES.md if issues arise

## Visual Testing with Playwright

### Available Testing Commands
- **`/visual-check`** - Verify visual changes are working in browser
- **`@visual-test`** - Activate visual testing agent for detailed inspection

### What Gets Tested
1. **Visual Changes**: Screenshots before/after to confirm changes
2. **Console Errors**: Monitor for JavaScript errors or warnings
3. **Interactions**: Click, hover, and focus states
4. **Responsiveness**: Different viewport sizes
5. **Animations**: Smooth transitions and effects

### Example Usage
- `/visual-check - verify the save button turned green`
- `/visual-check - check if mek template modal opens`
- `@visual-test check if the talent tree nodes are centered on click`

## Design Requirements

### Visual Style
- Dark theme with black backgrounds
- Yellow accent color (#fab617 / rgba(250, 182, 23))
- Glass-morphism effects with backdrop blur
- Subtle animations (no distracting/flashy effects)
- Font preferences:
  - Headers: Orbitron, Rajdhani, or Bebas Neue
  - Body: Inter, Segoe UI
  - Monospace: Consolas, Monaco

### UI Components
- Navigation with dropdown menus for 6 categories
- Large logo at top with subtle shimmer effect
- HUB button with special styling
- Cards with gradient borders and hover effects
- LED-style indicators instead of progress bars

## Important Data Structure

### Mek Variations (from CSV)
- **102 Head Variations** (not 103)
- **112 Body Variations**
- **95 Trait Variations**

### Crafting System Hierarchy
The crafting system follows this flow:
1. Select Component Type (Heads/Bodies/Traits)
2. Select Group (e.g., Cameras & Film, Musical, Materials)
3. Select Style (specific variation from that group)
4. Select Final Variation (complete the crafting)

## Development Guidelines

### Code Style
- Use functional React components with TypeScript
- Prefer `const` over `let` when possible
- Use proper TypeScript types (avoid `any`)
- Keep components modular and reusable

### File Structure
```
src/
  app/           # Next.js app router pages
  components/    # Reusable components
  contexts/      # React contexts
  lib/           # Utility functions
convex/          # Backend functions and schema
public/          # Static assets
```

### Common Issues & Solutions
1. **CSS/Styling broken (plain text appearance)**: Check Tailwind version! Must be v3, not v4. See "CRITICAL: Tailwind CSS Version Management" section above
2. **Port conflicts**: Dev server may use ports 3000-3007+
3. **Wallet integration**: Currently disabled (WalletConnect commented out)
4. **styled-jsx errors**: NEVER use styled-jsx - causes Jest/webpack errors. Use global CSS or Tailwind classes instead
5. **Jest worker errors**: Remove ALL `<style jsx>` blocks from components

## Key Features

### Implemented
- Hub page with gold collection mechanics
- Profile page with Mek management
- Crafting system with hierarchical selection
- Navigation with dropdown menus
- Real-time data updates via Convex

### Pending/Future
- Wallet integration (Cardano/MeshSDK)
- Marketplace/Auction House
- Battle system
- Minigames
- Achievement system

## Testing Commands
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Run ESLint
npx tsc --noEmit   # TypeScript type checking
```

## Notes for Claude
- **FIRST THING TO CHECK**: If styles look broken, verify Tailwind is v3 not v4 in package.json
- Always check existing file conventions before making changes
- Preserve exact indentation and formatting
- Don't add comments unless explicitly requested
- Match the existing HTML version's functionality when converting pages
- Keep responses concise and focused on the task
- Use TodoWrite tool for complex multi-step tasks
- NEVER suggest `npm update` or upgrading to latest packages
- NEVER use styled-jsx (causes build errors)

## 🚨 CRITICAL SAVE SYSTEM PROTECTION 🚨
**NEVER modify these files without asking the user TWICE:**
- `/src/app/admin-save/*` - Save system interface
- `/api/save/*`, `/api/restore/*`, `/api/delete-save/*` - Backend operations  
- `/convex/saves.ts` - Database schema
- `/saves/` directory - Actual backup files
- See `CRITICAL_DO_NOT_MODIFY.md` for full protection rules

**Before modifying ANY save-related file:**
1. First ask: "This affects your save system. Should I proceed?"
2. Get confirmation again: "Are you ABSOLUTELY SURE?"
3. Explain exactly what will change and why

## Communication Guidelines
- **Ask for clarity**: If instructions are vague or unclear, ask specific questions rather than guessing
- **Voice concerns**: If an implementation might break something or cause issues, speak up before proceeding
- **Be direct and honest**: Don't hesitate to point out potential problems or downsides
- **Suggest better solutions**: If there's a better approach than what's requested, propose it with clear reasoning
- **Be matter-of-fact**: Present pros/cons objectively without sugar-coating issues
- **It's OK to say "I don't know"**: Better to admit uncertainty than implement something potentially harmful

## Task Completion Rules
- **ALWAYS finish current tasks completely**: When the user adds new prompts while you're working on something, complete ALL aspects of the current task before moving to the next one
- **Don't skip parts**: Even if new requests come in, don't skip or rush through any part of what you're currently implementing
- **Track your work**: Use the TodoWrite tool to ensure nothing gets forgotten when multiple tasks are queued
- **Acknowledge stacked requests**: Let the user know you'll address their new request after completing the current task

## User Preferences
- No emojis in code or file content (unless explicitly requested)
- Minimal, clean code without unnecessary documentation
- Focus on functionality over extensive comments
- Preserve original design aesthetic from HTML version
- Direct, honest communication about technical decisions
- Open to better solutions and alternative approaches

## Session History & Important Updates

### 2025-08-18 (Latest)
**Port Configuration Fixed:**
- Set up fixed port 3100 for Next.js (no more port switching!)
- Created unified startup with `npm run dev:all`
- Added `start.bat` for easy double-click startup
- Installed Cardano wallet integration (MeshSDK)
- Created WalletContext and WalletConnect components

### 2025-08-18 (Earlier)
**Major Changes:**
- Fixed Navigation clicking issues (removed overlapping pointer-events-none divs)
- Restructured Crafting page to follow correct hierarchy: group → style → variation
- Corrected head count from 103 to 102 (actual count from CSV)
- Disabled wallet integration temporarily (MeshSDK components commented out)
- Removed styled-jsx usage (causes webpack errors) - use global CSS instead
- Added welcome page routing logic (Navigation hidden on "/" route)

**Issues Discovered:**
- Port conflicts common (app may run on 3000-3003)
- styled-jsx doesn't work properly with current Next.js setup
- Logo shimmer animation removed (was causing visual issues with multiply blend mode)

**Current State:**
- App functional on port 3002/3003
- Wallet integration disabled but components exist for future use
- Crafting system properly structured with all 102 heads, 112 bodies, 95 traits