# Backup & Restore Guide for Single-Wallet Revert

## Quick Start

### Step 1: Create Backups
Double-click: `create-revert-backups.bat`

This creates:
- ✅ Git commit (current state saved)
- ✅ Backup branch on GitHub
- ✅ Immutable git tag
- ✅ Complete Convex database export (all tables, all data)

**Time:** ~2 minutes

---

### Step 2: Verify Backups
Double-click: `verify-backups.bat`

Checks that all safety nets are in place before proceeding.

---

## What Gets Backed Up

### Code (Git)
- All source files
- Convex functions
- Schema definitions
- Frontend components

### Database (Convex Export)
- All goldMining records (including current gold amounts)
- All walletGroups data
- All walletGroupMemberships
- All discordConnections
- All mekLeveling data
- All other tables
- **Current state snapshot** - gold amounts frozen at export time

---

## Understanding Gold & Data

### Normal Revert (Code Only)
When we revert code but keep database running:
- ✅ Gold continues accumulating normally
- ✅ All existing data stays intact
- ✅ Only code/logic changes (multi-wallet → single-wallet)
- ✅ No data loss

### Full Restore (Code + Database)
If you import the backup ZIP:
- ⚠️ Gold reverts to backup snapshot time
- ⚠️ Any changes after backup are lost
- ⚠️ Only use if database gets corrupted

**Bottom Line:** Normal revert doesn't touch your gold or data!

---

## Restore Commands

### Restore Code Only (Safe - keeps current gold)
```bash
# Undo code revert, keep current database
git reset --hard multi-wallet-v1-[TIMESTAMP]
npx convex deploy
```

### Restore Everything (Nuclear - reverts gold too)
```bash
# WARNING: This reverts ALL data including gold!
git reset --hard multi-wallet-v1-[TIMESTAMP]
npx convex deploy
npx convex import backups\multi-wallet-[TIMESTAMP]\[filename].zip
```

---

## File Locations

**Backups stored in:**
```
backups/
  └─ multi-wallet-YYYY-MM-DD_HH-MM-SS/
      └─ rare-dinosaur-331_[timestamp].zip  (Convex database)
```

**Git safety nets:**
- Branch: `backup-multi-wallet-[TIMESTAMP]` (on GitHub)
- Tag: `multi-wallet-v1-[TIMESTAMP]` (immutable)
- Commit: Latest on master before revert

---

## Backup Verification Checklist

After running `create-revert-backups.bat`, verify:

- [ ] Console shows "✓ Committed successfully"
- [ ] Console shows "✓ Pushed to GitHub successfully"
- [ ] Console shows "✓ Backup branch created and pushed"
- [ ] Console shows "✓ Git tag created and pushed"
- [ ] Console shows "✓ Database exported successfully"
- [ ] Backup folder exists with ZIP file
- [ ] ZIP file is >1MB (not empty)

Run `verify-backups.bat` to auto-check these!

---

## Recovery Scenarios

### "I don't like the single-wallet revert"
```bash
git reset --hard multi-wallet-v1-[TIMESTAMP]
npx convex deploy
# Done! Back to multi-wallet with current gold intact
```

### "Database got corrupted during revert"
```bash
git reset --hard multi-wallet-v1-[TIMESTAMP]
npx convex deploy
npx convex import backups\multi-wallet-[TIMESTAMP]\*.zip
# Restores to exact state at backup time (gold reverted)
```

### "I deleted something by accident"
```bash
# Check what you deleted
git status

# Restore specific file
git checkout multi-wallet-v1-[TIMESTAMP] -- path/to/file

# Or restore everything
git reset --hard multi-wallet-v1-[TIMESTAMP]
```

---

## Testing Before Commitment

**Low-Risk Testing Path:**

1. ✅ Create all backups (run `create-revert-backups.bat`)
2. ✅ Revert code locally (don't push yet)
3. ✅ Deploy to dev (`npx convex deploy`)
4. ✅ Test for 1-2 hours locally
5. ✅ **DECISION POINT:**
   - Like it? → Push to GitHub, keep changes
   - Don't like it? → `git reset --hard multi-wallet-v1-[TIMESTAMP]`

**No commitment until you push to GitHub!**

---

## Support

**If anything goes wrong:**
1. Don't panic - you have 4 independent backups
2. Check `verify-backups.bat` output
3. Restore using commands above
4. Your data is safe in the ZIP file

**The backup ZIP contains your entire database including:**
- Current gold amounts
- All Mek levels
- All upgrade history
- All user data
- Everything!

---

## Files in This Backup System

- `create-revert-backups.bat` - Creates all backups
- `verify-backups.bat` - Verifies backups worked
- `BACKUP-README.md` - This file (instructions)
- `backups/` - Folder with database exports

**Keep these files safe!** They're your insurance policy.
