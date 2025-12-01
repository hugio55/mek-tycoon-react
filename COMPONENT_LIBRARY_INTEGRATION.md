# Component Library System - Integration Guide

## Overview
This document explains how to integrate the Component Library system into your existing Mek Tycoon Convex schema.

## Schema Architecture

### Core Tables (8 tables total)

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMPONENT LIBRARY SYSTEM                     │
└─────────────────────────────────────────────────────────────────┘

1. COMPONENTS (Production Storage)
   ├─> componentVersions (Version History)
   ├─> componentUsage (Usage Tracking)
   ├─> componentPreviewStates (Testing)
   └─> transformationHistory (Learning Data)

2. TRANSFORMATION HISTORY (AI Learning)
   └─> userPreferences (Learned Patterns)

3. TRANSFORMATION SESSIONS (Grouped Attempts)

4. COMPONENT COLLECTIONS (Organization)
```

## Integration Steps

### Step 1: Add to Existing Schema

Open `convex/schema.ts` and add the component library tables:

```typescript
import { defineSchema } from "convex/server";
import { componentLibraryTables } from "./componentLibrarySchema";

export default defineSchema({
  // Existing tables
  meks: defineTable({ /* ... */ }),
  users: defineTable({ /* ... */ }),
  // ... all your existing tables ...

  // Add component library tables
  ...componentLibraryTables,
});
```

### Step 2: Deploy Schema Changes

```bash
npx convex deploy
```

Convex will automatically handle schema migrations. Since these are new tables, there's no risk to existing data.

### Step 3: Verify Tables Created

Check your Convex dashboard (wry-trout-962.convex.cloud) to verify:
- `components`
- `componentVersions`
- `transformationHistory`
- `userPreferences`
- `componentUsage`
- `componentPreviewStates`
- `componentCollections`
- `transformationSessions`

## Data Flow

### User Workflow
```
1. User pastes component code
   ↓
2. AI transforms to React/TypeScript
   → Saved to transformationHistory
   ↓
3. User previews and gives feedback
   → Corrections saved to transformationHistory
   ↓
4. Iteration continues until satisfied
   → Each attempt logged
   ↓
5. Final component saved
   → Created in components table
   → Initial version in componentVersions
   → Preferences extracted to userPreferences
   ↓
6. Component used in site
   → Usage tracked in componentUsage
   → Usage count incremented
```

### AI Learning Loop
```
transformationHistory (raw data)
   ↓
   Extract patterns from corrections
   ↓
userPreferences (learned rules)
   ↓
   Applied to future transformations
   ↓
   Confidence score increases with success
```

## Key Features

### 1. Version Control
Every component update creates a new version:
- Full code snapshot preserved
- Change description tracked
- Diff metrics (lines added/removed)
- Can revert to any previous version

### 2. Usage Tracking
Know where every component is used:
- Page route and section
- Props passed to component
- Active/inactive status
- Can find all usages before modifying

### 3. AI Learning
System learns from corrections:
- Color preferences (e.g., always use #fab617 for yellow)
- Class name patterns (e.g., prefer mek-* classes)
- Structural patterns (e.g., use portals for modals)
- Confidence scoring (higher confidence = more reliable)

### 4. Transformation History
Complete audit trail:
- Original source code preserved
- AI prompts and outputs logged
- Iteration count tracked
- Success/failure recorded
- Learning signals extracted

## Example Usage Scenarios

### Scenario 1: Create Component from Tailwind UI
```typescript
// 1. User pastes Tailwind UI code
const originalCode = `<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Click me</button>`;

// 2. AI transforms with learning
const preferences = await getUserPreferences({ preferenceType: "color", minConfidence: 0.7 });
// Finds: blue -> #fab617 (yellow)

// 3. Record transformation
await recordTransformation({
  sessionId: "session-123",
  originalCode,
  originalSourceType: "tailwind",
  aiModel: "claude-3.5-sonnet",
  transformationPrompt: "Convert to React with Mek Tycoon styling",
  transformedCode: "...",
  transformationTime: 1500,
  iterationNumber: 1,
  isSuccessful: false, // User wants changes
});

// 4. User gives feedback: "Make it more industrial looking"
await addTransformationCorrection({
  transformationId: "...",
  issueType: "style",
  originalValue: "rounded",
  correctedValue: "mek-border-sharp-gold",
});

// 5. Second attempt with corrections
await recordTransformation({
  sessionId: "session-123",
  // ... updated code ...
  iterationNumber: 2,
  isSuccessful: true, // User accepts
});

// 6. Save final component
await createComponent({
  name: "Industrial Button",
  slug: "industrial-button",
  code: finalCode,
  category: "button",
  tags: ["industrial", "yellow", "primary"],
  isPublic: true,
  // ...
});

