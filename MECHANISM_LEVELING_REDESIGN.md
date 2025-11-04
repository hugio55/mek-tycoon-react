# Mechanism Leveling System Redesign - Planning Document

**Date**: November 3, 2025
**Project**: Mek Tycoon
**Database**: wry-trout-962.convex.cloud (PRODUCTION - SHARED with live players)
**Branch**: custom-minting-system

---

## Executive Summary

**Current System**: Players pay gold to upgrade mechanisms from level 1 to 10, each level providing percentage-based gold/hr boosts.

**New System**: Remove gold-based mechanism upgrades entirely. Upgrades will instead happen "on the slots" (essence slots), not on mechanisms themselves.

**Critical Constraint**: Currently operating on SHARED production database. Any changes affect live players immediately. Must ensure zero disruption to active gameplay while developing new system.

---

## 1. Current System Analysis

### 1.1 How Mechanism Leveling Currently Works

#### Database Schema (`convex/schema.ts`)

**mekLevels Table**:
```
- walletAddress: string (owner)
- assetId: string (unique Mek identifier)
- currentLevel: number (1-10)
- totalGoldSpent: number (cumulative gold invested)
- baseGoldPerHour: number (original rate from rarity)
- currentBoostPercent: number (0% at L1, up to 1400% at L10)
- currentBoostAmount: number (actual gold/hr boost)
- levelAcquiredAt: timestamp
- ownershipStatus: "verified" | "transferred"
```

**goldMining.ownedMeks** (nested in goldMining table):
```
- assetId: string
- goldPerHour: number (effective rate = base + boost)
- baseGoldPerHour: number (original rarity-based rate)
- currentLevel: number (1-10, synced from mekLevels)
- levelBoostPercent: number (synced from mekLevels)
- levelBoostAmount: number (synced from mekLevels)
- effectiveGoldPerHour: number (base + boost)
```

**levelUpgrades Table** (transaction log):
```
- upgradeId: string
- walletAddress: string
- assetId: string
- fromLevel: number
- toLevel: number
- goldSpent: number
- timestamp: number
```

#### Gold Cost Structure (`convex/mekLeveling.ts`)
```
Level 1 → 2:    100 gold
Level 2 → 3:    250 gold
Level 3 → 4:    500 gold
Level 4 → 5:   1000 gold
Level 5 → 6:   2000 gold
Level 6 → 7:   4000 gold
Level 7 → 8:   8000 gold
Level 8 → 9:  16000 gold
Level 9 → 10: 32000 gold
Total L1→L10: 63,850 gold
```

#### Boost Percentages
```
Level 1:     0% boost
Level 2:    25% boost
Level 3:    60% boost
Level 4:   110% boost
Level 5:   180% boost
Level 6:   270% boost
Level 7:   400% boost
Level 8:   600% boost
Level 9:   900% boost
Level 10: 1400% boost
```

**Example**: A Mek with 10 gold/hr base rate:
- Level 1: 10 gold/hr (no boost)
- Level 5: 10 + (10 × 180%) = 28 gold/hr
- Level 10: 10 + (10 × 1400%) = 150 gold/hr

#### Key Functions (`convex/mekLeveling.ts`)
- `upgradeMekLevel()` - Main mutation that:
  1. Validates wallet owns Mek
  2. Checks current level < 10
  3. Calculates upgrade cost
  4. Verifies sufficient gold balance
  5. Deducts gold from wallet
  6. Updates mekLevels table
  7. Updates goldMining.ownedMeks array
  8. Logs transaction to levelUpgrades
  9. Recalculates total wallet gold/hr rate

- `getMekLevels()` - Query to fetch all Mek levels for a wallet
- `calculateLevelBoost()` - Computes boost % and amount
- `calculateUpgradeCost()` - Returns gold cost for next level

#### Frontend Integration (`src/app/page.tsx`, `src/components/MechanismGridLightbox.tsx`)
- **MekCard Component**: Shows 10 level squares, current level, upgrade button
- **MechanismGridLightbox**: Grid view with search/sort, supports bulk operations
- **Upgrade Flow**:
  1. User clicks "Upgrade" button on Mek card
  2. Frontend calls `upgradeMekLevel` mutation
  3. Gold deducted with animation
  4. Level squares fill with color progression
  5. Gold/hr display updates with animation
  6. Success feedback shown

