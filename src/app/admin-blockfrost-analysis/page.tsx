"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function AdminBlockfrostAnalysisPage() {
  const analysis = useQuery(api.diagnosticBlockfrostUsage.getBlockfrostCallAnalysis);
  const loopingSync = useQuery(api.diagnosticBlockfrostUsage.checkForLoopingSyncs);

  if (!analysis || !loopingSync) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-yellow-500">
            Blockfrost API Analysis
          </h1>
          <div className="text-gray-400">Loading analysis...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold mb-8 text-yellow-500">
          Blockfrost API Usage Analysis
        </h1>

        {/* Summary Stats */}
        <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-yellow-500/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">Summary (Last 24 Hours)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/50 p-4 rounded">
              <div className="text-gray-400 text-sm">Total NFT Syncs</div>
              <div className="text-3xl font-bold text-blue-400">
                {analysis.summary.totalSyncsLast24h}
              </div>
            </div>
            <div className="bg-black/50 p-4 rounded">
              <div className="text-gray-400 text-sm">Total Snapshots</div>
              <div className="text-3xl font-bold text-green-400">
                {analysis.summary.totalSnapshotsLast24h}
              </div>
            </div>
            <div className="bg-black/50 p-4 rounded">
              <div className="text-gray-400 text-sm">Estimated Blockfrost Calls</div>
              <div className="text-3xl font-bold text-red-400">
                {analysis.summary.estimatedBlockfrostCalls.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* NFT Sync Saga Activity */}
        <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-yellow-500/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">
            NFT Sync Saga Activity
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-yellow-900/20 p-3 rounded border border-yellow-500/30">
              <div className="text-yellow-300 text-xs">Pending</div>
              <div className="text-2xl font-bold">{analysis.syncSagaActivity.statusBreakdown.pending}</div>
            </div>
            <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30">
              <div className="text-blue-300 text-xs">Processing</div>
              <div className="text-2xl font-bold">{analysis.syncSagaActivity.statusBreakdown.processing}</div>
            </div>
            <div className="bg-green-900/20 p-3 rounded border border-green-500/30">
              <div className="text-green-300 text-xs">Completed</div>
              <div className="text-2xl font-bold">{analysis.syncSagaActivity.statusBreakdown.completed}</div>
            </div>
            <div className="bg-red-900/20 p-3 rounded border border-red-500/30">
              <div className="text-red-300 text-xs">Failed</div>
              <div className="text-2xl font-bold">{analysis.syncSagaActivity.statusBreakdown.failed}</div>
            </div>
          </div>

          {analysis.syncSagaActivity.recentSyncs.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-yellow-300 mb-3">Recent Syncs</h3>
              {analysis.syncSagaActivity.recentSyncs.map((sync: any, idx: number) => (
                <div key={idx} className="bg-black/50 p-3 rounded flex justify-between items-center">
                  <div>
                    <div className="font-mono text-sm">{sync.walletAddress}</div>
                    <div className="text-xs text-gray-500">
                      {sync.walletType} • Attempt #{sync.attemptCount} • {sync.createdAt}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded text-xs font-bold ${
                    sync.status === 'completed' ? 'bg-green-900/50 text-green-300' :
                    sync.status === 'failed' ? 'bg-red-900/50 text-red-300' :
                    sync.status === 'processing' ? 'bg-blue-900/50 text-blue-300' :
                    'bg-yellow-900/50 text-yellow-300'
                  }`}>
                    {sync.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Snapshot Activity */}
        <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-yellow-500/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">
            Snapshot Activity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-black/50 p-4 rounded">
              <div className="text-gray-400 text-sm">Snapshots Last 24h</div>
              <div className="text-3xl font-bold">{analysis.snapshotActivity.recentRuns}</div>
              <div className="text-xs text-gray-500 mt-1">Expected: 4 (every 6 hours)</div>
            </div>
            <div className="bg-black/50 p-4 rounded">
              <div className="text-gray-400 text-sm">Total Wallets Processed</div>
              <div className="text-3xl font-bold text-blue-400">
                {analysis.snapshotActivity.totalWalletsProcessed}
              </div>
            </div>
          </div>

          {analysis.snapshotActivity.recentSnapshots.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-yellow-300 mb-3">Recent Snapshots</h3>
              {analysis.snapshotActivity.recentSnapshots.map((snapshot: any, idx: number) => (
                <div key={idx} className="bg-black/50 p-3 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-400">{snapshot.timestamp}</div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      snapshot.status === 'completed' ? 'bg-green-900/50 text-green-300' :
                      snapshot.status === 'failed' ? 'bg-red-900/50 text-red-300' :
                      'bg-yellow-900/50 text-yellow-300'
                    }`}>
                      {snapshot.status}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Miners:</span> {snapshot.totalMiners}
                    </div>
                    <div>
                      <span className="text-gray-500">Updated:</span> {snapshot.updatedCount}
                    </div>
                    <div>
                      <span className="text-gray-500">Errors:</span> {snapshot.errorCount}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-red-400">
                    Est. Blockfrost Calls: ~{snapshot.estimatedBlockfrostCalls}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Looping/Stuck Syncs */}
        {loopingSync.criticalIssue && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-400">
              🚨 Critical: Looping/Stuck Syncs Detected
            </h2>
            <div className="space-y-3">
              {loopingSync.walletsWithExcessiveSyncs.map((wallet: any, idx: number) => (
                <div key={idx} className="bg-black/50 p-4 rounded border border-red-500/30">
                  <div className="font-mono text-sm mb-2">{wallet.wallet}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Total Syncs:</span>{" "}
                      <span className="text-red-300 font-bold">{wallet.totalSyncs}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Last 24h:</span>{" "}
                      <span className="text-red-300 font-bold">{wallet.syncsLast24h}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">Statuses:</span>{" "}
                      <span className="text-xs">{wallet.statuses.join(", ")}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Oldest:</span> {wallet.oldestSync}
                    </div>
                    <div>
                      <span className="text-gray-400">Newest:</span> {wallet.newestSync}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Potential Issues */}
        {analysis.potentialIssues.length > 0 && (
          <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-orange-400">⚠️ Potential Issues</h2>
            <ul className="space-y-2">
              {analysis.potentialIssues.map((issue: string, idx: number) => (
                <li key={idx} className="text-orange-300 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">💡 Recommendations</h2>
            <ul className="space-y-2">
              {analysis.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="text-blue-300 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Summary Analysis */}
        <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-yellow-500/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">Analysis Summary</h2>
          <div className="space-y-3 text-gray-300">
            <div className="bg-black/50 p-4 rounded">
              <div className="font-bold text-yellow-300 mb-2">What's Using Blockfrost?</div>
              <div className="text-sm space-y-1">
                <div>• NFT Syncs: ~{analysis.summary.totalSyncsLast24h} syncs × 15 calls = ~{analysis.summary.totalSyncsLast24h * 15} calls</div>
                <div>• Snapshots: ~{analysis.snapshotActivity.totalWalletsProcessed} wallets × 15 calls = ~{analysis.snapshotActivity.totalWalletsProcessed * 15} calls</div>
                <div className="text-red-400 font-bold mt-2">
                  Total Estimated: ~{analysis.summary.estimatedBlockfrostCalls.toLocaleString()} calls/day
                </div>
              </div>
            </div>

            <div className="bg-black/50 p-4 rounded">
              <div className="font-bold text-yellow-300 mb-2">What Each Blockfrost Call Does</div>
              <div className="text-sm space-y-1">
                <div>• Fetches wallet addresses (with pagination)</div>
                <div>• Fetches assets for each address</div>
                <div>• Fetches metadata for each NFT</div>
                <div>• Total: ~10-20 API calls per wallet sync</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
