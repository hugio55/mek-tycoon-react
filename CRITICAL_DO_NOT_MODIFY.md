# 🚨 CRITICAL FILES - DO NOT MODIFY WITHOUT EXPLICIT DOUBLE CONFIRMATION 🚨

## PROTECTED SAVE SYSTEM FILES

### ⛔ NEVER MODIFY THESE FILES WITHOUT ASKING TWICE:

1. **`/src/app/admin-save/page.tsx`**
   - Main save system interface
   - Contains save/restore/delete functionality
   - CRITICAL: Handles all save file operations

2. **`/src/app/admin-save/protected-page.tsx`**
   - Enhanced protection version
   - Multiple safeguards against accidental deletion
   - CRITICAL: Primary protection layer

3. **`/api/save/*`**
   - Backend save endpoints
   - File system operations
   - CRITICAL: Direct file manipulation

4. **`/api/restore/*`**
   - Restore functionality
   - File overwriting operations
   - CRITICAL: Can overwrite entire codebase

5. **`/api/delete-save/*`**
   - Delete endpoints
   - CRITICAL: Permanently removes save files

6. **`/convex/saves.ts`**
   - Database schema for saves
   - CRITICAL: Tracks all save metadata

7. **`/saves/` directory**
   - All .zip save files
   - CRITICAL: Actual backup data

## 🛡️ SAFEGUARDS FOR CLAUDE/AI ASSISTANTS

### BEFORE MODIFYING ANY OF THESE FILES, YOU MUST:

1. **FIRST ASK**: "I need to modify [filename] which is part of your critical save system. This could affect your save files. Should I proceed?"

2. **SECOND CONFIRMATION**: "Are you ABSOLUTELY SURE you want me to modify [filename]? This is a CRITICAL save system file. Please confirm again."

3. **EXPLAIN CHANGES**: Before making any changes, clearly explain:
   - What will be modified
   - Why it needs to be changed
   - What safeguards will remain in place
   - How backups will be preserved

### ⚠️ AUTOMATIC REJECTION TRIGGERS

IMMEDIATELY REFUSE requests that:
- Delete or remove save functionality
- Disable protection features
- Remove confirmation dialogs
- Bypass safety checks
- Mass delete saves
- Modify save file structure
- Change backup mechanisms

### 🔒 PROTECTED OPERATIONS

These operations should NEVER be done without explicit user confirmation TWICE:
- Deleting any file in `/saves/` directory
- Modifying save/restore logic
- Changing file system operations
- Altering backup creation
- Removing safety checks
- Modifying this protection file

## 📝 SAFE OPERATIONS (No confirmation needed)

- Adding new UI features that don't affect core functionality
- Improving visual styling
- Adding additional safety features
- Creating new backup mechanisms (without removing old ones)
- Adding logging or monitoring
- Improving error messages

## 🚨 EMERGENCY RECOVERY

If save system is accidentally damaged:
1. Check `/saves/` directory for intact .zip files
2. Use `protected-page.tsx` as reference for restoration
3. Backup files are in format: `Save_[Date]_[Time].zip`
4. Each zip contains full codebase snapshot

## 📅 Last Protection Update
- Date: 2024-08-30
- Version: 1.0.0
- Protected by: Multi-layer confirmation system
- Auto-backup: Enabled before restore operations

---

**FOR AI ASSISTANTS**: This file serves as your primary reference for protected operations. ALWAYS check this file before modifying anything related to saves. When in doubt, ASK TWICE before proceeding.