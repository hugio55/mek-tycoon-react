# Mek Tycoon - Project Instructions

## Primary Working Directory
**`mek-tycoon-react-staging` is the PRIMARY working directory** (ignore "staging" in name).
- **Path**: `C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react-staging`
- **Production Database**: `fabulous-sturgeon-691.convex.cloud` (Sturgeon - see Dual Database section)
- **Port**: localhost:3200

---

## Phase II: Fresh Start (No Migration)
- Phase I users will NOT be migrated - all users register anew
- Do NOT write migration code or fallback logic for goldMining data
- Legacy tables being deleted: `goldMining`, `goldMiningState`, `corporations`
- The `users` table IS the corporation (1 user = 1 corporation)

**Active Tables**: `users`, `meks`, `userEssence`, `userJobSlots`

---

## Dev Server Management
**User starts their own dev servers. NEVER start background dev server tasks.**

When user says "start it up": `npm run dev:all`

**If server restart needed**: Tell user "Restart the dev server in your terminal" - don't start it yourself.

**"Internal Server Error" fix**:
1. `netstat -ano | findstr :3200` (find PID)
2. `Stop-Process -Id <PID> -Force`
3. User restarts: `npm run dev:all`

---

## Key Documentation
| System | Document |
|--------|----------|
| Job Slots | `SLOTS.md` |
| Data Architecture | `USERS_TABLE_CONSOLIDATION_PLAN.md` |

---

## Data Architecture

**`users` table = IDENTITY ONLY**: stakeAddress, corporationName, gold, level, timestamps

**Create SEPARATE table when data is**: multiple items per user, unbounded growth, sparse (many types/few values), changes independently, accessed in specific contexts only

**Add to `users` ONLY if**: single scalar value + bounded + core to identity + accessed everywhere + rarely changes

---

## Meks Table Protection
**4000 NFT records - NEVER DELETE THEM**

- `accumulatedGoldAllTime`: NEVER reset (lifetime stat)
- `accumulatedGoldForCorp`: Resets on transfer/sale
- When deleting user: clear ownership fields, preserve lifetime stats

---

## Dual Database System
**Trout** (wry-trout-962) = Development - safe to experiment
**Sturgeon** (fabulous-sturgeon-691) = Production - affects real users

- `npm run dev:all` syncs to Trout
- Use Admin → Deployments to deploy to Sturgeon
- Always test on Trout first, backup before production deploys

---

## Branch Protection
**Current branch**: `custom-minting-system`
- Check branch before any work: `git branch --show-current`
- Triple confirmation before switching branches
- Commit work before switching

---

## Tailwind CSS v3
**Must be v3, NOT v4.** If styles broken (plain text): check package.json for ^3.x.x

---

## Project Overview
Web-based idle/tycoon game with collectible Mek NFTs. Resource management, crafting, collection mechanics.

**Main Page**: `/home` (not /hub)
**Terminology**: "Mek" not "mech", "Mekanism" not "mechanism"
**Tech**: Next.js 15, React, TypeScript, Tailwind v3, Convex, Cardano/MeshSDK (disabled)

---

## Console Debugging
Use searchable tags: `[🔨MINT]`, `[💎ESSENCE]`, `[👛WALLET]`, `[🗄️CONVEX]`
- Unique keywords that won't appear in other logs
- User can filter console by tag to isolate relevant output

---

## Design System

**Industrial Style** (game UI, cards, navigation):
- Reference: `localhost:3200/contracts/single-missions`
- Files: `/src/styles/global-design-system.css`, `/src/lib/design-system.ts`
- Yellow/gold borders, glass-morphism, hazard stripes, Orbitron font

**Space Age Style** (lightboxes, modals, dialogs):
- Reference: Admin → Space Age Style tab, `NewStylingAdmin.tsx`
- See `BetaSignupLightbox.tsx` for full implementation

---

## Variation Data
**Source of truth**: `/src/lib/completeVariationRarity.ts`
- 291 variations: 102 heads, 112 bodies, 77 traits
- Each has: id, name, type, sourceKey (3-char code), rarity data

**Special traits (NEVER filter out)**: "Nil", "Null", "None", "Nothing" - legitimate ghostly-themed variations

---

## Mek Images
**Location**: `public/mek-images/` with `150px/`, `500px/`, `1000px/` folders
**Format**: `[head]-[body]-[item].webp` in lowercase

**Critical**: Database sourceKeys need suffix removal and lowercase conversion:
```javascript
const cleanKey = mek.sourceKey.replace(/-[A-Z]$/, '').toLowerCase();
const path = `/mek-images/150px/${cleanKey}.webp`;
```

---

## File Structure
```
src/app/        # Next.js pages
src/components/ # Reusable components
src/contexts/   # React contexts
src/lib/        # Utilities
convex/         # Backend functions
public/         # Static assets
```

---

## Common Issues
1. **Styles broken**: Check Tailwind is v3 not v4
2. **styled-jsx errors**: NEVER use styled-jsx - use Tailwind or global CSS
3. **Port conflicts**: Kill specific PID, not all node processes

---

## Slash Commands

### `/ultra` - Multi-agent coordination
Launch `@project-lead` + relevant specialists based on the problem domain:
- Wallet/NFT: `@cardano-wallet-integrator`, `@blockchain-architecture-specialist`
- Database: `@convex-database-architect`, `@state-sync-debugger`
- UI: `@ui-layout-debugger`
- Mobile: `@mobile-responsive-optimizer`
- Code quality: `@code-modularizer`, `@syntax-error-fixer`

### `/style` - Apply Industrial Design System
Replace generic styles with industrial classes from design system files.

---

## UI Patterns

**Modal positioning fix**: Use `createPortal(content, document.body)` to render at DOM root instead of component tree. See `MekLevelsViewer.tsx` for example.

**Wallet lessons**:
- One component owns each modal (not multiple instances)
- Parent controls visibility, child calls `onClose()`
- Remove debug logs from render paths (causes freezing)

---

## Save System Protection
**Ask user TWICE before modifying**: `/src/app/admin-save/*`, `/api/save/*`, `/convex/saves.ts`, `/saves/`

---

## Communication Guidelines
- **TAKE ACTION**: Edit files directly, don't ask user to do it (exception: dev servers)
- **Ask for clarity** when instructions are vague
- **Voice concerns** before implementing risky changes
- **MINIMIZE CODE OUTPUT**: Describe changes conversationally, not with code blocks
- **BRIEF SUMMARIES**: Bullet points, user asks if they want details

---

## User Preferences
- No emojis in code (unless requested)
- Minimal comments, clean code
- Visual references critical - user thinks spatially
- Protective of existing work - always non-destructive
- Direct communication, honest assessment
- Complete tasks fully before moving to next request
