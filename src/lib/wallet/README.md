# Wallet Module - Modular Architecture

## Overview

The wallet module has been refactored into a clean, modular architecture with clear separation of concerns. This improves testability, reusability, and maintainability.

## Architecture

### Core Principles

1. **Separation of Concerns**: Detection, connection, and UI are separate modules
2. **Composability**: Small, focused functions and hooks that compose well
3. **Testability**: Pure functions with no side effects where possible
4. **Type Safety**: Full TypeScript support with clear interfaces
5. **DRY**: Single source of truth - no duplicate code

### Module Structure

```
src/
├── lib/
│   ├── walletDetection.ts           # Core wallet detection (WebView, wallet types)
│   ├── mobileWalletConnection.ts    # Mobile wallet deep linking
│   ├── platformDetection.ts         # Platform/device detection
│   ├── mobileWalletSupport.ts       # DEPRECATED - backwards compatibility layer
│   └── wallet/
│       ├── index.ts                 # Unified exports
│       └── README.md                # This file
└── hooks/
    ├── useWalletDetection.ts        # React hooks for wallet detection
    └── useMobileWallets.ts          # React hooks for mobile wallet management
```

## Usage Guide

### For React Components - Use Hooks

**Recommended approach for all React components.**

```typescript
import { useWalletEnvironment, useMobileWalletManager } from '@/lib/wallet';

function WalletConnectButton() {
  const { isWebView, walletType, isMobile } = useWalletEnvironment();

  const {
    wallets,
    connectWallet,
    isDetecting,
    isConnecting
  } = useMobileWalletManager('https://mek.overexposed.io', {
    onWalletOpened: (wallet) => console.log('Opened:', wallet),
    onError: (error) => console.error('Error:', error),
  });

  // Auto-connect if in WebView
  if (isWebView && walletType) {
    return <div>Connected to {walletType}</div>;
  }

  // Show mobile wallet buttons
  if (isMobile) {
    if (isDetecting) return <LoadingSpinner />;

    return (
      <div>
        {wallets.map(wallet => (
          <button
            key={wallet}
            onClick={() => connectWallet(wallet)}
            disabled={isConnecting}
          >
            Connect {wallet}
          </button>
        ))}
      </div>
    );
  }

  // Desktop fallback
  return <div>Please use a mobile device</div>;
}
```

### For Utility Functions - Use Pure Functions

**Use when you need wallet detection outside of React components.**

```typescript
import {
  detectWebViewWallet,
  openMobileWallet,
  detectPlatform
} from '@/lib/wallet';

// Server-side or utility functions
function checkWalletEnvironment() {
  const { isWebView, walletType } = detectWebViewWallet();
  const platform = detectPlatform();

  return {
    isWebView,
    walletType,
    platform,
    canConnect: platform.startsWith('mobile_')
  };
}

// Open a specific wallet
async function connectToWallet(walletType: MobileWalletType) {
  try {
    await openMobileWallet(walletType, 'https://mek.overexposed.io');
    console.log('Wallet opened successfully');
  } catch (error) {
    console.error('Failed to open wallet:', error);
  }
}
```

## Available Hooks

### `useWalletEnvironment()`

Complete environment detection in a single hook.

```typescript
const {
  platform,      // 'mobile_ios' | 'mobile_android' | 'mobile_web' | 'desktop'
  isMobile,      // boolean
  isIOS,         // boolean
  isAndroid,     // boolean
  isDesktop,     // boolean
  isWebView,     // boolean
  walletType     // 'eternl' | 'flint' | etc. (optional)
} = useWalletEnvironment();
```

### `useMobileWalletManager(dappUrl, options)`

Complete mobile wallet management.

