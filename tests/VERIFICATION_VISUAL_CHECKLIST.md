# Blockfrost Verification Error Handling - Visual Testing Checklist

**Component:** BlockchainVerificationPanel
**Location:** `src/components/BlockchainVerificationPanel.tsx`
**Test URL:** http://localhost:3100 (Main Hub Page)
**Date Created:** 2025-10-08

---

## Overview

This checklist provides manual visual testing procedures for Blockfrost verification error handling. Use this alongside the automated Playwright test suite for comprehensive coverage.

**Prerequisites:**
- App running on http://localhost:3100
- Wallet connected with MEK NFTs
- Access to browser DevTools console

---

## Test Scenario 1: Large Collection (240+ NFTs)

### Loading States
- [ ] **Button changes to loading state** (spinning animation, "VERIFYING ON BLOCKCHAIN...")
- [ ] **Full-screen loading overlay appears** with:
  - [ ] Black semi-transparent backdrop (bg-black/80)
  - [ ] Dual-spinning yellow rings (outer and inner)
  - [ ] Percentage progress indicator (0% → 100%)
  - [ ] "VERIFYING OWNERSHIP" header in Orbitron font
  - [ ] Progress text updates showing current step

### Progress Messages
- [ ] "Initializing verification..." (0-10%)
- [ ] "Connecting to Cardano blockchain..." (10-25%)
- [ ] "Querying X NFTs on-chain... (Large collection - may take up to 45s)" (25-50%)
- [ ] "Verifying NFT ownership via Blockfrost..." (50-75%)
- [ ] "Processing verification results..." (75-90%)
- [ ] "Initializing Mek Employment Operation..." (90-100%)

### Timeout Handling (7-10+ seconds)
- [ ] **If verification takes >45 seconds:**
  - [ ] Button changes to error state (red background, hazard stripes)
  - [ ] Button text: "VERIFICATION FAILED" with ⚠ icon
  - [ ] Error panel appears below button

### Success State
- [ ] Button transitions to green success state
- [ ] Text: "✓ VERIFIED ON BLOCKCHAIN"
- [ ] Loading overlay disappears
- [ ] No console errors in DevTools

---

## Test Scenario 2: Error State Visual Confirmation

### "ctx.query undefined" Error
**How to trigger:** Backend mutation scheduling error

- [ ] **Error Panel Appears:**
  - [ ] Black background with red border (border-red-500/50)
  - [ ] Hazard stripe header (black/yellow diagonal stripes)
  - [ ] Red warning icon with pulsing animation
  - [ ] "VERIFICATION ERROR" header in Orbitron font
  - [ ] Red decorative corner accents (4 corners)

- [ ] **Error Message Content:**
  - [ ] Clear error description in red text
  - [ ] "Database error during verification..." message
  - [ ] Two action buttons: "↻ Retry Verification" and "Dismiss"
  - [ ] Buttons have proper touch targets (48px height on mobile)

- [ ] **Button Styling:**
  - [ ] Button has red background (bg-red-900/30)
  - [ ] Red border with hazard stripe overlay
  - [ ] Text: "⚠ VERIFICATION FAILED"
  - [ ] Angled clip-path polygon shape

### Timeout Error
**Trigger:** Collection >200 NFTs taking >45 seconds

- [ ] Same error panel structure as above
- [ ] Error message: "Verification timed out after 45 seconds..."
- [ ] Additional technical hint section below:
  - [ ] Border separator (border-red-500/20)
  - [ ] Gray italic text with helpful info
  - [ ] "Large collections may require additional time..."

### Rate Limit Error
**Trigger:** Too many verification requests

- [ ] Same error panel structure
- [ ] Error message: "Rate limit exceeded. Please wait 60 seconds..."
- [ ] Retry button functional after waiting

---

## Test Scenario 3: Button State Transitions

### State Flow 1: Idle → Loading → Error → Idle (Retry)

1. **Idle State**
   - [ ] Text: "VERIFY ON BLOCKCHAIN"
   - [ ] Yellow background with angled shape
   - [ ] No spinner or icons
   - [ ] Clickable (cursor-pointer)

