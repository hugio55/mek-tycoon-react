import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

const LEADERBOARD_SIZE = 100; // Top N miners to cache
const SIGNIFICANT_CHANGE_THRESHOLD = 100; // Only update if gold changed by at least this amount

// Pre-compute gold leaderboard rankings every 15 minutes
export const updateGoldLeaderboard = internalMutation({
  args: {},
  handler: async (ctx) => {
    try {
      const now = Date.now();

      // Get all gold miners with their current gold calculations
      const miners = await ctx.db.query("goldMining").collect();

      if (miners.length === 0) {
        console.log("No miners found for leaderboard update");
        return { success: true, entriesUpdated: 0, timestamp: now };
      }

      // Calculate current gold for each miner (same logic as goldLeaderboard.ts)
      const minersWithCurrentGold = miners.map(miner => {
        const lastCheckpoint = miner.lastSnapshotTime || miner.lastActiveTime || miner.createdAt || now;
        const timeDiff = Math.max(0, now - lastCheckpoint);
        const hoursElapsed = timeDiff / (1000 * 60 * 60);

        // Only accumulate if blockchain verified
        const goldEarnedSinceLastUpdate = miner.isBlockchainVerified ?
          (miner.totalGoldPerHour || 0) * hoursElapsed : 0;

        // Start with stored cumulative gold, or estimate from accumulated + spent
        let baseCumulativeGold = miner.totalCumulativeGold ?? 0;
        if (miner.totalCumulativeGold === undefined || miner.totalCumulativeGold === null) {
          baseCumulativeGold = (miner.accumulatedGold || 0) + (miner.totalGoldSpentOnUpgrades || 0);
        }

        // IMPORTANT: Always show at least the base cumulative gold, even if not verified
        const currentGold = baseCumulativeGold + (miner.isBlockchainVerified ? goldEarnedSinceLastUpdate : 0);

        return {
          walletAddress: miner.walletAddress,
          companyName: miner.companyName,
          currentGold: Math.floor(currentGold),
          hourlyRate: miner.totalGoldPerHour || 0,
          mekCount: miner.ownedMeks?.length || 0,
          lastActive: miner.lastActiveTime || miner.lastLogin,
        };
      });

      // Sort by current gold (highest first)
      const sortedMiners = minersWithCurrentGold.sort((a, b) => b.currentGold - a.currentGold);

      // Only keep top N miners
      const topMiners = sortedMiners.slice(0, LEADERBOARD_SIZE);

      // Use upsert pattern: update existing entries, insert new ones
      let updatedCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < topMiners.length; i++) {
        const miner = topMiners[i];
        const rank = i + 1;

        // Find existing cache entry for this rank
        const existingEntry = await ctx.db
          .query("leaderboardCache")
          .withIndex("by_category_rank", q =>
            q.eq("category", "gold").eq("rank", rank)
          )
          .first();

        const entryData = {
          walletAddress: miner.walletAddress,
          username: miner.companyName,
          value: miner.currentGold,
          lastUpdated: now,
          metadata: {
            goldPerHour: miner.hourlyRate,
            mekDetails: {
              total: miner.mekCount,
              legendary: 0,
              epic: 0,
              rare: 0,
              uncommon: 0,
              common: 0,
            },
          },
        };

        if (existingEntry) {
          // Skip update if value hasn't changed significantly and wallet is the same
          const goldChanged = Math.abs(existingEntry.value - miner.currentGold) >= SIGNIFICANT_CHANGE_THRESHOLD;
          const walletChanged = existingEntry.walletAddress !== miner.walletAddress;

          if (goldChanged || walletChanged) {
            // Update existing entry
            await ctx.db.patch(existingEntry._id, entryData);
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          // Insert new entry
          await ctx.db.insert("leaderboardCache", {
            category: "gold",
            userId: undefined,
            rank,
            ...entryData,
          });
          updatedCount++;
        }
      }

      // Clean up entries beyond the top N (if leaderboard shrinks)
      const allGoldEntries = await ctx.db
        .query("leaderboardCache")
        .withIndex("by_category_rank", q => q.eq("category", "gold"))
        .collect();

      const entriesToDelete = allGoldEntries.filter(entry => entry.rank > LEADERBOARD_SIZE);
      for (const entry of entriesToDelete) {
        await ctx.db.delete(entry._id);
      }

      console.log(`Leaderboard updated: ${updatedCount} entries updated, ${skippedCount} skipped (no significant change) at ${new Date(now).toISOString()}`);

      return {
        success: true,
        entriesUpdated: updatedCount,
        entriesSkipped: skippedCount,
        totalEntries: topMiners.length,
        timestamp: now,
      };
    } catch (error) {
      console.error("Leaderboard update failed:", error);

      // LOG: Leaderboard update failure
      await ctx.scheduler.runAfter(0, internal.monitoring.logEvent, {
        eventType: "error",
        category: "leaderboard",
        message: "Leaderboard update failed",
        severity: "high",
        functionName: "updateGoldLeaderboard",
        details: { error: String(error) },
      });

      return {
        success: false,
        error: String(error),
        timestamp: Date.now(),
      };
    }
  },
});
