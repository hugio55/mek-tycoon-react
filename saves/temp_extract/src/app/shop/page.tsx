"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import CreateListingModal from "@/components/CreateListingModal";

const CATEGORIES = [
  { id: "head", name: "Heads" },
  { id: "body", name: "Bodies" },
  { id: "trait", name: "Traits" },
  { id: "essence", name: "Essence" },
  { id: "overexposed", name: "OE Signatures" },
];

const SORT_OPTIONS = [
  { id: "price_asc", name: "Price: Low to High" },
  { id: "price_desc", name: "Price: High to Low" },
  { id: "recent", name: "Recently Listed" },
  { id: "ending_soon", name: "Ending Soon" },
];

export default function ShopPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("head");
  const [sortBy, setSortBy] = useState("recent");
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyMyListings, setShowOnlyMyListings] = useState(false);
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [particles, setParticles] = useState<Array<{id: number, left: string, top: string, delay: string, duration: string}>>([]);
  const [stars, setStars] = useState<Array<{id: number, left: string, top: string, size: number, opacity: number, twinkle: boolean}>>([]);
  
  // New listing form state
  const [listingType, setListingType] = useState<"essence" | "head" | "body" | "trait" | "overexposed">("essence");
  const [listingVariation, setListingVariation] = useState("");
  const [listingQuantity, setListingQuantity] = useState("1");
  const [listingPrice, setListingPrice] = useState("");
  const [essenceAmount, setEssenceAmount] = useState("1"); // For essence listings (decimal amounts)
  
  // Get or create user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  
  useEffect(() => {
    const initUser = async () => {
      const user = await getOrCreateUser({ 
        walletAddress: "demo_wallet_123" 
      });
      if (user) {
        setUserId(user._id as Id<"users">);
      }
    };
    initUser();
    
    // Generate background effects
    const generatedParticles = [...Array(20)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
      duration: `${5 + Math.random() * 5}s`,
    }));
    setParticles(generatedParticles);
    
    const generatedStars = [...Array(60)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() > 0.5,
    }));
    setStars(generatedStars);
  }, [getOrCreateUser]);
  
  // Get user profile
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { walletAddress: "demo_wallet_123" } : "skip"
  );
  
  // Get marketplace listings
  const listingsData = useQuery(
    api.marketplace.getActiveListings,
    { 
      itemType: selectedCategory,
      searchTerm: searchTerm || undefined,
      limit: 100,
      offset: 0,
    }
  );
  
  const listings = listingsData?.listings;
  
  // Check listings for each category to enable auto-selection
  const headsListings = useQuery(
    api.marketplace.getActiveListings,
    { itemType: "head", limit: 1, offset: 0 }
  );
  const bodiesListings = useQuery(
    api.marketplace.getActiveListings,
    { itemType: "body", limit: 1, offset: 0 }
  );
  const traitsListings = useQuery(
    api.marketplace.getActiveListings,
    { itemType: "trait", limit: 1, offset: 0 }
  );
  const essenceListings = useQuery(
    api.marketplace.getActiveListings,
    { itemType: "essence", limit: 1, offset: 0 }
  );
  const oeListings = useQuery(
    api.marketplace.getActiveListings,
    { itemType: "overexposed", limit: 1, offset: 0 }
  );
  
  // Auto-select first category with items if current has none
  useEffect(() => {
    if (listings && listings.length === 0 && !searchTerm) {
      // Check categories in order: head, body, trait, essence, overexposed
      if (selectedCategory === "head" && bodiesListings?.listings && bodiesListings.listings.length > 0) {
        setSelectedCategory("body");
      } else if ((selectedCategory === "head" || selectedCategory === "body") && traitsListings?.listings && traitsListings.listings.length > 0) {
        setSelectedCategory("trait");
      } else if ((selectedCategory === "head" || selectedCategory === "body" || selectedCategory === "trait") && essenceListings?.listings && essenceListings.listings.length > 0) {
        setSelectedCategory("essence");
      } else if ((selectedCategory === "head" || selectedCategory === "body" || selectedCategory === "trait" || selectedCategory === "essence") && oeListings?.listings && oeListings.listings.length > 0) {
        setSelectedCategory("overexposed");
      }
    }
  }, [listings, selectedCategory, searchTerm, bodiesListings, traitsListings, essenceListings, oeListings]);
  
  // Get user's own listings
  const myListings = useQuery(
    api.marketplace.getUserListings,
    userId ? { userId } : "skip"
  );
  
  // Mutations
  const createListing = useMutation(api.marketplace.createListing);
  const purchaseItem = useMutation(api.marketplace.purchaseItem);
  const cancelListing = useMutation(api.marketplace.cancelListing);
  
  // Filter for user's listings if needed
  const filteredListings = listings ? (
    showOnlyMyListings 
      ? listings.filter(l => l.sellerId === userId)
      : listings
  ) : [];
  
  // Sort listings
  const sortedListings = filteredListings.sort((a, b) => {
    switch (sortBy) {
      case "price_asc":
        return a.pricePerUnit - b.pricePerUnit;
      case "price_desc":
        return b.pricePerUnit - a.pricePerUnit;
      case "recent":
        return b.listedAt - a.listedAt;
      case "ending_soon":
        const aExpiry = a.expiresAt || Number.MAX_VALUE;
        const bExpiry = b.expiresAt || Number.MAX_VALUE;
        return aExpiry - bExpiry;
      default:
        return 0;
    }
  });
  
  // Handle create listing
  const handleCreateListing = async (data: {
    itemType: string;
    itemVariation: string;
    quantity: number;
    pricePerUnit: number;
  }) => {
    if (!userId) return;
    
    try {
      // Deduct listing fee (2% of total value)
      const fee = Math.ceil(data.quantity * data.pricePerUnit * 0.02);
      
      await createListing({
        sellerId: userId,
        itemType: data.itemType,
        itemVariation: data.itemVariation,
        quantity: data.quantity,
        pricePerUnit: data.pricePerUnit,
      });
      
      setShowCreateListing(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred');
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
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred');
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
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Gradient orbs */}
        <div 
          className="absolute left-0 top-0 w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(250, 182, 23, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(250, 182, 23, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(250, 182, 23, 0.08) 0%, transparent 70%)
            `
          }}
        />
        
        {/* Pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 35px,
                rgba(250, 182, 23, 0.03) 35px,
                rgba(250, 182, 23, 0.03) 70px
              )
            `,
          }}
        />
        
        {/* Stars */}
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animation: star.twinkle ? `starTwinkle ${2 + Math.random() * 2}s ease-in-out infinite` : 'none',
              animationDelay: star.twinkle ? `${Math.random() * 2}s` : '0s',
            }}
          />
        ))}
        
        {/* Floating particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full"
            style={{
              left: particle.left,
              top: particle.top,
              animation: `floatParticle ${particle.duration} ease-in-out infinite`,
              animationDelay: particle.delay,
              boxShadow: '0 0 6px rgba(250, 182, 23, 0.6)',
            }}
          />
        ))}
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 py-6">
        {/* Title Section */}
        <div 
          className="relative mb-6 rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
            border: '2px solid #fab617',
            boxShadow: '0 0 30px rgba(250, 182, 23, 0.4)',
            padding: '28px'
          }}
        >
          {/* Inner accent border */}
          <div 
            className="absolute inset-[2px] rounded-xl pointer-events-none"
            style={{
              border: '1px solid #00ff88',
              opacity: 0.4
            }}
          />
          
          <div className="relative flex justify-between items-center">
            <div>
              <h1 
                style={{
                  fontFamily: "'Orbitron', 'Rajdhani', 'Bebas Neue', sans-serif",
                  fontSize: '42px',
                  fontWeight: 900,
                  color: '#fab617',
                  letterSpacing: '0.1em',
                  textShadow: '0 0 25px rgba(250, 182, 23, 0.7)',
                  marginBottom: '8px'
                }}
              >
                SHOP
              </h1>
              <p 
                style={{
                  fontSize: '12px',
                  color: '#999',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3em',
                  fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace"
                }}
              >
                Buy and sell items with other players + real world rewards
              </p>
            </div>
            
            {/* User Gold Display */}
            <div className="text-right">
              <div 
                style={{
                  fontSize: '14px',
                  color: '#fab617',
                  opacity: 0.7,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  marginBottom: '4px'
                }}
              >
                Your Balance
              </div>
              <div 
                style={{ 
                  fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                  fontSize: '42px',
                  fontWeight: 200,
                  color: '#fab617',
                  letterSpacing: '1px',
                  lineHeight: '1',
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: '0 0 15px rgba(250, 182, 23, 0.5)',
                }}
              >
                {Math.floor(userProfile?.gold || 0).toLocaleString()}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: '#fab617',
                  opacity: 0.6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  marginTop: '2px'
                }}
              >
                GOLD
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search shop..."
              className="flex-1 px-4 py-3 bg-gray-900/80 border border-yellow-500/30 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-all"
              style={{
                boxShadow: searchTerm ? '0 0 20px rgba(250, 182, 23, 0.2)' : 'none'
              }}
            />
            <button
              onClick={() => setShowCreateListing(true)}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
              style={{
                fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
                letterSpacing: '0.05em'
              }}
            >
              + Create Listing
            </button>
          </div>
          
          {/* Category Filters */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                    : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700/80 border border-gray-700'
                }`}
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
          
          {/* Sort Options and Filter */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              <span className="text-gray-400 text-sm py-2">Sort by:</span>
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSortBy(option.id)}
                  className={`px-3 py-1 text-sm rounded-lg transition-all ${
                    sortBy === option.id
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {option.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowOnlyMyListings(!showOnlyMyListings)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                showOnlyMyListings
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                  : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700/80 border border-gray-700'
              }`}
              style={{
                fontFamily: "'Rajdhani', sans-serif",
              }}
            >
              {showOnlyMyListings ? '✓ My Listings' : 'My Listings'}
            </button>
          </div>
        </div>
        
        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedListings.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4 opacity-50">[ ]</div>
              <div className="text-xl text-gray-400">No listings found</div>
              <div className="text-sm text-gray-500 mt-2">Try adjusting your search or filters</div>
            </div>
          ) : (
            sortedListings.map((listing) => {
              const isOwn = listing.sellerId === userId;
              const canAfford = userProfile && userProfile.gold >= listing.pricePerUnit;
              const isOverexposed = listing.itemType === 'overexposed';
              
              return (
                <div
                  key={listing._id}
                  className={`relative bg-gray-900/80 border border-gray-700 rounded-lg p-4 hover:border-yellow-500/50 transition-all group ${
                    isOverexposed ? 'md:col-span-2 lg:col-span-2 xl:col-span-2' : ''
                  }`}
                  style={{
                    background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(42, 42, 42, 0.9) 100%)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  {/* Shimmer effect on hover */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      background: 'linear-gradient(105deg, transparent 40%, rgba(250, 182, 23, 0.1) 50%, transparent 60%)',
                      animation: 'shimmer 2s infinite'
                    }}
                  />
                  
                  {isOwn && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded font-bold">
                      YOUR LISTING
                    </div>
                  )}
                  
                  <div className={`relative ${isOverexposed ? 'flex gap-4' : ''}`}>
                    {/* Item Thumbnail */}
                    <div className={`flex justify-center ${isOverexposed ? 'flex-shrink-0' : 'mb-3'}`}>
                      {listing.imageUrl ? (
                        <img 
                          src={listing.imageUrl} 
                          alt={listing.itemVariation} 
                          className={`${isOverexposed ? 'w-24 h-24' : 'w-16 h-16'} object-cover rounded-lg`}
                        />
                      ) : listing.itemType === 'essence' ? (
                        <div 
                          className="w-16 h-16 rounded-full"
                          style={{ 
                            background: `radial-gradient(circle, ${
                              listing.essenceType === 'stone' ? '#808080' :
                              listing.essenceType === 'disco' ? '#FF00FF' :
                              listing.essenceType === 'paul' ? '#FFD700' :
                              listing.essenceType === 'cartoon' ? '#00FFFF' :
                              listing.essenceType === 'candy' ? '#FF69B4' :
                              listing.essenceType === 'tiles' ? '#4169E1' :
                              listing.essenceType === 'moss' ? '#228B22' :
                              listing.essenceType === 'bullish' ? '#FF4500' :
                              listing.essenceType === 'journalist' ? '#708090' :
                              listing.essenceType === 'laser' ? '#FF0000' :
                              listing.essenceType === 'flashbulb' ? '#FFFF00' :
                              listing.essenceType === 'accordion' ? '#8B4513' :
                              listing.essenceType === 'turret' ? '#2F4F4F' :
                              listing.essenceType === 'drill' ? '#CD853F' :
                              listing.essenceType === 'security' ? '#000080' : '#666666'
                            }, transparent)`,
                            boxShadow: `0 0 20px ${
                              listing.essenceType === 'stone' ? '#808080' :
                              listing.essenceType === 'disco' ? '#FF00FF' :
                              listing.essenceType === 'paul' ? '#FFD700' :
                              listing.essenceType === 'cartoon' ? '#00FFFF' :
                              listing.essenceType === 'candy' ? '#FF69B4' :
                              listing.essenceType === 'tiles' ? '#4169E1' :
                              listing.essenceType === 'moss' ? '#228B22' :
                              listing.essenceType === 'bullish' ? '#FF4500' :
                              listing.essenceType === 'journalist' ? '#708090' :
                              listing.essenceType === 'laser' ? '#FF0000' :
                              listing.essenceType === 'flashbulb' ? '#FFFF00' :
                              listing.essenceType === 'accordion' ? '#8B4513' :
                              listing.essenceType === 'turret' ? '#2F4F4F' :
                              listing.essenceType === 'drill' ? '#CD853F' :
                              listing.essenceType === 'security' ? '#000080' : '#666666'
                            }40`
                          }}
                        />
                      ) : (
                        <div 
                          className={`${isOverexposed ? 'w-24 h-24 text-3xl' : 'w-16 h-16 text-2xl'} rounded-lg flex items-center justify-center font-bold text-black`}
                          style={{ 
                            background: 
                              listing.itemType === 'head' ? 'linear-gradient(135deg, #fab617 0%, #d4a017 100%)' :
                              listing.itemType === 'body' ? 'linear-gradient(135deg, #808080 0%, #606060 100%)' :
                              listing.itemType === 'trait' ? 'linear-gradient(135deg, #fab617 0%, #ffdd00 100%)' :
                              listing.itemType === 'overexposed' ? 'linear-gradient(135deg, #ffdd00 0%, #fab617 100%)' :
                              'linear-gradient(135deg, #fab617 0%, #d4a017 100%)',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                          }}
                        >
                          {listing.itemType === 'head' ? 'H' :
                           listing.itemType === 'body' ? 'B' :
                           listing.itemType === 'trait' ? 'T' :
                           listing.itemType === 'overexposed' ? 'OE' : '?'}
                        </div>
                      )}
                    </div>
                    
                    {/* Content wrapper for overexposed items */}
                    <div className={isOverexposed ? 'flex-1' : ''}>
                      {/* Item Type Badge - only for non-essence */}
                      {listing.itemType !== 'essence' && (
                        <div className={`text-xs uppercase tracking-wider mb-3 ${isOverexposed ? 'text-left' : 'text-center'} text-gray-400`}>
                          {listing.itemType}
                        </div>
                      )}
                      
                      {/* Item Details */}
                      <div className="mb-3">
                        <div className={`font-bold text-yellow-400 capitalize ${isOverexposed ? 'text-left text-lg' : 'text-center'}`}>
                          {listing.itemVariation || listing.itemType}
                        </div>
                        {listing.itemDescription && (
                          <div className={`text-xs text-gray-400 mt-1 ${isOverexposed ? 'text-left' : 'text-center px-2'}`}>
                            {listing.itemDescription}
                          </div>
                        )}
                        {listing.itemType !== 'essence' && listing.quantity > 1 && (
                          <div className={`text-sm text-gray-400 ${isOverexposed ? 'text-left' : 'text-center'}`}>
                            Quantity: {listing.quantity}
                          </div>
                        )}
                        
                        {/* Additional details for overexposed items */}
                        {isOverexposed && (
                          <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                            <div className="text-xs text-yellow-400 font-semibold mb-2">OE SIGNATURE COLLECTION</div>
                            <div className="text-xs text-gray-300 space-y-1">
                              <div>• Rare Over Exposed signature NFT</div>
                              <div>• Enhanced stats and special abilities</div>
                              <div>• Limited availability in the marketplace</div>
                              {listing.sellerId && (
                                <div className="pt-2 border-t border-yellow-500/20 mt-2">
                                  <span className="text-gray-400">Seller ID: </span>
                                  <span className="text-yellow-400 font-mono">{listing.sellerId.slice(-6)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    
                      {/* Price */}
                      <div className="mb-3 p-2 bg-black/50 rounded">
                        <div className="text-xs text-gray-400">Price per unit</div>
                        {listing.itemType === 'essence' ? (
                          <>
                            <div className="text-xl font-bold text-yellow-400">
                              {listing.pricePerUnit.toLocaleString()}g
                            </div>
                            <div className="text-xs text-gray-400">
                              / 1 essence
                            </div>
                            <div className="text-sm text-gray-300 mt-2 border-t border-gray-700 pt-2">
                              <div className="text-xs text-gray-400 mb-1">TOTAL</div>
                              <div className="font-bold text-yellow-400">
                                {(listing.pricePerUnit * listing.quantity).toLocaleString()}g
                              </div>
                              <div className="text-xs text-gray-400">
                                for {listing.quantity} essence
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-xl font-bold text-yellow-400">
                            {listing.pricePerUnit.toLocaleString()}g
                          </div>
                        )}
                      </div>
                      
                      {/* Time Left */}
                      {listing.expiresAt && (
                        <div className={`text-xs text-gray-500 mb-3 ${isOverexposed ? 'text-left' : ''}`}>
                          Expires: {new Date(listing.expiresAt).toLocaleDateString()}
                        </div>
                      )}
                      
                      {/* Action Button */}
                      {isOwn ? (
                        <button
                          onClick={() => handleCancelListing(listing._id)}
                          className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded transition-all"
                        >
                          Cancel Listing
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePurchase(listing._id)}
                          disabled={!canAfford}
                          className={`w-full px-4 py-2 font-bold rounded transition-all ${
                            canAfford
                              ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-black hover:shadow-lg hover:shadow-yellow-500/30'
                              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {canAfford ? 'Buy Now' : 'Insufficient Gold'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* My Listings Section */}
        {myListings && myListings.length > 0 && (
          <div className="mt-8">
            <h2 
              className="text-2xl font-bold mb-4"
              style={{
                color: '#fab617',
                textShadow: '0 0 15px rgba(250, 182, 23, 0.5)',
                fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
              }}
            >
              Your Active Listings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myListings.map((listing) => (
                <div
                  key={listing._id}
                  className="bg-gray-900/80 border border-yellow-500/30 rounded-lg p-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(42, 42, 42, 0.9) 100%)',
                    boxShadow: '0 0 20px rgba(250, 182, 23, 0.2)'
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-yellow-400">
                        {listing.itemVariation || listing.itemType}
                      </div>
                      <div className="text-sm text-gray-400">
                        {listing.quantity}x @ {listing.pricePerUnit}g each
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Listed {new Date(listing.listedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancelListing(listing._id)}
                    className="w-full px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Listing Modal */}
        <CreateListingModal
          show={showCreateListing}
          onClose={() => setShowCreateListing(false)}
          onCreate={handleCreateListing}
          userEssence={userProfile?.totalEssence}
          userGold={userProfile?.gold}
        />
      </div>
    </div>
  );
}