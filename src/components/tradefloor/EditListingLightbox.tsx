"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { COMPLETE_VARIATION_RARITY } from "@/lib/completeVariationRarity";
import { getMediaUrl } from "@/lib/media-url";

interface DesiredVariation {
  variationName: string;
  variationType: "head" | "body" | "trait";
  variationId?: number;
}

interface EditListingLightboxProps {
  listing: {
    _id: Id<"tradeListings">;
    ownerStakeAddress: string;
    listedMekAssetId: string;
    listedMekSourceKey?: string;
    listedMekAssetName?: string;
    desiredVariations: DesiredVariation[];
  };
  onClose: () => void;
}

const variationTypeColors: Record<string, { bg: string; border: string; text: string }> = {
  head: { bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.3)", text: "#60a5fa" },
  body: { bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.3)", text: "#4ade80" },
  trait: { bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.3)", text: "#c084fc" },
};

export default function EditListingLightbox({
  listing,
  onClose,
}: EditListingLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedVariations, setSelectedVariations] = useState<DesiredVariation[]>(
    listing.desiredVariations
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "head" | "body" | "trait">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [typeDropdownRect, setTypeDropdownRect] = useState<DOMRect | null>(null);
  const typeDropdownBtnRef = useRef<HTMLButtonElement>(null);
  const [limitTooltip, setLimitTooltip] = useState<{ x: number; y: number } | null>(null);
  const [hoveredVariation, setHoveredVariation] = useState<{
    variation: typeof COMPLETE_VARIATION_RARITY[0];
    x: number;
    y: number;
  } | null>(null);

  const updateListing = useMutation(api.tradeFloor.updateListingVariations);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Close type dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownOpen && typeDropdownBtnRef.current && !typeDropdownBtnRef.current.contains(event.target as Node)) {
        setTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [typeDropdownOpen]);

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
    if (selectedVariations.length === 0) return;

    setIsSubmitting(true);
    try {
      await updateListing({
        listingId: listing._id,
        ownerStakeAddress: listing.ownerStakeAddress,
        desiredVariations: selectedVariations,
      });
      onClose();
    } catch (error: any) {
      alert(error.message || "Failed to update listing");
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

  const hasChanges = JSON.stringify(selectedVariations) !== JSON.stringify(listing.desiredVariations);

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
        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header with Mek */}
        <div
          className="px-6 py-3 flex justify-between items-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div className="flex items-center gap-4">
            <img
              src={getMekImagePath(listing.listedMekSourceKey)}
              alt={listing.listedMekAssetName}
              className="w-12 h-12 object-contain"
            />
            <div>
              <h2
                className="text-lg font-bold text-white"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                {listing.listedMekAssetName}
              </h2>
              <p
                className="text-sm"
                style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
              >
                Select variations you want in exchange
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white/80 text-2xl font-light transition-colors"
            style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            &times;
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-4">
          {/* Compact Controls Row - Selected Variations as Images */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs whitespace-nowrap"
              style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.4)' }}
            >
              ({selectedVariations.length}/6)
            </span>
            {selectedVariations.map((v, i) => {
              const sampleImages = [
                '/variation-images-art-400px/webp-uniform/checkers-1.webp',
                '/variation-images-art-400px/webp-uniform/shark-1.webp',
                '/variation-images-art-400px/webp-uniform/flash-1.webp',
              ];
              const imageIndex = (v.variationId || i) % 3;
              const imageSrc = sampleImages[imageIndex];
              return (
                <button
                  key={`${v.variationName}-${i}`}
                  onClick={() => handleRemoveVariation(i)}
                  className="relative group w-12 h-12 rounded-lg overflow-hidden transition-all hover:scale-105"
                  style={{
                    background: 'rgba(34, 211, 238, 0.1)',
                    border: '1px solid rgba(34, 211, 238, 0.3)',
                    boxShadow: '0 0 10px rgba(34, 211, 238, 0.2)',
                    animation: 'cyanFlash 1.5s ease-out',
                  }}
                  title={`Remove ${v.variationName}`}
                >
                  <img
                    src={imageSrc}
                    alt={v.variationName}
                    className="w-full h-full object-contain transition-all group-hover:opacity-30 group-hover:scale-90"
                  />
                  {/* Hover overlay with X */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Search and Filter Row */}
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              placeholder="Search variations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg text-white placeholder-white/40"
              style={{
                fontFamily: 'Play, sans-serif',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                outline: 'none',
              }}
            />
            {/* Custom Type Dropdown (portal-based, matching sort dropdown style) */}
            <div className="relative">
              <button
                ref={typeDropdownBtnRef}
                onClick={() => {
                  if (!typeDropdownOpen && typeDropdownBtnRef.current) {
                    setTypeDropdownRect(typeDropdownBtnRef.current.getBoundingClientRect());
                  }
                  setTypeDropdownOpen(!typeDropdownOpen);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all min-w-[120px]"
                style={{
                  background: 'linear-gradient(105deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.10) 40%, rgba(255, 255, 255, 0.06) 100%)',
                  backdropFilter: 'blur(4px) brightness(1.25)',
                  WebkitBackdropFilter: 'blur(4px) brightness(1.25)',
                  border: typeDropdownOpen
                    ? '1px solid rgba(34,211,238,0.4)'
                    : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: typeDropdownOpen ? '8px 8px 0 0' : '8px',
                  color: 'rgba(255,255,255,0.8)',
                  fontFamily: "'Play', sans-serif",
                }}
              >
                <span>
                  {typeFilter === 'all' ? 'All Types' : typeFilter === 'head' ? 'Heads' : typeFilter === 'body' ? 'Bodies' : 'Traits'}
                </span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0 ${typeDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Floating Dropdown Menu - Rendered via Portal */}
              {mounted && typeDropdownOpen && typeDropdownRect && createPortal(
                <div
                  className="fixed"
                  style={{
                    zIndex: 99999,
                    top: typeDropdownRect.bottom,
                    left: typeDropdownRect.left,
                    width: typeDropdownRect.width,
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.08) 100%)',
                    backdropFilter: 'blur(8px) brightness(1.1)',
                    WebkitBackdropFilter: 'blur(8px) brightness(1.1)',
                    border: '1px solid rgba(34,211,238,0.4)',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}
                >
                  {[
                    { id: 'all' as const, name: 'All Types' },
                    { id: 'head' as const, name: 'Heads' },
                    { id: 'body' as const, name: 'Bodies' },
                    { id: 'trait' as const, name: 'Traits' },
                  ].map((option, index) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setTypeFilter(option.id);
                        setTypeDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm tracking-wide transition-all whitespace-nowrap hover:bg-white/10 hover:pl-4 hover:brightness-125"
                      style={{
                        background: typeFilter === option.id
                          ? 'rgba(34,211,238,0.25)'
                          : 'transparent',
                        color: typeFilter === option.id
                          ? '#22d3ee'
                          : 'rgba(255,255,255,0.8)',
                        fontFamily: "'Play', sans-serif",
                        borderBottom: index < 3
                          ? '1px solid rgba(255,255,255,0.1)'
                          : 'none',
                      }}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>,
                document.body
              )}
            </div>
          </div>

          {/* Variation Grid - Takes remaining space */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 content-start">
              {filteredVariations.map((v) => {
                const colors = variationTypeColors[v.type];
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
                No matching variations
              </div>
            )}
          </div>
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
            className="px-4 py-2 text-white/60 transition-all duration-200 hover:text-white hover:scale-105"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedVariations.length === 0 || isSubmitting || !hasChanges}
            className="px-6 py-2 rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              fontFamily: 'Inter, sans-serif',
              background: selectedVariations.length === 0 || isSubmitting || !hasChanges
                ? 'rgba(255,255,255,0.1)'
                : 'linear-gradient(135deg, #22d3ee, #06b6d4)',
              color: selectedVariations.length === 0 || isSubmitting || !hasChanges
                ? 'rgba(255,255,255,0.3)'
                : 'black',
              cursor: selectedVariations.length === 0 || isSubmitting || !hasChanges ? 'not-allowed' : 'pointer',
              boxShadow: selectedVariations.length > 0 && !isSubmitting && hasChanges
                ? '0 0 30px rgba(34, 211, 238, 0.3)'
                : 'none',
            }}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

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

      {/* Variation Hover Tooltip - Text only */}
      {hoveredVariation && createPortal(
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
          {/* Arrow */}
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
    </div>,
    document.body
  );
}
