# Mechanism Leveling System Redesign - UPDATED Strategic Analysis

**Date**: November 3, 2025
**Project**: Mek Tycoon
**Database**: wry-trout-962.convex.cloud (SHARED - used by both live site and staging)
**Branch**: custom-minting-system
**Status**: ✅ **BACKEND COMPLETE** | ⏳ **FRONTEND PENDING**

---

## 🚨 CRITICAL DISCOVERY: Backend Already Fully Implemented

### What We Previously Thought:
- Tenure system needed to be designed and built from scratch
- Database migration strategy required
- Complex backend development timeline

### What's Actually True:
**✅ TENURE SYSTEM BACKEND IS 100% COMPLETE AND ACTIVELY WORKING**

**Files Verified:**
- ✅ `convex/tenure.ts` - 777 lines, fully implemented (slotting, leveling, buffs)
- ✅ `convex/lib/tenureCalculations.ts` - 139 lines, all calculation utilities
- ✅ `convex/schema.ts` - Mek table includes all tenure fields
- ✅ `CUSTOM_SLOTS_SYSTEM.md` - Documents the complete system

---

## Executive Summary

**OLD UNDERSTANDING**: Build a new tenure-based leveling system to replace gold-based upgrades.

**NEW REALITY**:
1. ✅ **Tenure backend exists and works perfectly** (offline accumulation, per-Mek tracking, persistence)
2. ⏳ **Only frontend UI is missing** (progress bars, level-up buttons)
3. 🗄️ **Database situation clarified**: Both live + staging use wry-trout-962, fabulous-sturgeon-691 is UNUSED
4. 🎯 **Phase II goal**: Replace gold-leveling UI with tenure UI, then reset all Meks to level 1

---

## 1. Tenure System - Complete Feature Breakdown

### How It Actually Works (Verified from Backend Code)

#### Core Mechanic
- **6 essence slots** where Meks can be placed
- **While slotted**: Mek accumulates tenure at **1 point/second** (buffable)
- **Progress bar** shows tenure toward next level threshold
- **Level thresholds** (admin-configurable):
  - Level 1→2: 1000 tenure (16.7 minutes)
  - Level 2→3: 1500 tenure (25 minutes)
  - Increases each level (configured in admin)
- **When threshold reached**: "Level Up" button appears
- **Clicking button**: FREE upgrade (no gold cost), uses accumulated tenure
- **After upgrade**: SAME SLOT continues accumulating toward next level

#### 5 Critical Requirements (ALL VERIFIED WORKING ✅)

**1. Offline Accumulation** ✅
- **Implementation**: Timestamp-based calculation (identical to gold mining system)
- **Code**: `convex/tenure.ts` lines 42-49
- **Formula**: `currentTenure = savedTenure + ((now - lastUpdate) / 1000 × effectiveRate)`
- **How it works**: No active server process - calculated on-demand when queried
- **Example**: User logs off with Mek at 500 tenure, returns 1 hour later → Mek has 500 + 3600 = 4100 tenure

**2. Per-Mek Tracking** ✅
- **Implementation**: Each Mek has independent fields in database schema
- **Code**: `convex/schema.ts` lines 74-78
- **Storage fields**:
  - `tenurePoints` - Current accumulated value
  - `lastTenureUpdate` - Last snapshot timestamp
  - `isSlotted` - Boolean slot status
  - `slotNumber` - Which slot (1-6)
- **Isolation**: Mek #123's tenure has ZERO effect on Mek #456's tenure

**3. Persistence When Unslotted** ✅
- **Implementation**: Unslot mutation snapshots current tenure before freezing
- **Code**: `convex/tenure.ts` lines 326-336 (unslotMek mutation)
- **How it works**:
  1. Calculate final tenure including all elapsed time: `calculateCurrentTenure()`
  2. Save calculated value to `tenurePoints` field
  3. Set `isSlotted = false`
  4. Mark freeze time with `lastTenureUpdate = now`
- **Example**: Mek with 500 tenure unslotted after gaining 50 more → permanently saved as 550

