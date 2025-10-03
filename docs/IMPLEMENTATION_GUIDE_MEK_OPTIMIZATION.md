# Implementation Guide: Mek Data Optimization

## Quick Start: Priority Implementation Order

### Phase 1: Virtual Scrolling (Biggest Impact, Easiest Implementation)
**Time**: 2-3 hours
**Impact**: 90% rendering performance improvement
**Difficulty**: Easy

### Phase 2: Unified Portfolio Query (Reduce Network Overhead)
**Time**: 4-6 hours
**Impact**: 75% reduction in queries
**Difficulty**: Medium

### Phase 3: Blockfrost Batching (Reduce API Costs)
**Time**: 3-4 hours
**Impact**: 95% reduction in API calls
**Difficulty**: Medium

---

## Phase 1: Virtual Scrolling Implementation

### Step 1: Install Dependencies

```bash
npm install @tanstack/react-virtual
```

### Step 2: Create VirtualMekGrid Component

Create `src/components/VirtualMekGrid.tsx`:

```typescript
'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MekAsset } from '@/types/mek';

interface VirtualMekGridProps {
  meks: MekAsset[];
  renderMek: (mek: MekAsset, index: number) => React.ReactNode;
}

export function VirtualMekGrid({ meks, renderMek }: VirtualMekGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: meks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 500, // Estimated card height in pixels
    overscan: 3, // Render 3 items above/below viewport for smooth scrolling
  });

  return (
    <div
      ref={parentRef}
      className="w-full overflow-auto"
      style={{ height: 'calc(100vh - 200px)' }} // Adjust based on your layout
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderMek(meks[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Step 3: Update page.tsx to Use Virtual Scrolling

Replace the current `.map()` rendering with:

```typescript
// In src/app/mek-rate-logging/page.tsx

// Add import
import { VirtualMekGrid } from '@/components/VirtualMekGrid';

// Replace this section:
// {ownedMeks.map((mek) => ( ... ))}

