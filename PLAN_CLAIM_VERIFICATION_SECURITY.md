# Secure NFT Claim Verification Plan

**Project:** Mek Tycoon - Backend Signature Verification for NFT Claims
**Created:** 2025-12-03
**Status:** Planning Complete - Ready for Implementation

---

## Problem Statement

The current NFT claim flow in `NMKRPayLightbox.tsx` has a **client-side signature verification vulnerability**:

### Current Flow (Vulnerable)
```
1. User enters stake address
2. Eligibility check (backend ✓ - secure)
3. Creates reservation (backend ✓ - secure)
4. User clicks "Open Payment Window"
5. User connects wallet
6. CLIENT compares stake addresses ⚠️
7. CLIENT requests signature ⚠️
8. CLIENT checks "did signature exist?" ⚠️
9. If yes → Opens NMKR payment window
```

### The Attack Vector
An attacker with dev tools could:
1. Enter an eligible stake address they DON'T own
2. Pass eligibility check (the address is in the whitelist)
3. Modify JavaScript to bypass the wallet comparison (line 354)
4. Modify JavaScript to skip signature verification (lines 365-392)
5. Get the NMKR payment URL
6. Pay and steal someone else's eligibility slot

### Impact
- Attacker uses victim's eligibility to claim an NFT
- Victim's address shows "already claimed" - can never claim
- Attacker gets NFT to their own wallet using stolen eligibility

---

## Solution: Backend Signature Verification

### New Flow (Secure)
```
1. User enters stake address
2. Eligibility check (backend ✓)
3. Creates reservation (backend ✓)
4. User clicks "Open Payment Window"
5. User connects wallet
6. CLIENT compares stake addresses (first-pass filter)
7. BACKEND generates nonce ✓
8. USER signs nonce with wallet
9. BACKEND verifies signature cryptographically ✓
10. If backend returns verified → Opens NMKR payment
11. If backend returns false → Show error, no payment allowed
```

### Why This Works
- Ed25519 signatures cannot be forged
- Nonce prevents replay attacks
- Backend verification cannot be bypassed with dev tools
- Existing infrastructure already built and tested

---

## Existing Infrastructure (Already Built)

### Backend Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `generateNonce` | `convex/walletAuthentication.ts:201` | Creates server-side nonce with expiration |
| `verifySignature` | `convex/walletAuthentication.ts:318` | Full Ed25519 verification |
| `verifyCardanoSignature` | `convex/actions/verifyCardanoSignature.ts` | Cryptographic verification |
| `markNonceUsed` | `convex/walletAuthentication.ts:273` | Prevents replay attacks |

### API Routes
| Route | Location | Purpose |
|-------|----------|---------|
| `POST /api/wallet/generate-nonce` | `src/app/api/wallet/generate-nonce/route.ts` | Frontend → Backend nonce generation |
| `POST /api/wallet/verify-signature` | `src/app/api/wallet/verify-signature/route.ts` | Frontend → Backend signature verification |

### Security Features Already Implemented
- Rate limiting (50 attempts/hour)
- Failed attempt lockout (3 failures = 1 hour lockout)
- Origin validation (CORS protection)
- Audit logging
- Nonce expiration (24 hours)
- Atomic nonce consumption (prevents race conditions)

---

## Implementation Plan

### Phase 1: Modify NMKRPayLightbox State Machine

**File:** `src/components/NMKRPayLightbox.tsx`

**Add new states to handle backend verification:**
```
Current states: 'wallet_verification' → payment opens directly

New states:
'wallet_verification' → User selects wallet
'backend_verifying' → Nonce generation + signature verification in progress
→ Success: Open payment
→ Failure: Show error, allow retry
```

**New state variable:**
- `backendVerificationStatus: 'idle' | 'generating_nonce' | 'awaiting_signature' | 'verifying' | 'success' | 'failed'`

---

### Phase 2: Implement Backend Verification in `connectAndVerifyWallet`

**Current code (lines 310-419):**
```typescript
// After address match (line 361):
console.log('[🔐VERIFY] ✅ MATCH - addresses match, requesting signature...');

// Lines 365-392: Client-side signature check
const signature = await api.signData(signingAddress, messageHex);
if (signature) {
  // Opens payment - NO BACKEND VERIFICATION
  await openNMKRPayment();
}
```

**New code flow:**
```typescript
// After address match:
console.log('[🔐VERIFY] ✅ MATCH - addresses match, starting backend verification...');

// Step 1: Generate nonce from backend
const nonceResponse = await fetch('/api/wallet/generate-nonce', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    stakeAddress: walletStakeAddress,
    walletName: wallet.name.toLowerCase()
  })
});
const { nonce, message } = await nonceResponse.json();

// Step 2: User signs the backend-generated message
const messageHex = Array.from(new TextEncoder().encode(message))
  .map(b => b.toString(16).padStart(2, '0'))
  .join('');
const signatureResult = await api.signData(signingAddress, messageHex);

// Step 3: Send signature to backend for verification
const verifyResponse = await fetch('/api/wallet/verify-signature', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    stakeAddress: walletStakeAddress,
    nonce,
    signature: signatureResult.signature || signatureResult,
    walletName: wallet.name.toLowerCase()
  })
});
const verifyResult = await verifyResponse.json();

// Step 4: Only proceed if backend confirms
if (verifyResult.success && verifyResult.verified) {
  console.log('[🔐VERIFY] ✅ BACKEND VERIFIED - opening payment');
  await openNMKRPayment();
} else {
  console.error('[🔐VERIFY] ❌ BACKEND REJECTED:', verifyResult.error);
  setWalletVerificationError(verifyResult.error || 'Signature verification failed');
}
```

