# Mek Tycoon - Project Instructions

## Quick Start Command
**CRITICAL: We are ONLY working in the STAGING directory now.**

When user says "start it up" or similar, run:
```bash
npm run dev:all
```
This starts both Next.js (port 3200) and Convex in one terminal.

**Current Working Directory**: `C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react-staging`
**Database**: `wry-trout-962.convex.cloud` (staging database - isolated from production)
**Port**: localhost:3200
**DO NOT use the main `mek-tycoon-react` directory - ONLY use staging!**

## 🚨🚨🚨 CRITICAL: GIT CHECKOUT DESTROYS UNCOMMITTED WORK 🚨🚨🚨
**NEVER EVER RUN `git checkout <filename>` UNLESS EXPLICITLY APPROVED BY USER**

### THE MOST DANGEROUS GIT COMMAND
```bash
git checkout src/components/SomeFile.tsx  # ❌❌❌ DESTROYS UNCOMMITTED WORK PERMANENTLY
```

**What this command does:**
- **PERMANENTLY DELETES** all uncommitted changes in the specified file
- Restores file to last committed version
- **NO UNDO** - changes are gone forever
- **NO WARNING** - Git doesn't ask for confirmation
- **NO BACKUP** - Uncommitted work has zero protection

**Real incident that happened in this project:**
- Previous Claude session: User spent hours making UI improvements to EssenceDistributionLightbox
- Changes included: removing debug panels, resizing elements, fixing positioning (~250 lines of work)
- Those changes were never committed (still just in working file)
- Current session: File had syntax error, I ran `git checkout` to "fix" it
- **RESULT**: All uncommitted work from hours ago was PERMANENTLY DELETED
- User had to re-do all the work by reading session logs and manually re-implementing

### ABSOLUTE RULES FOR GIT CHECKOUT:
1. **NEVER use `git checkout <file>` to fix errors** - Use Edit tool instead
2. **NEVER use it as a "reset" or "undo"** - Fix issues directly
3. **ALWAYS ask user first** if you think checkout is needed
4. **WARN user TWICE** about what will be lost
5. **Check `git status`** first to see if there are uncommitted changes
6. **If there ARE uncommitted changes**: STOP and ask user to commit them first

### Safe Alternatives:
- **To fix syntax errors**: Use Edit tool to fix the specific lines
- **To undo recent changes**: Ask user if they want to lose uncommitted work first
- **To see differences**: Use `git diff <file>` (safe, read-only)
- **To create backup**: Ask user to commit their work first

### The Only Time It's Safe:
- User explicitly says "discard my uncommitted changes"
- User confirms they don't care about losing work
- You've warned them TWICE about what will be lost
- `git status` shows the file has changes and user approves deletion

### Red Flag Scenarios (DO NOT USE CHECKOUT):
- ❌ File has syntax errors → Fix with Edit tool
- ❌ File seems corrupted → Ask user, don't checkout
- ❌ Want to "reset" to clean state → Ask user first
- ❌ Testing if old version works → Ask user to commit first
- ❌ Any uncertainty about uncommitted work → DON'T RISK IT

**REMEMBER**: This project has had HOURS of work destroyed by this command. Treat `git checkout <file>` like `rm -rf /` - assume it will destroy important work unless proven otherwise.

---

## 🚨🚨🚨 CRITICAL: BRANCH SWITCHING PROTECTION 🚨🚨🚨
**NEVER SWITCH BRANCHES WITHOUT EXPLICIT USER APPROVAL - MULTIPLE TIMES**

### The Danger of Working on Wrong Branch
**Working on the wrong branch is the user's BIGGEST NIGHTMARE.** This has caused MULTIPLE incidents of lost work in this project.

### What Happens When You Work on Wrong Branch:
1. User is on old branch from 9 days ago
2. Makes hours of changes thinking they're on current branch
3. Switches back to current branch
4. **ALL UNCOMMITTED WORK FROM OLD BRANCH IS LOST FOREVER**
5. User has to re-do everything manually

