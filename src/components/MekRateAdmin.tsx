'use client'

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";


interface SecurityMetrics {
  suspiciousWallets: number;
  anomalies: Array<{
    type: string;
    walletAddress: string;
    detail: string;
    timestamp: number;
  }>;
  rateLimitViolations: number;
  failedSignatures: number;
}

export default function MekRateAdmin() {

  // Admin controls state
  const [showAnomalies, setShowAnomalies] = useState(true);
  const [autoSnapshot, setAutoSnapshot] = useState(true);
  const [maxGoldCap, setMaxGoldCap] = useState(10000000); // 10M gold cap
  const [snapshotInterval, setSnapshotInterval] = useState(60); // minutes

  // Security state
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    suspiciousWallets: 0,
    anomalies: [],
    rateLimitViolations: 0,
    failedSignatures: 0
  });

  // Query data
  const goldMiningStats = useQuery(api.goldMining.getGoldMiningStats);
  const currentRateConfig = useQuery(api.mekGoldRates.getCurrentConfig);
  const topMiners = useQuery(api.goldMining.getTopMiners);
  const auditLogs = useQuery(api.auditLogs.getRecentLogs, { limit: 10 });

  // Mutations
  const triggerSnapshot = useAction(api.offlineAccumulation.updateAllUsersGold);
  const clearCache = useAction(api.blockfrostNftFetcher.clearNFTCache);
  const detectAnomalies = useAction(api.securityMonitoring.detectAnomalies);


  // Check for anomalies periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      if (showAnomalies) {
        try {
          const anomalies = await detectAnomalies();
          setSecurityMetrics(prev => ({
            ...prev,
            anomalies: anomalies.anomalies,
            suspiciousWallets: anomalies.suspiciousCount
          }));
        } catch (error) {
          console.error('Failed to detect anomalies:', error);
        }
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [showAnomalies, detectAnomalies]);


  // Handle manual snapshot
  const handleSnapshot = async () => {
    try {
      const result = await triggerSnapshot();
      alert(`Snapshot completed: ${result.updatedCount} wallets updated`);
    } catch (error) {
      console.error('Failed to trigger snapshot:', error);
      alert('Failed to trigger snapshot');
    }
  };

  // Handle cache clear
  const handleClearCache = async () => {
    try {
      await clearCache({});
      alert('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache');
    }
  };


  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-black/50 border border-yellow-500/30 p-4">
          <div className="text-gray-400 text-xs uppercase">Total Users</div>
          <div className="text-2xl font-bold text-yellow-400">
            {goldMiningStats?.totalUsers || 0}
          </div>
        </div>
        <div className="bg-black/50 border border-yellow-500/30 p-4">
          <div className="text-gray-400 text-xs uppercase">Total Gold/Hr</div>
          <div className="text-2xl font-bold text-yellow-400">
            {goldMiningStats?.totalGoldPerHour?.toFixed(2) || '0'}
          </div>
        </div>
        <div className="bg-black/50 border border-yellow-500/30 p-4">
          <div className="text-gray-400 text-xs uppercase">Active (24h)</div>
          <div className="text-2xl font-bold text-yellow-400">
            {goldMiningStats?.activeUsersLast24h || 0}
          </div>
        </div>
        <div className="bg-black/50 border border-yellow-500/30 p-4">
          <div className="text-gray-400 text-xs uppercase">Total Meks</div>
          <div className="text-2xl font-bold text-yellow-400">
            {goldMiningStats?.totalMeks || 0}
          </div>
        </div>
      </div>

      {/* Current Gold Rate Configuration (Read-Only Display) */}
      <div className="bg-black/50 border-2 border-yellow-500/30 p-6">
        <h3 className="text-xl font-bold text-yellow-400 mb-4">CURRENT GOLD RATE CONFIGURATION</h3>

        <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 mb-4">
          <p className="text-yellow-400 text-sm">
            ⚠️ Gold rates are configured in the Mek Systems section below. This displays the current active configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Display Current Configuration */}
          <div>
            <label className="text-gray-400 text-sm uppercase">Active Curve Type</label>
            <div className="text-yellow-400 text-lg font-bold mt-1">
              {currentRateConfig?.curveType?.toUpperCase() || 'Not Set'}
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm uppercase">Gold Range</label>
            <div className="text-yellow-400 text-lg font-bold mt-1">
              {currentRateConfig?.minGold || 0} - {currentRateConfig?.maxGold || 0} g/hr
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm uppercase">Steepness</label>
            <div className="text-yellow-400 text-lg font-bold mt-1">
              {currentRateConfig?.steepness || 0}
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm uppercase">Mid Point</label>
            <div className="text-yellow-400 text-lg font-bold mt-1">
              Rank {currentRateConfig?.midPoint || 0}
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm uppercase">Total Meks</label>
            <div className="text-yellow-400 text-lg font-bold mt-1">
              {currentRateConfig?.totalMeks || 0}
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm uppercase">Rounding</label>
            <div className="text-yellow-400 text-lg font-bold mt-1">
              {currentRateConfig?.rounding === 'whole' ? 'Whole Numbers' :
               currentRateConfig?.rounding === '1decimal' ? '1 Decimal' :
               currentRateConfig?.rounding === '2decimal' ? '2 Decimals' : 'Not Set'}
            </div>
          </div>
        </div>

        {/* Link to Configuration */}
        <div className="mt-6">
          <a
            href="#mek-systems"
            className="inline-block px-6 py-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30"
          >
            → CONFIGURE RATES IN MEK SYSTEMS
          </a>
        </div>
      </div>

      {/* System Controls */}
      <div className="bg-black/50 border-2 border-blue-500/30 p-6">
        <h3 className="text-xl font-bold text-blue-400 mb-4">SYSTEM CONTROLS</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Max Gold Cap */}
          <div>
            <label className="text-gray-400 text-sm uppercase">Max Gold Cap</label>
            <input
              type="number"
              value={maxGoldCap}
              onChange={(e) => setMaxGoldCap(parseInt(e.target.value))}
              className="w-full bg-black/30 border border-blue-500/30 text-blue-400 p-2 mt-1"
            />
          </div>

          {/* Snapshot Interval */}
          <div>
            <label className="text-gray-400 text-sm uppercase">Snapshot Interval (min)</label>
            <input
              type="number"
              value={snapshotInterval}
              onChange={(e) => setSnapshotInterval(parseInt(e.target.value))}
              className="w-full bg-black/30 border border-blue-500/30 text-blue-400 p-2 mt-1"
            />
          </div>

          {/* Auto Snapshot */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoSnapshot}
              onChange={(e) => setAutoSnapshot(e.target.checked)}
              className="w-4 h-4"
            />
            <label className="text-gray-400 text-sm uppercase">Auto Snapshot</label>
          </div>

          {/* Show Anomalies */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showAnomalies}
              onChange={(e) => setShowAnomalies(e.target.checked)}
              className="w-4 h-4"
            />
            <label className="text-gray-400 text-sm uppercase">Monitor Anomalies</label>
          </div>
        </div>

        {/* Manual Actions */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSnapshot}
            className="px-4 py-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30"
          >
            MANUAL SNAPSHOT
          </button>
          <button
            onClick={handleClearCache}
            className="px-4 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30"
          >
            CLEAR CACHE
          </button>
          <button
            onClick={() => window.location.href = '/mek-rate-experiment'}
            className="px-4 py-2 bg-gray-500/20 border border-gray-500/50 text-gray-400 hover:bg-gray-500/30"
          >
            VIEW DETAILED STATS
          </button>
        </div>
      </div>

      {/* Security Monitoring */}
      <div className="bg-black/50 border-2 border-red-500/30 p-6">
        <h3 className="text-xl font-bold text-red-400 mb-4">SECURITY MONITORING</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-black/30 p-3">
            <div className="text-gray-400 text-xs uppercase">Suspicious Wallets</div>
            <div className="text-xl font-bold text-red-400">{securityMetrics.suspiciousWallets}</div>
          </div>
          <div className="bg-black/30 p-3">
            <div className="text-gray-400 text-xs uppercase">Rate Limit Violations</div>
            <div className="text-xl font-bold text-orange-400">{securityMetrics.rateLimitViolations}</div>
          </div>
          <div className="bg-black/30 p-3">
            <div className="text-gray-400 text-xs uppercase">Failed Signatures</div>
            <div className="text-xl font-bold text-yellow-400">{securityMetrics.failedSignatures}</div>
          </div>
          <div className="bg-black/30 p-3">
            <div className="text-gray-400 text-xs uppercase">Anomalies (24h)</div>
            <div className="text-xl font-bold text-purple-400">{securityMetrics.anomalies.length}</div>
          </div>
        </div>

        {/* Recent Anomalies */}
        {securityMetrics.anomalies.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-gray-400 mb-2 uppercase">Recent Anomalies</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {securityMetrics.anomalies.slice(0, 5).map((anomaly, i) => (
                <div key={i} className="bg-black/30 p-2 border-l-2 border-red-500 text-xs">
                  <div className="flex justify-between">
                    <span className="text-red-400 font-bold">{anomaly.type}</span>
                    <span className="text-gray-500">
                      {new Date(anomaly.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-gray-400 mt-1">{anomaly.walletAddress}</div>
                  <div className="text-gray-500">{anomaly.detail}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Miners */}
      <div className="bg-black/50 border-2 border-green-500/30 p-6">
        <h3 className="text-xl font-bold text-green-400 mb-4">TOP MINERS</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 uppercase text-xs border-b border-green-500/20">
                <th className="text-left py-2">Wallet</th>
                <th className="text-right py-2">Meks</th>
                <th className="text-right py-2">Gold/Hr</th>
                <th className="text-right py-2">Total Gold</th>
              </tr>
            </thead>
            <tbody>
              {topMiners?.slice(0, 10).map((miner, i) => (
                <tr key={i} className="border-b border-gray-700/30">
                  <td className="py-2 text-gray-300 font-mono text-xs">
                    {miner.walletAddress.slice(0, 10)}...{miner.walletAddress.slice(-6)}
                  </td>
                  <td className="text-right text-yellow-400">{miner.mekCount}</td>
                  <td className="text-right text-green-400">{miner.totalGoldPerHour.toFixed(2)}</td>
                  <td className="text-right text-blue-400">{miner.currentGold?.toFixed(0) || '0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}