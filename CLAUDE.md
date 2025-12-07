# Mek Tycoon - Project Instructions
<!-- Character count: ~31,500 (down from ~66,000) -->

## 🎯 PRIMARY WORKING DIRECTORY
**THIS IS THE MAIN DIRECTORY FOR ALL WORK - NOT A "STAGING" OR "SECONDARY" ENVIRONMENT**

The directory `mek-tycoon-react-staging` is the PRIMARY and MAIN working directory for this project. When referring to "the main directory" or "the project directory", this is what we mean:

- **Primary Directory**: `C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react-staging`
- **Do NOT use**: The `mek-tycoon-react` directory exists but is NOT used for current work
- **Databases**: DUAL DATABASE SYSTEM (Trout for dev, Sturgeon for production)
- **Port**: localhost:3200

**Naming note**: Despite the word "staging" in the directory name, this is our primary development environment where ALL current work happens.

**⚠️ DUAL DATABASE SYSTEM**: We use TWO separate databases - Trout (dev) for localhost development and Sturgeon (production) for the live site. This allows safe testing before deploying to production.

## Dev Server Management
**CRITICAL: User starts their own dev servers. DO NOT automatically run background dev server tasks.**

### When user explicitly says "start it up" or similar:
```bash
npm run dev:all
```
This starts both Next.js (port 3200) and Convex in one terminal.

### IMPORTANT RULES:
- **NEVER start `npm run dev`, `npm run dev:all`, or similar as background tasks**
- User manages their own dev servers and terminals
- Only start dev server if user explicitly asks you to
- If user says "the server is running" or "localhost is up" - believe them, don't verify or restart
- Focus on code changes, not server management
- **If a server restart is needed**: Simply tell the user "You'll need to restart the dev server in your terminal" - do NOT start background servers yourself. This prevents zombie processes and `.next` folder corruption.

### 🚨 Fixing "Internal Server Error"

**When user reports "Internal Server Error" in browser:**

**Root Cause:** Dev server crashed/was killed, leaving a zombie process still bound to port 3200.

**The Fix (follow these exact steps):**
1. Find the zombie process: `netstat -ano | findstr :3200`
2. Note the PID from the output (rightmost number)
3. Kill that specific PID: `Stop-Process -Id <PID> -Force`
4. Restart dev server: `npm run dev:all`

**Example:**
```bash
# Step 1: Find process
netstat -ano | findstr :3200
# Output shows: TCP 0.0.0.0:3200 ... LISTENING 59060

# Step 2: Kill that specific PID
Stop-Process -Id 59060 -Force

# Step 3: Restart
npm run dev:all
```

**Key Point:** Always kill by PID (process ID), never by process name. This is the only reliable fix.

---

## 📋 Key System Documentation

**Before working on major systems, read the relevant Claude doc first:**

| System | Document | Read Before |
|--------|----------|-------------|
| **Job Slots** | `SLOTS.md` | Jobs, daily income, tenure progression, pit stop rewards, Attaboy system, Corp/Unit Bias |
| **Data Architecture** | `USERS_TABLE_CONSOLIDATION_PLAN.md` | Adding new user data, creating tables, database schema changes |

**Why this matters**: These documents contain design decisions, system architecture, and open questions that took hours to define. Reading them first prevents contradicting established designs or re-solving already-solved problems.

---

## 🗄️ DATA ARCHITECTURE: Where New Data Should Live

**CRITICAL: When adding new features that store user data, follow these guidelines.**

### The `users` Table is for IDENTITY ONLY

The `users` table should contain:
- **Identity**: stakeAddress, corporationName
- **Authentication**: session tokens, wallet info
- **Aggregate stats**: gold balance, level, XP (single scalar values)
- **Status**: isOnline, isBanned, role
- **Timestamps**: createdAt, lastLogin

### When to Create a SEPARATE Table (Default Choice)

**Create a new table when the data is:**

| Condition | Example | Why Separate |
|-----------|---------|--------------|
| **Multiple items per user** | Buffs, perks, achievements | Arrays in documents = bad pattern |
| **Could grow unbounded** | Transaction history, notifications | Document size limits |
| **Sparse data (many types, few values)** | 291 essence types | Most users have <50 types |
| **Changes independently** | Slot XP vs user gold | Avoid unnecessary subscription updates |
| **Accessed in specific contexts** | Crafting data on crafting page | Don't load what you don't need |
| **Complex nested objects** | Talent trees, skill builds | Keep documents simple |

