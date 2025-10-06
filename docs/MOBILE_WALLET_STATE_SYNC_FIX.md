# Mobile Wallet State Sync Fix - Summary

## The Problem

Mobile wallet connection was failing with error: **"something went wrong - the application couldn't be opened"**

### Root Cause Analysis

**BROKEN FLOW (Before Fix):**
```
User clicks wallet
  ↓
Opens deep link to wallet app
  ↓
Wallet app opens (page backgrounds)
  ↓
Deep link function resolves
  ↓
❌ IMMEDIATE RETURN - Connection ends here!
  ↓
State: isConnecting=false, connectionLock=false
  ↓
❌ NEVER checks for window.cardano API injection
❌ NEVER completes actual wallet connection
❌ NEVER extracts Meks or sets wallet state
```

**Result:** Deep link opened wallet app, but then gave up without completing connection.

## The Solution

**FIXED FLOW (After Fix):**
```
User clicks wallet
  ↓
Opens deep link to wallet app
  ↓
Wallet app opens (page backgrounds)
  ↓
Deep link function resolves
  ↓
✅ NEW: Start polling for window.cardano[walletName]
  ↓
✅ NEW: Track visibility changes (user returns to dApp)
  ↓
✅ NEW: Wait up to 60 seconds for API injection
  ↓
window.cardano[walletName] detected!
  ↓
✅ NEW: Update wallet.api with injected API
  ↓
✅ CRITICAL: Fall through to desktop flow (NO RETURN)
  ↓
Desktop Flow: enable() → stake address → signature → Meks
  ↓
✅ Sets ALL state correctly:
   - walletConnected = true
   - walletType = wallet name
   - walletAddress = stake address
   - ownedMeks = extracted Meks
  ↓
✅ Connection complete!
```

## Key Changes

### 1. Added API Polling After Deep Link
**Location:** `src/app/mek-rate-logging/page.tsx` lines 1057-1103

```typescript
// Poll for window.cardano with the wallet's API
const maxAttempts = 120; // 60 seconds (500ms intervals)
const pollForWallet = async (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const pollInterval = setInterval(() => {
      attempts++;

      // Log every 2 seconds
      if (attempts % 4 === 0) {
        console.log('[Wallet Connect - Mobile] 🔍 Polling status:', {
          attempt: `${attempts}/${maxAttempts}`,
          walletAPIExists: !!(window.cardano && window.cardano[walletKey])
        });
      }

      // Check if API is available
      if (window.cardano && window.cardano[walletKey]) {
        clearInterval(pollInterval);
        resolve(window.cardano[walletKey]);
      }

      // Timeout after max attempts
      if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        reject(new Error(`Timeout waiting for wallet API`));
      }
    }, 500);
  });
};
```

### 2. Added Visibility Tracking
**Location:** Same file, lines 1039-1053

Tracks when user:
- Leaves the dApp (opens wallet app)
- Returns to the dApp (after approving/rejecting)

```typescript
const visibilityHandler = () => {
  console.log('[Wallet Connect - Mobile] 👁️ Visibility changed:', {
    isVisible: !document.hidden,
    timestamp: new Date().toISOString()
  });

  if (!document.hidden && !userReturnedToApp) {
    userReturnedToApp = true;
    console.log('[Wallet Connect - Mobile] ✓ User returned to dApp');
    setConnectionStatus('Checking for wallet connection...');
  }
};
```

### 3. Merged Mobile + Desktop Flows
**Location:** Lines 1110-1122

**CRITICAL CHANGE:** After getting wallet API, DON'T return - fall through to desktop flow!

```typescript
// Update wallet object with injected API
wallet.api = walletApi;
wallet.version = walletApi.apiVersion || '1.0.0';

console.log('[Wallet Connect - Mobile] ⚡ Updated wallet object:', {
  name: wallet.name,
  version: wallet.version,
  hasAPI: !!wallet.api
});

// CRITICAL FIX: Don't return - fall through to desktop flow
console.log('[Wallet Connect - Mobile] ➡️ Proceeding to desktop flow...');

// NO RETURN HERE! Code continues to line 1161 (desktop flow)
```

