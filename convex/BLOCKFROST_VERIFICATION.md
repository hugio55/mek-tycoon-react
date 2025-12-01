# Blockfrost Blockchain Verification System

## Overview

This system provides on-chain verification of NFT sales and deliveries using the Blockfrost API. It verifies that "sold" NFTs were actually delivered to buyers' wallets on the Cardano blockchain, providing an extra layer of trust beyond NMKR webhook data alone.

## Key Features

✅ **Verify NFT Delivery**: Confirms NFTs left NMKR's escrow wallet and reached buyer wallets
✅ **Batch Processing**: Verifies multiple NFTs efficiently with automatic rate limiting
✅ **Transaction Validation**: Optionally verifies transaction hashes on-chain
✅ **Detailed Reporting**: Provides comprehensive verification status for each NFT
✅ **Rate Limiting**: Built-in 100ms delays between requests to respect Blockfrost quotas

## Architecture

### Files

- **`convex/blockfrost.ts`** - Core Blockfrost API integration
- **`convex/campaignSync.ts`** - Campaign sync with blockchain verification
- **`.env.local`** - Environment configuration

### Key Functions

#### `verifyNFTDelivery`
Verifies single NFT delivery on-chain.

**Checks:**
1. NFT exists on blockchain
2. NFT is not in NMKR escrow wallet
3. NFT was delivered to buyer's wallet
4. (Optional) Transaction hash matches expected

**Returns:**
```typescript
{
  verified: boolean,
  delivered: boolean,
  currentOwner?: string,
  inNmkrWallet?: boolean,
  transactionValid?: boolean,
  error?: string
}
```

#### `verifyNFTBatch`
Verifies multiple NFTs with automatic rate limiting.

**Features:**
- Processes all NFTs in array
- 100ms delay between requests (10 req/sec max)
- Comprehensive summary statistics
- Individual results for each NFT

**Returns:**
```typescript
{
  results: Array<{
    nftUid: string,
    verified: boolean,
    delivered: boolean,
    currentOwner?: string,
    error?: string
  }>,
  summary: {
    total: number,
    verified: number,
    delivered: number,
    inEscrow: number,
    failed: number,
    verificationRate: string
  }
}
```

#### `constructAssetId`
Constructs Cardano asset ID from policy ID and asset name.

**Handles:**
- Plain text asset names (converts to hex)
- Hex-encoded asset names (uses as-is)
- Asset ID format: `{policyId}{hexAssetName}` (no separator)

## Asset ID Construction

### Understanding Cardano Asset IDs

A Cardano asset ID is constructed by concatenating:
1. **Policy ID** - 56 hex characters (28 bytes)
2. **Asset Name** - Variable length hex string

**Format:** `{policyId}{hexAssetName}`

**Example:**
```
Policy ID: 29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6
Asset Name: "MetadataNFT01" (plain text)
Hex Encoded: 4d657461646174614e46543031
Asset ID: 29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c64d657461646174614e46543031
```

### Asset Name Encoding

NMKR may provide asset names in two formats:

**Plain Text:**
```
"MetadataNFT01"
```

**Hex-Encoded:**
```
"4d657461646174614e46543031"
```

The `constructAssetId` function automatically detects the format and handles conversion.

## Integration with Campaign Sync

### Sync Process (Step 8)

When a campaign sync runs:

1. **Identify Sold NFTs**: Filters inventory for status === "sold"
2. **Build Asset IDs**: Constructs asset ID for each sold NFT
3. **Batch Verification**: Verifies all NFTs on-chain with rate limiting
4. **Transform Results**: Maps verification results to UI-friendly format
5. **Return Summary**: Provides aggregate statistics

### Verification Statuses

- **`delivered`** - NFT successfully delivered to buyer's wallet
- **`pending_delivery`** - NFT still in NMKR escrow wallet (payment complete but not sent)
- **`unknown`** - NFT verified on-chain but location unclear
- **`error`** - Verification failed (NFT not found, API error, etc.)

## Environment Variables

Required configuration in `.env.local`:

```env
# Blockfrost API Configuration
BLOCKFROST_API_KEY=mainnetVVJ62rD2aJxjvDQvsABxGSPy4jtaMAbW
BLOCKFROST_API_URL=https://cardano-mainnet.blockfrost.io/api/v0

# For preprod testing:
# BLOCKFROST_API_URL=https://cardano-preprod.blockfrost.io/api/v0
```

### Getting a Blockfrost API Key

1. Sign up at https://blockfrost.io/
2. Create a new project
3. Choose network (mainnet or preprod)
4. Copy the project ID (this is your API key)
5. Add to `.env.local`

## Rate Limiting

### Blockfrost Quotas

**Free Tier:**
- 50,000 requests/day
- 10 requests/second

**Strategy:**
- 100ms delay between requests in batch operations
- Automatic retry on 429 (rate limit) responses
- Graceful degradation on API failures

### Monitoring Usage

Check your Blockfrost dashboard:
- https://blockfrost.io/dashboard

Monitor console logs for rate limit warnings:
```
[🛡️BLOCKFROST] Rate limit exceeded - please try again later
```

## Error Handling

### Common Errors

**"NFT not found on blockchain"**
- Asset ID construction may be incorrect
- NFT hasn't been minted yet
- Wrong network (mainnet vs preprod)

**"NFT still in NMKR escrow wallet"**
- Payment completed but delivery pending
- NMKR processing delay
- Check NMKR Studio for transaction status

**"Rate limit exceeded"**
- Too many requests in short time
- Wait and retry
- Consider upgrading Blockfrost plan

**"Invalid asset ID"**
- Asset name encoding issue
- Policy ID incorrect
- Check NMKR project details

