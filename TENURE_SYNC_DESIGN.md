# Tenure Progress Bar - Real-Time State Synchronization Design

## Executive Summary

This document provides a complete implementation strategy for real-time tenure progress synchronization in the Mek Tycoon slot overlay editor. The design ensures smooth visual progress, handles browser events gracefully, syncs across tabs, and leverages the existing patterns from the gold and essence systems.

---

## 1. Architecture Overview

### Core Pattern: Hybrid Client-Server Synchronization

**Backend (Convex):**
- Source of truth for tenure points
- Stores: `accumulatedTenure`, `lastTenureSnapshotTime`, `tenureRatePerSecond`
- Updates on: slot events, buff changes, level-ups

**Frontend (React):**
- Smooth interpolation using `requestAnimationFrame`
- Calculates current tenure from backend baseline + elapsed time
- Updates visual progress bar every frame (~60fps)

### Data Flow

```
Backend (Convex)
  └─> lastTenureSnapshotTime (timestamp)
  └─> accumulatedTenure (points at snapshot time)
  └─> tenureRatePerSecond (current rate with buffs)
        ↓
Frontend (React Hook)
  └─> Receives baseline via useQuery
  └─> Calculates elapsed time since snapshot
  └─> Interpolates: current = baseline + (elapsed × rate)
  └─> Updates progress bar smoothly
        ↓
Visual Display
  └─> Progress bar fills smoothly
  └─> "Level Up" button appears when tenure >= threshold
  └─> No jumps, no backwards movement
```

---

## 2. Backend Schema (Convex)

### Slot Document Structure

Add these fields to the `slots` table in `convex/schema.ts`:

```typescript
// In slots table definition
slots: defineTable({
  // ... existing fields ...

  // Tenure tracking fields
  accumulatedTenure: v.number(),          // Tenure at last snapshot
  lastTenureSnapshotTime: v.number(),     // Timestamp of last snapshot (ms)
  tenureRatePerSecond: v.number(),        // Base rate: 1 tenure/second
  tenureRateBuffMultiplier: v.optional(v.number()), // Buff multiplier (e.g., 1.5 = +50%)
  nextLevelTenure: v.number(),            // Tenure required for next level
  currentLevel: v.number(),               // Current Mek level

  // Status fields
  isSlotted: v.boolean(),                 // Whether Mek is currently slotted
  slottedAt: v.optional(v.number()),      // When Mek was slotted (for tenure start)

  // ... rest of existing fields ...
})
```

### Helper: Calculate Current Tenure

Create `convex/lib/tenureCalculations.ts`:

```typescript
/**
 * Calculate current tenure based on baseline + elapsed time
 * Matches pattern from goldCalculations.ts
 */
export function calculateCurrentTenure(params: {
  accumulatedTenure: number;
  tenureRatePerSecond: number;
  lastTenureSnapshotTime: number;
  tenureRateBuffMultiplier?: number;
  isSlotted: boolean;
}): number {
  const {
    accumulatedTenure,
    tenureRatePerSecond,
    lastTenureSnapshotTime,
    tenureRateBuffMultiplier = 1.0,
    isSlotted
  } = params;

  // If not slotted, tenure doesn't accumulate
  if (!isSlotted) {
    return accumulatedTenure;
  }

  const now = Date.now();
  const elapsedMs = now - lastTenureSnapshotTime;
  const elapsedSeconds = elapsedMs / 1000;

  // Apply buff multiplier to rate
  const effectiveRate = tenureRatePerSecond * tenureRateBuffMultiplier;

  // Calculate accumulated tenure
  const accumulatedSinceSnapshot = elapsedSeconds * effectiveRate;
  const currentTenure = accumulatedTenure + accumulatedSinceSnapshot;

  return currentTenure;
}

/**
 * Clamp tenure to max level requirement
 */
export function clampTenure(tenure: number, maxTenure: number): number {
  return Math.min(tenure, maxTenure);
}
```

### Mutation: Snapshot Tenure (Called on Events)

