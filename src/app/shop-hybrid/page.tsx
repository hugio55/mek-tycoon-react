"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import CreateListingModal from "@/components/CreateListingModal";
import GlobalBackground from "@/components/GlobalBackground";

const CATEGORIES = [
  { id: "all", name: "ALL EQUIPMENT" },
  { id: "mek-chips", name: "MEK CHIPS", hasDropdown: true, subcategories: [
    { id: "head", name: "HEADS" },
    { id: "body", name: "BODIES" },
    { id: "trait", name: "TRAITS" },
  ]},
  { id: "essence", name: "ESSENCE" },
  { id: "frames", name: "FRAMES" },
  { id: "oem", name: "OEM" },
  { id: "universal-chips", name: "UNIVERSAL" },
];

const SORT_OPTIONS = [
  { id: "price_asc", name: "PRICE ↑" },
  { id: "price_desc", name: "PRICE ↓" },
  { id: "recent", name: "RECENT" },
  { id: "ending_soon", name: "ENDING" },
];

interface Listing {
  _id: Id<"marketListings">;
  sellerId: Id<"users">;
  itemType: string;
  itemVariation?: string;
  itemDescription?: string;
  imageUrl?: string;
  quantity: number;
  pricePerUnit: number;
  listedAt: number;
  expiresAt?: number;
  essenceType?: string;
}

