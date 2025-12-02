# Backup System Plan for Production Deployments

## Overview

This plan outlines a two-tier backup system integrated into the Deployment Control Center. The system ensures production safety by requiring a backup before any deploy, with options for quick routine backups or comprehensive full backups.

---

## Option 1: Quick Backup (Routine Deploys)

**Purpose**: Fast backup for routine code changes where database schema hasn't changed
**Duration**: ~5 seconds
**What it saves**: Git commit hash only (no database export)

### What Gets Backed Up
- Current master branch commit hash (the exact state of production code)
- Timestamp of backup
- Description/notes field (optional)

### Quick Backup Restore Process
1. `git checkout master`
2. `git reset --hard <saved-commit-hash>`
3. `git push origin master --force` (triggers Vercel rollback)
4. `npx convex deploy` to Sturgeon (redeploys functions from that commit)

### API Route: `/api/deployment/backup-quick/route.ts`
```
POST /api/deployment/backup-quick
- Get current master commit hash
- Save to JSON file in /backups/quick/ folder
- Filename: quick-backup-{timestamp}.json
- Returns: { success, backupId, commitHash, timestamp }
```

### Quick Backup JSON Structure
```json
{
  "id": "quick-1701450000000",
  "type": "quick",
  "timestamp": "2024-12-01T20:00:00.000Z",
  "commitHash": "abc123def456",
  "commitMessage": "Last commit message here",
  "branch": "master",
  "notes": "Optional user-provided description"
}
```

---

## Option 2: Full Backup (Risky Changes)

**Purpose**: Complete backup for schema changes, function changes, or risky deploys
**Duration**: ~30-60 seconds (depends on database size)
**What it saves**: Git commit hash + ALL production database data

### What Gets Backed Up
1. Git commit hash (same as quick backup)
2. All Convex tables exported via `npx convex export`
3. Convex functions and schema (included in code)

### Full Backup Process
1. Get current master commit hash
2. Run `npx convex export --prod --path ./backups/full/convex-{timestamp}.zip`
3. Save metadata JSON with commit hash + reference to export file

### Full Backup Restore Process
1. `git checkout master`
2. `git reset --hard <saved-commit-hash>`
3. `git push origin master --force` (triggers Vercel rollback)
4. `npx convex import --prod --replace ./backups/full/{backup-file}.zip`
5. `npx convex deploy` to Sturgeon (ensures functions match)

### API Route: `/api/deployment/backup-full/route.ts`
```
POST /api/deployment/backup-full
- Get current master commit hash
- Execute: npx convex export --prod --path ./backups/full/convex-{timestamp}.zip
- Save metadata JSON referencing the export
- Returns: { success, backupId, commitHash, exportPath, timestamp, sizeBytes }
```

### Full Backup Metadata Structure
```json
{
  "id": "full-1701450000000",
  "type": "full",
  "timestamp": "2024-12-01T20:00:00.000Z",
  "commitHash": "abc123def456",
  "commitMessage": "Last commit message here",
  "branch": "master",
  "convexExportPath": "./backups/full/convex-1701450000000.zip",
  "exportSizeBytes": 5242880,
  "notes": "Pre-schema-migration backup"
}
```

---

## Rollback System

### API Route: `/api/deployment/rollback/route.ts`
```
POST /api/deployment/rollback
Body: { backupId: string }
- Load backup metadata by ID
- Execute git reset to saved commit
- Force push to master
- If full backup: run convex import with --replace
- Run convex deploy to Sturgeon
- Returns: { success, restoredTo, type }
```

### API Route: `/api/deployment/list-backups/route.ts`
```
GET /api/deployment/list-backups
- Scan /backups/quick/ and /backups/full/ directories
- Return sorted list of all backups with metadata
- Include: id, type, timestamp, commitHash, notes, size (for full)
```

### API Route: `/api/deployment/delete-backup/route.ts`
```
DELETE /api/deployment/delete-backup
Body: { backupId: string }
- Remove backup file(s) by ID
- For full backups, also delete the Convex export ZIP
```

---

## File Structure

```
/backups/
  /quick/
    quick-backup-1701450000000.json
    quick-backup-1701450060000.json
  /full/
    full-backup-1701450000000.json
    convex-1701450000000.zip
    full-backup-1701450060000.json
    convex-1701450060000.zip
```

---

## UI Integration in DeploymentsAdmin.tsx

