"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import CreateListingModal from "@/components/CreateListingModal";
import GlobalBackground from "@/components/GlobalBackground";

const CATEGORIES = [
  { id: "mek-chips", name: "MEK CHIPS", hasDropdown: true, subcategories: [
    { id: "head", name: "HEADS" },
    { id: "body", name: "BODIES" },
    { id: "trait", name: "TRAITS" },
  ]},
  { id: "essence", name: "ESSENCE" },
  { id: "oem", name: "OEM" },
  { id: "uni-chips", name: "UNI CHIPS", hasTiers: true },
];

const UNI_CHIP_TIERS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10'];

const ITEM_RARITIES = {
  common: { color: "#4ade80", border: "border-green-400/50", glow: "shadow-green-400/30" },
  uncommon: { color: "#60a5fa", border: "border-blue-400/50", glow: "shadow-blue-400/30" },
  rare: { color: "#c084fc", border: "border-purple-400/50", glow: "shadow-purple-400/30" },
  epic: { color: "#fb923c", border: "border-orange-400/50", glow: "shadow-orange-400/30" },
  legendary: { color: "#fbbf24", border: "border-yellow-400/50", glow: "shadow-yellow-400/30" },
};

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const SORT_OPTIONS = [
  { id: "recent", name: "Most Recent" },
  { id: "new_today", name: "New Today" },
  { id: "rare_filter", name: "Rare Items" },
  { id: "price_asc", name: "Price: Low to High" },
  { id: "price_desc", name: "Price: High to Low" },
  { id: "ending_soon", name: "Ending Soon" },
  { id: "most_rare", name: "Most Rare" },
  { id: "least_rare", name: "Least Rare" },
];

interface Listing {
  _id: Id<"marketListings">;
  sellerId: Id<"users">;
  sellerName?: string;
  sellerRating?: number;
  sellerSales?: number;
  itemType: string;
  itemVariation?: string;
  itemDescription?: string;
  imageUrl?: string;
  quantity: number;
  pricePerUnit: number;
  marketAverage?: number;
  lastSoldPrice?: number;
  salesVolume24h?: number;
  listedAt: number;
  expiresAt?: number;
  essenceType?: string;
  rarity?: keyof typeof ITEM_RARITIES;
  viewCount?: number;
  watchCount?: number;
  isHot?: boolean;
  isNew?: boolean;
}

