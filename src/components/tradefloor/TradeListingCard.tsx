"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getMediaUrl } from "@/lib/media-url";
import { COMPLETE_VARIATION_RARITY } from "@/lib/completeVariationRarity";

interface DesiredVariation {
  variationName: string;
  variationType: "head" | "body" | "trait";
  variationId?: number;
}

interface TradeListingCardProps {
  listing: {
    _id: Id<"tradeListings">;
    ownerStakeAddress: string;
    ownerCorpName?: string;
    listedMekAssetId: string;
    listedMekSourceKey?: string;
    listedMekAssetName?: string;
    desiredVariations: DesiredVariation[];
    status: string;
    createdAt: number;
    isOwnListing?: boolean;
    viewCount?: number; // Analytics: unique views
    offerCount?: number; // Number of pending offers
  };
  viewerStakeAddress?: string; // For recording views
  viewerMatchCount?: number;
  isOwner?: boolean;
  pendingOfferCount?: number;
  newOfferCount?: number; // New/unseen offers
  showMakeOffer?: boolean;
  onMakeOffer?: () => void;
  onViewOffers?: () => void;
  onEditListing?: () => void;
  onCancel?: () => void;
}

const variationTypeColors = {
  head: { bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.3)", text: "#60a5fa" },
  body: { bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.3)", text: "#4ade80" },
  trait: { bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.3)", text: "#c084fc" },
};


