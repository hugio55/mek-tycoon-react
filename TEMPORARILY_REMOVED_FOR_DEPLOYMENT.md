# Temporarily Removed Packages for Vercel Deployment

**Date**: 2025-11-04
**Reason**: Vercel serverless function exceeded 250MB limit
**Status**: TEMPORARY - Can be restored once bundling is optimized

## Packages Removed

### 3D Graphics Libraries (~32 MB)
- **three** (v0.179.1) - 3D visualization library
- **cannon** (v0.6.2) - Physics engine
- **cannon-es** (v0.20.0) - ES6 physics engine

**Impact**:
- `/sphere-selector` page will not work
- `/scrap-yard/block-game` pages will not work
- These are experimental/demo pages, not core functionality

### Cardano Blockchain Integration (~18 MB)
- **@meshsdk/core** (v1.9.0-beta.78)
- **@meshsdk/react** (v1.9.0-beta.78)

**Impact**:
- Custom NFT minting functionality temporarily disabled
- Admin minting pages will error
- Wallet connection features unavailable

**Note**: User confirmed wallet integration is "currently disabled" in codebase, so this is low-risk removal

## Total Reduction
- **478 packages removed**
- **~50 MB** direct package size
- Additional transitive dependencies also removed

## How to Restore

When ready to re-enable these features:

```bash
# Restore 3D libraries
npm install three@^0.179.1 cannon@^0.6.2 cannon-es@^0.20.0

# Restore Cardano wallet integration
npm install @meshsdk/core@^1.9.0-beta.78 @meshsdk/react@^1.9.0-beta.78
```

## Alternative Solutions for Future

1. **Deploy experimental pages separately** - Sphere-selector and block-game in their own Vercel project
2. **Lazy load heavy libraries** - Only load three.js when user visits those specific pages
3. **Switch to lighter alternatives** - Use 2D Canvas instead of three.js for simpler visualizations
4. **Edge functions for heavy routes** - Move blockchain operations to Edge Runtime with external API calls

## Core Functionality Still Working

✅ Gold mining and idle game mechanics
✅ Profile and Mek management
✅ Essence system
✅ Crafting system
✅ Admin panels (except minting)
✅ All UI and navigation
✅ Database operations (Convex)

Only experimental/bonus features are affected.