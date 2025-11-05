# On-Chain NFT Sales Verification Research

## Executive Summary

**Feasibility: HIGH** - Blockchain verification is fully viable as a primary or backup method for tracking NFT sales.

**Key Finding**: Even without NMKR webhooks, we can reliably track sales by monitoring the Cardano blockchain using Blockfrost API. Each NFT has a unique asset ID that can be tracked through transactions and ownership changes.

---

## 1. On-Chain Verification Approach

### How It Works

1. **Asset Identification**: Each NFT has a unique asset ID = `policyId + assetNameHex`
   - Policy ID: `6646f2c8a1f45dabd89648891bc661539a26375ae80e8f12638f1241`
   - Asset name is hex-encoded (e.g., "LabRat001" → hex)
   - Full asset ID: `6646f2c8...{assetNameHex}`

2. **Ownership Detection**: Use Blockfrost to check where the NFT currently resides
   - Endpoint: `GET /assets/{asset}/addresses`
   - Returns list of addresses holding the asset
   - When address changes from NMKR escrow → buyer wallet = SALE

3. **Transaction History**: Track every transfer
   - Endpoint: `GET /assets/{asset}/transactions`
   - Shows complete transaction history with timestamps
   - Can detect when NFT moved from our minting address

### NMKR Sales Flow

```
MINT → NMKR Escrow → Payment Complete → Buyer Wallet
  ↓          ↓               ↓                ↓
 We do   NMKR holds    Money paid      NFT delivered
  this    it for us   (we get ADA)    (detect this!)
```

**Detection Point**: When NFT appears in a non-NMKR address, it was sold.

---

## 2. Blockfrost API Integration

### Key Endpoints

#### A. Check Asset Ownership
```
GET /assets/{asset}/addresses
Returns: [{ address: "addr1...", quantity: "1" }]
```

**Use Case**: Check if NFT is still in NMKR escrow or has been delivered to buyer.

#### B. Asset Transaction History
```
GET /assets/{asset}/transactions
Returns: [
  {
    tx_hash: "abc123...",
    tx_index: 0,
    block_height: 8234567,
    block_time: 1701234567
  },
  ...
]
```

**Use Case**: Get complete history of NFT transfers to detect sales.

#### C. Transaction Details
```
GET /txs/{tx_hash}
GET /txs/{tx_hash}/utxos
```

**Use Case**: Get detailed info about who received the NFT and when.

#### D. Policy-Wide Monitoring
```
GET /assets/policy/{policy_id}
```

**Use Case**: Get all NFTs under our policy to track new mints and transfers.

### Rate Limits

- **Free Tier**: 50,000 requests/day
- **Rate**: 10 requests/second (burst: 500 requests)
- **Cooldown**: 50 seconds for full burst recovery
- **Error Codes**:
  - 429 = Rate limited (too fast)
  - 402 = Daily limit exceeded

**Safe Polling Interval**: 100ms between requests (stays at 10 req/sec)

---

## 3. Polling vs Webhooks vs Hybrid

### Option A: Pure Blockchain Polling

**How**: Scheduled Convex job checks Blockfrost every N minutes.

**Pros**:
- No dependency on NMKR webhooks
- We control the checking logic
- Can verify sales retrospectively
- Works even if NMKR changes their system

**Cons**:
- Delay between sale and detection (1-5 minutes)
- API call costs (rate limits)
- Must track state to avoid re-processing

**Best For**: Backup system, or if NMKR webhooks don't exist.

### Option B: NMKR Webhooks Only

**How**: NMKR calls our endpoint when sale completes.

**Pros**:
- Immediate notification (real-time)
- No polling overhead
- Lower API usage

**Cons**:
- Depends on NMKR reliability
- If webhook fails, we miss the sale
- Need public endpoint for webhooks
- Webhook might not include all data we need

**Best For**: Primary system if NMKR supports it well.

### Option C: Hybrid (RECOMMENDED)

**How**: Use NMKR webhooks + blockchain polling as backup.

