"use client";

import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { getMediaUrl } from "@/lib/media-url";

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
  };
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

const variationTypeLabels = {
  head: "H",
  body: "B",
  trait: "T",
};

export default function TradeListingCard({
  listing,
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

  const isOwnListing = listing.isOwnListing;

  // Clean source key for image path
  const cleanSourceKey = listing.listedMekSourceKey
    ?.replace(/-[A-Z]$/i, "")
    .toLowerCase();

  const imagePath = cleanSourceKey
    ? getMediaUrl(`/mek-images/150px/${cleanSourceKey}.webp`)
    : getMediaUrl("/mek-images/placeholder.webp");

  const timeAgo = getTimeAgo(listing.createdAt);

  return (
    <div
      className="relative rounded-xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] group"
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

      {/* Mek Image */}
      <div className="relative p-4 flex justify-center">
        <div className="relative w-32 h-32">
          <img
            src={imagePath}
            alt={listing.listedMekAssetName || "Listed Mek"}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getMediaUrl("/mek-images/placeholder.webp");
            }}
          />
        </div>
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
            return (
              <span
                key={i}
                className="px-2 py-1 text-xs rounded"
                style={{
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                  fontFamily: 'Play, sans-serif',
                }}
                title={`${v.variationType}: ${v.variationName}`}
              >
                <span style={{ opacity: 0.6, marginRight: '4px' }}>
                  {variationTypeLabels[v.variationType]}
                </span>
                {v.variationName}
              </span>
            );
          })}
        </div>
      </div>

      {/* Footer with time and actions */}
      <div
        className="relative px-4 py-3 flex justify-between items-center"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <span
          className="text-xs"
          style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.4)' }}
        >
          {timeAgo}
        </span>

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

              {/* Tooltip (desktop) - anchored to right to prevent clipping */}
              {showOwnListingTooltip && (
                <div
                  className="absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg whitespace-nowrap z-50"
                  style={{
                    background: 'rgba(0, 0, 0, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    fontFamily: 'Play, sans-serif',
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  This is your own listing
                  {/* Arrow */}
                  <div
                    className="absolute top-full right-4"
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderTop: '6px solid rgba(0, 0, 0, 0.9)',
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
              className="px-4 py-1.5 text-sm rounded-lg font-medium transition-all hover:scale-[1.05] active:scale-[0.95] flex items-center gap-2"
              style={{
                fontFamily: 'Inter, sans-serif',
                background: newOfferCount && newOfferCount > 0
                  ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.25), rgba(34, 211, 238, 0.15))'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
                border: newOfferCount && newOfferCount > 0
                  ? '1px solid rgba(34, 211, 238, 0.4)'
                  : '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                boxShadow: newOfferCount && newOfferCount > 0
                  ? '0 0 20px rgba(34, 211, 238, 0.3)'
                  : 'none',
              }}
            >
              Trade Offers
              {pendingOfferCount !== undefined && pendingOfferCount > 0 && (
                <span
                  className="px-1.5 py-0.5 text-xs rounded-full min-w-[20px] text-center"
                  style={{
                    background: newOfferCount && newOfferCount > 0
                      ? 'rgba(34, 211, 238, 0.4)'
                      : 'rgba(255, 255, 255, 0.15)',
                    color: newOfferCount && newOfferCount > 0
                      ? '#22d3ee'
                      : 'rgba(255, 255, 255, 0.6)',
                    textShadow: newOfferCount && newOfferCount > 0
                      ? '0 0 10px rgba(34, 211, 238, 0.8)'
                      : 'none',
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
              className="px-3 py-1.5 text-sm rounded-lg font-medium transition-all hover:scale-[1.05] active:scale-[0.95]"
              style={{
                fontFamily: 'Inter, sans-serif',
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                color: '#c084fc',
              }}
            >
              Edit
            </button>
          )}

          {isOwner && onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm rounded-lg font-medium transition-all hover:scale-[1.05] active:scale-[0.95]"
              style={{
                fontFamily: 'Inter, sans-serif',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
              }}
            >
              Cancel
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
