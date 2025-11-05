/**
 * Practical Examples - Component Library System
 *
 * Real-world code examples showing how to use the component library system.
 */

// ============================================================================
// EXAMPLE 1: Complete Transformation Workflow
// ============================================================================

/**
 * User pastes Tailwind UI button and AI transforms it to industrial style
 */
async function completeTransformationWorkflow() {
  const sessionId = crypto.randomUUID();

  // Step 1: User pastes original code
  const originalCode = `
<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
  Click me
</button>
  `.trim();

  // Step 2: Fetch learned preferences for color transformation
  const colorPrefs = await getUserPreferences({
    preferenceType: "color",
    minConfidence: 0.7,
  });
  // Returns: [{ sourcePattern: "#3b82f6", targetPattern: "#fab617", ... }]

  // Step 3: AI transforms code using preferences
  const transformedCode = `
import React from 'react';

interface IndustrialButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const IndustrialButton: React.FC<IndustrialButtonProps> = ({
  label,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-yellow-500 hover:bg-yellow-600 text-black font-orbitron
                 font-bold py-2 px-4 mek-border-sharp-gold uppercase tracking-wider
                 transition-all duration-200 disabled:opacity-50"
    >
      {label}
    </button>
  );
};
  `.trim();

  // Step 4: Record transformation attempt
  const transformationId = await recordTransformation({
    sessionId,
    originalCode,
    originalSourceType: "tailwind",
    aiModel: "claude-3.5-sonnet",
    transformationPrompt: "Convert to React with Mek Tycoon industrial styling",
    transformedCode,
    transformationTime: 1500,
    iterationNumber: 1,
    isSuccessful: false, // User will review
    colorMappings: [
      { sourceColor: "#3b82f6", targetColor: "#fab617" },
      { sourceColor: "blue-500", targetColor: "yellow-500" },
    ],
    classNamePatterns: [
      { sourcePattern: "rounded", targetPattern: "mek-border-sharp-gold" },
    ],
  });

  // Step 5: User previews and gives feedback
  const userFeedback = "Good! But needs glass-morphism background";

  // Step 6: Record correction
  await addTransformationCorrection({
    transformationId,
    issueType: "style",
    originalValue: "bg-yellow-500",
    correctedValue: "bg-yellow-500/20 backdrop-blur-md",
  });

  // Step 7: AI re-transforms with correction
  const improvedCode = `
// ... same as before but with glass-morphism ...
className="bg-yellow-500/20 backdrop-blur-md border-2 border-yellow-500/50
           hover:bg-yellow-600/30 text-yellow-500 font-orbitron font-bold
           py-2 px-4 mek-border-sharp-gold uppercase tracking-wider
           transition-all duration-200 disabled:opacity-50"
  `.trim();

  // Step 8: Record successful attempt
  await recordTransformation({
    sessionId,
    originalCode,
    originalSourceType: "tailwind",
    aiModel: "claude-3.5-sonnet",
    transformationPrompt:
      "Convert to React with Mek Tycoon industrial styling (glass-morphism)",
    transformedCode: improvedCode,
    transformationTime: 1200,
    iterationNumber: 2,
    isSuccessful: true, // User accepts!
  });

  // Step 9: Save component
  const componentId = await createComponent({
    name: "Industrial Glass Button",
    slug: "industrial-glass-button",
    description: "Yellow glass-morphism button with sharp gold borders",
    code: improvedCode,
    props: `
interface IndustrialButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}
    `.trim(),
    dependencies: ["react"],
    imports: ["import React from 'react';"],
    category: "button",
    tags: ["industrial", "yellow", "glass-morphism", "primary"],
    isPublic: true,
    primaryColor: "#fab617",
    originalSourceType: "tailwind",
    transformationStrategy: "color-mapping + style-patterns",
  });

  // Step 10: Learn from this success
  await upsertUserPreference({
    preferenceType: "style",
    sourcePattern: "bg-[color]",
    targetPattern: "bg-[color]/20 backdrop-blur-md border-2 border-[color]/50",
    context: "button backgrounds",
    priority: 15,
    wasCorrect: true,
  });

  return componentId;
}

