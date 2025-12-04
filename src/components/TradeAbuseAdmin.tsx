'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { createPortal } from 'react-dom';

type SubView = 'dashboard' | 'flagged' | 'investigate' | 'simulate';
type FlagStatus = 'pending' | 'investigating' | 'confirmed_abuse' | 'cleared' | 'auto_cleared';

const FLAG_REASON_LABELS: Record<string, { label: string; color: string }> = {
  repeated_pair: { label: 'Repeated Pair', color: 'bg-orange-500/30 border-orange-500 text-orange-300' },
  fast_purchase: { label: 'Fast Purchase', color: 'bg-red-500/30 border-red-500 text-red-300' },
  price_gap: { label: 'Price Gap', color: 'bg-purple-500/30 border-purple-500 text-purple-300' },
  new_corp_buyer: { label: 'New Corp', color: 'bg-blue-500/30 border-blue-500 text-blue-300' },
  same_ip: { label: 'Same IP', color: 'bg-red-600/30 border-red-600 text-red-200' },
  same_fingerprint: { label: 'Same Device', color: 'bg-red-600/30 border-red-600 text-red-200' },
  same_wallet: { label: 'Same Wallet', color: 'bg-red-700/30 border-red-700 text-red-100' },
  session_overlap: { label: 'Session Overlap', color: 'bg-yellow-500/30 border-yellow-500 text-yellow-300' },
  manual_flag: { label: 'Manual', color: 'bg-gray-500/30 border-gray-500 text-gray-300' },
};

const STATUS_LABELS: Record<FlagStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/30 border-yellow-500 text-yellow-300' },
  investigating: { label: 'Investigating', color: 'bg-blue-500/30 border-blue-500 text-blue-300' },
  confirmed_abuse: { label: 'Confirmed', color: 'bg-red-500/30 border-red-500 text-red-300' },
  cleared: { label: 'Cleared', color: 'bg-green-500/30 border-green-500 text-green-300' },
  auto_cleared: { label: 'Auto-Cleared', color: 'bg-gray-500/30 border-gray-500 text-gray-300' },
};

