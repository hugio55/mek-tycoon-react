# Essence Accumulation System - Monitoring Guide

## System Overview
The essence accumulation system mirrors the gold accumulation pattern, using requestAnimationFrame for smooth client-side updates between backend checkpoints. This guide explains how to monitor and verify the system is working correctly.

---

## Architecture Summary

### Backend (Convex)
- **Checkpoint Intervals**: Every 5 minutes via scheduled function
- **Data Storage**: `essenceBalances` table with `lastSnapshotTime` tracking
- **Calculation**: Uses shared `calculateEssenceAmount()` in `/convex/lib/essenceCalculations.ts`

### Frontend (React)
- **Hook**: `useEssenceAccumulation` in `/src/hooks/useEssenceAccumulation.ts`
- **Animation**: requestAnimationFrame pattern (same as gold system)
- **UI Integration**: `EssenceDistributionLightbox.tsx` component

---

## Key Monitoring Points

### 1. Backend Checkpoint System
**File**: `/convex/crons.ts`
**Function**: `essenceCheckpoint`
**Schedule**: Every 5 minutes (`crons.interval("save essence checkpoints", { minutes: 5 })`)

**What to Monitor**:
- Console logs showing checkpoint execution
- Verify balances are being updated with current timestamp
- Check for any errors in Convex dashboard

**Expected Behavior**:
```
[Essence Checkpoint] Starting checkpoint...
[Essence Checkpoint] Updated 15 balances
[Essence Checkpoint] Checkpoint complete
```

---

### 2. Frontend Hook Accumulation
**File**: `/src/hooks/useEssenceAccumulation.ts`
**Pattern**: requestAnimationFrame loop (mirrors gold system)

**What to Monitor**:
```typescript
// The hook calculates:
// 1. Server-side accumulated amount (from lastSnapshotTime to now)
// 2. Client-side animation (smooth increments every frame)
// 3. Cap enforcement (stops at essenceCap)
```

**Expected Behavior**:
- Smooth, continuous accumulation display
- 12 decimal precision (e.g., `123.456789012345`)
- Stops at cap value (no overflow)
- Persists animation when component stays mounted
- Resets cleanly when switching between essences

---

### 3. UI Component Integration
**File**: `/src/components/EssenceDistributionLightbox.tsx`
**Component**: `RealTimeAccumulation`

**What to Monitor**:
```typescript
// Props passed to hook:
{
  baseAmount: number;           // From backend snapshot
  lastSnapshotTime: number;     // From backend (Unix timestamp in ms)
  ratePerDay: number;           // Base rate + bonus buffs
  essenceCap: number;           // Maximum storage capacity
  variationId: number;          // Which essence variation
}
```

**Expected Behavior**:
- Shows high-precision decimals during accumulation
- Switches to exact `baseAmount` when full
- Hovering between essences triggers smooth transitions
- No sudden jumps or resets during normal use

---

## Common Issues & Debugging

### Issue: Accumulation Not Showing
**Symptoms**: Display stays at exact backend value, no smooth increments

**Check**:
1. Verify `useEssenceAccumulation` hook is imported
2. Check that `lastSnapshotTime` is being passed correctly
3. Inspect browser console for React errors
4. Verify requestAnimationFrame is running (check Performance tab)

**Debug Commands**:
```typescript
// In useEssenceAccumulation.ts, add console logging:
console.log('Accumulation tick:', {
  serverAccumulated,
  animationOffset,
  currentAmount,
  isCapped
});
```

---

### Issue: Sudden Jumps in Value
**Symptoms**: Number jumps backward or forward unexpectedly

**Causes**:
- Component remounting (loses animation frame context)
- `lastSnapshotTime` being updated by backend checkpoint
- State sync issue between frontend and Convex

**Solutions**:
1. Ensure component doesn't remount on hover (check React DevTools)
2. Verify `essenceData` mapping includes stable `lastSnapshotTime`
3. Check that backend checkpoint isn't firing too frequently

---

### Issue: Accumulation Continues Past Cap
**Symptoms**: Display shows values above `essenceCap`

**Check**:
1. Verify `essenceCap` is being passed to hook correctly
2. Check calculation in `useEssenceAccumulation`:
```typescript
const cappedAmount = Math.min(totalAmount, essenceCap);
```
3. Ensure `isFull` logic works:
```typescript
const isFull = baseAmount >= essenceCap;
```

---

### Issue: Different Values Between Hover and Backend
**Symptoms**: Hovering shows one value, but backend query shows different value

**Expected Behavior**: This is NORMAL!
- Frontend shows real-time accumulation between checkpoints
- Backend shows last checkpoint value (updates every 5 min)
- Frontend uses `lastSnapshotTime` to calculate accumulated amount since last checkpoint

**When to Worry**:
- If difference exceeds 5 minutes worth of accumulation (indicates checkpoint failure)
- If frontend value is LESS than backend value (indicates calculation bug)

---

## Testing Checklist

