# Essence System Design Document

## Overview
Essence is generated passively based on variations owned. Players accumulate essence over time at a rate of 0.1/day per variation instance (stackable).

## Core Mechanics

### Generation Rate
- **Base Rate**: 0.1 essence per day per variation instance
- **Stacking**: If player owns 3 Meks with "Bumblebee" head, they generate 0.3 Bumblebee essence per day
- **Components**: All 3 parts (head, body, item) generate essence independently

### Storage Cap
- **Default Cap**: 10 essence per variation type
- **Overflow Behavior**: Stops at cap, does not overflow

### Accumulation Method
- **On-Demand Calculation**: No background cron jobs
- **Simple Math**: (currentTime - lastCalculationTime) × rate × variationCount
- **Calculation Triggers**: When player views essence page or logs in

## Data Structure

### Total Variations: 288
- 102 Head variations
- 112 Body variations
- 74 Item/Trait variations

### Variation Name Mapping
**Source of Truth**: `/src/lib/variationsReferenceData.ts`
- Contains `ALL_VARIATIONS` with complete list
- Each entry: `{ id: number, name: string, type: "head"|"body"|"item" }`

## Database Schema

### `essenceSlots` (player's slotted Meks)
```typescript
{
  walletAddress: string,
  slotNumber: number,          // 1-5
  mekAssetId: string,          // Which Mek is slotted (null if empty)
  mekNumber: number,           // Mek # for display
  mekImageUrl: string,         // For thumbnail display
  headVariation: { id: number, name: string },
  bodyVariation: { id: number, name: string },
  itemVariation: { id: number, name: string },
  slottedAt: number,           // Timestamp when slotted
  isUnlocked: boolean,         // Is this slot available?
  unlockedAt: number,          // When slot was unlocked (null if locked)
}
```

### `essenceSlotRequirements` (per-player randomized requirements)
```typescript
{
  walletAddress: string,
  slotNumber: number,          // 2-5 (Slot 1 always free)
  goldCost: number,            // From admin config
  requiredEssences: [          // Randomly selected from rarity group
    {
      variationId: number,
      variationName: string,
      amountRequired: number   // From admin config
    }
  ]
}
```

### `essenceTracking` (one record per wallet)
```typescript
{
  walletAddress: string,
  isActive: boolean,           // Has player slotted first Mek?
  activationTime: number,      // When they slotted first Mek
  lastCalculationTime: number, // Last time essence was calculated
  totalSwapCount: number,      // How many times swapped (any slot)
  currentSwapCost: number,     // Current cost to swap (based on config + count)
  ownedMeks: array,            // Copy of Mek data for selection grid
}
```

### `essenceBalances` (sparse - only non-zero essences)
```typescript
{
  walletAddress: string,
  variationId: number,         // 1-288
  variationName: string,       // "Bumblebee", "Stone", "Disco", etc.
  accumulatedAmount: number,   // Current stored amount (0.0 - 10.0+)
  lastUpdated: number,         // Timestamp of last update
}
```

### `essencePlayerBuffs` (per-player buffs - future system)
```typescript
{
  walletAddress: string,
  variationId: number,
  rateMultiplier: number,      // 1.0 = base rate, 1.5 = 50% faster, 2.0 = 2x speed
  capBonus: number,            // +0 = default 10 cap, +2 = 12 cap, +5 = 15 cap
  sourceDescription: string,   // "Talent Tree Node", "Achievement", etc.
}
```

**Important**: Buffs are PER-PLAYER, not global. If Player A unlocks +50% Bumblebee rate, only Player A benefits. Player B's Bumblebee rate unchanged.

### `essenceConfig` (global admin settings)
```typescript
{
  configType: string,          // "slotCosts" | "swapCosts" | "rarityGroups"

  // For slotCosts:
  slotCosts: {
    slot2: { gold: number, essenceAmount: number },
    slot3: { gold: number, essenceAmount: number },
    slot4: { gold: number, essenceAmount: number },
    slot5: { gold: number, essenceAmount: number }
  },

  // For swapCosts:
  swapCosts: {
    startingCost: number,
    increaseType: "linear" | "percentage" | "exponential",
    increaseValue: number
  },

  // For rarityGroups:
  rarityGroups: {
    group1: number[],          // Array of variation IDs
    group2: number[],
    group3: number[],
    group4: number[]
  }
}
```

