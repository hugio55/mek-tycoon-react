import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Migration: Merge goldMining data into users table
 *
 * This migration copies all goldMining records into the users table,
 * linking by stake address. The goldMining table is NOT deleted - it
 * remains as a backup.
 *
 * Run this via the Convex dashboard or CLI:
 * npx convex run migrations/mergeGoldMiningToUsers:runMigration
 */

// Query to preview migration - shows what will be migrated
export const previewMigration = query({
  args: {},
  handler: async (ctx) => {
    const goldMiningRecords = await ctx.db.query("goldMining").collect();
    const users = await ctx.db.query("users").collect();

    const results = {
      totalGoldMining: goldMiningRecords.length,
      totalUsers: users.length,
      recordsToMigrate: [] as Array<{
        stakeAddress: string;
        companyName: string | undefined;
        hasMatchingUser: boolean;
        matchedUserId: string | null;
        totalGoldPerHour: number;
        mekCount: number;
      }>,
      usersWithoutGoldMining: [] as Array<{
        walletAddress: string;
        displayName: string | undefined;
      }>,
    };

    // Check each goldMining record
    for (const gm of goldMiningRecords) {
      // Try to find matching user by stake address
      const matchingUser = users.find(
        (u) => u.walletStakeAddress === gm.walletAddress
      );

      results.recordsToMigrate.push({
        stakeAddress: gm.walletAddress,
        companyName: gm.companyName,
        hasMatchingUser: !!matchingUser,
        matchedUserId: matchingUser ? matchingUser._id : null,
        totalGoldPerHour: gm.totalGoldPerHour,
        mekCount: gm.ownedMeks?.length || 0,
      });
    }

    // Find users without goldMining records
    for (const user of users) {
      const hasGoldMining = goldMiningRecords.some(
        (gm) => gm.walletAddress === user.walletStakeAddress
      );
      if (!hasGoldMining) {
        results.usersWithoutGoldMining.push({
          walletAddress: user.walletAddress,
          displayName: user.displayName,
        });
      }
    }

    return results;
  },
});