**Implementation**:
1. NMKR webhook marks NFT as "pending verification"
2. Blockchain poller confirms ownership change
3. Only update to "sold" after blockchain confirms
4. Periodic sync job catches any webhook failures

**Pros**:
- Immediate notification from webhook
- Blockchain verification ensures accuracy
- Catches missed webhooks
- Can detect sales NMKR doesn't report

**Cons**:
- More complex implementation
- Slightly higher API usage

**Best For**: Production system requiring reliability.

---

## 4. Implementation Architecture

### Database Schema Changes

Add to `commemorativeNFTInventory`:
```typescript
{
  // Existing fields...
  assetId: v.optional(v.string()), // Full Cardano asset ID
  mintTransactionHash: v.optional(v.string()), // TX where NFT was minted
  lastBlockchainCheck: v.optional(v.number()), // Timestamp of last verification
  blockchainOwner: v.optional(v.string()), // Current on-chain owner address
  soldTransactionHash: v.optional(v.string()), // TX where NFT was sold
  soldBlockTime: v.optional(v.number()), // When blockchain recorded sale
}
```

### Convex Scheduled Job

```typescript
// convex/crons.ts
export default cronJobs();

crons.interval(
  "verify-nft-sales",
  { minutes: 5 }, // Check every 5 minutes
  internal.nftVerification.verifyPendingSales
);
```

### Background Verification Function

```typescript
// convex/nftVerification.ts
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const verifyPendingSales = internalAction({
  handler: async (ctx) => {
    // 1. Get all NFTs in "reserved" or "available" status
    const inventory = await ctx.runQuery(
      internal.inventory.getPendingVerification
    );

    // 2. For each NFT, check Blockfrost
    for (const nft of inventory) {
      if (!nft.assetId) continue;

      try {
        // Check current owner
        const addresses = await blockfrostRequest(
          `/assets/${nft.assetId}/addresses`
        );

        // If no longer in NMKR address, it was sold
        if (addresses.length > 0) {
          const currentOwner = addresses[0].address;

          // Check if this is a new owner (not NMKR escrow)
          if (currentOwner !== NMKR_ESCROW_ADDRESS) {
            // Get transaction details
            const txs = await blockfrostRequest(
              `/assets/${nft.assetId}/transactions?count=1&order=desc`
            );

            if (txs.length > 0) {
              const saleTx = txs[0];

              // Update inventory to "sold"
              await ctx.runMutation(
                internal.inventory.markAsSold,
                {
                  nftId: nft._id,
                  soldTransactionHash: saleTx.tx_hash,
                  soldBlockTime: saleTx.block_time,
                  blockchainOwner: currentOwner,
                }
              );

              // Update campaign stats
              await ctx.runMutation(
                internal.campaigns.updateCampaignStats,
                { campaignId: nft.campaignId }
              );
            }
          }
        }

        // Update last check timestamp
        await ctx.runMutation(
          internal.inventory.updateLastCheck,
          { nftId: nft._id, timestamp: Date.now() }
        );

      } catch (error) {
        console.error(`[VERIFY] Error checking NFT ${nft.nftUid}:`, error);
        // Continue with next NFT
      }

      // Respect rate limits (100ms between requests)
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  },
});
```

### Mapping Strategy

**Problem**: How to map NMKR NFT UID to Cardano asset ID?

**Solution 1: Store During Mint**
- When we mint via NMKR API, NMKR returns the asset ID
- Store it immediately in `commemorativeNFTInventory.assetId`
- This is the cleanest approach

**Solution 2: Query By Policy + Asset Name**
- Asset name is typically the NFT name or number
- Convert NFT name to hex → `assetNameHex`
- Construct asset ID: `policyId + assetNameHex`
- Use this to query Blockfrost

**Solution 3: Query All Assets By Policy**
- Use `GET /assets/policy/{policy_id}` to get all assets
- Parse metadata to match NMKR NFT UID or name
- Cache this mapping in database

**Recommended**: Solution 1 (store during mint) + Solution 3 as fallback.

---

## 5. Cost & Performance Analysis

### Blockfrost API Costs

**Free Tier**:
- 50,000 requests/day
- Sufficient for most indie projects

