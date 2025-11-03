# Tenure System - Schema Additions

This document defines the schema changes needed for the tenure system.

## Schema Changes Required

### 1. Add to `meks` table (existing table)

```typescript
// Add these fields to the existing meks table definition
meks: defineTable({
  // ... existing fields ...

  // Tenure tracking fields (ADD THESE)
  tenurePoints: v.optional(v.number()), // Accumulated tenure points (frozen when unslotted)
  lastTenureUpdate: v.optional(v.number()), // Timestamp of last tenure snapshot
  isSlotted: v.optional(v.boolean()), // Whether Mek is currently slotted (earning tenure)
  slotNumber: v.optional(v.number()), // Which essence slot (1-6) if slotted
})
```

**Field Explanations:**
- `tenurePoints`: The "saved" tenure amount. Updated when unslotted or leveling up.
- `lastTenureUpdate`: Timestamp used to calculate time-based accumulation.
- `isSlotted`: Boolean flag indicating if Mek is currently in an essence slot.
- `slotNumber`: Which slot (1-6) the Mek occupies, for cross-reference with essenceSlots table.

**No new indexes needed** - existing `by_owner` index is sufficient for queries.

---

### 2. New `tenureLevels` table (admin configuration)

```typescript
tenureLevels: defineTable({
  level: v.number(), // The level number (2, 3, 4, etc.)
  tenureRequired: v.number(), // Tenure points needed to reach this level
  description: v.optional(v.string()), // Optional description for admin
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_level", ["level"]) // Fast lookup by level number
```

**Purpose**: Stores configurable tenure requirements for each level.

**Example Data**:
```javascript
// Level 2 requires 3,600 tenure (1 hour at base rate)
{ level: 2, tenureRequired: 3600, description: "First level-up" }

// Level 3 requires 10,800 tenure (3 hours at base rate)
{ level: 3, tenureRequired: 10800, description: "Second level-up" }

// Level 4 requires 21,600 tenure (6 hours at base rate)
{ level: 4, tenureRequired: 21600, description: "Third level-up" }
```

**Admin Usage**: Admin can configure custom progression curves.

---

### 3. New `tenureBuffs` table (buff tracking)

```typescript
tenureBuffs: defineTable({
  name: v.string(), // Buff name (e.g., "Weekend Bonus", "Premium Boost")
  description: v.optional(v.string()), // What the buff does
  scope: v.union(v.literal("global"), v.literal("perMek")), // Global or per-Mek
  multiplier: v.number(), // Buff multiplier (0.5 = +50%, 1.0 = +100%)
  mekId: v.optional(v.id("meks")), // Target Mek ID if scope is "perMek"
  active: v.boolean(), // Whether buff is currently active
  createdAt: v.number(),
  expiresAt: v.optional(v.number()), // Optional expiration timestamp
})
  .index("by_active", ["active"]) // Fast lookup of active buffs
  .index("by_mek", ["mekId"]) // Fast lookup of buffs for a specific Mek
```

**Purpose**: Tracks active tenure rate multipliers.

**Buff Types**:
- **Global buffs**: Apply to all Meks (e.g., "Weekend 2x Tenure Event")
- **Per-Mek buffs**: Apply to a specific Mek (e.g., "Premium Boost for Mek #0042")

**Example Data**:
```javascript
// Global 50% bonus for all Meks
{
  name: "Weekend Bonus",
  scope: "global",
  multiplier: 0.5, // +50% tenure rate
  active: true,
  expiresAt: 1704153600000 // Expires Monday midnight
}

// 100% bonus for specific Mek
{
  name: "Premium Boost",
  scope: "perMek",
  multiplier: 1.0, // +100% tenure rate (doubles rate)
  mekId: "jd7x8y9...", // Specific Mek ID
  active: true,
  expiresAt: undefined // Never expires
}
```

**Stacking**: Multiple buffs stack additively.
- Global buff: +50% (1.5x total)
- Per-Mek buff: +100% (2.0x total)
- Combined: +150% (2.5x total rate)

---

## Complete Schema Additions (Copy-Paste Ready)

Add this to your `convex/schema.ts` file:

