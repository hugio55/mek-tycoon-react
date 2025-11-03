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
- **Implementation Plan:**
  - Phase 1: Backend schema and mutations (Convex)
  - Phase 2: Real-time sync hook (React)
  - Phase 3: Display zone component (industrial UI)
  - Phase 4: Admin configuration UI
  - Phase 5: Archive gold leveling code (preserve, don't delete)
- **Documentation Created:**
  - Backend schema design and API reference
  - Real-time sync architecture and edge case handling
  - Display zone component specifications
  - Integration guides for all components

---

*This document will be continuously updated as the custom slots system evolves. All new requirements, mechanics, and changes should be logged here.*
