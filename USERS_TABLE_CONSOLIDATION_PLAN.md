# Users Table Consolidation Plan

## Executive Summary

This document outlines the migration plan to consolidate three overlapping tables (`users`, `goldMining`, `corporations`) into a single `users` table as the **single source of truth** for all user/corporation data.

---

## 1. Current State Analysis

### 1.1 Three Tables with Overlapping Data

| Table | Primary Key | Records Purpose | Reference Count |
|-------|-------------|-----------------|-----------------|
| `users` | `walletAddress` (payment) | Profile, essence, gold, level | ~84 refs in 20+ files |
| `goldMining` | `walletAddress` (stake) | NFT ownership, gold mining | ~55 refs in 20+ files |
| `corporations` | `stakeAddress` | Phase II auth, corp name | ~27 refs in 5 files |

### 1.2 Current Schema Comparison

#### `users` Table (lines 245-341 in schema.ts)
```
Primary Key: walletAddress (payment address)

Fields:
├── Wallet Auth
│   ├── walletAddress (primary key)
│   ├── walletName, walletStakeAddress, walletVerified, walletType
│   └── Session: lastWalletType, lastConnectionPlatform, activeSessionId, sessionExpiresAt
├── Discord Integration
│   └── discordUserId, discordUsername, discordLinkedAt
├── Profile
│   └── username, displayName, displayNameLower, displayNameSet, avatar, bio, profileFrame
├── Game Resources
│   ├── totalEssence (15 types), gold, craftingSlots
│   ├── baseContractSlots, baseChipSlots
│   └── inventoryTabsUnlocked, inventoryTabCosts
├── Gold Generation
│   └── goldPerHour, lastGoldCollection, pendingGold, employeeCount
├── Stats
│   └── level, experience, totalBattles, totalWins, winRate
├── Timestamps
│   └── lastLogin, createdAt, updatedAt
└── Status
    └── isOnline, isBanned, role

Indexes: by_wallet, by_stake_address, by_username, by_display_name_lower, by_session_id, by_session_expiry
```

#### `goldMining` Table (lines 1311-1377 in schema.ts)
```
Primary Key: walletAddress (stake address)

Fields:
├── Wallet ID
│   └── walletAddress, walletType, paymentAddresses[]
├── Company Identity
│   └── companyName
├── Blockchain Verification
│   └── isBlockchainVerified, lastVerificationTime, consecutiveSnapshotFailures
├── Mek Ownership (UNIQUE TO THIS TABLE)
│   └── ownedMeks[] (array of Mek objects with detailed fields)
├── Gold Accumulation
│   ├── totalGoldPerHour, baseGoldPerHour, boostGoldPerHour
│   ├── lastActiveTime, accumulatedGold, lastSnapshotTime
│   └── totalCumulativeGold
├── Gold Spending
│   └── totalGoldSpentOnUpgrades, totalUpgradesPurchased, lastUpgradeSpend
├── Timestamps
│   └── createdAt, updatedAt, version
└── Legacy Fields
    └── currentGold, lastCheckTime, sessionStartTime, offlineEarnings, snapshotMekCount

Indexes: by_wallet, by_total_rate
```

#### `corporations` Table (lines 3775-3836 in schema.ts)
```
Primary Key: stakeAddress

Fields:
├── Identity
│   └── stakeAddress (primary key)
├── Corporation Profile
│   └── corporationName, corporationNameLower
├── Session Management
│   └── lastConnectionTime, walletType, isOnline, sessionToken, sessionExpiresAt
├── Game Resources
│   └── gold, totalEssence (15 types)
├── Stats
│   └── level, experience, craftingSlots, totalBattles, totalWins, winRate
├── Timestamps
│   └── createdAt, lastLogin
└── Status
    └── isBanned, role

Indexes: by_stake_address, by_corporation_name, by_corporation_name_lower, by_level, by_gold
```

### 1.3 Key Observations

1. **Duplicate Data**: gold, essence, level, craftingSlots, walletType, isOnline exist in multiple tables
2. **Identity Confusion**: `users` uses payment address, `goldMining` and `corporations` use stake address
3. **Name Fields**: `displayName` (users), `companyName` (goldMining), `corporationName` (corporations) - same concept, three fields
4. **Unique Data**: Only `goldMining` has the `ownedMeks` array (critical data)

---

## 2. Target Architecture

### 2.1 Unified `users` Table Schema

The new `users` table will use **stake address as the primary identifier** (Phase II standard).

