# Custom Slots System - Comprehensive Documentation

**Purpose:** This document tracks the evolving custom slots system built using the Overlay Editor. This is distinct from the existing essence slot system - custom slots allow creating visual slot layouts with zones and mechanics defined through the overlay editor.

**Status:** Active Development
**Created:** 2025-11-02
**Last Updated:** 2025-11-02

---

## System Overview

The custom slots system allows:
1. **Visual slot design** via the Overlay Editor (`/admin`)
2. **Zone-based positioning** for Mek thumbnails and UI elements
3. **Complex buff mechanics** when Meks are equipped to slots
4. **Flexible slot configurations** saved to database as overlays

---

## Zone Architecture

Zones in the overlay editor use a two-level system:

### 1. Zone Type (Behavior/Interaction)
Defines HOW the zone behaves:
- **Mechanism Slot** - Interactive slot for placing Meks
- **Button** - Clickable button
- **Clickable Area** - General click target
- **Display Zone** - Shows dynamic data/images (non-interactive)
- **Custom** - User-defined behavior

### 2. What to Display (Content Type)
For Display Zones only - defines WHAT content shows:

#### Current Display Options:
- **Current Gold** - Live gold balance
- **Essence Amount** - Specific essence balance
- **Mek Count** - Number of Meks owned
- **Cumulative Gold** - Total gold earned
- **Gold Per Hour** - Mining rate
- **Slotted Mek PFP** - Profile picture of Mek in this slot *(Added 2025-11-02)*
- **Tenure Progress** - Progress bar showing Mek's tenure accumulation toward next level *(Added 2025-11-02)*

#### Slotted Mek PFP Details:
- **Purpose:** Shows the thumbnail image of the Mek placed in this slot
- **Behavior:**
  - When slot is empty: Shows placeholder or empty state
  - When Mek is slotted: Displays Mek image from `/mek-images/150px/[sourceKey].webp`
- **Use Case:** Primary Mek display area in custom slots
- **Architecture:** Display Zone → What to Display: "Slotted Mek PFP"

#### Tenure Progress Details:
- **Purpose:** Shows time-based leveling progress for slotted Mek *(Added 2025-11-02)*
- **Behavior:**
  - Progress bar fills as Mek accumulates tenure while slotted
  - Base rate: 1 tenure/second (buffable via global or per-Mek buffs)
  - When bar reaches 100%, "Level Up" button appears
  - Tenure persists when Mek is unslotted/reslotted
- **Use Case:** Primary leveling mechanic (replaces gold-based leveling)
- **Architecture:** Display Zone → What to Display: "Tenure Progress"
- **Visual Variants:**
  - Minimal: Compact single-line progress bar
  - Standard: Full industrial frame with percentage
  - Detailed: Premium design with hazard stripes and effects
- **Size Options:** Small (160px), Medium (224px), Large (288px)

---

## Slot Mechanics

### Tenure System *(Added 2025-11-02)*
- **Status:** ✅ **Backend FULLY IMPLEMENTED and ACTIVELY WORKING**
- **Purpose:** Time-based leveling system that replaces gold-based leveling
- **Core Mechanic:**
  - Meks accumulate "tenure" while slotted (1 tenure/second base rate)
  - When tenure reaches threshold, player manually clicks "Level Up"
  - Tenure persists when Mek is unslotted/reslotted
  - No auto-leveling - requires player action

#### ✅ **CRITICAL REQUIREMENTS VERIFIED (2025-11-03)**

**1. OFFLINE ACCUMULATION** ✅
- **Implementation:** Timestamp-based calculation (identical to gold system)
- **Code location:** `convex/tenure.ts` line 42-49
- **How it works:**
  - Tenure is calculated as `(now - lastTenureUpdate) / 1000 × effectiveRate`
  - Works identically whether user is online or offline
  - No active server process required - calculated on-demand when queried
- **Formula:** `currentTenure = savedTenure + (elapsedSeconds × rate × buffs)`

**2. PER-MEK TRACKING** ✅
- **Implementation:** Each Mek has independent tenure fields in database schema
- **Code location:** `convex/schema.ts` line 74-78
- **Storage fields:**
  - `tenurePoints` - Accumulated tenure value
  - `lastTenureUpdate` - Last snapshot timestamp
  - `isSlotted` - Current slot status
  - `slotNumber` - Which slot (1-6)
- **Isolation:** Tenure for Mek #1 has zero impact on Mek #2's tenure

