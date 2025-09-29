# Gold Backup System - Disaster Recovery Documentation

## Overview

The Gold Backup System provides comprehensive disaster recovery capabilities for all user gold states in Mek Tycoon. It creates bulletproof snapshots that can restore users' gold balances, generation rates, and associated metadata if something breaks in the system.

## Features

### ✅ Comprehensive Data Backup
- **User Gold States**: Current gold amounts, generation rates, accumulated gold
- **Mining Data**: Mek ownership, gold per hour rates, last active times
- **Metadata**: Timestamps, calculation methods, top mek information
- **Game State**: User levels, experience, bank balances

### ✅ Automatic Daily Backups
- Runs daily at 2:00 AM UTC via Convex cron jobs
- Automatic deduplication (won't create duplicate daily backups)
- Comprehensive error handling and logging
- Auto-naming with date stamps

### ✅ Manual Backup Creation
- Admin-triggered backups for pre-update protection
- Custom naming and notes
- Multiple backup types: manual, pre_update, pre_migration, emergency

### ✅ Point-in-Time Restoration
- Restore all users or specific wallet addresses
- Dry-run mode to preview changes before applying
- Safety confirmation codes to prevent accidental restores
- Detailed restoration logs and error reporting

### ✅ Automatic Cleanup
- Weekly cleanup of backups older than 30 days
- Configurable retention periods
- Dry-run mode for testing cleanup operations
- Comprehensive cleanup statistics

### ✅ System Health Monitoring
- Real-time backup system status
- Health indicators for backup frequency, storage usage
- Statistics on current gold state vs backups
- Performance metrics and storage estimates

## Database Schema

### Gold Backups Table (`goldBackups`)
```typescript
{
  backupTimestamp: number,        // When backup was created
  backupName?: string,            // Optional name for manual backups
  backupType: "auto_daily" | "manual" | "pre_update" | "pre_migration" | "emergency",
  triggeredBy?: string,           // Who/what triggered this backup
  totalUsersBackedUp: number,     // Count of users in this backup
  notes?: string,                 // Optional notes
  snapshotVersion: number,        // Version for backup format
  systemVersion?: string          // App version when backup was made
}
```

### Gold Backup User Data Table (`goldBackupUserData`)
```typescript
{
  backupId: Id<"goldBackups">,    // Reference to parent backup
  walletAddress: string,          // User identification
  userId?: Id<"users">,           // Reference to users table

  // Gold state at backup time
  currentGold: number,            // Calculated gold amount
  goldPerHour: number,            // Gold generation rate
  accumulatedGold?: number,       // Previously accumulated gold
  lastSnapshotTime?: number,      // Last rate update timestamp

  // Mining data
  totalGoldPerHour?: number,      // From goldMining table
  mekCount: number,               // Number of meks owned
  lastActiveTime?: number,        // When user was last active

  // Verification data
  topMekGoldRate?: number,        // Highest gold rate mek
  topMekAssetId?: string,         // Asset ID of top mek
  totalMekGoldRate?: number,      // Sum of all mek rates

  // Additional game state
  level?: number,
  experience?: number,
  bankBalance?: number
}
```

## API Functions

### Queries
- `getAllGoldBackups(limit?)` - Get list of all backups with metadata
- `getBackupDetails(backupId)` - Get detailed information about a specific backup
- `getUserBackupHistory(walletAddress, limit?)` - Get backup history for a specific user
- `getBackupSystemStats()` - Get system health and statistics

### Mutations
- `createGoldBackup({backupName?, backupType, triggeredBy?, notes?})` - Create a new backup
- `restoreFromBackup({backupId, targetWallets?, confirmationCode, triggeredBy, dryRun?})` - Restore from backup
- `cleanupOldBackups({daysToKeep?, dryRun?})` - Clean up old backups
- `triggerManualDailyBackup()` - Manually trigger daily backup (testing)
- `triggerManualCleanup()` - Manually trigger cleanup (testing)

## Backup Types

### 1. Auto Daily (`auto_daily`)
- **Schedule**: Every day at 2:00 AM UTC
- **Purpose**: Regular disaster recovery snapshots
- **Retention**: 30 days (configurable)
- **Naming**: "Auto Daily [Date]"

### 2. Manual (`manual`)
- **Trigger**: Admin interface
- **Purpose**: On-demand backups
- **Retention**: 30 days (same as auto)
- **Naming**: User-defined

### 3. Pre-Update (`pre_update`)
- **Trigger**: Before system updates
- **Purpose**: Safety net for deployments
- **Retention**: 30 days
- **Naming**: "Pre-update [Description]"

### 4. Pre-Migration (`pre_migration`)
- **Trigger**: Before database migrations
- **Purpose**: Data safety during schema changes
- **Retention**: 60 days (longer retention)
- **Naming**: "Pre-migration [Description]"

### 5. Emergency (`emergency`)
- **Trigger**: Manual during incidents
- **Purpose**: Critical data preservation
- **Retention**: 90 days (longest retention)
- **Naming**: "Emergency [Description]"

## Cron Jobs

### Daily Backup Job
```typescript
// Runs at 2:00 AM UTC daily
crons.daily("Daily Gold Backup", {
  hourUTC: 2,
  minuteUTC: 0,
}, internal.goldBackupScheduler.runDailyBackup);
```

### Weekly Cleanup Job
```typescript
// Runs at 3:00 AM UTC on Sundays
crons.weekly("Weekly Backup Cleanup", {
  dayOfWeek: "sunday",
  hourUTC: 3,
  minuteUTC: 0,
}, internal.goldBackupScheduler.runWeeklyCleanup);
```

## Admin Interface

### System Status Dashboard
- Total backups and recent activity
- Current system statistics (users, gold, rates)
- Storage usage estimates
- Health indicators

### Manual Backup Creation
- Custom backup names and notes
- Multiple backup type selection
- Real-time creation progress
- Success/error reporting

### Backup Management
- Sortable backup list with metadata
- Detailed backup inspection
- Quick restore access
- Backup type filtering

### Restore Operations
- **Dry Run Mode**: Preview restoration without changes
- **Targeted Restore**: Restore specific wallets only
- **Safety Confirmations**: Required confirmation codes
- **Progress Tracking**: Real-time restoration status

### Cleanup Management
- Configurable retention periods
- Dry run preview of cleanup operations
- Storage impact estimates
- Bulk cleanup operations

## Safety Features

### Restore Confirmations
Restoration requires typing: `RESTORE_GOLD_BACKUP_CONFIRMED`

### Dry Run Mode
All destructive operations support dry-run mode:
- Restoration previews
- Cleanup previews
- Impact analysis

### Error Handling
- Comprehensive try-catch blocks
- Detailed error logging
- Partial failure recovery
- Status tracking

### Data Validation
- Non-negative gold amounts enforced
- Timestamp validation
- Wallet address verification
- Mek count consistency checks

## Monitoring & Alerts

### Health Indicators
- ✅ **Recent Backup**: Backup within last 25 hours
- ✅ **Multiple Backups**: At least 2 backups exist
- ✅ **Storage Usage**: Under 100MB total usage
- ✅ **Backup Frequency**: At least 7 backups in last 7 days

### Performance Metrics
- Average backup creation time
- Storage growth rate
- Restoration success rates
- System resource usage

## Disaster Recovery Procedures

### 1. Gold Data Corruption
1. Access admin panel → Gold Backup System
2. Identify most recent healthy backup
3. Use dry-run restore to verify data
4. Execute full restoration with confirmation
5. Verify user gold states post-restoration

### 2. Partial User Data Loss
1. Collect affected wallet addresses
2. Find appropriate backup timestamp
3. Use targeted restoration for specific wallets
4. Verify restoration results
5. Monitor for additional issues

### 3. System Migration
1. Create pre-migration backup
2. Perform migration
3. Verify data integrity
4. Keep backup for rollback if needed
5. Clean up after successful migration

### 4. Regular Maintenance
- Weekly review of backup health indicators
- Monthly storage usage analysis
- Quarterly restoration testing
- Annual retention policy review

## File Structure

```
convex/
├── goldBackups.ts           # Main backup functions
├── goldBackupScheduler.ts   # Cron jobs and internal functions
└── schema.ts               # Database schema definitions

src/components/
└── GoldBackupAdmin.tsx     # Admin interface component

docs/
└── GOLD_BACKUP_SYSTEM.md   # This documentation
```

## Configuration

### Retention Periods
```typescript
const RETENTION_PERIODS = {
  auto_daily: 30,      // days
  manual: 30,          // days
  pre_update: 30,      // days
  pre_migration: 60,   // days
  emergency: 90        // days
};
```

### Backup Schedule
```typescript
const BACKUP_SCHEDULE = {
  daily: { hour: 2, minute: 0 },      // 2:00 AM UTC
  cleanup: { day: 'sunday', hour: 3 } // 3:00 AM UTC Sunday
};
```

### Storage Limits
```typescript
const STORAGE_LIMITS = {
  maxBackups: 100,           // Maximum total backups
  maxStorageMB: 500,         // Maximum storage usage
  warnThresholdMB: 100       // Warning threshold
};
```

## Testing

### Manual Testing Functions
- `triggerManualDailyBackup()` - Test daily backup creation
- `triggerManualCleanup()` - Test cleanup operations

### Test Scenarios
1. **Backup Creation**: Create manual backup and verify data
2. **Restoration**: Use dry-run mode to test restore operations
3. **Cleanup**: Test cleanup with dry-run mode
4. **Error Handling**: Test with invalid data/permissions
5. **Performance**: Test with large user datasets

### Health Checks
- Verify cron jobs are running
- Check backup creation success rates
- Monitor storage usage growth
- Test restoration procedures monthly

## Troubleshooting

### Common Issues

#### 1. Backup Creation Fails
- Check database permissions
- Verify user data integrity
- Review error logs in Convex dashboard
- Test with smaller user subsets

#### 2. Restoration Incomplete
- Verify confirmation codes
- Check target wallet addresses
- Review dry-run results first
- Ensure sufficient database resources

#### 3. Cleanup Not Working
- Check cron job status
- Verify date calculations
- Review retention policies
- Test cleanup with dry-run mode

#### 4. Storage Usage High
- Analyze backup sizes over time
- Review retention periods
- Consider data compression
- Clean up old/unnecessary backups

### Debug Commands
```javascript
// Check cron job status
await convex.query("goldBackups.getBackupSystemStats", {});

// Test backup creation
await convex.mutation("goldBackups.createGoldBackup", {
  backupType: "manual",
  backupName: "Debug Test",
  triggeredBy: "debug"
});

// Preview cleanup
await convex.mutation("goldBackups.cleanupOldBackups", {
  daysToKeep: 30,
  dryRun: true
});
```

## Security Considerations

### Access Control
- Admin-only access to backup functions
- Confirmation codes for destructive operations
- Audit logging of all backup operations
- Role-based permissions for different operations

### Data Protection
- Encrypted storage of backup data
- Secure transmission of backup payloads
- Access logging and monitoring
- Regular security audits

### Disaster Recovery
- Off-site backup replication (future)
- Multi-region backup storage (future)
- Automated backup verification
- Recovery time objective: < 1 hour

## Future Enhancements

### Planned Features
1. **Automated Testing**: Monthly automated restore tests
2. **Backup Verification**: Cryptographic backup integrity checks
3. **Incremental Backups**: Store only changes between backups
4. **Backup Compression**: Reduce storage requirements
5. **External Storage**: S3/Google Cloud backup storage
6. **Real-time Monitoring**: Advanced alerting system
7. **Backup Analytics**: Usage patterns and optimization
8. **Multi-region Backup**: Geographic backup distribution

### Performance Optimizations
1. **Parallel Processing**: Backup users in parallel batches
2. **Streaming Backups**: Stream large datasets instead of loading all
3. **Lazy Loading**: Load backup data on-demand
4. **Caching**: Cache frequently accessed backup metadata
5. **Compression**: Compress backup data for storage efficiency

---

**System Status**: ✅ **FULLY OPERATIONAL**
**Last Updated**: 2025-09-24
**Version**: 1.0
**Backup Format Version**: 1

This system provides bulletproof protection for all user gold states. If anything breaks, you can always restore users' gold from any backup point.