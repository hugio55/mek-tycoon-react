# Maintenance Mode

Quick guide to enable/disable the maintenance page on mek.overexposed.io

## How to Enable Maintenance Mode

### Option 1: Using Vercel Dashboard (Recommended)
1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add a new variable:
   - **Name**: `NEXT_PUBLIC_MAINTENANCE_MODE`
   - **Value**: `true`
4. Redeploy the site (or let auto-deploy handle it)

### Option 2: Using Vercel CLI
```bash
vercel env add NEXT_PUBLIC_MAINTENANCE_MODE
# When prompted, enter: true
# Select environment: Production

# Redeploy
vercel --prod
```

### Option 3: Local Testing
Add to your `.env.local`:
```bash
NEXT_PUBLIC_MAINTENANCE_MODE=true
```

Then restart your dev server:
```bash
npm run dev:all
```

## How to Disable Maintenance Mode

### Vercel Dashboard
1. Go to Environment Variables
2. Find `NEXT_PUBLIC_MAINTENANCE_MODE`
3. Either:
   - **Delete** the variable, OR
   - Change value to `false`
4. Redeploy

### Vercel CLI
```bash
vercel env rm NEXT_PUBLIC_MAINTENANCE_MODE production
vercel --prod
```

## What Happens When Enabled

- ✅ All visitors to `mek.overexposed.io` see the maintenance page
- ✅ Localhost/dev still works normally (you can keep developing)
- ✅ The maintenance page shows at `/maintenance`
- ✅ No other pages are accessible

## Customize the Maintenance Message

Edit: `src/app/maintenance/page.tsx`

Change this section:
```typescript
<p className="text-sm">
  Expected downtime: <span className="text-yellow-500 font-semibold">30-60 minutes</span>
</p>
```

## Preview the Maintenance Page

Visit: `http://localhost:3100/maintenance`

Or on production: `https://mek.overexposed.io/maintenance`