## Key Design Decisions

### Why Sparse Storage?
- Most players own 20-100 variations, not all 288
- Only create `essenceBalances` records when amount > 0
- Saves database space: ~50 records per player vs 288

### Why On-Demand Calculation?
- Essence rate is constant (not fluctuating like stock market)
- Only need two timestamps to calculate accumulation
- No need for expensive background cron jobs
- Example: If rate is 0.1/day and 24 hours passed → simply multiply

### Why Separate Player Buffs Table?
- Allows individual players to upgrade their own rates
- Future-proofs for talent tree / achievement systems
- Admin can grant temporary buffs to specific players

## Display Rules

### Essence Donut Page (`/essence-donut`)
- **Show only non-zero essences** - Do not show all 288 with zeros
- Sort by amount (highest first)
- Display options: Top 5, Top 10, Top 20, Top 30, All

### Color Coding
- Uses same color palette as donut chart
- Each essence type gets consistent color based on variation ID

## Admin Controls

### New Tab: "Essence"
Location: `/admin-master-data` page, add new system tab

### Admin Configuration Sections

#### 1. Slot Unlock Costs
**Gold Costs (5 inputs):**
- Slot 1: Always 0 (free, not editable)
- Slot 2: [Input field] gold (e.g., 1000g)
- Slot 3: [Input field] gold (e.g., 5000g)
- Slot 4: [Input field] gold (e.g., 25000g)
- Slot 5: [Input field] gold (e.g., 100000g)

**Essence Amount Required (4 inputs):**
- Slot 2: [Input field] amount of essence (e.g., 5.0)
- Slot 3: [Input field] amount of essence (e.g., 10.0)
- Slot 4: [Input field] amount of essence (e.g., 20.0)
- Slot 5: [Input field] amount of essence (e.g., 50.0)

**Note**: Number of essence types required is LOCKED:
- Slot 2: 1 type (not editable)
- Slot 3: 2 types (not editable)
- Slot 4: 3 types (not editable)
- Slot 5: 4 types (not editable)

#### 2. Essence Rarity Group Assignment
**Purpose**: Define which variations belong to which rarity tier

**Interface:**
- Table showing all 288 variations
- Columns: Variation ID, Name, Type (head/body/item), Rarity Group
- Rarity Group: Dropdown (Group 1 / Group 2 / Group 3 / Group 4)
- Bulk actions: "Assign selected to Group X"

**Default distribution suggestion:**
- Group 1 (Common): ~100 variations (most common)
- Group 2 (Uncommon): ~80 variations
- Group 3 (Rare): ~60 variations
- Group 4 (Very Rare): ~48 variations (rarest)

**Search/Filter:**
- Filter by: Variation type (heads/bodies/items)
- Filter by: Current rarity group
- Search by: Variation name

#### 3. Mek Swap Cost Configuration
**Starting Cost:**
- [Input field] Starting swap cost (e.g., 1000g)

**Cost Increase Type:**
- [Dropdown] Linear / Percentage / Exponential

**Increase Value:**
- [Input field] Depends on type:
  - Linear: Amount added per swap (e.g., +100g)
  - Percentage: % increase per swap (e.g., +10%)
  - Exponential: Multiplier per swap (e.g., 1.5x)

**Preview Calculation:**
- Shows cost for swaps 1-10 based on current settings
- Example:
  ```
  Swap 1: 1000g
  Swap 2: 1100g
  Swap 3: 1210g
  ...
  Swap 10: 2594g
  ```

#### 4. Global Statistics Table
**Purpose**: Monitor essence economy, see which essences are being generated most

