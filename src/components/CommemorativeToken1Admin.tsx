'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

const TOKEN_TYPE = "phase_1_beta";

export default function CommemorativeToken1Admin() {
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');

  // Query: Get current NFT configuration (shows active snapshot)
  const tokenInfo = useQuery(
    api.commemorativeTokens.getTokenTypeInfo,
    { tokenType: TOKEN_TYPE }
  );

  // Query: Get all available snapshots from Whitelist Manager
  const allSnapshots = useQuery(api.whitelists.getAllWhitelistSnapshots);

  // Mutation: Import snapshot to activate eligibility
  const importSnapshot = useMutation(api.commemorativeTokens.importSnapshotToNFT);

  const handleActivateSnapshot = async () => {
    if (!selectedSnapshotId) {
      alert('Please select a snapshot first');
      return;
    }

    const confirmed = confirm(
      'Activate this snapshot?\n\n' +
      'Any corporation stake address in this snapshot will immediately see the "Claim NFT" button on the homepage.'
    );

    if (!confirmed) return;

    try {
      await importSnapshot({
        tokenType: TOKEN_TYPE,
        snapshotId: selectedSnapshotId as any,
      });
      alert('✅ Snapshot activated successfully!');
      setSelectedSnapshotId(''); // Reset selection
    } catch (error: any) {
      console.error('Error activating snapshot:', error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  // Find the selected snapshot details for preview
  const selectedSnapshot = allSnapshots?.find((s: any) => s._id === selectedSnapshotId);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-yellow-400 mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          Commemorative NFT Eligibility
        </h2>
        <p className="text-gray-400 text-sm">
          Select which snapshot determines who can claim Phase 1 Beta Tester NFTs
        </p>
      </div>

      {/* Current Active Snapshot Status */}
      <div className="mb-6 p-4 bg-black/40 border-2 border-yellow-500/50 rounded-lg">
        <h3 className="text-sm font-bold text-yellow-400 mb-3 uppercase tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          Current Active Snapshot
        </h3>

        {tokenInfo?.exists && tokenInfo.eligibilitySnapshot && tokenInfo.eligibilitySnapshot.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-2xl">✓</span>
              <span className="text-green-400 font-bold">ACTIVE</span>
            </div>
            <div className="text-sm text-gray-300">
              <strong className="text-yellow-400">{tokenInfo.eligibilitySnapshot.length}</strong> wallets are currently eligible
            </div>
            {tokenInfo.snapshotTakenAt && (
              <div className="text-xs text-gray-400">
                Last updated: {new Date(tokenInfo.snapshotTakenAt).toLocaleString()}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-orange-400 text-2xl">⚠</span>
              <span className="text-orange-400 font-bold">NO SNAPSHOT ACTIVE</span>
            </div>
            <div className="text-sm text-orange-300">
              No wallets are currently eligible. Select a snapshot below to activate eligibility.
            </div>
          </div>
        )}
      </div>

      {/* Snapshot Selector */}
      <div className="mb-6 p-4 bg-cyan-900/20 border-2 border-cyan-500/50 rounded-lg">
        <h3 className="text-sm font-bold text-cyan-300 mb-3 uppercase tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          Activate a Snapshot
        </h3>

        {/* Dropdown */}
        <div className="mb-4">
          <label className="block text-xs text-cyan-200 mb-2 font-bold">
            Select Snapshot from Whitelist Manager
          </label>
          <select
            value={selectedSnapshotId}
            onChange={(e) => setSelectedSnapshotId(e.target.value)}
            className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white text-sm"
          >
            <option value="">-- Choose a snapshot --</option>
            {allSnapshots && allSnapshots.length > 0 ? (
              allSnapshots.map((snapshot: any) => (
                <option key={snapshot._id} value={snapshot._id}>
                  {snapshot.snapshotName} - {snapshot.eligibleUsers?.length || 0} wallets - {new Date(snapshot.takenAt).toLocaleDateString()}
                </option>
              ))
            ) : (
              <option value="" disabled>No snapshots available</option>
            )}
          </select>
        </div>

        {/* Preview selected snapshot */}
        {selectedSnapshot && (
          <div className="mb-4 p-3 bg-cyan-900/30 border border-cyan-500/30 rounded">
            <div className="text-xs text-cyan-200 font-bold mb-1">PREVIEW</div>
            <div className="text-sm text-white mb-1">
              <strong>{selectedSnapshot.snapshotName}</strong>
            </div>
            <div className="text-xs text-cyan-300">
              {selectedSnapshot.eligibleUsers?.length || 0} corporation stake addresses will be eligible
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Captured: {new Date(selectedSnapshot.takenAt).toLocaleString()}
            </div>
          </div>
        )}

        {/* No snapshots warning */}
        {(!allSnapshots || allSnapshots.length === 0) && (
          <div className="mb-4 p-3 bg-orange-900/30 border border-orange-500/50 rounded">
            <div className="text-sm text-orange-300">
              ⚠ No snapshots available yet. Go to <strong>Whitelist Manager</strong> tab to create a snapshot first.
            </div>
          </div>
        )}

        {/* Activate Button */}
        <button
          onClick={handleActivateSnapshot}
          disabled={!selectedSnapshotId}
          className="w-full px-6 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 disabled:bg-gray-700/20 border-2 border-yellow-500 disabled:border-gray-600 disabled:text-gray-500 text-yellow-400 font-bold rounded transition-all disabled:cursor-not-allowed"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          {selectedSnapshotId ? '🚀 ACTIVATE THIS SNAPSHOT' : '⚠ SELECT A SNAPSHOT FIRST'}
        </button>
      </div>

      {/* Help Text */}
      <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <h4 className="text-sm font-bold text-blue-300 mb-2">How This Works</h4>
        <ul className="text-xs text-gray-300 space-y-1">
          <li>• <strong>Step 1:</strong> Go to Whitelist Manager tab to create a snapshot of eligible corporations</li>
          <li>• <strong>Step 2:</strong> Return here and select that snapshot from the dropdown</li>
          <li>• <strong>Step 3:</strong> Click "Activate This Snapshot" to enable eligibility</li>
          <li>• <strong>Result:</strong> Any corporation stake address in the snapshot will see the "Claim NFT" button on the homepage</li>
        </ul>
      </div>
    </div>
  );
}
