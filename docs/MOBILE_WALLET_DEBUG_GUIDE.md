# Mobile Wallet Connection State Sync - Debug Guide

## Issue Resolved
**Problem:** Mobile wallet connection was failing after opening the wallet app with error "something went wrong - the application couldn't be opened"

**Root Cause:** The mobile wallet connection flow was incomplete and separate from the desktop flow, causing state synchronization issues.

## Changes Made

### 1. Fixed Mobile Wallet Connection Flow
**File:** `src/app/mek-rate-logging/page.tsx`

#### Previous Broken Flow:
1. User clicks wallet button → opens deep link
2. Wallet app opens → page backgrounds
3. **CRITICAL BUG:** Connection immediately returned without waiting for API
4. No polling for `window.cardano` injection
5. No actual wallet connection completed
6. Missing: stake address extraction, signature verification, Mek loading

#### New Fixed Flow:
1. User clicks wallet button → opens deep link with enhanced logging
2. Wallet app opens → visibility tracking begins
3. **NEW:** Polls for `window.cardano[walletName]` API injection (60 seconds max)
4. **NEW:** Tracks user return to dApp via visibility changes
5. **NEW:** Updates wallet object with injected API
6. **CRITICAL FIX:** Falls through to desktop flow (no early return)
7. Desktop flow handles: enable(), stake address, signature, Mek extraction, session save
8. Properly sets all state: `walletConnected`, `walletType`, `walletAddress`, `ownedMeks`

### 2. Enhanced Logging System

#### Mobile Wallet Connection Logs (page.tsx)
All logs prefixed with `[Wallet Connect - Mobile]` and include emojis for quick visual scanning:

```
📱 Mobile wallet detected
🔗 Opening deep link
✓ Deep link opened successfully
👁️ Visibility changed (tracks app backgrounding/foregrounding)
✓ User returned to dApp from wallet
🔄 Starting to poll for window.cardano API injection
🔍 Polling status (every 2 seconds)
✅ Found wallet API!
🔌 Wallet API detected, updating wallet object
⚡ Updated wallet object
➡️ Proceeding to desktop flow for full connection
❌ Error logs with detailed context
```

#### Deep Link Execution Logs (mobileWalletSupport.ts)
All logs prefixed with `[Mobile Wallet]`:

```
🔗 Opening wallet app (includes deep link URL, userAgent, timestamp)
📲 Attempting to trigger deep link
✓ Deep link triggered successfully
👁️ Visibility change (tracks each change with number, timing)
✅ App opened successfully
🔍 Checking app open status (every 1 second)
⚠️ Halfway timeout warning
❌ Timeout with detailed diagnostics
```

## How to Debug Mobile Wallet Connection Issues

### Step 1: Open Browser DevTools Console
On mobile, use one of these methods:
- **iOS Safari:** Settings → Safari → Advanced → Web Inspector (requires Mac with Safari)
- **Chrome/Edge Mobile:** chrome://inspect or edge://inspect on desktop, connect phone via USB
- **Firefox Mobile:** about:debugging on desktop
- **Safari iOS (alternative):** Use Eruda debug console (can be injected via bookmarklet)

### Step 2: Attempt Wallet Connection
Click the wallet button and watch the console logs in real-time.

### Step 3: Analyze the Log Flow

#### Successful Connection Logs:
```
[Wallet Connect - Mobile] 📱 Mobile wallet detected: Eternl
[Wallet Connect - Mobile] Initial state: {isConnecting: true, ...}
[Mobile Wallet] 🔗 Opening wallet app: {wallet: "Eternl", deepLink: "eternl://...", ...}
[Mobile Wallet] 📲 Attempting to trigger deep link...
[Mobile Wallet] ✓ Deep link triggered successfully
[Mobile Wallet] 👁️ Visibility change: {isHidden: true, elapsed: "234ms", ...}
[Mobile Wallet] ✅ App opened successfully
[Wallet Connect - Mobile] 👁️ Visibility changed: {isVisible: false, ...}
[Wallet Connect - Mobile] ✓ User returned to dApp from wallet
[Wallet Connect - Mobile] 🔍 Polling status: {attempt: "4/120", walletAPIExists: false}
[Wallet Connect - Mobile] 🔍 Polling status: {attempt: "8/120", walletAPIExists: true}
[Wallet Connect - Mobile] ✅ Found wallet API! {walletName: "eternl", attempts: 8, timeElapsed: "4.0s"}
[Wallet Connect - Mobile] 🔌 Wallet API detected, updating wallet object...
[Wallet Connect - Mobile] ⚡ Updated wallet object: {name: "Eternl", version: "1.0.0", hasAPI: true}
[Wallet Connect - Mobile] ➡️ Proceeding to desktop flow for full connection...
[Wallet Connect] Calling wallet.api.enable()...
[Wallet Connect] Stake address converted: ...
... [continues with desktop flow]
```

#### Failed Connection - Deep Link Doesn't Open:
```
[Wallet Connect - Mobile] 📱 Mobile wallet detected: Eternl
[Mobile Wallet] 🔗 Opening wallet app: {...}
[Mobile Wallet] 📲 Attempting to trigger deep link...
[Mobile Wallet] ✓ Deep link triggered successfully
[Mobile Wallet] 🔍 Checking app open status: {isHidden: false, visibilityChanges: 0}
[Mobile Wallet] ⚠️ Halfway timeout - app may not be opening: {stillVisible: true}
[Mobile Wallet] ❌ Timeout - app did not open: {visibilityChanges: 0, finalVisibility: "visible"}
[Wallet Connect - Mobile] ❌ Failed to open mobile wallet: {error: "Could not open..."}
```
**Diagnosis:** Wallet app not installed or deep link scheme incorrect

