# Deleted Files Audit Trail

**Purpose**: Track all file deletions to enable quick recovery if issues arise.

**Recovery Instructions**: To restore a deleted file, use:
```bash
git checkout <commit-hash>^ -- <file-path>
```
The `^` means "parent of this commit" (before deletion).

---

## 2025-12-09: Phase I Legacy Gold Mining Cleanup

**Commit**: (pending commit)
**Total Deleted**: 6 files
**Reason**: Phase II architecture no longer uses passive gold income (goldPerHour). Job slots with daily income replace the old mek-ownership-based passive gold system.

### Backend Legacy Files (4 files)

**Phase I Wallet Fix Utilities (Obsolete):**
- `convex/adminSyncFix.ts` - Admin wallet resync using legacy goldMining system
- `convex/definitiveWalletFix.ts` - Wallet consolidation for goldMining duplicates
- `convex/finalWalletFix.ts` - Another wallet consolidation utility
- `convex/listAllGoldMiningAccounts.ts` - Debug query for goldMining table

### Frontend Broken Pages (2 files)

**Referenced Non-Existent Backend Functions:**
- `src/app/admin-sync-health/page.tsx` - Referenced deleted `api.syncChecksums.*`
- `src/components/WalletSnapshotDebug.tsx` - Referenced multiple deleted files (`fixWalletDuplicates`, `debugWalletSnapshot`, `goldMiningSnapshot`, `fixGoldRateCalculation`, `comprehensiveWalletFix`)

### Phase I Files Kept For Now (Flagged for Phase II Update)

**Still Used by Admin Tools:**
- `convex/fixCorruptedGold.ts` - Used by WalletManagementAdmin (will update for Phase II)
- `convex/mekGoldRates.ts` - Gold rate configuration (separate from `mekGoldRates.json` data file)
- `convex/goldMining.ts` - Core file being refactored, not deleted

**Note**: The `mekGoldRates.json` data file is **NOT** deleted - it contains all 4000 mek variation data used by `mekNumberToVariation.ts`.

**Recovery Command**:
```bash
# Restore any file from this cleanup
git checkout HEAD^ -- <file-path>

# Example: Restore adminSyncFix.ts
git checkout HEAD^ -- convex/adminSyncFix.ts
```

---

## 2025-10-29: Diagnostic & Test Page Cleanup

**Commit**: `34991a53` (Remove unused diagnostic files and test pages)
**Total Deleted**: 30 files, 5,004 lines
**Verified**: No active imports, only referenced in auto-generated files

### Backend Diagnostic Files (11 files)

**Orphaned - No References Anywhere:**
- `convex/diagnosticDiscordConnections.ts` (25 lines) - Discord connection debugging
- `convex/diagnosticDiscordData.ts` (106 lines) - Discord data analysis
- `convex/diagnosticEssenceSlots.ts` (71 lines) - Essence slot debugging
- `convex/diagnosticEssenceStorage.ts` (102 lines) - Essence storage debugging
- `convex/diagnosticEssenceWallets.ts` (37 lines) - Wallet-specific essence debugging
- `convex/diagnosticMySlots.ts` (34 lines) - Personal slot debugging
- `convex/diagnosticSlottedMeks.ts` (28 lines) - Mek slotting debugging
- `convex/diagnosticWalletCheck.ts` (43 lines) - Wallet validation debugging
- `convex/diagnosticWalletHistory.ts` (98 lines) - Wallet history analysis

**Test-Only - Only Used By Deleted Test Pages:**
- `convex/diagnosticSpritePositions.ts` (81 lines) - Used by diagnostic-sprites page
- `convex/diagnosticTriangleCoords.ts` (83 lines) - Used by diagnostic-coords page

### Frontend Test Pages (17 files)

**Diagnostic Pages:**
- `src/app/diagnostic-coords/page.tsx` (100 lines) - Triangle coordinate analysis
- `src/app/diagnostic-sprites/page.tsx` (115 lines) - Sprite positioning analysis

