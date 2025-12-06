import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Example Convex Functions for Component Library System
 *
 * These demonstrate common operations for the component library.
 * They follow Convex best practices for queries, mutations, and type safety.
 */

// ============================================================================
// COMPONENT CRUD OPERATIONS
// ============================================================================

/**
 * Create a new component from a successful transformation
 */
export const createComponent = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    code: v.string(),
    props: v.optional(v.string()),
    dependencies: v.optional(v.array(v.string())),
    imports: v.optional(v.array(v.string())),
    category: v.string(),
    tags: v.array(v.string()),
    isPublic: v.boolean(),
    previewImage: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    originalSourceType: v.optional(v.string()),
    originalSourceUrl: v.optional(v.string()),
    transformationStrategy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create component
    const componentId = await ctx.db.insert("components", {
      ...args,
      usageCount: 0,
      currentVersion: 1,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });

    // Create initial version
    await ctx.db.insert("componentVersions", {
      componentId,
      versionNumber: 1,
      code: args.code,
      props: args.props,
      dependencies: args.dependencies,
      changeDescription: "Initial version",
      changeType: "initial",
      createdAt: now,
    });

    return componentId;
  },
});

/**
 * Get a component by slug with its current version
 */
export const getComponentBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const component = await ctx.db
      .query("components")
      .withIndex("", (q: any) => q.eq("slug", args.slug))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .first();

    if (!component) return null;

    // Get current version
    const currentVersion = await ctx.db
      .query("componentVersions")
      .withIndex("", (q: any) =>
        q.eq("componentId", component._id).eq("versionNumber", component.currentVersion)
      )
      .first();

    return { ...component, currentVersion };
  },
});

/**
 * Get all components in a category
 */
export const getComponentsByCategory = query({
  args: {
    category: v.string(),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let componentsQuery = ctx.db
      .query("components")
      .withIndex("", (q: any) => q.eq("category", args.category));

    if (!args.includeArchived) {
      componentsQuery = componentsQuery.filter((q) =>
        q.eq(q.field("isArchived"), false)
      );
    }

    return await componentsQuery.collect();
  },
});

/**
 * Search components by name or tags
 */
export const searchComponents = query({
  args: {
    searchTerm: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Search by name
    const nameResults = await ctx.db
      .query("components")
      .withSearchIndex("search_name", (q) =>
        q.search("name", args.searchTerm)
      )
      .filter((q) => {
        let filter = q.eq(q.field("isArchived"), false);
        if (args.category) {
          filter = q.and(filter, q.eq(q.field("category"), args.category));
        }
        return filter;
      })
      .take(20);

    return nameResults;
  },
});

/**
 * Update component and create new version
 */
export const updateComponent = mutation({
  args: {
    componentId: v.id("components"),
    code: v.string(),
    props: v.optional(v.string()),
    dependencies: v.optional(v.array(v.string())),
    changeDescription: v.string(),
    changeType: v.string(),
  },
  handler: async (ctx, args) => {
    const component = await ctx.db.get(args.componentId);
    if (!component) throw new Error("Component not found");

    const newVersionNumber = component.currentVersion + 1;
    const now = Date.now();

    // Get previous version for comparison
    const previousVersion = await ctx.db
      .query("componentVersions")
      .withIndex("", (q: any) =>
        q.eq("componentId", args.componentId).eq("versionNumber", component.currentVersion)
      )
      .first();

    // Create new version
    const newVersionId = await ctx.db.insert("componentVersions", {
      componentId: args.componentId,
      versionNumber: newVersionNumber,
      code: args.code,
      props: args.props,
      dependencies: args.dependencies,
      changeDescription: args.changeDescription,
      changeType: args.changeType,
      previousVersionId: previousVersion?._id,
      createdAt: now,
    });

    // Update component
    await ctx.db.patch(args.componentId, {
      code: args.code,
      props: args.props,
      dependencies: args.dependencies,
      currentVersion: newVersionNumber,
      updatedAt: now,
    });

    return newVersionId;
  },
});

