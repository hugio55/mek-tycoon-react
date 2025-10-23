# NMKR Integration Backup

**Date:** 2025-10-23
**Branch:** essence-system-worktree (commit: 7d91ea8f)
**Reason:** Archiving NMKR integration before implementing custom minting system

## What's Backed Up

This folder contains all NMKR-related code from the project before switching to a custom Cardano minting implementation.

### Backend Files
- `nmkrApi.ts` - NMKR Studio API integration functions
- `nmkrSync.ts` - NMKR webhook sync handlers

### Frontend Components
- `MintNFTLightbox.tsx` - User-facing minting lightbox (NMKR-based)
- `MintNFTLightboxVariationSelector.tsx` - Variation selection UI
- `NftPurchasePlanner.tsx` - Purchase planning interface
- `admin-nft-components/` - Admin tools for NFT event management
  - `EventManager.tsx` - Event creation and management
  - `VariationEditor.tsx` - Easy/Medium/Hard variation editor
  - `PurchaseDashboard.tsx` - Purchase tracking
  - `RevenueAnalytics.tsx` - Revenue analytics
  - `SimpleNFTMinter.tsx` - Simple minting interface

### Documentation
- `NFT_MINTING_SYSTEM.md` - Original NMKR-based system documentation
- `NFT_ADMIN_IMPLEMENTATION_PLAN.md` - Admin implementation plan

## How to Restore

If custom minting doesn't work out and you need to go back to NMKR:

### Option 1: Git Branch (Recommended)
```bash
# Switch back to NMKR branch
git checkout essence-system-worktree

# Or merge NMKR code back to current branch
git checkout custom-minting-system
git merge essence-system-worktree
```

### Option 2: Manual File Restore
```bash
# Copy files back from archive
cp ARCHIVED/nmkr-integration-backup-2025-10-23/nmkrApi.ts convex/
cp ARCHIVED/nmkr-integration-backup-2025-10-23/nmkrSync.ts convex/
cp ARCHIVED/nmkr-integration-backup-2025-10-23/MintNFTLightbox.tsx src/components/
# ... etc for other files
```

## What Changed After This Backup

After this backup was created, the project switched to:
- Custom Cardano minting using MeshSDK
- Direct Blockfrost API integration
- On-demand minting (no pre-minting costs)
- Multiple policy ID support for different collections
- See `CUSTOM_MINTING_SYSTEM.md` for details

## Database Schema

The database schema in Convex (`nftEvents`, `nftVariations`, `nftPurchases`) was designed to work with BOTH systems, so it should remain compatible. The main difference is:
- **NMKR version**: Uses `nmkrProjectId` and `nmkrAssetId` fields
- **Custom version**: Uses policy IDs and asset names directly

## Cost Comparison

**NMKR (this backup):**
- ~2-3 ADA per mint in NMKR fees
- Total: ~4.5 ADA per mint

**Custom (new system):**
- ~1.7-2.2 ADA per mint (just blockchain fees)
- Savings: ~2.5-3 ADA per mint

## Notes

- This backup preserves the working NMKR integration as of October 23, 2025
- All files are from the `essence-system-worktree` branch
- Git commit: 7d91ea8f
- Custom minting work is on the `custom-minting-system` branch

---

**Keep this folder intact** - it's your safety net if custom minting has issues.