export default function TradeAbuseAdmin() {
  const [activeView, setActiveView] = useState<SubView>('dashboard');
  const [statusFilter, setStatusFilter] = useState<FlagStatus | 'all'>('pending');
  const [selectedFlag, setSelectedFlag] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCorpId, setSelectedCorpId] = useState<Id<"users"> | null>(null);

  // Queries
  const stats = useQuery(api.tradeAbuse.getAbuseStats);
  const flaggedTransactions = useQuery(api.tradeAbuse.getFlaggedTransactions, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 100,
  });
  const flaggedPairs = useQuery(api.tradeAbuse.getFlaggedCorpPairs, { limit: 20 });
  const corpProfile = useQuery(
    api.tradeAbuse.getCorporationRiskProfile,
    selectedCorpId ? { corpId: selectedCorpId } : "skip"
  );
  const searchResults = useQuery(
    api.tradeAbuse.searchCorporations,
    searchTerm.length >= 2 ? { searchTerm, limit: 10 } : "skip"
  );
  const allSimulations = useQuery(api.tradeAbuse.simulateAllScenarios);

  // Mutations
  const updateFlagStatus = useMutation(api.tradeAbuse.updateFlagStatus);
  const addAdminNote = useMutation(api.tradeAbuse.addAdminNote);

  const handleStatusChange = async (flagId: Id<"tradeAbuseFlags">, newStatus: FlagStatus) => {
    try {
      await updateFlagStatus({
        flagId,
        status: newStatus,
        reviewedBy: "Admin",
      });
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleAddNote = async (flagId: Id<"tradeAbuseFlags">, note: string) => {
    if (!note.trim()) return;
    try {
      await addAdminNote({
        flagId,
        note,
        appendToExisting: true,
      });
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString();
  };

  const formatTimeAgo = (ts: number) => {
    const seconds = Math.floor((Date.now() - ts) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Sub-navigation tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`px-4 py-2 rounded-t text-xs font-bold transition-colors ${
            activeView === 'dashboard'
              ? 'bg-red-600/30 border-2 border-red-500 text-red-300'
              : 'bg-black/30 border border-gray-600 text-gray-400 hover:text-gray-300'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveView('flagged')}
          className={`px-4 py-2 rounded-t text-xs font-bold transition-colors ${
            activeView === 'flagged'
              ? 'bg-orange-600/30 border-2 border-orange-500 text-orange-300'
              : 'bg-black/30 border border-gray-600 text-gray-400 hover:text-gray-300'
          }`}
        >
          Flagged ({stats?.pendingCount || 0})
        </button>
        <button
          onClick={() => setActiveView('investigate')}
          className={`px-4 py-2 rounded-t text-xs font-bold transition-colors ${
            activeView === 'investigate'
              ? 'bg-purple-600/30 border-2 border-purple-500 text-purple-300'
              : 'bg-black/30 border border-gray-600 text-gray-400 hover:text-gray-300'
          }`}
        >
          Investigate Corp
        </button>
        <button
          onClick={() => setActiveView('simulate')}
          className={`px-4 py-2 rounded-t text-xs font-bold transition-colors ${
            activeView === 'simulate'
              ? 'bg-cyan-600/30 border-2 border-cyan-500 text-cyan-300'
              : 'bg-black/30 border border-gray-600 text-gray-400 hover:text-gray-300'
          }`}
        >
          Test Detection
        </button>
      </div>

      {/* Dashboard View */}
      {activeView === 'dashboard' && (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-5 gap-3">
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {stats?.pendingCount || 0}
              </div>
              <div className="text-xs text-gray-400 mt-1">Pending Review</div>
            </div>
            <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">
                {stats?.investigatingCount || 0}
              </div>
              <div className="text-xs text-gray-400 mt-1">Investigating</div>
            </div>
            <div className="bg-red-900/20 border border-red-500/30 rounded p-4 text-center">
              <div className="text-3xl font-bold text-red-400">
                {stats?.confirmedCount || 0}
              </div>
              <div className="text-xs text-gray-400 mt-1">Confirmed Abuse</div>
            </div>
            <div className="bg-green-900/20 border border-green-500/30 rounded p-4 text-center">
              <div className="text-3xl font-bold text-green-400">
                {stats?.clearedCount || 0}
              </div>
              <div className="text-xs text-gray-400 mt-1">Cleared</div>
            </div>
            <div className="bg-purple-900/20 border border-purple-500/30 rounded p-4 text-center">
              <div className="text-3xl font-bold text-purple-400">
                {stats?.recentFlags24h || 0}
              </div>
              <div className="text-xs text-gray-400 mt-1">Last 24h</div>
            </div>
          </div>

          {/* Flag Reasons Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/30 border border-gray-700 rounded p-4">
              <h4 className="text-sm font-bold text-gray-300 mb-3">Flag Reasons</h4>
              <div className="space-y-2">
                {Object.entries(stats?.reasonCounts || {}).map(([reason, count]) => (
                  <div key={reason} className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 rounded text-xs border ${FLAG_REASON_LABELS[reason]?.color || 'bg-gray-500/30'}`}>
                      {FLAG_REASON_LABELS[reason]?.label || reason}
                    </span>
                    <span className="text-gray-400 text-sm">{count as number}</span>
                  </div>
                ))}
                {Object.keys(stats?.reasonCounts || {}).length === 0 && (
                  <div className="text-gray-500 text-sm">No flags yet</div>
                )}
              </div>
            </div>

            <div className="bg-black/30 border border-gray-700 rounded p-4">
              <h4 className="text-sm font-bold text-gray-300 mb-3">Most Flagged Corps</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stats?.mostFlaggedCorps?.map((corp: any, i: number) => (
                  <div key={corp.id} className="flex justify-between items-center">
                    <span className="text-yellow-300 text-sm truncate max-w-[200px]">
                      {i + 1}. {corp.name}
                    </span>
                    <span className="text-red-400 text-sm font-bold">{corp.count} flags</span>
                  </div>
                ))}
                {(!stats?.mostFlaggedCorps || stats.mostFlaggedCorps.length === 0) && (
                  <div className="text-gray-500 text-sm">No flagged corps yet</div>
                )}
              </div>
            </div>
          </div>

          {/* High Risk Flags */}
          {stats?.highRiskFlags && stats.highRiskFlags.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/30 rounded p-4">
              <h4 className="text-sm font-bold text-red-300 mb-3">High Risk (Pending)</h4>
              <div className="space-y-2">
                {stats.highRiskFlags.map((flag: any) => (
                  <div key={flag._id} className="flex justify-between items-center bg-black/30 rounded p-2">
                    <div>
                      <span className="text-yellow-300">{flag.sellerCorpName}</span>
                      <span className="text-gray-500 mx-2">→</span>
                      <span className="text-blue-300">{flag.buyerCorpName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 font-bold">Risk: {flag.riskScore}</span>
                      <button
                        onClick={() => {
                          setSelectedFlag(flag);
                          setActiveView('flagged');
                        }}
                        className="px-2 py-1 bg-red-600/30 hover:bg-red-600/50 border border-red-500 rounded text-xs text-red-300"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flagged Corp Pairs */}
          {flaggedPairs && flaggedPairs.length > 0 && (
            <div className="bg-orange-900/20 border border-orange-500/30 rounded p-4">
              <h4 className="text-sm font-bold text-orange-300 mb-3">Suspicious Trading Pairs</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {flaggedPairs.map((pair: any) => (
                  <div key={pair._id} className="flex justify-between items-center bg-black/30 rounded p-2">
                    <div>
                      <span className="text-yellow-300">{pair.corp1Name}</span>
                      <span className="text-gray-500 mx-2">↔</span>
                      <span className="text-blue-300">{pair.corp2Name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-orange-400 font-bold">{pair.tradeCount} trades</div>
                      <div className="text-gray-500 text-xs">{pair.totalVolumeGold.toLocaleString()}G volume</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Flagged Transactions View */}
      {activeView === 'flagged' && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex gap-2">
            {(['all', 'pending', 'investigating', 'confirmed_abuse', 'cleared'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                  statusFilter === status
                    ? status === 'all'
                      ? 'bg-gray-600/50 border border-gray-400 text-gray-200'
                      : STATUS_LABELS[status as FlagStatus].color + ' border'
                    : 'bg-black/30 border border-gray-600 text-gray-400 hover:text-gray-300'
                }`}
              >
                {status === 'all' ? 'All' : STATUS_LABELS[status as FlagStatus].label}
              </button>
            ))}
          </div>

          {/* Flags Table */}
          <div className="bg-black/30 border border-gray-700 rounded overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-900/50 sticky top-0">
                  <tr className="text-left text-gray-400">
                    <th className="p-2 border-b border-gray-700">Time</th>
                    <th className="p-2 border-b border-gray-700">Seller → Buyer</th>
                    <th className="p-2 border-b border-gray-700">Item</th>
                    <th className="p-2 border-b border-gray-700 text-right">Price</th>
                    <th className="p-2 border-b border-gray-700">Flags</th>
                    <th className="p-2 border-b border-gray-700 text-center">Risk</th>
                    <th className="p-2 border-b border-gray-700">Status</th>
                    <th className="p-2 border-b border-gray-700 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedTransactions?.flags?.map((flag: any) => (
                    <tr key={flag._id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-2 border-b border-gray-800 text-gray-400">
                        {formatTimeAgo(flag.createdAt)}
                      </td>
                      <td className="p-2 border-b border-gray-800">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-300 truncate max-w-[100px]" title={flag.sellerCorpName}>
                            {flag.sellerCorpName}
                          </span>
                          <span className="text-gray-500">→</span>
                          <span className="text-blue-300 truncate max-w-[100px]" title={flag.buyerCorpName}>
                            {flag.buyerCorpName}
                          </span>
                        </div>
                      </td>
                      <td className="p-2 border-b border-gray-800 text-purple-300">
                        {flag.quantity}x {flag.itemVariation || flag.itemType}
                      </td>
                      <td className="p-2 border-b border-gray-800 text-right">
                        <div className="text-green-300">{flag.purchasePrice}G</div>
                        {flag.resalePrice && (
                          <div className="text-red-400 text-[10px]">
                            → {flag.resalePrice}G ({flag.priceGapMultiplier}x)
                          </div>
                        )}
                      </td>
                      <td className="p-2 border-b border-gray-800">
                        <div className="flex flex-wrap gap-1">
                          {flag.flagReasons.slice(0, 3).map((reason: string) => (
                            <span
                              key={reason}
                              className={`px-1.5 py-0.5 rounded text-[10px] border ${FLAG_REASON_LABELS[reason]?.color || 'bg-gray-500/30'}`}
                            >
                              {FLAG_REASON_LABELS[reason]?.label || reason}
                            </span>
                          ))}
                          {flag.flagReasons.length > 3 && (
                            <span className="text-gray-500 text-[10px]">+{flag.flagReasons.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 border-b border-gray-800 text-center">
                        <span className={`font-bold ${flag.riskScore >= 50 ? 'text-red-400' : flag.riskScore >= 30 ? 'text-orange-400' : 'text-yellow-400'}`}>
                          {flag.riskScore}
                        </span>
                      </td>
                      <td className="p-2 border-b border-gray-800">
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${STATUS_LABELS[flag.status as FlagStatus]?.color}`}>
                          {STATUS_LABELS[flag.status as FlagStatus]?.label}
                        </span>
                      </td>
                      <td className="p-2 border-b border-gray-800 text-center">
                        <button
                          onClick={() => setSelectedFlag(flag)}
                          className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded text-blue-300 text-[10px]"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!flaggedTransactions?.flags || flaggedTransactions.flags.length === 0) && (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-gray-500">
                        No flagged transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total count */}
          {flaggedTransactions?.total !== undefined && flaggedTransactions.total > 0 && (
            <div className="text-xs text-gray-500 text-right">
              Showing {flaggedTransactions.flags?.length || 0} of {flaggedTransactions.total} flags
            </div>
          )}
        </div>
      )}

      {/* Investigate Corp View */}
      {activeView === 'investigate' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search corporation by name or wallet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/50 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 focus:border-purple-500 focus:outline-none"
            />
            {searchResults && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-black/95 border border-purple-500/50 rounded max-h-48 overflow-y-auto">
                {searchResults.map((corp: any) => (
                  <button
                    key={corp.id}
                    onClick={() => {
                      setSelectedCorpId(corp.id);
                      setSearchTerm('');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-purple-900/30 transition-colors text-sm border-b border-gray-800/50"
                  >
                    <div className="text-purple-300 font-medium">{corp.name}</div>
                    <div className="text-gray-500 text-xs">{corp.walletAddress?.slice(0, 20)}...</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Corp Profile */}
          {corpProfile && (
            <div className="space-y-4">
              {/* Header */}
              <div className="bg-purple-900/20 border border-purple-500/30 rounded p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-purple-300">{corpProfile.corpName}</h3>
                    <div className="text-xs text-gray-500 mt-1">{corpProfile.walletAddress}</div>
                    <div className="text-xs text-gray-400 mt-1">Corp Age: {corpProfile.corpAgeDays} days</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${corpProfile.totalRiskScore >= 100 ? 'text-red-400' : corpProfile.totalRiskScore >= 50 ? 'text-orange-400' : 'text-yellow-400'}`}>
                      {corpProfile.totalRiskScore}
                    </div>
                    <div className="text-xs text-gray-400">Total Risk Score</div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-black/30 border border-gray-700 rounded p-3 text-center">
                  <div className="text-xl font-bold text-yellow-400">{corpProfile.totalFlags}</div>
                  <div className="text-xs text-gray-400">Total Flags</div>
                </div>
                <div className="bg-black/30 border border-gray-700 rounded p-3 text-center">
                  <div className="text-xl font-bold text-blue-400">{corpProfile.flagsAsBuyer}</div>
                  <div className="text-xs text-gray-400">As Buyer</div>
                </div>
                <div className="bg-black/30 border border-gray-700 rounded p-3 text-center">
                  <div className="text-xl font-bold text-orange-400">{corpProfile.flagsAsSeller}</div>
                  <div className="text-xs text-gray-400">As Seller</div>
                </div>
                <div className="bg-black/30 border border-gray-700 rounded p-3 text-center">
                  <div className="text-xl font-bold text-red-400">{corpProfile.confirmedAbuse}</div>
                  <div className="text-xs text-gray-400">Confirmed</div>
                </div>
              </div>

              {/* Trading Partners */}
              <div className="bg-black/30 border border-gray-700 rounded p-4">
                <h4 className="text-sm font-bold text-gray-300 mb-3">
                  Trading Partners ({corpProfile.tradingPartners})
                  {corpProfile.flaggedPartners > 0 && (
                    <span className="text-red-400 ml-2">({corpProfile.flaggedPartners} flagged)</span>
                  )}
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {corpProfile.tradePairs?.map((pair: any) => (
                    <div key={pair._id} className={`flex justify-between items-center p-2 rounded ${pair.flagged ? 'bg-red-900/20' : 'bg-gray-800/30'}`}>
                      <span className="text-yellow-300">
                        {pair.corp1Id === corpProfile.corpId ? pair.corp2Name : pair.corp1Name}
                      </span>
                      <div className="text-right">
                        <div className={pair.flagged ? 'text-red-400' : 'text-gray-400'}>{pair.tradeCount} trades</div>
                        <div className="text-gray-500 text-xs">{pair.totalVolumeGold.toLocaleString()}G</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Flags */}
              {corpProfile.recentFlags?.length > 0 && (
                <div className="bg-black/30 border border-gray-700 rounded p-4">
                  <h4 className="text-sm font-bold text-gray-300 mb-3">Recent Flags</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {corpProfile.recentFlags.map((flag: any) => (
                      <div key={flag._id} className="bg-gray-800/30 rounded p-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-yellow-300">{flag.sellerCorpName}</span>
                            <span className="text-gray-500 mx-2">→</span>
                            <span className="text-blue-300">{flag.buyerCorpName}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] border ${STATUS_LABELS[flag.status as FlagStatus]?.color}`}>
                            {STATUS_LABELS[flag.status as FlagStatus]?.label}
                          </span>
                        </div>
                        <div className="flex gap-1 mt-1">
                          {flag.flagReasons.map((reason: string) => (
                            <span
                              key={reason}
                              className={`px-1.5 py-0.5 rounded text-[10px] border ${FLAG_REASON_LABELS[reason]?.color}`}
                            >
                              {FLAG_REASON_LABELS[reason]?.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelectedCorpId(null)}
                className="w-full py-2 bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600 rounded text-gray-400 text-sm"
              >
                Clear Selection
              </button>
            </div>
          )}

          {!corpProfile && !searchTerm && (
            <div className="text-center text-gray-500 py-8">
              Search for a corporation to investigate their trading activity
            </div>
          )}
        </div>
      )}

      {/* Simulate View - Dry Run Testing */}
      {activeView === 'simulate' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-cyan-900/20 border border-cyan-500/30 rounded p-4">
            <h4 className="text-sm font-bold text-cyan-300 mb-2">Detection Logic Test</h4>
            <p className="text-xs text-gray-400">
              These simulations show what flags WOULD be triggered for different abuse scenarios.
              No data is written to the database - this is purely a logic verification tool.
            </p>
          </div>

          {/* Simulation Results */}
          <div className="space-y-4">
            {allSimulations?.map((sim, index) => (
              <div
                key={index}
                className={`bg-black/30 border rounded-lg overflow-hidden ${
                  sim.wouldTriggerFlags.length > 0
                    ? 'border-red-500/50'
                    : 'border-green-500/50'
                }`}
              >
                {/* Scenario Header */}
                <div className={`px-4 py-3 ${
                  sim.wouldTriggerFlags.length > 0
                    ? 'bg-red-900/30 border-b border-red-500/30'
                    : 'bg-green-900/30 border-b border-green-500/30'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h5 className="font-bold text-sm text-gray-200 capitalize">
                        {sim.scenario.replace(/_/g, ' ')}
                      </h5>
                      <p className="text-xs text-gray-400 mt-1">{sim.description}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        sim.riskScore >= 50 ? 'text-red-400' :
                        sim.riskScore >= 30 ? 'text-orange-400' :
                        sim.riskScore > 0 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {sim.riskScore}
                      </div>
                      <div className="text-xs text-gray-500">Risk Score</div>
                    </div>
                  </div>
                </div>

                {/* Scenario Details */}
                <div className="p-4">
                  {/* Parameters */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="bg-gray-800/50 rounded p-2 text-center">
                      <div className={`text-lg font-bold ${
                        (sim.details.timeSinceListing || 999) <= 60 ? 'text-red-400' : 'text-gray-300'
                      }`}>
                        {sim.details.timeSinceListing}s
                      </div>
                      <div className="text-xs text-gray-500">Purchase Time</div>
                    </div>
                    <div className="bg-gray-800/50 rounded p-2 text-center">
                      <div className={`text-lg font-bold ${
                        (sim.details.priceGapMultiplier || 1) >= 10 ? 'text-red-400' : 'text-gray-300'
                      }`}>
                        {sim.details.priceGapMultiplier}x
                      </div>
                      <div className="text-xs text-gray-500">Price Gap</div>
                    </div>
                    <div className="bg-gray-800/50 rounded p-2 text-center">
                      <div className={`text-lg font-bold ${
                        (sim.details.previousTradeCount || 0) >= 2 ? 'text-orange-400' : 'text-gray-300'
                      }`}>
                        {sim.details.previousTradeCount || 0}
                      </div>
                      <div className="text-xs text-gray-500">Prior Trades</div>
                    </div>
                    <div className="bg-gray-800/50 rounded p-2 text-center">
                      <div className={`text-lg font-bold ${
                        (sim.details.corpAgeDays || 999) < 7 ? 'text-blue-400' : 'text-gray-300'
                      }`}>
                        {sim.details.corpAgeDays}d
                      </div>
                      <div className="text-xs text-gray-500">Buyer Age</div>
                    </div>
                  </div>

                  {/* Flags Triggered */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Would trigger:</span>
                    {sim.wouldTriggerFlags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {sim.wouldTriggerFlags.map((flag) => (
                          <span
                            key={flag}
                            className={`px-2 py-1 rounded text-xs border ${FLAG_REASON_LABELS[flag]?.color || 'bg-gray-500/30'}`}
                          >
                            {FLAG_REASON_LABELS[flag]?.label || flag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs bg-green-500/30 border border-green-500 text-green-300">
                        No flags - Trade looks normal
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {!allSimulations && (
              <div className="text-center text-gray-500 py-8">
                Loading simulations...
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-black/30 border border-gray-700 rounded p-4">
            <h5 className="text-xs font-bold text-gray-400 mb-3">Detection Thresholds</h5>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Fast Purchase:</span>
                  <span className="text-red-300">&lt;60 seconds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price Gap:</span>
                  <span className="text-purple-300">&gt;10x markup</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Repeated Pair:</span>
                  <span className="text-orange-300">&gt;2 trades</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">New Corp:</span>
                  <span className="text-blue-300">&lt;7 days old</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flag Detail Modal */}
      {selectedFlag && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4"
          onClick={() => setSelectedFlag(null)}
        >
          <div
            className="bg-gray-900 border-2 border-yellow-500/50 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-yellow-900/30 border-b border-yellow-500/30 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-yellow-300">Flag Details</h3>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatTimestamp(selectedFlag.createdAt)}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFlag(null)}
                  className="text-gray-400 hover:text-gray-200 text-xl"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 border border-gray-700 rounded p-3">
                  <div className="text-xs text-gray-400 mb-1">Seller</div>
                  <div className="text-yellow-300 font-bold">{selectedFlag.sellerCorpName}</div>
                </div>
                <div className="bg-black/30 border border-gray-700 rounded p-3">
                  <div className="text-xs text-gray-400 mb-1">Buyer</div>
                  <div className="text-blue-300 font-bold">{selectedFlag.buyerCorpName}</div>
                </div>
              </div>

              {/* Item & Price */}
              <div className="bg-black/30 border border-gray-700 rounded p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Item</div>
                    <div className="text-purple-300">{selectedFlag.quantity}x {selectedFlag.itemVariation || selectedFlag.itemType}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400 mb-1">Price</div>
                    <div className="text-green-300 font-bold">{selectedFlag.purchasePrice}G each</div>
                    {selectedFlag.resalePrice && (
                      <div className="text-red-400 text-sm">
                        Resold at {selectedFlag.resalePrice}G ({selectedFlag.priceGapMultiplier}x)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timing */}
              {selectedFlag.timeSinceListing !== undefined && (
                <div className="bg-black/30 border border-gray-700 rounded p-3">
                  <div className="text-xs text-gray-400 mb-1">Time Since Listing</div>
                  <div className={`font-bold ${selectedFlag.timeSinceListing <= 60 ? 'text-red-400' : 'text-gray-300'}`}>
                    {selectedFlag.timeSinceListing} seconds
                    {selectedFlag.timeSinceListing <= 60 && <span className="text-red-400 ml-2">(Suspicious!)</span>}
                  </div>
                </div>
              )}

              {/* Previous Trades */}
              {selectedFlag.previousTradeCount !== undefined && selectedFlag.previousTradeCount > 0 && (
                <div className="bg-black/30 border border-gray-700 rounded p-3">
                  <div className="text-xs text-gray-400 mb-1">Previous Trades Between These Corps</div>
                  <div className="text-orange-400 font-bold">{selectedFlag.previousTradeCount} trades</div>
                </div>
              )}

              {/* Flag Reasons */}
              <div className="bg-black/30 border border-gray-700 rounded p-3">
                <div className="text-xs text-gray-400 mb-2">Flag Reasons</div>
                <div className="flex flex-wrap gap-2">
                  {selectedFlag.flagReasons.map((reason: string) => (
                    <span
                      key={reason}
                      className={`px-2 py-1 rounded text-xs border ${FLAG_REASON_LABELS[reason]?.color}`}
                    >
                      {FLAG_REASON_LABELS[reason]?.label || reason}
                    </span>
                  ))}
                </div>
              </div>

              {/* Risk Score */}
              <div className="bg-black/30 border border-gray-700 rounded p-3 flex justify-between items-center">
                <div className="text-xs text-gray-400">Risk Score</div>
                <div className={`text-2xl font-bold ${selectedFlag.riskScore >= 50 ? 'text-red-400' : selectedFlag.riskScore >= 30 ? 'text-orange-400' : 'text-yellow-400'}`}>
                  {selectedFlag.riskScore}
                </div>
              </div>

              {/* Admin Notes */}
              {selectedFlag.adminNotes && (
                <div className="bg-black/30 border border-gray-700 rounded p-3">
                  <div className="text-xs text-gray-400 mb-2">Admin Notes</div>
                  <div className="text-gray-300 text-sm whitespace-pre-wrap">{selectedFlag.adminNotes}</div>
                </div>
              )}

              {/* Status Actions */}
              <div className="bg-black/30 border border-gray-700 rounded p-3">
                <div className="text-xs text-gray-400 mb-2">Update Status</div>
                <div className="flex flex-wrap gap-2">
                  {(['investigating', 'confirmed_abuse', 'cleared'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        handleStatusChange(selectedFlag._id, status);
                        setSelectedFlag({ ...selectedFlag, status });
                      }}
                      disabled={selectedFlag.status === status}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-colors border ${
                        selectedFlag.status === status
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:opacity-80'
                      } ${STATUS_LABELS[status].color}`}
                    >
                      {STATUS_LABELS[status].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Note */}
              <div className="bg-black/30 border border-gray-700 rounded p-3">
                <div className="text-xs text-gray-400 mb-2">Add Note</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="admin-note-input"
                    placeholder="Type a note..."
                    className="flex-1 bg-black/50 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 focus:border-yellow-500 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        handleAddNote(selectedFlag._id, input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('admin-note-input') as HTMLInputElement;
                      if (input?.value) {
                        handleAddNote(selectedFlag._id, input.value);
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-yellow-600/30 hover:bg-yellow-600/50 border border-yellow-500 rounded text-yellow-300 text-sm font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
