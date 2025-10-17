# CircuTree Save File Format & Compatibility Guide

## Overview

This document explains the CircuTree save file format and the **critical rules** for maintaining backwards compatibility. Following these rules ensures that existing save files will ALWAYS work, even as we add new features.

## Current Save Format (Version 1)

```typescript
interface CircuTreeSaveData {
  version: number;        // Save format version (currently 1)
  nodes: TalentNode[];    // Array of nodes
  connections: Connection[]; // Array of connections between nodes
  savedAt: number;        // Timestamp when saved
}

interface CircuTreeSave {
  name: string;           // User-given name for the save
  data: CircuTreeSaveData; // The actual tree data
  isActive?: boolean;     // Whether this is the active tree on website
}
```

### Node Structure

```typescript
interface TalentNode {
  // REQUIRED FIELDS (must always be present)
  id: string;             // Unique identifier
  x: number;              // X position on canvas
  y: number;              // Y position on canvas
  name: string;           // Display name
  tier: number;           // Tier level
  desc: string;           // Description
  xp: number;             // Experience points

  // OPTIONAL FIELDS (all have safe defaults)
  variation?: string;
  variationType?: 'head' | 'body' | 'trait';
  imageUrl?: string;
  goldCost?: number;
  essences?: EssenceRequirement[];
  ingredients?: string[];
  isSpell?: boolean;
  spellType?: string;
  specialIngredient?: string;
  frameReward?: string;
  buffReward?: { type: string; value: number };
  essenceReward?: { type: string; amount: number };
  signatureItemReward?: string;
  nodeType?: 'stat' | 'ability' | 'passive' | 'special';
  statBonus?: { /* stats */ };
  abilityId?: string;
  passiveEffect?: string;
  isLabel?: boolean;      // For label nodes
  labelText?: string;     // Label text content
  // ... add new optional fields here in the future
}
```

### Connection Structure

```typescript
interface Connection {
  from: string;  // Node ID this connection starts from
  to: string;    // Node ID this connection goes to
}
```

## CRITICAL COMPATIBILITY RULES

### **Rule 1: NEVER Remove Fields**
- Once a field exists in the save format, it must ALWAYS be supported
- Removing fields breaks old save files
- If a field becomes unused, mark it as deprecated in code comments, but keep support

### **Rule 2: NEVER Change Field Meanings**
- The meaning of existing fields must remain the same
- If you need different behavior, add a NEW field
- Example: Don't change `goldCost` from meaning "unlock cost" to "upgrade cost"

### **Rule 3: ALWAYS Make New Fields Optional**
- New fields must have safe default values
- Old saves won't have these fields, so code must work without them
- Example: `newField?: string` with default of `''` or `undefined`

### **Rule 4: ALWAYS Increment Version Number**
- When changing the save format, increment `CURRENT_SAVE_VERSION` in `saveMigrations.ts`
- Add a migration function to upgrade old saves to the new version
- Never skip version numbers

### **Rule 5: ALWAYS Add Migration Functions**
- Each version bump needs a migration function: `migrateV{old}toV{new}`
- Migrations should add new fields with safe defaults
- Test migrations with real save files from previous versions

## How to Add New Features Safely

### Example: Adding a "color" field to nodes

**WRONG WAY (breaks old saves):**
```typescript
interface TalentNode {
  color: string;  // ❌ Required field - old saves don't have this!
}
```

**CORRECT WAY:**
```typescript
// Step 1: Add optional field to type
interface TalentNode {
  color?: string;  // ✅ Optional with safe default
}

// Step 2: Increment version in saveMigrations.ts
export const CURRENT_SAVE_VERSION = 2;

// Step 3: Add migration function
function migrateV1toV2(data: CircuTreeSaveData): CircuTreeSaveData {
  return {
    ...data,
    version: 2,
    nodes: data.nodes.map(node => ({
      ...node,
      color: node.color || '#ffffff'  // Safe default
    }))
  };
}

// Step 4: Add to migration chain
export function migrateSaveToCurrentVersion(data: any): CircuTreeSaveData {
  let currentData = data;
  let currentVersion = data.version || 0;

  if (currentVersion < 1) {
    currentData = migrateV0toV1(currentData);
    currentVersion = 1;
  }

  if (currentVersion < 2) {  // Add new migration
    currentData = migrateV1toV2(currentData);
    currentVersion = 2;
  }

  return currentData;
}

// Step 5: Use defensive coding everywhere
const nodeColor = node.color || '#ffffff';  // ✅ Always provide fallback
```

## Migration System

The migration system is in `src/app/talent-builder/saveMigrations.ts`:

- **`createSaveData()`** - Creates new save with current version
- **`loadSaveDataSafely()`** - Loads and migrates old saves
- **`migrateSaveToCurrentVersion()`** - Runs all necessary migrations
- **`validateSaveData()`** - Validates save structure

All save/load operations use this system automatically.

## Version History

### Version 0 (Legacy)
- Original format without version field
- Nodes and connections only
- No validation

### Version 1 (Current)
- Added `version` field to all saves
- Added `savedAt` timestamp
- Added validation for required fields
- Automated migration system

## Testing Compatibility

Before deploying changes that affect save format:

1. **Create test save with current version**
2. **Modify code to add new feature**
3. **Load the old save file**
4. **Verify it loads correctly with defaults applied**
5. **Test that new saves include the new field**
6. **Verify new saves can be loaded**

## Where Saves Are Stored

**LocalStorage:**
- `ciruTreeSaves` - Array of all named saves
- `talentTreeData` - Current working tree
- `publicTalentTree` - Active tree displayed on website

**File System Backups:**
- `C:\Users\Ben Meyers\Documents\Mek Tycoon\CircuTree-Backups\`
- Timestamped JSON files created on every save
- Unlimited backup history

## Recovery from Broken Saves

If a save somehow becomes corrupted:

1. **Load will fail with specific error message**
2. **Check validation error in console**
3. **Load previous backup from file system**
4. **Manually edit JSON if necessary (last resort)**

The validation system will tell you exactly what field is missing or invalid.

## For Future Developers

When adding features, always ask:
1. Does this require new data in saves? → Add optional field
2. Does this change existing data meaning? → Add NEW field instead
3. Did I increment the version? → Yes or no changes
4. Did I add a migration? → Required if version changed
5. Did I test with old saves? → Must verify compatibility

**Remember: User's work is precious. Never break their save files.**
