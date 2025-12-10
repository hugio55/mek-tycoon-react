"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { restoreWalletSession } from "@/lib/walletSessionManager";
import TradeListingCard from "@/components/tradefloor/TradeListingCard";
import CreateListingLightbox from "@/components/tradefloor/CreateListingLightbox";
import MatchingMeksLightbox from "@/components/tradefloor/MatchingMeksLightbox";
import ViewOffersLightbox from "@/components/tradefloor/ViewOffersLightbox";
import EditListingLightbox from "@/components/tradefloor/EditListingLightbox";
import ConfirmationLightbox from "@/components/tradefloor/ConfirmationLightbox";
import OfferCard from "@/components/tradefloor/OfferCard";

type Tab = "browse" | "my-listings" | "my-offers";

interface ConfirmAction {
  type: "cancel-listing" | "withdraw-offer";
  id: Id<"tradeListings"> | Id<"tradeOffers">;
  title: string;
  message: string;
}

export default function TradeFloorPage() {
  const searchParams = useSearchParams();
  const [stakeAddress, setStakeAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("browse");
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [selectedListingForOffer, setSelectedListingForOffer] = useState<any>(null);
  const [selectedListingForViewOffers, setSelectedListingForViewOffers] = useState<any>(null);
  const [selectedListingForEdit, setSelectedListingForEdit] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  // Read tab from URL query parameter (for notification deep links)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["browse", "my-listings", "my-offers"].includes(tabParam)) {
      setActiveTab(tabParam as Tab);
    }
  }, [searchParams]);

  // Restore wallet session on mount (same pattern as HomePage)
  useEffect(() => {
    const initWallet = async () => {
      const session = await restoreWalletSession();
      if (session) {
        // Use stake address as primary identifier (same as database)
        const address = session.stakeAddress || session.walletAddress;
        setStakeAddress(address);
        console.log('[TradeFloor] Wallet connected:', address);
      } else {
        console.log('[TradeFloor] No wallet session found');
      }
    };
    initWallet();
  }, []);

  // Queries
  const browseListings = useQuery(
    api.tradeFloor.getBrowseListings,
    stakeAddress ? { viewerStakeAddress: stakeAddress } : {}
  );

  const myListings = useQuery(
    api.tradeFloor.getMyListings,
    stakeAddress ? { stakeAddress } : "skip"
  );

  const myOffers = useQuery(
    api.tradeFloor.getMyOffers,
    stakeAddress ? { stakeAddress } : "skip"
  );

  const activeListingCount = useQuery(
    api.tradeFloor.getActiveListingCount,
    stakeAddress ? { stakeAddress } : "skip"
  );

  // Mutations
  const cancelListing = useMutation(api.tradeFloor.cancelListing);
  const withdrawOffer = useMutation(api.tradeFloor.withdrawOffer);

  const handleCancelListing = (listingId: Id<"tradeListings">) => {
    if (!stakeAddress) return;
    setConfirmAction({
      type: "cancel-listing",
      id: listingId,
      title: "Cancel Listing",
      message: "Are you sure you want to cancel this listing? All pending offers will be notified.",
    });
  };

  const handleWithdrawOffer = (offerId: Id<"tradeOffers">) => {
    if (!stakeAddress) return;
    setConfirmAction({
      type: "withdraw-offer",
      id: offerId,
      title: "Withdraw Offer",
      message: "Are you sure you want to withdraw this offer?",
    });
  };

  const executeConfirmAction = async () => {
    if (!confirmAction || !stakeAddress) return;

    try {
      if (confirmAction.type === "cancel-listing") {
        await cancelListing({
          listingId: confirmAction.id as Id<"tradeListings">,
          ownerStakeAddress: stakeAddress
        });
      } else if (confirmAction.type === "withdraw-offer") {
        await withdrawOffer({
          offerId: confirmAction.id as Id<"tradeOffers">,
          offererStakeAddress: stakeAddress
        });
      }
    } catch (error) {
      console.error("Action failed:", error);
      alert("Action failed. Please try again.");
    } finally {
      setConfirmAction(null);
    }
  };

  const tabs = [
    { id: "browse" as Tab, label: "Browse Listings" },
    { id: "my-listings" as Tab, label: "My Listings" },
    { id: "my-offers" as Tab, label: "My Offers" },
  ];

  const canCreateListing = stakeAddress && activeListingCount !== undefined && activeListingCount < 5;

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Header - Liquid Glass with Create Listing Button */}
      <div
        className="relative mt-4"
        style={{
          background: 'transparent',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1
                className="text-3xl font-bold tracking-wider uppercase"
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  background: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 40px rgba(34, 211, 238, 0.5)',
                }}
              >
                Trade Floor
              </h1>
              <p
                className="mt-1"
                style={{
                  fontFamily: 'Play, sans-serif',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                List your Meks for trade and find others looking for variations you have
              </p>
            </div>

            {/* Create Listing Button - Right aligned in header */}
            <button
              onClick={() => stakeAddress && setShowCreateListing(true)}
              disabled={!stakeAddress}
              className="px-5 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 group overflow-hidden relative"
              style={{
                fontFamily: 'Inter, sans-serif',
                background: stakeAddress
                  ? 'linear-gradient(135deg, #22d3ee, #06b6d4)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                color: stakeAddress ? 'black' : 'rgba(255,255,255,0.4)',
                boxShadow: stakeAddress
                  ? '0 0 30px rgba(34, 211, 238, 0.4)'
                  : 'none',
                border: stakeAddress ? 'none' : '1px solid rgba(255,255,255,0.2)',
                cursor: stakeAddress ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={(e) => {
                if (stakeAddress) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {/* Sliding particles animation for logged in state */}
              {stakeAddress && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                    animation: 'slideParticles 2s linear infinite',
                  }}
                />
              )}
              <span className="text-xl relative z-10">+</span>
              <span className="relative z-10">Create Listing</span>
              {stakeAddress && activeListingCount !== undefined && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs relative z-10"
                  style={{ background: 'rgba(0,0,0,0.2)' }}
                >
                  {activeListingCount}/5
                </span>
              )}
              {!stakeAddress && (
                <span className="text-xs relative z-10" style={{ opacity: 0.6 }}>
                  (Login)
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Glass Effect */}
      <div
        className="relative"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative px-6 py-3 text-sm font-medium tracking-wide transition-all overflow-hidden group"
                style={{
                  fontFamily: 'Saira, sans-serif',
                  color: activeTab === tab.id ? '#22d3ee' : 'rgba(255,255,255,0.5)',
                  background: activeTab === tab.id
                    ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.15), rgba(34, 211, 238, 0.05))'
                    : 'transparent',
                }}
              >
                {/* Honeycomb hover effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-[0.07] transition-opacity duration-300 pointer-events-none"
                  style={{
                    backgroundImage: "url('/random-images/honey-png-big.webp')",
                    backgroundSize: '100%',
                    backgroundPosition: 'center',
                  }}
                />
                <span className="relative z-10">{tab.label}</span>
                {activeTab === tab.id && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{
                      background: 'linear-gradient(90deg, #22d3ee, #06b6d4)',
                      boxShadow: '0 0 10px rgba(34, 211, 238, 0.8)',
                    }}
                  />
                )}
                {/* Badge for my-offers */}
                {tab.id === "my-offers" && myOffers && myOffers.length > 0 && (
                  <span
                    className="ml-2 px-2 py-0.5 text-xs rounded-full"
                    style={{
                      background: 'rgba(34, 211, 238, 0.2)',
                      color: '#22d3ee',
                      textShadow: '0 0 10px rgba(34, 211, 238, 0.5)',
                    }}
                  >
                    {myOffers.length}
                  </span>
                )}
                {/* Badge for my-listings */}
                {tab.id === "my-listings" && myListings && myListings.length > 0 && (
                  <span
                    className="ml-2 px-2 py-0.5 text-xs rounded-full"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    {myListings.length}/5
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 py-6">
        {/* Not logged in message */}
        {!stakeAddress && (
          <div
            className="text-center py-12 rounded-2xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 0 40px rgba(34, 211, 238, 0.1)',
            }}
          >
            {/* Honeycomb pattern */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: "url('/random-images/honey-png-big.webp')",
                backgroundSize: '50%',
                backgroundPosition: 'center',
              }}
            />
            <div className="relative z-10">
              <div
                className="text-6xl mb-4"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(234, 179, 8, 0.5))',
                }}
              >
                🔒
              </div>
              <h2
                className="text-2xl font-bold mb-2"
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  color: '#22d3ee',
                  textShadow: '0 0 20px rgba(34, 211, 238, 0.5)',
                }}
              >
                Connect Your Wallet
              </h2>
              <p style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.6)' }}>
                Connect your wallet to browse listings and make trade offers
              </p>
            </div>
          </div>
        )}

        {/* Browse Listings Tab */}
        {stakeAddress && activeTab === "browse" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2
                  className="text-xl font-semibold text-white"
                  style={{ fontFamily: 'Saira, sans-serif' }}
                >
                  Available Listings
                </h2>
                <p className="text-sm" style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}>
                  Sorted by how many of your Meks match the desired variations
                </p>
              </div>
            </div>

            {browseListings === undefined ? (
              <div
                className="text-center py-12"
                style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
              >
                Loading listings...
              </div>
            ) : browseListings.length === 0 ? (
              <div
                className="text-center py-12 rounded-2xl relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage: "url('/random-images/honey-png-big.webp')",
                    backgroundSize: '50%',
                    backgroundPosition: 'center',
                  }}
                />
                <div className="relative z-10">
                  <div className="text-6xl mb-4">📭</div>
                  <h3
                    className="text-xl font-semibold text-white mb-2"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    No Listings Yet
                  </h3>
                  <p style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}>
                    Be the first to list a Mek for trade!
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {browseListings.map((listing: any) => (
                  <TradeListingCard
                    key={listing._id}
                    listing={listing}
                    viewerMatchCount={listing.viewerMatchCount}
                    onMakeOffer={() => setSelectedListingForOffer(listing)}
                    showMakeOffer={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Listings Tab */}
        {stakeAddress && activeTab === "my-listings" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2
                  className="text-xl font-semibold text-white"
                  style={{ fontFamily: 'Saira, sans-serif' }}
                >
                  My Active Listings
                </h2>
                <p className="text-sm" style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}>
                  {activeListingCount !== undefined ? `${activeListingCount}/5 listings used` : "Loading..."}
                </p>
              </div>
            </div>

            {myListings === undefined ? (
              <div
                className="text-center py-12"
                style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
              >
                Loading your listings...
              </div>
            ) : myListings.length === 0 ? (
              <div
                className="text-center py-12 rounded-2xl relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage: "url('/random-images/honey-png-big.webp')",
                    backgroundSize: '50%',
                    backgroundPosition: 'center',
                  }}
                />
                <div className="relative z-10">
                  <div className="text-6xl mb-4">📦</div>
                  <h3
                    className="text-xl font-semibold text-white mb-2"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    No Active Listings
                  </h3>
                  <p className="mb-4" style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}>
                    List a Mek you want to trade and specify the variations you're looking for
                  </p>
                  <button
                    onClick={() => setShowCreateListing(true)}
                    className="px-8 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      background: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
                      color: 'black',
                      boxShadow: '0 0 30px rgba(34, 211, 238, 0.4)',
                    }}
                  >
                    Create Your First Listing
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myListings.map((listing: any) => (
                  <TradeListingCard
                    key={listing._id}
                    listing={listing}
                    isOwner={true}
                    pendingOfferCount={listing.pendingOfferCount}
                    newOfferCount={listing.newOfferCount}
                    onViewOffers={() => setSelectedListingForViewOffers(listing)}
                    onEditListing={() => setSelectedListingForEdit(listing)}
                    onCancel={() => handleCancelListing(listing._id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Offers Tab */}
        {stakeAddress && activeTab === "my-offers" && (
          <div>
            <div className="mb-6">
              <h2
                className="text-xl font-semibold text-white"
                style={{ fontFamily: 'Saira, sans-serif' }}
              >
                My Pending Offers
              </h2>
              <p className="text-sm" style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}>
                Offers you've made on other players' listings
              </p>
            </div>

            {myOffers === undefined ? (
              <div
                className="text-center py-12"
                style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
              >
                Loading your offers...
              </div>
            ) : myOffers.length === 0 ? (
              <div
                className="text-center py-12 rounded-2xl relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage: "url('/random-images/honey-png-big.webp')",
                    backgroundSize: '50%',
                    backgroundPosition: 'center',
                  }}
                />
                <div className="relative z-10">
                  <div className="text-6xl mb-4">🤝</div>
                  <h3
                    className="text-xl font-semibold text-white mb-2"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    No Pending Offers
                  </h3>
                  <p style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}>
                    Browse listings to find Meks you want and make offers
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myOffers.map((offer: any) => (
                  <OfferCard
                    key={offer._id}
                    offer={offer}
                    onWithdraw={() => handleWithdrawOffer(offer._id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sliding particles animation keyframe */}
      <style>{`
        @keyframes slideParticles {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Create Listing Lightbox */}
      {showCreateListing && stakeAddress && (
        <CreateListingLightbox
          stakeAddress={stakeAddress}
          onClose={() => setShowCreateListing(false)}
        />
      )}

      {/* Make Offer Lightbox */}
      {selectedListingForOffer && stakeAddress && (
        <MatchingMeksLightbox
          listing={selectedListingForOffer}
          viewerStakeAddress={stakeAddress}
          onClose={() => setSelectedListingForOffer(null)}
        />
      )}

      {/* View Offers Lightbox */}
      {selectedListingForViewOffers && stakeAddress && (
        <ViewOffersLightbox
          listing={selectedListingForViewOffers}
          ownerStakeAddress={stakeAddress}
          onClose={() => setSelectedListingForViewOffers(null)}
        />
      )}

      {/* Edit Listing Lightbox */}
      {selectedListingForEdit && (
        <EditListingLightbox
          listing={selectedListingForEdit}
          onClose={() => setSelectedListingForEdit(null)}
        />
      )}

      {/* Confirmation Lightbox */}
      {confirmAction && (
        <ConfirmationLightbox
          title={confirmAction.title}
          message={confirmAction.message}
          confirmText={confirmAction.type === "cancel-listing" ? "Cancel Listing" : "Withdraw"}
          confirmStyle="danger"
          onConfirm={executeConfirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