// ============================================================================
// EXAMPLE 2: Using Component in a Page
// ============================================================================

/**
 * User wants to use the industrial button on the home page
 */
async function useComponentInPage() {
  // Step 1: Find the component
  const button = await getComponentBySlug({
    slug: "industrial-glass-button",
  });

  if (!button) throw new Error("Component not found");

  // Step 2: Register usage
  await registerComponentUsage({
    componentId: button._id,
    pageRoute: "/home",
    pageSection: "header",
    componentInstance: "save-game-button",
    propsSnapshot: JSON.stringify({
      label: "Save Game",
      disabled: false,
    }),
  });

  // Step 3: Increment usage counter
  await recordComponentUsage({ componentId: button._id });

  // Now render in React:
  // import { IndustrialButton } from '@/components/IndustrialButton';
  // <IndustrialButton label="Save Game" onClick={handleSave} />
}

// ============================================================================
// EXAMPLE 3: Updating a Component Safely
// ============================================================================

/**
 * User wants to add a loading state to the button
 */
async function updateComponentSafely() {
  const slug = "industrial-glass-button";

  // Step 1: Find component
  const button = await getComponentBySlug({ slug });
  if (!button) throw new Error("Component not found");

  // Step 2: Check where it's used
  const usages = await getComponentUsages({ componentId: button._id });
  console.log(`⚠️ This component is used in ${usages.length} places:`);
  usages.forEach((usage) => {
    console.log(`  - ${usage.pageRoute} (${usage.pageSection})`);
  });

  // Step 3: Updated code with loading state
  const updatedCode = `
import React from 'react';

interface IndustrialButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean; // NEW!
}

export const IndustrialButton: React.FC<IndustrialButtonProps> = ({
  label,
  onClick,
  disabled = false,
  loading = false, // NEW!
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="bg-yellow-500/20 backdrop-blur-md border-2 border-yellow-500/50
                 hover:bg-yellow-600/30 text-yellow-500 font-orbitron font-bold
                 py-2 px-4 mek-border-sharp-gold uppercase tracking-wider
                 transition-all duration-200 disabled:opacity-50
                 relative"
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="animate-spin">⚙️</span>
        </span>
      )}
      <span className={loading ? 'opacity-0' : ''}>{label}</span>
    </button>
  );
};
  `.trim();

  // Step 4: Update with new version
  const newVersionId = await updateComponent({
    componentId: button._id,
    code: updatedCode,
    props: `
interface IndustrialButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}
    `.trim(),
    changeDescription: "Added loading state with animated gear icon",
    changeType: "enhancement",
  });

  console.log(`✅ Component updated to version ${button.currentVersion + 1}`);
  console.log(`ℹ️ All ${usages.length} usages now reference the new version`);

  return newVersionId;
}

// ============================================================================
// EXAMPLE 4: Building a Component Library UI
// ============================================================================

/**
 * Query functions for a component library page
 */
async function componentLibraryPageQueries() {
  // Get all categories
  const categories = [
    "button",
    "card",
    "modal",
    "form",
    "layout",
    "navigation",
  ];

  // Get components by category with counts
  const categorizedComponents = await Promise.all(
    categories.map(async (category) => {
      const components = await getComponentsByCategory({ category });
      return {
        category,
        count: components.length,
        components,
      };
    })
  );

  // Get most used components
  const mostUsed = await getMostUsedComponents({ limit: 10 });

  // Get recently added
  const recentComponents = await ctx.db
    .query("components")
    .withIndex("by_created")
    .order("desc")
    .filter((q) => q.eq(q.field("isArchived"), false))
    .take(10);

  // Get recently used
  const recentlyUsed = await getRecentlyUsedComponents({ limit: 10 });

  return {
    categories: categorizedComponents,
    mostUsed,
    recentComponents,
    recentlyUsed,
  };
}

