"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import CreateListingModal from "@/components/CreateListingModal";
import MakeOfferModal from "@/components/MakeOfferModal";
import GlobalBackground from "@/components/GlobalBackground";
import ShopSystem from "@/lib/shopSystem";

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

// Available essence images
const ESSENCE_IMAGES = [
  '/essence-images/75px/webp/bumblebee 1_tn1.webp',
  '/essence-images/75px/webp/bumblebee 2_tn1.webp',
  '/essence-images/75px/webp/bumblebee 3_tn1.webp'
];

// Function to get essence image based on a stable index (no randomness)
const getEssenceImage = (index: number) => {
  return ESSENCE_IMAGES[index % ESSENCE_IMAGES.length];
};

// Random Mek portraits for sellers
const MEK_PORTRAITS = [
  "/mek-images/150px/000-000-000.webp",
  "/mek-images/150px/111-111-111.webp",
  "/mek-images/150px/222-222-222.webp",
  "/mek-images/150px/333-333-333.webp",
  "/mek-images/150px/444-444-444.webp",
  "/mek-images/150px/555-555-555.webp",
  "/mek-images/150px/666-666-666.webp",
  "/mek-images/150px/777-777-777.webp",
  "/mek-images/150px/888-888-888.webp",
  "/mek-images/150px/999-999-999.webp",
  "/mek-images/150px/aa1-aa1-cd1.webp",
  "/mek-images/150px/aa1-aa3-hn1.webp",
  "/mek-images/150px/aa1-aa4-gk1.webp",
  "/mek-images/150px/aa1-ak1-bc2.webp",
  "/mek-images/150px/aa1-ak1-de1.webp",
];

// Get a stable Mek portrait for a seller based on their ID
const getMekPortrait = (sellerId: string) => {
  const hash = sellerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return MEK_PORTRAITS[hash % MEK_PORTRAITS.length];
};