### 1.2 What "Slots" Refer To (User's Hint)

**Essence Slots System** (`convex/schema.ts`, `convex/tenure.ts`):

The game has a separate "essence slot" system where:
- Players have 6 essence slots (configurable, can be unlocked/upgraded)
- Meks can be "slotted" into essence slots
- While slotted, Meks accumulate **tenure points** (1 point/second)
- Tenure points are used for the essence system (buff system)

**Relevant Schema Fields** (`meks` table):
```
- tenurePoints: number (accumulated while slotted)
- lastTenureUpdate: timestamp
- isSlotted: boolean (whether Mek is in a slot)
- slotNumber: number (1-6, which slot if slotted)
```

**Current Slot System Functions** (`convex/tenure.ts`):
- `slotMek()` - Assigns Mek to slot, starts tenure accumulation
- `unslotMek()` - Removes Mek from slot, stops tenure accumulation
- Tenure accumulates passively: `points = (currentTime - lastUpdate) × 1 point/sec`

**User's Hint Interpretation**:
> "upgrades will be happening on the slots"

This likely means:
- Instead of upgrading individual mechanisms (Meks), players will upgrade **slots**
- A slot upgrade might boost ALL Meks that have been slotted there
- Or: Slot upgrades unlock new capabilities/multipliers for slotted Meks
- Or: Slot levels determine maximum Mek level allowed in that slot

---

## 2. What Must Change

### 2.1 Database Schema Changes

#### REMOVE (or deprecate):
- `mekLevels` table fields related to gold spending:
  - `totalGoldSpent` - No longer tracking gold investment per Mek

#### PRESERVE (mechanisms still have conceptual levels):
- `mekLevels.currentLevel` (1-10) - Still exists, but NOT upgraded via gold
- `mekLevels.baseGoldPerHour` - Base rate from rarity
- `mekLevels.currentBoostPercent` - Boost percentage (source changes)
- `mekLevels.currentBoostAmount` - Boost amount (source changes)
- `goldMining.ownedMeks` level fields - For display purposes

#### ADD (for new slot-based system):
Depending on final design, potentially:
- `essenceSlots.slotLevel` - Level of each essence slot (1-10?)
- `essenceSlots.slotUpgradeCost` - Cost to upgrade slot (if applicable)
- `essenceSlots.slotBoostMultiplier` - Boost applied to slotted Meks
- OR: New table `slotUpgrades` to track slot progression
- OR: New table `slotBoosts` to define boost rules per slot level

**Design Decision Needed**: What exactly does "slot-based upgrade" mean?
- Option A: Slots have levels, slotted Meks inherit slot's level boost
- Option B: Slots unlock Mek upgrade potential (Mek must be slotted to upgrade)
- Option C: Slots provide passive multipliers to all Meks ever slotted there
- **User must clarify design intent before implementation**

### 2.2 Backend Logic Changes

#### REMOVE:
- `convex/mekLeveling.ts`:
  - `upgradeMekLevel()` mutation - Core gold-spending upgrade function
  - `UPGRADE_COSTS` array - Gold cost structure
  - `calculateUpgradeCost()` - Cost calculation
  - `levelUpgrades` table writes - Transaction logging

#### MODIFY:
- `calculateLevelBoost()` - Keep function, change how level is determined
  - Currently: Based on mekLevels.currentLevel
  - New: Based on slot level (or other new source)

- `goldMining.initializeGoldMining()` - No longer sync level boost data from mekLevels
- `goldMining.getGoldMiningData()` - Recalculate boosts from new source

#### ADD:
- New mutations for slot upgrading (if slot-based)
- New queries for slot upgrade costs/benefits
- New logic for determining Mek effective level based on slot

### 2.3 Frontend Changes

#### REMOVE from UI:
- Upgrade button on MekCard (or repurpose it)
- Gold cost display on upgrade button
- "Insufficient gold" error messages
- Upgrade transaction animations for Meks

#### MODIFY in UI:
- Level indicator squares (10 squares) - Still show level, but not clickable
- Gold/hr display - Still shows boosted rate, but source changes
- Mechanism grid - Still shows levels, but upgrades happen elsewhere

