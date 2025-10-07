import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * MULTI-STEP MIGRATION RUNNER
 *
 * Run this from the Convex dashboard to migrate Story Climb deployments.
 * This uses a multi-step approach to avoid hitting Convex's 16MB limit.
 *
 * Steps:
 * 1. Find active deployment
 * 2. Create metadata
 * 3. Migrate chapters 1-10 one at a time
 */

/**
 * STEP 1: Get the active deployment ID
 */
export const getActiveDeploymentId = query({
  args: {},
  handler: async (ctx) => {
    const activeDeployment = await ctx.db
      .query("deployedStoryClimbData")
      .withIndex("by_status", q => q.eq("status", "active"))
      .first();

    if (!activeDeployment) {
      return {
        success: false,
        message: "No active deployment found",
      };
    }

    return {
      success: true,
      deploymentId: activeDeployment.deploymentId,
      message: `Found active deployment: ${activeDeployment.deploymentId}`,
    };
  },
});

/**
 * STEP 2: Migrate metadata for active deployment
 */
export const migrateActiveMetadata = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("========================================");
    console.log("STEP 1: MIGRATING METADATA");
    console.log("========================================");

    // Get active deployment
    const activeDeployment = await ctx.db
      .query("deployedStoryClimbData")
      .withIndex("by_status", q => q.eq("status", "active"))
      .first();

    if (!activeDeployment) {
      return {
        success: false,
        message: "No active deployment found",
      };
    }

    console.log(`Migrating metadata for: ${activeDeployment.deploymentId}`);

    // Migrate metadata
    const result = await ctx.runMutation(api.storyClimbOptimized.migrateDeploymentMetadata, {
      deploymentId: activeDeployment.deploymentId,
    });

    console.log("Metadata result:", JSON.stringify(result, null, 2));

    return {
      success: true,
      deploymentId: activeDeployment.deploymentId,
      metadataResult: result,
      message: result.alreadyMigrated
        ? "Metadata already migrated"
        : "Metadata created successfully",
    };
  },
});

/**
 * STEP 3: Migrate a single chapter
 * Call this 10 times (once for each chapter)
 */
export const migrateActiveChapter = mutation({
  args: {
    chapter: v.number(), // 1-10
  },
  handler: async (ctx, args) => {
    console.log(`========================================`);
    console.log(`STEP 2.${args.chapter}: MIGRATING CHAPTER ${args.chapter}`);
    console.log(`========================================`);

    // Get active deployment
    const activeDeployment = await ctx.db
      .query("deployedStoryClimbData")
      .withIndex("by_status", q => q.eq("status", "active"))
      .first();

    if (!activeDeployment) {
      return {
        success: false,
        message: "No active deployment found",
      };
    }

    console.log(`Migrating chapter ${args.chapter} for: ${activeDeployment.deploymentId}`);

    // Migrate chapter
    const result = await ctx.runMutation(api.storyClimbOptimized.migrateChapter, {
      deploymentId: activeDeployment.deploymentId,
      chapter: args.chapter,
    });

    console.log(`Chapter ${args.chapter} result:`, JSON.stringify(result, null, 2));

    return {
      success: true,
      chapter: args.chapter,
      deploymentId: activeDeployment.deploymentId,
      chapterResult: result,
      message: result.alreadyMigrated
        ? `Chapter ${args.chapter} already migrated`
        : `Chapter ${args.chapter} migrated successfully (${result.nodeCount} nodes)`,
    };
  },
});

/**
 * Check migration status without running migration
 */
export const checkMigrationStatus = query({
  args: {},
  handler: async (ctx) => {
    const status = await ctx.runQuery(api.storyClimbOptimized.getMigrationStatus, {});
    console.log("Migration Status Check:", JSON.stringify(status, null, 2));
    return status;
  },
});
