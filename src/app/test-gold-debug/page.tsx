'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect, useState } from 'react';

export default function GoldDebugPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('stakeAddress') || localStorage.getItem('walletAddress');
    setWalletAddress(stored);
  }, []);

  const debugData = useQuery(
    api.debugGoldDisplay.debugWalletGold,
    walletAddress ? { walletAddress } : { walletAddress: undefined }
  );

  if (!debugData) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Gold Debug - Loading...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Gold Display Debug</h1>
      <p className="mb-4">
        Your wallet: <span className="text-yellow-400">{walletAddress || 'Not connected'}</span>
      </p>
      <p className="mb-8">Found {debugData.count} wallet(s) in database</p>

      {debugData.wallets.map((wallet, idx) => (
        <div key={idx} className="bg-gray-900 border border-yellow-500/30 p-6 mb-4 rounded">
          <h2 className="text-xl font-bold text-yellow-400 mb-4">
            {wallet.companyName || wallet.walletAddress.slice(0, 15) + '...'}
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-400 text-sm">Blockchain Verified</p>
              <p className="text-lg font-bold">{wallet.isBlockchainVerified ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Mek Count</p>
              <p className="text-lg font-bold">{wallet.mekCount}</p>
            </div>
          </div>

          <div className="border-t border-yellow-500/20 pt-4 mt-4">
            <h3 className="text-lg font-bold mb-3 text-yellow-300">Raw Database Fields:</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-gray-400 text-sm">totalCumulativeGold</p>
                <p className="text-lg font-mono">{wallet.totalCumulativeGold.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">accumulatedGold</p>
                <p className="text-lg font-mono">{wallet.accumulatedGold.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">totalGoldSpentOnUpgrades</p>
                <p className="text-lg font-mono">{wallet.totalGoldSpentOnUpgrades.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">totalGoldPerHour</p>
                <p className="text-lg font-mono">{wallet.totalGoldPerHour.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-yellow-500/20 pt-4 mt-4">
            <h3 className="text-lg font-bold mb-3 text-yellow-300">Calculated Values:</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-gray-400 text-sm">baseCumulativeGold</p>
                <p className="text-lg font-mono text-green-400">{wallet.baseCumulativeGold.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">goldEarnedSinceLastUpdate</p>
                <p className="text-lg font-mono">{wallet.goldEarnedSinceLastUpdate.toFixed(2)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-400 text-sm">currentGoldCalculated (what leaderboard should show)</p>
                <p className="text-2xl font-mono text-yellow-400">
                  {Math.floor(wallet.currentGoldCalculated).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-yellow-500/20 pt-4 mt-4">
            <h3 className="text-lg font-bold mb-3 text-yellow-300">Time Info:</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">Hours since checkpoint</p>
                <p className="font-mono">{wallet.hoursElapsedSinceCheckpoint.toFixed(2)} hours</p>
              </div>
              <div>
                <p className="text-gray-400">Last snapshot</p>
                <p className="font-mono">
                  {wallet.lastSnapshotTime
                    ? new Date(wallet.lastSnapshotTime).toLocaleString()
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