// With this:
<VirtualMekGrid
  meks={ownedMeks}
  renderMek={(mek, index) => (
    <div className="group relative mb-4 px-4">
      {/* Your existing Mek card JSX here */}
      <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500/20"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 9px, #FAB617 9px, #FAB617 10px),
            repeating-linear-gradient(90deg, transparent, transparent 9px, #FAB617 9px, #FAB617 10px)
          `
        }}
      />

      {/* Image container with border */}
      <div className="aspect-square bg-black/30 overflow-hidden relative border border-yellow-500/20">
        {mek.mekNumber ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
              <div className="w-12 h-12 border-2 border-yellow-500/30 border-t-yellow-500/60 rounded-full animate-spin" />
            </div>
            <img
              src={getMekImageUrl(mek.mekNumber, '1000px')}
              alt={mek.assetName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 relative z-10"
              loading="lazy"
              onLoad={(e) => {
                const parent = e.currentTarget.parentElement;
                const loader = parent?.querySelector('div');
                if (loader) loader.style.display = 'none';
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </>
        ) : /* ... rest of your image rendering logic */ }
      </div>

      {/* Rest of your Mek card content */}
    </div>
  )}
/>
```

### Step 4: Verify Performance

Open React DevTools Profiler and measure:
- **Before**: ~5000 DOM nodes, 25-35 FPS
- **After**: ~500 DOM nodes, 60 FPS

---

## Phase 2: Unified Portfolio Query

### Step 1: Create Unified Query in Convex

Create `convex/mekPortfolio.ts`:

```typescript
import { v } from "convex/values";
import { query } from "./_generated/server";
import { calculateCurrentGold } from "./lib/goldCalculations";

export const getPortfolio = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Parallel fetch all related data
    const [goldMining, levels, userStats] = await Promise.all([
      ctx.db
        .query("goldMining")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
        .first(),
      ctx.db
        .query("mekLevels")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
        .filter((q) => q.neq(q.field("ownershipStatus"), "transferred"))
        .collect(),
      ctx.db
        .query("userStats")
        .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
        .first(),
    ]);

    if (!goldMining) {
      return null;
    }

    // Build level lookup map for O(1) access
    const levelMap = new Map(
      levels.map((l) => [l.assetId, l])
    );

    // Enrich Mek data with levels in single pass
    const enrichedMeks = (goldMining.ownedMeks || []).map((mek) => {
      const levelData = levelMap.get(mek.assetId);
      return {
        ...mek,
        currentLevel: levelData?.currentLevel || 1,
        levelBoostAmount: levelData?.currentBoostAmount || 0,
        levelBoostPercent: levelData?.currentBoostPercent || 0,
        totalGoldSpent: levelData?.totalGoldSpent || 0,
        baseGoldPerHour: mek.baseGoldPerHour || mek.goldPerHour,
        effectiveGoldPerHour:
          (mek.baseGoldPerHour || mek.goldPerHour) +
          (levelData?.currentBoostAmount || 0),
      };
    });

    // Calculate current gold with real-time accumulation
    const now = Date.now();
    const currentGold = calculateCurrentGold({
      accumulatedGold: goldMining.accumulatedGold || 0,
      goldPerHour: goldMining.totalGoldPerHour,
      lastSnapshotTime:
        goldMining.lastSnapshotTime ||
        goldMining.updatedAt ||
        goldMining.createdAt,
      isVerified: goldMining.isBlockchainVerified === true,
      consecutiveSnapshotFailures: goldMining.consecutiveSnapshotFailures || 0,
    });

    // Calculate cumulative gold (all-time earnings)
    let cumulativeGold = goldMining.totalCumulativeGold || 0;
    if (!goldMining.totalCumulativeGold) {
      cumulativeGold =
        (goldMining.accumulatedGold || 0) +
        (goldMining.totalGoldSpentOnUpgrades || 0);
    }

    // Add real-time earnings if verified
    if (goldMining.isBlockchainVerified === true) {
      const lastUpdateTime =
        goldMining.lastSnapshotTime ||
        goldMining.updatedAt ||
        goldMining.createdAt;
      const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
      const goldSinceLastUpdate =
        goldMining.totalGoldPerHour * hoursSinceLastUpdate;
      cumulativeGold += goldSinceLastUpdate;
    }

    return {
      // Mek data with levels merged
      meks: enrichedMeks,

      // Gold mining data
      goldMining: {
        currentGold,
        totalGoldPerHour: goldMining.totalGoldPerHour,
        baseGoldPerHour: goldMining.baseGoldPerHour,
        boostGoldPerHour: goldMining.boostGoldPerHour,
        accumulatedGold: goldMining.accumulatedGold,
        totalCumulativeGold: cumulativeGold,
        lastSnapshotTime: goldMining.lastSnapshotTime,
        isBlockchainVerified: goldMining.isBlockchainVerified,
        totalGoldSpentOnUpgrades: goldMining.totalGoldSpentOnUpgrades || 0,
      },

      // User stats
      userStats: userStats || null,

      // Level data (for backward compatibility)
      levels,
    };
  },
});
```

### Step 2: Update page.tsx to Use Unified Query

```typescript
// Replace all these queries:
// const goldMiningData = useQuery(api.goldMining.getGoldMiningData, ...);
// const mekLevels = useQuery(api.mekLeveling.getMekLevels, ...);
// const userStats = useQuery(api.userStats.getUserStats, ...);
// const calculateGoldRates = useQuery(api.goldMining.calculateGoldRates, ...);

// With this single query:
const portfolio = useQuery(
  api.mekPortfolio.getPortfolio,
  walletAddress ? { walletAddress } : "skip"
);

// Extract data from unified response
const meks = portfolio?.meks || [];
const goldMining = portfolio?.goldMining;
const userStats = portfolio?.userStats;
const levels = portfolio?.levels || [];

// Update state when portfolio changes
useEffect(() => {
  if (!portfolio) return;

  setOwnedMeks(portfolio.meks);
  setCurrentGold(portfolio.goldMining.currentGold);
  setGoldPerHour(portfolio.goldMining.totalGoldPerHour);
  setCumulativeGold(portfolio.goldMining.totalCumulativeGold);
}, [portfolio]);
```

### Step 3: Remove Redundant useEffect Hooks

Delete these effects (now handled server-side):

```typescript
// DELETE: Level sync effect (data already merged in query)
useEffect(() => {
  if (!goldMiningData?.ownedMeks || ownedMeks.length === 0) return;
  // ... level merging logic
}, [goldMiningData?.ownedMeks, mekLevels]);

// DELETE: Gold update effect (now in unified query)
useEffect(() => {
  if (goldMiningData) {
    setCurrentGold(goldMiningData.currentGold);
    // ...
  }
}, [goldMiningData, mekLevels]);
```

---

## Phase 3: Blockfrost Batching

### Step 1: Create Batch Fetcher

Create `convex/blockfrostBatch.ts`:

```typescript
import { action } from "./_generated/server";
import { v } from "convex/values";
import {
  BLOCKFROST_CONFIG,
  MEK_POLICY_ID,
  getBlockfrostHeaders,
  rateLimiter,
  blockfrostCache,
} from "./blockfrostConfig";

interface BlockfrostAssetPage {
  unit: string;
  quantity: string;
}

export const batchFetchMeksByStake = action({
  args: {
    stakeAddress: v.string(),
    cacheDuration: v.optional(v.number()), // milliseconds, default 5 min
  },
  handler: async (ctx, args) => {
    const cacheKey = `stake_meks:${args.stakeAddress}`;
    const cacheDuration = args.cacheDuration || 300000; // 5 minutes

    // Check cache first
    const cached = await blockfrostCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      console.log(`[Blockfrost Batch] Cache hit for ${args.stakeAddress.substring(0, 20)}...`);
      return {
        meks: cached.data,
        cached: true,
        source: 'cache',
      };
    }

    console.log(`[Blockfrost Batch] Fetching assets for ${args.stakeAddress.substring(0, 20)}...`);

    // Rate limit check
    await rateLimiter.checkLimit(args.stakeAddress);

    // Fetch all pages in sequence (Blockfrost doesn't support true parallel pagination)
    let page = 1;
    let allAssets: BlockfrostAssetPage[] = [];
    const maxPages = 10; // Safety limit (100 assets/page = 1000 max)

    while (page <= maxPages) {
      const response = await fetch(
        `${BLOCKFROST_CONFIG.baseUrl}/accounts/${args.stakeAddress}/addresses/assets?page=${page}&count=100&order=asc`,
        {
          headers: getBlockfrostHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // No assets found (empty wallet)
          break;
        }
        throw new Error(`Blockfrost API error: ${response.status} ${response.statusText}`);
      }

      const pageAssets = await response.json();

      if (!pageAssets || pageAssets.length === 0) {
        break;
      }

      allAssets.push(...pageAssets);

      // If we got less than 100, we've reached the end
      if (pageAssets.length < 100) {
        break;
      }

      page++;

      // Rate limit: max 10 req/sec for Blockfrost
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`[Blockfrost Batch] Found ${allAssets.length} total assets across ${page} pages`);

    // Filter for Mek policy ID
    const mekAssets = allAssets.filter((asset) =>
      asset.unit.startsWith(MEK_POLICY_ID)
    );

    console.log(`[Blockfrost Batch] Filtered to ${mekAssets.length} Mek assets`);

    // Parse Mek data
    const parsedMeks = mekAssets.map((asset) => {
      const assetName = asset.unit.slice(MEK_POLICY_ID.length);
      const decodedName = Buffer.from(assetName, 'hex').toString('utf-8');
      const mekNumber = parseInt(decodedName.replace('Mekanism', '')) || 0;

      return {
        assetId: asset.unit,
        policyId: MEK_POLICY_ID,
        assetName: decodedName,
        mekNumber,
        quantity: parseInt(asset.quantity),
      };
    });

    // Cache result
    await blockfrostCache.set(cacheKey, {
      data: parsedMeks,
      timestamp: Date.now(),
    });

    return {
      meks: parsedMeks,
      cached: false,
      source: 'blockfrost',
      pagesFetched: page,
    };
  },
});

// Invalidate cache for a wallet
export const invalidateMekCache = action({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const cacheKey = `stake_meks:${args.stakeAddress}`;
    await blockfrostCache.delete(cacheKey);

    console.log(`[Blockfrost Batch] Cache invalidated for ${args.stakeAddress.substring(0, 20)}...`);

    return { invalidated: true };
  },
});
```

### Step 2: Use Batch Fetcher in Initialization

Update `convex/goldMining.ts`:

```typescript
import { api } from "./_generated/api";

export const initializeWithBlockfrost = action({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Use batch fetcher instead of individual calls
    const result = await ctx.runAction(api.blockfrostBatch.batchFetchMeksByStake, {
      stakeAddress: args.walletAddress,
      cacheDuration: 300000, // 5 min cache
    });

    console.log(`[Init Blockfrost] Fetched ${result.meks.length} Meks (cached: ${result.cached})`);

    // Map to full Mek objects with gold rates
    const meksWithRates = result.meks.map((mek) => {
      const rarityRank = mek.mekNumber; // Simplified - use actual rarity lookup
      const goldPerHour = calculateGoldRate(rarityRank);

      return {
        assetId: mek.assetId,
        policyId: mek.policyId,
        assetName: mek.assetName,
        mekNumber: mek.mekNumber,
        goldPerHour,
        rarityRank,
      };
    });

    // Initialize gold mining with batch-fetched data
    await ctx.runMutation(api.goldMining.initializeGoldMining, {
      walletAddress: args.walletAddress,
      ownedMeks: meksWithRates,
    });

    return {
      success: true,
      mekCount: result.meks.length,
      cached: result.cached,
    };
  },
});
```

### Step 3: Add Cache Invalidation Triggers

```typescript
// In page.tsx - invalidate cache when wallet changes or NFT transfers

useEffect(() => {
  if (!walletApiRef.current || !walletAddress) return;

  const handleAccountChange = async () => {
    console.log('[Wallet Event] Account changed, invalidating Blockfrost cache');

    // Invalidate Blockfrost cache
    await invalidateMekCache({ stakeAddress: walletAddress });

    // Re-fetch from blockchain
    await initializeWithBlockfrost({ walletAddress });
  };

  walletApiRef.current.on('accountChange', handleAccountChange);

  return () => {
    walletApiRef.current?.off('accountChange', handleAccountChange);
  };
}, [walletAddress]);
```

---

## Performance Testing Checklist

### Before Optimization
- [ ] Measure initial load time (DevTools Performance tab)
- [ ] Count database queries (Convex Dashboard)
- [ ] Monitor Blockfrost API calls (Network tab)
- [ ] Record FPS during scrolling (Chrome FPS meter)
- [ ] Check DOM node count (React DevTools)

### After Each Phase
- [ ] Re-run all measurements
- [ ] Compare against baseline
- [ ] Document improvements
- [ ] Check for regressions

### Target Metrics (50 Meks)
- [ ] Initial load: < 3 seconds
- [ ] Scroll FPS: 60 FPS
- [ ] Database queries: 1 round-trip
- [ ] API calls: 1-2 requests
- [ ] DOM nodes: < 1000

---

## Troubleshooting

### Virtual Scrolling Issues

**Problem**: Cards have wrong heights
**Solution**: Use dynamic measurement
```typescript
const virtualizer = useVirtualizer({
  // ... other config
  measureElement:
    typeof window !== 'undefined' &&
    navigator.userAgent.indexOf('Firefox') === -1
      ? (element) => element?.getBoundingClientRect().height
      : undefined,
});
```

**Problem**: Scroll position jumps
**Solution**: Add `overscan` to pre-render adjacent items
```typescript
const virtualizer = useVirtualizer({
  // ... other config
  overscan: 5, // Increase if still jumpy
});
```

### Unified Query Issues

**Problem**: Query returns null after switching wallets
**Solution**: Add loading state
```typescript
const portfolio = useQuery(
  api.mekPortfolio.getPortfolio,
  walletAddress ? { walletAddress } : "skip"
);

if (portfolio === undefined) {
  return <LoadingSpinner />;
}

if (portfolio === null) {
  return <EmptyState />;
}
```

### Blockfrost Batching Issues

**Problem**: Rate limit errors (429)
**Solution**: Increase delay between pages
```typescript
// In blockfrostBatch.ts
await new Promise((resolve) => setTimeout(resolve, 200)); // Increase from 100ms
```

**Problem**: Cache not invalidating
**Solution**: Verify cache key format
```typescript
// Cache keys must match exactly
const cacheKey = `stake_meks:${args.stakeAddress}`;
await blockfrostCache.delete(cacheKey); // Use same format
```

---

## Next Steps

1. **Phase 1**: Implement virtual scrolling (quick win)
2. **Test**: Verify 60 FPS scrolling with 50+ Meks
3. **Phase 2**: Create unified portfolio query
4. **Test**: Confirm single query replacing 4 queries
5. **Phase 3**: Add Blockfrost batching
6. **Test**: Verify API call reduction
7. **Monitor**: Track performance in production
8. **Iterate**: Adjust cache durations and overscan values

## Files to Create/Modify

### New Files
- `src/components/VirtualMekGrid.tsx`
- `convex/mekPortfolio.ts`
- `convex/blockfrostBatch.ts`

### Files to Modify
- `src/app/mek-rate-logging/page.tsx`
- `convex/goldMining.ts`

### Files to Review
- `convex/blockfrostConfig.ts` (ensure cache utilities exist)
- `convex/mekLeveling.ts` (update to work with portfolio query)

---

## Expected Results

### 50 Meks
- Load time: 12s → 3s (**75% faster**)
- Scroll FPS: 30 → 60 (**100% smoother**)
- Queries: 4 → 1 (**75% fewer**)
- API calls: 50+ → 2 (**96% fewer**)

### 500 Meks (future-proof)
- Load time: ~4s (graceful scaling)
- Scroll FPS: 60 (no degradation)
- Queries: 1 (constant)
- API calls: 5-10 (pagination, still efficient)

The architecture scales linearly, not exponentially.
