'use client';

import { useState } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function WalletSnapshotDebug() {
  const [walletToDebug, setWalletToDebug] = useState('');
  const [paymentAddress, setPaymentAddress] = useState('');
  const [debugResult, setDebugResult] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [isFixing, setIsFixing] = useState(false);

  const duplicates = useQuery(api.fixWalletDuplicates.findDuplicateWallets);
  const addPaymentAddresses = useMutation(api.debugWalletSnapshot.addPaymentAddresses);
  const triggerSnapshot = useAction(api.goldMiningSnapshot.triggerSnapshot);
  const fixWalletAndSnapshot = useAction(api.fixWalletDuplicates.fixWalletAndSnapshot);
  const fixGoldRate = useAction(api.fixGoldRateCalculation.fixWalletAndRecalculate);
  const finalFix = useAction(api.finalWalletFix.consolidateToStakeAddress);
  const definitiveFix = useMutation(api.definitiveWalletFix.consolidateAndVerify);
  const comprehensiveFix = useAction(api.comprehensiveWalletFix.fixAllWalletIssues);
  const walletStatus = useQuery(api.comprehensiveWalletFix.checkWalletStatus,
    walletToDebug && walletToDebug.startsWith('stake1') ? { stakeAddress: walletToDebug } : 'skip'
  );

  const handleDebugWallet = async () => {
    if (!walletToDebug) return;

    try {
      // Query the debug info directly (would need to implement this as an action)
      const response = await fetch('/api/debug-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: walletToDebug })
      });
      const data = await response.json();
      setDebugResult(data);
    } catch (error) {
      console.error('Debug error:', error);
      setDebugResult({ error: 'Failed to debug wallet' });
    }
  };

  const handleAddPaymentAddress = async () => {
    if (!walletToDebug || !paymentAddress) {
      alert('Please enter both wallet address and payment address');
      return;
    }

    try {
      const result = await addPaymentAddresses({
        walletAddress: walletToDebug,
        paymentAddresses: [paymentAddress]
      });

      if (result.success) {
        alert('Payment address added successfully! Now run a snapshot.');
        setPaymentAddress('');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error adding payment address:', error);
      alert('Failed to add payment address');
    }
  };

  const handleRunSnapshot = async () => {
    if (!walletToDebug) {
      alert('Please enter a wallet address first');
      return;
    }

    try {
      alert('Starting snapshot... This may take a minute.');
      const result = await triggerSnapshot({});
      alert(`Snapshot complete! Updated ${result.updatedCount} wallets.`);
    } catch (error) {
      console.error('Snapshot error:', error);
      alert('Failed to run snapshot');
    }
  };

  const handleFixAndMerge = async () => {
    if (!walletToDebug) {
      alert('Please enter your stake address (stake1...)');
      return;
    }

    if (!walletToDebug.startsWith('stake1')) {
      alert('Please enter your stake address that starts with "stake1"');
      return;
    }

    setIsFixing(true);
    try {
      const result = await fixWalletAndSnapshot({
        stakeAddress: walletToDebug,
        paymentAddress: paymentAddress || undefined,
      });

      if (result.success) {
        alert(`Success! ${result.message}`);
        setDebugResult(result);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Fix error:', error);
      alert('Failed to fix wallet');
    } finally {
      setIsFixing(false);
    }
  };

  const handleSimpleFix = async () => {
    if (!walletToDebug || !walletToDebug.startsWith('stake1')) {
      alert('Please enter your stake address (starts with stake1)');
      return;
    }

    setIsFixing(true);
    try {
      // Use the FINAL fix that ensures proper consolidation
      const result = await finalFix({
        stakeAddress: walletToDebug,
      });

      if (result.success) {
        alert(`✅ ${result.message}`);
        setDebugResult(result);
        // Clear the form
        setWalletToDebug('');
        setPaymentAddress('');
      } else {
        alert(`❌ Error: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Final fix error:', error);
      alert('Failed to fix wallet - check console for details');
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900/50 rounded-lg border border-yellow-400/30">
      <h3 className="text-xl font-bold text-yellow-400 mb-4">Wallet Snapshot Debugger</h3>

      {/* Show duplicates if any */}
      {duplicates && duplicates.length > 0 && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-400/50 rounded">
          <h4 className="text-red-400 font-bold mb-2">⚠️ Duplicate Wallets Detected!</h4>
          <p className="text-sm text-gray-300 mb-3">
            Found {duplicates.length} groups of duplicate wallets. Use the "Fix & Merge All" button to clean them up.
          </p>
          {duplicates.slice(0, 3).map((group: any, idx: number) => (
            <div key={idx} className="text-xs text-gray-400 mb-2">
              Group {idx + 1}: {group.wallets.length} duplicates
              {group.wallets.map((w: any) => (
                <div key={w.id} className="ml-4">
                  - {w.address.substring(0, 20)}... ({w.mekCount} MEKs)
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {/* COMPREHENSIVE FIX SECTION */}
        <div className="p-4 bg-purple-900/30 border-2 border-purple-400/50 rounded-lg">
          <h4 className="text-purple-400 font-bold mb-3 text-lg">🚀 COMPREHENSIVE FIX (USE THIS!)</h4>
          <p className="text-sm text-gray-300 mb-3">
            This fixes ALL issues at once:
          </p>
          <ul className="list-disc list-inside text-xs text-gray-400 mb-3">
            <li>✅ Removes ALL duplicate wallets (hex, payment addresses)</li>
            <li>✅ Preserves your MEKs and gold</li>
            <li>✅ Calculates correct gold rate (no more 0 gold/hr!)</li>
            <li>✅ Cleans up snapshot history</li>
            <li>✅ Uses ONLY stake addresses going forward</li>
          </ul>

          {walletStatus && walletStatus.exists && (
            <div className="mb-3 p-3 bg-black/50 rounded text-xs">
              <div className="text-yellow-400 font-bold mb-1">Current Status:</div>
              <div className="text-gray-300">
                • MEKs: {walletStatus.mekCount}<br/>
                • Gold/hr: {walletStatus.goldPerHour.toFixed(2)}<br/>
                • Accumulated: {walletStatus.accumulatedGold.toFixed(2)}<br/>
                {walletStatus.hasPaymentAddresses && (
                  <span className="text-red-400">⚠️ Has payment addresses (will be removed)</span>
                )}
              </div>
            </div>
          )}
          <input
            type="text"
            value={walletToDebug}
            onChange={(e) => setWalletToDebug(e.target.value)}
            placeholder="stake1u8zevs...ughgq076 (your full stake address)"
            className="w-full px-3 py-2 bg-black/50 border border-green-700 rounded text-white mb-3"
          />
          <button
            onClick={async () => {
              if (!walletToDebug || !walletToDebug.startsWith('stake1')) {
                alert('Please enter your stake address (starts with stake1)');
                return;
              }
              setIsFixing(true);
              try {
                const result = await comprehensiveFix({
                  stakeAddress: walletToDebug
                });
                if (result.success) {
                  alert(`✅ ${result.message}\n\nGold preserved: ${result.accumulatedGold.toFixed(2)}`);
                  setWalletToDebug('');
                  window.location.reload(); // Refresh to see changes
                } else {
                  alert(`❌ Error: ${result.error}`);
                }
              } catch (error) {
                console.error('Comprehensive fix error:', error);
                alert('Failed - check console for details');
              } finally {
                setIsFixing(false);
              }
            }}
            disabled={isFixing}
            className={`w-full px-6 py-3 rounded text-white font-bold text-lg ${
              isFixing
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 animate-pulse'
            }`}
          >
            {isFixing ? '⏳ Fixing everything...' : '🚀 FIX ALL ISSUES NOW'}
          </button>
        </div>

        {/* Original debug section - keep but less prominent */}
        <div className="opacity-50">
          <label className="block text-sm text-gray-400 mb-2">
            Advanced Debug Options
          </label>
        </div>

        {/* Payment address input */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Payment Address (addr1...)
          </label>
          <input
            type="text"
            value={paymentAddress}
            onChange={(e) => setPaymentAddress(e.target.value)}
            placeholder="addr1qy5mz0fl..."
            className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded text-white"
          />
          <p className="text-xs text-gray-500 mt-1">
            Get this from your wallet (e.g., Nami, Eternl) - it starts with "addr1"
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleDebugWallet}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
          >
            Debug Wallet Info
          </button>

          <button
            onClick={handleAddPaymentAddress}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm"
          >
            Add Payment Address
          </button>

          <button
            onClick={handleRunSnapshot}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-black text-sm font-bold"
          >
            Run Snapshot
          </button>

          <button
            onClick={handleFixAndMerge}
            disabled={isFixing}
            className={`px-4 py-2 rounded text-white text-sm font-bold ${
              isFixing
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 animate-pulse'
            }`}
          >
            {isFixing ? '⏳ Fixing...' : '🔧 Fix & Merge All'}
          </button>
        </div>

        {/* Debug output */}
        {debugResult && (
          <div className="mt-4 p-4 bg-black/70 rounded border border-gray-700">
            <h4 className="text-yellow-400 font-bold mb-2">Debug Results:</h4>
            <pre className="text-xs text-gray-300 overflow-auto">
              {JSON.stringify(debugResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-900/20 rounded border border-blue-400/30">
          <h4 className="text-blue-400 font-bold mb-2">How to Fix "0 MEKs" Issue:</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
            <li>Enter your stake address (stake1u8zevs...) in the first field</li>
            <li>Get your payment address from your wallet:
              <ul className="list-disc list-inside ml-4 mt-1 text-xs">
                <li>In Nami: Click "Receive" → Copy address</li>
                <li>In Eternl: Go to "Receive" → Copy address</li>
                <li>Should start with "addr1"</li>
              </ul>
            </li>
            <li>Click "Add Payment Address" to save it</li>
            <li>Click "Run Snapshot" to update MEK counts</li>
            <li>Check the snapshot history tab - should now show your MEKs!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}