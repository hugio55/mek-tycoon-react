# Component Transformation System - Quick Reference

## When to Use This System

### ✅ DO Use When:
- User asks to "transform" or "convert" a component
- User says "use that component we made yesterday"
- User establishes a design pattern ("all buttons should be...")
- User approves a transformation that should be reused
- Building a design system or component library

### ❌ DON'T Use When:
- Making simple one-off style changes
- Debugging existing components
- Changing component logic (not styling)
- User explicitly says "don't save this"

---

## Quick Commands

### Save a Component
```typescript
await saveComponent({
  name: "ComponentName",
  code: "full component code here",
  props: "TypeScript interface (optional)",
  tags: ["tag1", "tag2", "tag3"]
});
```

### Get a Component
```typescript
const component = await getComponent({ name: "ComponentName" });
```

### Save Design Preference
```typescript
await savePreference({
  key: "preference-key",
  value: "preference-value",
  context: "explanation of usage",
  confidence: 0.9, // 0-1 scale
  category: "color" // or "typography", "spacing", "pattern"
});
```

### Save Transformation Rule
```typescript
await saveRule({
  name: "rule-name",
  pattern: "what to find in code",
  replacement: "what to replace with",
  autoApply: true, // suggest automatically?
  confidence: 0.85 // 0-1 scale
});
```

### Search Components by Tag
```typescript
const buttons = await searchComponentsByTag({ tag: "button" });
```

### Get Auto-Apply Rules
```typescript
const rules = await getAutoApplyRules();
```

---

## Conversation Flow

### 1. Transform Component
```
User: "Transform this button to industrial style"
     ↓
Claude: Transforms component
     ↓
Claude: Saves component to database
     ↓
Claude: Saves design preferences learned
     ↓
Claude: "Component saved as 'IndustrialButton'"
```

### 2. Reuse Component
```
User: "Use that button from yesterday"
     ↓
Claude: Queries database by name or tags
     ↓
Claude: Retrieves component
     ↓
Claude: Applies to current page
     ↓
Claude: "Applied IndustrialButton component"
```

### 3. Auto-Suggest
```
User: "Style this button"
     ↓
Claude: Checks for matching rules
     ↓
Claude: "I have a rule for this - use industrial style?"
     ↓
User: "Yes"
     ↓
Claude: Applies transformation
     ↓
Claude: Increments rule usage counter
```

---

## Function Reference

### All Functions Location
`convex/componentTransformations.ts`

### Components (Mutations)
- `saveComponent` - Save or update component
- `deleteComponent` - Remove component

### Components (Queries)
- `getComponent` - Get by name
- `getAllComponents` - List all
- `searchComponentsByTag` - Find by tag

### Preferences (Mutations)
- `savePreference` - Save or update preference

### Preferences (Queries)
- `getPreference` - Get by key
- `getAllPreferences` - List all
- `getPreferencesByCategory` - Filter by category

### Rules (Mutations)
- `saveRule` - Save or update rule
- `incrementRuleUsage` - Track usage
- `deleteRule` - Remove rule

### Rules (Queries)
- `getRule` - Get by name
- `getAllRules` - List all
- `getAutoApplyRules` - Get auto-apply only

---

## Database Tables

### transformedComponents
Stores final transformed component code

**Key Fields**: name, code, props, tags, createdAt, updatedAt

**Indexes**: by_name, by_tags

### designPreferences
Tracks learned design patterns

**Key Fields**: key, value, context, confidence, category, lastUsed

**Indexes**: by_key, by_category, by_confidence

### transformationRules
Auto-apply transformation patterns

**Key Fields**: name, pattern, replacement, autoApply, confidence, timesApplied

**Indexes**: by_name, by_autoApply, by_confidence

---

## Best Practices

### Component Names
- Use PascalCase: `IndustrialButton`, not `industrial-button`
- Be descriptive: `IndustrialPrimaryButton` better than `Button1`
- Include variant if relevant: `IndustrialButtonPrimary`, `IndustrialButtonSecondary`

### Tags
- Be specific: `["button", "industrial", "interactive", "primary"]`
- Include purpose: `["modal", "fullscreen", "overlay"]`
- Include style: `["glass-morphism", "yellow-accent"]`

### Confidence Scores
- **0.5-0.6**: Low confidence, first time seeing pattern
- **0.7-0.8**: Medium confidence, seen a few times
- **0.9-1.0**: High confidence, well-established pattern

### Categories
- **color**: Color values (`#fab617`, `rgb(250, 182, 23)`)
- **typography**: Font families, sizes, weights
- **spacing**: Margins, paddings, gaps
- **pattern**: Class combinations, design patterns

---

## Typical Workflow

### Week 1: Building Library
- Transform 5-10 common components
- Save design preferences as they emerge
- Don't create rules yet (not enough confidence)

### Week 2-3: Establishing Patterns
- Reuse saved components frequently
- Update confidence scores as patterns prove reliable
- Create auto-apply rules for proven transformations

### Week 4+: Mature System
- Claude auto-suggests transformations
- High-confidence rules apply automatically
- New components follow established patterns
- Rare need for manual transformation

---

## Troubleshooting

### "Component not found"
- Check spelling (case-sensitive)
- Try `getAllComponents()` to see what's saved
- Search by tag if you don't remember exact name

### "Low confidence in this rule"
- Use it more times to build confidence
- Update confidence score manually if appropriate
- Consider if rule is too broad (matches too many cases)

### "Too many matching components"
- Use more specific tags
- Refine component names
- Add category to search

---

## Integration Notes

### Using in React Components
```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// In component:
const component = useQuery(api.componentTransformations.getComponent, {
  name: "IndustrialButton"
});

const saveComponent = useMutation(api.componentTransformations.saveComponent);
```

### Using in Convex Functions
```typescript
import { api } from "./_generated/api";

// In query/mutation:
const component = await ctx.db
  .query("transformedComponents")
  .withIndex("by_name", (q) => q.eq("name", "IndustrialButton"))
  .first();
```

---

## Files to Reference

- **This Quick Reference**: `convex/QUICK_REFERENCE.md`
- **Detailed Usage Guide**: `convex/COMPONENT_TRANSFORMATION_USAGE.md`
- **Workflow Guide**: `COMPONENT_TRANSFORMATION_WORKFLOW.md`
- **Example Session**: `convex/EXAMPLE_TRANSFORMATION_SESSION.md`
- **Functions**: `convex/componentTransformations.ts`
- **Schema**: `convex/schema.ts` (tables at end)

---

**Remember**: The database is just storage. The intelligence is in the conversational workflow where Claude and user iterate on transformations together.
