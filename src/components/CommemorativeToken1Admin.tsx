'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/convex/_generated/api';
import { useDatabaseContext, DatabaseProvider } from '@/contexts/DatabaseContext';

function CommemorativeToken1AdminContent() {
  const {
    selectedDatabase,
    setSelectedDatabase,
    client,
    canMutate,
    productionMutationsEnabled,
    setProductionMutationsEnabled
  } = useDatabaseContext();

  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');
  const [showDebug, setShowDebug] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Manual state management instead of useQuery
  const [config, setConfig] = useState<any>(null);
  const [allSnapshots, setAllSnapshots] = useState<any[]>([]);
  const [debugState, setDebugState] = useState<any>(null);

  // Production mutation confirmation
  const [confirmationText, setConfirmationText] = useState('');
  const [showConfirmationPrompt, setShowConfirmationPrompt] = useState(false);

  // Mount effect for portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch data from selected database
  useEffect(() => {
    if (!client) return;

    const fetchData = async () => {
      try {
        const [configData, snapshotsData, debugData] = await Promise.all([
          client.query(api.nftEligibility.getConfig),
          client.query(api.whitelists.getAllWhitelistSnapshots),
          client.query(api.nftEligibility.debugEligibilityState)
        ]);
        setConfig(configData);
        setAllSnapshots(snapshotsData || []);
        setDebugState(debugData);
      } catch (error) {
        console.error('[Commemorative Admin] Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [client]);

  // Mutation helpers
  const setActiveSnapshotMutation = async (args: any) => {
    if (!client || !canMutate()) throw new Error('Mutations disabled');
    return await client.mutation(api.nftEligibility.setActiveSnapshot, args);
  };

  const clearActiveSnapshotMutation = async () => {
    if (!client || !canMutate()) throw new Error('Mutations disabled');
    return await client.mutation(api.nftEligibility.clearActiveSnapshot);
  };

  const handleActivateSnapshot = async () => {
    if (!selectedSnapshotId) {
      alert('Please select a snapshot first');
      return;
    }

    if (!canMutate()) {
      alert('Mutations are disabled. Enable production mutations first.');
      return;
    }

    const confirmed = confirm(
      'Activate this snapshot?\n\n' +
      'Any corporation stake address in this snapshot will immediately see the "Claim NFT" button on the homepage.'
    );

    if (!confirmed) return;

    try {
      const result = await setActiveSnapshotMutation({
        snapshotId: selectedSnapshotId as any,
      });
      alert(`✅ Snapshot activated!\n\n${result.snapshotName} - ${result.eligibleWallets} wallets are now eligible`);
      setSelectedSnapshotId(''); // Reset selection
    } catch (error: any) {
      console.error('Error activating snapshot:', error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleDeactivateSnapshot = async () => {
    if (!canMutate()) {
      alert('Mutations are disabled. Enable production mutations first.');
      return;
    }

    const confirmed = confirm(
      '⚠️ Deactivate current snapshot?\n\n' +
      'This will immediately remove the "Claim NFT" button from ALL users\' homepages.\n\n' +
      'You can reactivate a snapshot at any time.'
    );

    if (!confirmed) return;

    try {
      const result = await clearActiveSnapshotMutation();
      if (result.success) {
        alert(`✅ Snapshot deactivated!\n\nNo wallets are now eligible to see the claim button.`);
      }
    } catch (error: any) {
      console.error('Error deactivating snapshot:', error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleEnableMutations = () => {
    setShowConfirmationPrompt(true);
  };

  const handleConfirmMutations = () => {
    if (confirmationText === 'ENABLE MUTATIONS') {
      setProductionMutationsEnabled(true);
      setShowConfirmationPrompt(false);
      setConfirmationText('');
    } else {
      alert('Please type exactly: ENABLE MUTATIONS');
    }
  };

  // Find the selected snapshot details for preview
  const selectedSnapshot = allSnapshots?.find((s: any) => s._id === selectedSnapshotId);

  return (
    <div className="p-6">
      {/* Header with Database Selector */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            NFT Claim Eligibility
          </h2>
          <p className="text-gray-400 text-sm">
            Control who sees the "Claim NFT" button on the homepage by selecting a snapshot
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedDatabase}
            onChange={(e) => setSelectedDatabase(e.target.value as 'trout' | 'sturgeon')}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
          >
            <option value="trout">🐟 Trout (Dev)</option>
            <option value="sturgeon">🐟 Sturgeon (Production)</option>
          </select>
        </div>
      </div>

      {/* Production Read-Only Warning */}
      {selectedDatabase === 'sturgeon' && !productionMutationsEnabled && (
        <div className="mb-4 p-4 bg-red-900/30 border-2 border-red-500 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <div className="text-red-400 font-bold text-lg">READ ONLY MODE - Production Database</div>
                <div className="text-red-300 text-sm">Viewing Sturgeon (production). Mutations are disabled for safety.</div>
              </div>
            </div>
            <button
              onClick={handleEnableMutations}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-colors"
            >
              Enable Mutations
            </button>
          </div>
        </div>
      )}

      {/* Production Mutations Enabled Warning */}
      {selectedDatabase === 'sturgeon' && productionMutationsEnabled && (
        <div className="mb-4 p-4 bg-red-600/50 border-2 border-red-500 rounded-lg animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="text-white font-bold text-lg">PRODUCTION MUTATIONS ENABLED</div>
              <div className="text-orange-200 text-sm">Changes will affect the LIVE database and REAL users!</div>
            </div>
          </div>
        </div>
      )}

      {/* Production Mutation Confirmation Modal */}
      {mounted && showConfirmationPrompt && createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-gray-900 border-2 border-red-500 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-red-400 mb-4">⚠️ Enable Production Mutations</h3>
            <p className="text-gray-300 mb-4">
              You are about to enable mutations on the PRODUCTION database (Sturgeon).
              This will allow you to activate/deactivate snapshots that affect REAL users on the live site.
            </p>
            <p className="text-yellow-400 text-sm mb-4">
              Type <strong>ENABLE MUTATIONS</strong> to confirm:
            </p>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white mb-4"
              placeholder="Type: ENABLE MUTATIONS"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleConfirmMutations}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowConfirmationPrompt(false);
                  setConfirmationText('');
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Current Active Snapshot Status */}
      <div className="mb-6 p-4 bg-black/40 border-2 border-yellow-500/50 rounded-lg">
        <h3 className="text-sm font-bold text-yellow-400 mb-3 uppercase tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          Currently Active Snapshot
        </h3>

        {config?.hasActiveSnapshot ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-2xl">✓</span>
              <span className="text-green-400 font-bold">ACTIVE</span>
            </div>
            <div className="text-lg text-white font-bold">
              {config.snapshotName}
            </div>
            <div className="text-sm text-gray-300">
              <strong className="text-yellow-400">{config.eligibleWallets}</strong> wallets are currently eligible to see the claim button
            </div>
            {config.lastUpdated && (
              <div className="text-xs text-gray-400">
                Last updated: {new Date(config.lastUpdated).toLocaleString()}
              </div>
            )}

            {/* Deactivate Button */}
            <button
              onClick={handleDeactivateSnapshot}
              className="w-full px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border-2 border-red-500/70 hover:border-red-500 text-red-400 hover:text-red-300 font-bold rounded transition-all mt-3"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              🚫 DEACTIVATE SNAPSHOT
            </button>
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
          <li>• <strong>NMKR handles everything else:</strong> Payment processing, minting, NFT delivery</li>
        </ul>
      </div>

      {/* Debug Panel */}
      <div className="mt-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="w-full text-left text-sm font-bold text-purple-300 mb-2 flex items-center justify-between"
        >
          <span>🔍 Debug Database State</span>
          <span className="text-xs">{showDebug ? '▼' : '▶'}</span>
        </button>

        {showDebug && (
          <div className="mt-3 p-3 bg-black/50 rounded border border-purple-500/20">
            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
              {JSON.stringify(debugState, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrapper component that provides DatabaseContext
export default function CommemorativeToken1Admin() {
  return (
    <DatabaseProvider>
      <CommemorativeToken1AdminContent />
    </DatabaseProvider>
  );
}
