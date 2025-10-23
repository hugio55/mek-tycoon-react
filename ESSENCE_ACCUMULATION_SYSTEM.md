# Essence Accumulation System

## Overview
Mekanisms placed in active slots generate essence passively over time. This is a core idle game mechanic where players earn resources even when offline.

---

## Core Mechanics

### Generation Rate
- **Base Rate**: 0.1 essence per day per variation
- **Per Mekanism**: Each Mekanism has 3 variations (head, body, trait)
- **Total Generation**: 0.3 essence/day per Mekanism (0.1 × 3 variations)
- **Rarity**: All Mekanisms start at 0.1/variation regardless of rarity
- **Real-time Updates**: Like gold, essence updates continuously (requires high decimal precision)
- **Auto-calculation**: Accumulates while offline, awards automatically on return

### Upgrade System

#### Global Upgrades
- Affects ALL variations of ALL Mekanisms
- Example: Global upgrade from 0.1/day to 0.2/day for all three variations
- New total: 0.6 essence/day per Mekanism (0.2 × 3)

#### Variation-Specific Upgrades
- Affects ONLY a specific variation type (e.g., "Bumblebee" heads)
- **Account-Wide**: Applies to ALL Mekanisms the user owns (current and future) with that variation
- Example: "Upgrade Bumblebee Essence generation by 0.1"
  - ALL Mekanisms with Bumblebee heads: 0.2/day
  - Other two variations: 0.1/day each
  - New total: 0.4 essence/day per Mekanism with Bumblebee

#### Upgrade Stacking
- **Multiple Purchases**: Users can buy the same upgrade multiple times
  - Example: Buy "Bumblebee +0.1" three times → 0.1 + 0.1 + 0.1 + 0.1 (base) = 0.4/day for Bumblebee
- **Global + Specific Stacking**: Both types can stack together
  - Example: Global +0.1 (all variations now 0.2/day) + Bumblebee +0.1 = Bumblebee 0.3/day, others 0.2/day
- **Permanent**: All upgrades are permanent once acquired

#### How Upgrades Are Obtained
- **NOT Direct Purchase**: Users cannot directly buy essence generation upgrades
- **ONLY Source**: Mekanism Level-Up System (see below)
- **NOT from**: Achievements, missions, contracts, or any other systems

#### Mekanism Level-Up System
- **Reference System**: See root page (`/src/app/page.tsx`) - existing gold generation level-up system
- **Level Progression**: Mekanisms level up from 1 → 2 → 3 → etc.
- **Guaranteed Reward**: Each level up increases gold generation rate
- **Occasional Bonus**: Some level ups ALSO grant essence generation upgrades
  - Example: "Mekanism hits level 3 → +0.1 Bumblebee Essence buff"
  - **Randomly Generated**: Which levels get which essence bonuses is determined dynamically
  - **Not Hardcoded**: System must be flexible - don't pre-define which levels give what
  - **Admin Configurable**: Logic for assigning bonuses will be designed separately

#### Level-Up Cost System (In Flux)
- **Current System**: Costs gold to upgrade Mekanism to next level
- **Potential New System**: Time-based progression
  - Mekanisms gain experience/levels based on how long they're slotted
  - No gold cost, just requires time in active slot
- **Decision Pending**: User is contemplating which approach to use

#### Upgrade Visibility
- **Per-Mekanism Display**: When viewing a specific Mekanism the user owns
  - Show all essence generation buffs that Mekanism has earned through level-ups
  - Example display: "Level 3 bonus: +0.1 Bumblebee Essence"
  - Visible in Mekanism details/stats screen
- **Cumulative View**: User can see total essence generation rate including all upgrades
- **Not Global List**: Upgrades are tied to specific Mekanisms, shown in Mekanism context

### Slot System

#### Current Configuration
- **Starting Slots**: 1 slot (unlocked by default)
- **Current Maximum**: 6 slots
- **Future Maximum**: Hundreds of slots (system must be future-proof)

#### Unlocking Slots
- **Cost Type**: Gold AND Essence required (fully admin-configurable)
- **Admin Interface**: Admin Master Data page → Essence tab → Essence Generation sub-tab
- **Configurability**: Each slot's unlock cost can be edited by admin in real-time
- **Default Starting Costs** (admin can change these later):
  - Slot 2: 200 gold + 2 Bumblebee essence
  - Slot 3: 300 gold + 3 Bumblebee essence
  - Slot 4: 400 gold + 4 Bumblebee essence
  - Slot 5: 500 gold + 5 Bumblebee essence
  - Slot 6: 600 gold + 6 Bumblebee essence
  - **Pattern**: Slot X costs (X × 100) gold + X Bumblebee essence
  - **NOTE**: These are temporary defaults for initial setup