```typescript
export default defineSchema({
  // ... existing tables ...

  meks: defineTable({
    // ... all existing fields remain unchanged ...

    // NEW: Tenure tracking fields
    tenurePoints: v.optional(v.number()),
    lastTenureUpdate: v.optional(v.number()),
    isSlotted: v.optional(v.boolean()),
    slotNumber: v.optional(v.number()),
  })
    .index("by_owner", ["owner"])
    // ... existing indexes remain unchanged ...

  // NEW TABLE: Tenure level thresholds
  tenureLevels: defineTable({
    level: v.number(),
    tenureRequired: v.number(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_level", ["level"]),

  // NEW TABLE: Tenure buff tracking
  tenureBuffs: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    scope: v.union(v.literal("global"), v.literal("perMek")),
    multiplier: v.number(),
    mekId: v.optional(v.id("meks")),
    active: v.boolean(),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_active", ["active"])
    .index("by_mek", ["mekId"]),
});
```

---

## Index Strategy & Performance

### Query Patterns Optimized

1. **Get Mek with tenure** → Uses existing `by_owner` index
2. **Get level thresholds** → Uses new `by_level` index (O(1) lookup)
3. **Get active buffs** → Uses new `by_active` index (filters active buffs quickly)
4. **Get per-Mek buffs** → Uses new `by_mek` index (fast Mek-specific buff lookup)

### No Heavy Queries

All queries are indexed and efficient:
- Level lookups: Single document fetch by level number
- Buff queries: Filtered by boolean flag (indexed)
- Mek queries: Use existing owner index

### Real-Time Calculation Pattern

Tenure accumulation is calculated **on-read**, not stored in database:
- Query reads `tenurePoints`, `lastTenureUpdate`, `isSlotted`
- Calculates: `elapsedSeconds * effectiveRate`
- Returns: `tenurePoints + accumulatedSinceLastUpdate`

**Benefits**:
- No cron jobs needed
- No database writes during passive accumulation
- Always accurate to the millisecond
- Scales to millions of Meks without performance impact

---

## Migration Plan

### Phase 1: Schema Deployment (No Breaking Changes)

1. Add new fields to `meks` table as optional fields
2. Add new `tenureLevels` table
3. Add new `tenureBuffs` table
4. Deploy schema changes

**Impact**: Zero downtime, all existing queries continue working.

### Phase 2: Initialize Level Thresholds

Run admin mutation to populate default level thresholds:

```typescript
// Example: Linear progression (adjust as needed)
await batchSetTenureLevelThresholds({
  levels: [
    { level: 2, tenureRequired: 3600, description: "1 hour" },
    { level: 3, tenureRequired: 10800, description: "3 hours" },
    { level: 4, tenureRequired: 21600, description: "6 hours" },
    { level: 5, tenureRequired: 43200, description: "12 hours" },
    { level: 6, tenureRequired: 86400, description: "24 hours" },
    // ... continue as needed
  ]
});
```

### Phase 3: Initialize Existing Meks (Optional)

If you want to backfill tenure for Meks that are already slotted:

```typescript
// Migration mutation (run once)
const allMeks = await ctx.db.query("meks").collect();
for (const mek of allMeks) {
  // Check if Mek is in essenceSlots table
  const slot = await ctx.db
    .query("essenceSlots")
    .filter((q) => q.eq(q.field("mekAssetId"), mek.assetId))
    .first();

  await ctx.db.patch(mek._id, {
    isSlotted: !!slot,
    slotNumber: slot?.slotNumber,
    tenurePoints: 0,
    lastTenureUpdate: Date.now(),
  });
}
```

### Phase 4: Frontend Integration

1. Display real-time tenure in Mek cards
2. Add level-up button UI
3. Show tenure requirements for next level
4. Display active buffs

---

## Edge Case Handling

### 1. Mek Unslotted Mid-Accumulation

```typescript
// Before unslot:
tenurePoints: 5000
lastTenureUpdate: T-1000 (1000 seconds ago)
isSlotted: true

// Calculate current tenure: 5000 + (1000 * 1) = 6000

// After unslot:
tenurePoints: 6000  // Frozen
lastTenureUpdate: T-now
isSlotted: false

// Later query returns 6000 (no accumulation while unslotted)
```

### 2. Multiple Level-Ups Ready

```typescript
// Mek has 50,000 tenure
// Level 2 requires 3,600
// Level 3 requires 10,800
// Level 4 requires 21,600

// User clicks "Level Up All"
batchLevelUpMek({ maxLevels: 10 })

// Result:
// - Spent 3,600 for level 2 → 46,400 remaining
// - Spent 10,800 for level 3 → 35,600 remaining
// - Spent 21,600 for level 4 → 14,000 remaining
// - Not enough for level 5
// Final: Level 4 with 14,000 tenure carried over
```

### 3. Buff Expires While Slotted

```typescript
// T=0: Buff active (2x rate)
// User queries: Returns tenure calculated at 2x rate

// T=3600: Buff expires
// Tenure calculation automatically adjusts:
// - First 3600 seconds at 2x rate
// - Remaining time at 1x rate
// No special handling needed - expiration check in getActiveTenureBuffsForMek
```

