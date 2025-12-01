"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Import new modular components
import CampaignManager from "@/components/admin/campaign/CampaignManager";
import CampaignSelector from "@/components/admin/campaign/CampaignSelector";
import CSVImportZone from "@/components/admin/nft-inventory/CSVImportZone";
import ManualNFTEntry from "@/components/admin/nft-inventory/ManualNFTEntry";
import NFTInventoryTable from "@/components/admin/nft-inventory/NFTInventoryTable";

export default function TestNMKRPage() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>();
  const [notifications, setNotifications] = useState<string[]>([]);

  const campaigns = useQuery(api.campaigns.getAllCampaigns);

  const addNotification = (message: string) => {
    const timestamped = `${new Date().toLocaleTimeString()}: ${message}`;
    setNotifications((prev) => [timestamped, ...prev].slice(0, 20));
    console.log(timestamped);
  };

  const handleImportComplete = (result: { success: boolean; created: number; skipped: number }) => {
    if (result.success) {
      addNotification(`✅ CSV Import complete: ${result.created} NFTs created, ${result.skipped} skipped`);
    }
  };

  const handleAddComplete = (nft: { nftUid: string; nftNumber: number; name: string }) => {
    addNotification(`✅ Added NFT: ${nft.name} (UID: ${nft.nftUid})`);
  };

  const handleError = (error: string) => {
    addNotification(`❌ ${error}`);
  };

  const handleCampaignCreated = (campaignId: string) => {
    addNotification(`✅ Campaign created: ${campaignId}`);
    setSelectedCampaignId(campaignId);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mek-card-industrial">
          <h1 className="text-3xl font-bold text-yellow-500 mb-2">
            NFT Campaign Management Console
          </h1>
          <p className="text-gray-400">
            Modular campaign and inventory management system
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Campaign Management */}
          <div className="space-y-6">
            <CampaignManager
              selectedCampaignId={selectedCampaignId}
              onCampaignCreated={handleCampaignCreated}
              onCampaignUpdated={() => addNotification("✅ Campaign updated")}
              onError={handleError}
            />

            <CampaignSelector
              campaigns={campaigns || []}
              selectedCampaignId={selectedCampaignId}
              onSelect={setSelectedCampaignId}
            />
          </div>

          {/* Right Column: Inventory Management */}
          <div className="space-y-6">
            <CSVImportZone
              campaignId={selectedCampaignId}
              onImportComplete={handleImportComplete}
              onError={handleError}
              disabled={!selectedCampaignId}
            />

            <ManualNFTEntry
              campaignId={selectedCampaignId}
              onAddComplete={handleAddComplete}
              onError={handleError}
              disabled={!selectedCampaignId}
            />
          </div>
        </div>

        {/* Full Width: Inventory Table */}
        <NFTInventoryTable
          campaignId={selectedCampaignId}
          onRefresh={() => addNotification("🔄 Inventory refreshed")}
          onError={handleError}
        />

        {/* Notifications Log */}
        <div className="mek-card-industrial">
          <h2 className="text-xl font-bold text-yellow-500 mb-4">
            Activity Log
          </h2>
          <div className="bg-black/50 rounded p-4 font-mono text-sm space-y-1 max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-gray-500">No activity yet...</p>
            ) : (
              notifications.map((notification, i) => (
                <div key={i} className="text-gray-300">
                  {notification}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mek-card-industrial">
          <h2 className="text-xl font-bold text-yellow-500 mb-4">
            Quick Start Guide
          </h2>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="bg-black/30 p-3 rounded border border-gray-700">
              <p className="font-semibold text-yellow-500 mb-2">
                Step 1: Create a Campaign
              </p>
              <p>
                Use the Campaign Management section to create a new NFT campaign.
                Provide a name, description, NMKR project ID, and max NFT count.
              </p>
            </div>

            <div className="bg-black/30 p-3 rounded border border-gray-700">
              <p className="font-semibold text-yellow-500 mb-2">
                Step 2: Select Campaign
              </p>
              <p>
                Use the Campaign Selector dropdown to choose which campaign you
                want to work with. This enables the inventory management tools.
              </p>
            </div>

            <div className="bg-black/30 p-3 rounded border border-gray-700">
              <p className="font-semibold text-yellow-500 mb-2">
                Step 3: Import NFTs
              </p>
              <p>
                Use CSV Import (recommended) to bulk upload NFTs from NMKR Studio,
                or use Manual Entry to add individual NFTs one at a time.
              </p>
            </div>

            <div className="bg-black/30 p-3 rounded border border-gray-700">
              <p className="font-semibold text-yellow-500 mb-2">
                Step 4: Manage Inventory
              </p>
              <p>
                View all NFTs in the Inventory Table. Filter by status
                (available/reserved/sold) and manage your collection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
