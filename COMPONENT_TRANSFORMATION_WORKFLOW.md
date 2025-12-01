# Component Transformation Workflow Guide

## For Claude Code Sessions

This guide explains how to use the component transformation system in conversational workflows.

## Quick Start

### 1. Transform and Save a Component

**User says**: "Transform this button to match our industrial design"

**Claude does**:
```typescript
// 1. Transform the component code
const transformedCode = `
export const IndustrialButton = ({ children, onClick }: Props) => {
  return (
    <button
      onClick={onClick}
      className="mek-button-primary"
    >
      {children}
    </button>
  );
};
`;

// 2. Save to database
await saveComponent({
  name: "IndustrialButton",
  code: transformedCode,
  props: "interface Props { children: React.ReactNode; onClick: () => void; }",
  tags: ["button", "industrial", "interactive"]
});
```

**Result**: Component stored in database, ready for reuse

---

### 2. Reuse a Saved Component

**User says**: "Use that industrial button from yesterday"

**Claude does**:
```typescript
// 1. Query database
const component = await getComponent({ name: "IndustrialButton" });

// 2. Apply to current page
if (component) {
  // Use component.code to create/replace button in current file
  console.log("Found saved component:", component.name);
}
```

**Result**: Instant retrieval and application of previously transformed component

---

### 3. Learn Design Preferences

**User says**: "All primary buttons should be yellow with sharp edges"

**Claude does**:
```typescript
await savePreference({
  key: "primary-button-style",
  value: "mek-button-primary",
  context: "Primary buttons use yellow (#fab617) with sharp industrial edges",
  confidence: 0.9,
  category: "pattern"
});

await savePreference({
  key: "primary-yellow",
  value: "#fab617",
  context: "Primary color for buttons, headers, highlights",
  confidence: 0.95,
  category: "color"
});
```

**Result**: Design preferences stored for future reference

---

### 4. Create Auto-Apply Rules

**User says**: "Always replace generic blue buttons with industrial style"

**Claude does**:
```typescript
await saveRule({
  name: "Generic button to industrial",
  pattern: "bg-blue-500 text-white px-4 py-2 rounded",
  replacement: "mek-button-primary",
  autoApply: true,
  confidence: 0.85
});
```

**Result**: Rule saved - Claude will suggest this transformation automatically when detecting the pattern

---

## Available Commands

### Component Operations

```typescript
// Save/update component
await saveComponent({
  name: "ComponentName",
  code: "full component code",
  props: "TypeScript interface",
  tags: ["tag1", "tag2"]
});

// Get by name
const comp = await getComponent({ name: "ComponentName" });

// Search by tag
const buttons = await searchComponentsByTag({ tag: "button" });

// List all
const all = await getAllComponents();

// Delete
await deleteComponent({ name: "ComponentName" });
```

### Design Preferences

```typescript
// Save/update preference
await savePreference({
  key: "preference-key",
  value: "preference-value",
  context: "explanation",
  confidence: 0.9,
  category: "color" | "typography" | "spacing" | "pattern"
});

// Get by key
const pref = await getPreference({ key: "preference-key" });

// Get by category
const colors = await getPreferencesByCategory({ category: "color" });

// List all
const all = await getAllPreferences();
```

### Transformation Rules

```typescript
// Save/update rule
await saveRule({
  name: "rule-name",
  pattern: "what to find",
  replacement: "what to use",
  autoApply: true,
  confidence: 0.85
});

// Get by name
const rule = await getRule({ name: "rule-name" });

// Get auto-apply rules
const autoRules = await getAutoApplyRules();

// Track usage
await incrementRuleUsage({ name: "rule-name" });

// Delete
await deleteRule({ name: "rule-name" });
```

---

## Workflow Patterns

### Pattern 1: Transform Once, Reuse Many Times

**Session 1** (Wednesday):
- User: "Transform this card component to industrial style"
- Claude: Transforms, saves as "IndustrialCard"

**Session 2** (Friday):
- User: "Apply that industrial card to this page"
- Claude: Retrieves "IndustrialCard", applies instantly

### Pattern 2: Learn From Corrections

**Session 1**:
- User: "Make buttons yellow"
- Claude: Saves preference `button-color: yellow, confidence: 0.7`

**Session 2**:
- User: "Actually, use #fab617 specifically"
- Claude: Updates preference `button-color: #fab617, confidence: 0.9`

**Session 3**:
- User: "Transform this new button"
- Claude: Automatically applies #fab617 (learned preference)

### Pattern 3: Build Rule Library

**Over multiple sessions**:
- Session 1: User approves "generic button → industrial button" transformation
- Session 2: User approves "generic card → industrial card" transformation
- Session 3: User approves "generic modal → industrial modal" transformation

**Result**: Claude builds library of trusted auto-apply rules

---

## Integration with Convex Functions

The system uses three Convex tables:

1. **transformedComponents** - Store final component code
2. **designPreferences** - Track learned design patterns
3. **transformationRules** - Auto-apply transformation rules

All functions are in `convex/componentTransformations.ts`:
- Queries for reading data (reactive, cached)
- Mutations for writing data (transactional, consistent)
- Proper indexes for fast lookups

---

## Benefits

### For Users
- "Use that button we made" - instant retrieval
- No need to remember exact class names
- Design consistency across sessions
- Progressively smarter transformations

### For Claude
- Access to transformation history
- Learn user preferences over time
- Build confidence in patterns
- Suggest automatic improvements

### For Codebase
- Centralized component library
- Consistent design patterns
- Searchable by tags
- Easy to extend

---

## Next Steps

### Immediate Use
- Start transforming components and saving them
- Build up design preference library
- Create transformation rules as patterns emerge

### Future Enhancements (when needed)
- Usage analytics (which components are most used?)
- Preview storage (screenshots of components)
- Component relationships (which components use which?)
- Version history (if transformations become complex)
- Collaboration (multiple developers transforming components)

---

## File Locations

- **Schema**: `convex/schema.ts` (tables added at end)
- **Functions**: `convex/componentTransformations.ts`
- **Usage Guide**: `convex/COMPONENT_TRANSFORMATION_USAGE.md`
- **This Workflow Guide**: `COMPONENT_TRANSFORMATION_WORKFLOW.md`

---

## Key Principle

**Keep it conversational** - The database is just storage. The real intelligence is in the Claude Code session conversation where transformations happen iteratively with user feedback.
