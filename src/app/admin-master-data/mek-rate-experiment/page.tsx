'use client'

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type SortField = 'walletAddress' | 'walletType' | 'mekCount' | 'totalGoldPerHour' | 'currentGold' | 'lastActiveDisplay' | 'createdAt';
type SortDirection = 'asc' | 'desc';

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
  highestRateMek: {
    name: string;
    rate: number;
    rank?: number;
  } | null;
}

export default function MekRateExperimentPage() {
  const [sortField, setSortField] = useState<SortField>('currentGold');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Fetch data from Convex
  const goldMiningData = useQuery(api.goldMining.getAllGoldMiningData) as MinerData[] | undefined;
  const stats = useQuery(api.goldMining.getGoldMiningStats);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!goldMiningData) return [];

    return [...goldMiningData].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

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
  }, [goldMiningData, sortField, sortDirection]);

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

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-yellow-500 uppercase tracking-wider mb-2">
            Mek Rate Experiment
          </h1>
          <p className="text-gray-400">Gold Mining System Analytics Dashboard</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-black/60 border border-yellow-500/30 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-gray-400 text-sm uppercase tracking-wider mb-1">Total Users</div>
              <div className="text-3xl font-bold text-yellow-500">{stats.totalUsers}</div>
            </div>

            <div className="bg-black/60 border border-yellow-500/30 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-gray-400 text-sm uppercase tracking-wider mb-1">Total Meks</div>
              <div className="text-3xl font-bold text-yellow-500">{stats.totalMeks}</div>
              <div className="text-xs text-gray-500 mt-1">
                Avg: {stats.averageMeksPerUser} per user
              </div>
            </div>

            <div className="bg-black/60 border border-yellow-500/30 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-gray-400 text-sm uppercase tracking-wider mb-1">Total Gold/Hour</div>
              <div className="text-3xl font-bold text-yellow-500">
                {stats.totalGoldPerHour.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Avg: {stats.averageGoldPerHour} per user
              </div>
            </div>

            <div className="bg-black/60 border border-yellow-500/30 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-gray-400 text-sm uppercase tracking-wider mb-1">Total Gold Mined</div>
              <div className="text-3xl font-bold text-yellow-500">
                {stats.totalGoldAccumulated.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Active 24h: {stats.activeUsersLast24h} users
              </div>
            </div>
          </div>
        )}

        {/* Wallet Type Breakdown */}
        {stats?.walletTypeBreakdown && Object.keys(stats.walletTypeBreakdown).length > 0 && (
          <div className="bg-black/60 border border-yellow-500/30 rounded-lg p-4 backdrop-blur-sm mb-8">
            <div className="text-gray-400 text-sm uppercase tracking-wider mb-3">Wallet Types</div>
            <div className="flex gap-4 flex-wrap">
              {Object.entries(stats.walletTypeBreakdown).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-yellow-500 font-bold capitalize">{type}:</span>
                  <span className="text-gray-300">{count} users</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Table */}
        <div className="bg-black/60 border border-yellow-500/30 rounded-lg backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-yellow-500/30 bg-black/40">
                  <th
                    onClick={() => handleSort('walletAddress')}
                    className="px-4 py-3 text-left text-sm font-bold text-yellow-500 uppercase tracking-wider cursor-pointer hover:bg-yellow-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Wallet Address
                      {sortField === 'walletAddress' && (
                        <span className="text-yellow-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('walletType')}
                    className="px-4 py-3 text-left text-sm font-bold text-yellow-500 uppercase tracking-wider cursor-pointer hover:bg-yellow-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Wallet
                      {sortField === 'walletType' && (
                        <span className="text-yellow-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('mekCount')}
                    className="px-4 py-3 text-center text-sm font-bold text-yellow-500 uppercase tracking-wider cursor-pointer hover:bg-yellow-500/10 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-2">
                      Meks
                      {sortField === 'mekCount' && (
                        <span className="text-yellow-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('totalGoldPerHour')}
                    className="px-4 py-3 text-right text-sm font-bold text-yellow-500 uppercase tracking-wider cursor-pointer hover:bg-yellow-500/10 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-2">
                      Gold/Hour
                      {sortField === 'totalGoldPerHour' && (
                        <span className="text-yellow-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('currentGold')}
                    className="px-4 py-3 text-right text-sm font-bold text-yellow-500 uppercase tracking-wider cursor-pointer hover:bg-yellow-500/10 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-2">
                      Total Gold
                      {sortField === 'currentGold' && (
                        <span className="text-yellow-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('lastActiveDisplay')}
                    className="px-4 py-3 text-center text-sm font-bold text-yellow-500 uppercase tracking-wider cursor-pointer hover:bg-yellow-500/10 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-2">
                      Last Active
                      {sortField === 'lastActiveDisplay' && (
                        <span className="text-yellow-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('createdAt')}
                    className="px-4 py-3 text-center text-sm font-bold text-yellow-500 uppercase tracking-wider cursor-pointer hover:bg-yellow-500/10 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-2">
                      Joined
                      {sortField === 'createdAt' && (
                        <span className="text-yellow-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>

                  <th className="px-4 py-3 text-center text-sm font-bold text-yellow-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-yellow-500/10">
                {sortedData.map((miner, index) => (
                  <>
                    <tr
                      key={miner._id}
                      className={`hover:bg-yellow-500/5 transition-colors ${
                        index % 2 === 0 ? 'bg-black/20' : 'bg-black/40'
                      }`}
                    >
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300 font-mono">
                            {truncateWallet(miner.walletAddress)}
                          </span>
                          <button
                            onClick={() => navigator.clipboard.writeText(miner.walletAddress)}
                            className="text-gray-500 hover:text-yellow-500 transition-colors"
                            title="Copy full address"
                          >
                            📋
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm">
                        <span className="text-gray-300 capitalize">{miner.walletType}</span>
                      </td>

                      <td className="px-4 py-3 text-sm text-center">
                        <span className="text-white font-bold">{miner.mekCount}</span>
                      </td>

                      <td className="px-4 py-3 text-sm text-right">
                        <span className="text-yellow-400 font-bold">
                          {miner.totalGoldPerHour.toFixed(2)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm text-right">
                        <span className="text-green-400 font-bold">
                          {miner.currentGold.toLocaleString()}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm text-center">
                        <span className={`${
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
                      </td>

                      <td className="px-4 py-3 text-sm text-center">
                        <span className="text-gray-400 text-xs">
                          {formatDate(miner.createdAt)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm text-center">
                        <button
                          onClick={() => setExpandedRow(expandedRow === miner._id ? null : miner._id)}
                          className="text-yellow-500 hover:text-yellow-400 transition-colors"
                        >
                          {expandedRow === miner._id ? '▼' : '▶'}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Row Details */}
                    {expandedRow === miner._id && (
                      <tr className="bg-black/60">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="space-y-3">
                            {/* Best Mek Info */}
                            {miner.highestRateMek && (
                              <div className="flex items-center gap-4">
                                <span className="text-gray-400 text-sm">Best Mek:</span>
                                <span className="text-yellow-500 font-bold">
                                  {miner.highestRateMek.name}
                                </span>
                                <span className="text-gray-300">
                                  {miner.highestRateMek.rate.toFixed(2)} gold/hr
                                </span>
                                {miner.highestRateMek.rank && (
                                  <span className="text-gray-500">
                                    Rank #{miner.highestRateMek.rank}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Full Wallet Address */}
                            <div className="flex items-center gap-4">
                              <span className="text-gray-400 text-sm">Full Address:</span>
                              <span className="text-gray-300 font-mono text-xs break-all">
                                {miner.walletAddress}
                              </span>
                            </div>

                            {/* Timestamps */}
                            <div className="flex gap-8">
                              <div>
                                <span className="text-gray-400 text-sm">Last Active: </span>
                                <span className="text-gray-300 text-sm">
                                  {formatDate(miner.lastActiveTime)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 text-sm">Created: </span>
                                <span className="text-gray-300 text-sm">
                                  {formatDate(miner.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>

            {(!goldMiningData || goldMiningData.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No gold mining data available yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}