### Real Incident - November 1, 2025:
**What happened:**
- User asked: "Could you please look into the Essence System work tree branch?"
- I ran `git checkout essence-system-worktree` (branch from Oct 23, 9 days old)
- Dev server reloaded with old code from 9 days ago
- User saw old UI and thought "days and days of work" was lost
- User panicked - this had happened before and they lost real work
- Had to switch back to custom-minting-system to recover current work

**Why this was dangerous:**
- User didn't realize branch had switched
- If they had made changes while on old branch, those would be lost when switching back
- They've lost work this way before - hours of effort gone forever

### MANDATORY BRANCH PROTECTION RULES:

#### 1. CHECK BRANCH BEFORE ANY WORK
**BEFORE starting ANY task, ALWAYS run:**
```bash
git branch --show-current
```

**If NOT on `custom-minting-system` branch:**
- ⚠️ **STOP IMMEDIATELY**
- Warn user: "⚠️ WARNING: You are currently on branch '[branch-name]', not 'custom-minting-system'. This may be an old branch. Should we switch to custom-minting-system first?"
- Wait for explicit approval before proceeding

#### 2. ANNOUNCE BRANCH AT SESSION START
**At the beginning of EVERY session, immediately check and announce:**
```bash
git branch --show-current
```
Tell user: "Currently on branch: [branch-name]"

If not on custom-minting-system, add warning: "⚠️ This is not your main working branch. Should we switch to custom-minting-system?"

#### 3. NEVER SWITCH BRANCHES WITHOUT TRIPLE CONFIRMATION

**Before ANY `git checkout <branch>` command:**

**First Warning:**
- "⚠️ WARNING: Switching to branch '[target-branch]' will replace ALL files in your working directory with that branch's versions."
- "Your localhost:3200 will immediately show different code."
- "Do you want to proceed?"

**Wait for user response. If yes, give Second Warning:**
- "⚠️ SECOND WARNING: If you make any changes while on '[target-branch]' and don't commit them, those changes will be LOST when you switch back."
- "Are you ABSOLUTELY SURE you want to switch branches?"

**Wait for user response. If yes, give Third Warning:**
- "⚠️ FINAL WARNING: I'm about to run `git checkout [target-branch]`. Your dev server will reload with code from that branch."
- "Type 'YES' to confirm."

**Only proceed after THREE explicit confirmations.**

#### 4. COMMIT WORK BEFORE SWITCHING

**Before switching branches, ALWAYS:**
1. Run `git status` to check for uncommitted changes
2. If there ARE uncommitted changes:
   - "You have uncommitted changes. Should I commit them before switching branches?"
   - If user says yes: Create a commit with descriptive message
   - If user says no: "⚠️ WARNING: These uncommitted changes will be LOST when switching branches. Proceed anyway?"
3. Only switch after work is safely committed

#### 5. IMMEDIATE WARNING AFTER ACCIDENTAL SWITCH

**If user seems unaware branch was switched:**
- "🚨 IMPORTANT: The dev server is now showing code from the '[branch-name]' branch (last changed [date])."
- "Any changes you make now are on THIS branch, not your main branch."
- "Would you like to switch back to custom-minting-system?"

#### 6. PERIODIC BRANCH REMINDERS

**Every 10 messages or so, briefly remind:**
- "Currently on branch: [branch-name]" (if not on custom-minting-system)

### The Correct Branch
**For this project, the user's main working branch is:**
- **`custom-minting-system`** - This is where current work happens

**Other branches are historical/exploratory:**
- `essence-system-worktree` - Old work from Oct 23 (9 days old)
- `master` - May be outdated
- `backup-multi-wallet-[date]` - Backup branches

**Default assumption:** User should be on `custom-minting-system` unless they explicitly say otherwise.

### Why Git Branches Are Dangerous

**Key concept the user needs to understand:**
- Git branches are NOT separate folders
- There is ONE physical directory on the computer
- `git checkout` physically REPLACES all files in that directory
- The dev server serves whatever files are currently in the directory
- When you switch branches, localhost immediately shows different code

**Think of it like:**
- Your working directory is a stage
- Git branches are different scenes
- `git checkout` swaps out ALL the actors and props
- The audience (dev server) sees whatever's currently on stage

