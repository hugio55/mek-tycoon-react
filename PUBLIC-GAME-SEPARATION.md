# Public Site vs Game Site Separation

## Overview

The Mek Tycoon codebase now supports **two separate sites from one codebase**:
- **Public Site**: `/mek-rate-logging` - Wallet verification and Mek info (no game features)
- **Game Site**: All other routes (`/hub`, `/profile`, `/crafting`, etc.) - Full game with navigation

## Architecture

### Single Codebase Strategy
- ✅ One Next.js project
- ✅ One Convex backend
- ✅ Shared components and logic
- ✅ Zero code duplication
- ✅ Bug fixes apply to both sites automatically

### Route Separation
- `/` - Landing page (currently redirects to game for logged-in users)
- `/mek-rate-logging` - **PUBLIC SITE** (wallet verification, Mek display)
- `/hub`, `/profile`, `/crafting`, etc. - **GAME SITE** (protected routes)

## Files Created

### 1. `/src/lib/routeUtils.ts`
Utility functions to determine if a route is public or game-related.

```typescript
isPublicRoute(pathname) // Returns true for /mek-rate-logging
isGameRoute(pathname)   // Returns true for game routes
```

### 2. `/src/middleware.ts`
Enforces domain separation when deployed to different domains.

**Behavior:**
- `meks.mektycoon.com` → Only allows `/mek-rate-logging`
- `play.mektycoon.com` → Redirects `/` to `/hub`, blocks `/mek-rate-logging`
- `localhost` → No restrictions (for development)

### 3. `/src/app/_archived/landing-page-original.tsx`
Backup of the original landing page for future use.

## How It Works

### Development (localhost)
```
http://localhost:3100/              → Landing page
http://localhost:3100/mek-rate-logging → Public Mek verification
http://localhost:3100/hub           → Game (full features)
```

All routes work normally during development.

### Production (Two Domains)

**Public Site: `meks.mektycoon.com`**
```
meks.mektycoon.com → /mek-rate-logging (forced by middleware)
```
- Users can verify wallets and see their Meks
- NO game navigation visible
- NO links to game features
- Perfect for sharing publicly

**Game Site: `play.mektycoon.com`**
```
play.mektycoon.com → /hub (redirected from /)
```
- Users see full game navigation
- All game features accessible
- `/mek-rate-logging` redirects to `/hub` (game users don't need it)

## Deployment Instructions

### Option A: Vercel with Multiple Domains

1. Deploy once to Vercel:
   ```bash
   vercel --prod
   ```

2. In Vercel dashboard, add two domains to the SAME project:
   - `meks.mektycoon.com`
   - `play.mektycoon.com`

3. Middleware automatically handles routing based on domain

### Option B: Different Subdomains, Same Deployment

1. Point both DNS records to the same Vercel deployment:
   ```
   meks CNAME → cname.vercel-dns.com
   play CNAME → cname.vercel-dns.com
   ```

2. Middleware detects hostname and routes accordingly

## Benefits

### ✅ No Code Duplication
- Fix a bug once → fixed everywhere
- Update Mek calculations → both sites benefit
- Add new features → available to both (if desired)

### ✅ Single Convex Backend
- One database
- One set of queries/mutations
- No data sync issues

### ✅ Easy to Maintain
- One `npm run dev:all` command
- One deployment
- One codebase to understand

### ✅ Flexible
- Can add more public routes easily
- Can change domain routing in middleware
- Can conditionally show features based on route

## Testing

### Test Public Site
```bash
# Visit http://localhost:3100/mek-rate-logging
# Should see: Mek verification, NO game navigation
```

### Test Game Site
```bash
# Visit http://localhost:3100/hub
# Should see: Full game navigation, all features
```

### Test Domain Routing (Simulate Production)
```bash
# Edit your hosts file to test domains locally:
# 127.0.0.1 meks.mektycoon.local
# 127.0.0.1 play.mektycoon.local

# Then visit:
# http://meks.mektycoon.local:3100 → Should redirect to /mek-rate-logging
# http://play.mektycoon.local:3100 → Should redirect to /hub
```

## Future Enhancements

### Conditional Navigation (TODO)
Create a Navigation component that hides game links on public routes:

```typescript
// components/Navigation.tsx
import { usePathname } from 'next/navigation';
import { isPublicRoute } from '@/lib/routeUtils';

export default function Navigation() {
  const pathname = usePathname();

  if (isPublicRoute(pathname)) {
    return <PublicNav />; // Minimal nav, just logo
  }

  return <FullGameNav />; // Full game navigation
}
```

### Mobile Optimization
When implementing mobile support, use the same route-based approach:
- Public site optimized for mobile wallet connection
- Game site optimized for mobile gameplay

## Notes

- Original landing page is archived in `/src/app/_archived/landing-page-original.tsx`
- Middleware only activates when specific domains are detected
- Development on `localhost` is unrestricted for ease of testing
- Both sites share the same Convex functions (read-only for public, full access for game)

## Summary

**One codebase, two sites, zero duplication, maximum flexibility.**

Perfect for launching a public Mek verification site while keeping the full game separate and protected.
