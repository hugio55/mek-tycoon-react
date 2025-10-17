# Essence System - Complete Implementation Plan

## Overview
This document outlines the step-by-step implementation strategy for the essence system. Each phase builds on the previous, with clear validation checkpoints.

---

## Phase 1: Database Foundation (Convex Schema)

### Priority: CRITICAL - Everything depends on this

### 1.1 Create Schema File
**File**: `convex/essenceSchema.ts`

**Tables to Define**:

```typescript
// essenceConfig - Global admin settings
defineTable({
  configType: v.string(), // "slotCosts" | "swapCosts" | "rarityGroups"
  slotCosts: v.optional(v.object({
    slot2: v.object({ gold: v.number(), essenceAmount: v.number() }),
    slot3: v.object({ gold: v.number(), essenceAmount: v.number() }),
    slot4: v.object({ gold: v.number(), essenceAmount: v.number() }),
    slot5: v.object({ gold: v.number(), essenceAmount: v.number() })
  })),
  swapCosts: v.optional(v.object({
    startingCost: v.number(),
    increaseType: v.string(), // "linear" | "percentage" | "exponential"
    increaseValue: v.number()
  })),
  rarityGroups: v.optional(v.object({
    group1: v.array(v.number()),
    group2: v.array(v.number()),
    group3: v.array(v.number()),
    group4: v.array(v.number())
  }))
})
.index("by_type", ["configType"])

// essenceSlots - Player's slotted Meks
defineTable({
  walletAddress: v.string(),
  slotNumber: v.number(),
  mekAssetId: v.optional(v.string()),
  mekNumber: v.optional(v.number()),
  mekImageUrl: v.optional(v.string()),
  headVariation: v.optional(v.object({ id: v.number(), name: v.string() })),
  bodyVariation: v.optional(v.object({ id: v.number(), name: v.string() })),
  itemVariation: v.optional(v.object({ id: v.number(), name: v.string() })),
  slottedAt: v.optional(v.number()),
  isUnlocked: v.boolean(),
  unlockedAt: v.optional(v.number())
})
.index("by_wallet", ["walletAddress"])
.index("by_wallet_slot", ["walletAddress", "slotNumber"])

// essenceSlotRequirements - Per-player unlock requirements
defineTable({
  walletAddress: v.string(),
  slotNumber: v.number(),
  goldCost: v.number(),
  requiredEssences: v.array(v.object({
    variationId: v.number(),
    variationName: v.string(),
    amountRequired: v.number()
  }))
})
.index("by_wallet", ["walletAddress"])
.index("by_wallet_slot", ["walletAddress", "slotNumber"])

// essenceTracking - Player activation and swap history
defineTable({
  walletAddress: v.string(),
  isActive: v.boolean(),
  activationTime: v.optional(v.number()),
  lastCalculationTime: v.number(),
  totalSwapCount: v.number(),
  currentSwapCost: v.number(),
  version: v.number() // For optimistic concurrency control
})
.index("by_wallet", ["walletAddress"])
.index("by_active", ["isActive"])

// essenceBalances - Accumulated essence (sparse storage)
defineTable({
  walletAddress: v.string(),
  variationId: v.number(),
  variationName: v.string(),
  accumulatedAmount: v.number(),
  lastUpdated: v.number()
})
.index("by_wallet", ["walletAddress"])
.index("by_wallet_variation", ["walletAddress", "variationId"])
.index("by_variation", ["variationId"])

// essencePlayerBuffs - Future per-player buffs
defineTable({
  walletAddress: v.string(),
  variationId: v.number(),
  rateMultiplier: v.number(),
  capBonus: v.number(),
  sourceDescription: v.string()
})
.index("by_wallet", ["walletAddress"])
.index("by_wallet_variation", ["walletAddress", "variationId"])
```

### 1.2 Validation Checkpoint
- [ ] Schema compiles without errors
- [ ] All indexes are correctly defined
- [ ] Can insert test data via Convex dashboard
- [ ] Can query test data successfully

**Time Estimate**: 1-2 hours

---

## Phase 2: Core Backend Logic (Convex Functions)

### 2.1 Initialization System
**File**: `convex/essenceInitialization.ts`

**Key Functions**:

#### `getOrCreateEssenceData(walletAddress)`
**Purpose**: First-time player setup

**Logic**:
1. Check if `essenceTracking` exists for wallet
2. If not:
   - Load global config (slot costs, rarity groups, swap costs)
   - Generate deterministic random slot requirements (Slots 2-5)
   - Create 5 slot records (Slot 1 unlocked, 2-5 locked)
   - Create `essenceTracking` record (isActive: false)
   - Create `essenceSlotRequirements` records (4 records)
3. Return complete player data

**Critical Details**:
- Use wallet address as RNG seed for deterministic randomness
- Validate rarity groups exist before generating requirements
- Handle case where config doesn't exist (return sensible defaults)

#### `generateSlotRequirements(walletAddress, rarityGroups, slotCosts)`
**Purpose**: Create per-player unlock requirements

**Algorithm**:
```typescript
function generateSlotRequirements(
  walletAddress: string,
  rarityGroups: { group1: number[], group2: number[], group3: number[], group4: number[] },
  slotCosts: { slot2: {...}, slot3: {...}, slot4: {...}, slot5: {...} }
) {
  // Create deterministic seed from wallet address
  const seed = hashWalletAddress(walletAddress);
  const rng = new SeededRandom(seed);

  const requirements = [];

  // Slot 2: Select 1 random variation from Group 1
  const slot2Essence = rng.selectFrom(rarityGroups.group1, 1);
  requirements.push({
    slotNumber: 2,
    goldCost: slotCosts.slot2.gold,
    requiredEssences: [{
      variationId: slot2Essence[0],
      variationName: getVariationName(slot2Essence[0]),
      amountRequired: slotCosts.slot2.essenceAmount
    }]
  });

  // Slot 3: Select 2 random variations from Group 2
  const slot3Essences = rng.selectFrom(rarityGroups.group2, 2);
  requirements.push({
    slotNumber: 3,
    goldCost: slotCosts.slot3.gold,
    requiredEssences: slot3Essences.map(id => ({
      variationId: id,
      variationName: getVariationName(id),
      amountRequired: slotCosts.slot3.essenceAmount
    }))
  });

  // Similar for Slots 4 and 5...

  return requirements;
}
```