### Commands That Switch Branches (NEVER use without approval):
- `git checkout <branch-name>` - Switches to different branch
- `git switch <branch-name>` - Modern alternative to checkout
- `git checkout -b <new-branch>` - Creates and switches to new branch
- Any `git` command that changes HEAD to different branch

### Safe Git Commands (Read-Only):
- `git branch` - List branches (safe)
- `git branch --show-current` - Show current branch (safe)
- `git log` - View commit history (safe)
- `git diff <branch>` - Compare branches without switching (safe)
- `git status` - Check working directory status (safe)

### Quick Reference Checklist for Branch Safety

**Before EVERY work session:**
- [ ] Check current branch: `git branch --show-current`
- [ ] Announce branch to user
- [ ] If not on custom-minting-system, ask to switch
- [ ] Never assume current branch is correct

**Before ANY branch switch:**
- [ ] Warn user THREE times
- [ ] Check for uncommitted changes (`git status`)
- [ ] Commit or stash any uncommitted work
- [ ] Get explicit "YES" confirmation
- [ ] After switch, remind user they're on different branch

**During work:**
- [ ] If user seems confused about code state, check branch
- [ ] Periodically remind if on non-standard branch
- [ ] Before any git operation, verify branch is correct

### Emergency Recovery

**If user accidentally made changes on wrong branch:**
1. DON'T PANIC - changes are still in working directory
2. Immediately commit changes on current branch: `git commit -am "Emergency save from wrong branch"`
3. Note the commit hash
4. Switch to correct branch
5. Cherry-pick the commit: `git cherry-pick <hash>`
6. Work is now safely on correct branch

**This only works if changes are committed BEFORE switching branches!**

---

## 🚨 CRITICAL: SESSION PROTECTION 🚨
**NEVER DO ANYTHING THAT WILL TERMINATE THE CLAUDE CODE SESSION**

Claude Code sessions can suddenly terminate, losing all context and interrupting work. **Before executing ANY command, check this list:**

### Commands That WILL Kill Claude Code Session
**NEVER run these commands:**
- `exit` - Exits the shell/terminal
- `logout` - Logs out of the session
- `quit` - Quits interactive programs
- `shutdown` - Shuts down the system
- `restart` - Restarts the system
- `reboot` - Reboots the system
- `taskkill /F /IM claude*` - Kills Claude process on Windows
- `taskkill /F /IM node.exe` - **KILLS ALL NODE PROCESSES INCLUDING CLAUDE** ⚠️
- `Stop-Process -Name claude*` - PowerShell command to kill Claude
- `Stop-Process -Name node -Force` - **KILLS ALL NODE PROCESSES INCLUDING CLAUDE** ⚠️
- `pkill claude` - Kills Claude on Unix/Linux
- `pkill node` - **KILLS ALL NODE PROCESSES INCLUDING CLAUDE** ⚠️
- `killall claude` - Kills all Claude processes
- `killall node` - **KILLS ALL NODE PROCESSES INCLUDING CLAUDE** ⚠️
- Closing the terminal window manually
- Ctrl+D (EOF signal that can exit shells)
- Any command that terminates the parent terminal/console

### 🚨🚨🚨 REAL INCIDENT: PORT CONFLICT COMMANDS THAT KILLED ALL SESSIONS 🚨🚨🚨
**Date: October 24, 2025**

**What I Did Wrong:**
When I saw "port 3200 is already in use", I ran these commands:
```bash
taskkill /F /IM node.exe
powershell -Command "Get-Process node | Stop-Process -Force"
```

**What These Commands Do:**
- Kill **EVERY SINGLE NODE.JS PROCESS** on the entire computer
- This includes: dev servers, Convex backend, **Claude Code itself**, and ALL npm tools
- No exceptions, no targeting - just destroys everything Node-related

**The Result:**
- Terminated ALL Claude Code sessions on the computer (not just this one)
- Killed the dev server (intended target)
- Killed the Convex backend server
- Destroyed all context and work in progress
- User had to restart everything from scratch

**Why This Was Wrong:**
- Used a nuclear bomb to kill one mosquito
- Claude Code runs on Node.js - killing all Node processes kills Claude
- No targeting, no precision - just blind destruction
- Should have killed the specific process by PID or port

