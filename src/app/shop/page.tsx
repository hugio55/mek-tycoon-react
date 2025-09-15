"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import CreateListingModal from "@/components/CreateListingModal";
import GlobalBackground from "@/components/GlobalBackground";

const CATEGORIES = [
  { id: "mek-chips", name: "Mek Chips", hasDropdown: true, subcategories: [
    { id: "head", name: "Heads" },
    { id: "body", name: "Bodies" },
    { id: "trait", name: "Traits" },
  ]},
  { id: "universal-chips", name: "Universal Chips" },
  { id: "essence", name: "Essence" },
  { id: "frames", name: "Frames" },
  { id: "oem", name: "OEM" },
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
  const [showMekChipsDropdown, setShowMekChipsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // New listing form state
  const [listingType, setListingType] = useState<"essence" | "head" | "body" | "trait" | "overexposed" | "universal-chips" | "frames" | "oem">("essence");
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
  }, [getOrCreateUser]);
  
  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMekChipsDropdown(false);
      }
    };
    
    if (showMekChipsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMekChipsDropdown]);
  
  // Get user profile
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { walletAddress: "demo_wallet_123" } : "skip"
  );
  
  // Get marketplace listings - PAUSED TO SAVE BANDWIDTH
  const listingsData = null; // useQuery(
  //   api.marketplace.getActiveListings,
  //   {
  //     itemType: selectedCategory,
  //     searchTerm: searchTerm || undefined,
  //     limit: 100,
  //     offset: 0,
  //   }
  // );
  
  const listings = listingsData?.listings;
  
  // Check listings for each category to enable auto-selection - PAUSED TO SAVE BANDWIDTH
  const headsListings = null; // useQuery(
  //   api.marketplace.getActiveListings,
  //   { itemType: "head", limit: 1, offset: 0 }
  // );
  const bodiesListings = null; // useQuery(
  //   api.marketplace.getActiveListings,
  //   { itemType: "body", limit: 1, offset: 0 }
  // );
  const traitsListings = null; // useQuery(
  //   api.marketplace.getActiveListings,
  //   { itemType: "trait", limit: 1, offset: 0 }
  // );
  const essenceListings = null; // useQuery(
  //   api.marketplace.getActiveListings,
  //   { itemType: "essence", limit: 1, offset: 0 }
  // );
  const oeListings = null; // useQuery(
  //   api.marketplace.getActiveListings,
  //   { itemType: "overexposed", limit: 1, offset: 0 }
  // );
  const universalListings = null; // useQuery(
  //   api.marketplace.getActiveListings,
  //   { itemType: "universal-chips", limit: 1, offset: 0 }
  // );
  const oemListings = null; // useQuery(
  //   api.marketplace.getActiveListings,
  //   { itemType: "oem", limit: 1, offset: 0 }
  // );
  const framesListings = null; // useQuery(
  //   api.marketplace.getActiveListings,
  //   { itemType: "frames", limit: 1, offset: 0 }
  // );
  
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
  const seedMarketplace = useMutation(api.seedMarketplace.seedMarketplaceListings);
  
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
    console.log('Purchase clicked for listing:', listingId);
    if (!userId) {
      alert('Please wait for user initialization...');
      return;
    }
    
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
    console.log('Cancel clicked for listing:', listingId);
    if (!userId) {
      alert('Please wait for user initialization...');
      return;
    }
    
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
    <div className="min-h-screen text-white overflow-hidden relative">
      <GlobalBackground />
      
      {/* Main Content */}
      <div className="relative z-10 py-6">
        {/* Title Section - Military Command Panel */}
        <div className="relative mb-6 mek-card-industrial mek-border-sharp-gold mek-corner-cut p-7 mek-glow-yellow">
          {/* Hazard Stripes Header */}
          <div className="absolute top-0 left-0 right-0 h-3 mek-overlay-hazard-stripes opacity-60" />
          
          {/* Grunge Overlays */}
          <div className="absolute inset-0 mek-overlay-scratches pointer-events-none" />
          <div className="absolute inset-0 mek-overlay-rust pointer-events-none" />
          
          {/* Tech Grid Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 mek-overlay-metal-texture" />
          </div>
          
          <div className="relative flex justify-between items-center">
            <div>
              <h1 className="mek-text-industrial text-5xl text-yellow-400 mek-text-shadow mb-2">
                EQUIPMENT EXCHANGE
              </h1>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <p className="mek-label-uppercase text-green-400">
                  MARKETPLACE ACTIVE
                </p>
              </div>
            </div>
            
            {/* User Gold Display - Military HUD Style */}
            <div className="relative bg-black/60 border border-yellow-500/30 rounded px-6 py-3 mek-overlay-diagonal-stripes">
              <div className="relative">
                <div className="mek-label-uppercase text-yellow-400/70 mb-1">
                  CREDITS AVAILABLE
                </div>
                <div className="mek-value-primary text-3xl">
                  {Math.floor(userProfile?.gold || 0).toLocaleString()}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-8 h-1 bg-yellow-500/50" />
                  <span className="mek-label-uppercase text-yellow-400/50 text-[10px]">
                    GOLD STANDARD
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters - Command Interface */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search Terminal */}
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500/50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ENTER SEARCH PARAMETERS..."
                className="w-full pl-10 pr-4 py-3 bg-black/60 border-2 border-gray-700/50 text-yellow-400 placeholder-gray-600 font-mono text-sm uppercase tracking-wider focus:border-yellow-500/50 focus:outline-none transition-all mek-corner-cut"
                style={{
                  boxShadow: searchTerm ? '0 0 20px rgba(250, 182, 23, 0.2), inset 0 0 10px rgba(250, 182, 23, 0.1)' : 'none'
                }}
              />
            </div>
            
            {/* Create Listing Button - Military Style */}
            <button
              onClick={() => setShowCreateListing(true)}
              className="mek-button-primary flex items-center gap-2 group"
            >
              <span className="text-lg">⊕</span>
              <span>DEPLOY LISTING</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 animate-shimmer pointer-events-none" />
            </button>
          </div>
          
          {/* Category Filters - Tactical Selector */}
          <div className="flex gap-2 flex-wrap items-center p-3 bg-black/40 border border-gray-800 rounded-lg mek-overlay-metal-texture">
            {CATEGORIES.map((cat) => {
              const isMekChips = cat.id === 'mek-chips';
              const isActive = isMekChips 
                ? ['head', 'body', 'trait'].includes(selectedCategory)
                : selectedCategory === cat.id;
              
              if (isMekChips) {
                return (
                  <div key={cat.id} className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowMekChipsDropdown(!showMekChipsDropdown)}
                      className={`relative px-4 py-2 font-bold uppercase tracking-wider transition-all flex items-center gap-2 group mek-corner-cut ${
                        isActive
                          ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-500/30'
                          : 'bg-black/60 text-gray-400 hover:text-yellow-400 border-2 border-gray-700/50 hover:border-yellow-500/50'
                      }`}
                    >
                      <span className="relative z-10">{cat.name}</span>
                      <svg className={`w-4 h-4 transition-transform ${showMekChipsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent pointer-events-none" />
                      )}
                    </button>
                    
                    {/* Dropdown Menu - Military Equipment Selector */}
                    {showMekChipsDropdown && (
                      <div className="absolute top-full mt-2 left-0 min-w-[200px] z-50">
                        <div className="relative bg-black/95 border-2 border-yellow-500/50 mek-corner-cut overflow-hidden">
                          {/* Dropdown Header */}
                          <div className="bg-yellow-500/20 px-4 py-2 border-b border-yellow-500/30">
                            <div className="mek-label-uppercase text-yellow-400 text-[10px]">SELECT EQUIPMENT TYPE</div>
                          </div>
                          
                          {/* Options */}
                          <div className="relative">
                            <div className="absolute inset-0 mek-overlay-diagonal-stripes opacity-10 pointer-events-none" />
                            {cat.subcategories?.map((sub, index) => (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setSelectedCategory(sub.id);
                                  setShowMekChipsDropdown(false);
                                }}
                                className={`relative w-full px-4 py-3 text-left transition-all group flex items-center justify-between ${
                                  selectedCategory === sub.id
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'text-gray-400 hover:bg-yellow-500/10 hover:text-yellow-400'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${
                                    selectedCategory === sub.id ? 'bg-yellow-400' : 'bg-gray-600'
                                  }`} />
                                  <span className="font-bold uppercase tracking-wider">{sub.name}</span>
                                </div>
                                {selectedCategory === sub.id && (
                                  <span className="text-yellow-400">▶</span>
                                )}
                                {index < cat.subcategories.length - 1 && (
                                  <div className="absolute bottom-0 left-4 right-4 h-px bg-gray-800" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (cat.id === 'universal-chips') {
                      // This category doesn't have items yet
                      alert('Coming soon!');
                      return;
                    }
                    setSelectedCategory(cat.id);
                  }}
                  className={`relative px-4 py-2 font-bold uppercase tracking-wider transition-all mek-corner-cut ${
                    isActive
                      ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-500/30'
                      : 'bg-black/60 text-gray-400 hover:text-yellow-400 border-2 border-gray-700/50 hover:border-yellow-500/50'
                  }`}
                >
                  <span className="relative z-10">{cat.name}</span>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Sort Options and Filter - Control Panel */}
          <div className="flex items-center justify-between mt-3 p-3 bg-black/40 border border-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="mek-label-uppercase text-yellow-400/70">SORT PROTOCOL:</span>
              <div className="flex gap-1">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSortBy(option.id)}
                    className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-all ${
                      sortBy === option.id
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                        : 'text-gray-600 hover:text-gray-400 border border-transparent'
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setShowOnlyMyListings(!showOnlyMyListings)}
              className={`relative px-4 py-2 font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                showOnlyMyListings
                  ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-500/30'
                  : 'bg-black/60 text-gray-400 hover:text-yellow-400 border-2 border-gray-700/50 hover:border-yellow-500/50'
              }`}
            >
              {showOnlyMyListings && (
                <span className="text-green-600">✓</span>
              )}
              <span>MY LISTINGS</span>
            </button>
          </div>
        </div>
        
        {/* Listings Grid - Equipment Inventory */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
          {sortedListings.length === 0 ? (
            <div className="col-span-full text-center py-12 mek-card-industrial mek-border-sharp-gray">
              <div className="text-6xl mb-4 text-yellow-500/20">⊗</div>
              <div className="mek-text-industrial text-xl text-gray-400">NO EQUIPMENT AVAILABLE</div>
              <div className="mek-label-uppercase text-gray-500 mt-2">ADJUST SEARCH PARAMETERS OR CHECK BACK LATER</div>
              <button
                onClick={async () => {
                  try {
                    const result = await seedMarketplace();
                    const totalListings = (result.chipListings || 0) + (result.essenceListings || 0) + 
                                        (result.oeListings || 0) + (result.frameListings || 0) + 
                                        (result.oemListings || 0);
                    alert(`Marketplace seeded! Added ${totalListings} mock listings.`);
                    window.location.reload();
                  } catch (error) {
                    alert('Failed to seed marketplace: ' + error);
                  }
                }}
                className="mt-4 px-6 py-3 bg-yellow-500/20 border-2 border-yellow-500/50 hover:bg-yellow-500/30 hover:border-yellow-400 text-yellow-400 font-bold uppercase tracking-wider transition-all mek-corner-cut"
              >
                ⊕ POPULATE WITH DEMO LISTINGS
              </button>
            </div>
          ) : (
            sortedListings.map((listing) => {
              const isOwn = listing.sellerId === userId;
              const canAfford = userProfile && userProfile.gold >= listing.pricePerUnit;
              const isOverexposed = listing.itemType === 'overexposed';
              
              return (
                <div
                  key={listing._id}
                  className={`relative mek-card-industrial mek-border-sharp-gray p-4 hover:border-yellow-500/50 transition-all group mek-corner-cut ${
                    isOverexposed ? 'md:col-span-2 lg:col-span-2 xl:col-span-2' : ''
                  }`}
                >
                  {/* Industrial Overlays */}
                  <div className="absolute inset-0 mek-overlay-metal-texture opacity-5 pointer-events-none" />
                  <div className="absolute inset-0 mek-overlay-scratches pointer-events-none" />
                  
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent animate-shimmer" />
                  </div>
                  
                  {isOwn && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[10px] px-3 py-1 font-bold uppercase tracking-wider mek-corner-cut">
                      ◆ YOUR LISTING
                    </div>
                  )}
                  
                  <div className={`relative ${isOverexposed ? 'flex gap-4' : ''}`}>
                    {/* Item Thumbnail */}
                    <div className={`flex justify-center items-center ${isOverexposed ? 'flex-shrink-0 w-24 h-24' : 'mb-3 h-16'}`}>
                      {listing.imageUrl ? (
                        <img 
                          src={listing.imageUrl} 
                          alt={listing.itemVariation} 
                          className={`${isOverexposed ? 'max-w-[96px] max-h-[96px]' : 'max-w-[64px] max-h-[64px]'} w-auto h-auto object-contain rounded-lg`}
                        />
                      ) : listing.itemType === 'overexposed' ? (
                        <img 
                          src="/oe-items/oe-icon.png" 
                          alt="OE Signature Item" 
                          className={`${isOverexposed ? 'max-w-[96px] max-h-[96px]' : 'max-w-[64px] max-h-[64px]'} w-auto h-auto object-contain rounded-lg`}
                        />
                      ) : listing.itemType === 'oem' ? (
                        <img 
                          src="/frame-images/kodak-canister-2.png" 
                          alt="Film Canister" 
                          className={`${isOverexposed ? 'max-w-[96px] max-h-[96px]' : 'max-w-[64px] max-h-[64px]'} w-auto h-auto object-contain rounded-lg`}
                        />
                      ) : listing.itemType === 'frames' ? (
                        <img 
                          src={`/frame-images/${listing.itemVariation || 'frame-gold-industrial'}.svg`} 
                          alt={`${listing.itemVariation || 'Frame'}`} 
                          className={`${isOverexposed ? 'max-w-[96px] max-h-[96px]' : 'max-w-[64px] max-h-[64px]'} w-auto h-auto object-contain rounded-lg`}
                        />
                      ) : (listing.itemType === 'head' || listing.itemType === 'body' || listing.itemType === 'trait') ? (
                        <img 
                          src={`/chip-images/mek-chips/${listing.itemVariation || 'Acid A'}.webp`} 
                          alt={`${listing.itemVariation || listing.itemType} chip`} 
                          className={`${isOverexposed ? 'max-w-[96px] max-h-[96px]' : 'max-w-[64px] max-h-[64px]'} w-auto h-auto object-contain rounded-lg`}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/chip-images/mek-chips/Acid A.webp';
                          }}
                        />
                      ) : listing.itemType === 'essence' ? (
                        <div className={`${isOverexposed ? 'w-24 h-24' : 'w-16 h-16'} relative flex items-center justify-center`}>
                          {/* Glass Bottle Container */}
                          <div className="relative w-full h-full">
                            {/* Cork/Cap */}
                            <div 
                              className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-[15%] bg-gradient-to-b from-amber-700 to-amber-900 rounded-t-md"
                              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
                            />
                            {/* Bottle Neck */}
                            <div 
                              className="absolute top-[12%] left-1/2 -translate-x-1/2 w-1/3 h-[20%] bg-gradient-to-b from-gray-200/20 to-gray-300/30 rounded-sm"
                              style={{ 
                                border: '1px solid rgba(255,255,255,0.2)',
                                boxShadow: 'inset 0 0 5px rgba(255,255,255,0.1)'
                              }}
                            />
                            {/* Bottle Body with Essence */}
                            <div 
                              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[70%] rounded-b-xl rounded-t-sm overflow-hidden"
                              style={{
                                background: `linear-gradient(to bottom, 
                                  rgba(255,255,255,0.2) 0%, 
                                  rgba(255,255,255,0.1) 10%,
                                  ${
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
                                  }80 20%,
                                  ${
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
                                  } 100%)`,
                                border: '1px solid rgba(255,255,255,0.3)',
                                boxShadow: `inset 0 0 10px rgba(255,255,255,0.2), 0 0 15px ${
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
                            {/* Glass Reflection */}
                            <div 
                              className="absolute top-[25%] left-[55%] w-[15%] h-[25%] bg-white/20 rounded-full blur-sm"
                            />
                          </div>
                        </div>
                      ) : (
                        <div 
                          className={`${isOverexposed ? 'w-24 h-24 text-3xl' : 'w-16 h-16 text-2xl'} rounded-lg flex items-center justify-center font-bold text-black flex-shrink-0`}
                          style={{ 
                            background: 
                              listing.itemType === 'head' ? 'linear-gradient(135deg, #fab617 0%, #d4a017 100%)' :
                              listing.itemType === 'body' ? 'linear-gradient(135deg, #808080 0%, #606060 100%)' :
                              listing.itemType === 'trait' ? 'linear-gradient(135deg, #fab617 0%, #ffdd00 100%)' :
                              'linear-gradient(135deg, #fab617 0%, #d4a017 100%)',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                          }}
                        >
                          {listing.itemType === 'head' ? 'H' :
                           listing.itemType === 'body' ? 'B' :
                           listing.itemType === 'trait' ? 'T' : '?'}
                        </div>
                      )}
                    </div>
                    
                    {/* Content wrapper for overexposed items */}
                    <div className={isOverexposed ? 'flex-1' : ''}>
                      {/* Item Type Badge - Military Classification */}
                      {listing.itemType !== 'essence' && (
                        <div className={`mek-label-uppercase mb-3 ${isOverexposed ? 'text-left' : 'text-center'} text-yellow-400/60`}>
                          <span className="inline-block px-2 py-1 bg-black/60 border border-yellow-500/20">
                            {listing.itemType}
                          </span>
                        </div>
                      )}
                      
                      {/* Item Details - Equipment Specs */}
                      <div className="mb-3">
                        <div className={`font-bold text-yellow-400 uppercase tracking-wide ${isOverexposed ? 'text-left text-lg' : 'text-center'}`}>
                          {listing.itemVariation || listing.itemType}
                        </div>
                        {listing.itemDescription && (
                          <div className={`mek-label-uppercase text-gray-500 mt-1 ${isOverexposed ? 'text-left' : 'text-center px-2'}`}>
                            {listing.itemDescription}
                          </div>
                        )}
                        {listing.itemType !== 'essence' && listing.quantity > 1 && (
                          <div className={`flex items-center gap-2 mt-2 ${isOverexposed ? 'justify-start' : 'justify-center'}`}>
                            <span className="mek-label-uppercase text-gray-500">QTY:</span>
                            <span className="text-yellow-400 font-bold">{listing.quantity}</span>
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
                    
                      {/* Price Display - Terminal Style */}
                      <div className="mb-3 p-2 bg-black/80 border border-yellow-500/20 mek-corner-cut">
                        <div className="mek-label-uppercase text-yellow-400/60">UNIT PRICE</div>
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
                      
                      {/* Action Button - Military Command Style */}
                      {isOwn ? (
                        <button
                          onClick={() => handleCancelListing(listing._id)}
                          className="relative z-10 w-full px-4 py-2 bg-red-900/40 border-2 border-red-500/50 hover:bg-red-900/60 hover:border-red-400 text-red-400 font-bold uppercase tracking-wider transition-all mek-corner-cut cursor-pointer"
                          style={{ position: 'relative', zIndex: 10 }}
                        >
                          ⊗ ABORT LISTING
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePurchase(listing._id)}
                          disabled={!canAfford}
                          className={`relative z-10 w-full px-4 py-2 font-bold uppercase tracking-wider transition-all mek-corner-cut ${
                            canAfford
                              ? 'mek-button-primary cursor-pointer'
                              : 'bg-gray-900/60 border-2 border-gray-700/50 text-gray-600 cursor-not-allowed'
                          }`}
                          style={{ position: 'relative', zIndex: 10 }}
                        >
                          {canAfford ? '◆ ACQUIRE' : '⊗ INSUFFICIENT FUNDS'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* My Listings Section - Command Overview */}
        {myListings && myListings.length > 0 && (
          <div className="mt-8">
            <div className="mb-4 p-3 bg-black/60 border-l-4 border-yellow-500 mek-overlay-diagonal-stripes">
              <h2 className="mek-text-industrial text-2xl text-yellow-400 mek-text-shadow">
                ACTIVE DEPLOYMENTS
              </h2>
              <p className="mek-label-uppercase text-yellow-400/60 mt-1">
                {myListings.length} LISTINGS IN MARKETPLACE
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myListings.map((listing) => (
                <div
                  key={listing._id}
                  className="relative mek-card-industrial mek-border-sharp-gold p-4 mek-corner-cut"
                >
                  <div className="absolute inset-0 mek-overlay-scratches pointer-events-none" />
                  <div className="relative">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-yellow-400 uppercase tracking-wide">
                          {listing.itemVariation || listing.itemType}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="mek-label-uppercase text-gray-500">QTY:</span>
                          <span className="text-yellow-400">{listing.quantity}</span>
                          <span className="text-gray-600">×</span>
                          <span className="text-yellow-400">{listing.pricePerUnit}g</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="mek-label-uppercase text-gray-600 text-[10px]">DEPLOYED</div>
                        <div className="text-xs text-yellow-400/60">
                          {new Date(listing.listedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelListing(listing._id)}
                      className="w-full px-3 py-2 bg-red-900/30 border border-red-500/40 hover:bg-red-900/50 hover:border-red-400/60 text-red-400 font-bold uppercase tracking-wider transition-all text-sm mek-corner-cut"
                    >
                      ⊗ RECALL LISTING
                    </button>
                  </div>
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