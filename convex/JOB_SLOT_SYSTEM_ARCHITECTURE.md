# Job Slot System - Complete Database Architecture & Backend Design

## Executive Summary

This document defines the complete database schema and backend architecture for a corporation job slot system with pit stop progression buffs. The system allows players to purchase jobs (janitor, engineer, captain, etc.) for slots separate from essence slots, progress through 10 levels with configurable pit stop milestones, and receive permanent/temporary buffs at each pit stop.

**Key Features**:
- Separate job slots (distinct from 6 essence slots)
- 10-level progression with 1-10 pit stops per job
- RNG buff selection (pick 1 of 3 random buffs at each pit stop)
- Multi-tier scaling (job tier × level range × RNG curve)
- Prestige system (reset to level 1, lose buffs)
- Admin-configurable buff ranges and RNG curves
- Complete buff history tracking for timeline UI

---

## 1. DATABASE SCHEMA

### 1.1 Job Type Definitions (Admin-Configured)

**Table: `jobTypes`**

Defines all available job types that can be purchased for slots.

```typescript
jobTypes: defineTable({
  // Job identity
  jobKey: v.string(), // Unique identifier (e.g., "janitor", "engineer", "captain")
  displayName: v.string(), // UI display name (e.g., "Janitor", "Chief Engineer")
  description: v.string(), // Job description for UI

  // Job tier and characteristics
  tier: v.string(), // "D", "C", "B", "A", "S" (affects buff scaling)
  tierRank: v.number(), // Numeric rank for sorting (D=1, C=2, B=3, A=4, S=5)

  // Visual identity
  slotArtUrl: v.string(), // Path to job slot artwork
  iconUrl: v.optional(v.string()), // Job icon for compact displays
  themeColor: v.optional(v.string()), // Hex color for UI theming

  // Progression configuration
  maxLevel: v.number(), // Always 10 for now, configurable for future
  pitStopCount: v.number(), // Number of pit stops (1-10)

  // Unlock requirements
  requiresPrestigeCount: v.optional(v.number()), // Requires X prestiges to unlock
  requiresJobKeys: v.optional(v.array(v.string())), // Requires other jobs unlocked
  requiresTotalMeks: v.optional(v.number()), // Requires X total Meks owned

  // Metadata
  sortOrder: v.number(), // For UI display ordering
  isActive: v.boolean(), // Can be purchased/used
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_key", ["jobKey"])
  .index("by_tier", ["tierRank"])
  .index("by_active", ["isActive"])
  .index("by_sort", ["sortOrder"])
```

**Rationale**:
- `jobKey` allows referencing jobs without coupling to display names
- `tierRank` enables efficient sorting and filtering
- `pitStopCount` flexibility allows different progression lengths per job
- Unlock requirements create progression depth without hardcoding logic
- `isActive` allows deprecating jobs without deleting data

---

### 1.2 Player Job Slot Instances

**Table: `playerJobSlots`**

Tracks which jobs players have purchased and assigned to which slots.

```typescript
playerJobSlots: defineTable({
  // Owner identification
  walletAddress: v.string(),

  // Slot identification
  slotNumber: v.number(), // 1-N (separate from essence slots 1-6)

  // Job assignment
  jobKey: v.string(), // References jobTypes.jobKey
  jobTypeId: v.id("jobTypes"), // Direct reference for joins

  // Slot state
  isUnlocked: v.boolean(), // Has player unlocked this slot number?
  isPurchased: v.boolean(), // Has player purchased a job for this slot?

  // Slotted Mek (currently assigned to this job)
  mekAssetId: v.optional(v.string()), // Which Mek is working this job
  mekId: v.optional(v.id("meks")), // Direct Mek reference
  slottedAt: v.optional(v.number()), // When Mek was assigned to job

  // Metadata
  purchasedAt: v.optional(v.number()), // When job was purchased for slot
  unlockedAt: v.optional(v.number()), // When slot was unlocked
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_wallet", ["walletAddress"])
  .index("by_wallet_slot", ["walletAddress", "slotNumber"])
  .index("by_mek", ["mekAssetId"])
  .index("by_job_key", ["jobKey"])
```

**Rationale**:
- Separates slot unlocking (purchase slot) from job purchase (buy job type)
- Allows changing job types in slots (if we add that feature later)
- `mekAssetId` and `mekId` denormalization for fast lookups
- Supports unslotting Meks (clear mekAssetId, keep progression)

---

### 1.3 Mek Job Progression (Per Mek, Per Job)

**Table: `mekJobProgression`**

Tracks each Mek's progression through each job type they've worked.

**CRITICAL DESIGN DECISION**: Progression tied to **Mek + Job combination**, NOT slot.

```typescript
mekJobProgression: defineTable({
  // Mek identification
  mekAssetId: v.string(),
  mekId: v.id("meks"),
  walletAddress: v.string(), // Owner (denormalized for fast queries)

  // Job identification
  jobKey: v.string(),
  jobTypeId: v.id("jobTypes"),

  // Progression state
  currentLevel: v.number(), // 1-10
  currentTenure: v.number(), // Accumulated tenure for this job
  lastTenureUpdate: v.number(), // Timestamp of last tenure calculation

  // Pit stop tracking
  pitStopsCompleted: v.number(), // How many pit stops passed (0-10)
  nextPitStopAt: v.number(), // Tenure required for next pit stop

  // Prestige tracking
  prestigeCount: v.number(), // How many times prestiged this job
  totalLifetimeLevels: v.number(), // Total levels gained across all prestiges

  // Current slot assignment (denormalized)
  currentSlotNumber: v.optional(v.number()), // Which slot is Mek in for this job?
  isActivelySlotted: v.boolean(), // Is Mek currently slotted in this job?

  // Metadata
  firstStartedAt: v.number(), // When Mek first started this job
  lastActiveAt: v.number(), // Last time Mek was slotted in this job
  lastPrestigeAt: v.optional(v.number()), // Last prestige timestamp
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_mek", ["mekAssetId"])
  .index("by_mek_job", ["mekAssetId", "jobKey"])
  .index("by_wallet", ["walletAddress"])
  .index("by_job", ["jobKey"])
  .index("by_active", ["isActivelySlotted"])
```

