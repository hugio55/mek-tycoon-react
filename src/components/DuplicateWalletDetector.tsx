'use client';

import { useState } from 'react';
import { useQuery, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function DuplicateWalletDetector() {
  const [selectedWallet, setSelectedWallet] = useState('');
  const [compareWallet1, setCompareWallet1] = useState('');
  const [compareWallet2, setCompareWallet2] = useState('');
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);

  const duplicates = useQuery(api.duplicateWalletDetection.detectDuplicateWallets);
  const fixAssetOverlaps = useAction(api.duplicateWalletDetection.fixAssetOverlaps);
  const transferHistory = selectedWallet
    ? useQuery(api.duplicateWalletDetection.getWalletMekTransferHistory, { walletAddress: selectedWallet })
    : null;
  const comparison = compareWallet1 && compareWallet2
    ? useQuery(api.duplicateWalletDetection.compareTwoWallets, {
        wallet1: compareWallet1,
        wallet2: compareWallet2
      })
    : null;

  if (!duplicates) {
    return (
      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <div className="text-gray-400">Loading duplicate detection...</div>
      </div>
    );
  }

  const getThreatLevel = () => {
    if (duplicates.summary.assetOverlaps > 0) return { level: 'CRITICAL', color: 'red' };
    if (duplicates.summary.recentlyActiveDuplicates > 0) return { level: 'HIGH', color: 'orange' };
    if (duplicates.summary.fingerprintDuplicateGroups > 0) return { level: 'MEDIUM', color: 'yellow' };
    if (duplicates.summary.databaseDuplicates > 0) return { level: 'LOW', color: 'blue' };
    return { level: 'NONE', color: 'green' };
  };

  const threat = getThreatLevel();

  const handleFixAssetOverlaps = async () => {
    if (!confirm('⚠️ FIX ASSET OVERLAPS\n\nThis will:\n1. Check blockchain ownership for each overlapping MEK\n2. Remove MEKs from wallets that don\'t actually own them on-chain\n3. Recalculate gold rates\n\nAre you sure?')) {
      return;
    }

    setIsFixing(true);
    setFixResult(null);

    try {
      const result = await fixAssetOverlaps({});
      setFixResult(result);

      if (result.success) {
        alert(`✅ Success!\n\nFixed ${result.fixed} asset overlap(s).\n\n${result.message}`);
      } else {
        alert(`⚠️ ${result.message}`);
      }
    } catch (error: any) {
      console.error('Error fixing asset overlaps:', error);
      alert(`❌ Error: ${error.message || 'Failed to fix asset overlaps'}`);
      setFixResult({ success: false, error: error.message });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Threat Level Banner */}
      <div className={`p-4 rounded-lg border-2 ${
        threat.color === 'red' ? 'bg-red-900/30 border-red-700' :
        threat.color === 'orange' ? 'bg-orange-900/30 border-orange-700' :
        threat.color === 'yellow' ? 'bg-yellow-900/30 border-yellow-700' :
        threat.color === 'blue' ? 'bg-blue-900/30 border-blue-700' :
        'bg-green-900/30 border-green-700'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              THREAT LEVEL: {threat.level}
            </h3>
            <p className="text-sm mt-1">
              {threat.level === 'CRITICAL' && '⚠️ BLOCKCHAIN IMPOSSIBLE - Same MEK in multiple wallets (data corruption)'}
              {threat.level === 'HIGH' && '🔴 Recently active duplicates detected - possible active cheating'}
              {threat.level === 'MEDIUM' && '🟡 Suspicious wallet patterns detected - investigate fingerprint matches'}
              {threat.level === 'LOW' && '🔵 Database duplicates found - likely connection bugs'}
              {threat.level === 'NONE' && '✅ No duplicates detected'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-5 gap-4">
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <div className="text-xs text-gray-500 mb-1">Total Records</div>
          <div className="text-2xl font-bold text-gray-300">{duplicates.summary.totalDatabaseRecords}</div>
        </div>
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <div className="text-xs text-gray-500 mb-1">Unique Addresses</div>
          <div className="text-2xl font-bold text-blue-400">{duplicates.summary.uniqueWalletAddresses}</div>
        </div>
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <div className="text-xs text-gray-500 mb-1">DB Duplicates</div>
          <div className={`text-2xl font-bold ${duplicates.summary.databaseDuplicates > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
            {duplicates.summary.databaseDuplicates}
          </div>
        </div>
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <div className="text-xs text-gray-500 mb-1">Fingerprint Dupes</div>
          <div className={`text-2xl font-bold ${duplicates.summary.fingerprintDuplicateGroups > 0 ? 'text-orange-400' : 'text-gray-400'}`}>
            {duplicates.summary.fingerprintDuplicateGroups}
          </div>
        </div>
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <div className="text-xs text-gray-500 mb-1">Asset Overlaps</div>
          <div className={`text-2xl font-bold ${duplicates.summary.assetOverlaps > 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {duplicates.summary.assetOverlaps}
          </div>
        </div>
      </div>

      {/* Type 1: Exact Address Duplicates (Database Bug) */}
      {duplicates.exactDuplicates.length > 0 && (
        <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700">
          <h4 className="text-lg font-semibold text-blue-400 mb-3">
            🔵 Type 1: Database Duplicates ({duplicates.exactDuplicates.length})
          </h4>
          <p className="text-sm text-gray-400 mb-4">
            Same wallet address appearing multiple times - this is a DATABASE BUG in the connection code
          </p>
          <div className="space-y-2">
            {duplicates.exactDuplicates.map((dup: any, idx: number) => (
              <div key={idx} className="bg-gray-950/50 p-3 rounded border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-sm text-gray-300">
                    {dup.walletAddress.substring(0, 20)}...{dup.walletAddress.substring(dup.walletAddress.length - 8)}
                  </div>
                  <div className="text-xs text-red-400">
                    {dup.count} duplicate records
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {dup.records.map((rec: any, recIdx: number) => (
                    <div key={recIdx} className="bg-gray-900 p-2 rounded">
                      <div className="text-gray-500">Record {recIdx + 1}</div>
                      <div className="text-yellow-400">{rec.mekCount} MEKs</div>
                      <div className="text-green-400">{rec.goldPerHour.toFixed(2)} g/hr</div>
                      <div className={rec.isVerified ? 'text-green-400' : 'text-red-400'}>
                        {rec.isVerified ? 'Verified' : 'Unverified'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Type 3: Asset Overlaps (CRITICAL - Blockchain Impossible) */}
      {duplicates.assetOverlaps.length > 0 && (
        <div className="p-4 bg-red-900/20 rounded-lg border border-red-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-red-400">
              🚨 Type 3: Asset Overlaps - BLOCKCHAIN IMPOSSIBLE ({duplicates.assetOverlaps.length})
            </h4>
            <button
              onClick={handleFixAssetOverlaps}
              disabled={isFixing}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFixing ? 'Fixing...' : 'Fix Asset Overlaps'}
            </button>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Same MEK appearing in multiple wallets - THIS CANNOT HAPPEN on the blockchain. This is DATA CORRUPTION.
          </p>

          {fixResult && (
            <div className={`mb-4 p-3 rounded border ${
              fixResult.success
                ? 'bg-green-900/30 border-green-700 text-green-400'
                : 'bg-red-900/30 border-red-700 text-red-400'
            }`}>
              <div className="font-semibold mb-1">
                {fixResult.success ? '✅ Fix Complete' : '❌ Fix Failed'}
              </div>
              <div className="text-sm">{fixResult.message}</div>
              {fixResult.details && fixResult.details.length > 0 && (
                <div className="mt-2 space-y-1 text-xs">
                  {fixResult.details.map((detail: any, idx: number) => (
                    <div key={idx}>
                      • {detail.assetName}: Kept in {detail.correctWallet.substring(0, 15)}..., removed from {detail.removedFrom.length} wallet(s)
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {duplicates.assetOverlaps.map((overlap: any, idx: number) => (
              <div key={idx} className="bg-gray-950/50 p-3 rounded border border-red-700">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm text-gray-300 font-semibold">{overlap.assetName}</div>
                    <div className="text-xs text-gray-500 font-mono">{overlap.assetId.substring(0, 30)}...</div>
                  </div>
                  <div className="text-xs text-red-400">
                    In {overlap.walletCount} wallets!
                  </div>
                </div>
                <div className="space-y-1">
                  {overlap.wallets.map((wallet: any, wIdx: number) => (
                    <div key={wIdx} className="bg-gray-900 p-2 rounded text-xs flex items-center justify-between">
                      <span className="font-mono text-gray-400">
                        {wallet.address.substring(0, 15)}...
                      </span>
                      <span className="text-green-400">{wallet.goldPerHour.toFixed(2)} g/hr</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Type 2: Fingerprint Duplicates (Potential Cheating) */}
      {duplicates.fingerprintDuplicates.length > 0 && (
        <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-700">
          <h4 className="text-lg font-semibold text-yellow-400 mb-3">
            🟡 Type 2: Fingerprint Duplicates ({duplicates.fingerprintDuplicates.length})
          </h4>
          <p className="text-sm text-gray-400 mb-4">
            Different wallet addresses with identical MEK holdings - could be legitimate transfers OR cheating attempts
          </p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {duplicates.fingerprintDuplicates.map((dup: any, idx: number) => (
              <div key={idx} className="bg-gray-950/50 p-3 rounded border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm text-gray-300">
                      {dup.mekCount} MEKs @ {dup.goldPerHour.toFixed(2)} g/hr
                    </div>
                    <div className="text-xs text-gray-500">Fingerprint: {dup.fingerprint}</div>
                  </div>
                  <div className="text-xs text-yellow-400">
                    {dup.walletCount} different wallets
                  </div>
                </div>
                <div className="space-y-1">
                  {dup.wallets.map((wallet: any, wIdx: number) => (
                    <div key={wIdx} className="bg-gray-900 p-2 rounded text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-gray-400">
                          {wallet.address.substring(0, 20)}...
                        </span>
                        <div className="flex items-center gap-3">
                          {wallet.companyName && (
                            <span className="text-yellow-400">{wallet.companyName}</span>
                          )}
                          <span className={wallet.daysSinceActive < 7 ? 'text-green-400' : 'text-gray-500'}>
                            {wallet.daysSinceActive}d ago
                          </span>
                          <span className={wallet.isVerified ? 'text-green-400' : 'text-red-400'}>
                            {wallet.isVerified ? 'Verified' : 'Unverified'}
                          </span>
                          <button
                            onClick={() => setSelectedWallet(wallet.address)}
                            className="px-2 py-1 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-700 rounded text-xs"
                          >
                            View Transfers
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Type 4: Recently Active Duplicates (HIGH PRIORITY) */}
      {duplicates.recentlyActiveDuplicates.length > 0 && (
        <div className="p-4 bg-orange-900/20 rounded-lg border border-orange-700">
          <h4 className="text-lg font-semibold text-orange-400 mb-3">
            🔴 Recently Active Duplicates - INVESTIGATE FIRST ({duplicates.recentlyActiveDuplicates.length})
          </h4>
          <p className="text-sm text-gray-400 mb-4">
            Duplicate wallets active in the last 7 days - highest priority for investigation
          </p>
          <div className="space-y-2">
            {duplicates.recentlyActiveDuplicates.map((dup, idx) => (
              <div key={idx} className="bg-gray-950/50 p-3 rounded border border-orange-700">
                <div className="text-sm text-gray-300 mb-2">
                  {dup.mekCount} MEKs @ {dup.goldPerHour.toFixed(2)} g/hr - {dup.walletCount} wallets
                </div>
                <div className="space-y-1">
                  {dup.wallets.map((wallet, wIdx) => (
                    <div key={wIdx} className="bg-gray-900 p-2 rounded text-xs flex items-center justify-between">
                      <span className="font-mono text-gray-400">{wallet.address.substring(0, 20)}...</span>
                      <div className="flex items-center gap-2">
                        {wallet.companyName && <span className="text-yellow-400">{wallet.companyName}</span>}
                        <span className="text-green-400">{wallet.daysSinceActive}d ago</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wallet Transfer History Viewer */}
      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <h4 className="text-lg font-semibold text-yellow-400 mb-3">MEK Transfer History</h4>
        <input
          type="text"
          placeholder="Enter wallet address to view transfer history..."
          value={selectedWallet}
          onChange={(e) => setSelectedWallet(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-yellow-500 mb-4"
        />

        {transferHistory && !('error' in transferHistory) && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-950/50 p-2 rounded">
                <div className="text-gray-500 text-xs">Total Snapshots</div>
                <div className="text-blue-400 font-bold">{transferHistory.totalSnapshots}</div>
              </div>
              <div className="bg-gray-950/50 p-2 rounded">
                <div className="text-gray-500 text-xs">Transfer Events</div>
                <div className="text-yellow-400 font-bold">{transferHistory.transferEvents.length}</div>
              </div>
              <div className="bg-gray-950/50 p-2 rounded">
                <div className="text-gray-500 text-xs">Current MEKs</div>
                <div className="text-green-400 font-bold">{transferHistory.currentMekCount}</div>
              </div>
            </div>

            {transferHistory.transferEvents.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {transferHistory.transferEvents.map((event, idx) => (
                  <div key={idx} className="bg-gray-950/50 p-3 rounded border border-gray-700">
                    <div className="text-xs text-gray-500 mb-2">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {event.meksAdded.length > 0 && (
                        <div>
                          <div className="text-green-400 font-semibold mb-1">
                            Added ({event.meksAdded.length})
                          </div>
                          {event.meksAdded.map((mek, mIdx) => (
                            <div key={mIdx} className="text-gray-400">{mek.assetName}</div>
                          ))}
                        </div>
                      )}
                      {event.meksRemoved.length > 0 && (
                        <div>
                          <div className="text-red-400 font-semibold mb-1">
                            Removed ({event.meksRemoved.length})
                          </div>
                          {event.meksRemoved.map((mek, mIdx) => (
                            <div key={mIdx} className="text-gray-400">{mek.assetName}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Rate change: {event.rateChange >= 0 ? '+' : ''}{event.rateChange.toFixed(2)} g/hr
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No MEK transfers detected</div>
            )}
          </div>
        )}

        {transferHistory && 'error' in transferHistory && (
          <div className="text-sm text-red-400">{transferHistory.error}</div>
        )}
      </div>

      {/* Wallet Comparison Tool */}
      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <h4 className="text-lg font-semibold text-yellow-400 mb-3">Compare Two Wallets</h4>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <input
            type="text"
            placeholder="Wallet 1 address..."
            value={compareWallet1}
            onChange={(e) => setCompareWallet1(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-yellow-500"
          />
          <input
            type="text"
            placeholder="Wallet 2 address..."
            value={compareWallet2}
            onChange={(e) => setCompareWallet2(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-yellow-500"
          />
        </div>

        {comparison && !('error' in comparison) && (
          <div className="space-y-4">
            {/* Alert if blockchain impossible */}
            {comparison.analysis.blockchainImpossible && (
              <div className="p-3 bg-red-900/30 border border-red-700 rounded">
                <div className="text-red-400 font-bold text-sm mb-1">
                  🚨 BLOCKCHAIN IMPOSSIBLE!
                </div>
                <div className="text-sm text-gray-300">
                  These wallets share {comparison.analysis.sharedMeks} MEK(s). This is IMPOSSIBLE on the blockchain - this is data corruption!
                </div>
              </div>
            )}

            {/* Alert if likely transfer */}
            {comparison.analysis.likelyTransfer && (
              <div className="p-3 bg-blue-900/30 border border-blue-700 rounded">
                <div className="text-blue-400 font-bold text-sm mb-1">
                  ℹ️ Likely Legitimate Transfer
                </div>
                <div className="text-sm text-gray-300">
                  Same number of MEKs, similar gold rate, no shared assets - this looks like a wallet-to-wallet transfer.
                </div>
              </div>
            )}

            {/* Wallet Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-950/50 p-3 rounded border border-gray-700">
                <div className="text-xs text-gray-500 mb-2">Wallet 1</div>
                <div className="text-xs space-y-1">
                  <div className="text-yellow-400">{comparison.wallet1.companyName || 'No name'}</div>
                  <div className="text-gray-400">{comparison.wallet1.totalMeks} MEKs</div>
                  <div className="text-green-400">{comparison.wallet1.goldPerHour.toFixed(2)} g/hr</div>
                  <div className={comparison.wallet1.isVerified ? 'text-green-400' : 'text-red-400'}>
                    {comparison.wallet1.isVerified ? 'Verified' : 'Unverified'}
                  </div>
                </div>
              </div>
              <div className="bg-gray-950/50 p-3 rounded border border-gray-700">
                <div className="text-xs text-gray-500 mb-2">Wallet 2</div>
                <div className="text-xs space-y-1">
                  <div className="text-yellow-400">{comparison.wallet2.companyName || 'No name'}</div>
                  <div className="text-gray-400">{comparison.wallet2.totalMeks} MEKs</div>
                  <div className="text-green-400">{comparison.wallet2.goldPerHour.toFixed(2)} g/hr</div>
                  <div className={comparison.wallet2.isVerified ? 'text-green-400' : 'text-red-400'}>
                    {comparison.wallet2.isVerified ? 'Verified' : 'Unverified'}
                  </div>
                </div>
              </div>
            </div>

            {/* Shared MEKs (if any) */}
            {comparison.sharedAssets.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-red-400 mb-2">
                  Shared MEKs ({comparison.sharedAssets.length})
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {comparison.sharedAssets.map((asset, idx) => (
                    <div key={idx} className="bg-gray-950/50 p-2 rounded text-xs text-gray-400">
                      {asset.assetName} - {asset.goldPerHour.toFixed(2)} g/hr
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/50">
        <h4 className="text-sm font-semibold text-blue-300 mb-2">💡 Understanding Duplicates</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li><strong className="text-blue-400">Database Duplicates:</strong> Same wallet address appears multiple times - connection bug that needs fixing</li>
          <li><strong className="text-yellow-400">Fingerprint Duplicates:</strong> Different addresses with identical MEK holdings - could be transfers OR multi-accounting</li>
          <li><strong className="text-red-400">Asset Overlaps:</strong> Same MEK in multiple wallets - BLOCKCHAIN IMPOSSIBLE, indicates data corruption</li>
          <li><strong className="text-orange-400">Recently Active:</strong> Duplicates active in last 7 days - investigate these first for active cheating</li>
        </ul>
      </div>
    </div>
  );
}
