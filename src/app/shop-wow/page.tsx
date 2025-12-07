"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { restoreWalletSession } from "@/lib/walletSessionManager";

const CATEGORIES = [
  { id: "all", name: "All" },
  { id: "essence", name: "Essence" },
  { id: "head", name: "Heads" },
  { id: "body", name: "Bodies" },
  { id: "trait", name: "Traits" },
  { id: "overexposed", name: "Over Exposed" },
];

const SORT_OPTIONS = [
  { id: "price_asc", name: "Price ↑" },
  { id: "price_desc", name: "Price ↓" },
  { id: "recent", name: "Recent" },
];

// Helper function to safely get error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

interface Listing {
  itemType: string;
  itemVariation?: string;
  quantity: number;
  pricePerUnit: number;
}

export default function ShopWoWPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // New listing form state
  const [listingType, setListingType] = useState<"essence" | "head" | "body" | "trait" | "overexposed">("essence");
  const [listingVariation, setListingVariation] = useState("");
  const [listingQuantity, setListingQuantity] = useState("1");
  const [listingPrice, setListingPrice] = useState("");
  const [essenceAmount, setEssenceAmount] = useState("1");

  // Get or create user - only for real wallet sessions
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);

  // Restore wallet session on mount (no demo fallback)
  useEffect(() => {
    const initWallet = async () => {
      const session = await restoreWalletSession();
      if (session) {
        const address = session.stakeAddress || session.walletAddress;
        if (address) {
          setWalletAddress(address);
          const user = await getOrCreateUser({ walletAddress: address });
          if (user) {
            setUserId(user._id as Id<"users">);
          }
        }
      }
    };
    initWallet();
  }, [getOrCreateUser]);

  // Get user profile
  const userProfile = useQuery(
    api.users.getUserProfile,
    walletAddress ? { walletAddress } : "skip"
  );
  
  // Get marketplace listings - PAUSED TO SAVE BANDWIDTH
  const listings = null; // useQuery(
  //   api.marketplace.getActiveListings,
  //   {
  //     itemType: selectedCategory === "all" ? undefined : selectedCategory,
  //     searchTerm: searchTerm || undefined,
  //   }
  // );
  
  // Get user's own listings
  const myListings = useQuery(
    api.marketplace.getUserListings,
    userId ? { userId } : "skip"
  );
  
  // Mutations
  const createListing = useMutation(api.marketplace.createListing);
  const purchaseItem = useMutation(api.marketplace.purchaseItem);
  const cancelListing = useMutation(api.marketplace.cancelListing);
  
  // Sort listings
  const sortedListings = listings ? [...listings].sort((a, b) => {
    switch (sortBy) {
      case "price_asc":
        return a.pricePerUnit - b.pricePerUnit;
      case "price_desc":
        return b.pricePerUnit - a.pricePerUnit;
      case "recent":
        return b.listedAt - a.listedAt;
      default:
        return 0;
    }
  }) : [];
  
  // Handle create listing
  const handleCreateListing = async () => {
    if (!userId || !listingVariation || !listingPrice) return;
    
    if (listingType === "essence" && !essenceAmount) return;
    if (listingType !== "essence" && !listingQuantity) return;
    
    try {
      const quantity = listingType === "essence" ? parseFloat(essenceAmount) : parseInt(listingQuantity);
      
      await createListing({
        sellerId: userId,
        itemType: listingType,
        itemVariation: listingVariation,
        quantity: quantity,
        pricePerUnit: parseInt(listingPrice),
      });
      
      setListingVariation("");
      setListingQuantity("1");
      setEssenceAmount("1");
      setListingPrice("");
      setShowCreateListing(false);
    } catch (error: unknown) {
      alert(getErrorMessage(error));
    }
  };
  
  // Handle purchase
  const handlePurchase = async (listingId: Id<"marketListings">) => {
    if (!userId) return;
    
    try {
      await purchaseItem({
        buyerId: userId,
        listingId,
        quantity: 1,
      });
      alert("Purchase successful!");
    } catch (error: unknown) {
      alert(getErrorMessage(error));
    }
  };
  
  // Handle cancel listing
  const handleCancelListing = async (listingId: Id<"marketListings">) => {
    if (!userId) return;
    
    try {
      await cancelListing({
        userId,
        listingId,
      });
      alert("Listing cancelled!");
    } catch (error: unknown) {
      alert(getErrorMessage(error));
    }
  };

  // Get essence image placeholder
  const getEssenceImage = (essenceName: string) => {
    const colors: Record<string, string> = {
      stone: "#808080",
      disco: "#FF00FF",
      paul: "#FFD700",
      cartoon: "#00FFFF",
      candy: "#FF69B4",
      tiles: "#4169E1",
      moss: "#228B22",
      bullish: "#FF4500",
      journalist: "#708090",
      laser: "#FF0000",
      flashbulb: "#FFFF00",
      accordion: "#8B4513",
      turret: "#2F4F4F",
      drill: "#CD853F",
      security: "#000080",
    };
    return colors[essenceName] || "#666666";
  };

  return (
    <div className="text-white min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">SHOP</h1>
            <p className="text-sm text-gray-400">Buy and sell items with other players + real world rewards</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400 mb-1">Your Balance</div>
            <div className="text-2xl font-bold text-yellow-400">{Math.floor(userProfile?.gold || 0).toLocaleString()}g</div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Sidebar - Categories & Filters */}
        <div className="w-64 bg-gray-900 border-r border-gray-800 p-4">
          <div className="mb-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search items..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 text-sm focus:border-yellow-500 focus:outline-none"
            />
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Categories</h3>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-yellow-500/20 text-yellow-400 border-l-2 border-yellow-400'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sort By</h3>
            <div className="space-y-1">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSortBy(option.id)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
                    sortBy === option.id
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowCreateListing(true)}
            className="w-full px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold rounded hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
          >
            + Create Listing
          </button>
        </div>

        {/* Main Content - Listings Table */}
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            {/* Listings Table */}
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800 text-xs uppercase text-gray-400 border-b border-gray-700">
                    <th className="py-3 px-4 text-left font-medium">Item</th>
                    <th className="py-3 px-4 text-left font-medium">Name</th>
                    <th className="py-3 px-4 text-center font-medium">Quantity</th>
                    <th className="py-3 px-4 text-right font-medium">Unit Price</th>
                    <th className="py-3 px-4 text-right font-medium">Total</th>
                    <th className="py-3 px-4 text-center font-medium">Time Left</th>
                    <th className="py-3 px-4 text-center font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedListings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        No listings found
                      </td>
                    </tr>
                  ) : (
                    sortedListings.map((listing) => {
                      const isOwn = listing.sellerId === userId;
                      const canAfford = userProfile && userProfile.gold >= (listing.pricePerUnit * listing.quantity);
                      const totalPrice = listing.itemType === 'essence' 
                        ? listing.pricePerUnit * listing.quantity
                        : listing.pricePerUnit * listing.quantity;
                      
                      return (
                        <tr 
                          key={listing._id}
                          className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                          onClick={() => setSelectedListing(listing)}
                        >
                          {/* Item Icon/Image */}
                          <td className="py-3 px-4">
                            {listing.itemType === 'essence' ? (
                              <div 
                                className="w-10 h-10 rounded-full"
                                style={{ 
                                  backgroundColor: getEssenceImage(listing.essenceType || listing.itemVariation?.split(' ')[0].toLowerCase() || 'stone'),
                                  boxShadow: `0 0 10px ${getEssenceImage(listing.essenceType || listing.itemVariation?.split(' ')[0].toLowerCase() || 'stone')}40`
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400">
                                {listing.itemType.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </td>
                          
                          {/* Name */}
                          <td className="py-3 px-4">
                            <div className="font-medium text-white">
                              {listing.itemVariation || listing.itemType}
                            </div>
                            {isOwn && (
                              <div className="text-xs text-yellow-400">Your listing</div>
                            )}
                          </td>
                          
                          {/* Quantity */}
                          <td className="py-3 px-4 text-center">
                            <span className="text-gray-300">
                              {listing.itemType === 'essence' ? `${listing.quantity}` : listing.quantity}
                            </span>
                          </td>
                          
                          {/* Unit Price */}
                          <td className="py-3 px-4 text-right">
                            <div className="text-yellow-400 font-medium">
                              {listing.itemType === 'essence' ? (
                                <div>
                                  <div>{listing.pricePerUnit.toLocaleString()}g</div>
                                  <div className="text-xs text-gray-500">per essence</div>
                                </div>
                              ) : (
                                `${listing.pricePerUnit.toLocaleString()}g`
                              )}
                            </div>
                          </td>
                          
                          {/* Total */}
                          <td className="py-3 px-4 text-right">
                            <span className="text-white font-bold">
                              {totalPrice.toLocaleString()}g
                            </span>
                          </td>
                          
                          {/* Time Left */}
                          <td className="py-3 px-4 text-center text-sm text-gray-400">
                            {listing.expiresAt ? (
                              <div>
                                {Math.ceil((listing.expiresAt - Date.now()) / (1000 * 60 * 60))}h
                              </div>
                            ) : (
                              '--'
                            )}
                          </td>
                          
                          {/* Action */}
                          <td className="py-3 px-4 text-center">
                            {isOwn ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelListing(listing._id);
                                }}
                                className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded text-sm transition-all"
                              >
                                Cancel
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePurchase(listing._id);
                                }}
                                disabled={!canAfford}
                                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                                  canAfford
                                    ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                Buy
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* My Listings Section */}
            {myListings && myListings.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-bold text-yellow-400 mb-4">Your Active Listings</h2>
                <div className="bg-gray-900 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-800 text-xs uppercase text-gray-400 border-b border-gray-700">
                        <th className="py-2 px-4 text-left">Item</th>
                        <th className="py-2 px-4 text-center">Qty</th>
                        <th className="py-2 px-4 text-right">Price</th>
                        <th className="py-2 px-4 text-center">Listed</th>
                        <th className="py-2 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myListings.map((listing) => (
                        <tr key={listing._id} className="border-b border-gray-800">
                          <td className="py-2 px-4 text-sm">{listing.itemVariation || listing.itemType}</td>
                          <td className="py-2 px-4 text-center text-sm">{listing.quantity}</td>
                          <td className="py-2 px-4 text-right text-sm text-yellow-400">{listing.pricePerUnit}g</td>
                          <td className="py-2 px-4 text-center text-xs text-gray-500">
                            {new Date(listing.listedAt).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-4 text-center">
                            <button
                              onClick={() => handleCancelListing(listing._id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Selected Item Details (Optional) */}
        {selectedListing && (
          <div className="w-80 bg-gray-900 border-l border-gray-800 p-4">
            <h3 className="text-lg font-bold text-yellow-400 mb-4">Item Details</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500 uppercase">Type</div>
                <div className="text-white">{selectedListing.itemType}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Name</div>
                <div className="text-white font-medium">{selectedListing.itemVariation || selectedListing.itemType}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Quantity</div>
                <div className="text-white">{selectedListing.quantity}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Price</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {(selectedListing.pricePerUnit * selectedListing.quantity).toLocaleString()}g
                </div>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="w-full mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Listing Modal */}
      {showCreateListing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">Create New Listing</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Item Type</label>
                <select
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value as "essence" | "head" | "body" | "trait" | "overexposed")}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none"
                >
                  <option value="essence">Essence</option>
                  <option value="head">Head</option>
                  <option value="body">Body</option>
                  <option value="trait">Trait</option>
                  <option value="overexposed">Over Exposed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Item Name</label>
                <input
                  type="text"
                  value={listingVariation}
                  onChange={(e) => setListingVariation(e.target.value)}
                  placeholder="e.g., Chrome, Stone Essence"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                />
              </div>
              
              {listingType === "essence" ? (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Essence Amount</label>
                    <input
                      type="number"
                      value={essenceAmount}
                      onChange={(e) => setEssenceAmount(e.target.value)}
                      min="0.1"
                      step="0.1"
                      placeholder="e.g., 0.5, 1.2"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Gold per 1 Essence</label>
                    <input
                      type="number"
                      value={listingPrice}
                      onChange={(e) => setListingPrice(e.target.value)}
                      min="1"
                      placeholder="e.g., 1000"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Quantity</label>
                    <input
                      type="number"
                      value={listingQuantity}
                      onChange={(e) => setListingQuantity(e.target.value)}
                      min="1"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Price Per Unit</label>
                    <input
                      type="number"
                      value={listingPrice}
                      onChange={(e) => setListingPrice(e.target.value)}
                      min="1"
                      placeholder="Enter price in gold"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                </>
              )}
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateListing}
                  className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded transition-all"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateListing(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}