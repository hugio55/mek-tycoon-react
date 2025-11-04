'use client';

import { useState, useEffect } from 'react';
import { useConvex, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { restoreWalletSession } from '@/lib/walletSessionManager';

export default function TenureFixPage() {
  const convex = useConvex();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Get wallet address from session
  useEffect(() => {
    const loadWallet = async () => {
      const session = await restoreWalletSession();
      setWalletAddress(session?.stakeAddress || null);
    };
    loadWallet();
  }, []);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingDiagnostic, setIsLoadingDiagnostic] = useState(false);

  // Mutations
  const runMigration = useMutation(api.migrations.syncIsSlottedFromEssenceSlots);

  const handleRunMigration = async () => {
    setIsRunning(true);
    try {
      const result = await runMigration();
      setMigrationResult(result);
      console.log('[MIGRATION] Result:', result);
    } catch (error) {
      console.error('[MIGRATION] Error:', error);
      setMigrationResult({ error: String(error) });
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunDiagnostic = async () => {
    if (!walletAddress) {
      console.error('[DIAGNOSTIC] No wallet address available');
      return;
    }

    setIsLoadingDiagnostic(true);
    try {
      // Call Convex query directly using useConvex()
      // This works even if the API hasn't been regenerated yet
      const result = await convex.query(api.essence.diagnosticCheckSlottedMeksInMeksTable, {
        walletAddress
      });
      setDiagnosticResult(result);
      console.log('[DIAGNOSTIC] Result:', result);
    } catch (error) {
      console.error('[DIAGNOSTIC] Error:', error);
      setDiagnosticResult({ error: String(error) });
    } finally {
      setIsLoadingDiagnostic(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          Tenure System Fix - Admin Page
        </h1>
        <p className="text-gray-400 mb-8">
          Diagnostic and migration tools to fix isSlotted sync issues
        </p>

        {!walletAddress && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 mb-8">
            <p className="text-red-400">Please connect your wallet to use this page.</p>
          </div>
        )}

        {/* DIAGNOSTIC SECTION */}
        <div className="bg-gray-800/50 border-2 border-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            1. Run Diagnostic
          </h2>
          <p className="text-gray-300 mb-4">
            Check if your slotted Meks are properly marked in the meks table.
          </p>

          <button
            onClick={handleRunDiagnostic}
            disabled={!walletAddress || isLoadingDiagnostic}
            className="px-6 py-3 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-700 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingDiagnostic ? 'Running Diagnostic...' : 'Run Diagnostic'}
          </button>

          {diagnosticResult && (
            <div className="mt-6 bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-200 mb-3">Diagnostic Results:</h3>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-xs text-gray-500 mb-1">Total Slotted</div>
                  <div className="text-2xl font-bold text-white">
                    {diagnosticResult.totalSlottedMeks || 0}
                  </div>
                </div>
                <div className="bg-green-900/20 border border-green-700 rounded p-3">
                  <div className="text-xs text-green-500 mb-1">In Meks Table</div>
                  <div className="text-2xl font-bold text-green-400">
                    {diagnosticResult.summary?.inMeksTable || 0}
                  </div>
                </div>
                <div className="bg-red-900/20 border border-red-700 rounded p-3">
                  <div className="text-xs text-red-500 mb-1">Not In Meks Table</div>
                  <div className="text-2xl font-bold text-red-400">
                    {diagnosticResult.summary?.notInMeksTable || 0}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {diagnosticResult.results?.map((result: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded border ${
                      result.diagnosis.startsWith('✅')
                        ? 'bg-green-900/10 border-green-700'
                        : result.diagnosis.startsWith('⚠️')
                        ? 'bg-yellow-900/10 border-yellow-700'
                        : 'bg-red-900/10 border-red-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-200">
                          Slot {result.slotNumber}: {result.mekAssetId?.substring(0, 20)}...
                        </div>
                        {result.mekRecordData && (
                          <div className="text-sm text-gray-400 mt-1">
                            {result.mekRecordData.assetName} -
                            isSlotted: {String(result.mekRecordData.isSlotted)} -
                            tenure: {result.mekRecordData.tenurePoints?.toFixed(2) || '0.00'}
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-mono text-gray-300">
                        {result.diagnosis}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MIGRATION SECTION */}
        <div className="bg-gray-800/50 border-2 border-yellow-700 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            2. Run Migration
          </h2>
          <p className="text-gray-300 mb-4">
            This will sync the isSlotted state from essenceSlots table to meks table.
            <br />
            <strong className="text-yellow-400">This fixes the tenure tracking issue.</strong>
          </p>

          <div className="bg-yellow-900/20 border border-yellow-700 rounded p-4 mb-4">
            <p className="text-yellow-400 text-sm">
              <strong>What this does:</strong>
              <br />
              • Finds all Meks in essenceSlots that are slotted
              <br />
              • Updates their isSlotted field in meks table to true
              <br />
              • Sets their slotNumber and starts tenure tracking
              <br />• Safe to run multiple times - only updates what's needed
            </p>
          </div>

          <button
            onClick={handleRunMigration}
            disabled={isRunning}
            className="px-6 py-3 bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400 border border-yellow-700 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running Migration...' : 'Run Migration'}
          </button>

          {migrationResult && (
            <div className="mt-6 bg-gray-900/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-200 mb-3">Migration Results:</h3>

              {migrationResult.error ? (
                <div className="bg-red-900/20 border border-red-700 rounded p-3 text-red-400">
                  Error: {migrationResult.error}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-800 rounded p-3">
                      <div className="text-xs text-gray-500 mb-1">Total Slotted</div>
                      <div className="text-2xl font-bold text-white">
                        {migrationResult.totalSlotted || 0}
                      </div>
                    </div>
                    <div className="bg-green-900/20 border border-green-700 rounded p-3">
                      <div className="text-xs text-green-500 mb-1">Updated</div>
                      <div className="text-2xl font-bold text-green-400">
                        {migrationResult.updated || 0}
                      </div>
                    </div>
                    <div className="bg-yellow-900/20 border border-yellow-700 rounded p-3">
                      <div className="text-xs text-yellow-500 mb-1">Not Found</div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {migrationResult.notFound || 0}
                      </div>
                    </div>
                    <div className="bg-blue-900/20 border border-blue-700 rounded p-3">
                      <div className="text-xs text-blue-500 mb-1">Success</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {migrationResult.success ? '✓' : '✗'}
                      </div>
                    </div>
                  </div>

                  {migrationResult.updates && migrationResult.updates.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-400">Updated Meks:</h4>
                      {migrationResult.updates.map((update: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2 bg-gray-800 rounded text-sm text-gray-300"
                        >
                          <strong>{update.assetName}</strong> → Slot {update.slotNumber}
                          {!update.previouslySlotted && (
                            <span className="ml-2 text-green-400">(was unslotted, now fixed)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-green-900/20 border border-green-700 rounded">
                    <p className="text-green-400">
                      ✓ {migrationResult.message}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* INSTRUCTIONS */}
        <div className="bg-gray-800/50 border-2 border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            Instructions
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>
              <strong>Run Diagnostic</strong> - See which Meks have the issue (isSlotted=false but should be true)
            </li>
            <li>
              <strong>Run Migration</strong> - Fix all Meks in one go (updates essenceSlots → meks table sync)
            </li>
            <li>
              <strong>Verify</strong> - Check MekLevelsViewer to see tenure accumulating correctly
            </li>
          </ol>

          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded">
            <p className="text-blue-400 text-sm">
              <strong>Note:</strong> After running the migration, tenure will start accumulating
              immediately for all slotted Meks. The MekLevelsViewer will show "Yes" in the Slotted
              column and display live accumulating tenure values.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