**Seeded Random Implementation**:
```typescript
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    // Linear congruential generator
    this.seed = (this.seed * 1664525 + 1013904223) % 2**32;
    return this.seed / 2**32;
  }

  selectFrom<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => this.next() - 0.5);
    return shuffled.slice(0, count);
  }
}

function hashWalletAddress(address: string): number {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) - hash) + address.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
```

### 2.2 Slot Management
**File**: `convex/essenceSlots.ts`

#### `assignMekToSlot(walletAddress, slotNumber, mekAssetId)`
**Purpose**: Assign a Mek to a slot

**Logic**:
1. Verify slot is unlocked
2. Verify slot is empty or swapping
3. Get Mek data (variations, image, number)
4. Calculate swap cost if swapping (not new assignment)
5. If swapping: deduct gold, increment swap count
6. Update slot record with Mek data
7. If this is first slot assignment: set `isActive: true`, `activationTime: now`
8. Return updated slot + new swap cost

**Edge Cases**:
- Mek already slotted elsewhere (prevent)
- Slot is locked (reject)
- Insufficient gold for swap (reject)
- Mek doesn't exist (reject)

#### `unlockSlot(walletAddress, slotNumber)`
**Purpose**: Unlock a paid slot

**Logic**:
1. Get slot requirements for this wallet + slot
2. Check player has sufficient gold
3. Check player has sufficient essence (all required types)
4. Deduct gold from `goldMining.accumulatedGold`
5. Deduct essence from `essenceBalances`
6. Update slot: `isUnlocked: true`, `unlockedAt: now`
7. Return success + updated balances

**Critical**: This must be atomic (all deductions happen or none)

**Transaction Logic**:
```typescript
// Use Convex transaction to ensure atomicity
await ctx.db.patch(goldMiningRecord._id, {
  accumulatedGold: goldMiningRecord.accumulatedGold - goldCost
});

for (const requirement of requiredEssences) {
  const balance = await ctx.db.query("essenceBalances")
    .withIndex("by_wallet_variation", q =>
      q.eq("walletAddress", walletAddress).eq("variationId", requirement.variationId)
    )
    .first();

  if (!balance || balance.accumulatedAmount < requirement.amountRequired) {
    throw new Error("Insufficient essence");
  }

  await ctx.db.patch(balance._id, {
    accumulatedAmount: balance.accumulatedAmount - requirement.amountRequired
  });
}

await ctx.db.patch(slotRecord._id, {
  isUnlocked: true,
  unlockedAt: Date.now()
});
```

#### `swapMekInSlot(walletAddress, slotNumber, newMekAssetId)`
**Purpose**: Replace slotted Mek with another

**Logic**:
1. Get current swap cost from `essenceTracking`
2. Verify player has sufficient gold
3. Deduct gold
4. Increment `totalSwapCount`
5. Recalculate `currentSwapCost` based on config
6. Remove old Mek from slot
7. Assign new Mek to slot
8. Update `essenceTracking`
9. Return updated slot + new swap cost

### 2.3 Essence Calculation Engine
**File**: `convex/essenceCalculation.ts`

#### `calculateAccumulatedEssence(walletAddress)`
**Purpose**: Calculate essence earned since last calculation

**Algorithm**:
```typescript
export async function calculateAccumulatedEssence(ctx, walletAddress: string) {
  // 1. Get player data
  const tracking = await getEssenceTracking(ctx, walletAddress);
  if (!tracking.isActive) {
    return []; // No slots assigned yet
  }

  // 2. Get slotted Meks
  const slots = await getPlayerSlots(ctx, walletAddress);
  const slottedMeks = slots.filter(s => s.mekAssetId !== null);

  // 3. Count variations from slotted Meks
  const variationCounts = new Map<number, number>();
  for (const slot of slottedMeks) {
    if (slot.headVariation) {
      variationCounts.set(
        slot.headVariation.id,
        (variationCounts.get(slot.headVariation.id) || 0) + 1
      );
    }
    if (slot.bodyVariation) {
      variationCounts.set(
        slot.bodyVariation.id,
        (variationCounts.get(slot.bodyVariation.id) || 0) + 1
      );
    }
    if (slot.itemVariation) {
      variationCounts.set(
        slot.itemVariation.id,
        (variationCounts.get(slot.itemVariation.id) || 0) + 1
      );
    }
  }

  // 4. Calculate time elapsed
  const now = Date.now();
  const lastCalc = tracking.lastCalculationTime;
  const timeElapsedMs = now - lastCalc;
  const daysElapsed = timeElapsedMs / (1000 * 60 * 60 * 24);

  // 5. Get existing balances
  const existingBalances = await ctx.db.query("essenceBalances")
    .withIndex("by_wallet", q => q.eq("walletAddress", walletAddress))
    .collect();

  // 6. Get player buffs (future feature, may be empty)
  const buffs = await ctx.db.query("essencePlayerBuffs")
    .withIndex("by_wallet", q => q.eq("walletAddress", walletAddress))
    .collect();

  // 7. Calculate new balances
  const newBalances = [];

  for (const [variationId, count] of variationCounts.entries()) {
    const baseRate = 0.1; // essence per day per instance
    const buff = buffs.find(b => b.variationId === variationId);
    const rateMultiplier = buff?.rateMultiplier || 1.0;
    const capBonus = buff?.capBonus || 0;

    const effectiveRate = baseRate * rateMultiplier;
    const cap = 10 + capBonus;

    // Find existing balance
    const existing = existingBalances.find(b => b.variationId === variationId);
    const currentAmount = existing?.accumulatedAmount || 0;

    // Calculate earned essence
    const essenceEarned = daysElapsed * effectiveRate * count;
    const newAmount = Math.min(currentAmount + essenceEarned, cap);

    // Round to 2 decimal places for consistency
    const roundedAmount = Math.round(newAmount * 100) / 100;

    if (roundedAmount > 0) {
      newBalances.push({
        walletAddress,
        variationId,
        variationName: getVariationName(variationId),
        accumulatedAmount: roundedAmount,
        lastUpdated: now
      });
    }
  }

  return newBalances;
}
```