### Manual UI Testing
1. **Open essence distribution lightbox** on /home page
2. **Hover over essence bottle** - verify accumulation display appears
3. **Watch for 10 seconds** - verify smooth, continuous increment
4. **Check precision** - should show 12 decimal places
5. **Hover to different essence** - verify clean transition, no flickering
6. **Wait for checkpoint** (5 min) - verify no sudden jumps
7. **Check capped essence** - verify it shows exact cap value, no accumulation

### Browser Console Checks
```javascript
// Check for errors
// Should see no React errors, no undefined values

// Check animation frame
// DevTools > Performance > Record for 5s
// Should see requestAnimationFrame callbacks firing ~60fps

// Check Convex queries
// Network tab > Filter: convex
// Should see essence queries completing successfully
```

### Backend Verification (Convex Dashboard)
1. **Navigate to Convex Dashboard** → Functions tab
2. **Check scheduled functions** → Find "save essence checkpoints"
3. **Verify execution history** → Should run every 5 minutes
4. **Check logs** → Look for checkpoint completion messages
5. **Query essenceBalances table** → Verify `lastSnapshotTime` updates

---

## Performance Considerations

### requestAnimationFrame Efficiency
- **Why it's better than setInterval**: Pauses when tab is inactive, syncs with browser rendering
- **CPU usage**: Minimal - only calculates one value per frame
- **Memory**: No memory leaks (cleanup on unmount)

### Backend Checkpoint Frequency
- **Current**: 5 minutes (balanced for real-time feel + server efficiency)
- **Adjustable**: Can increase to 1 minute for more frequent syncs
- **Cost**: More frequent checkpoints = more Convex function executions

---

## Data Flow Summary

```
1. User slots Mek with variation
   ↓
2. Backend creates essenceBalance record
   - Sets initialBalance
   - Records lastSnapshotTime
   ↓
3. Every 5 minutes: Checkpoint runs
   - Calculates accumulated essence since last checkpoint
   - Updates balance in database
   - Updates lastSnapshotTime to now
   ↓
4. Frontend queries essenceBalances
   - Receives: baseAmount, lastSnapshotTime, ratePerDay, essenceCap
   ↓
5. useEssenceAccumulation hook calculates:
   - Server accumulation: (now - lastSnapshotTime) * rate
   - Client animation: requestAnimationFrame smooth updates
   ↓
6. UI displays:
   - High-precision real-time value (12 decimals)
   - Smooth animation between backend checkpoints
```

---

## Key Files Reference

### Backend
- `/convex/crons.ts` - Checkpoint scheduler
- `/convex/essence.ts` - Queries and mutations
- `/convex/lib/essenceCalculations.ts` - Shared calculation logic
- `/convex/schema.ts` - `essenceBalances` table definition

### Frontend
- `/src/hooks/useEssenceAccumulation.ts` - Core accumulation hook
- `/src/components/EssenceDistributionLightbox.tsx` - UI integration
- `/src/components/essence-donut-chart.tsx` - Visual display (if showing chart)

---

## Migration Status

### Completed Steps
- ✅ Step 1: Checkpoint interval scheduler (5 min)
- ✅ Step 2: Shared calculation library (`essenceCalculations.ts`)
- ✅ Step 3: Backend checkpoint function
- ✅ Step 4: Schema update (added `lastSnapshotTime`)
- ✅ Step 5: Clean slate migration (deleted test data)
- ✅ Step 6: Frontend hook (`useEssenceAccumulation`)
- ✅ Step 7: UI integration (`EssenceDistributionLightbox`)

### Next Steps (Future Enhancements)
- Add essence buff management UI
- Implement essence marketplace
- Create essence transfer system
- Add essence consumption mechanics

---

## Troubleshooting Commands

### Clear all essence balances (testing)
```typescript
// Convex Dashboard > Functions > adminEssence.runEssenceBalanceMigration
// This deletes all test data and resets to clean slate
```

### Force checkpoint (manual trigger)
```typescript
// Convex Dashboard > Functions > essence.forceCheckpoint (if implemented)
// Manually triggers checkpoint outside 5-minute schedule
```

### Check animation frame performance
```javascript
// Browser DevTools Console
let frameCount = 0;
const countFrames = () => {
  frameCount++;
  requestAnimationFrame(countFrames);
};
countFrames();
setTimeout(() => console.log(`${frameCount} frames in 1 second`), 1000);
// Expected: ~60 frames/sec
```

---

## Success Criteria

### The system is working correctly when:
1. ✅ Essence accumulates smoothly in UI (no stuttering)
2. ✅ Values match expected calculations (baseAmount + (elapsed * rate))
3. ✅ Checkpoints run every 5 minutes without errors
4. ✅ Switching between essences transitions cleanly
5. ✅ Capped essences stop at cap value
6. ✅ No React errors in console
7. ✅ Performance is smooth (60fps animation)
8. ✅ Backend and frontend stay in sync (within 5 min window)

---

*Last Updated: 2025-10-24*
*System Version: 1.0*
*Pattern: Mirrors Gold Accumulation System*
