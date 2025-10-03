# State Synchronization Investigation: Gold Accumulation System

**Date**: October 3, 2025
**Investigator**: Claude Code - Real-Time State Synchronization Specialist
**Scope**: Mek logging rates, cumulative gold tracking, Convex database → UI sync

---

## Executive Summary

After analyzing the gold accumulation system across the Convex backend and frontend components, I've identified **the exact synchronization flow and potential issues** that may be causing discrepancies between database state and UI display.

### Key Findings

✅ **What's Working**:
- Convex mutation → database → query → UI flow is architecturally sound
- Race condition protection via optimistic concurrency control (version field)
- Gold calculation logic correctly implements capped and cumulative tracking
- Verification system properly gates gold accumulation

🔴 **Critical Issues Identified**:

1. **Animation Loop Stale Closure Risk** (Hub Page)
   - Missing dependencies in `useEffect` for gold animation
   - Could cause animation to use outdated `goldPerSecond` values
   - **Impact**: UI shows incorrect accumulation rate after upgrades

2. **Data Flow Complexity** (Mek Rate Logging)
   - Gold rate calculation happens in TWO places: `goldMining` mutation AND `users` table
   - Frontend fetches from `users.goldPerHour` but mutations update `goldMining.totalGoldPerHour`
   - **Impact**: Frontend may show stale rates until next sync

3. **Cumulative Gold Synchronization**
   - `totalCumulativeGold` only updated during mutations, not during animation
   - Frontend manually calculates cumulative in animation loop
   - **Impact**: Cumulative gold may drift from database value

---

## 1. Gold Accumulation Data Flow Analysis

