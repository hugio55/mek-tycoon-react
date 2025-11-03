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

interface NFTImportEntry {
  nftUid: string;
  nftNumber: string;
  name: string;
}

export default function CampaignManager({
  selectedCampaignId,
  onCampaignCreated,
  onCampaignUpdated,
  onError,
}: CampaignManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nmkrProjectId, setNmkrProjectId] = useState("");
  const [maxNFTs, setMaxNFTs] = useState("");
  const [status, setStatus] = useState<CampaignStatus>("inactive");

  // NFT Import state
  const [nftUid, setNftUid] = useState("");
  const [nftNumber, setNftNumber] = useState("");
  const [nftName, setNftName] = useState("");

  const createCampaign = useMutation(api.campaigns.createCampaign);
  const updateCampaign = useMutation(api.campaigns.updateCampaign);
  const deleteCampaign = useMutation(api.campaigns.deleteCampaign);
  const populateInventory = useMutation(api.commemorativeCampaigns.populateCampaignInventory);
  const syncCounters = useMutation(api.commemorativeCampaigns.syncCampaignCounters);

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

  const handleEditStart = (campaign: Campaign) => {
    setEditingCampaignId(campaign._id);
    setName(campaign.name);
    setDescription(campaign.description);
    setNmkrProjectId(campaign.nmkrProjectId);
    setMaxNFTs(campaign.maxNFTs.toString());
    setStatus(campaign.status);
    setShowCreateForm(false);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingCampaignId || !name.trim() || !description.trim() || !nmkrProjectId.trim() || !maxNFTs.trim()) {
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
      await updateCampaign({
        campaignId: editingCampaignId as Id<"commemorativeCampaigns">,
        name: name.trim(),
        description: description.trim(),
        nmkrProjectId: nmkrProjectId.trim(),
        maxNFTs: maxNFTsNum,
        status,
      });

      setEditingCampaignId(null);
      clearForm();
      onCampaignUpdated?.();
    } catch (error) {
      const errorMsg = `Failed to update campaign: ${error}`;
      onError?.(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCancel = () => {
    setEditingCampaignId(null);
    clearForm();
  };

  const clearForm = () => {
    setName("");
    setDescription("");
    setNmkrProjectId("");
    setMaxNFTs("");
    setStatus("inactive");
  };

  const clearImportForm = () => {
    setNftUid("");
    setNftNumber("");
    setNftName("");
    setImportMessage(null);
  };

  const handleGenerateName = (number: string) => {
    if (number && !isNaN(parseInt(number))) {
      const campaignName = campaigns?.find((c) => c._id === selectedCampaignId)?.name || "";
      setNftName(`${campaignName} #${number}`);
    }
  };

  const handleImportNFT = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCampaignId) {
      setImportMessage({ type: "error", text: "No campaign selected" });
      return;
    }

    if (!nftUid.trim() || !nftNumber.trim()) {
      setImportMessage({ type: "error", text: "NFT UID and NFT Number are required" });
      return;
    }

    const number = parseInt(nftNumber);
    if (isNaN(number) || number < 1 || number > 10) {
      setImportMessage({ type: "error", text: "NFT Number must be between 1 and 10" });
      return;
    }

    const finalName = nftName.trim() || `NFT #${number}`;

    setIsSubmitting(true);

    try {
      const result = await populateInventory({
        campaignId: selectedCampaignId as Id<"commemorativeCampaigns">,
        nfts: [
          {
            nftUid: nftUid.trim(),
            nftNumber: number,
            name: finalName,
          },
        ],
      });

      if (result.success) {
        setImportMessage({ type: "success", text: `NFT ${finalName} imported successfully!` });
        clearImportForm();

        // Refresh campaign stats
        await syncCounters({
          campaignId: selectedCampaignId as Id<"commemorativeCampaigns">,
        });

        onCampaignUpdated?.();
      } else {
        setImportMessage({ type: "error", text: result.error || "Failed to import NFT" });
      }
    } catch (error) {
      setImportMessage({
        type: "error",
        text: `Error importing NFT: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsSubmitting(false);
    }
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
              {editingCampaignId === campaign._id ? (
                <form onSubmit={handleEditSave} className="space-y-3">
                  <h3 className="text-lg font-semibold text-yellow-500 mb-3">
                    Edit Campaign
                  </h3>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Campaign Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black/50 border border-gray-700 rounded p-2"
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
                      min="1"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Status
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

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex-1"
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={handleEditCancel}
                      disabled={isSubmitting}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {campaign.name}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {campaign.description}
                      </p>
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        Project ID: {campaign.nmkrProjectId}
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

              {campaign.status === "active" && (
                <div className="mb-3">
                  <button
                    onClick={() => {
                      setShowImportForm(!showImportForm);
                      if (!showImportForm) clearImportForm();
                    }}
                    className="mek-button-secondary text-sm"
                  >
                    {showImportForm ? "Cancel Import" : "Import NFTs"}
                  </button>

                  {showImportForm && campaign._id === selectedCampaignId && (
                    <form onSubmit={handleImportNFT} className="mt-3 p-3 bg-black/50 rounded border border-yellow-500/30 space-y-3">
                      <h4 className="text-sm font-semibold text-yellow-500">
                        Add NFT to Campaign
                      </h4>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          NFT UID <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={nftUid}
                          onChange={(e) => setNftUid(e.target.value)}
                          className="w-full bg-black/50 border border-gray-600 rounded p-2 text-sm font-mono"
                          placeholder="10aec295-d9e2-47e3-9c04-e56e2df92ad5"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            NFT Number (1-10) <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="number"
                            value={nftNumber}
                            onChange={(e) => {
                              setNftNumber(e.target.value);
                              if (e.target.value) {
                                handleGenerateName(e.target.value);
                              }
                            }}
                            className="w-full bg-black/50 border border-gray-600 rounded p-2 text-sm"
                            placeholder="1"
                            min="1"
                            max="10"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            NFT Name (auto-generated)
                          </label>
                          <input
                            type="text"
                            value={nftName}
                            onChange={(e) => setNftName(e.target.value)}
                            className="w-full bg-black/50 border border-gray-600 rounded p-2 text-sm"
                            placeholder="Lab Rat #1"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      {importMessage && (
                        <div
                          className={`p-2 rounded text-sm ${
                            importMessage.type === "success"
                              ? "bg-green-500/20 text-green-400 border border-green-500/50"
                              : "bg-red-500/20 text-red-400 border border-red-500/50"
                          }`}
                        >
                          {importMessage.text}
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex-1"
                        >
                          {isSubmitting ? "Importing..." : "Add NFT"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowImportForm(false);
                            clearImportForm();
                          }}
                          disabled={isSubmitting}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Done
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditStart(campaign)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
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
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