```typescript
users: defineTable({
  // ═══════════════════════════════════════════════════════════════════
  // PRIMARY IDENTIFIER (Phase II: Stake Address)
  // ═══════════════════════════════════════════════════════════════════
  stakeAddress: v.string(), // PRIMARY KEY - "stake1u9..." format

  // ═══════════════════════════════════════════════════════════════════
  // WALLET & AUTH
  // ═══════════════════════════════════════════════════════════════════
  paymentAddresses: v.optional(v.array(v.string())), // Associated payment addresses
  walletType: v.optional(v.string()), // nami, eternl, flint, etc.
  walletVerified: v.optional(v.boolean()),

  // Session Management
  sessionToken: v.optional(v.string()),
  sessionExpiresAt: v.optional(v.number()),
  activeSessionId: v.optional(v.string()),
  lastConnectionTime: v.optional(v.number()),
  lastConnectionPlatform: v.optional(v.string()), // mobile_ios, mobile_android, desktop
  totalConnectionCount: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════
  // PROFILE & IDENTITY
  // ═══════════════════════════════════════════════════════════════════
  corporationName: v.optional(v.string()), // User-chosen corporation name
  corporationNameLower: v.optional(v.string()), // For case-insensitive search
  avatar: v.optional(v.string()),
  bio: v.optional(v.string()),
  profileFrame: v.optional(v.string()),

  // Discord Integration
  discordUserId: v.optional(v.string()),
  discordUsername: v.optional(v.string()),
  discordLinkedAt: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════
  // GAME RESOURCES
  // ═══════════════════════════════════════════════════════════════════
  gold: v.optional(v.number()), // Current gold balance
  totalEssence: v.optional(v.object({
    stone: v.optional(v.number()),
    disco: v.optional(v.number()),
    paul: v.optional(v.number()),
    cartoon: v.optional(v.number()),
    candy: v.optional(v.number()),
    tiles: v.optional(v.number()),
    moss: v.optional(v.number()),
    bullish: v.optional(v.number()),
    journalist: v.optional(v.number()),
    laser: v.optional(v.number()),
    flashbulb: v.optional(v.number()),
    accordion: v.optional(v.number()),
    turret: v.optional(v.number()),
    drill: v.optional(v.number()),
    security: v.optional(v.number()),
  })),

  // Slot Configuration
  craftingSlots: v.optional(v.number()),
  baseContractSlots: v.optional(v.number()),
  baseChipSlots: v.optional(v.number()),
  inventoryTabsUnlocked: v.optional(v.number()),
  inventoryTabCosts: v.optional(v.object({
    tab2: v.optional(v.number()),
    tab3: v.optional(v.number()),
    tab4: v.optional(v.number()),
    tab5: v.optional(v.number()),
  })),

  // ═══════════════════════════════════════════════════════════════════
  // MEK OWNERSHIP (from goldMining)
  // ═══════════════════════════════════════════════════════════════════
  ownedMeks: v.optional(v.array(v.object({
    assetId: v.string(),
    policyId: v.string(),
    assetName: v.string(),
    imageUrl: v.optional(v.string()),
    goldPerHour: v.number(),
    rarityRank: v.optional(v.number()),
    headVariation: v.optional(v.string()),
    bodyVariation: v.optional(v.string()),
    itemVariation: v.optional(v.string()),
    sourceKey: v.optional(v.string()),
    sourceKeyBase: v.optional(v.string()),
    baseGoldPerHour: v.optional(v.number()),
    currentLevel: v.optional(v.number()),
    levelBoostPercent: v.optional(v.number()),
    levelBoostAmount: v.optional(v.number()),
    effectiveGoldPerHour: v.optional(v.number()),
    customName: v.optional(v.string()),
  }))),

  // ═══════════════════════════════════════════════════════════════════
  // GOLD MINING MECHANICS (from goldMining)
  // ═══════════════════════════════════════════════════════════════════
  totalGoldPerHour: v.optional(v.number()),
  baseGoldPerHour: v.optional(v.number()),
  boostGoldPerHour: v.optional(v.number()),
  lastActiveTime: v.optional(v.number()),
  accumulatedGold: v.optional(v.number()),
  lastSnapshotTime: v.optional(v.number()),
  totalCumulativeGold: v.optional(v.number()),

  // Gold Spending
  totalGoldSpentOnUpgrades: v.optional(v.number()),
  totalUpgradesPurchased: v.optional(v.number()),
  lastUpgradeSpend: v.optional(v.number()),

  // Blockchain Verification
  isBlockchainVerified: v.optional(v.boolean()),
  lastVerificationTime: v.optional(v.number()),
  consecutiveSnapshotFailures: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════
  // USER STATS
  // ═══════════════════════════════════════════════════════════════════
  level: v.optional(v.number()),
  experience: v.optional(v.number()),
  totalBattles: v.optional(v.number()),
  totalWins: v.optional(v.number()),
  winRate: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  lastLogin: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════
  // STATUS & ROLES
  // ═══════════════════════════════════════════════════════════════════
  isOnline: v.optional(v.boolean()),
  isBanned: v.optional(v.boolean()),
  role: v.optional(v.union(v.literal("user"), v.literal("moderator"), v.literal("admin"))),

  // ═══════════════════════════════════════════════════════════════════
  // LEGACY COMPATIBILITY (for migration period)
  // ═══════════════════════════════════════════════════════════════════
  legacyWalletAddress: v.optional(v.string()), // Old payment address if needed
  migratedFromGoldMining: v.optional(v.boolean()),
  migratedFromCorporations: v.optional(v.boolean()),
  migrationTimestamp: v.optional(v.number()),
})
  .index("by_stake_address", ["stakeAddress"]) // Primary lookup
  .index("by_corporation_name", ["corporationName"])
  .index("by_corporation_name_lower", ["corporationNameLower"])
  .index("by_level", ["level"])
  .index("by_gold", ["gold"])
  .index("by_total_rate", ["totalGoldPerHour"])
  .index("by_session_id", ["activeSessionId"])
  .index("by_session_expiry", ["sessionExpiresAt"])
  .index("by_legacy_wallet", ["legacyWalletAddress"]) // For migration lookups
```