- **Admin Override**: Admins can manually lock/unlock slots for specific players (bypassing costs)

### Swapping Mekanisms

#### Swap Costs
- **Cost Type**: Gold only
- **Cost Progression**: Increases with each swap
- **Per-Slot Pricing**: Each slot has its own swap counter and cost formula

#### Slot-Specific Cost Tables

**Slot 1**:
- Swap 1: 10 gold
- Swap 2: 20 gold
- Swap 3: 30 gold
- Formula: `10 × swap_count`

**Slot 2**:
- Swap 1: 20 gold
- Swap 2: 40 gold
- Swap 3: 60 gold
- Formula: `20 × swap_count`

**Slot 3**:
- Swap 1: 30 gold
- Formula: `30 × swap_count`

**Slot 4**:
- Swap 1: 40 gold
- Formula: `40 × swap_count`

**Slot 5**:
- Swap 1: 50 gold
- Formula: `50 × swap_count`

**Slot 6**:
- Swap 1: 100 gold (SPECIAL - jumps to 100)
- Swap 2: 200 gold
- Swap 3: 300 gold
- Formula: `100 × swap_count`

**General Formula**: `(slot_number × 10) × swap_count` (except Slot 6 uses 100 as base)

#### Swap Counter Behavior
- **Increment Trigger**: Counter increments immediately when you REMOVE a Mekanism from a slot
- **Removal Cost**: FREE - no gold cost to remove
- **Slotting Cost**: Gold cost applies when placing a Mekanism into a slot
- **Example Flow**:
  1. User places Mekanism in Slot 6 (first time) → Costs 100 gold
  2. User removes Mekanism → FREE, but swap counter increments (1→2)
  3. Next slot cost shown immediately updates → 200 gold
  4. User places different Mekanism → Costs 200 gold
  5. User removes it → FREE, counter increments (2→3)
  6. Next cost shown → 300 gold
- **Per-Slot Tracking**: Each slot has its own independent swap counter
- **Maximum Cap**: Counter has a configurable maximum value
  - **Default Starting Cap**: 50 (admin can change later)
  - **Admin Configurable**: Max cap is set in Admin Master Data → Essence → Essence Generation tab
  - When counter hits max, cost stays at maximum forever
  - Examples with default cap of 50:
    - Slot 1: Maxes at 500 gold (10 × 50)
    - Slot 2: Maxes at 1,000 gold (20 × 50)
    - Slot 6: Maxes at 5,000 gold (100 × 50)
  - Different slots can have different caps (if admin chooses)
- **Never Auto-Resets**: Counter persists indefinitely unless admin intervenes
- **Admin Reset**: Admins can manually reset a player's swap counter for any slot

---

## Technical Requirements

### Database Schema (Convex)

#### User Essence Tracking
```typescript
// In users table or separate essenceSlots table
{
  userId: Id<"users">,
  totalEssence: number,              // Current essence balance
  lastEssenceUpdate: number,         // Timestamp for offline calculation
  unlockedSlots: number,             // How many slots user has (1-6 currently, up to hundreds)
  slots: [
    {
      slotNumber: number,            // 1-6
      mekId: Id<"meks"> | null,      // Active Mekanism in this slot
      swapCount: number,             // How many times this slot has been swapped
      activatedAt: number,           // When Mekanism was placed (for tracking)
    }
  ]
}
```

#### Upgrade Tracking in Schema

**RECOMMENDATION: Hybrid Approach (Option B + Cached Totals)**

Store individual upgrade instances with metadata, PLUS cached totals for performance:

```typescript
// Per-Mekanism upgrade tracking
{
  mekId: Id<"meks">,
  level: number,  // Current level of this Mekanism
  essenceUpgrades: [
    {
      upgradeId: string,           // Unique ID for this upgrade instance
      variationType: "head" | "body" | "trait" | "global",
      variationName: string,       // e.g., "Bumblebee", or "global" for global upgrades
      bonusAmount: number,         // e.g., 0.1
      acquiredAtLevel: number,     // Which level granted this upgrade
      timestamp: number,           // When it was earned
      source: "level_up"           // Future-proof for other sources
    }
  ],

  // CACHED TOTALS (for performance - updated whenever essenceUpgrades changes)
  cachedEssenceRates: {
    head: number,      // Total essence/day for this Mekanism's head (base + all upgrades)
    body: number,      // Total essence/day for this Mekanism's body
    trait: number,     // Total essence/day for this Mekanism's trait
    total: number      // Sum of all three
  }
}
```

