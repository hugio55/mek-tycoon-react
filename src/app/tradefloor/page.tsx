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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white">
      {/* Header */}
      <div className="border-b border-yellow-500/30 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-yellow-400 tracking-wider font-orbitron uppercase">
            Trade Floor
          </h1>
          <p className="text-gray-400 mt-1">
            List your Meks for trade and find others looking for variations you have
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium tracking-wide transition-all relative ${
                  activeTab === tab.id
                    ? "text-yellow-400 bg-yellow-500/10"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500" />
                )}
                {/* Badge for my-offers showing pending count */}
                {tab.id === "my-offers" && myOffers && myOffers.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                    {myOffers.length}
                  </span>
                )}
                {/* Badge for my-listings showing listing count */}
                {tab.id === "my-listings" && myListings && myListings.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                    {myListings.length}/5
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Not logged in message */}
        {!stakeAddress && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-500">
              Connect your wallet to browse listings and make trade offers
            </p>
          </div>
        )}

        {/* Browse Listings Tab */}
        {stakeAddress && activeTab === "browse" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Available Listings</h2>
                <p className="text-sm text-gray-400">
                  Sorted by how many of your Meks match the desired variations
                </p>
              </div>
            </div>

            {browseListings === undefined ? (
              <div className="text-center py-12 text-gray-400">Loading listings...</div>
            ) : browseListings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Listings Yet</h3>
                <p className="text-gray-500">Be the first to list a Mek for trade!</p>
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
                <h2 className="text-xl font-semibold text-white">My Active Listings</h2>
                <p className="text-sm text-gray-400">
                  {activeListingCount !== undefined ? `${activeListingCount}/5 listings used` : "Loading..."}
                </p>
              </div>
              <button
                onClick={() => setShowCreateListing(true)}
                disabled={activeListingCount !== undefined && activeListingCount >= 5}
                className={`px-4 py-2 rounded font-medium transition-all ${
                  activeListingCount !== undefined && activeListingCount >= 5
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-yellow-500 hover:bg-yellow-400 text-black"
                }`}
              >
                + Create Listing
              </button>
            </div>

            {myListings === undefined ? (
              <div className="text-center py-12 text-gray-400">Loading your listings...</div>
            ) : myListings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Active Listings</h3>
                <p className="text-gray-500 mb-4">
                  List a Mek you want to trade and specify the variations you're looking for
                </p>
                <button
                  onClick={() => setShowCreateListing(true)}
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-medium rounded transition-all"
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
              <h2 className="text-xl font-semibold text-white">My Pending Offers</h2>
              <p className="text-sm text-gray-400">
                Offers you've made on other players' listings
              </p>
            </div>

            {myOffers === undefined ? (
              <div className="text-center py-12 text-gray-400">Loading your offers...</div>
            ) : myOffers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🤝</div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Pending Offers</h3>
                <p className="text-gray-500">
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
