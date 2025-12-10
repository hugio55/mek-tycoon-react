"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { getMediaUrl } from "@/lib/media-url";

interface ViewOffersLightboxProps {
  listing: {
    _id: Id<"tradeListings">;
    ownerStakeAddress: string;
    ownerCorpName?: string;
    listedMekAssetId: string;
    listedMekSourceKey?: string;
    listedMekAssetName?: string;
  };
  ownerStakeAddress: string;
  onClose: () => void;
}

export default function ViewOffersLightbox({
  listing,
  ownerStakeAddress,
  onClose,
}: ViewOffersLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const router = useRouter();

  // Get offers for this listing
  const offers = useQuery(api.tradeFloor.getListingOffers, {
    listingId: listing._id,
    ownerStakeAddress,
  });

  const startTradeConversation = useMutation(api.tradeFloor.startTradeConversation);
  const markOffersAsViewed = useMutation(api.tradeFloor.markOffersAsViewed);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";

    // Mark offers as viewed when lightbox opens
    markOffersAsViewed({
      listingId: listing._id,
      ownerStakeAddress,
    }).catch((err) => console.error("Failed to mark offers as viewed:", err));

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [listing._id, ownerStakeAddress]);

  const handleMessagePlayer = async (offer: any, offeredMekAssetId: string) => {
    setIsStartingConversation(true);
    try {
      await startTradeConversation({
        listerStakeAddress: ownerStakeAddress,
        offererStakeAddress: offer.offererStakeAddress,
        listedMekAssetId: listing.listedMekAssetId,
        offeredMekAssetId,
      });
      // Navigate to comms page
      router.push("/comms");
    } catch (error) {
      console.error("Failed to start conversation:", error);
      alert("Failed to start conversation. Please try again.");
    } finally {
      setIsStartingConversation(false);
    }
  };

  if (!mounted) return null;

  // Clean source key for image
  const getMekImagePath = (sourceKey?: string) => {
    const cleanKey = (sourceKey || "").replace(/-[A-Z]$/i, "").toLowerCase();
    return cleanKey ? getMediaUrl(`/mek-images/150px/${cleanKey}.webp`) : getMediaUrl("/mek-images/placeholder.webp");
  };

  const listedMekImage = getMekImagePath(listing.listedMekSourceKey);

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
              Trade Offers
            </h2>
            <p
              className="text-sm"
              style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
            >
              Offers received for {listing.listedMekAssetName}
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

        {/* Your Listed Mek */}
        <div
          className="px-6 py-4"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div
            className="text-xs uppercase tracking-wider mb-2"
            style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.4)' }}
          >
            Your Listed Mek:
          </div>
          <div className="flex items-center gap-4">
            <img
              src={listedMekImage}
              alt={listing.listedMekAssetName}
              className="w-16 h-16 object-contain"
            />
            <div
              className="text-white font-medium"
              style={{ fontFamily: 'Saira, sans-serif' }}
            >
              {listing.listedMekAssetName}
            </div>
          </div>
        </div>

        {/* Offers Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {offers === undefined ? (
            <div
              className="text-center py-12"
              style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
            >
              Loading offers...
            </div>
          ) : offers.length === 0 ? (
            <div
              className="text-center py-12 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <h3
                className="text-xl font-semibold text-white mb-2"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                No Offers Yet
              </h3>
              <p style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}>
                When other players make offers on your listing, they'll appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {offers.map((offer: any) => (
                <div
                  key={offer._id}
                  className="rounded-xl p-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {/* Offerer Info */}
                  <div className="flex justify-between items-center mb-3">
                    <div
                      className="text-white font-medium"
                      style={{ fontFamily: 'Saira, sans-serif' }}
                    >
                      {offer.offererCorpName || "Unknown Corp"}
                    </div>
                    <div
                      className="text-xs"
                      style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.4)' }}
                    >
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Offered Meks */}
                  <div
                    className="text-xs mb-2"
                    style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.4)' }}
                  >
                    Offered {offer.offeredMeks.length} Mek{offer.offeredMeks.length !== 1 ? "s" : ""}:
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {offer.offeredMeks.map((mek: any, i: number) => (
                      <div
                        key={i}
                        className="rounded-lg p-3 group relative"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        <img
                          src={getMekImagePath(mek.sourceKey)}
                          alt={mek.assetName}
                          className="w-full aspect-square object-contain mb-2"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getMediaUrl("/mek-images/placeholder.webp");
                          }}
                        />
                        <div
                          className="text-xs truncate"
                          style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.6)' }}
                        >
                          {mek.assetName}
                        </div>
                        {mek.matchedVariations.length > 0 && (
                          <div
                            className="text-xs mt-1"
                            style={{ fontFamily: 'Play, sans-serif', color: '#4ade80' }}
                          >
                            Matches: {mek.matchedVariations.join(", ")}
                          </div>
                        )}

                        {/* Message Player Button */}
                        <button
                          onClick={() => handleMessagePlayer(offer, mek.assetId)}
                          disabled={isStartingConversation}
                          className="mt-2 w-full px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            color: 'white',
                            boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)',
                          }}
                        >
                          {isStartingConversation ? "..." : "Message Player"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex justify-end"
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
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