**Why Hybrid Approach is Best:**

1. **Audit Trail**: Full history of when/how each upgrade was earned
2. **Debugging**: Can trace issues back to specific level-ups
3. **Reversibility**: Admin can remove specific upgrades if needed
4. **Future Features**: Can show "upgrade history" or "recent upgrades" UI
5. **Metadata**: Can store which level granted the upgrade (useful for display)
6. **Performance**: Cached totals mean no need to sum hundreds of upgrades every frame
7. **Validation**: Can verify cached totals match upgrade instances (data integrity)

**Trade-off**: Slightly more storage and need to maintain cache consistency
- BUT: This is worth it for robustness and debugging capabilities
- Cache invalidation is straightforward: recalculate whenever essenceUpgrades array changes

#### Additional Schema Considerations
- Track swap history per slot (for analytics/debugging)
- Admin-configurable slot unlock costs (stored in system config)
- Admin-configurable swap counter max caps (per slot or global)
- Global base generation rate (admin-editable)

### Calculation Logic

#### Offline Earnings Formula
```typescript
const timeElapsed = Date.now() - lastEssenceUpdate;
const daysElapsed = timeElapsed / (1000 * 60 * 60 * 24);
const essencePerDay = activeSlots.reduce((total, slot) => {
  // Each slot contributes 0.3/day base (0.1 per variation × 3 variations)
  // Plus any upgrades (global + variation-specific)
  return total + calculateSlotEssenceRate(slot);
}, 0);
const earnedEssence = daysElapsed × essencePerDay;
```

#### Real-Time Display
- Similar to gold generation system
- Update every frame/second
- **Display Precision**: 3 decimal places (matching gold)
- **Internal Precision**: Higher precision for accurate calculations
- Updates smoothly without jumps

### Backend Functions Needed

1. **`unlockSlot(slotNumber)`**
   - Check if user has required gold and essence
   - Deduct costs
   - Increment unlockedSlots
   - Initialize new slot in slots array

2. **`swapMekanism(slotNumber, newMekId)`**
   - Calculate swap cost based on slot and swap count
   - Check if user has gold
   - Deduct gold
   - Update slot with new Mekanism
   - Increment swap counter
   - Update timestamp

3. **`removeMekanism(slotNumber)`**
   - FREE - no gold cost
   - Clear Mekanism from slot
   - Increment swap counter immediately
   - Update next slot cost display
   - Calculate and award any accumulated essence up to removal time

4. **`calculateEssence()`**
   - Calculate accumulated essence since last update
   - Add to user balance
   - Update timestamp

5. **`getSlotSwapCost(slotNumber, currentSwapCount)`**
   - Calculate next swap cost for slot
   - Return cost for UI display

---

## UI Requirements (TBD)

### Display Elements Needed
- Current essence balance (real-time)
- Generation rate (e.g., "+0.3/day")
- Slot management interface:
  - Visual slots (1-6 shown, rest locked)
  - "Unlock" button for locked slots (show cost)
  - Assigned Mekanism display (if any)
  - "Swap" button (show cost)
  - Swap counter/history?
- Available Mekanisms picker

### Placement Options
- Hub page (alongside gold)
- New "Mekanisms" page
- Profile page
- Dedicated "Essence" page

---

## Admin Interface Changes

### Admin Master Data Page Restructure
- **Rename Tab**: "Market" → "Essence"
- **New Sub-Tabs Inside Essence Tab**:
  1. **Market** - Existing market functionality:
     - Listing duration options
     - Market fees configuration
     - Market configuration settings
     - Essence market management
  2. **Essence Generation** - New slot and generation configuration:
     - Slot unlock costs (editable table)
     - Global essence generation rate (editable)
     - Player-specific slot management (lock/unlock, swap counter reset)

### Market Sub-Tab Contents
- Listing duration options
- Market fees (percentage, flat rate, etc.)
- General market configuration
- Essence market management (CLARIFICATION NEEDED: what specific settings?)

### Essence Generation Sub-Tab Contents

#### Slot Unlock Costs Table
- **Editable Table**: Slots 2-6 unlock costs
  - Columns: Slot Number | Gold Cost | Essence Cost
  - Allows admin to set/update costs in real-time
  - Changes apply immediately to all players