**Critical Considerations**:
- Must handle case where player unslots all Meks (variationCounts = 0)
- Must cap essence at max (10 + buffs)
- Must round consistently (2 decimal places)
- Must be identical whether run on-demand or via checkpoint

#### `saveEssenceBalances(walletAddress, newBalances)`
**Purpose**: Persist calculated essence to database

**Logic**:
1. For each variation in newBalances:
   - Check if `essenceBalances` record exists
   - If yes: update `accumulatedAmount` and `lastUpdated`
   - If no: insert new record
2. Update `essenceTracking.lastCalculationTime = now`
3. Handle version conflicts (optimistic concurrency)

**Optimistic Concurrency**:
```typescript
const tracking = await getEssenceTracking(ctx, walletAddress);
const currentVersion = tracking.version;

// Do calculation...

// Try to update
const updated = await ctx.db.patch(tracking._id, {
  lastCalculationTime: now,
  version: currentVersion + 1
});

if (updated.version !== currentVersion + 1) {
  // Someone else updated in the meantime, retry
  return calculateAccumulatedEssence(ctx, walletAddress);
}
```

### 2.4 Query Functions
**File**: `convex/essenceQueries.ts`

#### `getPlayerEssenceData(walletAddress)`
**Purpose**: Get all essence data for a player (for UI)

**Returns**:
```typescript
{
  slots: SlotRecord[],             // All 5 slots with status
  requirements: SlotRequirement[], // Unlock requirements for locked slots
  balances: EssenceBalance[],      // Current essence holdings
  tracking: EssenceTracking,       // Activation status, swap cost
  swapCost: number,                // Current cost to swap
  availableMeks: Mek[]             // Owned Meks for selection grid
}
```

#### `getGlobalEssenceStatistics()`
**Purpose**: Admin dashboard data

**Returns**:
```typescript
{
  variationStats: {
    variationId: number,
    variationName: string,
    totalGenerationRate: number,    // Sum across all players
    activeSlotsCount: number,        // How many players have this slotted
    totalAccumulated: number,        // Sum of all balances
    averagePerPlayer: number
  }[],
  totalPlayers: number,
  totalSlots: number,
  totalEssenceGenerated: number
}
```

### 2.5 Validation Checkpoint
- [ ] Can initialize new player successfully
- [ ] Slot requirements are deterministic (same wallet = same requirements)
- [ ] Can assign Mek to Slot 1
- [ ] Essence calculation produces correct values
- [ ] Can unlock Slot 2 with gold + essence
- [ ] Can swap Mek (cost escalates correctly)
- [ ] All queries return expected data structure

**Time Estimate**: 4-6 hours

---

## Phase 3: Admin Configuration Interface

### 3.1 Create Admin Tab Component
**File**: `src/components/admin/EssenceAdminTab.tsx`

**Structure**:
```tsx
export default function EssenceAdminTab() {
  const [activeSection, setActiveSection] = useState<'costs' | 'rarity' | 'swap' | 'stats'>('costs');

  return (
    <div className="essence-admin-container">
      {/* Section Tabs */}
      <div className="admin-tabs">
        <button onClick={() => setActiveSection('costs')}>Slot Costs</button>
        <button onClick={() => setActiveSection('rarity')}>Rarity Groups</button>
        <button onClick={() => setActiveSection('swap')}>Swap Costs</button>
        <button onClick={() => setActiveSection('stats')}>Statistics</button>
      </div>

      {/* Section Content */}
      {activeSection === 'costs' && <SlotCostConfig />}
      {activeSection === 'rarity' && <RarityGroupManager />}
      {activeSection === 'swap' && <SwapCostConfig />}
      {activeSection === 'stats' && <GlobalStatistics />}
    </div>
  );
}
```

### 3.2 Slot Cost Configuration
**Component**: `SlotCostConfig`

**UI**:
```
┌─────────────────────────────────────────┐
│ SLOT UNLOCK COSTS                       │
├─────────────────────────────────────────┤
│ Slot 1: FREE (not editable)             │
│                                          │
│ Slot 2:                                  │
│   Gold Cost: [1000] g                    │
│   Essence Required: [5.0] units          │
│   Types Required: 1 (locked)             │
│                                          │
│ Slot 3:                                  │
│   Gold Cost: [5000] g                    │
│   Essence Required: [10.0] units         │
│   Types Required: 2 (locked)             │
│                                          │
│ ... (similar for Slots 4 & 5)           │
│                                          │
│ [Save Configuration]                     │
└─────────────────────────────────────────┘
```

**Validation**:
- Gold costs must be >= 0
- Essence amounts must be > 0
- Show preview: "With these settings, Slot 2 costs 1000g + 5.0 of 1 common essence"

### 3.3 Rarity Group Manager
**Component**: `RarityGroupManager`

