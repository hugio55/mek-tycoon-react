# Tenure System - Implementation Guide

Quick reference for implementing the tenure system.

## Step-by-Step Implementation

### Step 1: Update Schema

Open `convex/schema.ts` and add the three schema changes:

```typescript
// 1. Add to existing meks table (around line 70)
meks: defineTable({
  // ... all existing fields remain unchanged ...

  // ADD THESE NEW FIELDS:
  tenurePoints: v.optional(v.number()),
  lastTenureUpdate: v.optional(v.number()),
  isSlotted: v.optional(v.boolean()),
  slotNumber: v.optional(v.number()),
})
  .index("by_owner", ["owner"])
  // ... other existing indexes ...

// 2. Add new tenureLevels table (at end of schema)
tenureLevels: defineTable({
  level: v.number(),
  tenureRequired: v.number(),
  description: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_level", ["level"]),

// 3. Add new tenureBuffs table (at end of schema)
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
```

### Step 2: Deploy Schema

```bash
# Schema changes will auto-deploy when you save
# Or manually push:
npx convex dev
```

### Step 3: Initialize Level Thresholds

Run this in your Convex dashboard or create a migration:

```typescript
// Example: Initialize first 10 levels
// Progression: Exponential curve (adjust to your needs)
await batchSetTenureLevelThresholds({
  levels: [
    { level: 2, tenureRequired: 3600, description: "1 hour (3,600 tenure)" },
    { level: 3, tenureRequired: 7200, description: "2 hours total (7,200 tenure)" },
    { level: 4, tenureRequired: 14400, description: "4 hours total (14,400 tenure)" },
    { level: 5, tenureRequired: 28800, description: "8 hours total (28,800 tenure)" },
    { level: 6, tenureRequired: 57600, description: "16 hours total (57,600 tenure)" },
    { level: 7, tenureRequired: 115200, description: "32 hours total (115,200 tenure)" },
    { level: 8, tenureRequired: 230400, description: "64 hours total (230,400 tenure)" },
    { level: 9, tenureRequired: 460800, description: "128 hours total (460,800 tenure)" },
    { level: 10, tenureRequired: 921600, description: "256 hours total (921,600 tenure)" },
  ]
});
```

**Note**: These are CUMULATIVE values (total tenure needed to reach that level from level 1).

### Step 4: Update Existing Slotting Logic

If you already have a slotting system, update it to use the tenure mutations:

```typescript
// OLD: Direct database patch
await ctx.db.patch(mekId, { isSlotted: true });

// NEW: Use tenure mutation
await ctx.runMutation(api.tenure.slotMek, {
  mekId,
  slotNumber,
  walletAddress
});
```

### Step 5: Frontend Integration

#### Display Real-Time Tenure

```typescript
// In your React component
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function MekCard({ mekId }) {
  const mekWithTenure = useQuery(api.tenure.getMekWithTenure, { mekId });

  if (!mekWithTenure) return <div>Loading...</div>;

  return (
    <div>
      <h3>{mekWithTenure.assetName}</h3>
      <p>Level: {mekWithTenure.level || 1}</p>
      <p>Tenure: {Math.floor(mekWithTenure.currentTenure).toLocaleString()}</p>
      <p>Rate: {mekWithTenure.tenureRate}/sec</p>

      {/* Active buffs */}
      {mekWithTenure.activeBuffs.global > 0 && (
        <span>Global: +{(mekWithTenure.activeBuffs.global * 100).toFixed(0)}%</span>
      )}
      {mekWithTenure.activeBuffs.perMek > 0 && (
        <span>Personal: +{(mekWithTenure.activeBuffs.perMek * 100).toFixed(0)}%</span>
      )}
    </div>
  );
}
```

#### Level-Up Button

```typescript
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function LevelUpButton({ mekId, walletAddress }) {
  const levelUp = useMutation(api.tenure.levelUpMek);
  const batchLevelUp = useMutation(api.tenure.batchLevelUpMek);

  const handleLevelUp = async () => {
    const result = await levelUp({ mekId, walletAddress });
    if (result.success) {
      alert(`Leveled up to ${result.newLevel}!`);
    } else {
      alert(result.message);
    }
  };

  const handleBatchLevelUp = async () => {
    const result = await batchLevelUp({ mekId, walletAddress });
    if (result.success) {
      alert(`Gained ${result.levelsGained} level(s)!`);
    } else {
      alert(result.message);
    }
  };

  return (
    <>
      <button onClick={handleLevelUp}>Level Up +1</button>
      <button onClick={handleBatchLevelUp}>Level Up Max</button>
    </>
  );
}
```

#### Tenure Progress Bar