### The Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ USER UPGRADES MEK LEVEL                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ MUTATION: upgradeMekLevel (convex/mekLeveling.ts:298-377)      │
│ 1. Deduct gold from accumulatedGold                             │
│ 2. Calculate new gold rate with level boost                     │
│ 3. Update goldMining.totalGoldPerHour (BASE + BOOST)           │
│ 4. Increment version for race protection                        │
│ 5. Patch database atomically                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ CONVEX AUTOMATIC QUERY INVALIDATION                             │
│ - All subscribed queries for goldMining are invalidated         │
│ - getGoldMiningData re-runs automatically                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ QUERY: getGoldMiningData (convex/goldMining.ts:216-312)        │
│ Returns:                                                         │
│ - accumulatedGold (current balance, capped at 50k)             │
│ - totalGoldPerHour (base + boost rates)                        │
│ - totalCumulativeGold (all-time gold earned)                   │
│ - ownedMeks (with level boost data)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: useQuery Hook Receives New Data                       │
│ const goldMiningData = useQuery(api.goldMining.getGoldMiningData)│
│ - React detects goldMiningData changed                          │
│ - Triggers component re-render                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ ANIMATION LOOP: Updates UI Gold Counter                         │
│ useEffect(() => {                                               │
│   const updateGold = () => {                                    │
│     const calculatedGold = calculateCurrentGold({               │
│       accumulatedGold: goldMiningData.accumulatedGold,         │
│       goldPerHour: goldMiningData.totalGoldPerHour, // <-- NEW │
│       lastSnapshotTime: goldMiningData.lastSnapshotTime        │
│     });                                                          │
│     setCurrentGold(calculatedGold); // UI updates              │
│   };                                                             │
│   const interval = setInterval(updateGold, 16.67);             │
│ }, [goldMiningData]); // <-- Re-runs when data changes         │
└─────────────────────────────────────────────────────────────────┘
```

### ✅ This Flow Works Correctly When:
- Convex is healthy and mutations complete successfully
- Network connection is stable
- Query invalidation triggers properly
- Effect dependencies are correct

### 🔴 This Flow Breaks When:
1. **Effect dependencies are incomplete** → Stale closures use old values
2. **Multiple tabs are open** → Race conditions between mutations
3. **Query fails to re-fetch** → UI shows stale data
4. **Animation loop has stale closure** → Uses old `goldPerHour`

---

## 2. Critical Issue #1: Hub Page Animation Loop

### Problem Code

**File**: `src/app/hub/page.tsx:317-350`

```typescript
// ❌ PROBLEMATIC: Missing dependencies
useEffect(() => {
  const isVerified = verificationStatus?.isVerified || walletAddress === "demo_wallet_123" || isDemoMode;

  if (goldPerSecond > 0 && isVerified && liveGold !== null) {
    let lastTimestamp = performance.now();
    let animationFrameId: number;
    const goldDisplayElement = document.getElementById('live-gold-display');

    const animate = (timestamp: number) => {
      const deltaTime = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      const maxGold = (cachedGoldData?.goldPerHour || GAME_CONSTANTS.DEFAULT_GOLD_RATE) * GAME_CONSTANTS.MAX_GOLD_CAP_HOURS;
      const increment = goldPerSecond * deltaTime; // <-- Uses goldPerSecond from closure

      setLiveGold(prev => {
        const newGold = Math.min(prev + increment, maxGold);

        // Direct DOM manipulation (bypasses React)
        if (goldDisplayElement) {
          goldDisplayElement.textContent = newGold.toFixed(2);
        }

        return newGold;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }
}, [goldPerSecond, cachedGoldData, verificationStatus, walletAddress]);
//  ❌ MISSING: isVerified, liveGold, isDemoMode
```

### Why This Causes Issues

1. **`isVerified` is calculated inside effect but NOT in dependencies**
   - If `verificationStatus.isVerified` changes from `false` → `true`, effect doesn't re-run
   - Animation may not start even after verification completes

2. **`liveGold` is checked but NOT in dependencies**
   - Effect only re-runs when `goldPerSecond` changes
   - If `liveGold` is reset externally, animation may not restart

3. **`isDemoMode` is used but NOT in dependencies**
   - If demo mode is toggled, effect doesn't re-run

4. **Direct DOM manipulation bypasses React reconciliation**
   - Updates to `goldDisplayElement.textContent` don't trigger React updates
   - Could cause hydration mismatches

### Recommended Fix

```typescript
// ✅ FIXED: All used variables in dependencies
useEffect(() => {
  const isVerified = verificationStatus?.isVerified === true;
  const isDemoActive = walletAddress === "demo_wallet_123" || isDemoMode;

  if (goldPerSecond > 0 && (isVerified || isDemoActive) && liveGold !== null) {
    let lastTimestamp = performance.now();
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      const deltaTime = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      const maxGold = (cachedGoldData?.goldPerHour || GAME_CONSTANTS.DEFAULT_GOLD_RATE) * GAME_CONSTANTS.MAX_GOLD_CAP_HOURS;
      const increment = goldPerSecond * deltaTime;

      setLiveGold(prev => {
        const newGold = Math.min(prev + increment, maxGold);
        return newGold; // Let React handle rendering
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }
}, [goldPerSecond, cachedGoldData, verificationStatus, walletAddress, liveGold, isDemoMode]);
//  ✅ ALL USED VARIABLES IN DEPS
```

---

## 3. Critical Issue #2: Dual Gold Rate Sources

### The Problem: Two Sources of Truth

**Backend has TWO places storing gold rates:**

1. **`goldMining` table** (convex/goldMining.ts)
   ```typescript
   {
     totalGoldPerHour: number,      // ← Updated by initializeGoldMining
     baseGoldPerHour: number,        // ← Base rate (rarity-based)
     boostGoldPerHour: number,       // ← Level boost rate
     accumulatedGold: number,        // ← Current balance
     totalCumulativeGold: number,    // ← All-time gold
   }
   ```

2. **`users` table** (used by hub page)
   ```typescript
   {
     goldPerHour: number,  // ← Updated separately?
     gold: number,         // ← Current balance
     pendingGold: number,  // ← Uncollected gold
   }
   ```

### Where Data Flows Diverge

**Mek Rate Logging Page** (`src/app/mek-rate-logging/page.tsx`):
```typescript
// Uses goldMining data (correct, includes level boosts)
const goldMiningData = useQuery(api.goldMining.getGoldMiningData, { walletAddress });

console.log('[HUB SYNC] totalGoldPerHour:', goldMiningData.totalGoldPerHour); // ← Correct rate
```

**Hub Page** (`src/app/hub/page.tsx`):
```typescript
// Uses DIFFERENT data source from users table
const getInitialGold = useMutation(api.goldTrackingOptimized.getInitialGoldData);

const goldData = await getInitialGold({ userId: user._id });
// Returns goldData.goldPerHour from USERS table, NOT goldMining!

console.log('[HUB INIT] goldPerHour:', goldData.goldPerHour); // ← May be stale!
```

### Why This Causes Sync Issues

1. **Level upgrades update `goldMining.totalGoldPerHour`** but may not update `users.goldPerHour`
2. **Hub page reads from `users` table** → shows old rate
3. **Mek rate page reads from `goldMining` table** → shows new rate
4. **Result**: Different pages show different gold rates!

### Diagnostic Logs Show This Issue

From the existing analysis document:

```typescript
// mek-rate-logging/page.tsx
console.log('[HUB SYNC] goldMiningData received:', {
  totalGoldPerHour: goldMiningData.totalGoldPerHour,  // ← 70.56 (correct, with boosts)
  baseGoldPerHour: goldMiningData.baseGoldPerHour,
  boostGoldPerHour: goldMiningData.boostGoldPerHour,
});

// hub/page.tsx
console.log('[HUB INIT] getInitialGold returned:', {
  goldPerHour: goldData.goldPerHour,  // ← 65.23 (stale, no boosts?)
  goldPerSecond: goldData.goldPerSecond,
});

console.log('[HUB INIT] ⚠️ NOTE: This data comes from users.goldPerHour, NOT goldMining.totalGoldPerHour!');
```

### Recommended Fix

**Option A: Use Single Source of Truth (Recommended)**

Update hub page to fetch from `goldMining` instead of `users`:

```typescript
// hub/page.tsx - BEFORE (uses users table)
const getInitialGold = useMutation(api.goldTrackingOptimized.getInitialGoldData);
const goldData = await getInitialGold({ userId: user._id });
setGoldPerSecond(goldData.goldPerSecond); // ← From users table

// hub/page.tsx - AFTER (uses goldMining table)
const goldMiningData = useQuery(
  api.goldMining.getGoldMiningData,
  walletAddress ? { walletAddress } : "skip"
);

useEffect(() => {
  if (goldMiningData) {
    const goldPerSecond = goldMiningData.totalGoldPerHour / 3600; // ← From goldMining table
    setGoldPerSecond(goldPerSecond);
  }
}, [goldMiningData]);
```

**Option B: Sync Both Tables on Every Update**

Ensure every mutation that updates `goldMining.totalGoldPerHour` ALSO updates `users.goldPerHour`:

```typescript
// convex/mekLeveling.ts - upgradeMekLevel mutation
await ctx.db.patch(goldMiningData._id, {
  totalGoldPerHour,
  // ... other fields
});

// ALSO update users table
const userRecord = await ctx.db.query("users")
  .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress))
  .first();

if (userRecord) {
  await ctx.db.patch(userRecord._id, {
    goldPerHour: totalGoldPerHour, // ← Keep in sync
  });
}
```

---

## 4. Critical Issue #3: Cumulative Gold Calculation

### Current Implementation

**Backend** (`convex/goldMining.ts:85-112`):
```typescript
export function calculateGoldIncrease(
  currentRecord: GoldMiningRecord,
  goldToAdd: number
): {
  newAccumulatedGold: number;
  newTotalCumulativeGold: number;
} {
  const currentAccumulated = currentRecord.accumulatedGold || 0;
  const currentCumulative = currentRecord.totalCumulativeGold || 0;

  // Cap accumulated gold at 50k
  const uncappedAccumulated = currentAccumulated + goldToAdd;
  const newAccumulatedGold = Math.min(GOLD_CAP, uncappedAccumulated);
  const goldLostToCap = uncappedAccumulated - newAccumulatedGold;

  // Cumulative grows BEYOND cap (tracks all-time earnings)
  const newTotalCumulativeGold = currentCumulative + goldToAdd;

  return {
    newAccumulatedGold,
    newTotalCumulativeGold
  };
}
```

**Frontend Animation** (`mek-rate-logging/page.tsx:1606-1668`):
```typescript
useEffect(() => {
  const updateGold = () => {
    if (goldMiningData) {
      // Calculate current gold (capped)
      const calculatedGold = calculateCurrentGold({
        accumulatedGold: goldMiningData.accumulatedGold || 0,
        goldPerHour: goldMiningData.totalGoldPerHour,
        lastSnapshotTime: goldMiningData.lastSnapshotTime,
        isVerified: true
      });

      setCurrentGold(calculatedGold);

      // ❌ ISSUE: Manually calculate cumulative gold
      const baseCumulativeGold = goldMiningData.totalCumulativeGold || 0;
      const goldSinceLastUpdate = calculatedGold - (goldMiningData.accumulatedGold || 0);

      if (goldMiningData.isBlockchainVerified === true) {
        const calculatedCumulativeGold = baseCumulativeGold + goldSinceLastUpdate;
        setCumulativeGold(calculatedCumulativeGold); // ← May drift from DB!
      }
    }
  };

  const interval = setInterval(updateGold, 16.67); // 60 FPS
  return () => clearInterval(interval);
}, [walletConnected, goldMiningData, walletAddress]);
```

### Why This Causes Drift

1. **Cumulative gold calculated in animation loop**
   - Frontend estimates: `baseCumulative + goldSinceLastUpdate`
   - Database has definitive value from mutations
   - These can diverge over time due to rounding, timing

2. **No re-sync with database cumulative value**
   - Frontend never reads `goldMiningData.totalCumulativeGold` after initial load
   - Only uses it as base, then keeps incrementing locally

3. **Gold cap handling inconsistency**
   - Backend handles cap: `goldLostToCap = uncappedValue - cappedValue`
   - Frontend may not account for gold lost to cap in cumulative calculation

### Example Drift Scenario

```
Time 0: Database state
  accumulatedGold: 49,900
  totalCumulativeGold: 100,000

Time 1: User earns 200 gold (would exceed cap)
  Backend calculates:
    uncappedAccumulated = 49,900 + 200 = 50,100
    newAccumulatedGold = min(50,000, 50,100) = 50,000 (capped)
    goldLostToCap = 100
    newTotalCumulativeGold = 100,000 + 200 = 100,200 ✅

  Frontend calculates:
    calculatedGold = 50,000 (matches backend)
    goldSinceLastUpdate = 50,000 - 49,900 = 100 ❌ (WRONG! Should be 200)
    calculatedCumulativeGold = 100,000 + 100 = 100,100 ❌ (SHORT BY 100)

Result: Frontend cumulative is 100,100 but database has 100,200
```

### Recommended Fix

**Stop calculating cumulative in frontend - just read from database:**

```typescript
useEffect(() => {
  const updateGold = () => {
    if (goldMiningData) {
      // Calculate ONLY current accumulated gold
      const calculatedGold = calculateCurrentGold({
        accumulatedGold: goldMiningData.accumulatedGold || 0,
        goldPerHour: goldMiningData.totalGoldPerHour,
        lastSnapshotTime: goldMiningData.lastSnapshotTime,
        isVerified: true
      });

      setCurrentGold(calculatedGold);

      // ✅ FIX: Read cumulative directly from database
      // Database value is ALWAYS correct (includes cap handling)
      const databaseCumulative = goldMiningData.totalCumulativeGold || 0;
      setCumulativeGold(databaseCumulative);
    }
  };

  const interval = setInterval(updateGold, 16.67);
  return () => clearInterval(interval);
}, [walletConnected, goldMiningData, walletAddress]);
```

**Note**: Cumulative won't update in real-time during animation (only when checkpoints save), but it will be **accurate** instead of **drifting**.

If real-time cumulative is needed, backend should handle it:

```typescript
// convex/goldMining.ts - Add to getGoldMiningData query
export const getGoldMiningData = query({
  handler: async (ctx, args) => {
    // ... existing code ...

    // Calculate real-time cumulative
    const currentGold = calculateCurrentGold({...});
    const goldSinceSnapshot = currentGold - data.accumulatedGold;
    const realtimeCumulative = (data.totalCumulativeGold || 0) + goldSinceSnapshot;

    return {
      ...data,
      currentGold,
      realtimeCumulativeGold: realtimeCumulative, // ← New field
    };
  }
});
```

---

## 5. Verification System Analysis

### How Verification Gates Gold Accumulation

**Backend** (`convex/lib/goldCalculations.ts:19-41`):

```typescript
export function calculateCurrentGold(params: GoldCalculationParams): number {
  // ✅ If not verified, return frozen accumulated gold
  if (!params.isVerified) {
    return params.accumulatedGold;
  }

  // ✅ If 3+ consecutive snapshot failures, pause accumulation
  const failureThreshold = 3;
  const consecutiveFailures = params.consecutiveSnapshotFailures || 0;

  if (consecutiveFailures >= failureThreshold) {
    return params.accumulatedGold; // Freeze at snapshot value
  }

  // Normal calculation - verified and snapshots working
  const now = Date.now();
  const hoursSinceLastUpdate = (now - params.lastSnapshotTime) / (1000 * 60 * 60);
  const goldSinceLastUpdate = params.goldPerHour * hoursSinceLastUpdate;
  const calculatedGold = Math.min(50000, params.accumulatedGold + goldSinceLastUpdate);

  return calculatedGold;
}
```

### Frontend Verification Check

**Hub Page** (`src/app/hub/page.tsx:247-280`):

```typescript
useEffect(() => {
  if (!cachedGoldData) return;

  console.log('[HUB RATE] Setting gold rate from cachedGoldData');

  // Demo mode: always allow accumulation
  if (isDemoMode || walletAddress === "demo_wallet_123") {
    setGoldPerSecond(cachedGoldData.goldPerSecond);
    return;
  }

  // Real wallet: check verification
  if (walletAddress && verificationStatus) {
    if (verificationStatus.isVerified) {
      // ✅ Verified - enable accumulation
      setGoldPerSecond(cachedGoldData.goldPerSecond);
    } else {
      // ❌ NOT verified - freeze accumulation
      console.log('[Hub] Wallet NOT verified - freezing gold accumulation at 0');
      setGoldPerSecond(0);
    }
  } else if (walletAddress) {
    // Verification status loading - stay at 0
    console.log('[Hub] Waiting for verification status...');
    setGoldPerSecond(0);
  }
}, [verificationStatus, cachedGoldData, walletAddress, isDemoMode]);
```

### ✅ Verification Flow Works Correctly

1. **Backend enforces verification** in `calculateCurrentGold()`
2. **Frontend respects verification** by setting `goldPerSecond = 0` when not verified
3. **Animation loop uses `goldPerSecond`** so gold doesn't increase
4. **Database queries also check verification** before returning calculated gold

**No issues found in verification system.**

---

## 6. Race Condition Protection

### Optimistic Concurrency Control

**Implementation** (`convex/mekLeveling.ts:350-362`):

```typescript
// CRITICAL: Check version for race condition protection
const latestGoldMiningData = await ctx.db.get(goldMiningData._id);
if (!latestGoldMiningData) {
  throw new Error("Gold mining data was deleted during upgrade");
}

const currentVersion = goldMiningData.version || 0;
const latestVersion = latestGoldMiningData.version || 0;

if (currentVersion !== latestVersion) {
  // Another mutation modified this record - abort!
  throw new Error("Concurrent modification detected. Please refresh and try again.");
}

await ctx.db.patch(goldMiningData._id, {
  // ... updates ...
  version: currentVersion + 1, // ✅ Increment version
});
```

### ✅ Excellent Protection Against:
- Double-spending gold (two upgrades at once)
- Conflicting rate calculations (simultaneous mutations)
- Lost updates (one mutation overwriting another)

**No issues found in race condition handling.**

---

## 7. Diagnostic Logging Strategy

### Add Strategic Logging at Each Stage

**1. Mutation Entry Point** (`convex/mekLeveling.ts`):

```typescript
export const upgradeMekLevel = mutation({
  handler: async (ctx, args) => {
    console.log('[UPGRADE MUTATION] START:', {
      timestamp: new Date().toISOString(),
      assetId: args.assetId,
      walletAddress: args.walletAddress.substring(0, 20) + '...',
    });

    // ... upgrade logic ...

    console.log('[UPGRADE MUTATION] GOLD STATE BEFORE:', {
      accumulatedGold: goldMiningData.accumulatedGold,
      baseGoldPerHour: goldMiningData.baseGoldPerHour,
      boostGoldPerHour: goldMiningData.boostGoldPerHour,
      totalGoldPerHour: goldMiningData.totalGoldPerHour,
    });

    // ... update database ...

    console.log('[UPGRADE MUTATION] GOLD STATE AFTER:', {
      accumulatedGold: goldDecrease.newAccumulatedGold,
      baseGoldPerHour,
      boostGoldPerHour,
      totalGoldPerHour,
      goldSpent: upgradeCost,
    });

    console.log('[UPGRADE MUTATION] COMPLETE');
  }
});
```

**2. Query Re-fetch** (`convex/goldMining.ts`):

```typescript
export const getGoldMiningData = query({
  handler: async (ctx, args) => {
    console.log('[QUERY] getGoldMiningData called:', {
      timestamp: new Date().toISOString(),
      wallet: args.walletAddress.substring(0, 20) + '...',
    });

    const data = await ctx.db.query("goldMining")...

    console.log('[QUERY] Returning to frontend:', {
      totalGoldPerHour: data.totalGoldPerHour,
      baseGoldPerHour: data.baseGoldPerHour,
      boostGoldPerHour: data.boostGoldPerHour,
      accumulatedGold: data.accumulatedGold,
      totalCumulativeGold: data.totalCumulativeGold,
    });

    return result;
  }
});
```

**3. Frontend State Update** (`mek-rate-logging/page.tsx`):

```typescript
useEffect(() => {
  if (!goldMiningData) return;

  console.log('[FRONTEND] goldMiningData received:', {
    timestamp: new Date().toISOString(),
    totalGoldPerHour: goldMiningData.totalGoldPerHour,
    accumulatedGold: goldMiningData.accumulatedGold,
    totalCumulativeGold: goldMiningData.totalCumulativeGold,
  });

  console.log('[FRONTEND] Mek level boost data:',
    goldMiningData.ownedMeks.map(mek => ({
      assetName: mek.assetName,
      level: mek.currentLevel,
      baseRate: mek.baseGoldPerHour,
      boostAmount: mek.levelBoostAmount,
      effectiveRate: mek.goldPerHour,
    }))
  );
}, [goldMiningData]);
```

**4. Animation Loop Update**:

```typescript
const updateGold = () => {
  if (goldMiningData) {
    const before = currentGold;
    const calculatedGold = calculateCurrentGold({...});
    const after = calculatedGold;

    console.log('[ANIMATION] Gold update:', {
      timestamp: new Date().toISOString(),
      before: before.toFixed(2),
      after: after.toFixed(2),
      delta: (after - before).toFixed(2),
      rate: goldMiningData.totalGoldPerHour,
    });

    setCurrentGold(calculatedGold);
  }
};
```

### Expected Log Sequence After Upgrade

```
[UPGRADE MUTATION] START: { timestamp: "2025-10-03T...", assetId: "...", wallet: "stake1..." }
[UPGRADE MUTATION] GOLD STATE BEFORE: { accumulatedGold: 5000, baseGoldPerHour: 65, boostGoldPerHour: 5, totalGoldPerHour: 70 }
[UPGRADE MUTATION] GOLD STATE AFTER: { accumulatedGold: 4000, baseGoldPerHour: 65, boostGoldPerHour: 10, totalGoldPerHour: 75, goldSpent: 1000 }
[UPGRADE MUTATION] COMPLETE

[QUERY] getGoldMiningData called: { timestamp: "2025-10-03T...", wallet: "stake1..." }
[QUERY] Returning to frontend: { totalGoldPerHour: 75, baseGoldPerHour: 65, boostGoldPerHour: 10, accumulatedGold: 4000, totalCumulativeGold: 8000 }

[FRONTEND] goldMiningData received: { timestamp: "2025-10-03T...", totalGoldPerHour: 75, accumulatedGold: 4000, totalCumulativeGold: 8000 }
[FRONTEND] Mek level boost data: [{ assetName: "Mek #1234", level: 3, baseRate: 25, boostAmount: 5, effectiveRate: 30 }, ...]

[ANIMATION] Gold update: { timestamp: "2025-10-03T...", before: "4000.00", after: "4000.12", delta: "0.12", rate: 75 }
```

---

## 8. Summary of Issues and Fixes

| Issue | Location | Impact | Recommended Fix | Priority |
|-------|----------|--------|-----------------|----------|
| **Missing dependencies in animation effect** | `hub/page.tsx:350` | Animation may not restart after verification | Add `isVerified`, `liveGold`, `isDemoMode` to dependency array | 🔴 HIGH |
| **Dual gold rate sources** | Hub uses `users.goldPerHour`, Mek page uses `goldMining.totalGoldPerHour` | Different pages show different rates | Use single source: `goldMining.totalGoldPerHour` everywhere | 🔴 HIGH |
| **Cumulative gold drift** | `mek-rate-logging/page.tsx:1606-1668` | Frontend cumulative diverges from database | Read `totalCumulativeGold` from DB, don't calculate | 🟡 MEDIUM |
| **Direct DOM manipulation** | `hub/page.tsx:338` | Bypasses React reconciliation | Remove DOM manipulation, use state only | 🟡 MEDIUM |
| **No error boundaries** | All pages | Query failures crash page | Add error boundaries around queries | 🟡 MEDIUM |

---

## 9. Recommended Implementation Order

### Phase 1: Critical Fixes (2-3 hours)

1. **Fix hub page animation dependencies**
   ```typescript
   // Add missing deps to effect
   }, [goldPerSecond, cachedGoldData, verificationStatus, walletAddress, liveGold, isDemoMode]);
   ```

2. **Unify gold rate source**
   ```typescript
   // Hub page: Switch from users.goldPerHour to goldMining.totalGoldPerHour
   const goldMiningData = useQuery(api.goldMining.getGoldMiningData, { walletAddress });
   const goldPerSecond = goldMiningData?.totalGoldPerHour / 3600 || 0;
   ```

3. **Add comprehensive logging**
   - Mutation entry/exit
   - Query re-fetch detection
   - Frontend state updates
   - Animation loop changes

### Phase 2: Data Integrity (2-3 hours)

4. **Fix cumulative gold calculation**
   ```typescript
   // Stop calculating in frontend, read from DB
   const cumulativeGold = goldMiningData?.totalCumulativeGold || 0;
   ```

5. **Add invariant validation**
   ```typescript
   // In mutations, assert: totalCumulative >= accumulated + spent
   if (newTotalCumulativeGold < newAccumulatedGold + totalGoldSpent) {
     throw new Error("Gold invariant violation!");
   }
   ```

### Phase 3: Error Handling (1-2 hours)

6. **Add error boundaries**
   ```typescript
   <ErrorBoundary fallback={<GoldLoadError />}>
     <GoldDisplay goldMiningData={goldMiningData} />
   </ErrorBoundary>
   ```

7. **Handle query failures**
   ```typescript
   if (!goldMiningData && walletAddress) {
     return <div>Loading gold data... <RetryButton /></div>;
   }
   ```

---

## 10. Testing Strategy

### Manual Testing Checklist

After implementing fixes, verify:

- [ ] **Upgrade a Mek level**
  - Gold deducted correctly
  - Rate increases with boost
  - UI shows new rate immediately
  - Cumulative gold increases by upgrade cost

- [ ] **Check both pages**
  - Hub page shows correct gold rate
  - Mek rate logging page shows same rate
  - Both pages update after upgrades

- [ ] **Verification flow**
  - Unverified wallet shows frozen gold
  - After verification, gold starts accumulating
  - Animation uses correct rate

- [ ] **Multi-tab test**
  - Open two tabs
  - Upgrade in one tab
  - Other tab updates (may require refresh)

- [ ] **Network failure**
  - Disconnect network
  - UI doesn't crash
  - Shows error state
  - Reconnect works

### Automated Test Cases

```typescript
describe('Gold Synchronization', () => {
  test('Mutation updates trigger query invalidation', async () => {
    const { mutate, query } = renderHook(() => ({
      mutate: useMutation(api.mekLeveling.upgradeMekLevel),
      query: useQuery(api.goldMining.getGoldMiningData),
    }));

    const beforeRate = query.data?.totalGoldPerHour;

    await mutate({ assetId: 'test', walletAddress: 'stake1...' });
    await waitFor(() => query.data?.totalGoldPerHour !== beforeRate);

    expect(query.data?.totalGoldPerHour).toBeGreaterThan(beforeRate);
  });

  test('Cumulative gold matches database', () => {
    const { frontend, backend } = calculateGoldStates();
    expect(frontend.cumulativeGold).toBe(backend.totalCumulativeGold);
  });

  test('Animation uses fresh gold rate', () => {
    const { rerender, result } = renderGoldAnimation();
    const oldRate = result.current.goldPerSecond;

    mockQueryUpdate({ totalGoldPerHour: 100 });
    rerender();

    expect(result.current.goldPerSecond).toBe(100 / 3600);
  });
});
```

---

## Conclusion

The gold accumulation system has **solid architectural foundations** with Convex reactivity working correctly. The primary issues are:

1. **Missing dependencies** in animation effects (easy fix)
2. **Dual data sources** for gold rates (architectural issue)
3. **Frontend cumulative calculation** drifting from database (data integrity issue)

All issues are **fixable without major refactoring**. The recommended fixes will:
- ✅ Ensure UI always shows current gold rates after upgrades
- ✅ Prevent cumulative gold from drifting
- ✅ Make animation loops resilient to verification changes
- ✅ Provide visibility into state sync flow via logging

**Estimated fix time**: 5-8 hours total across all phases.

**Files to modify**:
- `src/app/hub/page.tsx` - Fix animation deps, switch to goldMining data source
- `src/app/mek-rate-logging/page.tsx` - Fix cumulative calculation
- `convex/goldMining.ts` - Add diagnostic logging
- `convex/mekLeveling.ts` - Add diagnostic logging

No fundamental architectural changes needed - just refinements to the existing flow.