### When to Add to `users` Table (Exception)

**Only add to `users` if ALL of these are true:**
- ✅ Single scalar value (one number, one string, one boolean)
- ✅ Bounded and small (won't grow)
- ✅ Core to user identity
- ✅ Accessed on almost every page
- ✅ Changes rarely

### Decision Flowchart

```
New feature needs to store user data
              │
              ▼
     Is it a single value?
        │           │
       YES          NO (array/collection)
        │           │
        ▼           └──► CREATE SEPARATE TABLE
  Is it bounded?
   (won't grow)
        │           │
       YES          NO
        │           │
        ▼           └──► CREATE SEPARATE TABLE
  Accessed everywhere?
        │           │
       YES          NO
        │           │
        ▼           └──► CREATE SEPARATE TABLE
  Core to identity?
        │           │
       YES          NO
        │           │
        ▼           └──► CREATE SEPARATE TABLE
        │
   ADD TO users TABLE
   (rare - most data
    goes in separate tables)
```

### Current Table Architecture

```
users (IDENTITY ONLY)
├── stakeAddress (PK)
├── corporationName
├── gold, level
├── session/auth
└── timestamps, status

userEssence (SPARSE DATA)
├── stakeAddress (FK)
├── essenceType
└── balance

userJobSlots (MULTIPLE PER USER)
├── stakeAddress (FK)
├── slotType, slotIndex
├── assignedMekId
└── slotXP, slotLevel

meks (OWNED ITEMS)
├── assetId (PK)
├── ownerStakeAddress (FK)
├── variations, rarity
└── talentTree {}

goldMiningState (COMPLEX MECHANICS)
├── stakeAddress (FK)
├── totalGoldPerHour
├── accumulatedGold
└── verification data
```

### Examples of Correct Decisions

| New Feature | Decision | Why |
|-------------|----------|-----|
| "Add total playtime" | `users.totalPlaytime` | Single number, aggregate stat |
| "Add active buffs" | New `userBuffs` table | Multiple buffs, expire independently |
| "Add achievement progress" | New `userAchievements` table | Many achievements, sparse completion |
| "Add corporation perks" | New `corporationPerks` table | Multiple perks, unlocked over time |
| "Add VIP status" | `users.isVIP` | Single boolean, core status |
| "Add daily login streak" | `users.loginStreak` | Single number, changes daily |
| "Add owned cosmetics" | New `userCosmetics` table | Multiple items, grows over time |

### NEVER Do This

```typescript
// ❌ BAD: Array of items in users table
users: {
  buffs: v.array(v.object({...})),        // NO - create userBuffs table
  achievements: v.array(v.string()),       // NO - create userAchievements table
  ownedMeks: v.array(v.object({...})),    // NO - already in meks table
}

// ❌ BAD: Object with many optional fields
users: {
  essence_stone: v.optional(v.number()),   // NO - create userEssence table
  essence_disco: v.optional(v.number()),   // with rows per type
  essence_paul: v.optional(v.number()),
  // ... 291 more fields
}
```

---

## 🚨 CRITICAL: DUAL DATABASE SYSTEM 🚨
**Trout = Development | Sturgeon = Production**

### Database Architecture (DUAL - December 2025)

**This project uses TWO separate Convex databases:**

**Trout (wry-trout-962.convex.cloud)** = **DEVELOPMENT DATABASE**
- Used by localhost:3200 development (`npm run dev:all`)
- Safe for testing schema changes, new features, and experiments
- `.env.local` points `NEXT_PUBLIC_CONVEX_URL` to Trout
- Changes here do NOT affect live users
- Can be reset/wiped without impacting production

**Sturgeon (fabulous-sturgeon-691.convex.cloud)** = **PRODUCTION DATABASE**
- Used by the live website (mek.overexposed.io)
- Contains REAL user data and 36+ active players
- Accessed via `NEXT_PUBLIC_STURGEON_URL` in `.env.local`
- Deploy to production using "Deploy Prod" in Deployment Control Center
- **Changes here affect real users immediately**

---

### 🛡️ BENEFITS OF DUAL DATABASE

**Safe Development:**
- ✅ Test schema changes on Trout first without breaking production
- ✅ Experiment with new features safely
- ✅ Break things on dev without affecting users
- ✅ Full separation between test and live data

**When running `npm run dev:all`:**
- Convex syncs to **Trout** (dev database)
- Frontend runs on localhost:3200
- Changes to `/convex` files deploy to Trout only
- Production (Sturgeon) remains unaffected

---

### Deployment Workflow

**Standard Development Flow:**
1. Make changes locally (code + Convex functions)
2. Test on localhost with Trout database
3. When ready, use Deployment Control Center to:
   - Create backup (Quick or Full)
   - Deploy to Sturgeon (production)

**Deployment Control Center (Admin → Deployments):**
- **Quick Backup**: Records git commit hash (code reference point)
- **Full Backup**: Exports Sturgeon database + file storage to `/backups/full/`
- **Deploy Dev (Trout)**: Updates Convex functions on dev database
- **Deploy Prod (Sturgeon)**: Updates Convex functions on production
- **Full Deploy Button**: Commits → R2 sync → Push to GitHub → Push to master → Deploy Convex

---

### Backend Change Protocol

**For Trout (Dev) - Safe to experiment:**
- Schema changes are safe to test
- Can add/remove fields freely
- Great for testing new queries/mutations
- Reset if needed without consequences

**For Sturgeon (Production) - Be careful:**
1. **Test on Trout first**: Always verify changes work on dev
2. **Create backup before deploy**: Use Full Backup for schema changes
3. **Schema changes**: Adding optional fields is safe, removing/renaming requires migration
4. **Announce risky changes**: Tell user "This production deploy could affect live users"

---

### Key Principles (Dual Database)

1. **Trout = Safe Playground**: Experiment freely on dev
2. **Sturgeon = Handle With Care**: Production affects real users
3. **Test Before Deploy**: Always test on Trout before deploying to Sturgeon
4. **Backup Before Deploy**: Create backup before production deployments
5. **Frontend vs Backend**: Frontend changes only affect localhost until Vercel deploy; backend changes deploy to current database immediately
6. **Use Deployment Control**: Admin → Deployments for safe production deploys

**REMEMBER**: The dual database system gives you a safety net. Use Trout to test, then deploy to Sturgeon when confident.

---

## 🚨 CRITICAL: GIT PROTECTION 🚨

### Git Checkout: THE MOST DANGEROUS COMMAND
**NEVER EVER RUN `git checkout <filename>` UNLESS EXPLICITLY APPROVED BY USER**

```bash
git checkout src/components/SomeFile.tsx  # ❌ DESTROYS UNCOMMITTED WORK PERMANENTLY
```

**What it does**: Permanently deletes all uncommitted changes, restores to last commit, NO UNDO, NO WARNING, NO BACKUP.

**Real incident**: User spent hours on UI improvements (250+ lines). File had syntax error, I ran `git checkout` to "fix" it. All uncommitted work PERMANENTLY DELETED. User had to re-do everything manually.

**ABSOLUTE RULES**:
1. **NEVER use `git checkout <file>` to fix errors** - Use Edit tool instead
2. **NEVER use it as a "reset"** - Fix issues directly
3. **ALWAYS ask user first** if you think checkout is needed
4. **WARN user TWICE** about what will be lost
5. **Check `git status`** first - if uncommitted changes exist, STOP and ask user to commit first

**Safe Alternatives**:
- Fix syntax errors: Use Edit tool
- See differences: `git diff <file>` (read-only)
- Create backup: Ask user to commit work first

**Only safe when**: User explicitly says "discard my uncommitted changes" AND confirms TWICE AND `git status` shows changes AND user approves deletion.

---

### Branch Switching Protection
**NEVER SWITCH BRANCHES WITHOUT EXPLICIT USER APPROVAL (3 TIMES)**

Working on wrong branch has caused MULTIPLE lost work incidents. When you work on old branch and switch back, ALL UNCOMMITTED WORK IS LOST FOREVER.

**MANDATORY RULES**:

1. **Check branch before ANY work**: Run `git branch --show-current`
   - If NOT on `custom-minting-system` → STOP, warn user, wait for approval

2. **Announce at session start**: Check and tell user current branch
   - If not on custom-minting-system, ask to switch

3. **Triple confirmation before switching**:
   - First: "Switching replaces ALL files. localhost will show different code. Proceed?"
   - Second: "Changes on this branch will be LOST when you switch back. SURE?"
   - Third: "Type 'YES' to confirm git checkout [branch]"

4. **Commit work before switching**: Always run `git status`, commit any changes first

5. **Periodic reminders**: Every 10 messages, remind if on non-standard branch

**Correct branch**: `custom-minting-system` (main working branch)

**Emergency recovery**: If changes made on wrong branch, commit immediately, note hash, switch to correct branch, cherry-pick commit.

---

## 🚨 CRITICAL: SESSION PROTECTION 🚨
**NEVER DO ANYTHING THAT WILL TERMINATE THE CLAUDE CODE SESSION**

Claude Code sessions can terminate, losing all context. Before ANY command, check:

### Commands That KILL Session (NEVER RUN):
- `exit`, `logout`, `quit` - Exits shell
- `shutdown`, `restart`, `reboot` - System operations
- `taskkill /F /IM claude*` or `/IM node.exe` - **KILLS ALL NODE PROCESSES INCLUDING CLAUDE**
- `Stop-Process -Name claude*` or `-Name node` - PowerShell kill commands
- `pkill claude`, `pkill node`, `killall node` - Unix/Linux kill commands
- Ctrl+D (EOF signal)

### Port Conflict Handling (NEVER KILL NODE PROCESSES)
**Real Incident (Oct 24, 2025)**: When port 3200 was in use, I ran `taskkill /F /IM node.exe` which killed ALL Claude sessions on the computer plus dev servers and Convex backend.

**CORRECT approach for "Port in use"**:
1. Find specific PID: `netstat -ano | findstr :3200`
2. Kill ONLY that PID: `taskkill /PID <number> /F`
3. OR ask user to close it manually
4. OR use different port (3201, 3202)
5. OR use existing server

**Golden Rule**: NEVER use `taskkill /F /IM node.exe` or `Stop-Process -Name node` - ALWAYS target specific PIDs.

### Operations That CAN Kill Session:
- Package installation (conflicts with Claude dependencies)
- File system operations (deleting Claude files, permission changes)
- Network issues (VPN disconnect, adapter reset)
- System resources (out of memory, CPU freeze)
- Windows Updates forcing restarts

### If Risky Operation Needed:
1. STOP immediately
2. Warn user: "This might terminate Claude Code session. Proceed?"
3. Suggest safer alternatives
4. Get explicit confirmation
5. Document current context for resume

---

## 🚨 CRITICAL: TAILWIND CSS VERSION 🚨
**This project uses Tailwind CSS v3, NOT v4**

**If styles broken (plain text appearance)**:
1. Check package.json (must be ^3.x.x, NOT ^4.x.x)
2. Fix: `npm uninstall tailwindcss @tailwindcss/postcss && npm install -D tailwindcss@^3 postcss autoprefixer && rm -rf .next && npm run dev:all`

**NEVER USE**: `npm update`, `tailwindcss@latest`, v4-only syntax (`@import "tailwindcss"`, `@theme inline`, `@tailwindcss/postcss`)
**ALWAYS USE**: `npm ci`, check CRITICAL_DEPENDENCIES.md if issues

---

## Project Overview
Mek Tycoon is a web-based idle/tycoon game featuring collectible Mek NFTs. The game combines resource management, crafting, and collection mechanics with a sleek, futuristic UI.

### 🏠 MAIN PAGE IDENTIFICATION
**CRITICAL: `/home` is the MAIN PAGE of the site.**

- **Main Game Page**: `/home` - The primary gameplay interface where users interact with Mekanisms
- **When instructions say "apply to main page"**: Use `/home` page, NOT any other page
- **Universal Guidance**: If you are ever trying to apply something to the "main page" of the site, use the `/home` page (`src/app/home/page.tsx`)
- The `/hub` page has been removed (it was redundant)

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

### 🚀 SPACE AGE STYLE
When user says "Space Age Style" → refer to **Admin → Space Age Style** tab for live demos and styling reference. This is the liquid glass aesthetic from the Landing Page (phases page).

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
When user types `/ui-team`, activate these two agents together:
- `@ui-layout-debugger` - Debug layout issues
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

### Wallet Connection System - Lessons Learned
**Date Fixed**: November 2025

**Critical Issues Discovered:**

1. **Duplicate Modal Instances** - Multiple components rendering the same modal/lightbox
   - **Problem**: NavigationBar, UnifiedHeader, and HomePage all rendered WalletConnectLightbox
   - **Symptom**: Lightbox stayed visible after connection (one instance closed, others remained)
   - **Fix**: Only ONE component should own a modal. Use event-driven architecture if multiple places need to trigger it
   - **Rule**: High-level components (like UnifiedHeader) should own shared modals, not page-specific components

2. **Signature Verification After Disconnect** - Security feature for shared computers
   - **Problem**: Wallet extensions cache permissions, so disconnecting didn't force re-authentication
   - **Fix**: Implement challenge-response with `wallet.api.signData(address, hexMessage)`
   - **Pattern**: Manual disconnect → create nonce → on reconnect → detect nonce → require signature → clear nonce
   - **CIP-30 Detail**: ALL wallets expect hex-encoded message payloads, not plain text

3. **Console Log Spam** - Debug logs in render loops cause browser freezing
   - **Problem**: Logs inside components that re-render frequently = millions of logs per second
   - **Symptom**: Browser freezes, unusable console, performance degradation
   - **Fix**: Remove logs from render paths. Use searchable tags for debugging ([🔐TAG] format)
   - **Rule**: Log state changes, not every render. Remove debug logs when done

**Key Takeaways for Future Work:**
- Single instance rule: One component owns each modal/lightbox
- State management: Parent controls visibility, child calls `onClose()` to notify
- Security: Explicit logout requires re-auth, passive session restore allows auto-reconnect
- Performance: Be mindful of logs in frequently-called code (renders, animations, polling)

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
- **TAKE ACTION**: You have permission to edit files, run commands, and take action directly. Don't ask the user to do things you can do yourself. Examples:
  - BAD: "Please update .env.local with X value"
  - GOOD: *Updates .env.local immediately*
  - BAD: "You should add this import to the file"
  - GOOD: *Edits the file to add the import*
  - **EXCEPTION - Dev servers**: Never start/restart dev servers as background tasks. Just tell the user: "You'll need to restart the dev server in your terminal." (See Dev Server Management section)
  - **Delegating to agents is fine**: Using Task tool to delegate work to specialized agents is encouraged.
- **Ask for clarity**: If instructions are vague or unclear, ask specific questions rather than guessing
- **Voice concerns**: If an implementation might break something or cause issues, speak up before proceeding
- **Be direct and honest**: Don't hesitate to point out potential problems or downsides
- **Suggest better solutions**: If there's a better approach than what's requested, propose it with clear reasoning
- **Be matter-of-fact**: Present pros/cons objectively without sugar-coating issues
- **It's OK to say "I don't know"**: Better to admit uncertainty than implement something potentially harmful
- **MINIMIZE CODE OUTPUT**: User is not a coder - avoid showing raw code snippets, diffs, or technical readouts unless specifically requested. Instead, describe changes made in simple terms like "I updated the file to fix X" or "I added feature Y to the page"
- **NEVER ask "how is Claude doing" or similar questions**: User does not want to be asked about Claude Code's performance or experience

## Understanding This User's Communication Style
*Based on actual working experience - for future Claude iterations*

- **Visual references critical**: User provides screenshots/mockups, thinks visually/spatially
- **Iterative clarification normal**: User trains through corrections, expects learning from mistakes
- **Context switching frequent**: Maintain awareness of broader system architecture
- **Implementation over theory**: Describe behavior through examples, spatial/math descriptions are precise
- **Protective of existing work**: Always non-destructive, ask before modifying/deleting
- **Active testing & feedback**: User tests immediately, appreciates debug logging, wants to SEE results
- **Direct communication valued**: Think aloud, honest assessment over sugar-coating

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