### 2.2 What Changes

| Old Location | New Location | Notes |
|--------------|--------------|-------|
| `users.walletAddress` | `users.legacyWalletAddress` | Kept for backwards compat |
| `users.displayName` | `users.corporationName` | Unified naming |
| `goldMining.*` | `users.*` | All fields merged |
| `corporations.*` | `users.*` | All fields merged |
| `goldMining.companyName` | `users.corporationName` | Unified naming |
| `corporations.corporationName` | `users.corporationName` | Unified naming |

---

## 3. Migration Plan

### Phase 1: Schema Preparation (Non-Breaking)

**Goal**: Add new fields to `users` table without breaking existing code.

**Steps**:
1. Add all new fields to `users` schema (optional fields)
2. Add new indexes
3. Deploy schema changes
4. Verify deployment success

**Risk**: Low - only adding fields, not changing existing ones.

---

### Phase 2: Data Migration Script

**Goal**: Copy data from `goldMining` and `corporations` into `users` table.

**Migration Logic**:
```
For each record in goldMining:
  1. Find or create user by stakeAddress (goldMining.walletAddress = stake address)
  2. Copy all goldMining fields to user record
  3. Mark migratedFromGoldMining = true

For each record in corporations:
  1. Find user by stakeAddress (corporations.stakeAddress)
  2. If exists: merge corporation data (prefer newer timestamps)
  3. If not exists: create new user with corporation data
  4. Mark migratedFromCorporations = true
```

