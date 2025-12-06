'use client';

import { useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';

/**
 * Admin tool to investigate the global level reset incident
 *
 * SIMPLIFIED FOR SINGLE DATABASE - now uses main Convex client (Sturgeon)
 *
 * This page queries production to analyze:
 * - When the reset happened
 * - How many players were affected
 * - What levels were lost
 * - Audit log evidence
 */
export default function LevelResetInvestigationPage() {
  const convex = useConvex();
  const [investigationData, setInvestigationData] = useState<any>(null);
  const [recoveryData, setRecoveryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runInvestigation = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[INVESTIGATION] Querying for level reset data...');

      const results = await convex.query(api.diagnosticLevelReset.investigateLevelReset, {});
      setInvestigationData(results);

      const recovery = await convex.query(api.diagnosticLevelReset.getRecoveryData, {});
      setRecoveryData(recovery);

      console.log('[INVESTIGATION] Results:', results);
      console.log('[RECOVERY] Data:', recovery);
    } catch (err: any) {
      console.error('[INVESTIGATION] Error:', err);
      setError(err.message || 'Failed to run investigation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            Level Reset Investigation
          </h1>
          <p className="text-gray-400">
            Diagnostic tool to investigate the global level reset incident on Sturgeon (production)
          </p>
        </div>

        {/* Run Investigation Button */}
        <div className="mb-6">
          <button
            onClick={runInvestigation}
            disabled={loading}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            {loading ? '🔍 Investigating...' : '🚨 Run Investigation on Sturgeon'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg">
            <p className="text-red-400">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Investigation Results */}
        {investigationData && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-gray-900/50 border border-yellow-500/30 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                Investigation Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-800/50 p-4 rounded">
                  <div className="text-sm text-gray-400">Total Meks</div>
                  <div className="text-3xl font-bold text-white">{investigationData.summary.totalMeks}</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded">
                  <div className="text-sm text-gray-400">Currently Level 1</div>
                  <div className="text-3xl font-bold text-yellow-400">
                    {investigationData.summary.level1Count}
                    <span className="text-sm ml-2">({investigationData.summary.level1Percentage})</span>
                  </div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded">
                  <div className="text-sm text-gray-400">Level 2+</div>
                  <div className="text-3xl font-bold text-green-400">{investigationData.summary.higherLevelCount}</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded">
                  <div className="text-sm text-gray-400">Discrepancies Found</div>
                  <div className={`text-3xl font-bold ${investigationData.summary.discrepanciesFound > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {investigationData.summary.discrepanciesFound}
                  </div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded">
                  <div className="text-sm text-gray-400">Affected Wallets</div>
                  <div className="text-3xl font-bold text-red-400">{investigationData.summary.affectedWallets}</div>
                </div>
              </div>
            </div>

            {/* Suspicious Gap */}
            {investigationData.suspiciousGap && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-red-400 mb-3">⚠️ Suspicious Activity Gap Detected</h3>
                <p className="text-gray-300 mb-3">
                  Found a {investigationData.suspiciousGap.gapHours} hour gap in upgrade activity:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 p-3 rounded">
                    <div className="text-sm text-gray-400">Last Activity Before Gap</div>
                    <div className="text-yellow-400 font-mono text-sm">{investigationData.suspiciousGap.beforeDate}</div>
                  </div>
                  <div className="bg-gray-900/50 p-3 rounded">
                    <div className="text-sm text-gray-400">First Activity After Gap</div>
                    <div className="text-yellow-400 font-mono text-sm">{investigationData.suspiciousGap.afterDate}</div>
                  </div>
                </div>
                <p className="text-red-300 mt-3 text-sm">
                  This gap suggests a reset occurred around: <strong>{investigationData.suspiciousGap.afterDate}</strong>
                </p>
              </div>
            )}

            {/* Reset Events */}
            {investigationData.resetEvents && investigationData.resetEvents.length > 0 && (
              <div className="bg-gray-900/50 border border-red-500/30 rounded-lg p-6">
                <h3 className="text-xl font-bold text-red-400 mb-3">🔴 Reset Events in Monitoring Logs</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {investigationData.resetEvents.map((event: any, idx: number) => (
                    <div key={idx} className="bg-gray-800/50 p-3 rounded border border-red-500/20">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-red-400 font-semibold">{event.functionName || event.category}</span>
                        <span className="text-gray-400 text-xs">{event.date}</span>
                      </div>
                      <p className="text-gray-300 text-sm">{event.message}</p>
                      {event.walletAddress && (
                        <p className="text-gray-500 text-xs font-mono mt-1">Wallet: {event.walletAddress.substring(0, 20)}...</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discrepancies */}
            {investigationData.discrepancies && investigationData.discrepancies.length > 0 && (
              <div className="bg-gray-900/50 border border-yellow-500/30 rounded-lg p-6">
                <h3 className="text-xl font-bold text-yellow-400 mb-3">
                  📊 Level Discrepancies (Top 20)
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Meks whose current level is LOWER than their last recorded level in audit logs:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="text-left p-2 text-gray-400">Asset Name</th>
                        <th className="text-center p-2 text-gray-400">Current Level</th>
                        <th className="text-center p-2 text-gray-400">Last Recorded</th>
                        <th className="text-center p-2 text-gray-400">Levels Lost</th>
                        <th className="text-left p-2 text-gray-400">Last Recorded Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investigationData.discrepancies.map((disc: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-700">
                          <td className="p-2 text-white">{disc.assetName}</td>
                          <td className="p-2 text-center text-yellow-400">{disc.currentLevel}</td>
                          <td className="p-2 text-center text-green-400">{disc.lastRecordedLevel}</td>
                          <td className="p-2 text-center text-red-400 font-bold">-{disc.lost}</td>
                          <td className="p-2 text-gray-400 text-xs font-mono">{disc.lastRecordedDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Last Upgrades */}
            {investigationData.lastUpgrades && (
              <div className="bg-gray-900/50 border border-blue-500/30 rounded-lg p-6">
                <h3 className="text-xl font-bold text-blue-400 mb-3">📅 Recent Upgrades (Last 10)</h3>
                <div className="space-y-2">
                  {investigationData.lastUpgrades.map((upgrade: any, idx: number) => (
                    <div key={idx} className="bg-gray-800/50 p-2 rounded text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-white">{upgrade.asset}</span>
                        <span className="text-gray-400 text-xs">{upgrade.date}</span>
                      </div>
                      <div className="text-gray-400 text-xs">
                        Level {upgrade.oldLevel} → {upgrade.newLevel}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recovery Data */}
        {recoveryData && (
          <div className="mt-8 bg-green-900/20 border border-green-500/50 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-green-400 mb-4" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              💾 Recovery Data Available
            </h2>
            <p className="text-gray-300 mb-4">
              Found level history for <strong>{recoveryData.totalMeks}</strong> meks in audit logs.
              This data can be used to restore levels.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="bg-gray-800/50 p-3 rounded">
                <div className="text-sm text-gray-400">Level 2</div>
                <div className="text-2xl font-bold text-yellow-400">{recoveryData.summary.level2Count}</div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded">
                <div className="text-sm text-gray-400">Level 3</div>
                <div className="text-2xl font-bold text-yellow-400">{recoveryData.summary.level3Count}</div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded">
                <div className="text-sm text-gray-400">Level 4</div>
                <div className="text-2xl font-bold text-yellow-400">{recoveryData.summary.level4Count}</div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded">
                <div className="text-sm text-gray-400">Level 5</div>
                <div className="text-2xl font-bold text-yellow-400">{recoveryData.summary.level5Count}</div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded">
                <div className="text-sm text-gray-400">Level 6+</div>
                <div className="text-2xl font-bold text-green-400">{recoveryData.summary.level6PlusCount}</div>
              </div>
            </div>
            <p className="text-green-300 text-sm">
              ✅ All level data is preserved in audit logs and can be restored using a recovery script.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
