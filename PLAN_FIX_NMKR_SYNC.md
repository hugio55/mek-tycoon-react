# Plan: Fix nmkrSync Functions on Sturgeon

## Problem Summary
The "Verify with NMKR" button fails because `nmkrSync:getInventoryDiscrepancies` function is not found on Sturgeon (production), even after clicking "Deploy Prod (Sturgeon)".

## Root Cause Analysis
1. The `deploy-prod` API route uses `--url` flag but doesn't set `CONVEX_DEPLOYMENT` environment variable
2. The proper deployment identifier is `prod:fabulous-sturgeon-691` (from `.env.sturgeon`)
3. Without the correct `CONVEX_DEPLOYMENT`, the deploy may not target the right deployment

## Fix Steps (One at a Time)

### Step 1: Verify the Problem
Run this command to confirm nmkrSync doesn't exist on Sturgeon:
```bash
set CONVEX_DEPLOYMENT=prod:fabulous-sturgeon-691 && npx convex function-spec
```
If nmkrSync functions are NOT listed, proceed to Step 2.

### Step 2: Deploy Directly to Sturgeon
Run this command in the project directory:
```bash
set CONVEX_DEPLOYMENT=prod:fabulous-sturgeon-691 && npx convex deploy --yes --typecheck=disable
```
This sets the correct deployment target before running deploy.

### Step 3: Verify the Fix
Run function-spec again to confirm nmkrSync exists:
```bash
set CONVEX_DEPLOYMENT=prod:fabulous-sturgeon-691 && npx convex function-spec | findstr nmkrSync
```
Should show all 6 nmkrSync functions.

### Step 4: Test the Button
1. Restart dev server: `npm run dev:all`
2. Go to Admin → NFT → Campaigns
3. Click "Verify with NMKR" on Lab Rat Collection
4. Should show discrepancy modal with Lab Rat #3

### Step 5 (Optional): Fix the Deploy Button
Update `src/app/api/deployment/deploy-prod/route.ts` to set `CONVEX_DEPLOYMENT` in the environment:
```javascript
env: {
  ...process.env,
  CONVEX_DEPLOYMENT: 'prod:fabulous-sturgeon-691',
  CONVEX_URL: sturgeonUrl
}
```

## Expected Outcome
- nmkrSync functions will exist on Sturgeon
- "Verify with NMKR" button will work
- Will show Lab Rat #3 as needing sync (DB=reserved, NMKR=sold)
- Clicking sync will update Lab Rat #3 to "sold" status
