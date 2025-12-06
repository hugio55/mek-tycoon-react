# NMKR Mainnet Migration Plan

> ⚠️ **DATABASE UPDATED (December 2025)**
> This document originally referenced Trout (wry-trout-962).
> **We now use a UNIFIED SINGLE DATABASE**: Sturgeon (fabulous-sturgeon-691.convex.cloud)
> Database references below have been updated accordingly.

**Date Created**: October 30, 2025
**Status**: Ready to Execute
**Estimated Cost**: ~30-40 ADA (2-3 test NFTs at 10 ADA each + fees)

---

## Executive Summary

This plan transitions the NMKR commemorative NFT system from preprod testnet to mainnet production. The system will:
- Create 5 Bronze Token NFTs on mainnet
- Implement whitelist check (only snapshot addresses can claim)
- Test with 2-3 actual purchases using real ADA
- Verify collection appearance and metadata
- Prepare for eventual 35-person batch mint

---

## Phase 1: Pre-Flight Checklist ✅

### 1.1 Environment Verification
- [ ] Confirm branch: `custom-minting-system`
- [ ] Verify Convex: `fabulous-sturgeon-691.convex.cloud` (unified database)
- [ ] Check `convex/data/snapshot.json` exists
- [ ] Verify wallet has ~50 ADA available
- [ ] Confirm NMKR Studio mainnet access

### 1.2 Backup Current State
```bash
git status
git add -A
git commit -m "Checkpoint: Preprod NMKR testing complete"
git tag preprod-nmkr-testing-complete
git checkout -b nmkr-mainnet-migration
```

### 1.3 Asset Preparation
- [ ] Verify Bronze Token image ready
- [ ] Confirm metadata structure
- [ ] Prepare 5 identical uploads

---

## Phase 2: NMKR Studio Mainnet Setup 🏭

### 2.1 Create Mainnet Project
- [ ] Login: https://studio.nmkr.io
- [ ] New Project → **MAINNET**
- [ ] Name: "Mek Tycoon Commemorative Tokens - Mainnet"
- [ ] Save project ID

### 2.2 Upload 5 Bronze Tokens
- [ ] Upload #1-5 with identical metadata
- [ ] Name: "Bronze Token"
- [ ] Same image for all (creates collection)

### 2.3 Configure Pricing (PROJECT LEVEL)
- [ ] Settings → Pricing
- [ ] Set: **10 ADA** per NFT
- [ ] Enable quantity selection
- [ ] **CRITICAL**: Set at project level, NOT per-NFT

### 2.4 Enable NMKR Pay
- [ ] Sales → NMKR Pay
- [ ] Enable for mainnet
- [ ] Copy payment gateway URL

### 2.5 Configure Webhook
- [ ] Webhooks → Add Webhook
- [ ] Endpoint: `https://[your-domain]/api/nmkr-webhook`
- [ ] Events: "NFT Sold", "Transaction Confirmed"
- [ ] Generate secret key

### 2.6 Save Configuration
```
Project ID: ________________________________
Policy ID: ________________________________
API Key: ________________________________
Webhook Secret: ________________________________
Payment URL: ________________________________
```

---

## Phase 3: Code Changes 💻

### 3.1 Update .env.local
```bash
# Change these:
NEXT_PUBLIC_NMKR_NETWORK=mainnet
NEXT_PUBLIC_NMKR_PROJECT_ID=[from Phase 2.6]
NMKR_API_KEY=[from Phase 2.6]
NMKR_WEBHOOK_SECRET=[from Phase 2.6]

# Keep unchanged:
NEXT_PUBLIC_CONVEX_URL=https://fabulous-sturgeon-691.convex.cloud
```

### 3.2 Add Console Logging Tags
**Tags to use**:
- `[💳NMKR]` - NMKR Pay interactions
- `[🎟️CLAIM]` - Claim tracking
- `[🔐WHITELIST]` - Whitelist checks
- `[📡WEBHOOK]` - Webhook events
- `[✅SUCCESS]` - Success states
- `[❌ERROR]` - Errors

### 3.3 Implement Whitelist Check
**File**: `src/app/page.tsx`

```typescript
// Get wallet address
const { walletAddress } = useWallet();

// Query snapshot whitelist
const snapshotData = useQuery(api.snapshot.getWhitelist);

// Check if whitelisted
const isWhitelisted = snapshotData?.some(
  entry => entry.walletAddress === walletAddress
);

// Log check
useEffect(() => {
  console.log('[🔐WHITELIST] Wallet:', walletAddress);
  console.log('[🔐WHITELIST] Is whitelisted:', isWhitelisted);
}, [walletAddress, isWhitelisted]);

// Conditional render
{isWhitelisted && <NMKRClaimButton walletAddress={walletAddress} />}
{!isWhitelisted && walletAddress && (
  <div>This wallet is not eligible</div>
)}
```

### 3.4 Create Whitelist Query
**File**: `convex/snapshot.ts` (create if needed)

```typescript
import { query } from "./_generated/server";

export const getWhitelist = query({
  handler: async (ctx) => {
    const whitelist = await ctx.db.query("snapshot").collect();
    return whitelist;
  }
});
```

### 3.5 Restart Server
```bash
# Kill current server
# Start with new config
npm run dev:all
```

---

## Phase 4: Testing - Whitelisted Wallet 🧪

### 4.1 Connect Whitelisted Wallet
- [ ] Open localhost:3200
- [ ] Connect mainnet wallet
- [ ] Verify button appears
- [ ] Check console: `[🔐WHITELIST] Is whitelisted: true`

