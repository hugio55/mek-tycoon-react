'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function ProductionLaunchCleaner() {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const factoryReset = useMutation(api.goldMining.factoryResetForProduction);

  const handleClear = async () => {
    if (!confirmationCode) {
      setError('Please enter the confirmation code');
      return;
    }

    setIsClearing(true);
    setError(null);
    setResult(null);

    try {
      const response = await factoryReset({ confirmationCode });
      setResult(response);
      setConfirmationCode(''); // Clear the input
    } catch (err: any) {
      setError(err.message || 'Failed to perform factory reset');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900/50 border border-yellow-500/30 rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">☢️</span>
        <h2 className="text-xl font-bold text-red-500">FACTORY RESET - Production Launch</h2>
      </div>

      <div className="mb-6 p-4 bg-red-900/30 border-2 border-red-500 rounded">
        <div className="flex items-start gap-2">
          <span className="text-red-500 text-2xl">🚨</span>
          <div>
            <p className="text-red-400 font-bold mb-2">NUCLEAR OPTION: This will COMPLETELY WIPE ALL DATA!</p>
            <p className="text-red-300 text-sm mb-2">This is a one-time-use button for production launch. It deletes EVERYTHING:</p>
            <ul className="text-red-300 text-xs list-disc list-inside ml-2 space-y-1">
              <li>All wallet connections (including yours)</li>
              <li>All gold balances</li>
              <li>All Mek levels (resets to level 1)</li>
              <li>All historical data</li>
              <li>All backups and snapshots</li>
              <li>All authentication data</li>
            </ul>
            <p className="text-yellow-400 text-sm mt-3 font-bold">After clicking this, you'll need to reconnect your wallet to start fresh.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-red-400 text-sm font-bold mb-2">
            ☢️ What will be PERMANENTLY DELETED:
          </label>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 ml-4">
            <li>goldMining (ALL wallet connections and balances)</li>
            <li>goldSnapshots (hourly calculation records)</li>
            <li>mekOwnershipHistory (blockchain snapshot history)</li>
            <li>goldMiningSnapshotLogs (execution logs)</li>
            <li>goldCheckpoints (manual checkpoints)</li>
            <li>goldBackups (disaster recovery backups)</li>
            <li>goldBackupUserData (backup records)</li>
            <li>walletSignatures (authentication data)</li>
            <li>auditLogs (verification logs)</li>
            <li>mekLevels (ALL Mek level progression data)</li>
            <li>levelUpgrades (upgrade transaction history)</li>
            <li>mekTransferEvents (NFT transfer tracking)</li>
          </ul>
        </div>

        <div className="p-3 bg-green-900/20 border border-green-500/50 rounded">
          <label className="block text-green-400 text-sm font-bold mb-2">
            ✅ After reset, the system will be:
          </label>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 ml-4">
            <li>Completely empty - zero users, zero wallets</li>
            <li>Ready for first production user</li>
            <li>All statistics will start from 0</li>
            <li>You can reconnect your wallet for fresh testing</li>
          </ul>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">
            Enter confirmation code: <span className="text-red-500 font-mono font-bold">FACTORY_RESET_CONFIRMED</span>
          </label>
          <input
            type="text"
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
            placeholder="Type FACTORY_RESET_CONFIRMED..."
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white font-mono focus:border-red-500 focus:outline-none"
            disabled={isClearing}
          />
        </div>

        <button
          onClick={handleClear}
          disabled={isClearing || confirmationCode !== 'FACTORY_RESET_CONFIRMED'}
          className={`w-full py-4 px-6 rounded font-bold transition-all text-lg ${
            isClearing
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : confirmationCode === 'FACTORY_RESET_CONFIRMED'
              ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isClearing ? '☢️ RESETTING SYSTEM...' : '☢️ FACTORY RESET - WIPE EVERYTHING'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded">
          <p className="text-red-400 font-bold">❌ Error:</p>
          <p className="text-red-300 text-sm mt-1">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-900/30 border-2 border-green-500 rounded">
          <p className="text-green-400 font-bold text-lg mb-3">✅ {result.message}</p>
          <div className="text-sm text-gray-300 space-y-2">
            <p className="text-yellow-500 font-bold text-base">
              Total records deleted: {result.totalRecordsDeleted}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              {Object.entries(result.deletedBreakdown).map(([key, value]) => (
                <div key={key} className="p-2 bg-gray-800/50 rounded">
                  <span className="text-gray-400 block">{key}:</span>
                  <span className="text-white font-bold text-sm">{value as number}</span>
                </div>
              ))}
            </div>
            <p className="text-green-400 mt-4 font-bold">
              🚀 System is now ready for production launch!
            </p>
            <p className="text-gray-400 text-xs">
              You can now reconnect your wallet to start with fresh data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}