**The CORRECT Way to Handle "Port Already in Use":**

**Option 1: Find and kill specific process using that port**
```bash
# Find the PID using the port
netstat -ano | findstr :3200

# Kill ONLY that specific PID
taskkill /PID <specific-number> /F
```

**Option 2: Just ask the user**
- "Port 3200 is in use. Should I kill that process, or would you like to close it manually?"
- User can close the terminal themselves (safest option)

**Option 3: Use a different port**
- Switch to port 3201, 3202, etc. instead of killing anything

**Option 4: Use the existing server**
- If port is in use, the server is probably already running
- Just use it instead of trying to start a new one

**The Golden Rule:**
- **NEVER** use `taskkill /F /IM node.exe` or `Stop-Process -Name node`
- **ALWAYS** target specific PIDs, not process names
- **WHEN IN DOUBT**, ask the user before killing anything

---

## 🚨 CRITICAL: THIRD-PARTY PLATFORM CAUTION 🚨

**NEVER be overconfident about undocumented third-party platform behavior, especially financial/pricing systems.**

### Key Rules:
1. **If lacking documentation, say so explicitly** - Don't guess about pricing fields, payment flows, or billing configs
2. **Red flags = STOP** - If math doesn't add up (0 revenue, excessive fees), your interpretation is likely wrong
3. **Trust user intuition** - When user says "that doesn't seem right," take it seriously
4. **Test with minimal risk first** - Use test amounts/counts before committing to production values
5. **Agents can be wrong** - Don't treat specialist agent output as infallible truth

**Applies to**: NMKR Studio, Stripe, PayPal, AWS billing, ad platforms, any financial third-party APIs

---

### Operations That CAN Kill Claude Code Session
**Be extremely careful with:**
1. **Package Installation**:
   - Installing packages that conflict with Claude's dependencies
   - Running `npm install` on packages that modify global state
   - Upgrading Node.js or npm while Claude is running

2. **File System Operations**:
   - Deleting files in Claude's working directory
   - Modifying permissions that lock Claude out
   - Running out of disk space

3. **Network Issues**:
   - VPN disconnections
   - Network adapter resets
   - Firewall changes blocking Claude's connection
   - Internet connectivity loss

4. **System Resource Issues**:
   - Running out of memory
   - CPU-intensive operations that freeze the system
   - Disk I/O errors

5. **Process Management**:
   - Task Manager force-close of Claude process
   - Windows Updates forcing restarts
   - Antivirus quarantining Claude files
   - System sleep/hibernate (sometimes)

### Safe Alternatives
**Instead of session-ending commands, use:**
- Instead of `exit`: Just leave Claude running and switch tasks
- Instead of `taskkill`: Ask user before terminating anything
- Instead of `shutdown`: Warn user to save Claude context first
- Instead of risky package installs: Check package.json and ask user first
- Instead of system-wide changes: Make project-local changes only

### When Things Go Wrong
**If you anticipate something might kill the session:**
1. **STOP immediately**
2. **Warn the user**: "This command might terminate the Claude Code session. Should I proceed?"
3. **Suggest alternatives**: Provide safer options
4. **Get explicit confirmation**: Wait for user approval
5. **Document context**: If session must end, tell user what to resume with

### Red Flags to Watch For
**Always double-check before running:**
- Any command with `kill`, `stop`, `exit`, `quit`, `shutdown`, `restart`
- Commands that modify system-level configurations
- Package installations that aren't in current package.json
- Terminal control sequences (Ctrl+C, Ctrl+D, Ctrl+Z)
- Batch files or scripts that might contain exit commands
- Commands that open new shells (might close current one)

### Working Around Session Constraints
**If you need to do something that might end the session:**
1. Complete all current tasks first
2. Summarize all work done in the session
3. Provide clear "resume instructions" for next session
4. Get user's explicit permission
5. Document any in-progress work in files (not just context)

**Remember**: Losing session context is extremely disruptive. When in doubt, ask the user before executing anything that might terminate Claude Code.

