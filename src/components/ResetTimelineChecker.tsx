'use client';

import { useState } from 'react';
import { sturgeonClient } from '@/lib/sturgeonClient';
import { api } from '@/convex/_generated/api';

/**
 * Simple component to check when the level reset happened on Sturgeon
 * Shows timeline from audit logs and monitoring logs
 */
export default function ResetTimelineChecker() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runCheck = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[TIMELINE CHECK] Querying Sturgeon audit logs...');
      const data = await sturgeonClient.query(api.diagnosticFindResetTime.findResetTimestamp, {});
      setResults(data);
      console.log('[TIMELINE CHECK] Results:', data);
    } catch (err: any) {
      console.error('[TIMELINE CHECK] Error:', err);
      setError(err.message || 'Failed to query Sturgeon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 rounded-lg border border-yellow-500/30">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">
        🕐 Reset Timeline Investigation
      </h2>
      <p className="text-gray-400 mb-4">
        Check audit logs to find exactly when mek levels were reset on Sturgeon
      </p>

      <button
        onClick={runCheck}
        disabled={loading}
        className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '🔍 Checking Logs...' : '🚀 Find Reset Timeline'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-900/30 border border-red-500 rounded-lg">
          <p className="text-red-400"><strong>Error:</strong> {error}</p>
        </div>
      )}

      {results && (
        <div className="mt-6 space-y-4">
          {/* Summary */}
          <div className="p-4 bg-gray-800/50 rounded-lg border border-yellow-500/20">
            <h3 className="text-xl font-bold text-yellow-400 mb-3">Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Current Level 1:</span>
                <span className="ml-2 text-white font-bold">{results.summary.currentLevel1Count}</span>
              </div>
              <div>
                <span className="text-gray-400">Current Level 2+:</span>
                <span className="ml-2 text-white font-bold">{results.summary.currentHigherLevelCount}</span>
              </div>
            </div>
          </div>

          {/* Last Upgrade Before Reset */}
          {results.summary.lastUpgradeFound ? (
            <div className="p-4 bg-green-900/20 border border-green-500/50 rounded-lg">
              <h3 className="text-xl font-bold text-green-400 mb-3">
                📅 Last Upgrade Before Reset
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">When:</span>
                  <span className="text-white font-mono">{results.summary.lastUpgradeFound.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Hours Ago:</span>
                  <span className="text-yellow-400 font-bold">{results.summary.hoursAgo} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Asset:</span>
                  <span className="text-white">{results.summary.lastUpgradeFound.asset}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Upgrade:</span>
                  <span className="text-white">
                    Level {results.summary.lastUpgradeFound.oldLevel} → {results.summary.lastUpgradeFound.newLevel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Wallet:</span>
                  <span className="text-white font-mono text-xs">{results.summary.lastUpgradeFound.wallet}</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-900/30 rounded border border-yellow-500/30">
                <p className="text-yellow-300 text-sm">
                  💡 <strong>This means:</strong> The reset happened sometime after {results.summary.lastUpgradeFound.date}
                  {' '}(about {results.summary.hoursAgo} hours ago)
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400">
                ⚠️ No upgrade records found with level &gt; 1. Audit logs may not have enough history.
              </p>
            </div>
          )}

          {/* Reset Events in Monitoring Logs */}
          {results.resetEventsInMonitoringLogs && results.resetEventsInMonitoringLogs.length > 0 && (
            <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
              <h3 className="text-xl font-bold text-red-400 mb-3">
                🚨 Reset Events in Monitoring Logs
              </h3>
              <div className="space-y-2">
                {results.resetEventsInMonitoringLogs.map((event: any, idx: number) => (
                  <div key={idx} className="p-3 bg-gray-800/50 rounded border border-red-500/20">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-red-400 font-semibold">{event.functionName || event.category}</span>
                      <span className="text-gray-400 text-xs">{event.hoursAgo} hours ago</span>
                    </div>
                    <p className="text-gray-300 text-sm">{event.message}</p>
                    <p className="text-gray-500 text-xs font-mono mt-1">{event.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Upgrades */}
          {results.recentUpgrades && results.recentUpgrades.length > 0 && (
            <div className="p-4 bg-gray-800/50 rounded-lg border border-blue-500/30">
              <h3 className="text-xl font-bold text-blue-400 mb-3">
                📊 Recent Upgrade History (Last 10)
              </h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {results.recentUpgrades.map((upgrade: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-2 bg-gray-900/30 rounded">
                    <span className="text-gray-400">{upgrade.hoursAgo}h ago</span>
                    <span className="text-white">{upgrade.asset}</span>
                    <span className="text-yellow-400">L{upgrade.oldLevel} → L{upgrade.newLevel}</span>
                    <span className="text-gray-500 font-mono">{upgrade.wallet}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
