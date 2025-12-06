'use client';

import { useState } from 'react';
import { useQuery, useMutation, useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import NMKRSyncModal from '@/components/admin/campaign/NMKRSyncModal';

export default function AdminCampaignsPage() {
  const convex = useConvex();

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>();
  const [cleaningCampaignId, setCleaningCampaignId] = useState<string | null>(null);
  const [syncingCampaignId, setSyncingCampaignId] = useState<string | null>(null);

  // NMKR Sync states
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncCampaignId, setSyncCampaignId] = useState<string | null>(null);
  const [syncDiscrepancies, setSyncDiscrepancies] = useState<any[]>([]);
  const [isVerifyingNMKR, setIsVerifyingNMKR] = useState(false);
  const [isSyncingNMKR, setIsSyncingNMKR] = useState(false);

  // Standard Convex queries and mutations
  const campaigns = useQuery(api.campaigns.getAllCampaigns, {}) || [];

  const toggleCleanup = useMutation(api.commemorativeNFTReservationsCampaign.toggleCampaignReservationCleanup);
  const runCleanup = useMutation(api.commemorativeNFTReservationsCampaign.cleanupExpiredCampaignReservationsMutation);
  const syncCounters = useMutation(api.commemorativeCampaigns.syncCampaignCounters);
  const syncCampaignInventory = useMutation(api.nmkrSync.syncCampaignInventory);
  const syncSingleNFT = useMutation(api.nmkrSync.syncSingleNFT);

  const handleToggleCleanup = async (campaignId: string, enabled: boolean) => {
    try {
      await toggleCleanup({ campaignId, enabled });
    } catch (error: any) {
      console.error('[AdminCampaigns] Error toggling cleanup:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleRunCleanup = async (campaignId: string) => {
    setCleaningCampaignId(campaignId);
    try {
      await runCleanup({ campaignId });
      await syncCounters({ campaignId });
    } catch (error: any) {
      console.error('[AdminCampaigns] Error running cleanup:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setCleaningCampaignId(null);
    }
  };

  const handleSyncCounters = async (campaignId: string) => {
    setSyncingCampaignId(campaignId);
    try {
      await syncCounters({ campaignId });
    } catch (error: any) {
      console.error('[AdminCampaigns] Error syncing counters:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSyncingCampaignId(null);
    }
  };

  const handleVerifyWithNMKR = async (campaignId: string) => {
    const campaign = campaigns.find((c: any) => c._id === campaignId);
    if (!campaign) {
      alert('Campaign not found');
      return;
    }

    setIsVerifyingNMKR(true);
    setSyncCampaignId(campaignId);

    try {
      console.log('[NMKR Sync] Verifying campaign:', campaign.name);
      console.log('[NMKR Sync] Project ID:', campaign.nmkrProjectId);

      const response = await fetch('/api/nmkr/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectUid: campaign.nmkrProjectId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to fetch from NMKR');
      }

      const nmkrData = await response.json();
      console.log('[NMKR Sync] NMKR Summary:', nmkrData.summary);

      const discrepancies = await convex.query(api.nmkrSync.getInventoryDiscrepancies, {
        campaignId: campaignId as Id<"commemorativeCampaigns">,
        nmkrStatuses: nmkrData.statuses,
      });

      console.log('[NMKR Sync] Found discrepancies:', discrepancies.length);

      setSyncDiscrepancies(discrepancies);
      setShowSyncModal(true);
    } catch (error: any) {
      console.error('[NMKR Sync] Error:', error);
      alert(`Error verifying with NMKR: ${error.message}`);
    } finally {
      setIsVerifyingNMKR(false);
    }
  };

  const handleSyncAllNFTs = async () => {
    if (!syncCampaignId) {
      alert('No campaign selected');
      return;
    }

    setIsSyncingNMKR(true);
    try {
      const campaign = campaigns.find((c: any) => c._id === syncCampaignId);
      if (!campaign) throw new Error('Campaign not found');

      const response = await fetch('/api/nmkr/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectUid: campaign.nmkrProjectId }),
      });

      if (!response.ok) throw new Error('Failed to fetch from NMKR');
      const nmkrData = await response.json();

      const result = await syncCampaignInventory({
        campaignId: syncCampaignId as Id<"commemorativeCampaigns">,
        nmkrStatuses: nmkrData.statuses,
      });

      console.log('[NMKR Sync] Sync result:', result);

      const newDiscrepancies = await convex.query(api.nmkrSync.getInventoryDiscrepancies, {
        campaignId: syncCampaignId as Id<"commemorativeCampaigns">,
        nmkrStatuses: nmkrData.statuses,
      });

      setSyncDiscrepancies(newDiscrepancies);

      if (result.errors && result.errors.length > 0) {
        alert(`Sync completed with errors:\n${result.errors.join('\n')}`);
      } else {
        alert(`Successfully synced ${result.syncedCount} NFT(s)`);
      }
    } catch (error: any) {
      console.error('[NMKR Sync] Error syncing:', error);
      alert(`Error syncing: ${error.message}`);
    } finally {
      setIsSyncingNMKR(false);
    }
  };

  const handleSyncSingleNFT = async (nftUid: string) => {
    if (!syncCampaignId) {
      alert('No campaign selected');
      return;
    }

    try {
      const campaign = campaigns.find((c: any) => c._id === syncCampaignId);
      if (!campaign) throw new Error('Campaign not found');

      const response = await fetch('/api/nmkr/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectUid: campaign.nmkrProjectId }),
      });

      if (!response.ok) throw new Error('Failed to fetch from NMKR');
      const nmkrData = await response.json();

      const nftStatus = nmkrData.statuses.find((s: any) => s.nftUid === nftUid);
      if (!nftStatus) throw new Error('NFT not found in NMKR data');

      await syncSingleNFT({
        nftUid,
        nmkrStatus: nftStatus.nmkrStatus,
        soldTo: nftStatus.soldTo,
      });

      const newDiscrepancies = await convex.query(api.nmkrSync.getInventoryDiscrepancies, {
        campaignId: syncCampaignId as Id<"commemorativeCampaigns">,
        nmkrStatuses: nmkrData.statuses,
      });

      setSyncDiscrepancies(newDiscrepancies);
    } catch (error: any) {
      console.error('[NMKR Sync] Error syncing single NFT:', error);
      alert(`Error syncing NFT: ${error.message}`);
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

          {/* Database indicator - single database now */}
          <div className="bg-gray-900 border border-green-500/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Database</div>
            <div className="text-green-400 font-bold">Production (Sturgeon)</div>
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
              {campaigns.filter((c: any) => c.status === 'active').length}
            </div>
          </div>
          <div className="bg-black/50 border border-green-500/30 rounded-lg p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Environment</div>
            <div className="text-2xl font-bold text-green-400">Production</div>
          </div>
        </div>

        {/* Campaign Cards */}
        <div className="space-y-6">
          {campaigns.length === 0 ? (
            <div className="bg-black/30 border border-yellow-500/30 rounded-lg p-12 text-center">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-gray-400">No campaigns found.</div>
            </div>
          ) : (
            campaigns.map((campaign: any) => (
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

                {/* Action Buttons */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-gray-400">Auto-Cleanup:</span>
                  <button
                    onClick={() => handleToggleCleanup(
                      campaign._id,
                      campaign.enableReservationCleanup === false
                    )}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                      campaign.enableReservationCleanup !== false
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/50 hover:bg-gray-500/30'
                    }`}
                    title="Click to toggle automatic cleanup of expired reservations"
                  >
                    {campaign.enableReservationCleanup !== false ? 'ON' : 'OFF'}
                  </button>
                  <span className="text-xs text-gray-500">(Cron runs hourly)</span>

                  <span className="text-gray-600">|</span>

                  <button
                    onClick={() => handleRunCleanup(campaign._id)}
                    disabled={cleaningCampaignId === campaign._id}
                    className="px-3 py-1 rounded text-xs font-semibold transition-all bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30 disabled:opacity-50"
                    title="Manually run cleanup to release any expired reservations now"
                  >
                    {cleaningCampaignId === campaign._id ? 'Cleaning...' : 'Run Cleanup Now'}
                  </button>

                  <button
                    onClick={() => handleSyncCounters(campaign._id)}
                    disabled={syncingCampaignId === campaign._id}
                    className="px-3 py-1 rounded text-xs font-semibold transition-all bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30 disabled:opacity-50"
                    title="Recalculate counters from actual inventory (fixes mismatched counts)"
                  >
                    {syncingCampaignId === campaign._id ? 'Syncing...' : 'Sync Counters'}
                  </button>

                  <span className="text-gray-600">|</span>

                  <button
                    onClick={() => handleVerifyWithNMKR(campaign._id)}
                    disabled={isVerifyingNMKR}
                    className="px-3 py-1 rounded text-xs font-semibold transition-all bg-purple-500/20 text-purple-400 border border-purple-500/50 hover:bg-purple-500/30 disabled:opacity-50"
                    title="Verify inventory status with NMKR (check for discrepancies)"
                  >
                    {isVerifyingNMKR && syncCampaignId === campaign._id ? 'Verifying...' : 'Verify with NMKR'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* NMKR Sync Modal */}
        <NMKRSyncModal
          isOpen={showSyncModal}
          onClose={() => {
            setShowSyncModal(false);
            setSyncCampaignId(null);
            setSyncDiscrepancies([]);
          }}
          campaignName={
            syncCampaignId
              ? campaigns.find((c: any) => c._id === syncCampaignId)?.name || 'Unknown Campaign'
              : 'Unknown Campaign'
          }
          discrepancies={syncDiscrepancies}
          onSyncAll={handleSyncAllNFTs}
          onSyncSingle={handleSyncSingleNFT}
          isSyncing={isSyncingNMKR}
        />
      </div>
    </div>
  );
}
