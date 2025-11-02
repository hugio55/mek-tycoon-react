# NMKR Payment Error Debugging Guide

## Error Message
"Error while gathering information for your payment. Please start the payment process again or select another payment method."

## Common Causes

### 1. **Price Not Configured (Most Likely)**
NMKR requires a pricelist to be configured before enabling sales.

**How to Fix:**
1. Go to NMKR Studio: https://studio.nmkr.io
2. Open your project: `c68dc0e9b2ca4e0eb9c4a57ef85a794d`
3. Navigate to **"Pricing"** or **"Pricelist"** section
4. Add a price entry:
   - **Count**: 1 (means 1 NFT per purchase)
   - **Price**: Your desired price in ADA (e.g., 10 ADA)
   - **Currency**: ADA
5. **Save** the pricelist
6. Ensure **"Enable Sales"** toggle is ON

### 2. **Sales Not Enabled**
Project might exist but sales are disabled.

**How to Fix:**
1. In NMKR Studio project settings
2. Find **"Enable Sales"** or **"Sales Active"** toggle
3. Turn it ON
4. Save changes

### 3. **NFT Inventory Depleted**
All NFTs in the project have been sold.

**How to Check:**
1. In NMKR Studio, check **"NFT Inventory"** or **"Available NFTs"**
2. If 0 remaining, you need to:
   - Create more NFTs in the project, OR
   - Create a new project

### 4. **Project ID Incorrect**
The project ID in your `.env.local` doesn't match NMKR Studio.

**How to Verify:**
- Current project ID: `c68dc0e9b2ca4e0eb9c4a57ef85a794d`
- In NMKR Studio, verify this matches your actual project
- Check both mainnet/testnet (we're using mainnet)

### 5. **Network Mismatch**
You're using mainnet configuration but project is on preprod (or vice versa).

**Current Config:**
```
NEXT_PUBLIC_NMKR_NETWORK=mainnet
NEXT_PUBLIC_NMKR_PROJECT_ID=c68dc0e9b2ca4e0eb9c4a57ef85a794d
```

**Verify:** Project must be on **mainnet** in NMKR Studio.

## Debugging Steps

### Step 1: Check NMKR Studio Project
1. Log into https://studio.nmkr.io
2. Find project with ID `c68dc0e9b2ca4e0eb9c4a57ef85a794d`
3. Verify:
   - [ ] Project exists
   - [ ] Project is on **mainnet** (not preprod)
   - [ ] NFTs available (inventory > 0)
   - [ ] Pricelist configured
   - [ ] Sales enabled

### Step 2: Check Browser Console
When you click "Pay via NMKR" and get the error:
1. Open browser console (F12)
2. Look for NMKR-related errors
3. Check Network tab for failed API calls to `pay.nmkr.io`
4. Look for response bodies with detailed error messages

### Step 3: Test NMKR Pay Widget Directly
Try opening the payment URL directly in browser:
```
https://pay.nmkr.io/?p=c68dc0e9b2ca4e0eb9c4a57ef85a794d&c=1
```

If this fails with the same error, it's an NMKR configuration issue (not our code).

### Step 4: Check NMKR API Status
- Visit: https://status.nmkr.io/
- Verify all services are operational
- Check if there are any ongoing incidents

## Solution Checklist

Based on the error, the most likely fix is:

1. [ ] **Add pricing to NMKR Studio project**
   - Go to Pricing section
   - Add entry: Count=1, Price=10 ADA (or your desired price)
   - Save changes

2. [ ] **Enable sales**
   - Toggle "Enable Sales" ON
   - Save changes

3. [ ] **Verify inventory**
   - Check that NFTs exist and are available
   - If depleted, add more NFTs to project

4. [ ] **Test payment URL**
   - Open `https://pay.nmkr.io/?p=YOUR_PROJECT_ID&c=1`
   - Should show payment interface (not error)

5. [ ] **Check webhook configuration** (if payment works but doesn't record)
   - Webhook URL: `https://yourdomain.com/api/nmkr-webhook`
   - Webhook secret matches `.env.local`

## Expected Behavior After Fix

Once configured correctly:
1. User clicks "Claim Your NFT" button
2. Preview lightbox shows Lab Rat NFT image and number
3. User clicks "Pay via NMKR"
4. NMKR payment window opens (popup)
5. User sees payment options (wallet, credit card, etc.)
6. User completes payment
7. Webhook receives confirmation
8. Success screen shows in lightbox

## Contact NMKR Support

If issue persists after checking all above:
- Email: support@nmkr.io
- Discord: https://discord.gg/nmkr
- Documentation: https://docs.nmkr.io

Provide them with:
- Project ID: `c68dc0e9b2ca4e0eb9c4a57ef85a794d`
- Error message
- Network: mainnet
- Screenshots of project settings
