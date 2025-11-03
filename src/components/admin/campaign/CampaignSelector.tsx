"use client";

import type { Campaign } from "@/types/campaign";

interface CampaignSelectorProps {
  campaigns: Campaign[];
  selectedCampaignId?: string;
  onSelect: (campaignId: string | undefined) => void;
  disabled?: boolean;
}

export default function CampaignSelector({
  campaigns,
  selectedCampaignId,
  onSelect,
  disabled = false,
}: CampaignSelectorProps) {
  const selectedCampaign = campaigns.find((c) => c._id === selectedCampaignId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "inactive":
        return "bg-gray-500";
      case "completed":
        return "bg-blue-500";
      case "draft":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="mek-card-industrial">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-yellow-500 mb-2">
          Select Campaign
        </h2>
        <p className="text-sm text-gray-400">
          Choose which NFT campaign to manage
        </p>
      </div>

      <div className="space-y-3">
        <select
          value={selectedCampaignId || ""}
          onChange={(e) =>
            onSelect(e.target.value ? e.target.value : undefined)
          }
          disabled={disabled}
          className={`w-full bg-black/50 border border-gray-700 rounded p-3 text-white ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
        >
          <option value="">-- No Campaign Selected --</option>
          {campaigns.map((campaign) => (
            <option key={campaign._id} value={campaign._id}>
              {campaign.name} ({campaign.status})
            </option>
          ))}
        </select>

        {selectedCampaign && (
          <div className="bg-black/30 p-4 rounded border border-gray-700">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {selectedCampaign.name}
                </h3>
                <p className="text-sm text-gray-400">
                  {selectedCampaign.description}
                </p>
              </div>
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-semibold text-white ${getStatusColor(
                  selectedCampaign.status
                )}`}
              >
                {selectedCampaign.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Total
                </p>
                <p className="text-lg font-bold text-white">
                  {selectedCampaign.totalNFTs}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Available
                </p>
                <p className="text-lg font-bold text-green-400">
                  {selectedCampaign.availableNFTs}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Reserved
                </p>
                <p className="text-lg font-bold text-yellow-400">
                  {selectedCampaign.reservedNFTs}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Sold
                </p>
                <p className="text-lg font-bold text-red-400">
                  {selectedCampaign.soldNFTs}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-500">
                <strong>Project ID:</strong>{" "}
                <span className="font-mono">{selectedCampaign.projectId}</span>
              </p>
              <p className="text-xs text-gray-500">
                <strong>Created:</strong>{" "}
                {new Date(selectedCampaign.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {campaigns.length === 0 && (
          <div className="bg-black/30 p-4 rounded border border-gray-700 text-center">
            <p className="text-gray-400">
              No campaigns found. Create one to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