```typescript
// In convex/slots.ts

export const snapshotTenure = mutation({
  args: {
    slotId: v.id("slots")
  },
  handler: async (ctx, args) => {
    const slot = await ctx.db.get(args.slotId);
    if (!slot) throw new Error("Slot not found");

    const now = Date.now();

    // Calculate current tenure before snapshot
    const currentTenure = calculateCurrentTenure({
      accumulatedTenure: slot.accumulatedTenure,
      tenureRatePerSecond: slot.tenureRatePerSecond,
      lastTenureSnapshotTime: slot.lastTenureSnapshotTime,
      tenureRateBuffMultiplier: slot.tenureRateBuffMultiplier,
      isSlotted: slot.isSlotted
    });

    // Clamp to max level requirement
    const clampedTenure = clampTenure(currentTenure, slot.nextLevelTenure);

    // Update snapshot
    await ctx.db.patch(args.slotId, {
      accumulatedTenure: clampedTenure,
      lastTenureSnapshotTime: now
    });

    return {
      tenure: clampedTenure,
      timestamp: now
    };
  }
});
```

### Query: Get Slot with Current Tenure

```typescript
export const getSlotWithTenure = query({
  args: {
    slotId: v.id("slots")
  },
  handler: async (ctx, args) => {
    const slot = await ctx.db.get(args.slotId);
    if (!slot) return null;

    const currentTenure = calculateCurrentTenure({
      accumulatedTenure: slot.accumulatedTenure,
      tenureRatePerSecond: slot.tenureRatePerSecond,
      lastTenureSnapshotTime: slot.lastTenureSnapshotTime,
      tenureRateBuffMultiplier: slot.tenureRateBuffMultiplier,
      isSlotted: slot.isSlotted
    });

    return {
      ...slot,
      currentTenure: clampTenure(currentTenure, slot.nextLevelTenure)
    };
  }
});
```

---

## 3. Frontend React Hook

### Create `src/hooks/useTenureProgress.ts`

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface UseTenureProgressProps {
  slotId: Id<"slots">;
}

interface TenureProgressState {
  currentTenure: number;
  maxTenure: number;
  percentage: number;
  isComplete: boolean;
  ratePerSecond: number;
  isSlotted: boolean;
}

/**
 * Real-time tenure progress hook with smooth interpolation
 *
 * Pattern:
 * 1. Backend provides baseline (tenure at snapshot time)
 * 2. Frontend interpolates current value using elapsed time
 * 3. useRef prevents resets when Convex re-queries
 * 4. requestAnimationFrame ensures smooth visual updates
 */