```typescript
const {
  wallets,           // MobileWalletType[] - installed wallets
  hasWallets,        // boolean - any wallets found
  isDetecting,       // boolean - still scanning for wallets
  isConnecting,      // boolean - currently opening a wallet
  selectedWallet,    // MobileWalletType | null - wallet being opened
  error,             // Error | null - any error
  connectWallet,     // (wallet: MobileWalletType) => Promise<void>
  reset              // () => void - reset error state
} = useMobileWalletManager('https://mek.overexposed.io', {
  detectionTimeout: 1500,     // ms per wallet for detection
  connectionTimeout: 5000,    // ms to wait for wallet to open
  onWalletOpened: (wallet) => {},  // callback when wallet opens
  onError: (error) => {}           // callback on error
});
```

### Individual Hooks

```typescript
// Platform detection
const platform = usePlatform();              // PlatformType
const isMobile = useIsMobile();              // boolean
const isIOS = useIsIOS();                    // boolean
const isAndroid = useIsAndroid();            // boolean

// WebView detection
const { isWebView, walletType } = useWalletWebView();

// Mobile wallet detection only
const { wallets, isDetecting, error, hasWallets } = useMobileWallets();

// Mobile wallet connection only
const { openWallet, isOpening, error, reset } = useWalletDeepLink('https://mek.overexposed.io');
```

## Available Utility Functions

### Wallet Detection

```typescript
import {
  detectWebViewWallet,
  getWalletDisplayName,
  isValidWalletType,
  getSupportedWalletTypes
} from '@/lib/wallet';

// Detect if in WebView
const { isWebView, walletType } = detectWebViewWallet();

// Get wallet display name
const name = getWalletDisplayName('eternl'); // 'Eternl'

// Validate wallet type
const isValid = isValidWalletType('eternl'); // true

// Get all supported wallets
const wallets = getSupportedWalletTypes(); // ['eternl', 'flint', ...]
```

### Mobile Wallet Connection

```typescript
import {
  createMobileWalletDeepLink,
  openMobileWallet,
  checkMobileWalletInstalled,
  detectAvailableMobileWallets
} from '@/lib/wallet';

// Create deep link
const link = createMobileWalletDeepLink('eternl', 'https://mek.overexposed.io');

// Open wallet
await openMobileWallet('eternl', 'https://mek.overexposed.io');

// Check if wallet is installed
const isInstalled = await checkMobileWalletInstalled('eternl');

// Detect all installed wallets
const wallets = await detectAvailableMobileWallets();
```

### Platform Detection

```typescript
import {
  detectPlatform,
  isMobileDevice,
  isIOSDevice,
  isAndroidDevice,
  getBrowserName,
  getOSName
} from '@/lib/wallet';

const platform = detectPlatform();     // 'mobile_ios' | 'mobile_android' | etc.
const isMobile = isMobileDevice();     // boolean
const isIOS = isIOSDevice();           // boolean
const browser = getBrowserName();      // 'Chrome' | 'Safari' | etc.
const os = getOSName();                // 'iOS' | 'Android' | etc.
```

## Migration Guide

### From Old API to New API

**Old (deprecated):**
```typescript
import {
  isMobileDevice,
  isWalletWebView,
  openMobileWallet
} from '@/lib/mobileWalletSupport';

const isMobile = isMobileDevice();
const { isWebView, walletType } = isWalletWebView();
await openMobileWallet('eternl', 'https://example.com');
```

**New (recommended for React):**
```typescript
import {
  useWalletEnvironment,
  useMobileWalletManager
} from '@/lib/wallet';

const { isMobile, isWebView, walletType } = useWalletEnvironment();
const { connectWallet } = useMobileWalletManager('https://example.com');
await connectWallet('eternl');
```

**New (recommended for utilities):**
```typescript
import {
  isMobileDevice,
  detectWebViewWallet,
  openMobileWallet
} from '@/lib/wallet';

const isMobile = isMobileDevice();
const { isWebView, walletType } = detectWebViewWallet();
await openMobileWallet('eternl', 'https://example.com');
```

### Breaking Changes

**None.** The old API is still available via `@/lib/mobileWalletSupport` for backwards compatibility. However, it's deprecated and delegates to the new modules.