// Quick filter chips removed - moved to sort dropdown

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
  { id: "new_today", name: "New Today" },
  { id: "rare_filter", name: "Rare" },
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
  const [timePeriod, setTimePeriod] = useState("last"); // Time period for history columns
  const [barStyle, setBarStyle] = useState("style3"); // Bar style for progress bars - Default to Neon
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [showMakeOffer, setShowMakeOffer] = useState(false);
  const [showMyListings, setShowMyListings] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showMekChipsDropdown, setShowMekChipsDropdown] = useState(false);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [showOnlyAffordable, setShowOnlyAffordable] = useState(false);
  const [hoveredListing, setHoveredListing] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [selectedUniChipTier, setSelectedUniChipTier] = useState<string>("T1");
  const [showUniChipDropdown, setShowUniChipDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const uniChipDropdownRef = useRef<HTMLDivElement>(null);

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
  const userProfileQuery = useQuery(
    api.users.getUserProfile,
    userId ? { walletAddress: "demo_wallet_123" } : "skip"
  );

  // Override gold for testing UI with insufficient funds
  const userProfile = userProfileQuery ? { ...userProfileQuery, gold: 1000 } : null;

  // Set current time on client only to avoid hydration mismatch - UPDATE EVERY SECOND
  useEffect(() => {
    setCurrentTime(Date.now());
    // Update time every second for real-time countdown
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
          const searchInput = document.querySelector('input[placeholder="Search..."]') as HTMLInputElement;
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
      if (uniChipDropdownRef.current && !uniChipDropdownRef.current.contains(event.target as Node)) {
        setShowUniChipDropdown(false);
      }
    };

    if (showMekChipsDropdown || showUniChipDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMekChipsDropdown, showUniChipDropdown]);

  // Mock data for demonstration with enhanced attributes
  const mockListings: Listing[] = [
    // HEAD CHIPS - With varied expiration times for color demonstration
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
      expiresAt: Date.now() + 150000, // 2.5 minutes - will show red
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
      expiresAt: Date.now() + 2400000, // 40 minutes - will show orange
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
      expiresAt: Date.now() + 21600000, // 6 hours - will show yellow
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
      expiresAt: Date.now() + 86400000, // 24 hours - will show white
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
      expiresAt: Date.now() + 120000, // 2 minutes - red
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
      expiresAt: Date.now() + 2700000, // 45 minutes - orange
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
      expiresAt: Date.now() + 32400000, // 9 hours - yellow
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
      expiresAt: Date.now() + 90000, // 1.5 minutes - red
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
      expiresAt: Date.now() + 3000000, // 50 minutes
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

    // ESSENCE - with various quantities for progress bar
    {
      _id: "12" as Id<"marketListings">,
      sellerId: "seller12" as Id<"users">,
      sellerName: "EssenceKing",
      sellerRating: 4.9,
      sellerSales: 1567,
      itemType: "essence",
      itemVariation: "Stone Essence",
      essenceType: "stone",
      quantity: 3.5,
      pricePerUnit: 100,
      marketAverage: 1100,
      salesVolume24h: 34,
      listedAt: Date.now() - 1800000,
      expiresAt: Date.now() + 180000, // 3 minutes
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
      quantity: 7.3,
      pricePerUnit: 250,
      marketAverage: 2800,
      lastSoldPrice: 2600,
      salesVolume24h: 12,
      listedAt: Date.now() - 7200000,
      expiresAt: Date.now() + 2400000, // 40 minutes
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
      pricePerUnit: 800,
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
      itemVariation: "The Lethal Dimension",
      essenceType: "candy",
      quantity: 10.0,
      pricePerUnit: 50,
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
      quantity: 8,
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
      expiresAt: Date.now() + 2100000, // 35 minutes
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
      itemVariation: "Ace of Spades Ultimate",
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
    // My Listings filter - show only user's listings
    if (showMyListings) {
      if (listing.sellerId !== userId) return false;
    }

    // Category filter
    if (selectedCategory === "head" || selectedCategory === "body" || selectedCategory === "trait") {
      if (listing.itemType !== selectedCategory) return false;
    } else if (selectedCategory === "uni-chips") {
      // For uni-chips, check both "universal-chips" (legacy) and "uni-chips"
      if (listing.itemType !== "universal-chips" && listing.itemType !== "uni-chips") return false;
      // Optionally filter by tier if you want to implement tier filtering
      // if (listing.itemVariation && !listing.itemVariation.includes(selectedUniChipTier)) return false;
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

    // Apply sort-based filtering for New Today and Rare
    if (sortBy === "new_today") {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      if (listing.listedAt < oneDayAgo) return false;
    }

    if (sortBy === "rare_filter") {
      if (listing.rarity !== "epic" && listing.rarity !== "legendary") return false;
    }

    return true;
  });

  // Sort listings using ShopSystem
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
      case "most_rare":
        return ShopSystem.compareRarity(a.rarity || 'common', b.rarity || 'common', false);
      case "least_rare":
        return ShopSystem.compareRarity(a.rarity || 'common', b.rarity || 'common', true);
      case "new_today":
      case "rare_filter":
        return b.listedAt - a.listedAt;
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

  // Render quantity progress bar based on selected style
  const renderQuantityBar = (quantity: number, maxQuantity: number = 10, essenceType?: string) => {
    const percentage = Math.min((quantity / maxQuantity) * 100, 100);

    // Get color for essence bars
    const getBarColor = () => {
      if (!essenceType) return { color: '#22d3ee', rgb: '34, 211, 238' }; // Default cyan

      const colors: Record<string, { color: string; rgb: string }> = {
        stone: { color: '#94a3b8', rgb: '148, 163, 184' }, // Slate gray
        disco: { color: '#ec4899', rgb: '236, 72, 153' }, // Pink
        paul: { color: '#fbbf24', rgb: '251, 191, 36' }, // Amber
        cartoon: { color: '#06b6d4', rgb: '6, 182, 212' }, // Cyan
        candy: { color: '#f472b6', rgb: '244, 114, 182' }, // Pink
        tiles: { color: '#8b5cf6', rgb: '139, 92, 246' }, // Violet
        moss: { color: '#10b981', rgb: '16, 185, 129' }, // Emerald
        bullish: { color: '#ef4444', rgb: '239, 68, 68' }, // Red
        journalist: { color: '#6b7280', rgb: '107, 114, 128' }, // Gray
        laser: { color: '#dc2626', rgb: '220, 38, 38' }, // Red
        flashbulb: { color: '#facc15', rgb: '250, 204, 21' }, // Yellow
        accordion: { color: '#a16207', rgb: '161, 98, 7' }, // Brown
        turret: { color: '#164e63', rgb: '22, 78, 99' }, // Teal
        drill: { color: '#ea580c', rgb: '234, 88, 12' }, // Orange
        security: { color: '#1e3a8a', rgb: '30, 58, 138' }, // Blue
      };

      return colors[essenceType] || { color: '#22d3ee', rgb: '34, 211, 238' };
    };

    switch (barStyle) {
      case "style1": // Classic gradient bar
        return (
          <div className="relative w-full h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        );

      case "style2": // Segmented blocks
        return (
          <div className="flex gap-0.5">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 ${
                  i < Math.ceil(quantity)
                    ? i < Math.floor(quantity)
                      ? 'bg-yellow-500'
                      : 'bg-yellow-500/50'
                    : 'bg-gray-700'
                } ${i === 0 ? 'rounded-l' : ''} ${i === 9 ? 'rounded-r' : ''}`}
              />
            ))}
          </div>
        );

      case "style3": // Glowing neon bar with dynamic colors
        const barColor = getBarColor();
        return (
          <div className="relative w-full h-1.5 bg-black rounded-full border border-gray-800/50">
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
              style={{
                width: `${percentage}%`,
                backgroundColor: barColor.color,
                boxShadow: `0 0 10px rgba(${barColor.rgb}, 0.8), 0 0 20px rgba(${barColor.rgb}, 0.5), inset 0 0 5px rgba(255,255,255,0.3)`
              }}
            />
          </div>
        );

      case "style4": // Dotted progress
        return (
          <div className="flex gap-1">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i < quantity
                    ? 'bg-yellow-400 scale-100'
                    : 'bg-gray-700 scale-75'
                }`}
              />
            ))}
          </div>
        );

      case "style5": // Industrial hazard stripes
        return (
          <div className="relative w-full h-2 bg-gray-900 border border-yellow-500/30 rounded-sm overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full transition-all duration-300"
              style={{
                width: `${percentage}%`,
                background: 'repeating-linear-gradient(45deg, #fab617 0px, #fab617 3px, #000 3px, #000 6px)'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen text-white overflow-hidden relative">
      <GlobalBackground />


      {/* Main Content */}
      <div className="relative z-10 h-screen flex flex-col">
        {/* Title Section - Narrower Header with Swapped Elements */}
        <div className="relative mek-card-industrial mek-border-sharp-gold py-2 px-4 mek-glow-yellow mx-4 mt-4 mb-2">
          {/* Hazard Stripes Header */}
          <div className="absolute top-0 left-0 right-0 h-1.5 mek-overlay-hazard-stripes opacity-60" />

          {/* Grunge Overlays */}
          <div className="absolute inset-0 mek-overlay-scratches pointer-events-none" />

          <div className="relative flex items-center justify-between">
            {/* Gold Balance - Bottom Left */}
            <div className="flex flex-col">
              <div className="text-[9px] text-gray-500 uppercase">Your Balance</div>
              <div className="gold-display-medium">
                {Math.floor(userProfile?.gold || 0).toLocaleString()}
              </div>
            </div>

            {/* SHOP Title - Centered */}
            <h1 className="mek-text-industrial text-3xl text-yellow-400 mek-text-shadow absolute left-1/2 -translate-x-1/2">
              SHOP
            </h1>

            {/* Action Buttons - Right Side */}
            <div className="flex gap-2">
              {/* Create Listing Button */}
              <button
                onClick={() => setShowCreateListing(true)}
                className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-[10px] uppercase tracking-wider transition-all rounded shadow-lg shadow-yellow-500/30"
              >
                + CREATE
              </button>

              {/* My Listings Button */}
              <button
                onClick={() => setShowMyListings(!showMyListings)}
                className={`px-3 py-1 font-bold text-[10px] uppercase tracking-wider transition-all rounded flex items-center gap-1.5 ${
                  showMyListings
                    ? 'bg-green-500 text-black shadow-lg shadow-green-500/30'
                    : 'bg-black/50 border border-green-500/30 text-green-400 hover:bg-green-500/10'
                }`}
              >
                {showMyListings ? '✓ MY LISTINGS' : 'MY LISTINGS'}
                {filteredListings.filter(l => l.sellerId === userId).length > 0 && (
                  <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${
                    showMyListings
                      ? 'bg-black/30 text-green-100'
                      : 'bg-green-400/20 text-green-400'
                  }`}>
                    {filteredListings.filter(l => l.sellerId === userId).length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Single Column Full Width Layout */}
        <div className="flex-1 px-3 pb-3 overflow-hidden">
          {/* Full Width Table with Space-Weathered Glass Effect (Style P - Heavy Meteor Damage) */}
          <div className="relative rounded-lg overflow-hidden flex flex-col h-full"
            style={{
              background: 'rgba(255, 255, 255, 0.005)',
              backdropFilter: 'blur(1px)',
              border: '1px solid rgba(255, 255, 255, 0.015)',
              boxShadow: '0 0 20px rgba(0, 0, 0, 0.2) inset',
            }}
          >
            {/* Complex stress fracture network from meteor impacts */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,30 L3,28 L5,31 L8,29 L11,32 L14,30 L17,33 L20,31" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" fill="none"/>
              <path d="M100,0 L98,3 L101,5 L99,8 L102,10 L100,13" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none" transform="translate(-8, 0)"/>
              <path d="M95,95 L93,93 L96,91 L94,89 L97,87 L95,85" stroke="rgba(255,255,255,0.11)" strokeWidth="0.3" fill="none" transform="translate(0, 0)"/>
              <path d="M0,70 L2,68 L4,71 L6,69 L8,72 L10,70 L12,73" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" fill="none"/>
              <path d="M20,45 L35,42 L40,48 L55,45 L60,50" stroke="rgba(255,255,255,0.08)" strokeWidth="0.2" fill="none"/>
              <path d="M45,20 L50,18 L53,22 L58,19 L62,23" stroke="rgba(255,255,255,0.07)" strokeWidth="0.2" fill="none"/>
              <path d="M10,60 L25,58 L30,62 L45,59 L50,63" stroke="rgba(255,255,255,0.06)" strokeWidth="0.2" fill="none"/>
              {/* Micro debris from impacts */}
              <circle cx="20%" cy="40%" r="0.5" fill="rgba(255,255,255,0.03)"/>
              <circle cx="70%" cy="60%" r="0.3" fill="rgba(255,255,255,0.02)"/>
              <circle cx="45%" cy="25%" r="0.4" fill="rgba(255,255,255,0.025)"/>
              <circle cx="85%" cy="45%" r="0.3" fill="rgba(255,255,255,0.02)"/>
              <circle cx="15%" cy="75%" r="0.4" fill="rgba(255,255,255,0.02)"/>
              <circle cx="55%" cy="85%" r="0.3" fill="rgba(255,255,255,0.015)"/>
            </svg>

            {/* Damage gradient overlays */}
            <div
              className="absolute inset-0 pointer-events-none opacity-60"
              style={{
                background: `
                  radial-gradient(ellipse at 10% 10%, rgba(250, 182, 23, 0.008) 0%, transparent 25%),
                  radial-gradient(ellipse at 90% 90%, rgba(59, 130, 246, 0.006) 0%, transparent 25%),
                  radial-gradient(circle at 50% 50%, transparent 20%, rgba(255, 255, 255, 0.001) 50%, transparent 80%),
                  linear-gradient(135deg, transparent 45%, rgba(255, 255, 255, 0.002) 50%, transparent 55%)`,
              }}
            />

            {/* Cosmic noise texture for additional weathering */}
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='300' height='300' viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='cosmicNoise'%3E%3CfeTurbulence baseFrequency='2' numOctaves='1' seed='5' /%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23cosmicNoise)' opacity='0.008'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Content wrapper */}
            <div className="relative z-10 flex flex-col h-full">

              {/* Bar Style Selector */}
              <div className="absolute top-2 right-2 z-20">
                <select
                  value={barStyle}
                  onChange={(e) => setBarStyle(e.target.value)}
                  className="px-2 py-1 bg-black/80 border border-gray-700 rounded text-white text-[9px] font-medium"
                >
                  <option value="style1">Bar Style 1: Gradient</option>
                  <option value="style2">Bar Style 2: Segments</option>
                  <option value="style3">Bar Style 3: Neon</option>
                  <option value="style4">Bar Style 4: Dots</option>
                  <option value="style5">Bar Style 5: Hazard</option>
                </select>
              </div>

              {/* Category, Search, and Sort Bar - SWAPPED */}
              <div className="px-3 py-1.5 bg-gradient-to-r from-amber-950/30 via-brown-900/20 to-amber-950/30 backdrop-blur-sm border-b border-amber-700/20">
                <div className="flex items-center gap-2">
                  {/* Category Buttons - Far Left */}
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
                              onClick={() => {
                                setShowMekChipsDropdown(!showMekChipsDropdown);
                                setShowUniChipDropdown(false); // Close other dropdown
                              }}
                              className={`px-3 py-2 font-bold uppercase text-[11px] tracking-wider transition-all rounded flex items-center gap-1 ${
                                isActive
                                  ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-500/30 animate-pulse'
                                  : 'bg-black/40 text-gray-400 hover:text-yellow-400 border border-gray-700/50 hover:border-yellow-500/50 hover:scale-105'
                              }`}
                            >
                              {cat.name}
                              <svg className={`w-2.5 h-2.5 transition-transform ${showMekChipsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {/* Dropdown moved below */}
                          </div>
                        );
                      }

                      if (isUniChips) {
                        return (
                          <div key={cat.id} className="relative flex items-center gap-1">
                            <button
                              onClick={() => setSelectedCategory(cat.id)}
                              className={`px-3 py-2 font-bold uppercase text-[11px] tracking-wider transition-all rounded ${
                                isActive
                                  ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-500/30 animate-pulse'
                                  : 'bg-black/40 text-gray-400 hover:text-yellow-400 border border-gray-700/50 hover:border-yellow-500/50 hover:scale-105'
                              }`}
                            >
                              {cat.name}
                            </button>
                            {isActive && (
                              <div className="relative" ref={uniChipDropdownRef}>
                                <button
                                  onClick={() => {
                                    setShowUniChipDropdown(!showUniChipDropdown);
                                    setShowMekChipsDropdown(false); // Close other dropdown
                                  }}
                                  className="px-2 py-1.5 bg-gray-900/80 border border-gray-700 rounded text-yellow-400 text-xs font-medium hover:border-yellow-500/50 flex items-center gap-1"
                                >
                                  {selectedUniChipTier}
                                  <svg className={`w-2.5 h-2.5 transition-transform ${showUniChipDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                                {showUniChipDropdown && (
                                  <div className="absolute top-full mt-1 right-0 z-50 bg-black/95 border border-yellow-500/50 rounded-md">
                                    <div className="max-h-60 overflow-y-auto">
                                      {UNI_CHIP_TIERS.map((tier) => (
                                        <button
                                          key={tier}
                                          onClick={() => {
                                            setSelectedUniChipTier(tier);
                                            setShowUniChipDropdown(false);
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
                          className={`px-3 py-2 font-bold uppercase text-[11px] tracking-wider transition-all rounded ${
                            isActive
                              ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-500/30 animate-pulse'
                              : 'bg-black/40 text-gray-400 hover:text-yellow-400 border border-gray-700/50 hover:border-yellow-500/50 hover:scale-105'
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Search Bar - Center/Right */}
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search..."
                      className="w-32 px-2 py-1 bg-black/40 border border-gray-700/50 rounded-md text-white text-[10px] placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="px-1.5 py-1 bg-gray-900/60 border border-gray-700 rounded text-gray-400 text-[9px] hover:border-gray-500 hover:text-gray-300 transition-colors"
                      >
                        X
                      </button>
                    )}
                  </div>

                  {/* Sort Dropdown - Far Right */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 text-[9px] font-medium uppercase">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-2 py-1 bg-gray-900/80 border border-gray-700 rounded text-white text-[10px] font-medium hover:border-yellow-500/50 focus:border-yellow-500 focus:outline-none transition-colors cursor-pointer"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Dropdown Rows for Subcategories */}
              {showMekChipsDropdown && (
                <div className="px-3 py-1.5 bg-black/50 border-b border-yellow-500/20">
                  <div className="flex gap-2">
                    {CATEGORIES.find(c => c.id === 'mek-chips')?.subcategories?.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setSelectedCategory(sub.id);
                          setShowMekChipsDropdown(false);
                        }}
                        className={`px-2.5 py-1 font-bold uppercase text-[10px] tracking-wider transition-all rounded ${
                          selectedCategory === sub.id
                            ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                            : 'bg-black/40 text-gray-400 hover:text-yellow-400 border border-gray-700/50 hover:border-yellow-500/50'
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Uni Chips Tier Row */}
              {selectedCategory === 'uni-chips' && showUniChipDropdown && (
                <div className="px-3 py-1.5 bg-black/50 border-b border-yellow-500/20">
                  <div className="flex gap-2">
                    {UNI_CHIP_TIERS.map((tier) => (
                      <button
                        key={tier}
                        onClick={() => {
                          setSelectedUniChipTier(tier);
                          setShowUniChipDropdown(false);
                        }}
                        className={`px-2 py-1 font-bold text-[10px] rounded ${
                          selectedUniChipTier === tier
                            ? 'bg-yellow-500 text-black'
                            : 'bg-black/40 text-gray-400 hover:text-yellow-400 border border-gray-700/50'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative flex-1 overflow-auto">

                {/* My Listings Indicator */}
                {showMyListings && (
                  <div className="bg-green-500/20 border-b border-green-500/50 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 font-bold text-xs uppercase">Viewing Your Listings</span>
                      <span className="text-gray-400 text-xs">({sortedListings.length} active)</span>
                    </div>
                    <button
                      onClick={() => setShowMyListings(false)}
                      className="text-gray-400 hover:text-white text-xs underline"
                    >
                      Back to Marketplace
                    </button>
                  </div>
                )}

                {/* Listings Table - Dynamic Headers Based on Category */}
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gradient-to-r from-amber-950/60 via-brown-900/50 to-amber-950/60 backdrop-blur-md border-b-2 border-amber-700/30">
                      <th className="py-1.5 px-0.5 text-left text-amber-200/70 text-[10px] font-semibold uppercase tracking-wider"></th>
                      <th className="py-1.5 px-0.5 text-left text-amber-200/70 text-[10px] font-semibold uppercase tracking-wider">Name</th>
                      <th className="py-1.5 px-0.5 text-center text-amber-200/70 text-[10px] font-semibold uppercase tracking-wider">Seller</th>

                      {/* History Period Columns - Using compact tabs layout */}
                      <th className="py-1.5 px-1 text-center border-l border-r border-amber-700/30" colSpan={3}>
                        <div className="flex justify-center">
                          <div className="inline-flex bg-black/50 rounded-sm">
                            {['last', '24h', '5d', '25d'].map((period, idx) => (
                              <button
                                key={period}
                                onClick={() => setTimePeriod(period)}
                                className={`px-3 py-1 text-[9px] font-bold uppercase transition-all ${
                                  timePeriod === period
                                    ? 'bg-yellow-500 text-black'
                                    : 'text-gray-400 hover:text-yellow-400'
                                } ${idx === 0 ? 'rounded-l-sm' : ''} ${idx === 3 ? 'rounded-r-sm' : ''}`}
                              >
                                {period}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-around text-[9px] text-amber-200/50 mt-1">
                          <span>AVG</span>
                          <span>QTY</span>
                          <span>VOL</span>
                        </div>
                      </th>

                      {/* Units column moved here */}
                      <th className="py-1.5 px-1 text-center text-amber-200/70 text-[10px] font-semibold uppercase tracking-wider">Units</th>

                      {/* Price columns */}
                      <th className="py-1.5 px-1 text-center text-amber-200/70 text-[10px] font-semibold uppercase tracking-wider">Price/Unit</th>
                      <th className="py-1.5 px-1 text-center text-amber-200/70 text-[10px] font-semibold uppercase tracking-wider">Total</th>
                      <th className="py-1.5 px-1 text-center text-amber-200/70 text-[10px] font-semibold uppercase tracking-wider">Remaining</th>
                      <th className="py-1.5 px-1 text-center text-amber-200/70 text-[10px] font-semibold uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedListings.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-16 text-center">
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
                        const isGoodDeal = listing.marketAverage
                          ? ShopSystem.isGoodDeal(listing.pricePerUnit, listing.marketAverage)
                          : false;

                        // Format time remaining with seconds - REAL TIME
                        const formatTimeRemaining = (expiresAt: number | undefined) => {
                          if (!expiresAt) return '—';
                          if (!currentTime) return '24h 00m 00s';
                          const remaining = expiresAt - currentTime;
                          if (remaining <= 0) return 'Expired';
                          const hours = Math.floor(remaining / (1000 * 60 * 60));
                          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                          const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                          return `${hours}h ${minutes}m ${seconds}s`;
                        };

                        return (
                          <tr
                            key={listing._id}
                            className={`border-b transition-all group relative ${
                              isOwn
                                ? 'bg-gradient-to-r from-green-500/15 via-green-500/10 to-transparent border-green-500/30 backdrop-blur-sm'
                                : 'border-amber-800/20 backdrop-blur-sm'
                            }`}
                          >
                            {/* Item Icon with Rarity */}
                            <td className="py-1.5 px-0.5">
                              <div className="relative">
                                {listing.itemType === 'essence' ? (
                                  <img
                                    src={getEssenceImage(parseInt(listing._id, 36))}
                                    alt="Essence"
                                    className="w-9 h-9 object-contain"
                                  />
                                ) : (
                                  <div
                                    className={`w-7 h-7 rounded flex items-center justify-center font-bold text-[10px] text-black border ${rarityStyle.border}`}
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

                            {/* Name with Progress Bar */}
                            <td className="py-1 px-0.5">
                              <div>
                                <div className="text-white text-[11px] font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                                  {listing.itemVariation || listing.itemType}
                                </div>
                                {/* Progress bar under name */}
                                <div className="mt-1 relative">
                                  {renderQuantityBar(listing.quantity, 10, listing.essenceType)}
                                  <div className="absolute -top-3 right-0 text-[9px] text-yellow-400 font-bold">
                                    {listing.quantity}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Seller - moved closer to name */}
                            <td className="py-1 px-0.5 text-center">
                              {isOwn ? (
                                <div className="text-yellow-400 text-[11px] font-bold">YOU</div>
                              ) : (
                                <div className="relative inline-block mx-auto">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log('View seller profile:', listing.sellerName);
                                    }}
                                    className="block relative group"
                                  >
                                    <img
                                      src={getMekPortrait(listing.sellerId)}
                                      alt="Seller"
                                      className="w-[30px] h-[30px] rounded-full border border-gray-700 transition-all duration-200 group-hover:scale-110 group-hover:border-yellow-500 cursor-pointer mx-auto"
                                    />
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-black/90 border border-yellow-500/50 rounded text-yellow-400 text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                      {listing.sellerName || 'Unknown'}
                                    </div>
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* Time Period Data - Bracketed Columns */}
                            <td className="py-1 px-1 text-center border-l border-amber-800/20">
                              <div className="text-[11px] text-yellow-400/70 font-mono">
                                {(timePeriod === 'last' ? (listing.lastSoldPrice || listing.pricePerUnit) :
                                 timePeriod === '24h' ? (listing.marketAverage || listing.pricePerUnit) :
                                 timePeriod === '5d' ? Math.round((listing.marketAverage || listing.pricePerUnit) * 0.95) :
                                 Math.round((listing.marketAverage || listing.pricePerUnit) * 0.9)).toLocaleString()}/unit
                              </div>
                            </td>
                            <td className="py-1 px-1 text-center">
                              <div className="text-[11px] text-gray-400 font-mono">
                                {timePeriod === 'last' ? 1 :
                                 timePeriod === '24h' ? listing.salesVolume24h || 0 :
                                 timePeriod === '5d' ? (listing.salesVolume24h || 0) * 5 :
                                 (listing.salesVolume24h || 0) * 25}
                              </div>
                            </td>
                            <td className="py-1 px-1 text-center border-r border-amber-800/20">
                              <div className="text-[11px] text-gray-400 font-mono">
                                {(timePeriod === 'last' ? (listing.lastSoldPrice || listing.pricePerUnit) :
                                 timePeriod === '24h' ? (listing.salesVolume24h || 0) * listing.pricePerUnit :
                                 timePeriod === '5d' ? (listing.salesVolume24h || 0) * 5 * listing.pricePerUnit :
                                 (listing.salesVolume24h || 0) * 25 * listing.pricePerUnit).toLocaleString()}
                              </div>
                            </td>

                            {/* Units for Sale - Moved here */}
                            <td className="py-1 px-1 text-center">
                              <div className="text-yellow-400 text-[12px] font-bold">
                                {listing.quantity}
                              </div>
                            </td>

                            {/* Current Listing Price Per Unit - Blue color */}
                            <td className="py-1 px-1 text-center">
                              <div className="text-blue-400 text-[10px] font-bold">
                                {listing.pricePerUnit.toLocaleString()}/unit
                              </div>
                            </td>

                            {/* Total Gold Column */}
                            <td className="py-1 px-1 text-center">
                              <div className="text-yellow-400 text-[11px] font-bold">
                                {totalPrice.toLocaleString()}g
                              </div>
                            </td>

                            {/* Time Remaining - Before Buy Button with Color Coding */}
                            <td className="py-1 px-1 text-center">
                              {(() => {
                                const timeString = formatTimeRemaining(listing.expiresAt || Date.now() + 86400000);
                                const remaining = (listing.expiresAt || Date.now() + 86400000) - (currentTime || Date.now());
                                const hours = remaining / (1000 * 60 * 60);
                                const minutes = remaining / (1000 * 60);

                                let textColor = 'text-white'; // Default - plenty of time
                                if (minutes <= 10) {
                                  textColor = 'text-red-500'; // Less than 10 minutes
                                } else if (hours <= 1) {
                                  textColor = 'text-orange-500'; // Less than 1 hour
                                } else if (hours <= 12) {
                                  textColor = 'text-yellow-500'; // Less than 12 hours
                                }

                                return (
                                  <div className={`${textColor} text-[10px] font-medium whitespace-nowrap`}>
                                    {timeString}
                                  </div>
                                );
                              })()}
                            </td>

                            {/* Actions - Buy Button (last column) - GREY when can't afford */}
                            <td className="py-1 px-1 text-center">
                              {isOwn ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelListing(listing._id);
                                  }}
                                  className="px-2 py-0.75 bg-green-500/30 border border-green-400 text-green-300 font-bold uppercase tracking-wider transition-all text-[10px] rounded shadow-lg shadow-green-500/40 animate-pulse hover:bg-green-500/40 hover:border-green-300"
                                >
                                  YOUR LISTING
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePurchase(listing._id);
                                  }}
                                  disabled={!canAfford}
                                  title={!canAfford ? 'You do not have enough gold' : ''}
                                  className={`px-2 py-0.75 font-bold uppercase tracking-wider transition-all text-[10px] rounded ${
                                    canAfford
                                      ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/30'
                                      : 'bg-gray-700 hover:bg-gray-600 text-gray-400 cursor-not-allowed'
                                  }`}
                                >
                                  BUY
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
          </div>
        </div>

        {/* Create Listing Modal */}
        <CreateListingModal
          show={showCreateListing}
          onClose={() => setShowCreateListing(false)}
          onCreate={handleCreateListing}
          userEssence={userProfile?.totalEssence}
          userGold={userProfile?.gold}
        />

        {/* Make Offer Modal */}
        {showMakeOffer && selectedListing && (
          <MakeOfferModal
            listing={selectedListing}
            userGold={userProfile?.gold || 0}
            onClose={() => setShowMakeOffer(false)}
            onSubmit={(offer) => {
              console.log('Offer submitted:', offer);
              // TODO: Implement offer submission to backend
              setShowMakeOffer(false);
            }}
          />
        )}
      </div>
    </div>
  );
}