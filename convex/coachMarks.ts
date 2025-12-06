/**
 * Coach Marks / Spotlight Tutorial System - User-Facing Functions
 *
 * Queries and mutations for the tutorial overlay system.
 * See COACH_MARKS.md for full documentation.
 */

import { v } from "convex/values";
import { query, mutation, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Advances to the next step in a sequence, or marks sequence complete.
 * Shared logic between markStepComplete and skipStep.
 */
async function advanceSequence(
  ctx: MutationCtx,
  progress: Doc<"coachMarkProgress">,
  step: Doc<"coachMarkSteps">,
  now: number
): Promise<void> {
  if (!step.sequenceId || progress.currentSequence !== step.sequenceId) {
    return;
  }

  const sequence = await ctx.db
    .query("coachMarkSequences")
    .withIndex("by_sequence_id", (q) => q.eq("sequenceId", step.sequenceId!))
    .first();

  if (!sequence) {
    return;
  }

  const currentIndex = progress.currentStepIndex ?? 0;
  const nextIndex = currentIndex + 1;

  if (nextIndex >= sequence.stepOrder.length) {
    // Sequence complete
    await ctx.db.patch(progress._id, {
      currentSequence: undefined,
      currentStepIndex: undefined,
      tutorialCompleted: sequence.isOnboarding ? true : progress.tutorialCompleted,
      lastUpdated: now,
    });
  } else {
    // Move to next step
    await ctx.db.patch(progress._id, {
      currentStepIndex: nextIndex,
      lastUpdated: now,
    });
  }
}

// =============================================================================
// QUERIES - Read tutorial state
// =============================================================================

/**
 * Get the current active step for a user on a specific page.
 * Returns the step that should be displayed, or null if no step is active.
 */
export const getActiveStep = query({
  args: {
    corporationId: v.optional(v.id("corporations")),
    currentRoute: v.string(),
  },
  handler: async (ctx, args) => {
    // If no corporation, can't show tutorials
    if (!args.corporationId) {
      return null;
    }

    // Get user's progress
    const progress = await ctx.db
      .query("coachMarkProgress")
      .withIndex("by_corporation", (q) => q.eq("corporationId", args.corporationId!))
      .first();

    // If user has completed all tutorials, return null
    if (progress?.tutorialCompleted) {
      return null;
    }

    // Check if user is in the middle of a sequence
    if (progress?.currentSequence) {
      // Get the sequence
      const sequence = await ctx.db
        .query("coachMarkSequences")
        .withIndex("by_sequence_id", (q) => q.eq("sequenceId", progress.currentSequence!))
        .first();

      if (sequence && sequence.isActive) {
        const currentIndex = progress.currentStepIndex ?? 0;
        const currentStepKey = sequence.stepOrder[currentIndex];

        if (currentStepKey) {
          // Get the step
          const step = await ctx.db
            .query("coachMarkSteps")
            .withIndex("by_step_key", (q) => q.eq("stepKey", currentStepKey))
            .first();

          // Only return if step is on current page and active
          if (step && step.isActive && step.pageRoute === args.currentRoute) {
            return {
              step,
              sequenceInfo: {
                sequenceId: sequence.sequenceId,
                currentIndex,
                totalSteps: sequence.stepOrder.length,
              },
            };
          }

          // If step is on different page, still return info so UI knows to wait
          if (step && step.isActive && step.pageRoute !== args.currentRoute) {
            return {
              waitingForRoute: step.pageRoute,
              sequenceInfo: {
                sequenceId: sequence.sequenceId,
                currentIndex,
                totalSteps: sequence.stepOrder.length,
              },
            };
          }
        }
      }
    }

    // No active sequence - check for first-login onboarding
    if (!progress) {
      // New user - find onboarding sequence
      const onboardingSequence = await ctx.db
        .query("coachMarkSequences")
        .withIndex("by_onboarding", (q) => q.eq("isOnboarding", true))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();

      if (onboardingSequence && onboardingSequence.stepOrder.length > 0) {
        const firstStepKey = onboardingSequence.stepOrder[0];
        const firstStep = await ctx.db
          .query("coachMarkSteps")
          .withIndex("by_step_key", (q) => q.eq("stepKey", firstStepKey))
          .first();

        if (firstStep && firstStep.isActive && firstStep.pageRoute === args.currentRoute) {
          return {
            step: firstStep,
            isNewUser: true,
            sequenceInfo: {
              sequenceId: onboardingSequence.sequenceId,
              currentIndex: 0,
              totalSteps: onboardingSequence.stepOrder.length,
            },
          };
        }

        // If first step is on different page, return waiting state
        if (firstStep && firstStep.isActive) {
          return {
            waitingForRoute: firstStep.pageRoute,
            isNewUser: true,
            sequenceInfo: {
              sequenceId: onboardingSequence.sequenceId,
              currentIndex: 0,
              totalSteps: onboardingSequence.stepOrder.length,
            },
          };
        }
      }
    }

    // Check for first-visit-page triggers
    const completedSteps = progress?.completedSteps ?? [];
    const skippedSteps = progress?.skippedSteps ?? [];
    const seenSteps = [...completedSteps, ...skippedSteps];

    const pageSteps = await ctx.db
      .query("coachMarkSteps")
      .withIndex("by_page_route", (q) => q.eq("pageRoute", args.currentRoute))
      .filter((q) =>
        q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("triggerCondition"), "first-visit-page")
        )
      )
      .collect();

    // Find first unseen step on this page
    for (const step of pageSteps) {
      if (!seenSteps.includes(step.stepKey)) {
        return { step };
      }
    }

    return null;
  },
});