### 4. Enhanced Logging Throughout
**Locations:**
- `src/app/mek-rate-logging/page.tsx` (connection flow)
- `src/lib/mobileWalletSupport.ts` (deep link execution)

All logs include:
- Emoji indicators (📱🔗✓👁️🔍✅❌)
- Timestamps
- Detailed state objects
- Error context with stack traces
- Timing information (elapsed ms)

## State Synchronization Flow

### Before (BROKEN):
```
Mobile Flow State:
- setConnectedWallet(wallet.name)     ❌ Wrong state variable
- setWalletAddress(paymentAddress)    ❌ Payment address, not stake
- setWalletApi(api)                   ❌ State doesn't exist
- localStorage.setItem(...)           ❌ Different keys than desktop

Result: Partial state, missing critical data
```

### After (FIXED):
```
Mobile → Desktop Flow State:
1. Mobile flow updates wallet.api
2. Falls through to desktop flow
3. Desktop flow sets EVERYTHING:
   - setWalletAddress(stakeAddress)   ✅ Correct stake address
   - setWalletType(wallet.name)       ✅ Wallet type for reconnection
   - setWalletConnected(true)         ✅ Connection flag
   - setOwnedMeks(extractedMeks)      ✅ NFT data from blockchain
   - Saves session to Convex          ✅ Server-side persistence
   - localStorage with correct keys   ✅ Client-side persistence

Result: Complete state synchronization
```

## What Each Log Prefix Means

### Connection Flow (`[Wallet Connect - Mobile]`)
- **📱 Mobile wallet detected** - Entered mobile-specific logic
- **🔗 Opening deep link** - About to trigger wallet app
- **✓ Deep link opened** - Wallet app launch initiated
- **👁️ Visibility changed** - User left/returned to dApp
- **✓ User returned** - User came back from wallet
- **🔄 Starting to poll** - Beginning API injection wait
- **🔍 Polling status** - Checking for API (logged every 2s)
- **✅ Found wallet API** - Success! API detected
- **🔌 Wallet API detected** - About to update wallet object
- **⚡ Updated wallet object** - Wallet now has API
- **➡️ Proceeding to desktop flow** - Merging into main flow
- **❌ Error** - Something failed (includes full context)

### Deep Link Execution (`[Mobile Wallet]`)
- **🔗 Opening wallet app** - Starting deep link process
- **📲 Attempting to trigger** - Creating and clicking link
- **✓ Deep link triggered** - Link click successful
- **👁️ Visibility change** - Browser backgrounded/foregrounded
- **✅ App opened** - Wallet app successfully opened
- **🔍 Checking app open** - Polling to verify app opened
- **⚠️ Halfway timeout** - Warning that app may not open
- **❌ Timeout** - Failed to open (includes diagnostics)

## How to Verify the Fix Works

### 1. Check Console Logs
Look for this complete sequence:
```
[Wallet Connect - Mobile] 📱 Mobile wallet detected: Eternl
[Mobile Wallet] 🔗 Opening wallet app: {...}
[Mobile Wallet] ✅ App opened successfully
[Wallet Connect - Mobile] 👁️ Visibility changed: {isVisible: false}
[Wallet Connect - Mobile] 🔍 Polling status: {walletAPIExists: false}
[Wallet Connect - Mobile] 🔍 Polling status: {walletAPIExists: true}  ← API found!
[Wallet Connect - Mobile] ✅ Found wallet API!
[Wallet Connect - Mobile] ⚡ Updated wallet object: {hasAPI: true}
[Wallet Connect - Mobile] ➡️ Proceeding to desktop flow...
[Wallet Connect] Calling wallet.api.enable()...                        ← Desktop flow!
[Wallet Connect] Stake address converted: ...
[Wallet Connect] Valid session found - skipping signature
[Wallet Connect] Fetching NFTs for stake address: ...
[Wallet Connect] Mek extraction completed: {meksFound: 3}
```

### 2. Verify State Changes
After connection, check these states are set:
- `walletConnected` = `true`
- `walletType` = wallet name (lowercase)
- `walletAddress` = stake address (stake1...)
- `ownedMeks` = array of Mek NFTs

