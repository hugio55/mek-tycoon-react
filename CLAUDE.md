# Mek Tycoon - Project Instructions

## Claude Code Documentation
Local documentation is available in the `claude-code-docs/` directory:
- **Main docs**: Overview, quickstart, workflows, troubleshooting, etc.
- **SDK docs**: `claude-code-docs/sdk/` - Headless mode, TypeScript/Python SDKs
- **Enterprise**: Bedrock, Vertex AI, proxy config, LLM gateways

## Quick Start Command
When user says "start it up" or similar, run:
```bash
cd "C:\Users\Ben Meyers\Documents\Mek Tycoon\mek-tycoon-react" && npm run dev:all
```
This starts both Next.js (port 3100) and Convex in one terminal.

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
- `Stop-Process -Name claude*` - PowerShell command to kill Claude
- `pkill claude` - Kills Claude on Unix/Linux
- `killall claude` - Kills all Claude processes
- Closing the terminal window manually
- Ctrl+D (EOF signal that can exit shells)
- Any command that terminates the parent terminal/console

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
- **CSS Classes**: `/src/styles/global-design-system.css`
- **JS/TS Utils**: `/src/lib/design-system.ts`

#### Key Patterns to Use
1. **Industrial Cards**: 
   ```css
   .mek-card-industrial /* Translucent with grunge overlays */
   .mek-border-sharp-gold /* Yellow bordered frames */
   ```

2. **Hazard Stripes**:
   ```css
   .mek-overlay-hazard-stripes /* 45deg black/yellow stripes */
   .mek-overlay-diagonal-stripes /* 135deg subtle stripes */
   ```

3. **Grunge Effects**:
   ```css
   .mek-overlay-scratches /* Metal wear marks */
   .mek-overlay-rust /* Rust and stain patterns */
   .mek-overlay-metal-texture /* Industrial grid texture */
   ```

4. **Typography Classes**:
   ```css
   .mek-value-primary /* Large yellow numbers */
   .mek-label-uppercase /* Small gray uppercase labels */
   .mek-text-industrial /* Orbitron bold uppercase */
   ```

5. **Interactive Elements**:
   ```css
   .mek-button-primary /* Angled yellow button */
   .mek-slot-empty /* Dashed border slots */
   .mek-glow-yellow /* Yellow glow effects */
   ```

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
- **Export**: `COMPLETE_VARIATION_RARITY` array with all 288 variations
- **Each variation includes**:
  - `name`: Display name (e.g., "Bumblebee", "Rust")
  - `type`: "head" | "body" | "trait"
  - `sourceKey`: 3-character code for file naming (e.g., "BC4", "AM1", "BJ1")
  - `count`, `percentage`, `tier`, `rank`: Rarity data
- **Use this for**: NFT images, essence bottles, any file naming that needs unique identifiers
- **Example**: "Rust" head (rank 236) → sourceKey: "AM1", "Rust" body (rank 186) → sourceKey: "BJ1"

**Alternative (names only)**: `/src/lib/variationsReferenceData.ts`
- Contains ALL_VARIATIONS with `{ id, name, type }`
- Good for dropdowns and UI displays, but lacks source keys

### Mek Variations (from CSV)
- **102 Head Variations** (not 103)
- **112 Body Variations**
- **74 Trait/Item Variations**
- **Total: 288 variations**

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

### `/ultra` - Strategic multi-agent coordination
When user types `/ultra`, activate ONLY the `@project-lead` agent. **The project-lead will analyze the problem and selectively launch only the relevant specialist agents needed for the specific issue.**

**CRITICAL RULES**:
- **ONLY launch the project-lead agent initially** - do NOT blindly launch all 11 agents
- **Project-lead must be strategic** - it should analyze the problem and activate only relevant specialists
- **No unnecessary agents** - if the issue is clearly unrelated to mobile, don't launch mobile-responsive-optimizer
- **Be critical and selective** - fewer, targeted agents are better than launching everything

**How It Works**:
1. User types `/ultra` describing their issue
2. Claude launches ONLY the `@project-lead` agent
3. Project-lead analyzes the problem and identifies which specialists are actually needed
4. Project-lead launches only the relevant agents and coordinates their work
5. Project-lead integrates solutions and ensures teams stay aligned

**Available Specialist Agents (for project-lead to selectively activate)**:

**Wallet Integration Team:**
- `@cardano-wallet-integrator` - Debug wallet connections, NFT extraction, and CIP-30 API issues
- `@blockchain-architecture-specialist` - Design trustless verification and on-chain integration

**Database Team:**
- `@convex-database-architect` - Fix Convex queries, mutations, schemas, and reactivity
- `@state-sync-debugger` - Debug state synchronization between database and UI

**Code Quality Team:**
- `@code-modularizer` - Refactor monolithic code into clean, modular architecture
- `@syntax-error-fixer` - Fix syntax errors, bracket mismatches, and parsing errors

**UI & Design Team:**
- `@scifi-ui-designer` - Apply industrial sci-fi aesthetic and design systems
- `@ui-layout-debugger` - Debug layout issues, positioning, and responsive design
- `@visual-test` - Verify visual changes in browser and check console errors
- `@mobile-responsive-optimizer` - Transform desktop UI to mobile-responsive design

**Example Decision-Making**:
- Issue: "NFTs not showing in wallet" → Launch wallet integrator + state-sync debugger (NOT mobile optimizer)
- Issue: "Convex query returning wrong data" → Launch convex architect + state-sync (NOT UI or wallet teams)
- Issue: "Button layout broken on mobile" → Launch mobile optimizer + ui-layout debugger (NOT wallet or database teams)

Use for: Complex multi-domain problems that need coordinated analysis and selective specialist deployment

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

**Working Implementation Pattern**:
```typescript
import { createPortal } from "react-dom";
import { useState, useEffect } from "react";

export default function YourLightbox({ onClose, ...props }) {
  const [mounted, setMounted] = useState(false);

  // Mount portal and lock body scroll
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Only render on client-side after mount
  if (!mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-auto p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal container - stopPropagation prevents backdrop click-through */}
      <div
        className="relative w-[1200px] max-w-[95vw] h-[90vh] bg-black/95 border-4 border-yellow-500/50 rounded-lg overflow-hidden shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Your modal content here */}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
```

**Components Using This Pattern** (reference these for examples):
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
- ## Error Type
Runtime ChunkLoadError

## Error Message
Loading chunk app/layout failed.
(timeout: http://localhost:3100/_next/static/chunks/app/layout.js)


    at RootLayout (src\app\layout.tsx:55:11)

## Code Frame
  53 |         {/* Global background with animated stars and particles */}
  54 |         <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden', zIndex: -1 }}>
> 55 |           <GlobalBackground />
     |           ^
  56 |         </div>
  57 |         
  58 |         {/* Content layer */}

Next.js version: 15.5.4 (Webpack)