/**
 * Get user's tutorial progress record.
 */
export const getUserProgress = query({
  args: {
    corporationId: v.optional(v.id("corporations")),
  },
  handler: async (ctx, args) => {
    if (!args.corporationId) {
      return null;
    }

    return await ctx.db
      .query("coachMarkProgress")
      .withIndex("by_corporation", (q) => q.eq("corporationId", args.corporationId!))
      .first();
  },
});

// =============================================================================
// MUTATIONS - Update tutorial progress
// =============================================================================

/**
 * Mark a step as completed and advance to next step (if in sequence).
 */
export const markStepComplete = mutation({
  args: {
    corporationId: v.id("corporations"),
    stepKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Get or create progress record
    let progress = await ctx.db
      .query("coachMarkProgress")
      .withIndex("by_corporation", (q) => q.eq("corporationId", args.corporationId))
      .first();

    const now = Date.now();

    if (!progress) {
      // Create new progress record
      await ctx.db.insert("coachMarkProgress", {
        corporationId: args.corporationId,
        completedSteps: [args.stepKey],
        skippedSteps: [],
        tutorialCompleted: false,
        lastUpdated: now,
      });

      // Check if this was part of onboarding sequence
      const step = await ctx.db
        .query("coachMarkSteps")
        .withIndex("by_step_key", (q) => q.eq("stepKey", args.stepKey))
        .first();

      if (step?.sequenceId) {
        // Start tracking sequence progress
        const sequence = await ctx.db
          .query("coachMarkSequences")
          .withIndex("by_sequence_id", (q) => q.eq("sequenceId", step.sequenceId!))
          .first();

        if (sequence) {
          const currentIndex = sequence.stepOrder.indexOf(args.stepKey);
          const nextIndex = currentIndex + 1;

          // Update with sequence info
          const newProgress = await ctx.db
            .query("coachMarkProgress")
            .withIndex("by_corporation", (q) => q.eq("corporationId", args.corporationId))
            .first();

          if (newProgress) {
            if (nextIndex >= sequence.stepOrder.length) {
              // Sequence complete
              await ctx.db.patch(newProgress._id, {
                currentSequence: undefined,
                currentStepIndex: undefined,
                tutorialCompleted: sequence.isOnboarding ? true : newProgress.tutorialCompleted,
                lastUpdated: now,
              });
            } else {
              // Move to next step
              await ctx.db.patch(newProgress._id, {
                currentSequence: step.sequenceId,
                currentStepIndex: nextIndex,
                lastUpdated: now,
              });
            }
          }
        }
      }

      return { success: true, newStep: true };
    }

    // Update existing progress - add step to completed list
    const completedSteps = progress.completedSteps.includes(args.stepKey)
      ? progress.completedSteps
      : [...progress.completedSteps, args.stepKey];

    await ctx.db.patch(progress._id, {
      completedSteps,
      lastUpdated: now,
    });

    // Advance sequence if in one
    const step = await ctx.db
      .query("coachMarkSteps")
      .withIndex("by_step_key", (q) => q.eq("stepKey", args.stepKey))
      .first();

    if (step) {
      // Re-fetch progress since we just patched it
      const updatedProgress = await ctx.db
        .query("coachMarkProgress")
        .withIndex("by_corporation", (q) => q.eq("corporationId", args.corporationId))
        .first();

      if (updatedProgress) {
        await advanceSequence(ctx, updatedProgress, step, now);
      }
    }

    return { success: true };
  },
});

/**
 * Skip a step (if allowed) and advance to next step.
 */
export const skipStep = mutation({
  args: {
    corporationId: v.id("corporations"),
    stepKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the step to check if skipping is allowed
    const step = await ctx.db
      .query("coachMarkSteps")
      .withIndex("by_step_key", (q) => q.eq("stepKey", args.stepKey))
      .first();

    if (!step) {
      return { success: false, error: "Step not found" };
    }

    // Check if step can be skipped
    if (step.isMandatory && !step.showSkipButton && !step.allowBackdropClick) {
      return { success: false, error: "This step cannot be skipped" };
    }

    // Get or create progress record
    let progress = await ctx.db
      .query("coachMarkProgress")
      .withIndex("by_corporation", (q) => q.eq("corporationId", args.corporationId))
      .first();

    const now = Date.now();

    if (!progress) {
      // Create new progress record with skipped step
      await ctx.db.insert("coachMarkProgress", {
        corporationId: args.corporationId,
        completedSteps: [],
        skippedSteps: [args.stepKey],
        tutorialCompleted: false,
        lastUpdated: now,
      });
    } else {
      // Update existing progress
      const skippedSteps = progress.skippedSteps.includes(args.stepKey)
        ? progress.skippedSteps
        : [...progress.skippedSteps, args.stepKey];

      await ctx.db.patch(progress._id, {
        skippedSteps,
        lastUpdated: now,
      });
    }

    // Advance sequence if in one
    const updatedProgress = await ctx.db
      .query("coachMarkProgress")
      .withIndex("by_corporation", (q) => q.eq("corporationId", args.corporationId))
      .first();

    if (updatedProgress) {
      await advanceSequence(ctx, updatedProgress, step, now);
    }

    return { success: true };
  },
});