// ============================================================================
// EXAMPLE 5: AI Learning from Patterns
// ============================================================================

/**
 * Extract learning patterns from successful transformations
 */
async function extractLearningPatterns() {
  // Get all successful transformations
  const successful = await getSuccessfulTransformations({});

  // Analyze color preferences
  const colorPatterns = new Map<string, { count: number; target: string }>();

  successful.forEach((transformation) => {
    transformation.colorMappings?.forEach((mapping) => {
      const key = mapping.sourceColor;
      const existing = colorPatterns.get(key) || { count: 0, target: "" };
      colorPatterns.set(key, {
        count: existing.count + 1,
        target: mapping.targetColor,
      });
    });
  });

  // Create preferences for high-confidence patterns
  for (const [source, data] of colorPatterns.entries()) {
    if (data.count >= 3) {
      // Seen at least 3 times
      await upsertUserPreference({
        preferenceType: "color",
        sourcePattern: source,
        targetPattern: data.target,
        priority: data.count, // Higher count = higher priority
        wasCorrect: true,
      });
    }
  }

  // Get transformation stats
  const stats = await getTransformationStats({});
  console.log("Transformation success rates by source:", stats);

  return { colorPatterns, stats };
}

// ============================================================================
// EXAMPLE 6: Component Collections
// ============================================================================

/**
 * Organize components into themed collections
 */
