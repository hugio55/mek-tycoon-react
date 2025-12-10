"use client";

import { Id } from "@/convex/_generated/dataModel";

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

export default function OfferCard({ offer, onWithdraw }: OfferCardProps) {
  // Clean source key for image
  const getMekImagePath = (sourceKey?: string) => {
    const cleanKey = (sourceKey || "").replace(/-[A-Z]$/i, "").toLowerCase();
    return cleanKey ? `/mek-images/150px/${cleanKey}.webp` : "/mek-images/placeholder.webp";
  };

  const timeAgo = getTimeAgo(offer.createdAt);
  const listing = offer.listing;

  const variationTypeColors: Record<string, string> = {
    head: "text-blue-400 bg-blue-500/20 border-blue-500/30",
    body: "text-green-400 bg-green-500/20 border-green-500/30",
    trait: "text-purple-400 bg-purple-500/20 border-purple-500/30",
  };

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 bg-black/30">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">
            Offer to {listing?.ownerCorpName || "Unknown Corp"}
          </span>
          <span className="text-xs text-gray-500">{timeAgo}</span>
        </div>
      </div>

      <div className="p-4">
        {/* Listed Mek (What you're trying to get) */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            You want:
          </div>
          <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-gray-800">
            <img
              src={getMekImagePath(listing?.listedMekSourceKey)}
              alt={listing?.listedMekAssetName || "Listed Mek"}
              className="w-12 h-12 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/mek-images/placeholder.webp";
              }}
            />
            <div>
              <div className="text-white font-medium text-sm">
                {listing?.listedMekAssetName || "Unknown Mek"}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {listing?.desiredVariations.slice(0, 3).map((v, i) => (
                  <span
                    key={i}
                    className={`px-1.5 py-0.5 text-xs rounded border ${variationTypeColors[v.variationType]}`}
                  >
                    {v.variationName}
                  </span>
                ))}
                {listing && listing.desiredVariations.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{listing.desiredVariations.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Your Offered Meks */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            You offered:
          </div>
          <div className="flex gap-2">
            {offer.offeredMeks.map((mek, i) => (
              <div
                key={i}
                className="flex-1 p-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg"
              >
                <img
                  src={getMekImagePath(mek.sourceKey)}
                  alt={mek.assetName || "Offered Mek"}
                  className="w-full aspect-square object-contain mb-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/mek-images/placeholder.webp";
                  }}
                />
                <div className="text-xs text-gray-400 truncate text-center">
                  {mek.assetName || "Unknown"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-800">
          <span
            className={`px-2 py-1 text-xs rounded ${
              offer.status === "pending"
                ? "bg-yellow-500/20 text-yellow-400"
                : offer.status === "withdrawn"
                ? "bg-gray-500/20 text-gray-400"
                : "bg-red-500/20 text-red-400"
            }`}
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
              className="px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded border border-red-500/30 transition-all"
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