export function useTenureProgress({ slotId }: UseTenureProgressProps): TenureProgressState {
  // Get slot data from Convex (source of truth)
  const slotData = useQuery(api.slots.getSlotWithTenure, { slotId });

  // Display state (updated every frame)
  const [currentTenure, setCurrentTenure] = useState(0);

  // Refs to store baseline (prevent resets on re-query)
  const baselineRef = useRef({
    tenure: 0,
    timestamp: Date.now(),
    rate: 1,
    buffMultiplier: 1,
    isSlotted: false
  });

  // Track if this is the initial load
  const initialLoadRef = useRef(true);

  // Update baseline when Convex sends new data
  useEffect(() => {
    if (!slotData) return;

    console.log('[🎯TENURE] Backend snapshot update:', {
      accumulatedTenure: slotData.accumulatedTenure,
      lastSnapshotTime: new Date(slotData.lastTenureSnapshotTime).toISOString(),
      rate: slotData.tenureRatePerSecond,
      buffMultiplier: slotData.tenureRateBuffMultiplier || 1,
      isSlotted: slotData.isSlotted
    });

    // Update baseline reference
    baselineRef.current = {
      tenure: slotData.accumulatedTenure,
      timestamp: slotData.lastTenureSnapshotTime,
      rate: slotData.tenureRatePerSecond,
      buffMultiplier: slotData.tenureRateBuffMultiplier || 1,
      isSlotted: slotData.isSlotted
    };

    // On initial load, set display to baseline
    if (initialLoadRef.current) {
      setCurrentTenure(slotData.accumulatedTenure);
      initialLoadRef.current = false;
    }
  }, [slotData]);

  // Animation loop: interpolate current tenure from baseline
  useEffect(() => {
    if (!slotData) return;

    // Don't animate if not slotted
    if (!baselineRef.current.isSlotted) {
      setCurrentTenure(baselineRef.current.tenure);
      return;
    }

    // Don't animate if already at max
    if (baselineRef.current.tenure >= slotData.nextLevelTenure) {
      setCurrentTenure(slotData.nextLevelTenure);
      return;
    }

    let animationFrameId: number;

    const animate = () => {
      const now = Date.now();
      const elapsedMs = now - baselineRef.current.timestamp;
      const elapsedSeconds = elapsedMs / 1000;

      const effectiveRate = baselineRef.current.rate * baselineRef.current.buffMultiplier;
      const accumulated = elapsedSeconds * effectiveRate;
      const newTenure = Math.min(
        baselineRef.current.tenure + accumulated,
        slotData.nextLevelTenure
      );

      setCurrentTenure(newTenure);

      // Continue animation loop
      animationFrameId = requestAnimationFrame(animate);
    };

    // Start animation
    animationFrameId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [slotData, baselineRef.current.isSlotted]);

  // Return computed state
  if (!slotData) {
    return {
      currentTenure: 0,
      maxTenure: 1000,
      percentage: 0,
      isComplete: false,
      ratePerSecond: 1,
      isSlotted: false
    };
  }

  const percentage = Math.min((currentTenure / slotData.nextLevelTenure) * 100, 100);
  const isComplete = currentTenure >= slotData.nextLevelTenure;

  return {
    currentTenure,
    maxTenure: slotData.nextLevelTenure,
    percentage,
    isComplete,
    ratePerSecond: slotData.tenureRatePerSecond * (slotData.tenureRateBuffMultiplier || 1),
    isSlotted: slotData.isSlotted
  };
}
```

---

## 4. Component Integration

### Usage in Slot Overlay Editor

```tsx
'use client';

import TenureProgressBar from '@/components/ui/TenureProgressBar';
import { useTenureProgress } from '@/hooks/useTenureProgress';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

function SlotDisplay({ slotId }) {
  // Real-time tenure progress
  const tenureProgress = useTenureProgress({ slotId });

  // Level up mutation
  const levelUpMek = useMutation(api.mekLeveling.levelUp);

  const handleLevelUp = async () => {
    if (!tenureProgress.isComplete) return;

    try {
      await levelUpMek({ slotId });
      // Backend will reset tenure and update level
    } catch (error) {
      console.error('Level up failed:', error);
    }
  };

  return (
    <div className="slot-artwork-overlay">
      {/* ... Mek image and other zones ... */}

      {/* Tenure Progress Zone */}
      <TenureProgressBar
        currentTenure={tenureProgress.currentTenure}
        maxTenure={tenureProgress.maxTenure}
        onLevelUp={handleLevelUp}
        size="sm"
        style="compact"
      />
    </div>
  );
}
```

---

## 5. Edge Cases & Solutions

### Problem 1: Browser Close/Reopen

**Scenario:** User closes browser with 750 tenure. 10 minutes later, reopens.

**Solution:**
- Backend stores `lastTenureSnapshotTime` in database
- On page load, Convex query calculates: `accumulatedTenure + (now - lastSnapshot) × rate`
- Frontend receives correct "current tenure" immediately
- Animation starts from correct baseline

**Implementation:** Already handled by `getSlotWithTenure` query

---

### Problem 2: Mek Unslot/Reslot

**Scenario:** User unslots Mek (tenure should freeze), then reslots (tenure should resume).

**Solution:**
- When unslotted:
  - Call `snapshotTenure` mutation to save current tenure
  - Set `isSlotted = false`
  - Frontend animation loop exits (no accumulation when `!isSlotted`)

- When reslotted:
  - Set `isSlotted = true`
  - Update `lastTenureSnapshotTime = now`
  - Frontend animation resumes from saved tenure

**Mutation:**

```typescript
export const unslotMek = mutation({
  args: { slotId: v.id("slots") },
  handler: async (ctx, args) => {
    // Snapshot current tenure before unslotting
    const snapshot = await ctx.runMutation(api.slots.snapshotTenure, {
      slotId: args.slotId
    });

    // Mark as unslotted
    await ctx.db.patch(args.slotId, {
      isSlotted: false,
      // Tenure is frozen at snapshot value
    });
  }
});

export const reslotMek = mutation({
  args: { slotId: v.id("slots") },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.slotId, {
      isSlotted: true,
      slottedAt: now,
      lastTenureSnapshotTime: now, // Resume from now
      // accumulatedTenure stays the same (resume where we left off)
    });
  }
});
```

---

### Problem 3: Tenure Rate Buff Applied/Removed

**Scenario:** User applies buff that changes tenure rate from 1/sec to 1.5/sec.

**Solution:**
- Before changing rate, call `snapshotTenure` to save current progress
- Update `tenureRateBuffMultiplier`
- Frontend receives new multiplier via reactive query
- Animation continues smoothly with new rate

**Mutation:**

```typescript
export const applyTenureBuff = mutation({
  args: {
    slotId: v.id("slots"),
    buffMultiplier: v.number() // e.g., 1.5 for +50% speed
  },
  handler: async (ctx, args) => {
    // Snapshot tenure at current rate before changing
    await ctx.runMutation(api.slots.snapshotTenure, {
      slotId: args.slotId
    });

    // Apply new buff
    await ctx.db.patch(args.slotId, {
      tenureRateBuffMultiplier: args.buffMultiplier,
      // lastTenureSnapshotTime was just updated by snapshot
    });

    console.log(`[TENURE BUFF] Applied ${args.buffMultiplier}x multiplier`);
  }
});
```

**Frontend Behavior:**
- `useQuery` detects `tenureRateBuffMultiplier` change
- `useEffect` updates `baselineRef.current.buffMultiplier`
- `requestAnimationFrame` loop uses new multiplier
- Progress bar smoothly accelerates (no jump)

---

### Problem 4: Level Up in Another Tab

**Scenario:** User has two tabs open. Levels up in Tab A. Tab B should update immediately.

**Solution:**
- Convex's reactive queries automatically propagate changes
- When Tab A calls `levelUpMek`:
  - Backend resets `accumulatedTenure = 0`
  - Backend updates `lastTenureSnapshotTime = now`
  - Backend increments `currentLevel`

- Tab B's `useQuery` receives update within ~100ms
- Frontend hook detects baseline change
- Progress bar resets to 0 smoothly

**No extra code needed** - Convex handles multi-tab sync automatically.

---

### Problem 5: Progress Bar Jumping Backwards on Refresh

**Scenario:** Frontend shows 950 tenure (interpolated). User refreshes. Backend only has 900 tenure (last snapshot was 10 seconds ago).

**Solution:**
- Backend query ALWAYS calculates current tenure before returning:
  ```typescript
  const currentTenure = accumulatedTenure + (now - lastSnapshot) × rate;
  ```
- Frontend receives accurate "current tenure" on every query
- No backwards jumps because backend compensates for elapsed time

**Key:** Backend never returns stale `accumulatedTenure` directly - always calculates current value first.

---

## 6. Performance Optimizations

### Update Frequency

**Rendering:**
- `requestAnimationFrame` runs at ~60fps (16ms intervals)
- Only updates React state when value actually changes
- Progress bar transitions smooth via CSS (`transition-all duration-700`)

**Backend Queries:**
- Convex reactive queries update when data changes (~100ms)
- No polling needed
- Minimal network traffic

### Optimization: Reduce Re-renders

```typescript
// Only update state if tenure changed by more than 0.1
const TENURE_UPDATE_THRESHOLD = 0.1;

