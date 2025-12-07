# Users Table Consolidation Plan (Revised)

## Executive Summary

This document outlines the migration plan to consolidate three overlapping tables (`users`, `goldMining`, `corporations`) into a **normalized architecture** with the `users` table as the identity hub and related tables for specific data domains.

**Key Change from Original Plan**: Instead of one mega-table, we use a normalized approach with multiple focused tables.

---

## 1. Current State Analysis

### 1.1 Three Tables with Overlapping Data

| Table | Primary Key | Records Purpose | Reference Count |
|-------|-------------|-----------------|-----------------|
| `users` | `walletAddress` (payment) | Profile, essence, gold, level | ~84 refs in 20+ files |
| `goldMining` | `walletAddress` (stake) | NFT ownership, gold mining | ~55 refs in 20+ files |
| `corporations` | `stakeAddress` | Phase II auth, corp name | ~27 refs in 5 files |

### 1.2 Problems with Current Architecture

1. **Three sources of "truth"** for user data
2. **Duplicate fields** (gold, essence, level exist in multiple tables)
3. **Identity confusion** (payment address vs stake address as key)
4. **Complex queries** that must check multiple tables
5. **Sync nightmares** when data should be consistent

---

## 2. Target Architecture (Normalized)

### 2.1 Design Principles

1. **`users` table is for IDENTITY ONLY** - not a dumping ground
2. **Separate tables for different data domains**
3. **Stake address is THE primary identifier** (Phase II standard)
4. **One row per item** for collections (not arrays in documents)
5. **Sparse data normalized** (essence types as rows, not columns)

### 2.2 Table Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         users                                   │
│  Core identity, auth, aggregate stats ONLY                      │
├─────────────────────────────────────────────────────────────────┤
│  stakeAddress (PK)                                              │
│  corporationName, corporationNameLower                          │
│  gold (frequently accessed balance)                             │
│  level, experience                                              │
│  session/auth fields                                            │
│  timestamps, status                                             │
│  ~20 fields, <10KB per document                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┬────────────────────┐
         │                 │                 │                    │
         ▼                 ▼                 ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   userEssence   │ │  userJobSlots   │ │ goldMiningState │ │      meks       │
│                 │ │                 │ │                 │ │                 │
│ stakeAddress FK │ │ stakeAddress FK │ │ stakeAddress FK │ │ ownerStake FK   │
│ essenceType     │ │ slotType        │ │ totalGoldPerHr  │ │ assetId (PK)    │
│ balance         │ │ slotIndex       │ │ accumulatedGold │ │ variations      │
│                 │ │ assignedMekId   │ │ snapshot data   │ │ talentTree {}   │
│ (291 types,     │ │ slotXP, level   │ │ verification    │ │ currentLevel    │
│  sparse rows)   │ │                 │ │                 │ │ goldPerHour     │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 2.3 Detailed Schema Definitions

#### `users` Table (Identity Hub)

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
  lastConnectionPlatform: v.optional(v.string()),
  totalConnectionCount: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════
  // PROFILE & IDENTITY
  // ═══════════════════════════════════════════════════════════════════
  corporationName: v.optional(v.string()),
  corporationNameLower: v.optional(v.string()),
  avatar: v.optional(v.string()),
  bio: v.optional(v.string()),
  profileFrame: v.optional(v.string()),

  // Discord Integration
  discordUserId: v.optional(v.string()),
  discordUsername: v.optional(v.string()),
  discordLinkedAt: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════
  // AGGREGATE STATS (single scalar values only)
  // ═══════════════════════════════════════════════════════════════════
  gold: v.optional(v.number()), // Current gold balance
  level: v.optional(v.number()),
  experience: v.optional(v.number()),
  totalBattles: v.optional(v.number()),
  totalWins: v.optional(v.number()),
  winRate: v.optional(v.number()),

  // Slot Configuration (counts, not arrays)
  craftingSlots: v.optional(v.number()),
  baseContractSlots: v.optional(v.number()),
  baseChipSlots: v.optional(v.number()),
  inventoryTabsUnlocked: v.optional(v.number()),

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
  // LEGACY COMPATIBILITY
  // ═══════════════════════════════════════════════════════════════════
  legacyWalletAddress: v.optional(v.string()),
  migratedAt: v.optional(v.number()),
})
  .index("by_stake_address", ["stakeAddress"])
  .index("by_corporation_name_lower", ["corporationNameLower"])
  .index("by_level", ["level"])
  .index("by_gold", ["gold"])
  .index("by_session_id", ["activeSessionId"])
  .index("by_legacy_wallet", ["legacyWalletAddress"])