#### ADD to UI:
- Slot upgrade interface (new page/modal)
- Slot level indicators
- Slot upgrade costs (if applicable - may not be gold)
- Visual connection between slots and Mek boosts

---

## 3. Critical Risk: Production Database

### 3.1 Current State
- **Database**: wry-trout-962.convex.cloud (PRODUCTION)
- **Live Players**: Active users earning gold, upgrading Meks, playing game
- **Data at Risk**:
  - User gold balances (must not be corrupted)
  - Mek levels (players have invested gold to reach current levels)
  - Gold/hr rates (must remain accurate during transition)
  - Transaction history (levelUpgrades table contains spending records)

### 3.2 Migration Strategy Options

#### Option A: Feature Flag (Safest for Live Environment)
**Approach**: Keep both systems running, use feature flag to switch

**Implementation**:
1. Add `featureFlags` table with `slotBasedUpgrades: boolean`
2. Build new slot upgrade system ALONGSIDE existing system
3. Backend: Check flag, route to old or new upgrade logic
4. Frontend: Show old or new UI based on flag
5. When new system ready: Flip flag for all users
6. After stable period: Remove old code

**Pros**:
- Zero disruption to live players during development
- Instant rollback if new system has issues
- Can test new system with subset of users first

**Cons**:
- More complex codebase (two systems coexist)
- More testing required (both code paths)
- Cleanup required after transition

**Timeline**: 3-4 weeks development + 1-2 weeks testing

---

#### Option B: Separate Staging Database (Recommended for Major Changes)
**Approach**: Clone production to staging, develop on staging, migrate back

**Implementation**:
1. Create NEW Convex project: `mek-tycoon-staging`
2. Copy current production data to staging (manual export/import)
3. Configure .env.local to point to staging:
   ```
   NEXT_PUBLIC_CONVEX_URL=https://staging-database.convex.cloud
   ```
4. Develop all changes on staging database
5. Test with fake/test wallets on staging
6. When ready: Deploy to production in low-traffic window
7. Migration script to preserve live player data

**Pros**:
- Complete isolation from live players
- Freedom to experiment without risk
- Can reset staging database freely
- Matches project instructions (user mentioned "staging database")

**Cons**:
- Requires Convex project setup (may cost money if beyond free tier)
- Data divergence (staging != production over time)
- Migration complexity on final deployment

**Timeline**: 1 week setup + 2-3 weeks development + 1 week migration

---

#### Option C: Maintenance Window + Rapid Migration
**Approach**: Announce downtime, migrate quickly, restore service

**Implementation**:
1. Announce maintenance window (e.g., "Game offline 2 hours on Saturday")
2. Take snapshot of production database
3. Deploy new code + run migration scripts
4. Test critical paths
5. Bring game back online
6. Monitor for issues

**Pros**:
- Clean cutover, no dual systems
- Faster than maintaining two code paths

**Cons**:
- Downtime annoys players
- High pressure/risk if migration fails
- No rollback without restoring backup

**Timeline**: 2-3 weeks development + 2-4 hour maintenance window

---

#### Option D: Gradual Deprecation (Hybrid Approach)
**Approach**: Stop new gold upgrades, introduce slot system, grandfather existing levels

**Implementation**:
1. Immediately: Disable `upgradeMekLevel()` mutation (return "Feature deprecated")
2. Frontend: Hide upgrade buttons, show "Coming Soon: Slot Upgrades"
3. Preserve all existing Mek levels (don't reset)
4. Build new slot system
5. New system determines FUTURE boosts, old levels preserved as baseline

**Pros**:
- Respects players' existing investments
- No complex data migration
- Clear communication to players

**Cons**:
- Players stuck at current levels during development
- May cause frustration ("I can't upgrade!")
- Old level data persists forever

**Timeline**: 2-3 weeks development

---

### 3.3 Recommended Approach

**RECOMMENDED: Option B (Staging Database) + Option D (Graceful Deprecation)**

**Phase 1: Immediate (This Week)**
- Disable `upgradeMekLevel()` mutation with message:
  ```
  "Mechanism upgrades are being redesigned! Your current levels are preserved.
  A new slot-based upgrade system is coming soon."
  ```
- Hide upgrade buttons in UI
- Preserve all existing Mek levels and gold balances
- Communicate to players: "Temporary pause on upgrades for exciting new feature"

**Phase 2: Development (Weeks 1-3)**
- Set up staging Convex database
- Clone current production data for testing
- Build new slot upgrade system on staging
- Test with mock wallets
- Iterate on design based on testing

**Phase 3: Migration (Week 4)**
- Deploy new code to production
- Run migration script to preserve existing Mek levels
- Enable new slot upgrade system
- Monitor for 48 hours

**Phase 4: Cleanup (Week 5+)**
- Remove deprecated `upgradeMekLevel` code
- Archive `levelUpgrades` table (keep for records)
- Document new system

---

## 4. Design Questions for User

**Before implementation can begin, need answers to:**

### 4.1 Slot Upgrade Mechanics
**Q1**: What exactly are players upgrading when they upgrade a slot?
- A) Slot has levels 1-10, provides boost multiplier to slotted Mek?
- B) Slot unlocks Mek upgrade potential (Mek must be in slot to level up)?
- C) Slot provides tenure accumulation rate bonus?
- D) Something else?

