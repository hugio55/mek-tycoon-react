"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface MatchingMeksLightboxProps {
  listing: {
    _id: Id<"tradeListings">;
    ownerStakeAddress: string;
    ownerCorpName?: string;
    listedMekAssetId: string;
    listedMekSourceKey?: string;
    listedMekAssetName?: string;
    desiredVariations: {
      variationName: string;
      variationType: string;
    }[];
  };
  viewerStakeAddress: string;
  onClose: () => void;
}

export default function MatchingMeksLightbox({
  listing,
  viewerStakeAddress,
  onClose,
}: MatchingMeksLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedMeks, setSelectedMeks] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get matching Meks
  const matchingMeks = useQuery(api.tradeFloor.getMatchingMeksForListing, {
    listingId: listing._id,
    viewerStakeAddress,
  });

  const submitOffer = useMutation(api.tradeFloor.submitOffer);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const toggleMek = (assetId: string) => {
    if (selectedMeks.includes(assetId)) {
      setSelectedMeks(selectedMeks.filter((id) => id !== assetId));
    } else if (selectedMeks.length < 3) {
      setSelectedMeks([...selectedMeks, assetId]);
    }
  };

  const handleSubmit = async () => {
    if (selectedMeks.length === 0) return;

    setIsSubmitting(true);
    try {
      await submitOffer({
        listingId: listing._id,
        offererStakeAddress: viewerStakeAddress,
        offeredMekAssetIds: selectedMeks,
      });
      onClose();
    } catch (error: any) {
      alert(error.message || "Failed to submit offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  // Clean source key for image
  const getMekImagePath = (sourceKey?: string) => {
    const cleanKey = (sourceKey || "").replace(/-[A-Z]$/i, "").toLowerCase();
    return cleanKey ? `/mek-images/150px/${cleanKey}.webp` : "/mek-images/placeholder.webp";
  };

  const listedMekImage = getMekImagePath(listing.listedMekSourceKey);

  const variationTypeColors: Record<string, string> = {
    head: "text-blue-400 bg-blue-500/20 border-blue-500/30",
    body: "text-green-400 bg-green-500/20 border-green-500/30",
    trait: "text-purple-400 bg-purple-500/20 border-purple-500/30",
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Content */}
      <div
        className="relative bg-gray-900 border border-yellow-500/30 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-black/30">
          <div>
            <h2 className="text-xl font-bold text-yellow-400">Make an Offer</h2>
            <p className="text-sm text-gray-400">
              Select up to 3 of your matching Meks to offer
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-light"
          >
            &times;
          </button>
        </div>

        {/* Listed Mek Preview */}
        <div className="px-6 py-4 bg-black/20 border-b border-gray-800">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Trading for:
          </div>
          <div className="flex items-center gap-4">
            <img
              src={listedMekImage}
              alt={listing.listedMekAssetName}
              className="w-16 h-16 object-contain"
            />
            <div>
              <div className="text-white font-medium">{listing.listedMekAssetName}</div>
              <div className="text-sm text-gray-400">
                Listed by {listing.ownerCorpName || "Unknown Corp"}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-1">Wants:</div>
            <div className="flex flex-wrap gap-1">
              {listing.desiredVariations.map((v, i) => (
                <span
                  key={i}
                  className={`px-2 py-0.5 text-xs rounded border ${variationTypeColors[v.variationType]}`}
                >
                  {v.variationName}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Matching Meks Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {matchingMeks === undefined ? (
            <div className="text-center py-12 text-gray-400">Finding your matching Meks...</div>
          ) : matchingMeks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😔</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Matching Meks</h3>
              <p className="text-gray-500">
                You don't own any Meks with the variations this listing is looking for
              </p>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-400 mb-4">
                {matchingMeks.length} Mek{matchingMeks.length !== 1 ? "s" : ""} match the desired
                variations. Select up to 3 ({selectedMeks.length}/3 selected).
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {matchingMeks.map((mek: any) => {
                  const isSelected = selectedMeks.includes(mek.assetId);
                  return (
                    <button
                      key={mek.assetId}
                      onClick={() => toggleMek(mek.assetId)}
                      disabled={!isSelected && selectedMeks.length >= 3}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        isSelected
                          ? "border-yellow-500 bg-yellow-500/10"
                          : selectedMeks.length >= 3
                          ? "border-gray-700 bg-gray-800/50 opacity-50 cursor-not-allowed"
                          : "border-gray-700 hover:border-gray-500 bg-gray-800/50"
                      }`}
                    >
                      <img
                        src={getMekImagePath(mek.sourceKey || mek.sourceKeyBase)}
                        alt={mek.assetName}
                        className="w-full aspect-square object-contain mb-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/mek-images/placeholder.webp";
                        }}
                      />
                      <div className="text-xs text-gray-400 truncate">{mek.assetName}</div>
                      <div className="text-xs text-green-400 mt-1">
                        Matches: {mek.matchedVariations.join(", ")}
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3 bg-black/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedMeks.length === 0 || isSubmitting}
            className={`px-6 py-2 rounded font-medium transition-all ${
              selectedMeks.length === 0 || isSubmitting
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-yellow-500 hover:bg-yellow-400 text-black"
            }`}
          >
            {isSubmitting
              ? "Submitting..."
              : `Submit Offer (${selectedMeks.length} Mek${selectedMeks.length !== 1 ? "s" : ""})`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
