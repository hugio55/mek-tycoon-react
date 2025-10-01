'use client';

import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';

export default function AdminCleanupMocks() {
  const [result, setResult] = useState<string>('');
  const deleteMockAccounts = useMutation(api.deleteMockAccounts.deleteMockAccounts);
  const deleteZeroMekAccounts = useMutation(api.deleteZeroMekAccounts.deleteZeroMekAccounts);
  const allAccounts = useQuery(api.listAllGoldMiningAccounts.listAllGoldMiningAccounts);

  const handleCleanup = async () => {
    try {
      setResult('Deleting mock accounts...');
      const result = await deleteMockAccounts({});
      setResult(`✅ Deleted ${result.deletedCount} mock account entries`);
    } catch (error) {
      setResult(`❌ Error: ${error}`);
    }
  };

  const handleDeleteZeroMeks = async () => {
    try {
      setResult('Deleting all 0-Mek accounts...');
      const result = await deleteZeroMekAccounts({});
      setResult(`✅ Deleted ${result.deletedCount} accounts with 0 Meks`);
    } catch (error) {
      setResult(`❌ Error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-500 mb-8">Delete Mock Accounts</h1>

        <div className="bg-gray-900 border border-yellow-500/30 p-6 rounded mb-6">
          <h2 className="text-xl font-bold mb-4">Mock Accounts to Delete:</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>demo_wal...et 123</li>
            <li>PartsMaster</li>
            <li>ChromeLord</li>
            <li>MekTrader42</li>
            <li>EssenceKing</li>
          </ul>
        </div>

        <div className="space-x-4">
          <button
            onClick={handleCleanup}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded transition-colors"
          >
            Delete Mock Accounts
          </button>

          <button
            onClick={handleDeleteZeroMeks}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded transition-colors"
          >
            Delete All 0-Mek Accounts
          </button>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-gray-800 border border-yellow-500/30 rounded">
            <p className="font-mono">{result}</p>
          </div>
        )}

        {/* Show all accounts in database */}
        <div className="mt-8 bg-gray-900 border border-yellow-500/30 p-6 rounded">
          <h2 className="text-xl font-bold mb-4">All Accounts in Database:</h2>
          {allAccounts ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allAccounts.map((account) => (
                <div key={account._id} className="bg-gray-800 p-3 rounded text-sm">
                  <div className="font-bold text-yellow-400">{account.companyName || 'No Name'}</div>
                  <div className="text-gray-400 font-mono text-xs">{account.walletAddress}</div>
                  <div className="text-gray-500 text-xs">
                    Gold: {account.currentGold} | Rate: {account.totalGoldPerHour}/hr | Meks: {account.mekCount} | Verified: {account.isBlockchainVerified ? '✅' : '❌'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Loading...</p>
          )}
        </div>
      </div>
    </div>
  );
}