**Q2**: What is the cost to upgrade a slot?
- A) Gold (same as old Mek upgrade costs)?
- B) Tenure points?
- C) Essence (from essence system)?
- D) New currency/resource?
- E) Combination of resources?

**Q3**: How many slots can be upgraded?
- A) All 6 essence slots can be upgraded independently?
- B) Global slot level (all slots share same level)?
- C) Only certain slots can be upgraded?

**Q4**: How do slot upgrades affect Meks?
- A) Slotted Mek inherits slot's level boost while slotted
- B) Mek permanently gains boost after being in upgraded slot for X time
- C) Slot upgrade provides passive bonus to ALL Meks that have ever been slotted there
- D) Slot upgrade increases tenure accumulation rate (indirect benefit)

### 4.2 Existing Player Data
**Q5**: What happens to existing Mek levels (1-10) that players paid gold for?
- A) Reset all Meks to level 1 (refund gold spent)?
- B) Preserve levels as "legacy levels" (grandfathered boosts)?
- C) Convert Mek levels to slot levels (Mek level becomes slot's level)?
- D) Ignore existing levels, new system completely separate?

**Q6**: What about the gold players spent on upgrades (63,850 gold to max a Mek)?
- A) Refund all gold spent on upgrades?
- B) Convert to new currency (e.g., tenure points)?
- C) No refund/compensation (accept as sunk cost)?
- D) Provide equivalent boost in new system?

### 4.3 UI/UX
**Q7**: Where do players access slot upgrades?
- A) On the essence slots page (existing essence system page)?
- B) New dedicated "Slot Upgrades" page?
- C) From hub/main menu?

**Q8**: How are Mek levels displayed after this change?
- A) Meks still show 10 level squares, but level determined by slot?
- B) Remove level display from Meks entirely?
- C) Show both Mek level (static) and slot level (dynamic)?

---

## 5. Proposed Architecture (Pending User Answers)

**Assumption**: Slots have levels 1-10, provide boost to slotted Meks

### 5.1 New Database Schema

```typescript
// convex/schema.ts

essenceSlots: defineTable({
  walletAddress: v.string(),
  slotNumber: v.number(), // 1-6
  slotLevel: v.number(), // 1-10 (new field)
  mekAssetId: v.optional(v.string()), // Currently slotted Mek
  totalUpgradesCost: v.number(), // Total resources spent upgrading this slot
  lastUpgraded: v.number(), // Timestamp of last upgrade
  // ... existing tenure fields
})

slotUpgrades: defineTable({
  upgradeId: v.string(),
  walletAddress: v.string(),
  slotNumber: v.number(),
  fromLevel: v.number(),
  toLevel: v.number(),
  costPaid: v.number(), // Gold/tenure/essence spent
  costType: v.string(), // "gold" | "tenure" | "essence"
  timestamp: v.number(),
})

// MODIFY existing mekLevels table
mekLevels: defineTable({
  // ... existing fields
  levelSource: v.string(), // "legacy" | "slot" | "manual"
  // Marks whether level is from old system or new slot system
})
```

### 5.2 New Backend Functions

