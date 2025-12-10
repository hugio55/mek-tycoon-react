"use client";

import { Id } from "@/convex/_generated/dataModel";
import { getMediaUrl } from "@/lib/media-url";

interface OfferCardProps {
  offer: {
    _id: Id<"tradeOffers">;
    listingId: Id<"tradeListings">;
    offererStakeAddress: string;
    offeredMeks: {
      assetId: string;
      sourceKey?: string;
      assetName?: string;
      matchedVariations: string[];
    }[];
    status: string;
    createdAt: number;
    listing?: {
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
      status: string;
    } | null;
  };
  onWithdraw: () => void;
}

const variationTypeColors: Record<string, { bg: string; border: string; text: string }> = {
  head: { bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.3)", text: "#60a5fa" },
  body: { bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.3)", text: "#4ade80" },
  trait: { bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.3)", text: "#c084fc" },
};

export default function OfferCard({ offer, onWithdraw }: OfferCardProps) {
  // Clean source key for image
  const getMekImagePath = (sourceKey?: string) => {
    const cleanKey = (sourceKey || "").replace(/-[A-Z]$/i, "").toLowerCase();
    return cleanKey ? getMediaUrl(`/mek-images/150px/${cleanKey}.webp`) : getMediaUrl("/mek-images/placeholder.webp");
  };

  const timeAgo = getTimeAgo(offer.createdAt);
  const listing = offer.listing;

  return (
    <div
      className="relative rounded-xl overflow-hidden transition-all hover:scale-[1.01] group"
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

      {/* Header */}
      <div
        className="relative px-4 py-3"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex justify-between items-center">
          <span
            className="text-sm"
            style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.6)' }}
          >
            Offer to {listing?.ownerCorpName || "Unknown Corp"}
          </span>
          <span
            className="text-xs"
            style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.4)' }}
          >
            {timeAgo}
          </span>
        </div>
      </div>

      <div className="relative p-4">
        {/* Listed Mek (What you're trying to get) */}
        <div className="mb-4">
          <div
            className="text-xs uppercase tracking-wider mb-2"
            style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.4)' }}
          >
            You want:
          </div>
          <div
            className="flex items-center gap-3 p-3 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <img
              src={getMekImagePath(listing?.listedMekSourceKey)}
              alt={listing?.listedMekAssetName || "Listed Mek"}
              className="w-12 h-12 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = getMediaUrl("/mek-images/placeholder.webp");
              }}
            />
            <div>
              <div
                className="text-white font-medium text-sm"
                style={{ fontFamily: 'Saira, sans-serif' }}
              >
                {listing?.listedMekAssetName || "Unknown Mek"}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {listing?.desiredVariations.slice(0, 3).map((v, i) => {
                  const colors = variationTypeColors[v.variationType];
                  return (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 text-xs rounded"
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
                {listing && listing.desiredVariations.length > 3 && (
                  <span
                    className="text-xs"
                    style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.4)' }}
                  >
                    +{listing.desiredVariations.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Your Offered Meks */}
        <div className="mb-4">
          <div
            className="text-xs uppercase tracking-wider mb-2"
            style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.4)' }}
          >
            You offered:
          </div>
          <div className="flex gap-2">
            {offer.offeredMeks.map((mek, i) => (
              <div
                key={i}
                className="flex-1 p-2 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(34, 211, 238, 0.05))',
                  border: '1px solid rgba(34, 211, 238, 0.2)',
                }}
              >
                <img
                  src={getMekImagePath(mek.sourceKey)}
                  alt={mek.assetName || "Offered Mek"}
                  className="w-full aspect-square object-contain mb-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getMediaUrl("/mek-images/placeholder.webp");
                  }}
                />
                <div
                  className="text-xs truncate text-center"
                  style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.6)' }}
                >
                  {mek.assetName || "Unknown"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status & Actions */}
        <div
          className="flex justify-between items-center pt-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          <span
            className="px-2 py-1 text-xs rounded"
            style={{
              fontFamily: 'Play, sans-serif',
              background: offer.status === "pending"
                ? 'rgba(234, 179, 8, 0.15)'
                : offer.status === "withdrawn"
                ? 'rgba(107, 114, 128, 0.15)'
                : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${
                offer.status === "pending"
                  ? 'rgba(234, 179, 8, 0.3)'
                  : offer.status === "withdrawn"
                  ? 'rgba(107, 114, 128, 0.3)'
                  : 'rgba(239, 68, 68, 0.3)'
              }`,
              color: offer.status === "pending"
                ? '#fbbf24'
                : offer.status === "withdrawn"
                ? '#9ca3af'
                : '#f87171',
            }}
          >
            {offer.status === "pending"
              ? "Awaiting Response"
              : offer.status === "withdrawn"
              ? "Withdrawn"
              : "Listing Closed"}
          </span>

          {offer.status === "pending" && (
            <button
              onClick={onWithdraw}
              className="px-3 py-1.5 text-sm font-medium rounded-lg transition-all hover:scale-[1.05] active:scale-[0.95]"
              style={{
                fontFamily: 'Inter, sans-serif',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
              }}
            >
              Withdraw
            </button>
          )}
        </div>
      </div>
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
