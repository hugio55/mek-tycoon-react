'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function SnapshotHistoryViewer() {
  const [walletFilter, setWalletFilter] = useState('');
  const [expandedSnapshot, setExpandedSnapshot] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'snapshots' | 'logs'>('snapshots');

  const snapshots = useQuery(
    api.snapshotHistory.getSnapshotHistory,
    walletFilter ? { walletAddress: walletFilter, limit: 100 } : { limit: 50 }
  );

  const logs = useQuery(api.snapshotHistory.getSnapshotLogs, { limit: 20 });

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

  const toggleExpand = (snapshotId: string) => {
    setExpandedSnapshot(expandedSnapshot === snapshotId ? null : snapshotId);
  };

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
              onChange={(e) => setWalletFilter(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
            />
            {walletFilter && (
              <button
                onClick={() => setWalletFilter('')}
                className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700 rounded-lg transition-colors"
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="space-y-3">
            {snapshots && snapshots.length === 0 ? (
              <div className="p-8 bg-gray-900/50 rounded-lg border border-gray-700 text-center">
                <p className="text-gray-400">
                  {walletFilter ? 'No snapshots found for this wallet' : 'No snapshots recorded yet'}
                </p>
              </div>
            ) : (
              snapshots?.map((snapshot) => (
                <div
                  key={snapshot._id}
                  className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden hover:border-yellow-700/50 transition-colors"
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => toggleExpand(snapshot._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">{expandedSnapshot === snapshot._id ? '▼' : '▶'}</div>
                        <div>
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
                      </div>
                    </div>
                  </div>

                  {expandedSnapshot === snapshot._id && (
                    <div className="border-t border-gray-700 bg-gray-950/50 p-4">
                      <h4 className="text-sm font-semibold text-gray-300 mb-3">
                        MEKs Owned at This Snapshot ({snapshot.meks.length})
                      </h4>
                      <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                        {snapshot.meks.map((mek, index) => (
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
                              <div className="text-right">
                                <div className="text-xs text-gray-500">Rate</div>
                                <div className="text-sm font-semibold text-green-400">
                                  {mek.goldPerHour.toFixed(2)} g/hr
                                </div>
                              </div>
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
          <li>• Use wallet filter to search for specific user's complete history</li>
          <li>• Click any snapshot to expand and see full MEK details with gold rates</li>
          <li>• This is your audit trail - snapshots are never deleted and prove ownership history</li>
          <li>• If a user claims they owned more MEKs, check their snapshot at that timestamp</li>
        </ul>
      </div>
    </div>
  );
}