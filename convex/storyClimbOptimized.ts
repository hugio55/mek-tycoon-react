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
 * STEP 1: Create deployment metadata (lightweight - no JSON parsing)
 * This only creates the header record, doesn't process any node data
 */
export const migrateDeploymentMetadata = mutation({
  args: {
    deploymentId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Check if already migrated
      const existing = await ctx.db
        .query("storyClimbDeployments")
        .withIndex("by_deployment_id", q => q.eq("deploymentId", args.deploymentId))
        .first();

      if (existing) {
        return {
          success: true,
          message: "Deployment metadata already migrated",
          alreadyMigrated: true,
        };
      }

      // Get old deployment
      const oldDeployment = await ctx.db
        .query("deployedStoryClimbData")
        .withIndex("by_deployment_id", q => q.eq("deploymentId", args.deploymentId))
        .first();

      if (!oldDeployment) {
        throw new Error(`Deployment ${args.deploymentId} not found`);
      }

      // Create metadata only (no JSON parsing - just get lengths)
      await ctx.db.insert("storyClimbDeployments", {
        deploymentId: oldDeployment.deploymentId,
        deployedAt: oldDeployment.deployedAt,
        deployedBy: oldDeployment.deployedBy,
        version: oldDeployment.version,
        status: oldDeployment.status,
        configurationName: oldDeployment.configurationName,
        configurationId: oldDeployment.configurationId,
        notes: oldDeployment.notes,
        totalEventNodes: 0, // Will update after chapters are migrated
        totalNormalNodes: 0,
        totalChallengerNodes: 0,
        totalMiniBossNodes: 0,
        totalFinalBossNodes: 0,
      });

      console.log(`Created metadata for deployment: ${oldDeployment.deploymentId}`);

      return {
        success: true,
        message: "Deployment metadata created",
        deploymentId: args.deploymentId,
      };
    } catch (error) {
      console.error("Metadata migration error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

/**
 * STEP 2: Migrate a single chapter (processes only ~400 nodes instead of 4,000)
 * Call this 10 times per deployment (once for each chapter)
 */
export const migrateChapter = mutation({
  args: {
    deploymentId: v.string(),
    chapter: v.number(), // 1-10
  },
  handler: async (ctx, args) => {
    try {
      // Check if chapter already migrated
      const existing = await ctx.db
        .query("storyClimbChapters")
        .withIndex("by_deployment_and_chapter", q =>
          q.eq("deploymentId", args.deploymentId).eq("chapter", args.chapter)
        )
        .first();

      if (existing) {
        return {
          success: true,
          message: `Chapter ${args.chapter} already migrated`,
          alreadyMigrated: true,
        };
      }

      // Get old deployment
      const oldDeployment = await ctx.db
        .query("deployedStoryClimbData")
        .withIndex("by_deployment_id", q => q.eq("deploymentId", args.deploymentId))
        .first();

      if (!oldDeployment) {
        throw new Error(`Deployment ${args.deploymentId} not found`);
      }

      // Parse only the data we need (still large but ~10x smaller than all chapters)
      const allEventNodes = JSON.parse(oldDeployment.eventNodes || "[]");
      const allNormalNodes = JSON.parse(oldDeployment.normalNodes || "[]");
      const allChallengerNodes = JSON.parse(oldDeployment.challengerNodes || "[]");
      const allMiniBossNodes = JSON.parse(oldDeployment.miniBossNodes || "[]");
      const allFinalBossNodes = JSON.parse(oldDeployment.finalBossNodes || "[]");

      // Filter for this chapter only
      const chapterEventNodes = allEventNodes.filter((node: any) => {
        const eventChapter = Math.ceil(node.eventNumber / 20);
        return eventChapter === args.chapter;
      });

      const chapterNormalNodes = allNormalNodes.filter((node: any) => node.chapter === args.chapter);
      const chapterChallengerNodes = allChallengerNodes.filter((node: any) => node.chapter === args.chapter);
      const chapterMiniBossNodes = allMiniBossNodes.filter((node: any) => node.chapter === args.chapter);
      const chapterFinalBossNodes = allFinalBossNodes.filter((node: any) => node.chapter === args.chapter);

      const totalNodes = chapterEventNodes.length + chapterNormalNodes.length +
        chapterChallengerNodes.length + chapterMiniBossNodes.length + chapterFinalBossNodes.length;

      // Create chapter record
      await ctx.db.insert("storyClimbChapters", {
        deploymentId: args.deploymentId,
        chapter: args.chapter,
        eventNodes: JSON.stringify(chapterEventNodes),
        normalNodes: JSON.stringify(chapterNormalNodes),
        challengerNodes: JSON.stringify(chapterChallengerNodes),
        miniBossNodes: JSON.stringify(chapterMiniBossNodes),
        finalBossNodes: JSON.stringify(chapterFinalBossNodes),
        nodeCount: totalNodes,
        createdAt: Date.now(),
      });

      console.log(`Migrated chapter ${args.chapter} for ${args.deploymentId}: ${totalNodes} nodes`);

      return {
        success: true,
        message: `Chapter ${args.chapter} migrated`,
        nodeCount: totalNodes,
        chapter: args.chapter,
        deploymentId: args.deploymentId,
      };
    } catch (error) {
      console.error(`Chapter ${args.chapter} migration error:`, error);
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
