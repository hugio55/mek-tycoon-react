"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import TradeListingCard from "@/components/tradefloor/TradeListingCard";
import CreateListingLightbox from "@/components/tradefloor/CreateListingLightbox";
import MatchingMeksLightbox from "@/components/tradefloor/MatchingMeksLightbox";
import ViewOffersLightbox from "@/components/tradefloor/ViewOffersLightbox";
import OfferCard from "@/components/tradefloor/OfferCard";

type Tab = "browse" | "my-listings" | "my-offers";

export default function TradeFloorPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [stakeAddress, setStakeAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("browse");
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [selectedListingForOffer, setSelectedListingForOffer] = useState<any>(null);
  const [selectedListingForViewOffers, setSelectedListingForViewOffers] = useState<any>(null);

  // Load user from localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem("mekTycoonUserId");
    const storedStakeAddress = localStorage.getItem("mekTycoonStakeAddress");
    if (storedUserId) {
      setUserId(storedUserId as Id<"users">);
    }
    if (storedStakeAddress) {
      setStakeAddress(storedStakeAddress);
    }
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

  const handleCancelListing = async (listingId: Id<"tradeListings">) => {
    if (!stakeAddress) return;
    if (!confirm("Are you sure you want to cancel this listing? All pending offers will be notified.")) {
      return;
    }
    try {
      await cancelListing({ listingId, ownerStakeAddress: stakeAddress });
    } catch (error) {
      console.error("Failed to cancel listing:", error);
      alert("Failed to cancel listing. Please try again.");
    }
  };

  const handleWithdrawOffer = async (offerId: Id<"tradeOffers">) => {
    if (!stakeAddress) return;
    if (!confirm("Are you sure you want to withdraw this offer?")) {
      return;
    }
    try {
      await withdrawOffer({ offerId, offererStakeAddress: stakeAddress });
    } catch (error) {
      console.error("Failed to withdraw offer:", error);
      alert("Failed to withdraw offer. Please try again.");
    }
  };

  const tabs = [
    { id: "browse" as Tab, label: "Browse Listings" },
    { id: "my-listings" as Tab, label: "My Listings" },
    { id: "my-offers" as Tab, label: "My Offers" },
  ];

  const canCreateListing = activeListingCount !== undefined && activeListingCount < 5;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(34, 211, 238, 0.08) 0%, transparent 50%)',
        }}
      />

      {/* Header */}
      <div
        className="relative border-b"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1
            className="text-3xl font-bold text-white tracking-wider uppercase"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            Trade Floor
          </h1>
          <p
            className="text-white/60 mt-1"
            style={{ fontFamily: 'Play, sans-serif' }}
          >
            List your Meks for trade and find others looking for variations you have
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className="relative border-b"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
          borderColor: 'rgba(255,255,255,0.1)',
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
                  color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.5)',
                  background: activeTab === tab.id
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))'
                    : 'transparent',
                }}
              >
                {/* Honeycomb hover effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-300 pointer-events-none"
                  style={{
                    backgroundImage: "url('/random-images/honey-png-big.webp')",
                    backgroundSize: '100%',
                    backgroundPosition: 'center',
                  }}
                />
                <span className="relative z-10">{tab.label}</span>
                {activeTab === tab.id && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: 'linear-gradient(90deg, #22d3ee, #22d3ee)' }}
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
            className="text-center py-12 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div className="text-6xl mb-4">🔒</div>
            <h2
              className="text-2xl font-bold text-white mb-2"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              Connect Your Wallet
            </h2>
            <p className="text-white/50" style={{ fontFamily: 'Play, sans-serif' }}>
              Connect your wallet to browse listings and make trade offers
            </p>
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
                <p className="text-sm text-white/50" style={{ fontFamily: 'Play, sans-serif' }}>
                  Sorted by how many of your Meks match the desired variations
                </p>
              </div>
            </div>

            {browseListings === undefined ? (
              <div className="text-center py-12 text-white/50">Loading listings...</div>
            ) : browseListings.length === 0 ? (
              <div
                className="text-center py-12 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div className="text-6xl mb-4">📭</div>
                <h3
                  className="text-xl font-semibold text-white mb-2"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  No Listings Yet
                </h3>
                <p className="text-white/50" style={{ fontFamily: 'Play, sans-serif' }}>
                  Be the first to list a Mek for trade!
                </p>
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
                <p className="text-sm text-white/50" style={{ fontFamily: 'Play, sans-serif' }}>
                  {activeListingCount !== undefined ? `${activeListingCount}/5 listings used` : "Loading..."}
                </p>
              </div>
            </div>

            {myListings === undefined ? (
              <div className="text-center py-12 text-white/50">Loading your listings...</div>
            ) : myListings.length === 0 ? (
              <div
                className="text-center py-12 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div className="text-6xl mb-4">📦</div>
                <h3
                  className="text-xl font-semibold text-white mb-2"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  No Active Listings
                </h3>
                <p className="text-white/50 mb-4" style={{ fontFamily: 'Play, sans-serif' }}>
                  List a Mek you want to trade and specify the variations you're looking for
                </p>
                <button
                  onClick={() => setShowCreateListing(true)}
                  className="px-8 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    background: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
                    color: 'black',
                    boxShadow: '0 0 30px rgba(34, 211, 238, 0.3)',
                  }}
                >
                  Create Your First Listing
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myListings.map((listing: any) => (
                  <TradeListingCard
                    key={listing._id}
                    listing={listing}
                    isOwner={true}
                    pendingOfferCount={listing.pendingOfferCount}
                    onViewOffers={() => setSelectedListingForViewOffers(listing)}
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
              <p className="text-sm text-white/50" style={{ fontFamily: 'Play, sans-serif' }}>
                Offers you've made on other players' listings
              </p>
            </div>

            {myOffers === undefined ? (
              <div className="text-center py-12 text-white/50">Loading your offers...</div>
            ) : myOffers.length === 0 ? (
              <div
                className="text-center py-12 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div className="text-6xl mb-4">🤝</div>
                <h3
                  className="text-xl font-semibold text-white mb-2"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  No Pending Offers
                </h3>
                <p className="text-white/50" style={{ fontFamily: 'Play, sans-serif' }}>
                  Browse listings to find Meks you want and make offers
                </p>
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

      {/* Floating Create Listing Button - Always visible when logged in */}
      {stakeAddress && (
        <button
          onClick={() => setShowCreateListing(true)}
          disabled={!canCreateListing}
          className="fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl font-semibold transition-all hover:scale-[1.05] active:scale-[0.98] flex items-center gap-3 group"
          style={{
            fontFamily: 'Inter, sans-serif',
            background: canCreateListing
              ? 'linear-gradient(135deg, #22d3ee, #06b6d4)'
              : 'rgba(255,255,255,0.1)',
            color: canCreateListing ? 'black' : 'rgba(255,255,255,0.3)',
            boxShadow: canCreateListing
              ? '0 0 40px rgba(34, 211, 238, 0.4), 0 10px 40px rgba(0,0,0,0.3)'
              : 'none',
            cursor: canCreateListing ? 'pointer' : 'not-allowed',
          }}
        >
          <span className="text-2xl">+</span>
          <span>Create Listing</span>
          {activeListingCount !== undefined && (
            <span
              className="px-2 py-0.5 rounded-full text-xs"
              style={{
                background: canCreateListing ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)',
              }}
            >
              {activeListingCount}/5
            </span>
          )}
        </button>
      )}

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
    </div>
  );
}