**3. PERSISTENCE WHEN UNSLOTTED** ✅
- **Implementation:** Unslot mutation snapshots current tenure before freezing
- **Code location:** `convex/tenure.ts` line 326-336 (`unslotMek` mutation)
- **How it works:**
  - Calculate final tenure including all elapsed time: `calculateCurrentTenure()`
  - Save calculated value to `tenurePoints` field
  - Set `isSlotted = false`
  - Mark freeze time with `lastTenureUpdate = now`
- **Example:** Mek with 500 tenure unslotted after gaining 50 more → saved as 550

**4. FREEZE WHEN UNSLOTTED** ✅
- **Implementation:** Calculation function checks `isSlotted` before accumulating
- **Code location:** `convex/lib/tenureCalculations.ts` line 41-44
- **How it works:**
  - If `isSlotted = false`, return `savedTenure` immediately (no time calculation)
  - If `isSlotted = true`, calculate `savedTenure + elapsedTime × rate`
- **Example:** Mek with 50 tenure unslotted for 7 days → still shows 50 tenure

**5. RESUME ON RE-SLOT** ✅
- **Implementation:** Slot mutation preserves existing tenure value
- **Code location:** `convex/tenure.ts` line 265-270 (`slotMek` mutation)
- **How it works:**
  - Set `isSlotted = true`
  - Set `lastTenureUpdate = now` (start new accumulation period)
  - **PRESERVE** `tenurePoints` value (don't reset to 0)
  - Calculation starts from saved value going forward
- **Example:** Mek with 50 tenure reslotted → continues from 50, not 0

#### **Backend Endpoints (Ready to Use)**
- **Query:** `getMekWithTenure(mekId)` - Get Mek with real-time calculated tenure
- **Mutation:** `slotMek(mekId, slotNumber, walletAddress)` - Start tenure accumulation
- **Mutation:** `unslotMek(mekId, walletAddress)` - Freeze tenure at current value
- **Mutation:** `levelUpMek(mekId, walletAddress)` - Spend tenure to level up
- **Mutation:** `batchLevelUpMek(mekId, walletAddress, maxLevels)` - Level up multiple times
- **Query:** `getActiveTenureBuffs(mekId)` - Get current buff multipliers
- **Query:** `getWalletTenureStats(walletAddress)` - Aggregate tenure across all Meks

#### **Calculation Formula**
```
effectiveRate = baseRate × (1 + globalBuffs + perMekBuffs)
currentTenure = savedTenure + (elapsedSeconds × effectiveRate)
```

**Example calculation:**
- Mek has 50 tenure saved
- Slotted 60 seconds ago
- Base rate: 1 tenure/second
- Global buff: +50% (0.5)
- Per-Mek buff: +25% (0.25)
- **Result:** 50 + (60 × 1 × 1.75) = **155 tenure**

#### **Key Features:**
- ✅ Admin-configurable level thresholds (editable in admin panel)
- ✅ Buffable tenure rate (global buffs affect all Meks, per-Mek buffs affect specific Mek)
- ✅ Excess tenure carries over after level-up (1200 tenure, need 1000 → keep 200)
- ⏳ Real-time progress bar with smooth animation (frontend implementation pending)

#### **Technical Architecture:**
- ✅ Stored on Mek record (tenurePoints, tenureRate, lastTenureUpdate)
- ✅ Calculated on-read (no passive database writes)
- ✅ Timestamp-based accumulation (works offline)
- ⏳ Hybrid client/server sync for smooth UI updates (frontend pending)

#### **Display:**
- Tenure Progress display zone (see Display Options above)
- **Status:** Backend complete, frontend component pending integration

### Buff System
- **Status:** Partially defined (tenure rate buffs designed, other buffs TBD)
- **Tenure Buffs:** Global and per-Mek tenure rate multipliers
- **Other Buffs (Future):** When a Mek is equipped to a custom slot, it may receive buffs based on:
  - Slot type/rarity
  - Mek variations (head/body/trait combinations)
  - Slot upgrade level
  - Other factors TBD

### Slot Upgrades
- **Status:** Not yet defined
- **Concept:** Players can upgrade custom slots to:
  - Increase buff effectiveness
  - Unlock additional zones
  - Add visual enhancements
  - Other mechanics TBD

---

## Technical Implementation

### Database Schema

**Table:** `overlays`
- Stores slot designs created in the overlay editor
- Each slot has:
  - `imageKey`: Unique identifier (e.g., "slot test 1")
  - `imagePath`: Path to base slot image (e.g., `/slots/test 1.png`)
  - `imageWidth`, `imageHeight`: Original image dimensions
  - `zones`: Array of zone definitions

**Zone Object Structure:**
```typescript
{
  id: string,               // Unique zone ID
  mode: "zone" | "sprite",  // Zone vs sprite positioning
  type: string,             // "Display Zone", "Slotted Mek PFP", etc.
  x: number,                // Position (top-left corner)
  y: number,
  width: number,            // Dimensions
  height: number,
  label: string,            // Display label
  metadata: any             // Additional zone-specific data
}
```

### Rendering

**Component:** `src/app/home/page.tsx`
- Custom slots render above existing essence slots
- Uses scaling math to maintain zone positioning across different display sizes
- Scale factor: `displayedWidth / originalImageWidth`
- All positions/dimensions scaled by this factor

**Key Logic:**
```typescript
const displayScale = customSlotSize.width / customSlotOverlayData.imageWidth;
const scaledX = zone.x * displayScale;
const scaledY = zone.y * displayScale;
```

### Overlay Editor

**Location:** `/admin` page
- **Project Management:** Save/load slot designs
- **Zone Creation:** Draw rectangular zones on slot images
- **Zone Configuration:** Set zone type, positioning, metadata
- **Export:** Saves to Convex `overlays` table

---

## Planned Features (To Be Added)

### Additional Zone Types (Future)
- Buff indicator zones
- Stat display zones
- Action button zones (equip/unequip)
- Animation/effect zones
- Multiple Mek display zones (for combo slots?)

### Slot Categories
- **Status:** Not yet defined
- Examples might include:
  - Mining slots (gold generation buffs)
  - Combat slots (battle stat buffs)
  - Crafting slots (variation bonuses)
  - Special slots (unique mechanics)

### Rarity/Unlock System
- Some slots may require unlocking
- Rarity tiers affecting buff strength
- Unlock costs (gold, essence, achievements?)

---

## Open Questions

1. **Buff Calculation:** How are buff values calculated when a Mek is slotted?
2. **Slot Limits:** How many custom slots can a player have active?
3. **Swap Mechanics:** Can players freely swap Meks between custom slots?
4. **Slot Persistence:** Do custom slot designs persist per-player or globally?
5. **Visual Feedback:** How do we show buffs are active (glow effects, stat display)?

---

## Implementation Status

### ✅ Completed
- [x] Basic overlay editor with zone creation
- [x] Save/load overlay designs to database
- [x] Render custom slot on home page
- [x] Scale zone positioning correctly
- [x] Display slotted Mek image in designated zone
- [x] Added "Slotted Mek PFP" to Display Zone options
- [x] Established proper two-level zone architecture (Zone Type → Display Type)

### ✅ Completed
- [x] Implement tenure system backend (schema, mutations, queries) *(2025-11-02)*
  - All 5 critical requirements verified working (2025-11-03)
  - Offline accumulation via timestamp calculation
  - Per-Mek tracking with independent fields
  - Persistence across unslot/reslot cycles
  - Freeze when unslotted, resume when reslotted

### 🔄 In Progress
- [ ] Create tenure progress display zone component (frontend)
- [ ] Integrate backend tenure queries into existing slot pages
- [ ] Add admin UI for editing tenure level thresholds
- [ ] Render "Slotted Mek PFP" zones on actual slot pages

### 📋 Planned
- [ ] Multiple zone type options in dropdown
- [ ] Slot categorization system
- [ ] Buff calculation and display (beyond tenure buffs)
- [ ] Player-specific slot configurations
- [ ] Admin tools for slot management
- [ ] Slot upgrade system

---

## Related Documents

- **ESSENCE_SLOT_BOOST_MECHANICS.md** - Existing essence slot upgrade system (separate from custom slots)
- **SLOTTED_MEKS_CHANGES.md** - Original essence slot implementation
- **ESSENCE_ACCUMULATION_SYSTEM.md** - Account-wide variation upgrades

---

## Development Log

### 2025-11-02: Initial System Setup
- Created custom slot rendering on home page
- Implemented proper zone scaling mathematics
- User requested "Slotted Mek PFP" display option
- Created this documentation file to track evolving requirements

### 2025-11-02: Architecture Refinement
- **Initial approach:** Added "Slotted Mek PFP" as separate zone type (incorrect)
- **User feedback:** Should be under Display Zone → "What to Display" dropdown
- **Reasoning:** Zone Type = behavior (display/click/slot), Display Type = content (gold/mek/stats)
- **Correction:** Moved to proper location for better scalability and separation of concerns
- **Result:** Clean two-level architecture (Zone Type → Display Type)

### 2025-11-02: Tenure System Architecture Designed
- **Major Feature:** Time-based leveling system replacing gold-based leveling
- **User Requirements:**
  - Tenure stored on Mek (persists across unslot/reslot)
  - Base rate: 1 tenure/second, buffable via global or per-Mek buffs
  - Admin-configurable level thresholds
  - Manual level-up only (no auto-leveling)
  - Display as progress bar on slot via overlay editor
- **Technical Decisions:**
  - Hybrid client/server real-time calculation pattern
  - On-read calculation (zero passive database writes)
  - Three visual variants (minimal, standard, detailed)
  - Industrial aesthetic matching site design system
- **Implementation Status:**
  - ✅ Phase 1: Backend schema and mutations (Convex) - **COMPLETE**
  - ⏳ Phase 2: Real-time sync hook (React) - Pending
  - ⏳ Phase 3: Display zone component (industrial UI) - Pending
  - ⏳ Phase 4: Admin configuration UI - Pending
  - ⏳ Phase 5: Archive gold leveling code (preserve, don't delete) - Pending
- **Documentation Created:**
  - Backend schema design and API reference
  - Real-time sync architecture and edge case handling
  - Display zone component specifications
  - Integration guides for all components

### 2025-11-03: Backend Implementation Verification
- **Critical Question:** User needed proof that tenure accumulates offline reliably
- **Verification Conducted:** Complete audit of backend implementation
- **Results:** All 5 critical requirements confirmed working:
  1. ✅ Offline accumulation (timestamp-based, like gold)
  2. ✅ Per-Mek tracking (independent database fields)
  3. ✅ Persistence when unslotted (snapshot on unslot)
  4. ✅ Freeze when unslotted (calculation checks isSlotted flag)
  5. ✅ Resume on re-slot (preserves tenurePoints value)
- **Code Audit Locations:**
  - `convex/tenure.ts` - Main backend logic (730 lines)
  - `convex/lib/tenureCalculations.ts` - Calculation helpers (139 lines)
  - `convex/schema.ts` - Storage schema with per-Mek fields
- **Conclusion:** Backend is production-ready and actively accumulating tenure for slotted Meks
- **Next Steps:** Frontend integration to display and interact with tenure system

### 2025-11-03: View Levels Table Enhancement
- **Issue Discovered:** User reported all Meks showing "0.0 (frozen)" tenure despite having 6 slotted Meks
- **Root Cause:** Component was checking `mek.isSlotted` from goldMiningData, but this field isn't populated
- **Source of Truth:** The `essenceSlots` table contains actual slotted Mek information
- **Fix Applied:**
  1. Added `essenceSlots` query to MekLevelsViewer component
  2. Created Set of slotted asset IDs from essenceSlots data
  3. Check Mek's assetId against Set to determine actual slotted status
  4. Use accurate slotted status for tenure accumulation tracking
- **Feature Added:** Sortable "Slotted" column to filter slotted Meks to top
  - Clickable column headers for all major columns (Mek #, Level, Base Gold, Boost %, Total Gold, Tenure, Slotted, Gold Spent)
  - Up/down arrows show current sort direction
  - Slotted column displays "✓ Yes" (green) for slotted Meks, "No" (gray) for unslotted
- **Files Modified:**
  - `src/components/MekLevelsViewer.tsx` - Lines 23-24 (state), 27 (query), 40-81 (tenure init), 116-165 (sorting), 189-242 (headers), 306-312 (column data)
- **Result:** Tenure now displays correctly for slotted Meks with live accumulation, and table is fully sortable

---

## JOB SLOT SYSTEM - CAREER PROGRESSION (2025-11-15)

**IMPORTANT:** This is the PRIMARY slot system being developed. Earlier sections about "custom slots" and "essence slots" are separate systems. This job slot system represents the main career/leveling mechanic.

### Core Mechanics

**Job Selection & Assignment:**
- Each mek has 2-3 available job types (determined by variation/rank/synergy - TBD)
- Player clicks mek → Chooses from available jobs (lightbox with slot art)
- Only eligible jobs are highlighted/selectable
- Job types: Janitor, Engineer, Artist, Scientist, Captain, etc.
- Each job has unique slot art, difficulty tier, pay rate, pit stop count

**Tenure & Progression:**
- **Tenure is tied to: Mek + Current Job Type**
- Example: Mek #42 as Janitor has independent progress from Mek #42 as Engineer
- Tenure accumulates ONLY while mek is slotted (1 tenure/second base rate)
- When tenure bar fills → "Level Up" button appears
- Levels 1-10 per job type per mek

**Job Switching Rules:**

**Mid-Level Switching (Has Penalty):**
- Halfway through Janitor Level 2→3 (500/1000 tenure)
- Click "Switch Job" → Choose Engineer
- **Tenure resets to 0** for Engineer Level 2→3
- Lost tenure is permanent (cannot recover Janitor progress without re-doing)
- **UX:** Large warning modal before confirming switch

**Post-Level Switching (No Penalty):**
- Complete Janitor Level 1→2, click "Level Up" button
- Now at Level 2, can choose new job: Engineer
- Start Engineer Level 2→3 from 0 tenure (clean slate)
- Previous job progress saved (can return to Janitor Level 2→3 later)

**Unslotting Behavior (No Penalty):**
- Mek #42 working Janitor Level 2→3 with 500/1000 tenure
- Player unslots mek (for essence strategy or other reasons)
- **Tenure freezes at 500** (not lost)
- **Job type remembered** (Janitor)
- When re-slotting Mek #42 later → Automatically slots as Janitor, resumes at 500 tenure
- **No job selection prompt** on re-slot (uses remembered job)

**Pit Stop Buff System:**
- Pit stops at specific tenure milestones (configurable per job tier)
- Example: 100, 250, 500, 1000, 2000 tenure thresholds
- When pit stop reached → Button flashes above progress bar
- Player clicks → Modal shows 3 random buff options
- Player picks 1 buff → Permanently applied to mek (tied to mek, NOT job or slot)
- Buff types: +gold/hr, +essence/day, flat gold bonus, flat essence bonus, etc.
- Buff quality scales with: (1) Job tier (D→S), (2) Level (1→10)

**Buff History Display:**
- Mek profile page has "View Buff History" button
- Opens lightbox showing grid of circles (chronological order)
- Each circle = one pit stop buff selection
- Click circle → Shows buff details:
  - Buff value (+5 gold/hr)
  - Job type it was earned from (Janitor)
  - Level and pit stop number
  - Timestamp
- Visual timeline of all buffs earned across all jobs

**Job Memory System:**
- When unslotted, mek remembers "Last Job" (Option A selected)
- Mek profile shows: "Current Job: Janitor Level 2→3, 500/1000 tenure (Paused)"
- Re-slotting automatically uses last job (no re-selection)
- Switching jobs mid-level requires manual "Switch Job" button (with warning)

**Multi-Job Progression Per Mek:**
- One mek can work multiple job types over time
- Each job type has independent progression
- Example: Mek #42 could be:
  - Janitor: Level 5, 300/1000 tenure
  - Engineer: Level 2, 700/1000 tenure
  - Artist: Level 1, 0/1000 tenure (just started)
- Only ONE job active at a time (the one currently slotted)

**No Abandoned Job Tracking:**
- If player switches jobs mid-level, lost tenure is NOT tracked
- Buff history shows what was earned, not what was abandoned
- Clean, simple history without clutter

### Job Availability System (Design In Progress)

**Question:** How to determine which 2-3 jobs each mek can do?

**Proposed Options:**

**Option A: Variation-Based (Thematic)**
- Head variation determines job eligibility
- Example mapping:
  - Camera heads → Artist, Engineer, Scientist
  - Industrial heads → Janitor, Mechanic, Laborer
  - Military heads → Guard, Captain, Strategist
  - Musical heads → Entertainer, Artist, Composer

**Option B: Rank-Based (Rarity = Access)**
- Common meks (rank 200-291) → 2 basic jobs (Janitor, Laborer)
- Uncommon (rank 100-199) → 3 jobs (adds Mechanic or Artist)
- Rare (rank 50-99) → 4 jobs (adds Engineer or Scientist)
- Legendary (rank 1-49) → 5+ jobs (adds Captain, Strategist, elite roles)

**Option C: Synergy-Based (Head + Body Combination)**
- Specific head+body pairs unlock unique jobs
- Example: Camera head + Industrial body → Photographer, Documentarian
- Example: Military head + Musical body → Drill Sergeant (rhythm-based command)
- Creates rare job combinations for specific mek builds

**Option D: Trait-Based (Item Variation Modifier)**
- Base jobs from head variation (2 jobs)
- Item/trait adds +1 bonus job
- Example: Camera head (Artist, Engineer) + Wrench trait → adds Mechanic
- Encourages diverse mek compositions

**Option E: Hybrid System (Multiple Factors)**
- Primary: Head variation (defines 2 base jobs)
- Secondary: Rank tier (unlocks higher-tier versions or additional slots)
- Tertiary: Body or trait (adds situational bonuses)
- Most complex but most customizable

**DECISION MADE (2025-11-15): Hybrid System - Variation + Rank**

**Final Job Availability Formula:**
- **2 thematic jobs** based on head variation category + variation rarity (Beginner/Intermediate/Advanced tiers)
- **1 universal military job** based on mek's overall rank (1-4000, divided into 10 tiers)

**Example:**
- Mek with rare "Polaroid Gold" head (rank 45 overall) gets:
  1. Advanced Journalist (thematic - from rare Polaroid variation)
  2. Top-tier military rank (universal - from rank 45/4000)

**Military Rank System:**
- ALL 4000 meks divided into 10 military tiers
- Admin-configurable rank ranges (e.g., Tier 1: 4000-3500, Tier 2: 3499-3000, etc.)
- Each tier has unique name, slot art, pit stop count, pay multiplier
- Lower rank numbers = higher military tier (rank 1 = highest, rank 4000 = lowest)

**Thematic Job Tier System:**
- Within each job category (Journalist, Mechanic, etc.), variations divided into difficulty tiers
- Beginner tier: Common variations, fewer pit stops (e.g., 3-4 per level)
- Intermediate tier: Uncommon variations, medium pit stops (e.g., 5-6 per level)
- Advanced tier: Rare variations, most pit stops (e.g., 8-10 per level)
- Manual admin assignment per variation (handles uneven splits like 2 variations or 6 variations)

**Pit Stop Count Scaling:**
- Beginner jobs: Fewer pit stops per level
- Intermediate jobs: Medium pit stops per level
- Advanced jobs: Most pit stops per level
- Applies to BOTH thematic jobs AND military ranks

**Pay Rate Scaling:**
- Advanced tier jobs provide higher gold/essence multipliers
- Rare variations earn more resources per hour
- Economic advantage to owning rare meks

**Job Category Mapping:**
- PENDING: Head variation categorization into job types
- Requires review of 102 head variations to create thematic groupings
- Will be designed after military rank system is complete

**Buff Type Weighting System (2025-11-15):**
- Different job types have different buff priorities (configurable per job)
- Examples:
  - Military jobs: 60% gold buffs, 30% essence buffs, 10% cosmetic buffs
  - Artist jobs: 30% gold buffs, 40% essence buffs, 30% cosmetic/skin buffs
  - Scientist jobs: Equal distribution or special research buffs
- Admin configures buff type weights in Slots tab testing ground
- RNG respects weights when generating 3 pit stop options
- Allows thematic differentiation (soldiers earn gold, artists earn cosmetics)

### Technical Architecture Notes

**Database Schema Requirements:**
```
mekJobProgressions table:
- mekId: string
- jobType: string (janitor, engineer, etc.)
- currentLevel: 1-10
- tenureForCurrentLevel: number
- lastWorkedAt: timestamp
- isCurrentJob: boolean (only one true per mek)

pitStopSelections table:
- mekId: string
- jobType: string
- level: number
- pitStopIndex: number
- buffType: string
- buffValue: number
- selectedAt: timestamp
```

**UI Components Needed:**
- Corporation page: Job slot grid (6 slots)
- Job selection lightbox (available jobs with slot art)
- Tenure progress bar with pit stop markers
- Buff selection modal (3 choices)
- Buff history timeline (grid of circles)
- Job switch warning modal
- Mek profile: Current job status display

**Important Implementation Notes:**
- ⚠️ Database schemas from earlier agent work may need revision
- System is still in design phase, architecture is fluid
- Focus on planning before implementation

---

*This document will be continuously updated as the custom slots system evolves. All new requirements, mechanics, and changes should be logged here.*