**UI**:
```
┌───────────────────────────────────────────────────────────┐
│ ESSENCE RARITY GROUP ASSIGNMENT                           │
├───────────────────────────────────────────────────────────┤
│ Group Distribution:                                        │
│ Group 1 (Common):   [ 100 ] variations                    │
│ Group 2 (Uncommon): [  80 ] variations                    │
│ Group 3 (Rare):     [  60 ] variations                    │
│ Group 4 (Very Rare):[  48 ] variations                    │
│ Total: 288 (must equal 288)                               │
│                                                            │
│ [Filter: All Types ▾] [Search: ________]                  │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ ID | Name          | Type  | Rarity Group | Actions  │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ 1  | Ace of Spades | head  | [Group 4 ▾]  | [Save]   │ │
│ │ 2  | Derelict      | head  | [Group 3 ▾]  | [Save]   │ │
│ │ 3  | Discomania    | head  | [Group 2 ▾]  | [Save]   │ │
│ │ ...                                                     │ │
│ │ 288| Nothing       | item  | [Group 1 ▾]  | [Save]   │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                            │
│ Bulk Actions:                                              │
│ [Select All] [Assign Selected to: Group ▾] [Apply]       │
└───────────────────────────────────────────────────────────┘
```

**Features**:
- Sortable by any column
- Filter by type (heads/bodies/items)
- Filter by current group
- Bulk select + assign
- Search by name
- Validate total = 288

### 3.4 Swap Cost Configuration
**Component**: `SwapCostConfig`

**UI**:
```
┌─────────────────────────────────────────┐
│ MEK SWAP COST CONFIGURATION             │
├─────────────────────────────────────────┤
│ Starting Cost: [1000] gold              │
│                                          │
│ Increase Type: [Percentage ▾]           │
│   • Linear: Add fixed amount            │
│   • Percentage: Multiply by %           │
│   • Exponential: Raise to power         │
│                                          │
│ Increase Value: [10] %                  │
│                                          │
│ PREVIEW:                                 │
│ ┌──────────────────────────────────────┐│
│ │ Swap #1:  1,000g                     ││
│ │ Swap #2:  1,100g (+10%)              ││
│ │ Swap #3:  1,210g (+10%)              ││
│ │ Swap #4:  1,331g (+10%)              ││
│ │ Swap #5:  1,464g (+10%)              ││
│ │ ...                                   ││
│ │ Swap #10: 2,594g                     ││
│ └──────────────────────────────────────┘│
│                                          │
│ [Save Configuration]                     │
└─────────────────────────────────────────┘
```

**Real-time Preview**: Update preview as admin changes values

### 3.5 Global Statistics
**Component**: `GlobalStatistics`

**UI**:
```
┌───────────────────────────────────────────────────────────┐
│ GLOBAL ESSENCE ECONOMY STATISTICS                         │
├───────────────────────────────────────────────────────────┤
│ [Filter by Group: All ▾] [Search: ________]              │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Variation     | Gen Rate | Active Slots | Total Accum││ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ Bumblebee     | 15.2/day |     152      |   1,234.5  ││ │
│ │ Stone         | 12.8/day |     128      |     987.3  ││ │
│ │ Disco         | 10.5/day |     105      |     765.2  ││ │
│ │ ...                                                    ││ │
│ └──────────────────────────────────────────────────────┘ │
│                                                            │
│ Totals:                                                    │
│ • Total Players: 1,234                                     │
│ • Total Slots Used: 3,456 / 6,170 (5 per player)         │
│ • Total Essence Generated: 123,456.78                     │
└───────────────────────────────────────────────────────────┘
```

### 3.6 Add to Admin Master Data
**File**: `src/app/admin-master-data/page.tsx`

**Changes**:
1. Add "Essence" to `DATA_SYSTEMS` array
2. Add tab button in UI
3. Show `<EssenceAdminTab />` when selected

### 3.7 Validation Checkpoint
- [ ] Can save slot costs
- [ ] Can assign variations to rarity groups
- [ ] Can configure swap costs with preview
- [ ] Statistics display correctly
- [ ] Changes persist after page refresh

**Time Estimate**: 3-4 hours

---

## Phase 4: Frontend Components (Player UI)

### 4.1 Main Essence Page
**File**: `src/app/essence/page.tsx`

**Structure**:
```tsx
'use client';

export default function EssencePage() {
  const { walletAddress } = useWallet();
  const essenceData = useQuery(api.essenceQueries.getPlayerEssenceData,
    walletAddress ? { walletAddress } : "skip"
  );

  const [showLightbox, setShowLightbox] = useState(false);

  // Auto-open lightbox on first visit (no slots assigned)
  useEffect(() => {
    if (essenceData && !essenceData.tracking.isActive) {
      setShowLightbox(true);
    }
  }, [essenceData]);

  if (!walletAddress) {
    return <ConnectWalletPrompt />;
  }

  if (!essenceData) {
    return <Loading />;
  }

  return (
    <div className="essence-page">
      {/* Match main hub layout */}
      <Navigation /> {/* Keep logo, dropdown, but no new menu item */}
      <GlobalBackground />

      <div className="essence-content">
        {/* Mini thumbnails - at-a-glance view */}
        <EssenceMiniThumbnails
          slots={essenceData.slots}
          onClick={() => setShowLightbox(true)}
        />

        {/* Essence donut chart */}
        <EssenceDonutChart
          balances={essenceData.balances}
          size={525}
        />

        {/* Detailed slot management lightbox */}
        {showLightbox && (
          <EssenceSlotLightbox
            slots={essenceData.slots}
            requirements={essenceData.requirements}
            balances={essenceData.balances}
            swapCost={essenceData.swapCost}
            availableMeks={essenceData.availableMeks}
            onClose={() => setShowLightbox(false)}
          />
        )}
      </div>
    </div>
  );
}
```

**Key Points**:
- Matches main hub design (same nav, background, layout)
- No gold panel, no Mek grid (just thumbnails + donut)
- Auto-opens lightbox if `isActive === false`

### 4.2 Essence Slot Lightbox
**File**: `src/components/essence/EssenceSlotLightbox.tsx`