```typescript
// convex/slotUpgrades.ts (new file)

export const upgradeSlot = mutation({
  args: {
    walletAddress: v.string(),
    slotNumber: v.number(),
  },
  handler: async (ctx, args) => {
    // 1. Get slot record
    // 2. Check current level < 10
    // 3. Calculate upgrade cost
    // 4. Verify player has resources
    // 5. Deduct cost
    // 6. Increment slotLevel
    // 7. Log upgrade transaction
    // 8. If Mek is slotted, recalculate its boost
  }
});

export const getSlotLevel = query({
  args: {
    walletAddress: v.string(),
    slotNumber: v.number(),
  },
  handler: async (ctx, args) => {
    // Return slot level and current boost multiplier
  }
});

export const calculateSlotBoost = (slotLevel: number, baseMekRate: number) => {
  // Use same boost percentages as old system
  // Or new formula if desired
  const percentages = [0, 25, 60, 110, 180, 270, 400, 600, 900, 1400];
  const percent = percentages[slotLevel - 1] || 0;
  const amount = (baseMekRate * percent) / 100;
  return { percent, amount };
};
```

### 5.3 Modified Existing Functions

```typescript
// convex/goldMining.ts - getGoldMiningData()

// BEFORE: Read mekLevels table for boost data
// AFTER: Read essenceSlots table for boost data

export const getGoldMiningData = query({
  handler: async (ctx, args) => {
    // ... existing logic

    // For each owned Mek:
    const slot = await ctx.db
      .query("essenceSlots")
      .filter(q => q.eq(q.field("mekAssetId"), mek.assetId))
      .first();

    if (slot && slot.slotLevel > 1) {
      const boost = calculateSlotBoost(slot.slotLevel, mek.baseGoldPerHour);
      mek.goldPerHour = mek.baseGoldPerHour + boost.amount;
      mek.currentLevel = slot.slotLevel; // Display slot level as Mek level
    } else {
      mek.goldPerHour = mek.baseGoldPerHour; // No boost if not slotted
      mek.currentLevel = 1;
    }
  }
});
```

### 5.4 Frontend Changes

```typescript
// New component: SlotUpgradePanel.tsx

export function SlotUpgradePanel({ walletAddress, slotNumber }) {
  const slot = useQuery(api.slotUpgrades.getSlotLevel, { walletAddress, slotNumber });
  const upgradeSlot = useMutation(api.slotUpgrades.upgradeSlot);

  return (
    <div>
      <h3>Essence Slot {slotNumber}</h3>
      <div>Current Level: {slot?.slotLevel || 1}</div>
      <div>Boost: {slot?.boostPercent || 0}%</div>
      {slot?.slotLevel < 10 && (
        <button onClick={() => upgradeSlot({ walletAddress, slotNumber })}>
          Upgrade to Level {slot.slotLevel + 1}
          (Cost: {calculateUpgradeCost(slot.slotLevel)} gold)
        </button>
      )}
    </div>
  );
}
```

---

## 6. Migration Plan

### 6.1 Data Preservation Strategy

**Goal**: Ensure no player loses existing Mek levels or gold balances

**Approach**:
1. Create snapshot of production database BEFORE any changes
2. Mark all existing `mekLevels` records with `levelSource: "legacy"`
3. Preserve `currentLevel` field (players keep their hard-earned levels)
4. NEW system: Slot levels start at 1 (players build from scratch)
5. Mek's EFFECTIVE level = max(legacyLevel, slotLevel)
   - If player had Mek at level 7, it stays level 7
   - If they upgrade slot to level 10, Mek becomes level 10
   - This respects old investment while allowing new progression

**Refund Strategy** (if user wants to refund gold):
- Calculate total gold spent per wallet: `sum(levelUpgrades.goldSpent)`
- Add to `goldMining.accumulatedGold`
- Log refund transaction
- Send in-game notification: "Your gold from old upgrades has been refunded!"

### 6.2 Migration Script

