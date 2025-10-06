# Gold Synchronization Bug Fix - Mek Upgrade System

## Issue Summary
**Problem:** Frontend displays 130 gold available, but backend mutation fails with "Insufficient gold: have 0, need 100" during Mek upgrade.

**Root Cause:** Time-based gold accumulation not snapshotted before spending.

**Fixed:** 2025-10-05

---

## The Bug

### Symptoms
- User sees sufficient gold in UI (e.g., 130 gold)
- User attempts to upgrade Mek (cost: 100 gold)
- Frontend validation passes (130 >= 100)
- Backend mutation fails: "Insufficient gold: have 0, need 100"
- No visual indication why it failed

### When It Occurs
This bug appears when:
1. User hasn't had a gold checkpoint recently (no `updateGoldCheckpoint` call)
2. `accumulatedGold` in database is low or 0
3. Time-based gold accumulation provides the bulk of "current" gold
4. User tries to upgrade before a checkpoint updates `accumulatedGold`

### Why Mobile Users See It More
- Longer sessions between automatic checkpoints
- Different background tab behavior affecting checkpoint timing
- Network latency impacting checkpoint frequency
- Users may play longer without page refreshes

---

## Technical Analysis

### Data Flow Before Fix

**Frontend (Query):**
```javascript
// goldMining.ts - getGoldMiningData query
const currentGold = calculateCurrentGold({
  accumulatedGold: data.accumulatedGold || 0,  // e.g., 0
  goldPerHour: data.totalGoldPerHour,          // e.g., 65
  lastSnapshotTime: data.lastSnapshotTime,     // e.g., 2 hours ago
  isVerified: data.isBlockchainVerified
});
// Result: 0 + (65 × 2) = 130 gold
```

**Backend (Mutation):**
```javascript
// mekLeveling.ts - upgradeMekLevel mutation

// Step 1: Calculate current gold (CORRECT)
const goldSinceSnapshot = goldMiningData.totalGoldPerHour * hoursSinceLastSnapshot;
const currentGold = (goldMiningData.accumulatedGold || 0) + goldSinceSnapshot;
// Result: 0 + 130 = 130

// Step 2: Validate (PASSES)
if (currentGold < upgradeCost) { throw ... }
// 130 >= 100 ✓

// Step 3: Spend gold (BUG HERE)
const goldDecrease = calculateGoldDecrease(goldMiningData, upgradeCost);
//                                         ^^^^^^^^^^^^^^
//                   This object has accumulatedGold: 0 (NOT 130!)
```

**Gold Decrease Function:**
```javascript
// goldCalculations.ts - calculateGoldDecrease
const currentAccumulated = currentRecord.accumulatedGold || 0;  // 0
const totalSpent = currentRecord.totalGoldSpentOnUpgrades || 0;

if (currentAccumulated < goldToSpend) {  // 0 < 100
  throw new Error(`Insufficient gold: have ${currentAccumulated}, need ${goldToSpend}`);
  // ERROR: "Insufficient gold: have 0, need 100"
}
```

### The Core Issue

The mutation calculated `currentGold` correctly by adding time-based earnings to `accumulatedGold`, but then passed the **raw database record** to `calculateGoldDecrease()`, which only sees the old `accumulatedGold` value (0) without the time-based gold (130).

This is a **snapshot timing issue**: the mutation validates against the correct current gold, but spends from the stale accumulated gold.

---

## The Fix

### Solution: Snapshot Time-Based Gold Before Spending

**File:** `convex/mekLeveling.ts`
**Location:** Line 330-350 (before `calculateGoldDecrease` call)

```javascript
// CRITICAL FIX: Snapshot the time-based gold accumulation BEFORE spending
// The bug was: calculateGoldDecrease uses goldMiningData.accumulatedGold (old value),
// but currentGold includes time-based earnings that aren't in accumulatedGold yet.
// Solution: Create a snapshot record with currentGold as the new accumulatedGold
const snapshotRecord = {
  ...goldMiningData,
  accumulatedGold: currentGold, // Use calculated current gold (includes time-based earnings)
  lastSnapshotTime: now
};

devLog.log('[UPGRADE MUTATION] Gold snapshot for spending:', {
  oldAccumulatedGold: goldMiningData.accumulatedGold,
  goldSinceSnapshot: goldSinceSnapshot,
  snapshotAccumulatedGold: currentGold,
  upgradeCost,
  willRemain: currentGold - upgradeCost
});

// Now calculateGoldDecrease will see the correct accumulated gold
const goldDecrease = calculateGoldDecrease(snapshotRecord, upgradeCost);
```

### How It Works