export default function ShopHybridPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("essence");
  const [sortBy, setSortBy] = useState("recent");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showMekChipsDropdown, setShowMekChipsDropdown] = useState(false);
  const [selectedUniChipTier, setSelectedUniChipTier] = useState<string>("T1");
  const [showUniChipTierDropdown, setShowUniChipTierDropdown] = useState(false);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [showOnlyAffordable, setShowOnlyAffordable] = useState(false);
  const [hoveredListing, setHoveredListing] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const uniChipDropdownRef = useRef<HTMLDivElement>(null);

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

  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { walletAddress: "demo_wallet_123" } : "skip"
  );

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch(e.key.toLowerCase()) {
        case 'escape':
          setSelectedListing(null);
          break;
        case 'b':
          if (selectedListing && !e.ctrlKey && !e.metaKey) {
            const canAfford = userProfile && userProfile.gold >= selectedListing.pricePerUnit * selectedListing.quantity;
            const isOwn = selectedListing.sellerId === userId;
            if (canAfford && !isOwn) {
              handlePurchase(selectedListing._id);
            }
          }
          break;
        case 'w':
          if (selectedListing && !e.ctrlKey && !e.metaKey) {
            const isOwn = selectedListing.sellerId === userId;
            if (!isOwn) {
              setWatchlist(prev => {
                const newSet = new Set(prev);
                if (newSet.has(selectedListing._id)) {
                  newSet.delete(selectedListing._id);
                } else {
                  newSet.add(selectedListing._id);
                }
                return newSet;
              });
            }
          }
          break;
        case '/':
          e.preventDefault();
          const searchInput = document.querySelector('input[placeholder="ENTER KEYWORDS..."]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedListing, userProfile, userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMekChipsDropdown(false);
      }
      if (uniChipDropdownRef.current && !uniChipDropdownRef.current.contains(event.target as Node)) {
        setShowUniChipTierDropdown(false);
      }
    };

    if (showMekChipsDropdown || showUniChipTierDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMekChipsDropdown, showUniChipTierDropdown]);

  // Mock data (same as original)
  const mockListings: Listing[] = [
    {
      _id: "1" as Id<"marketListings">,
      sellerId: "seller1" as Id<"users">,
      sellerName: "MekTrader99",
      sellerRating: 4.8,
      sellerSales: 342,
      itemType: "head",
      itemVariation: "Chrome Dome",
      quantity: 1,
      pricePerUnit: 2500,
      marketAverage: 2800,
      lastSoldPrice: 2650,
      salesVolume24h: 12,
      listedAt: Date.now() - 3600000,
      expiresAt: Date.now() + 86400000,
      rarity: "uncommon",
      viewCount: 45,
      watchCount: 3,
      isHot: true,
    },
    // Add more mock data as needed
  ];

  const convexListings = useQuery(api.marketplace.getListings) || [];
  const allListings = [...mockListings, ...convexListings];

  // Filtering logic
  const filteredListings = allListings.filter((listing) => {
    if (searchTerm && !listing.itemVariation?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    if (listing.pricePerUnit * listing.quantity > priceRange.max) {
      return false;
    }

    if (showOnlyAffordable && userProfile && listing.pricePerUnit * listing.quantity > userProfile.gold) {
      return false;
    }

    // Category filtering with uni-chips tier support
    if (selectedCategory === "uni-chips") {
      return listing.itemType === "uni-chips";
    } else if (selectedCategory === "head" || selectedCategory === "body" || selectedCategory === "trait") {
      return listing.itemType === selectedCategory;
    } else if (listing.itemType !== selectedCategory) {
      return false;
    }

    // Apply sort-based filtering
    if (sortBy === "new_today") {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return listing.listedAt >= oneDayAgo;
    }

    if (sortBy === "rare_filter") {
      return listing.rarity === "epic" || listing.rarity === "legendary";
    }

    return true;
  });

  // Sorting logic
  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case "recent":
      case "new_today":
        return b.listedAt - a.listedAt;
      case "price_asc":
        return (a.pricePerUnit * a.quantity) - (b.pricePerUnit * b.quantity);
      case "price_desc":
        return (b.pricePerUnit * b.quantity) - (a.pricePerUnit * a.quantity);
      case "ending_soon":
        return (a.expiresAt || Infinity) - (b.expiresAt || Infinity);
      case "most_rare":
        const aRarity = RARITY_ORDER.indexOf(a.rarity || 'common');
        const bRarity = RARITY_ORDER.indexOf(b.rarity || 'common');
        return bRarity - aRarity;
      case "least_rare":
        const aRarity2 = RARITY_ORDER.indexOf(a.rarity || 'common');
        const bRarity2 = RARITY_ORDER.indexOf(b.rarity || 'common');
        return aRarity2 - bRarity2;
      case "rare_filter":
        return b.listedAt - a.listedAt;
      default:
        return 0;
    }
  });

  const purchaseListing = useMutation(api.marketplace.purchaseListing);
  const seedMarketplace = useMutation(api.marketplace.seedWithMockData);

  const handlePurchase = async (listingId: Id<"marketListings">) => {
    if (!userId) return;
    try {
      await purchaseListing({
        listingId,
        buyerId: userId,
      });
      setSelectedListing(null);
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  const handleCreateListing = async (data: {
    itemType: string;
    itemVariation: string;
    quantity: number;
    pricePerUnit: number;
    duration: number;
  }) => {
    if (!userId) return;
    console.log('Creating listing:', {
      sellerId: userId,
      itemType: data.itemType,
      itemVariation: data.itemVariation,
      quantity: data.quantity,
      pricePerUnit: data.pricePerUnit,
      expiresAt: Date.now() + data.duration * 60 * 60 * 1000
    });
  };

  const formatTimeRemaining = (expiresAt: number | undefined) => {
    if (!expiresAt) return '—';
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) return 'Expired';
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <GlobalBackground variant="cyber-grid" />

      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <div className="bg-gradient-to-b from-black via-black/95 to-transparent px-4 py-3 border-b border-yellow-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-yellow-400 uppercase tracking-wider font-['Orbitron']">
                HYBRID MARKETPLACE
              </h1>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-semibold uppercase">{sortedListings.length} Active</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ENTER KEYWORDS..."
                  className="w-64 pl-8 pr-3 py-1.5 bg-black/60 backdrop-blur-sm border border-yellow-500/30 text-yellow-400 placeholder-gray-600 font-mono text-xs uppercase tracking-wider focus:border-yellow-500/50 focus:outline-none transition-all rounded"
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-yellow-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 bg-gray-900/80 border border-gray-700 rounded text-white text-xs font-medium hover:border-yellow-500/50 focus:border-yellow-500 focus:outline-none transition-colors cursor-pointer"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>

              {/* Create Listing Button */}
              <button
                onClick={() => setShowCreateListing(true)}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-3 py-1.5 rounded transition-all text-xs uppercase tracking-wider"
              >
                + CREATE
              </button>
            </div>
          </div>

          {/* Category Buttons */}
          <div className="flex items-center gap-2">
            {CATEGORIES.map((cat) => {
              const isMekChips = cat.id === 'mek-chips';
              const isUniChips = cat.id === 'uni-chips';
              const isActive = isMekChips
                ? ['head', 'body', 'trait'].includes(selectedCategory)
                : selectedCategory === cat.id;

              if (isMekChips) {
                return (
                  <div key={cat.id} className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowMekChipsDropdown(!showMekChipsDropdown)}
                      className={`px-3 py-1 font-bold uppercase text-xs tracking-wider transition-all rounded flex items-center gap-1 ${
                        isActive
                          ? 'bg-yellow-400 text-black'
                          : 'bg-black/40 text-gray-400 hover:text-yellow-400 border border-gray-700/50 hover:border-yellow-500/50'
                      }`}
                    >
                      {cat.name}
                      <svg className={`w-3 h-3 transition-transform ${showMekChipsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showMekChipsDropdown && (
                      <div className="absolute top-full mt-1 left-0 z-50 bg-black/95 border border-yellow-500/50 rounded">
                        {cat.subcategories?.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setSelectedCategory(sub.id);
                              setShowMekChipsDropdown(false);
                            }}
                            className={`block w-full px-3 py-1.5 text-left text-xs font-bold uppercase tracking-wider ${
                              selectedCategory === sub.id
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'text-gray-400 hover:bg-yellow-500/10 hover:text-yellow-400'
                            }`}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              if (isUniChips) {
                return (
                  <div key={cat.id} className="relative flex items-center gap-1">
                    <button
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1 font-bold uppercase text-xs tracking-wider transition-all rounded ${
                        isActive
                          ? 'bg-yellow-400 text-black'
                          : 'bg-black/40 text-gray-400 hover:text-yellow-400 border border-gray-700/50 hover:border-yellow-500/50'
                      }`}
                    >
                      {cat.name}
                    </button>
                    {isActive && (
                      <div className="relative" ref={uniChipDropdownRef}>
                        <button
                          onClick={() => setShowUniChipTierDropdown(!showUniChipTierDropdown)}
                          className="px-2 py-1 bg-gray-900/80 border border-gray-700 rounded text-yellow-400 text-xs font-medium hover:border-yellow-500/50 flex items-center gap-1"
                        >
                          {selectedUniChipTier}
                          <svg className={`w-3 h-3 transition-transform ${showUniChipTierDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showUniChipTierDropdown && (
                          <div className="absolute top-full mt-1 right-0 z-50 bg-black/95 border border-yellow-500/50 rounded">
                            {UNI_CHIP_TIERS.map((tier) => (
                              <button
                                key={tier}
                                onClick={() => {
                                  setSelectedUniChipTier(tier);
                                  setShowUniChipTierDropdown(false);
                                }}
                                className={`block w-full px-3 py-1 text-left text-xs font-bold ${
                                  selectedUniChipTier === tier
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'text-gray-400 hover:bg-yellow-500/10 hover:text-yellow-400'
                                }`}
                              >
                                {tier}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 font-bold uppercase text-xs tracking-wider transition-all rounded ${
                    isActive
                      ? 'bg-yellow-400 text-black'
                      : 'bg-black/40 text-gray-400 hover:text-yellow-400 border border-gray-700/50 hover:border-yellow-500/50'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 gap-2 px-4 pb-4 overflow-hidden">
          {/* Table Container */}
          <div className="flex-1 bg-black/40 backdrop-blur-sm border border-yellow-500/20 rounded-lg overflow-hidden">
            <div className="relative h-full overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-black/80 backdrop-blur-sm border-b-2 border-yellow-500/30">
                    <th className="py-2 px-3 text-left text-gray-400 text-[10px] font-semibold uppercase tracking-wider w-12"></th>
                    <th className="py-2 px-3 text-left text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Item Name</th>
                    <th className="py-2 px-3 text-center text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Seller</th>
                    <th className="py-2 px-3 text-center text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Qty</th>
                    {selectedCategory === "essence" ? (
                      <>
                        <th className="py-2 px-3 text-right text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Per Unit</th>
                        <th className="py-2 px-3 text-right text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Total</th>
                      </>
                    ) : (
                      <th className="py-2 px-3 text-right text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Price</th>
                    )}
                    <th className="py-2 px-3 text-center text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Time Left</th>
                    <th className="py-2 px-3 text-center text-gray-400 text-[10px] font-semibold uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedListings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center">
                        <div className="text-xl font-semibold text-gray-400">No listings found</div>
                        <div className="text-sm text-gray-500 mt-2">Try adjusting your filters or search terms</div>
                      </td>
                    </tr>
                  ) : (
                    sortedListings.map((listing) => {
                      const isOwn = listing.sellerId === userId;
                      const canAfford = userProfile && userProfile.gold >= listing.pricePerUnit * listing.quantity;
                      const totalPrice = listing.pricePerUnit * listing.quantity;
                      const rarity = listing.rarity || 'common';
                      const rarityStyle = ITEM_RARITIES[rarity];
                      const isGoodDeal = false;

                      return (
                        <tr
                          key={listing._id}
                          onClick={() => setSelectedListing(listing)}
                          onMouseEnter={() => setHoveredListing(listing._id)}
                          onMouseLeave={() => setHoveredListing(null)}
                          className={`border-b border-gray-800/50 cursor-pointer transition-all ${
                            selectedListing?._id === listing._id
                              ? 'bg-yellow-500/10'
                              : hoveredListing === listing._id
                              ? 'bg-gray-900/30'
                              : ''
                          }`}
                        >
                          <td className="py-2 px-3">
                            {listing.itemType === 'essence' ? (
                              <img
                                src="/essence-images/bumb_gif.gif"
                                alt="Essence"
                                className="w-8 h-8 object-contain"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
                                style={{
                                  background:
                                    listing.itemType === 'head' ? 'linear-gradient(135deg, #fab617 0%, #d4a017 100%)' :
                                    listing.itemType === 'body' ? 'linear-gradient(135deg, #808080 0%, #606060 100%)' :
                                    listing.itemType === 'trait' ? 'linear-gradient(135deg, #fab617 0%, #ffdd00 100%)' :
                                    'linear-gradient(135deg, #fab617 0%, #d4a017 100%)',
                                }}
                              >
                                {listing.itemType === 'head' ? 'H' :
                                 listing.itemType === 'body' ? 'B' :
                                 listing.itemType === 'trait' ? 'T' : '?'}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-bold text-yellow-400 uppercase tracking-wide text-xs">
                              {listing.itemVariation || listing.itemType}
                            </div>
                            {listing.itemDescription && (
                              <div className="text-gray-500 text-[9px] mt-0.5 uppercase">
                                {listing.itemDescription}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="text-xs text-gray-400">{listing.sellerName || 'Unknown'}</div>
                            {listing.sellerRating && (
                              <div className="text-[9px] text-yellow-400">★ {listing.sellerRating.toFixed(1)}</div>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="text-xs font-mono text-white">
                              {listing.itemType === 'essence'
                                ? `${listing.quantity}`
                                : listing.quantity}
                            </span>
                          </td>
                          {selectedCategory === "essence" ? (
                            <>
                              <td className="py-2 px-3 text-right">
                                <span className="text-xs font-mono text-yellow-400">
                                  {listing.pricePerUnit.toLocaleString()}g
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <span className="text-sm font-bold text-yellow-400">
                                  {totalPrice.toLocaleString()}g
                                </span>
                              </td>
                            </>
                          ) : (
                            <td className="py-2 px-3 text-right">
                              <span className="text-sm font-bold text-yellow-400">
                                {totalPrice.toLocaleString()}g
                              </span>
                            </td>
                          )}
                          <td className="py-2 px-3 text-center">
                            <span className="text-xs text-gray-400">
                              {formatTimeRemaining(listing.expiresAt)}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {isOwn ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('Cancel listing');
                                }}
                                className="px-2 py-0.5 bg-red-900/60 hover:bg-red-800/60 text-red-400 font-bold uppercase tracking-wider transition-all text-[9px] rounded"
                              >
                                CANCEL
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePurchase(listing._id);
                                }}
                                disabled={!canAfford}
                                className={`px-2 py-0.5 font-bold uppercase tracking-wider transition-all text-[9px] rounded ${
                                  canAfford
                                    ? isGoodDeal
                                      ? 'bg-green-500 hover:bg-green-400 text-black shadow-lg shadow-green-500/30 animate-pulse'
                                      : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/30'
                                    : 'bg-gray-900/60 border border-gray-700/50 text-gray-600 cursor-not-allowed'
                                }`}
                              >
                                {canAfford ? 'BUY' : 'NO GOLD'}
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
          </div>

          {/* Right Sidebar - Item Details (when selected) */}
          {selectedListing && (
            <div className="w-72 bg-black/60 backdrop-blur-md border border-yellow-500/30 rounded-lg p-3 overflow-y-auto">
              <div className="text-lg font-bold text-yellow-400 uppercase mb-3">
                {selectedListing.itemVariation || selectedListing.itemType}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-[9px] text-gray-400 uppercase mb-1">Price</div>
                  <div className="text-xl font-bold text-yellow-400">
                    {(selectedListing.pricePerUnit * selectedListing.quantity).toLocaleString()}g
                  </div>
                </div>

                <div>
                  <div className="text-[9px] text-gray-400 uppercase mb-1">Seller</div>
                  <div className="text-sm text-white">{selectedListing.sellerName || 'Unknown'}</div>
                </div>

                <div>
                  <div className="text-[9px] text-gray-400 uppercase mb-1">Quantity</div>
                  <div className="text-sm text-white">{selectedListing.quantity}</div>
                </div>

                <div>
                  <div className="text-[9px] text-gray-400 uppercase mb-1">Time Remaining</div>
                  <div className="text-sm text-white">{formatTimeRemaining(selectedListing.expiresAt)}</div>
                </div>

                <button
                  onClick={() => handlePurchase(selectedListing._id)}
                  disabled={!userProfile || userProfile.gold < selectedListing.pricePerUnit * selectedListing.quantity}
                  className={`w-full py-2 font-bold uppercase text-xs tracking-wider rounded transition-all ${
                    userProfile && userProfile.gold >= selectedListing.pricePerUnit * selectedListing.quantity
                      ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
                      : 'bg-gray-900/60 border border-gray-700/50 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {userProfile && userProfile.gold >= selectedListing.pricePerUnit * selectedListing.quantity
                    ? 'PURCHASE'
                    : 'INSUFFICIENT GOLD'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateListing && (
        <CreateListingModal
          onClose={() => setShowCreateListing(false)}
          onCreate={handleCreateListing}
        />
      )}
    </div>
  );
}