```typescript
// convex/migrations.ts - migrateMekLevelingToSlots()

export const migrateMekLevelingToSlots = internalMutation({
  handler: async (ctx) => {
    console.log("🚀 MIGRATION START: Mek Leveling → Slot Upgrades");

    // 1. Mark all existing mekLevels as legacy
    const allMekLevels = await ctx.db.query("mekLevels").collect();
    for (const level of allMekLevels) {
      await ctx.db.patch(level._id, {
        levelSource: "legacy"
      });
    }

    // 2. Initialize all essence slots to level 1
    const allSlots = await ctx.db.query("essenceSlots").collect();
    for (const slot of allSlots) {
      await ctx.db.patch(slot._id, {
        slotLevel: 1,
        totalUpgradesCost: 0,
        lastUpgraded: Date.now()
      });
    }

    // 3. (Optional) Refund gold spent on upgrades
    if (SHOULD_REFUND_GOLD) {
      const allWallets = await ctx.db.query("goldMining").collect();
      for (const wallet of allWallets) {
        const totalSpent = await calculateTotalGoldSpentOnUpgrades(wallet.walletAddress);
        await ctx.db.patch(wallet._id, {
          accumulatedGold: wallet.accumulatedGold + totalSpent
        });
      }
    }

    console.log("✅ MIGRATION COMPLETE");
  }
});
```

### 6.3 Rollback Plan

**If migration fails or new system has critical bugs:**

1. **Immediate Rollback**:
   - Revert to previous git commit
   - Redeploy old codebase
   - Restore database from snapshot (if corrupted)
   - Re-enable old upgrade system

2. **Data Recovery**:
   - Convex provides 7-day history (can restore to earlier state)
   - Local backups from migration script
   - levelUpgrades table preserves all transaction history

3. **Communication**:
   - Announce rollback to players
   - Explain issue and timeline for fix
   - Compensate affected players (e.g., bonus gold)

---

## 7. Testing Strategy

### 7.1 Staging Environment Testing

**Phase 1: Data Integrity**
- Create 10 test wallets on staging
- Assign Meks at various levels (L1, L5, L10)
- Run migration script
- Verify all data preserved correctly
- Verify gold balances unchanged (or refunded correctly)

**Phase 2: Functional Testing**
- Test slot upgrade flow (L1 → L10)
- Test cost calculations
- Test boost calculations
- Test slotting/unslotting Meks
- Test edge cases (no gold, already max level, etc.)

**Phase 3: Integration Testing**
- Verify gold mining still works
- Verify gold accumulation correct
- Verify Mek displays show correct levels
- Verify leaderboards update correctly

**Phase 4: Performance Testing**
- Load test with 100+ Meks per wallet
- Verify query performance acceptable
- Check for N+1 queries
- Monitor database read/write operations

### 7.2 Production Monitoring

**After deployment, monitor:**
- Error logs for upgrade failures
- Gold balance anomalies
- Player support tickets
- Gold/hr calculation accuracy
- Database performance metrics

**Success Criteria**:
- Zero data loss incidents
- <1% error rate on upgrades
- <5% increase in support tickets
- Player sentiment neutral/positive

---

## 8. Implementation Timeline

**Assumptions**:
- Staging database available
- User answers design questions within 2 days
- No major scope changes

### Week 1: Setup & Disable
- **Day 1**: Set up staging Convex database
- **Day 2**: Clone production data to staging
- **Day 3**: Disable `upgradeMekLevel()` in production
- **Day 4-5**: Design finalized based on user input

### Week 2: Backend Development
- **Day 1-2**: Build slot upgrade schema + mutations
- **Day 3**: Modify gold mining queries for slot boosts
- **Day 4-5**: Write migration scripts
- **Weekend**: Test migration on staging

### Week 3: Frontend Development
- **Day 1-2**: Build slot upgrade UI components
- **Day 3**: Remove/repurpose old upgrade buttons
- **Day 4**: Integration testing
- **Day 5**: Bug fixes

### Week 4: Deployment & Monitoring
- **Day 1**: Final staging tests
- **Day 2**: Code review + approvals
- **Day 3**: Production deployment (off-peak hours)
- **Day 4-5**: Monitor for issues
- **Weekend**: Continue monitoring

### Week 5: Cleanup
- **Day 1-2**: Remove deprecated code
- **Day 3**: Archive old tables
- **Day 4**: Documentation updates
- **Day 5**: Retrospective

**Total Timeline: 4-5 weeks** (including 1 week buffer for issues)

---

## 9. Risk Assessment & Mitigation

