/**
 * Coach Marks / Spotlight Tutorial System - Admin Functions
 *
 * CRUD operations for managing tutorial steps and sequences.
 * See COACH_MARKS.md for full documentation.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// =============================================================================
// STEP QUERIES
// =============================================================================

/**
 * Get all coach mark steps.
 */
export const getAllSteps = query({
  args: {},
  handler: async (ctx) => {
    const steps = await ctx.db.query("coachMarkSteps").collect();
    return steps.sort((a, b) => {
      // Sort by sequence first, then by order
      if (a.sequenceId && b.sequenceId) {
        if (a.sequenceId !== b.sequenceId) {
          return a.sequenceId.localeCompare(b.sequenceId);
        }
        return a.sequenceOrder - b.sequenceOrder;
      }
      if (a.sequenceId) return -1;
      if (b.sequenceId) return 1;
      return a.stepKey.localeCompare(b.stepKey);
    });
  },
});

/**
 * Get a single step by stepKey.
 */
export const getStep = query({
  args: {
    stepKey: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("coachMarkSteps")
      .withIndex("by_step_key", (q) => q.eq("stepKey", args.stepKey))
      .first();
  },
});

/**
 * Get steps by page route.
 */
export const getStepsByPage = query({
  args: {
    pageRoute: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("coachMarkSteps")
      .withIndex("by_page_route", (q) => q.eq("pageRoute", args.pageRoute))
      .collect();
  },
});

/**
 * Get steps by sequence (uses index, returns sorted by sequenceOrder).
 */
export const getStepsBySequence = query({
  args: {
    sequenceId: v.string(),
  },
  handler: async (ctx, args) => {
    // Note: The by_sequence index is on [sequenceId, sequenceOrder]
    // so results come back sorted by sequenceOrder automatically
    return await ctx.db
      .query("coachMarkSteps")
      .withIndex("by_sequence", (q) => q.eq("sequenceId", args.sequenceId))
      .collect();
  },
});

// =============================================================================
// STEP MUTATIONS
// =============================================================================

/**
 * Create a new coach mark step.
 */
