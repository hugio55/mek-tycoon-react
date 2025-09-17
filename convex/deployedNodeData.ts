import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import mekRarityMaster from "./mekRarityMaster.json";

// Deploy event node configuration to Story Climb
export const deployEventNodes = mutation({
  args: {
    configurationId: v.optional(v.id("eventNodeConfigs")),
    configurationName: v.optional(v.string()),
    eventData: v.string(), // JSON string of EventNode[] from EventNodeEditor
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject || "anonymous";

    try {
      // Parse the event data
      const events = JSON.parse(args.eventData);

      // Validate the data structure
      if (!Array.isArray(events) || events.length === 0) {
        throw new Error("Invalid event data: must be a non-empty array");
      }

      // Enhance event data - chip rewards will be calculated client-side
      const enhancedEvents = events.map((event: any) => {
        return {
          eventNumber: event.eventNumber,
          name: event.name || `Event ${event.eventNumber}`,
          goldReward: event.goldReward || 0,
          xpReward: event.xpReward || 0,
          chipRewards: event.chipRewards || [], // Will be calculated client-side
          essenceRewards: event.essenceRewards || [],
          customRewards: event.customRewards || [],
          imageReference: `/event-images/${event.eventNumber}.webp`,
        };
      });

      // Archive any currently active deployments
      const activeDeployments = await ctx.db
        .query("deployedStoryClimbData")
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      for (const deployment of activeDeployments) {
        await ctx.db.patch(deployment._id, { status: "archived" });
      }

      // Generate deployment ID
      const deploymentId = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get the next version number
      const allDeployments = await ctx.db
        .query("deployedStoryClimbData")
        .order("desc")
        .take(1);

      const latestVersion = allDeployments.length > 0 ? (allDeployments[0].version || 0) : 0;
      const newVersion = latestVersion + 1;

      // Create new deployment
      const deploymentRecord = await ctx.db.insert("deployedStoryClimbData", {
        deploymentId,
        deployedAt: Date.now(),
        deployedBy: userId,
        version: newVersion,
        status: "active",
        eventNodes: JSON.stringify(enhancedEvents),
        configurationName: args.configurationName,
        configurationId: args.configurationId,
        notes: args.notes,
      });

      return {
        success: true,
        deploymentId,
        version: newVersion,
        eventCount: enhancedEvents.length,
        message: `Successfully deployed ${enhancedEvents.length} event nodes (Version ${newVersion})`,
      };
    } catch (error) {
      console.error("Deployment error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

// Get the currently active deployment
export const getActiveDeployment = query({
  args: {},
  handler: async (ctx) => {
    const activeDeployment = await ctx.db
      .query("deployedStoryClimbData")
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!activeDeployment) {
      return null;
    }

    // Parse the JSON data
    try {
      return {
        deploymentId: activeDeployment.deploymentId,
        deployedAt: activeDeployment.deployedAt,
        deployedBy: activeDeployment.deployedBy,
        version: activeDeployment.version,
        status: activeDeployment.status,
        eventNodes: JSON.parse(activeDeployment.eventNodes),
        normalNodes: activeDeployment.normalNodes ? JSON.parse(activeDeployment.normalNodes) : null,
        challengerNodes: activeDeployment.challengerNodes ? JSON.parse(activeDeployment.challengerNodes) : null,
        miniBossNodes: activeDeployment.miniBossNodes ? JSON.parse(activeDeployment.miniBossNodes) : null,
        finalBossNodes: activeDeployment.finalBossNodes ? JSON.parse(activeDeployment.finalBossNodes) : null,
        configurationName: activeDeployment.configurationName,
        notes: activeDeployment.notes,
      };
    } catch (error) {
      console.error("Error parsing deployment data:", error);
      return null;
    }
  },
});

// Get deployment history
export const getDeploymentHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const deployments = await ctx.db
      .query("deployedStoryClimbData")
      .order("desc")
      .take(limit);

    return deployments.map(d => ({
      _id: d._id,
      deploymentId: d.deploymentId,
      deployedAt: d.deployedAt,
      deployedBy: d.deployedBy,
      version: d.version,
      status: d.status,
      configurationName: d.configurationName,
      eventCount: JSON.parse(d.eventNodes).length,
    }));
  },
});

// Rollback to a previous deployment
export const rollbackDeployment = mutation({
  args: {
    deploymentId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject || "anonymous";

    try {
      // Find the deployment to rollback to
      const targetDeployment = await ctx.db
        .query("deployedStoryClimbData")
        .filter((q) => q.eq(q.field("deploymentId"), args.deploymentId))
        .first();

      if (!targetDeployment) {
        throw new Error("Deployment not found");
      }

      // Archive current active deployment
      const activeDeployments = await ctx.db
        .query("deployedStoryClimbData")
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      for (const deployment of activeDeployments) {
        await ctx.db.patch(deployment._id, { status: "archived" });
      }

      // Create a new deployment as a copy of the target
      const newDeploymentId = `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const allDeployments = await ctx.db
        .query("deployedStoryClimbData")
        .order("desc")
        .take(1);

      const latestVersion = allDeployments.length > 0 ? (allDeployments[0].version || 0) : 0;
      const newVersion = latestVersion + 1;

      await ctx.db.insert("deployedStoryClimbData", {
        deploymentId: newDeploymentId,
        deployedAt: Date.now(),
        deployedBy: userId,
        version: newVersion,
        status: "active",
        eventNodes: targetDeployment.eventNodes,
        normalNodes: targetDeployment.normalNodes,
        challengerNodes: targetDeployment.challengerNodes,
        miniBossNodes: targetDeployment.miniBossNodes,
        finalBossNodes: targetDeployment.finalBossNodes,
        configurationName: targetDeployment.configurationName,
        configurationId: targetDeployment.configurationId,
        notes: `Rollback to version ${targetDeployment.version} (${targetDeployment.deploymentId})`,
      });

      return {
        success: true,
        message: `Successfully rolled back to version ${targetDeployment.version}`,
        newDeploymentId,
        newVersion,
      };
    } catch (error) {
      console.error("Rollback error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

// Deploy all mekanisms to all 10 chapters at once
export const deployAllMekanisms = mutation({
  args: {
    normalNodeConfig: v.optional(v.string()), // JSON string with gold/xp/essence configs
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject || "anonymous";

    try {
      // Use the imported mekRarityMaster data
      const meks = mekRarityMaster as any[];

      // Chapter configurations
      const chapterConfigs = [
        { chapter: 1, normalMekRange: [3651, 4000], challengerRange: [461, 500], miniBossRange: [92, 100], finalBossRank: 10 },
        { chapter: 2, normalMekRange: [3301, 3650], challengerRange: [421, 460], miniBossRange: [83, 91], finalBossRank: 9 },
        { chapter: 3, normalMekRange: [2951, 3300], challengerRange: [381, 420], miniBossRange: [74, 82], finalBossRank: 8 },
        { chapter: 4, normalMekRange: [2601, 2950], challengerRange: [341, 380], miniBossRange: [65, 73], finalBossRank: 7 },
        { chapter: 5, normalMekRange: [2251, 2600], challengerRange: [301, 340], miniBossRange: [56, 64], finalBossRank: 6 },
        { chapter: 6, normalMekRange: [1901, 2250], challengerRange: [261, 300], miniBossRange: [47, 55], finalBossRank: 5 },
        { chapter: 7, normalMekRange: [1551, 1900], challengerRange: [221, 260], miniBossRange: [38, 46], finalBossRank: 4 },
        { chapter: 8, normalMekRange: [1201, 1550], challengerRange: [181, 220], miniBossRange: [29, 37], finalBossRank: 3 },
        { chapter: 9, normalMekRange: [851, 1200], challengerRange: [141, 180], miniBossRange: [20, 28], finalBossRank: 2 },
        { chapter: 10, normalMekRange: [501, 850], challengerRange: [101, 140], miniBossRange: [11, 19], finalBossRank: 1 },
      ];

      // Parse config if provided
      let config = {
        goldRange: { min: 100, max: 10000 },
        goldCurve: 0,
        xpRange: { min: 10, max: 1000 },
        xpCurve: 0,
        essenceRange: { min: 1, max: 5 },
        essenceCurve: 0,
      };

      if (args.normalNodeConfig) {
        config = JSON.parse(args.normalNodeConfig);
      }

      // Calculate rewards based on rank (rank 1 = highest rewards, rank 4000 = lowest)
      const calculateReward = (rank: number, min: number, max: number, curve: number): number => {
        // Normalize rank (1-4000) to 0-1, where rank 1 = 1 and rank 4000 = 0
        const normalizedRank = 1 - ((rank - 1) / (4000 - 1));
        let curvedValue = normalizedRank;
        if (curve !== 0) {
          const factor = Math.abs(curve) * 2;
          if (curve > 0) {
            curvedValue = Math.pow(normalizedRank, 1 / (1 + factor));
          } else {
            curvedValue = Math.pow(normalizedRank, 1 + factor);
          }
        }
        return Math.round(min + (max - min) * curvedValue);
      };

      // Seeded random number generator for consistent but varied distribution
      const seededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };

      // Distribution algorithm for normal meks
      const distributeNormalMeks = (mekPool: any[], chapter: number, count: number) => {
        const distributed: any[] = [];
        const poolCopy = [...mekPool];

        for (let i = 0; i < count && poolCopy.length > 0; i++) {
          const position = i / count; // 0 to 1 (bottom to top)

          // Base weight favors rarer meks towards the top
          let baseWeight = position * 0.4 + 0.3;

          // Add anomalies (30% chance)
          const anomalySeed = chapter * 1000 + i;
          if (seededRandom(anomalySeed) < 0.3) {
            const anomalyType = seededRandom(anomalySeed * 2);
            if (anomalyType < 0.33) {
              // Spike: Very rare at unexpected position
              baseWeight = 0.9;
            } else if (anomalyType < 0.66) {
              // Valley: Common cluster at high position
              baseWeight = 0.1;
            } else {
              // Chaos: Pure random
              baseWeight = seededRandom(anomalySeed * 3);
            }
          }

          // Apply smooth curve
          baseWeight = Math.pow(baseWeight, 0.7); // Gentle curve

          // Select mek based on weight (higher weight = lower rank number = rarer)
          const targetIndex = Math.floor((1 - baseWeight) * poolCopy.length);
          const selectedIndex = Math.max(0, Math.min(poolCopy.length - 1, targetIndex));

          // Add some randomness to avoid patterns
          const randomOffset = Math.floor((seededRandom(anomalySeed * 4) - 0.5) * Math.min(10, poolCopy.length * 0.1));
          const finalIndex = Math.max(0, Math.min(poolCopy.length - 1, selectedIndex + randomOffset));

          const selectedMek = poolCopy.splice(finalIndex, 1)[0];
          distributed.push(selectedMek);
        }

        return distributed;
      };

      // Build all node data
      const allNormalNodes: any[] = [];
      const allChallengerNodes: any[] = [];
      const allMiniBossNodes: any[] = [];
      const allFinalBossNodes: any[] = [];

      chapterConfigs.forEach(chapter => {
        // Normal Meks (350 per chapter) - use distribution algorithm
        const normalMekPool = meks.filter(m =>
          m.rank >= chapter.normalMekRange[0] &&
          m.rank <= chapter.normalMekRange[1]
        ).sort((a, b) => b.rank - a.rank); // Sort by rank descending (rarest first)

        const distributedNormalMeks = distributeNormalMeks(normalMekPool, chapter.chapter, 350);

        distributedNormalMeks.forEach((mek, index) => {
          allNormalNodes.push({
            chapter: chapter.chapter,
            nodeIndex: index,
            rank: mek.rank,
            assetId: mek.assetId,
            sourceKey: mek.sourceKey,
            head: mek.head,
            body: mek.body,
            trait: mek.trait,
            goldReward: calculateReward(mek.rank, config.goldRange.min, config.goldRange.max, config.goldCurve),
            xpReward: calculateReward(mek.rank, config.xpRange.min, config.xpRange.max, config.xpCurve),
            essenceReward: calculateReward(mek.rank, config.essenceRange.min, config.essenceRange.max, config.essenceCurve),
          });
        });

        // Challengers (40 per chapter) - shuffle for variety
        const challengerMekPool = meks.filter(m =>
          m.rank >= chapter.challengerRange[0] &&
          m.rank <= chapter.challengerRange[1]
        );

        // Shuffle challengers using seeded random
        const shuffledChallengers = [...challengerMekPool];
        for (let i = shuffledChallengers.length - 1; i > 0; i--) {
          const j = Math.floor(seededRandom(chapter.chapter * 2000 + i) * (i + 1));
          [shuffledChallengers[i], shuffledChallengers[j]] = [shuffledChallengers[j], shuffledChallengers[i]];
        }

        shuffledChallengers.slice(0, 40).forEach((mek, index) => {
          allChallengerNodes.push({
            chapter: chapter.chapter,
            nodeIndex: index,
            rank: mek.rank,
            assetId: mek.assetId,
            sourceKey: mek.sourceKey,
            head: mek.head,
            body: mek.body,
            trait: mek.trait,
            goldReward: calculateReward(mek.rank, config.goldRange.min * 2, config.goldRange.max * 2, config.goldCurve),
            xpReward: calculateReward(mek.rank, config.xpRange.min * 2, config.xpRange.max * 2, config.xpCurve),
            essenceReward: calculateReward(mek.rank, config.essenceRange.min * 1.5, config.essenceRange.max * 1.5, config.essenceCurve),
          });
        });

        // Mini-Bosses (9 per chapter) - select strategically
        const miniBossMekPool = meks.filter(m =>
          m.rank >= chapter.miniBossRange[0] &&
          m.rank <= chapter.miniBossRange[1]
        );

        // Shuffle mini-bosses for variety
        const shuffledMiniBosses = [...miniBossMekPool];
        for (let i = shuffledMiniBosses.length - 1; i > 0; i--) {
          const j = Math.floor(seededRandom(chapter.chapter * 3000 + i) * (i + 1));
          [shuffledMiniBosses[i], shuffledMiniBosses[j]] = [shuffledMiniBosses[j], shuffledMiniBosses[i]];
        }

        shuffledMiniBosses.slice(0, 9).forEach((mek, index) => {
          allMiniBossNodes.push({
            chapter: chapter.chapter,
            nodeIndex: index,
            rank: mek.rank,
            assetId: mek.assetId,
            sourceKey: mek.sourceKey,
            head: mek.head,
            body: mek.body,
            trait: mek.trait,
            goldReward: calculateReward(mek.rank, config.goldRange.min * 5, config.goldRange.max * 5, config.goldCurve),
            xpReward: calculateReward(mek.rank, config.xpRange.min * 5, config.xpRange.max * 5, config.xpCurve),
            essenceReward: calculateReward(mek.rank, config.essenceRange.min * 3, config.essenceRange.max * 3, config.essenceCurve),
          });
        });

        // Final Boss (1 per chapter)
        const finalBoss = meks.find(m => m.rank === chapter.finalBossRank);
        if (finalBoss) {
          allFinalBossNodes.push({
            chapter: chapter.chapter,
            rank: finalBoss.rank,
            assetId: finalBoss.assetId,
            sourceKey: finalBoss.sourceKey,
            head: finalBoss.head,
            body: finalBoss.body,
            trait: finalBoss.trait,
            goldReward: calculateReward(finalBoss.rank, config.goldRange.min * 10, config.goldRange.max * 10, config.goldCurve),
            xpReward: calculateReward(finalBoss.rank, config.xpRange.min * 10, config.xpRange.max * 10, config.xpCurve),
            essenceReward: calculateReward(finalBoss.rank, config.essenceRange.min * 5, config.essenceRange.max * 5, config.essenceCurve),
          });
        }
      });

      // Get current active deployment to preserve event nodes
      const activeDeployment = await ctx.db
        .query("deployedStoryClimbData")
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      // Archive any currently active deployments
      const activeDeployments = await ctx.db
        .query("deployedStoryClimbData")
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      for (const deployment of activeDeployments) {
        await ctx.db.patch(deployment._id, { status: "archived" });
      }

      // Generate deployment ID
      const deploymentId = `deploy_all_meks_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get the next version number
      const allDeployments = await ctx.db
        .query("deployedStoryClimbData")
        .order("desc")
        .take(1);

      const latestVersion = allDeployments.length > 0 ? (allDeployments[0].version || 0) : 0;
      const newVersion = latestVersion + 1;

      // Create new deployment with all node types
      const deploymentRecord = await ctx.db.insert("deployedStoryClimbData", {
        deploymentId,
        deployedAt: Date.now(),
        deployedBy: userId,
        version: newVersion,
        status: "active",
        eventNodes: activeDeployment?.eventNodes || JSON.stringify([]), // Preserve existing event nodes
        normalNodes: JSON.stringify(allNormalNodes),
        challengerNodes: JSON.stringify(allChallengerNodes),
        miniBossNodes: JSON.stringify(allMiniBossNodes),
        finalBossNodes: JSON.stringify(allFinalBossNodes),
        configurationName: "All Mekanisms Deployment",
        notes: args.notes || `Deployed all mekanisms to all 10 chapters`,
      });

      return {
        success: true,
        deploymentId,
        version: newVersion,
        counts: {
          normalNodes: allNormalNodes.length,
          challengerNodes: allChallengerNodes.length,
          miniBossNodes: allMiniBossNodes.length,
          finalBossNodes: allFinalBossNodes.length,
        },
        message: `Successfully deployed ${allNormalNodes.length} normal nodes, ${allChallengerNodes.length} challengers, ${allMiniBossNodes.length} mini-bosses, and ${allFinalBossNodes.length} final bosses across all 10 chapters (Version ${newVersion})`,
      };
    } catch (error) {
      console.error("Deployment error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

// Validate deployment data before deploying
export const validateDeploymentData = query({
  args: {
    eventData: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const events = JSON.parse(args.eventData);

      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate structure
      if (!Array.isArray(events)) {
        errors.push("Event data must be an array");
        return {
          isValid: false,
          errors,
          warnings,
          summary: {
            totalEvents: 0,
            totalGold: 0,
            totalXP: 0,
            hasAllEventNames: false,
            hasAllRewards: false,
          },
        };
      }

      let totalGold = 0;
      let totalXP = 0;
      let unnamedEvents = 0;
      let zeroRewardEvents = 0;

      events.forEach((event: any, index: number) => {
        // Check required fields
        if (typeof event.eventNumber !== 'number') {
          errors.push(`Event at index ${index} missing eventNumber`);
        }

        if (!event.name || event.name === `Event ${event.eventNumber}`) {
          unnamedEvents++;
        }

        if (event.goldReward === 0 && event.xpReward === 0) {
          zeroRewardEvents++;
        }

        totalGold += event.goldReward || 0;
        totalXP += event.xpReward || 0;
      });

      if (unnamedEvents > 0) {
        warnings.push(`${unnamedEvents} events have default names`);
      }

      if (zeroRewardEvents > 0) {
        warnings.push(`${zeroRewardEvents} events have no gold or XP rewards`);
      }

      if (events.length !== 200) {
        warnings.push(`Expected 200 events, found ${events.length}`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        summary: {
          totalEvents: events.length,
          totalGold,
          totalXP,
          hasAllEventNames: unnamedEvents === 0,
          hasAllRewards: zeroRewardEvents === 0,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ["Failed to parse event data: " + (error instanceof Error ? error.message : "Unknown error")],
        warnings: [],
        summary: {
          totalEvents: 0,
          totalGold: 0,
          totalXP: 0,
          hasAllEventNames: false,
          hasAllRewards: false,
        },
      };
    }
  },
});