"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Campaign, CampaignStatus } from "@/types/campaign";
import type { Id } from "../../../../convex/_generated/dataModel";

interface CampaignManagerProps {
  selectedCampaignId?: string;
  onCampaignCreated?: (campaignId: string) => void;
  onCampaignUpdated?: () => void;
  onError?: (error: string) => void;
}

export default function CampaignManager({
  selectedCampaignId,
  onCampaignCreated,
  onCampaignUpdated,
  onError,
}: CampaignManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nmkrProjectId, setNmkrProjectId] = useState("");
  const [maxNFTs, setMaxNFTs] = useState("");
  const [status, setStatus] = useState<CampaignStatus>("inactive");

  const createCampaign = useMutation(api.campaigns.createCampaign);
  const updateCampaign = useMutation(api.campaigns.updateCampaign);
  const deleteCampaign = useMutation(api.campaigns.deleteCampaign);

  const campaigns = useQuery(api.campaigns.getAllCampaigns);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !description.trim() || !nmkrProjectId.trim() || !maxNFTs.trim()) {
      const errorMsg = "All fields are required";
      onError?.(errorMsg);
      return;
    }

    const maxNFTsNum = parseInt(maxNFTs);
    if (isNaN(maxNFTsNum) || maxNFTsNum <= 0) {
      const errorMsg = "Max NFTs must be a positive number";
      onError?.(errorMsg);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createCampaign({
        name: name.trim(),
        description: description.trim(),
        nmkrProjectId: nmkrProjectId.trim(),
        maxNFTs: maxNFTsNum,
        status,
      });

      onCampaignCreated?.(result.campaignId);
      setShowCreateForm(false);
      clearForm();
    } catch (error) {
      const errorMsg = `Failed to create campaign: ${error}`;
      onError?.(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (campaignId: Id<"commemorativeCampaigns">) => {
    if (!confirm("Are you sure you want to delete this campaign?")) {
      return;
    }

    try {
      await deleteCampaign({ campaignId });
      onCampaignUpdated?.();
    } catch (error) {
      const errorMsg = `Failed to delete campaign: ${error}`;
      onError?.(errorMsg);
    }
  };

  const handleToggleStatus = async (campaign: Campaign) => {
    const newStatus: CampaignStatus = campaign.status === "active" ? "inactive" : "active";

    try {
      await updateCampaign({
        campaignId: campaign._id,
        status: newStatus,
      });
      onCampaignUpdated?.();
    } catch (error) {
      const errorMsg = `Failed to update campaign status: ${error}`;
      onError?.(errorMsg);
    }
  };

  const clearForm = () => {
    setName("");
    setDescription("");
    setNmkrProjectId("");
    setMaxNFTs("");
    setStatus("inactive");
  };

  if (!campaigns) {
    return (
      <div className="mek-card-industrial">
        <div className="text-gray-400">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div className="mek-card-industrial">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-yellow-500 mb-2">
            Campaign Management
          </h2>
          <p className="text-sm text-gray-400">
            Create and manage NFT campaigns
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="mek-button-primary"
        >
          {showCreateForm ? "Cancel" : "Create Campaign"}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreate} className="mb-6 p-4 bg-black/30 rounded border border-yellow-500/30">
          <h3 className="text-lg font-semibold text-yellow-500 mb-3">
            New Campaign
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Campaign Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded p-2"
                placeholder="Lab Rat Collection"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded p-2"
                placeholder="Limited edition commemorative NFTs..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                NMKR Project ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={nmkrProjectId}
                onChange={(e) => setNmkrProjectId(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded p-2 font-mono text-sm"
                placeholder="c68dc0e9b2ca4e0eb9c4a57ef85a794d"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Max NFTs <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={maxNFTs}
                onChange={(e) => setMaxNFTs(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded p-2"
                placeholder="10"
                min="1"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CampaignStatus)}
                className="w-full bg-black/50 border border-gray-700 rounded p-2"
                disabled={isSubmitting}
              >
                <option value="inactive">Inactive</option>
                <option value="active">Active</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="mek-button-primary flex-1"
              >
                {isSubmitting ? "Creating..." : "Create Campaign"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  clearForm();
                }}
                disabled={isSubmitting}
                className="mek-button-secondary px-6"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">
          All Campaigns ({campaigns.length})
        </h3>

        {campaigns.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No campaigns created yet</p>
            <p className="text-sm mt-2">Click "Create Campaign" to get started</p>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div
              key={campaign._id}
              className={`bg-black/30 p-4 rounded border ${
                campaign._id === selectedCampaignId
                  ? "border-yellow-500"
                  : "border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-semibold text-white">
                    {campaign.name}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {campaign.description}
                  </p>
                </div>
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    campaign.status === "active"
                      ? "bg-green-500 text-white"
                      : "bg-gray-500 text-white"
                  }`}
                >
                  {campaign.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-3">
                <div className="bg-black/50 p-2 rounded">
                  <p className="text-xs text-gray-400">Max</p>
                  <p className="text-lg font-bold text-white">
                    {campaign.maxNFTs}
                  </p>
                </div>
                <div className="bg-black/50 p-2 rounded">
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="text-lg font-bold text-white">
                    {campaign.totalNFTs}
                  </p>
                </div>
                <div className="bg-black/50 p-2 rounded border border-green-500/30">
                  <p className="text-xs text-gray-400">Available</p>
                  <p className="text-lg font-bold text-green-400">
                    {campaign.availableNFTs}
                  </p>
                </div>
                <div className="bg-black/50 p-2 rounded border border-yellow-500/30">
                  <p className="text-xs text-gray-400">Reserved</p>
                  <p className="text-lg font-bold text-yellow-400">
                    {campaign.reservedNFTs}
                  </p>
                </div>
                <div className="bg-black/50 p-2 rounded border border-red-500/30">
                  <p className="text-xs text-gray-400">Sold</p>
                  <p className="text-lg font-bold text-red-400">
                    {campaign.soldNFTs}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleStatus(campaign)}
                  className={`px-4 py-1 rounded text-sm ${
                    campaign.status === "active"
                      ? "bg-gray-600 hover:bg-gray-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {campaign.status === "active" ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => handleDelete(campaign._id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
