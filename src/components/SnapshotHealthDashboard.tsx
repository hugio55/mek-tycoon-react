'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function SnapshotHealthDashboard() {
  const [selectedWallet, setSelectedWallet] = useState('');
  const health = useQuery(api.snapshotHealthCheck.getSnapshotHealth);
  const walletHealth = selectedWallet
    ? useQuery(api.snapshotHealthCheck.getWalletSnapshotHealth, { walletAddress: selectedWallet })
    : null;

  if (!health) {
    return (
      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <div className="text-gray-400">Loading snapshot health check...</div>
      </div>
    );
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400 border-green-700 bg-green-900/30';
      case 'warning': return 'text-yellow-400 border-yellow-700 bg-yellow-900/30';
      case 'critical': return 'text-red-400 border-red-700 bg-red-900/30';
      default: return 'text-gray-400 border-gray-700 bg-gray-900/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Health Status */}
      <div className={`p-4 rounded-lg border-2 ${getHealthColor(health.healthStatus)}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              Snapshot System: {health.healthStatus.toUpperCase()}
            </h3>
            <p className="text-sm mt-1">
              {health.issues.length === 0
                ? '✓ All systems operational'
                : health.issues.join(' • ')}
            </p>
          </div>
          <div className="text-right text-sm">
            <div>Last checked: {new Date(health.timestamp).toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      {/* Last Snapshot Execution */}
      {health.lastSnapshotRun && (
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <h4 className="text-lg font-semibold text-yellow-400 mb-3">Last Snapshot Execution</h4>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <div className="text-xs text-gray-500">Time</div>
              <div className="text-sm text-gray-300">
                {new Date(health.lastSnapshotRun.timestamp).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                ({health.lastSnapshotRun.hoursSince.toFixed(1)} hours ago)
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Total Wallets</div>
              <div className="text-lg font-bold text-gray-300">
                {health.lastSnapshotRun.totalMiners}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Updated</div>
              <div className="text-lg font-bold text-green-400">
                {health.lastSnapshotRun.updatedCount}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Errors</div>
              <div className={`text-lg font-bold ${health.lastSnapshotRun.errorCount > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {health.lastSnapshotRun.errorCount}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Status</div>
              <div className={`text-sm font-semibold ${health.lastSnapshotRun.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                {health.lastSnapshotRun.status}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Coverage Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <div className="text-xs text-gray-500 mb-1">Total Wallets</div>
          <div className="text-2xl font-bold text-gray-300">{health.totalWallets}</div>
        </div>
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <div className="text-xs text-gray-500 mb-1">Active Wallets</div>
          <div className="text-2xl font-bold text-green-400">{health.activeWallets}</div>
          <div className="text-xs text-gray-400 mt-1">Last 15 days</div>
        </div>
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <div className="text-xs text-gray-500 mb-1">Inactive Wallets</div>
          <div className="text-2xl font-bold text-gray-400">{health.inactiveWallets}</div>
          <div className="text-xs text-gray-400 mt-1">Skipped in snapshots</div>
        </div>
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <div className="text-xs text-gray-500 mb-1">Snapshotted (24h)</div>
          <div className="text-2xl font-bold text-blue-400">{health.snapshotedInLast24h}</div>
        </div>
      </div>

      {/* Problem Areas */}
      <div className="grid grid-cols-2 gap-4">
        {/* Wallets Never Snapshotted */}
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <h4 className="text-sm font-semibold text-yellow-400 mb-3">
            Never Snapshotted ({health.walletsNeverSnapshotted.count})
          </h4>
          {health.walletsNeverSnapshotted.count === 0 ? (
            <div className="text-xs text-gray-500">✓ All wallets have been snapshotted</div>
          ) : (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {health.walletsNeverSnapshotted.wallets.map(wallet => (
                <div
                  key={wallet}
                  className="text-xs font-mono text-gray-400 hover:text-yellow-400 cursor-pointer"
                  onClick={() => setSelectedWallet(wallet)}
                >
                  {wallet.substring(0, 12)}...{wallet.substring(wallet.length - 8)}
                </div>
              ))}
              {health.walletsNeverSnapshotted.count > 10 && (
                <div className="text-xs text-gray-500 mt-2">
                  ...and {health.walletsNeverSnapshotted.count - 10} more
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stale Snapshots */}
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <h4 className="text-sm font-semibold text-yellow-400 mb-3">
            Stale Snapshots - Active Wallets ({health.walletsStaleSnapshots.count})
          </h4>
          {health.walletsStaleSnapshots.count === 0 ? (
            <div className="text-xs text-gray-500">✓ All active wallets have recent snapshots</div>
          ) : (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {health.walletsStaleSnapshots.wallets.map(item => (
                <div
                  key={item.wallet}
                  className="flex justify-between items-center hover:bg-gray-800/50 p-1 rounded cursor-pointer"
                  onClick={() => setSelectedWallet(item.wallet)}
                >
                  <span className="text-xs font-mono text-gray-400">
                    {item.wallet.substring(0, 12)}...
                  </span>
                  <span className="text-xs text-red-400">
                    {item.hoursSince}h ago
                  </span>
                </div>
              ))}
              {health.walletsStaleSnapshots.count > 10 && (
                <div className="text-xs text-gray-500 mt-2">
                  ...and {health.walletsStaleSnapshots.count - 10} more
                </div>
              )}
            </div>
          )}
        </div>

        {/* Consecutive Failures */}
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <h4 className="text-sm font-semibold text-red-400 mb-3">
            Consecutive Failures ({health.walletsWithFailures.count})
          </h4>
          {health.walletsWithFailures.count === 0 ? (
            <div className="text-xs text-gray-500">✓ No wallets with consecutive failures</div>
          ) : (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {health.walletsWithFailures.wallets.map(item => (
                <div
                  key={item.wallet}
                  className="flex justify-between items-center hover:bg-gray-800/50 p-1 rounded cursor-pointer"
                  onClick={() => setSelectedWallet(item.wallet)}
                >
                  <span className="text-xs font-mono text-gray-400">
                    {item.wallet.substring(0, 12)}...
                  </span>
                  <span className="text-xs text-red-400">
                    {item.failures} failures
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inactive Wallets */}
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <h4 className="text-sm font-semibold text-gray-400 mb-3">
            Inactive Wallets ({health.inactiveWalletsInfo.count})
          </h4>
          {health.inactiveWalletsInfo.count === 0 ? (
            <div className="text-xs text-gray-500">All wallets are active</div>
          ) : (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {health.inactiveWalletsInfo.wallets.map(item => (
                <div
                  key={item.wallet}
                  className="flex justify-between items-center hover:bg-gray-800/50 p-1 rounded cursor-pointer"
                  onClick={() => setSelectedWallet(item.wallet)}
                >
                  <span className="text-xs font-mono text-gray-400">
                    {item.wallet.substring(0, 12)}...
                  </span>
                  <span className="text-xs text-gray-500">
                    {item.daysSince}d ago
                  </span>
                </div>
              ))}
              {health.inactiveWalletsInfo.count > 10 && (
                <div className="text-xs text-gray-500 mt-2">
                  ...and {health.inactiveWalletsInfo.count - 10} more
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Logs */}
      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <h4 className="text-lg font-semibold text-yellow-400 mb-3">Recent Snapshot Executions</h4>
        <div className="space-y-2">
          {health.recentLogs.map((log, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-950/50 rounded border border-gray-700"
            >
              <div className="text-xs text-gray-400">
                {new Date(log.timestamp).toLocaleString()}
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-gray-400">Total: {log.totalMiners}</span>
                <span className="text-green-400">Updated: {log.updatedCount}</span>
                <span className={log.errorCount > 0 ? 'text-red-400' : 'text-gray-500'}>
                  Errors: {log.errorCount}
                </span>
                <span className={log.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}>
                  {log.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet-Specific Health Check */}
      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <h4 className="text-lg font-semibold text-yellow-400 mb-3">Check Specific Wallet</h4>
        <input
          type="text"
          placeholder="Enter wallet address (stake1u...)"
          value={selectedWallet}
          onChange={(e) => setSelectedWallet(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-yellow-500 mb-4"
        />

        {walletHealth && 'error' in walletHealth && (
          <div className="text-red-400 text-sm">Wallet not found</div>
        )}

        {walletHealth && !('error' in walletHealth) && (
          <div className="space-y-4">
            {/* Current State */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-gray-950/50 rounded border border-gray-700">
                <div className="text-xs text-gray-500">Status</div>
                <div className={`text-sm font-semibold ${walletHealth.isActive ? 'text-green-400' : 'text-gray-400'}`}>
                  {walletHealth.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="p-3 bg-gray-950/50 rounded border border-gray-700">
                <div className="text-xs text-gray-500">Verified</div>
                <div className={`text-sm font-semibold ${walletHealth.isVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                  {walletHealth.isVerified ? 'Yes' : 'No'}
                </div>
              </div>
              <div className="p-3 bg-gray-950/50 rounded border border-gray-700">
                <div className="text-xs text-gray-500">MEKs</div>
                <div className="text-sm font-semibold text-yellow-400">{walletHealth.currentMekCount}</div>
              </div>
              <div className="p-3 bg-gray-950/50 rounded border border-gray-700">
                <div className="text-xs text-gray-500">Gold/hr</div>
                <div className="text-sm font-semibold text-green-400">
                  {walletHealth.currentGoldPerHour.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Snapshot Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-950/50 rounded border border-gray-700">
                <div className="text-xs text-gray-500">Total Snapshots</div>
                <div className="text-lg font-bold text-blue-400">{walletHealth.totalSnapshots}</div>
              </div>
              <div className="p-3 bg-gray-950/50 rounded border border-gray-700">
                <div className="text-xs text-gray-500">Last Snapshot</div>
                <div className="text-sm text-gray-300">
                  {walletHealth.lastSnapshotTime
                    ? `${walletHealth.hoursSinceLastSnapshot?.toFixed(1)}h ago`
                    : 'Never'}
                </div>
              </div>
              <div className="p-3 bg-gray-950/50 rounded border border-gray-700">
                <div className="text-xs text-gray-500">Consecutive Failures</div>
                <div className={`text-lg font-bold ${walletHealth.consecutiveFailures >= 3 ? 'text-red-400' : 'text-gray-400'}`}>
                  {walletHealth.consecutiveFailures}
                </div>
              </div>
            </div>

            {/* MEK Transfers */}
            {walletHealth.mekTransfers.count > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-yellow-400 mb-2">
                  MEK Transfers ({walletHealth.mekTransfers.count})
                </h5>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {walletHealth.mekTransfers.transfers.map((transfer, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-950/50 rounded border border-gray-700 text-xs"
                    >
                      <span className="text-gray-400">
                        {new Date(transfer.timestamp).toLocaleString()}
                      </span>
                      <div className="flex items-center gap-3">
                        {transfer.meksAdded > 0 && (
                          <span className="text-green-400">+{transfer.meksAdded} MEKs</span>
                        )}
                        {transfer.meksRemoved > 0 && (
                          <span className="text-red-400">-{transfer.meksRemoved} MEKs</span>
                        )}
                        <span className={transfer.goldRateChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {transfer.goldRateChange >= 0 ? '+' : ''}{transfer.goldRateChange.toFixed(2)} g/hr
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Snapshot Gaps */}
            {walletHealth.snapshotGaps.count > 0 && (
              <div className="p-3 bg-yellow-900/20 rounded border border-yellow-700">
                <h5 className="text-sm font-semibold text-yellow-400 mb-2">
                  ⚠️ Snapshot Gaps Detected ({walletHealth.snapshotGaps.count})
                </h5>
                <div className="space-y-1 text-xs">
                  {walletHealth.snapshotGaps.gaps.map((gap, index) => (
                    <div key={index} className="text-gray-400">
                      {gap.gapHours}h gap from {new Date(gap.from).toLocaleString()} to {new Date(gap.to).toLocaleString()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/50">
        <h4 className="text-sm font-semibold text-blue-300 mb-2">💡 How Snapshots Work</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Snapshots run automatically every 6 hours</li>
          <li>• Active wallets (used in last 15 days) are checked via Blockfrost blockchain queries</li>
          <li>• Inactive wallets are skipped to save API costs</li>
          <li>• Only blockchain-verified wallets accumulate gold</li>
          <li>• Snapshots create an audit trail to detect MEK transfers (anti-cheat)</li>
          <li>• If someone tries to game the system by moving MEKs around, only continuous ownership earns gold</li>
        </ul>
      </div>
    </div>
  );
}