## Testing

### Test Single NFT Verification

```typescript
// From Convex dashboard or action
const result = await ctx.runAction(api.blockfrost.verifyNFTDelivery, {
  assetId: "29d222ce...4e46543031", // Full asset ID
  nmkrWalletAddress: "addr1...", // NMKR escrow address
});

console.log(result);
```

### Test Batch Verification

```typescript
const batchResult = await ctx.runAction(api.blockfrost.verifyNFTBatch, {
  nfts: [
    {
      nftUid: "10aec295-d9e2-47e3-9c04-e56e2df92ad5",
      assetId: "29d222ce...4e46543031",
      name: "Lab Rat #1",
    },
    // ... more NFTs
  ],
  nmkrWalletAddress: "addr1...",
});

console.log(batchResult.summary);
```

### Test Asset ID Construction

```typescript
const assetIdResult = await ctx.runAction(api.blockfrost.constructAssetId, {
  policyId: "29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6",
  assetName: "MetadataNFT01", // Plain text or hex
});

console.log(assetIdResult.assetId);
```

## Debugging

### Enable Searchable Debug Tags

All Blockfrost operations use the `[🛡️BLOCKFROST]` tag in console logs.

**Filter console logs:**
1. Open browser console (F12)
2. Type "BLOCKFROST" in filter box
3. See only blockchain verification logs

### Common Debug Scenarios

**Verify asset ID construction:**
```
[🛡️BLOCKFROST] Constructing asset ID:
[🛡️BLOCKFROST]   Policy ID: 29d222ce...267170c6
[🛡️BLOCKFROST]   Asset Name: MetadataNFT01
[🛡️BLOCKFROST]   Hex Asset Name: 4d657461646174614e46543031
[🛡️BLOCKFROST]   Asset ID: 29d222ce...4e46543031
```

**Track batch progress:**
```
[🛡️BLOCKFROST] Starting batch verification of 10 NFTs
[🛡️BLOCKFROST] Verifying 1/10: 10aec295-d9e2-47e3-9c04-e56e2df92ad5
[🛡️BLOCKFROST] Verifying 2/10: 2fab3e12-8f4a-4bcd-9123-c4e5f6a7b8d9
...
[🛡️BLOCKFROST] Batch verification complete:
[🛡️BLOCKFROST]   ✅ Verified: 8
[🛡️BLOCKFROST]   📦 Delivered: 7
[🛡️BLOCKFROST]   🏦 In Escrow: 1
[🛡️BLOCKFROST]   ❌ Failed: 2
```

## API Reference

### Blockfrost Endpoints Used

**Get Asset Addresses:**
```
GET /assets/{asset}/addresses
Returns current addresses holding the NFT
```

**Get Asset Info:**
```
GET /assets/{asset}
Returns NFT metadata and mint information
```

**Get Transaction:**
```
GET /txs/{hash}
Verifies transaction hash on-chain
```

### Response Formats

**Asset Addresses:**
```json
[
  {
    "address": "addr1qx...",
    "quantity": "1"
  }
]
```

**Asset Info:**
```json
{
  "asset": "29d222ce...4e46543031",
  "policy_id": "29d222ce...267170c6",
  "asset_name": "4d657461646174614e46543031",
  "fingerprint": "asset1...",
  "quantity": "1",
  "initial_mint_tx_hash": "abc123...",
  "mint_or_burn_count": 1,
  "onchain_metadata": {...}
}
```

## Security Considerations

### API Key Security

⚠️ **Never expose Blockfrost API keys in client-side code**

✅ **Correct:** Store in `.env.local` (server-side only)
❌ **Wrong:** Store in `NEXT_PUBLIC_*` variables (exposed to client)

### Verification Trust

This system provides **additional verification** beyond NMKR webhooks:

- **NMKR Webhooks**: Fast, convenient, but trust NMKR's reporting
- **Blockchain Verification**: Slower, but trustless - verifies actual on-chain state

**Best Practice:** Use webhooks for real-time updates, blockchain verification for auditing and disputes.

## Troubleshooting

### "Asset not found" but NMKR shows sold

**Possible causes:**
1. Wrong network (mainnet vs preprod)
2. Asset ID construction error
3. Minting transaction hasn't confirmed yet

**Solution:**
- Verify policy ID matches NMKR project
- Check asset name encoding (hex vs plain text)
- Wait 1-2 minutes for blockchain confirmation

### Verification always shows "pending_delivery"

**Possible causes:**
1. NMKR hasn't sent NFTs yet
2. Wrong NMKR escrow address
3. NMKR using different wallet per project

**Solution:**
- Check NMKR Studio transaction history
- Verify NMKR project's `payinAddress`
- Contact NMKR support if persistent

### Rate limiting errors

**Possible causes:**
1. Too many NFTs verified at once
2. Other services using same API key
3. Free tier quota exceeded

**Solution:**
- Reduce batch size
- Add longer delays (increase from 100ms)
- Upgrade Blockfrost plan

## Future Enhancements

Potential improvements:

- [ ] Cache verification results (NFT ownership doesn't change often)
- [ ] Webhook integration (verify immediately on sale)
- [ ] Historical verification (re-verify periodically)
- [ ] Multi-network support (automatic mainnet/preprod switching)
- [ ] Verification history tracking (store results in database)
- [ ] Smart retry logic (exponential backoff on failures)

## Resources

- **Blockfrost Documentation**: https://docs.blockfrost.io/
- **Cardano Asset IDs**: https://cips.cardano.org/cips/cip25/
- **NMKR API Docs**: https://studio-api.nmkr.io/swagger/index.html
- **Convex Actions**: https://docs.convex.dev/functions/actions
