'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useMemo } from "react";
import { COMPLETE_VARIATION_RARITY } from "@/lib/completeVariationRarity";

interface MekAsset {
  assetId: string;
  policyId: string;
  assetName: string;
  imageUrl?: string;
  goldPerHour: number;
  baseGoldPerHour?: number;
  levelBoostAmount?: number;
  currentLevel?: number;
  rarityRank?: number;
  mekNumber: number;
  headGroup?: string;
  bodyGroup?: string;
  itemGroup?: string;
  sourceKey?: string;
}

interface MeksTriangleLightboxProps {
  onClose: () => void;
  ownedMeks: MekAsset[];
}

export default function MeksTriangleLightbox({ onClose, ownedMeks }: MeksTriangleLightboxProps) {
  const triangleOverlayData = useQuery(api.overlays.getOverlay, { imageKey: "variation-triangle" });

  // Debug: Log overlay data
  useEffect(() => {
    console.log('🔺 [TRIANGLE QUERY] Result:', triangleOverlayData);
    if (triangleOverlayData === undefined) {
      console.log('🔺 [TRIANGLE] Data is UNDEFINED - query may still be loading');
    } else if (triangleOverlayData === null) {
      console.log('🔺 [TRIANGLE] Data is NULL - overlay not found in database!');
    } else {
      console.log('🔺 [TRIANGLE] Total zones:', triangleOverlayData.zones?.length || 0);
      const allSprites = triangleOverlayData.zones?.filter(zone => zone.mode === "sprite") || [];
      console.log('🔺 [TRIANGLE] Total sprites:', allSprites.length);
      const traitSprites = allSprites.filter(s => s.metadata?.variationType === "trait");
      console.log('🔺 [TRIANGLE] Trait sprites:', traitSprites.length);
      if (traitSprites.length > 0) {
        console.log('🔺 [TRIANGLE] Trait details:', traitSprites);
      } else {
        console.log('🔺 [TRIANGLE] No trait sprites found!');
        console.log('🔺 [TRIANGLE] All sprites:', allSprites);
      }
    }
  }, [triangleOverlayData]);

  // Extract owned variation names from the user's Meks
  const ownedVariationNames = useMemo(() => {
    const variationSet = new Set<string>();

    ownedMeks.forEach(mek => {
      // Extract individual variations from sourceKey (format: "head-body-item")
      if (mek.sourceKey) {
        const parts = mek.sourceKey.split('-');
        if (parts.length === 3) {
          // Map each sourceKey code to its variation name with type
          // parts[0] = head, parts[1] = body, parts[2] = item
          const types = ['head', 'body', 'item'];
          parts.forEach((sourceKeyCode, index) => {
            if (sourceKeyCode) {
              // Find the variation in COMPLETE_VARIATION_RARITY by sourceKey
              const variation = COMPLETE_VARIATION_RARITY.find(
                v => v.sourceKey.toUpperCase() === sourceKeyCode.toUpperCase()
              );
              if (variation) {
                // Store as "NAME-TYPE" to distinguish between same-named variations
                // (e.g., "AZTEC-head" vs "AZTEC-body", "RUST-head" vs "RUST-body")
                variationSet.add(`${variation.name.toUpperCase()}-${types[index]}`);
              }
            }
          });
        }
      }
      // Also add the variation groups if available (with type suffix)
      if (mek.headGroup) variationSet.add(`${mek.headGroup.toUpperCase()}-head`);
      if (mek.bodyGroup) variationSet.add(`${mek.bodyGroup.toUpperCase()}-body`);
      if (mek.itemGroup) variationSet.add(`${mek.itemGroup.toUpperCase()}-item`);
    });

    return variationSet;
  }, [ownedMeks]);

  // Get sprites from overlay data
  const sprites = triangleOverlayData?.zones?.filter(zone => zone.mode === "sprite") || [];

  // Count owned sprites (check both name AND type to prevent confusion with same-named variations)
  const ownedCount = sprites.filter(sprite => {
    const variationName = sprite.metadata?.variationName?.toUpperCase();
    const variationType = sprite.metadata?.variationType;
    if (!variationName || !variationType) return false;

    // Check for exact match of "NAME-TYPE" (e.g., "AZTEC-body" vs "AZTEC-head")
    const key = `${variationName}-${variationType}`;
    return ownedVariationNames.has(key);
  }).length;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative mek-card-industrial mek-border-sharp-gold p-6 max-w-7xl w-full rounded-xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-yellow-400 hover:text-yellow-300 text-3xl font-bold z-10 w-10 h-10 flex items-center justify-center hover:bg-yellow-500/10 rounded transition-colors"
        >
          ×
        </button>

        {/* Title */}
        <div className="mb-6 pb-4 border-b-2 border-yellow-500/30">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-yellow-500 mek-glow-yellow" />
            <h2 className="mek-text-industrial text-3xl text-yellow-400 mek-text-shadow">
              MEK VARIATIONS
            </h2>
          </div>
        </div>

        {/* Triangle Canvas */}
        <div className="relative flex items-center justify-center bg-black/40 rounded-lg p-8">
          <div className="relative">
            {/* Background Triangle Image */}
            <img
              src="/triangle/backplate_2.webp"
              alt="Mek Variations Triangle"
              className="w-full h-auto max-w-4xl"
            />

            {/* Positioned sprites from database */}
            {sprites.map((sprite) => {
              const variationName = sprite.metadata?.variationName?.toUpperCase();
              const variationType = sprite.metadata?.variationType;
              // Check for exact match of "NAME-TYPE" to prevent showing wrong sprites for same-named variations
              const key = variationName && variationType ? `${variationName}-${variationType}` : '';
              const isOwned = key && ownedVariationNames.has(key);

              return (
                <div
                  key={sprite.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${sprite.x}px`,
                    top: `${sprite.y}px`,
                    transform: 'translate(-50%, -50%)',
                    filter: isOwned
                      ? 'drop-shadow(0 0 12px rgba(250, 182, 23, 0.9)) brightness(1.3)'
                      : 'brightness(0.4) grayscale(0.5)',
                    transition: 'all 0.3s ease',
                  }}
                  title={sprite.label || sprite.metadata?.variationName}
                >
                  {sprite.overlayImage && (
                    <img
                      src={sprite.overlayImage}
                      alt={sprite.label || "sprite"}
                      className={isOwned ? 'animate-pulse' : ''}
                      style={{
                        animationDuration: isOwned ? '2s' : undefined,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Text */}
        <div className="mt-4 text-center space-y-2">
          <p className="mek-label-uppercase text-yellow-400/60 text-sm">
            291 TOTAL VARIATIONS • 102 HEADS • 112 BODIES • 77 TRAITS
          </p>
          <p className="text-yellow-400 font-bold text-lg">
            You own {ownedCount} of {sprites.length} displayed variations
          </p>
        </div>
      </div>
    </div>
  );
}