async function createIndustrialCollection() {
  // Find all industrial-themed components
  const industrialComponents = await ctx.db
    .query("components")
    .withSearchIndex("search_tags", (q) => q.search("tags", "industrial"))
    .filter((q) => q.eq(q.field("isArchived"), false))
    .collect();

  // Create collection
  const collectionId = await ctx.db.insert("componentCollections", {
    name: "Industrial Theme",
    slug: "industrial-theme",
    description: "Yellow and black industrial-styled components for Mek Tycoon",
    componentIds: industrialComponents.map((c) => c._id),
    isSystem: true, // System-defined collection
    order: 1,
    primaryColor: "#fab617",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  return collectionId;
}

// ============================================================================
// EXAMPLE 7: Preview States for Testing
// ============================================================================

/**
 * Create preview states for a button component
 */
async function createButtonPreviewStates(componentId: Id<"components">) {
  // Default state
  await ctx.db.insert("componentPreviewStates", {
    componentId,
    name: "Default",
    description: "Normal button state",
    testProps: JSON.stringify({ label: "Click Me" }),
    isPrimary: true,
    createdAt: Date.now(),
  });

  // Loading state
  await ctx.db.insert("componentPreviewStates", {
    componentId,
    name: "Loading",
    description: "Button in loading state",
    testProps: JSON.stringify({ label: "Saving...", loading: true }),
    isPrimary: false,
    createdAt: Date.now(),
  });

  // Disabled state
  await ctx.db.insert("componentPreviewStates", {
    componentId,
    name: "Disabled",
    description: "Button disabled",
    testProps: JSON.stringify({ label: "Disabled", disabled: true }),
    isPrimary: false,
    createdAt: Date.now(),
  });

  // Long text state
  await ctx.db.insert("componentPreviewStates", {
    componentId,
    name: "Long Text",
    description: "Button with very long label",
    testProps: JSON.stringify({
      label: "This is a very long button label that might wrap",
    }),
    isPrimary: false,
    createdAt: Date.now(),
  });
}

// ============================================================================
// EXAMPLE 8: Analytics & Insights
// ============================================================================

/**
 * Generate analytics dashboard data
 */
async function generateAnalyticsDashboard() {
  // Total components
  const totalComponents = await ctx.db
    .query("components")
    .filter((q) => q.eq(q.field("isArchived"), false))
    .collect();

  // Most used
  const mostUsed = await getMostUsedComponents({ limit: 5 });

  // Least used (candidates for archiving)
  const leastUsed = await ctx.db
    .query("components")
    .withIndex("by_usage")
    .order("asc")
    .filter((q) => q.eq(q.field("isArchived"), false))
    .take(5);

  // Transformation success rate
  const allTransformations = await ctx.db
    .query("transformationHistory")
    .collect();

  const successRate =
    (allTransformations.filter((t) => t.isSuccessful).length /
      allTransformations.length) *
    100;

  // Average iterations per component
  const sessions = await ctx.db.query("transformationSessions").collect();
  const avgIterations =
    sessions.reduce((sum, s) => sum + s.totalIterations, 0) / sessions.length;

  // User preferences by type
  const preferences = await ctx.db.query("userPreferences").collect();
  const prefsByType = preferences.reduce(
    (acc, pref) => {
      acc[pref.preferenceType] = (acc[pref.preferenceType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalComponents: totalComponents.length,
    totalTransformations: allTransformations.length,
    successRate: successRate.toFixed(1) + "%",
    avgIterations: avgIterations.toFixed(1),
    mostUsed: mostUsed.map((c) => ({
      name: c.name,
      usageCount: c.usageCount,
    })),
    leastUsed: leastUsed.map((c) => ({
      name: c.name,
      usageCount: c.usageCount,
    })),
    learnedPreferences: prefsByType,
  };
}

// ============================================================================
// EXAMPLE 9: Version History & Rollback
// ============================================================================

/**
 * View version history and rollback if needed
 */
async function viewVersionHistoryAndRollback(componentId: Id<"components">) {
  // Get all versions
  const versions = await ctx.db
    .query("componentVersions")
    .withIndex("by_component", (q) => q.eq("componentId", componentId))
    .order("desc")
    .collect();

  console.log(`Component has ${versions.length} versions:`);
  versions.forEach((v) => {
    console.log(
      `  v${v.versionNumber}: ${v.changeType} - ${v.changeDescription}`
    );
  });

  // Rollback to version 2 (for example)
  const targetVersion = versions.find((v) => v.versionNumber === 2);
  if (!targetVersion) throw new Error("Version not found");

  const component = await ctx.db.get(componentId);
  if (!component) throw new Error("Component not found");

  // Create new version (rollback)
  await updateComponent({
    componentId,
    code: targetVersion.code,
    props: targetVersion.props,
    dependencies: targetVersion.dependencies,
    changeDescription: `Rolled back to version ${targetVersion.versionNumber}`,
    changeType: "refactor",
  });

  console.log(`✅ Rolled back to version ${targetVersion.versionNumber}`);
}

// ============================================================================
// EXAMPLE 10: Bulk Import from Existing Codebase
// ============================================================================

/**
 * Import existing components into the library
 */
async function bulkImportExistingComponents() {
  const existingComponents = [
    {
      name: "Save Button",
      code: `// existing code...`,
      category: "button",
      tags: ["save", "green", "primary"],
    },
    {
      name: "Delete Button",
      code: `// existing code...`,
      category: "button",
      tags: ["delete", "red", "danger"],
    },
    // ... more components
  ];

  const imported: Id<"components">[] = [];

  for (const comp of existingComponents) {
    const id = await createComponent({
      name: comp.name,
      slug: comp.name.toLowerCase().replace(/\s+/g, "-"),
      code: comp.code,
      category: comp.category,
      tags: comp.tags,
      isPublic: true,
      originalSourceType: "existing-codebase",
    });

    imported.push(id);
  }

  console.log(`✅ Imported ${imported.length} components`);
  return imported;
}

export {
  completeTransformationWorkflow,
  useComponentInPage,
  updateComponentSafely,
  componentLibraryPageQueries,
  extractLearningPatterns,
  createIndustrialCollection,
  createButtonPreviewStates,
  generateAnalyticsDashboard,
  viewVersionHistoryAndRollback,
  bulkImportExistingComponents,
};