**Structure**:
```tsx
export function EssenceSlotLightbox({
  slots,
  requirements,
  balances,
  swapCost,
  availableMeks,
  onClose
}) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showMekSelector, setShowMekSelector] = useState(false);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content mek-card-industrial" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="lightbox-header">
          <h2 className="mek-text-industrial">ESSENCE GENERATION SLOTS</h2>
          <button onClick={onClose}>×</button>
        </div>

        {/* 5 Slots Display */}
        <div className="slots-container">
          {slots.map(slot => (
            <SlotCard
              key={slot.slotNumber}
              slot={slot}
              requirement={requirements.find(r => r.slotNumber === slot.slotNumber)}
              balances={balances}
              swapCost={swapCost}
              onAssign={() => {
                setSelectedSlot(slot.slotNumber);
                setShowMekSelector(true);
              }}
              onUnlock={() => handleUnlockSlot(slot.slotNumber)}
              onSwap={() => {
                setSelectedSlot(slot.slotNumber);
                setShowMekSelector(true);
              }}
            />
          ))}
        </div>

        {/* Tooltip for first visit */}
        {!slots.some(s => s.mekAssetId) && (
          <div className="tooltip-guide">
            Please employ your first mechanism to generate essence
          </div>
        )}

        {/* Mek Selection Grid Modal */}
        {showMekSelector && (
          <MekSelectionGrid
            availableMeks={availableMeks}
            occupiedSlots={slots.filter(s => s.mekAssetId)}
            onSelect={(mek) => handleAssignMek(selectedSlot!, mek)}
            onClose={() => setShowMekSelector(false)}
          />
        )}
      </div>
    </div>
  );
}
```

**SlotCard Variants**:

**Variant 1: Unlocked Empty Slot**
```
┌──────────────────────┐
│  SLOT 1              │
│  ┌────────────────┐  │
│  │                │  │
│  │       +        │  │ <- Click to assign Mek
│  │                │  │
│  └────────────────┘  │
│  STATUS: READY       │
└──────────────────────┘
```

**Variant 2: Occupied Slot**
```
┌──────────────────────┐
│  SLOT 1              │
│  ┌────────────────┐  │
│  │   [Mek Image]  │  │
│  │   #1234        │  │
│  └────────────────┘  │
│  Bumblebee Head      │
│  Stone Body          │
│  Disco Item          │
│  RATE: 0.3/day       │
│  [Swap: 1000g]       │
└──────────────────────┘
```

**Variant 3: Locked Slot (Can Afford)**
```
┌──────────────────────┐
│  SLOT 2         🔒   │
│  ┌────────────────┐  │
│  │                │  │
│  │    LOCKED      │  │
│  │                │  │
│  └────────────────┘  │
│  COST:               │
│  • 1000 gold ✓       │
│  • 5.0 Bumblebee ✓   │
│  [UNLOCK]            │ <- Enabled
└──────────────────────┘
```

**Variant 4: Locked Slot (Can't Afford)**
```
┌──────────────────────┐
│  SLOT 3         🔒   │
│  ┌────────────────┐  │
│  │                │  │
│  │    LOCKED      │  │
│  │                │  │
│  └────────────────┘  │
│  COST:               │
│  • 5000 gold ✗       │
│  • 10.0 Stone ✓      │
│  • 10.0 Disco ✗      │
│  [UNLOCK]            │ <- Disabled
└──────────────────────┘
```

### 4.3 Mini Thumbnails
**File**: `src/components/essence/EssenceMiniThumbnails.tsx`

**Design**:
```
┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
│ 🖼️ │ │ 🖼️ │ │ +  │ │ 🔒 │ │ 🔒 │
└────┘ └────┘ └────┘ └────┘ └────┘
 Slot1  Slot2  Slot3  Slot4  Slot5
```

**Implementation**:
```tsx
export function EssenceMiniThumbnails({ slots, onClick }) {
  return (
    <div className="mini-thumbnails-container">
      {slots.map(slot => (
        <button
          key={slot.slotNumber}
          className="mini-thumbnail mek-slot-empty"
          onClick={onClick}
        >
          {slot.mekAssetId ? (
            <img src={slot.mekImageUrl} alt={`Mek #${slot.mekNumber}`} />
          ) : slot.isUnlocked ? (
            <span className="icon-plus">+</span>
          ) : (
            <span className="icon-lock">🔒</span>
          )}
        </button>
      ))}
    </div>
  );
}
```

### 4.4 Mek Selection Grid
**File**: `src/components/essence/MekSelectionGrid.tsx`

**Design**:
```
┌──────────────────────────────────────────┐
│ SELECT MEK TO SLOT                       │
├──────────────────────────────────────────┤
│ [Search: ________] [Sort: Rarity ▾]     │
│                                          │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐            │
│ │#123│ │#456│ │#789│ │#012│            │
│ │ 🖼️ │ │ 🖼️ │ │ 🖼️ │ │ 🖼️ │            │
│ └────┘ └────┘ └────┘ └────┘            │
│                                          │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐            │
│ │#345│ │#678│ │#901│ │#234│            │
│ │ 🖼️ │ │ 🖼️ │ │🖼️❌│ │ 🖼️ │ <- Already slotted│
│ └────┘ └────┘ └────┘ └────┘            │
│                                          │
│ [Cancel]                                 │
└──────────────────────────────────────────┘
```

**Features**:
- Grid of owned Meks (thumbnails)
- Gray out Meks already slotted
- Search by Mek number
- Sort by rarity, number, etc.
- Click to select

### 4.5 Essence Donut Integration
**File**: Modify existing `src/components/essence-donut-chart.tsx`

**Changes**:
- Accept real data instead of fake data
- Props: `balances: EssenceBalance[]`
- Only render non-zero essences
- Use variation names from data

### 4.6 Validation Checkpoint
- [ ] /essence page renders correctly
- [ ] Matches main hub layout
- [ ] Lightbox opens automatically on first visit
- [ ] Can assign Mek to Slot 1
- [ ] Lightbox closes after assignment
- [ ] Mini thumbnails display correctly
- [ ] Can click thumbnail to reopen lightbox
- [ ] Donut shows real essence data
- [ ] Mek selection grid shows owned Meks
- [ ] Cannot select already-slotted Mek

**Time Estimate**: 6-8 hours

---

## Phase 5: Integration & Polish

### 5.1 Gold Deduction Integration
**File**: `convex/essenceSlots.ts`

**In `unlockSlot` and `swapMekInSlot` mutations**:

```typescript
// Get gold mining record
const goldMining = await ctx.db.query("goldMining")
  .withIndex("by_wallet", q => q.eq("walletAddress", walletAddress))
  .first();

