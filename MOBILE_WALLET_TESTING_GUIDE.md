# Mobile Wallet Testing Guide

## Quick Test on Your Mobile Device

### Prerequisites:
1. **Eternl Mobile App** - You mentioned you have this installed ✓
2. **Mobile device** - iPhone or Android
3. **Site URL** - https://mek.overexposed.io
4. **Test Mek NFTs** - In your Eternl wallet

---

## Step-by-Step Testing Process

### 1. Initial Mobile Visit

**Action:** Open https://mek.overexposed.io on your mobile browser

**Expected Result:**
- ✓ Site loads with industrial yellow/gold theme
- ✓ See "MEK EMPLOYMENT" connection card
- ✓ See "Mobile Wallets" section with divider line
- ✓ See wallet buttons: Eternl, Flint, Typhon, Vespr, NuFi, Yoroi
- ✓ Each button has yellow borders, industrial design
- ✓ Text: "Tap a wallet to open the app and connect"

**If you see "Please install wallet" message:**
- This means desktop wallet detection is running (bug)
- Should see mobile wallets instead

---

### 2. Connect Eternl Wallet

**Action:** Tap the "Eternl" button

**Expected Result:**
1. **Browser shows loading:**
   - Overlay appears with "CONNECTING..."
   - Status text: "Opening eternl wallet app..."

2. **Eternl app opens:**
   - Deep link triggers: `eternl://dapp?url=https://mek.overexposed.io&action=connect`
   - Eternl app comes to foreground
   - See connection request from "mek.overexposed.io"

3. **In Eternl app:**
   - Tap "Connect" or "Approve"
   - May need to select account if you have multiple

4. **Return to browser:**
   - App automatically returns to browser
   - Connection continues automatically
   - Status changes to "Awaiting signature from wallet..."

5. **Signature request:**
   - Eternl app may open again for signature
   - Approve the signature request
   - Return to browser

6. **Connection completes:**
   - See your Meks displayed
   - Gold mining dashboard visible
   - Company name prompt if first time

**Troubleshooting:**
- **Eternl doesn't open:** App might not be installed, or browser blocks deep links
- **Connection times out:** 30-second timeout means something failed
- **Stuck on "Opening wallet":** Force close browser, reopen, try again

---

### 3. Verify Functionality

**Once connected, test these features:**

**Gold Mining:**
- ✓ See total gold amount
- ✓ See gold per hour rate
- ✓ Gold increases over time
- ✓ Can claim accumulated gold

**Mek Display:**
- ✓ See all your Meks
- ✓ Mek images load correctly
- ✓ See gold rates for each Mek
- ✓ See level indicators (1-10)

**Interactions:**
- ✓ Tap Meks to select them
- ✓ Level up buttons work (if eligible)
- ✓ UI is touch-friendly (44px+ tap targets)
- ✓ No accidental taps or overlaps

**Responsiveness:**
- ✓ Layout fits screen (no horizontal scroll)
- ✓ Text is readable without zooming
- ✓ Industrial design maintained
- ✓ Yellow/gold theme consistent

---

### 4. Reconnection Test

**Action:** Close browser and reopen

**Expected Result:**
- ✓ Wallet automatically reconnects
- ✓ No need to tap Eternl again
- ✓ Session persists from localStorage
- ✓ Meks and gold restore immediately

**If auto-reconnect fails:**
- Manual reconnect required
- Should still work via Eternl button

---

### 5. Disconnect and Reconnect

**Action:**
1. Find "Disconnect" button (usually in wallet dropdown)
2. Tap to disconnect
3. Try connecting again

**Expected Result:**
- ✓ Disconnect clears wallet state
- ✓ Returns to connection screen
- ✓ Can reconnect via Eternl button
- ✓ Same flow as initial connection

---

## Browser-Specific Testing

### iOS Safari (Primary Test)
**Most important - iOS Safari is most restrictive**

Test:
- ✓ Deep link opens Eternl
- ✓ Returns to Safari after approval
- ✓ Connection completes
- ✓ No infinite loops or stuck states

Known iOS Safari quirks:
- May show "Open in Eternl?" dialog (normal)
- Private browsing may block deep links
- First visit may ask permission to open app

### Android Chrome (Secondary Test)

Test:
- ✓ Deep link works smoothly
- ✓ Less restrictive than iOS
- ✓ May show "Open with" dialog

### Mobile Firefox (Optional)

Test:
- ✓ Verify deep links work
- ✓ May have different behavior

---

## Console Debugging

**Open mobile browser console (if available):**

### Expected Console Logs:

