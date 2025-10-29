# Essence Animation Synchronization Debug Session

**Date:** 2025-10-24
**Issue:** Essence values differ between Distribution Lightbox and Admin Balances viewer when viewed simultaneously

## Problem Statement

When viewing both essence displays at the same time:
- **Distribution Lightbox** (Table View): Shows `4.08626` for "Nothing"
- **Admin Balances Viewer**: Shows `4.08644` for "Nothing"
- **Difference:** 0.00018 (approximately 155 seconds of accumulation)

Both lightboxes are open simultaneously and should show identical values since they're calculating from the same database snapshot.

## Investigation Phases

### Phase 1: Add Debug Logging ✅ COMPLETED

**What we did:**
- Added comprehensive console logging to `AnimatedEssenceTableCell` component (Distribution Lightbox)
- Added comprehensive console logging to `AnimatedEssenceAmount` component (Admin Balances)
- Logs include:
  - Baseline updates: baseAmount, backendCalculationTime, ratePerDay, cap
  - Animation ticks (every 5 seconds): elapsed time, accumulated amount, calculated result

**Files modified:**
- `src/components/EssenceDistributionLightbox.tsx` (lines 36-48, 57-80)
- `src/components/EssenceBalancesViewer.tsx` (lines 35-48, 57-84)

**Console markers:**
- 🔵 Blue logs = Distribution Lightbox
- 🟢 Green logs = Admin Balances

**Next steps:**
1. User opens both lightboxes simultaneously
2. Compare console logs side-by-side
3. Look for differences in:
   - `baseAmount` (should be identical)
   - `backendTimeMs` (should be identical)
   - `ratePerDay` (should be identical)
   - Animation calculation logic

### Phase 2: Identify Root Cause ✅ COMPLETED

**ROOT CAUSE FOUND:**
Both components were receiving DIFFERENT backend snapshots:
- Distribution Lightbox: `2025-10-24T23:56:05.892Z` (backendTimeMs: 1761358165892)
- Admin Balances: `2025-10-25T00:00:00.056Z` (backendTimeMs: 1761358400056)
- **Time difference: 234 seconds (3.9 minutes)**

This happened because:
1. Both components call `useQuery(api.essence.getPlayerEssenceState)` independently
2. They opened at different times (Distribution first, Admin ~4 minutes later)
3. Essence checkpoints update every 5 minutes
4. Distribution got the 23:56:05 checkpoint, Admin got the midnight checkpoint
5. Each animates forward from their different baseline → values diverge

**Comparison with Gold System:**
- Gold uses ONE query shared across all displays → same snapshot → perfect sync
- Gold checkpoints every 6 hours → low chance of hitting boundary during testing
- Essence checkpoints every 5 minutes → high chance of boundary during testing

### Phase 3: Implement Enhanced Logging ✅ COMPLETED

**What we added:**
- Both components now detect when `backendCalculationTime` changes
- New logs show **🔥 BACKEND SNAPSHOT UPDATE DETECTED** when fresh data arrives
- Logs include:
  - Old vs New backend timestamp
  - Time difference in ms and seconds
  - Old vs New base amount
  - Amount difference

**Files modified:**
- `src/components/EssenceDistributionLightbox.tsx` (lines 41-79)
- `src/components/EssenceBalancesViewer.tsx` (lines 33-73)

**What this reveals:**
- We can now SEE when Convex sends new snapshot data to each component
- If both components ARE syncing properly, we'll see both get 🔥 updates at the same time
- If they're NOT syncing, only one will update while the other stays on old data

### Phase 4: Testing & Verification 🔄 IN PROGRESS

**Test Scenario 1: Initial Load**
1. Clear console
2. Open Distribution Lightbox → Switch to Table View
3. Open Admin Balances lightbox
4. Search console for "Baseline update" to see initial snapshots
5. **Expected**: Both should have identical `backendTime` if they queried within same 5-min window
6. **If different**: They loaded across a checkpoint boundary (expected behavior)

**Test Scenario 2: Wait for Backend Update**
1. Keep both lightboxes open
2. Wait 5+ minutes for next essence checkpoint
3. Search console for "🔥 BACKEND SNAPSHOT UPDATE DETECTED"
4. **Expected**: BOTH components should log 🔥 at approximately the same time
5. **Expected**: After update, both should have IDENTICAL `backendTime`
6. **Expected**: Values should converge and stay synchronized

**Test Scenario 3: Verify Convergence**
1. After both receive same snapshot, compare displayed values
2. Check that values match to all decimals
3. **Success criteria**: Both lightboxes show identical essence amounts

## Key Findings

### Expected Behavior (Gold System)
- Gold uses client-side calculation: `current = base + (Date.now() - snapshotTime) × rate`
- Gold snapshots update every **6 hours** via cron
- All queries within 6-hour window get identical snapshot
- Result: Desktop and phone show identical values

