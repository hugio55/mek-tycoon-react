"use client";

import { Id } from "@/convex/_generated/dataModel";

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
  };
  viewerMatchCount?: number;
  isOwner?: boolean;
  pendingOfferCount?: number;
  showMakeOffer?: boolean;
  onMakeOffer?: () => void;
  onViewOffers?: () => void;
  onCancel?: () => void;
}

const variationTypeColors = {
  head: "text-blue-400 bg-blue-500/20 border-blue-500/30",
  body: "text-green-400 bg-green-500/20 border-green-500/30",
  trait: "text-purple-400 bg-purple-500/20 border-purple-500/30",
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
  showMakeOffer,
  onMakeOffer,
  onViewOffers,
  onCancel,
}: TradeListingCardProps) {
  // Clean source key for image path
  const cleanSourceKey = listing.listedMekSourceKey
    ?.replace(/-[A-Z]$/i, "")
    .toLowerCase();

  const imagePath = cleanSourceKey
    ? `/mek-images/150px/${cleanSourceKey}.webp`
    : "/mek-images/placeholder.webp";

  // Format date
  const createdDate = new Date(listing.createdAt);
  const timeAgo = getTimeAgo(listing.createdAt);

  return (
    <div className="bg-gray-900/80 border border-yellow-500/30 rounded-lg overflow-hidden hover:border-yellow-500/50 transition-all">
      {/* Header with match count or offer count */}
      <div className="flex justify-between items-center px-4 py-2 bg-black/30 border-b border-gray-800">
        <span className="text-sm text-gray-400">
          {listing.ownerCorpName || "Unknown Corp"}
        </span>
        {viewerMatchCount !== undefined && viewerMatchCount > 0 && (
          <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
            {viewerMatchCount} match{viewerMatchCount !== 1 ? "es" : ""}
          </span>
        )}
        {isOwner && pendingOfferCount !== undefined && pendingOfferCount > 0 && (
          <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
            {pendingOfferCount} offer{pendingOfferCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Mek Image */}
      <div className="p-4 flex justify-center bg-gradient-to-b from-gray-800/50 to-transparent">
        <div className="relative w-32 h-32">
          <img
            src={imagePath}
            alt={listing.listedMekAssetName || "Listed Mek"}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/mek-images/placeholder.webp";
            }}
          />
        </div>
      </div>

      {/* Mek Name */}
      <div className="px-4 pb-2">
        <h3 className="text-white font-medium text-center truncate">
          {listing.listedMekAssetName || "Unknown Mek"}
        </h3>
      </div>

      {/* Desired Variations */}
      <div className="px-4 pb-3">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
          Looking for:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {listing.desiredVariations.map((v, i) => (
            <span
              key={i}
              className={`px-2 py-1 text-xs rounded border ${variationTypeColors[v.variationType]}`}
              title={`${v.variationType}: ${v.variationName}`}
            >
              <span className="opacity-60 mr-1">{variationTypeLabels[v.variationType]}</span>
              {v.variationName}
            </span>
          ))}
        </div>
      </div>

      {/* Footer with time and actions */}
      <div className="px-4 py-3 bg-black/30 border-t border-gray-800 flex justify-between items-center">
        <span className="text-xs text-gray-500">{timeAgo}</span>

        <div className="flex gap-2">
          {showMakeOffer && onMakeOffer && (
            <button
              onClick={onMakeOffer}
              className="px-3 py-1.5 text-sm bg-yellow-500 hover:bg-yellow-400 text-black font-medium rounded transition-all"
            >
              Make Offer
            </button>
          )}

          {isOwner && onViewOffers && (
            <button
              onClick={onViewOffers}
              className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-400 text-white font-medium rounded transition-all"
            >
              View Offers
            </button>
          )}

          {isOwner && onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded border border-red-500/30 transition-all"
            >
              Cancel
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