/**
 * Increment component usage counter
 */
export const recordComponentUsage = mutation({
  args: { componentId: v.id("components") },
  handler: async (ctx, args) => {
    const component = await ctx.db.get(args.componentId);
    if (!component) throw new Error("Component not found");

    await ctx.db.patch(args.componentId, {
      usageCount: component.usageCount + 1,
      lastUsed: Date.now(),
    });
  },
});

// ============================================================================
// TRANSFORMATION HISTORY & LEARNING
// ============================================================================

/**
 * Record a transformation attempt
 */
export const recordTransformation = mutation({
  args: {
    sessionId: v.string(),
    originalCode: v.string(),
    originalSourceType: v.string(),
    aiModel: v.string(),
    transformationPrompt: v.string(),
    transformedCode: v.string(),
    transformationTime: v.number(),
    iterationNumber: v.number(),
    isSuccessful: v.boolean(),
    componentId: v.optional(v.id("components")),
    userFeedback: v.optional(v.string()),
    colorMappings: v.optional(
      v.array(
        v.object({
          sourceColor: v.string(),
          targetColor: v.string(),
        })
      )
    ),
    classNamePatterns: v.optional(
      v.array(
        v.object({
          sourcePattern: v.string(),
          targetPattern: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("transformationHistory", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

/**
 * Add user correction to transformation
 */
export const addTransformationCorrection = mutation({
  args: {
    transformationId: v.id("transformationHistory"),
    issueType: v.string(),
    originalValue: v.string(),
    correctedValue: v.string(),
  },
  handler: async (ctx, args) => {
    const transformation = await ctx.db.get(args.transformationId);
    if (!transformation) throw new Error("Transformation not found");

    const corrections = transformation.correctionsMade || [];
    corrections.push({
      issueType: args.issueType,
      originalValue: args.originalValue,
      correctedValue: args.correctedValue,
      timestamp: Date.now(),
    });

    await ctx.db.patch(args.transformationId, {
      correctionsMade: corrections,
    });
  },
});

/**
 * Get successful transformations for learning
 */
export const getSuccessfulTransformations = query({
  args: {
    sourceType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("transformationHistory")
      .withIndex("", (q: any) => q.eq("isSuccessful", true));

    if (args.sourceType) {
      query = query.filter((q) =>
        q.eq(q.field("originalSourceType"), args.sourceType)
      );
    }

    return await query.take(args.limit || 50);
  },
});

// ============================================================================
// USER PREFERENCES (AI LEARNING)
// ============================================================================

/**
 * Create or update a user preference
 */
export const upsertUserPreference = mutation({
  args: {
    preferenceType: v.string(),
    sourcePattern: v.string(),
    targetPattern: v.string(),
    context: v.optional(v.string()),
    priority: v.number(),
    wasCorrect: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if preference already exists
    const existing = await ctx.db
      .query("userPreferences")
      .filter((q) =>
        q.and(
          q.eq(q.field("preferenceType"), args.preferenceType),
          q.eq(q.field("sourcePattern"), args.sourcePattern)
        )
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing preference
      const newTimesApplied = existing.timesApplied + 1;
      const newTimesCorrect = args.wasCorrect
        ? existing.timesCorrect + 1
        : existing.timesCorrect;
      const newConfidence = newTimesCorrect / newTimesApplied;

      await ctx.db.patch(existing._id, {
        targetPattern: args.targetPattern, // Update to latest
        timesApplied: newTimesApplied,
        timesCorrect: newTimesCorrect,
        confidenceScore: newConfidence,
        lastUsed: now,
      });

      return existing._id;
    } else {
      // Create new preference
      return await ctx.db.insert("userPreferences", {
        preferenceType: args.preferenceType,
        sourcePattern: args.sourcePattern,
        targetPattern: args.targetPattern,
        context: args.context,
        priority: args.priority,
        timesApplied: 1,
        timesCorrect: args.wasCorrect ? 1 : 0,
        confidenceScore: args.wasCorrect ? 1.0 : 0.0,
        createdAt: now,
        lastUsed: now,
      });
    }
  },
});

/**
 * Get user preferences for transformation
 */
export const getUserPreferences = query({
  args: {
    preferenceType: v.optional(v.string()),
    minConfidence: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("userPreferences");

    if (args.preferenceType) {
      query = query.withIndex("", (q: any) =>
        q.eq("preferenceType", args.preferenceType)
      );
    }

    let results = await query.collect();

    // Filter by confidence if specified
    if (args.minConfidence !== undefined) {
      results = results.filter((p) => p.confidenceScore >= args.minConfidence);
    }

    // Sort by priority and confidence
    return results.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return b.confidenceScore - a.confidenceScore;
    });
  },
});

// ============================================================================
// COMPONENT USAGE TRACKING
// ============================================================================

/**
 * Register component usage on a page
 */
export const registerComponentUsage = mutation({
  args: {
    componentId: v.id("components"),
    pageRoute: v.string(),
    pageSection: v.optional(v.string()),
    componentInstance: v.string(),
    propsSnapshot: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const component = await ctx.db.get(args.componentId);
    if (!component) throw new Error("Component not found");

    // Get current version
    const currentVersion = await ctx.db
      .query("componentVersions")
      .withIndex("", (q: any) =>
        q.eq("componentId", args.componentId).eq("versionNumber", component.currentVersion)
      )
      .first();

    if (!currentVersion) throw new Error("Component version not found");

    const now = Date.now();

    return await ctx.db.insert("componentUsage", {
      componentId: args.componentId,
      componentVersionId: currentVersion._id,
      pageRoute: args.pageRoute,
      pageSection: args.pageSection,
      componentInstance: args.componentInstance,
      propsSnapshot: args.propsSnapshot,
      isActive: true,
      firstUsed: now,
      lastChecked: now,
    });
  },
});

/**
 * Get all active usages of a component
 */
export const getComponentUsages = query({
  args: { componentId: v.id("components") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("componentUsage")
      .withIndex("", (q: any) =>
        q.eq("componentId", args.componentId).eq("isActive", true)
      )
      .collect();
  },
});

/**
 * Mark component usage as inactive (component removed from page)
 */
export const deactivateComponentUsage = mutation({
  args: { usageId: v.id("componentUsage") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.usageId, {
      isActive: false,
      removedAt: Date.now(),
    });
  },
});

// ============================================================================
// ANALYTICS & INSIGHTS
// ============================================================================

/**
 * Get most used components
 */
export const getMostUsedComponents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("components")
      .withIndex("by_usage")
      .order("desc")
      .filter((q) => q.eq(q.field("isArchived"), false))
      .take(args.limit || 10);
  },
});

/**
 * Get recently used components
 */
export const getRecentlyUsedComponents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("components")
      .withIndex("by_last_used")
      .order("desc")
      .filter((q) => q.eq(q.field("isArchived"), false))
      .take(args.limit || 10);
  },
});

/**
 * Get transformation success rate by source type
 */
export const getTransformationStats = query({
  args: {},
  handler: async (ctx, args) => {
    const allTransformations = await ctx.db
      .query("transformationHistory")
      .collect();

    const statsBySource: Record<
      string,
      { total: number; successful: number; averageIterations: number }
    > = {};

    allTransformations.forEach((t) => {
      if (!statsBySource[t.originalSourceType]) {
        statsBySource[t.originalSourceType] = {
          total: 0,
          successful: 0,
          averageIterations: 0,
        };
      }

      statsBySource[t.originalSourceType].total++;
      if (t.isSuccessful) {
        statsBySource[t.originalSourceType].successful++;
      }
      statsBySource[t.originalSourceType].averageIterations += t.iterationNumber;
    });

    // Calculate averages
    Object.keys(statsBySource).forEach((source) => {
      const stats = statsBySource[source];
      stats.averageIterations = stats.averageIterations / stats.total;
    });

    return statsBySource;
  },
});
