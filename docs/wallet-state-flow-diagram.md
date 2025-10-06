# Wallet Connection State Flow Diagram

## State Variables

```
┌─────────────────────────────────────────────────────────────┐
│                    CONNECTION STATE                         │
├─────────────────────────────────────────────────────────────┤
│ isConnecting: boolean                                       │
│ connectionStatus: string                                    │
│ connectionLockRef: Ref<boolean>                             │
│ pollingIntervalRef: Ref<NodeJS.Timeout | null>  [NEW!]     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    MESSAGE STATE                            │
├─────────────────────────────────────────────────────────────┤
│ walletInstructions: string | null  [NEW!]                   │
│   → DApp browser setup instructions                         │
│   → Shows in MODAL                                          │
│                                                              │
│ walletError: string | null                                  │
│   → Actual connection errors                                │
│   → Shows as INLINE RED TEXT                                │
└─────────────────────────────────────────────────────────────┘
```

## Flow 1: DApp Browser Instructions (No Deep Link Support)

```
User clicks Eternl/Nami on mobile
         │
         ↓
   Check if wallet
   supports deep link?
         │
         ↓ NO
         │
   setWalletInstructions(
     "1. Open Eternl app\n
      2. Go to DApps tab\n
      3. Navigate to mek.overexposed.io"
   )
         │
         ↓
┌────────────────────────────┐
│   INSTRUCTIONS MODAL       │
│   ┌──────────────────────┐ │
│   │  ℹ️  How to Connect  │ │
│   │                      │ │
│   │  1. Open app         │ │
│   │  2. DApps tab        │ │
│   │  3. Navigate...      │ │
│   │                      │ │
│   │    [Got It]          │ │
│   └──────────────────────┘ │
└────────────────────────────┘
         │
         ↓
   User clicks "Got It"
         │
         ↓
   setWalletInstructions(null)
         │
         ↓
   Modal closes
   END
```

## Flow 2: Deep Link Connection (Flint/Vespr)

```
User clicks Flint on mobile
         │
         ↓
   setIsConnecting(true)
   setConnectionStatus("Opening wallet app...")
   connectionLockRef.current = true
         │
         ↓
┌────────────────────────────┐
│   CONNECTING MODAL         │
│   ┌──────────────────────┐ │
│   │     ⟳ CONNECTING     │ │
│   │                      │ │
│   │ Opening wallet app...│ │
│   │                      │ │
│   │     [Cancel]   ← NEW!│ │
│   └──────────────────────┘ │
└────────────────────────────┘
         │
         ↓
   openMobileWallet(deep link)
         │
         ↓
   Start 60-second polling loop
   pollingIntervalRef.current = setInterval(...)  ← STORED!
         │
         ├──────────────────────┐
         │                      │
         ↓                      ↓
   Wallet API found      User clicks Cancel
         │                      │
         ↓                      ↓
   Continue connection    cancelConnection()
   (enable, signature,      │
    fetch Meks, etc.)       ↓
         │              clearInterval(pollingIntervalRef.current)
         ↓              setIsConnecting(false)
   SUCCESS!             connectionLockRef.current = false
                              │
                              ↓
                        Modal closes
                        User back at wallet selection
                        END
```

## Flow 3: Connection Error

```
Connection attempt in progress
         │
         ↓
   Error occurs:
   - Timeout (60s elapsed)
   - Signature rejected
   - Rate limited
   - Network failure
         │
         ↓
   setWalletError("Error message")
   setIsConnecting(false)
         │
         ↓
┌────────────────────────────┐
│  Below wallet buttons:     │
│  ┌──────────────────────┐  │
│  │ 🔴 Timeout waiting   │  │
│  │    for wallet        │  │
│  └──────────────────────┘  │
│                            │
│  [Nami] [Eternl] [Flint]   │  ← User can retry
└────────────────────────────┘
```

## State Transitions Table

| User Action | State Changes | UI Result |
|-------------|---------------|-----------|
| Click non-deep-link wallet (Eternl) | `walletInstructions = "setup..."` | Instructions modal appears |
| Click "Got It" on instructions | `walletInstructions = null` | Modal closes |
| Click deep-link wallet (Flint) | `isConnecting = true`<br>`connectionStatus = "Opening..."` | Connecting modal appears |
| Click "Cancel" during connection | `isConnecting = false`<br>`pollingIntervalRef cleared`<br>`connectionLockRef = false` | Modal closes, polling stops |
| Connection times out | `walletError = "Timeout..."`<br>`isConnecting = false` | Inline red error appears |
| Connection succeeds | `isConnecting = false`<br>`walletConnected = true` | Shows Mek grid |

## Key Improvements

### Before Fix
```
walletError
    ↓
┌────────────────────┐     ┌──────────────┐
│ INSTRUCTIONS MODAL │ AND │ RED ERROR    │
│ (confusing!)       │     │ (duplicate!) │
└────────────────────┘     └──────────────┘

isConnecting = true
    ↓
┌────────────────────┐
│ CONNECTING MODAL   │
│ No cancel button   │  ← User STUCK
│ Must wait 60s      │
└────────────────────┘
```

### After Fix
```
walletInstructions          walletError
    ↓                           ↓
┌────────────────────┐     ┌──────────────┐
│ INSTRUCTIONS MODAL │  OR │ RED ERROR    │
│ (DApp setup)       │     │ (failures)   │
└────────────────────┘     └──────────────┘
     SEPARATE!

isConnecting = true
    ↓
┌────────────────────┐
│ CONNECTING MODAL   │
│ Status message     │
│ [Cancel] button    │  ← User can abort!
└────────────────────┘
```

## Abort Mechanism Details

```javascript
// Polling loop stores interval ID
const pollInterval = setInterval(() => {
  pollingIntervalRef.current = pollInterval;  // ← KEY!

  // Check for wallet API
  if (window.cardano?.[walletKey]) {
    clearInterval(pollInterval);  // Clean up normally
    pollingIntervalRef.current = null;
    resolve(walletApi);
  }
}, 500);

// Cancel function can now stop polling
const cancelConnection = () => {
  if (pollingIntervalRef.current) {
    clearInterval(pollingIntervalRef.current);  // ← WORKS!
    pollingIntervalRef.current = null;
  }
  // Reset all connection state
  setIsConnecting(false);
  setConnectionStatus('');
  connectionLockRef.current = false;
};
```

## Benefits Summary

1. **Clear Separation**
   - Instructions ≠ Errors
   - Each has appropriate UI (modal vs inline)

2. **User Control**
   - Can cancel any time
   - No more 60-second wait
   - Professional UX

3. **Better Feedback**
   - Status message shows progress
   - Clear error messages
   - No duplicate displays

4. **Clean State**
   - Proper cleanup on cancel
   - No state pollution
   - Predictable behavior
