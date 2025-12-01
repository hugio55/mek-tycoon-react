import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Component Library System Schema
 *
 * This schema supports an AI-assisted component library where:
 * 1. User pastes code from component libraries
 * 2. AI transforms it to React/TypeScript
 * 3. User previews and iterates
 * 4. Component is saved and reusable across the site
 * 5. System learns user preferences over time
 */

export const componentLibraryTables = {
  // ============================================================================
  // COMPONENT STORAGE
  // ============================================================================

  /**
   * Main component storage - stores the final, production-ready components
   */
  components: defineTable({
    // Identity
    name: v.string(), // User-friendly name (e.g., "Industrial Card", "Yellow Button")
    slug: v.string(), // URL-safe identifier (e.g., "industrial-card", "yellow-button")
    description: v.optional(v.string()), // What this component does

    // Code
    code: v.string(), // Final React/TypeScript code
    props: v.optional(v.string()), // TypeScript interface for props (as string)
    dependencies: v.optional(v.array(v.string())), // Required npm packages
    imports: v.optional(v.array(v.string())), // Required import statements

    // Organization
    category: v.string(), // "button", "card", "modal", "form", "layout", etc.
    tags: v.array(v.string()), // ["industrial", "yellow", "glass-morphism", etc.]
    isPublic: v.boolean(), // Whether this component is available site-wide

    // Visual
    previewImage: v.optional(v.string()), // Base64 or storage URL for preview thumbnail
    primaryColor: v.optional(v.string()), // Dominant color (for filtering)

    // Usage tracking
    usageCount: v.number(), // How many times this component has been used
    lastUsed: v.optional(v.number()), // Timestamp of last usage

    // Version control
    currentVersion: v.number(), // Current version number (1, 2, 3, etc.)
    isArchived: v.boolean(), // Soft delete - component no longer available but preserved

    // Original source tracking
    originalSourceType: v.optional(v.string()), // "tailwind", "bootstrap", "material-ui", "custom"
    originalSourceUrl: v.optional(v.string()), // URL of original component if applicable

    // AI transformation metadata
    transformationStrategy: v.optional(v.string()), // Which AI approach was used
    userSatisfactionRating: v.optional(v.number()), // 1-5 stars, if user rated it

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.string()), // User ID if multi-user support added later
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"])
    .index("by_usage", ["usageCount"])
    .index("by_last_used", ["lastUsed"])
    .index("by_created", ["createdAt"])
    .index("by_public", ["isPublic"])
    .index("by_archived", ["isArchived"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["category", "isPublic", "isArchived"]
    })
    .searchIndex("search_tags", {
      searchField: "tags",
      filterFields: ["category", "isPublic"]
    }),

  // ============================================================================
  // VERSION HISTORY
  // ============================================================================

  /**
   * Component version history - tracks all iterations of a component
   */
  componentVersions: defineTable({
    componentId: v.id("components"), // Reference to parent component
    versionNumber: v.number(), // 1, 2, 3, etc.

    // Snapshot of component at this version
    code: v.string(),
    props: v.optional(v.string()),
    dependencies: v.optional(v.array(v.string())),

    // Change tracking
    changeDescription: v.optional(v.string()), // What changed in this version
    changeType: v.string(), // "initial", "bugfix", "enhancement", "refactor", "style"

    // Comparison with previous version
    previousVersionId: v.optional(v.id("componentVersions")),
    linesAdded: v.optional(v.number()),
    linesRemoved: v.optional(v.number()),

    // Metadata
    createdAt: v.number(),
    createdBy: v.optional(v.string()),
  })
    .index("by_component", ["componentId"])
    .index("by_component_version", ["componentId", "versionNumber"])
    .index("by_created", ["createdAt"]),

  // ============================================================================
  // TRANSFORMATION HISTORY (AI LEARNING DATA)
  // ============================================================================

  /**
   * Tracks every transformation attempt - critical for AI learning
   */
  transformationHistory: defineTable({
    // Link to final component (if transformation succeeded)
    componentId: v.optional(v.id("components")),

    // Original input
    originalCode: v.string(), // What user pasted
    originalSourceType: v.string(), // "html/css", "tailwind", "bootstrap", etc.

    // AI transformation process
    aiModel: v.string(), // "claude-3.5-sonnet", etc.
    transformationPrompt: v.string(), // Exact prompt sent to AI

    // AI output
    transformedCode: v.string(), // What AI generated
    transformationTime: v.number(), // How long transformation took (ms)

    // User feedback and corrections
    userFeedback: v.optional(v.string()), // "Make it more yellow", "Use sharp borders", etc.
    correctionsMade: v.optional(v.array(v.object({
      issueType: v.string(), // "color", "spacing", "structure", "naming", etc.
      originalValue: v.string(),
      correctedValue: v.string(),
      timestamp: v.number(),
    }))),

    // Iteration tracking
    iterationNumber: v.number(), // 1st attempt, 2nd attempt, etc.
    isSuccessful: v.boolean(), // Did user accept this version?

    // Learning signals
    colorMappings: v.optional(v.array(v.object({
      sourceColor: v.string(), // "#3b82f6" (original)
      targetColor: v.string(), // "#fab617" (user's preference)
    }))),

    classNamePatterns: v.optional(v.array(v.object({
      sourcePattern: v.string(), // "rounded-lg"
      targetPattern: v.string(), // "mek-border-sharp-gold"
    }))),

    structuralChanges: v.optional(v.array(v.object({
      changeType: v.string(), // "added_portal", "changed_positioning", etc.
      reason: v.string(),
    }))),

    // Metadata
    createdAt: v.number(),
    sessionId: v.optional(v.string()), // Group transformations from same session
  })
    .index("by_component", ["componentId"])
    .index("by_successful", ["isSuccessful"])
    .index("by_session", ["sessionId"])
    .index("by_created", ["createdAt"])
    .index("by_source_type", ["originalSourceType"]),

  // ============================================================================
  // USER PREFERENCES (AI LEARNING SYSTEM)
  // ============================================================================

  /**
   * Persistent user preferences learned from transformation corrections
   */
  userPreferences: defineTable({
    // Preference type
    preferenceType: v.string(), // "color", "className", "structure", "naming", "pattern"

    // Preference data
    sourcePattern: v.string(), // What pattern to look for in source code
    targetPattern: v.string(), // What to replace it with

    // Context
    context: v.optional(v.string()), // When to apply this preference
    priority: v.number(), // Higher priority preferences applied first

    // Confidence scoring
    timesApplied: v.number(), // How many times this preference has been used
    timesCorrect: v.number(), // How many times user accepted result
    confidenceScore: v.number(), // timesCorrect / timesApplied

    // Examples from history
    exampleTransformations: v.optional(v.array(v.id("transformationHistory"))),

    // Metadata
    createdAt: v.number(),
    lastUsed: v.optional(v.number()),
    userId: v.optional(v.string()), // For multi-user support
  })
    .index("by_type", ["preferenceType"])
    .index("by_confidence", ["confidenceScore"])
    .index("by_priority", ["priority"])
    .index("by_last_used", ["lastUsed"])
    .index("by_user", ["userId"]),

  // ============================================================================
  // COMPONENT USAGE TRACKING
  // ============================================================================

  /**
   * Tracks where components are used across the site
   */
  componentUsage: defineTable({
    componentId: v.id("components"), // Which component
    componentVersionId: v.id("componentVersions"), // Which version is being used

    // Location information
    pageRoute: v.string(), // "/home", "/profile", "/crafting", etc.
    pageSection: v.optional(v.string()), // "header", "sidebar", "modal", etc.
    componentInstance: v.string(), // Unique identifier for this specific usage

    // Props used
    propsSnapshot: v.optional(v.string()), // JSON string of props passed to component

    // Status
    isActive: v.boolean(), // Is this usage still active or was it removed?

    // Metadata
    firstUsed: v.number(),
    lastChecked: v.number(),
    removedAt: v.optional(v.number()),
  })
    .index("by_component", ["componentId"])
    .index("by_page", ["pageRoute"])
    .index("by_active", ["isActive"])
    .index("by_component_active", ["componentId", "isActive"])
    .index("by_page_active", ["pageRoute", "isActive"]),

  // ============================================================================
  // COMPONENT TESTING/PREVIEW DATA
  // ============================================================================

  /**
   * Stores test states and preview configurations for components
   */
  componentPreviewStates: defineTable({
    componentId: v.id("components"), // Which component this preview is for

    // Preview configuration
    name: v.string(), // "Default", "With Long Text", "Error State", etc.
    description: v.optional(v.string()),

    // Test props
    testProps: v.string(), // JSON string of props to test with

    // Expected behavior
    expectedBehavior: v.optional(v.string()), // Description of what should happen

    // Visual regression testing
    screenshotUrl: v.optional(v.string()), // Reference screenshot for comparison

    // Metadata
    createdAt: v.number(),
    lastTested: v.optional(v.number()),
    isPrimary: v.boolean(), // Is this the default preview state?
  })
    .index("by_component", ["componentId"])
    .index("by_primary", ["isPrimary"])
    .index("by_created", ["createdAt"]),

  // ============================================================================
  // COMPONENT COLLECTIONS
  // ============================================================================

  /**
   * Organize components into collections (like "Industrial Theme", "Forms", etc.)
   */
  componentCollections: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    slug: v.string(),

    // Components in this collection
    componentIds: v.array(v.id("components")),

    // Organization
    isSystem: v.boolean(), // System-defined collections vs user-created
    order: v.number(), // Display order

    // Visual
    thumbnailUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_system", ["isSystem"])
    .index("by_order", ["order"]),

  // ============================================================================
  // TRANSFORMATION SESSIONS
  // ============================================================================

  /**
   * Groups related transformation attempts into sessions
   */
  transformationSessions: defineTable({
    // Session identity
    sessionId: v.string(), // UUID for grouping transformations

    // Session context
    goal: v.optional(v.string()), // What user was trying to achieve
    sourceLibrary: v.optional(v.string()), // "tailwindui", "shadcn", "custom", etc.

    // Session outcome
    finalComponentId: v.optional(v.id("components")), // If successful
    totalIterations: v.number(), // How many attempts in this session
    wasSuccessful: v.boolean(),

    // Learning insights
    majorChallenges: v.optional(v.array(v.string())), // Common issues encountered
    keyLearnings: v.optional(v.array(v.string())), // What AI learned from this session

    // Metadata
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    durationMs: v.optional(v.number()),
  })
    .index("by_session_id", ["sessionId"])
    .index("by_successful", ["wasSuccessful"])
    .index("by_started", ["startedAt"])
    .index("by_final_component", ["finalComponentId"]),
};

/**
 * Example Queries for Common Operations
 *
 * 1. Get all components in a category:
 *    ctx.db.query("components")
 *      .withIndex("by_category", q => q.eq("category", "button"))
 *      .filter(q => q.eq(q.field("isArchived"), false))
 *      .collect()
 *
 * 2. Get most used components:
 *    ctx.db.query("components")
 *      .withIndex("by_usage")
 *      .order("desc")
 *      .take(10)
 *
 * 3. Get component with all versions:
 *    const component = await ctx.db.get(componentId);
 *    const versions = await ctx.db.query("componentVersions")
 *      .withIndex("by_component", q => q.eq("componentId", componentId))
 *      .order("desc")
 *      .collect()
 *
 * 4. Get all transformations for learning:
 *    ctx.db.query("transformationHistory")
 *      .withIndex("by_successful", q => q.eq("isSuccessful", true))
 *      .collect()
 *
 * 5. Get user's color preferences:
 *    ctx.db.query("userPreferences")
 *      .withIndex("by_type", q => q.eq("preferenceType", "color"))
 *      .filter(q => q.gt(q.field("confidenceScore"), 0.8))
 *      .collect()
 *
 * 6. Find where a component is used:
 *    ctx.db.query("componentUsage")
 *      .withIndex("by_component_active", q =>
 *        q.eq("componentId", componentId).eq("isActive", true))
 *      .collect()
 *
 * 7. Search components by name:
 *    ctx.db.query("components")
 *      .withSearchIndex("search_name", q => q.search("name", searchTerm))
 *      .filter(q => q.eq(q.field("isPublic"), true))
 *      .collect()
 *
 * 8. Get transformation session history:
 *    const session = await ctx.db.query("transformationSessions")
 *      .withIndex("by_session_id", q => q.eq("sessionId", sessionId))
 *      .first();
 *    const transformations = await ctx.db.query("transformationHistory")
 *      .withIndex("by_session", q => q.eq("sessionId", sessionId))
 *      .collect()
 */