### 9.1 High-Risk Areas

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss during migration | Medium | Critical | Snapshots before any change, staged rollout, extensive testing |
| Gold balance corruption | Medium | Critical | Validation checks, audit logs, ability to recalculate from history |
| Player frustration (can't upgrade) | High | Medium | Clear communication, exciting new feature preview, faster timeline |
| New system has critical bug | Medium | High | Staging environment, feature flags, rollback plan |
| Performance degradation | Low | Medium | Load testing, query optimization, caching |
| Blockchain verification breaks | Low | Critical | Test with actual NFT wallets, preserve all verification logic |

### 9.2 Critical Checkpoints

**Before Disabling Old System**:
- [ ] Staging environment fully operational
- [ ] Design questions answered by user
- [ ] Player communication drafted and approved

**Before Migration**:
- [ ] 100% test coverage on staging
- [ ] All edge cases tested
- [ ] Rollback procedure documented and tested
- [ ] Database snapshot created

**Before Enabling New System**:
- [ ] Code review completed
- [ ] Migration script tested on staging clone
- [ ] Error monitoring configured
- [ ] Support team briefed

---

## 10. Open Questions for User

**IMMEDIATE (need before starting)**:
1. Confirm slot-based upgrade design (see Section 4.1)
2. Confirm cost structure (gold? tenure? essence?)
3. Confirm what happens to existing Mek levels
4. Confirm approval to set up staging database

**NICE TO HAVE (can decide during dev)**:
5. Visual design for slot upgrade UI
6. Notification/announcement text for players
7. Cost curve for slot upgrades (same as old system?)
8. Should slots provide additional benefits beyond gold boost? (e.g., faster tenure accumulation)

---

## 11. Success Metrics

**Technical Success**:
- Zero data loss incidents
- 100% uptime during migration
- <2% error rate on new upgrade system
- Query performance <200ms p95

**Player Success**:
- >80% player engagement with new system (within 1 week)
- <10% increase in support tickets
- Player sentiment score >7/10 (survey)
- No mass exodus of active players

**Business Success**:
- Feature shipped on time (4-5 weeks)
- Development cost within budget
- Minimal technical debt introduced
- Clear documentation for future maintenance

---

## 12. Recommendation

**PROCEED WITH:**
1. **Staging database setup** (this week)
2. **Immediate deprecation of old system** (with player communication)
3. **User design clarification** (schedule call/meeting)
4. **Phased rollout** (following timeline in Section 8)

**DO NOT PROCEED until:**
- User answers design questions (Section 4)
- Staging database is operational
- Migration script tested successfully
- Rollback plan validated

---

## Appendix A: File Inventory

**Files to Modify**:
- `convex/schema.ts` - Add slot upgrade fields
- `convex/slotUpgrades.ts` - NEW FILE for slot upgrade logic
- `convex/mekLeveling.ts` - Deprecate old mutations
- `convex/goldMining.ts` - Modify boost calculation source
- `convex/migrations.ts` - Add migration script
- `src/app/page.tsx` - Remove upgrade UI or repurpose
- `src/components/MechanismGridLightbox.tsx` - Update UI
- `src/components/MekCard/*.tsx` - Update level display logic
- `src/components/SlotUpgradePanel.tsx` - NEW COMPONENT

**Files to Archive** (after cleanup):
- `levelUpgrades` table data → Export to JSON for records
- Old upgrade mutations → Git history

**New Files to Create**:
- `SLOT_UPGRADE_DESIGN.md` - Final design specification
- `MIGRATION_PLAYBOOK.md` - Step-by-step migration guide
- `SLOT_UPGRADE_API.md` - API documentation for new system

---

## Appendix B: Example Player Communication

**In-Game Announcement** (when disabling old system):
```
🔧 MECHANISM UPGRADE SYSTEM MAINTENANCE

We're redesigning how Mek upgrades work!

WHAT'S CHANGING:
• Mechanism upgrades temporarily disabled
• Your current levels are SAFE and preserved
• New "Slot Upgrade" system coming soon

WHAT TO EXPECT:
• More strategic upgrade decisions
• Deeper integration with Essence Slots
• Better progression for rare Meks

YOUR LEVELS:
• All current Mek levels remain unchanged
• Gold spent on upgrades will be honored
• No action needed from you

TIMELINE: ~3-4 weeks

Thank you for your patience as we improve the game!
```

---

**END OF PLANNING DOCUMENT**

**Next Steps**:
1. User reviews this document
2. User answers design questions (Section 4)
3. User approves staging database setup
4. Development begins following timeline (Section 8)
