'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface GoldBackupAdminProps {}

export default function GoldBackupAdmin({}: GoldBackupAdminProps) {
  // State management
  const [selectedBackupId, setSelectedBackupId] = useState<Id<"goldBackups"> | null>(null);
  const [manualBackupName, setManualBackupName] = useState('');
  const [restoreConfirmation, setRestoreConfirmation] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showBackupDetails, setShowBackupDetails] = useState(false);
  const [backupNotes, setBackupNotes] = useState('');
  const [restoreTargetWallets, setRestoreTargetWallets] = useState('');
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(30);
  const [dryRunMode, setDryRunMode] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);

  // Queries and mutations
  const allBackups = useQuery(api.goldBackups.getAllGoldBackups, { limit: 100 });
  const systemStats = useQuery(api.goldBackups.getBackupSystemStats);
  const backupDetails = selectedBackupId ? useQuery(api.goldBackups.getBackupDetails, { backupId: selectedBackupId }) : undefined;

  const createBackup = useMutation(api.goldBackups.createGoldBackup);
  const restoreFromBackup = useMutation(api.goldBackups.restoreFromBackup);
  const cleanupOldBackups = useMutation(api.goldBackups.cleanupOldBackups);
  const triggerDailyBackup = useMutation(api.goldBackups.triggerManualDailyBackup);
  const triggerCleanup = useMutation(api.goldBackups.triggerManualCleanup);

  // Loading states
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Handle manual backup creation
  const handleCreateBackup = async () => {
    if (isCreatingBackup) return;

    setIsCreatingBackup(true);
    try {
      const result = await createBackup({
        backupName: manualBackupName || undefined,
        backupType: 'manual',
        triggeredBy: 'admin_user',
        notes: backupNotes || undefined,
      });

      if (result.success) {
        setManualBackupName('');
        setBackupNotes('');
        alert(`Backup created successfully! ${result.successfulBackups} users backed up.`);
      } else {
        alert(`Backup failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Backup failed: ${error}`);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Handle restore from backup
  const handleRestore = async () => {
    if (!selectedBackupId || isRestoring) return;

    if (restoreConfirmation !== 'RESTORE_GOLD_BACKUP_CONFIRMED') {
      alert('Please type the exact confirmation code to proceed with restoration.');
      return;
    }

    setIsRestoring(true);
    try {
      const targetWallets = restoreTargetWallets.trim()
        ? restoreTargetWallets.split('\n').map(w => w.trim()).filter(w => w.length > 0)
        : undefined;

      const result = await restoreFromBackup({
        backupId: selectedBackupId,
        targetWallets,
        confirmationCode: restoreConfirmation,
        triggeredBy: 'admin_user',
        dryRun: dryRunMode,
      });

      if (result.dryRun) {
        // Store preview data instead of alert
        setPreviewData(result);
        console.log('Preview data:', result);
      } else if (result.success) {
        alert(`Restoration completed!\n- Users restored: ${result.restoredUsers}\n- Gold mining restored: ${result.restoredGoldMining}\n- Errors: ${result.errors}`);
        setRestoreConfirmation('');
        setRestoreTargetWallets('');
        setShowRestoreModal(false);
        setPreviewData(null);
      } else {
        alert(`Restoration failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Restoration failed: ${error}`);
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle cleanup
  const handleCleanup = async () => {
    if (isCleaningUp) return;

    setIsCleaningUp(true);
    try {
      const result = await cleanupOldBackups({
        daysToKeep: cleanupDays,
        dryRun: dryRunMode,
      });

      if (result.dryRun) {
        alert(`DRY RUN COMPLETE:\n- Backups to delete: ${result.backupsToDelete}\n- Cutoff date: ${result.cutoffDate}\n\nDisable dry run mode to perform actual cleanup.`);
      } else if (result.success) {
        alert(`Cleanup completed!\n- Deleted backups: ${result.deletedBackups}\n- Deleted user records: ${result.deletedUserData}`);
        setShowCleanupModal(false);
      }
    } catch (error) {
      alert(`Cleanup failed: ${error}`);
    } finally {
      setIsCleaningUp(false);
    }
  };

  if (!allBackups || !systemStats) {
    return <div className="p-4">Loading gold backup system...</div>;
  }

  return (
    <div className="p-6 space-y-8">
      {/* System Status */}
      <div className="mek-card-industrial">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4 mek-text-industrial">Gold Backup System Status</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="mek-border-sharp-gold p-4">
            <div className="text-sm text-gray-400 uppercase tracking-wide">Total Backups</div>
            <div className="text-xl text-yellow-400 font-bold">{systemStats.totalBackups}</div>
          </div>
          <div className="mek-border-sharp-gold p-4">
            <div className="text-sm text-gray-400 uppercase tracking-wide">Last 24h</div>
            <div className="text-xl text-yellow-400 font-bold">{systemStats.backupsLast24h}</div>
          </div>
          <div className="mek-border-sharp-gold p-4">
            <div className="text-sm text-gray-400 uppercase tracking-wide">Storage (MB)</div>
            <div className="text-xl text-yellow-400 font-bold">{systemStats.storageEstimateMB}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-400">Current Users</div>
            <div className="text-lg text-white">{systemStats.currentSystemStats.totalUsers}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400">Gold Miners</div>
            <div className="text-lg text-white">{systemStats.currentSystemStats.totalGoldMiners}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400">Total Gold</div>
            <div className="text-lg text-white">{Math.floor(systemStats.currentSystemStats.totalCurrentGold).toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400">Gold/Hour</div>
            <div className="text-lg text-white">{Math.floor(systemStats.currentSystemStats.totalGoldPerHour).toLocaleString()}</div>
          </div>
        </div>

        {/* Health Status */}
        <div className="mt-4 p-3 rounded mek-border-sharp-gold">
          <div className="text-sm text-gray-400 mb-2">System Health</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(systemStats.health).map(([key, isHealthy]) => (
              <div key={key} className={`px-2 py-1 rounded text-xs ${isHealthy ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {isHealthy ? '✓' : '✗'}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Backup Creation */}
      <div className="mek-card-industrial">
        <h3 className="text-xl font-bold text-yellow-400 mb-4">Create Manual Backup</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Backup Name (Optional)</label>
            <input
              type="text"
              value={manualBackupName}
              onChange={(e) => setManualBackupName(e.target.value)}
              placeholder="e.g., Pre-update backup"
              className="w-full p-2 bg-black border border-gray-600 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Notes (Optional)</label>
            <input
              type="text"
              value={backupNotes}
              onChange={(e) => setBackupNotes(e.target.value)}
              placeholder="e.g., Before major system changes"
              className="w-full p-2 bg-black border border-gray-600 rounded text-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            className="mek-button-primary disabled:opacity-50"
          >
            {isCreatingBackup ? 'Creating Backup...' : 'Create Manual Backup'}
          </button>

          <button
            onClick={async () => {
              setIsCreatingBackup(true);
              try {
                const result = await triggerDailyBackup({});
                if (result.success) {
                  alert(`Daily backup test completed! ${result.successfulBackups} users backed up.`);
                } else if (result.skipped) {
                  alert(`Daily backup skipped: ${result.reason}`);
                } else {
                  alert(`Daily backup failed: ${result.error}`);
                }
              } catch (error) {
                alert(`Daily backup test failed: ${error}`);
              } finally {
                setIsCreatingBackup(false);
              }
            }}
            disabled={isCreatingBackup}
            className="mek-button-secondary disabled:opacity-50"
          >
            Test Daily Backup
          </button>

          <button
            onClick={async () => {
              setIsCleaningUp(true);
              try {
                const result = await triggerCleanup({});
                if (result.success) {
                  alert(`Cleanup test completed! Deleted ${result.deletedBackups} backups, ${result.deletedUserData} user records.`);
                } else {
                  alert(`Cleanup test failed: ${result.error}`);
                }
              } catch (error) {
                alert(`Cleanup test failed: ${error}`);
              } finally {
                setIsCleaningUp(false);
              }
            }}
            disabled={isCleaningUp}
            className="mek-button-secondary disabled:opacity-50"
          >
            Test Cleanup
          </button>
        </div>
      </div>

      {/* Backup List */}
      <div className="mek-card-industrial">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-yellow-400">Recent Backups</h3>
          <button
            onClick={() => setShowCleanupModal(true)}
            className="mek-button-secondary text-sm"
          >
            Cleanup Old Backups
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left p-2 text-gray-400">Date</th>
                <th className="text-left p-2 text-gray-400">Name</th>
                <th className="text-left p-2 text-gray-400">Type</th>
                <th className="text-left p-2 text-gray-400">Users</th>
                <th className="text-left p-2 text-gray-400">Age</th>
                <th className="text-left p-2 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allBackups.map((backup) => (
                <tr key={backup._id} className="border-b border-gray-700 hover:bg-gray-800/50">
                  <td className="p-2 text-white">{backup.formattedDate}</td>
                  <td className="p-2 text-white">{backup.backupName || 'Unnamed'}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      backup.backupType === 'auto_daily' ? 'bg-blue-900 text-blue-200' :
                      backup.backupType === 'manual' ? 'bg-green-900 text-green-200' :
                      'bg-yellow-900 text-yellow-200'
                    }`}>
                      {backup.backupType}
                    </span>
                  </td>
                  <td className="p-2 text-white">{backup.totalUsersBackedUp}</td>
                  <td className="p-2 text-gray-400">
                    {backup.ageDays > 0 ? `${backup.ageDays}d` : `${backup.ageHours}h`}
                  </td>
                  <td className="p-2 space-x-2">
                    <button
                      onClick={() => {
                        setSelectedBackupId(backup._id);
                        setShowBackupDetails(true);
                      }}
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      View
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBackupId(backup._id);
                        setShowRestoreModal(true);
                        setDryRunMode(true);
                        setRestoreConfirmation('');
                        setRestoreTargetWallets('');
                      }}
                      className="text-yellow-400 hover:text-yellow-300 text-xs"
                    >
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backup Details Modal */}
      {showBackupDetails && selectedBackupId && backupDetails && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="mek-card-industrial max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-yellow-400">Backup Details</h3>
              <button
                onClick={() => setShowBackupDetails(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Backup Date</div>
                  <div className="text-white">{backupDetails.formattedDate}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Users Backed Up</div>
                  <div className="text-white">{backupDetails.userDataCount}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Total Gold</div>
                  <div className="text-white">{backupDetails.totalGold.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Total Gold/Hour</div>
                  <div className="text-white">{backupDetails.totalGoldPerHour.toLocaleString()}</div>
                </div>
              </div>

              {backupDetails.notes && (
                <div>
                  <div className="text-sm text-gray-400">Notes</div>
                  <div className="text-white">{backupDetails.notes}</div>
                </div>
              )}

              <div>
                <div className="text-sm text-gray-400 mb-2">Top Users (by gold)</div>
                <div className="space-y-1">
                  {backupDetails.topUsers.map((user, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-300">{user.walletAddress}</span>
                      <span className="text-white">{user.currentGold.toLocaleString()} gold</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="mek-card-industrial max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-400">⚠️ RESTORE FROM BACKUP</h3>
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setPreviewData(null);
                  setRestoreConfirmation('');
                  setRestoreTargetWallets('');
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-red-900/20 border border-red-500 rounded">
                <div className="text-red-400 font-bold mb-2">DANGER ZONE</div>
                <div className="text-sm text-red-200">
                  This will overwrite current user gold states with data from the selected backup.
                  This action cannot be undone. Use dry run mode first to preview changes.
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={dryRunMode}
                    onChange={(e) => setDryRunMode(e.target.checked)}
                    className="form-checkbox"
                  />
                  <span className="text-white">Dry Run Mode (Preview only)</span>
                </label>
                <div className="text-xs text-gray-400 mt-1">
                  When enabled, shows what would be restored without making changes
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Target Wallets (Optional - one per line, leave blank for all)
                </label>
                <textarea
                  value={restoreTargetWallets}
                  onChange={(e) => setRestoreTargetWallets(e.target.value)}
                  placeholder="stake1u..."
                  rows={4}
                  className="w-full p-2 bg-black border border-gray-600 rounded text-white text-sm"
                />
              </div>

              {/* Preview Results Table */}
              {previewData && previewData.dryRun && (
                <div className="p-4 bg-blue-900/20 border border-blue-500 rounded">
                  <div className="text-blue-400 font-bold mb-3">Preview Results</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Users to Restore:</span>
                      <span className="text-white font-bold">{previewData.usersToRestore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Gold to Restore:</span>
                      <span className="text-yellow-400 font-bold">{previewData.totalGoldToRestore?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Backup Timestamp:</span>
                      <span className="text-white">{new Date(previewData.backupTimestamp || Date.now()).toLocaleString()}</span>
                    </div>
                    {previewData.affectedWallets && previewData.affectedWallets.length > 0 && (
                      <div className="mt-3">
                        <div className="text-gray-400 mb-2">Affected Wallets:</div>
                        <div className="max-h-32 overflow-y-auto bg-black/40 p-2 rounded">
                          {previewData.affectedWallets.slice(0, 10).map((wallet: string, i: number) => (
                            <div key={i} className="text-xs text-gray-300 truncate">
                              {wallet}
                            </div>
                          ))}
                          {previewData.affectedWallets.length > 10 && (
                            <div className="text-xs text-gray-500 mt-1">
                              ...and {previewData.affectedWallets.length - 10} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-blue-300">
                    ✓ This is a preview only. Disable dry run mode and confirm to execute the restore.
                  </div>
                </div>
              )}

              {!dryRunMode && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Type confirmation code: RESTORE_GOLD_BACKUP_CONFIRMED
                  </label>
                  <input
                    type="text"
                    value={restoreConfirmation}
                    onChange={(e) => setRestoreConfirmation(e.target.value)}
                    placeholder="Type the confirmation code"
                    className="w-full p-2 bg-black border border-red-500 rounded text-white"
                  />
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={handleRestore}
                  disabled={isRestoring || (!dryRunMode && restoreConfirmation !== 'RESTORE_GOLD_BACKUP_CONFIRMED')}
                  className={`px-4 py-2 rounded font-medium disabled:opacity-50 ${
                    dryRunMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isRestoring ? 'Processing...' : (dryRunMode ? 'Preview Restore' : 'RESTORE NOW')}
                </button>
                <button
                  onClick={() => {
                    setShowRestoreModal(false);
                    setPreviewData(null);
                    setRestoreConfirmation('');
                    setRestoreTargetWallets('');
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cleanup Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="mek-card-industrial max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-yellow-400">Cleanup Old Backups</h3>
              <button
                onClick={() => setShowCleanupModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Days to Keep</label>
                <input
                  type="number"
                  value={cleanupDays}
                  onChange={(e) => setCleanupDays(Number(e.target.value))}
                  min="1"
                  max="365"
                  className="w-full p-2 bg-black border border-gray-600 rounded text-white"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={dryRunMode}
                    onChange={(e) => setDryRunMode(e.target.checked)}
                    className="form-checkbox"
                  />
                  <span className="text-white">Dry Run Mode (Preview only)</span>
                </label>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleCleanup}
                  disabled={isCleaningUp}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50"
                >
                  {isCleaningUp ? 'Processing...' : (dryRunMode ? 'Preview Cleanup' : 'Delete Old Backups')}
                </button>
                <button
                  onClick={() => setShowCleanupModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}