if (!goldMining) {
  throw new Error("No gold mining record found");
}

// Calculate current gold
const currentGold = calculateCurrentGold({
  accumulatedGold: goldMining.accumulatedGold,
  goldPerHour: goldMining.totalGoldPerHour,
  lastSnapshotTime: goldMining.lastSnapshotTime,
  isVerified: goldMining.isBlockchainVerified,
  consecutiveSnapshotFailures: goldMining.consecutiveSnapshotFailures || 0
});

if (currentGold < goldCost) {
  throw new Error(`Insufficient gold. Need ${goldCost}g, have ${currentGold.toFixed(2)}g`);
}

// Deduct gold
await ctx.db.patch(goldMining._id, {
  accumulatedGold: goldMining.accumulatedGold - goldCost,
  lastSnapshotTime: Date.now()
});
```

### 5.2 Daily Checkpoint Cron Job
**File**: `convex/crons.ts`

**Add Schedule**:
```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run essence checkpoint daily at 3 AM UTC
crons.daily(
  "essence-daily-checkpoint",
  { hourUTC: 3, minuteUTC: 0 },
  internal.essenceCheckpoint.runDailyCheckpoint
);

export default crons;
```

**Checkpoint Implementation**:
**File**: `convex/essenceCheckpoint.ts`

```typescript
export const runDailyCheckpoint = internalMutation({
  handler: async (ctx) => {
    console.log("[Essence Checkpoint] Starting daily checkpoint...");

    // Get all active players
    const activePlayers = await ctx.db.query("essenceTracking")
      .withIndex("by_active", q => q.eq("isActive", true))
      .collect();

    console.log(`[Essence Checkpoint] Processing ${activePlayers.length} active players`);

    let successCount = 0;
    let errorCount = 0;

    // Process in batches of 50 to avoid timeout
    const batchSize = 50;
    for (let i = 0; i < activePlayers.length; i += batchSize) {
      const batch = activePlayers.slice(i, i + batchSize);

      // Process batch in parallel
      const results = await Promise.allSettled(
        batch.map(player =>
          ctx.scheduler.runAfter(0, internal.essenceCheckpoint.processPlayerCheckpoint, {
            walletAddress: player.walletAddress
          })
        )
      );

      // Count successes/failures
      results.forEach(result => {
        if (result.status === "fulfilled") {
          successCount++;
        } else {
          errorCount++;
          console.error(`[Essence Checkpoint] Error:`, result.reason);
        }
      });
    }

    console.log(`[Essence Checkpoint] Completed: ${successCount} success, ${errorCount} errors`);

    return {
      success: true,
      processed: activePlayers.length,
      successCount,
      errorCount
    };
  }
});

export const processPlayerCheckpoint = internalMutation({
  args: {
    walletAddress: v.string()
  },
  handler: async (ctx, { walletAddress }) => {
    try {
      // Calculate accumulated essence
      const newBalances = await calculateAccumulatedEssence(ctx, walletAddress);

      // Save balances
      await saveEssenceBalances(ctx, walletAddress, newBalances);

      return { success: true };
    } catch (error) {
      console.error(`[Checkpoint] Error for ${walletAddress}:`, error);
      throw error;
    }
  }
});
```

### 5.3 Error Handling & Edge Cases

**Handle**: Player with 0 Meks
```typescript
if (!essenceData.availableMeks || essenceData.availableMeks.length === 0) {
  return (
    <div className="no-meks-message">
      You need to own at least one Mek to generate essence.
      <a href="/marketplace">Visit Marketplace</a>
    </div>
  );
}
```

**Handle**: Insufficient gold for unlock
```typescript
const canAffordGold = currentGold >= requirement.goldCost;
const canAffordEssence = requirement.requiredEssences.every(req => {
  const balance = balances.find(b => b.variationId === req.variationId);
  return balance && balance.accumulatedAmount >= req.amountRequired;
});

const canUnlock = canAffordGold && canAffordEssence;
```

**Handle**: Race condition during unlock
```typescript
// In mutation, use try-catch
try {
  await ctx.db.patch(slotRecord._id, {
    isUnlocked: true,
    unlockedAt: Date.now()
  });
} catch (error) {
  // Rollback gold deduction if slot unlock fails
  await ctx.db.patch(goldMining._id, {
    accumulatedGold: goldMining.accumulatedGold + goldCost
  });
  throw error;
}
```

### 5.4 Loading States & Feedback

**Add Loading Indicators**:
```tsx
const [isUnlocking, setIsUnlocking] = useState(false);

const handleUnlock = async (slotNumber: number) => {
  setIsUnlocking(true);
  try {
    await unlockSlotMutation({ walletAddress, slotNumber });
    // Success feedback
    toast.success(`Slot ${slotNumber} unlocked!`);
  } catch (error) {
    // Error feedback
    toast.error(error.message);
  } finally {
    setIsUnlocking(false);
  }
};
```

**Add Optimistic Updates**:
```tsx
const assignMek = useMutation(api.essenceSlots.assignMekToSlot);