**4. Freeze When Unslotted** ✅
- **Implementation**: Calculation function checks `isSlotted` before accumulating
- **Code**: `convex/lib/tenureCalculations.ts` lines 41-44
- **How it works**:
  - If `isSlotted = false`, return `savedTenure` immediately (no time calculation)
  - If `isSlotted = true`, calculate `savedTenure + elapsedTime × rate`
- **Example**: Mek with 50 tenure unslotted for 7 days → still shows exactly 50 tenure (frozen)

**5. Resume on Re-Slot** ✅
- **Implementation**: Slot mutation preserves existing tenure value
- **Code**: `convex/tenure.ts` lines 265-270 (slotMek mutation)
- **How it works**:
  1. Set `isSlotted = true`
  2. Set `lastTenureUpdate = now` (start new accumulation period)
  3. **PRESERVE** `tenurePoints` value (don't reset to 0)
  4. Future calculations start from saved value going forward
- **Example**: Mek with 50 tenure reslotted after 1 week → continues from 50, not 0

#### Backend Endpoints (Ready to Use)

**Queries:**
- `getMekWithTenure(mekId)` - Get Mek with real-time calculated tenure
- `getActiveTenureBuffs(mekId)` - Get current buff multipliers
- `getTenureLevelThresholds()` - Get all level requirements
- `getTenureLevelThreshold(level)` - Get specific level requirement
- `getWalletTenureStats(walletAddress)` - Aggregate tenure across all Meks

**Mutations:**
- `slotMek(mekId, slotNumber, walletAddress)` - Start tenure accumulation
- `unslotMek(mekId, walletAddress)` - Freeze tenure at current value
- `levelUpMek(mekId, walletAddress)` - Spend tenure to level up once
- `batchLevelUpMek(mekId, walletAddress, maxLevels)` - Level up multiple times if enough tenure
- `applyTenureBuff(name, scope, multiplier, mekId?, duration?)` - Add tenure rate buff
- `removeTenureBuff(buffId)` - Remove tenure buff

**Admin Mutations:**
- `setTenureLevelThreshold(level, tenureRequired, description?)` - Configure level requirement
- `batchSetTenureLevelThresholds(levels[])` - Bulk configure multiple levels
- `deleteTenureLevelThreshold(level)` - Remove level configuration

#### Calculation Formula

```typescript
effectiveRate = baseRate × (1 + globalBuffs + perMekBuffs)
currentTenure = savedTenure + (elapsedSeconds × effectiveRate)
```

**Example Calculation:**
- Mek has 50 tenure saved
- Slotted 60 seconds ago
- Base rate: 1 tenure/second
- Global buff: +50% (0.5)
- Per-Mek buff: +25% (0.25)
- **Result**: 50 + (60 × 1 × 1.75) = **155 tenure**

---

## 2. Database Reality Check

### Current State (CORRECTED)

**What user told us:**
- Development database: wry-trout-962 (cloud)
- Production database: fabulous-sturgeon-691 (COMPLETELY UNUSED - nothing points to it)
- Both live website AND staging dev site use wry-trout-962

**What .env.local shows:**
```bash
NEXT_PUBLIC_CONVEX_URL=https://wry-trout-962.convex.cloud
```

**Why fabulous-sturgeon-691 exists:**
- Originally intended as production database
- Migration attempt failed previously ("did not work out correctly")
- Now sits empty and unused
- Could potentially be repurposed for staging isolation

### Historical Context

**User's Previous Experience:**
> "Attempted staging database approach before, did not work out correctly"

**Question to Answer:** What specifically failed? Possible issues:
- Schema sync problems between staging and production
- Data migration complexity
- Configuration errors (.env files pointing to wrong DB)
- Convex deployment config issues
- Authentication/permissions problems

---

## 3. Phase II Launch Plan

### What Happens at Phase II Launch

**User's stated goal:**
- All existing Mek levels will **completely reset to level 1**
- Affects all players on the live site
- Gold-based leveling UI replaced with tenure-based UI
- Fresh start for all players with new progression system

### Current Problem

**Shared Database Risk:**
- Both live players (mek.overexposed.io) and staging development use SAME database (wry-trout-962)
- Any schema changes affect live players immediately
- Testing tenure UI could disrupt live gameplay
- Can't safely experiment without production impact

---

## 4. Strategic Options Analysis

### Option A: Migrate Staging to fabulous-sturgeon-691 (The Unused Database)

**Approach:**
1. Point staging site to fabulous-sturgeon-691
2. Clone current data from wry-trout-962 for realistic testing
3. Develop tenure UI on isolated database
4. Test thoroughly without affecting live players
5. When ready, deploy to production and apply changes to wry-trout-962

**Pros:**
- ✅ Clean separation: live vs dev
- ✅ Safe testing without production impact
- ✅ Can experiment freely
- ✅ Database already exists (fabulous-sturgeon-691)
- ✅ Realistic testing with cloned production data

**Cons:**
- ❌ User tried this before and "it did not work out"
- ❌ Unknown why previous attempt failed
- ❌ Data diverges over time (staging ≠ production)
- ❌ More complex deployment (changes tested on different DB)
- ❌ Risk of repeating previous failure

**Critical Question:** What went wrong last time?
- If configuration issue → Can be solved
- If Convex limitation → May not be solvable
- If schema sync problem → Can be managed with scripts
- If user workflow issue → Can be improved

---

### Option B: Feature Flag on Shared Database

**Approach:**
1. Add `featureFlags` table with `tenureUIEnabled: boolean`
2. Build tenure UI alongside existing gold UI
3. Backend checks flag, shows old or new UI accordingly
4. Develop on production database but flag OFF for live users
5. When ready, flip flag ON for all users

**Pros:**
- ✅ No database migration complexity
- ✅ Instant rollback if issues (flip flag OFF)
- ✅ Can test with subset of users first (staged rollout)
- ✅ No risk of repeating previous staging database failure
- ✅ Both systems coexist during development

**Cons:**
- ❌ More complex codebase (two UI paths)
- ❌ More testing required (both code paths must work)
- ❌ Cleanup required after transition (remove old code)
- ❌ Changes still touch production database (risk of accidental exposure)
- ❌ Can't safely test destructive operations (like level reset)

**Timeline:** 2-3 weeks development + 1 week testing

---

### Option C: Local-Only Development with Mock Data

**Approach:**
1. Keep production database untouched
2. Develop tenure UI entirely in local development
3. Use mock/test data for initial development
4. Only test against real database when UI is 90% complete
5. Deploy directly to production when ready

**Pros:**
- ✅ Zero risk to production during development
- ✅ Fast iteration cycle (no database concerns)
- ✅ No database migration needed
- ✅ Avoids repeating previous staging DB failure

**Cons:**
- ❌ Can't test with realistic data until late
- ❌ Higher risk of issues on production deployment
- ❌ May miss edge cases that only appear with real data
- ❌ Less confidence in final product

**Timeline:** 1-2 weeks development + 1 week production testing

---

### Option D: Read-Only Staging Database (Clone Snapshots)

**Approach:**
1. Keep staging on wry-trout-962 (shared)
2. Periodically export snapshots to fabulous-sturgeon-691
3. Use fabulous-sturgeon-691 as read-only test environment
4. Develop UI against read-only data
5. Deploy to wry-trout-962 when ready

**Pros:**
- ✅ Realistic testing with actual production data
- ✅ Safe (read-only, can't break production)
- ✅ No schema sync issues (snapshots)
- ✅ Avoids previous staging DB failures

**Cons:**
- ❌ Can't test mutations (read-only)
- ❌ Manual snapshot process required
- ❌ Data staleness (snapshots lag production)
- ❌ Still need to test mutations on production eventually

**Timeline:** 2 weeks development + 1 week production testing

---

## 5. Recommended Strategy

### RECOMMENDED: **Option B (Feature Flag)** with **Option C (Local Development First)**

**Hybrid Approach:**

**Phase 1: Local Development (Week 1-2)**
- Build tenure UI components with mock data
- No database access required
- Fast iteration on UI/UX
- Zero production risk

**Phase 2: Staging Integration (Week 2-3)**
- Add feature flag to production database
- Flag defaults to FALSE (OFF for live users)
- Integrate tenure UI with backend queries
- Test on staging with flag ON

**Phase 3: Testing & Refinement (Week 3-4)**
- Test all tenure functionality on staging
- Debug issues without affecting live players
- Ensure smooth transitions between old/new UI

**Phase 4: Deployment (Week 4)**
- Deploy to production
- Flip feature flag ON during low-traffic window
- Monitor for issues
- Rollback capability via feature flag

**Phase 5: Cleanup (Week 5+)**
- Remove gold-leveling UI code
- Archive old mutations (preserve in git, don't delete)
- Remove feature flag infrastructure
- Document new system

### Why This Approach Works

**Avoids Previous Staging DB Failure:**
- Don't need separate database
- No migration complexity
- No schema sync issues

**Minimizes Production Risk:**
- Local development first (zero risk)
- Feature flag provides instant rollback
- Can test thoroughly before live exposure

**Maintains Development Velocity:**
- Fast iteration in local development
- Real backend testing when ready
- No waiting for database migrations

**Preserves Flexibility:**
- Can staged rollout (some users first)
- Can A/B test if desired
- Can monitor metrics before full launch

---

## 6. Implementation Plan

### What's Already Done ✅

**Backend (100% Complete):**
- [x] Tenure accumulation system (timestamp-based, offline-capable)
- [x] Per-Mek tracking with independent fields
- [x] Persistence across unslot/reslot cycles
- [x] Freeze when unslotted, resume when reslotted
- [x] Manual level-up mutations (levelUpMek, batchLevelUpMek)
- [x] Buff system (global and per-Mek tenure rate multipliers)
- [x] Admin configuration (level thresholds, buff management)
- [x] All queries and mutations tested and working

### What's Missing ⏳

**Frontend (0% Complete):**
- [ ] Tenure progress bar component (3 visual variants: minimal, standard, detailed)
- [ ] Level-up button component
- [ ] Real-time tenure display (updates every second)
- [ ] Integration into slot UI (essence slots page)
- [ ] Admin UI for editing tenure level thresholds
- [ ] Admin UI for managing tenure buffs
- [ ] Migration of existing gold-leveling UI to tenure UI

**Migration Tasks:**
- [ ] Remove/hide gold upgrade buttons from Mek cards
- [ ] Add tenure progress bars to essence slots
- [ ] Add "Level Up" buttons when tenure threshold reached
- [ ] Update Mek level display to show tenure-based levels
- [ ] Handle the "big reset" to level 1 for all players

---

## 7. Frontend Development Tasks

### Task 1: Tenure Progress Bar Component

**File:** `src/components/TenureProgressBar.tsx`

**Requirements:**
- Real-time updates (every second)
- Shows current tenure / required tenure
- Percentage-based progress bar
- Visual variants: minimal, standard, detailed
- Industrial aesthetic (matches site design system)
- Smooth animations

**Data Sources:**
- `getMekWithTenure(mekId)` - Real-time tenure value
- `getTenureLevelThreshold(nextLevel)` - Required tenure for next level
- `getActiveTenureBuffs(mekId)` - Current buff multipliers

**Visual Variants:**
1. **Minimal** (160px): Compact single-line progress bar
2. **Standard** (224px): Full industrial frame with percentage
3. **Detailed** (288px): Premium design with hazard stripes and effects

---

### Task 2: Level-Up Button Component

**File:** `src/components/LevelUpButton.tsx`

**Requirements:**
- Appears when tenure ≥ threshold
- Calls `levelUpMek` mutation on click
- Shows tenure cost and new level
- Optimistic UI update
- Error handling (insufficient tenure, server errors)
- Success feedback animation

**States:**
- Hidden: tenure < threshold
- Ready: tenure ≥ threshold, shows "Level Up to {nextLevel}"
- Loading: mutation in progress
- Success: brief success animation, then hidden (new threshold)
- Error: shows error message, retry button

---

### Task 3: Slot UI Integration

**File:** `src/app/essence-slots/page.tsx` (or equivalent)

**Changes Required:**
1. Add tenure progress bar to each slot
2. Position "Level Up" button below progress bar
3. Show current Mek level
4. Display tenure rate (with buffs)
5. Show time remaining to next level (optional)

**Layout:**
```
┌─────────────────────────┐
│   [Mek Thumbnail]       │
│                         │
│   Mek #123 - Level 5    │
│                         │
│   Tenure: 1250 / 2000   │
│   ████████░░░░░░ 62.5%  │
│                         │
│   [Level Up to 6]       │ ← Appears when tenure ≥ 2000
│                         │
│   Rate: 1.5 tenure/sec  │ ← With buffs applied
│   Time to level: 8m 20s │ ← Optional
└─────────────────────────┘
```

---

### Task 4: Remove Gold Leveling UI

**Files to Modify:**
- `src/components/MekCard/*.tsx` - Remove upgrade button
- `src/components/MechanismGridLightbox.tsx` - Update level display logic
- `src/app/page.tsx` - Remove upgrade UI or repurpose

**Changes:**
- Hide/remove "Upgrade" button on Mek cards
- Remove gold cost display
- Remove "Insufficient gold" error messages
- Keep level indicator squares (10 squares) - now shows tenure-based levels
- Keep gold/hr display (still relevant for mining)

**Don't Delete:** Preserve old code in git history, don't remove files entirely

---

### Task 5: Admin UI for Tenure Configuration

**File:** `src/app/admin-tenure/page.tsx` (new)

**Features:**
- View all level thresholds (1-10)
- Edit tenure requirement for each level
- Add description to levels
- Batch update multiple levels
- Preview calculations (time to level at base rate)

**Data Sources:**
- `getTenureLevelThresholds()` - All current thresholds
- `setTenureLevelThreshold()` - Update single level
- `batchSetTenureLevelThresholds()` - Update multiple levels

**Example UI:**
```
Level | Tenure Required | Time at Base Rate | Description
------|----------------|-------------------|-------------
  1   |       0        |        0m         | Starting level
  2   |     1,000      |      16m 40s      | First upgrade
  3   |     1,500      |      25m 00s      | Second upgrade
  4   |     2,200      |      36m 40s      | Third upgrade
 ...  |      ...       |       ...         | ...
 10   |    50,000      |     13h 53m       | Max level
```

---

## 8. The "Big Reset" - Phase II Launch Strategy

### What Needs to Happen

**On Phase II Launch Day:**
1. All Mek levels reset to 1
2. All tenure points reset to 0
3. Gold-leveling UI completely removed
4. Tenure-leveling UI goes live
5. Player announcement explaining changes

### Migration Options

**Option A: Hard Reset (Recommended)**
```typescript
// Migration script
export const resetAllMeksToLevelOne = internalMutation({
  handler: async (ctx) => {
    const allMeks = await ctx.db.query("meks").collect();

    for (const mek of allMeks) {
      await ctx.db.patch(mek._id, {
        level: 1,
        tenurePoints: 0,
        lastTenureUpdate: Date.now(),
      });
    }

    // Archive old mekLevels data (don't delete)
    const allMekLevels = await ctx.db.query("mekLevels").collect();
    // ... export to JSON or mark as archived
  }
});
```

**Pros:**
- ✅ Clean slate for all players
- ✅ No legacy data complications
- ✅ Fair restart for everyone

**Cons:**
- ❌ Players lose their hard-earned levels
- ❌ May frustrate players who invested heavily

---

**Option B: Preserve Levels, Reset Tenure**
```typescript
// Keep current levels, just start tenure from 0
export const preserveLevelsResetTenure = internalMutation({
  handler: async (ctx) => {
    const allMeks = await ctx.db.query("meks").collect();

    for (const mek of allMeks) {
      await ctx.db.patch(mek._id, {
        tenurePoints: 0,
        lastTenureUpdate: Date.now(),
        // Keep existing level
      });
    }
  }
});
```

**Pros:**
- ✅ Respects existing player investment
- ✅ Less player frustration

**Cons:**
- ❌ Not a "fresh start" as user described
- ❌ Legacy levels mixed with new tenure system

---

**Option C: Convert Gold Spent to Tenure Bonus**
```typescript
// Give starting tenure based on gold previously spent
export const convertGoldSpentToTenure = internalMutation({
  handler: async (ctx) => {
    const allMekLevels = await ctx.db.query("mekLevels").collect();

    for (const mekLevel of allMekLevels) {
      const mek = await getMekByAssetId(ctx, mekLevel.assetId);
      if (!mek) continue;

      // 1 gold spent = 10 tenure points (configurable)
      const bonusTenure = mekLevel.totalGoldSpent * 10;

      await ctx.db.patch(mek._id, {
        level: 1, // Reset level
        tenurePoints: bonusTenure, // Give bonus tenure
        lastTenureUpdate: Date.now(),
      });
    }
  }
});
```

**Pros:**
- ✅ Compensates players for previous investment
- ✅ Fresh levels but headstart based on effort

**Cons:**
- ❌ Complex conversion rate calculation
- ❌ Not truly a "reset" as user described

---

### Recommended: **Option A (Hard Reset)** with **Advance Warning**

**Why:**
- User explicitly stated "all existing Mek levels will completely reset to level 1"
- Clean slate aligns with "Phase II" branding (new era)
- Fair for all players (everyone starts equal)

**Player Communication:**
```
🚀 MEK TYCOON PHASE II - MAJOR UPDATE COMING SOON

NEW LEVELING SYSTEM:
• All Mek levels will reset to 1 (fresh start for everyone!)
• New time-based progression (no more gold costs!)
• Level up passively while Meks are slotted
• Faster progression for active players

WHEN: [Date/Time]
DURATION: ~2 hours maintenance

WHAT TO EXPECT:
• Your Meks will return to level 1
• Gold balances unchanged
• Essence system unchanged
• Exciting new progression mechanics!

Thank you for your patience as we improve the game!
```

---

## 9. Risk Assessment

### High-Risk Areas

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Feature flag fails, exposes unfinished UI to live players | Low | High | Thorough testing, default flag OFF, immediate rollback plan |
| Real-time tenure updates cause performance issues | Medium | Medium | Optimize queries, use client-side caching, throttle updates |
| Players revolt against level reset | High | Medium | Clear communication, exciting new features, advance warning |
| Tenure calculation bugs (offline accumulation wrong) | Low | Critical | Backend already tested and working, verify edge cases |
| UI doesn't match industrial design system | Medium | Low | Use existing components as reference, design review before deployment |
| Database snapshot timing issues | Low | Low | Not using snapshots (feature flag approach) |

---

## 10. Timeline Estimate

**Assumptions:**
- Tenure backend is complete (verified ✅)
- Focus is purely frontend development
- Using feature flag approach (no database migration)
- 1 developer working on this

### Week 1: Core Components (5 days)
- **Day 1-2**: Tenure Progress Bar component (3 visual variants)
- **Day 3**: Level-Up Button component
- **Day 4-5**: Integration into slot UI, real-time updates

### Week 2: UI Migration (5 days)
- **Day 1-2**: Remove/hide gold-leveling UI
- **Day 3**: Admin UI for tenure configuration
- **Day 4**: Testing and bug fixes
- **Day 5**: Polish and refinements

### Week 3: Testing & Deployment (5 days)
- **Day 1-2**: End-to-end testing on staging (feature flag OFF for live)
- **Day 3**: Production deployment (code + feature flag infrastructure)
- **Day 4**: Flip feature flag ON during low-traffic window
- **Day 5**: Monitor, fix urgent issues

### Week 4: Migration & Cleanup (3-5 days)
- **Day 1**: Execute "big reset" migration (all Meks to level 1)
- **Day 2**: Remove old gold-leveling code
- **Day 3**: Remove feature flag infrastructure
- **Day 4-5**: Documentation and retrospective

**Total Timeline: 3-4 weeks**

---

## 11. Open Questions for User

### IMMEDIATE (Need Answers Before Starting):

1. **Database Strategy**: Given that previous staging database attempt "did not work out," what specifically went wrong?
   - Configuration issue?
   - Convex limitation?
   - Schema sync problem?
   - User workflow issue?

2. **Development Approach**: Which strategy do you prefer?
   - **Option B**: Feature flag on shared database (recommended)
   - **Option A**: Retry staging database migration (risky given previous failure)
   - **Option C**: Local development with mock data first

3. **Level Reset Timing**: When do you want to execute the "all Meks to level 1" reset?
   - At Phase II launch (3-4 weeks from now)?
   - Later, after tenure UI is stable?
   - Staged rollout (some players first)?

4. **Player Communication**: How much advance warning should players get about the level reset?
   - 1 week notice?
   - 2 weeks notice?
   - Surprise launch?

### NICE TO HAVE (Can Decide During Dev):

5. **Visual Design**: Which tenure progress bar variant should be default?
   - Minimal (compact)?
   - Standard (balanced)?
   - Detailed (premium)?

6. **Tenure Display Frequency**: How often should tenure update in UI?
   - Every second (smooth but resource-intensive)?
   - Every 5 seconds (balanced)?
   - Every 10 seconds (efficient but less responsive)?

7. **Level Thresholds**: Are the current values (1000, 1500, etc.) final?
   - Or should they be adjusted based on playtesting?

8. **Gold Refund**: Should players get any compensation for gold spent on old leveling system?
   - No refund (clean slate)?
   - Full refund (reimburse all gold spent)?
   - Partial refund (50%)?

---

## 12. Success Metrics

### Technical Success:
- ✅ Zero data loss during migration
- ✅ Tenure accumulates correctly offline (already verified)
- ✅ Real-time UI updates without performance degradation
- ✅ <2% error rate on level-up mutations
- ✅ Feature flag rollback works if needed

### Player Success:
- >70% player engagement with tenure system (within 1 week)
- <20% increase in support tickets
- Player sentiment score >6/10 (survey)
- No mass exodus of active players
- Positive feedback on new progression system

### Business Success:
- Feature shipped within 3-4 weeks
- Minimal technical debt introduced
- Clear documentation for future maintenance
- Successful "Phase II" launch branding

---

## 13. Next Steps

### Immediate Actions (This Week):

1. **User Decision**: Choose database strategy (Option A vs B vs C)
2. **Clarify Failure**: Understand what went wrong with previous staging DB attempt
3. **Confirm Timeline**: Agree on 3-4 week timeline and Phase II launch date
4. **Player Communication**: Draft announcement for level reset

### Development Start (After Decisions Made):

1. **Week 1**: Build core tenure UI components (progress bar, level-up button)
2. **Week 2**: Integrate into slot UI, remove gold-leveling UI
3. **Week 3**: Testing and deployment with feature flag
4. **Week 4**: Migration, cleanup, Phase II launch

---

## 14. Conclusion

**Key Takeaways:**

1. ✅ **Backend is DONE** - Tenure system fully implemented and working
2. ⏳ **Frontend is PENDING** - Only UI components need development
3. 🗄️ **Database is SHARED** - Both live and staging use wry-trout-962
4. 🎯 **Goal is CLEAR** - Replace gold UI with tenure UI, reset to level 1
5. ⚠️ **Risk is MANAGEABLE** - Feature flag provides safe development path

**Recommended Approach:**
- Use **Feature Flag** strategy (Option B) to avoid previous database migration failure
- Develop locally first (Option C) for fast iteration
- Test on production with flag OFF for live users
- Deploy and flip flag ON when ready
- Execute "big reset" after stable

**Timeline:** 3-4 weeks to Phase II launch

**Next Step:** Get user's answers to critical questions, then proceed with development.

---

**END OF STRATEGIC ANALYSIS**

**Status**: ✅ Backend Complete | ⏳ Frontend Pending | 🎯 Ready to Build