// 7. Learn from this success
await upsertUserPreference({
  preferenceType: "className",
  sourcePattern: "rounded",
  targetPattern: "mek-border-sharp-gold",
  priority: 10,
  wasCorrect: true,
});
```

### Scenario 2: Use Component Across Site
```typescript
// 1. Find component
const button = await getComponentBySlug({ slug: "industrial-button" });

// 2. Track usage
await registerComponentUsage({
  componentId: button._id,
  pageRoute: "/home",
  pageSection: "header",
  componentInstance: "save-button",
  propsSnapshot: JSON.stringify({ label: "Save Game", disabled: false }),
});

// 3. Increment usage count
await recordComponentUsage({ componentId: button._id });
```

### Scenario 3: Update Component
```typescript
// 1. Check where it's used first
const usages = await getComponentUsages({ componentId: button._id });
console.log(`Component used in ${usages.length} places`);

// 2. Update with new version
await updateComponent({
  componentId: button._id,
  code: updatedCode,
  changeDescription: "Added loading state",
  changeType: "enhancement",
});

// 3. All usages now reference new version
```

## Database Queries - Common Patterns

### Get Components for Dropdown
```typescript
const buttons = await getComponentsByCategory({ category: "button" });
```

### Search by Name
```typescript
const results = await searchComponents({ searchTerm: "industrial" });
```

### Get Learning Data
```typescript
const colorPrefs = await getUserPreferences({
  preferenceType: "color",
  minConfidence: 0.8,
});
```

### Analytics
```typescript
const mostUsed = await getMostUsedComponents({ limit: 10 });
const stats = await getTransformationStats({});
```

## Performance Considerations

### Indexes Provided
- Fast lookups by slug, category, usage count
- Search indexes for name and tags
- Efficient filtering by archived/public status
- Compound indexes for common query patterns

### Pagination Recommendation
For large collections, use Convex pagination:
```typescript
const results = await ctx.db
  .query("components")
  .withIndex("by_category", q => q.eq("category", "button"))
  .paginate(opts);
```

### Reactivity
All queries are reactive by default:
- UI automatically updates when components change
- Usage counts update in real-time
- New versions appear immediately

## Multi-User Support (Future)

Schema is designed for easy multi-user extension:
- `createdBy` field in components/versions
- `userId` field in userPreferences
- Just add authentication and filter by user

Current implementation: Single user (you), but data structure ready for expansion.

## Backup & Migration

### Backup Components
All component data is in Convex database:
- Use existing save system to backup
- Export/import functionality can be added
- Version history provides built-in backup

### Migration from Existing Code
To migrate existing components:
1. Extract code from current site
2. Create component records manually
3. Use `createComponent` mutation
4. No transformation history (that's OK)

## Best Practices

### Naming Conventions
- **Slugs**: kebab-case (e.g., "industrial-button")
- **Names**: Title Case (e.g., "Industrial Button")
- **Categories**: lowercase (e.g., "button", "card", "modal")
- **Tags**: lowercase (e.g., "industrial", "yellow", "glass-morphism")

### Version Management
- Create new version for any code change
- Use descriptive change descriptions
- Track change type accurately
- Keep version count reasonable (archive old versions if needed)

### Learning System
- Only learn from successful transformations
- Require minimum confidence (0.7+) before auto-applying
- Allow manual override of learned preferences
- Periodically review low-confidence preferences

### Usage Tracking
- Register usage when component is added to page
- Deactivate when removed from page
- Update propsSnapshot if props change significantly
- Use for impact analysis before breaking changes

## Troubleshooting

### Components Not Appearing
- Check `isArchived` field (should be false)
- Check `isPublic` field (should be true for site-wide)
- Verify indexes are working (check Convex dashboard)

### Slow Queries
- Use appropriate indexes (see schema for available indexes)
- Paginate large result sets
- Filter early (don't fetch everything then filter)

### Learning Not Working
- Check confidence scores (need multiple successes)
- Verify transformationHistory has correction data
- Ensure preferences are being created/updated
- Review priority values (higher = applied first)

## Next Steps

1. **Test Schema**: Deploy and verify tables created
2. **Create First Component**: Manually insert test component
3. **Build UI**: Create component library page
4. **Integrate AI**: Connect Claude API for transformations
5. **Add Preview**: Implement live component preview
6. **Track Usage**: Add usage tracking to existing pages
7. **Enable Learning**: Start recording transformation feedback

## Questions?

Check these files for more details:
- `convex/componentLibrarySchema.ts` - Full schema definitions
- `convex/componentLibraryFunctions.ts` - Example Convex functions
- Convex docs: https://docs.convex.dev