```typescript
function TenureProgressBar({ mekId, currentLevel }) {
  const mekWithTenure = useQuery(api.tenure.getMekWithTenure, { mekId });
  const nextThreshold = useQuery(api.tenure.getTenureLevelThreshold, {
    level: (currentLevel || 1) + 1
  });

  if (!mekWithTenure || !nextThreshold) return null;

  const progress = (mekWithTenure.currentTenure / nextThreshold.tenureRequired) * 100;

  return (
    <div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <p>
        {Math.floor(mekWithTenure.currentTenure).toLocaleString()} /{" "}
        {nextThreshold.tenureRequired.toLocaleString()} tenure
      </p>
      <p>Progress: {progress.toFixed(1)}%</p>
    </div>
  );
}
```

---

## Admin Panel Integration

### Configure Level Thresholds

```typescript
function AdminLevelConfig() {
  const setThreshold = useMutation(api.tenure.setTenureLevelThreshold);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await setThreshold({
      level: parseInt(formData.get("level")),
      tenureRequired: parseInt(formData.get("tenure")),
      description: formData.get("description")
    });
    alert("Level threshold updated!");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="level" type="number" placeholder="Level" />
      <input name="tenure" type="number" placeholder="Tenure Required" />
      <input name="description" type="text" placeholder="Description" />
      <button type="submit">Set Threshold</button>
    </form>
  );
}
```

### Apply Buffs

```typescript
function AdminBuffManager() {
  const applyBuff = useMutation(api.tenure.applyTenureBuff);

  const applyGlobalBuff = async () => {
    await applyBuff({
      name: "Weekend 2x Tenure",
      description: "Double tenure rate for all Meks",
      scope: "global",
      multiplier: 1.0, // +100% = 2x rate
      duration: 48 * 60 * 60 * 1000 // 48 hours
    });
    alert("Global buff applied!");
  };

  const applyPerMekBuff = async (mekId) => {
    await applyBuff({
      name: "Premium Boost",
      description: "50% bonus for this Mek",
      scope: "perMek",
      multiplier: 0.5, // +50%
      mekId,
      duration: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    alert("Mek buff applied!");
  };

  return (
    <>
      <button onClick={applyGlobalBuff}>Apply Global 2x Buff</button>
      {/* Per-Mek buffs require mekId */}
    </>
  );
}
```

---

## Testing

### Manual Testing Checklist

1. **Slot a Mek**
   - Run `slotMek` mutation
   - Verify `isSlotted: true` and `lastTenureUpdate` is set
   - Query after 10 seconds → should show ~10 tenure gained

2. **Unslot a Mek**
   - Run `unslotMek` mutation
   - Verify `isSlotted: false` and `tenurePoints` is frozen
   - Query again → should show same tenure (not increasing)

3. **Re-slot a Mek**
   - Run `slotMek` again
   - Verify tenure resumes from frozen value
   - Wait 10 seconds → should show frozen value + 10 new tenure

4. **Level Up**
   - Accumulate enough tenure (or set manually in DB for testing)
   - Run `levelUpMek`
   - Verify level increased and tenure spent

5. **Apply Buffs**
   - Apply global buff with 1.0 multiplier (2x rate)
   - Query Mek → should show `tenureRate: 2` instead of `1`
   - Wait 10 seconds → should gain 20 tenure instead of 10

### Automated Testing (Optional)

Create a test file `convex/tenure.test.ts`:

```typescript
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import schema from "./schema";

test("tenure accumulates correctly", async () => {
  const t = convexTest(schema);

  // Create a test Mek
  const mekId = await t.run(async (ctx) => {
    return await ctx.db.insert("meks", {
      assetId: "test123",
      assetName: "Test Mek",
      owner: "stake1test",
      verified: true,
      headVariation: "Test",
      bodyVariation: "Test",
    });
  });

  // Slot the Mek
  await t.mutation(api.tenure.slotMek, {
    mekId,
    slotNumber: 1,
    walletAddress: "stake1test"
  });

  // Wait 5 seconds (simulated)
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Query tenure
  const result = await t.query(api.tenure.getMekWithTenure, { mekId });

  // Should have ~5 tenure (5 seconds * 1 tenure/sec)
  expect(result.currentTenure).toBeGreaterThan(4);
  expect(result.currentTenure).toBeLessThan(6);
});
```

---

## Common Issues & Solutions

### Issue: Tenure not accumulating

**Check**:
1. Is `isSlotted: true`?
2. Is `lastTenureUpdate` set?
3. Are there any active buffs interfering?

**Solution**: Verify slot mutation ran successfully.

---

### Issue: Tenure accumulating too fast/slow

