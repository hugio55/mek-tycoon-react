import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * OPTIMIZED STORY CLIMB DATA STORAGE
 *
 * This replaces deployedNodeData.ts with a more efficient schema:
 * - Old: One giant JSON blob with all 10 chapters (~4,000 nodes) parsed every query
 * - New: Separate records per chapter (~400 nodes) - 90% bandwidth reduction
 */

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Migrate existing deployedStoryClimbData to new optimized schema
 * This can be run safely multiple times - it skips already migrated deployments
 */
export const migrateToOptimizedSchema = mutation({
  args: {
    deploymentId: v.optional(v.string()), // Optional: migrate specific deployment, or all if not provided
  },
  handler: async (ctx, args) => {
    try {
      // Get deployments to migrate
      let deploymentsToMigrate;
      if (args.deploymentId) {
        const specific = await ctx.db
          .query("deployedStoryClimbData")
          .withIndex("by_deployment_id", q => q.eq("deploymentId", args.deploymentId))
          .first();
        deploymentsToMigrate = specific ? [specific] : [];
      } else {
        // Migrate all
        deploymentsToMigrate = await ctx.db
          .query("deployedStoryClimbData")
          .collect();
      }

      if (deploymentsToMigrate.length === 0) {
        return {
          success: true,
          message: "No deployments to migrate",
          migrated: 0,
        };
      }

      let migratedCount = 0;
      let skippedCount = 0;

      for (const oldDeployment of deploymentsToMigrate) {
        // Check if already migrated
        const existing = await ctx.db
          .query("storyClimbDeployments")
          .withIndex("by_deployment_id", q => q.eq("deploymentId", oldDeployment.deploymentId))
          .first();

        if (existing) {
          console.log(`Skipping already migrated deployment: ${oldDeployment.deploymentId}`);
          skippedCount++;
          continue;
        }

        // Parse old data
        const allEventNodes = JSON.parse(oldDeployment.eventNodes || "[]");
        const allNormalNodes = JSON.parse(oldDeployment.normalNodes || "[]");
        const allChallengerNodes = JSON.parse(oldDeployment.challengerNodes || "[]");
        const allMiniBossNodes = JSON.parse(oldDeployment.miniBossNodes || "[]");
        const allFinalBossNodes = JSON.parse(oldDeployment.finalBossNodes || "[]");

        // Create deployment header
        await ctx.db.insert("storyClimbDeployments", {
          deploymentId: oldDeployment.deploymentId,
          deployedAt: oldDeployment.deployedAt,
          deployedBy: oldDeployment.deployedBy,
          version: oldDeployment.version,
          status: oldDeployment.status,
          configurationName: oldDeployment.configurationName,
          configurationId: oldDeployment.configurationId,
          notes: oldDeployment.notes,
          totalEventNodes: allEventNodes.length,
          totalNormalNodes: allNormalNodes.length,
          totalChallengerNodes: allChallengerNodes.length,
          totalMiniBossNodes: allMiniBossNodes.length,
          totalFinalBossNodes: allFinalBossNodes.length,
        });

        // Split data by chapter and create chapter records
        for (let chapter = 1; chapter <= 10; chapter++) {
          // Filter nodes for this chapter
          const chapterEventNodes = allEventNodes.filter((node: any) => {
            const eventChapter = Math.ceil(node.eventNumber / 20);
            return eventChapter === chapter;
          });

          const chapterNormalNodes = allNormalNodes.filter((node: any) => node.chapter === chapter);
          const chapterChallengerNodes = allChallengerNodes.filter((node: any) => node.chapter === chapter);
          const chapterMiniBossNodes = allMiniBossNodes.filter((node: any) => node.chapter === chapter);
          const chapterFinalBossNodes = allFinalBossNodes.filter((node: any) => node.chapter === chapter);

          const totalNodes = chapterEventNodes.length + chapterNormalNodes.length +
            chapterChallengerNodes.length + chapterMiniBossNodes.length + chapterFinalBossNodes.length;

          // Create chapter record (even if empty, for consistency)
          await ctx.db.insert("storyClimbChapters", {
            deploymentId: oldDeployment.deploymentId,
            chapter,
            eventNodes: JSON.stringify(chapterEventNodes),
            normalNodes: JSON.stringify(chapterNormalNodes),
            challengerNodes: JSON.stringify(chapterChallengerNodes),
            miniBossNodes: JSON.stringify(chapterMiniBossNodes),
            finalBossNodes: JSON.stringify(chapterFinalBossNodes),
            nodeCount: totalNodes,
            createdAt: Date.now(),
          });

          console.log(`Migrated chapter ${chapter} for deployment ${oldDeployment.deploymentId}: ${totalNodes} nodes`);
        }

        migratedCount++;
        console.log(`Successfully migrated deployment: ${oldDeployment.deploymentId}`);
      }

      return {
        success: true,
        message: `Migration complete`,
        migrated: migratedCount,
        skipped: skippedCount,
        total: deploymentsToMigrate.length,
      };
    } catch (error) {
      console.error("Migration error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

// ============================================================================
// OPTIMIZED QUERY FUNCTIONS
// ============================================================================

/**
 * Get active deployment for a specific chapter (OPTIMIZED - 90% bandwidth reduction)
 * Replaces deployedNodeData.getActiveDeploymentByChapter
 */
export const getChapterData = query({
  args: {
    chapter: v.number(), // Chapter number (1-10)
  },
  handler: async (ctx, args) => {
    // Find active deployment
    const activeDeployment = await ctx.db
      .query("storyClimbDeployments")
      .withIndex("by_status", q => q.eq("status", "active"))
      .first();

    if (!activeDeployment) {
      return null;
    }

    // Get chapter-specific data (only ~400 nodes vs 4,000!)
    const chapterData = await ctx.db
      .query("storyClimbChapters")
      .withIndex("by_deployment_and_chapter", q =>
        q.eq("deploymentId", activeDeployment.deploymentId).eq("chapter", args.chapter)
      )
      .first();

    if (!chapterData) {
      return null;
    }

    // Parse and return
    return {
      deploymentId: activeDeployment.deploymentId,
      deployedAt: activeDeployment.deployedAt,
      deployedBy: activeDeployment.deployedBy,
      version: activeDeployment.version,
      status: activeDeployment.status,
      chapter: args.chapter,
      eventNodes: JSON.parse(chapterData.eventNodes),
      normalNodes: JSON.parse(chapterData.normalNodes),
      challengerNodes: JSON.parse(chapterData.challengerNodes),
      miniBossNodes: JSON.parse(chapterData.miniBossNodes),
      finalBossNodes: JSON.parse(chapterData.finalBossNodes),
      configurationName: activeDeployment.configurationName,
      notes: activeDeployment.notes,
    };
  },
});

/**
 * Get deployment metadata (no node data - ultra lightweight)
 */
export const getActiveDeploymentMeta = query({
  args: {},
  handler: async (ctx) => {
    const activeDeployment = await ctx.db
      .query("storyClimbDeployments")
      .withIndex("by_status", q => q.eq("status", "active"))
      .first();

    return activeDeployment;
  },
});

/**
 * Get all chapter metadata for a deployment (no node data)
 */
export const getChapterSummaries = query({
  args: {
    deploymentId: v.optional(v.string()), // Optional: get active if not provided
  },
  handler: async (ctx, args) => {
    let deploymentId = args.deploymentId;

    if (!deploymentId) {
      const active = await ctx.db
        .query("storyClimbDeployments")
        .withIndex("by_status", q => q.eq("status", "active"))
        .first();

      if (!active) return null;
      deploymentId = active.deploymentId;
    }

    const chapters = await ctx.db
      .query("storyClimbChapters")
      .withIndex("by_deployment_id", q => q.eq("deploymentId", deploymentId))
      .collect();

    return chapters.map(c => ({
      chapter: c.chapter,
      nodeCount: c.nodeCount,
      createdAt: c.createdAt,
    }));
  },
});

/**
 * Get deployment history (metadata only)
 */
export const getDeploymentHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const deployments = await ctx.db
      .query("storyClimbDeployments")
      .order("desc")
      .take(limit);

    return deployments;
  },
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check migration status
 */
export const getMigrationStatus = query({
  args: {},
  handler: async (ctx) => {
    const oldDeployments = await ctx.db.query("deployedStoryClimbData").collect();
    const newDeployments = await ctx.db.query("storyClimbDeployments").collect();
    const chapters = await ctx.db.query("storyClimbChapters").collect();

    return {
      legacy: {
        totalDeployments: oldDeployments.length,
        activeDeployments: oldDeployments.filter(d => d.status === "active").length,
      },
      optimized: {
        totalDeployments: newDeployments.length,
        totalChapters: chapters.length,
        activeDeployments: newDeployments.filter(d => d.status === "active").length,
      },
      migrationNeeded: oldDeployments.length > newDeployments.length,
      deploymentsToMigrate: oldDeployments.length - newDeployments.length,
    };
  },
});