**On page load:**
```
[Wallet Detection] window.cardano not available (check if running in browser)
```
*(Normal for mobile - no browser extensions)*

**When tapping Eternl:**
```
[Mobile Wallet] Selected: eternl
[Mobile Wallet] Opening eternl with deep link: eternl://dapp?url=https://mek.overexposed.io&action=connect
```

**After returning from Eternl:**
```
[Mobile Wallet] Wallet detected after deep link: eternl
[Wallet Connect] Starting connection to Eternl
[Wallet Connect] Calling wallet.api.enable()...
[Wallet Connect] Stake address converted: ...
[Wallet Connect] Generating nonce for signature...
[Wallet Connect] Requesting signature from user...
```

**On successful connection:**
```
[Wallet Connect] Signature verified successfully!
[Wallet Connect] Connection complete
```

---

## What to Report Back

### Success Checklist:
- [ ] Mobile wallets appear on mobile device
- [ ] Tapping Eternl opens the app
- [ ] Connection request appears in Eternl
- [ ] Approve in Eternl returns to browser
- [ ] Signature request works
- [ ] Connection completes successfully
- [ ] Meks display correctly
- [ ] Gold mining works
- [ ] UI is touch-friendly
- [ ] Industrial design maintained
- [ ] Reconnection works after browser close

### If Issues:
Please report:
1. **Device type:** iPhone X, Samsung Galaxy S21, etc.
2. **Browser:** Safari, Chrome, Firefox
3. **Wallet app version:** Check in Eternl settings
4. **Error message:** Exact text shown
5. **Console logs:** Any errors in browser console
6. **Step where it failed:** Which step above didn't work
7. **Screenshot:** If UI looks wrong

---

## Desktop Verification (Control Test)

**Important:** Also verify desktop still works unchanged

**Action:** Visit https://mek.overexposed.io on desktop browser

**Expected Result:**
- ✓ Desktop wallet options show (Eternl extension, Nami, etc.)
- ✓ NO mobile wallet section
- ✓ Connection works as before
- ✓ Zero changes to desktop UX
- ✓ All features work identically

**This confirms desktop wasn't affected by mobile changes**

---

## Alternative Wallets (If Eternl Fails)

If Eternl doesn't work, try these in order:

### 1. Flint Mobile
- Check if you have Flint app installed
- Tap "Flint" button
- Similar flow to Eternl

### 2. Typhon Mobile
- Uses `typhoncip30://` deep link
- May require Typhon mobile app

### 3. NuFi Mobile
- Try NuFi if installed
- Should work identically

---

## Expected Performance

**Connection Time:**
- Initial deep link: 1-2 seconds
- Wallet app launch: 1-3 seconds
- Return to browser: 1-2 seconds
- Signature process: 3-5 seconds
- Total: ~10-15 seconds typical

**If longer than 30 seconds:**
- Timeout error will appear
- Something went wrong in the flow

---

## Success Indicators

### Visual Confirmation:
1. **Mobile wallet buttons appear** (not "install wallet" message)
2. **Deep link triggers** (Eternl app opens)
3. **Connection overlay shows** (yellow loading state)
4. **Status messages update** (detailed progress)
5. **Meks display** (your NFT collection)
6. **Gold mining active** (numbers counting up)
7. **Industrial theme** (yellow/gold, Orbitron font)

### Technical Confirmation:
1. **No JavaScript errors** in console
2. **Deep link URL correct** in logs
3. **Wallet injection detected** in logs
4. **Signature verified** in logs
5. **Database update** (gold rate saved)

---

## Quick Debug Commands

**If you have access to mobile browser console:**

```javascript
// Check if mobile detected
console.log('Is Mobile:', /android|iphone|ipad/i.test(navigator.userAgent));

// Check for wallet injection
console.log('Window.cardano:', window.cardano);

// Check available wallets
if (window.cardano) {
  console.log('Eternl:', !!window.cardano.eternl);
  console.log('CCVault:', !!window.cardano.ccvault); // Eternl old name
}
```

---

## Next Steps After Testing

### If Working:
1. Test with your actual Meks
2. Verify gold accumulation
3. Try level-up features
4. Test for 24+ hours (session persistence)
5. Share with other mobile users for feedback

### If Not Working:
1. Capture error messages
2. Take screenshots
3. Check console logs
4. Note exact failure point
5. Report findings for debugging

---

**Your Test Scenario:**
- Device: [Your phone model]
- Browser: [Safari/Chrome]
- Wallet: Eternl Mobile (installed ✓)
- URL: https://mek.overexposed.io

**Ready to test!** Start with Step 1 and work through the checklist.