/**
 * Skip entire sequence (if any steps allow skipping).
 */
export const skipSequence = mutation({
  args: {
    corporationId: v.id("corporations"),
    sequenceId: v.string(),
  },
  handler: async (ctx, args) => {
    const sequence = await ctx.db
      .query("coachMarkSequences")
      .withIndex("by_sequence_id", (q) => q.eq("sequenceId", args.sequenceId))
      .first();

    if (!sequence) {
      return { success: false, error: "Sequence not found" };
    }

    // Check if any step in sequence is mandatory without skip
    for (const stepKey of sequence.stepOrder) {
      const step = await ctx.db
        .query("coachMarkSteps")
        .withIndex("by_step_key", (q) => q.eq("stepKey", stepKey))
        .first();

      if (step?.isMandatory && !step.showSkipButton && !step.allowBackdropClick) {
        return { success: false, error: "Sequence contains mandatory steps that cannot be skipped" };
      }
    }

    // Get or create progress record
    let progress = await ctx.db
      .query("coachMarkProgress")
      .withIndex("by_corporation", (q) => q.eq("corporationId", args.corporationId))
      .first();

    const now = Date.now();

    if (!progress) {
      await ctx.db.insert("coachMarkProgress", {
        corporationId: args.corporationId,
        completedSteps: [],
        skippedSteps: sequence.stepOrder,
        tutorialCompleted: sequence.isOnboarding,
        lastUpdated: now,
      });
    } else {
      const skippedSteps = [...new Set([...progress.skippedSteps, ...sequence.stepOrder])];

      await ctx.db.patch(progress._id, {
        skippedSteps,
        currentSequence: undefined,
        currentStepIndex: undefined,
        tutorialCompleted: sequence.isOnboarding ? true : progress.tutorialCompleted,
        lastUpdated: now,
      });
    }

    return { success: true };
  },
});

/**
 * Start a sequence for a user (for manual triggers).
 */
export const startSequence = mutation({
  args: {
    corporationId: v.id("corporations"),
    sequenceId: v.string(),
  },
  handler: async (ctx, args) => {
    const sequence = await ctx.db
      .query("coachMarkSequences")
      .withIndex("by_sequence_id", (q) => q.eq("sequenceId", args.sequenceId))
      .first();

    if (!sequence || !sequence.isActive) {
      return { success: false, error: "Sequence not found or inactive" };
    }

    if (sequence.stepOrder.length === 0) {
      return { success: false, error: "Sequence has no steps" };
    }

    let progress = await ctx.db
      .query("coachMarkProgress")
      .withIndex("by_corporation", (q) => q.eq("corporationId", args.corporationId))
      .first();

    const now = Date.now();

    if (!progress) {
      await ctx.db.insert("coachMarkProgress", {
        corporationId: args.corporationId,
        completedSteps: [],
        skippedSteps: [],
        currentSequence: args.sequenceId,
        currentStepIndex: 0,
        tutorialCompleted: false,
        lastUpdated: now,
      });
    } else {
      await ctx.db.patch(progress._id, {
        currentSequence: args.sequenceId,
        currentStepIndex: 0,
        lastUpdated: now,
      });
    }

    return { success: true };
  },
});

/**
 * Initialize progress for a new user (creates record and starts onboarding if exists).
 */
export const initializeProgress = mutation({
  args: {
    corporationId: v.id("corporations"),
  },
  handler: async (ctx, args) => {
    // Check if progress already exists
    const existing = await ctx.db
      .query("coachMarkProgress")
      .withIndex("by_corporation", (q) => q.eq("corporationId", args.corporationId))
      .first();

    if (existing) {
      return { success: true, alreadyExists: true };
    }

    // Find onboarding sequence
    const onboardingSequence = await ctx.db
      .query("coachMarkSequences")
      .withIndex("by_onboarding", (q) => q.eq("isOnboarding", true))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    const now = Date.now();

    await ctx.db.insert("coachMarkProgress", {
      corporationId: args.corporationId,
      completedSteps: [],
      skippedSteps: [],
      currentSequence: onboardingSequence?.sequenceId,
      currentStepIndex: onboardingSequence ? 0 : undefined,
      tutorialCompleted: false,
      lastUpdated: now,
    });

    return { success: true, startedOnboarding: !!onboardingSequence };
  },
});
