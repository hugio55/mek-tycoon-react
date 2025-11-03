# Page Loader Feature

Universal page loading system with progress indication for Mek Tycoon.

## Features

- **Universal**: Works on any page automatically
- **Automatic Query Detection**: Tracks Convex useQuery hooks automatically
- **Smart Progress**: Combines query tracking, time-based progress, and milestones
- **Fully Isolated**: Self-contained feature, easy to add/remove
- **Industrial Theme**: Matches site aesthetic

## Quick Start

### 1. Wrap your page with LoaderProvider

```tsx
import { LoaderProvider } from '@/features/page-loader';

export default function MyPage() {
  return (
    <LoaderProvider>
      {/* Your page content */}
    </LoaderProvider>
  );
}
```

### 2. Track queries (optional)

Queries are automatically tracked if you use the standard `useQuery` hook. For manual tracking:

```tsx
import { useTrackedQuery } from '@/features/page-loader';

const userData = useTrackedQuery(
  useQuery(api.users.getProfile),
  'userProfile'
);
```

### 3. Use the progress hook

```tsx
import { usePageLoadProgress } from '@/features/page-loader';

const { percentage, stage, isComplete } = usePageLoadProgress();
```

## Configuration

### Feature Flags

Edit `config/constants.ts`:

```typescript
export const FEATURE_FLAGS = {
  ENABLED: true, // Toggle to disable globally
};
```

### Per-Page Config

```tsx
const progress = usePageLoadProgress({
  messages: ['Loading custom data...', 'Almost there...'],
  minDisplayTime: 1000,
  totalTimeout: 20000,
});
```

## How to Remove

### Step 1: Disable Feature

```typescript
// config/constants.ts
export const FEATURE_FLAGS = {
  ENABLED: false,
};
```

### Step 2: Remove Wrappers

Remove `<LoaderProvider>` from all pages.

### Step 3: Delete Directory

```bash
rm -rf src/features/page-loader
```

Done! No other code is affected.

## Safety Mechanisms

- **Total Timeout**: 30 seconds max
- **Query Timeout**: 8 seconds per query
- **Minimum Display**: 500ms (prevents flash)
- **Fast Load Skip**: Auto-skips if loads < 500ms
- **localStorage Bypass**: `localStorage.setItem('disablePageLoader', 'true')`

## Progress Calculation

Combines three strategies:
1. **Query Detection** (40%): Tracks Convex queries
2. **Common Milestones** (30%): Wallet, user data, page data
3. **Time-Based** (30%): Always increases over time

Progress snaps to: 0% → 25% → 50% → 75% → 90% → 100%

## Console Logging

All progress updates logged to console with `[PAGE LOADER]` prefix.

To debug:
```typescript
// Check what queries are registered
// Check progress calculation breakdown
// Check timeout triggers
```

## Support

Questions? Check the comprehensive implementation plan in the project documentation.