// The actual migration mutation
export const runMigration = mutation({
  args: {
    dryRun: v.optional(v.boolean()), // If true, don't actually modify data
  },
  handler: async (ctx, args) => {
    const isDryRun = args.dryRun ?? false;
    const goldMiningRecords = await ctx.db.query("goldMining").collect();
    const users = await ctx.db.query("users").collect();

    const log: string[] = [];
    let migratedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;

    log.push(`Starting migration (dryRun: ${isDryRun})`);
    log.push(`Found ${goldMiningRecords.length} goldMining records`);
    log.push(`Found ${users.length} users records`);

    for (const gm of goldMiningRecords) {
      // Try to find existing user by stake address
      let matchingUser = users.find(
        (u) => u.walletStakeAddress === gm.walletAddress
      );

      if (matchingUser) {
        // User exists - update with goldMining data
        log.push(`Updating user ${matchingUser._id} with goldMining data for ${gm.walletAddress.slice(0, 20)}...`);

        if (!isDryRun) {
          await ctx.db.patch(matchingUser._id, {
            // Company identity
            companyName: gm.companyName,

            // Blockchain verification
            isBlockchainVerified: gm.isBlockchainVerified,
            lastVerificationTime: gm.lastVerificationTime,
            consecutiveSnapshotFailures: gm.consecutiveSnapshotFailures,

            // Payment addresses
            paymentAddresses: gm.paymentAddresses,

            // Mek ownership data
            ownedMeks: gm.ownedMeks,

            // Gold accumulation
            totalGoldPerHour: gm.totalGoldPerHour,
            baseGoldPerHourMining: gm.baseGoldPerHour,
            boostGoldPerHour: gm.boostGoldPerHour,
            lastActiveTime: gm.lastActiveTime,
            accumulatedGold: gm.accumulatedGold,
            lastSnapshotTime: gm.lastSnapshotTime,

            // Gold spending
            totalGoldSpentOnUpgrades: gm.totalGoldSpentOnUpgrades,
            totalUpgradesPurchased: gm.totalUpgradesPurchased,
            lastUpgradeSpend: gm.lastUpgradeSpend,

            // Cumulative tracking
            totalCumulativeGold: gm.totalCumulativeGold,

            // Metadata
            snapshotMekCount: gm.snapshotMekCount,
            miningVersion: gm.version,
          });
        }

        migratedCount++;
      } else {
        // No matching user - need to create one
        // First check if we have a payment address to use
        const paymentAddress = gm.paymentAddresses?.[0];

        if (paymentAddress) {
          log.push(`Creating new user for ${gm.walletAddress.slice(0, 20)}... with payment address ${paymentAddress.slice(0, 20)}...`);

          if (!isDryRun) {
            await ctx.db.insert("users", {
              // Wallet fields
              walletAddress: paymentAddress, // Use payment address as primary
              walletStakeAddress: gm.walletAddress, // Keep stake address for reference

              // Company identity
              companyName: gm.companyName,

              // Blockchain verification
              isBlockchainVerified: gm.isBlockchainVerified,
              lastVerificationTime: gm.lastVerificationTime,
              consecutiveSnapshotFailures: gm.consecutiveSnapshotFailures,

              // Payment addresses
              paymentAddresses: gm.paymentAddresses,

              // Mek ownership data
              ownedMeks: gm.ownedMeks,

              // Gold accumulation
              totalGoldPerHour: gm.totalGoldPerHour,
              baseGoldPerHourMining: gm.baseGoldPerHour,
              boostGoldPerHour: gm.boostGoldPerHour,
              lastActiveTime: gm.lastActiveTime,
              accumulatedGold: gm.accumulatedGold,
              lastSnapshotTime: gm.lastSnapshotTime,

              // Gold spending
              totalGoldSpentOnUpgrades: gm.totalGoldSpentOnUpgrades,
              totalUpgradesPurchased: gm.totalUpgradesPurchased,
              lastUpgradeSpend: gm.lastUpgradeSpend,

              // Cumulative tracking
              totalCumulativeGold: gm.totalCumulativeGold,

              // Metadata
              snapshotMekCount: gm.snapshotMekCount,
              miningVersion: gm.version,

              // Required users fields
              gold: 0,
              craftingSlots: 2,
              totalEssence: {
                stone: 0,
                disco: 0,
                paul: 0,
                cartoon: 0,
                candy: 0,
                tiles: 0,
                moss: 0,
                bullish: 0,
                journalist: 0,
                laser: 0,
                flashbulb: 0,
                accordion: 0,
                turret: 0,
                drill: 0,
                security: 0,
              },
              lastLogin: Date.now(),
              createdAt: gm.createdAt,
            });
          }

          createdCount++;
        } else {
          // No payment address available - can't create user record
          log.push(`SKIPPED: ${gm.walletAddress.slice(0, 20)}... - no payment address available`);
          skippedCount++;
        }
      }
    }

    log.push(`---`);
    log.push(`Migration complete!`);
    log.push(`Updated existing users: ${migratedCount}`);
    log.push(`Created new users: ${createdCount}`);
    log.push(`Skipped (no payment address): ${skippedCount}`);

    return {
      success: true,
      isDryRun,
      migratedCount,
      createdCount,
      skippedCount,
      log,
    };
  },
});

// Query to verify migration success
export const verifyMigration = query({
  args: {},
  handler: async (ctx) => {
    const goldMiningRecords = await ctx.db.query("goldMining").collect();
    const users = await ctx.db.query("users").collect();

    const results = {
      totalGoldMining: goldMiningRecords.length,
      totalUsers: users.length,
      usersWithMiningData: 0,
      goldMatchStatus: [] as Array<{
        stakeAddress: string;
        gmGold: number;
        userGold: number;
        match: boolean;
      }>,
    };

    for (const user of users) {
      if (user.ownedMeks && user.ownedMeks.length > 0) {
        results.usersWithMiningData++;
      }

      // Check if this user has a matching goldMining record
      if (user.walletStakeAddress) {
        const gm = goldMiningRecords.find(
          (g) => g.walletAddress === user.walletStakeAddress
        );
        if (gm) {
          const gmGold = gm.totalCumulativeGold || 0;
          const userGold = user.totalCumulativeGold || 0;
          results.goldMatchStatus.push({
            stakeAddress: user.walletStakeAddress.slice(0, 20) + "...",
            gmGold,
            userGold,
            match: Math.abs(gmGold - userGold) < 0.01,
          });
        }
      }
    }

    return results;
  },
});
