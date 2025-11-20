'use client';

import { useState, useEffect } from 'react';
import { DatabaseProvider, useDatabaseContext } from '@/contexts/DatabaseContext';
import { api } from '@/convex/_generated/api';
import CampaignManager from '@/components/admin/campaign/CampaignManager';
import NFTInventoryTable from '@/components/admin/campaign/NFTInventoryTable';

function AdminCampaignsContent() {
  const {
    selectedDatabase,
    setSelectedDatabase,
    client,
    canMutate
  } = useDatabaseContext();

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignUpdateTrigger, setCampaignUpdateTrigger] = useState(0);

  // Fetch campaigns from selected database
  useEffect(() => {
    if (!client) return;

    let cancelled = false;

    const fetchCampaigns = async () => {
      try {
        const data = await client.query(api.campaigns.getAllCampaigns, {});
        if (!cancelled) {
          setCampaigns(data || []);
        }
      } catch (error) {
        console.error('[AdminCampaigns] Error fetching campaigns:', error);
      }
    };

    fetchCampaigns();
    const interval = setInterval(fetchCampaigns, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [client, selectedDatabase, campaignUpdateTrigger]);

  const handleCampaignUpdated = () => {
    setCampaignUpdateTrigger(prev => prev + 1);
  };

  const handleToggleCleanup = async (campaignId: string, enabled: boolean) => {
    if (!client || !canMutate()) {
      alert('Mutations disabled for this database. Enable production mutations to make changes.');
      return;
    }

    try {
      await client.mutation(api.commemorativeNFTReservationsCampaign.toggleCampaignReservationCleanup, {
        campaignId,
        enabled
      });
      handleCampaignUpdated();
    } catch (error: any) {
      console.error('[AdminCampaigns] Error toggling cleanup:', error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-yellow-400 mb-2">Campaign Management</h1>
            <p className="text-gray-400">Manage NFT minting campaigns and reservations</p>
          </div>

          {/* Database Selector */}
          <div className="bg-gray-900 border border-yellow-500/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Database</div>
            <select
              value={selectedDatabase}
              onChange={(e) => setSelectedDatabase(e.target.value as 'trout' | 'sturgeon')}
              className="bg-black/50 border border-yellow-500/30 rounded px-3 py-1 text-white text-sm"
            >
              <option value="trout">Trout (Dev - localhost:3200)</option>
              <option value="sturgeon">Sturgeon (Production - Live Site)</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Campaigns</div>
            <div className="text-3xl font-bold text-yellow-400">{campaigns.length}</div>
          </div>
          <div className="bg-black/50 border border-cyan-500/30 rounded-lg p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Active Campaigns</div>
            <div className="text-3xl font-bold text-cyan-400">
              {campaigns.filter((c) => c.status === 'active').length}
            </div>
          </div>
          <div className="bg-black/50 border border-green-500/30 rounded-lg p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Selected Database</div>
            <div className="text-2xl font-bold text-green-400">
              {selectedDatabase === 'trout' ? '🐟 Trout (Dev)' : '🐟 Sturgeon (Prod)'}
            </div>
          </div>
        </div>

        {/* Warning for Production */}
        {selectedDatabase === 'sturgeon' && !canMutate() && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <div className="font-bold text-red-400">READ ONLY MODE</div>
                <div className="text-sm text-gray-300">
                  You are viewing Sturgeon (Production) in read-only mode.
                  Toggle cleanup will not work unless you enable production mutations.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campaign Cards with Toggle Controls */}
        <div className="space-y-6">
          {campaigns.length === 0 ? (
            <div className="bg-black/30 border border-yellow-500/30 rounded-lg p-12 text-center">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-gray-400">No campaigns found in {selectedDatabase === 'trout' ? 'Trout (Dev)' : 'Sturgeon (Production)'}.</div>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <div
                key={campaign._id}
                className="bg-black/30 border border-yellow-500/30 rounded-lg p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-yellow-400">{campaign.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{campaign.description || 'No description'}</p>
                  </div>
                  <div className={`px-3 py-1 rounded text-xs font-bold ${
                    campaign.status === 'active' ? 'bg-green-900/30 text-green-400' :
                    campaign.status === 'paused' ? 'bg-yellow-900/30 text-yellow-400' :
                    'bg-gray-900/30 text-gray-400'
                  }`}>
                    {campaign.status.toUpperCase()}
                  </div>
                </div>

                {/* Campaign Stats */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-black/50 rounded p-3">
                    <div className="text-xs text-gray-400">Total NFTs</div>
                    <div className="text-lg font-bold text-white">{campaign.totalNFTs}</div>
                  </div>
                  <div className="bg-black/50 rounded p-3">
                    <div className="text-xs text-gray-400">Available</div>
                    <div className="text-lg font-bold text-green-400">{campaign.availableNFTs}</div>
                  </div>
                  <div className="bg-black/50 rounded p-3">
                    <div className="text-xs text-gray-400">Reserved</div>
                    <div className="text-lg font-bold text-yellow-400">{campaign.reservedNFTs}</div>
                  </div>
                  <div className="bg-black/50 rounded p-3">
                    <div className="text-xs text-gray-400">Sold</div>
                    <div className="text-lg font-bold text-cyan-400">{campaign.soldNFTs}</div>
                  </div>
                </div>

                {/* Cleanup Toggle Button */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleToggleCleanup(
                      campaign._id,
                      campaign.enableReservationCleanup === false
                    )}
                    className="text-xs text-gray-400 hover:text-yellow-400 transition-colors underline"
                    title="Toggle automatic cleanup of expired reservations"
                  >
                    {campaign.enableReservationCleanup !== false ? '🗑️ Disable Cleanup' : '✅ Enable Cleanup'}
                  </button>
                  <span className="text-xs text-gray-500">
                    (Cleanup runs every 5 minutes)
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminCampaignsPage() {
  return (
    <DatabaseProvider>
      <AdminCampaignsContent />
    </DatabaseProvider>
  );
}