export default function TradeListingCard({
  listing,
  viewerStakeAddress,
  viewerMatchCount,
  isOwner,
  pendingOfferCount,
  newOfferCount,
  showMakeOffer,
  onMakeOffer,
  onViewOffers,
  onEditListing,
  onCancel,
}: TradeListingCardProps) {
  const [showOwnListingTooltip, setShowOwnListingTooltip] = useState(false);
  const [showMobileLightbox, setShowMobileLightbox] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hoveredVariation, setHoveredVariation] = useState<{
    variation: DesiredVariation;
    fullVariation: typeof COMPLETE_VARIATION_RARITY[0] | null;
    x: number;
    y: number;
  } | null>(null);

  // Analytics: Record view mutation
  const recordView = useMutation(api.tradeFloor.recordListingView);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isOwnListing = listing.isOwnListing;

  // Clean source key for image path
  const cleanSourceKey = listing.listedMekSourceKey
    ?.replace(/-[A-Z]$/i, "")
    .toLowerCase();

  const imagePath = cleanSourceKey
    ? getMediaUrl(`/mek-images/150px/${cleanSourceKey}.webp`)
    : getMediaUrl("/mek-images/placeholder.webp");

  // Extract Mek number from asset name (e.g., "Mekanism #1234" -> "1234")
  const mekNumber = useMemo(() => {
    if (!listing.listedMekAssetName) return null;
    const match = listing.listedMekAssetName.match(/#(\d+)/);
    return match ? match[1] : null;
  }, [listing.listedMekAssetName]);

  // Look up variation details from source key
  const mekVariations = useMemo(() => {
    if (!cleanSourceKey) return null;

    // Source key format: "aa1-bb2-cc3" (head-body-trait, lowercase)
    const parts = cleanSourceKey.toUpperCase().split("-");
    if (parts.length !== 3) return null;

    const [headCode, bodyCode, traitCode] = parts;

    // Look up each variation by sourceKey
    const head = COMPLETE_VARIATION_RARITY.find(v => v.sourceKey === headCode && v.type === "head");
    const body = COMPLETE_VARIATION_RARITY.find(v => v.sourceKey === bodyCode && v.type === "body");
    const trait = COMPLETE_VARIATION_RARITY.find(v => v.sourceKey === traitCode && v.type === "trait");

    return { head, body, trait };
  }, [cleanSourceKey]);

  // Calculate overall rarity rank (average of the 3 variation ranks, lower = rarer)
  const overallRank = useMemo(() => {
    if (!mekVariations?.head || !mekVariations?.body || !mekVariations?.trait) return null;
    const avgRank = Math.round(
      (mekVariations.head.rank + mekVariations.body.rank + mekVariations.trait.rank) / 3
    );
    return avgRank;
  }, [mekVariations]);

  const timeAgo = getTimeAgo(listing.createdAt);

  return (
    <div
      className="relative rounded-xl overflow-hidden group"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Honeycomb hover overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-300 pointer-events-none"
        style={{
          backgroundImage: "url('/random-images/honey-png-big.webp')",
          backgroundSize: '100%',
          backgroundPosition: 'center',
        }}
      />

      {/* Header with match count or offer count */}
      <div
        className="relative flex justify-between items-center px-4 py-2"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <span
          className="text-sm"
          style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.6)' }}
        >
          {listing.ownerCorpName || "Unknown Corp"}
        </span>
        {viewerMatchCount !== undefined && viewerMatchCount > 0 && (
          <span
            className="px-2 py-0.5 text-xs rounded-full"
            style={{
              background: 'rgba(34, 211, 238, 0.2)',
              color: '#22d3ee',
              textShadow: '0 0 10px rgba(34, 211, 238, 0.5)',
            }}
          >
            {viewerMatchCount} match{viewerMatchCount !== 1 ? "es" : ""}
          </span>
        )}
        {isOwner && pendingOfferCount !== undefined && pendingOfferCount > 0 && (
          <span
            className="px-2 py-0.5 text-xs rounded-full"
            style={{
              background: 'rgba(34, 197, 94, 0.2)',
              color: '#4ade80',
              textShadow: '0 0 10px rgba(34, 197, 94, 0.5)',
            }}
          >
            {pendingOfferCount} offer{pendingOfferCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Mek Image - Clickable to open lightbox (also records view for analytics) */}
      <div className="relative p-4 flex justify-center">
        <button
          onClick={() => {
            setShowImageLightbox(true);
            // Record view for analytics (only if viewer is logged in)
            if (viewerStakeAddress) {
              recordView({
                listingId: listing._id,
                viewerStakeAddress,
              }).catch(() => {
                // Silently fail - analytics shouldn't block UX
              });
            }
          }}
          className="relative w-32 h-32 cursor-pointer transition-all duration-200 hover:scale-110 active:scale-105 rounded-lg overflow-hidden group/image"
          title="Click to view larger"
        >
          <img
            src={imagePath}
            alt={listing.listedMekAssetName || "Listed Mek"}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getMediaUrl("/mek-images/placeholder.webp");
            }}
          />
          {/* Hover overlay with magnify icon */}
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-200 rounded-lg"
            style={{ background: 'rgba(34, 211, 238, 0.15)' }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.5))' }}
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
              <path d="M11 8v6M8 11h6"/>
            </svg>
          </div>
        </button>
      </div>

      {/* Mek Name */}
      <div className="relative px-4 pb-2">
        <h3
          className="text-white font-medium text-center truncate"
          style={{ fontFamily: 'Saira, sans-serif' }}
        >
          {listing.listedMekAssetName || "Unknown Mek"}
        </h3>
      </div>

      {/* Desired Variations */}
      <div className="relative px-4 pb-3">
        <div
          className="text-xs uppercase tracking-wider mb-2"
          style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.4)' }}
        >
          Looking for:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {listing.desiredVariations.map((v, i) => {
            const colors = variationTypeColors[v.variationType];
            // Look up full variation data for tooltip
            const fullVariation = COMPLETE_VARIATION_RARITY.find(
              (fv) => fv.name.toLowerCase() === v.variationName.toLowerCase() && fv.type === v.variationType
            );
            return (
              <span
                key={i}
                className="px-2 py-1 text-xs rounded cursor-pointer transition-all hover:brightness-125"
                style={{
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                  fontFamily: 'Play, sans-serif',
                }}
                title={`${v.variationType}: ${v.variationName}`}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredVariation({
                    variation: v,
                    fullVariation: fullVariation || null,
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                  });
                }}
                onMouseLeave={() => setHoveredVariation(null)}
              >
                {v.variationName}
              </span>
            );
          })}
        </div>
      </div>

      {/* Footer with time, views, and actions */}
      <div
        className="relative px-4 py-3 flex justify-between items-center"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-xs"
            style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.4)' }}
          >
            {timeAgo}
          </span>
          {/* View count */}
          {listing.viewCount !== undefined && listing.viewCount > 0 && (
            <span
              className="text-xs flex items-center gap-1"
              style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.4)' }}
              title="Unique views"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              {listing.viewCount}
            </span>
          )}
          {/* Offer count - show for browse tab */}
          {listing.offerCount !== undefined && listing.offerCount > 0 && (
            <span
              className="text-xs flex items-center gap-1"
              style={{ fontFamily: 'Play, sans-serif', color: '#4ade80' }}
              title="Pending offers"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              {listing.offerCount}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {showMakeOffer && (isOwnListing ? (
            /* Own Listing - Disabled button with tooltip */
            <div
              className="relative"
              onMouseEnter={() => setShowOwnListingTooltip(true)}
              onMouseLeave={() => setShowOwnListingTooltip(false)}
            >
              <button
                onClick={() => {
                  // On mobile/touch, show lightbox instead of tooltip
                  if ('ontouchstart' in window) {
                    setShowMobileLightbox(true);
                  }
                }}
                className="px-4 py-1.5 text-sm rounded-lg font-medium cursor-not-allowed"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                disabled
              >
                Make Offer
              </button>

              {/* Tooltip (desktop) - glass morphism style matching page aesthetic */}
              {showOwnListingTooltip && (
                <div
                  className="absolute bottom-full right-0 mb-2 px-4 py-2.5 rounded-xl whitespace-nowrap z-50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(34, 211, 238, 0.3)',
                    fontFamily: 'Play, sans-serif',
                    fontSize: '13px',
                    color: '#22d3ee',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(34, 211, 238, 0.1)',
                  }}
                >
                  This is your own listing
                  {/* Arrow */}
                  <div
                    className="absolute top-full right-4"
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderTop: '8px solid rgba(34, 211, 238, 0.3)',
                    }}
                  />
                </div>
              )}
            </div>
          ) : onMakeOffer && (
            <button
              onClick={onMakeOffer}
              className="px-4 py-1.5 text-sm rounded-lg font-medium transition-all hover:scale-[1.05] active:scale-[0.95]"
              style={{
                fontFamily: 'Inter, sans-serif',
                background: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
                color: 'black',
                boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)',
              }}
            >
              Make Offer
            </button>
          ))}

          {isOwner && onViewOffers && (
            <button
              onClick={onViewOffers}
              className="px-3 py-1 text-xs rounded font-medium transition-all hover:brightness-125 flex items-center gap-1.5"
              style={{
                fontFamily: 'Play, sans-serif',
                background: newOfferCount && newOfferCount > 0
                  ? 'rgba(34, 211, 238, 0.15)'
                  : 'rgba(255,255,255,0.08)',
                border: newOfferCount && newOfferCount > 0
                  ? '1px solid rgba(34, 211, 238, 0.3)'
                  : '1px solid rgba(255,255,255,0.15)',
                color: newOfferCount && newOfferCount > 0 ? '#22d3ee' : 'rgba(255,255,255,0.7)',
              }}
            >
              Offers
              {pendingOfferCount !== undefined && pendingOfferCount > 0 && (
                <span
                  className="px-1 py-0 text-[10px] rounded-full min-w-[16px] text-center"
                  style={{
                    background: newOfferCount && newOfferCount > 0
                      ? 'rgba(34, 211, 238, 0.3)'
                      : 'rgba(255, 255, 255, 0.1)',
                    color: newOfferCount && newOfferCount > 0
                      ? '#22d3ee'
                      : 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {pendingOfferCount}
                </span>
              )}
            </button>
          )}

          {isOwner && onEditListing && (
            <button
              onClick={onEditListing}
              className="px-3 py-1 text-xs rounded font-medium transition-all hover:brightness-125"
              style={{
                fontFamily: 'Play, sans-serif',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              Edit
            </button>
          )}

          {isOwner && onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1 text-xs rounded font-medium transition-all hover:brightness-125"
              style={{
                fontFamily: 'Play, sans-serif',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
              }}
            >
              De-list
            </button>
          )}
        </div>
      </div>

      {/* Own Listing Badge (shown in header corner) - Glowing cyan text */}
      {isOwnListing && (
        <div
          className="absolute top-3 right-3 text-xs uppercase tracking-wider font-medium"
          style={{
            fontFamily: 'Play, sans-serif',
            color: '#22d3ee',
            textShadow: '0 0 10px rgba(34, 211, 238, 0.6), 0 0 20px rgba(34, 211, 238, 0.3)',
          }}
        >
          Your Listing
        </div>
      )}

      {/* Mobile Lightbox for Own Listing */}
      {showMobileLightbox && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={() => setShowMobileLightbox(false)}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />
          <div
            className="relative mx-4 p-6 rounded-2xl text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="text-4xl mb-4"
              style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))' }}
            >
              🤖
            </div>
            <h3
              className="text-lg font-semibold text-white mb-2"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              This is Your Listing
            </h3>
            <p
              className="mb-4"
              style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.6)' }}
            >
              You can't make an offer on your own listing. View it in the "My Listings" tab to manage offers.
            </p>
            <button
              onClick={() => setShowMobileLightbox(false)}
              className="px-6 py-2 rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                fontFamily: 'Inter, sans-serif',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Image Lightbox - Rendered via Portal */}
      {mounted && showImageLightbox && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowImageLightbox(false)}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          />

          {/* Content Container */}
          <div
            className="relative flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Large Image - Using 1000px resolution */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                boxShadow: '0 0 60px rgba(34, 211, 238, 0.15), 0 25px 50px rgba(0, 0, 0, 0.5)',
              }}
            >
              <img
                src={cleanSourceKey ? getMediaUrl(`/mek-images/1000px/${cleanSourceKey}.webp`) : getMediaUrl("/mek-images/placeholder.webp")}
                alt={listing.listedMekAssetName || "Listed Mek"}
                className="w-[600px] h-[600px] max-w-[90vw] max-h-[80vh] object-contain"
                style={{ background: 'rgba(0,0,0,0.3)' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getMediaUrl("/mek-images/placeholder.webp");
                }}
              />
            </div>

            {/* Mek Info Section */}
            <div className="flex flex-col items-center gap-2 text-center">
              {/* Mek Name */}
              <h3
                className="text-xl font-semibold text-white"
                style={{
                  fontFamily: 'Saira, sans-serif',
                  textShadow: '0 0 20px rgba(34, 211, 238, 0.3)',
                }}
              >
                {listing.listedMekAssetName || "Unknown Mek"}
              </h3>

              {/* Mek Number & Rank */}
              <div
                className="flex items-center gap-4 text-sm"
                style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.6)' }}
              >
                {mekNumber && (
                  <span>Mek <span style={{ color: '#22d3ee' }}>#{mekNumber}</span></span>
                )}
                {overallRank && (
                  <span>Rank <span style={{ color: '#fbbf24' }}>#{overallRank}</span></span>
                )}
              </div>

              {/* Variation Details */}
              {mekVariations && (
                <div
                  className="flex flex-col gap-1.5 mt-2 text-sm"
                  style={{ fontFamily: 'Play, sans-serif' }}
                >
                  {/* Head */}
                  {mekVariations.head && (
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-xs"
                        style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                        }}
                      >
                        HEAD
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                        {mekVariations.head.name}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                        ({mekVariations.head.count} {mekVariations.head.count === 1 ? 'copy' : 'copies'})
                      </span>
                    </div>
                  )}

                  {/* Body */}
                  {mekVariations.body && (
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-xs"
                        style={{
                          background: 'rgba(34, 197, 94, 0.2)',
                          color: '#4ade80',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                        }}
                      >
                        BODY
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                        {mekVariations.body.name}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                        ({mekVariations.body.count} {mekVariations.body.count === 1 ? 'copy' : 'copies'})
                      </span>
                    </div>
                  )}

                  {/* Trait */}
                  {mekVariations.trait && (
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-xs"
                        style={{
                          background: 'rgba(168, 85, 247, 0.2)',
                          color: '#c084fc',
                          border: '1px solid rgba(168, 85, 247, 0.3)',
                        }}
                      >
                        TRAIT
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                        {mekVariations.trait.name}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                        ({mekVariations.trait.count} {mekVariations.trait.count === 1 ? 'copy' : 'copies'})
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col items-center gap-3 mt-2">
              {/* Make Trade Offer Button - Only show if not own listing and handler exists */}
              {!isOwnListing && onMakeOffer && (
                <button
                  onClick={() => {
                    setShowImageLightbox(false);
                    onMakeOffer();
                  }}
                  className="px-10 py-3 rounded-xl font-semibold text-lg transition-all hover:scale-[1.05] active:scale-[0.95]"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    background: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 50%, #0891b2 100%)',
                    color: '#000',
                    boxShadow: '0 0 30px rgba(34, 211, 238, 0.4), 0 4px 20px rgba(0,0,0,0.3)',
                    textShadow: '0 1px 2px rgba(255,255,255,0.2)',
                  }}
                >
                  Make Trade Offer
                </button>
              )}

              {/* Close Text Link */}
              <button
                onClick={() => setShowImageLightbox(false)}
                className="text-sm transition-all hover:opacity-80"
                style={{
                  fontFamily: 'Play, sans-serif',
                  color: 'rgba(255,255,255,0.5)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Variation Hover Tooltip - Rendered via portal */}
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
              alt={hoveredVariation.variation.variationName}
              className="w-32 h-32 object-contain mb-2"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div
              className="text-sm font-medium text-center"
              style={{ fontFamily: 'Saira, sans-serif', color: '#22d3ee' }}
            >
              {hoveredVariation.variation.variationName}
            </div>
            <div
              className="text-xs text-center mt-1"
              style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
            >
              {hoveredVariation.variation.variationType.charAt(0).toUpperCase() + hoveredVariation.variation.variationType.slice(1)}
              {hoveredVariation.fullVariation && ` | Rank #${hoveredVariation.fullVariation.rank}`}
            </div>
            {hoveredVariation.fullVariation && (
              <div
                className="text-xs text-center"
                style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.4)' }}
              >
                {hoveredVariation.fullVariation.count} exist ({hoveredVariation.fullVariation.percentage}%)
              </div>
            )}
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
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