#### Global Settings
- **Base Generation Rate**: Editable (default 0.1 essence/day per variation)
  - Affects ALL players globally
  - Changes apply immediately
- **Swap Counter Max Cap**: Editable per slot
  - Set maximum value for swap counters
  - Can be global (same cap for all slots) or per-slot (different caps)
  - When counter reaches cap, cost stays at maximum
- **Maximum Slots**: Currently hardcoded at 6 (not editable yet)

#### Player-Specific Management (CLARIFICATION NEEDED: same page or separate?)
- **Manual Slot Control**: Lock/unlock specific slots for specific players
- **Swap Counter Reset**: Reset swap counter for any player's slot
- **Player Search/Select**: Find player by username/ID
- **Audit Log**: Track admin actions on player accounts?

---

## Open Questions

### Answered Questions (Session 1)
1. ✅ Generation rate: 0.3/day total (0.1 per variation)
2. ✅ Swap counter: Increments on removal, per-slot, admin-configurable max cap, admin can reset
3. ✅ Removal cost: Free to remove, only slotting costs gold
4. ✅ Decimal precision: 3 decimal places (matching gold)
5. ✅ Rarity bonuses: All start at 0.1/variation, no rarity bonus
6. ✅ Upgrade scope: Account-wide (applies to ALL Mekanisms with that variation)
7. ✅ Upgrade stacking: Yes, both multiple same upgrades AND global+specific stack
8. ✅ Upgrade source: ONLY from Mekanism level-ups (not achievements/missions/purchases)
9. ✅ Upgrade triggers: Randomly generated during Mekanism level-ups, logic to be designed
10. ✅ Upgrade visibility: Shown when viewing specific Mekanism (per-Mekanism display)
11. ✅ Admin controls: Can lock/unlock slots, reset counters, edit costs/rates/caps
12. ✅ Swap counter max: Admin-configurable in Essence Generation tab
13. ✅ Database schema: Hybrid approach - individual upgrade instances + cached totals (recommended)
14. ✅ Level-up system: Reference root page (`/src/app/page.tsx`), currently costs gold (may become time-based)

### Remaining Questions (Deferred)

1. ✅ ~~Default Slot Unlock Costs~~: ANSWERED
   - Defaults set (200-600 gold, 2-6 Bumblebee essence)
   - All admin-configurable

2. ✅ ~~Default Swap Counter Max Cap~~: ANSWERED
   - Default: 50 (admin-configurable)

3. **Essence Upgrade Assignment Logic**: DEFERRED until after core system is built
   - How to determine which Mekanism level-ups get essence upgrades?
   - Percentage chance per level? Specific milestones?
   - Random variation selection, or based on Mekanism's variations?
   - Amount of bonus (+0.1 always, or variable?)
   - Admin-configured rules?

4. **Player-Specific Admin Controls**: MINOR - can decide during implementation
   - Same page or separate admin tool?
   - Lock/unlock player slots
   - Reset player swap counters

5. **Essence Market Management**: MINOR - can decide during implementation
   - What specific settings belong in the Market sub-tab?
   - Are essence items tradeable on the market?
   - Market fees for essence transactions?

### Future Considerations
- Achievement system integration?
- Slot upgrade system (e.g., slot efficiency boosts)?
- Mekanism specialization (some generate more essence)?
- Prestige system (reset for benefits)?
- Visual effects for generation?

---

## Implementation Phases

### Phase 1: Backend Foundation
- [ ] Create database schema
- [ ] Implement offline calculation system
- [ ] Build slot unlock function
- [ ] Build swap function
- [ ] Build essence accumulation function

### Phase 2: Real-Time Updates
- [ ] Hook into existing real-time system (like gold)
- [ ] Add essence ticker/counter
- [ ] Test precision and performance

### Phase 3: Frontend UI
- [ ] Design slot interface
- [ ] Implement Mekanism picker
- [ ] Add cost displays and confirmations
- [ ] Visual feedback for actions

### Phase 4: Testing & Polish
- [ ] Test offline earnings
- [ ] Test swap cost progression
- [ ] Balance tuning (costs, rates)
- [ ] Edge case handling

---

## Notes
- System must scale to hundreds of slots eventually
- Swap costs should discourage frequent changes but not be prohibitive
- Real-time updates crucial for player engagement
- Offline earnings prevent player frustration

---

## Progress Tracker

