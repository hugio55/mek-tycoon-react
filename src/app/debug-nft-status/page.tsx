"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function DebugNFTStatusPage() {
  const [nftUid, setNftUid] = useState("");
  const [queryUid, setQueryUid] = useState<string | null>(null);

  // Query the diagnostic data
  const diagnosticData = useQuery(
    api.commemorativeCampaigns.diagnoseNFTByUid,
    queryUid ? { nftUid: queryUid } : "skip"
  );

  // Get all campaigns
  const allCampaigns = useQuery(api.commemorativeCampaigns.getAllCampaigns);

  // Get all inventory
  const allInventory = useQuery(
    api.commemorativeCampaigns.getAllInventoryForDiagnostics
  );

  // Mutation to manually update status
  const updateStatus = useMutation(api.commemorativeCampaigns.updateNFTStatus);

  const handleDiagnose = () => {
    if (nftUid.trim()) {
      setQueryUid(nftUid.trim());
    }
  };

  const handleManualUpdate = async (status: "available" | "reserved" | "sold") => {
    if (!queryUid) return;

    try {
      await updateStatus({ nftUid: queryUid, status });
      alert(`Updated NFT status to: ${status}`);
      // Re-trigger query by setting queryUid again
      setQueryUid(queryUid);
    } catch (error) {
      alert(`Failed to update: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">NFT Status Debugger</h1>

        {/* Diagnostic Query Section */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Diagnose Specific NFT</h2>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={nftUid}
              onChange={(e) => setNftUid(e.target.value)}
              placeholder="Enter NFT UID (e.g., 8f82de2f-7cbd-45c9-b99c-4c75d0d5f006)"
              className="flex-1 px-4 py-2 bg-gray-700 rounded"
            />
            <button
              onClick={handleDiagnose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            >
              Diagnose
            </button>
          </div>

          {diagnosticData && (
            <div className="mt-4">
              {diagnosticData.found ? (
                <div className="space-y-4">
                  <div className="bg-green-900/30 border border-green-500 p-4 rounded">
                    <h3 className="font-bold text-green-400 mb-2">✅ NFT Found</h3>
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(diagnosticData.nft, null, 2)}
                    </pre>
                  </div>

                  {diagnosticData.campaign && (
                    <div className="bg-blue-900/30 border border-blue-500 p-4 rounded">
                      <h3 className="font-bold text-blue-400 mb-2">Campaign Info</h3>
                      <pre className="text-sm overflow-auto">
                        {JSON.stringify(diagnosticData.campaign, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="bg-gray-700 p-4 rounded">
                    <h3 className="font-bold mb-2">Manual Status Update</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleManualUpdate("available")}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
                      >
                        Set Available
                      </button>
                      <button
                        onClick={() => handleManualUpdate("reserved")}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded"
                      >
                        Set Reserved
                      </button>
                      <button
                        onClick={() => handleManualUpdate("sold")}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
                      >
                        Set Sold
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-900/30 border border-red-500 p-4 rounded">
                  <p className="text-red-400">❌ NFT not found in database</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* All Campaigns Overview */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4">All Campaigns</h2>
          {allCampaigns ? (
            <div className="space-y-4">
              {allCampaigns.map((campaign) => (
                <div key={campaign._id} className="bg-gray-700 p-4 rounded">
                  <h3 className="font-bold mb-2">{campaign.name}</h3>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Available:</span>{" "}
                      {campaign.availableNFTs}
                    </div>
                    <div>
                      <span className="text-gray-400">Reserved:</span>{" "}
                      {campaign.reservedNFTs}
                    </div>
                    <div>
                      <span className="text-gray-400">Sold:</span>{" "}
                      {campaign.soldNFTs}
                    </div>
                    <div>
                      <span className="text-gray-400">Total:</span>{" "}
                      {campaign.totalNFTs}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Loading campaigns...</p>
          )}
        </div>

        {/* All Inventory Table */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">All Inventory</h2>
          {allInventory ? (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">NFT #</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">UID (first 8 chars)</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allInventory.map((nft) => (
                    <tr key={nft._id} className="border-b border-gray-700">
                      <td className="p-2">{nft.name}</td>
                      <td className="p-2">#{nft.nftNumber}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            nft.status === "available"
                              ? "bg-green-900 text-green-300"
                              : nft.status === "reserved"
                              ? "bg-yellow-900 text-yellow-300"
                              : "bg-red-900 text-red-300"
                          }`}
                        >
                          {nft.status}
                        </span>
                      </td>
                      <td className="p-2 font-mono text-xs">
                        {nft.nftUid.substring(0, 8)}...
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => {
                            setNftUid(nft.nftUid);
                            setQueryUid(nft.nftUid);
                          }}
                          className="text-blue-400 hover:text-blue-300 text-xs"
                        >
                          Diagnose
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">Loading inventory...</p>
          )}
        </div>
      </div>
    </div>
  );
}