## Project Overview
Mek Tycoon is a web-based idle/tycoon game featuring collectible Mek NFTs. The game combines resource management, crafting, and collection mechanics with a sleek, futuristic UI.

## Naming Conventions
**IMPORTANT**: Always use "Mek" terminology:
- "mech" → "Mek"
- "mechanism" → "Mekanism"
- "mechanic" → "Mekanism"
- "mech-related" → "Mek-related"
- Any variations of "mech" should be replaced with "Mek"

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
- **Browser default alerts/confirms** - `window.alert()`, `window.confirm()`, `window.prompt()` - ALWAYS use custom lightbox modals instead

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

## Console Debugging & Logging

### Searchable Debug Tags
**When debugging complex systems with many console logs, use unique searchable prefixes to help the user find specific output quickly.**

**Format**: `[emoji + KEYWORD]` at the beginning of console logs
- **Example**: `console.log('[🔨MINT] Policy script loaded:', policyScript)`
- **User workflow**: Type "MINT" in browser console filter box to see only minting-related logs

**Guidelines**:
1. **Use unique keywords**: Choose words that won't appear in other logs
   - ✅ Good: `[🔨MINT]`, `[🎯TARGET]`, `[💎ESSENCE]`, `[🛡️VALIDATE]`
   - ❌ Avoid: `[DEBUG]`, `[LOG]`, `[INFO]` (too common)

2. **Add emojis for visual scanning**: Makes tags stand out in cluttered console
   - Minting: 🔨, 🏭, ⚙️
   - Validation: 🛡️, ✅, ❌
   - Database: 💾, 📊, 🗄️
   - Wallet: 👛, 💰, 🪙
   - Essence: 💎, ✨, 🧪

3. **Be consistent**: Use same tag throughout related code
   ```typescript
   console.log('[🔨MINT] Starting batch mint...');
   console.log('[🔨MINT] Building transaction...');
   console.log('[🔨MINT] Transaction signed:', txHash);
   ```

4. **Only when safe**: Don't alter critical data structures or break functionality
   - ✅ Safe: Adding prefix to console.log output
   - ❌ Unsafe: Modifying transaction data, wallet addresses, or database values

5. **Context-specific tags**: Use different tags for different debugging contexts
   - `[🔨MINT]` - Minting operations
   - `[💎ESSENCE]` - Essence distribution and buffs
   - `[👛WALLET]` - Wallet connection and NFT extraction
   - `[🗄️CONVEX]` - Database queries and mutations
   - `[🎯CRAFT]` - Crafting system operations

**When User Reports Console Issues**:
- Ask: "Can you filter the console by searching for '[TAG]' and share what appears?"
- Much easier than "send me all console output" (could be thousands of lines)
- User can quickly isolate the relevant logs without scrolling

## Design Requirements

### 🎨 INDUSTRIAL DESIGN SYSTEM (NEW!)
**Reference Implementation:** `/contracts/single-missions` page

The site uses an **Industrial/Military** aesthetic with the following key elements:

#### Core Visual Identity
- **Frames**: Sharp edges with yellow/gold borders (`border-2 border-yellow-500/50`)
- **Translucence**: Glass-morphism with backdrop blur effects
- **Textures**: Black and yellow hazard stripes, metal scratches, rust effects
- **Typography**: 'Orbitron' for headers (uppercase, tracking-wider)

#### Design System Files
- **CSS Classes**: `/src/styles/global-design-system.css` - Industrial cards, hazard stripes, grunge overlays, typography
- **JS/TS Utils**: `/src/lib/design-system.ts` - Theme utilities and color definitions
- **Reference**: See `/contracts/single-missions` page for implementation examples

