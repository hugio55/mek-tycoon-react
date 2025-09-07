# Crafting Page - Modular Architecture

## Overview
The crafting page has been refactored from a monolithic 1700+ line file into a clean, modular architecture with clear separation of concerns.

## Directory Structure

```
src/app/crafting/
├── page.tsx                 # Main page component (253 lines, down from 1701)
├── components/              # UI Components
│   ├── CategorySelector.tsx # Main category selection (heads/bodies/traits)
│   ├── CraftButton.tsx      # Craft button with requirements summary
│   ├── CraftedItemPopup.tsx # Success popup after crafting
│   ├── MekSelector.tsx      # Grid for selecting which Mek to equip to
│   ├── PathBreadcrumb.tsx   # Navigation breadcrumb trail
│   ├── RarityBiasChart.tsx  # Rarity probability visualization
│   ├── RecipeDisplay.tsx    # Complete recipe view with requirements
│   ├── RecipeRequirements.tsx # Essence requirements bars
│   ├── VariationGrid.tsx    # Grid container for variations
│   ├── VariationNode.tsx    # Individual variation card with effects
│   └── index.ts             # Barrel exports
├── constants/               # Data and Configuration
│   ├── variations.ts        # Head, body, trait variation arrays
│   ├── variationTrees.ts    # Hierarchical variation structure
│   ├── mockData.ts          # Mock user data and recipes
│   ├── rarityBias.ts        # Rarity tier configuration
│   └── index.ts             # Barrel exports
├── hooks/                   # Custom React Hooks
│   └── useCraftingState.ts  # Centralized state management
├── types/                   # TypeScript Definitions
│   └── index.ts             # All interfaces and types
└── utils/                   # Utility Functions
    └── index.ts             # Helper functions and logic

```

## Architecture Benefits

### 1. **Single Responsibility Principle**
Each module has one clear purpose:
- Components handle UI rendering
- Constants store static data
- Utils contain business logic
- Hooks manage state
- Types define contracts

### 2. **Improved Maintainability**
- Easy to locate and modify specific functionality
- Changes to one component don't affect others
- Clear boundaries between modules

### 3. **Enhanced Testability**
- Each component can be tested in isolation
- Utility functions are pure and easily testable
- Mock data is centralized

### 4. **Better Code Reusability**
- Components can be used in other pages
- Utility functions are exportable
- Types ensure consistency across the app

### 5. **Cleaner Imports**
- Barrel exports from index files
- Organized import statements
- No circular dependencies

## Key Modules

### State Management (`hooks/useCraftingState.ts`)
Centralizes all state logic using a custom hook:
- Navigation state (category, selections)
- UI state (popups, modals)
- Actions (navigation, selection, crafting)

### Component Hierarchy
```
page.tsx
├── CategorySelector (main menu)
├── PathBreadcrumb (navigation)
├── VariationGrid
│   └── VariationNode (individual items)
├── RecipeDisplay
│   ├── RecipeRequirements
│   ├── RarityBiasChart
│   └── CraftButton
├── CraftedItemPopup
└── MekSelector
```

### Data Flow
1. User selects component type → triggers state update
2. State change → renders appropriate component
3. Components read data from constants
4. Utils transform data as needed
5. User actions → hook functions → state updates

## Usage Examples

### Adding a New Variation
1. Add to `constants/variations.ts`
2. Update tree in `constants/variationTrees.ts`
3. Add image mapping in `utils/index.ts` if needed

### Creating a New Component
1. Create component in `components/`
2. Add to barrel export in `components/index.ts`
3. Import and use in `page.tsx`

### Adding New State
1. Add state to `hooks/useCraftingState.ts`
2. Add type definition to `types/index.ts`
3. Use in components as needed

## Performance Considerations
- Components are functional with hooks
- State updates are batched
- Images lazy load with error handling
- Animations use CSS for GPU acceleration

## Future Enhancements
- Connect to real backend (replace mock data)
- Add unit tests for components
- Implement error boundaries
- Add loading states
- Cache variation data