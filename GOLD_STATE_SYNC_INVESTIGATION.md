# Gold State Synchronization Investigation Report

## Executive Summary
**Investigation Date**: 2025-10-03
**Status**: CRITICAL ISSUES FOUND
**Severity**: HIGH

The gold accumulation system has **multiple state synchronization issues** that create discrepancies between database state and UI state. The primary issue is a **stale closure in the animation loop** combined with **competing data sources** for gold rates.

---

## Critical Issues Discovered

### 1. STALE CLOSURE IN ANIMATION LOOP (CRITICAL)
**Location**: `src/app/hub/page.tsx:316-350`
**Severity**: HIGH
**Impact**: Animation loop may not react to updated gold rates

**Problem Code**:
```javascript
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
      const increment = goldPerSecond * deltaTime;  // ⚠️ STALE goldPerSecond!

      setLiveGold(prev => {
        const newGold = Math.min(prev + increment, maxGold);
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
}, [goldPerSecond, cachedGoldData, verificationStatus, walletAddress]); // ❌ Missing isDemoMode!
```

**Issues**:
1. **Missing dependency**: `isDemoMode` is used but NOT in dependency array
2. **Closure captures stale values**: The `animate` function closes over `goldPerSecond` at the time the effect runs
3. **When goldPerSecond updates**: Effect re-runs but old animation loop continues briefly before cleanup

**Evidence**:
- Animation loop uses `goldPerSecond` captured at effect creation time
- If `goldPerSecond` changes from external mutation, the running loop doesn't see it
- Dependency array is incomplete (missing `isDemoMode`)

---

### 2. COMPETING DATA SOURCES FOR GOLD RATE (HIGH)
**Location**: Multiple files
**Severity**: HIGH
**Impact**: Hub page uses different gold rate than actual database rate

**The Problem**:
The Hub page gets gold rate from TWO different sources that may not match:

**Source 1: `goldTrackingOptimized.getInitialGoldData`** (Hub page initialization)
```javascript
// src/app/hub/page.tsx:152
const goldData = await getInitialGold({ userId: user._id });
// Returns: { goldPerHour, goldPerSecond, pendingGold, totalGold }
// ⚠️ This comes from users.goldPerHour, NOT goldMining.totalGoldPerHour!
```

**Source 2: `goldMining.getGoldMiningData`** (Query subscription)
```javascript
// src/app/hub/page.tsx:103-106
const goldMiningData = useQuery(
  api.goldMining.getGoldMiningData,
  walletAddress ? { walletAddress } : "skip"
);
// Returns: { totalGoldPerHour, baseGoldPerHour, boostGoldPerHour, ... }
```

**Why This Breaks**:
1. `users.goldPerHour` is set manually via "Click for 8.7k" button
2. `goldMining.totalGoldPerHour` is calculated from actual Mek rates + level bonuses
3. **These two values can DIVERGE** causing the animation to use wrong rate!

**Evidence from logs**:
```javascript
console.log('[HUB INIT] ⚠️ NOTE: This data comes from users.goldPerHour, NOT goldMining.totalGoldPerHour!');
```

The code KNOWS this is wrong but doesn't fix it!

---

### 3. GOLDMINING DATA NOT USED FOR ANIMATION
**Location**: `src/app/hub/page.tsx:248-280`
**Severity**: MEDIUM
**Impact**: Animation doesn't update when goldMining data changes

**Problem Code**:
```javascript
useEffect(() => {
  if (!cachedGoldData) return;

  // This sets goldPerSecond from cachedGoldData
  setGoldPerSecond(cachedGoldData.goldPerSecond);
}, [verificationStatus, cachedGoldData, walletAddress, isDemoMode]);
```

**Issue**:
- `goldMiningData` is queried (line 103-106) and logged (line 202-245)
- BUT it's NEVER used to update `goldPerSecond` for the animation!
- The animation relies on `cachedGoldData` which is only set ONCE during initialization

**Result**:
- When Mek levels change → `goldMining.totalGoldPerHour` updates
- But `cachedGoldData` stays stale → animation uses old rate
- Gold accumulates at wrong rate until page refresh

---

### 4. CUMULATIVE GOLD CALCULATION MISMATCH
**Location**: `src/app/mek-rate-logging/page.tsx:333-389`
**Severity**: MEDIUM
**Impact**: Cumulative gold doesn't track all earned gold correctly