const animate = () => {
  const newTenure = /* calculate */;

  setCurrentTenure(prev => {
    if (Math.abs(newTenure - prev) < TENURE_UPDATE_THRESHOLD) {
      return prev; // Skip update if change is tiny
    }
    return newTenure;
  });

  animationFrameId = requestAnimationFrame(animate);
};
```

---

## 7. Testing Checklist

### Visual Sync Tests

- [ ] **Smooth Progress:** Progress bar fills smoothly without jumps (60fps)
- [ ] **Accurate Display:** Tenure value matches expected accumulation
- [ ] **No Backwards Movement:** Progress never decreases (except on level up)
- [ ] **Button Appears:** "Level Up" button shows when `tenure >= maxTenure`

### Browser Event Tests

- [ ] **Browser Close/Reopen:** Tenure resumes from correct value after browser relaunch
- [ ] **Page Refresh:** Progress bar shows accurate tenure immediately after F5
- [ ] **Tab Switch:** Switching away from tab doesn't break accumulation
- [ ] **Background Tab:** Tenure accumulates correctly when tab is backgrounded

### Mek Lifecycle Tests

- [ ] **Unslot:** Tenure freezes when Mek is unslotted
- [ ] **Reslot:** Tenure resumes from frozen value when reslotted
- [ ] **Level Up:** Tenure resets to 0 after successful level up
- [ ] **Max Tenure:** Progress bar stops at 100% (doesn't overflow)

### Buff Tests

- [ ] **Apply Buff:** Progress accelerates smoothly when buff is applied
- [ ] **Remove Buff:** Progress slows smoothly when buff is removed
- [ ] **Multiple Buffs:** Stacking buffs multiply correctly (e.g., 1.5 × 1.2 = 1.8)

### Multi-Tab Tests

- [ ] **Level Up Sync:** Leveling up in Tab A updates Tab B within 1 second
- [ ] **Buff Sync:** Applying buff in Tab A updates rate in Tab B
- [ ] **Unslot Sync:** Unslotting in Tab A freezes tenure in Tab B

### Network Tests

- [ ] **Slow Connection:** Progress continues to accumulate during slow queries
- [ ] **Network Disconnect:** Progress freezes gracefully (no crashes)
- [ ] **Network Reconnect:** Progress resumes from correct value after reconnect

---

## 8. Debugging Tools

### Console Logging Strategy

Use searchable debug tags (from CLAUDE.md):

```typescript
// In useTenureProgress hook
console.log('[🎯TENURE] Baseline update:', {
  tenure: baselineRef.current.tenure,
  timestamp: new Date(baselineRef.current.timestamp).toISOString(),
  rate: baselineRef.current.rate,
  buffMultiplier: baselineRef.current.buffMultiplier
});

