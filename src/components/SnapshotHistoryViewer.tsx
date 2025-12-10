'use client';

import { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

function SnapshotHistoryViewer() {
  const [walletFilter, setWalletFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [expandedSnapshot, setExpandedSnapshot] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'snapshots' | 'logs'>('snapshots');
  const [viewingFullData, setViewingFullData] = useState<string | null>(null);

  const snapshots = useQuery(
    api.snapshotHistory.getSnapshotHistory,
    walletFilter || companyFilter
      ? { walletAddress: walletFilter || undefined, companyName: companyFilter || undefined, limit: 100 }
      : { limit: 50 }
  );

  const logs = useQuery(api.snapshotHistory.getSnapshotLogs, { limit: 20 });

  // DEBUG: Log when query data changes
  useEffect(() => {
    if (logs) {
      console.log('[SnapshotHistoryViewer] Logs query updated:', {
        count: logs.length,
        latestTimestamp: logs[0]?.timestamp ? new Date(logs[0].timestamp).toISOString() : 'none',
        allTimestamps: logs.map((l: any) => new Date(l.timestamp).toISOString())
      });
    }
  }, [logs]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (viewingFullData) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [viewingFullData]);
  const deleteSnapshot = useMutation(api.snapshotHistory.deleteSnapshot);
  const deleteAllSnapshots = useMutation(api.snapshotHistory.deleteAllSnapshots);
  const restoreFromSnapshot = useMutation(api.snapshotHistory.restoreFromSnapshot);

  const handleDeleteSnapshot = useCallback(async (snapshotId: string) => {
    if (!confirm('Are you sure you want to delete this snapshot? This cannot be undone.')) return;

    try {
      await deleteSnapshot({ snapshotId: snapshotId as any });
    } catch (error) {
      console.error('Failed to delete snapshot:', error);
      alert('Failed to delete snapshot');
    }
  }, [deleteSnapshot]);

  const handleDeleteAllSnapshots = useCallback(async () => {
    const totalCount = snapshots?.length || 0;
    if (totalCount === 0) {
      alert('No snapshots to delete');
      return;
    }

    const confirmMsg = `⚠️⚠️⚠️ DELETE ALL SNAPSHOTS ⚠️⚠️⚠️\n\nYou are about to PERMANENTLY DELETE ALL ${totalCount} snapshot${totalCount === 1 ? '' : 's'}.\n\nThis will:\n• Remove the entire audit trail\n• Delete ALL blockchain verification records\n• Cannot be undone\n\nAre you ABSOLUTELY SURE you want to delete EVERYTHING?`;

    if (!confirm(confirmMsg)) return;

    if (!confirm(`FINAL WARNING: Delete all ${totalCount} snapshots?\n\nType "yes" in the next dialog to confirm.`)) return;

    try {
      const result = await deleteAllSnapshots({});
      alert(`✅ ${result.message}\n\n${result.deletedCount} snapshots have been permanently deleted.`);
    } catch (error: any) {
      console.error('Failed to delete all snapshots:', error);
      alert(`Failed to delete snapshots:\n${error.message || error}`);
    }
  }, [deleteAllSnapshots, snapshots]);

  const handleRestoreSnapshot = useCallback(async (snapshotId: string, walletAddress: string, snapshotTime: number) => {
    const confirmMsg = `⚠️ RESTORE FROM SNAPSHOT ⚠️\n\nThis will restore wallet ${walletAddress.substring(0, 12)}... to the EXACT state from:\n${new Date(snapshotTime).toLocaleString()}\n\nThis will:\n• Replace current Mek ownership data\n• Restore gold per hour rates\n• Restore Mek levels\n• Restore gold balance\n• Restore cumulative gold\n\nAre you ABSOLUTELY SURE you want to do this?`;

    if (!confirm(confirmMsg)) return;

    try {
      const result = await restoreFromSnapshot({ snapshotId: snapshotId as any });
      alert(`✅ Success!\n\n${result.message}\n\nRestored:\n• ${result.restoredMekCount} Meks\n• ${result.restoredGoldPerHour.toFixed(2)} gold/hr\n• ${result.restoredGold.toFixed(2)} current gold\n• ${result.restoredCumulativeGold.toFixed(2)} cumulative gold`);
    } catch (error: any) {
      console.error('Failed to restore snapshot:', error);
      alert(`Failed to restore snapshot:\n${error.message || error}`);
    }
  }, [restoreFromSnapshot]);

  const toggleExpand = useCallback((snapshotId: string) => {
    setExpandedSnapshot(prev => prev === snapshotId ? null : snapshotId);
  }, []);

  if (!snapshots && viewMode === 'snapshots') {
    return (
      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <div className="text-gray-400">Loading snapshot history...</div>
      </div>
    );
  }

  if (!logs && viewMode === 'logs') {
    return (
      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <div className="text-gray-400">Loading snapshot logs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-yellow-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            Blockchain Snapshot History
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            6-hour blockchain verification snapshots for audit trail and dispute resolution
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode('snapshots')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              viewMode === 'snapshots'
                ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
            }`}
          >
            Snapshots ({snapshots?.length || 0})
          </button>
          <button
            onClick={() => setViewMode('logs')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              viewMode === 'logs'
                ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
            }`}
          >
            Execution Logs ({logs?.length || 0})
          </button>
        </div>
      </div>

      {viewMode === 'snapshots' && (
        <>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Filter by wallet address..."
              value={walletFilter}
              onChange={(e) => {
                setWalletFilter(e.target.value);
                if (e.target.value) setCompanyFilter(''); // Clear other filter
              }}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
            />
            <input
              type="text"
              placeholder="Filter by company name..."
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                if (e.target.value) setWalletFilter(''); // Clear other filter
              }}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
            />
            {(walletFilter || companyFilter) && (
              <button
                onClick={() => {
                  setWalletFilter('');
                  setCompanyFilter('');
                }}
                className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={handleDeleteAllSnapshots}
              className="px-4 py-2 bg-red-900/50 hover:bg-red-900/70 text-red-400 border border-red-700 rounded-lg transition-colors font-semibold"
              title="Delete all snapshots permanently"
            >
              Delete All
            </button>
          </div>

          <div className="space-y-3">
            {snapshots && snapshots.length === 0 ? (
              <div className="p-8 bg-gray-900/50 rounded-lg border border-gray-700 text-center">
                <p className="text-gray-400">
                  {walletFilter || companyFilter ? 'No snapshots found for this search' : 'No snapshots recorded yet'}
                </p>
              </div>
            ) : (
              snapshots?.map((snapshot) => (
                <div
                  key={snapshot._id}
                  className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden hover:border-yellow-700/50 transition-colors"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-4 flex-1 cursor-pointer"
                        onClick={() => toggleExpand(snapshot._id)}
                      >
                        <div className="text-2xl">{expandedSnapshot === snapshot._id ? '▼' : '▶'}</div>
                        <div>
                          {snapshot.companyName && (
                            <div className="text-sm font-semibold text-yellow-400 mb-1">
                              {snapshot.companyName}
                            </div>
                          )}
                          <div className="font-mono text-sm text-gray-300">
                            {snapshot.walletAddress.substring(0, 12)}...{snapshot.walletAddress.substring(snapshot.walletAddress.length - 8)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(snapshot.snapshotTime).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm text-gray-400">MEKs</div>
                          <div className="text-lg font-bold text-yellow-400">{snapshot.totalMekCount}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Gold/hr</div>
                          <div className="text-lg font-bold text-green-400">{snapshot.totalGoldPerHour.toFixed(2)}</div>
                        </div>
                        {snapshot.spendableGold !== undefined && (
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Spendable</div>
                            <div className="text-lg font-bold text-yellow-300">{snapshot.spendableGold.toFixed(2)}</div>
                          </div>
                        )}
                        {snapshot.cumulativeGoldEarned !== undefined && (
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Cumulative</div>
                            <div className="text-lg font-bold text-orange-400">{snapshot.cumulativeGoldEarned.toFixed(2)}</div>
                          </div>
                        )}
                        {snapshot.verificationStatus && snapshot.verificationStatus !== 'verified' && (
                          <div className="text-right">
                            <div className="text-xs text-red-400 bg-red-900/30 px-2 py-1 rounded border border-red-700">
                              {snapshot.verificationStatus === 'lookup_failed' && '⚠️ Lookup Failed'}
                              {snapshot.verificationStatus === 'validation_failed' && '❌ Invalid Data'}
                              {snapshot.verificationStatus === 'uncertain' && '❓ Uncertain'}
                            </div>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingFullData(snapshot._id);
                          }}
                          className="px-3 py-1 text-xs bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-700 rounded transition-colors"
                          title="View all snapshot data"
                        >
                          View All Data
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestoreSnapshot(snapshot._id, snapshot.walletAddress, snapshot.snapshotTime);
                          }}
                          className="px-3 py-1 text-xs bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-700 rounded transition-colors"
                          title="Restore wallet to this snapshot"
                        >
                          Restore
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSnapshot(snapshot._id);
                          }}
                          className="px-3 py-1 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700 rounded transition-colors"
                          title="Delete this snapshot"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandedSnapshot === snapshot._id && (
                    <div className="border-t border-gray-700 bg-gray-950/50 p-4">
                      <h4 className="text-sm font-semibold text-gray-300 mb-3">
                        MEKs Owned at This Snapshot ({snapshot.meks.length})
                      </h4>
                      <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                        {snapshot.meks.map((mek: any, index: number) => (
                          <div
                            key={mek.assetId}
                            className="flex items-center justify-between p-3 bg-gray-900/50 rounded border border-gray-700"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-xs text-gray-500 w-8">#{index + 1}</div>
                              <div>
                                <div className="text-sm font-mono text-gray-300">{mek.assetName}</div>
                                <div className="text-xs text-gray-500">
                                  {mek.assetId.substring(0, 20)}...
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {mek.rarityRank && (
                                <div className="text-right">
                                  <div className="text-xs text-gray-500">Rank</div>
                                  <div className="text-sm text-gray-300">#{mek.rarityRank}</div>
                                </div>
                              )}
                              {/* Phase II: goldPerHour display removed - income from Job Slots */}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {viewMode === 'logs' && (
        <div className="space-y-3">
          {logs && logs.length === 0 ? (
            <div className="p-8 bg-gray-900/50 rounded-lg border border-gray-700 text-center">
              <p className="text-gray-400">No snapshot execution logs yet</p>
            </div>
          ) : (
            logs?.map((log) => (
              <div
                key={log._id}
                className="p-4 bg-gray-900/50 rounded-lg border border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-300">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Status: <span className={log.status === 'completed' ? 'text-green-400' : 'text-red-400'}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <div className="text-xs text-gray-500">Total</div>
                      <div className="text-sm font-semibold text-gray-300">{log.totalMiners}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Updated</div>
                      <div className="text-sm font-semibold text-green-400">{log.updatedCount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Errors</div>
                      <div className="text-sm font-semibold text-red-400">{log.errorCount}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/50">
        <h4 className="text-sm font-semibold text-blue-300 mb-2">💡 Customer Support Tips</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Each snapshot records the exact MEKs owned at that point in time (6-hour intervals)</li>
          <li>• Use wallet filter to search by blockchain address or company filter to search by company name</li>
          <li>• Click any snapshot to expand and see full MEK details with gold rates</li>
          <li>• This is your audit trail - snapshots are never deleted and prove ownership history</li>
          <li>• If a user claims they owned more MEKs, check their snapshot at that timestamp</li>
        </ul>
      </div>

      {/* Full Data Modal - Rendered as portal to avoid parent positioning issues */}
      {viewingFullData && snapshots && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4" onClick={() => setViewingFullData(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-yellow-400">Complete Snapshot Data</h3>
              <button
                onClick={() => setViewingFullData(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded transition-colors"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              {(() => {
                const snapshot = snapshots.find((s: any) => s._id === viewingFullData);
                if (!snapshot) return <div className="text-gray-400">Snapshot not found</div>;

                return (
                  <div className="space-y-4 font-mono text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Snapshot ID</div>
                        <div className="text-gray-300">{snapshot._id}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Creation Time</div>
                        <div className="text-gray-300">{new Date(snapshot._creationTime).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Wallet Address</div>
                        <div className="text-gray-300 break-all">{snapshot.walletAddress}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Company Name</div>
                        <div className="text-gray-300">{snapshot.companyName || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Snapshot Time</div>
                        <div className="text-gray-300">{new Date(snapshot.snapshotTime).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Verification Status</div>
                        <div className="text-gray-300">{snapshot.verificationStatus || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Total MEK Count</div>
                        <div className="text-yellow-400 font-bold">{snapshot.totalMekCount}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Total Gold Per Hour</div>
                        <div className="text-green-400 font-bold">{snapshot.totalGoldPerHour.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Spendable Gold</div>
                        <div className="text-yellow-300 font-bold">{snapshot.spendableGold?.toFixed(2) ?? 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Cumulative Gold Earned</div>
                        <div className="text-orange-400 font-bold">{snapshot.cumulativeGoldEarned?.toFixed(2) ?? 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Accumulated Gold</div>
                        <div className="text-yellow-300">{(snapshot as any).accumulatedGold?.toFixed(2) ?? 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Total Cumulative Gold</div>
                        <div className="text-orange-400">{(snapshot as any).totalCumulativeGold?.toFixed(2) ?? 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Total Gold Spent on Upgrades</div>
                        <div className="text-red-400 font-bold">{(snapshot as any).totalGoldSpentOnUpgrades?.toFixed(2) ?? 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Last Active Time</div>
                        <div className="text-gray-300">{(snapshot as any).lastActiveTime ? new Date((snapshot as any).lastActiveTime).toLocaleString() : 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Last Snapshot Time</div>
                        <div className="text-gray-300">{(snapshot as any).lastSnapshotTime ? new Date((snapshot as any).lastSnapshotTime).toLocaleString() : 'N/A'}</div>
                      </div>
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                      <div className="text-gray-400 text-xs mb-2">MEKs ({snapshot.meks.length})</div>
                      <div className="bg-gray-950 p-3 rounded border border-gray-700 max-h-96 overflow-auto">
                        <pre className="text-xs text-gray-300 whitespace-pre-wrap">{JSON.stringify(snapshot.meks, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default memo(SnapshotHistoryViewer);