**Check**:
1. Are there active buffs?
2. Is system time correct?

**Solution**: Query `getActiveTenureBuffs` to see current multipliers.

---

### Issue: Level-up not working

**Check**:
1. Does level threshold exist in `tenureLevels` table?
2. Does Mek have enough tenure?
3. Is user the owner?

**Solution**: Run `getTenureLevelThreshold` to verify configuration.

---

### Issue: Buffs not applying

**Check**:
1. Is buff `active: true`?
2. Has buff expired (`expiresAt` < now)?
3. For per-Mek buffs, is `mekId` correct?

**Solution**: Query `tenureBuffs` table to verify buff state.

---

## Performance Tips

### 1. Batch Queries for Multiple Meks

```typescript
// Instead of N queries for N Meks:
for (const mekId of mekIds) {
  await api.tenure.getMekWithTenure({ mekId });
}

// Do this (single query with wallet stats):
await api.tenure.getWalletTenureStats({ walletAddress });
```

### 2. Cache Level Thresholds

```typescript
// Fetch once and cache in React state
const [thresholds, setThresholds] = useState([]);

useEffect(() => {
  api.tenure.getTenureLevelThresholds().then(setThresholds);
}, []);
```

### 3. Debounce Real-Time Displays

```typescript
// Update tenure display every 1 second, not every render
useEffect(() => {
  const interval = setInterval(() => {
    setDisplayTenure(calculateCurrentTenure(...));
  }, 1000);
  return () => clearInterval(interval);
}, [mekData]);
```

---

## Progression Curve Examples

### Linear Progression (Easy)
```typescript
// Each level requires 1 hour more than previous
{ level: 2, tenureRequired: 3600 },    // 1 hour
{ level: 3, tenureRequired: 7200 },    // 2 hours
{ level: 4, tenureRequired: 10800 },   // 3 hours
{ level: 5, tenureRequired: 14400 },   // 4 hours
```

### Exponential Progression (Standard)
```typescript
// Each level doubles time requirement
{ level: 2, tenureRequired: 3600 },    // 1 hour
{ level: 3, tenureRequired: 7200 },    // 2 hours
{ level: 4, tenureRequired: 14400 },   // 4 hours
{ level: 5, tenureRequired: 28800 },   // 8 hours
```

### Logarithmic Progression (Hard)
```typescript
// Time requirement grows very fast
{ level: 2, tenureRequired: 3600 },      // 1 hour
{ level: 3, tenureRequired: 14400 },     // 4 hours
{ level: 4, tenureRequired: 57600 },     // 16 hours
{ level: 5, tenureRequired: 230400 },    // 64 hours
```

---

## Future Enhancements

### 1. Tenure Boosts from Items
```typescript
// In your crafting/item system:
if (item.type === "tenureBoost") {
  await applyTenureBuff({
    name: `${item.name} Boost`,
    scope: "perMek",
    multiplier: item.boostAmount,
    mekId: targetMekId,
    duration: item.duration
  });
}
```

### 2. Tenure Decay (Unslotted Penalty)
```typescript
// Modify calculateCurrentTenure to reduce tenure over time when unslotted
if (!mek.isSlotted && mek.lastTenureUpdate) {
  const daysUnslotted = (now - mek.lastTenureUpdate) / (1000 * 60 * 60 * 24);
  const decayAmount = daysUnslotted * DECAY_RATE_PER_DAY;
  currentTenure = Math.max(0, currentTenure - decayAmount);
}
```

### 3. Tenure Trading
```typescript
// Allow users to transfer tenure between Meks
export const transferTenure = mutation({
  args: {
    fromMekId: v.id("meks"),
    toMekId: v.id("meks"),
    amount: v.number()
  },
  handler: async (ctx, args) => {
    // Validate ownership, check balances, transfer tenure
  }
});
```

---

## Support & Documentation

- **Full Schema Details**: See `TENURE_SCHEMA_ADDITIONS.md`
- **Backend Implementation**: See `convex/tenure.ts`
- **Convex Docs**: https://docs.convex.dev
- **Project CLAUDE.md**: Reference for project conventions

---

## Quick Command Reference

```bash
# Deploy schema changes
npx convex dev

# Test mutations in Convex dashboard
# Go to: https://dashboard.convex.dev → Functions → tenure

# Initialize level thresholds
# Run: batchSetTenureLevelThresholds in dashboard

# Check Mek tenure
# Run: getMekWithTenure({ mekId: "..." })

# Apply test buff
# Run: applyTenureBuff({ name: "Test", scope: "global", multiplier: 1.0 })
```

---

That's it! You now have a complete tenure system ready to integrate. 🚀