console.log('[🎯TENURE] Animation frame:', {
  elapsed: elapsedMs,
  calculated: newTenure,
  clamped: Math.min(newTenure, maxTenure)
});
```

**To debug:**
1. Open browser console
2. Type "TENURE" in filter box
3. See only tenure-related logs

### Convex Dashboard Verification

1. Open Convex dashboard → Data tab → `slots` table
2. Check fields:
   - `accumulatedTenure` (should match expected value)
   - `lastTenureSnapshotTime` (should be recent)
   - `tenureRatePerSecond` (base rate)
   - `tenureRateBuffMultiplier` (buff multiplier)
3. Manually calculate: `accumulatedTenure + (now - lastSnapshot) × rate × multiplier`
4. Verify frontend displays this value

---

## 9. Migration Strategy

### Step 1: Add Schema Fields

```bash
# Run Convex schema migration
npx convex dev
```

Update `convex/schema.ts` with new tenure fields.

### Step 2: Backfill Existing Slots

```typescript
// convex/migrations/addTenureFields.ts
export const backfillTenure = internalMutation({
  handler: async (ctx) => {
    const slots = await ctx.db.query("slots").collect();

    for (const slot of slots) {
      await ctx.db.patch(slot._id, {
        accumulatedTenure: 0,
        lastTenureSnapshotTime: Date.now(),
        tenureRatePerSecond: 1,
        tenureRateBuffMultiplier: 1,
        nextLevelTenure: 1000, // Default tenure for level 2
        currentLevel: 1
      });
    }

    console.log(`Backfilled ${slots.length} slots with tenure fields`);
  }
});
```

Run: `npx convex run migrations/addTenureFields:backfillTenure`

### Step 3: Deploy Hook

Add `src/hooks/useTenureProgress.ts` to codebase.

### Step 4: Integrate into UI

Update slot overlay editor to use `TenureProgressBar` with `useTenureProgress` hook.

### Step 5: Test

Use testing checklist above to verify all scenarios.

---

## 10. Future Enhancements

### Projected Time to Level Up

Display estimated time until level up:

```typescript
const secondsRemaining = (maxTenure - currentTenure) / ratePerSecond;
const minutesRemaining = Math.ceil(secondsRemaining / 60);

// Show in UI: "Level up in ~15 minutes"
```

### Tenure History Graph

Track tenure over time for analytics:

```typescript
// Store tenure snapshots every hour
tenureHistory: [{
  timestamp: number,
  tenure: number,
  level: number
}]
```

### Notifications

Alert user when Mek is ready to level up:

```typescript
useEffect(() => {
  if (isComplete && !previousIsComplete) {
    // Show browser notification
    new Notification('Mek Ready!', {
      body: `${mekName} can now level up!`
    });
  }
}, [isComplete]);
```

---

## Summary

This design provides:
- **Smooth progress:** 60fps visual updates via `requestAnimationFrame`
- **Accurate sync:** Backend calculates current tenure on every query
- **Resilient to events:** Handles unslot, reslot, buffs, level-ups gracefully
- **Multi-tab safe:** Convex reactive queries sync all tabs automatically
- **No jumps:** useRef pattern prevents resets on re-queries
- **Proven pattern:** Matches existing gold/essence systems

The tenure progress bar will feel responsive, accurate, and polished.