**Test Pages:**
- `src/app/animation-test/page.tsx` (170 lines) - Animation testing
- `src/app/browserstack-test/page.tsx` (237 lines) - BrowserStack compatibility
- `src/app/font-test/page.tsx` (56 lines) - Font rendering tests
- `src/app/nav-test/page.tsx` (525 lines) - Navigation testing
- `src/app/nav-test-slim/page.tsx` (320 lines) - Slim navigation variant
- `src/app/nft-claim-test/page.tsx` (176 lines) - NFT claim functionality test
- `src/app/simple-test/page.tsx` (81 lines) - Basic testing page
- `src/app/test-combined-success/page.tsx` (528 lines) - Success state testing
- `src/app/test-combined-success-fixed.tsx` (383 lines) - Fixed success test
- `src/app/test-gold-debug/page.tsx` (116 lines) - Gold calculation debugging
- `src/app/test-mobile/page.tsx` (data not in stats) - Mobile testing
- `src/app/test-success-bar/page.tsx` (385 lines) - Success bar UI testing

**Demo Pages:**
- `src/app/mek-card-demo/page.tsx` (242 lines) - Mek card display demo
- `src/app/mission-control-demo/page.tsx` (347 lines) - Mission control UI demo
- `src/app/story-title-demo/page.tsx` (141 lines) - Story title styling demo
- `src/app/toast-demo/page.tsx` (data not in stats) - Toast notification demo

**Recovery Command**:
```bash
# Restore specific file
git checkout 34991a53^ -- <file-path>

# Example: Restore diagnostic sprites page
git checkout 34991a53^ -- src/app/diagnostic-sprites/page.tsx
```

**Active Diagnostic Tools Kept** (still in use):
- `diagnosticCorruptedGold.ts` - Gold Repair Tool
- `diagnosticMekBoosts.ts` - Boost Sync viewer
- `diagnosticBlockfrostUsage.ts` - API monitoring
- `diagnosticRequestAnalysis.ts` - Performance monitoring
- `diagnosticSourceKeys.ts` - Migration tools
- `diagnosticAllEssenceWallets.ts` - Admin duplicates page
- `diagnosticNothingDuplicates.ts` - Admin duplicates page

---

## 2025-10-29: Demo Page Removal

**Commit**: `f8ed027d` (Remove essence-market-demo page)
**Total Deleted**: 1 file, 224 lines
**Reason**: UI comparison tool only accessible via direct URL, no longer needed

### Files Deleted

- `src/app/essence-market-demo/page.tsx` (224 lines) - Essence listing lightbox style comparison demo
  - Showed 5 different UI versions (V1-V5)
  - Not linked in navigation
  - Development-only tool

**Recovery Command**:
```bash
git checkout f8ed027d^ -- src/app/essence-market-demo/page.tsx
```

---

## 2025-10-29: Dead Code Cleanup - Typography, Verification & Component Variants

**Commit**: `08c27c54` (Remove 35 dead code files and consolidate typography to UI showcase)
**Total Deleted**: 35 files
**Verified**: No active imports, verified via grep analysis and /ultra agent analysis

### Typography Pages (1 file)

- `src/app/typography-showcase/page.tsx` (387 lines) - Font showcase page
  - All content transferred to UI showcase Fonts tab before deletion
  - Showed 14 fonts with contextual examples, effects, and comparison table

### Admin NFT Tools (2 files)

**Orphaned - No admin page imports:**
- `src/components/admin/nft/ArtUploadManager.tsx` - NFT artwork upload interface
- `src/components/admin/nft/SimpleNFTMinter.tsx` - CIP-25 NFT minting tool

### Blockchain Verification Variants (6 files)

**Unused Variants - Original blockchainVerification.ts still active:**
- `convex/blockchainVerificationRefactored.ts` - Refactored version with service layer (never deployed)
- `convex/lib/verificationService.ts` - Service layer for refactored version
- `src/components/BlockchainVerificationPanel_mobile.tsx` - Mobile-specific variant (desktop version already mobile-optimized)

**Unused Wallet Connection Variants:**
- `src/components/MobileWalletConnect.tsx` - Mobile wallet connection component
- `src/components/SecureWalletConnectButton.tsx` - Security-hardened wallet connection
- `src/components/WalletSelector.tsx` - Multi-wallet selector UI

