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

const variationTypeColors: Record<string, { bg: string; border: string; text: string }> = {
  head: { bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.3)", text: "#60a5fa" },
  body: { bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.3)", text: "#4ade80" },
  trait: { bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.3)", text: "#c084fc" },
};

export default function CreateListingLightbox({
  stakeAddress,
  onClose,
  onSuccess,
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

  // Get user's Meks
  const userMeks = useQuery(api.meks.getMeksByOwner, { stakeAddress });

  const createListing = useMutation(api.tradeFloor.createListing);

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
      alert(error.message || "Failed to create listing");
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
              Create Trade Listing
            </h2>
            <p
              className="text-sm"
              style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
            >
              {step === "select-mek"
                ? "Step 1: Select a Mek to list for trade"
                : "Step 2: Choose up to 6 variations you want"}
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

        {/* Step 1: Select Mek */}
        {step === "select-mek" && (
          <div className="flex-1 overflow-y-auto p-6">
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
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {userMeks.map((mek: any) => (
                  <button
                    key={mek.assetId}
                    onClick={() => {
                      setSelectedMek(mek);
                      setStep("select-variations");
                    }}
                    className="p-2 rounded-lg transition-all hover:scale-[1.05] active:scale-[0.95] group"
                    style={{
                      background: selectedMek?.assetId === mek.assetId
                        ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.2), rgba(34, 211, 238, 0.1))'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                      border: selectedMek?.assetId === mek.assetId
                        ? '1px solid rgba(34, 211, 238, 0.5)'
                        : '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <img
                      src={getMekImagePath(mek)}
                      alt={mek.assetName}
                      className="w-full aspect-square object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getMediaUrl("/mek-images/placeholder.webp");
                      }}
                    />
                    <div
                      className="text-xs truncate mt-1 text-center"
                      style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.6)' }}
                    >
                      {mek.assetName}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Variations */}
        {step === "select-variations" && selectedMek && (
          <div className="flex-1 overflow-y-auto p-6">
            {/* Selected Mek Preview */}
            <div
              className="flex items-center gap-4 mb-6 p-4 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {/* Clickable Mek Thumbnail */}
              <button
                onClick={() => setShowMekDetail(true)}
                className="relative group cursor-pointer transition-transform hover:scale-105"
                title="Click to view details"
              >
                <img
                  src={getMekImagePath(selectedMek)}
                  alt={selectedMek.assetName}
                  className="w-20 h-20 object-contain"
                />
                {/* Hover overlay */}
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                  style={{ background: 'rgba(34, 211, 238, 0.2)' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                    <path d="M11 8v6M8 11h6"/>
                  </svg>
                </div>
              </button>
              <div className="flex-1">
                <div
                  className="text-white font-medium"
                  style={{ fontFamily: 'Saira, sans-serif' }}
                >
                  {selectedMek.assetName}
                </div>
                <div
                  className="text-sm mt-0.5 flex gap-3"
                  style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
                >
                  <span>Mek #{getMekNumber(selectedMek.assetName)}</span>
                  {selectedMek.rank && (
                    <span>Rank: {selectedMek.rank}</span>
                  )}
                </div>
                <button
                  onClick={() => setStep("select-mek")}
                  className="text-sm mt-1 transition-colors hover:underline"
                  style={{ fontFamily: 'Play, sans-serif', color: '#22d3ee' }}
                >
                  Change Mek
                </button>
              </div>
            </div>

            {/* Selected Variations */}
            <div className="mb-6">
              <div
                className="text-sm mb-2"
                style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
              >
                Selected Variations ({selectedVariations.length}/6):
              </div>
              {selectedVariations.length === 0 ? (
                <div
                  className="text-sm"
                  style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.4)' }}
                >
                  Select at least one variation you want in exchange
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedVariations.map((v, i) => {
                    const colors = variationTypeColors[v.variationType];
                    return (
                      <span
                        key={i}
                        className="px-3 py-1.5 text-sm rounded flex items-center gap-2"
                        style={{
                          background: colors.bg,
                          border: `1px solid ${colors.border}`,
                          color: colors.text,
                          fontFamily: 'Play, sans-serif',
                        }}
                      >
                        <span style={{ opacity: 0.6 }}>{v.variationType[0].toUpperCase()}</span>
                        {v.variationName}
                        <button onClick={() => handleRemoveVariation(i)} className="hover:opacity-70">
                          &times;
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Variation Picker */}
            <div className="space-y-4">
              <div className="flex gap-4">
                {/* Type Filter */}
                <div
                  className="flex gap-1 p-1 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  {(["all", "head", "body", "trait"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className="px-3 py-1.5 text-sm rounded transition-all"
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
                  className="flex-1 px-4 py-2 rounded-lg text-white placeholder-white/40 focus:outline-none"
                  style={{
                    fontFamily: 'Play, sans-serif',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>

              {/* Variation Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto relative">
                {filteredVariations.map((v) => {
                  const colors = variationTypeColors[v.type as "head" | "body" | "trait"];
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleSelectVariation(v)}
                      disabled={selectedVariations.length >= 6}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredVariation({
                          variation: v,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setHoveredVariation(null)}
                      className="px-3 py-2 text-sm rounded text-left transition-all hover:scale-[1.02]"
                      style={{
                        background: colors.bg,
                        border: `1px solid ${colors.border}`,
                        color: colors.text,
                        fontFamily: 'Play, sans-serif',
                        opacity: selectedVariations.length >= 6 ? 0.5 : 1,
                        cursor: selectedVariations.length >= 6 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span>
                          <span style={{ opacity: 0.6, marginRight: '4px' }}>{v.type[0].toUpperCase()}</span>
                          {v.name}
                        </span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            background: 'rgba(0,0,0,0.2)',
                            opacity: 0.7,
                          }}
                          title={`Rank ${v.rank} of 291`}
                        >
                          #{v.rank}
                        </span>
                      </div>
                    </button>
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

        {/* Variation Hover Tooltip with Image Preview */}
        {hoveredVariation && (
          <div
            className="fixed z-[10001] pointer-events-none"
            style={{
              left: hoveredVariation.x,
              top: hoveredVariation.y - 10,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div
              className="p-3 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(30,30,40,0.95), rgba(20,20,30,0.95))',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              }}
            >
              <img
                src="/variation-images-art-400px/ae1-gn3-ev1.png"
                alt={hoveredVariation.variation.name}
                className="w-32 h-32 object-contain mb-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div
                className="text-sm font-medium text-center"
                style={{ fontFamily: 'Saira, sans-serif', color: '#22d3ee' }}
              >
                {hoveredVariation.variation.name}
              </div>
              <div
                className="text-xs text-center mt-1"
                style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
              >
                {hoveredVariation.variation.type.charAt(0).toUpperCase() + hoveredVariation.variation.type.slice(1)} | Rank #{hoveredVariation.variation.rank}
              </div>
              <div
                className="text-xs text-center"
                style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.4)' }}
              >
                {hoveredVariation.variation.count} exist ({hoveredVariation.variation.percentage}%)
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
                  <span>Mek #{getMekNumber(selectedMek.assetName)}</span>
                  {selectedMek.rank && <span>Rank: {selectedMek.rank}</span>}
                </div>

                {/* Variations if available */}
                {selectedMek.variations && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div
                      className="text-xs uppercase tracking-wider mb-2"
                      style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.4)' }}
                    >
                      Variations
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {Object.entries(selectedMek.variations || {}).map(([key, value]) => (
                        <span
                          key={key}
                          className="px-2 py-1 text-xs rounded"
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.7)',
                            fontFamily: 'Play, sans-serif',
                          }}
                        >
                          {String(value)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
