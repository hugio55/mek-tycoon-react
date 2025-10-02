# Wallet Icons Directory

This directory contains icons for Cardano mobile wallet integrations.

## Required Icons

The following wallet icons are needed for the mobile wallet connection UI:

1. **eternl.png** - Eternl Wallet
2. **flint.png** - Flint Wallet
3. **typhon.png** - Typhon Wallet
4. **vespr.png** - Vespr Wallet
5. **nufi.png** - NuFi Wallet
6. **yoroi.png** - Yoroi Wallet
7. **lace.png** - Lace Wallet

## Icon Specifications

- **Format**: PNG with transparency
- **Size**: 32x32 pixels (will scale automatically)
- **Color**: Full color preferred, but monochrome works
- **Background**: Transparent (alpha channel)
- **File naming**: Lowercase, matching wallet type exactly

## Where to Get Icons

### Official Sources

1. **Eternl**: https://eternl.io/
2. **Flint**: https://flint-wallet.com/
3. **Typhon**: https://typhonwallet.io/
4. **Vespr**: https://vesprwallet.com/
5. **NuFi**: https://nu.fi/
6. **Yoroi**: https://yoroi-wallet.com/
7. **Lace**: https://www.lace.io/

### Alternative Sources

- **Cardano Forum Assets**: Check the official Cardano forum for community-provided wallet assets
- **GitHub Repositories**: Many wallets have their logos in their GitHub repos
- **Brand/Press Kits**: Check each wallet's website for a press/media kit

## Usage in Code

Icons are referenced in the `MobileWalletConnect` component:

```typescript
const walletIcons: Record<MobileWalletType, string> = {
  eternl: '/wallet-icons/eternl.png',
  flint: '/wallet-icons/flint.png',
  typhon: '/wallet-icons/typhon.png',
  vespr: '/wallet-icons/vespr.png',
  nufi: '/wallet-icons/nufi.png',
  yoroi: '/wallet-icons/yoroi.png',
  lace: '/wallet-icons/lace.png',
};
```

## Fallback Behavior

If an icon fails to load, the component will gracefully hide the icon and show only the wallet name. This ensures the UI remains functional even without icons.

## Copyright Notice

All wallet logos are trademarks of their respective owners. These icons should only be used for wallet integration purposes in accordance with each wallet's brand guidelines.

## Creating Placeholder Icons

If official icons are not available, you can create simple placeholder icons:

1. Use a solid color square (32x32px)
2. Add the first letter of the wallet name in white
3. Use wallet brand colors if known:
   - Eternl: Blue (#0066FF)
   - Flint: Orange (#FF6B35)
   - Typhon: Purple (#6B4FE8)
   - Vespr: Green (#00D395)
   - NuFi: Blue (#2B6FED)
   - Yoroi: Blue (#1A44B2)
   - Lace: Purple (#7B4FE8)

## Testing

After adding icons, test them by:

1. Opening the app on a mobile device or mobile emulator
2. Navigating to the wallet connection screen
3. Verifying all wallet icons display correctly
4. Checking that fallback behavior works (rename an icon temporarily to test)