export default function ShopHybridPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showMekChipsDropdown, setShowMekChipsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Mock data for demonstration
  const mockListings: Listing[] = [
    {
      _id: "1" as Id<"marketListings">,
      sellerId: "seller1" as Id<"users">,
      itemType: "head",
      itemVariation: "Chrome Dome",
      quantity: 1,
      pricePerUnit: 2500,
      listedAt: Date.now() - 3600000,
      expiresAt: Date.now() + 86400000,
    },
    {
      _id: "2" as Id<"marketListings">,
      sellerId: "seller2" as Id<"users">,
      itemType: "body",
      itemVariation: "Titanium Core",
      quantity: 2,
      pricePerUnit: 3500,
      listedAt: Date.now() - 7200000,
      expiresAt: Date.now() + 172800000,
    },
    {
      _id: "3" as Id<"marketListings">,
      sellerId: userId || ("seller3" as Id<"users">),
      itemType: "essence",
      itemVariation: "Stone Essence",
      essenceType: "stone",
      quantity: 5.5,
      pricePerUnit: 1000,
      listedAt: Date.now() - 1800000,
    },
  ];

  // Filter listings
  const filteredListings = mockListings.filter(listing => {
    if (selectedCategory !== "all") {
      if (selectedCategory === "head" || selectedCategory === "body" || selectedCategory === "trait") {
        if (listing.itemType !== selectedCategory) return false;
      } else if (listing.itemType !== selectedCategory) return false;
    }
    if (searchTerm && !listing.itemVariation?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Sort listings
  const sortedListings = [...filteredListings].sort((a, b) => {
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

  // Mutations
  const createListing = useMutation(api.marketplace.createListing);
  const purchaseItem = useMutation(api.marketplace.purchaseItem);
  const cancelListing = useMutation(api.marketplace.cancelListing);
  const seedMarketplace = useMutation(api.seedMarketplace.seedMarketplaceListings);

  // Handle create listing
  const handleCreateListing = async (data: {
    itemType: string;
    itemVariation: string;
    quantity: number;
    pricePerUnit: number;
  }) => {
    if (!userId) return;

    try {
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

  // Get essence color
  const getEssenceColor = (essenceType: string) => {
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
    return colors[essenceType] || "#666666";
  };

  return (
    <div className="min-h-screen text-white overflow-hidden relative">
      <GlobalBackground />

      {/* Main Content */}
      <div className="relative z-10 h-screen flex flex-col">
        {/* Title Section - Military Command Panel */}
        <div className="relative mek-card-industrial mek-border-sharp-gold mek-corner-cut p-5 mek-glow-yellow mx-4 mt-4 mb-2">
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
              <h1 className="mek-text-industrial text-4xl text-yellow-400 mek-text-shadow">
                EQUIPMENT EXCHANGE
              </h1>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <p className="mek-label-uppercase text-green-400">
                  MARKETPLACE ACTIVE • {sortedListings.length} LISTINGS
                </p>
              </div>
            </div>

            {/* User Gold Display - Military HUD Style */}
            <div className="relative bg-black/60 border border-yellow-500/30 rounded px-5 py-2 mek-overlay-diagonal-stripes">
              <div className="relative">
                <div className="mek-label-uppercase text-yellow-400/70 text-[10px]">
                  CREDITS AVAILABLE
                </div>
                <div className="mek-value-primary text-2xl">
                  {Math.floor(userProfile?.gold || 0).toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-yellow-500/50" />
                  <span className="mek-label-uppercase text-yellow-400/50 text-[9px]">
                    GOLD STANDARD
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Three Column Layout */}
        <div className="flex flex-1 gap-2 px-4 pb-4 overflow-hidden">
          {/* Left Sidebar - Industrial Filter Panel */}
          <div className="w-64 mek-card-industrial mek-border-sharp-gray p-4 overflow-y-auto">
            <div className="relative">
              <div className="absolute inset-0 mek-overlay-metal-texture opacity-5 pointer-events-none" />

              {/* Search Terminal */}
              <div className="mb-6">
                <div className="mek-label-uppercase text-yellow-400/70 mb-2 text-[10px]">SEARCH PARAMETERS</div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500/50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ENTER KEYWORDS..."
                    className="w-full pl-10 pr-3 py-2 bg-black/60 border-2 border-gray-700/50 text-yellow-400 placeholder-gray-600 font-mono text-xs uppercase tracking-wider focus:border-yellow-500/50 focus:outline-none transition-all mek-corner-cut"
                    style={{
                      boxShadow: searchTerm ? '0 0 15px rgba(250, 182, 23, 0.2), inset 0 0 8px rgba(250, 182, 23, 0.1)' : 'none'
                    }}
                  />
                </div>
              </div>

              {/* Category Filters - Tactical Selector */}
              <div className="mb-6">
                <div className="mek-label-uppercase text-yellow-400/70 mb-3 text-[10px]">EQUIPMENT CATEGORIES</div>
                <div className="space-y-1">
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
                            className={`relative w-full text-left px-3 py-2 font-bold uppercase tracking-wider transition-all flex items-center justify-between group text-xs mek-corner-cut ${
                              isActive
                                ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-500/30'
                                : 'bg-black/60 text-gray-400 hover:text-yellow-400 border-2 border-gray-700/50 hover:border-yellow-500/50'
                            }`}
                          >
                            <span className="relative z-10">{cat.name}</span>
                            <svg className={`w-3 h-3 transition-transform ${showMekChipsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* Dropdown Menu */}
                          {showMekChipsDropdown && (
                            <div className="absolute top-full mt-1 left-0 right-0 z-50">
                              <div className="relative bg-black/95 border-2 border-yellow-500/50 mek-corner-cut overflow-hidden">
                                <div className="bg-yellow-500/20 px-3 py-1 border-b border-yellow-500/30">
                                  <div className="mek-label-uppercase text-yellow-400 text-[9px]">SELECT TYPE</div>
                                </div>
                                <div className="relative">
                                  <div className="absolute inset-0 mek-overlay-diagonal-stripes opacity-10 pointer-events-none" />
                                  {cat.subcategories?.map((sub, index) => (
                                    <button
                                      key={sub.id}
                                      onClick={() => {
                                        setSelectedCategory(sub.id);
                                        setShowMekChipsDropdown(false);
                                      }}
                                      className={`relative w-full px-3 py-2 text-left transition-all text-xs font-bold uppercase tracking-wider ${
                                        selectedCategory === sub.id
                                          ? 'bg-yellow-500/20 text-yellow-400'
                                          : 'text-gray-400 hover:bg-yellow-500/10 hover:text-yellow-400'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${
                                          selectedCategory === sub.id ? 'bg-yellow-400' : 'bg-gray-600'
                                        }`} />
                                        <span>{sub.name}</span>
                                      </div>
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
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`relative w-full text-left px-3 py-2 font-bold uppercase tracking-wider transition-all text-xs mek-corner-cut ${
                          isActive
                            ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-500/30 border-l-4 border-yellow-400'
                            : 'bg-black/60 text-gray-400 hover:text-yellow-400 border-2 border-gray-700/50 hover:border-yellow-500/50 border-l-4 border-transparent'
                        }`}
                      >
                        <span className="relative z-10">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort Options - Control Protocol */}
              <div className="mb-6">
                <div className="mek-label-uppercase text-yellow-400/70 mb-3 text-[10px]">SORT PROTOCOL</div>
                <div className="space-y-1">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSortBy(option.id)}
                      className={`w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all mek-corner-cut ${
                        sortBy === option.id
                          ? 'bg-yellow-500/20 text-yellow-400 border-l-4 border-yellow-400'
                          : 'text-gray-400 hover:bg-gray-800/50 hover:text-white border-l-4 border-transparent'
                      }`}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Create Listing Button */}
              <button
                onClick={() => setShowCreateListing(true)}
                className="mek-button-primary w-full flex items-center justify-center gap-2 group text-xs"
              >
                <span className="text-base">⊕</span>
                <span>DEPLOY LISTING</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 animate-shimmer pointer-events-none" />
              </button>

              {/* Seed Button */}
              <button
                onClick={async () => {
                  try {
                    const result = await seedMarketplace();
                    alert(`Marketplace seeded!`);
                    window.location.reload();
                  } catch (error) {
                    alert('Failed to seed marketplace: ' + error);
                  }
                }}
                className="mt-3 w-full px-3 py-2 bg-gray-900/60 border border-gray-700/50 hover:bg-gray-900/80 hover:border-gray-600 text-gray-400 font-bold uppercase tracking-wider transition-all text-[10px] mek-corner-cut"
              >
                ⚙ POPULATE DEMO
              </button>
            </div>
          </div>

          {/* Main Content - Industrial Table */}
          <div className="flex-1 mek-card-industrial mek-border-sharp-gray overflow-hidden flex flex-col">
            <div className="relative flex-1 overflow-auto">
              <div className="absolute inset-0 mek-overlay-metal-texture opacity-5 pointer-events-none" />

              {/* Listings Table - Military Database */}
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-black/80 backdrop-blur-sm border-b-2 border-yellow-500/30">
                    <th className="py-3 px-4 text-left mek-label-uppercase text-yellow-400/70 text-[10px] font-bold">ITEM</th>
                    <th className="py-3 px-4 text-left mek-label-uppercase text-yellow-400/70 text-[10px] font-bold">DESIGNATION</th>
                    <th className="py-3 px-4 text-center mek-label-uppercase text-yellow-400/70 text-[10px] font-bold">QTY</th>
                    <th className="py-3 px-4 text-right mek-label-uppercase text-yellow-400/70 text-[10px] font-bold">UNIT PRICE</th>
                    <th className="py-3 px-4 text-right mek-label-uppercase text-yellow-400/70 text-[10px] font-bold">TOTAL</th>
                    <th className="py-3 px-4 text-center mek-label-uppercase text-yellow-400/70 text-[10px] font-bold">EXPIRES</th>
                    <th className="py-3 px-4 text-center mek-label-uppercase text-yellow-400/70 text-[10px] font-bold">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedListings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="text-6xl mb-4 text-yellow-500/20">⊗</div>
                        <div className="mek-text-industrial text-xl text-gray-400">NO EQUIPMENT AVAILABLE</div>
                        <div className="mek-label-uppercase text-gray-500 mt-2">ADJUST SEARCH PARAMETERS</div>
                      </td>
                    </tr>
                  ) : (
                    sortedListings.map((listing) => {
                      const isOwn = listing.sellerId === userId;
                      const canAfford = userProfile && userProfile.gold >= listing.pricePerUnit;
                      const totalPrice = listing.pricePerUnit * listing.quantity;

                      return (
                        <tr
                          key={listing._id}
                          className="border-b border-gray-800/50 hover:bg-yellow-500/5 transition-all group cursor-pointer"
                          onClick={() => setSelectedListing(listing)}
                        >
                          {/* Item Icon */}
                          <td className="py-3 px-4">
                            {listing.itemType === 'essence' ? (
                              <div
                                className="w-10 h-10 rounded-full relative"
                                style={{
                                  background: `linear-gradient(135deg, ${getEssenceColor(listing.essenceType || 'stone')} 0%, ${getEssenceColor(listing.essenceType || 'stone')}80 100%)`,
                                  boxShadow: `0 0 15px ${getEssenceColor(listing.essenceType || 'stone')}40, inset 0 0 10px rgba(255,255,255,0.2)`
                                }}
                              >
                                <div className="absolute top-1 left-1 w-2 h-3 bg-white/30 rounded-full blur-sm" />
                              </div>
                            ) : (
                              <div
                                className="w-10 h-10 rounded flex items-center justify-center font-bold text-black"
                                style={{
                                  background:
                                    listing.itemType === 'head' ? 'linear-gradient(135deg, #fab617 0%, #d4a017 100%)' :
                                    listing.itemType === 'body' ? 'linear-gradient(135deg, #808080 0%, #606060 100%)' :
                                    listing.itemType === 'trait' ? 'linear-gradient(135deg, #fab617 0%, #ffdd00 100%)' :
                                    'linear-gradient(135deg, #fab617 0%, #d4a017 100%)',
                                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.3)'
                                }}
                              >
                                {listing.itemType === 'head' ? 'H' :
                                 listing.itemType === 'body' ? 'B' :
                                 listing.itemType === 'trait' ? 'T' : '?'}
                              </div>
                            )}
                          </td>

                          {/* Name */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-yellow-400 uppercase tracking-wide text-sm">
                              {listing.itemVariation || listing.itemType}
                            </div>
                            {isOwn && (
                              <div className="mek-label-uppercase text-yellow-400/60 text-[9px] mt-1">
                                ◆ YOUR LISTING
                              </div>
                            )}
                          </td>

                          {/* Quantity */}
                          <td className="py-3 px-4 text-center">
                            <span className="mek-value-secondary text-sm font-mono">
                              {listing.itemType === 'essence'
                                ? `${listing.quantity}`
                                : listing.quantity}
                            </span>
                          </td>

                          {/* Unit Price */}
                          <td className="py-3 px-4 text-right">
                            <div className="mek-value-primary text-sm">
                              {listing.pricePerUnit.toLocaleString()}
                            </div>
                            {listing.itemType === 'essence' && (
                              <div className="mek-label-uppercase text-gray-600 text-[9px]">PER ESSENCE</div>
                            )}
                          </td>

                          {/* Total */}
                          <td className="py-3 px-4 text-right">
                            <div className="text-white font-bold text-sm">
                              {totalPrice.toLocaleString()}g
                            </div>
                          </td>

                          {/* Time Left */}
                          <td className="py-3 px-4 text-center">
                            {listing.expiresAt ? (
                              <div className="mek-label-uppercase text-gray-400 text-[10px]">
                                {Math.ceil((listing.expiresAt - Date.now()) / (1000 * 60 * 60))}H
                              </div>
                            ) : (
                              <span className="text-gray-600">--</span>
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
                                className="px-3 py-1 bg-red-900/40 border border-red-500/50 hover:bg-red-900/60 hover:border-red-400 text-red-400 font-bold uppercase tracking-wider transition-all text-[10px] mek-corner-cut"
                              >
                                ⊗ CANCEL
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePurchase(listing._id);
                                }}
                                disabled={!canAfford}
                                className={`px-3 py-1 font-bold uppercase tracking-wider transition-all text-[10px] mek-corner-cut ${
                                  canAfford
                                    ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/30'
                                    : 'bg-gray-900/60 border border-gray-700/50 text-gray-600 cursor-not-allowed'
                                }`}
                              >
                                {canAfford ? '◆ BUY' : '⊗ POOR'}
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

          {/* Right Sidebar - Item Intel Panel */}
          {selectedListing && (
            <div className="w-80 mek-card-industrial mek-border-sharp-gold p-4 overflow-y-auto">
              <div className="relative">
                <div className="absolute inset-0 mek-overlay-scratches pointer-events-none" />

                <div className="relative">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="mek-text-industrial text-xl text-yellow-400">ITEM INTEL</h3>
                    <button
                      onClick={() => setSelectedListing(null)}
                      className="text-yellow-500/50 hover:text-yellow-400 transition-colors"
                    >
                      <span className="text-2xl">×</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Item Visual */}
                    <div className="flex justify-center p-4 bg-black/40 border border-yellow-500/20 mek-corner-cut">
                      {selectedListing.itemType === 'essence' ? (
                        <div
                          className="w-24 h-24 rounded-full relative"
                          style={{
                            background: `linear-gradient(135deg, ${getEssenceColor(selectedListing.essenceType || 'stone')} 0%, ${getEssenceColor(selectedListing.essenceType || 'stone')}80 100%)`,
                            boxShadow: `0 0 30px ${getEssenceColor(selectedListing.essenceType || 'stone')}60, inset 0 0 20px rgba(255,255,255,0.3)`
                          }}
                        >
                          <div className="absolute top-3 left-3 w-5 h-8 bg-white/30 rounded-full blur-md" />
                        </div>
                      ) : (
                        <div
                          className="w-24 h-24 rounded-lg flex items-center justify-center text-4xl font-bold text-black"
                          style={{
                            background:
                              selectedListing.itemType === 'head' ? 'linear-gradient(135deg, #fab617 0%, #d4a017 100%)' :
                              selectedListing.itemType === 'body' ? 'linear-gradient(135deg, #808080 0%, #606060 100%)' :
                              selectedListing.itemType === 'trait' ? 'linear-gradient(135deg, #fab617 0%, #ffdd00 100%)' :
                              'linear-gradient(135deg, #fab617 0%, #d4a017 100%)',
                            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255,255,255,0.3)'
                          }}
                        >
                          {selectedListing.itemType === 'head' ? 'H' :
                           selectedListing.itemType === 'body' ? 'B' :
                           selectedListing.itemType === 'trait' ? 'T' : '?'}
                        </div>
                      )}
                    </div>

                    {/* Classification */}
                    <div className="p-3 bg-black/60 border border-yellow-500/20 mek-corner-cut">
                      <div className="mek-label-uppercase text-yellow-400/60 text-[9px] mb-1">CLASSIFICATION</div>
                      <div className="text-yellow-400 font-bold uppercase">{selectedListing.itemType}</div>
                    </div>

                    {/* Designation */}
                    <div className="p-3 bg-black/60 border border-yellow-500/20 mek-corner-cut">
                      <div className="mek-label-uppercase text-yellow-400/60 text-[9px] mb-1">DESIGNATION</div>
                      <div className="text-white font-bold uppercase text-lg">{selectedListing.itemVariation || selectedListing.itemType}</div>
                    </div>

                    {/* Quantity */}
                    <div className="p-3 bg-black/60 border border-yellow-500/20 mek-corner-cut">
                      <div className="mek-label-uppercase text-yellow-400/60 text-[9px] mb-1">QUANTITY</div>
                      <div className="mek-value-secondary text-xl font-mono">{selectedListing.quantity}</div>
                    </div>

                    {/* Pricing */}
                    <div className="p-3 bg-yellow-500/10 border-2 border-yellow-500/30 mek-corner-cut">
                      <div className="mek-label-uppercase text-yellow-400 text-[9px] mb-1">UNIT PRICE</div>
                      <div className="mek-value-primary text-2xl mb-2">
                        {selectedListing.pricePerUnit.toLocaleString()}g
                      </div>
                      <div className="border-t border-yellow-500/20 pt-2 mt-2">
                        <div className="mek-label-uppercase text-yellow-400 text-[9px] mb-1">TOTAL COST</div>
                        <div className="text-3xl font-bold text-yellow-400">
                          {(selectedListing.pricePerUnit * selectedListing.quantity).toLocaleString()}g
                        </div>
                      </div>
                    </div>

                    {/* Seller Info */}
                    {selectedListing.sellerId && (
                      <div className="p-3 bg-black/60 border border-gray-700/50 mek-corner-cut">
                        <div className="mek-label-uppercase text-gray-500 text-[9px] mb-1">SELLER ID</div>
                        <div className="text-gray-400 font-mono text-xs">{selectedListing.sellerId.slice(-8)}</div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2 mt-4">
                      {selectedListing.sellerId === userId ? (
                        <button
                          onClick={() => handleCancelListing(selectedListing._id)}
                          className="w-full px-4 py-3 bg-red-900/40 border-2 border-red-500/50 hover:bg-red-900/60 hover:border-red-400 text-red-400 font-bold uppercase tracking-wider transition-all text-xs mek-corner-cut"
                        >
                          ⊗ ABORT LISTING
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePurchase(selectedListing._id)}
                          disabled={!userProfile || userProfile.gold < selectedListing.pricePerUnit}
                          className={`w-full px-4 py-3 font-bold uppercase tracking-wider transition-all text-xs mek-corner-cut ${
                            userProfile && userProfile.gold >= selectedListing.pricePerUnit
                              ? 'mek-button-primary'
                              : 'bg-gray-900/60 border-2 border-gray-700/50 text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          {userProfile && userProfile.gold >= selectedListing.pricePerUnit
                            ? '◆ ACQUIRE ITEM'
                            : '⊗ INSUFFICIENT FUNDS'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

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