```

#### `userEssence` Table (Normalized Sparse Data)

```typescript
userEssence: defineTable({
  stakeAddress: v.string(),      // FK to users
  essenceType: v.string(),       // "stone", "disco", "bumblebee", etc. (291 types)
  balance: v.number(),           // Amount owned
  lastUpdated: v.optional(v.number()),
})
  .index("by_user", ["stakeAddress"])
  .index("by_user_type", ["stakeAddress", "essenceType"])
  .index("by_type", ["essenceType"])
```

**Why normalized**:
- 291 essence types, but users typically have 30-50 with actual balances
- Only store rows where balance > 0
- Easy to add new essence types without schema changes
- Efficient queries: "get all essence for user X" or "get all users with essence Y"

#### `userJobSlots` Table (Multiple Items Per User)

```typescript
userJobSlots: defineTable({
  // Ownership
  stakeAddress: v.string(),           // FK to users

  // Slot Identity
  slotType: v.string(),               // "mining", "crafting", "security", etc.
  slotIndex: v.number(),              // 1, 2, 3... (for ordering)

  // Assignment
  assignedMekId: v.optional(v.string()), // FK to meks.assetId
  assignedAt: v.optional(v.number()),

  // Slot Progress
  slotXP: v.optional(v.number()),
  slotLevel: v.optional(v.number()),
  lastXPUpdate: v.optional(v.number()),

  // Tenure & Progression
  tenureDays: v.optional(v.number()),
  pitStopsCompleted: v.optional(v.number()),
  nextPitStopAt: v.optional(v.number()),

  // Slot Configuration
  isUnlocked: v.boolean(),
  unlockedAt: v.optional(v.number()),
})
  .index("by_user", ["stakeAddress"])
  .index("by_user_type", ["stakeAddress", "slotType"])
  .index("by_assigned_mek", ["assignedMekId"])
