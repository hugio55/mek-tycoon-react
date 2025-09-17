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
  { id: "frames", name: "FRAMES" },
  { id: "oem", name: "OEM" },
  { id: "universal-chips", name: "UNIVERSAL" },
];

// Quick filter chips for common searches
const QUICK_FILTERS = [
  { id: "affordable", name: "AFFORDABLE", maxPrice: 5000 },
  { id: "rare", name: "RARE", rarity: ["epic", "legendary"] },
  { id: "new", name: "NEW TODAY", hoursAgo: 24 },
  { id: "ending", name: "ENDING SOON", hoursLeft: 2 },
];

// Item rarity definitions
const ITEM_RARITIES = {
  common: { color: "#4ade80", border: "border-green-400/50", glow: "shadow-green-400/30" },
  uncommon: { color: "#60a5fa", border: "border-blue-400/50", glow: "shadow-blue-400/30" },
  rare: { color: "#c084fc", border: "border-purple-400/50", glow: "shadow-purple-400/30" },
  epic: { color: "#fb923c", border: "border-orange-400/50", glow: "shadow-orange-400/30" },
  legendary: { color: "#fbbf24", border: "border-yellow-400/50", glow: "shadow-yellow-400/30" },
};

const SORT_OPTIONS = [
  { id: "recent", name: "Most Recent" },
  { id: "price_asc", name: "Price: Low to High" },
  { id: "price_desc", name: "Price: High to Low" },
  { id: "ending_soon", name: "Ending Soon" },
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
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [showOnlyAffordable, setShowOnlyAffordable] = useState(false);
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [hoveredListing, setHoveredListing] = useState<string | null>(null);
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

  // Get user profile
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { walletAddress: "demo_wallet_123" } : "skip"
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in an input
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

  // Mock data for demonstration with enhanced attributes
  const mockListings: Listing[] = [
    // HEAD CHIPS
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
    {
      _id: "2" as Id<"marketListings">,
      sellerId: "seller2" as Id<"users">,
      sellerName: "TechnoKing",
      sellerRating: 4.2,
      sellerSales: 89,
      itemType: "head",
      itemVariation: "Neon Visor",
      quantity: 3,
      pricePerUnit: 1800,
      marketAverage: 2000,
      lastSoldPrice: 1900,
      salesVolume24h: 23,
      listedAt: Date.now() - 1800000,
      expiresAt: Date.now() + 172800000,
      rarity: "common",
      viewCount: 67,
      watchCount: 2,
    },
    {
      _id: "3" as Id<"marketListings">,
      sellerId: "seller3" as Id<"users">,
      sellerName: "RoboDealer",
      sellerRating: 4.9,
      sellerSales: 567,
      itemType: "head",
      itemVariation: "Quantum Brain",
      quantity: 1,
      pricePerUnit: 8500,
      marketAverage: 8000,
      lastSoldPrice: 8200,
      salesVolume24h: 4,
      listedAt: Date.now() - 7200000,
      expiresAt: Date.now() + 43200000,
      rarity: "epic",
      viewCount: 156,
      watchCount: 12,
      isNew: true,
    },
    {
      _id: "4" as Id<"marketListings">,
      sellerId: "seller4" as Id<"users">,
      sellerName: "GearHead",
      sellerRating: 3.8,
      sellerSales: 45,
      itemType: "head",
      itemVariation: "Rust Bucket",
      quantity: 5,
      pricePerUnit: 800,
      marketAverage: 900,
      lastSoldPrice: 850,
      salesVolume24h: 31,
      listedAt: Date.now() - 14400000,
      expiresAt: Date.now() + 86400000,
      rarity: "common",
      viewCount: 23,
      watchCount: 0,
    },

    // BODY CHIPS
    {
      _id: "5" as Id<"marketListings">,
      sellerId: "seller5" as Id<"users">,
      sellerName: "EliteGear",
      sellerRating: 5.0,
      sellerSales: 1205,
      itemType: "body",
      itemVariation: "Titanium Core",
      quantity: 2,
      pricePerUnit: 3500,
      marketAverage: 3200,
      lastSoldPrice: 3400,
      salesVolume24h: 8,
      listedAt: Date.now() - 7200000,
      expiresAt: Date.now() + 172800000,
      rarity: "rare",
      viewCount: 89,
      watchCount: 7,
    },
    {
      _id: "6" as Id<"marketListings">,
      sellerId: "seller6" as Id<"users">,
      sellerName: "ArmorSmith",
      sellerRating: 4.6,
      sellerSales: 234,
      itemType: "body",
      itemVariation: "Carbon Fiber",
      quantity: 4,
      pricePerUnit: 2200,
      marketAverage: 2500,
      lastSoldPrice: 2300,
      salesVolume24h: 15,
      listedAt: Date.now() - 5400000,
      expiresAt: Date.now() + 259200000,
      rarity: "uncommon",
      viewCount: 102,
      watchCount: 5,
    },
    {
      _id: "7" as Id<"marketListings">,
      sellerId: userId || ("seller7" as Id<"users">),
      sellerName: "You",
      itemType: "body",
      itemVariation: "Steel Plating",
      quantity: 1,
      pricePerUnit: 1500,
      marketAverage: 1400,
      lastSoldPrice: 1450,
      salesVolume24h: 19,
      listedAt: Date.now() - 3600000,
      rarity: "common",
    },
    {
      _id: "8" as Id<"marketListings">,
      sellerId: "seller8" as Id<"users">,
      sellerName: "MekMaster",
      sellerRating: 4.7,
      sellerSales: 892,
      itemType: "body",
      itemVariation: "Void Armor",
      quantity: 1,
      pricePerUnit: 12000,
      marketAverage: 11500,
      lastSoldPrice: 11800,
      salesVolume24h: 2,
      listedAt: Date.now() - 900000,
      expiresAt: Date.now() + 7200000,
      rarity: "legendary",
      viewCount: 342,
      watchCount: 28,
      isHot: true,
    },

    // TRAIT CHIPS
    {
      _id: "9" as Id<"marketListings">,
      sellerId: "seller9" as Id<"users">,
      sellerName: "RareFinds",
      sellerRating: 4.5,
      sellerSales: 89,
      itemType: "trait",
      itemVariation: "Plasma Cannon",
      quantity: 1,
      pricePerUnit: 15000,
      marketAverage: 18000,
      lastSoldPrice: 16500,
      salesVolume24h: 2,
      listedAt: Date.now() - 600000,
      expiresAt: Date.now() + 3600000,
      rarity: "legendary",
      viewCount: 234,
      watchCount: 18,
      isHot: true,
    },
    {
      _id: "10" as Id<"marketListings">,
      sellerId: "seller10" as Id<"users">,
      sellerName: "WeaponX",
      sellerRating: 4.3,
      sellerSales: 178,
      itemType: "trait",
      itemVariation: "Speed Boost",
      quantity: 3,
      pricePerUnit: 3200,
      marketAverage: 3500,
      lastSoldPrice: 3300,
      salesVolume24h: 11,
      listedAt: Date.now() - 10800000,
      expiresAt: Date.now() + 86400000,
      rarity: "uncommon",
      viewCount: 78,
      watchCount: 4,
    },
    {
      _id: "11" as Id<"marketListings">,
      sellerId: "seller11" as Id<"users">,
      sellerName: "BuffMaster",
      sellerRating: 4.8,
      sellerSales: 445,
      itemType: "trait",
      itemVariation: "Shield Generator",
      quantity: 2,
      pricePerUnit: 5500,
      marketAverage: 5200,
      lastSoldPrice: 5400,
      salesVolume24h: 7,
      listedAt: Date.now() - 21600000,
      expiresAt: Date.now() + 172800000,
      rarity: "rare",
      viewCount: 145,
      watchCount: 9,
    },

    // ESSENCE
    {
      _id: "12" as Id<"marketListings">,
      sellerId: "seller12" as Id<"users">,
      sellerName: "EssenceKing",
      sellerRating: 4.9,
      sellerSales: 1567,
      itemType: "essence",
      itemVariation: "Stone Essence",
      essenceType: "stone",
      quantity: 5.5,
      pricePerUnit: 1000,
      marketAverage: 1100,
      salesVolume24h: 34,
      listedAt: Date.now() - 1800000,
      rarity: "common",
      isNew: true,
    },
    {
      _id: "13" as Id<"marketListings">,
      sellerId: "seller13" as Id<"users">,
      sellerName: "MagicDealer",
      sellerRating: 4.4,
      sellerSales: 234,
      itemType: "essence",
      itemVariation: "Disco Essence",
      essenceType: "disco",
      quantity: 2.3,
      pricePerUnit: 2500,
      marketAverage: 2800,
      lastSoldPrice: 2600,
      salesVolume24h: 12,
      listedAt: Date.now() - 7200000,
      rarity: "uncommon",
      viewCount: 89,
      watchCount: 6,
    },
    {
      _id: "14" as Id<"marketListings">,
      sellerId: "seller14" as Id<"users">,
      sellerName: "PotionBrew",
      sellerRating: 4.7,
      sellerSales: 678,
      itemType: "essence",
      itemVariation: "Laser Essence",
      essenceType: "laser",
      quantity: 1.0,
      pricePerUnit: 8000,
      marketAverage: 7500,
      lastSoldPrice: 7800,
      salesVolume24h: 3,
      listedAt: Date.now() - 3600000,
      expiresAt: Date.now() + 43200000,
      rarity: "epic",
      viewCount: 167,
      watchCount: 14,
      isHot: true,
    },
    {
      _id: "15" as Id<"marketListings">,
      sellerId: "seller15" as Id<"users">,
      sellerName: "AlchemyPro",
      sellerRating: 3.9,
      sellerSales: 123,
      itemType: "essence",
      itemVariation: "Candy Essence",
      essenceType: "candy",
      quantity: 10.0,
      pricePerUnit: 500,
      marketAverage: 600,
      lastSoldPrice: 550,
      salesVolume24h: 45,
      listedAt: Date.now() - 14400000,
      rarity: "common",
      viewCount: 34,
      watchCount: 1,
    },

    // FRAMES
    {
      _id: "16" as Id<"marketListings">,
      sellerId: "seller16" as Id<"users">,
      sellerName: "FrameForge",
      sellerRating: 4.6,
      sellerSales: 456,
      itemType: "frames",
      itemVariation: "Gold Industrial",
      quantity: 1,
      pricePerUnit: 4500,
      marketAverage: 4200,
      lastSoldPrice: 4400,
      salesVolume24h: 6,
      listedAt: Date.now() - 5400000,
      expiresAt: Date.now() + 86400000,
      rarity: "rare",
      viewCount: 123,
      watchCount: 8,
    },
    {
      _id: "17" as Id<"marketListings">,
      sellerId: "seller17" as Id<"users">,
      sellerName: "StructureX",
      sellerRating: 4.1,
      sellerSales: 89,
      itemType: "frames",
      itemVariation: "Carbon Black",
      quantity: 2,
      pricePerUnit: 2800,
      marketAverage: 3000,
      lastSoldPrice: 2900,
      salesVolume24h: 9,
      listedAt: Date.now() - 10800000,
      rarity: "uncommon",
      viewCount: 67,
      watchCount: 3,
    },

    // OEM
    {
      _id: "18" as Id<"marketListings">,
      sellerId: "seller18" as Id<"users">,
      sellerName: "FactoryDirect",
      sellerRating: 4.8,
      sellerSales: 789,
      itemType: "oem",
      itemVariation: "Kodak Canister",
      quantity: 10,
      pricePerUnit: 150,
      marketAverage: 180,
      lastSoldPrice: 160,
      salesVolume24h: 67,
      listedAt: Date.now() - 7200000,
      rarity: "common",
      viewCount: 234,
      watchCount: 5,
      isNew: true,
    },
    {
      _id: "19" as Id<"marketListings">,
      sellerId: "seller19" as Id<"users">,
      sellerName: "OEMSupply",
      sellerRating: 4.5,
      sellerSales: 234,
      itemType: "oem",
      itemVariation: "Premium Film",
      quantity: 5,
      pricePerUnit: 350,
      marketAverage: 400,
      lastSoldPrice: 380,
      salesVolume24h: 23,
      listedAt: Date.now() - 1800000,
      rarity: "uncommon",
      viewCount: 89,
      watchCount: 2,
    },

    // UNIVERSAL CHIPS
    {
      _id: "20" as Id<"marketListings">,
      sellerId: "seller20" as Id<"users">,
      sellerName: "UniChips",
      sellerRating: 5.0,
      sellerSales: 2345,
      itemType: "universal-chips",
      itemVariation: "Adapter Plus",
      quantity: 3,
      pricePerUnit: 1200,
      marketAverage: 1100,
      lastSoldPrice: 1150,
      salesVolume24h: 28,
      listedAt: Date.now() - 3600000,
      expiresAt: Date.now() + 259200000,
      rarity: "common",
      viewCount: 156,
      watchCount: 4,
    },
    {
      _id: "21" as Id<"marketListings">,
      sellerId: "seller21" as Id<"users">,
      sellerName: "TechUniversal",
      sellerRating: 4.7,
      sellerSales: 567,
      itemType: "universal-chips",
      itemVariation: "Omega Connector",
      quantity: 1,
      pricePerUnit: 6500,
      marketAverage: 7000,
      lastSoldPrice: 6800,
      salesVolume24h: 4,
      listedAt: Date.now() - 900000,
      expiresAt: Date.now() + 7200000,
      rarity: "epic",
      viewCount: 289,
      watchCount: 22,
      isHot: true,
    },

    // Additional variety
    {
      _id: "22" as Id<"marketListings">,
      sellerId: "seller22" as Id<"users">,
      sellerName: "BulkDeals",
      sellerRating: 3.7,
      sellerSales: 156,
      itemType: "essence",
      itemVariation: "Moss Essence",
      essenceType: "moss",
      quantity: 25.0,
      pricePerUnit: 300,
      marketAverage: 350,
      lastSoldPrice: 320,
      salesVolume24h: 89,
      listedAt: Date.now() - 21600000,
      rarity: "common",
      viewCount: 45,
      watchCount: 0,
    },
    {
      _id: "23" as Id<"marketListings">,
      sellerId: "seller23" as Id<"users">,
      sellerName: "LegendaryLoot",
      sellerRating: 4.9,
      sellerSales: 1234,
      itemType: "head",
      itemVariation: "Holographic Mind",
      quantity: 1,
      pricePerUnit: 25000,
      marketAverage: 28000,
      lastSoldPrice: 26500,
      salesVolume24h: 1,
      listedAt: Date.now() - 300000,
      expiresAt: Date.now() + 3600000,
      rarity: "legendary",
      viewCount: 567,
      watchCount: 45,
      isHot: true,
    },
  ];

  // Enhanced filtering with multiple criteria
  const filteredListings = mockListings.filter(listing => {
    // Category filter
    if (selectedCategory === "head" || selectedCategory === "body" || selectedCategory === "trait") {
      if (listing.itemType !== selectedCategory) return false;
    } else if (listing.itemType !== selectedCategory) return false;

    // Search filter
    if (searchTerm && !listing.itemVariation?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Price range filter
    if (listing.pricePerUnit < priceRange.min || listing.pricePerUnit > priceRange.max) {
      return false;
    }

    // Affordable filter
    if (showOnlyAffordable && userProfile && listing.pricePerUnit > userProfile.gold) {
      return false;
    }

    // Quick filters
    if (quickFilter) {
      const filter = QUICK_FILTERS.find(f => f.id === quickFilter);
      if (filter) {
        if (filter.maxPrice && listing.pricePerUnit > filter.maxPrice) return false;
        if (filter.hoursAgo) {
          const hoursOld = (Date.now() - listing.listedAt) / (1000 * 60 * 60);
          if (hoursOld > filter.hoursAgo) return false;
        }
        if (filter.hoursLeft && listing.expiresAt) {
          const hoursRemaining = (listing.expiresAt - Date.now()) / (1000 * 60 * 60);
          if (hoursRemaining > filter.hoursLeft) return false;
        }
        if (filter.rarity && listing.rarity) {
          if (!filter.rarity.includes(listing.rarity)) return false;
        }
      }
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

      {/* Custom Styles for Slider */}
      <style jsx global>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #fab617;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(250, 182, 23, 0.5);
          transition: all 0.2s;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 20px rgba(250, 182, 23, 0.8);
        }

        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #fab617;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(250, 182, 23, 0.5);
          transition: all 0.2s;
        }

        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 20px rgba(250, 182, 23, 0.8);
        }
      `}</style>

      {/* Main Content */}
      <div className="relative z-10 h-screen flex flex-col">
        {/* Title Section - Compact Header */}
        <div className="relative mek-card-industrial mek-border-sharp-gold p-3 mek-glow-yellow mx-4 mt-4 mb-2">
          {/* Hazard Stripes Header */}
          <div className="absolute top-0 left-0 right-0 h-2 mek-overlay-hazard-stripes opacity-60" />

          {/* Grunge Overlays */}
          <div className="absolute inset-0 mek-overlay-scratches pointer-events-none" />

          <div className="relative flex justify-between items-center">
            <div>
              <h1 className="mek-text-industrial text-3xl text-yellow-400 mek-text-shadow">
                EQUIPMENT EXCHANGE
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-green-400 text-xs font-semibold">
                    {sortedListings.length} ACTIVE
                  </p>
                </div>
                <span className="text-gray-600">|</span>
                <span className="text-gray-400 text-xs">Press / to search</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Market Stats */}
              <div className="flex flex-col items-end">
                <div className="text-[9px] text-gray-500 uppercase">Your Balance</div>
                <div className="gold-display-medium">
                  {Math.floor(userProfile?.gold || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Three Column Layout */}
        <div className="flex flex-1 gap-2 px-4 pb-4 overflow-hidden">
          {/* Left Sidebar - Floating Controls */}
          <div className="w-64 p-4 overflow-y-auto">
            <div className="relative">

              {/* Create Listing Button */}
              <button
                onClick={() => setShowCreateListing(true)}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-md transition-all transform hover:scale-[1.02] mb-2 text-xs uppercase tracking-wider shadow-lg"
              >
                + CREATE LISTING
              </button>

              {/* My Listings Button */}
              <button
                onClick={() => console.log('Show my listings')}
                className="w-full bg-gray-800/80 hover:bg-gray-700/80 text-yellow-400 border border-yellow-500/30 font-bold px-4 py-2 rounded-md transition-all transform hover:scale-[1.02] mb-4 text-xs uppercase tracking-wider backdrop-blur-sm"
              >
                MY LISTINGS
              </button>

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
                    className="w-full pl-10 pr-3 py-2 bg-black/60 backdrop-blur-sm border border-yellow-500/30 text-yellow-400 placeholder-gray-600 font-mono text-xs uppercase tracking-wider focus:border-yellow-500/50 focus:outline-none transition-all rounded"
                    style={{
                      boxShadow: searchTerm ? '0 0 15px rgba(250, 182, 23, 0.2), inset 0 0 8px rgba(250, 182, 23, 0.1)' : 'none'
                    }}
                  />
                </div>
              </div>

              {/* Price Range Slider */}
              <div className="mb-6">
                <div className="mek-label-uppercase text-yellow-400/70 mb-3 text-[10px] flex items-center justify-between">
                  <span>PRICE RANGE</span>
                  <span className="text-yellow-400">{priceRange.min.toLocaleString()} - {priceRange.max.toLocaleString()}g</span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="1000"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #fab617 0%, #fab617 ${(priceRange.max / 100000) * 100}%, #374151 ${(priceRange.max / 100000) * 100}%, #374151 100%)`
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="affordable"
                    checked={showOnlyAffordable}
                    onChange={(e) => setShowOnlyAffordable(e.target.checked)}
                    className="w-4 h-4 bg-black/60 border-2 border-yellow-500/50 rounded text-yellow-400 focus:ring-yellow-500"
                  />
                  <label htmlFor="affordable" className="text-xs text-gray-400 uppercase">
                    Only show affordable
                  </label>
                </div>
              </div>

              {/* Quick Filters */}
              <div className="mb-6">
                <div className="mek-label-uppercase text-yellow-400/70 mb-2 text-[10px]">QUICK FILTERS</div>
                <div className="space-y-1">
                  {QUICK_FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setQuickFilter(quickFilter === filter.id ? null : filter.id)}
                      className={`w-full text-left px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-all rounded ${
                        quickFilter === filter.id
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                          : 'bg-black/40 text-gray-500 border border-gray-700/50 hover:text-yellow-400 hover:border-yellow-500/30'
                      }`}
                    >
                      {filter.name}
                    </button>
                  ))}
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
                            className={`relative w-full text-left px-3 py-2 font-bold uppercase tracking-wider transition-all flex items-center justify-between group text-xs rounded-md backdrop-blur-sm ${
                              isActive
                                ? 'bg-yellow-400/90 text-black shadow-lg shadow-yellow-500/30'
                                : 'bg-black/40 text-gray-400 hover:text-yellow-400 border border-gray-700/50 hover:border-yellow-500/50'
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
                              <div className="relative bg-black/95 border-2 border-yellow-500/50 rounded-md overflow-hidden">
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
                        className={`relative w-full text-left px-3 py-2 font-bold uppercase tracking-wider transition-all text-xs rounded-md backdrop-blur-sm ${
                          isActive
                            ? 'bg-yellow-400/90 text-black shadow-lg shadow-yellow-500/30 border-l-4 border-yellow-400'
                            : 'bg-black/40 text-gray-400 hover:text-yellow-400 border border-gray-700/50 hover:border-yellow-500/50 border-l-4 border-transparent'
                        }`}
                      >
                        <span className="relative z-10">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>


              {/* Create Listing Button */}
              <button
                onClick={() => setShowCreateListing(true)}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-md transition-all transform hover:scale-[1.02] w-full flex items-center justify-center gap-2 group text-xs uppercase tracking-wider shadow-lg"
              >
                <span className="text-base">+</span>
                <span>CREATE NEW LISTING</span>
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
                className="mt-3 w-full px-3 py-2 bg-gray-900/60 border border-gray-700/50 hover:bg-gray-900/80 hover:border-gray-600 text-gray-400 font-bold uppercase tracking-wider transition-all text-[10px] rounded-md"
              >
                POPULATE DEMO
              </button>
            </div>
          </div>

          {/* Main Content - Table */}
          <div className="flex-1 bg-black/40 backdrop-blur-sm border border-yellow-500/20 rounded-lg overflow-hidden flex flex-col">
            {/* Sort Dropdown - Above Table */}
            <div className="px-4 py-3 bg-gradient-to-b from-black/80 to-black/60 border-b border-yellow-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-xs font-semibold uppercase">{sortedListings.length} Active</span>
                </div>
                <div className="text-gray-500">|</div>
                <span className="text-gray-400 text-xs">Real-time marketplace</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 bg-gray-900/80 border border-gray-700 rounded-md text-white text-xs font-medium hover:border-yellow-500/50 focus:border-yellow-500 focus:outline-none transition-colors cursor-pointer"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative flex-1 overflow-auto">
              <div className="absolute inset-0 mek-overlay-metal-texture opacity-5 pointer-events-none" />

              {/* Listings Table - Dynamic Headers Based on Category */}
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-black/80 backdrop-blur-sm border-b-2 border-yellow-500/30">
                    <th className="py-3 px-3 text-left text-gray-400 text-[11px] font-semibold uppercase tracking-wider">Type</th>
                    <th className="py-3 px-3 text-left text-gray-400 text-[11px] font-semibold uppercase tracking-wider">Item Name</th>
                    <th className="py-3 px-3 text-center text-gray-400 text-[11px] font-semibold uppercase tracking-wider">Seller</th>
                    <th className="py-3 px-3 text-center text-gray-400 text-[11px] font-semibold uppercase tracking-wider">Qty</th>
                    {selectedCategory === "essence" ? (
                      <>
                        <th className="py-3 px-3 text-right text-gray-400 text-[11px] font-semibold uppercase tracking-wider">Per Unit</th>
                        <th className="py-3 px-3 text-right text-gray-400 text-[11px] font-semibold uppercase tracking-wider">Total</th>
                      </>
                    ) : (
                      <th className="py-3 px-3 text-right text-gray-400 text-[11px] font-semibold uppercase tracking-wider">Price</th>
                    )}
                    <th className="py-3 px-3 text-center text-gray-400 text-[11px] font-semibold uppercase tracking-wider">Weekly Avg</th>
                    <th className="py-3 px-3 text-center text-gray-400 text-[11px] font-semibold uppercase tracking-wider">Time Left</th>
                    <th className="py-3 px-3 text-center text-gray-400 text-[11px] font-semibold uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedListings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="text-6xl mb-4 text-gray-700">—</div>
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
                      const isGoodDeal = false; // TODO: Implement deal detection logic

                      // Format time remaining
                      const formatTimeRemaining = (expiresAt: number | undefined) => {
                        if (!expiresAt) return '—';
                        const remaining = expiresAt - Date.now();
                        if (remaining <= 0) return 'Expired';
                        const hours = Math.floor(remaining / (1000 * 60 * 60));
                        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                        return `${hours}h ${minutes}m`;
                      };

                      return (
                        <tr
                          key={listing._id}
                          className="border-b border-gray-800/50 hover:bg-yellow-500/5 transition-all group cursor-pointer relative"
                          onClick={() => setSelectedListing(listing)}
                        >
                          {/* Item Icon with Rarity */}
                          <td className="py-1.5 px-3">
                            <div className="relative">
                              {/* Rarity Glow */}
                              {listing.rarity && listing.rarity !== 'common' && (
                                <div
                                  className={`absolute -inset-1 rounded-full blur-md opacity-50`}
                                  style={{ backgroundColor: rarityStyle.color }}
                                />
                              )}

                              {listing.itemType === 'essence' ? (
                                <div
                                  className={`w-8 h-8 rounded-full relative border-2 ${rarityStyle.border}`}
                                  style={{
                                    background: `linear-gradient(135deg, ${getEssenceColor(listing.essenceType || 'stone')} 0%, ${getEssenceColor(listing.essenceType || 'stone')}80 100%)`,
                                    boxShadow: `0 0 15px ${getEssenceColor(listing.essenceType || 'stone')}40, inset 0 0 10px rgba(255,255,255,0.2)`
                                  }}
                                >
                                  <div className="absolute top-1 left-1 w-2 h-3 bg-white/30 rounded-full blur-sm" />
                                </div>
                              ) : (
                                <div
                                  className={`w-8 h-8 rounded flex items-center justify-center font-bold text-black border-2 ${rarityStyle.border}`}
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
                            </div>
                          </td>

                          {/* Name */}
                          <td className="py-1.5 px-3">
                            <div className="font-bold text-yellow-400 uppercase tracking-wide text-xs">
                              {listing.itemVariation || listing.itemType}
                            </div>
                          </td>

                          {/* Seller */}
                          <td className="py-1.5 px-3 text-center">
                            {isOwn ? (
                              <div className="text-yellow-400 text-xs font-bold">YOU</div>
                            ) : (
                              <div className="text-gray-300 text-xs font-medium">{listing.sellerName || 'Unknown'}</div>
                            )}
                          </td>

                          {/* Quantity */}
                          <td className="py-1.5 px-3 text-center">
                            <span className="mek-value-secondary text-xsfont-mono">
                              {listing.itemType === 'essence'
                                ? `${listing.quantity}`
                                : listing.quantity}
                            </span>
                          </td>

                          {/* Price - Different for Essence */}
                          {selectedCategory === "essence" ? (
                            <>
                              <td className="py-1.5 px-3 text-right">
                                <div className="text-yellow-400 font-bold text-xs">
                                  {listing.pricePerUnit.toLocaleString()}g
                                </div>
                              </td>
                              <td className="py-1.5 px-3 text-right">
                                <div className={`font-bold text-xs ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>
                                  {totalPrice.toLocaleString()}g
                                </div>
                              </td>
                            </>
                          ) : (
                            <td className="py-1.5 px-3 text-right">
                              <div className={`font-bold text-xs ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>
                                {totalPrice.toLocaleString()}g
                              </div>
                            </td>
                          )}

                          {/* Weekly Average */}
                          <td className="py-1.5 px-3 text-center">
                            {listing.marketAverage ? (
                              <div className="text-gray-300 text-xs">
                                {listing.marketAverage.toLocaleString()}g
                              </div>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </td>

                          {/* Time Remaining */}
                          <td className="py-1.5 px-3 text-center">
                            <div className="text-gray-400 text-xs font-medium">
                              {formatTimeRemaining(listing.expiresAt || Date.now() + 86400000)}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-1.5 px-3 text-center">
                            {isOwn ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelListing(listing._id);
                                  }}
                                  className="px-2 py-0.5 bg-orange-600/20 border border-orange-500/50 hover:bg-orange-600/30 hover:border-orange-400 text-orange-400 font-bold uppercase tracking-wider transition-all text-[10px] rounded"
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
                                  className={`px-2 py-0.5 font-bold uppercase tracking-wider transition-all text-[10px] rounded ${
                                    canAfford
                                      ? isGoodDeal
                                        ? 'bg-green-500 hover:bg-green-400 text-black shadow-lg shadow-green-500/30 animate-pulse'
                                        : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/30'
                                      : 'bg-gray-900/60 border border-gray-700/50 text-gray-600 cursor-not-allowed'
                                  }`}
                                >
                                  {canAfford ? 'BUY NOW' : 'NO GOLD'}
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

          {/* Right Sidebar - Enhanced Item Intel Panel */}
          {selectedListing && (
            <div className="w-80 bg-black/60 backdrop-blur-md border border-yellow-500/30 rounded-lg p-4 overflow-y-auto">
              <div className="relative">
                <div className="absolute inset-0 mek-overlay-scratches pointer-events-none" />

                <div className="relative">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="mek-text-industrial text-xl text-yellow-400">ITEM INTEL</h3>
                    <button
                      onClick={() => setSelectedListing(null)}
                      className="text-yellow-500/50 hover:text-yellow-400 transition-colors"
                      title="Press ESC to close"
                    >
                      <span className="text-2xl">×</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Market Status Badge */}
                    {selectedListing.isHot || selectedListing.isNew || (selectedListing.marketAverage && selectedListing.pricePerUnit < selectedListing.marketAverage * 0.9) ? (
                      <div className="flex gap-2 justify-center">
                        {selectedListing.isHot && (
                          <span className="px-2 py-1 bg-red-500/20 border border-red-500/50 text-red-400 text-xs font-bold rounded animate-pulse">
                            🔥 HOT ITEM
                          </span>
                        )}
                        {selectedListing.isNew && (
                          <span className="px-2 py-1 bg-green-500/20 border border-green-500/50 text-green-400 text-xs font-bold rounded">
                            ✨ NEW LISTING
                          </span>
                        )}
                        {selectedListing.marketAverage && selectedListing.pricePerUnit < selectedListing.marketAverage * 0.9 && (
                          <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-400 text-xs font-bold rounded">
                            💸 GREAT DEAL
                          </span>
                        )}
                      </div>
                    ) : null}

                    {/* Item Visual with Rarity Border */}
                    <div className="flex justify-center p-4 bg-black/40 border border-yellow-500/20 rounded-lg relative">
                      {selectedListing.rarity && selectedListing.rarity !== 'common' && (
                        <div className="absolute top-2 right-2">
                          <span
                            className="px-2 py-1 text-[10px] font-bold uppercase rounded"
                            style={{
                              color: ITEM_RARITIES[selectedListing.rarity].color,
                              backgroundColor: ITEM_RARITIES[selectedListing.rarity].color + '20',
                              border: `1px solid ${ITEM_RARITIES[selectedListing.rarity].color}50`
                            }}
                          >
                            {selectedListing.rarity}
                          </span>
                        </div>
                      )}
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
                            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255,255,255,0.3)',
                            border: selectedListing.rarity ? `2px solid ${ITEM_RARITIES[selectedListing.rarity].color}50` : 'none'
                          }}
                        >
                          {selectedListing.itemType === 'head' ? 'H' :
                           selectedListing.itemType === 'body' ? 'B' :
                           selectedListing.itemType === 'trait' ? 'T' : '?'}
                        </div>
                      )}
                    </div>

                    {/* Classification */}
                    <div className="p-3 bg-black/60 border border-yellow-500/20 rounded-md">
                      <div className="mek-label-uppercase text-yellow-400/60 text-[9px] mb-1">CLASSIFICATION</div>
                      <div className="text-yellow-400 font-bold uppercase">{selectedListing.itemType}</div>
                    </div>

                    {/* Designation */}
                    <div className="p-3 bg-black/60 border border-yellow-500/20 rounded-md">
                      <div className="mek-label-uppercase text-yellow-400/60 text-[9px] mb-1">DESIGNATION</div>
                      <div className="text-white font-bold uppercase text-lg">{selectedListing.itemVariation || selectedListing.itemType}</div>
                    </div>

                    {/* Quantity */}
                    <div className="p-3 bg-black/60 border border-yellow-500/20 rounded-md">
                      <div className="mek-label-uppercase text-yellow-400/60 text-[9px] mb-1">QUANTITY</div>
                      <div className="mek-value-secondary text-xl font-mono">{selectedListing.quantity}</div>
                    </div>

                    {/* Enhanced Pricing with Market Data */}
                    <div className="p-3 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-md">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="mek-label-uppercase text-yellow-400 text-[9px] mb-1">LISTING PRICE</div>
                          <div className="mek-value-primary text-xl">
                            {selectedListing.pricePerUnit.toLocaleString()}
                          </div>
                        </div>
                        {selectedListing.marketAverage && (
                          <div>
                            <div className="mek-label-uppercase text-gray-400 text-[9px] mb-1">MARKET AVG</div>
                            <div className="text-xl font-bold text-gray-400">
                              {selectedListing.marketAverage.toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Price Comparison Bar */}
                      {selectedListing.marketAverage && (
                        <div className="mt-3">
                          <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="absolute top-0 left-0 h-full transition-all"
                              style={{
                                width: `${Math.min(100, (selectedListing.pricePerUnit / selectedListing.marketAverage) * 100)}%`,
                                background: selectedListing.pricePerUnit < selectedListing.marketAverage * 0.9
                                  ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                                  : selectedListing.pricePerUnit > selectedListing.marketAverage * 1.1
                                  ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                                  : 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                              }}
                            />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/50" />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-[8px] text-gray-500">-50%</span>
                            <span className="text-[8px] text-gray-400">MARKET</span>
                            <span className="text-[8px] text-gray-500">+50%</span>
                          </div>
                        </div>
                      )}

                      <div className="border-t border-yellow-500/20 pt-2 mt-3">
                        <div className="mek-label-uppercase text-yellow-400 text-[9px] mb-1">TOTAL COST</div>
                        <div className="text-3xl font-bold text-yellow-400">
                          {(selectedListing.pricePerUnit * selectedListing.quantity).toLocaleString()}g
                        </div>
                        {userProfile && (
                          <div className="mt-1">
                            {userProfile.gold >= selectedListing.pricePerUnit * selectedListing.quantity ? (
                              <span className="text-green-400 text-xs">✓ You can afford this</span>
                            ) : (
                              <span className="text-red-400 text-xs">
                                ⚠ Need {((selectedListing.pricePerUnit * selectedListing.quantity) - userProfile.gold).toLocaleString()}g more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Market Activity Stats */}
                    {(selectedListing.salesVolume24h || selectedListing.viewCount || selectedListing.lastSoldPrice) && (
                      <div className="p-3 bg-black/60 border border-gray-700/50 rounded-md">
                        <div className="mek-label-uppercase text-gray-400 text-[9px] mb-2">MARKET ACTIVITY</div>
                        <div className="space-y-1">
                          {selectedListing.salesVolume24h && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 text-xs">24h Volume:</span>
                              <span className="text-gray-300 text-xs font-mono">{selectedListing.salesVolume24h} sold</span>
                            </div>
                          )}
                          {selectedListing.lastSoldPrice && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 text-xs">Last Sold:</span>
                              <span className="text-gray-300 text-xs font-mono">{selectedListing.lastSoldPrice.toLocaleString()}g</span>
                            </div>
                          )}
                          {selectedListing.viewCount && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 text-xs">Views:</span>
                              <span className="text-gray-300 text-xs font-mono">{selectedListing.viewCount}</span>
                            </div>
                          )}
                          {selectedListing.watchCount && selectedListing.watchCount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 text-xs">Watching:</span>
                              <span className="text-yellow-400 text-xs font-mono">{selectedListing.watchCount} users</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Enhanced Seller Info */}
                    {selectedListing.sellerId && (
                      <div className="p-3 bg-black/60 border border-gray-700/50 rounded-md">
                        <div className="mek-label-uppercase text-gray-500 text-[9px] mb-2">SELLER INFORMATION</div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium">{selectedListing.sellerName || 'Unknown Seller'}</span>
                            {selectedListing.sellerRating && (
                              <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={i < Math.floor(selectedListing.sellerRating) ? 'text-yellow-400' : 'text-gray-600'}
                                    style={{ fontSize: '12px' }}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {selectedListing.sellerSales && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 text-xs">Total Sales:</span>
                              <span className="text-gray-300 text-xs font-mono">{selectedListing.sellerSales}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500 text-xs">Seller ID:</span>
                            <span className="text-gray-400 font-mono text-xs">{selectedListing.sellerId.slice(-8)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Enhanced Action Buttons */}
                    <div className="space-y-2 mt-4">
                      {selectedListing.sellerId === userId ? (
                        <button
                          onClick={() => handleCancelListing(selectedListing._id)}
                          className="w-full px-4 py-3 bg-red-900/40 border-2 border-red-500/50 hover:bg-red-900/60 hover:border-red-400 text-red-400 font-bold uppercase tracking-wider transition-all text-xs rounded-md hover:scale-[1.02] transform"
                        >
                          ABORT LISTING
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handlePurchase(selectedListing._id)}
                            disabled={!userProfile || userProfile.gold < selectedListing.pricePerUnit * selectedListing.quantity}
                            className={`w-full px-4 py-3 font-bold uppercase tracking-wider transition-all text-sm rounded-md transform hover:scale-[1.02] ${
                              userProfile && userProfile.gold >= selectedListing.pricePerUnit * selectedListing.quantity
                                ? selectedListing.marketAverage && selectedListing.pricePerUnit < selectedListing.marketAverage * 0.9
                                  ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/30 animate-pulse'
                                  : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/30'
                                : 'bg-gray-900/60 border-2 border-gray-700/50 text-gray-600 cursor-not-allowed'
                            }`}
                          >
                            {userProfile && userProfile.gold >= selectedListing.pricePerUnit * selectedListing.quantity
                              ? 'BUY NOW (B)'
                              : 'INSUFFICIENT FUNDS'}
                          </button>

                          {!watchlist.has(selectedListing._id) ? (
                            <button
                              onClick={() => {
                                setWatchlist(prev => new Set(prev).add(selectedListing._id));
                              }}
                              className="w-full px-4 py-2 bg-black/40 border border-yellow-500/50 hover:bg-yellow-500/10 text-yellow-400 font-bold uppercase tracking-wider transition-all text-xs rounded-md"
                            >
                              ⭐ ADD TO WATCHLIST (W)
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setWatchlist(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(selectedListing._id);
                                  return newSet;
                                });
                              }}
                              className="w-full px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 hover:bg-yellow-500/30 text-yellow-400 font-bold uppercase tracking-wider transition-all text-xs rounded-md"
                            >
                              ✓ WATCHING
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Quick Actions Hint */}
                    <div className="text-center text-gray-500 text-[9px] uppercase">
                      Press B to buy • W for watchlist • ESC to close
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