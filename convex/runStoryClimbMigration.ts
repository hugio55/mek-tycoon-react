import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * ONE-TIME MIGRATION RUNNER
 *
 * Run this from the Convex dashboard to migrate all existing Story Climb deployments
 * to the new optimized schema.
 *
 * This is safe to run multiple times - it will skip already migrated deployments.
 */

export const migrateAllDeployments = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("========================================");
    console.log("STARTING STORY CLIMB DATA MIGRATION");
    console.log("========================================");

    // First, check migration status
    const status = await ctx.runQuery(api.storyClimbOptimized.getMigrationStatus, {});
    console.log("Migration Status:", JSON.stringify(status, null, 2));

    if (!status.migrationNeeded) {
      console.log("✅ No migration needed - all deployments already migrated!");
      return {
        success: true,
        message: "All deployments already migrated",
        status,
      };
    }

    console.log(`Found ${status.deploymentsToMigrate} deployments to migrate...`);

    // Run the migration
    const result = await ctx.runMutation(api.storyClimbOptimized.migrateToOptimizedSchema, {});

    console.log("========================================");
    console.log("MIGRATION COMPLETE");
    console.log("Result:", JSON.stringify(result, null, 2));
    console.log("========================================");

    // Check final status
    const finalStatus = await ctx.runQuery(api.storyClimbOptimized.getMigrationStatus, {});
    console.log("Final Status:", JSON.stringify(finalStatus, null, 2));

    return {
      success: true,
      migrationResult: result,
      beforeStatus: status,
      afterStatus: finalStatus,
      message: `Successfully migrated ${result.migrated} deployments, skipped ${result.skipped}`,
    };
  },
});

/**
 * Check migration status without running migration
 */
export const checkMigrationStatus = mutation({
  args: {},
  handler: async (ctx) => {
    const status = await ctx.runQuery(api.storyClimbOptimized.getMigrationStatus, {});
    console.log("Migration Status Check:", JSON.stringify(status, null, 2));
    return status;
  },
});
