# Wallet Address Truncation Issue - Resolution Report

## Problem Summary
User's wallet address was being truncated in the database, missing the first 4 characters ("stak").

- **Expected**: `stake1u8zevs34vf4wrsz6xs64zuztdk4agzvpg6c8zv4plesp9ughgq076` (59 chars)
- **Stored**: `e1u8zevs34vf4wrsz6xs64zuztdk4agzvpg6c8zv4plesp9ughgq076` (55 chars)
- **User**: Discord ID `362994796186435585` (wrenellis)
- **Guild**: `938648161810006119`

## Root Cause Analysis

The investigation revealed:

1. **Three connections** existed for this user:
   - Connection 1: Payment address (addr1...) - 103 chars - INACTIVE
   - Connection 2: **Truncated stake address** (missing "stak") - 55 chars - **WAS ACTIVE**
   - Connection 3: Correct stake address - 59 chars - ACTIVE

2. **Duplicate active connections**: Both Connection 2 (truncated) and Connection 3 (correct) were marked as active simultaneously.

3. **Query issue**: `getDiscordConnectionByDiscordUser` used `.first()` without ordering by `linkedAt`, potentially returning the older truncated address instead of the newer correct one.

4. **Likely cause of truncation**: User copy-paste error during the second linking attempt, missing the first 4 characters.

## Fixes Implemented

### 1. Immediate Fix - Deactivate Truncated Connection
- Created `fix-duplicate-connections.js` script
- Deactivated the truncated wallet connection
- User now has only one active connection (the correct one)

### 2. Query Improvement - Return Most Recent Connection
**File**: `convex/discordIntegration.ts`
- Changed `getDiscordConnectionByDiscordUser` to collect all active connections and return the most recent one
- Prevents stale/incorrect connections from being returned

```typescript
// Now sorts by linkedAt and returns most recent
const sorted = connections.sort((a, b) => b.linkedAt - a.linkedAt);
return sorted[0];
```

### 3. Validation - Prevent Invalid Addresses
**File**: `convex/discordIntegration.ts` - `linkDiscordToWallet` mutation
- Added wallet address format validation
- Rejects addresses that don't start with valid Cardano prefixes
- Prevents truncated/malformed addresses from being stored

```typescript
const isValidFormat =
  args.walletAddress.startsWith('stake1') ||
  args.walletAddress.startsWith('addr1') ||
  args.walletAddress.startsWith('addr_test') ||
  args.walletAddress.startsWith('stake_test') ||
  /^[0-9a-fA-F]{56,60}$/.test(args.walletAddress);
```

### 4. Single Active Connection Enforcement
**File**: `convex/discordIntegration.ts` - `linkDiscordToWallet` mutation
- Automatically deactivates ALL other active connections before creating/updating a new one
- Ensures only ONE active connection per Discord user per guild
- Prevents duplicate active connections from causing confusion

### 5. Input Sanitization
**File**: `discord-bot/bot.js`
- Added `.trim()` to wallet address input
- Added length validation (min 50 characters)
- Added descriptive error messages

### 6. Discord Command Length Constraints
**File**: `discord-bot/bot.js`
- Added `setMinLength(50)` and `setMaxLength(120)` to the wallet option
- Discord will reject inputs that are too short
- Prevents obviously truncated addresses at the UI level

### 7. Debug Logging
- Added comprehensive logging throughout the flow
- Bot logs wallet address and length at input
- Mutation logs wallet address and length when called
- Helps identify where issues occur in the future

## Debug Tools Created

### `convex/debugDiscordConnection.ts`
- `debugGetConnection`: Check what's stored for a specific user
- `fixTruncatedWallet`: Update a wallet address for a user

### `convex/debugAllConnections.ts`
- `getAllConnectionsForUser`: See all connections (active and inactive) for a user
- `findTruncatedAddresses`: Find all connections with invalid address formats

### Scripts
- `test-wallet-storage.js`: Check database state for a user
- `find-all-connections.js`: List all connections and find truncated ones
- `fix-duplicate-connections.js`: Deactivate truncated connections
- `fix-truncated-wallet.js`: Update a specific user's wallet address

## Verification

After fix:
```
Connection 1: addr1q8vann... (103 chars) - INACTIVE ✓
Connection 2: e1u8zevs... (55 chars) - INACTIVE ✓
Connection 3: stake1u8zevs... (59 chars) - ACTIVE ✓

No truncated addresses are active ✓
```

## Prevention Measures

1. **Validation at entry**: Both Discord command and Convex mutation validate format
2. **Length constraints**: Discord enforces min/max length
3. **Single active connection**: Automatic deactivation of old connections
4. **Most recent connection**: Query returns newest connection if duplicates exist
5. **Logging**: Comprehensive logs for debugging future issues
6. **Input sanitization**: Trim whitespace to prevent accidental spaces

## Commands to Register Updates

The bot needs to be restarted to pick up the changes to `bot.js`. The Convex functions are automatically deployed.

```bash
# Restart the Discord bot
node discord-bot/bot.js
```

## Future Recommendations

1. **Monitor logs**: Check for validation errors to identify users having trouble
2. **Consider bech32 validation**: Could add full Cardano address checksum validation
3. **User feedback**: If validation fails, provide a helpful message about where to find their wallet address
4. **Rate limiting**: Consider adding rate limits to prevent spam linking/unlinking