---

### Phase 3: Add UI Feedback for Verification Steps

**New UI states to show:**
1. "Generating verification challenge..." (during nonce generation)
2. "Please sign the message in your wallet..." (awaiting signature)
3. "Verifying signature..." (during backend verification)
4. Error states with clear messages

**UI Component additions:**
- Loading spinner with step indicator
- Progress through verification steps
- Clear error messages for each failure mode

---

### Phase 4: Handle Edge Cases

**Error scenarios to handle:**
1. **Rate limit exceeded** → Show "Too many attempts, try again in X minutes"
2. **Nonce expired** → Auto-retry with new nonce (max 2 retries)
3. **Signature rejected by wallet** → "Please sign the message to verify ownership"
4. **Signature fails verification** → "Signature invalid. Please try again."
5. **Network error** → "Network error. Please check connection and retry."
6. **Wallet doesn't support signData** → "This wallet doesn't support message signing"

**Retry logic:**
- If nonce is consumed/expired, auto-generate new nonce and request new signature
- Max 2 automatic retries before showing manual retry button

---

### Phase 5: Logging and Debugging

**Add searchable debug tags:**
- `[🔐CLAIM-VERIFY]` - All claim verification logs
- `[🔐NONCE]` - Nonce generation
- `[🔐SIG]` - Signature operations
- `[🔐BACKEND]` - Backend verification calls

**Console output example:**
```
[🔐CLAIM-VERIFY] Starting backend verification for stake1u8zev...
[🔐NONCE] Requesting nonce from backend...
[🔐NONCE] Received nonce: mek-auth-1701612345-abc123...
[🔐SIG] Requesting user signature...
[🔐SIG] Signature received, sending to backend...
[🔐BACKEND] Verification result: { success: true, verified: true }
[🔐CLAIM-VERIFY] ✅ Verification complete - proceeding to payment
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/NMKRPayLightbox.tsx` | Add backend verification flow, new state variables, UI feedback |

## Files to NOT Modify (Already Working)

| File | Status |
|------|--------|
| `convex/walletAuthentication.ts` | ✓ Already has generateNonce, verifySignature |
| `convex/actions/verifyCardanoSignature.ts` | ✓ Already has Ed25519 verification |
| `src/app/api/wallet/generate-nonce/route.ts` | ✓ Already working |
| `src/app/api/wallet/verify-signature/route.ts` | ✓ Already working |

---

## Testing Plan

### Test Case 1: Happy Path
1. Enter valid eligible stake address
2. Connect matching wallet
3. Sign verification message
4. Verify backend accepts signature
5. NMKR payment window opens
6. Complete payment
7. NFT claimed successfully

### Test Case 2: Wrong Wallet
1. Enter valid eligible stake address (wallet A)
2. Connect different wallet (wallet B)
3. Address mismatch detected
4. Error shown, payment NOT allowed

### Test Case 3: Signature Declined
1. Enter valid eligible stake address
2. Connect matching wallet
3. Decline signature request
4. Error shown: "Please sign to verify ownership"
5. Can retry

### Test Case 4: Dev Tools Attack Simulation
1. Enter eligible stake address (not owned)
2. Try to modify JavaScript to skip verification
3. Backend should still reject (no valid signature)
4. Payment NOT allowed

### Test Case 5: Rate Limiting
1. Attempt verification 51 times rapidly
2. Rate limit error shown
3. Must wait before retrying

---

## Security Checklist

- [ ] Nonce generated on backend (not client)
- [ ] Signature verified cryptographically on backend
- [ ] Nonce consumed atomically (no replay)
- [ ] Rate limiting prevents brute force
- [ ] Failed attempts logged for audit
- [ ] Error messages don't leak sensitive info
- [ ] No way to bypass backend verification from client

---

## Estimated Changes

- **Lines of code to add:** ~80-100 lines in NMKRPayLightbox
- **Lines of code to modify:** ~30-40 lines (replace client-side verification)
- **New dependencies:** None (using existing infrastructure)
- **Database changes:** None (using existing tables)
- **API changes:** None (using existing routes)

---

## Rollback Plan

If issues arise after deployment:
1. Revert NMKRPayLightbox to previous version
2. Client-side verification will resume (less secure but functional)
3. No database migrations to reverse
4. No backend changes to reverse

---

## Success Criteria

1. ✅ User can claim NFT with matching wallet (happy path works)
2. ✅ User with wrong wallet cannot proceed to payment
3. ✅ Dev tools cannot bypass verification
4. ✅ Rate limiting prevents abuse
5. ✅ Clear error messages guide user
6. ✅ Audit logs capture all verification attempts

---

**Ready for Implementation**

This plan uses 100% existing infrastructure - the backend verification system is already built and tested. We're simply connecting NMKRPayLightbox to use it instead of client-side verification.