### New State Variables
```typescript
const [backups, setBackups] = useState<Backup[]>([]);
const [lastBackup, setLastBackup] = useState<Backup | null>(null);
const [isBackingUp, setIsBackingUp] = useState(false);
const [backupType, setBackupType] = useState<'quick' | 'full' | null>(null);
const [showBackupPanel, setShowBackupPanel] = useState(false);
const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
```

### UI Layout Changes

#### 1. Backup Panel (New Section)
Position: Above the Deploy to Production section
Contents:
- "Create Backup Before Deploy" header
- Two buttons side by side:
  - [Quick Backup] - "Code only (~5 sec)"
  - [Full Backup] - "Code + Database (~30-60 sec)"
- Status indicator showing last backup time
- Small info text explaining each option

#### 2. Deploy Button Logic
- "Deploy to Production" button is DISABLED if no backup exists from current session
- Or: Show warning if backup is older than 1 hour
- Button text changes: "Deploy to Production (backup required)" when no backup

#### 3. Rollback Section (New)
Position: Below Deploy section
Contents:
- Dropdown or list of available backups (sorted by date, newest first)
- Each backup shows: Type icon, timestamp, commit message preview
- [Rollback to Selected] button with confirmation modal
- Confirmation asks: "This will restore to backup from {date}. Continue?"

#### 4. Activity Log Updates
All backup and rollback operations logged with timestamps:
- "Quick backup created: abc123"
- "Full backup created: abc123 (5.2 MB)"
- "Rollback initiated to backup from 2024-12-01"
- "Rollback complete - production restored"

---

## Safety Features

### Pre-Deploy Check
Before running handleFullDeploy:
1. Check if backup exists from current session
2. If no backup: Show modal asking "Create a backup first?"
3. Provide Quick/Full options in modal
4. Only proceed with deploy after backup confirmed

### Rollback Safeguards
1. Double confirmation for rollbacks
2. Cannot rollback while another operation is in progress
3. Rollback creates its own backup first (so you can undo the rollback)

### Backup Retention
- Keep last 10 quick backups
- Keep last 5 full backups
- Auto-delete older backups to prevent disk space issues
- Show warning when backup folder exceeds 500MB

---

## Implementation Order

### Phase 1: Core Backup Infrastructure
1. Create /backups/quick/ and /backups/full/ directories
2. Build `/api/deployment/backup-quick/route.ts`
3. Build `/api/deployment/backup-full/route.ts`
4. Build `/api/deployment/list-backups/route.ts`
5. Test both backup types manually

### Phase 2: UI Integration
1. Add backup state variables to DeploymentsAdmin
2. Add Backup Panel section with two buttons
3. Add last backup status indicator
4. Wire up backup buttons to API routes
5. Add backup entries to activity log

### Phase 3: Deploy Protection
1. Add backup check to handleFullDeploy
2. Disable Deploy button when no backup exists
3. Add "backup required" modal flow
4. Test full deploy flow with backup requirement

### Phase 4: Rollback System
1. Build `/api/deployment/rollback/route.ts`
2. Add rollback section to UI
3. Build backup selection dropdown
4. Add double confirmation modal
5. Test rollback for both quick and full backups

### Phase 5: Cleanup & Polish
1. Build `/api/deployment/delete-backup/route.ts`
2. Add auto-cleanup of old backups
3. Add disk space warning
4. Final testing of all flows

---

## Convex CLI Commands Reference

**Export production data:**
```bash
npx convex export --prod --path ./backups/full/filename.zip
```

**Import to production (replace all data):**
```bash
npx convex import --prod --replace ./backups/full/filename.zip
```

**Deploy to production:**
```bash
npx convex deploy --prod
```

Note: The `--prod` flag targets the production deployment (Sturgeon). Without it, commands target development (Trout).

---

## Risk Assessment

### Quick Backup Risks
- Does NOT backup database data
- If schema changed, old functions may not work with new data
- Best for: CSS changes, UI tweaks, minor function updates

### Full Backup Risks
- Slower to create and restore
- Large file sizes if database grows
- Replace mode overwrites ALL data (no merge)
- Best for: Schema changes, major function rewrites, risky experiments

### Rollback Risks
- Force push to master rewrites GitHub history
- Cannot undo a rollback without another backup
- Full rollback replaces ALL database data (user activity during gap is lost)

---

## Summary

This two-tier system provides:
1. **Quick Backup**: Fast, code-only snapshots for routine deploys
2. **Full Backup**: Complete code + data snapshots for risky changes
3. **Rollback**: Restore production to any previous backup state
4. **Safety**: Deploy button requires backup, double confirmation for rollbacks

The system integrates into the existing DeploymentsAdmin component and uses the established API route pattern from the existing save/restore system.