1. **Calculate current gold** (existing logic): `currentGold = accumulatedGold + timeSinceLastSnapshot × goldPerHour`
2. **Create snapshot record** (NEW): Clone `goldMiningData` but set `accumulatedGold = currentGold`
3. **Pass snapshot to calculateGoldDecrease** (FIXED): Now sees the full current gold amount
4. **Update database** (existing logic): Save the new `accumulatedGold` with gold deducted

### Data Flow After Fix

```javascript
// Step 1: Calculate current gold
const currentGold = 0 + 130 = 130 ✓

// Step 2: Validate
if (130 < 100) { ... }  // Passes ✓

// Step 3: Create snapshot (NEW)
const snapshotRecord = {
  ...goldMiningData,
  accumulatedGold: 130  // Now has the full current gold!
};

// Step 4: Spend gold (FIXED)
const goldDecrease = calculateGoldDecrease(snapshotRecord, 100);
// snapshotRecord.accumulatedGold = 130
// 130 >= 100 ✓ (passes check)
// Returns: newAccumulatedGold = 30
```

---

## Prevention Strategy

### Why This Pattern Is Now Safe

1. **Single source of truth**: The `calculateCurrentGold()` function is used consistently
2. **Explicit snapshotting**: Mutations that spend gold now explicitly snapshot time-based gold first
3. **Comprehensive logging**: Added debug logs show old/new values at each step

### Future Mutations

When creating new mutations that spend gold:

```javascript
// ✓ CORRECT Pattern
const currentGold = calculateCurrentGold({...});  // Include time-based gold

// Validate
if (currentGold < cost) { throw ... }

// Snapshot before spending
const snapshotRecord = {
  ...goldMiningData,
  accumulatedGold: currentGold,
  lastSnapshotTime: Date.now()
};

// Spend from snapshot
const goldDecrease = calculateGoldDecrease(snapshotRecord, cost);

// Update database with new values
await ctx.db.patch(goldMiningData._id, {
  accumulatedGold: goldDecrease.newAccumulatedGold,
  ...
});
```

```javascript
// ✗ WRONG Pattern (the bug we just fixed)
const currentGold = calculateCurrentGold({...});
if (currentGold < cost) { throw ... }

// BUG: Passes raw goldMiningData without snapshotting
const goldDecrease = calculateGoldDecrease(goldMiningData, cost);
//                                         ^^^^^^^^^^^^^^
//                              This has old accumulatedGold!
```

---

## Testing Verification

### How to Test the Fix

1. **Setup:**
   - Connect wallet with Meks
   - Wait 2+ hours without interacting (let gold accumulate via time)
   - Note: `accumulatedGold` should be 0, but UI shows time-based gold

2. **Reproduce (Before Fix):**
   - Try to upgrade a Mek
   - Observe: "Insufficient gold: have 0, need X" error

3. **Verify (After Fix):**
   - Try to upgrade a Mek
   - Observe: Upgrade succeeds, gold correctly deducted

### Diagnostic Logs

The fix adds these logs to help diagnose issues:

```javascript
[UPGRADE MUTATION] Gold snapshot for spending: {
  oldAccumulatedGold: 0,
  goldSinceSnapshot: 130,
  snapshotAccumulatedGold: 130,
  upgradeCost: 100,
  willRemain: 30
}
```

If the upgrade fails, check:
- Is `snapshotAccumulatedGold` correct?
- Does `willRemain` match expected value?
- Is `oldAccumulatedGold` much lower than `snapshotAccumulatedGold`?

---

## Related Files

### Modified
- **`convex/mekLeveling.ts`** - Added snapshotting before `calculateGoldDecrease()`

### Related (Not Modified)
- **`convex/lib/goldCalculations.ts`** - Contains `calculateGoldDecrease()` function
- **`convex/goldMining.ts`** - Contains `getGoldMiningData()` query
- **`src/app/mek-rate-logging/page.tsx`** - Frontend that calls the mutation

---

## Lessons Learned

1. **Time-based accumulation requires snapshots before spending**: When gold accumulates over time in memory (not in DB), you must snapshot it before any spending operation.

2. **Validate and spend from same state**: If you validate `currentGold >= cost`, you must spend from that same `currentGold` value, not from a stale DB value.

3. **Mobile timing differences expose race conditions**: Issues that rarely appear on desktop can be common on mobile due to different checkpoint/update timing.

4. **Comprehensive logging is essential**: The debug logs added in this fix make future debugging much easier.

---

## Impact

**Before Fix:**
- Users with time-based gold accumulation couldn't upgrade Meks
- Silent failures with confusing error messages
- Worse on mobile due to checkpoint timing

**After Fix:**
- Upgrades work reliably regardless of checkpoint timing
- Gold deduction is accurate and immediate
- Consistent behavior across desktop and mobile