**Usage Estimates**:
- 100 NFTs in campaign
- Check each NFT every 5 minutes
- 100 NFTs × 12 checks/hour × 24 hours = 28,800 requests/day
- ✅ Fits within free tier

**Paid Plans** (if needed):
- Hobby: $9/month → 250k requests/day
- Pro: $49/month → 1M requests/day

### Polling Intervals

**5 minutes**: Good balance (delay acceptable for sales tracking)
**1 minute**: Higher API usage but near real-time
**15 minutes**: Lower API usage, longer delay

**Recommendation**: Start with 5 minutes, adjust based on volume.

---

## 6. Code Examples

### Example: Check NFT Ownership

```typescript
// Check if NFT has been sold
async function checkNFTSold(assetId: string): Promise<{
  sold: boolean;
  owner?: string;
  txHash?: string;
}> {
  try {
    // Get current owner
    const response = await fetch(
      `https://cardano-mainnet.blockfrost.io/api/v0/assets/${assetId}/addresses`,
      {
        headers: {
          'project_id': process.env.BLOCKFROST_API_KEY!
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Blockfrost error: ${response.status}`);
    }

    const addresses = await response.json();

    if (addresses.length === 0) {
      // NFT doesn't exist yet or burned
      return { sold: false };
    }

    const currentOwner = addresses[0].address;

    // Check if owner is NOT NMKR escrow address
    const NMKR_ADDRESSES = [
      // Add known NMKR addresses here
      "addr1...",
    ];

    const isSold = !NMKR_ADDRESSES.includes(currentOwner);

    if (isSold) {
      // Get most recent transaction
      const txResponse = await fetch(
        `https://cardano-mainnet.blockfrost.io/api/v0/assets/${assetId}/transactions?count=1&order=desc`,
        {
          headers: {
            'project_id': process.env.BLOCKFROST_API_KEY!
          }
        }
      );

      const txs = await txResponse.json();
      const txHash = txs.length > 0 ? txs[0].tx_hash : undefined;

      return {
        sold: true,
        owner: currentOwner,
        txHash,
      };
    }

    return { sold: false };

  } catch (error) {
    console.error('Error checking NFT ownership:', error);
    throw error;
  }
}
```

### Example: Batch Check All Campaign NFTs

```typescript
// Check all NFTs in a campaign for sales
async function batchVerifyCampaignSales(
  campaignId: Id<"commemorativeCampaigns">
): Promise<{
  checked: number;
  sold: number;
  errors: number;
}> {
  const inventory = await ctx.db
    .query("commemorativeNFTInventory")
    .withIndex("by_campaign_and_status", (q) =>
      q.eq("campaignId", campaignId).eq("status", "reserved")
    )
    .collect();

  let checked = 0;
  let sold = 0;
  let errors = 0;

  for (const nft of inventory) {
    if (!nft.assetId) {
      console.warn(`NFT ${nft.nftUid} missing assetId`);
      continue;
    }

    try {
      const result = await checkNFTSold(nft.assetId);
      checked++;

      if (result.sold) {
        // Mark as sold in database
        await ctx.db.patch(nft._id, {
          status: "sold",
          blockchainOwner: result.owner,
          soldTransactionHash: result.txHash,
          soldBlockTime: Date.now(),
        });
        sold++;

        console.log(`✅ NFT ${nft.nftUid} confirmed sold to ${result.owner}`);
      }

      // Rate limit: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`Error checking NFT ${nft.nftUid}:`, error);
      errors++;
    }
  }

  return { checked, sold, errors };
}
```

### Example: Monitor Entire Policy

```typescript
// Get all NFTs under policy to find new sales
async function monitorPolicyTransactions(): Promise<string[]> {
  const POLICY_ID = "6646f2c8a1f45dabd89648891bc661539a26375ae80e8f12638f1241";

  try {
    // Get all assets under policy
    const response = await fetch(
      `https://cardano-mainnet.blockfrost.io/api/v0/assets/policy/${POLICY_ID}`,
      {
        headers: {
          'project_id': process.env.BLOCKFROST_API_KEY!
        }
      }
    );

    const assets = await response.json();

    // Returns array of asset IDs
    // Example: ["6646f2c8...4d656b31", "6646f2c8...4d656b32", ...]
    return assets.map((asset: any) => asset.asset);

  } catch (error) {
    console.error('Error monitoring policy:', error);
    throw error;
  }
}
```

---

## 7. Recommendations

### For Your Project

**Primary Strategy**: Hybrid approach
1. **Immediate**: Use NMKR webhooks if available (check NMKR docs/support)
2. **Backup**: Implement blockchain polling every 5 minutes
3. **Verification**: All webhook notifications get blockchain confirmation
4. **Recovery**: Daily sync job finds any missed sales

### Implementation Steps

1. **Phase 1: Core Infrastructure** (Week 1)
   - Add `assetId` field to inventory schema
   - Create Blockfrost service functions
   - Test ownership checking on testnet

2. **Phase 2: Polling System** (Week 2)
   - Implement scheduled verification job
   - Add batch checking with rate limiting
   - Create admin UI to view verification status

3. **Phase 3: NMKR Integration** (Week 3)
   - Research NMKR webhook capabilities
   - Create webhook endpoint if available
   - Link webhook to blockchain verification

4. **Phase 4: Monitoring & Optimization** (Week 4)
   - Add logging and alerting
   - Optimize polling intervals based on volume
   - Handle edge cases (failed transactions, etc.)

### Quick Wins

If you need something working TODAY:
1. Store `assetId` when creating inventory
2. Add one-click "Verify Sales" button in admin UI
3. Manually trigger blockchain check
4. Automate later with scheduled jobs

---

## 8. Edge Cases & Considerations

### What If NFT Never Mints?

- NMKR might fail to mint
- Blockchain check would find no asset
- Mark as "mint_failed" after 24 hours

### What If NFT Gets Transferred Multiple Times?

- Only care about FIRST transfer from NMKR
- That's the sale event
- Subsequent transfers are secondary market

### What If Buyer Immediately Lists on Marketplace?

- Still counts as sold (they own it)
- We track NMKR → buyer, not buyer → secondary

### What If Rate Limits Hit?

- Implement exponential backoff
- Queue failed checks for retry
- Use paid Blockfrost tier if needed

### What If Blockchain Is Slow?

- Transaction might take 20-30 seconds
- Polling interval handles this naturally
- Don't check immediately after webhook

---

## 9. Alternative: Koios API

**What Is It**: Community-run, decentralized Cardano API (alternative to Blockfrost)

**Endpoints**:
- `/asset_info?_asset_policy={policy}&_asset_name={name}` - Asset details
- `/asset_address_list?_asset_policy={policy}` - All addresses holding asset
- `/asset_txs?_asset_policy={policy}` - Transaction history

**Pros**:
- Free and decentralized
- No rate limits (community nodes)
- Can self-host

**Cons**:
- Less reliable than Blockfrost
- Documentation less comprehensive
- May have delays

**Recommendation**: Stick with Blockfrost for primary system, consider Koios as fallback.

---

## 10. Conclusion

**Blockchain verification is fully viable** even without NMKR webhooks.

**Key Advantages**:
- ✅ Trustless: Verify sales on-chain, not relying on NMKR reporting
- ✅ Reliable: Blockchain is source of truth
- ✅ Retroactive: Can check sales history anytime
- ✅ Free Tier: Blockfrost free tier sufficient for most projects

**Implementation Complexity**: Medium
- Requires scheduled job setup
- Need to handle rate limits
- Must map NMKR UIDs to asset IDs

**Final Recommendation**:
Build the blockchain verification system as your primary sales tracking mechanism. If NMKR webhooks exist, use them as a notification layer that triggers immediate blockchain verification. This gives you:
- Real-time notifications (webhooks)
- Trustless verification (blockchain)
- Recovery mechanism (polling)
- Future-proof (works even if NMKR changes)

**Next Step**: Contact NMKR support to confirm webhook availability, then implement hybrid system with blockchain polling as foundation.