### 3. Test Reconnection
Refresh page - should auto-reconnect:
- Checks localStorage for saved wallet
- Auto-reconnects without prompts (if session valid)
- Restores all state from Convex session

## Error Scenarios and Diagnostics

### Error: "Could not open wallet app"
**Logs Show:**
```
[Mobile Wallet] ⚠️ Halfway timeout - app may not be opening
[Mobile Wallet] ❌ Timeout: {visibilityChanges: 0, finalVisibility: "visible"}
```
**Cause:** Deep link didn't open wallet (not installed or wrong URL scheme)
**Solution:** Install wallet app from App Store

### Error: "Timeout waiting for wallet API"
**Logs Show:**
```
[Wallet Connect - Mobile] ✓ User returned to dApp
[Wallet Connect - Mobile] 🔍 Polling: {walletAPIExists: false, attempt: "80/120"}
[Wallet Connect - Mobile] ❌ Timeout: {userReturned: true, cardanoExists: true}
```
**Cause:** User returned but wallet didn't inject API (rejected or unsupported)
**Solution:** Try different wallet or approve connection in wallet

### Error: State desync (should be fixed now)
**Logs Show:**
```
[Wallet Connect - Mobile] ⚡ Updated wallet object: {hasAPI: true}
[Wallet Connect - Mobile] ➡️ Proceeding to desktop flow...
❌ MISSING: [Wallet Connect] Calling wallet.api.enable()...
```
**Cause:** Early return preventing fallthrough (shouldn't happen with fix)
**Solution:** Check for early `return` statements in mobile flow

## Testing the Fix

### Manual Test Steps:
1. Open mobile browser (Safari iOS or Chrome Android)
2. Navigate to the mek-rate-logging page
3. Open browser DevTools console (via desktop debugging)
4. Click a wallet button (e.g., Eternl)
5. Watch console logs for complete flow
6. Approve connection in wallet app
7. Return to browser
8. Verify logs show API detection and desktop flow
9. Verify UI shows wallet connected
10. Check owned Meks are displayed

### Expected Behavior:
- ✅ Wallet app opens within 1 second
- ✅ User can approve in wallet
- ✅ Upon return, API detected within 5 seconds
- ✅ Desktop flow completes (enable, stake, Meks)
- ✅ UI updates to show connection
- ✅ Meks are displayed with gold mining rates
- ✅ Refresh page auto-reconnects

### Previous Broken Behavior:
- ❌ Wallet app opened but connection "failed"
- ❌ No API polling happened
- ❌ State never updated (stayed disconnected)
- ❌ Error message: "something went wrong"

## Files Changed

1. **`src/app/mek-rate-logging/page.tsx`** (lines 997-1159)
   - Added comprehensive mobile logging
   - Added API polling with visibility tracking
   - Removed early return to merge flows
   - Enhanced error context

2. **`src/lib/mobileWalletSupport.ts`** (lines 206-345)
   - Added detailed deep link logging
   - Track visibility changes with counts
   - Log timing information throughout
   - Enhanced error diagnostics

3. **`docs/MOBILE_WALLET_DEBUG_GUIDE.md`** (new file)
   - Complete debugging guide
   - Log interpretation instructions
   - Troubleshooting flowcharts

4. **`docs/MOBILE_WALLET_STATE_SYNC_FIX.md`** (this file)
   - Summary of fix
   - Before/after comparison
   - Verification steps

## Summary

**Problem:** Mobile wallet deep link opened wallet but never completed connection, causing state desync.

**Root Cause:** Mobile flow had early return after opening wallet, never polling for API injection or completing connection.

**Solution:**
1. Poll for `window.cardano[wallet]` API injection after deep link
2. Track visibility changes to know when user returns
3. Update wallet object with injected API
4. **Remove early return** - fall through to desktop flow
5. Desktop flow handles everything: enable, stake address, signature, Meks, state

**Result:** Mobile and desktop now use same final flow, ensuring consistent state synchronization.

**Verification:** Look for complete log sequence ending with desktop flow execution and all state properly set.