```

#### `goldMiningState` Table (Complex Mechanics)

```typescript
goldMiningState: defineTable({
  stakeAddress: v.string(),           // FK to users (1:1)

  // Gold Rates
  totalGoldPerHour: v.number(),
  baseGoldPerHour: v.optional(v.number()),
  boostGoldPerHour: v.optional(v.number()),

  // Accumulation
  accumulatedGold: v.optional(v.number()),
  lastActiveTime: v.number(),
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

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_stake_address", ["stakeAddress"])
  .index("by_total_rate", ["totalGoldPerHour"])
```

#### `meks` Table (Keep Existing, Add Owner FK)

```typescript
meks: defineTable({
  // Identity
  assetId: v.string(),                    // PK - unique asset ID
  policyId: v.string(),
  assetName: v.string(),

  // Ownership (Phase II)
  ownerStakeAddress: v.optional(v.string()), // FK to users.stakeAddress

  // Mek Metadata
  imageUrl: v.optional(v.string()),
  rarityRank: v.optional(v.number()),
  headVariation: v.optional(v.string()),
  bodyVariation: v.optional(v.string()),
  itemVariation: v.optional(v.string()),
  sourceKey: v.optional(v.string()),
  sourceKeyBase: v.optional(v.string()),

  // Gold Generation
  baseGoldPerHour: v.optional(v.number()),
  currentLevel: v.optional(v.number()),
  levelBoostPercent: v.optional(v.number()),
  levelBoostAmount: v.optional(v.number()),
  effectiveGoldPerHour: v.optional(v.number()),

  // Custom
  customName: v.optional(v.string()),

  // Talent Tree (bounded data, 1:1 with Mek)
  talentTree: v.optional(v.object({
    unlockedNodes: v.array(v.string()),
    currentPath: v.optional(v.string()),
    totalTalentXP: v.optional(v.number()),
    lastTalentUpdate: v.optional(v.number()),
  })),
})
  .index("by_asset", ["assetId"])
  .index("by_owner", ["ownerStakeAddress"])
  .index("by_policy", ["policyId"])
```

---

## 3. What Goes Where (Quick Reference)

| Data Type | Table | Why |
|-----------|-------|-----|
| User identity (name, auth) | `users` | Core identity |
| Gold balance | `users` | Single value, always needed |
| Level/XP | `users` | Aggregate stat |
| Session data | `users` | Auth, always checked |
| Essence balances (291 types) | `userEssence` | Sparse, many types |
| Job slots | `userJobSlots` | Multiple per user |
| Slot XP/progress | `userJobSlots` | Per-slot data |
| Mek ownership | `meks.ownerStakeAddress` | FK on Mek |
| Mek talent tree | `meks.talentTree` | Bounded, 1:1 with Mek |
| Gold mining rates | `goldMiningState` | Complex mechanics |
| Blockchain verification | `goldMiningState` | Mining-specific |
| Future buffs | New `userBuffs` table | Multiple, expire |
| Future achievements | New `userAchievements` | Many, sparse |
| Future perks | New `userPerks` table | Multiple, unlockable |

---

## 4. Migration Plan

### Phase 1: Schema Preparation

1. Update `users` schema (add missing fields, change PK to stakeAddress)
2. Create `userEssence` table
3. Create `userJobSlots` table
4. Update `goldMiningState` (rename from goldMining, remove duplicates)
5. Update `meks` table (add ownerStakeAddress FK)

### Phase 2: Data Migration

```
For each goldMining record:
  1. Create/update users record (stakeAddress = goldMining.walletAddress)
  2. Copy simple fields to users
  3. Migrate ownedMeks array → update each mek's ownerStakeAddress
  4. Create goldMiningState record
  5. If essence exists, create userEssence rows

For each corporations record:
  1. Find/create users by stakeAddress
  2. Merge corporation data (prefer newer)
  3. Update corporationName if set
```

### Phase 3: Code Migration

**Priority Order:**
1. Auth flow (`corporationAuth.ts`, `WalletConnectLightbox.tsx`)
2. Name setting (`CompanyNameModal.tsx`, goldMining queries)
3. Essence system (new userEssence queries)
4. Gold mining (redirect to goldMiningState)
5. Mek ownership (query by ownerStakeAddress)
6. Admin tools (update to new structure)

### Phase 4: Cleanup

1. Deprecate old queries
2. Remove `corporations` table references
3. Remove old `goldMining` structure
4. Remove `ownedMeks` array from goldMining

---

## 5. Files Requiring Updates

### High Priority (Auth & Core)
- `convex/corporationAuth.ts` → Use `users` table
- `convex/goldMining.ts` → Split into users + goldMiningState
- `src/components/WalletConnectLightbox.tsx`
- `src/components/CompanyNameModal.tsx`
- `src/components/UnifiedHeader.tsx`

### Medium Priority (Game Mechanics)
- `convex/mekLeveling.ts`
- `convex/blockchainVerification.ts`
- `convex/marketplace.ts`
- `convex/goldLeaderboard.ts`
- Essence-related queries (new userEssence table)

### Lower Priority (Admin/Utility)
- `convex/adminUsers.ts`
- Various admin and diagnostic files

---

## 6. Decision Guidelines for Future Features

**ALWAYS check this before adding new user data:**

### Add to `users` table IF:
- ✅ Single scalar value
- ✅ Bounded (won't grow)
- ✅ Core to identity
- ✅ Accessed everywhere
- ✅ Changes rarely

### Create SEPARATE table IF:
- Multiple items per user (buffs, achievements, perks)
- Could grow unbounded (history, logs)
- Sparse data (many possible types)
- Changes independently from profile
- Accessed in specific contexts only
- Complex nested structure

### Examples

| Feature | Decision |
|---------|----------|
| "VIP status" | `users.isVIP` (single boolean) |
| "Active buffs" | New `userBuffs` table |
| "Corporation perks" | New `userPerks` table |
| "Achievement progress" | New `userAchievements` table |
| "Login streak" | `users.loginStreak` (single number) |
| "Owned cosmetics" | New `userCosmetics` table |
| "Battle history" | New `userBattleHistory` table |

---

## 7. Rollback Plan

1. Old tables (`goldMining`, `corporations`) remain during migration
2. Can revert code to use old tables if issues
3. Data can be synced back if needed
4. Full rollback = revert code + keep old tables active

---

*Document created: December 2024*
*Revised: December 2024 - Changed from mega-table to normalized architecture*