### Visual Style Guidelines
- **Primary Color**: Yellow/Gold (#fab617)
- **Backgrounds**: Deep blacks with subtle gradients
- **Borders**: Sharp or slightly rounded with yellow accents
- **Effects**: Glass morphism, scan lines, holographic shimmers
- **Animations**: Subtle pulses, no flashy/distracting effects

### UI Components
- Navigation with dropdown menus for 6 categories
- Large logo at top with subtle shimmer effect
- HUB button with special styling
- Cards with industrial frames and grunge overlays
- Progress bars with yellow gradient fills
- Slots with dashed borders and hazard patterns

## Important Data Structure

### Variation Names & Mapping
**🔑 SINGLE SOURCE OF TRUTH**: For complete variation data including 3-character source keys:
- **File**: `/src/lib/completeVariationRarity.ts`
- **Export**: `COMPLETE_VARIATION_RARITY` array with all 291 variations
- **Each variation includes**:
  - `id`: Unique ID (1-291)
  - `name`: Display name (e.g., "Bumblebee", "Rust", "1960's", "Ol' Faithful")
  - `type`: "head" | "body" | "trait"
  - `sourceKey`: 3-character code for file naming (e.g., "BC4", "AM1", "BJ1")
  - `count`, `percentage`, `tier`, `rank`: Rarity data
- **Use this for**: NFT images, essence bottles, any file naming that needs unique identifiers
- **Example**: "Rust" head (rank 236) → sourceKey: "AM1", "Rust" body (rank 186) → sourceKey: "BJ1"

**⚠️ CRITICAL: Special Trait Variations (Ghostly/Haunting Theme) - NEVER IGNORE THESE**:
- The following trait variations have artistic names that may seem like "empty" states,
  but they are LEGITIMATE variations with ghostly/haunting visual appearances:
  - **"Nil"** (rank 18, legendary, 1-2 copies)
  - **"Null"** (rank 21, legendary, 1-2 copies)
  - **"None"** (rank 24, legendary, 1-2 copies)
  - **"Nothing"** (rank 291, common, 501 copies)
- These should NEVER be filtered out or treated as invalid data
- They are real variations with actual visual appearances (ghostly/haunting themed)
- Must be preserved across ALL systems (database, UI, exports, etc.)

**Alternative (names only)**: `/src/lib/variationsReferenceData.ts`
- Contains ALL_VARIATIONS with `{ id, name, type }`
- Good for dropdowns and UI displays, but lacks source keys

### Mek Variations (Complete Breakdown)
- **102 Head Variations** (includes "1960's" and "Ol' Faithful")
- **112 Body Variations**
- **77 Trait/Item Variations** (includes Nil, Null, None, Nothing)
- **Total: 291 variations**

### Mek Images Location
**IMPORTANT**: All Mek images are stored in:
```
C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\
```
- Images are organized by size: `150px/`, `500px/`, `1000px/`
- Use path `/mek-images/150px/[variation-codes].webp` in components
- Files are in WebP format
- Named by variation codes: `[head]-[body]-[item].webp` (e.g., "bc2-dm1-ap1.webp")

**⚠️ CRITICAL: Mek Image Linking Issues**
When linking Mek images, you MUST handle these two issues:
1. **Suffix Removal**: Database sourceKeys have suffixes like "-B", "-C" that must be removed
   - Example: `"AA1-AA4-GH1-B"` → `"AA1-AA4-GH1"`
   - Use regex: `.replace(/-[A-Z]$/, '')`
2. **Case Conversion**: Database uses UPPERCASE, but files are lowercase
   - Example: `"AA1-AA4-GH1"` → `"aa1-aa4-gh1"`
   - Always use `.toLowerCase()`

**Correct Implementation:**
```javascript
const cleanKey = selectedMek.sourceKey
  .replace(/-[A-Z]$/, '')  // Remove suffix
  .toLowerCase();           // Convert to lowercase
const imagePath = `/mek-images/150px/${cleanKey}.webp`;
```

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

## Slash Commands

### `/ui-team` - Activate all UI agents
When user types `/ui-team`, activate these three agents together:
- `@ui-layout-debugger` - Debug layout issues
- `@scifi-ui-designer` - Apply sci-fi aesthetic
- `@visual-test` - Test visual changes

### `/ultra` - Multi-agent coordination with guaranteed specialist activation

**APPROACH**: Analyze the user's problem and launch `@project-lead` PLUS all clearly relevant specialists in parallel.

**How It Works**:
1. User types `/ultra` describing their issue
2. Analyze which domains are involved (wallet, database, UI, code quality, mobile)
3. Launch project-lead + relevant specialists together in parallel
4. Project-lead coordinates their work and integrates solutions

**Activation Rules** (launch ALL that apply to the problem):

**Core Coordinator (always launch)**:
- `@project-lead` - Analyzes, coordinates, and integrates all specialist work

**Wallet/Blockchain Issues** (NFT problems, wallet connection, minting, transactions):
- `@cardano-wallet-integrator` - Debug wallet connections, NFT extraction, CIP-30 API
- `@blockchain-architecture-specialist` - On-chain verification, smart contracts, trustless systems

**Database Issues** (Convex queries, data not updating, sync problems):
- `@convex-database-architect` - Fix queries, mutations, schemas, reactivity
- `@state-sync-debugger` - Debug state sync between database and UI

**UI/Design Issues** (layout broken, styling wrong, visual problems):
- `@ui-layout-debugger` - Debug positioning, z-index, layout issues

**Code Quality Issues** (syntax errors, messy code, refactoring needed):
- `@code-modularizer` - Refactor monolithic code into modular architecture
- `@syntax-error-fixer` - Fix syntax errors and parsing issues

**Mobile Issues** (responsive design, touch interactions, mobile layout):
- `@mobile-responsive-optimizer` - Transform to mobile-responsive design

**Examples**:
- "NFTs not showing in wallet" → Launch: project-lead + wallet integrator + state-sync debugger
- "Convex query wrong data" → Launch: project-lead + convex architect + state-sync debugger
- "Button layout broken on mobile" → Launch: project-lead + mobile optimizer + ui-layout debugger
- "Messy wallet code with sync issues" → Launch: project-lead + code-modularizer + wallet integrator + state-sync debugger

**Key Principle**: Be selective but guaranteed - if a domain is clearly involved, launch those agents. Don't launch agents for unrelated domains.

<!--
ORIGINAL APPROACH (preserved for reference - worked well with project-lead alone):

When user types `/ultra`, activate ONLY the `@project-lead` agent. The project-lead will analyze the problem and selectively launch only the relevant specialist agents needed for the specific issue.

This approach worked well because the project-lead agent is quite capable on its own and can coordinate specialists when needed. However, we're now testing a more aggressive multi-agent activation strategy to see if it produces better results.
-->

### `/style` - Apply Industrial Design System
When the user types `/style`, apply the global industrial design system to the current page:

1. **Import design system**: Add `import theme from '@/lib/design-system'` if using TypeScript utilities
2. **Replace generic styles** with industrial classes:
   - Cards: Use `.mek-card-industrial` with `.mek-border-sharp-gold`
   - Headers: Apply `.mek-header-industrial` with hazard stripes
   - Buttons: Replace with `.mek-button-primary` or `.mek-button-secondary`
   - Values: Use `.mek-value-primary` for gold numbers, `.mek-value-secondary` for blue
   - Labels: Apply `.mek-label-uppercase` for small gray labels
3. **Add grunge overlays**: Apply `.mek-overlay-scratches`, `.mek-overlay-rust` for texture
4. **Update typography**: Use Orbitron font with `.mek-text-industrial` for headers
5. **Apply effects**: Add `.mek-glow-yellow` for highlights, `.mek-scan-effect` for animations
6. **Ensure consistency**: Match the contracts/single-missions page aesthetic

Example transformation:
- `bg-gray-800 border border-gray-600` → `.mek-card-industrial .mek-border-sharp-gold`
- `text-2xl font-bold` → `.mek-value-primary` or `.mek-text-industrial`
- `bg-blue-500 text-white px-4 py-2` → `.mek-button-primary`

## 🔧 Common UI Patterns & Fixes

### Modal/Lightbox Positioning Fix
**CRITICAL PATTERN**: When modals/lightboxes appear in the wrong location (centered in parent container instead of browser viewport), use React portals.

**Problem**: Lightbox appears in center of table/container content instead of center of browser window, requiring scrolling to find it.

**Solution**: Use `createPortal` to render modal at document.body root instead of within component tree.

**Reference Components** (see these for implementation examples):
- `src/components/MekLevelsViewer.tsx`
- `src/components/ActivityLogViewer.tsx`
- `src/components/EssenceBalancesViewer.tsx`
- `src/components/EssenceBuffManagement.tsx`
- `src/components/EssenceDistributionLightbox.tsx`

**Key Requirements**:
1. Import `createPortal` from `react-dom`
2. Add `mounted` state with `useEffect` to manage client-side rendering
3. Lock body scroll when modal is open
4. Use `createPortal(modalContent, document.body)` to render at DOM root
5. Add `onClick={(e) => e.stopPropagation()}` to modal content to prevent backdrop click-through
6. Use `fixed inset-0` positioning and `z-[9999]` for proper layering

**When to Apply**: Any time a modal/lightbox appears in the wrong position relative to the viewport, or when user reports having to scroll to find a modal.

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
- **NEVER create documentation files (*.md) unless explicitly requested** - User will not read them. Give verbal summaries instead

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
- **DO IT, DON'T DELEGATE**: If you are capable of doing a task (editing files, restarting servers, running commands, etc.), DO IT immediately. Never instruct the user to do something you can do yourself. Examples:
  - BAD: "Please update .env.local with X value"
  - GOOD: *Updates .env.local immediately*
  - BAD: "You'll need to restart the dev server"
  - GOOD: *Restarts dev server automatically*
- **Ask for clarity**: If instructions are vague or unclear, ask specific questions rather than guessing
- **Voice concerns**: If an implementation might break something or cause issues, speak up before proceeding
- **Be direct and honest**: Don't hesitate to point out potential problems or downsides
- **Suggest better solutions**: If there's a better approach than what's requested, propose it with clear reasoning
- **Be matter-of-fact**: Present pros/cons objectively without sugar-coating issues
- **It's OK to say "I don't know"**: Better to admit uncertainty than implement something potentially harmful
- **MINIMIZE CODE OUTPUT**: User is not a coder - avoid showing raw code snippets, diffs, or technical readouts unless specifically requested. Instead, describe changes made in simple terms like "I updated the file to fix X" or "I added feature Y to the page"
- **NEVER ask "how is Claude doing" or similar questions**: User does not want to be asked about Claude Code's performance or experience

## Understanding This User's Communication Style (Learned From Experience)
*This section was written based on actual working experience with this user - for future Claude iterations*

### Key Patterns for Success
1. **Visual References Are Critical**
   - User often provides screenshots/mockups to explain desired outcomes
   - When they say "like in X page" - immediately check that page for visual/functional reference
   - They think visually and spatially - understanding their mental model is crucial

2. **Iterative Clarification Is Normal**
   - User corrects misunderstandings patiently but expects learning from corrections
   - "No, not X, I meant Y" = they're training you on their terminology
   - Pay close attention to repeated clarifications - these reveal fundamental misunderstandings

3. **Context Switching Awareness**
   - User frequently jumps between related systems (story-climb vs cirutree vs admin pages)
   - When confused about which system, carefully check recent context and file names
   - They expect you to maintain awareness of the broader system architecture

4. **Implementation Over Theory**
   - User prefers working code over discussions
   - They describe behavior through examples: "when X happens, Y should occur"
   - Spatial/mathematical descriptions are precise: "lower third" = exactly 67% from top

5. **Protective of Existing Work**
   - User is VERY protective of data they've created (e.g., "V1 story tree")
   - Always implement non-destructive changes
   - When uncertain, ask before modifying/deleting

6. **Active Testing & Feedback**
   - User tests implementations immediately and provides specific feedback
   - Debug logging is appreciated for understanding behavior
   - Visual verification is important - they want to SEE things work

7. **Direct Communication Valued**
   - "Thinking through" problems aloud is appreciated
   - Honest assessment preferred: "I see the problem..." vs sugar-coating
   - They train through correction - each mistake is a learning opportunity

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
- **BRIEF TASK COMPLETION SUMMARIES**: Keep explanations 35% shorter - just bullet points of what was done. User will ask for details if needed
- **NO CODE DUMPS**: User does not understand raw code snippets, code blocks, diffs, or technical syntax examples. Describe changes conversationally instead of showing code. Example: Say "I updated the slider to go from 5% to 100%" instead of showing the code block