**Problem Code**:
```javascript
useEffect(() => {
  if (goldMiningData) {
    setCurrentGold(goldMiningData.currentGold);
    setGoldPerHour(goldMiningData.totalGoldPerHour);

    // Initialize cumulative gold
    let baseCumulativeGold = goldMiningData.totalCumulativeGold || 0;

    // If totalCumulativeGold isn't set yet, estimate
    if (!goldMiningData.totalCumulativeGold) {
      baseCumulativeGold = (goldMiningData.accumulatedGold || 0) + (goldMiningData.totalGoldSpentOnUpgrades || 0);
    }

    // Add real-time earnings since last checkpoint (only if verified)
    if (goldMiningData.isBlockchainVerified === true) {
      const lastUpdateTime = goldMiningData.lastSnapshotTime || goldMiningData.updatedAt || goldMiningData.createdAt;
      const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
      const goldSinceLastUpdate = goldMiningData.totalGoldPerHour * hoursSinceLastUpdate;
      setCumulativeGold(baseCumulativeGold + goldSinceLastUpdate);  // ⚠️ This calculates on FRONTEND!
    }
  }
}, [goldMiningData, mekLevels]);
```

**Issues**:
1. **Frontend calculates cumulative gold**: Should come from backend
2. **Race condition**: `goldMiningData.totalGoldPerHour` might be stale when Mek levels just changed
3. **Timing inconsistency**: Uses `lastSnapshotTime` which may not match animation loop timing
4. **No cap enforcement**: Cumulative can grow beyond 50k limit (though this is intended behavior)

---

## Data Flow Diagram

```
USER ACTION (Level Up Mek)
    ↓
upgradeMekLevel() mutation
    ↓
mekLevels table updated (currentLevel++, boostAmount++)
    ↓
goldMining.initializeGoldMining() called
    ↓
goldMining.totalGoldPerHour recalculated (includes new boost)
    ↓
goldMining.ownedMeks updated (with level boost fields)
    ↓
??? goldMiningData query re-fetches ???
    ↓
⚠️ BREAK POINT: goldMiningData updates but cachedGoldData DOES NOT
    ↓
goldPerSecond stays STALE (old value)
    ↓
Animation loop uses OLD goldPerSecond value
    ↓
UI shows WRONG gold accumulation rate
    ↓
SYMPTOM: Gold accumulates slower than it should after level up
```

---

## Specific Sync Issues by Severity

### CRITICAL
1. **Animation loop stale closure** - Captured `goldPerSecond` doesn't update
2. **Competing gold rate sources** - `users.goldPerHour` vs `goldMining.totalGoldPerHour`

### HIGH
3. **goldMiningData not synced to animation** - Query updates but animation doesn't
4. **Missing dependency in useEffect** - `isDemoMode` causes incorrect re-runs

### MEDIUM
5. **Cumulative gold frontend calculation** - Should be server-side
6. **Level boost data not propagating** - Logged but not applied to rate

### LOW
7. **Console log spam** - Too much diagnostic output
8. **Multiple timestamp sources** - `lastSnapshotTime` vs `updatedAt` vs `createdAt`

---

## Testing Strategy to Verify Issues

### Test 1: Stale Closure Verification
1. Open Hub page with dev tools
2. Note current gold accumulation rate
3. Use "Click for 8.7k" button to change rate
4. **Expected**: Gold rate immediately updates
5. **Actual**: May continue at old rate until effect re-runs

### Test 2: Level Boost Propagation
1. Go to mek-rate-logging page
2. Level up a Mek
3. Watch console logs for goldMiningData updates
4. **Expected**: totalGoldPerHour increases by boost amount
5. **Verify**: Check if Hub animation uses new rate

### Test 3: Cumulative Gold Accuracy
1. Note cumulative gold value
2. Collect all gold
3. Check database cumulative gold vs UI cumulative gold
4. **Expected**: Match exactly
5. **Verify**: No drift over time

### Test 4: Data Source Consistency
1. Open browser console
2. Compare `[HUB INIT]` gold rate vs `[HUB SYNC]` gold rate
3. **Expected**: Both match goldMining.totalGoldPerHour
4. **Actual**: May diverge if user clicked rate button

---

## Recommended Fixes (Priority Order)

### FIX 1: Use goldMiningData as Single Source of Truth (CRITICAL)
**File**: `src/app/hub/page.tsx`
**Change**:
```javascript
// REMOVE this effect (lines 248-280) - it uses cachedGoldData
// REPLACE with this:
useEffect(() => {
  if (!goldMiningData) return;

  console.log('[HUB RATE] Setting gold rate from goldMiningData:', {
    timestamp: new Date().toISOString(),
    totalGoldPerHour: goldMiningData.totalGoldPerHour,
    goldPerSecond: goldMiningData.totalGoldPerHour / 3600
  });

  // Demo mode: always allow gold accumulation
  if (isDemoMode || walletAddress === "demo_wallet_123") {
    setGoldPerSecond(goldMiningData.totalGoldPerHour / 3600);
    return;
  }

  // Real wallet: check verification status
  if (goldMiningData.isBlockchainVerified === true) {
    setGoldPerSecond(goldMiningData.totalGoldPerHour / 3600);
  } else {
    setGoldPerSecond(0); // Freeze if not verified
  }
}, [goldMiningData, walletAddress, isDemoMode]); // Use goldMiningData, not cachedGoldData!
```

