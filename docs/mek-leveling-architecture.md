# Mek Leveling System - Technical Architecture

## System Overview

The Mek leveling system allows users to upgrade their Meks from level 1-10 using gold currency. Levels are wallet-bound and reset upon NFT transfer, creating a dynamic ownership-based progression system with strong security guarantees.

## Core Requirements

1. **Level Range**: 1-10 (all Meks start at level 1)
2. **Currency**: Gold (instant spending from user balance)
3. **Wallet Binding**: Levels reset to 1 on wallet transfer
4. **Visual Treatment**: Level 10 Meks get special effects/badges
5. **Snapshot Integration**: Levels persist across snapshots
6. **Security**: Prevent manipulation and ensure trustless verification

## Database Schema

### Primary Tables

```typescript
// New table: mekLevels
mekLevels: defineTable({
  // Composite key (mekId + walletAddress)
  mekAssetId: v.string(),           // NFT asset ID
  walletAddress: v.string(),        // Current owner's stake address

  // Level data
  currentLevel: v.number(),         // 1-10
  totalGoldSpent: v.number(),       // Cumulative gold invested
  lastLevelUpTime: v.number(),      // Timestamp of last upgrade

  // Ownership tracking
  originalOwner: v.string(),        // First wallet to level this Mek
  previousOwner: v.optional(v.string()), // For transfer detection
  ownershipStartTime: v.number(),   // When current owner acquired

  // Security fields
  levelChecksum: v.string(),        // Hash of level data for integrity
  blockHeight: v.optional(v.number()), // Cardano block for on-chain reference

  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_mek", ["mekAssetId"])
  .index("by_wallet", ["walletAddress"])
  .index("by_mek_wallet", ["mekAssetId", "walletAddress"])
  .index("by_level", ["currentLevel"])

// New table: levelUpTransactions
levelUpTransactions: defineTable({
  mekAssetId: v.string(),
  walletAddress: v.string(),

  // Transaction details
  fromLevel: v.number(),
  toLevel: v.number(),
  goldCost: v.number(),

  // Balance tracking
  goldBalanceBefore: v.number(),
  goldBalanceAfter: v.number(),

  // Security
  transactionHash: v.string(),      // Hash of transaction data
  nonce: v.string(),                 // Prevent replay attacks
  signature: v.optional(v.string()), // Wallet signature for high-value upgrades

  // Status
  status: v.union(
    v.literal("pending"),
    v.literal("completed"),
    v.literal("failed"),
    v.literal("reverted")
  ),

  timestamp: v.number(),
})
  .index("by_mek", ["mekAssetId"])
  .index("by_wallet", ["walletAddress"])
  .index("by_timestamp", ["timestamp"])

// Update existing meks table
meks: defineTable({
  // ... existing fields ...

  // Add leveling fields
  currentLevel: v.optional(v.number()), // Denormalized for quick access
  levelOwner: v.optional(v.string()),   // Current wallet that owns the level
  isMaxLevel: v.optional(v.boolean()),  // Quick check for level 10
})
```

### Gold Cost Formula

```typescript
const LEVEL_COSTS = {
  1: 0,      // Starting level (free)
  2: 100,    // Level 1→2
  3: 250,    // Level 2→3
  4: 500,    // Level 3→4
  5: 1000,   // Level 4→5
  6: 2000,   // Level 5→6
  7: 4000,   // Level 6→7
  8: 8000,   // Level 7→8
  9: 16000,  // Level 8→9
  10: 32000, // Level 9→10
};

// Total cost to max: 63,850 gold
```

## Security Architecture

### 1. Transaction Verification Pipeline

```typescript
// Level up request flow
async function levelUpMek(args: {
  mekAssetId: string,
  walletAddress: string,
  targetLevel: number,
  clientNonce: string,
  signature?: string, // Required for levels 8-10
}) {
  // Step 1: Verify ownership
  const ownership = await verifyMekOwnership(mekAssetId, walletAddress);
  if (!ownership.verified) throw new Error("Ownership not verified");

  // Step 2: Check current level
  const currentLevel = await getMekLevel(mekAssetId, walletAddress);
  if (targetLevel !== currentLevel + 1) throw new Error("Invalid level progression");

  // Step 3: Calculate and verify gold cost
  const cost = LEVEL_COSTS[targetLevel];
  const userGold = await getUserGold(walletAddress);
  if (userGold < cost) throw new Error("Insufficient gold");

  // Step 4: Verify signature for high-value transactions
  if (targetLevel >= 8) {
    const verified = await verifyWalletSignature(
      walletAddress,
      `Level up MEK ${mekAssetId} to ${targetLevel}`,
      signature
    );
    if (!verified) throw new Error("Invalid signature");
  }

  // Step 5: Create pending transaction
  const txId = await createPendingTransaction({
    mekAssetId,
    walletAddress,
    fromLevel: currentLevel,
    toLevel: targetLevel,
    goldCost: cost,
    nonce: clientNonce,
  });

  // Step 6: Execute atomic transaction
  try {
    await db.transaction(async (tx) => {
      // Deduct gold
      await deductGold(tx, walletAddress, cost);

      // Update level
      await updateMekLevel(tx, mekAssetId, walletAddress, targetLevel);

      // Complete transaction
      await completeTransaction(tx, txId);
    });
  } catch (error) {
    await failTransaction(txId, error.message);
    throw error;
  }

  // Step 7: Create audit log
  await createAuditLog({
    type: "mek_level_up",
    mekAssetId,
    walletAddress,
    details: { from: currentLevel, to: targetLevel, cost },
  });

  return { success: true, newLevel: targetLevel };
}
```

