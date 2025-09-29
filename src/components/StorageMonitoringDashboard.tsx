"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function StorageMonitoringDashboard() {
  const stats = useQuery(api.storageMonitoring.getStorageStats);

  if (!stats) {
    return (
      <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/30 rounded p-6">
        <div className="text-yellow-500 text-center">Loading storage statistics...</div>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round((bytes / (1024 * 1024)) * 100) / 100} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-black/60 backdrop-blur-sm border-2 border-yellow-500/50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-yellow-500 mb-4 uppercase tracking-wider font-['Orbitron']">
          Storage Monitoring Dashboard
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-black/40 border border-yellow-500/30 rounded p-4">
            <div className="text-gray-400 text-sm uppercase mb-1">Total Storage</div>
            <div className="text-3xl font-bold text-yellow-500">{stats.totals.estimatedSizeMB} MB</div>
          </div>

          <div className="bg-black/40 border border-yellow-500/30 rounded p-4">
            <div className="text-gray-400 text-sm uppercase mb-1">Total Records</div>
            <div className="text-3xl font-bold text-yellow-500">{stats.totals.totalRecords.toLocaleString()}</div>
          </div>

          <div className="bg-black/40 border border-yellow-500/30 rounded p-4">
            <div className="text-gray-400 text-sm uppercase mb-1">Active Wallets</div>
            <div className="text-3xl font-bold text-yellow-500">{stats.tables.goldMining.recordCount}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-black/40 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-lg font-bold text-blue-400 mb-3 uppercase">Growth Rate</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Last 24h:</span>
                <span className="text-white font-mono">{stats.growth.recordsLast24h} records</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Daily Average:</span>
                <span className="text-white font-mono">{stats.growth.avgRecordsPerDay} records</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Daily Growth:</span>
                <span className="text-white font-mono">{stats.growth.estimatedDailyGrowthKB} KB</span>
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-green-500/30 rounded-lg p-4">
            <h3 className="text-lg font-bold text-green-400 mb-3 uppercase">Projections</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Monthly Growth:</span>
                <span className="text-white font-mono">{stats.growth.projectedMonthlyGrowthMB} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Yearly Growth:</span>
                <span className="text-white font-mono">{stats.growth.projectedYearlyGrowthMB} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Est. Yearly Cost:</span>
                <span className="text-green-400 font-mono">${stats.costs.projectedYearlyUSD}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
          <h3 className="text-lg font-bold text-yellow-500 mb-3 uppercase">Table Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(stats.tables).map(([tableName, data]: [string, any]) => (
              <div key={tableName} className="flex items-center justify-between border-b border-gray-700/50 pb-2">
                <div className="flex-1">
                  <div className="text-white font-mono text-sm">{tableName}</div>
                  <div className="text-gray-500 text-xs">{data.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-mono text-sm">{data.recordCount.toLocaleString()} records</div>
                  <div className="text-gray-400 text-xs">{data.estimatedSizeKB} KB</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 bg-black/40 border border-purple-500/30 rounded-lg p-4">
          <h3 className="text-lg font-bold text-purple-400 mb-3 uppercase">Snapshot Details (Last 30 Days)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-gray-400 text-sm mb-2">Ownership History (6-hour)</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Last 24h:</span>
                  <span className="text-white font-mono">{stats.tables.mekOwnershipHistory.recent24h}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last 7d:</span>
                  <span className="text-white font-mono">{stats.tables.mekOwnershipHistory.recent7d}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last 30d:</span>
                  <span className="text-white font-mono">{stats.tables.mekOwnershipHistory.recent30d}</span>
                </div>
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-2">Gold Snapshots (Hourly)</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Last 24h:</span>
                  <span className="text-white font-mono">{stats.tables.goldSnapshots.recent24h}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last 7d:</span>
                  <span className="text-white font-mono">{stats.tables.goldSnapshots.recent7d}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Retention:</span>
                  <span className="text-green-400 font-mono">100/wallet</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          Last updated: {new Date(stats.timestamp).toLocaleString()} |
          Cost estimate based on Convex pricing: $0.20/GB/month
        </div>
      </div>
    </div>
  );
}