### Recommended Migration Path

1. **Phase 1**: Update React components to use new hooks
   - Replace `useState` + `useEffect` patterns with `useMobileWalletManager`
   - Replace platform detection calls with `useWalletEnvironment`

2. **Phase 2**: Update utility functions to use new pure functions
   - Import from `@/lib/wallet` instead of `@/lib/mobileWalletSupport`
   - Update function calls to use new naming (same behavior)

3. **Phase 3**: Remove deprecated imports
   - Search codebase for `@/lib/mobileWalletSupport`
   - Replace with `@/lib/wallet` imports
   - Test thoroughly

## Benefits

### Before Refactoring

- **Duplication**: `isWalletWebView()` existed in both `platformDetection.ts` and `mobileWalletSupport.ts`
- **Tight Coupling**: Components had complex `useState` + `useEffect` logic mixed with business logic
- **Hard to Test**: Pure functions mixed with side effects
- **Poor Reusability**: Couldn't easily reuse wallet detection logic

### After Refactoring

- **DRY**: Single source of truth in `walletDetection.ts`
- **Separation of Concerns**: Detection, connection, and UI are separate
- **Easy to Test**: Pure functions can be unit tested easily
- **Composable**: Hooks compose well - use `useMobileWalletManager` or individual hooks
- **Better DX**: Clear, documented APIs with TypeScript support

## Testing

### Unit Testing Pure Functions

```typescript
import { detectWebViewWallet, createMobileWalletDeepLink } from '@/lib/wallet';

describe('detectWebViewWallet', () => {
  it('should detect Eternl WebView from user agent', () => {
    // Mock navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; eternl)',
      writable: true
    });

    const result = detectWebViewWallet();
    expect(result.isWebView).toBe(true);
    expect(result.walletType).toBe('eternl');
  });
});

describe('createMobileWalletDeepLink', () => {
  it('should create valid Eternl deep link', () => {
    const link = createMobileWalletDeepLink('eternl', 'https://example.com');
    expect(link).toBe('eternl://dapp?url=https%3A%2F%2Fexample.com&action=connect');
  });
});
```

### Integration Testing with Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useMobileWalletManager } from '@/lib/wallet';

describe('useMobileWalletManager', () => {
  it('should detect available wallets', async () => {
    const { result } = renderHook(() =>
      useMobileWalletManager('https://example.com')
    );

    expect(result.current.isDetecting).toBe(true);

    await waitFor(() => {
      expect(result.current.isDetecting).toBe(false);
      expect(result.current.wallets).toBeDefined();
    });
  });
});
```

## Architecture Patterns

### Dependency Flow

```
Components (UI)
    ↓
Hooks (React Integration)
    ↓
Pure Functions (Business Logic)
    ↓
Browser APIs (Platform)
```

### Layered Architecture

1. **Browser APIs Layer**: `navigator`, `window`, `document`
2. **Pure Functions Layer**: `walletDetection.ts`, `mobileWalletConnection.ts`, `platformDetection.ts`
3. **React Hooks Layer**: `useWalletDetection.ts`, `useMobileWallets.ts`
4. **Component Layer**: `MobileWalletConnect.tsx`, etc.

### Design Patterns Used

- **Single Responsibility**: Each module has one clear purpose
- **Dependency Injection**: Hooks accept configuration via parameters
- **Composition**: Small hooks compose into larger hooks (`useMobileWalletManager`)
- **Adapter Pattern**: Old API adapts to new API for backwards compatibility
- **Facade Pattern**: `@/lib/wallet/index.ts` provides simple interface to complex subsystem

## Future Improvements

1. **Add E2E tests** for wallet connection flow
2. **Add metrics** to track wallet connection success rates
3. **Add retry logic** for failed wallet connections
4. **Add offline detection** to show better error messages
5. **Add wallet preference storage** to remember user's last wallet choice