export const createStep = mutation({
  args: {
    stepKey: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    pageRoute: v.string(),
    sequenceId: v.optional(v.string()),
    sequenceOrder: v.number(),
    targetType: v.union(
      v.literal("element"),
      v.literal("manual"),
      v.literal("hybrid")
    ),
    elementSelector: v.optional(v.string()),
    manualPosition: v.optional(v.object({
      x: v.number(),
      y: v.number(),
      width: v.number(),
      height: v.number(),
    })),
    positionOffset: v.optional(v.object({
      top: v.optional(v.number()),
      left: v.optional(v.number()),
      right: v.optional(v.number()),
      bottom: v.optional(v.number()),
    })),
    spotlightShape: v.union(
      v.literal("rectangle"),
      v.literal("circle"),
      v.literal("pill")
    ),
    spotlightPadding: v.number(),
    arrowPosition: v.union(
      v.literal("top"),
      v.literal("bottom"),
      v.literal("left"),
      v.literal("right"),
      v.literal("none")
    ),
    arrowOffset: v.optional(v.number()),
    tooltipText: v.string(),
    tooltipTitle: v.optional(v.string()),
    tooltipPosition: v.union(
      v.literal("above"),
      v.literal("below"),
      v.literal("left"),
      v.literal("right"),
      v.literal("auto")
    ),
    isMandatory: v.boolean(),
    allowBackdropClick: v.boolean(),
    showSkipButton: v.boolean(),
    showNextButton: v.boolean(),
    triggerCondition: v.union(
      v.literal("first-login"),
      v.literal("first-visit-page"),
      v.literal("manual")
    ),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Validate targeting configuration
    if (args.targetType === "element" && !args.elementSelector) {
      throw new Error("elementSelector is required when targetType is 'element'");
    }
    if (args.targetType === "manual" && !args.manualPosition) {
      throw new Error("manualPosition is required when targetType is 'manual'");
    }
    if (args.targetType === "hybrid" && !args.elementSelector) {
      throw new Error("elementSelector is required when targetType is 'hybrid'");
    }

    // Check for duplicate stepKey
    const existing = await ctx.db
      .query("coachMarkSteps")
      .withIndex("by_step_key", (q) => q.eq("stepKey", args.stepKey))
      .first();

    if (existing) {
      throw new Error(`Step with key "${args.stepKey}" already exists`);
    }

    const now = Date.now();

    const stepId = await ctx.db.insert("coachMarkSteps", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    // If step is part of a sequence, update the sequence's stepOrder
    if (args.sequenceId) {
      const sequence = await ctx.db
        .query("coachMarkSequences")
        .withIndex("by_sequence_id", (q) => q.eq("sequenceId", args.sequenceId!))
        .first();

      if (sequence) {
        const newStepOrder = [...sequence.stepOrder];
        // Insert at correct position, clamped to valid range
        const insertIndex = Math.min(args.sequenceOrder, newStepOrder.length);
        newStepOrder.splice(insertIndex, 0, args.stepKey);
        await ctx.db.patch(sequence._id, { stepOrder: newStepOrder });
      }
    }

    return { success: true, stepId };
  },
});

/**
 * Update an existing coach mark step.
 */
export const updateStep = mutation({
  args: {
    stepKey: v.string(),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      pageRoute: v.optional(v.string()),
      sequenceId: v.optional(v.string()),
      sequenceOrder: v.optional(v.number()),
      targetType: v.optional(v.union(
        v.literal("element"),
        v.literal("manual"),
        v.literal("hybrid")
      )),
      elementSelector: v.optional(v.string()),
      manualPosition: v.optional(v.object({
        x: v.number(),
        y: v.number(),
        width: v.number(),
        height: v.number(),
      })),
      positionOffset: v.optional(v.object({
        top: v.optional(v.number()),
        left: v.optional(v.number()),
        right: v.optional(v.number()),
        bottom: v.optional(v.number()),
      })),
      spotlightShape: v.optional(v.union(
        v.literal("rectangle"),
        v.literal("circle"),
        v.literal("pill")
      )),
      spotlightPadding: v.optional(v.number()),
      arrowPosition: v.optional(v.union(
        v.literal("top"),
        v.literal("bottom"),
        v.literal("left"),
        v.literal("right"),
        v.literal("none")
      )),
      arrowOffset: v.optional(v.number()),
      tooltipText: v.optional(v.string()),
      tooltipTitle: v.optional(v.string()),
      tooltipPosition: v.optional(v.union(
        v.literal("above"),
        v.literal("below"),
        v.literal("left"),
        v.literal("right"),
        v.literal("auto")
      )),
      isMandatory: v.optional(v.boolean()),
      allowBackdropClick: v.optional(v.boolean()),
      showSkipButton: v.optional(v.boolean()),
      showNextButton: v.optional(v.boolean()),
      triggerCondition: v.optional(v.union(
        v.literal("first-login"),
        v.literal("first-visit-page"),
        v.literal("manual")
      )),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const step = await ctx.db
      .query("coachMarkSteps")
      .withIndex("by_step_key", (q) => q.eq("stepKey", args.stepKey))
      .first();

    if (!step) {
      throw new Error(`Step with key "${args.stepKey}" not found`);
    }

    await ctx.db.patch(step._id, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a coach mark step.
 */
export const deleteStep = mutation({
  args: {
    stepKey: v.string(),
  },
  handler: async (ctx, args) => {
    const step = await ctx.db
      .query("coachMarkSteps")
      .withIndex("by_step_key", (q) => q.eq("stepKey", args.stepKey))
      .first();

    if (!step) {
      throw new Error(`Step with key "${args.stepKey}" not found`);
    }

    // Remove from sequence if part of one
    if (step.sequenceId) {
      const sequence = await ctx.db
        .query("coachMarkSequences")
        .withIndex("by_sequence_id", (q) => q.eq("sequenceId", step.sequenceId!))
        .first();

      if (sequence) {
        const newStepOrder = sequence.stepOrder.filter((key) => key !== args.stepKey);
        await ctx.db.patch(sequence._id, { stepOrder: newStepOrder });
      }
    }

    await ctx.db.delete(step._id);

    return { success: true };
  },
});

// =============================================================================
// SEQUENCE QUERIES
// =============================================================================

/**
 * Get all sequences.
 */
export const getAllSequences = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("coachMarkSequences").collect();
  },
});

/**
 * Get a single sequence by sequenceId.
 */
export const getSequence = query({
  args: {
    sequenceId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("coachMarkSequences")
      .withIndex("by_sequence_id", (q) => q.eq("sequenceId", args.sequenceId))
      .first();
  },
});

/**
 * Get sequence with all its steps populated.
 */
export const getSequenceWithSteps = query({
  args: {
    sequenceId: v.string(),
  },
  handler: async (ctx, args) => {
    const sequence = await ctx.db
      .query("coachMarkSequences")
      .withIndex("by_sequence_id", (q) => q.eq("sequenceId", args.sequenceId))
      .first();

    if (!sequence) {
      return null;
    }

    // Get all steps in order
    const steps = [];
    for (const stepKey of sequence.stepOrder) {
      const step = await ctx.db
        .query("coachMarkSteps")
        .withIndex("by_step_key", (q) => q.eq("stepKey", stepKey))
        .first();

      if (step) {
        steps.push(step);
      }
    }

    return { sequence, steps };
  },
});

// =============================================================================
// SEQUENCE MUTATIONS
// =============================================================================

/**
 * Create a new sequence.
 */
export const createSequence = mutation({
  args: {
    sequenceId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    stepOrder: v.array(v.string()),
    isOnboarding: v.boolean(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check for duplicate sequenceId
    const existing = await ctx.db
      .query("coachMarkSequences")
      .withIndex("by_sequence_id", (q) => q.eq("sequenceId", args.sequenceId))
      .first();

    if (existing) {
      throw new Error(`Sequence with id "${args.sequenceId}" already exists`);
    }

    // If this is onboarding, ensure no other onboarding sequences exist
    if (args.isOnboarding) {
      const existingOnboarding = await ctx.db
        .query("coachMarkSequences")
        .withIndex("by_onboarding", (q) => q.eq("isOnboarding", true))
        .first();

      if (existingOnboarding) {
        throw new Error("An onboarding sequence already exists. Set isOnboarding to false for the existing sequence first.");
      }
    }

    const now = Date.now();

    const sequenceDocId = await ctx.db.insert("coachMarkSequences", {
      ...args,
      createdAt: now,
    });

    return { success: true, sequenceDocId };
  },
});

/**
 * Update an existing sequence.
 */
export const updateSequence = mutation({
  args: {
    sequenceId: v.string(),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      stepOrder: v.optional(v.array(v.string())),
      isOnboarding: v.optional(v.boolean()),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const sequence = await ctx.db
      .query("coachMarkSequences")
      .withIndex("by_sequence_id", (q) => q.eq("sequenceId", args.sequenceId))
      .first();

    if (!sequence) {
      throw new Error(`Sequence with id "${args.sequenceId}" not found`);
    }

    // If setting isOnboarding to true, ensure no other onboarding sequences
    if (args.updates.isOnboarding === true && !sequence.isOnboarding) {
      const existingOnboarding = await ctx.db
        .query("coachMarkSequences")
        .withIndex("by_onboarding", (q) => q.eq("isOnboarding", true))
        .first();

      if (existingOnboarding && existingOnboarding._id !== sequence._id) {
        throw new Error("An onboarding sequence already exists. Set isOnboarding to false for the existing sequence first.");
      }
    }

    await ctx.db.patch(sequence._id, args.updates);

    return { success: true };
  },
});

/**
 * Delete a sequence.
 */
export const deleteSequence = mutation({
  args: {
    sequenceId: v.string(),
  },
  handler: async (ctx, args) => {
    const sequence = await ctx.db
      .query("coachMarkSequences")
      .withIndex("by_sequence_id", (q) => q.eq("sequenceId", args.sequenceId))
      .first();

    if (!sequence) {
      throw new Error(`Sequence with id "${args.sequenceId}" not found`);
    }

    // Remove sequenceId from all steps that reference it
    for (const stepKey of sequence.stepOrder) {
      const step = await ctx.db
        .query("coachMarkSteps")
        .withIndex("by_step_key", (q) => q.eq("stepKey", stepKey))
        .first();

      if (step) {
        await ctx.db.patch(step._id, {
          sequenceId: undefined,
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.delete(sequence._id);

    return { success: true };
  },
});

/**
 * Reorder steps within a sequence.
 */
export const reorderSequence = mutation({
  args: {
    sequenceId: v.string(),
    newStepOrder: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const sequence = await ctx.db
      .query("coachMarkSequences")
      .withIndex("by_sequence_id", (q) => q.eq("sequenceId", args.sequenceId))
      .first();

    if (!sequence) {
      throw new Error(`Sequence with id "${args.sequenceId}" not found`);
    }

    await ctx.db.patch(sequence._id, {
      stepOrder: args.newStepOrder,
    });

    // Update sequenceOrder on each step
    for (let i = 0; i < args.newStepOrder.length; i++) {
      const step = await ctx.db
        .query("coachMarkSteps")
        .withIndex("by_step_key", (q) => q.eq("stepKey", args.newStepOrder[i]))
        .first();

      if (step) {
        await ctx.db.patch(step._id, {
          sequenceOrder: i,
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

// =============================================================================
// PROGRESS QUERIES & MUTATIONS (Admin)
// =============================================================================

/**
 * Get all user progress records.
 */
export const getAllProgress = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("coachMarkProgress").collect();
  },
});

/**
 * Get progress for a specific corporation.
 */
export const getProgressByCorporation = query({
  args: {
    corporationId: v.id("corporations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("coachMarkProgress")
      .withIndex("by_corporation", (q) => q.eq("corporationId", args.corporationId))
      .first();
  },
});

/**
 * Reset a user's tutorial progress (for testing).
 */
export const resetProgress = mutation({
  args: {
    corporationId: v.id("corporations"),
    fullReset: v.optional(v.boolean()), // If true, deletes record. If false, just clears progress.
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("coachMarkProgress")
      .withIndex("by_corporation", (q) => q.eq("corporationId", args.corporationId))
      .first();

    if (!progress) {
      return { success: true, message: "No progress record found" };
    }

    if (args.fullReset) {
      await ctx.db.delete(progress._id);
      return { success: true, message: "Progress record deleted" };
    }

    // Find onboarding sequence to restart it
    const onboardingSequence = await ctx.db
      .query("coachMarkSequences")
      .withIndex("by_onboarding", (q) => q.eq("isOnboarding", true))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    await ctx.db.patch(progress._id, {
      completedSteps: [],
      skippedSteps: [],
      currentSequence: onboardingSequence?.sequenceId,
      currentStepIndex: onboardingSequence ? 0 : undefined,
      tutorialCompleted: false,
      lastUpdated: Date.now(),
    });

    return { success: true, message: "Progress reset" };
  },
});

/**
 * Get tutorial completion stats.
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const allProgress = await ctx.db.query("coachMarkProgress").collect();
    const allSteps = await ctx.db.query("coachMarkSteps").collect();
    const allSequences = await ctx.db.query("coachMarkSequences").collect();

    const completed = allProgress.filter((p) => p.tutorialCompleted).length;
    const inProgress = allProgress.filter((p) => !p.tutorialCompleted && p.currentSequence).length;
    const notStarted = allProgress.filter((p) => !p.tutorialCompleted && !p.currentSequence).length;

    // Step completion rates
    const stepCompletionRates: Record<string, { completed: number; skipped: number; total: number }> = {};
    for (const step of allSteps) {
      const completedCount = allProgress.filter((p) => p.completedSteps.includes(step.stepKey)).length;
      const skippedCount = allProgress.filter((p) => p.skippedSteps.includes(step.stepKey)).length;
      stepCompletionRates[step.stepKey] = {
        completed: completedCount,
        skipped: skippedCount,
        total: allProgress.length,
      };
    }

    return {
      totalUsers: allProgress.length,
      completed,
      inProgress,
      notStarted,
      totalSteps: allSteps.length,
      activeSteps: allSteps.filter((s) => s.isActive).length,
      totalSequences: allSequences.length,
      activeSequences: allSequences.filter((s) => s.isActive).length,
      stepCompletionRates,
    };
  },
});