#### Failed Connection - API Never Injected:
```
[Mobile Wallet] ✅ App opened successfully
[Wallet Connect - Mobile] ✓ User returned to dApp from wallet
[Wallet Connect - Mobile] 🔍 Polling status: {walletAPIExists: false, attempt: "40/120"}
[Wallet Connect - Mobile] 🔍 Polling status: {walletAPIExists: false, attempt: "80/120"}
[Wallet Connect - Mobile] ❌ Timeout waiting for wallet API: {userReturned: true, cardanoExists: true}
```
**Diagnosis:** User returned but wallet didn't inject API - may have rejected connection

### Step 4: Common Issues and Solutions

#### Issue: "Could not open wallet app"
- **Cause:** Deep link fails, page doesn't background
- **Check Logs:** Look for `visibilityChanges: 0` and `finalVisibility: "visible"`
- **Solution:** Wallet not installed - install from App Store

#### Issue: "Timeout waiting for wallet API"
- **Cause:** Wallet opened but API not injected
- **Check Logs:** Look for `userReturned: true` but `walletAPIExists: false`
- **Possible Reasons:**
  - User rejected connection in wallet
  - Wallet doesn't support dApp browser injection
  - Wallet has bugs/outdated version
- **Solution:** Try different wallet or update wallet app

#### Issue: State Desync (wallet connected but UI shows disconnected)
- **Cause:** This should be fixed now - mobile flow falls through to desktop flow
- **Check Logs:** Look for "➡️ Proceeding to desktop flow" message
- **Verify:** Should see wallet.api.enable() logs after mobile detection
- **If missing:** The fallthrough logic may have an early return somewhere

## State Management Flow

### Mobile Connection State Tracking:
1. `isConnecting = true` → Shows loading spinner
2. `connectionLockRef = true` → Prevents duplicate connections
3. `connectionStatus` → Updates with current step
4. Deep link opens → Tracks visibility changes
5. Polls for API → Logs every 2 seconds
6. API found → Updates wallet object
7. Falls through to desktop flow → Same path as desktop
8. Desktop flow completes → Sets all final state:
   - `walletConnected = true`
   - `walletType = wallet.name.toLowerCase()`
   - `walletAddress = stakeAddress`
   - `ownedMeks = extractedMeks`
9. `isConnecting = false` → Hides spinner
10. `connectionLockRef = false` → Allows future connections

### Desktop Connection State (for comparison):
1-3. Same as mobile
4. wallet.api already exists
5. Calls wallet.api.enable() directly
6-10. Same as mobile final steps

## Testing Checklist

When testing mobile wallet connections:

- [ ] Console logging is enabled
- [ ] Wallet app is installed on device
- [ ] Wallet app is up to date
- [ ] Network connection is stable
- [ ] Device has permissions for app switching
- [ ] Browser allows deep links (some browsers block)

## Debugging Tips

### Enable Maximum Logging:
The enhanced logging is always active. To see all details:
1. Filter console by `[Wallet Connect - Mobile]` for connection flow
2. Filter by `[Mobile Wallet]` for deep link execution
3. Look for emoji indicators: ✅ (success), ❌ (error), ⚠️ (warning), 🔍 (checking)

### Timestamp Analysis:
All logs include timing information:
- `elapsed` fields show milliseconds since start
- Compare timing between visibility changes and API detection
- Normal flow: visibility change within 500ms, API detection within 5s

### State Verification:
Check the state objects logged:
- Initial state should show `walletConnected: false`
- After API detection: `hasAPI: true`
- After desktop flow: all wallet state should be set

## Architecture Notes

### Why Mobile and Desktop Flows Merge:
The mobile flow is now a **pre-processor** that:
1. Opens the wallet app via deep link
2. Waits for API injection into `window.cardano`
3. Updates the wallet object with the API
4. **Falls through** to the desktop flow

This ensures:
- No duplicate logic
- Same state management path
- Same error handling
- Same session persistence
- Same Mek extraction and verification

### Previous Architecture (BROKEN):
Mobile and desktop were completely separate with different:
- State setting (different variable names)
- Different end states
- Mobile missing: stake address, signatures, Meks, session save
- Early returns prevented proper flow completion

### Current Architecture (FIXED):
```
Mobile Wallet Click
  ↓
Mobile Detection (api === null)
  ↓
Open Deep Link
  ↓
Poll for window.cardano[wallet]
  ↓
Update wallet.api with injected API
  ↓
[NO RETURN - Fall Through]
  ↓
Desktop Flow (now wallet.api exists)
  ↓
Enable wallet
  ↓
Get stake address
  ↓
Verify signature
  ↓
Extract Meks from UTXOs
  ↓
Save session to Convex
  ↓
Set all state consistently
  ↓
Connection Complete ✅
```

## Future Improvements

Potential enhancements for even better mobile support:

1. **QR Code Fallback:** If deep link fails, show QR code to scan with wallet
2. **Background Polling:** Continue polling even if user doesn't return immediately
3. **Local Storage Persistence:** Cache connection attempt for cross-tab recovery
4. **Wallet-Specific Handlers:** Custom logic for wallets with unique behaviors
5. **Push Notifications:** Alert user when connection completes
6. **Better Error Messages:** Wallet-specific troubleshooting instructions

## Support Matrix

### Tested Wallets:
- **Eternl:** ✅ Working with CIP-30 injection
- **Flint:** 🟡 Partial support (varies by version)
- **Typhon:** 🟡 Deep link works, API injection varies
- **Others:** ⚪ Untested but should work if they support CIP-30

### Known Limitations:
- Some wallets don't inject `window.cardano` in mobile browsers
- Some browsers block deep links (use native browser recommended)
- iOS Safari has restrictions on visibility API in some contexts
- Wallet must support CIP-30 standard for full functionality