**Why**:
- `goldMiningData` is a Convex query that auto-updates when database changes
- `cachedGoldData` is set ONCE during init and never updates
- Using query ensures animation always has latest rate

### FIX 2: Add Missing Dependency to Animation Loop (CRITICAL)
**File**: `src/app/hub/page.tsx:350`
**Change**:
```javascript
}, [goldPerSecond, cachedGoldData, verificationStatus, walletAddress, isDemoMode]);
// ↑ Add isDemoMode to dependency array
```

**Why**: ESLint warning indicates missing dependency causes stale closures

### FIX 3: Remove Competing Data Source (HIGH)
**File**: `src/app/hub/page.tsx:91, 152-176`
**Change**:
```javascript
// REMOVE or comment out:
const getInitialGold = useMutation(api.goldTrackingOptimized.getInitialGoldData);

// In initUser(), REMOVE this block:
/*
const goldData = await getInitialGold({ userId: user._id });
setCachedGoldData(goldData);
setLiveGold(goldData.pendingGold);
*/

// REPLACE with initialization from goldMiningData query:
// (goldMiningData will auto-populate via useEffect when query returns)
```

**Why**: Eliminates `users.goldPerHour` as competing source of truth

### FIX 4: Move Cumulative Gold to Server-Side (MEDIUM)
**File**: `convex/goldMining.ts:216-312`
**Change**: Add cumulative gold to query return:
```javascript
return {
  ...data,
  currentGold,
  baseGoldPerHour: baseRate,
  boostGoldPerHour: boostRate,
  totalGoldPerHour: totalRate,
  isVerified: data.isBlockchainVerified === true,
  // ADD THIS:
  totalCumulativeGold: calculateCumulativeGold(data), // Server-side calculation
};
```

**Why**: Keeps cumulative gold calculation consistent and authoritative

### FIX 5: Add Comprehensive Logging (LOW)
Add timestamped logs at every state transition:
```javascript
console.log('[STATE SYNC]', Date.now(), 'mutation → database');
console.log('[STATE SYNC]', Date.now(), 'database → query');
console.log('[STATE SYNC]', Date.now(), 'query → setState');
console.log('[STATE SYNC]', Date.now(), 'setState → render');
```

---

## Gold Invariant Validation

The system MUST maintain this invariant at all times:
```
totalCumulativeGold >= accumulatedGold + totalGoldSpentOnUpgrades
```

**Current Status**: UNKNOWN - needs validation
**Recommended**: Add assertion in `convex/lib/goldCalculations.ts:199-224`

**Test Code**:
```javascript
// Add to every mutation that modifies gold:
validateGoldInvariant({
  accumulatedGold: newAccumulatedGold,
  totalCumulativeGold: newTotalCumulativeGold,
  totalGoldSpentOnUpgrades: record.totalGoldSpentOnUpgrades || 0,
  createdAt: record.createdAt,
  totalGoldPerHour: record.totalGoldPerHour
});
```

---

## Files Requiring Changes

| File | Changes | Priority |
|------|---------|----------|
| `src/app/hub/page.tsx` | Fix stale closure, use goldMiningData | CRITICAL |
| `convex/goldMining.ts` | Add cumulative gold to query | MEDIUM |
| `src/app/mek-rate-logging/page.tsx` | Remove frontend cumulative calc | MEDIUM |
| `convex/lib/goldCalculations.ts` | Add validation logging | LOW |

---

## Conclusion

The gold synchronization issues stem from:
1. **Architectural**: Using multiple data sources for the same value
2. **React Patterns**: Stale closures in animation loops
3. **Timing**: Race conditions between mutations and queries
4. **Calculation**: Frontend calculating values that should be server-authoritative

**Impact**: Gold accumulation may be slower or faster than actual rate, especially after Mek level upgrades.

**Recommended Action**: Implement FIX 1 and FIX 2 immediately (CRITICAL priority), then test thoroughly before deploying remaining fixes.

---

## Next Steps

1. ✅ Document all findings (this file)
2. ⬜ Implement FIX 1 (use goldMiningData as single source)
3. ⬜ Implement FIX 2 (fix dependency array)
4. ⬜ Test with level upgrades
5. ⬜ Verify cumulative gold accuracy
6. ⬜ Add validation assertions
7. ⬜ Monitor production for 24h

**Investigation Complete**: 2025-10-03
**Investigator**: Claude (Real-Time State Synchronization Specialist)
