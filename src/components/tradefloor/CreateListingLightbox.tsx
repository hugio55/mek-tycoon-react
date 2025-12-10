"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COMPLETE_VARIATION_RARITY } from "@/lib/completeVariationRarity";

interface CreateListingLightboxProps {
  stakeAddress: string;
  onClose: () => void;
}

type Step = "select-mek" | "select-variations";

interface SelectedVariation {
  variationName: string;
  variationType: "head" | "body" | "trait";
  variationId: number;
}

const variationTypeColors: Record<string, { bg: string; border: string; text: string }> = {
  head: { bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.3)", text: "#60a5fa" },
  body: { bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.3)", text: "#4ade80" },
  trait: { bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.3)", text: "#c084fc" },
};

export default function CreateListingLightbox({
  stakeAddress,
  onClose,
}: CreateListingLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("select-mek");
  const [selectedMek, setSelectedMek] = useState<any>(null);
  const [selectedVariations, setSelectedVariations] = useState<SelectedVariation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "head" | "body" | "trait">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Filter variations for picker
  const filteredVariations = useMemo(() => {
    let filtered = COMPLETE_VARIATION_RARITY;

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
    return cleanKey ? `/mek-images/150px/${cleanKey}.webp` : "/mek-images/placeholder.webp";
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
                        (e.target as HTMLImageElement).src = "/mek-images/placeholder.webp";
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
              <img
                src={getMekImagePath(selectedMek)}
                alt={selectedMek.assetName}
                className="w-20 h-20 object-contain"
              />
              <div>
                <div
                  className="text-white font-medium"
                  style={{ fontFamily: 'Saira, sans-serif' }}
                >
                  {selectedMek.assetName}
                </div>
                <button
                  onClick={() => setStep("select-mek")}
                  className="text-sm transition-colors"
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {filteredVariations.map((v) => {
                  const colors = variationTypeColors[v.type as "head" | "body" | "trait"];
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleSelectVariation(v)}
                      disabled={selectedVariations.length >= 6}
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
                      <span style={{ opacity: 0.6, marginRight: '4px' }}>{v.type[0].toUpperCase()}</span>
                      {v.name}
                      <span style={{ opacity: 0.5, marginLeft: '4px', fontSize: '0.75rem' }}>({v.count})</span>
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
      </div>
    </div>,
    document.body
  );
}
