"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function RepairPaymentUrlsPage() {
  const [repairResult, setRepairResult] = useState<any>(null);
  const [isRepairing, setIsRepairing] = useState(false);

  const repairUrls = useMutation(api.commemorativeNFTInventorySetup.repairPaymentUrls);
  const campaigns = useQuery(api.commemorativeCampaigns.getAllCampaigns);
  const inventory = useQuery(api.commemorativeCampaigns.getAllInventoryForDiagnostics);

  const handleRepair = async () => {
    setIsRepairing(true);
    setRepairResult(null);

    try {
      const result = await repairUrls({});
      setRepairResult(result);
    } catch (error) {
      console.error("Repair failed:", error);
      setRepairResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsRepairing(false);
    }
  };

  // Check if any URLs are malformed
  const malformedUrls = inventory?.filter(
    (item: any) =>
      item.paymentUrl.includes("/?p=&n=") || item.paymentUrl.includes("?p=&n=")
  );

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Payment URL Repair Tool</h1>

      <div className="mb-8 p-6 bg-gray-900 border-2 border-yellow-500 rounded">
        <h2 className="text-xl font-bold mb-4 text-yellow-500">
          🔧 Fix Malformed Payment URLs
        </h2>
        <p className="mb-4 text-gray-300">
          This tool fixes NFT inventory items that have malformed payment URLs
          (missing project ID parameter).
        </p>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Current Status:</h3>
          {!inventory && <p className="text-gray-400">Loading inventory...</p>}
          {inventory && (
            <>
              <p className="text-white">
                Total inventory items: <span className="font-bold">{inventory.length}</span>
              </p>
              <p className={malformedUrls && malformedUrls.length > 0 ? "text-red-500 font-bold" : "text-green-500"}>
                Malformed URLs: <span className="font-bold">{malformedUrls?.length || 0}</span>
              </p>
            </>
          )}
        </div>

        <button
          onClick={handleRepair}
          disabled={isRepairing || !inventory}
          className="px-6 py-3 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {isRepairing ? "Repairing..." : "Repair All Payment URLs"}
        </button>
      </div>

      {repairResult && (
        <div
          className={`mb-8 p-6 rounded border-2 ${
            repairResult.success
              ? "bg-green-900 border-green-500"
              : "bg-red-900 border-red-500"
          }`}
        >
          <h2 className="text-xl font-bold mb-4">
            {repairResult.success ? "✅ Repair Complete" : "❌ Repair Failed"}
          </h2>

          {repairResult.success ? (
            <div className="space-y-2">
              <p>
                Total items checked: <span className="font-bold">{repairResult.totalItems}</span>
              </p>
              <p className="text-green-300">
                Repaired: <span className="font-bold">{repairResult.repairedCount}</span>
              </p>
              <p>
                Already correct: <span className="font-bold">{repairResult.skippedCount}</span>
              </p>
              {repairResult.errorCount > 0 && (
                <p className="text-red-300">
                  Errors: <span className="font-bold">{repairResult.errorCount}</span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-red-300">{repairResult.error}</p>
          )}
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">Current Campaigns</h2>
        {!campaigns && <p className="text-gray-400">Loading campaigns...</p>}
        {campaigns && campaigns.length === 0 && (
          <p className="text-yellow-500">No campaigns found</p>
        )}
        {campaigns &&
          campaigns.map((campaign: any) => (
            <div
              key={campaign._id}
              className="p-4 bg-gray-800 rounded border-2 border-gray-700"
            >
              <h3 className="font-bold text-lg mb-2">{campaign.name}</h3>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-gray-400">Status:</span>{" "}
                  <span className="font-semibold">{campaign.status}</span>
                </p>
                <p>
                  <span className="text-gray-400">Project ID:</span>{" "}
                  <span className="font-mono text-xs break-all">
                    {campaign.nmkrProjectId}
                  </span>
                </p>
                <p>
                  <span className="text-gray-400">Total NFTs:</span>{" "}
                  <span className="font-semibold">{campaign.totalNFTs}</span>
                </p>
              </div>
            </div>
          ))}
      </div>

      {malformedUrls && malformedUrls.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 text-red-500">
            Malformed Payment URLs ({malformedUrls.length})
          </h2>
          <div className="space-y-2">
            {malformedUrls.map((item: any) => (
              <div
                key={item._id}
                className="p-3 bg-red-900/20 border border-red-500 rounded text-sm"
              >
                <p className="font-semibold">{item.name}</p>
                <p className="font-mono text-xs text-red-300 break-all">
                  {item.paymentUrl}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