### 4.2 Test Widget Opens (No Purchase)
- [ ] Click claim button
- [ ] Verify widget opens
- [ ] Check price: 10 ADA
- [ ] Check network: mainnet
- [ ] Close widget (don't buy yet)

### 4.3 First Purchase - Bronze Token #1
**⚠️ REAL MONEY - ~10 ADA + fees**
- [ ] Click claim button
- [ ] Select quantity: 1
- [ ] Complete payment
- [ ] Copy transaction hash: ________________
- [ ] Wait for confirmation
- [ ] Check wallet for NFT
- [ ] Check console for webhook
- [ ] Verify Convex claim entry

### 4.4 Second Purchase - Bronze Token #2
**⚠️ REAL MONEY - ~10 ADA + fees**
- [ ] Repeat purchase process
- [ ] Transaction hash: ________________
- [ ] Verify 2 NFTs in wallet
- [ ] Check if they appear as collection

### 4.5 Optional Third Purchase
**⚠️ REAL MONEY - ~10 ADA + fees**
- [ ] Only if needed to verify collection
- [ ] Transaction hash: ________________

---

## Phase 5: Testing - Non-Whitelisted Wallet 🚫

### 5.1 Disconnect Current Wallet
- [ ] Disconnect whitelisted wallet
- [ ] Verify button disappears

### 5.2 Connect Non-Whitelisted Wallet
**⚠️ Use test wallet with <5 ADA**
- [ ] Connect different wallet
- [ ] Verify button does NOT appear
- [ ] Check console: `[🔐WHITELIST] Is whitelisted: false`
- [ ] Verify ineligible message shows

### 5.3 Security Check
- [ ] Attempt to manually trigger widget
- [ ] Should fail or show error
- [ ] Verify no purchase possible

---

## Phase 6: Validation 📊

### 6.1 Check Webhooks
- [ ] Filter console by `[📡WEBHOOK]`
- [ ] Count webhook calls (should match purchases)
- [ ] Verify all payloads received

### 6.2 Convex Database
- [ ] Open: https://fabulous-sturgeon-691.convex.cloud
- [ ] Check `commemorativeNFTClaims` table
- [ ] Verify entries for each purchase
- [ ] Confirm data is correct

### 6.3 Cross-Reference Data
| Tx Hash | NMKR Studio | Convex DB | Blockchain | Wallet |
|---------|-------------|-----------|------------|--------|
| tx1...  | ✓          | ✓        | ✓         | ✓     |
| tx2...  | ✓          | ✓        | ✓         | ✓     |

---

## Phase 7: Production Checks ✅

### 7.1 Error Handling
- [ ] Test insufficient ADA error
- [ ] Test widget close during payment
- [ ] Verify all errors logged properly

### 7.2 Performance
- [ ] Page load: <2s
- [ ] Wallet connect: <3s
- [ ] Widget open: <1s

### 7.3 Security
- [ ] Whitelist enforced client-side
- [ ] No API keys in client code
- [ ] Webhook secret validated
- [ ] `.env.local` in `.gitignore`

---

## Rollback Plan 🔄

### Stop Immediately If:
- [ ] Non-whitelisted wallet can purchase
- [ ] Wrong network detected
- [ ] NFTs don't appear after 5 minutes
- [ ] Database corruption
- [ ] Security vulnerability

### Rollback Steps:
1. Stop dev server
2. Revert `.env.local` to preprod values
3. Run `git stash` to save changes
4. Document all failures
5. Analyze before retry

---

## Success Criteria ✓

- [ ] 2-3 test NFTs purchased successfully
- [ ] Whitelisted wallet can claim
- [ ] Non-whitelisted wallet cannot claim
- [ ] Webhook delivers events
- [ ] Database records claims
- [ ] NFTs appear as collection
- [ ] No security issues
- [ ] Error handling works

---

## Next Steps After Success

1. Monitor for 24 hours
2. Prepare 35-person batch mint
3. Create user instructions
4. Set up support channel
5. Load test with 35 wallets

---

## Console Filter Commands

```javascript
// In browser console, use these filters:
"NMKR"      // All NMKR-related logs
"CLAIM"     // Claim tracking
"WHITELIST" // Whitelist checks
"WEBHOOK"   // Webhook events
"ERROR"     // All errors
```

---

## Important Files

- Environment: `.env.local`
- Whitelist: `convex/data/snapshot.json`
- Claim Button: `src/components/NMKRClaimButton.tsx`
- Root Page: `src/app/page.tsx`
- Webhook: `src/app/api/nmkr-webhook/route.ts`
- Database: `convex/commemorativeNFTClaims.ts`

---

## Lessons from Preprod

1. ✅ Set pricing at PROJECT level
2. ✅ Check obvious details in screenshots first
3. ✅ Use searchable console tags
4. ✅ Industrial styling (yellow/gold, Orbitron)
5. ✅ Close button in all lightbox states
6. ✅ Preprod webhooks unreliable (mainnet better)

---

## Notes

- **Cost**: ~30-40 ADA for 2-3 test NFTs
- **Time**: 3-5 hours total
- **Risk**: Medium (real money, but small amounts)
- **Reversibility**: Purchases non-refundable
- **Database**: Unified (fabulous-sturgeon-691)
- **Network**: Mainnet only

---

**Created**: October 30, 2025
**Last Updated**: October 30, 2025
**Status**: Ready to execute Phase 1