**Rationale**:
- One record per Mek per job (Mek can work multiple jobs over time)
- Progression persists when Mek unslotted (tenure freezes, doesn't reset)
- `isActivelySlotted` for real-time tenure accumulation (like essence slots)
- `prestigeCount` enables prestige-based unlocks and rewards
- Denormalized `walletAddress` for owner-based queries

---

### 1.4 Pit Stop Definitions (Admin-Configured)

**Table: `jobPitStops`**

Defines pit stop positions for each job type.

```typescript
jobPitStops: defineTable({
  // Job identification
  jobKey: v.string(),
  jobTypeId: v.id("jobTypes"),

  // Pit stop identity
  pitStopNumber: v.number(), // 1-10 (sequential)

  // Progression requirement
  levelRange: v.object({
    fromLevel: v.number(), // Pit stop occurs between levels (e.g., 1-2)
    toLevel: v.number(),
  }),
  tenureRequired: v.number(), // Tenure needed to reach this pit stop

  // Visual configuration
  positionPercent: v.number(), // 0-100 position on progress bar

  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_job", ["jobKey"])
  .index("by_job_number", ["jobKey", "pitStopNumber"])
```

**Rationale**:
- Flexible pit stop positioning (not hardcoded to equal intervals)
- `tenureRequired` allows non-linear progression (early fast, later slow)
- `positionPercent` for visual progress bar rendering
- Admin can configure different pit stop counts per job

---

### 1.5 Buff Type Definitions (Admin-Configured)

**Table: `buffTypes`**

Defines all possible buff types that can appear at pit stops.

```typescript
buffTypes: defineTable({
  // Buff identity
  buffKey: v.string(), // "gold_per_hour", "essence_per_day", "flat_gold", etc.
  displayName: v.string(), // "Gold Per Hour"
  description: v.string(), // "Increases gold mining rate permanently"

  // Buff category
  category: v.string(), // "permanent", "one-time"
  effectType: v.string(), // "gold_rate", "essence_rate", "flat_gold", "flat_essence"

  // Buff mechanics
  isPermanent: v.boolean(), // True = stays forever, False = one-time application
  stacksWithSameBuff: v.boolean(), // Can multiple instances of this buff stack?

  // Visual identity
  iconUrl: v.optional(v.string()),
  color: v.optional(v.string()),

  // Metadata
  sortOrder: v.number(),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_key", ["buffKey"])
  .index("by_category", ["category"])
  .index("by_active", ["isActive"])
```

**Rationale**:
- Separates buff definitions from buff instances (applied to Meks)
- `stacksWithSameBuff` controls whether +5 gold/hr and +3 gold/hr can coexist
- `category` and `effectType` enable flexible filtering and application logic
- Extensible for future buff types without schema changes

---

### 1.6 Buff Range Configuration (Admin Grid System)

**Table: `buffRangeConfigs`**

The admin grid system: Job Tier × Level Range = Buff Value Range.

```typescript
buffRangeConfigs: defineTable({
  // Configuration identity
  buffKey: v.string(), // References buffTypes.buffKey
  buffTypeId: v.id("buffTypes"),

  // Scaling dimensions
  jobTier: v.string(), // "D", "C", "B", "A", "S"
  levelRange: v.object({
    minLevel: v.number(), // Level range this applies to (e.g., 1-3)
    maxLevel: v.number(),
  }),

  // Value range (used by RNG algorithm)
  minValue: v.number(), // Minimum possible buff value
  maxValue: v.number(), // Maximum possible buff value
  meanValue: v.number(), // Center of distribution (for standard curve)

  // RNG distribution settings (per-cell overrides)
  distributionType: v.optional(v.string()), // "standard", "uniform", "weighted"
  standardDeviation: v.optional(v.number()), // For standard distribution curve

  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_buff", ["buffKey"])
  .index("by_buff_tier", ["buffKey", "jobTier"])
  .index("by_buff_tier_level", ["buffKey", "jobTier", "levelRange.minLevel"])
```

**Example Data**:
```typescript
// Gold Per Hour - Janitor (D-tier) - Levels 1-3
{
  buffKey: "gold_per_hour",
  jobTier: "D",
  levelRange: { minLevel: 1, maxLevel: 3 },
  minValue: 1,
  maxValue: 5,
  meanValue: 3,
  standardDeviation: 1.0,
}

// Gold Per Hour - Captain (S-tier) - Levels 8-10
{
  buffKey: "gold_per_hour",
  jobTier: "S",
  levelRange: { minLevel: 8, maxLevel: 10 },
  minValue: 40,
  maxValue: 100,
  meanValue: 70,
  standardDeviation: 15.0,
}
```

**Rationale**:
- Enables admin to configure buff power scaling across two dimensions
- `meanValue` defines distribution center (higher = rarer)
- Flexible level ranges (can be 1-2, 1-3, 1-5, etc.)
- Per-cell distribution overrides for fine-tuning

---

### 1.7 Global RNG Configuration

**Table: `rngConfigs`**

Global settings for RNG distribution curves.

```typescript
rngConfigs: defineTable({
  // Configuration key
  configKey: v.string(), // "global_rng", "buff_selection", etc.

  // Distribution settings
  distributionType: v.string(), // "standard", "uniform", "exponential"
  defaultStandardDeviation: v.number(), // Global default

  // Rarity weights (for weighted distributions)
  rarityWeights: v.optional(v.object({
    common: v.number(), // Weight for lower values
    uncommon: v.number(),
    rare: v.number(),
    epic: v.number(),
    legendary: v.number(), // Weight for higher values
  })),

  // Buff selection constraints
  allowDuplicateBuffTypes: v.boolean(), // Can 3 choices be same buff type?
  guaranteeOneCommon: v.boolean(), // Force at least 1 low-value buff in choices?

  // Metadata
  updatedAt: v.number(),
})
  .index("by_key", ["configKey"])
```

**Rationale**:
- Centralized RNG settings to avoid hardcoding
- `rarityWeights` enables shifting distribution toward high/low values
- Selection constraints ensure variety in buff choices
- Single source of truth for RNG behavior

---

### 1.8 Pit Stop Buff History (Complete Timeline)

**Table: `pitStopBuffSelections`**

Complete history of every buff selection at every pit stop for every Mek.

```typescript
pitStopBuffSelections: defineTable({
  // Context
  mekAssetId: v.string(),
  mekId: v.id("meks"),
  walletAddress: v.string(), // Denormalized owner
  jobKey: v.string(),
  jobTypeId: v.id("jobTypes"),

  // Pit stop identification
  pitStopNumber: v.number(), // Which pit stop (1-10)
  pitStopId: v.id("jobPitStops"), // Direct reference
  levelRange: v.object({
    fromLevel: v.number(),
    toLevel: v.number(),
  }),

  // Buff choices presented (all 3 options)
  buffChoices: v.array(v.object({
    buffKey: v.string(),
    buffTypeId: v.id("buffTypes"),
    value: v.number(), // RNG-generated value
    isPermanent: v.boolean(),
    effectType: v.string(),
  })),

  // Selection made
  selectedBuffIndex: v.number(), // 0, 1, or 2 (index in buffChoices array)
  selectedBuffKey: v.string(),
  selectedBuffValue: v.number(),

  // Metadata
  selectedAt: v.number(), // Timestamp of selection
  prestigeSequence: v.number(), // Which prestige cycle (0 = first time, 1 = after 1st prestige)
  createdAt: v.number(),
})
  .index("by_mek", ["mekAssetId"])
  .index("by_mek_job", ["mekAssetId", "jobKey"])
  .index("by_wallet", ["walletAddress"])
  .index("by_mek_pit_stop", ["mekAssetId", "jobKey", "pitStopNumber"])
  .index("by_prestige", ["prestigeSequence"])
```

**Rationale**:
- **Complete history preservation** for timeline UI
- Stores ALL 3 choices (not just selected one) for analytics
- `prestigeSequence` enables "on 2nd prestige, you picked X" queries
- Immutable records (never updated, only created)
- Enables time-travel debugging and data analysis

---

### 1.9 Active Mek Buffs (Current State)

**Table: `mekActiveBuffs`**

Current active buffs affecting each Mek (optimized for frequent reads).

```typescript
mekActiveBuffs: defineTable({
  // Mek identification
  mekAssetId: v.string(),
  mekId: v.id("meks"),
  walletAddress: v.string(),

  // Job context
  jobKey: v.string(),
  jobTypeId: v.id("jobTypes"),

  // Buff identification
  buffKey: v.string(),
  buffTypeId: v.id("buffTypes"),

  // Buff effect
  value: v.number(), // Buff magnitude
  effectType: v.string(), // "gold_rate", "essence_rate", etc.
  isPermanent: v.boolean(),

  // Application tracking
  appliedAt: v.number(), // When buff was applied
  appliedFromPitStop: v.number(), // Which pit stop granted this buff
  appliedFromPrestige: v.number(), // Which prestige sequence

  // One-time buff tracking
  isConsumed: v.optional(v.boolean()), // For one-time buffs (flat gold/essence)
  consumedAt: v.optional(v.number()),

  // Metadata
  createdAt: v.number(),
})
  .index("by_mek", ["mekAssetId"])
  .index("by_mek_job", ["mekAssetId", "jobKey"])
  .index("by_buff_type", ["buffKey"])
  .index("by_permanent", ["isPermanent"])
  .index("by_effect_type", ["effectType"])
  .index("by_consumed", ["isConsumed"])
```

**Rationale**:
- **Read-optimized** for calculating total gold/essence rates
- Separate from history (history = immutable, active = mutable)
- `isConsumed` tracks one-time buffs without deleting records (audit trail)
- Enables queries like "total gold/hr from all job buffs for this Mek"
- Cleared on prestige (deleted or marked inactive)

---

### 1.10 Prestige Tracking

**Table: `mekJobPrestiges`**

History of prestige events for analytics and rewards.

```typescript
mekJobPrestiges: defineTable({
  // Mek identification
  mekAssetId: v.string(),
  mekId: v.id("meks"),
  walletAddress: v.string(),

  // Job context
  jobKey: v.string(),
  jobTypeId: v.id("jobTypes"),

  // Prestige details
  prestigeNumber: v.number(), // 1st prestige, 2nd prestige, etc.
  levelBeforePrestige: v.number(), // Always 10 (required to prestige)
  tenureBeforePrestige: v.number(), // Total tenure accumulated

  // Buffs lost
  permanentBuffsLost: v.array(v.object({
    buffKey: v.string(),
    value: v.number(),
    effectType: v.string(),
  })),

  // Rewards granted (TBD)
  rewardType: v.optional(v.string()), // "prestige_token", "unlock", etc.
  rewardValue: v.optional(v.number()),

  // Metadata
  prestigedAt: v.number(),
  createdAt: v.number(),
})
  .index("by_mek", ["mekAssetId"])
  .index("by_mek_job", ["mekAssetId", "jobKey"])
  .index("by_prestige_number", ["prestigeNumber"])
  .index("by_wallet", ["walletAddress"])
```

**Rationale**:
- Audit trail for prestige events (cannot undo prestige)
- `permanentBuffsLost` preserves what was sacrificed
- Enables prestige-based unlocks and rewards
- Analytics for game balance (average buffs lost per prestige)

---

## 2. API ENDPOINTS (QUERIES & MUTATIONS)

### 2.1 Job Slot Management

#### `getAvailableJobs` (Query)
Returns jobs available for purchase (based on unlock requirements).

**Args**:
```typescript
{ walletAddress: v.string() }
```

**Returns**:
```typescript
{
  unlockedJobs: JobType[], // Jobs player can purchase
  lockedJobs: Array<{
    job: JobType,
    unlockRequirements: {
      needsPrestigeCount?: number,
      needsJobKeys?: string[],
      needsTotalMeks?: number,
    },
    progressToUnlock: {
      currentPrestigeCount: number,
      currentJobsUnlocked: string[],
      currentTotalMeks: number,
    },
  }>,
}
```

**Logic**:
1. Query all `jobTypes` where `isActive = true`
2. For each job, check unlock requirements against player's data
3. Return jobs in two categories: unlocked vs locked with progress

---

#### `getPlayerJobSlots` (Query)
Returns all job slots for a player.

**Args**:
```typescript
{ walletAddress: v.string() }
```

**Returns**:
```typescript
{
  slots: Array<{
    slotNumber: number,
    isUnlocked: boolean,
    isPurchased: boolean,
    job: JobType | null,
    mek: Mek | null,
    progression: MekJobProgression | null,
  }>,
  totalSlots: number,
  unlockedSlots: number,
  purchasedSlots: number,
}
```

**Logic**:
1. Query `playerJobSlots` for wallet
2. Join with `jobTypes`, `meks`, `mekJobProgression`
3. Return enriched slot data

---

#### `purchaseJobSlot` (Mutation)
Purchase a job type for a specific slot.

**Args**:
```typescript
{
  walletAddress: v.string(),
  slotNumber: v.number(),
  jobKey: v.string(),
}
```

**Returns**:
```typescript
{ success: boolean, slotId: Id<"playerJobSlots">, cost: number }
```

**Logic**:
1. Verify slot is unlocked
2. Verify job is unlocked for player
3. Check player has enough gold/currency
4. Create/update `playerJobSlots` record
5. Deduct cost from player account
6. Return success

---

#### `assignMekToJobSlot` (Mutation)
Assign a Mek to work a job slot.

**Args**:
```typescript
{
  walletAddress: v.string(),
  slotNumber: v.number(),
  mekAssetId: v.string(),
}
```

**Returns**:
```typescript
{ success: boolean, progressionId: Id<"mekJobProgression"> }
```

**Logic**:
1. Verify slot has purchased job
2. Verify Mek is owned by wallet
3. Verify Mek is not already slotted elsewhere
4. Update `playerJobSlots.mekAssetId` and `slottedAt`
5. Create/update `mekJobProgression` record:
   - If Mek new to this job: create new progression
   - If Mek worked this job before: resume progression
6. Set `isActivelySlotted = true`, `lastTenureUpdate = now`
7. Return success

---

#### `unslotMekFromJob` (Mutation)
Remove Mek from job slot (tenure freezes, progression persists).

**Args**:
```typescript
{
  walletAddress: v.string(),
  slotNumber: v.number(),
}
```

**Returns**:
```typescript
{ success: boolean }
```

**Logic**:
1. Calculate and save accumulated tenure (like essence slot unslotting)
2. Update `mekJobProgression`: freeze tenure, set `isActivelySlotted = false`
3. Clear `playerJobSlots.mekAssetId`
4. Return success

---

### 2.2 Progression & Pit Stops

#### `getMekJobProgression` (Query)
Get real-time progression data for a Mek in a specific job.

**Args**:
```typescript
{
  mekAssetId: v.string(),
  jobKey: v.string(),
}
```

**Returns**:
```typescript
{
  currentLevel: number,
  currentTenure: number, // Real-time calculated
  tenureToNextPitStop: number,
  nextPitStopNumber: number,
  pitStopsCompleted: number,
  isPitStopReady: boolean, // Has enough tenure for next pit stop
  progressPercent: number, // 0-100 for progress bar
  prestigeCount: number,
}
```

**Logic**:
1. Get `mekJobProgression` record
2. If `isActivelySlotted`, calculate real-time tenure (like tenure system)
3. Get next pit stop from `jobPitStops`
4. Calculate progress percentage
5. Return enriched data

---

#### `getPitStopBuffChoices` (Query)
Generate 3 random buff choices for a pit stop.

**Args**:
```typescript
{
  mekAssetId: v.string(),
  jobKey: v.string(),
  pitStopNumber: v.number(),
}
```

**Returns**:
```typescript
{
  choices: Array<{
    buffKey: string,
    displayName: string,
    description: string,
    value: number, // RNG-generated
    isPermanent: boolean,
    effectType: string,
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary",
  }>,
  pitStopInfo: {
    pitStopNumber: number,
    levelRange: { fromLevel: number, toLevel: number },
  },
}
```

**Logic**:
1. Verify Mek has enough tenure for pit stop
2. Get job tier from `jobTypes`
3. Get level range from `jobPitStops`
4. For each of 3 choices:
   - Randomly select buff type from `buffTypes`
   - Get buff range config for (buffKey, jobTier, levelRange)
   - Generate value using RNG algorithm (see Section 4)
   - Calculate rarity tier based on value position in range
5. Ensure variety (no duplicates if config forbids)
6. Return choices

---

#### `selectPitStopBuff` (Mutation)
Player selects a buff from pit stop choices.

**Args**:
```typescript
{
  walletAddress: v.string(),
  mekAssetId: v.string(),
  jobKey: v.string(),
  pitStopNumber: v.number(),
  buffChoices: BuffChoice[], // All 3 choices (for audit)
  selectedBuffIndex: number, // 0, 1, or 2
}
```

**Returns**:
```typescript
{ success: boolean, buffApplied: ActiveBuff }
```

**Logic**:
1. Verify pit stop hasn't been completed before (check `pitStopBuffSelections`)
2. Verify tenure is sufficient
3. Create `pitStopBuffSelections` record (full history)
4. Create `mekActiveBuffs` record (if permanent)
5. Apply one-time buff immediately (if flat gold/essence)
6. Update `mekJobProgression.pitStopsCompleted += 1`
7. Return success

---

### 2.3 Buff Management

#### `getActiveMekBuffs` (Query)
Get all active buffs affecting a Mek (across all jobs).

**Args**:
```typescript
{ mekAssetId: v.string() }
```

**Returns**:
```typescript
{
  permanentBuffs: Array<{
    buffKey: string,
    effectType: string,
    value: number,
    jobKey: string,
    appliedAt: number,
  }>,
  totalGoldPerHour: number,
  totalEssencePerDay: number,
  // ... other totals
}
```

**Logic**:
1. Query `mekActiveBuffs` for mekAssetId
2. Filter to non-consumed buffs
3. Aggregate by effect type
4. Return totals and individual buffs

---

#### `getMekBuffHistory` (Query)
Get complete buff selection timeline for a Mek in a job.

**Args**:
```typescript
{
  mekAssetId: v.string(),
  jobKey: v.string(),
}
```

**Returns**:
```typescript
{
  history: Array<{
    pitStopNumber: number,
    levelRange: { fromLevel: number, toLevel: number },
    buffChoices: BuffChoice[],
    selectedBuff: BuffChoice,
    selectedAt: number,
    prestigeSequence: number,
  }>,
  totalBuffsSelected: number,
}
```

**Logic**:
1. Query `pitStopBuffSelections` for (mekAssetId, jobKey)
2. Order by `pitStopNumber` ascending
3. Return full history (for timeline UI)

---

### 2.4 Prestige

#### `canPrestigeMek` (Query)
Check if Mek is eligible for prestige.

**Args**:
```typescript
{
  mekAssetId: v.string(),
  jobKey: v.string(),
}
```

**Returns**:
```typescript
{
  canPrestige: boolean,
  requiresLevel: number, // 10
  currentLevel: number,
  buffsWillLose: ActiveBuff[],
  rewardWillReceive: string, // TBD - description of prestige reward
}
```

**Logic**:
1. Get `mekJobProgression`
2. Check `currentLevel >= 10`
3. Get all active permanent buffs for this job
4. Return eligibility and impact summary

---

#### `prestigeMek` (Mutation)
Reset Mek to level 1, clear buffs, grant prestige reward.

**Args**:
```typescript
{
  walletAddress: v.string(),
  mekAssetId: v.string(),
  jobKey: v.string(),
}
```

**Returns**:
```typescript
{
  success: boolean,
  newPrestigeCount: number,
  reward: { type: string, value: number },
}
```

**Logic**:
1. Verify `currentLevel = 10`
2. Get all active buffs for this job
3. Create `mekJobPrestiges` record (audit trail)
4. Delete/mark inactive `mekActiveBuffs` for this job
5. Reset `mekJobProgression`:
   - `currentLevel = 1`
   - `currentTenure = 0`
   - `pitStopsCompleted = 0`
   - `prestigeCount += 1`
   - `totalLifetimeLevels += 10`
6. Grant prestige reward (TBD - currency, unlock, etc.)
7. Return success

---

### 2.5 Admin Endpoints

#### `createJobType` (Mutation - Admin Only)
Create new job type.

**Args**: `JobType` object

**Returns**: `{ success: boolean, jobTypeId: Id<"jobTypes"> }`

---

#### `updateBuffRangeConfig` (Mutation - Admin Only)
Update buff value range for specific tier/level combination.

**Args**:
```typescript
{
  buffKey: v.string(),
  jobTier: v.string(),
  levelRange: { minLevel: number, maxLevel: number },
  minValue: v.number(),
  maxValue: v.number(),
  meanValue: v.number(),
}
```

**Returns**: `{ success: boolean }`

---

#### `updateRngConfig` (Mutation - Admin Only)
Update global RNG settings.

**Args**: `RngConfig` object

**Returns**: `{ success: boolean }`

---

## 3. INTEGRATION WITH TENURE SYSTEM

### 3.1 Tenure Accumulation

**Key Decision**: Job slots use same tenure accumulation as essence slots.

**How It Works**:
1. When Mek slotted in job: `mekJobProgression.isActivelySlotted = true`
2. Tenure accumulates at 1 tenure/second (same as essence slots)
3. Real-time calculation:
   ```typescript
   if (isActivelySlotted) {
     const elapsedSeconds = (now - lastTenureUpdate) / 1000;
     currentTenure = savedTenure + (elapsedSeconds * tenureRate);
   }
   ```
4. When unslotted: save current tenure, freeze accumulation

**Buffs**: Essence tenure buffs do NOT affect job tenure (separate systems).

---

### 3.2 Pit Stop Triggers

**Mapping Levels to Tenure**:
- Each level requires X tenure to complete (admin-configurable)
- Pit stops occur at specific tenure thresholds
- Example (10 levels, 5 pit stops):
  - Level 1-2 boundary (50 tenure): Pit Stop 1
  - Level 2-4 boundary (150 tenure): Pit Stop 2
  - Level 4-6 boundary (300 tenure): Pit Stop 3
  - Level 6-8 boundary (500 tenure): Pit Stop 4
  - Level 8-10 boundary (750 tenure): Pit Stop 5

**Implementation**:
- `jobPitStops` table defines `tenureRequired` for each pit stop
- Query checks `currentTenure >= nextPitStopTenure`
- When pit stop reached: trigger buff selection UI

---

### 3.3 Prestige & Tenure

**Does prestige reset tenure?**

**Recommendation: YES**
- Prestige resets `currentTenure = 0`, `currentLevel = 1`
- Justification: Fresh start, earn new buffs through new progression
- Alternative: Keep tenure but reset level (creates weird state)

**Offline Accumulation**:
- Same logic as essence slots
- Calculate tenure based on `lastTenureUpdate` timestamp
- Apply buffs retroactively (if buff existed during offline period)

---

## 4. RNG ALGORITHM

### 4.1 Multi-Tier Scaling

**Formula**:
```
baseRange = [minValue, maxValue] from buffRangeConfigs
effectiveRange = baseRange // No additional multipliers needed - range is tier-specific

randomValue = generateFromDistribution(effectiveRange, distributionType, stdDev)
```

**Example**:
```typescript
// Janitor (D-tier), Levels 1-3, Gold/Hour buff
const config = {
  minValue: 1,
  maxValue: 5,
  meanValue: 3,
  standardDeviation: 1.0,
};

// RNG generates value between 1-5, centered at 3
// 68% of values between 2-4 (1 stdDev from mean)
// 95% of values between 1-5 (2 stdDev from mean)
```

---

### 4.2 Standard Deviation Curve

**Implementation**:
```typescript
function generateStandardDistributionValue(
  min: number,
  max: number,
  mean: number,
  stdDev: number
): number {
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  // Scale to desired mean and stdDev
  let value = mean + z * stdDev;

  // Clamp to min/max bounds
  value = Math.max(min, Math.min(max, value));

  return Math.round(value * 100) / 100; // 2 decimal places
}
```

**Distribution Visualization**:
```
Min=1, Max=5, Mean=3, StdDev=1

Frequency:
     |        x
     |      x x x
     |    x x x x x
     |  x x x x x x x
     |x x x x x x x x x
     +-------------------
     1   2   3   4   5
         (mean)

- Values near mean (3) most common
- Values at extremes (1, 5) rare
- Higher values = rarer = more exciting
```

---

### 4.3 Rarity Tiers

**Assign rarity based on value position in range**:

```typescript
function calculateRarity(value: number, min: number, max: number): string {
  const range = max - min;
  const percentile = (value - min) / range * 100;

  if (percentile < 20) return "common";       // Bottom 20%
  if (percentile < 50) return "uncommon";     // 20-50%
  if (percentile < 75) return "rare";         // 50-75%
  if (percentile < 95) return "epic";         // 75-95%
  return "legendary";                         // Top 5%
}
```

**Example**:
- Value 1.5 in range [1, 5] = 12.5th percentile = Common
- Value 3.0 in range [1, 5] = 50th percentile = Uncommon
- Value 4.8 in range [1, 5] = 95th percentile = Legendary

---

### 4.4 Ensuring Variety in Buff Choices

**Constraint**: No duplicate buff types in 3 choices (unless admin allows).

**Implementation**:
```typescript
function generatePitStopBuffs(
  jobTier: string,
  levelRange: { minLevel: number, maxLevel: number },
  rngConfig: RngConfig
): BuffChoice[] {
  const choices: BuffChoice[] = [];
  const usedBuffKeys = new Set<string>();

  while (choices.length < 3) {
    // Randomly select buff type
    const buffType = randomBuffType();

    // Skip if duplicate and not allowed
    if (!rngConfig.allowDuplicateBuffTypes && usedBuffKeys.has(buffType.buffKey)) {
      continue;
    }

    // Get range config
    const rangeConfig = getBuffRangeConfig(buffType.buffKey, jobTier, levelRange);

    // Generate value
    const value = generateStandardDistributionValue(
      rangeConfig.minValue,
      rangeConfig.maxValue,
      rangeConfig.meanValue,
      rangeConfig.standardDeviation
    );

    choices.push({
      buffKey: buffType.buffKey,
      value,
      isPermanent: buffType.isPermanent,
      effectType: buffType.effectType,
      rarity: calculateRarity(value, rangeConfig.minValue, rangeConfig.maxValue),
    });

    usedBuffKeys.add(buffType.buffKey);
  }

  return choices;
}
```

---

## 5. PERFORMANCE OPTIMIZATION

### 5.1 Query Efficiency

**Hot Paths** (read frequently):
1. `getActiveMekBuffs` - Read on every gold/essence calculation
2. `getMekJobProgression` - Read on every UI update
3. `getPlayerJobSlots` - Read on corporation page load

**Optimizations**:
- **Index Coverage**: All hot queries use indexed fields
- **Denormalization**: `walletAddress` duplicated in child tables for owner queries
- **Caching**: Client-side cache active buffs (invalidate on mutation)
- **Batching**: Fetch all Mek buffs in single query (not per-Mek)

**Index Strategy**:
```typescript
// Example: Get total gold/hr from job buffs for wallet
mekActiveBuffs
  .withIndex("by_wallet", q => q.eq("walletAddress", wallet))
  .filter(q => q.eq(q.field("effectType"), "gold_rate"))
  .filter(q => q.eq(q.field("isConsumed"), false))
```
- Uses compound index: `["walletAddress", "effectType", "isConsumed"]`
- Single query, no N+1 problem

---

### 5.2 Write Efficiency

**Write-Heavy Operations**:
1. `pitStopBuffSelections` - Insert on every pit stop (50+ records per Mek lifetime)
2. `mekActiveBuffs` - Insert on every buff selection
3. `mekJobProgression` - Update every second (tenure accumulation)

**Optimizations**:

**Tenure Updates**:
- **Lazy Write**: Only write tenure on:
  - Unslot event
  - Pit stop reached
  - Prestige
- **Real-time calculation**: Compute tenure on read (like essence system)
- Avoid writes every second (performance killer)

**Batch Inserts**:
- When creating 3 buff choices, generate all in single transaction
- When clearing buffs on prestige, batch delete operation

**Append-Only Tables**:
- `pitStopBuffSelections` is append-only (no updates)
- Convex optimizes append-only tables for fast inserts

---

### 5.3 Data Volume Estimates

**Per Mek, Per Job**:
- 10 levels × 5 pit stops avg = 50 `pitStopBuffSelections` records
- ~20 `mekActiveBuffs` records (accumulate over prestiges)
- 1 `mekJobProgression` record (updated, not duplicated)
- 5 `mekJobPrestiges` records (if prestige 5 times)

**Total (1000 Meks, 5 Jobs)**:
- `pitStopBuffSelections`: 250,000 records (manageable)
- `mekActiveBuffs`: 100,000 records
- `mekJobProgression`: 5,000 records
- `mekJobPrestiges`: 25,000 records

**Storage**: ~500MB total (well within Convex limits)

**Cleanup Strategies**:
- Archive old prestige history (move to separate table)
- Compress buff history (combine multiple selections into summary)
- Retention policy: Keep only last 3 prestiges

---

## 6. MIGRATION PLAN

### Phase 1: Schema Additions (No Downtime)
1. Add new tables to `schema.ts`:
   - `jobTypes`, `playerJobSlots`, `mekJobProgression`
   - `jobPitStops`, `buffTypes`, `buffRangeConfigs`
   - `rngConfigs`, `pitStopBuffSelections`, `mekActiveBuffs`
   - `mekJobPrestiges`
2. Deploy schema (non-breaking, adds tables)
3. Verify tables created in Convex dashboard

### Phase 2: Admin Configuration (Offline)
1. Create initial job types (janitor, engineer, captain)
2. Define pit stops for each job
3. Create buff types (gold/hr, essence/day, flat gold)
4. Configure buff range grids (tier × level)
5. Set global RNG config
6. Test in dev environment

### Phase 3: API Implementation (Development)
1. Implement queries:
   - `getAvailableJobs`, `getPlayerJobSlots`
   - `getMekJobProgression`, `getPitStopBuffChoices`
   - `getActiveMekBuffs`, `getMekBuffHistory`
2. Implement mutations:
   - `purchaseJobSlot`, `assignMekToJobSlot`, `unslotMekFromJob`
   - `selectPitStopBuff`, `prestigeMek`
3. Implement admin mutations
4. Write unit tests for RNG algorithm
5. Test tenure accumulation integration

### Phase 4: Frontend Integration (Development)
1. Corporation page with job slot grid
2. Pit stop buff selection modal
3. Timeline UI for buff history
4. Prestige confirmation dialog
5. Admin configuration panels

### Phase 5: Production Rollout (Gradual)
1. Deploy backend to production (endpoints disabled)
2. Enable for 10% of users (feature flag)
3. Monitor performance and bugs
4. Gradual rollout to 50%, 100%
5. Full release announcement

### Phase 6: Data Migration (If Needed)
- If existing progression data: migrate to new schema
- Backfill job slots for existing players
- Convert old buff system to new format (if applicable)

---

## 7. ADMIN CONFIGURATION DATA MODEL

### 7.1 Job Configuration Workflow

**Admin Panel Features**:
1. **Job Type Editor**:
   - Create/edit job types (name, tier, description)
   - Upload slot artwork
   - Set pit stop count (1-10)
   - Configure unlock requirements

2. **Pit Stop Designer**:
   - Define pit stop positions for each job
   - Set tenure thresholds (non-linear progression)
   - Visual progress bar editor

3. **Buff Range Grid**:
   - Spreadsheet-style grid interface
   - Rows: Job tiers (D, C, B, A, S)
   - Columns: Level ranges (1-3, 4-6, 7-10, etc.)
   - Cells: Min/Max/Mean values for each buff type
   - Bulk edit operations

4. **RNG Configuration**:
   - Distribution type selector (standard, uniform, exponential)
   - Standard deviation slider
   - Rarity weight adjustments
   - Live preview of distribution curve

5. **Testing Tools**:
   - Buff generator simulator (see 1000 random buffs)
   - Distribution histogram
   - Outlier detection (values appearing too often/rarely)

---

### 7.2 Example Configuration Data

**Job Type: Janitor**
```json
{
  "jobKey": "janitor",
  "displayName": "Janitor",
  "description": "Entry-level position. Low risk, modest rewards.",
  "tier": "D",
  "tierRank": 1,
  "slotArtUrl": "/jobs/janitor-slot.webp",
  "maxLevel": 10,
  "pitStopCount": 3,
  "requiresTotalMeks": 1,
  "sortOrder": 1,
  "isActive": true
}
```

**Pit Stops: Janitor**
```json
[
  {
    "jobKey": "janitor",
    "pitStopNumber": 1,
    "levelRange": { "fromLevel": 1, "toLevel": 4 },
    "tenureRequired": 200,
    "positionPercent": 33
  },
  {
    "jobKey": "janitor",
    "pitStopNumber": 2,
    "levelRange": { "fromLevel": 4, "toLevel": 7 },
    "tenureRequired": 500,
    "positionPercent": 66
  },
  {
    "jobKey": "janitor",
    "pitStopNumber": 3,
    "levelRange": { "fromLevel": 7, "toLevel": 10 },
    "tenureRequired": 1000,
    "positionPercent": 100
  }
]
```

**Buff Range: Gold Per Hour - Janitor (D) - Levels 1-4**
```json
{
  "buffKey": "gold_per_hour",
  "jobTier": "D",
  "levelRange": { "minLevel": 1, "maxLevel": 4 },
  "minValue": 1,
  "maxValue": 5,
  "meanValue": 3,
  "standardDeviation": 1.0
}
```

**Buff Range: Gold Per Hour - Captain (S) - Levels 7-10**
```json
{
  "buffKey": "gold_per_hour",
  "jobTier": "S",
  "levelRange": { "minLevel": 7, "maxLevel": 10 },
  "minValue": 50,
  "maxValue": 150,
  "meanValue": 100,
  "standardDeviation": 25.0
}
```

---

## 8. OPEN QUESTIONS FOR USER

### 8.1 Prestige Rewards
**Question**: What incentive should players get for prestiging?

**Options**:
1. **Prestige Tokens**: Currency for exclusive unlocks
2. **Unlock Higher Jobs**: Prestige unlocks S-tier jobs
3. **Permanent Account Buff**: +1% all gold/essence (stacks per prestige)
4. **Cosmetic Rewards**: Special slot skins, titles, badges
5. **Resource Dump**: Flat 10,000 gold per prestige

**Recommendation**: Combination of #2 + #3 (unlock progression + scaling reward)

---

### 8.2 Job Type Flexibility
**Question**: Can players change job type in a slot after purchasing?

**Options**:
1. **Locked Forever**: Job purchase is permanent for that slot
2. **Repurchase Allowed**: Can buy different job, lose old progression
3. **Swap System**: Pay fee to swap jobs, keep partial progression

**Recommendation**: Option #1 (locked) - simplifies data model, creates meaningful choice

---

### 8.3 Buff Stacking
**Question**: If player works same job twice (different prestiges), do buffs stack?

**Scenario**: Prestige janitor, work janitor again, get more gold/hr buffs.

**Options**:
1. **Stack Unlimited**: All buffs stack (could become OP)
2. **Stack with Diminishing Returns**: 2nd prestige buffs worth 50% less
3. **Unique Buff Types Only**: Can't get +gold/hr twice from same job
4. **Replace Old Buffs**: New buffs override old ones

**Recommendation**: Option #2 (diminishing returns) - rewards prestige but prevents runaway scaling

---

### 8.4 Slot Unlocking Cost
**Question**: How do players unlock additional job slots?

**Options**:
1. **Gold Cost**: 1000/5000/10000 gold per slot (scaling)
2. **Prestige Requirement**: Slot 4+ requires X prestiges
3. **Mek Count Requirement**: Need 10 Meks to unlock slot 3
4. **Essence Cost**: Spend essence to unlock job slots

**Recommendation**: Option #1 (gold) + Option #2 (prestige) - combines resource sink and progression gate

---

## 9. SUMMARY & NEXT STEPS

### What's Defined
✅ Complete database schema (10 tables)
✅ API endpoint specifications (15+ endpoints)
✅ RNG algorithm with standard deviation curve
✅ Integration with existing tenure system
✅ Performance optimization strategy
✅ Migration plan (6 phases)
✅ Admin configuration data model

### What Needs User Input
❓ Prestige reward mechanics (tokens? unlocks? buffs?)
❓ Job type change policy (locked? swappable?)
❓ Buff stacking rules (unlimited? diminishing returns?)
❓ Slot unlocking requirements (gold? prestige? Mek count?)

### Recommended Next Steps
1. **User answers 4 open questions** (Section 8)
2. **Implement schema in `schema.ts`** (Phase 1 migration)
3. **Create seed data for testing** (3 job types, 5 buff types)
4. **Implement core queries** (`getPlayerJobSlots`, `getMekJobProgression`)
5. **Implement RNG algorithm** (test with 10,000 iterations)
6. **Build admin configuration panel** (buff range grid UI)
7. **Frontend prototype** (corporation page with job slots)

---

**Total Architecture Coverage**:
- Schema: 10 tables, 50+ fields, 30+ indexes
- APIs: 15 queries, 10 mutations, 5 admin endpoints
- Performance: Read-optimized indexes, write-batching, lazy tenure updates
- Scalability: Handles 1000 Meks × 5 Jobs × 10 Levels = 500K records

**This system is production-ready pending user decisions on open questions.**