const handleAssign = async (slotNumber: number, mekAssetId: string) => {
  // Optimistic update
  setSlots(prev => prev.map(s =>
    s.slotNumber === slotNumber
      ? { ...s, mekAssetId, mekImageUrl: selectedMek.imageUrl }
      : s
  ));

  try {
    await assignMek({ walletAddress, slotNumber, mekAssetId });
  } catch (error) {
    // Revert on error
    setSlots(originalSlots);
    toast.error("Failed to assign Mek");
  }
};
```

### 5.5 Validation Checkpoint
- [ ] Gold deduction works correctly
- [ ] Essence deduction works correctly
- [ ] Cannot unlock slot without sufficient resources
- [ ] Daily checkpoint runs successfully
- [ ] Checkpoint processes all active players
- [ ] Loading states show during operations
- [ ] Error messages are clear and helpful
- [ ] Optimistic updates improve UX

**Time Estimate**: 4-5 hours

---

## Phase 6: Testing & Quality Assurance

### 6.1 Manual Testing Checklist

**First-Time User Flow**:
- [ ] Visit /essence with wallet connected
- [ ] Lightbox opens automatically
- [ ] Tooltip visible: "Please employ your first mechanism to generate essence"
- [ ] Click + on Slot 1
- [ ] Mek selection grid opens
- [ ] Can search/filter Meks
- [ ] Select a Mek
- [ ] Mek assigned to Slot 1
- [ ] Lightbox closes
- [ ] Mini thumbnails show Slot 1 with Mek
- [ ] Donut chart visible (shows 0 essence initially)
- [ ] essenceTracking created with isActive: true

**Essence Accumulation**:
- [ ] Wait 1 hour (or manually advance time in Convex)
- [ ] Refresh page
- [ ] Essence balances calculated correctly
- [ ] Donut chart shows accumulated essence
- [ ] Amounts match expected: (hours / 24) × 0.1 × variation_count

**Unlock Slot 2**:
- [ ] Have sufficient gold + essence
- [ ] Click Slot 2 in lightbox
- [ ] Shows requirements clearly
- [ ] Unlock button enabled
- [ ] Click Unlock
- [ ] Gold deducted
- [ ] Essence deducted
- [ ] Slot 2 now shows + button
- [ ] Can assign Mek to Slot 2
- [ ] Essence generation increases (2 Meks slotted)

**Swap Mek**:
- [ ] Have Mek in Slot 1
- [ ] Have sufficient gold for swap
- [ ] Click Swap button (shows cost)
- [ ] Confirm swap
- [ ] Gold deducted
- [ ] Swap count increments
- [ ] Mek selection grid opens
- [ ] Select different Mek
- [ ] Old Mek removed, new Mek assigned
- [ ] Essence balances update (new variations)
- [ ] Next swap costs more

**Edge Cases**:
- [ ] Try to unlock slot without enough gold (rejected)
- [ ] Try to unlock slot without enough essence (rejected)
- [ ] Try to select already-slotted Mek (grayed out)
- [ ] Try to swap without enough gold (rejected)
- [ ] Slot Mek, immediately swap (both work)
- [ ] View page with 0 Meks owned (shows message)
- [ ] View page without wallet connected (shows connect prompt)

**Admin Functions**:
- [ ] Change slot costs
- [ ] Assign variations to rarity groups
- [ ] Change swap cost config
- [ ] Preview updates correctly
- [ ] Changes persist
- [ ] New players get updated requirements
- [ ] View global statistics
- [ ] Statistics accurate

**Daily Checkpoint**:
- [ ] Manually trigger checkpoint
- [ ] All active players processed
- [ ] Essence balances updated
- [ ] No errors in logs
- [ ] Performance acceptable (< 30 seconds for 100 players)

### 6.2 Automated Tests

**Unit Tests** (`convex/essenceCalculation.test.ts`):
```typescript
describe("Essence Calculation", () => {
  test("calculates correctly for 1 slotted Mek", () => {
    const result = calculateEssence({
      lastCalcTime: now - (24 * 60 * 60 * 1000), // 24 hours ago
      slottedMeks: [{ head: 74, body: 158, item: 229 }], // Bumblebee, Stone, Disco
      existingBalances: []
    });

    expect(result).toEqual([
      { variationId: 74, accumulatedAmount: 0.1 },
      { variationId: 158, accumulatedAmount: 0.1 },
      { variationId: 229, accumulatedAmount: 0.1 }
    ]);
  });

  test("respects cap of 10", () => {
    const result = calculateEssence({
      lastCalcTime: now - (365 * 24 * 60 * 60 * 1000), // 365 days ago
      slottedMeks: [{ head: 74, body: 158, item: 229 }],
      existingBalances: []
    });

    expect(result[0].accumulatedAmount).toBe(10.0); // Capped at 10
  });

  test("stacks multiple instances", () => {
    const result = calculateEssence({
      lastCalcTime: now - (24 * 60 * 60 * 1000),
      slottedMeks: [
        { head: 74, body: 158, item: 229 },
        { head: 74, body: 175, item: 245 } // Second Mek also has Bumblebee head
      ],
      existingBalances: []
    });

    const bumblebee = result.find(r => r.variationId === 74);
    expect(bumblebee.accumulatedAmount).toBe(0.2); // 2 instances
  });
});
```

### 6.3 Performance Testing

**Load Test**:
```typescript
// Simulate 1000 players
for (let i = 0; i < 1000; i++) {
  await createTestPlayer({
    walletAddress: `stake1u_test_${i}`,
    slottedMeks: 3 // Average
  });
}

// Run checkpoint
const startTime = Date.now();
await runDailyCheckpoint();
const endTime = Date.now();

