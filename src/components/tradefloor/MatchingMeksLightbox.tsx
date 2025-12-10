"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getMediaUrl } from "@/lib/media-url";

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

const variationTypeColors: Record<string, { bg: string; border: string; text: string }> = {
  head: { bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.3)", text: "#60a5fa" },
  body: { bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.3)", text: "#4ade80" },
  trait: { bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.3)", text: "#c084fc" },
};

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
    return cleanKey ? getMediaUrl(`/mek-images/150px/${cleanKey}.webp`) : getMediaUrl("/mek-images/placeholder.webp");
  };

  const listedMekImage = getMekImagePath(listing.listedMekSourceKey);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        onClick={onClose}
      />

      {/* Content */}
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex justify-between items-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div>
            <h2
              className="text-xl font-bold text-white"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              Make an Offer
            </h2>
            <p
              className="text-sm"
              style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
            >
              Select up to 3 of your matching Meks to offer
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white/80 text-2xl font-light transition-colors"
            style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            &times;
          </button>
        </div>

        {/* Listed Mek Preview */}
        <div
          className="px-6 py-4"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div
            className="text-xs uppercase tracking-wider mb-2"
            style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.4)' }}
          >
            Trading for:
          </div>
          <div className="flex items-center gap-4">
            <img
              src={listedMekImage}
              alt={listing.listedMekAssetName}
              className="w-16 h-16 object-contain"
            />
            <div>
              <div
                className="text-white font-medium"
                style={{ fontFamily: 'Saira, sans-serif' }}
              >
                {listing.listedMekAssetName}
              </div>
              <div
                className="text-sm"
                style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
              >
                Listed by {listing.ownerCorpName || "Unknown Corp"}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div
              className="text-xs mb-2"
              style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.4)' }}
            >
              Wants:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {listing.desiredVariations.map((v, i) => {
                const colors = variationTypeColors[v.variationType];
                return (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs rounded"
                    style={{
                      background: colors?.bg || 'rgba(255,255,255,0.1)',
                      border: `1px solid ${colors?.border || 'rgba(255,255,255,0.2)'}`,
                      color: colors?.text || 'white',
                      fontFamily: 'Play, sans-serif',
                    }}
                  >
                    {v.variationName}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Matching Meks Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {matchingMeks === undefined ? (
            <div
              className="text-center py-12"
              style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
            >
              Finding your matching Meks...
            </div>
          ) : matchingMeks.length === 0 ? (
            <div
              className="text-center py-12 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div className="text-6xl mb-4">🤖</div>
              <h3
                className="text-xl font-semibold text-white mb-2"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                No Matching Meks
              </h3>
              <p style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}>
                You don't own any Meks with the variations this listing is looking for
              </p>
            </div>
          ) : (
            <>
              <div
                className="text-sm mb-4"
                style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
              >
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
                      className="relative p-3 rounded-lg transition-all text-left hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: isSelected
                          ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.2), rgba(34, 211, 238, 0.1))'
                          : 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                        border: isSelected
                          ? '1px solid rgba(34, 211, 238, 0.5)'
                          : '1px solid rgba(255,255,255,0.1)',
                        opacity: !isSelected && selectedMeks.length >= 3 ? 0.5 : 1,
                        cursor: !isSelected && selectedMeks.length >= 3 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <img
                        src={getMekImagePath(mek.sourceKey || mek.sourceKeyBase)}
                        alt={mek.assetName}
                        className="w-full aspect-square object-contain mb-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getMediaUrl("/mek-images/placeholder.webp");
                        }}
                      />
                      <div
                        className="text-xs truncate"
                        style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.6)' }}
                      >
                        {mek.assetName}
                      </div>
                      <div
                        className="text-xs mt-1"
                        style={{ fontFamily: 'Play, sans-serif', color: '#4ade80' }}
                      >
                        Matches: {mek.matchedVariations.join(", ")}
                      </div>
                      {isSelected && (
                        <div
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-black font-bold text-sm"
                          style={{
                            background: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
                            boxShadow: '0 0 10px rgba(34, 211, 238, 0.5)',
                          }}
                        >
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
        <div
          className="px-6 py-4 flex justify-end gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 transition-colors"
            style={{ fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.6)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedMeks.length === 0 || isSubmitting}
            className="px-6 py-2 rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              fontFamily: 'Inter, sans-serif',
              background: selectedMeks.length === 0 || isSubmitting
                ? 'rgba(255,255,255,0.1)'
                : 'linear-gradient(135deg, #22d3ee, #06b6d4)',
              color: selectedMeks.length === 0 || isSubmitting
                ? 'rgba(255,255,255,0.3)'
                : 'black',
              cursor: selectedMeks.length === 0 || isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: selectedMeks.length > 0 && !isSubmitting
                ? '0 0 30px rgba(34, 211, 238, 0.3)'
                : 'none',
            }}
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
