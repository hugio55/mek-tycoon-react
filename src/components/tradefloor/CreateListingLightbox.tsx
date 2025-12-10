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

    return filtered.slice(0, 50); // Limit for performance
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

  // Clean source key for image
  const getMekImagePath = (mek: any) => {
    const cleanKey = (mek.sourceKey || mek.sourceKeyBase || "")
      .replace(/-[A-Z]$/i, "")
      .toLowerCase();
    return cleanKey ? `/mek-images/150px/${cleanKey}.webp` : "/mek-images/placeholder.webp";
  };

  const variationTypeColors = {
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
        className="relative bg-gray-900 border border-yellow-500/30 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-black/30">
          <div>
            <h2 className="text-xl font-bold text-yellow-400">Create Trade Listing</h2>
            <p className="text-sm text-gray-400">
              {step === "select-mek"
                ? "Step 1: Select a Mek to list for trade"
                : "Step 2: Choose up to 6 variations you want"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-light"
          >
            &times;
          </button>
        </div>

        {/* Step 1: Select Mek */}
        {step === "select-mek" && (
          <div className="flex-1 overflow-y-auto p-6">
            {userMeks === undefined ? (
              <div className="text-center py-12 text-gray-400">Loading your Meks...</div>
            ) : userMeks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Meks Found</h3>
                <p className="text-gray-500">You need to own Meks to create a listing</p>
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
                    className={`p-2 rounded-lg border transition-all ${
                      selectedMek?.assetId === mek.assetId
                        ? "border-yellow-500 bg-yellow-500/10"
                        : "border-gray-700 hover:border-gray-500 bg-gray-800/50"
                    }`}
                  >
                    <img
                      src={getMekImagePath(mek)}
                      alt={mek.assetName}
                      className="w-full aspect-square object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/mek-images/placeholder.webp";
                      }}
                    />
                    <div className="text-xs text-gray-400 truncate mt-1 text-center">
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
            <div className="flex items-center gap-4 mb-6 p-4 bg-black/30 rounded-lg border border-gray-800">
              <img
                src={getMekImagePath(selectedMek)}
                alt={selectedMek.assetName}
                className="w-20 h-20 object-contain"
              />
              <div>
                <div className="text-white font-medium">{selectedMek.assetName}</div>
                <button
                  onClick={() => setStep("select-mek")}
                  className="text-sm text-yellow-400 hover:text-yellow-300"
                >
                  Change Mek
                </button>
              </div>
            </div>

            {/* Selected Variations */}
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-2">
                Selected Variations ({selectedVariations.length}/6):
              </div>
              {selectedVariations.length === 0 ? (
                <div className="text-gray-500 text-sm">
                  Select at least one variation you want in exchange
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedVariations.map((v, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1.5 text-sm rounded border flex items-center gap-2 ${variationTypeColors[v.variationType]}`}
                    >
                      <span className="opacity-60">{v.variationType[0].toUpperCase()}</span>
                      {v.variationName}
                      <button
                        onClick={() => handleRemoveVariation(i)}
                        className="hover:text-white"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Variation Picker */}
            <div className="space-y-4">
              <div className="flex gap-4">
                {/* Type Filter */}
                <div className="flex gap-1 bg-gray-800/50 rounded p-1">
                  {(["all", "head", "body", "trait"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`px-3 py-1.5 text-sm rounded transition-all ${
                        typeFilter === type
                          ? "bg-yellow-500 text-black"
                          : "text-gray-400 hover:text-white"
                      }`}
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
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                />
              </div>

              {/* Variation Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {filteredVariations.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVariation(v)}
                    disabled={selectedVariations.length >= 6}
                    className={`px-3 py-2 text-sm rounded border text-left transition-all ${
                      selectedVariations.length >= 6
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-gray-700/50"
                    } ${variationTypeColors[v.type as "head" | "body" | "trait"]}`}
                  >
                    <span className="opacity-60 mr-1">{v.type[0].toUpperCase()}</span>
                    {v.name}
                    <span className="text-xs opacity-50 ml-1">({v.count})</span>
                  </button>
                ))}
              </div>

              {filteredVariations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No variations found matching your search
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3 bg-black/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-all"
          >
            Cancel
          </button>
          {step === "select-variations" && (
            <button
              onClick={handleSubmit}
              disabled={selectedVariations.length === 0 || isSubmitting}
              className={`px-6 py-2 rounded font-medium transition-all ${
                selectedVariations.length === 0 || isSubmitting
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-yellow-500 hover:bg-yellow-400 text-black"
              }`}
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