### 4. Admin Changes Level Threshold Mid-Game

```typescript
// Old: Level 5 requires 50,000 tenure
// Admin changes to: Level 5 requires 30,000 tenure

// Existing Meks with progress:
// - Mek A has 40,000 tenure → Can now level up immediately
// - Mek B has 25,000 tenure → Still needs 5,000 more

// No migration needed - threshold change is instant
```

---

## Testing Checklist

- [ ] Slot Mek → Tenure starts accumulating
- [ ] Unslot Mek → Tenure freezes at current value
- [ ] Re-slot Mek → Tenure resumes from frozen value
- [ ] Level up → Tenure spent, excess carries over
- [ ] Level up with insufficient tenure → Error message
- [ ] Batch level up → Multiple levels gained
- [ ] Apply global buff → All Meks affected
- [ ] Apply per-Mek buff → Only target Mek affected
- [ ] Buff expires → Rate automatically adjusts
- [ ] Admin change threshold → Takes effect immediately
- [ ] Query Mek tenure → Returns real-time value
- [ ] Wallet tenure stats → Correct totals

---

## API Reference Summary

### Queries
- `getMekWithTenure({ mekId })` - Get Mek with real-time tenure
- `getTenureLevelThresholds()` - Get all level thresholds
- `getTenureLevelThreshold({ level })` - Get specific level
- `getActiveTenureBuffs({ mekId })` - Get active buffs for Mek
- `getWalletTenureStats({ walletAddress })` - Get wallet-wide stats

### Mutations - Slotting
- `slotMek({ mekId, slotNumber, walletAddress })` - Slot Mek
- `unslotMek({ mekId, walletAddress })` - Unslot Mek

### Mutations - Leveling
- `levelUpMek({ mekId, walletAddress })` - Level up once
- `batchLevelUpMek({ mekId, walletAddress, maxLevels? })` - Level up multiple times

### Mutations - Buffs
- `applyTenureBuff({ name, scope, multiplier, mekId?, duration? })` - Apply buff
- `removeTenureBuff({ buffId })` - Remove buff

### Mutations - Admin
- `setTenureLevelThreshold({ level, tenureRequired, description? })` - Set level threshold
- `batchSetTenureLevelThresholds({ levels })` - Set multiple thresholds
- `deleteTenureLevelThreshold({ level })` - Delete threshold

---

## Performance Characteristics

### Database Writes
- **Slot/Unslot**: 1-2 writes (mek + essenceSlot)
- **Level Up**: 1 write (mek)
- **Apply Buff**: 1 write (tenureBuff)
- **Passive Accumulation**: 0 writes (calculated on-read)

### Database Reads
- **Get Mek Tenure**: 2 queries (mek + buffs)
- **Level Up Check**: 3 queries (mek + threshold + buffs)
- **Wallet Stats**: 1 query + N buff queries (N = number of Meks)

### Scalability
- **1,000 Meks**: No performance issues
- **10,000 Meks**: Still fast (indexed queries)
- **100,000 Meks**: Wallet stats may need pagination
- **1,000,000 Meks**: Consider caching wallet stats

---

## Future Enhancements (Optional)

### Tenure Leaderboards
```typescript
// Track top Meks by tenure
tenureLeaderboard: defineTable({
  mekId: v.id("meks"),
  assetId: v.string(),
  totalTenure: v.number(),
  rank: v.number(),
  lastUpdated: v.number(),
})
  .index("by_rank", ["rank"])
```

### Tenure Milestones
```typescript
// Track achievements for tenure milestones
tenureMilestones: defineTable({
  walletAddress: v.string(),
  mekId: v.id("meks"),
  milestone: v.number(), // e.g., 100,000 tenure
  achievedAt: v.number(),
})
  .index("by_wallet", ["walletAddress"])
```

### Tenure Decay (Optional Complexity)
```typescript
// Add decay mechanic (tenure decreases over time if unslotted)
meks: defineTable({
  // ... existing fields ...
  tenureDecayRate: v.optional(v.number()), // Tenure lost per day when unslotted
})
```

---

## Summary

The tenure system is designed to be:
- **Simple**: Base 1 tenure/second for all Meks
- **Flexible**: Admin-configurable thresholds and buffable rates
- **Performant**: Real-time calculation with zero passive writes
- **Extensible**: Easy to add new features (leaderboards, milestones, etc.)
- **Safe**: No breaking changes to existing schema

All core functionality is implemented in `/convex/tenure.ts`.
