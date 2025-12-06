import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import { devLog } from "./lib/devLog";

/**
 * ADMIN-ONLY SYNC FIX
 *
 * Bypasses authentication requirement to fix desynced wallets.
 * Only use for administrative purposes.
 */

export const adminForceResync = action({
  args: {
    stakeAddress: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; message: string; mekCount?: number; error?: string }> => {
    devLog.log(`[Admin] Force re-syncing wallet: ${args.stakeAddress}`);

    try {
      // STEP 1: Fetch from blockchain (no auth required)
      const nftResult: any = await ctx.runAction(api.blockfrostNftFetcher.fetchNFTsByStakeAddress, {
        stakeAddress: args.stakeAddress,
        useCache: false,
      });

      if (!nftResult.success || !nftResult.meks) {
        throw new Error(`Blockchain fetch failed: ${nftResult.error || "No Meks found"}`);
      }

      devLog.log(`[Admin] Fetched ${nftResult.meks.length} Meks from blockchain`);

      // STEP 2: Enrich Mek data
      const { getMekDataByNumber, getMekImageUrl } = await import("../src/lib/mekNumberToVariation");

      const enrichedMeks: any[] = [];
      for (const mek of nftResult.meks) {
        const mekData = getMekDataByNumber(mek.mekNumber);

        if (!mekData) {
          devLog.warn(`[Admin] No data for Mek #${mek.mekNumber}, using fallback`);
          enrichedMeks.push({
            assetId: mek.assetId,
            policyId: mek.policyId,
            assetName: mek.assetName,
            mekNumber: mek.mekNumber,
            imageUrl: getMekImageUrl(mek.mekNumber),
            goldPerHour: 10,
            rarityRank: 2000,
            headVariation: "Unknown",
            bodyVariation: "Unknown",
            itemVariation: "Unknown",
            sourceKey: `UNKNOWN-${mek.mekNumber}`,
          });
        } else {
          enrichedMeks.push({
            assetId: mek.assetId,
            policyId: mek.policyId,
            assetName: mek.assetName,
            mekNumber: mek.mekNumber,
            imageUrl: getMekImageUrl(mek.mekNumber),
            goldPerHour: Math.round(mekData.goldPerHour * 100) / 100,
            rarityRank: mekData.finalRank,
            headVariation: mekData.headGroup,
            bodyVariation: mekData.bodyGroup,
            itemVariation: mekData.itemGroup,
            sourceKey: mekData.sourceKey,
          });
        }
      }

      // STEP 3: Fetch level boosts
      const mekLevels: Doc<"mekLevels">[] = await ctx.runQuery(api.mekLeveling.getMekLevels, {
        walletAddress: args.stakeAddress,
      });

      const levelMap = new Map(mekLevels.map((level: Doc<"mekLevels">) => [level.assetId, level]));

      const meksWithLevelBoosts: any[] = enrichedMeks.map((m: any) => {
        const levelData = levelMap.get(m.assetId);
        const currentLevel = levelData?.currentLevel || 1;
        const boostPercent = levelData?.currentBoostPercent || 0;
        const boostAmount = levelData?.currentBoostAmount || 0;
        const effectiveRate = m.goldPerHour + boostAmount;

        return {
          ...m,
          baseGoldPerHour: m.goldPerHour,
          currentLevel,
          levelBoostPercent: boostPercent,
          levelBoostAmount: boostAmount,
          effectiveGoldPerHour: effectiveRate,
          goldPerHour: effectiveRate,
        };
      });

      // STEP 4: Get existing wallet data to preserve walletType
      const existingWallet = await ctx.runQuery(api.goldMining.getGoldMiningData, {
        walletAddress: args.stakeAddress,
      });

      const preservedWalletType = existingWallet?.walletType || "unknown";

      // STEP 5: Update database (bypass authentication, preserve walletType)
      const meksForMutation = meksWithLevelBoosts.map((m: any) => ({
        assetId: m.assetId,
        policyId: m.policyId,
        assetName: m.assetName,
        imageUrl: m.imageUrl,
        goldPerHour: m.goldPerHour,
        rarityRank: m.rarityRank,
        headVariation: m.headVariation,
        bodyVariation: m.bodyVariation,
        itemVariation: m.itemVariation,
        baseGoldPerHour: m.baseGoldPerHour,
        currentLevel: m.currentLevel,
        levelBoostPercent: m.levelBoostPercent,
        levelBoostAmount: m.levelBoostAmount,
        effectiveGoldPerHour: m.effectiveGoldPerHour,
      }));

      // FIXED: Actions CAN call mutations directly via ctx.runMutation
      await ctx.runMutation(api.goldMining.initializeGoldMining, {
        walletAddress: args.stakeAddress,
        walletType: preservedWalletType,
        ownedMeks: meksForMutation,
      });

      devLog.log(`[Admin] Successfully synced ${meksForMutation.length} Meks`);

      // STEP 6: Update checksum
      // FIXED: Actions CAN call mutations directly via ctx.runMutation
      await ctx.runMutation(api.syncChecksums.updateChecksum, {
        walletAddress: args.stakeAddress,
        meks: meksForMutation,
        source: "blockchain",
      });

      return {
        success: true,
        message: `Successfully synced ${meksForMutation.length} Meks from blockchain`,
        mekCount: meksForMutation.length,
      };

    } catch (error: any) {
      devLog.errorAlways(`[Admin] Force resync failed: ${error.message}`);
      return {
        success: false,
        message: `Failed to sync wallet: ${error.message}`,
        error: error.message,
      };
    }
  },
});
