"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COMPLETE_VARIATION_RARITY } from "@/lib/completeVariationRarity";
import { getMediaUrl } from "@/lib/media-url";

interface CreateListingLightboxProps {
  stakeAddress: string;
  onClose: () => void;
  onSuccess?: () => void;
  onViewListing?: (mekAssetId: string) => void;
}

type Step = "select-mek" | "select-variations";

interface SelectedVariation {
  variationName: string;
  variationType: "head" | "body" | "trait";
  variationId: number;
}

// Helper to extract Mek number from asset name (e.g., "Mekanism #1234" -> "1234")
const getMekNumber = (assetName: string): string => {
  const match = assetName?.match(/#(\d+)/);
  return match ? match[1] : "???";
};

// Helper to get rarity rank (1-291, with 1 being most rare)
const getVariationRank = (variationName: string): number => {
  const variation = COMPLETE_VARIATION_RARITY.find(
    (v) => v.name.toLowerCase() === variationName.toLowerCase()
  );
  return variation?.rank || 999;
};

// Helper to look up variation by sourceKey code
const getVariationBySourceKey = (code: string, type: "head" | "body" | "trait") => {
  return COMPLETE_VARIATION_RARITY.find(
    (v) => v.sourceKey === code.toUpperCase() && v.type === type
  );
};

// Helper to calculate overall Mek rank from sourceKey (average of 3 variation ranks)
const getMekRank = (sourceKey: string): number | null => {
  if (!sourceKey) return null;
  const cleanKey = sourceKey.replace(/-[A-Z]$/i, "").toUpperCase();
  const parts = cleanKey.split("-");
  if (parts.length !== 3) return null;

  const [headCode, bodyCode, traitCode] = parts;
  const head = getVariationBySourceKey(headCode, "head");
  const body = getVariationBySourceKey(bodyCode, "body");
  const trait = getVariationBySourceKey(traitCode, "trait");

  if (!head || !body || !trait) return null;
  return Math.round((head.rank + body.rank + trait.rank) / 3);
};

// Helper to get all three variations from a Mek's sourceKey
const getMekVariations = (sourceKey: string) => {
  if (!sourceKey) return null;
  const cleanKey = sourceKey.replace(/-[A-Z]$/i, "").toUpperCase();
  const parts = cleanKey.split("-");

  console.log("[🔍TRADE] getMekVariations debug:", {
    originalSourceKey: sourceKey,
    cleanKey,
    parts,
    partsLength: parts.length,
  });

  if (parts.length !== 3) return null;

  const [headCode, bodyCode, traitCode] = parts;
  const head = getVariationBySourceKey(headCode, "head");
  const body = getVariationBySourceKey(bodyCode, "body");
  const trait = getVariationBySourceKey(traitCode, "trait");

  console.log("[🔍TRADE] Variation lookups:", {
    headCode, headFound: !!head, headName: head?.name,
    bodyCode, bodyFound: !!body, bodyName: body?.name,
    traitCode, traitFound: !!trait, traitName: trait?.name,
  });

  return { head, body, trait };
};

const variationTypeColors: Record<string, { bg: string; border: string; text: string }> = {
  head: { bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.3)", text: "#60a5fa" },
  body: { bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.3)", text: "#4ade80" },
  trait: { bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.3)", text: "#c084fc" },
};

export default function CreateListingLightbox({
  stakeAddress,
  onClose,
  onSuccess,
  onViewListing,
}: CreateListingLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("select-mek");
  const [selectedMek, setSelectedMek] = useState<any>(null);
  const [selectedVariations, setSelectedVariations] = useState<SelectedVariation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "head" | "body" | "trait">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMekDetail, setShowMekDetail] = useState(false);
  const [hoveredVariation, setHoveredVariation] = useState<{
    variation: typeof COMPLETE_VARIATION_RARITY[0];
    x: number;
    y: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mekSearchTerm, setMekSearchTerm] = useState("");
  const [mekPage, setMekPage] = useState(0);
  const [limitTooltip, setLimitTooltip] = useState<{ x: number; y: number } | null>(null);
  const [hoveredListedMek, setHoveredListedMek] = useState<string | null>(null);
  const MEKS_PER_PAGE = 24;

  // Get user's Meks
  const userMeks = useQuery(api.meks.getMeksByOwner, { stakeAddress });

  // Get user's active listings to know which Meks are already listed
  const myListings = useQuery(api.tradeFloor.getMyListings, { stakeAddress });

  const createListing = useMutation(api.tradeFloor.createListing);

  // Set of already-listed Mek asset IDs
  const listedMekIds = useMemo(() => {
    if (!myListings) return new Set<string>();
    return new Set(myListings.map((l: any) => l.listedMekAssetId));
  }, [myListings]);

  // Helper to get variation names from sourceKey for search
  const getMekVariationNames = (sourceKey: string): string[] => {
    if (!sourceKey) return [];
    const cleanKey = sourceKey.replace(/-[A-Z]$/i, "").toUpperCase();
    const parts = cleanKey.split("-");
    if (parts.length !== 3) return [];

    const names: string[] = [];
    parts.forEach(code => {
      const variation = COMPLETE_VARIATION_RARITY.find(v => v.sourceKey === code);
      if (variation) names.push(variation.name.toLowerCase());
    });
    return names;
  };

  // Process, sort, filter, and paginate Meks
  const { displayedMeks, totalPages, totalMeks } = useMemo(() => {
    if (!userMeks) return { displayedMeks: [], totalPages: 0, totalMeks: 0 };

    let meks = [...userMeks];

    // Filter by search term (Mek number or variation name)
    if (mekSearchTerm.trim()) {
      const term = mekSearchTerm.toLowerCase().trim();
      meks = meks.filter((mek: any) => {
        // Check Mek number
        const mekNumber = getMekNumber(mek.assetName).toLowerCase();
        if (mekNumber.includes(term)) return true;

        // Check variation names
        const variationNames = getMekVariationNames(mek.sourceKey || mek.sourceKeyBase || "");
        return variationNames.some(name => name.includes(term));
      });
    }

    // Sort: already-listed Meks first, then by Mek number
    meks.sort((a: any, b: any) => {
      const aListed = listedMekIds.has(a.assetId);
      const bListed = listedMekIds.has(b.assetId);
      if (aListed && !bListed) return -1;
      if (!aListed && bListed) return 1;
      // Secondary sort by Mek number
      const aNum = parseInt(getMekNumber(a.assetName)) || 0;
      const bNum = parseInt(getMekNumber(b.assetName)) || 0;
      return aNum - bNum;
    });

    const totalMeks = meks.length;
    const totalPages = Math.ceil(totalMeks / MEKS_PER_PAGE);
    const start = mekPage * MEKS_PER_PAGE;
    const displayedMeks = meks.slice(start, start + MEKS_PER_PAGE);

    return { displayedMeks, totalPages, totalMeks };
  }, [userMeks, mekSearchTerm, listedMekIds, mekPage]);

  // Reset page when search changes
  useEffect(() => {
    setMekPage(0);
  }, [mekSearchTerm]);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Filter variations for picker - sorted by rarity (least rare to most rare = high rank to low rank)
  const filteredVariations = useMemo(() => {
    let filtered = [...COMPLETE_VARIATION_RARITY];

    if (typeFilter !== "all") {
      filtered = filtered.filter((v) => v.type === typeFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((v) => v.name.toLowerCase().includes(term));
    }

    // Exclude already selected
    const selectedNames = selectedVariations.map((v) => v.variationName.toLowerCase());
    filtered = filtered.filter((v) => !selectedNames.includes(v.name.toLowerCase()));

    // Sort by rank descending (high rank = common first, low rank = rare last)
    filtered.sort((a, b) => b.rank - a.rank);

    return filtered.slice(0, 50);
  }, [typeFilter, searchTerm, selectedVariations]);

  const handleSelectVariation = (variation: typeof COMPLETE_VARIATION_RARITY[0]) => {
    if (selectedVariations.length >= 6) return;
    setSelectedVariations([
      ...selectedVariations,
      {
        variationName: variation.name,
        variationType: variation.type as "head" | "body" | "trait",
        variationId: variation.id,
      },
    ]);
    setSearchTerm("");
  };

  const handleRemoveVariation = (index: number) => {
    setSelectedVariations(selectedVariations.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedMek || selectedVariations.length === 0) return;

    setIsSubmitting(true);
    try {
      await createListing({
        ownerStakeAddress: stakeAddress,
        mekAssetId: selectedMek.assetId,
        desiredVariations: selectedVariations,
      });
      // Call onSuccess if provided (to navigate to My Listings tab)
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to create listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  const getMekImagePath = (mek: any) => {
    const cleanKey = (mek.sourceKey || mek.sourceKeyBase || "")
      .replace(/-[A-Z]$/i, "")
      .toLowerCase();
    return cleanKey ? getMediaUrl(`/mek-images/150px/${cleanKey}.webp`) : getMediaUrl("/mek-images/placeholder.webp");
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Cyan flash animation for new selections */}
      <style>{`
        @keyframes cyanFlash {
          0% {
            box-shadow: 0 0 30px rgba(34, 211, 238, 0.8), 0 0 60px rgba(34, 211, 238, 0.4), inset 0 0 20px rgba(34, 211, 238, 0.3);
            border-color: rgba(34, 211, 238, 0.8);
            transform: scale(1.1);
          }
          50% {
            box-shadow: 0 0 20px rgba(34, 211, 238, 0.5), 0 0 40px rgba(34, 211, 238, 0.2);
            border-color: rgba(34, 211, 238, 0.5);
            transform: scale(1.02);
          }
          100% {
            box-shadow: 0 0 10px rgba(34, 211, 238, 0.2);
            border-color: rgba(34, 211, 238, 0.3);
            transform: scale(1);
          }
        }
      `}</style>
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
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl"
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
          className="px-6 py-3 flex justify-between items-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div className="flex items-center gap-4">
            {step === "select-variations" && selectedMek && (
              <>
                <button
                  onClick={() => setShowMekDetail(true)}
                  className="relative group cursor-pointer transition-transform hover:scale-105"
                  title="Click to view details"
                >
                  <img
                    src={getMekImagePath(selectedMek)}
                    alt={selectedMek.assetName}
                    className="w-12 h-12 object-contain"
                  />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2
                      className="text-lg font-bold text-white"
                      style={{ fontFamily: 'Orbitron, sans-serif' }}
                    >
                      {selectedMek.assetName}
                    </h2>
                    <button
                      onClick={() => setStep("select-mek")}
                      className="text-xs px-2 py-0.5 rounded transition-colors"
                      style={{ fontFamily: 'Play, sans-serif', color: '#22d3ee', background: 'rgba(34, 211, 238, 0.1)' }}
                    >
                      Change
                    </button>
                  </div>
                  <p
                    className="text-sm"
                    style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
                  >
                    Select variations you want in exchange
                  </p>
                </div>
              </>
            )}
            {step === "select-mek" && (
              <div>
                <h2
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  Create Trade Listing
                </h2>
                <p
                  className="text-sm"
                  style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
                >
                  Select a Mek to list for trade
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white/80 text-2xl font-light transition-colors"
            style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            &times;
          </button>
        </div>

        {/* Step 1: Select Mek */}
        {step === "select-mek" && (
          <div className="flex-1 overflow-hidden flex flex-col p-6">
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={mekSearchTerm}
                  onChange={(e) => setMekSearchTerm(e.target.value)}
                  placeholder="Search by Mek # or variation name..."
                  className="w-full px-4 py-2.5 pl-10 rounded-lg text-white placeholder-white/40 focus:outline-none"
                  style={{
                    fontFamily: 'Play, sans-serif',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                {mekSearchTerm && (
                  <button
                    onClick={() => setMekSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  >
                    &times;
                  </button>
                )}
              </div>
              {mekSearchTerm && (
                <div
                  className="mt-2 text-xs"
                  style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.4)' }}
                >
                  Found {totalMeks} Mek{totalMeks !== 1 ? 's' : ''} matching "{mekSearchTerm}"
                </div>
              )}
            </div>

            {userMeks === undefined ? (
              <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Loading your Meks...
              </div>
            ) : userMeks.length === 0 ? (
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
                  No Meks Found
                </h3>
                <p style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}>
                  You need to own Meks to create a listing
                </p>
              </div>
            ) : (
              <>
                {/* Mek Grid - Fixed height container */}
                <div className="flex-1 overflow-y-auto" style={{ minHeight: '400px' }}>
                  {displayedMeks.length === 0 ? (
                    <div
                      className="flex items-center justify-center h-full rounded-xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                        border: '1px solid rgba(255,255,255,0.1)',
                        minHeight: '400px',
                      }}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">🔍</div>
                        <p style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}>
                          No Meks match your search
                        </p>
                      </div>
                    </div>
                  ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {displayedMeks.map((mek: any) => {
                      const isListed = listedMekIds.has(mek.assetId);
                      return (
                        <div
                          key={mek.assetId}
                          className="relative"
                          onMouseEnter={() => isListed && setHoveredListedMek(mek.assetId)}
                          onMouseLeave={() => setHoveredListedMek(null)}
                        >
                          <button
                            onClick={() => {
                              if (!isListed) {
                                setSelectedMek(mek);
                                setStep("select-variations");
                              }
                            }}
                            disabled={isListed}
                            className={`w-full p-2 rounded-lg transition-all ${
                              isListed
                                ? 'cursor-not-allowed'
                                : 'hover:scale-[1.05] active:scale-[0.95]'
                            } group`}
                            style={{
                              background: isListed
                                ? 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))'
                                : selectedMek?.assetId === mek.assetId
                                  ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.2), rgba(34, 211, 238, 0.1))'
                                  : 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                              border: isListed
                                ? '1px solid rgba(255,255,255,0.05)'
                                : selectedMek?.assetId === mek.assetId
                                  ? '1px solid rgba(34, 211, 238, 0.5)'
                                  : '1px solid rgba(255,255,255,0.1)',
                              opacity: isListed ? 0.5 : 1,
                            }}
                          >
                            <img
                              src={getMekImagePath(mek)}
                              alt={mek.assetName}
                              className="w-full aspect-square object-contain"
                              style={{ filter: isListed ? 'grayscale(80%)' : 'none' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = getMediaUrl("/mek-images/placeholder.webp");
                              }}
                            />
                            <div
                              className="text-xs truncate mt-1 text-center"
                              style={{
                                fontFamily: 'Play, sans-serif',
                                color: isListed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)',
                              }}
                            >
                              {mek.assetName}
                            </div>
                          </button>

                          {/* Already Listed Badge */}
                          {isListed && (
                            <div
                              className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider"
                              style={{
                                fontFamily: 'Play, sans-serif',
                                background: 'rgba(251, 191, 36, 0.2)',
                                border: '1px solid rgba(251, 191, 36, 0.3)',
                                color: '#fbbf24',
                              }}
                            >
                              Listed
                            </div>
                          )}

                          {/* Hover overlay with View Listing button for listed Meks */}
                          {isListed && hoveredListedMek === mek.assetId && (
                            <div
                              className="absolute inset-0 flex items-center justify-center rounded-lg z-40"
                              style={{
                                background: 'rgba(0,0,0,0.7)',
                              }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onViewListing) {
                                    onViewListing(mek.assetId);
                                    onClose();
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95"
                                style={{
                                  fontFamily: 'Play, sans-serif',
                                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1))',
                                  border: '1px solid rgba(251, 191, 36, 0.4)',
                                  color: '#fbbf24',
                                }}
                              >
                                View Listing
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div
                    className="flex items-center justify-center gap-4 pt-4 mt-4"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <button
                      onClick={() => setMekPage(Math.max(0, mekPage - 1))}
                      disabled={mekPage === 0}
                      className="px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        fontFamily: 'Play, sans-serif',
                        background: mekPage === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: mekPage === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                        cursor: mekPage === 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      ← Prev
                    </button>
                    <span
                      className="text-sm"
                      style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
                    >
                      Page <span style={{ color: '#22d3ee' }}>{mekPage + 1}</span> of {totalPages}
                    </span>
                    <button
                      onClick={() => setMekPage(Math.min(totalPages - 1, mekPage + 1))}
                      disabled={mekPage >= totalPages - 1}
                      className="px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        fontFamily: 'Play, sans-serif',
                        background: mekPage >= totalPages - 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: mekPage >= totalPages - 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                        cursor: mekPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2: Select Variations */}
        {step === "select-variations" && selectedMek && (
          <div className="flex-1 overflow-hidden flex flex-col p-4">
            {/* Selected Variations - 6 Slots */}
            <div className="flex items-center gap-2 mb-3">
              {Array.from({ length: 6 }).map((_, slotIndex) => {
                const variation = selectedVariations[slotIndex];
                if (variation) {
                  const sampleImages = [
                    '/variation-images-art-400px/webp-uniform/checkers-1.webp',
                    '/variation-images-art-400px/webp-uniform/shark-1.webp',
                    '/variation-images-art-400px/webp-uniform/flash-1.webp',
                  ];
                  const imageIndex = (variation.variationId || slotIndex) % 3;
                  const imageSrc = sampleImages[imageIndex];
                  return (
                    <button
                      key={`filled-${slotIndex}-${variation.variationName}`}
                      onClick={() => handleRemoveVariation(slotIndex)}
                      className="relative group w-12 h-12 rounded-lg overflow-hidden transition-all hover:scale-105"
                      style={{
                        background: 'rgba(34, 211, 238, 0.1)',
                        border: '1px solid rgba(34, 211, 238, 0.4)',
                        boxShadow: '0 0 12px rgba(34, 211, 238, 0.25)',
                        animation: 'cyanFlash 1.5s ease-out',
                      }}
                      title={`Remove ${variation.variationName}`}
                    >
                      <img
                        src={imageSrc}
                        alt={variation.variationName}
                        className="w-full h-full object-contain transition-all group-hover:opacity-30 group-hover:scale-90"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </div>
                    </button>
                  );
                }
                return (
                  <div
                    key={`empty-${slotIndex}`}
                    className="w-12 h-12 rounded-lg"
                    style={{
                      border: '2px dashed rgba(255, 255, 255, 0.15)',
                      background: 'rgba(255, 255, 255, 0.02)',
                    }}
                  />
                );
              })}
            </div>

            {/* Search and Filter Row */}
            <div className="flex gap-3 mb-3">
              {/* Type Filter */}
              <div
                className="flex gap-1 p-1 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                {(["all", "head", "body", "trait"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className="px-2 py-1 text-xs rounded transition-all"
                    style={{
                      fontFamily: 'Play, sans-serif',
                      background: typeFilter === type
                        ? 'linear-gradient(135deg, #22d3ee, #06b6d4)'
                        : 'transparent',
                      color: typeFilter === type ? 'black' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {/* Search */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search variations..."
                className="flex-1 px-3 py-1.5 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none"
                style={{
                  fontFamily: 'Play, sans-serif',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              />
            </div>

            {/* Variation Grid - Takes remaining space */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 content-start">
                {filteredVariations.map((v) => {
                  const colors = variationTypeColors[v.type as "head" | "body" | "trait"];
                  const isAtLimit = selectedVariations.length >= 6;
                  // Randomly assign one of 3 sample images based on variation id
                  const sampleImages = [
                    '/variation-images-art-400px/webp-uniform/checkers-1.webp',
                    '/variation-images-art-400px/webp-uniform/shark-1.webp',
                    '/variation-images-art-400px/webp-uniform/flash-1.webp',
                  ];
                  const imageIndex = v.id % 3;
                  const imageSrc = sampleImages[imageIndex];
                  return (
                    <div
                      key={v.id}
                      onMouseEnter={() => {
                        if (isAtLimit) {
                          setHoveredVariation(null);
                        }
                      }}
                      onMouseMove={(e) => {
                        if (isAtLimit) {
                          setLimitTooltip({ x: e.clientX, y: e.clientY - 10 });
                          setHoveredVariation(null);
                        } else {
                          setHoveredVariation({
                            variation: v,
                            x: e.clientX,
                            y: e.clientY - 10,
                          });
                          setLimitTooltip(null);
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredVariation(null);
                        setLimitTooltip(null);
                      }}
                    >
                      <button
                        onClick={() => handleSelectVariation(v)}
                        disabled={isAtLimit}
                        className="relative w-full aspect-square transition-all hover:scale-110 hover:brightness-125 hover:z-10"
                        style={{
                          opacity: isAtLimit ? 0.5 : 1,
                          cursor: isAtLimit ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <img
                          src={imageSrc}
                          alt={v.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              {filteredVariations.length === 0 && (
                <div
                  className="text-center py-8"
                  style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.4)' }}
                >
                  No variations found matching your search
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="px-6 py-4 flex justify-center gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-white/60 transition-all duration-200 hover:text-white hover:scale-105"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Cancel
          </button>
          {step === "select-variations" && (
            <button
              onClick={handleSubmit}
              disabled={selectedVariations.length === 0 || isSubmitting}
              className="px-6 py-2 rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                fontFamily: 'Inter, sans-serif',
                background: selectedVariations.length === 0 || isSubmitting
                  ? 'rgba(255,255,255,0.1)'
                  : 'linear-gradient(135deg, #22d3ee, #06b6d4)',
                color: selectedVariations.length === 0 || isSubmitting
                  ? 'rgba(255,255,255,0.3)'
                  : 'black',
                cursor: selectedVariations.length === 0 || isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: selectedVariations.length > 0 && !isSubmitting
                  ? '0 0 30px rgba(34, 211, 238, 0.3)'
                  : 'none',
              }}
            >
              {isSubmitting ? "Creating..." : "Create Listing"}
            </button>
          )}
        </div>

        {/* Variation Hover Tooltip - Text only */}
        {mounted && hoveredVariation && createPortal(
          <div
            className="fixed z-[99999] pointer-events-none"
            style={{
              left: hoveredVariation.x,
              top: hoveredVariation.y - 10,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div
              className="px-3 py-2 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(30,30,40,0.95), rgba(20,20,30,0.95))',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              }}
            >
              <div
                className="text-sm font-medium text-center"
                style={{ fontFamily: 'Saira, sans-serif', color: '#22d3ee' }}
              >
                {hoveredVariation.variation.name}
              </div>
              <div
                className="text-xs text-center"
                style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
              >
                {hoveredVariation.variation.type.charAt(0).toUpperCase() + hoveredVariation.variation.type.slice(1)}
              </div>
              <div
                className="text-xs text-center mt-1"
                style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.4)' }}
              >
                Rank #{hoveredVariation.variation.rank} · {hoveredVariation.variation.count} exist
              </div>
            </div>
            {/* Arrow pointing down */}
            <div
              className="w-0 h-0 mx-auto"
              style={{
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid rgba(30,30,40,0.95)',
              }}
            />
          </div>,
          document.body
        )}

        {/* Error Lightbox */}
        {errorMessage && (
          <div
            className="absolute inset-0 z-[10001] flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              setErrorMessage(null);
            }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0"
              style={{
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            />

            {/* Error content */}
            <div
              className="relative z-10 p-6 rounded-2xl max-w-sm mx-4 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(30,30,40,0.98), rgba(20,20,30,0.98))',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(239, 68, 68, 0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Error Icon */}
              <div
                className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>

              {/* Title */}
              <h3
                className="text-lg font-semibold text-white mb-2"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                Unable to Create Listing
              </h3>

              {/* Message */}
              <p
                className="mb-6"
                style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.7)' }}
              >
                {errorMessage}
              </p>

              {/* OK Button */}
              <button
                onClick={() => setErrorMessage(null)}
                className="px-8 py-2.5 rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                }}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Mek Detail Lightbox (Nested - clicking outside only closes this, not parent) */}
        {showMekDetail && selectedMek && (
          <div
            className="absolute inset-0 z-[10000] flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              setShowMekDetail(false);
            }}
          >
            {/* Backdrop for nested lightbox */}
            <div
              className="absolute inset-0"
              style={{
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(5px)',
                WebkitBackdropFilter: 'blur(5px)',
              }}
            />

            {/* Detail content */}
            <div
              className="relative z-10 p-6 rounded-2xl max-w-md"
              style={{
                background: 'linear-gradient(135deg, rgba(30,30,40,0.98), rgba(20,20,30,0.98))',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowMekDetail(false)}
                className="absolute top-3 right-3 text-white/50 hover:text-white/80 text-xl transition-colors"
              >
                &times;
              </button>

              {/* Large Mek image */}
              <div className="flex justify-center mb-4">
                <img
                  src={getMekImagePath(selectedMek).replace('150px', '500px')}
                  alt={selectedMek.assetName}
                  className="w-64 h-64 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getMekImagePath(selectedMek);
                  }}
                />
              </div>

              {/* Mek Info */}
              <div className="text-center">
                <h3
                  className="text-xl font-bold text-white mb-2"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {selectedMek.assetName}
                </h3>
                <div
                  className="flex justify-center gap-4 text-sm"
                  style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.6)' }}
                >
                  <span>Mek <span style={{ color: '#22d3ee' }}>#{getMekNumber(selectedMek.assetName)}</span></span>
                  {(() => {
                    const rank = getMekRank(selectedMek.sourceKey || selectedMek.sourceKeyBase || "");
                    return rank ? (
                      <span>Rank <span style={{ color: '#fbbf24' }}>#{rank}</span></span>
                    ) : null;
                  })()}
                </div>

                {/* Variations parsed from sourceKey - always show head, body, trait in order */}
                {(() => {
                  const variations = getMekVariations(selectedMek.sourceKey || selectedMek.sourceKeyBase || "");
                  if (!variations) return null;

                  return (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex flex-col items-center gap-2">
                        {/* Head */}
                        {variations.head && (
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-0.5 rounded text-xs uppercase"
                              style={{
                                background: variationTypeColors.head.bg,
                                border: `1px solid ${variationTypeColors.head.border}`,
                                color: variationTypeColors.head.text,
                                fontFamily: 'Play, sans-serif',
                              }}
                            >
                              HEAD
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'Play, sans-serif', fontSize: '14px' }}>
                              {variations.head.name}
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Play, sans-serif', fontSize: '13px' }}>
                              ({variations.head.count} {variations.head.count === 1 ? 'copy' : 'copies'})
                            </span>
                          </div>
                        )}
                        {/* Body */}
                        {variations.body && (
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-0.5 rounded text-xs uppercase"
                              style={{
                                background: variationTypeColors.body.bg,
                                border: `1px solid ${variationTypeColors.body.border}`,
                                color: variationTypeColors.body.text,
                                fontFamily: 'Play, sans-serif',
                              }}
                            >
                              BODY
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'Play, sans-serif', fontSize: '14px' }}>
                              {variations.body.name}
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Play, sans-serif', fontSize: '13px' }}>
                              ({variations.body.count} {variations.body.count === 1 ? 'copy' : 'copies'})
                            </span>
                          </div>
                        )}
                        {/* Trait */}
                        {variations.trait && (
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-0.5 rounded text-xs uppercase"
                              style={{
                                background: variationTypeColors.trait.bg,
                                border: `1px solid ${variationTypeColors.trait.border}`,
                                color: variationTypeColors.trait.text,
                                fontFamily: 'Play, sans-serif',
                              }}
                            >
                              TRAIT
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'Play, sans-serif', fontSize: '14px' }}>
                              {variations.trait.name}
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Play, sans-serif', fontSize: '13px' }}>
                              ({variations.trait.count} {variations.trait.count === 1 ? 'copy' : 'copies'})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Limit Tooltip - Shows when 6 variations selected and hovering over another */}
        {limitTooltip && createPortal(
          <div
            className="fixed z-[99999] pointer-events-none"
            style={{
              left: limitTooltip.x,
              top: limitTooltip.y - 10,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div
              className="px-4 py-2.5 rounded-xl text-sm whitespace-nowrap"
              style={{
                background: 'linear-gradient(135deg, rgba(30, 35, 45, 0.98) 0%, rgba(40, 45, 55, 0.98) 50%, rgba(30, 35, 45, 0.98) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontFamily: "'Play', sans-serif",
                color: 'rgba(255, 255, 255, 0.9)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              }}
            >
              You have already applied six variations.
              <br />
              Please remove one to add another.
            </div>
            {/* Arrow */}
            <div
              className="mx-auto"
              style={{
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid rgba(35, 40, 50, 0.98)',
              }}
            />
          </div>,
          document.body
        )}
      </div>
    </div>,
    document.body
  );
}
