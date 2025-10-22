'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

const CAMPAIGN_NAME = "Commemorative Token 1";

export default function CommemorativeToken1Admin() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [newTestWallet, setNewTestWallet] = useState('');

  // Queries
  const config = useQuery(api.airdrop.getConfigByCampaign, { campaignName: CAMPAIGN_NAME });
  const stats = useQuery(api.airdrop.getSubmissionStats, { campaignName: CAMPAIGN_NAME });
  const eligibleCount = useQuery(api.airdrop.getEligibleUsersCount, { minimumGold: 0 });
  const allSubmissions = useQuery(api.airdrop.getAllSubmissions, { campaignName: CAMPAIGN_NAME });
  const companyNames = useQuery(
    api.airdrop.getWalletCompanyNames,
    config?.testWallets && config.testWallets.length > 0
      ? { walletAddresses: config.testWallets }
      : "skip"
  );

  // Mutations
  const upsertConfig = useMutation(api.airdrop.upsertConfig);
  const toggleActive = useMutation(api.airdrop.toggleActive);

  // Initialize campaign if it doesn't exist
  useEffect(() => {
    const initializeCampaign = async () => {
      if (config === undefined) return; // Still loading
      if (config !== null) return; // Already exists

      setIsInitializing(true);
      try {
        await upsertConfig({
          campaignName: CAMPAIGN_NAME,
          isActive: false, // Start disabled
          nftName: "Early Miner Commemorative NFT",
          nftDescription: "Awarded to early supporters who connected their wallet and accumulated gold",
          minimumGold: 0, // Any gold qualifies
          testMode: true, // Start in test mode for safe testing
          testWallets: [], // Empty whitelist to start
        });
      } catch (error) {
        console.error('Error initializing campaign:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeCampaign();
  }, [config, upsertConfig]);

  const handleToggleActive = async () => {
    if (!config) return;
    try {
      await toggleActive({
        campaignName: CAMPAIGN_NAME,
        isActive: !config.isActive,
      });
    } catch (error) {
      console.error('Error toggling airdrop:', error);
      alert(error instanceof Error ? error.message : 'Failed to toggle airdrop');
    }
  };

  const handleToggleTestMode = async () => {
    if (!config) return;
    try {
      await upsertConfig({
        campaignName: CAMPAIGN_NAME,
        isActive: config.isActive,
        nftName: config.nftName,
        nftDescription: config.nftDescription,
        minimumGold: config.minimumGold,
        testMode: !config.testMode,
        testWallets: config.testWallets || [],
      });
    } catch (error) {
      console.error('Error toggling test mode:', error);
      alert(error instanceof Error ? error.message : 'Failed to toggle test mode');
    }
  };

  const handleAddTestWallet = async () => {
    if (!config || !newTestWallet.trim()) return;

    const trimmed = newTestWallet.trim();
    const currentWallets = config.testWallets || [];

    if (currentWallets.includes(trimmed)) {
      alert('This wallet is already in the test list');
      return;
    }

    try {
      await upsertConfig({
        campaignName: CAMPAIGN_NAME,
        isActive: config.isActive,
        nftName: config.nftName,
        nftDescription: config.nftDescription,
        minimumGold: config.minimumGold,
        testMode: config.testMode,
        testWallets: [...currentWallets, trimmed],
      });
      setNewTestWallet('');
    } catch (error) {
      console.error('Error adding test wallet:', error);
      alert(error instanceof Error ? error.message : 'Failed to add test wallet');
    }
  };

  const handleRemoveTestWallet = async (walletToRemove: string) => {
    if (!config) return;

    try {
      const currentWallets = config.testWallets || [];
      await upsertConfig({
        campaignName: CAMPAIGN_NAME,
        isActive: config.isActive,
        nftName: config.nftName,
        nftDescription: config.nftDescription,
        minimumGold: config.minimumGold,
        testMode: config.testMode,
        testWallets: currentWallets.filter(w => w !== walletToRemove),
      });
    } catch (error) {
      console.error('Error removing test wallet:', error);
      alert(error instanceof Error ? error.message : 'Failed to remove test wallet');
    }
  };

  const handleExportCSV = () => {
    if (!allSubmissions || allSubmissions.length === 0) {
      alert('No submissions to export');
      return;
    }

    // Create CSV content
    const headers = ['Wallet Address', 'Receive Address', 'Gold at Submission', 'Submitted At', 'Status', 'Transaction Hash'];
    const rows = allSubmissions.map(sub => [
      sub.walletAddress,
      sub.receiveAddress,
      sub.goldAtSubmission.toString(),
      new Date(sub.submittedAt).toLocaleString(),
      sub.status,
      sub.transactionHash || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commemorative-token-1-submissions-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (config === undefined || isInitializing) {
    return (
      <div className="text-center py-8">
        <div className="text-yellow-400 mb-2">⏳ Loading campaign...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Campaign Status & Toggle */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-2 border-purple-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-yellow-400 mb-1">Campaign Status</h3>
            <p className="text-sm text-gray-400">Control whether users can see and claim the airdrop</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg font-bold ${config?.isActive ? 'bg-green-600/30 text-green-400 border-2 border-green-500' : 'bg-gray-700/30 text-gray-400 border-2 border-gray-600'}`}>
              {config?.isActive ? '✓ LIVE' : '○ DISABLED'}
            </div>
            <button
              onClick={handleToggleActive}
              className={`px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all ${
                config?.isActive
                  ? 'bg-red-600 hover:bg-red-700 text-white border-2 border-red-500'
                  : 'bg-green-600 hover:bg-green-700 text-white border-2 border-green-500'
              }`}
            >
              {config?.isActive ? 'Disable Airdrop' : 'Enable Airdrop'}
            </button>
          </div>
        </div>

        {config?.isActive && (
          <div className="bg-green-900/20 border border-green-500/30 rounded p-3 text-sm text-green-400">
            <strong>⚠️ Airdrop is LIVE:</strong> Eligible users can now see the claim button and submit their receive addresses.
          </div>
        )}
      </div>

      {/* TEST MODE CONTROLS */}
      <div className="bg-gradient-to-r from-orange-900/20 to-yellow-900/20 border-2 border-orange-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-orange-400 mb-1">Test Mode</h3>
            <p className="text-sm text-gray-400">Restrict banner visibility to specific wallets during testing</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg font-bold ${config?.testMode ? 'bg-orange-600/30 text-orange-400 border-2 border-orange-500' : 'bg-gray-700/30 text-gray-400 border-2 border-gray-600'}`}>
              {config?.testMode ? '🧪 TEST MODE' : '○ DISABLED'}
            </div>
            <button
              onClick={handleToggleTestMode}
              className={`px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all ${
                config?.testMode
                  ? 'bg-gray-600 hover:bg-gray-700 text-white border-2 border-gray-500'
                  : 'bg-orange-600 hover:bg-orange-700 text-white border-2 border-orange-500'
              }`}
            >
              {config?.testMode ? 'Disable Test Mode' : 'Enable Test Mode'}
            </button>
          </div>
        </div>

        {config?.testMode && (
          <div className="mt-4 space-y-4">
            <div className="bg-orange-900/20 border border-orange-500/30 rounded p-3 text-sm text-orange-400">
              <strong>⚠️ Test Mode Active:</strong> Only wallets listed below can see the airdrop banner. Other users will not see it even if eligible.
            </div>

            {/* Add Wallet Input */}
            <div className="bg-black/30 rounded-lg p-4">
              <label className="block text-xs uppercase tracking-wider text-orange-300 mb-2 font-bold">
                Add Test Wallet
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTestWallet}
                  onChange={(e) => setNewTestWallet(e.target.value)}
                  placeholder="stake1... or addr1..."
                  className="flex-1 bg-black/50 border border-orange-500/30 rounded px-3 py-2 text-sm font-mono text-white"
                />
                <button
                  onClick={handleAddTestWallet}
                  disabled={!newTestWallet.trim()}
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded transition-all"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Test Wallets List */}
            <div className="bg-black/30 rounded-lg p-4">
              <h4 className="text-sm font-bold text-orange-400 mb-3">
                Test Wallets ({config.testWallets?.length || 0})
              </h4>
              {config.testWallets && config.testWallets.length > 0 ? (
                <div className="space-y-2">
                  {config.testWallets.map((wallet, index) => {
                    const companyName = companyNames?.[wallet];
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-900/50 border border-gray-700/50 rounded p-3"
                      >
                        <div className="flex flex-col gap-1">
                          {companyName && (
                            <span className="text-sm font-bold text-yellow-400">
                              {companyName}
                            </span>
                          )}
                          <span className="font-mono text-xs text-gray-300">
                            {wallet.slice(0, 30)}...{wallet.slice(-10)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveTestWallet(wallet)}
                          className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-bold rounded transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No test wallets added yet. Add wallet addresses to allow them to see the banner in test mode.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black/50 border border-blue-500/30 rounded-lg p-4">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Eligible Users</div>
          <div className="text-3xl font-bold text-blue-400">{eligibleCount ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Connected + Gold &gt; 0</div>
        </div>

        <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-4">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Submissions</div>
          <div className="text-3xl font-bold text-yellow-400">{stats?.total ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Addresses submitted</div>
        </div>

        <div className="bg-black/50 border border-purple-500/30 rounded-lg p-4">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Pending</div>
          <div className="text-3xl font-bold text-purple-400">{stats?.pending ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Awaiting distribution</div>
        </div>

        <div className="bg-black/50 border border-green-500/30 rounded-lg p-4">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Sent</div>
          <div className="text-3xl font-bold text-green-400">{stats?.sent ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">NFTs distributed</div>
        </div>
      </div>

      {/* Export & Actions */}
      <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
        <h4 className="text-lg font-bold text-yellow-400 mb-3">Export & Distribution</h4>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            disabled={!allSubmissions || allSubmissions.length === 0}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg transition-all"
          >
            📥 Export All Addresses (CSV)
          </button>
          <div className="flex-1 bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 text-sm text-gray-400">
            Export all submitted addresses to upload to NMKR for batch distribution
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-bold text-yellow-400">Recent Submissions</h4>
          <div className="text-sm text-gray-400">
            {allSubmissions?.length ?? 0} total
          </div>
        </div>

        {allSubmissions && allSubmissions.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allSubmissions.slice(0, 10).map((submission) => (
              <div
                key={submission._id}
                className="bg-gray-900/50 border border-gray-700/50 rounded p-3 text-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-mono text-xs text-gray-400 mb-1">
                      {submission.walletAddress.slice(0, 20)}...{submission.walletAddress.slice(-10)}
                    </div>
                    <div className="font-mono text-xs text-yellow-400">
                      → {submission.receiveAddress.slice(0, 25)}...
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded text-xs font-bold ${
                    submission.status === 'sent'
                      ? 'bg-green-600/30 text-green-400'
                      : submission.status === 'pending'
                      ? 'bg-yellow-600/30 text-yellow-400'
                      : submission.status === 'processing'
                      ? 'bg-blue-600/30 text-blue-400'
                      : 'bg-red-600/30 text-red-400'
                  }`}>
                    {submission.status.toUpperCase()}
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Gold: {submission.goldAtSubmission.toLocaleString()}g</span>
                  <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                  {submission.transactionHash && (
                    <a
                      href={`https://cardanoscan.io/transaction/${submission.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      View TX ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No submissions yet. Enable the airdrop to allow users to claim.
          </div>
        )}
      </div>
    </div>
  );
}
