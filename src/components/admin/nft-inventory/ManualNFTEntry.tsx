"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { NFTEntry } from "@/types/campaign";

interface ManualNFTEntryProps {
  campaignId?: string;
  onAddComplete?: (nft: NFTEntry) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export default function ManualNFTEntry({
  campaignId,
  onAddComplete,
  onError,
  disabled = false,
}: ManualNFTEntryProps) {
  const [nftUid, setNftUid] = useState("");
  const [nftNumber, setNftNumber] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string>("");

  const populateManually = useMutation(
    api.commemorativeNFTInventorySetup.populateInventoryManually
  );

  const validateForm = (): string | null => {
    if (!nftUid.trim()) {
      return "NFT UID is required";
    }

    if (!nftNumber.trim()) {
      return "NFT Number is required";
    }

    const num = parseInt(nftNumber);
    if (isNaN(num) || num <= 0) {
      return "NFT Number must be a positive number";
    }

    if (!name.trim()) {
      return "NFT Name is required";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (disabled) {
      const errorMsg = "Form is currently disabled";
      setStatus(errorMsg);
      onError?.(errorMsg);
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setStatus(validationError);
      onError?.(validationError);
      return;
    }

    setIsSubmitting(true);
    setStatus("Adding NFT to inventory...");

    try {
      const nftEntry: NFTEntry = {
        nftUid: nftUid.trim(),
        nftNumber: parseInt(nftNumber),
        name: name.trim(),
      };

      await populateManually({
        nfts: [nftEntry],
      });

      const successMsg = `Successfully added ${nftEntry.name}`;
      setStatus(successMsg);
      onAddComplete?.(nftEntry);

      // Clear form
      setNftUid("");
      setNftNumber("");
      setName("");
    } catch (error) {
      const errorMsg = `Failed to add NFT: ${error}`;
      setStatus(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setNftUid("");
    setNftNumber("");
    setName("");
    setStatus("");
  };

  return (
    <div className="mek-card-industrial">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-yellow-500 mb-2">
          Manual NFT Entry
        </h2>
        <p className="text-sm text-gray-400">
          Add a single NFT to the inventory manually
        </p>
        {disabled && (
          <p className="text-sm text-red-400 mt-2">
            Form disabled - select a campaign first
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            NFT UID <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={nftUid}
            onChange={(e) => setNftUid(e.target.value)}
            disabled={disabled || isSubmitting}
            className={`w-full bg-black/50 border border-gray-700 rounded p-2 font-mono text-sm ${
              disabled || isSubmitting ? "cursor-not-allowed opacity-50" : ""
            }`}
            placeholder="10aec295-d9e2-47e3-9c04-e56e2df92ad5"
          />
          <p className="text-xs text-gray-500 mt-1">
            NMKR unique identifier (UUID format)
          </p>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            NFT Number <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            value={nftNumber}
            onChange={(e) => setNftNumber(e.target.value)}
            disabled={disabled || isSubmitting}
            min="1"
            className={`w-full bg-black/50 border border-gray-700 rounded p-2 ${
              disabled || isSubmitting ? "cursor-not-allowed opacity-50" : ""
            }`}
            placeholder="1"
          />
          <p className="text-xs text-gray-500 mt-1">Edition number (e.g., 1, 2, 3)</p>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={disabled || isSubmitting}
            className={`w-full bg-black/50 border border-gray-700 rounded p-2 ${
              disabled || isSubmitting ? "cursor-not-allowed opacity-50" : ""
            }`}
            placeholder="Lab Rat #1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Display name (e.g., Lab Rat #1)
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={disabled || isSubmitting}
            className="mek-button-primary flex-1"
          >
            {isSubmitting ? "Adding..." : "Add NFT"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled || isSubmitting}
            className="mek-button-secondary px-6"
          >
            Clear
          </button>
        </div>
      </form>

      {status && (
        <div
          className={`mt-4 p-3 rounded border ${
            status.includes("Success")
              ? "border-green-500 bg-green-500/10 text-green-400"
              : status.includes("Failed") || status.includes("required")
              ? "border-red-500 bg-red-500/10 text-red-400"
              : "border-yellow-500 bg-yellow-500/10 text-yellow-400"
          }`}
        >
          <p className="text-sm font-mono">{status}</p>
        </div>
      )}

      <div className="mt-4 p-3 bg-black/30 rounded border border-gray-700">
        <p className="text-xs text-gray-400 mb-2">
          <strong>Where to find values:</strong>
        </p>
        <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
          <li>
            <strong>NFT UID:</strong> NMKR Studio → NFTs tab → Click NFT → Copy
            UID
          </li>
          <li>
            <strong>NFT Number:</strong> Edition/serial number (1, 2, 3, etc.)
          </li>
          <li>
            <strong>Name:</strong> Display name shown in NMKR Studio
          </li>
        </ul>
      </div>
    </div>
  );
}