### Debug Functions (10 files)

**Orphaned - No imports found:**
- `convex/debugGold.ts` - Gold data debugging
- `convex/debugWalletData.ts` - Wallet data debugging
- `convex/debugDiscordConnection.ts` - Discord connection debugging
- `convex/debugAllConnections.ts` - All connections debugging
- `convex/debugGoldInvariants.ts` - Gold invariant checks
- `convex/debugGoldDisplay.ts` - Gold display debugging
- `convex/debugMekLevels.ts` - Mek level debugging
- `convex/debugLeaderboardCache.ts` - Leaderboard cache debugging
- `convex/debugLeaderboard.ts` - Leaderboard debugging
- `convex/debugSnapshotData.ts` - Snapshot data debugging

**Active Debug Tools Kept:**
- `debugWalletSnapshot.ts` - Used by WalletSnapshotDebug component

### Migration Scripts (4 files)

**Orphaned - No imports found:**
- `convex/migrateBuffCategories.ts` - Buff category migration
- `convex/migrateMultiWallet.ts` - Multi-wallet migration
- `convex/migrateUnlockSlot1.ts` - Slot unlock migration
- `convex/migrateVariationIds.ts` - Variation ID migration

**Active Migration Tools Kept:**
- `migrateSourceKeys.ts` - Used by SourceKeyMigrationAdmin component

### Old Component Design Versions (10 files)

**EssenceListingLightbox Variants (4 files):**
- `src/components/EssenceListingLightbox-V1-Clean.tsx` - Clean design variant
- `src/components/EssenceListingLightbox-V2-Industrial.tsx` - Industrial design variant
- `src/components/EssenceListingLightbox-V3-Tactical.tsx` - Tactical design variant
- `src/components/EssenceListingLightbox-V4-TacticalYellow.tsx` - Tactical yellow variant

**Active Version Kept:**
- `EssenceListingLightbox-V6-FullMarketMatch.tsx` - Current production version

**MekChapterDistribution Variants (6 files):**
- `src/components/MekChapterDistribution.tsx` - Original version
- `src/components/MekChapterDistributionProper.tsx` - "Proper" variant
- `src/components/MekChapterDistributionActual.tsx` - "Actual" variant
- `src/components/MekChapterDistributionRealistic.tsx` - "Realistic" variant
- `src/components/MekChapterDistributionV2.tsx` - Version 2
- `src/components/MekChapterDistributionV3.tsx` - Version 3

All variants unused - no imports found in any pages.

### Test/Demo Pages (2 files)

- `src/app/nmkr-test/page.tsx` - NMKR integration test page
- `src/app/contracts/button-demo/page.tsx` - Active contracts button hover effects demo (5 variations)

**Recovery Command**:
```bash
# Restore any file from this cleanup session
git checkout 08c27c54^ -- <file-path>

# Example: Restore typography showcase
git checkout 08c27c54^ -- src/app/typography-showcase/page.tsx

# Example: Restore verification refactored version
git checkout 08c27c54^ -- convex/blockchainVerificationRefactored.ts

# Example: Restore all MekChapterDistribution variants
git checkout 08c27c54^ -- src/components/MekChapterDistribution*.tsx
```

---

## Recovery Quick Reference

### Restore Single File
```bash
git checkout <commit>^ -- <file-path>
```

### Restore Multiple Files from Same Commit
```bash
git checkout 34991a53^ -- convex/diagnosticMySlots.ts src/app/test-mobile/page.tsx
```

### View Deleted File Contents (without restoring)
```bash
git show <commit>^:<file-path>
```

### List All Deleted Files from a Commit
```bash
git diff-tree --no-commit-id --name-only -r --diff-filter=D <commit>
```

---

## Notes

- All deletions were verified safe through comprehensive analysis
- Orphaned files had zero imports/references across entire codebase
- Test pages had no navigation links and were unreachable except by direct URL
- Convex API regenerated automatically after backend deletions
- Dev server continued running normally after all deletions

---

*Last Updated: 2025-12-09*
