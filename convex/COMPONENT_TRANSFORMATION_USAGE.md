# Component Transformation System - Usage Guide

## Overview

Simple Convex-backed storage for transformed UI components in conversational Claude Code sessions.

## Database Tables

### 1. `transformedComponents`
**Purpose**: Store final transformed components with their code

**Fields**:
- `name`: Component name (e.g., "IndustrialButton")
- `code`: Full React/TypeScript code
- `props`: TypeScript interface (optional)
- `tags`: Array of searchable tags ["button", "industrial"]
- `createdAt/updatedAt`: Timestamps

**Indexes**:
- `by_name`: Fast lookup by component name
- `by_tags`: Search by tags

### 2. `designPreferences`
**Purpose**: Track learned design patterns and preferences

**Fields**:
- `key`: Preference identifier (e.g., "primary-yellow")
- `value`: The actual value (e.g., "#fab617")
- `context`: Where/why it's used (optional)
- `confidence`: 0-1 scale for how reliable this preference is
- `category`: Type of preference ("color", "typography", "spacing", "pattern")
- `lastUsed/createdAt`: Timestamps

**Indexes**:
- `by_key`: Fast lookup by preference key
- `by_category`: Group by preference type
- `by_confidence`: Sort by reliability

### 3. `transformationRules`
**Purpose**: Store patterns for automatic transformations

**Fields**:
- `name`: Rule name (e.g., "Generic button to industrial")
- `pattern`: What to find (e.g., "bg-blue-500 text-white")
- `replacement`: What to use instead (e.g., "mek-button-primary")
- `autoApply`: Should this be applied automatically?
- `confidence`: 0-1 scale for how reliable this rule is
- `timesApplied`: Usage counter
- `lastApplied/createdAt`: Timestamps

**Indexes**:
- `by_name`: Fast lookup by rule name
- `by_autoApply`: Find auto-applicable rules
- `by_confidence`: Sort by reliability

## Available Functions

### Components

```typescript
// Save or update a component
await saveComponent({
  name: "IndustrialButton",
  code: "export const IndustrialButton = ...",
  props: "interface Props { ... }",
  tags: ["button", "industrial", "interactive"]
});

// Get component by name
const component = await getComponent({ name: "IndustrialButton" });

// Get all components
const all = await getAllComponents();

// Search by tag
const buttons = await searchComponentsByTag({ tag: "button" });

// Delete component
await deleteComponent({ name: "IndustrialButton" });
```

### Design Preferences

```typescript
// Save or update preference
await savePreference({
  key: "primary-yellow",
  value: "#fab617",
  context: "Used for buttons, headers, accents",
  confidence: 0.95,
  category: "color"
});

// Get preference by key
const pref = await getPreference({ key: "primary-yellow" });

// Get all preferences
const all = await getAllPreferences();

// Get by category
const colors = await getPreferencesByCategory({ category: "color" });
```

### Transformation Rules

```typescript
// Save or update rule
await saveRule({
  name: "Generic button to industrial",
  pattern: "bg-blue-500 text-white px-4 py-2",
  replacement: "mek-button-primary",
  autoApply: true,
  confidence: 0.9
});

// Get rule by name
const rule = await getRule({ name: "Generic button to industrial" });

// Get all auto-apply rules
const autoRules = await getAutoApplyRules();

// Get all rules
const all = await getAllRules();

// Track rule usage
await incrementRuleUsage({ name: "Generic button to industrial" });

// Delete rule
await deleteRule({ name: "Generic button to industrial" });
```

## Conversational Workflow

### Session 1: Transform Component
```
User: "Transform this button to match our industrial design"
Claude: *transforms button*
        *saves to database*
        Component "IndustrialButton" saved with tags ["button", "industrial"]
```

### Session 2: Reuse Component
```
User: "Use that industrial button we made yesterday"
Claude: *queries database*
        Found "IndustrialButton" - applying to your page
```

### Learning Preferences
```
User: "All primary buttons should be yellow with sharp edges"
Claude: *saves preference*
        Saved design preference:
        - primary-button-style → mek-button-primary
        - confidence: 0.9
        - category: pattern
```

### Auto-Apply Rules
```
User: "Always replace generic blue buttons with industrial style"
Claude: *saves rule with autoApply=true*
        Rule created - will automatically suggest this transformation
```

## Why This Design?

### Simple Storage
- No complex versioning (session transcript has history)
- No usage tracking (can add later if needed)
- No transformation pipeline (handled conversationally)

### Fast Retrieval
- Indexed by name for instant lookup
- Tags for flexible searching
- Confidence scores for prioritization

### Learning Over Time
- Preferences accumulate across sessions
- Rules become more reliable with usage
- Categories organize knowledge domains

### Conversational Integration
- User says "use component X" → instant retrieval
- User establishes pattern → saved as preference
- User approves transformation → saved as rule

## Future Enhancements (Not Needed Now)

- Usage analytics (track which components are most used)
- Relationship tracking (which components use which)
- Preview storage (screenshots of transformed components)
- Versioning (if transformations become more complex)
- Collaboration (if multiple developers transform components)
