'use client'

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

type SortField = 'walletAddress' | 'walletType' | 'mekCount' | 'totalGoldPerHour' | 'currentGold' | 'lastActiveDisplay' | 'createdAt' | 'mekChange';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'connected' | 'top50' | 'snapshot';

interface MinerData {
  _id: string;
  walletAddress: string;
  walletType: string;
  mekCount: number;
  totalGoldPerHour: number;
  currentGold: number;
  lastActiveTime: number;
  lastActiveDisplay: string;
  createdAt: number;
  offlineEarnings?: number; // LEGACY: no longer used in simplified calculation
  snapshotMekCount?: number;
  lastSnapshotTime?: number;
  highestRateMek: {
    name: string;
    rate: number;
    rank?: number;
  } | null;
}

interface Top50Holder {
  stakeAddress: string;
  mekCount: number;
  theoreticalGoldPerHour: number;
}

export default function MekRateExperiment() {
  const [sortField, setSortField] = useState<SortField>('currentGold');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('connected');
  const [isRunningSnapshot, setIsRunningSnapshot] = useState(false);
  const [snapshotProgress, setSnapshotProgress] = useState<string>('');
  const [top50Holders, setTop50Holders] = useState<Top50Holder[]>([]);
  const [loadingTop50, setLoadingTop50] = useState(false);

  // Fetch data from Convex
  const goldMiningData = useQuery(api.goldMining.getAllGoldMiningData) as MinerData[] | undefined;
  const stats = useQuery(api.goldMining.getGoldMiningStats);
  const resetAllData = useMutation(api.goldMining.resetAllGoldMiningData);
  const clearFakeData = useMutation(api.goldMining.clearAllFakeData);
  const triggerSnapshot = useAction(api.goldMiningSnapshot.triggerSnapshot);
  const lastSnapshot = useQuery(api.goldMiningSnapshot.getLastSnapshotTime);
  const snapshotLogs = useQuery(api.goldMiningSnapshot.getSnapshotLogs, { limit: 10 });
  const top50Data = useQuery(api.getTop50MekHolders.getTop50MekHolders);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle reset
  const handleReset = async () => {
    setShowResetConfirm(false);
    await resetAllData();
  };

  // Handle clear fake data
  const handleClearFakeData = async () => {
    try {
      const result = await clearFakeData();
      alert(`${result.message}`);
      // Refresh the page or data
      window.location.reload();
    } catch (error) {
      console.error('Error clearing fake data:', error);
      alert('Failed to clear fake data');
    }
  };

  // Handle snapshot trigger
  const handleSnapshot = async () => {
    setIsRunningSnapshot(true);
    setSnapshotProgress('Running snapshot... This may take a while for real wallets...');

    try {
      const result = await triggerSnapshot();

      if (result && result.success) {
        setSnapshotProgress(`Snapshot completed! Updated: ${result.updatedCount}, Skipped: ${result.skippedCount}, Errors: ${result.errorCount}`);
      } else {
        setSnapshotProgress('Snapshot failed - check console for errors');
      }
    } catch (error) {
      setSnapshotProgress(`Error: ${error}`);
    }

    setTimeout(() => {
      setIsRunningSnapshot(false);
      setSnapshotProgress('');
    }, 3000);
  };

  // Load top 50 data from connected wallets
  const loadTop50 = () => {
    setLoadingTop50(true);

    // Use data from the query
    if (top50Data && top50Data.holders) {
      const holders: Top50Holder[] = top50Data.holders.map(h => ({
        stakeAddress: h.stakeAddress,
        mekCount: h.mekCount,
        theoreticalGoldPerHour: h.theoreticalGoldPerHour
      }));

      setTop50Holders(holders);
    } else {
      // No data yet
      setTop50Holders([]);
    }

    setLoadingTop50(false);
  };

  // Auto-load top 50 when view changes or data updates
  useEffect(() => {
    if (viewMode === 'top50') {
      loadTop50();
    }
  }, [viewMode, top50Data]);

  // Calculate Mek changes for connected wallets
  const connectedWithChanges = useMemo(() => {
    if (!goldMiningData) return [];

    return goldMiningData.map(miner => ({
      ...miner,
      mekChange: miner.snapshotMekCount !== undefined
        ? miner.mekCount - miner.snapshotMekCount
        : 0
    }));
  }, [goldMiningData]);

  // Sort data
  const sortedData = useMemo(() => {
    const dataToSort = viewMode === 'connected' ? connectedWithChanges : [];

    return [...dataToSort].sort((a, b) => {
      let aVal = a[sortField as keyof typeof a];
      let bVal = b[sortField as keyof typeof b];

      if (sortField === 'lastActiveDisplay') {
        // Convert to minutes for sorting
        const parseTime = (str: string): number => {
          if (str === 'Just now') return 0;
          const match = str.match(/(\d+)([mhd])/);
          if (!match) return 0;
          const [, num, unit] = match;
          const multiplier = unit === 'm' ? 1 : unit === 'h' ? 60 : 1440;
          return parseInt(num) * multiplier;
        };
        aVal = parseTime(a.lastActiveDisplay);
        bVal = parseTime(b.lastActiveDisplay);
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [connectedWithChanges, sortField, sortDirection, viewMode]);

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Truncate wallet address
  const truncateWallet = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  // Get activity status color
  const getActivityColor = (lastActive: string) => {
    if (lastActive === 'Just now') return 'bg-green-500';
    if (lastActive.includes('m')) return 'bg-yellow-500';
    if (lastActive.includes('h')) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black" />
        <div className="absolute inset-0" style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(250, 182, 23, 0.03) 2px,
              rgba(250, 182, 23, 0.03) 4px
            )
          `
        }} />
      </div>

      <div className="relative z-10 space-y-6 p-6">
        {/* Header Section */}
        <div className="bg-black/20 backdrop-blur-xl border-2 border-yellow-500/30 rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-yellow-500 uppercase tracking-wider font-['Orbitron']">
                Mek Rate Experiment
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-400 text-sm uppercase tracking-wider">System Active</span>
                </div>
                <span className="text-gray-500">|</span>
                <span className="text-gray-400 text-sm">Gold Mining Analytics & Snapshot Control</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Accumulated</div>
              <div className="text-3xl font-bold text-yellow-500 font-mono">
                {stats?.totalGoldAccumulated.toLocaleString() || '0'}
              </div>
              <div className="text-yellow-500/50 text-sm mt-1">Gold Units</div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-4 mt-6">
            <div className="flex gap-2 bg-black/40 p-1 rounded-lg border border-yellow-500/20">
              <button
                onClick={() => setViewMode('connected')}
                className={`px-4 py-2 rounded transition-all ${
                  viewMode === 'connected'
                    ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50'
                    : 'text-gray-400 hover:text-yellow-500'
                }`}
              >
                <span className="uppercase text-xs tracking-wider font-bold">Connected Wallets</span>
              </button>
              <button
                onClick={() => {
                  setViewMode('top50');
                  if (top50Holders.length === 0) loadTop50();
                }}
                className={`px-4 py-2 rounded transition-all ${
                  viewMode === 'top50'
                    ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50'
                    : 'text-gray-400 hover:text-yellow-500'
                }`}
              >
                <span className="uppercase text-xs tracking-wider font-bold">Top 50 Holders</span>
              </button>
              <button
                onClick={() => setViewMode('snapshot')}
                className={`px-4 py-2 rounded transition-all ${
                  viewMode === 'snapshot'
                    ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50'
                    : 'text-gray-400 hover:text-yellow-500'
                }`}
              >
                <span className="uppercase text-xs tracking-wider font-bold">Snapshot Logs</span>
              </button>
            </div>

            <div className="flex-1" />

            {/* Snapshot Button */}
            <button
              onClick={handleSnapshot}
              disabled={isRunningSnapshot}
              className={`relative px-6 py-3 bg-blue-900/20 border-2 border-blue-500/50 text-blue-400
                       hover:bg-blue-900/30 transition-all uppercase tracking-wider text-sm font-bold
                       backdrop-blur-sm overflow-hidden group ${isRunningSnapshot ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/20 to-blue-600/0
                            translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span className="relative z-10">
                {isRunningSnapshot ? '⏳ Running...' : '📸 Run Snapshot'}
              </span>
            </button>

            {/* Reset Button */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="relative px-6 py-3 bg-red-900/20 border-2 border-red-500/50 text-red-400
                       hover:bg-red-900/30 transition-all uppercase tracking-wider text-sm font-bold
                       backdrop-blur-sm overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/20 to-red-600/0
                            translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span className="relative z-10">⚠ Reset All Data</span>
            </button>

            {/* Clear Fake Data Button */}
            <button
              onClick={handleClearFakeData}
              className="px-6 py-2 bg-orange-900/30 border-2 border-orange-500/50 rounded-lg text-orange-400
                       hover:bg-orange-900/50 transition-all uppercase tracking-wider text-sm font-bold
                       backdrop-blur-sm overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600/0 via-orange-600/20 to-orange-600/0
                            translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span className="relative z-10">🗑️ Clear Fake Data</span>
            </button>
          </div>

          {/* Snapshot Progress */}
          {snapshotProgress && (
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="text-blue-400 text-sm font-mono">{snapshotProgress}</div>
            </div>
          )}
        </div>

        {/* Last Snapshot Info */}
        {lastSnapshot && (
          <div className="bg-black/20 backdrop-blur-xl border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-gray-500 text-xs uppercase tracking-wider">Last Snapshot:</span>
                <span className="text-yellow-400 font-mono">{formatDate(lastSnapshot.timestamp)}</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-gray-400">
                  <span className="text-green-400 font-bold">{lastSnapshot.updatedCount}</span> updated
                </span>
                <span className="text-gray-400">
                  <span className="text-yellow-400 font-bold">{lastSnapshot.totalMiners}</span> total
                </span>
                {lastSnapshot.errorCount > 0 && (
                  <span className="text-gray-400">
                    <span className="text-red-400 font-bold">{lastSnapshot.errorCount}</span> errors
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards Grid */}
        {stats && viewMode === 'connected' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users Card */}
            <div className="relative bg-black/20 backdrop-blur-xl border border-yellow-500/20 rounded-lg p-6 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-yellow-500/50" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-yellow-500/50" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-yellow-500/50" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-yellow-500/50" />
              </div>

              <div className="text-gray-500 text-xs uppercase tracking-[0.2em] mb-3">Connected Users</div>
              <div className="text-4xl font-bold text-yellow-500 font-mono mb-2">
                {stats.totalUsers}
              </div>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
            </div>

            {/* Total Meks Card */}
            <div className="relative bg-black/20 backdrop-blur-xl border border-yellow-500/20 rounded-lg p-6 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-yellow-500/50" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-yellow-500/50" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-yellow-500/50" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-yellow-500/50" />
              </div>

              <div className="text-gray-500 text-xs uppercase tracking-[0.2em] mb-3">Total Meks</div>
              <div className="text-4xl font-bold text-yellow-500 font-mono mb-1">
                {stats.totalMeks}
              </div>
              <div className="text-xs text-yellow-500/60">
                AVG: {stats.averageMeksPerUser} per user
              </div>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent mt-2" />
            </div>

            {/* Gold Per Hour Card */}
            <div className="relative bg-black/20 backdrop-blur-xl border border-yellow-500/20 rounded-lg p-6 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-yellow-500/50" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-yellow-500/50" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-yellow-500/50" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-yellow-500/50" />
              </div>

              <div className="text-gray-500 text-xs uppercase tracking-[0.2em] mb-3">Gold/Hour</div>
              <div className="text-3xl font-bold text-yellow-500 font-mono mb-1">
                {stats.totalGoldPerHour.toLocaleString()}
              </div>
              <div className="text-xs text-yellow-500/60">
                AVG: {stats.averageGoldPerHour}/user
              </div>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent mt-2" />
            </div>

            {/* Active Users Card */}
            <div className="relative bg-black/20 backdrop-blur-xl border border-yellow-500/20 rounded-lg p-6 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-yellow-500/50" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-yellow-500/50" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-yellow-500/50" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-yellow-500/50" />
              </div>

              <div className="text-gray-500 text-xs uppercase tracking-[0.2em] mb-3">Active 24H</div>
              <div className="text-4xl font-bold text-green-500 font-mono mb-2">
                {stats.activeUsersLast24h}
              </div>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {viewMode === 'connected' && (
          /* Connected Wallets Table */
          <div className="bg-black/20 backdrop-blur-xl border border-yellow-500/20 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-black/40 border-b border-yellow-500/20">
                    <th
                      onClick={() => handleSort('walletAddress')}
                      className="px-6 py-4 text-left text-xs font-bold text-yellow-500/80 uppercase tracking-[0.2em] cursor-pointer hover:bg-yellow-500/5 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        Wallet
                        {sortField === 'walletAddress' && (
                          <span className="text-yellow-400">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('mekCount')}
                      className="px-6 py-4 text-center text-xs font-bold text-yellow-500/80 uppercase tracking-[0.2em] cursor-pointer hover:bg-yellow-500/5 transition-all"
                    >
                      <div className="flex items-center justify-center gap-2">
                        Meks
                        {sortField === 'mekCount' && (
                          <span className="text-yellow-400">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('mekChange')}
                      className="px-6 py-4 text-center text-xs font-bold text-yellow-500/80 uppercase tracking-[0.2em] cursor-pointer hover:bg-yellow-500/5 transition-all"
                    >
                      <div className="flex items-center justify-center gap-2">
                        Change
                        {sortField === 'mekChange' && (
                          <span className="text-yellow-400">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('totalGoldPerHour')}
                      className="px-6 py-4 text-right text-xs font-bold text-yellow-500/80 uppercase tracking-[0.2em] cursor-pointer hover:bg-yellow-500/5 transition-all"
                    >
                      <div className="flex items-center justify-end gap-2">
                        Gold/Hr
                        {sortField === 'totalGoldPerHour' && (
                          <span className="text-yellow-400">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('currentGold')}
                      className="px-6 py-4 text-right text-xs font-bold text-yellow-500/80 uppercase tracking-[0.2em] cursor-pointer hover:bg-yellow-500/5 transition-all"
                    >
                      <div className="flex items-center justify-end gap-2">
                        Total Gold
                        {sortField === 'currentGold' && (
                          <span className="text-yellow-400">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('lastActiveDisplay')}
                      className="px-6 py-4 text-center text-xs font-bold text-yellow-500/80 uppercase tracking-[0.2em] cursor-pointer hover:bg-yellow-500/5 transition-all"
                    >
                      <div className="flex items-center justify-center gap-2">
                        Status
                        {sortField === 'lastActiveDisplay' && (
                          <span className="text-yellow-400">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-yellow-500/10">
                  {sortedData.map((miner: any) => (
                    <tr
                      key={miner._id}
                      className="hover:bg-yellow-500/5 transition-all bg-black/10"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20
                                        border border-yellow-500/30 flex items-center justify-center">
                            <span className="text-yellow-500 text-xs font-bold">
                              {miner.walletType[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-gray-300 font-mono text-sm">
                              {truncateWallet(miner.walletAddress)}
                            </div>
                            <div className="text-gray-500 text-xs capitalize">{miner.walletType}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="text-white font-bold text-lg">{miner.mekCount}</span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        {miner.mekChange !== 0 && (
                          <span className={`font-bold text-lg ${
                            miner.mekChange > 0 ? 'text-green-400' :
                            miner.mekChange < 0 ? 'text-red-400' :
                            'text-gray-400'
                          }`}>
                            {miner.mekChange > 0 && '+'}{miner.mekChange}
                          </span>
                        )}
                        {miner.mekChange === 0 && miner.snapshotMekCount !== undefined && (
                          <span className="text-gray-400">-</span>
                        )}
                        {miner.snapshotMekCount === undefined && (
                          <span className="text-gray-500 text-xs">No snapshot</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className="text-yellow-400 font-bold text-lg font-mono">
                          {miner.totalGoldPerHour.toFixed(1)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div>
                          <span className="text-green-400 font-bold text-lg font-mono">
                            {miner.currentGold.toLocaleString()}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getActivityColor(miner.lastActiveDisplay)}`} />
                          <span className={`text-sm ${
                            miner.lastActiveDisplay === 'Just now'
                              ? 'text-green-400'
                              : miner.lastActiveDisplay.includes('m')
                              ? 'text-yellow-400'
                              : miner.lastActiveDisplay.includes('h')
                              ? 'text-orange-400'
                              : 'text-red-400'
                          }`}>
                            {miner.lastActiveDisplay}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {(!goldMiningData || goldMiningData.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-2xl mb-2">No Connected Wallets</div>
                  <div className="text-sm">Waiting for users to connect...</div>
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'top50' && (
          /* Top 50 Holders Table */
          <div className="bg-black/20 backdrop-blur-xl border border-yellow-500/20 rounded-lg overflow-hidden">
            {loadingTop50 ? (
              <div className="text-center py-12">
                <div className="text-yellow-500 text-2xl animate-pulse">Loading Top 50 Holders...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-black/40 border-b border-yellow-500/20">
                      <th className="px-6 py-4 text-left text-xs font-bold text-yellow-500/80 uppercase tracking-[0.2em]">
                        Rank
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-yellow-500/80 uppercase tracking-[0.2em]">
                        Stake Address
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-yellow-500/80 uppercase tracking-[0.2em]">
                        Mek Count
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-yellow-500/80 uppercase tracking-[0.2em]">
                        Theoretical Gold/Hr
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-yellow-500/10">
                    {top50Holders.map((holder, index) => (
                      <tr
                        key={holder.stakeAddress}
                        className="hover:bg-yellow-500/5 transition-all bg-black/10"
                      >
                        <td className="px-6 py-4">
                          <div className={`font-bold text-lg ${
                            index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-gray-300' :
                            index === 2 ? 'text-orange-600' :
                            'text-gray-400'
                          }`}>
                            #{index + 1}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-gray-300 font-mono text-sm">
                            {truncateWallet(holder.stakeAddress)}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className="text-white font-bold text-lg">{holder.mekCount}</span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <span className="text-yellow-400 font-bold text-lg font-mono">
                            {holder.theoreticalGoldPerHour.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {viewMode === 'snapshot' && (
          /* Snapshot Logs */
          <div className="bg-black/20 backdrop-blur-xl border border-yellow-500/20 rounded-lg overflow-hidden p-6">
            <h3 className="text-xl font-bold text-yellow-500 uppercase tracking-wider mb-4">Snapshot History</h3>

            {snapshotLogs && snapshotLogs.length > 0 ? (
              <div className="space-y-3">
                {snapshotLogs.map((log, index) => (
                  <div key={index} className="bg-black/40 border border-yellow-500/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-yellow-400 font-mono">{log.date}</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        log.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        log.status === 'triggered_manually' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Total Miners:</span>
                        <span className="text-white ml-2 font-bold">{log.totalMiners}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Updated:</span>
                        <span className="text-green-400 ml-2 font-bold">{log.updatedCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Errors:</span>
                        <span className={`ml-2 font-bold ${log.errorCount > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {log.errorCount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-xl mb-2">No Snapshot History</div>
                <div className="text-sm">Run a snapshot to see logs here</div>
              </div>
            )}
          </div>
        )}

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-black/95 border-2 border-red-500 rounded-lg p-8 max-w-md relative overflow-hidden">
              {/* Hazard Stripes Background */}
              <div className="absolute inset-0 opacity-10">
                <div className="w-full h-full" style={{
                  background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #EF4444 10px, #EF4444 20px)'
                }} />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-4xl">⚠</div>
                  <h3 className="text-2xl font-bold text-red-500 uppercase tracking-wider">System Reset</h3>
                </div>

                <div className="bg-red-950/50 border border-red-500/30 rounded p-4 mb-6 font-mono text-sm">
                  <div className="text-red-400 mb-2">WARNING: PERMANENT DATA DELETION</div>
                  <div className="text-gray-400 space-y-1">
                    <div>• All wallet connections will be erased</div>
                    <div>• All gold accumulation will be reset to 0</div>
                    <div>• All Mek ownership records will be deleted</div>
                    <div>• All mining history will be purged</div>
                  </div>
                </div>

                <div className="text-red-300 font-bold text-center mb-6 uppercase tracking-wider">
                  This action cannot be undone!
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleReset}
                    className="flex-1 px-4 py-3 bg-red-600/20 border-2 border-red-600 text-red-500
                             hover:bg-red-600/30 font-bold rounded transition-all uppercase tracking-wider"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 px-4 py-3 bg-gray-800/50 border-2 border-gray-600 text-gray-300
                             hover:bg-gray-700/50 font-bold rounded transition-all uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}