**Conflict Resolution**:
- If same field exists in multiple tables, prefer most recent `updatedAt`
- Gold: Use highest value (don't lose progress)
- Essence: Use highest value per type
- Level: Use highest value
- corporationName: Prefer corporations table (Phase II), fallback to goldMining.companyName

---

### Phase 3: Code Migration (Incremental)

**Goal**: Update all code to use unified `users` table.

#### 3.1 Files to Update (Priority Order)

**High Priority - Auth & Core**:
1. `convex/corporationAuth.ts` (13 refs) - Convert to use `users` table
2. `convex/goldMining.ts` (main file) - Redirect queries to `users`
3. `src/components/WalletConnectLightbox.tsx` - Use new auth flow

**Medium Priority - Game Mechanics**:
4. `convex/mekLeveling.ts` - Update Mek ownership lookups
5. `convex/blockchainVerification.ts` - Update verification storage
6. `convex/marketplace.ts` - Update user lookups
7. `convex/goldLeaderboard.ts` - Use new indexes

**Lower Priority - Admin & Utility**:
8. Admin files (adminUsers.ts, adminGoldMigration.ts, etc.)
9. Analysis/diagnostic files

#### 3.2 API Migration Strategy

Create wrapper functions during transition:

```typescript
// convex/userMigration.ts

// Helper to find user by ANY identifier (stake, payment, or legacy)
export async function findUserByAnyAddress(ctx, address: string) {
  // Try stake address first (Phase II standard)
  let user = await ctx.db
    .query("users")
    .withIndex("by_stake_address", q => q.eq("stakeAddress", address))
    .first();

  if (user) return user;

  // Try legacy payment address
  user = await ctx.db
    .query("users")
    .withIndex("by_legacy_wallet", q => q.eq("legacyWalletAddress", address))
    .first();

  return user;
}
```

---

### Phase 4: Deprecation & Cleanup

**Goal**: Remove old tables after successful migration.

**Steps**:
1. Add deprecation warnings to old table queries
2. Monitor for any remaining usage
3. Create backup of old tables
4. Remove old table definitions from schema
5. Clean up migration code

**Timeline**: Execute only after 2+ weeks of stable operation.

---

## 4. Implementation Checklist

### Week 1: Schema & Migration
- [ ] Update `users` schema with all new fields
- [ ] Create migration script (`convex/migrations/consolidateUsers.ts`)
- [ ] Run migration on Trout (dev) database
- [ ] Verify data integrity
- [ ] Test all core flows manually

### Week 2: Auth & Core Code
- [ ] Update `corporationAuth.ts` to use `users` table
- [ ] Update `WalletConnectLightbox.tsx`
- [ ] Update `CompanyNameModal.tsx`
- [ ] Update `UnifiedHeader.tsx`
- [ ] Test wallet connect/disconnect flow

### Week 3: Game Mechanics
- [ ] Update `goldMining.ts` queries/mutations
- [ ] Update `mekLeveling.ts`
- [ ] Update `blockchainVerification.ts`
- [ ] Update leaderboard queries
- [ ] Test gold mining, leveling, leaderboards

### Week 4: Polish & Deprecation
- [ ] Update remaining admin files
- [ ] Add deprecation warnings to old queries
- [ ] Performance testing
- [ ] Production deployment plan

---

## 5. Rollback Plan

If issues occur after migration:

1. **Data Preserved**: Old tables remain untouched during migration
2. **Quick Rollback**: Revert code changes to use old tables
3. **Data Sync**: If needed, write reverse migration to sync changes back

---

## 6. Files Requiring Updates

### Convex Backend (Priority Order)

| File | Refs | Priority | Notes |
|------|------|----------|-------|
| `corporationAuth.ts` | 13 | HIGH | Core auth - must convert first |
| `goldMining.ts` | 55+ | HIGH | Main game mechanics |
| `coachMarks.ts` | 7 | MEDIUM | Uses corporations for user lookup |
| `coachMarksAdmin.ts` | 2 | LOW | Admin only |
| `mekLeveling.ts` | - | MEDIUM | Mek upgrades |
| `blockchainVerification.ts` | 1 | MEDIUM | NFT verification |
| `marketplace.ts` | 7 | MEDIUM | Trading |
| `goldLeaderboard.ts` | - | MEDIUM | Rankings |
| `adminUsers.ts` | 20+ | LOW | Admin panel |
| ~15 other admin/utility files | - | LOW | Can update incrementally |

### Frontend Components

| File | Priority | Notes |
|------|----------|-------|
| `WalletConnectLightbox.tsx` | HIGH | Wallet connection |
| `CompanyNameModal.tsx` | HIGH | Corporation naming |
| `UnifiedHeader.tsx` | HIGH | Main header state |
| `NavigationBar.tsx` | MEDIUM | Gold/Mek display |
| `GlobalLightboxHandler.tsx` | MEDIUM | Lightbox state |
| `BuffManagement.tsx` | MEDIUM | Buff system |
| Various page files | LOW | Can update as needed |

---

## 7. Testing Strategy

### Unit Tests
- User creation with stake address
- User lookup by stake address
- User lookup by legacy payment address
- Data merging from multiple sources
- Corporation name uniqueness

### Integration Tests
- Full wallet connect flow
- Corporation name setting
- Gold mining mechanics
- Mek leveling
- Leaderboard queries

### Manual Testing Checklist
- [ ] Connect new wallet → user created in `users` table
- [ ] Set corporation name → saved in `users.corporationName`
- [ ] Gold accumulates → `users.accumulatedGold` updates
- [ ] Mek levels up → `users.ownedMeks[].currentLevel` updates
- [ ] Leaderboard shows correct data
- [ ] Existing users still work after migration

---

## 8. Success Criteria

Migration is complete when:

1. ✅ All new users created in `users` table only
2. ✅ All existing data migrated to `users` table
3. ✅ All code queries `users` table only
4. ✅ `goldMining` and `corporations` tables can be removed
5. ✅ No data loss
6. ✅ No breaking changes for existing users
7. ✅ Performance maintained or improved

---

## Appendix A: Quick Reference - Old vs New

| Old Query | New Query |
|-----------|-----------|
| `query("goldMining").withIndex("by_wallet", q => q.eq("walletAddress", addr))` | `query("users").withIndex("by_stake_address", q => q.eq("stakeAddress", addr))` |
| `query("corporations").withIndex("by_stake_address", q => q.eq("stakeAddress", addr))` | `query("users").withIndex("by_stake_address", q => q.eq("stakeAddress", addr))` |
| `goldMiningData.companyName` | `userData.corporationName` |
| `corporationData.corporationName` | `userData.corporationName` |
| `goldMiningData.ownedMeks` | `userData.ownedMeks` |
| `goldMiningData.totalGoldPerHour` | `userData.totalGoldPerHour` |

---

*Document created: December 2024*
*Last updated: December 2024*