**Columns:**
1. Variation Name (e.g., "Bumblebee", "Stone")
2. Total Generation Rate (sum across all players, in essence/day)
3. Active Slots (how many players have this variation slotted)
4. Total Accumulated (sum of all players' balances for this essence)
5. Average per Player (total accumulated ÷ active slots)

**Sort**: Default by Total Generation Rate (descending)

**Filters:**
- By rarity group
- By variation type (head/body/item)
- By generation rate threshold (e.g., show only > 1.0/day)

**Use Case**: Admin can identify if certain essences are flooding the market and plan economy adjustments

#### 5. Player Essence Dashboard
**Purpose**: View individual player's essence data for support/debugging

**Search:**
- By wallet address
- By corporation name

**Display for selected player:**
- Active slots (which Meks are slotted)
- Current essence balances (all types owned)
- Slot unlock status (which slots unlocked, requirements for locked slots)
- Swap cost history (how many times swapped, current cost)
- Generation rates (essence/day for each slotted variation)

**Actions:**
- Grant bonus essence (admin tool)
- Reset swap cost counter (customer service)
- Manually unlock slot (special case handling)

## Mek Slot System (Core Mechanic)

### Overview
Players must assign Meks to slots to generate essence. Only slotted Meks generate essence - ownership alone is not enough.

### Slot Configuration
- **Total slots**: 5
- **Slot 1**: Unlocked by default (free)
- **Slots 2-5**: Must be unlocked by spending gold + essence

### Generation Rules
**CRITICAL**: Only slotted Meks generate essence
- Example: Own 10 Meks with Bumblebee head
- Only 1 Mek slotted → Generate 0.1 Bumblebee essence/day
- Not 1.0/day (all 10 heads don't count)

### Slot Unlock Requirements

#### Slot 2 (First Paid Slot)
- **Gold cost**: Admin configurable
- **Essence required**: 1 type (randomly selected from Rarity Group 1)

#### Slot 3
- **Gold cost**: Admin configurable
- **Essence required**: 2 types (randomly selected from Rarity Group 2)

#### Slot 4
- **Gold cost**: Admin configurable
- **Essence required**: 3 types (randomly selected from Rarity Group 3)

#### Slot 5
- **Gold cost**: Admin configurable
- **Essence required**: 4 types (randomly selected from Rarity Group 4)

### Essence Rarity Groups
The 288 essence types are divided into 4 rarity groups:
- **Group 1 (Common)**: Used for Slot 2 - most available in market
- **Group 2 (Uncommon)**: Used for Slot 3 - moderately rare
- **Group 3 (Rare)**: Used for Slot 4 - quite rare
- **Group 4 (Very Rare)**: Used for Slot 5 - extremely rare

**Random Assignment Per Player:**
- When player first views essence page, system randomly selects:
  - Slot 2: 1 essence type from Group 1
  - Slot 3: 2 essence types from Group 2
  - Slot 4: 3 essence types from Group 3
  - Slot 5: 4 essence types from Group 4
- These requirements are LOCKED for that player (not re-rolled)
- Different players will have different essence requirements

**Purpose of Rarity Groups:**
- Higher probability of obtaining common essences (Group 1) for Slot 2
- Creates economy - common essences more available to trade
- Rare essences (Group 4) harder to obtain = Slot 5 is true endgame

### Mek Swapping System

#### Cost Structure
- **Universal cost**: Same cost to swap ANY slot (not per-slot pricing)
- **Escalating cost**: Each swap increases the next swap cost
- **Permanent increase**: Cost never resets or decreases

#### Admin Controls Needed
- **Starting swap cost**: Base gold amount for first swap (e.g., 1000g)
- **Increase rate**: How much cost grows per swap
  - Linear: +100g per swap (1000 → 1100 → 1200)
  - Percentage: +10% per swap (1000 → 1100 → 1210)
  - Exponential: 1.5x per swap (1000 → 1500 → 2250)
- **Curve type**: Linear / Percentage / Exponential

#### Example Progression
Starting cost: 1000g, Increase: +10% per swap
- Swap 1: 1000g
- Swap 2: 1100g
- Swap 3: 1210g
- Swap 4: 1331g
- Swap 10: ~2594g

### Visual Design - Two Modes

#### Mode 1: Lightbox/Modal (Detailed View)
**When shown:**
- First time visiting `/essence` page (no Meks slotted yet)
- Clicking on mini thumbnails at top of page
- Clicking "Manage Slots" button

**Contents:**
- All 5 slots displayed horizontally with full detail
- Locked slots show:
  - Gold cost to unlock
  - Required essence types + amounts
  - "Unlock" button (disabled if player can't afford)
- Unlocked empty slots show:
  - "+" button to assign Mek
  - Clicking opens Mek selection grid
- Occupied slots show:
  - Mek thumbnail + name
  - "Swap" button with gold cost
  - Essence generation rate (e.g., "0.1/day")
- Tooltip guidance on first visit: "Please employ your first mechanism to generate essence"

#### Mode 2: Mini Thumbnails (At-a-Glance)
**Location**: Top of `/essence` page, above donut chart

**Display:**
- 5 small thumbnails in horizontal row
- Occupied slots: Show Mek image (clickable)
- Empty unlocked slots: Show "+" icon (clickable)
- Locked slots: Show lock icon (clickable)
- Clicking any thumbnail opens detailed lightbox (Mode 1)

**Purpose**: Quick visual reference of what's slotted without opening full UI

### Assignment Flow

#### First Visit (No Meks Slotted)
1. Player navigates to `/essence`
2. Lightbox opens automatically
3. Tooltip: "Please employ your first mechanism to generate essence"
4. Visual emphasis on Slot 1's "+" button
5. Player clicks "+" → Mek selection grid opens
6. Player selects Mek → assigns to Slot 1
7. Lightbox closes automatically
8. Page shows: Donut chart + Mini thumbnails (Slot 1 has Mek, Slots 2-5 locked)

#### Subsequent Visits
1. Player sees donut chart + mini thumbnails
2. Clicks thumbnail → opens lightbox
3. Can unlock slots, swap Meks, view costs

### Mek Selection Grid
**Triggered by**: Clicking "+" on empty slot

**Display:**
- Modal/lightbox overlay
- Grid of player's Meks (thumbnail view)
- Shows Mek image, name, variation codes
- Grayed out: Meks already slotted elsewhere
- Clickable: Available Meks
- Select Mek → confirms assignment → closes modal

## Activation Flow

### Updated Flow (No "Activate" Button)
1. Player connects wallet, owns Meks
2. Navigates to `/essence`
3. **Lightbox opens immediately** (not a button)
4. Tooltip guides to slot first Mek
5. Player slots Mek → system creates `essenceTracking` record
6. Essence starts accumulating from that moment
7. Lightbox closes, shows donut + thumbnails

### Important Notes
- **No backdating**: Accumulation starts from first Mek slot time
- **Automatic activation**: Slotting first Mek = activation
- **Offline accumulation**: Continues earning even when logged out (calculated on next login)

## Future Enhancements (Not Yet Implemented)

### Buff Sources
- Talent tree nodes
- Achievement unlocks
- Temporary boosts from events
- NFT-specific bonuses (e.g., if Mek has rare trait)

### Essence Uses
- Crafting recipes
- Upgrades
- Market trading
- Special events

## Technical Notes

### Performance Optimization
- Cache `variationCounts` in `essenceTracking` to avoid recounting every calculation
- Recalculate counts only when:
  - Player acquires/loses Meks
  - Blockchain sync detects ownership change

### Calculation Formula
```javascript
for each variation player owns:
  hoursElapsed = (currentTime - lastCalculationTime) / (1000 * 60 * 60)
  daysElapsed = hoursElapsed / 24
  baseRate = 0.1  // per day per instance
  playerBuff = essencePlayerBuffs[variationId]?.rateMultiplier || 1.0
  effectiveRate = baseRate * playerBuff
  variationCount = variationCounts[variationId]

  essenceEarned = daysElapsed * effectiveRate * variationCount

  newAmount = Math.min(
    accumulatedAmount + essenceEarned,
    10 + (playerBuff?.capBonus || 0)
  )
```

## Implementation Priority

### Phase 1 (MVP)
1. Create database schema (3 tables)
2. Implement on-demand calculation logic
3. Build `/essence-donut` display page
4. Add "Activate" button and flow
5. Basic admin statistics table

### Phase 2 (Buffs)
1. Build buff application system
2. Admin tools to grant buffs
3. UI to show active buffs

### Phase 3 (Economy)
1. Essence spending mechanisms
2. Market system
3. Trading between players

## Page Location & Navigation

### URL Structure
- **Production URL**: `mek.overexposed.io/essence`
- **Dev URL**: `localhost:3100/essence`

### Page Design
- **Layout**: Matches main hub page (`/`) exactly
  - ✅ Keep: Logo, navigation, background, Mek dropdown (top-left corner)
  - ❌ Remove: Gold panel, leaderboard, Mek grid
  - ✨ Show: Essence Donut chart only (centered)

### Navigation Menu
- **NOT added to menu yet** - page remains hidden/secret
- Users cannot discover `/essence` unless they know the URL
- Purpose: Allows testing on production without revealing feature
- **Future**: Add "Essence" menu item to Mek dropdown when ready to launch

### Migration from `/essence-donut`
- `/essence-donut` was prototype/test page
- All logic will be ported to `/essence`
- Keep `/essence-donut` for reference or delete after migration complete

## Daily Checkpoint System

### Why Daily Checkpoints?
Even though essence accumulation rate is constant (simple math between two timestamps), we need daily snapshots for **market visibility**.

**Problem without checkpoints:**
- Player last logged in 2 weeks ago
- Their essence has been accumulating to 8.0 Bumblebee
- But database still shows 1.0 Bumblebee (last saved value)
- Other players browsing market see only 1.0 available
- Cannot make offers on the 8.0 that actually exists

**Solution: Daily checkpoint**
- Runs once every 24 hours for ALL active players
- Calculates accumulated essence since last checkpoint
- Saves to `essenceBalances` (updates public records)
- Updates `lastCalculationTime`
- Now market shows accurate holdings even for inactive players

### Calculation Triggers
1. **Daily Checkpoint** (Convex cron) - Updates all players once per day for market visibility
2. **On-Demand** (when player views `/essence`) - Real-time accuracy for that player only

## Questions & Answers Log

**Q**: Should checkpoints run in background every 10 minutes?
**A**: No - use simple math with two timestamps. However, run daily checkpoint (once per 24 hours) for market visibility so other players can see accurate essence holdings even if owner hasn't logged in.

**Q**: Are buffs global (all players) or per-player?
**A**: Per-player. Player A unlocking +50% Bumblebee rate only affects Player A.

**Q**: Show all 288 essences with zeros?
**A**: No - only show essences with non-zero amounts.

**Q**: Where should admin controls go?
**A**: New "Essence" tab in `/admin-master-data`, not in Variations section.

**Q**: When does accumulation start?
**A**: Upon activation (clicking "Start Essence" button), not backdated to ownership.

**Q**: Where should essence page live?
**A**: Create new `/essence` page matching main hub design. Remove gold panel + Mek grid, show only essence donut. Do NOT add to navigation menu yet (keep secret for testing).

**Q**: Activation button UX - when player visits `/essence` before activating?
**A**: No button. Lightbox opens automatically with tooltip "Please employ your first mechanism to generate essence" guiding to Slot 1's + button. Slotting first Mek = activation.

**Q**: Which variations generate essence?
**A**: ONLY slotted Meks. If you own 10 Bumblebee heads but only 1 is slotted, you get 0.1/day (not 1.0/day). Ownership doesn't matter - only what's slotted counts.

**Q**: Can you swap Meks between slots?
**A**: Yes, costs gold. Cost is universal (not per-slot) and escalates with each swap. Admin configurable: starting cost, increase type (linear/percentage/exponential), increase value.

**Q**: How are slot unlock requirements determined?
**A**: Gold costs are admin-set. Essence requirements are randomly selected per player from rarity groups. Different players get different essence requirements.

**Q**: How many essence types required per slot?
**A**: Locked: Slot 2 = 1 type, Slot 3 = 2 types, Slot 4 = 3 types, Slot 5 = 4 types. Not configurable.

**Q**: What are rarity groups?
**A**: 288 variations divided into 4 tiers (Group 1-4). Admin assigns each variation to a group. Slot 2 uses Group 1 (common), Slot 5 uses Group 4 (rare). Purpose: Makes lower slots easier to unlock (common essences more available).

**Q**: Admin controls location?
**A**: New "Essence" tab in `/admin-master-data`. Includes: slot costs, rarity group assignment, swap cost config, global statistics, player dashboard.
