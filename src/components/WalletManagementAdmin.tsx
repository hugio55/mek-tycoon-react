'use client';

import { useState, lazy, Suspense, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import StorageMonitoringDashboard from '@/components/StorageMonitoringDashboard';
import ProductionLaunchCleaner from '@/components/ProductionLaunchCleaner';
import WalletSnapshotDebug from '@/components/WalletSnapshotDebug';
import MekLevelsViewer from '@/components/MekLevelsViewer';

// Lazy load heavy components
const SnapshotHistoryViewer = lazy(() => import('@/components/SnapshotHistoryViewer'));

type SubMenu = 'wallet-list' | 'storage-monitoring' | 'snapshot-history' | 'production-launch-cleaner' | 'wallet-debug';

export default function WalletManagementAdmin() {
  const wallets = useQuery(api.adminVerificationReset.getAllWallets);
  const resetVerification = useMutation(api.adminVerificationReset.resetVerificationStatus);
  const deleteWallet = useMutation(api.adminVerificationReset.deleteWallet);
  const mergeDuplicates = useMutation(api.adminVerificationReset.mergeDuplicateWallets);
  const autoMergeAll = useMutation(api.adminVerificationReset.autoMergeDuplicates);
  const manualMergeBySuffix = useMutation(api.manualWalletMerge.manualMergeWalletsBySuffix);
  const triggerSnapshot = useAction(api.goldMiningSnapshot.triggerSnapshot);
  const manualSetMeks = useMutation(api.fixWalletSnapshot.manualSetMekOwnership);
  const updateWalletGold = useMutation(api.adminVerificationReset.updateWalletGold);
  const cleanupDuplicates = useMutation(api.finalDuplicateCleanup.removeAllNonStakeWallets);
  const resetAllMekLevels = useMutation(api.mekLeveling.resetAllMekLevels);

  const [activeSubmenu, setActiveSubmenu] = useState<SubMenu>('wallet-list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [suffixToMerge, setSuffixToMerge] = useState('fe6012f1');
  const [isRunningSnapshot, setIsRunningSnapshot] = useState(false);
  const [editingGold, setEditingGold] = useState<{ walletAddress: string; value: string } | null>(null);
  const [viewingMekLevels, setViewingMekLevels] = useState<string | null>(null);

  const handleResetVerification = async (walletAddress: string) => {
    if (!confirm(`Reset verification for wallet ${walletAddress.substring(0, 20)}...?`)) return;

    try {
      const result = await resetVerification({ walletAddress });
      setStatusMessage({ type: 'success', message: result.message });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to reset verification' });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleDeleteWallet = async (walletAddress: string) => {
    if (!confirm(`⚠️ DELETE wallet ${walletAddress.substring(0, 20)}...? This cannot be undone!`)) return;
    if (!confirm(`Are you ABSOLUTELY SURE? This will permanently delete all data for this wallet.`)) return;

    try {
      const result = await deleteWallet({ walletAddress });
      setStatusMessage({ type: 'success', message: result.message });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to delete wallet' });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleMergeDuplicates = async (walletAddress: string) => {
    if (!confirm(`Merge duplicate records for ${walletAddress.substring(0, 20)}...? This will keep the best record and delete others.`)) return;

    try {
      const result = await mergeDuplicates({ walletAddress });
      setStatusMessage({ type: 'success', message: result.message });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to merge duplicates' });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleMergeAllDuplicates = async () => {
    if (!confirm(`Merge ALL duplicate wallet records? This will automatically keep the best record for each wallet.`)) return;

    setIsMerging(true);
    try {
      const result = await autoMergeAll({});
      setStatusMessage({
        type: 'success',
        message: `Merged ${result.totalMerged} duplicate record(s) across ${result.walletsProcessed} wallet(s)`
      });
      setTimeout(() => setStatusMessage(null), 7000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to merge duplicates' });
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsMerging(false);
    }
  };

  const handleResetMekLevels = async (walletAddress: string) => {
    if (!confirm(`Reset ALL Mek levels to Level 1 for wallet ${walletAddress.substring(0, 20)}...?`)) return;
    if (!confirm(`Are you SURE? This will reset all Mek levels and remove all level bonuses.`)) return;

    try {
      const result = await resetAllMekLevels({ walletAddress });
      setStatusMessage({ type: 'success', message: result.message });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to reset Mek levels' });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleManualMergeBySuffix = async () => {
    if (!confirm(`Merge all wallet records ending with "${suffixToMerge}"?`)) return;

    setIsMerging(true);
    try {
      const result = await manualMergeBySuffix({ suffix: suffixToMerge });
      if (result.success) {
        setStatusMessage({
          type: 'success',
          message: result.message + ` (${result.totalGold} gold, ${result.goldPerHour} gold/hr)`
        });
      } else {
        setStatusMessage({
          type: 'error',
          message: result.message
        });
      }
      setTimeout(() => setStatusMessage(null), 7000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to merge by suffix' });
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsMerging(false);
    }
  };

  const handleRunSnapshot = async () => {
    if (!confirm('Run 6-hour blockchain snapshot NOW? This will query Blockfrost for all active wallets.')) return;

    setIsRunningSnapshot(true);
    setStatusMessage({
      type: 'success',
      message: 'Snapshot starting... This may take a minute.'
    });

    try {
      const result = await triggerSnapshot({});
      setStatusMessage({
        type: 'success',
        message: `Snapshot complete! Updated ${result.updatedCount}/${result.totalMiners} wallets (${result.skippedCount} skipped, ${result.errorCount} errors)`
      });
      setTimeout(() => setStatusMessage(null), 10000);
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Snapshot failed - check console' });
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsRunningSnapshot(false);
    }
  };

  const filteredWallets = useMemo(() => {
    if (!wallets) return [];
    return wallets.filter(wallet =>
      wallet.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.walletType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wallet.companyName && wallet.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [wallets, searchTerm]);

  const verifiedCount = useMemo(() => {
    if (!wallets) return 0;
    return wallets.filter(w => w.isVerified).length;
  }, [wallets]);

  if (!wallets) {
    return (
      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <div className="text-gray-400">Loading wallet data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-700 pb-2">
        <button
          onClick={() => setActiveSubmenu('wallet-list')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeSubmenu === 'wallet-list'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          👛 Wallet List
        </button>
        <button
          onClick={() => setActiveSubmenu('storage-monitoring')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeSubmenu === 'storage-monitoring'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          💾 Storage Monitoring
        </button>
        <button
          onClick={() => setActiveSubmenu('snapshot-history')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeSubmenu === 'snapshot-history'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          📸 Snapshot History
        </button>
        <button
          onClick={() => setActiveSubmenu('production-launch-cleaner')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeSubmenu === 'production-launch-cleaner'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          🧹 Production Launch Cleaner
        </button>

        <button
          onClick={() => setActiveSubmenu('wallet-debug')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeSubmenu === 'wallet-debug'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          🔍 Wallet Debug
        </button>
      </div>

      {activeSubmenu === 'storage-monitoring' ? (
        <StorageMonitoringDashboard />
      ) : activeSubmenu === 'snapshot-history' ? (
        <Suspense fallback={<div className="p-8 bg-gray-900/50 rounded-lg border border-gray-700 text-center"><div className="text-gray-400">Loading snapshot history...</div></div>}>
          <SnapshotHistoryViewer />
        </Suspense>
      ) : activeSubmenu === 'production-launch-cleaner' ? (
        <ProductionLaunchCleaner />
      ) : activeSubmenu === 'wallet-debug' ? (
        <WalletSnapshotDebug />
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-yellow-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                Wallet Management
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {wallets.length} connected wallets • {verifiedCount} verified
              </p>
            </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Wallet suffix"
              value={suffixToMerge}
              onChange={(e) => setSuffixToMerge(e.target.value)}
              className="px-3 py-2 w-32 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleManualMergeBySuffix}
              disabled={isMerging}
              className="px-4 py-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Merge wallets ending with this suffix"
            >
              {isMerging ? 'Merging...' : 'Merge by Suffix'}
            </button>
          </div>

          <button
            onClick={handleMergeAllDuplicates}
            disabled={isMerging}
            className="px-4 py-2 bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400 border border-yellow-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Merge all duplicate wallet records"
          >
            {isMerging ? 'Merging...' : 'Merge All Duplicates'}
          </button>

          <button
            onClick={async () => {
              if (!confirm('This will delete ALL non-stake address wallets. Are you sure?')) return;
              try {
                const result = await cleanupDuplicates({});
                setStatusMessage({
                  type: 'success',
                  message: result.message
                });
                setTimeout(() => setStatusMessage(null), 5000);
              } catch (error) {
                setStatusMessage({ type: 'error', message: 'Failed to cleanup duplicates' });
                setTimeout(() => setStatusMessage(null), 5000);
              }
            }}
            className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700 rounded-lg transition-colors font-bold"
            title="Remove ALL non-stake address wallets"
          >
            🧹 Cleanup Non-Stake Wallets
          </button>

          <button
            onClick={handleRunSnapshot}
            disabled={isRunningSnapshot}
            className="px-4 py-2 bg-purple-900/30 hover:bg-purple-900/50 text-purple-400 border border-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Manually trigger 6-hour blockchain snapshot"
          >
            {isRunningSnapshot ? 'Running...' : '▶ Run Snapshot'}
          </button>

          <input
            type="text"
            placeholder="Search wallets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
          />
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-lg border-2 ${
            statusMessage.type === 'success'
              ? 'bg-green-900/20 border-green-500 text-green-200'
              : 'bg-red-900/20 border-red-500 text-red-200'
          }`}
        >
          {statusMessage.message}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full bg-gray-900/50 rounded-lg border border-gray-700">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Wallet</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Company Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Verified</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">MEKs</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Gold/hr</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Current Gold</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Cumulative Gold</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">First Connected</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Update</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Active</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredWallets.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                  {searchTerm ? 'No wallets match your search' : 'No wallets connected yet'}
                </td>
              </tr>
            ) : (
              filteredWallets.map((wallet) => (
                <tr key={wallet._id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm text-gray-300">
                      <div className="mb-1">
                        {wallet.walletAddress.substring(0, 12)}...{wallet.walletAddress.substring(wallet.walletAddress.length - 8)}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(wallet.walletAddress);
                          setStatusMessage({ type: 'success', message: 'Wallet address copied!' });
                          setTimeout(() => setStatusMessage(null), 2000);
                        }}
                        className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors inline-block"
                        title="Copy wallet address"
                      >
                        📋 Copy
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {wallet.companyName ? (
                      <span className="text-sm font-semibold text-yellow-400">{wallet.companyName}</span>
                    ) : (
                      <span className="text-sm text-gray-600 italic">No name</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400 capitalize">{wallet.walletType}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {wallet.isVerified ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-700">
                        ✓ Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-700">
                        ✗ Not Verified
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-yellow-400">{wallet.mekCount}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-gray-300">{wallet.totalGoldPerHour.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingGold?.walletAddress === wallet.walletAddress ? (
                      <input
                        type="number"
                        value={editingGold.value}
                        onChange={(e) => setEditingGold({ ...editingGold, value: e.target.value })}
                        onBlur={async () => {
                          const newGold = parseInt(editingGold.value);
                          if (!isNaN(newGold) && newGold >= 0) {
                            try {
                              const result = await updateWalletGold({
                                walletAddress: wallet.walletAddress,
                                newGoldAmount: newGold,
                              });
                              setStatusMessage({ type: 'success', message: result.message });
                              setTimeout(() => setStatusMessage(null), 3000);
                            } catch (error) {
                              setStatusMessage({ type: 'error', message: 'Failed to update gold' });
                              setTimeout(() => setStatusMessage(null), 3000);
                            }
                          }
                          setEditingGold(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          } else if (e.key === 'Escape') {
                            setEditingGold(null);
                          }
                        }}
                        className="px-2 py-1 text-sm bg-gray-800 border border-yellow-500 rounded text-yellow-400 font-semibold w-24 text-right"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="text-sm font-semibold text-yellow-400 cursor-pointer hover:bg-yellow-900/20 px-2 py-1 rounded transition-colors"
                        onClick={() => setEditingGold({ walletAddress: wallet.walletAddress, value: wallet.currentGold.toString() })}
                        title="Click to edit gold amount"
                      >
                        {wallet.currentGold.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-yellow-400">
                      {(wallet.totalCumulativeGold || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-gray-400">
                      {wallet.createdAt ? new Date(wallet.createdAt).toLocaleString() : 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-gray-400">
                      {wallet.lastSnapshotTime
                        ? new Date(wallet.lastSnapshotTime).toLocaleString()
                        : wallet.updatedAt
                        ? new Date(wallet.updatedAt).toLocaleString()
                        : 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-gray-400">{wallet.lastActiveDisplay}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <button
                        onClick={() => setViewingMekLevels(wallet.walletAddress)}
                        className="px-3 py-1 text-xs bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-700 rounded transition-colors whitespace-nowrap"
                        title="View all Mek levels for this wallet"
                      >
                        View Levels
                      </button>
                      {wallet.isVerified && (
                        <button
                          onClick={() => handleResetVerification(wallet.walletAddress)}
                          className="px-3 py-1 text-xs bg-orange-900/30 hover:bg-orange-900/50 text-orange-400 border border-orange-700 rounded transition-colors"
                          title="Reset verification (for testing)"
                        >
                          Reset Verify
                        </button>
                      )}
                      {wallet.totalGoldPerHour === 0 && wallet.walletAddress.endsWith('fe6012f1') && (
                        <button
                          onClick={() => manualSetMeks({
                            walletAddress: wallet.walletAddress,
                            mekCount: 45,
                            totalGoldPerHour: 176.56
                          })}
                          className="px-3 py-1 text-xs bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-700 rounded transition-colors"
                          title="Manually fix MEK ownership"
                        >
                          Fix MEKs
                        </button>
                      )}
                      <button
                        onClick={() => handleResetMekLevels(wallet.walletAddress)}
                        className="px-3 py-1 text-xs bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400 border border-yellow-700 rounded transition-colors whitespace-nowrap"
                        title="Reset all Mek levels to Level 1"
                      >
                        Reset Levels
                      </button>
                      <button
                        onClick={() => handleDeleteWallet(wallet.walletAddress)}
                        className="px-3 py-1 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700 rounded transition-colors"
                        title="Delete wallet permanently"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

          <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Admin Actions</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• <strong>Edit Gold</strong>: Click on any gold amount to manually set it (useful for testing leveling system)</li>
              <li>• <strong>Run Snapshot</strong>: Manually triggers the 6-hour blockchain snapshot (queries Blockfrost for all active wallets and updates gold rates)</li>
              <li>• <strong>Merge by Suffix</strong>: Merges wallet records ending with the same suffix (e.g., different address formats of the same wallet)</li>
              <li>• <strong>Merge All Duplicates</strong>: Merges exact duplicate wallet address records in the database</li>
              <li>• <strong>Reset Verify</strong>: Marks wallet as unverified (for testing the verification flow)</li>
              <li>• <strong>Reset Levels</strong>: Resets all Mek levels to Level 1 and removes all level bonuses (useful for testing the leveling system)</li>
              <li>• <strong>Delete</strong>: Permanently removes wallet from the system (cannot be undone)</li>
              <li>• Verification status controls whether gold accumulates for the wallet</li>
              <li>• Duplicate records are automatically hidden in this view (only best record shown per user)</li>
              <li>• Automated cron jobs: 6-hour blockchain snapshots, 4 AM UTC duplicate merging, 6-hour gold backups</li>
            </ul>
          </div>
        </>
      )}

      {viewingMekLevels && (
        <MekLevelsViewer
          walletAddress={viewingMekLevels}
          onClose={() => setViewingMekLevels(null)}
        />
      )}
    </div>
  );
}