### 2. Wallet Transfer Detection

```typescript
// Blockchain monitoring for transfers
async function detectMekTransfer(mekAssetId: string) {
  // Poll Blockfrost/Koios for ownership changes
  const currentOwner = await getBlockchainOwner(mekAssetId);
  const recordedOwner = await getRecordedOwner(mekAssetId);

  if (currentOwner !== recordedOwner) {
    // Transfer detected - reset level
    await resetMekLevel(mekAssetId, currentOwner);

    // Log transfer event
    await logTransferEvent({
      mekAssetId,
      fromWallet: recordedOwner,
      toWallet: currentOwner,
      levelReset: true,
    });
  }
}

// Scheduled job - runs every 5 minutes
export const monitorMekTransfers = internalAction({
  handler: async (ctx) => {
    const allLeveledMeks = await ctx.runQuery(api.mekLevels.getAllLeveled);

    for (const mek of allLeveledMeks) {
      await detectMekTransfer(mek.mekAssetId);
    }
  }
});
```

### 3. Snapshot Integration

```typescript
// Include levels in wallet snapshots
async function createWalletSnapshot(walletAddress: string) {
  const snapshot = {
    walletAddress,
    timestamp: Date.now(),

    // Gold state
    goldBalance: await getGoldBalance(walletAddress),
    goldPerHour: await getGoldRate(walletAddress),

    // Mek levels
    mekLevels: await getMekLevelsForWallet(walletAddress),
    totalLevelInvestment: await getTotalLevelInvestment(walletAddress),

    // Checksum for integrity
    checksum: await calculateSnapshotChecksum({...}),
  };

  return snapshot;
}

// Restore from snapshot
async function restoreFromSnapshot(snapshot: WalletSnapshot) {
  // Verify checksum
  if (!verifyChecksum(snapshot)) {
    throw new Error("Snapshot integrity check failed");
  }

  // Restore levels
  for (const mekLevel of snapshot.mekLevels) {
    await restoreMekLevel(mekLevel);
  }
}
```

### 4. Anti-Manipulation Measures

```typescript
// Rate limiting per wallet
const LEVEL_UP_COOLDOWN = 60 * 1000; // 1 minute between level-ups
const MAX_DAILY_LEVELUPS = 10;

// Anomaly detection
async function detectAnomalies(walletAddress: string) {
  const recent = await getRecentLevelUps(walletAddress, 24 * 60 * 60 * 1000);

  // Check for suspicious patterns
  if (recent.length > MAX_DAILY_LEVELUPS) {
    await flagSuspiciousActivity(walletAddress, "Excessive level-ups");
  }

  // Check for impossible gold generation
  const goldSpent = recent.reduce((sum, tx) => sum + tx.goldCost, 0);
  const maxPossibleGold = await getMaxPossibleGold(walletAddress);

  if (goldSpent > maxPossibleGold) {
    await flagSuspiciousActivity(walletAddress, "Impossible gold amount");
  }
}

// Circuit breaker for system-wide issues
const circuitBreaker = {
  failureThreshold: 10,
  resetTimeout: 60 * 1000,

  async execute(fn: Function) {
    if (this.isOpen()) {
      throw new Error("Circuit breaker is open - leveling temporarily disabled");
    }

    try {
      return await fn();
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
};
```

## Edge Case Handling

### 1. Wallet Disconnection During Upgrade

```typescript
// Use two-phase commit pattern
async function handleLevelUpWithRecovery(args: LevelUpArgs) {
  // Phase 1: Prepare (can be rolled back)
  const prepareId = await prepareLevelUp({
    ...args,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minute timeout
  });

  try {
    // Phase 2: Commit
    await commitLevelUp(prepareId);
  } catch (error) {
    // Auto-rollback after timeout
    scheduleRollback(prepareId);
    throw error;
  }
}
```