console.log(`Checkpoint completed in ${endTime - startTime}ms`);
expect(endTime - startTime).toBeLessThan(30000); // < 30 seconds
```

### 6.4 Validation Checkpoint
- [ ] All manual test cases pass
- [ ] All automated tests pass
- [ ] Performance acceptable under load
- [ ] No console errors
- [ ] No memory leaks
- [ ] Works on mobile (responsive)
- [ ] Accessible (keyboard navigation, screen readers)

**Time Estimate**: 4-6 hours

---

## Phase 7: Deployment

### 7.1 Pre-Deployment Checklist
- [ ] All code committed to version control
- [ ] ESSENCE.md and ESSENCE_IMPLEMENTATION_PLAN.md up to date
- [ ] Convex schema deployed to dev environment
- [ ] Frontend tested locally
- [ ] Admin interface tested
- [ ] No console warnings or errors
- [ ] Build succeeds (`npm run build`)
- [ ] TypeScript checks pass (`npx tsc --noEmit`)

### 7.2 Deployment Steps

**Step 1: Deploy Convex Backend**
```bash
npx convex deploy --prod
```
- Verify schema updated
- Check functions deployed
- Test a query in Convex dashboard

**Step 2: Deploy Frontend**
```bash
npm run build
# Deploy to hosting (Vercel, Netlify, etc.)
```
- Verify /essence route accessible
- Test on production URL

**Step 3: Initialize Admin Config**
- Visit `/admin-master-data`
- Go to Essence tab
- Set initial slot costs (suggested: 1000g, 5000g, 25000g, 100000g)
- Set essence amounts (suggested: 5.0, 10.0, 20.0, 50.0)
- Assign all 288 variations to rarity groups
- Set swap costs (suggested: 1000g starting, 10% increase)
- Save all configs

**Step 4: Test with Real Wallet**
- Connect your wallet
- Visit /essence directly (don't use menu - it's hidden)
- Slot a Mek
- Wait 1 hour
- Refresh, check essence accumulated
- Test unlock, swap

**Step 5: Monitor Checkpoint**
- Wait for daily checkpoint to run (3 AM UTC)
- Check Convex logs
- Verify no errors
- Check essence balances updated

### 7.3 Rollback Plan

If critical issues found:
1. Remove /essence route (comment out in routing)
2. Disable daily checkpoint cron
3. Investigate issue
4. Fix
5. Redeploy

Data is safe - no destructive operations in essence system.

### 7.4 Validation Checkpoint
- [ ] Backend deployed successfully
- [ ] Frontend accessible on production
- [ ] Admin config initialized
- [ ] Personal test successful
- [ ] Checkpoint runs without errors
- [ ] Ready for soft launch

**Time Estimate**: 1-2 hours

---

## Phase 8: Launch

### 8.1 Soft Launch (Beta Testing)
- Share `/essence` URL with 5-10 trusted players
- Ask them to test:
  - Slotting Meks
  - Unlocking slots
  - Swapping Meks
  - Viewing essence accumulation
- Collect feedback
- Monitor for issues
- Fix bugs

**Duration**: 1-3 days

### 8.2 Full Launch
- Add "Essence" to Mek dropdown menu in Navigation
- Announce to all players
- Monitor server load
- Watch for support requests
- Be ready to hotfix

### 8.3 Post-Launch Monitoring
- Track daily checkpoint success rate
- Monitor essence economy (admin stats)
- Watch for exploits or abuse
- Gather player feedback
- Plan future enhancements

---

## Success Criteria

System is complete and successful when:

**Functionality**:
- [  ] Players can slot Meks and generate essence
- [  ] Essence accumulates accurately over time
- [  ] Players can unlock slots with gold + essence
- [  ] Players can swap Meks (cost escalates)
- [  ] Donut chart shows real-time data
- [  ] Admin can configure all settings
- [  ] Daily checkpoint runs reliably

**Quality**:
- [  ] No critical bugs
- [  ] Performance is acceptable (< 3s page load)
- [  ] UI matches design system
- [  ] Code is clean and maintainable
- [  ] Documentation is complete

**User Experience**:
- [  ] First-time flow is intuitive
- [  ] Error messages are clear
- [  ] Loading states are smooth
- [  ] Mobile experience is good
- [  ] Players understand the system

---

## Total Estimated Time

- Phase 1 (Schema): 1-2 hours
- Phase 2 (Backend): 4-6 hours
- Phase 3 (Admin): 3-4 hours
- Phase 4 (Frontend): 6-8 hours
- Phase 5 (Integration): 4-5 hours
- Phase 6 (Testing): 4-6 hours
- Phase 7 (Deployment): 1-2 hours
- Phase 8 (Launch): Variable

**Total: 23-33 hours** (approximately 3-4 full work days)

---

## Risk Mitigation

### High-Risk Areas

**1. Random Requirement Generation**
- Risk: Not truly random, patterns emerge
- Mitigation: Use crypto-grade hashing, test distribution

**2. Race Conditions**
- Risk: Player and checkpoint update simultaneously
- Mitigation: Optimistic concurrency control, versioning

**3. Calculation Accuracy**
- Risk: Essence amounts drift over time
- Mitigation: Comprehensive unit tests, consistent rounding

**4. Performance**
- Risk: Checkpoint times out with many players
- Mitigation: Batching, parallel processing, monitoring

**5. Gold Deduction**
- Risk: Atomic transaction fails mid-way
- Mitigation: Proper error handling, rollback logic

### Medium-Risk Areas

**6. UI Complexity**
- Risk: Lightbox too confusing for new players
- Mitigation: Clear tooltips, guided first-time experience

**7. Config Changes**
- Risk: Admin changes config, breaks existing players
- Mitigation: Validate changes, show warnings

**8. Edge Cases**
- Risk: Unexpected scenarios crash system
- Mitigation: Comprehensive edge case testing

---

## Notes & Considerations

**Code Organization**:
- Keep essence code separate from gold code
- Use clear naming conventions
- Document complex logic
- Add TypeScript types for everything

**Performance**:
- Index all frequently queried fields
- Batch operations where possible
- Monitor query performance
- Optimize hot paths

**User Experience**:
- Show loading states
- Provide clear error messages
- Use optimistic updates
- Make it feel fast

**Maintainability**:
- Write tests for critical logic
- Document all admin controls
- Keep ESSENCE.md updated
- Add inline comments for complex code

---

## Conclusion

This plan provides a clear, step-by-step path to implementing the essence system. Each phase builds on the previous, with validation checkpoints ensuring quality. By following this plan methodically, we'll deliver a robust, performant, and user-friendly system that enhances the game's economy and progression.

The key to success is: **Build incrementally, test thoroughly, deploy carefully.**
