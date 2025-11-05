# Example Transformation Session

## Scenario: Transform a Generic Button to Industrial Style

This example shows a complete conversational workflow.

---

## Session Transcript

### User Request
> "I want to transform this button to match our industrial design system"

**Current code**:
```tsx
<button
  onClick={handleClick}
  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
>
  Click Me
</button>
```

---

### Claude Response - Step 1: Transform

"I'll transform this to use our industrial design system:"

**Transformed code**:
```tsx
<button
  onClick={handleClick}
  className="mek-button-primary"
>
  Click Me
</button>
```

**Explanation**:
- Replaced generic Tailwind classes with industrial design class
- Uses yellow/gold color (#fab617)
- Sharp edges with border (no rounded corners)
- Glass morphism effect with backdrop blur
- Hover effects with glow

---

### Claude Response - Step 2: Save Component

"I'll save this as a reusable component:"

```typescript
// Save to database
const componentCode = `
export interface IndustrialButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export const IndustrialButton = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary'
}: IndustrialButtonProps) => {
  const className = variant === 'primary'
    ? 'mek-button-primary'
    : 'mek-button-secondary';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
};
`;

await saveComponent({
  name: "IndustrialButton",
  code: componentCode,
  props: `interface IndustrialButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
  }`,
  tags: ["button", "industrial", "interactive", "primary"]
});
```

**Result**: ✅ Component saved successfully

---

### Claude Response - Step 3: Save Design Preferences

"I'll also save the design preferences I learned:"

```typescript
// Save color preference
await savePreference({
  key: "primary-yellow",
  value: "#fab617",
  context: "Primary color for buttons, headers, and accents in industrial design",
  confidence: 0.95,
  category: "color"
});

// Save button style preference
await savePreference({
  key: "button-primary-class",
  value: "mek-button-primary",
  context: "Primary button styling with yellow/gold, sharp edges, glass morphism",
  confidence: 0.9,
  category: "pattern"
});
```

**Result**: ✅ Design preferences saved

---

### Claude Response - Step 4: Create Transformation Rule

"Should I create an auto-apply rule for this transformation?"

### User Response
> "Yes, always suggest industrial style for generic blue buttons"

```typescript
await saveRule({
  name: "Generic blue button to industrial",
  pattern: "bg-blue-500 text-white px-4 py-2 rounded",
  replacement: "mek-button-primary",
  autoApply: true,
  confidence: 0.85
});
```

**Result**: ✅ Auto-apply rule created

---

## Later Session - Reuse Component

### User Request (2 days later)
> "Add an industrial button to this new page"

### Claude Response

"I'll use the IndustrialButton component we created earlier:"

```typescript
// Retrieve saved component
const savedComponent = await getComponent({ name: "IndustrialButton" });

if (savedComponent) {
  console.log("Found saved component:", savedComponent.name);
  console.log("Tags:", savedComponent.tags);
  // Apply component code to new page
}
```

**Applied to page**:
```tsx
import { IndustrialButton } from '@/components/IndustrialButton';

// In your page component:
<IndustrialButton onClick={handleSubmit}>
  Submit Form
</IndustrialButton>
```

---

## Later Session - Auto-Suggest Transformation

### User Request (1 week later)
> "Update this button styling"

**Current code**:
```tsx
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Save
</button>
```

### Claude Response

"I notice this matches a transformation rule. Would you like me to apply the industrial style?"

```typescript
// Check for matching rules
const rules = await getAutoApplyRules();
const matchingRule = rules.find(rule =>
  code.includes(rule.pattern)
);

if (matchingRule) {
  console.log("Found matching rule:", matchingRule.name);
  console.log("Confidence:", matchingRule.confidence);
}
```

**If user approves**:
```tsx
<button className="mek-button-primary">
  Save
</button>
```

```typescript
// Track rule usage
await incrementRuleUsage({ name: "Generic blue button to industrial" });
```

---

## What Gets Learned Over Time

### After Multiple Sessions

**Components Library**:
- IndustrialButton (primary, secondary variants)
- IndustrialCard (with grunge overlay)
- IndustrialModal (full-screen overlay)
- IndustrialInput (sharp edges, yellow focus)
- IndustrialProgressBar (yellow gradient fill)

**Design Preferences**:
- `primary-yellow: #fab617` (confidence: 0.95)
- `secondary-blue: #3b82f6` (confidence: 0.85)
- `font-header: Orbitron` (confidence: 0.9)
- `border-style: sharp-edges` (confidence: 0.9)
- `effect-glass: backdrop-blur-sm` (confidence: 0.85)

**Transformation Rules**:
- Generic button → Industrial button (85% confidence, used 12 times)
- Generic card → Industrial card (80% confidence, used 8 times)
- Generic input → Industrial input (75% confidence, used 5 times)
- Generic modal → Industrial modal (70% confidence, used 3 times)

**Result**: Claude becomes progressively better at suggesting appropriate transformations

---

## Key Takeaways

1. **Transform conversationally** - Iterate with user feedback
2. **Save immediately** - Don't lose good work
3. **Tag appropriately** - Makes retrieval easier
4. **Build confidence over time** - Rules become more reliable with usage
5. **Reuse across sessions** - No need to re-transform similar components

---

## Database State After This Session

### transformedComponents
```
| name              | tags                                  | created    |
|-------------------|---------------------------------------|------------|
| IndustrialButton  | button, industrial, interactive       | 2025-11-04 |
```

### designPreferences
```
| key                  | value               | confidence | category |
|----------------------|---------------------|------------|----------|
| primary-yellow       | #fab617             | 0.95       | color    |
| button-primary-class | mek-button-primary  | 0.90       | pattern  |
```

### transformationRules
```
| name                            | pattern                       | autoApply | confidence | times |
|---------------------------------|-------------------------------|-----------|------------|-------|
| Generic blue button to industrial | bg-blue-500 text-white px-4... | true      | 0.85       | 1     |
```

---

This demonstrates the complete workflow from initial transformation to learned preferences to automatic suggestions.