### Session 1 (2025-10-22)
**Completed:**
- ✅ Created comprehensive documentation file
- ✅ Defined generation rate (0.3/day per Mekanism, 0.1 per variation)
- ✅ Defined slot system (1-6 slots currently, scalable to hundreds)
- ✅ Defined swap cost progression (formula per slot, admin-configurable max cap)
- ✅ Clarified swap counter behavior (increments on removal, has max cap, admin can reset)
- ✅ Clarified removal cost (free, only slotting costs gold)
- ✅ Defined admin interface structure:
  - Rename "Market" tab to "Essence"
  - Two sub-tabs: Market (existing features) + Essence Generation (new features)
  - Configurable slot unlock costs
  - Configurable base generation rate
  - Configurable swap counter max caps
  - Player-specific controls (lock/unlock, reset counters)
- ✅ Defined upgrade system in FULL detail:
  - Account-wide upgrades (applies to ALL Mekanisms with that variation)
  - Stacking allowed (multiple same upgrades + global+specific combos)
  - ONLY source: Mekanism level-ups (no achievements/missions/direct purchase)
  - Randomly generated during level-ups (logic to be designed)
  - Visible when viewing specific Mekanism
  - Reference existing level-up system on root page (`/src/app/page.tsx`)
- ✅ Clarified decimal precision (3 decimal places, matching gold)
- ✅ Clarified level-up cost system (currently gold, may become time-based)
- ✅ Database schema recommendation (Hybrid: individual upgrade instances + cached totals)
  - Provides audit trail, debugging, reversibility
  - Cached totals for performance
  - Future-proof for additional features

**Final Answers:**
- ✅ Default slot unlock costs:
  - Slot 2: 200 gold + 2 Bumblebee essence
  - Slot 3: 300 gold + 3 Bumblebee essence
  - Slot 4: 400 gold + 4 Bumblebee essence
  - Slot 5: 500 gold + 5 Bumblebee essence
  - Slot 6: 600 gold + 6 Bumblebee essence
  - Pattern: (slot_number × 100) gold + slot_number Bumblebee essence
  - NOTE: These are temporary defaults - admin can change via panel
- ✅ Default swap counter max cap: 50 (admin-configurable)
- ✅ Essence upgrade assignment logic: DEFERRED until after core system is built
- ⏳ Player-specific admin controls: MINOR - decide during implementation
- ⏳ Essence market management: MINOR - decide during implementation

**Ready to Build:**
- All critical questions answered
- Database schema designed (hybrid approach)
- Default values established
- Admin configurability requirements clear

**Implementation Progress:**

**Phase 1: Database Schema** - PENDING
- Define Convex schema tables for:
  - Essence slots (per user)
  - Essence upgrades (per Mekanism)
  - System config (slot unlock costs, base rates, swap caps)
- Implement hybrid tracking (individual upgrades + cached totals)

**Phase 2: Admin Interface** - ✅ COMPLETED
- ✅ Renamed "Market" tab to "Essence" in Admin Master Data page
- ✅ Created two sub-tabs:
  - ✅ Market (moved existing market features)
  - ✅ Essence Generation (new)
- ✅ Built Essence Generation sub-tab:
  - ✅ Slot unlock costs editable table (slots 2-6)
    - Default values: 200/2, 300/3, 400/4, 500/5, 600/6 (gold/Bumblebee essence)
    - Editable inputs for each slot
  - ✅ Base generation rate control (default: 0.1 essence/day per variation)
  - ✅ Swap counter max cap control (default: 50 swaps)
  - ✅ Player-specific management tools placeholder (to be implemented)

**Phase 3: Backend Functions**
- `unlockSlot(slotNumber)` - Check costs, deduct, unlock slot
- `swapMekanism(slotNumber, mekId)` - Calculate cost, swap Mekanism
- `removeMekanism(slotNumber)` - Free removal, increment counter
- `calculateEssence()` - Offline + real-time accumulation
- Update existing `levelUpMekanism()` - (essence upgrade logic deferred)

**Phase 4: Real-Time Integration**
- Hook essence generation into existing real-time system (like gold)
- Display essence balance with 3 decimal precision
- Show per-second essence accumulation

**Phase 5: Frontend UI**
- Design slot management interface
- Mekanism assignment/removal UI
- Cost displays and confirmations
- Upgrade visibility in Mekanism details

**Phase 6: Testing**
- Offline earnings calculation accuracy
- Swap cost progression and caps
- Admin controls functionality
- Real-time display precision

**DEFERRED for later:**
- Essence upgrade assignment logic (which levels give bonuses)
- Time-based leveling system (vs gold-cost leveling)

---

*Last Updated: 2025-10-22 (Session 1)*
