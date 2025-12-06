import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// TRANSFORMED COMPONENTS - Store and retrieve transformed UI components
// ============================================================================

export const saveComponent = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    props: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if component already exists
    const existing = await ctx.db
      .query("transformedComponents")
      .withIndex("", (q: any) => q.eq("name", args.name))
      .first();

    if (existing) {
      // Update existing component
      await ctx.db.patch(existing._id, {
        code: args.code,
        props: args.props,
        tags: args.tags,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new component
      return await ctx.db.insert("transformedComponents", {
        name: args.name,
        code: args.code,
        props: args.props,
        tags: args.tags,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const getComponent = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transformedComponents")
      .withIndex("", (q: any) => q.eq("name", args.name))
      .first();
  },
});

export const getAllComponents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("transformedComponents").collect();
  },
});

export const searchComponentsByTag = query({
  args: { tag: v.string() },
  handler: async (ctx, args) => {
    const allComponents = await ctx.db.query("transformedComponents").collect();
    return allComponents.filter((component) =>
      component.tags.includes(args.tag)
    );
  },
});

export const deleteComponent = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const component = await ctx.db
      .query("transformedComponents")
      .withIndex("", (q: any) => q.eq("name", args.name))
      .first();

    if (component) {
      await ctx.db.delete(component._id);
      return true;
    }
    return false;
  },
});

// ============================================================================
// DESIGN PREFERENCES - Track learned design patterns
// ============================================================================

export const savePreference = mutation({
  args: {
    key: v.string(),
    value: v.string(),
    context: v.optional(v.string()),
    confidence: v.number(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if preference already exists
    const existing = await ctx.db
      .query("designPreferences")
      .withIndex("", (q: any) => q.eq("key", args.key))
      .first();

    if (existing) {
      // Update existing preference with higher confidence if applicable
      const newConfidence = Math.max(existing.confidence, args.confidence);
      await ctx.db.patch(existing._id, {
        value: args.value,
        context: args.context,
        confidence: newConfidence,
        category: args.category,
        lastUsed: now,
      });
      return existing._id;
    } else {
      // Create new preference
      return await ctx.db.insert("designPreferences", {
        key: args.key,
        value: args.value,
        context: args.context,
        confidence: args.confidence,
        category: args.category,
        lastUsed: now,
        createdAt: now,
      });
    }
  },
});

export const getPreference = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("designPreferences")
      .withIndex("", (q: any) => q.eq("key", args.key))
      .first();
  },
});

export const getAllPreferences = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("designPreferences").collect();
  },
});

export const getPreferencesByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("designPreferences")
      .withIndex("", (q: any) => q.eq("category", args.category))
      .collect();
  },
});

// ============================================================================
// TRANSFORMATION RULES - Automatic pattern replacement rules
// ============================================================================

export const saveRule = mutation({
  args: {
    name: v.string(),
    pattern: v.string(),
    replacement: v.string(),
    autoApply: v.boolean(),
    confidence: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if rule already exists
    const existing = await ctx.db
      .query("transformationRules")
      .withIndex("", (q: any) => q.eq("name", args.name))
      .first();

    if (existing) {
      // Update existing rule
      await ctx.db.patch(existing._id, {
        pattern: args.pattern,
        replacement: args.replacement,
        autoApply: args.autoApply,
        confidence: args.confidence,
        lastApplied: now,
      });
      return existing._id;
    } else {
      // Create new rule
      return await ctx.db.insert("transformationRules", {
        name: args.name,
        pattern: args.pattern,
        replacement: args.replacement,
        autoApply: args.autoApply,
        confidence: args.confidence,
        timesApplied: 0,
        lastApplied: now,
        createdAt: now,
      });
    }
  },
});

export const getRule = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transformationRules")
      .withIndex("", (q: any) => q.eq("name", args.name))
      .first();
  },
});

export const getAutoApplyRules = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("transformationRules")
      .withIndex("", (q: any) => q.eq("autoApply", true))
      .collect();
  },
});

export const getAllRules = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("transformationRules").collect();
  },
});

export const incrementRuleUsage = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const rule = await ctx.db
      .query("transformationRules")
      .withIndex("", (q: any) => q.eq("name", args.name))
      .first();

    if (rule) {
      await ctx.db.patch(rule._id, {
        timesApplied: rule.timesApplied + 1,
        lastApplied: Date.now(),
      });
      return true;
    }
    return false;
  },
});

export const deleteRule = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const rule = await ctx.db
      .query("transformationRules")
      .withIndex("", (q: any) => q.eq("name", args.name))
      .first();

    if (rule) {
      await ctx.db.delete(rule._id);
      return true;
    }
    return false;
  },
});