2. **Loading State** (after click)
   - [ ] Dual-spinning rings (yellow/golden)
   - [ ] Text: "VERIFYING ON BLOCKCHAIN..."
   - [ ] Pulsing animation
   - [ ] Button disabled (cursor-not-allowed)

3. **Error State** (after error)
   - [ ] Red background with hazard stripes
   - [ ] ⚠ warning icon
   - [ ] Text: "VERIFICATION FAILED"
   - [ ] Button still disabled
   - [ ] Error panel appears below

4. **Retry to Idle** (click retry)
   - [ ] Error panel dismisses
   - [ ] Returns to loading state
   - [ ] Then proceeds to success or error

### State Flow 2: Idle → Loading → Success

1. **Idle State** (as above)

2. **Loading State** (as above)

3. **Success State**
   - [ ] Green background (bg-green-900/30)
   - [ ] Green border (border-green-500/50)
   - [ ] ✓ checkmark icon
   - [ ] Text: "VERIFIED ON BLOCKCHAIN"
   - [ ] Green gradient overlay effect

### Verify No "Stuck" States

- [ ] **Button never stays in loading state indefinitely**
- [ ] **After error, button returns to clickable state** (via retry or dismiss)
- [ ] **After success, button remains in success state** (doesn't revert)
- [ ] **Loading overlay always disappears** when verification completes

---

## Test Scenario 4: Console Error Monitoring

### During Successful Verification

Open browser DevTools (F12) → Console tab

- [ ] **No red error messages** during verification process
- [ ] **No "ERROR" keywords** in console logs
- [ ] **No "Failed" messages** (except expected network retries)
- [ ] **No "undefined" errors**
- [ ] **No unhandled promise rejections**

Expected logs (green/gray):
```
[Verification] Starting ownership verification
[Verification] Wallet address: stake1...
[Verification] MEKs count: X
[Verification] Verification completed: {...}
[Verification] ✓ Ownership verified successfully!
```

### During Failed Verification

- [ ] **Errors are logged properly** with full details
- [ ] **Error messages include stack traces**
- [ ] **No unhandled exceptions** (all caught and displayed in UI)
- [ ] **Frontend error handler catches backend errors**

Expected error logs:
```
[Verification] Error during verification: {...}
[Verification] Full error details: {...}
```

### Error Propagation Check

- [ ] **Backend errors appear in frontend UI** (not just console)
- [ ] **Error messages are user-friendly** (not raw error objects)
- [ ] **Technical details logged to console** for debugging
- [ ] **User sees actionable error messages** in error panel

---

## Test Scenario 5: Industrial Design System Compliance

### Typography
- [ ] **Headers use Orbitron font** ("VERIFICATION ERROR", "VERIFYING OWNERSHIP")
- [ ] **Labels are uppercase** with tracking-wider
- [ ] **Value text is appropriately sized** (text-sm, text-xs)

### Colors
- [ ] **Yellow/Gold primary** (#fab617) for normal state
- [ ] **Red for errors** (text-red-400, border-red-500)
- [ ] **Green for success** (text-green-500, bg-green-900)
- [ ] **Gray for labels** (text-gray-400, text-gray-500)

### Effects
- [ ] **Backdrop blur on error panel** (backdrop-blur-sm)
- [ ] **Hazard stripes visible** (45deg black/yellow pattern)
- [ ] **Corner accents present** (4 red corner borders)
- [ ] **Pulsing animations smooth** (animate-pulse, animate-ping)
- [ ] **Glow effects on icons** (optional)

### Spacing & Layout
- [ ] **Proper padding** on mobile (p-3) and desktop (sm:p-4)
- [ ] **Consistent spacing** between elements (gap-2, gap-3)
- [ ] **Touch targets** adequate on mobile (min-h-[48px])
- [ ] **Responsive text sizing** (text-xs sm:text-sm)

---

## Test Scenario 6: Error Message Clarity

### Timeout Error Message

**Expected:**
> "Verification timed out after 45 seconds. Large collections (200+ NFTs) may require multiple attempts. Please wait 30 seconds and try again. If this persists after 3 attempts, contact support."

- [ ] Message is clear and specific
- [ ] Provides expected wait time
- [ ] Suggests action (wait 30 seconds)
- [ ] Offers support escalation
- [ ] No technical jargon

### Database Error Message

**Expected:**
> "Database error during verification. This is a temporary issue. Please wait 10 seconds and try again."

- [ ] Explains the issue (database error)
- [ ] Reassures user (temporary)
- [ ] Provides action (wait 10 seconds)
- [ ] No scary error codes

### Rate Limit Error Message

**Expected:**
> "Rate limit exceeded. Please wait 60 seconds before trying again."

- [ ] Clear reason (rate limit)
- [ ] Specific wait time (60 seconds)
- [ ] Simple language

### Network Error Message

**Expected:**
> "Network error. Please check your internet connection and try again."

- [ ] Identifies issue (network)
- [ ] Suggests fix (check connection)
- [ ] Allows retry

---

## Cross-Browser Testing

Test in multiple browsers to ensure consistency:

### Chrome
- [ ] All states render correctly
- [ ] Animations smooth
- [ ] Console errors caught
- [ ] Industrial styling intact

### Firefox
- [ ] All states render correctly
- [ ] Hazard stripes display
- [ ] Backdrop blur works
- [ ] Fonts load properly

### Safari (if available)
- [ ] All states render correctly
- [ ] Webkit-specific issues resolved
- [ ] Animations work
- [ ] Touch targets adequate

---

## Mobile Responsiveness

Test on mobile viewport (375px width):

### Button States
- [ ] **Button text truncates properly**
  - Desktop: "VERIFY ON BLOCKCHAIN"
  - Mobile: "VERIFY BLOCKCHAIN"
- [ ] **Minimum touch target** (56px height)
- [ ] **Active scaling** works (active:scale-95)

### Error Panel
- [ ] **Buttons stack vertically** (flex-col on mobile)
- [ ] **Each button 48px height**
- [ ] **Text remains readable** (not too small)
- [ ] **Hazard stripes scale properly**

### Loading Overlay
- [ ] **Overlay covers full panel** on mobile
- [ ] **Spinner centered** properly
- [ ] **Progress text visible** and readable

---

## Accessibility Checks

### ARIA Attributes
- [ ] `data-verify-blockchain` present on button
- [ ] `aria-busy={isVerifying}` updates correctly
- [ ] `aria-live="polite"` announces state changes
- [ ] `aria-label` on details toggle button

### Keyboard Navigation
- [ ] Button focusable with Tab key
- [ ] Enter/Space activates button
- [ ] Focus visible outline appears
- [ ] Retry/Dismiss buttons keyboard accessible

### Screen Reader Testing
- [ ] Button state changes announced
- [ ] Error messages read aloud
- [ ] Loading state communicated
- [ ] Success state confirmed

---

## Performance Checks

### Animation Performance
- [ ] **Spinners run at 60fps** (no jank)
- [ ] **Hazard stripes don't cause repaints**
- [ ] **Progress bar updates smoothly**
- [ ] **No layout shifts** during state changes

### Network Performance
- [ ] **Rate limiting works** (prevents spam requests)
- [ ] **Cache used** for recent verifications (5min TTL)
- [ ] **Timeout enforced** (45 seconds max)
- [ ] **Fallback to Koios** if Blockfrost fails

---

## Sign-Off

**Tester Name:** ___________________________
**Date:** ___________________________
**Browser:** ___________________________
**Viewport:** Desktop / Mobile / Tablet

**Overall Result:**
- [ ] All tests passed
- [ ] Minor issues found (list below)
- [ ] Major issues found (list below)

**Issues Found:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Screenshots Attached:** [ ] Yes [ ] No

---

## Notes for Future Test Runs

- Remember to test with different MEK collection sizes (1, 10, 50, 100, 200, 250+)
- Test with slow network (DevTools → Network → Slow 3G)
- Test with disabled JavaScript to verify graceful degradation
- Test error recovery by triggering errors intentionally
- Compare screenshots against baseline images in `tests/__screenshots__/`
