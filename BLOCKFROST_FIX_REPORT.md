# Blockfrost API Integration Fix Report

## Issue Identified
The gold mining snapshot system was failing with "Invalid project token" (403 error) when attempting to verify wallet ownership on-chain.

## Root Cause Analysis

### 1. Environment Variable Mismatch
- **`.env.local`** contained: `BLOCKFROST_API_KEY=mainnetVVJ62rD2aJxjvDQvsABxGSPy4jtaMAbW`
- **Convex environment** had: `BLOCKFROST_API_KEY=mainnetqkT4H0EhqMhyUGsoiRacoNCWc7iFuHjA` (different key)

### 2. Critical Understanding: Convex Environment Variables
Convex backend functions (actions/mutations/queries) **cannot access `.env.local` files**. They must use environment variables set in the Convex deployment via:
```bash
npx convex env set VARIABLE_NAME value
```

The code was correctly using `process.env.BLOCKFROST_API_KEY` in actions, which accesses Convex's environment - NOT the `.env.local` file.

## Fixes Applied

### 1. Updated Convex Environment Variable
```bash
npx convex env set BLOCKFROST_API_KEY mainnetVVJ62rD2aJxjvDQvsABxGSPy4jtaMAbW
```

**Result**: API key now matches between `.env.local` and Convex environment.

### 2. Improved Error Handling in getWalletAssetsFlexible.ts
Added explicit API key validation at the start of the action handler:
```typescript
// Get API key from Convex environment variables
const apiKey = process.env.BLOCKFROST_API_KEY;

if (!apiKey) {
  return {
    success: false,
    error: 'Blockfrost API key not configured in Convex environment',
    meks: [],
    totalMeks: 0
  };
}
```

### 3. Refactored blockfrostRequest Function
Changed from relying on internal `process.env` access to accepting API key as parameter:
```typescript
// Before:
async function blockfrostRequest(endpoint: string): Promise<any> {
  const apiKey = process.env.BLOCKFROST_API_KEY;
  // ...
}

// After:
async function blockfrostRequest(apiKey: string, endpoint: string): Promise<any> {
  // API key passed as parameter for better testability
}
```

## Verification

### API Key Test
Direct curl test confirms the API key works:
```bash
curl -H "project_id: mainnetVVJ62rD2aJxjvDQvsABxGSPy4jtaMAbW" \
  "https://cardano-mainnet.blockfrost.io/api/v0/accounts/stake1u8zevs34vf4wrsz6xs64zuztdk4agzvpg6c8zv4plesp9ughgq076/addresses"
```

**Result**: Successfully returned 100+ payment addresses associated with the stake address.

## Files Modified

1. **`convex/getWalletAssetsFlexible.ts`**
   - Updated `blockfrostRequest()` function signature to accept API key
   - Added API key validation in action handler
   - Updated all `blockfrostRequest()` calls to pass API key

## Important Notes for Future Development

### Convex Environment Variables
- **Frontend (.env.local)**: Use `NEXT_PUBLIC_` prefix for client-side access
- **Backend (Convex)**: Must set via `npx convex env set KEY value`
- **Access Pattern**: Use `process.env.KEY` in Convex actions/mutations/queries

### Blockfrost API Key Management
The project now uses a single API key stored in two places:
- **Convex environment**: For backend blockchain verification
- **`.env.local`**: For documentation/reference (not actually used by Convex)

To update the API key in the future:
```bash
# Update Convex environment (required for backend)
npx convex env set BLOCKFROST_API_KEY your_new_key_here

# Update .env.local (optional, for reference)
# Edit the file manually
```

### Other Files Using Blockfrost
These files also access `process.env.BLOCKFROST_API_KEY` and will now work correctly:
- `convex/blockchainVerification.ts`
- `convex/discordIntegration.ts`
- `convex/blockfrostService.ts`
- `convex/getAllMekHolders.ts`
- `convex/metadataResolution.ts`

All these files correctly use `process.env` which accesses the Convex environment variables.

## Next Steps

1. **Test the manual snapshot**: Try triggering a manual snapshot from the admin interface
2. **Monitor logs**: Check Convex logs for successful blockchain queries
3. **Verify gold calculations**: Ensure MEK counts are correctly retrieved from blockchain
4. **Consider caching**: Implement Blockfrost response caching to reduce API calls and improve performance

## Security Recommendations

1. **Never commit API keys**: Ensure `.env.local` is in `.gitignore`
2. **Rotate keys periodically**: Blockfrost allows generating new project tokens
3. **Monitor usage**: Check Blockfrost dashboard for API call quotas and rate limits
4. **Implement circuit breakers**: Add fallback logic if Blockfrost is down or rate-limited

## Blockchain Verification Architecture

The gold mining snapshot system now properly verifies on-chain ownership:

```
User Wallet Address (stake1...)
    ↓
Blockfrost API: /accounts/{stake}/addresses
    ↓
Get all payment addresses (addr1...)
    ↓
For each address: /addresses/{addr}/utxos
    ↓
Parse UTXOs for MEK NFTs (policy ID match)
    ↓
Calculate gold rates based on verified MEKs
    ↓
Update database with snapshot
```

This architecture ensures:
- **Trust-minimized verification**: Server independently verifies NFT ownership
- **Client-side manipulation prevented**: Users cannot fake MEK ownership
- **Snapshot history**: Immutable record of verified ownership over time
- **Exploit protection**: Gold calculations based on verified blockchain data