### 2. Concurrent Upgrade Attempts

```typescript
// Use optimistic locking
async function levelUpWithLocking(mekAssetId: string, walletAddress: string) {
  const lock = await acquireLock(`mek_level_${mekAssetId}`, {
    ttl: 30 * 1000, // 30 second lock
  });

  if (!lock) {
    throw new Error("Another level-up in progress for this Mek");
  }

  try {
    await performLevelUp(mekAssetId, walletAddress);
  } finally {
    await releaseLock(lock);
  }
}
```

### 3. NFT Transfer During Upgrade

```typescript
// Check ownership at multiple points
async function safeLevelUp(mekAssetId: string, walletAddress: string) {
  // Check 1: Before transaction
  const owner1 = await verifyOwnership(mekAssetId, walletAddress);
  if (!owner1) throw new Error("Not the owner");

  // Begin transaction
  const txId = await beginTransaction();

  // Check 2: After gold deduction
  const owner2 = await verifyOwnership(mekAssetId, walletAddress);
  if (!owner2) {
    await rollbackTransaction(txId);
    throw new Error("Ownership changed during transaction");
  }

  // Complete level up
  await completeLevelUp(txId);
}
```

## Visual Treatment for Level 10

```typescript
// Frontend component
function MekCard({ mek }: { mek: Mek }) {
  const isMaxLevel = mek.currentLevel === 10;

  return (
    <div className={cn(
      "mek-card",
      isMaxLevel && "mek-card-max-level" // Special styling
    )}>
      {isMaxLevel && (
        <>
          <div className="absolute inset-0 bg-gradient-radial from-yellow-500/20 to-transparent animate-pulse" />
          <Badge className="absolute top-2 right-2 bg-gradient-to-r from-yellow-500 to-orange-500">
            MAX LEVEL
          </Badge>
          <ParticleEffect type="gold-sparkles" />
        </>
      )}

      <LevelIndicator
        level={mek.currentLevel}
        showStars={isMaxLevel}
      />
    </div>
  );
}
```

## Migration Strategy

### Phase 1: Deploy Infrastructure
1. Create new database tables
2. Deploy verification services
3. Set up monitoring jobs

### Phase 2: Enable Leveling (Beta)
1. Enable for small group of testers
2. Monitor for issues
3. Tune rate limits and costs

### Phase 3: Full Launch
1. Enable for all users
2. Add visual effects
3. Integrate with leaderboards

### Phase 4: Advanced Features
1. Level-based bonuses (increased gold rate)
2. Achievement system integration
3. Trading level boosts

## Security Checklist

- [ ] Wallet ownership verification before each level up
- [ ] Atomic transactions for gold spending
- [ ] Rate limiting per wallet
- [ ] Signature verification for high-value upgrades
- [ ] Transfer detection and level reset
- [ ] Audit logging for all operations
- [ ] Snapshot backup integration
- [ ] Circuit breaker for system protection
- [ ] Anomaly detection for suspicious activity
- [ ] Two-phase commit for resilience
- [ ] Optimistic locking for concurrency
- [ ] Checksum validation for data integrity

## Monitoring & Analytics

```typescript
// Key metrics to track
const metrics = {
  // Usage metrics
  dailyLevelUps: number,
  averageLevelPerMek: number,
  totalGoldSpentOnLevels: number,

  // Security metrics
  failedVerifications: number,
  suspiciousActivities: number,
  transferResets: number,

  // Performance metrics
  averageLevelUpTime: number,
  blockchainVerificationLatency: number,

  // Business metrics
  percentageOfMeksLeveled: number,
  revenueFromLeveling: number, // If any fees
};
```

## API Endpoints

```typescript
// Convex mutations/queries
export const levelUpMek = mutation({...});
export const getMekLevel = query({...});
export const getLevelCost = query({...});
export const getLevelHistory = query({...});

// Actions for blockchain interaction
export const verifyAndLevelUp = action({...});
export const checkTransferStatus = action({...});
export const restoreFromBackup = action({...});
```

## Testing Strategy

1. **Unit Tests**: Cost calculations, level progression
2. **Integration Tests**: Gold spending, database updates
3. **Security Tests**: Transfer detection, manipulation attempts
4. **Load Tests**: Concurrent upgrades, rate limiting
5. **Recovery Tests**: Disconnection handling, rollbacks

## Future Enhancements

1. **Smart Contract Integration**: Store level commitments on-chain
2. **Cross-Chain Support**: Levels that work across multiple chains
3. **Delegated Leveling**: Allow others to level your Meks
4. **Level Decay**: Levels slowly decrease if inactive
5. **Prestige System**: Reset to level 1 for permanent bonuses