### Current Essence Behavior
- Essence uses same calculation formula
- Essence checkpoints update every **5 minutes** via cron (72x more frequent!)
- However, since both lightboxes are open simultaneously, they should still get the same snapshot
- The discrepancy suggests a client-side calculation issue, not a snapshot timing issue

## Implementation: Shared Essence Context (Gold System Pattern)

### Phase 5: Create Shared Context ✅ COMPLETED

**File created:** `src/contexts/EssenceContext.tsx`

**What it does:**
- Single `useQuery(api.essence.getPlayerEssenceState)` at top level
- All components consume from this shared context
- Guarantees identical snapshots across all consumers
- Matches gold system architecture

**Key components:**
- `EssenceProvider` - Wraps app, makes single query
- `useEssence()` hook - Consume shared data in any component
- Logging to track when provider receives updates

### Phase 6: Wrap Application ✅ COMPLETED

**File modified:** `src/components/GlobalLightboxHandler.tsx`

**What changed:**
- Imported `EssenceProvider` from context
- Wrapped entire return statement with `<EssenceProvider walletAddress={walletAddress || null}>`
- Added missing `walletAddress` prop to `EssenceBalancesViewer` (was missing before)

**Why GlobalLightboxHandler:**
- This component renders BOTH lightboxes (Distribution & Admin Balances)
- Perfect location to wrap with provider - guarantees both are inside context
- Manages wallet address state already

**Data flow:**
```
GlobalLightboxHandler (has walletAddress state)
  └── <EssenceProvider walletAddress={walletAddress}>
        ├── EssenceDistributionLightbox (can now use useEssence)
        └── EssenceBalancesViewer (can now use useEssence)
```

### Phase 7: Update Distribution Lightbox ✅ COMPLETED

**Files modified:**
- `src/components/EssenceDistributionLightbox.tsx`
- `src/components/GlobalLightboxHandler.tsx`

**Changes to EssenceDistributionLightbox:**
- ✅ Removed `walletAddress` from props interface
- ✅ Removed `walletAddress` from component parameters
- ✅ Removed direct `useQuery(api.essence.getPlayerEssenceState)` call
- ✅ Added `useEssence()` hook to consume shared context
- ✅ Updated logging to show "USING SHARED ESSENCE CONTEXT"
- ✅ Added logging to track context data usage

**Changes to GlobalLightboxHandler:**
- ✅ Removed `walletAddress` prop when rendering `<EssenceDistributionLightbox />`
- ✅ Updated console log to reflect shared context usage

**Result:**
Distribution Lightbox now gets essence data from shared context instead of making its own query.

### Phase 8: Update Admin Balances Viewer ✅ COMPLETED

**Files modified:**
- `src/components/EssenceBalancesViewer.tsx`
- `src/components/GlobalLightboxHandler.tsx`
- `src/components/WalletManagementAdmin.tsx`

**Changes to EssenceBalancesViewer:**
- ✅ Removed `walletAddress` from props interface
- ✅ Removed `walletAddress` from component parameters
- ✅ Removed direct `useQuery(api.essence.getPlayerEssenceState)` call
- ✅ Added `useEssence()` hook to consume shared context
- ✅ Created `essenceState` alias for compatibility
- ✅ Added logging to track context data usage

**Changes to GlobalLightboxHandler:**
- ✅ Removed `walletAddress` prop when rendering `<EssenceBalancesViewer />`

**Changes to WalletManagementAdmin:**
- ✅ Wrapped EssenceBalancesViewer with its own `<EssenceProvider walletAddress={viewingEssence}>`
- ✅ Removed `walletAddress` prop from component (uses context instead)
- ✅ This allows admin to view different wallets while using shared context architecture

**Result:**
Both lightboxes now consume from shared context. Admin page has its own provider instance for viewing different wallets.

### Phase 9: Fix Real-Time Accumulation Display ✅ COMPLETED

**Problem identified:**
Table values and Admin Balances were synchronized, but the "Real-Time Accumulation" display on the details card was showing different values.

**Root cause:**
`RealTimeAccumulation` component was using client mount time (`Date.now()`) as the baseline instead of backend's `lastCalculationTime`.

**Files modified:**
- `src/components/EssenceDistributionLightbox.tsx`

**Changes made:**
1. Updated `RealTimeAccumulation` component signature:
   - Changed `currentAmount` → `baseAmount`
   - Added `backendCalculationTime` parameter
2. Replaced client mount time logic with backend calculation time:
   - Changed from `mountTimeRef.current = Date.now()`
   - To `backendTimeRef.current = backendCalculationTime`
3. Updated component call site:
   - Changed `currentAmount={slice.amount}`
   - To `baseAmount={slice.amount}`
   - Added `backendCalculationTime={playerEssenceState?.lastCalculationTime || Date.now()}`

**Result:**
Real-Time Accumulation now uses the same calculation baseline as table cells, ensuring perfect synchronization across all displays.

**Next step:**
Final testing - all three displays (table, admin balances, real-time card) should now show identical values!
