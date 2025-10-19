"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ALL_VARIATIONS_FLAT } from "@/lib/variationsReferenceData";
import EssenceListingLightboxV5YellowGradient from "@/components/EssenceListingLightbox-V5-YellowGradient";
import { renderHeaderButtons } from "@/lib/headerButtonVariations";

// Variation type categories for essence filtering
const RARITY_CATEGORIES = [
  { id: "all", name: "All Essence" },
  { id: "head", name: "Head" },
  { id: "body", name: "Body" },
  { id: "trait", name: "Trait" },
];

const SORT_OPTIONS = [
  { id: "price_asc", name: "Price: Low to High" },
  { id: "price_desc", name: "Price: High to Low" },
  { id: "recent", name: "Recently Listed" },
  { id: "ending_soon", name: "Ending Soon" },
];

// Listing duration options (days) with costs
const DURATION_OPTIONS = [
  { days: 1, label: "1 Day", cost: 100 },
  { days: 3, label: "3 Days", cost: 200 },
  { days: 7, label: "7 Days", cost: 500 },
  { days: 14, label: "14 Days", cost: 800 },
  { days: 30, label: "30 Days", cost: 1500 },
];

export default function EssenceMarketPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [selectedRarity, setSelectedRarity] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const dropdownMenuStyle = 3; // Locked to Style 3: Black Gloss
  const [debugPanelCollapsed, setDebugPanelCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyMyListings, setShowOnlyMyListings] = useState(false);
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [showOffersView, setShowOffersView] = useState(false);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [showFulfillRequest, setShowFulfillRequest] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [buttonStyle, setButtonStyle] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [headerLayout, setHeaderLayout] = useState<1 | 2 | 3 | 4 | 5>(1);
  const headerButtonStyle = 5; // Locked to Style 5: Brushed Metal
  const [goldDisplayVariation, setGoldDisplayVariation] = useState<1 | 2 | 3 | 4>(1);
  const [timeRemainingStyle, setTimeRemainingStyle] = useState<1 | 2 | 3>(1);
  const priceLayoutStyle = 8; // Locked to Style 8: Three-Row Compact
  const [listingCardStyle, setListingCardStyle] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>(1);
  const [buyOrderLayout, setBuyOrderLayout] = useState<1 | 2 | 3 | 4 | 5 | 6>(4);
  const [buyOrderSection, setBuyOrderSection] = useState<"open" | "mine">("open");
  const [buttonVariation, setButtonVariation] = useState<number>(1);
  const [debugListingCount, setDebugListingCount] = useState<number>(0);

  // Listing form state
  const [selectedVariation, setSelectedVariation] = useState("");
  const [essenceAmount, setEssenceAmount] = useState("1");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(7);

  // Request form state
  const [requestVariation, setRequestVariation] = useState("");
  const [requestAmount, setRequestAmount] = useState("1");
  const [requestTotalPrice, setRequestTotalPrice] = useState("");

  // Update current time every second for countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.sort-dropdown-container')) {
        setSortDropdownOpen(false);
      }
      if (!target.closest('.category-dropdown-container')) {
        setCategoryDropdownOpen(false);
      }
    };

    if (sortDropdownOpen || categoryDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [sortDropdownOpen, categoryDropdownOpen]);

  // Format countdown timer - Only show detailed countdown when less than 1 day
  const formatCountdown = (expiresAt: number) => {
    const remaining = expiresAt - currentTime;
    if (remaining <= 0) return "EXPIRED";

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    // If at least 1 day remaining, only show days
    if (days >= 1) {
      return `${days}d`;
    }

    // If less than 1 day, show hours, minutes, seconds
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(" ");
  };

  // Get countdown styling based on remaining time
  const getCountdownStyles = (expiresAt: number) => {
    const remaining = expiresAt - currentTime;

    // Expired - red and alarming
    if (remaining <= 0) {
      return {
        containerClass: "bg-red-900/20 border border-red-500/30",
        labelClass: "text-red-400/60",
        timeClass: "text-red-400"
      };
    }

    const totalHours = remaining / (1000 * 60 * 60);

    // Below 1 hour - orange
    if (totalHours < 1) {
      return {
        containerClass: "bg-orange-900/10 border border-orange-500/20",
        labelClass: "text-orange-400/70",
        timeClass: "text-orange-400"
      };
    }

    // 1-12 hours - yellow
    if (totalHours < 12) {
      return {
        containerClass: "bg-yellow-900/10 border border-yellow-500/20",
        labelClass: "text-yellow-400/70",
        timeClass: "text-yellow-400"
      };
    }

    // 12+ hours - white (calm and neutral)
    return {
      containerClass: "bg-white/5 border border-white/20",
      labelClass: "text-white/70",
      timeClass: "text-white"
    };
  };

  // Get or create user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);

  useEffect(() => {
    const initUser = async () => {
      const user = await getOrCreateUser({ walletAddress: "demo_wallet_123" });
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

  // Get essence listings
  const listingsData = useQuery(
    api.marketplace.getActiveListings,
    {
      itemType: "essence",
      searchTerm: searchTerm || undefined,
      limit: 100,
      offset: 0,
    }
  );

  const listings = listingsData?.listings || [];

  // Get user's own listings
  const myListings = useQuery(
    api.marketplace.getUserListings,
    userId ? { userId } : "skip"
  );

  // Get user's essence balances
  const essenceState = useQuery(
    api.essence.getPlayerEssenceState,
    { walletAddress: "demo_wallet_123" }
  );

  // Mutations
  const createListing = useMutation(api.marketplace.createListing);
  const purchaseItem = useMutation(api.marketplace.purchaseItem);
  const cancelListing = useMutation(api.marketplace.cancelListing);

  // Filter to only owned essence variations with amounts
  const ownedEssenceVariationsReal = (essenceState?.balances || [])
    .filter(b => b.accumulatedAmount > 0)
    .map(b => ({
      name: b.variationName,
      amount: b.accumulatedAmount
    }));

  // Add demo data for UI testing when no wallet connected or no essence owned
  const ownedEssenceVariations = ownedEssenceVariationsReal.length > 0
    ? ownedEssenceVariationsReal
    : [
        { name: "Bumblebee", amount: 5.0 },
        { name: "Bowling", amount: 2.5 },
        { name: "Blue Cheer", amount: 8.3 },
        { name: "Crystal Ball", amount: 1.0 },
        { name: "Disco Ball", amount: 15.7 },
      ];

  // Filter to essence variations the user does NOT own (for requests)
  const unownedEssenceVariations = ALL_VARIATIONS_FLAT.filter(variation => {
    const owned = essenceState?.balances.find(b => b.variationName === variation.name);
    return !owned || owned.accumulatedAmount === 0;
  });

  // Autocomplete search
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const matches = ALL_VARIATIONS_FLAT
        .filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 10)
        .map(v => v.name);
      setSearchSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  // Filter and sort listings
  const filteredListings = listings.filter(listing => {
    if (showOnlyMyListings && listing.sellerId !== userId) return false;

    // Filter by variation type (head/body/trait)
    if (selectedRarity !== "all" && listing.itemVariation) {
      const variation = ALL_VARIATIONS_FLAT.find(v => v.name === listing.itemVariation);
      if (variation && variation.type !== selectedRarity) return false;
    }

    return true;
  });

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

  // Handle create listing
  const handleCreateListing = async () => {
    if (!userId || !selectedVariation || !pricePerUnit || !essenceAmount) {
      alert("Please fill in all fields");
      return;
    }

    const amount = parseFloat(essenceAmount);
    const price = parseInt(pricePerUnit);
    const durationOption = DURATION_OPTIONS.find(d => d.days === selectedDuration);

    if (!durationOption) return;

    // Check if user can afford listing fee
    if (userProfile && userProfile.gold < durationOption.cost) {
      alert(`Insufficient gold. Listing fee: ${durationOption.cost}g`);
      return;
    }

    try {
      await createListing({
        sellerId: userId,
        itemType: "essence",
        itemVariation: selectedVariation,
        quantity: amount,
        pricePerUnit: price,
        durationDays: selectedDuration,
        listingFee: durationOption.cost,
      });

      setShowCreateListing(false);
      setSelectedVariation("");
      setEssenceAmount("1");
      setPricePerUnit("");
      alert("Listing created successfully!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred");
    }
  };

  // Handle purchase
  const handlePurchase = async (listingId: Id<"marketListings">, quantity: number) => {
    if (!userId) {
      alert("Please wait for user initialization...");
      return;
    }

    try {
      await purchaseItem({
        buyerId: userId,
        listingId,
        quantity,
      });
      alert("Purchase successful!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred");
    }
  };

  // Handle cancel listing
  const handleCancelListing = async (listingId: Id<"marketListings">) => {
    if (!userId) return;

    try {
      await cancelListing({ userId, listingId });
      alert("Listing cancelled!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred");
    }
  };

  // Handle create request
  const handleCreateRequest = async () => {
    if (!userId || !requestVariation || !requestTotalPrice || !requestAmount) {
      alert("Please fill in all fields");
      return;
    }

    const amount = parseFloat(requestAmount);
    const totalPrice = parseInt(requestTotalPrice);

    // Check if user can afford to lock the gold
    if (userProfile && userProfile.gold < totalPrice) {
      alert(`Insufficient gold. You need ${totalPrice}g to create this request.`);
      return;
    }

    try {
      // TODO: Create Convex mutation for creating requests
      // await createRequest({
      //   requesterId: userId,
      //   essenceVariation: requestVariation,
      //   quantity: amount,
      //   totalPrice: totalPrice,
      // });

      setShowCreateRequest(false);
      setRequestVariation("");
      setRequestAmount("1");
      setRequestTotalPrice("");
      alert("Request created successfully! Gold has been locked.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred");
    }
  };

  // Get button style and textures based on selected variation
  const getButtonStyle = (styleNum: 1 | 2 | 3 | 4 | 5) => {
    const baseClasses = "relative w-full px-4 py-2 font-bold uppercase tracking-wider transition-all text-sm cursor-pointer overflow-hidden";
    return baseClasses;
  };

  const getButtonClipPath = (styleNum: 1 | 2 | 3 | 4 | 5) => {
    switch(styleNum) {
      case 1: // Hazard Stripe Angled - Sharp diagonal cuts
        return 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))';
      case 2: // Military Notched - Aggressive beveled corners
        return 'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)';
      case 3: // Tactical Hexagon - Wide hexagonal shape
        return 'polygon(20px 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 20px 100%, 0 50%)';
      case 4: // Industrial Frame - Large corner cutouts creating bracket effect
        return 'polygon(24px 0, calc(100% - 24px) 0, calc(100% - 24px) 4px, calc(100% - 4px) 4px, calc(100% - 4px) 24px, 100% 24px, 100% calc(100% - 24px), calc(100% - 4px) calc(100% - 24px), calc(100% - 4px) calc(100% - 4px), calc(100% - 24px) calc(100% - 4px), calc(100% - 24px) 100%, 24px 100%, 24px calc(100% - 4px), 4px calc(100% - 4px), 4px calc(100% - 24px), 0 calc(100% - 24px), 0 24px, 4px 24px, 4px 4px, 24px 4px)';
      case 5: // Battle Scarred - Asymmetric aggressive cuts
        return 'polygon(8px 0, calc(100% - 20px) 0, 100% 12px, 100% calc(100% - 8px), calc(100% - 12px) 100%, 20px 100%, 0 calc(100% - 20px), 0 8px)';
      default:
        return undefined;
    }
  };

  const getButtonTextures = (styleNum: 1 | 2 | 3 | 4 | 5) => {
    switch(styleNum) {
      case 1: // Hazard Stripe Angled
        return (
          <>
            <div className="absolute inset-0 mek-overlay-hazard-stripes opacity-30" />
            <div className="absolute inset-0 mek-overlay-scratches opacity-20" />
          </>
        );
      case 2: // Military Notched
        return (
          <>
            <div className="absolute inset-0 mek-overlay-diagonal-stripes opacity-25" />
            <div className="absolute inset-0 mek-overlay-rust opacity-15" />
          </>
        );
      case 3: // Tactical Hexagon
        return (
          <>
            <div className="absolute inset-0 mek-overlay-metal-texture opacity-40" />
            <div className="absolute inset-0 mek-overlay-scratches opacity-25" />
          </>
        );
      case 4: // Industrial Frame
        return (
          <>
            <div className="absolute inset-0 mek-overlay-scratches opacity-30" />
            <div className="absolute inset-0" style={{
              background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(250, 182, 23, 0.05) 2px, rgba(250, 182, 23, 0.05) 4px)'
            }} />
          </>
        );
      case 5: // Battle Scarred
        return (
          <>
            <div className="absolute inset-0 mek-overlay-rust opacity-25" />
            <div className="absolute inset-0 mek-overlay-scratches opacity-35" />
            <div className="absolute inset-0 mek-overlay-metal-texture opacity-15" />
          </>
        );
      default:
        return null;
    }
  };

  // Helper to sanitize variation name to match bottle filenames
  const sanitizeVariationName = (name: string): string => {
    return name
      .replace(/'/g, '')
      .replace(/\./g, '')
      .replace(/&/g, 'and')
      .replace(/\?/g, '')
      .replace(/\//g, '-')
      .replace(/\\/g, '-')
      .replace(/:/g, '')
      .replace(/\*/g, '')
      .replace(/"/g, '')
      .replace(/</g, '')
      .replace(/>/g, '')
      .replace(/\|/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
  };

  // Price layout variations - Total-focused with glowing quantity boxes
  const renderPriceDisplay = (pricePerUnit: number, quantity: number, styleNum: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10) => {
    const totalPrice = pricePerUnit * quantity;
    const quantityFormatted = quantity.toFixed(1);

    switch(styleNum) {
      case 1: // Total Focused - Blue glowing quantity box
        return (
          <div className="mb-3 p-3 bg-black/60 border border-yellow-500/20 rounded-md">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="mek-label-uppercase text-yellow-400/60 text-[9px]">Total</span>
                  <div className="relative px-2 py-1 bg-blue-500/20 border border-blue-400/50 rounded shadow-[0_0_8px_rgba(59,130,246,0.4)]">
                    <span className="text-sm font-bold text-blue-300">{quantityFormatted}×</span>
                  </div>
                </div>
                <span className="text-2xl font-bold text-yellow-400">{totalPrice.toLocaleString()}<span className="text-base">g</span></span>
              </div>
              <div className="h-px bg-yellow-500/15" />
              <div className="flex items-baseline justify-between">
                <span className="text-[8px] text-gray-500 uppercase">Unit</span>
                <span className="text-sm text-gray-400">{pricePerUnit.toLocaleString()}<span className="text-xs">g</span></span>
              </div>
            </div>
          </div>
        );

      case 2: // Compact Total - Small glowing badge
        return (
          <div className="mb-3 p-2.5 bg-black/60 border border-yellow-500/20 rounded-md">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="mek-label-uppercase text-yellow-400/60 text-[8px]">Total</span>
                  <div className="px-1.5 py-0.5 bg-blue-500/25 border border-blue-400/40 rounded-sm shadow-[0_0_6px_rgba(59,130,246,0.3)]">
                    <span className="text-xs font-bold text-blue-200">{quantityFormatted}×</span>
                  </div>
                </div>
                <span className="text-xl font-bold text-yellow-400">{totalPrice.toLocaleString()}<span className="text-sm">g</span></span>
              </div>
              <div className="flex items-baseline justify-end">
                <span className="text-xs text-gray-500">{pricePerUnit.toLocaleString()}g ea</span>
              </div>
            </div>
          </div>
        );

      case 3: // Large Total - Prominent quantity with pulse
        return (
          <div className="mb-3 p-3.5 bg-black/60 border border-yellow-500/20 rounded-md">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="mek-label-uppercase text-yellow-400/60 text-[9px]">Total Cost</span>
                  <div className="relative px-2.5 py-1 bg-blue-500/20 border-2 border-blue-400/60 rounded shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                    <div className="absolute inset-0 bg-blue-400/10 rounded animate-pulse" />
                    <span className="relative text-base font-bold text-blue-200">{quantityFormatted}×</span>
                  </div>
                </div>
                <span className="text-3xl font-bold text-yellow-400">{totalPrice.toLocaleString()}<span className="text-lg">g</span></span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-500 uppercase">{pricePerUnit.toLocaleString()}g per unit</span>
              </div>
            </div>
          </div>
        );

      case 4: // Minimal Total - Clean blue box
        return (
          <div className="mb-3 p-3 bg-black/60 border border-yellow-500/20 rounded-md">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="px-2 py-1 bg-blue-900/40 border border-blue-400/40 rounded shadow-[0_0_6px_rgba(59,130,246,0.35)]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[8px] text-blue-300/70 uppercase">Qty</span>
                    <span className="text-sm font-bold text-blue-200">{quantityFormatted}</span>
                  </div>
                </div>
                <span className="text-2xl font-bold text-yellow-400">{totalPrice.toLocaleString()}<span className="text-base">g</span></span>
              </div>
              <div className="text-right text-xs text-gray-500">
                @{pricePerUnit.toLocaleString()}g
              </div>
            </div>
          </div>
        );

      case 5: // Angled Quantity - HUD style
        return (
          <div className="mb-3 p-3 bg-black/60 border border-yellow-500/20 rounded-md">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div
                  className="relative px-3 py-1.5 bg-blue-500/20 border-l-2 border-blue-400/60 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[7px] text-blue-300/60 uppercase tracking-wider">QTY</span>
                    <span className="text-base font-mono font-bold text-blue-200">{quantityFormatted}</span>
                  </div>
                </div>
                <span className="text-2xl font-bold text-yellow-400">{totalPrice.toLocaleString()}<span className="text-base">g</span></span>
              </div>
              <div className="text-right text-[10px] text-gray-500">
                Unit: {pricePerUnit.toLocaleString()}g
              </div>
            </div>
          </div>
        );

      case 6: // Three-Row Clean - Simple dividers
        return (
          <div className="mb-3 p-3 bg-black/60 border border-yellow-500/20 rounded-md">
            <div className="space-y-2">
              {/* Row 1: Quantity */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 uppercase tracking-wider">Quantity</span>
                <span className="text-lg font-bold text-yellow-400">{quantityFormatted}</span>
              </div>
              <div className="h-px bg-yellow-500/20" />

              {/* Row 2: Unit Price */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 uppercase tracking-wider">Unit Price</span>
                <span className="text-lg font-bold text-yellow-400">{pricePerUnit.toLocaleString()}<span className="text-sm">g</span></span>
              </div>
              <div className="h-px bg-yellow-500/20" />

              {/* Row 3: Total */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 uppercase tracking-wider">Total</span>
                <span className="text-2xl font-bold text-yellow-400">{totalPrice.toLocaleString()}<span className="text-base">g</span></span>
              </div>
            </div>
          </div>
        );

      case 7: // Three-Row Industrial - Hazard stripes and metal textures
        return (
          <div className="mb-3 p-3 bg-black/80 border-2 border-yellow-500/40 rounded-md relative overflow-hidden">
            <div className="absolute inset-0 mek-overlay-scratches opacity-20" />
            <div className="absolute top-0 left-0 right-0 h-1 mek-overlay-hazard-stripes opacity-40" />
            <div className="absolute bottom-0 left-0 right-0 h-1 mek-overlay-hazard-stripes opacity-40" />
            <div className="relative z-10 space-y-2.5">
              {/* Row 1: Quantity */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-yellow-400/70 uppercase tracking-widest font-bold">QTY</span>
                <span className="text-xl font-bold text-yellow-400 font-mono">{quantityFormatted}</span>
              </div>
              <div className="h-px bg-gradient-to-r from-yellow-500/0 via-yellow-500/40 to-yellow-500/0" />

              {/* Row 2: Unit Price */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-yellow-400/70 uppercase tracking-widest font-bold">Unit</span>
                <span className="text-xl font-bold text-yellow-400 font-mono">{pricePerUnit.toLocaleString()}<span className="text-sm">g</span></span>
              </div>
              <div className="h-px bg-gradient-to-r from-yellow-500/0 via-yellow-500/40 to-yellow-500/0" />

              {/* Row 3: Total */}
              <div className="flex items-center justify-between bg-yellow-500/5 -mx-3 px-3 py-2 -mb-3">
                <span className="text-[10px] text-yellow-400/70 uppercase tracking-widest font-bold">Total</span>
                <span className="text-2xl font-bold text-yellow-400 font-mono">{totalPrice.toLocaleString()}<span className="text-base">g</span></span>
              </div>
            </div>
          </div>
        );

      case 8: // Three-Row Compact - Smaller, tighter spacing
        return (
          <div className="mb-3 p-2 bg-black/60 border border-yellow-500/20 rounded">
            <div className="space-y-1.5">
              {/* Row 1: Quantity */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-300 uppercase tracking-wide">QTY</span>
                <span className="text-sm text-blue-400">{quantityFormatted}</span>
              </div>
              <div className="h-px bg-yellow-500/15" />

              {/* Row 2: Unit Price */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-300 uppercase tracking-wide">UNIT</span>
                <span className="text-sm text-white">{pricePerUnit.toLocaleString()}<span className="text-[10px]">g</span></span>
              </div>
              <div className="h-px bg-yellow-500/15" />

              {/* Row 3: Total */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-300 uppercase tracking-wide">TOTAL</span>
                <span className="text-lg font-bold text-yellow-400">{totalPrice.toLocaleString()}<span className="text-xs">g</span></span>
              </div>
            </div>
          </div>
        );

      case 9: // Three-Row Glowing - Yellow glow effects
        return (
          <div className="mb-3 p-3 bg-black/70 border-2 border-yellow-500/30 rounded-lg shadow-[0_0_15px_rgba(250,182,23,0.2)]">
            <div className="space-y-3">
              {/* Row 1: Quantity */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-yellow-400/60 uppercase tracking-wider">Quantity</span>
                <div className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded shadow-[0_0_8px_rgba(250,182,23,0.3)]">
                  <span className="text-lg font-bold text-yellow-400">{quantityFormatted}</span>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />

              {/* Row 2: Unit Price */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-yellow-400/60 uppercase tracking-wider">Unit Price</span>
                <div className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded shadow-[0_0_8px_rgba(250,182,23,0.3)]">
                  <span className="text-lg font-bold text-yellow-400">{pricePerUnit.toLocaleString()}<span className="text-sm">g</span></span>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />

              {/* Row 3: Total */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-yellow-400/60 uppercase tracking-wider">Total</span>
                <div className="px-3 py-1.5 bg-yellow-500/15 border-2 border-yellow-500/40 rounded-lg shadow-[0_0_12px_rgba(250,182,23,0.4)]">
                  <span className="text-2xl font-bold text-yellow-400">{totalPrice.toLocaleString()}<span className="text-base">g</span></span>
                </div>
              </div>
            </div>
          </div>
        );

      case 10: // Three-Row Tactical - Angled HUD elements
        return (
          <div className="mb-3 p-3 bg-black/70 border-2 border-yellow-500/30 rounded-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-yellow-500/20" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-yellow-500/20" />
            <div className="relative z-10 space-y-2.5">
              {/* Row 1: Quantity */}
              <div className="flex items-center justify-between">
                <div
                  className="px-2.5 py-1 bg-yellow-500/10 border-l-2 border-yellow-500/40"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)' }}
                >
                  <span className="text-[9px] text-yellow-400/70 uppercase tracking-wider font-bold">QTY</span>
                </div>
                <span className="text-xl font-bold text-yellow-400 font-mono">{quantityFormatted}</span>
              </div>
              <div className="h-px bg-gradient-to-r from-yellow-500/40 to-yellow-500/0" />

              {/* Row 2: Unit Price */}
              <div className="flex items-center justify-between">
                <div
                  className="px-2.5 py-1 bg-yellow-500/10 border-l-2 border-yellow-500/40"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)' }}
                >
                  <span className="text-[9px] text-yellow-400/70 uppercase tracking-wider font-bold">Unit</span>
                </div>
                <span className="text-xl font-bold text-yellow-400 font-mono">{pricePerUnit.toLocaleString()}<span className="text-sm">g</span></span>
              </div>
              <div className="h-px bg-gradient-to-r from-yellow-500/40 to-yellow-500/0" />

              {/* Row 3: Total */}
              <div className="flex items-center justify-between">
                <div
                  className="px-2.5 py-1 bg-yellow-500/10 border-l-2 border-yellow-500/40"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)' }}
                >
                  <span className="text-[9px] text-yellow-400/70 uppercase tracking-wider font-bold">Total</span>
                </div>
                <span className="text-2xl font-bold text-yellow-400 font-mono">{totalPrice.toLocaleString()}<span className="text-base">g</span></span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Time remaining display variations - 3 non-pill designs
  const renderTimeRemaining = (expiresAt: number, styleNum: 1 | 2 | 3) => {
    const styles = getCountdownStyles(expiresAt);
    const timeText = formatCountdown(expiresAt);

    switch(styleNum) {
      case 1: // Rectangular Bar - Clean horizontal strip
        return (
          <div className="mb-3">
            <div className={`p-2.5 ${styles.containerClass} rounded-md`}>
              <div className="flex items-center justify-between gap-3">
                <div className={`${styles.labelClass} text-[9px] uppercase tracking-wider font-semibold`}>
                  ⏱ Expires
                </div>
                <div className={`${styles.timeClass} text-base font-bold font-mono tracking-wide`}>
                  {timeText}
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Corner Brackets - Military frame
        return (
          <div className="mb-3 relative">
            <div className={`p-3 ${styles.containerClass} relative`}>
              <div className="absolute inset-0 mek-overlay-metal-texture opacity-10" />
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2" style={{borderColor: 'currentColor'}} />
              <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2" style={{borderColor: 'currentColor'}} />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2" style={{borderColor: 'currentColor'}} />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2" style={{borderColor: 'currentColor'}} />

              <div className={`${styles.labelClass} text-[9px] text-center font-bold tracking-[0.2em] uppercase mb-1`}>
                TIME LEFT
              </div>
              <div className={`${styles.timeClass} text-base font-black text-center tracking-widest uppercase`} style={{fontFamily: '"Courier New", monospace'}}>
                {timeText}
              </div>
            </div>
          </div>
        );

      case 3: // Angled Block - Sci-fi HUD style
        return (
          <div className="mb-3">
            <div
              className={`relative p-3 ${styles.containerClass}`}
              style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
            >
              <div className="absolute inset-0 mek-overlay-diagonal-stripes opacity-10" />
              <div className="flex items-center justify-between gap-2">
                <div className={`${styles.labelClass} text-[8px] uppercase tracking-wider font-bold`}>
                  ▸ COUNTDOWN
                </div>
                <div className={`${styles.timeClass} text-base font-bold font-mono`}>
                  {timeText}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Header button styling variations
  const getHeaderListButtonClasses = (styleNum: 1 | 2 | 3 | 4 | 5) => {
    const baseClasses = "flex items-center gap-2 transition-all";

    switch(styleNum) {
      case 1: // Sleek Minimal
        return `${baseClasses} px-5 py-2.5 bg-yellow-400/10 border border-yellow-400/30 hover:bg-yellow-400/20 hover:border-yellow-400/50 text-yellow-400 rounded-md text-sm font-light tracking-wide uppercase`;
      case 2: // Heavy Industrial
        return `${baseClasses} px-6 py-3 bg-black border-4 border-yellow-500 hover:bg-yellow-500/10 text-yellow-400 rounded-none text-base font-black tracking-widest uppercase shadow-lg shadow-yellow-500/20`;
      case 3: // Holographic Glow
        return `${baseClasses} px-5 py-2.5 bg-gradient-to-r from-yellow-400/5 to-yellow-400/10 border-2 border-yellow-400 hover:border-yellow-300 hover:shadow-[0_0_20px_rgba(250,182,23,0.4)] text-yellow-400 rounded-lg text-sm font-medium tracking-wide uppercase`;
      case 4: // Military Stencil
        return `${baseClasses} px-5 py-2.5 bg-yellow-400/5 border-2 border-yellow-500/40 hover:bg-yellow-400/10 hover:border-yellow-500/60 text-yellow-400 text-sm font-bold tracking-[0.2em] uppercase` ;
      case 5: // Brushed Metal
        return `${baseClasses} px-4 py-2 bg-gradient-to-b from-yellow-500/15 to-yellow-600/10 border border-yellow-500/40 hover:from-yellow-500/20 hover:to-yellow-600/15 text-yellow-400 rounded text-xs font-semibold tracking-wider uppercase shadow-inner`;
      default:
        return baseClasses;
    }
  };

  const getHeaderMyListingsButtonClasses = (styleNum: 1 | 2 | 3 | 4 | 5, isActive: boolean) => {
    const baseClasses = "flex items-center gap-2 transition-all";

    switch(styleNum) {
      case 1: // Sleek Minimal
        return `${baseClasses} px-5 py-2.5 ${isActive
          ? 'bg-yellow-400 text-black border border-yellow-400 shadow-md shadow-yellow-400/20'
          : 'bg-transparent border border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300'
        } rounded-md text-sm font-light tracking-wide uppercase`;
      case 2: // Heavy Industrial
        return `${baseClasses} px-6 py-3 ${isActive
          ? 'bg-yellow-500 text-black border-4 border-yellow-400 shadow-lg shadow-yellow-500/30'
          : 'bg-black border-4 border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300'
        } rounded-none text-base font-black tracking-widest uppercase`;
      case 3: // Holographic Glow
        return `${baseClasses} px-5 py-2.5 ${isActive
          ? 'bg-yellow-400 text-black border-2 border-yellow-300 shadow-[0_0_25px_rgba(250,182,23,0.5)]'
          : 'bg-gradient-to-r from-gray-700/20 to-gray-600/20 border-2 border-gray-600 hover:border-gray-500 hover:shadow-[0_0_15px_rgba(156,163,175,0.3)] text-gray-400'
        } rounded-lg text-sm font-medium tracking-wide uppercase`;
      case 4: // Military Stencil
        return `${baseClasses} px-5 py-2.5 ${isActive
          ? 'bg-yellow-400 text-black border-2 border-yellow-500 shadow-md'
          : 'bg-gray-900/40 border-2 border-gray-700/60 hover:bg-gray-800/40 hover:border-gray-600/60 text-gray-400'
        } text-sm font-bold tracking-[0.2em] uppercase`;
      case 5: // Brushed Metal
        return `${baseClasses} px-4 py-1.5 ${isActive
          ? 'bg-gradient-to-b from-yellow-400 to-yellow-500 text-black border border-yellow-300 shadow-lg shadow-yellow-500/25'
          : 'bg-gradient-to-b from-gray-700/25 to-gray-800/20 border border-gray-600/50 hover:from-gray-700/30 hover:to-gray-800/25 text-gray-400'
        } rounded text-xs font-semibold tracking-wider uppercase shadow-inner`;
      default:
        return baseClasses;
    }
  };

  // Dropdown menu styling variations
  const getDropdownMenuClasses = (styleNum: 1 | 2 | 3 | 4 | 5) => {
    const containerBase = "absolute mt-1 z-50 min-w-[160px] overflow-hidden rounded shadow-lg";
    const itemBase = "w-full px-4 py-2 text-left text-xs font-semibold tracking-wider uppercase transition-all";

    switch(styleNum) {
      case 1: // Brushed Metal (current - too yellow)
        return {
          container: `${containerBase} left-0 bg-gradient-to-b from-black via-gray-900 to-black border border-yellow-500/40 shadow-inner`,
          item: (isActive: boolean) => `${itemBase} shadow-inner ${
            isActive
              ? 'bg-gradient-to-b from-yellow-400 to-yellow-500 text-black border-y border-yellow-300/50'
              : 'bg-gradient-to-b from-yellow-500/15 to-yellow-600/10 text-yellow-400 hover:from-yellow-500/20 hover:to-yellow-600/15 border-y border-transparent hover:border-yellow-500/20'
          }`
        };
      case 2: // Dark Minimal
        return {
          container: `${containerBase} left-0 bg-black/95 border border-gray-700/50`,
          item: (isActive: boolean) => `${itemBase} ${
            isActive
              ? 'bg-gray-800/80 text-yellow-400 border-l-2 border-yellow-500'
              : 'bg-transparent text-gray-400 hover:bg-gray-800/40 hover:text-yellow-400 border-l-2 border-transparent hover:border-gray-600'
          }`
        };
      case 3: // Black Gloss
        return {
          container: `${containerBase} left-0 bg-gradient-to-b from-gray-900 to-black border border-gray-600/30`,
          item: (isActive: boolean) => `${itemBase} ${
            isActive
              ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white border-y border-gray-500/50'
              : 'bg-black/50 text-gray-300 hover:bg-gradient-to-r hover:from-gray-800/50 hover:to-gray-900/50 hover:text-white border-y border-transparent'
          }`
        };
      case 4: // Industrial Gray
        return {
          container: `${containerBase} left-0 bg-gradient-to-b from-gray-800 via-gray-900 to-black border border-gray-600/60`,
          item: (isActive: boolean) => `${itemBase} ${
            isActive
              ? 'bg-gray-700/60 text-yellow-400 border-y border-yellow-500/30'
              : 'bg-gray-800/40 text-gray-300 hover:bg-gray-700/50 hover:text-yellow-400 border-y border-transparent hover:border-gray-600/40'
          }`
        };
      case 5: // Matte Dark
        return {
          container: `${containerBase} left-0 bg-gray-950 border border-gray-700/40`,
          item: (isActive: boolean) => `${itemBase} ${
            isActive
              ? 'bg-gray-800 text-yellow-400 border-l-4 border-yellow-500'
              : 'bg-transparent text-gray-400 hover:bg-gray-900 hover:text-gray-200 border-l-4 border-transparent hover:border-gray-700'
          }`
        };
      default:
        return {
          container: containerBase,
          item: (isActive: boolean) => itemBase
        };
    }
  };

  // Listing card styling variations
  const getListingCardStyles = (styleNum: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10) => {
    switch (styleNum) {
      case 1: // Ultra Bright Glass
        return {
          className: "relative p-4 rounded-lg overflow-hidden group hover:border-yellow-400/20 transition-all duration-500",
          style: {
            background: `linear-gradient(105deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.10) 40%, rgba(255, 255, 255, 0.06) 100%)`,
            backdropFilter: 'blur(4px) brightness(1.25)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }
        };
      case 2: // Prominent Yellow Border
        return {
          className: "relative p-4 rounded-lg overflow-hidden group hover:border-yellow-400/60 transition-all duration-500",
          style: {
            background: `linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.05) 100%)`,
            backdropFilter: 'blur(3px) brightness(1.1)',
            border: '2px solid rgba(250, 182, 23, 0.3)',
            boxShadow: '0 0 10px rgba(250, 182, 23, 0.15)',
          }
        };
      case 3: // Prominent White Border
        return {
          className: "relative p-4 rounded-lg overflow-hidden group hover:border-white/30 transition-all duration-500",
          style: {
            background: `linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%)`,
            backdropFilter: 'blur(4px) brightness(1.12)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }
        };
      case 4: // Prominent Gray Border - Bright Glass
        return {
          className: "relative p-4 rounded-lg overflow-hidden group hover:border-gray-400 transition-all duration-500",
          style: {
            background: `linear-gradient(105deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.05) 100%)`,
            backdropFilter: 'blur(5px) brightness(1.18)',
            border: '2px solid rgba(150, 150, 150, 0.4)',
          }
        };
      case 5: // Double Border - Yellow & White
        return {
          className: "relative p-4 rounded-lg overflow-hidden group hover:border-yellow-400/50 transition-all duration-500",
          style: {
            background: `linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.06) 100%)`,
            backdropFilter: 'blur(4px) brightness(1.15)',
            border: '2px solid rgba(250, 182, 23, 0.25)',
            boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.15), 0 0 12px rgba(250, 182, 23, 0.12)',
          }
        };
      case 6: // Neon Holographic
        return {
          className: "relative p-4 rounded-lg overflow-hidden group hover:border-cyan-400/40 transition-all duration-500",
          style: {
            background: `linear-gradient(135deg, rgba(0, 255, 255, 0.03) 0%, rgba(255, 0, 255, 0.03) 50%, rgba(0, 255, 255, 0.03) 100%)`,
            backdropFilter: 'blur(6px) brightness(1.2) saturate(1.3)',
            border: '2px solid rgba(100, 255, 255, 0.25)',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.2), inset 0 0 20px rgba(255, 0, 255, 0.1)',
          }
        };
      case 7: // Carbon Fiber
        return {
          className: "relative p-4 rounded-lg overflow-hidden group hover:border-gray-500 transition-all duration-500",
          style: {
            background: `linear-gradient(125deg, rgba(30, 30, 30, 0.9) 0%, rgba(10, 10, 10, 0.95) 100%)`,
            backdropFilter: 'blur(2px) brightness(0.9)',
            border: '2px solid rgba(60, 60, 60, 0.6)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 2px 8px rgba(0, 0, 0, 0.5)',
          }
        };
      case 8: // Deep Frosted
        return {
          className: "relative p-4 rounded-lg overflow-hidden group hover:border-blue-300/20 transition-all duration-500",
          style: {
            background: `linear-gradient(150deg, rgba(200, 220, 255, 0.08) 0%, rgba(150, 180, 255, 0.12) 100%)`,
            backdropFilter: 'blur(12px) brightness(1.3) saturate(0.8)',
            border: '1px solid rgba(200, 220, 255, 0.25)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          }
        };
      case 9: // Rainbow Gradient Border
        return {
          className: "relative p-4 rounded-lg overflow-hidden group hover:border-transparent transition-all duration-500",
          style: {
            background: `linear-gradient(105deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.06) 100%)`,
            backdropFilter: 'blur(4px) brightness(1.12)',
            border: '3px solid transparent',
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)),
                              linear-gradient(90deg, #ff0080, #ff8c00, #40e0d0, #8a2be2, #ff0080)`,
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
          }
        };
      case 10: // Military Stencil
        return {
          className: "relative p-4 overflow-hidden group hover:border-yellow-500/40 transition-all duration-500",
          style: {
            background: `linear-gradient(180deg, rgba(40, 40, 20, 0.7) 0%, rgba(20, 20, 10, 0.85) 100%)`,
            backdropFilter: 'blur(3px) brightness(1.05)',
            border: '3px solid rgba(250, 182, 23, 0.4)',
            borderRadius: '2px',
            boxShadow: 'inset 2px 2px 0 rgba(0, 0, 0, 0.3), inset -2px -2px 0 rgba(255, 255, 255, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.5)',
            clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
          }
        };
      default:
        return {
          className: "relative p-4 rounded-lg overflow-hidden group hover:border-yellow-400/20 transition-all duration-500",
          style: {
            background: `linear-gradient(105deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.10) 40%, rgba(255, 255, 255, 0.06) 100%)`,
            backdropFilter: 'blur(4px) brightness(1.25)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }
        };
    }
  };

  return (
    <div className="min-h-screen text-white overflow-hidden relative">
      {/* Debug Panel - Collapsible */}
      <div className="fixed right-4 top-20 z-50">
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setDebugPanelCollapsed(!debugPanelCollapsed)}
          className="absolute -left-8 top-0 w-8 h-8 bg-black/90 border border-yellow-500/50 rounded-l-lg flex items-center justify-center hover:bg-yellow-500/10 transition-colors"
        >
          <svg
            className={`w-4 h-4 text-yellow-400 transition-transform ${debugPanelCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {!debugPanelCollapsed && (
          <div className="bg-black/90 border border-yellow-500/50 p-3 rounded-lg backdrop-blur-sm space-y-4 max-h-[calc(100vh-100px)] overflow-y-auto">
            <div className="text-yellow-400 text-xs uppercase tracking-wider font-bold mb-2 pb-2 border-b border-yellow-500/30">Debug Controls</div>

            {/* Button Variation Selector */}
            <div>
              <label className="block mb-2 text-yellow-400 text-xs uppercase tracking-wider">Button Variation</label>
              <select
                value={buttonVariation}
                onChange={(e) => setButtonVariation(Number(e.target.value))}
                className="w-full px-3 py-2 bg-black border border-yellow-500/30 text-yellow-400 text-sm rounded focus:outline-none focus:border-yellow-500"
              >
                <option value={1}>Style 1: Industrial Stack</option>
                <option value={2}>Style 2: Angled Casino Chips</option>
                <option value={3}>Style 3: Minimal Modern</option>
                <option value={4}>Style 4: Retro Arcade</option>
                <option value={5}>Style 5: Industrial Tags</option>
              </select>
            </div>

            {/* Listing Count Toggle */}
            <div>
              <label className="block mb-2 text-yellow-400 text-xs uppercase tracking-wider">Test Listing Count</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDebugListingCount(0)}
                  className={`flex-1 px-3 py-2 text-xs font-bold rounded transition-all ${
                    debugListingCount === 0
                      ? 'bg-yellow-500 text-black'
                      : 'bg-black border border-yellow-500/30 text-yellow-400 hover:border-yellow-500'
                  }`}
                >
                  0 Listings
                </button>
                <button
                  onClick={() => setDebugListingCount(8)}
                  className={`flex-1 px-3 py-2 text-xs font-bold rounded transition-all ${
                    debugListingCount === 8
                      ? 'bg-yellow-500 text-black'
                      : 'bg-black border border-yellow-500/30 text-yellow-400 hover:border-yellow-500'
                  }`}
                >
                  8 Listings
                </button>
              </div>
            </div>

            {/* Header Layout Selector */}
            <div>
          <label className="block mb-2 text-yellow-400 text-xs uppercase tracking-wider">Header Layout</label>
          <select
            value={headerLayout}
            onChange={(e) => setHeaderLayout(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
            className="w-full px-3 py-2 bg-black border border-yellow-500/30 text-yellow-400 text-sm rounded focus:outline-none focus:border-yellow-500"
          >
            <option value="1">OPTION 1: Current Layout (Reference)</option>
            <option value="2">OPTION 2: Horizontal Row - Buttons + Gold Right</option>
            <option value="3">OPTION 3: Stacked Buttons on Right</option>
            <option value="4">OPTION 4: Integrated Bar - Industrial Frame</option>
            <option value="5">OPTION 5: Compact Grid - Gold Prominent</option>
          </select>
        </div>

        {/* Bounty Layout Selector */}
        <div>
          <label className="block mb-2 text-yellow-400 text-xs uppercase tracking-wider">Bounty Layout</label>
          <select
            value={buyOrderLayout}
            onChange={(e) => setBuyOrderLayout(Number(e.target.value) as 1 | 2 | 3)}
            className="w-full px-3 py-2 bg-black border border-yellow-500/30 text-yellow-400 text-sm rounded focus:outline-none focus:border-yellow-500"
          >
            <option value="1">Layout 1: Table + Cards</option>
            <option value="2">Layout 2: All Cards</option>
            <option value="3">Layout 3: Side-by-Side</option>
          </select>
        </div>

        {/* Gold Display Variation Selector */}
        <div>
          <label className="block mb-2 text-yellow-400 text-xs uppercase tracking-wider">Gold Display Variation</label>
          <select
            value={goldDisplayVariation}
            onChange={(e) => setGoldDisplayVariation(Number(e.target.value) as 1 | 2 | 3 | 4)}
            className="w-full px-3 py-2 bg-black border border-yellow-500/30 text-yellow-400 text-sm rounded focus:outline-none focus:border-yellow-500"
          >
            <option value="1">Variation 1: Stacked - Number over GOLD</option>
            <option value="2">Variation 2: Inline - Number + G</option>
            <option value="3">Variation 3: Minimal - Just Number</option>
            <option value="4">Variation 4: Vertical Compact</option>
          </select>
        </div>

        {/* Listing Card Style Selector */}
        <div>
          <label className="block mb-2 text-yellow-400 text-xs uppercase tracking-wider">Listing Card Style</label>
          <select
            value={listingCardStyle}
            onChange={(e) => setListingCardStyle(Number(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10)}
            className="w-full px-3 py-2 bg-black border border-yellow-500/30 text-yellow-400 text-sm rounded focus:outline-none focus:border-yellow-500"
          >
            <option value="1">Style 1: Ultra Bright Glass</option>
            <option value="2">Style 2: Prominent Yellow Border</option>
            <option value="3">Style 3: Prominent White Border</option>
            <option value="4">Style 4: Prominent Gray Border</option>
            <option value="5">Style 5: Double Border (Yellow & White)</option>
            <option value="6">Style 6: Neon Holographic</option>
            <option value="7">Style 7: Carbon Fiber</option>
            <option value="8">Style 8: Deep Frosted</option>
            <option value="9">Style 9: Rainbow Gradient Border</option>
            <option value="10">Style 10: Military Stencil</option>
          </select>
        </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 py-6">
        {/* Title Section - Military Command Panel */}
        <div className="relative mb-6 mek-card-industrial mek-border-sharp-gold rounded-xl p-4 mek-glow-yellow">
          <div className="absolute top-0 left-0 right-0 h-3 mek-overlay-hazard-stripes opacity-60" />
          <div className="absolute inset-0 mek-overlay-scratches pointer-events-none" />
          <div className="absolute inset-0 mek-overlay-rust pointer-events-none" />
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 mek-overlay-metal-texture" />
          </div>

          {/* OPTION 1: Current Layout - EXACT REFERENCE POINT */}
          {headerLayout === 1 && (
            <div className="relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="mek-text-industrial text-5xl text-yellow-400 mek-text-shadow mb-3">
                    MARKET
                  </h1>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreateListing(true)}
                      className={getHeaderMyListingsButtonClasses(headerButtonStyle, false)}
                    >
                      <span>LIST ITEM</span>
                    </button>
                    <button
                      onClick={() => setShowOnlyMyListings(!showOnlyMyListings)}
                      className={getHeaderMyListingsButtonClasses(headerButtonStyle, false)}
                    >
                      <span>MY LISTINGS ({myListings?.filter(l => l.itemType === "essence").length || 0})</span>
                    </button>
                    <button
                      onClick={() => setShowOffersView(!showOffersView)}
                      className={getHeaderMyListingsButtonClasses(headerButtonStyle, showOffersView)}
                    >
                      <span>BOUNTIES</span>
                    </button>
                  </div>
                </div>
                <div className="relative bg-black/60 border border-yellow-500/30 rounded px-6 py-3 mek-overlay-diagonal-stripes">
                  <div className="relative">
                    <div className="mek-label-uppercase text-yellow-400/70 mb-1">CREDITS AVAILABLE</div>
                    <div className="mek-value-primary text-3xl">
                      {Math.floor(userProfile?.gold || 0).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-8 h-1 bg-yellow-500/50" />
                      <span className="mek-label-uppercase text-yellow-400/50 text-[10px]">GOLD STANDARD</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OPTION 2: Horizontal Row - Buttons + Gold on Right */}
          {headerLayout === 2 && (
            <div className="relative">
              <div className="flex justify-between items-center">
                <h1 className="mek-text-industrial text-5xl text-yellow-400 mek-text-shadow">
                  MARKET
                </h1>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowCreateListing(true)}
                    className={getHeaderMyListingsButtonClasses(headerButtonStyle, false)}
                  >
                    <span>LIST ITEM</span>
                  </button>
                  <button
                    onClick={() => setShowOnlyMyListings(!showOnlyMyListings)}
                    className={getHeaderMyListingsButtonClasses(headerButtonStyle, false)}
                  >
                    <span>MY LISTINGS ({myListings?.filter(l => l.itemType === "essence").length || 0})</span>
                  </button>
                  <button
                    onClick={() => setShowOffersView(!showOffersView)}
                    className={getHeaderMyListingsButtonClasses(headerButtonStyle, showOffersView)}
                  >
                    <span>BOUNTIES</span>
                  </button>
                  <div className="w-px h-10 bg-yellow-500/30 mx-2" />
                  <div className="relative bg-black/60 border border-yellow-500/30 rounded px-5 py-2.5">
                    <div className="relative flex items-center gap-2">
                      <div className="mek-value-primary text-2xl">
                        {Math.floor(userProfile?.gold || 0).toLocaleString()}
                      </div>
                      <span className="text-yellow-400/70 font-bold text-xl">G</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OPTION 3: Stacked Buttons on Right */}
          {headerLayout === 3 && (
            <div className="relative">
              <div className="flex justify-between items-start">
                <h1 className="mek-text-industrial text-5xl text-yellow-400 mek-text-shadow">
                  MARKET
                </h1>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCreateListing(true)}
                      className={getHeaderMyListingsButtonClasses(headerButtonStyle, false)}
                    >
                      <span>LIST ITEM</span>
                    </button>
                    <button
                      onClick={() => setShowOnlyMyListings(!showOnlyMyListings)}
                      className={getHeaderMyListingsButtonClasses(headerButtonStyle, false)}
                    >
                      <span>MY LISTINGS ({myListings?.filter(l => l.itemType === "essence").length || 0})</span>
                    </button>
                    <button
                      onClick={() => setShowOffersView(!showOffersView)}
                      className={getHeaderMyListingsButtonClasses(headerButtonStyle, showOffersView)}
                    >
                      <span>BOUNTIES</span>
                    </button>
                  </div>
                  <div className="relative bg-black/60 border border-yellow-500/30 rounded px-5 py-2 ml-auto">
                    <div className="relative flex items-center gap-2">
                      <div className="mek-value-primary text-2xl">
                        {Math.floor(userProfile?.gold || 0).toLocaleString()}
                      </div>
                      <span className="text-yellow-400/70 font-bold text-xl">G</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OPTION 4: Integrated Bar - Buttons + Gold in Industrial Frame */}
          {headerLayout === 4 && (
            <div className="relative">
              <div className="flex justify-between items-center mb-4">
                <h1 className="mek-text-industrial text-5xl text-yellow-400 mek-text-shadow">
                  MARKET
                </h1>
              </div>
              <div className="relative flex items-center gap-2 p-3 bg-black/40 border-2 border-yellow-500/30 rounded-lg mek-overlay-diagonal-stripes">
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <button
                    onClick={() => setShowCreateListing(true)}
                    className={getHeaderMyListingsButtonClasses(headerButtonStyle, false)}
                  >
                    <span>LIST ITEM</span>
                  </button>
                  <button
                    onClick={() => setShowOnlyMyListings(!showOnlyMyListings)}
                    className={getHeaderMyListingsButtonClasses(headerButtonStyle, false)}
                  >
                    <span>MY LISTINGS ({myListings?.filter(l => l.itemType === "essence").length || 0})</span>
                  </button>
                  <button
                    onClick={() => setShowOffersView(!showOffersView)}
                    className={getHeaderMyListingsButtonClasses(headerButtonStyle, showOffersView)}
                  >
                    <span>BOUNTIES</span>
                  </button>
                  <div className="w-px h-10 bg-yellow-500/50 mx-2" />
                  <div className="relative bg-yellow-500/10 border border-yellow-500/40 rounded px-4 py-2">
                    <div className="relative flex items-center gap-2">
                      <div className="mek-value-primary text-2xl">
                        {Math.floor(userProfile?.gold || 0).toLocaleString()}
                      </div>
                      <span className="text-yellow-400/70 font-bold text-xl">G</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OPTION 5: Compact Grid - Gold Prominent on Right */}
          {headerLayout === 5 && (
            <div className="relative">
              <div className="flex justify-between items-center">
                <h1 className="mek-text-industrial text-5xl text-yellow-400 mek-text-shadow">
                  MARKET
                </h1>
                <div className="flex items-center gap-4">
                  {renderHeaderButtons(buttonVariation, {
                    onCreateListing: () => setShowCreateListing(true),
                    onToggleMyListings: () => setShowOnlyMyListings(!showOnlyMyListings),
                    onToggleOffersView: () => setShowOffersView(!showOffersView),
                    showOnlyMyListings,
                    showOffersView,
                    listingCount: debugListingCount
                  })}
                  <div className="h-16 w-px bg-yellow-500/30" />

                  {/* Gold Display Variations */}
                  {goldDisplayVariation === 1 && (
                    /* Variation 1: Stacked - Number over GOLD */
                    <div className="relative flex flex-col items-center">
                      <div className="gold-display-medium text-4xl leading-none">
                        {Math.floor(userProfile?.gold || 0).toLocaleString()}
                      </div>
                      <span className="text-yellow-400/70 text-xs tracking-widest mt-1 uppercase">GOLD</span>
                    </div>
                  )}

                  {goldDisplayVariation === 2 && (
                    /* Variation 2: Inline - Number + G */
                    <div className="relative flex items-baseline gap-1">
                      <div className="gold-display-medium text-4xl leading-none">
                        {Math.floor(userProfile?.gold || 0).toLocaleString()}
                      </div>
                      <span className="text-yellow-400/80 text-2xl font-light">G</span>
                    </div>
                  )}

                  {goldDisplayVariation === 3 && (
                    /* Variation 3: Minimal - Just Number */
                    <div className="relative">
                      <div className="gold-display-medium text-4xl leading-none">
                        {Math.floor(userProfile?.gold || 0).toLocaleString()}
                      </div>
                    </div>
                  )}

                  {goldDisplayVariation === 4 && (
                    /* Variation 4: Vertical Compact */
                    <div className="relative flex items-start gap-1">
                      <span className="text-yellow-400/70 text-[10px] tracking-wider uppercase mt-1">GOLD</span>
                      <div className="gold-display-medium text-3xl leading-none">
                        {Math.floor(userProfile?.gold || 0).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* OFFERS VIEW */}
        {showOffersView && (
          <div>
            {/* Return to Market Button */}
            <button
              onClick={() => setShowOffersView(false)}
              className="mb-6 flex items-center gap-2 px-6 py-3 bg-gray-900/60 border-2 border-gray-700/50 hover:border-yellow-500/50 text-gray-400 hover:text-yellow-400 font-bold uppercase tracking-wider transition-all rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>RETURN TO MARKET</span>
            </button>

            {/* Create Bounty Button */}
            <div className="mb-6">
              <button
                onClick={() => setShowCreateRequest(true)}
                className="mek-button-primary px-6 py-3 font-bold uppercase tracking-wider"
              >
                <span className="text-lg mr-2">⊕</span>
                CREATE BOUNTY
              </button>
            </div>

            {/* Debug: Layout Selector */}
            <div className="mb-6 p-4 bg-black/60 border border-yellow-500/30 rounded-lg">
              <label className="block text-xs text-yellow-400/70 uppercase tracking-wider mb-2">
                Debug: Bounty Layout
              </label>
              <select
                value={buyOrderLayout}
                onChange={(e) => setBuyOrderLayout(Number(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6)}
                className="w-full px-3 py-2 bg-black/80 border border-gray-700 text-yellow-400 font-semibold text-sm rounded focus:border-yellow-500/70 focus:outline-none cursor-pointer"
              >
                <option value="1">Layout 1: Table + Cards</option>
                <option value="2">Layout 2: All Cards</option>
                <option value="3">Layout 3: Side-by-Side</option>
                <option value="4">Layout 4: Compact Table-Row (Mobile)</option>
                <option value="5">Layout 5: Slim Horizontal Cards (Mobile)</option>
                <option value="6">Layout 6: Ultra-Compact List (Mobile)</option>
              </select>
            </div>

            {/* BOUNTIES LAYOUT 1: Table + Cards */}
            {buyOrderLayout === 1 && (
              <>
            {/* Open Bountys Table */}
            <div className="mb-8">
              <div className="mb-4 p-3 bg-black/60 border-l-4 border-yellow-500 mek-overlay-diagonal-stripes">
                <h2 className="mek-text-industrial text-2xl text-yellow-400 mek-text-shadow">OPEN BOUNTIES</h2>
                <p className="mek-label-uppercase text-yellow-400/60 mt-1">SELL ESSENCE TO FILL BOUNTIES</p>
              </div>

              {/* Table */}
              <div className="mek-card-industrial mek-border-sharp-gray rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-yellow-500/10 border-b-2 border-yellow-500/30">
                        <th className="px-4 py-3 text-left text-yellow-400 font-bold uppercase tracking-wider text-sm">Essence</th>
                        <th className="px-4 py-3 text-center text-yellow-400 font-bold uppercase tracking-wider text-sm">Quantity</th>
                        <th className="px-4 py-3 text-right text-yellow-400 font-bold uppercase tracking-wider text-sm">Total Price</th>
                        <th className="px-4 py-3 text-center text-yellow-400 font-bold uppercase tracking-wider text-sm">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Placeholder rows - will be replaced with real data */}
                      <tr className="border-b border-gray-800 hover:bg-yellow-500/5 transition-colors cursor-pointer">
                        <td className="px-4 py-3 text-yellow-400 font-semibold">Cameras & Film</td>
                        <td className="px-4 py-3 text-center text-gray-300">5.0</td>
                        <td className="px-4 py-3 text-right text-yellow-400 font-bold">2,500g</td>
                        <td className="px-4 py-3 text-center">
                          <button className="px-4 py-1 bg-yellow-400/10 border border-yellow-400/30 hover:bg-yellow-400/20 text-yellow-400 rounded text-xs font-semibold uppercase tracking-wider">
                            FILL BOUNTY
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-yellow-500/5 transition-colors cursor-pointer">
                        <td className="px-4 py-3 text-yellow-400 font-semibold">Musical</td>
                        <td className="px-4 py-3 text-center text-gray-300">10.0</td>
                        <td className="px-4 py-3 text-right text-yellow-400 font-bold">7,000g</td>
                        <td className="px-4 py-3 text-center">
                          <button className="px-4 py-1 bg-yellow-400/10 border border-yellow-400/30 hover:bg-yellow-400/20 text-yellow-400 rounded text-xs font-semibold uppercase tracking-wider">
                            FILL BOUNTY
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* My Bountys Section */}
            <div>
              <div className="mb-4 p-3 bg-black/60 border-l-4 border-blue-500 mek-overlay-diagonal-stripes">
                <h2 className="mek-text-industrial text-2xl text-blue-400 mek-text-shadow">MY BOUNTIES</h2>
                <p className="mek-label-uppercase text-blue-400/60 mt-1">YOUR ACTIVE BOUNTIES</p>
              </div>

              {/* My Bountys Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Placeholder card - will be replaced with real data */}
                <div className="mek-card-industrial mek-border-sharp-gold p-4 rounded-lg">
                  <div className="absolute inset-0 mek-overlay-scratches pointer-events-none" />
                  <div className="relative">
                    <div className="mb-3">
                      <div className="font-bold text-yellow-400 uppercase tracking-wide text-sm">Cameras & Film</div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>Buying: <span className="text-yellow-400 font-bold">5.0</span></span>
                      </div>
                    </div>
                    <div className="mb-3 p-2 bg-black/60 border border-yellow-500/20 rounded">
                      <div className="text-xs text-gray-400">Locked Gold:</div>
                      <div className="text-lg font-bold text-yellow-400">2,500g</div>
                    </div>
                    <button className="w-full px-3 py-2 bg-red-900/30 border border-red-500/40 hover:bg-red-900/50 hover:border-red-400/60 text-red-400 font-bold uppercase tracking-wider transition-all text-sm rounded-lg">
                      ⊗ CANCEL BOUNTY
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </>
            )}

            {/* BOUNTIES LAYOUT 2: All Cards (More Visual) */}
            {buyOrderLayout === 2 && (
              <>
            {/* Open Bountys Card Grid */}
            <div className="mb-8">
              <div className="mb-4 p-3 bg-black/60 border-l-4 border-yellow-500 mek-overlay-diagonal-stripes">
                <h2 className="mek-text-industrial text-2xl text-yellow-400 mek-text-shadow">OPEN BOUNTIES</h2>
                <p className="mek-label-uppercase text-yellow-400/60 mt-1">OTHER PLAYERS WANT TO BUY</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Placeholder cards */}
                <div className="mek-card-industrial mek-border-sharp-gray p-4 rounded-lg hover:border-yellow-500/50 transition-all group">
                  <div className="absolute inset-0 mek-overlay-scratches pointer-events-none opacity-30" />
                  <div className="relative">
                    <div className="mb-3">
                      <div className="font-bold text-yellow-400 uppercase tracking-wide text-sm mb-2">Cameras & Film</div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>They want:</span>
                        <span className="text-yellow-400 font-bold text-base">5.0</span>
                      </div>
                    </div>
                    <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-yellow-400/70 uppercase">Offering:</span>
                        <span className="text-lg font-bold text-yellow-400">2,500g</span>
                      </div>
                      <div className="text-[10px] text-yellow-400/50 mt-1 text-right">500g per unit</div>
                    </div>
                    <button className="w-full px-4 py-2 bg-yellow-400/10 border border-yellow-400/40 hover:bg-yellow-400/20 hover:border-yellow-400/60 text-yellow-400 font-bold uppercase tracking-wider transition-all text-sm rounded-lg">
                      ◆ FILL BOUNTY
                    </button>
                  </div>
                </div>

                <div className="mek-card-industrial mek-border-sharp-gray p-4 rounded-lg hover:border-yellow-500/50 transition-all group">
                  <div className="absolute inset-0 mek-overlay-scratches pointer-events-none opacity-30" />
                  <div className="relative">
                    <div className="mb-3">
                      <div className="font-bold text-yellow-400 uppercase tracking-wide text-sm mb-2">Musical</div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>They want:</span>
                        <span className="text-yellow-400 font-bold text-base">10.0</span>
                      </div>
                    </div>
                    <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-yellow-400/70 uppercase">Offering:</span>
                        <span className="text-lg font-bold text-yellow-400">7,000g</span>
                      </div>
                      <div className="text-[10px] text-yellow-400/50 mt-1 text-right">700g per unit</div>
                    </div>
                    <button className="w-full px-4 py-2 bg-yellow-400/10 border border-yellow-400/40 hover:bg-yellow-400/20 hover:border-yellow-400/60 text-yellow-400 font-bold uppercase tracking-wider transition-all text-sm rounded-lg">
                      ◆ FILL BOUNTY
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* My Bountys Section */}
            <div>
              <div className="mb-4 p-3 bg-black/60 border-l-4 border-blue-500 mek-overlay-diagonal-stripes">
                <h2 className="mek-text-industrial text-2xl text-blue-400 mek-text-shadow">MY BOUNTIES</h2>
                <p className="mek-label-uppercase text-blue-400/60 mt-1">YOUR ACTIVE BOUNTIES</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="mek-card-industrial mek-border-sharp-gold p-4 rounded-lg">
                  <div className="absolute inset-0 mek-overlay-scratches pointer-events-none" />
                  <div className="relative">
                    <div className="mb-3">
                      <div className="font-bold text-yellow-400 uppercase tracking-wide text-sm">Cameras & Film</div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>Buying: <span className="text-yellow-400 font-bold">5.0</span></span>
                      </div>
                    </div>
                    <div className="mb-3 p-2 bg-black/60 border border-yellow-500/20 rounded">
                      <div className="text-xs text-gray-400">Locked Gold:</div>
                      <div className="text-lg font-bold text-yellow-400">2,500g</div>
                    </div>
                    <button className="w-full px-3 py-2 bg-red-900/30 border border-red-500/40 hover:bg-red-900/50 hover:border-red-400/60 text-red-400 font-bold uppercase tracking-wider transition-all text-sm rounded-lg">
                      ⊗ CANCEL BOUNTY
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </>
            )}

            {/* BOUNTIES LAYOUT 3: Side-by-Side (Clearer Separation) */}
            {buyOrderLayout === 3 && (
              <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Open Bountys */}
              <div>
                <div className="mb-4 p-3 bg-black/60 border-l-4 border-yellow-500 mek-overlay-diagonal-stripes">
                  <h2 className="mek-text-industrial text-xl text-yellow-400 mek-text-shadow">OPEN BOUNTIES</h2>
                  <p className="mek-label-uppercase text-yellow-400/60 mt-1 text-xs">FILL BOUNTIES TO EARN GOLD</p>
                </div>

                <div className="space-y-3">
                  {/* Placeholder cards */}
                  <div className="mek-card-industrial mek-border-sharp-gray p-4 rounded-lg hover:border-yellow-500/50 transition-all">
                    <div className="absolute inset-0 mek-overlay-scratches pointer-events-none opacity-20" />
                    <div className="relative flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-bold text-yellow-400 text-sm mb-1">Cameras & Film</div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-gray-400">Qty: <span className="text-yellow-400 font-semibold">5.0</span></span>
                          <span className="text-gray-600">•</span>
                          <span className="text-gray-400">Total: <span className="text-yellow-400 font-semibold">2,500g</span></span>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-yellow-400/10 border border-yellow-400/40 hover:bg-yellow-400/20 text-yellow-400 font-bold text-xs uppercase rounded whitespace-nowrap">
                        FILL
                      </button>
                    </div>
                  </div>

                  <div className="mek-card-industrial mek-border-sharp-gray p-4 rounded-lg hover:border-yellow-500/50 transition-all">
                    <div className="absolute inset-0 mek-overlay-scratches pointer-events-none opacity-20" />
                    <div className="relative flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-bold text-yellow-400 text-sm mb-1">Musical</div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-gray-400">Qty: <span className="text-yellow-400 font-semibold">10.0</span></span>
                          <span className="text-gray-600">•</span>
                          <span className="text-gray-400">Total: <span className="text-yellow-400 font-semibold">7,000g</span></span>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-yellow-400/10 border border-yellow-400/40 hover:bg-yellow-400/20 text-yellow-400 font-bold text-xs uppercase rounded whitespace-nowrap">
                        FILL
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: My Bountys */}
              <div>
                <div className="mb-4 p-3 bg-black/60 border-l-4 border-blue-500 mek-overlay-diagonal-stripes">
                  <h2 className="mek-text-industrial text-xl text-blue-400 mek-text-shadow">MY BOUNTIES</h2>
                  <p className="mek-label-uppercase text-blue-400/60 mt-1 text-xs">YOUR ACTIVE BOUNTIES</p>
                </div>

                <div className="space-y-3">
                  <div className="mek-card-industrial mek-border-sharp-gold p-4 rounded-lg">
                    <div className="absolute inset-0 mek-overlay-scratches pointer-events-none opacity-20" />
                    <div className="relative">
                      <div className="mb-3">
                        <div className="font-bold text-yellow-400 text-sm mb-1">Cameras & Film</div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>Buying: <span className="text-yellow-400 font-semibold">5.0</span></span>
                          <span className="text-gray-600">•</span>
                          <span>Locked: <span className="text-red-400 font-semibold">2,500g</span></span>
                        </div>
                      </div>
                      <button className="w-full px-3 py-1.5 bg-red-900/30 border border-red-500/40 hover:bg-red-900/50 text-red-400 font-bold text-xs uppercase rounded">
                        ⊗ CANCEL
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </>
            )}

            {/* BOUNTIES LAYOUT 4: Mobile-Friendly Toggle with Earnings Emphasis */}
            {buyOrderLayout === 4 && (
              <>
            {/* Toggle Buttons */}
            <div className="mb-6 flex gap-3">
              <button
                onClick={() => setBuyOrderSection("open")}
                className={`flex-1 px-6 py-4 font-bold uppercase tracking-wider text-sm transition-all rounded-lg relative overflow-hidden group ${
                  buyOrderSection === "open"
                    ? "bg-yellow-500/20 border-2 border-yellow-500/60 text-yellow-400"
                    : "bg-black/40 border-2 border-gray-700/40 text-gray-500 hover:border-gray-600/60 hover:text-gray-400"
                }`}
              >
                <div className={`absolute inset-0 mek-overlay-diagonal-stripes pointer-events-none ${
                  buyOrderSection === "open" ? "opacity-20" : "opacity-5"
                }`} />
                <div className="relative flex items-center justify-center gap-2">
                  <span className="text-lg">◆</span>
                  <span>OPEN BOUNTIES</span>
                </div>
              </button>

              <button
                onClick={() => setBuyOrderSection("mine")}
                className={`flex-1 px-6 py-4 font-bold uppercase tracking-wider text-sm transition-all rounded-lg relative overflow-hidden group ${
                  buyOrderSection === "mine"
                    ? "bg-blue-500/20 border-2 border-blue-500/60 text-blue-400"
                    : "bg-black/40 border-2 border-gray-700/40 text-gray-500 hover:border-gray-600/60 hover:text-gray-400"
                }`}
              >
                <div className={`absolute inset-0 mek-overlay-diagonal-stripes pointer-events-none ${
                  buyOrderSection === "mine" ? "opacity-20" : "opacity-5"
                }`} />
                <div className="relative flex items-center justify-center gap-2">
                  <span className="text-lg">◆</span>
                  <span>MY BOUNTIES</span>
                </div>
              </button>
            </div>

            {/* Open Bountys Section */}
            {buyOrderSection === "open" && (
              <div className="space-y-3">
                {/* Placeholder cards - clean design with earnings emphasis */}
                <div className="mek-card-industrial mek-border-sharp-gray rounded-lg overflow-hidden hover:border-yellow-500/50 transition-all group">
                  <div className="absolute inset-0 mek-overlay-scratches pointer-events-none opacity-20" />
                  <div className="relative p-5">
                    <div className="flex items-stretch gap-4">
                      {/* Left: What they want */}
                      <div className="flex-1">
                        <div className="font-bold text-yellow-400 uppercase tracking-wide text-base mb-2">
                          Cameras & Film
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs text-gray-400 uppercase">Quantity:</span>
                          <span className="text-2xl font-bold text-yellow-400">5.0</span>
                        </div>
                      </div>

                      {/* Right: What you earn + action */}
                      <div className="flex flex-col items-end justify-between gap-3">
                        <div className="text-right">
                          <div className="text-[10px] text-yellow-400/60 uppercase tracking-wider mb-1">
                            YOUR PAYMENT
                          </div>
                          <div className="text-3xl font-bold text-yellow-400 mek-glow-yellow">
                            2,500g
                          </div>
                          <div className="text-xs text-yellow-400/50 mt-0.5">
                            500g per unit
                          </div>
                        </div>
                        <button className="px-6 py-2 bg-yellow-400/10 border-2 border-yellow-400/50 hover:bg-yellow-400/20 hover:border-yellow-400/70 text-yellow-400 font-bold text-sm uppercase tracking-wider rounded-lg transition-all whitespace-nowrap">
                          FILL BOUNTY
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mek-card-industrial mek-border-sharp-gray rounded-lg overflow-hidden hover:border-yellow-500/50 transition-all group">
                  <div className="absolute inset-0 mek-overlay-scratches pointer-events-none opacity-20" />
                  <div className="relative p-5">
                    <div className="flex items-stretch gap-4">
                      {/* Left: What they want */}
                      <div className="flex-1">
                        <div className="font-bold text-yellow-400 uppercase tracking-wide text-base mb-2">
                          Musical
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs text-gray-400 uppercase">Quantity:</span>
                          <span className="text-2xl font-bold text-yellow-400">10.0</span>
                        </div>
                      </div>

                      {/* Right: What you earn + action */}
                      <div className="flex flex-col items-end justify-between gap-3">
                        <div className="text-right">
                          <div className="text-[10px] text-yellow-400/60 uppercase tracking-wider mb-1">
                            YOUR PAYMENT
                          </div>
                          <div className="text-3xl font-bold text-yellow-400 mek-glow-yellow">
                            7,000g
                          </div>
                          <div className="text-xs text-yellow-400/50 mt-0.5">
                            700g per unit
                          </div>
                        </div>
                        <button className="px-6 py-2 bg-yellow-400/10 border-2 border-yellow-400/50 hover:bg-yellow-400/20 hover:border-yellow-400/70 text-yellow-400 font-bold text-sm uppercase tracking-wider rounded-lg transition-all whitespace-nowrap">
                          FILL BOUNTY
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mek-card-industrial mek-border-sharp-gray rounded-lg overflow-hidden hover:border-yellow-500/50 transition-all group">
                  <div className="absolute inset-0 mek-overlay-scratches pointer-events-none opacity-20" />
                  <div className="relative p-5">
                    <div className="flex items-stretch gap-4">
                      {/* Left: What they want */}
                      <div className="flex-1">
                        <div className="font-bold text-yellow-400 uppercase tracking-wide text-base mb-2">
                          Materials
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs text-gray-400 uppercase">Quantity:</span>
                          <span className="text-2xl font-bold text-yellow-400">3.0</span>
                        </div>
                      </div>

                      {/* Right: What you earn + action */}
                      <div className="flex flex-col items-end justify-between gap-3">
                        <div className="text-right">
                          <div className="text-[10px] text-yellow-400/60 uppercase tracking-wider mb-1">
                            YOUR PAYMENT
                          </div>
                          <div className="text-3xl font-bold text-yellow-400 mek-glow-yellow">
                            1,800g
                          </div>
                          <div className="text-xs text-yellow-400/50 mt-0.5">
                            600g per unit
                          </div>
                        </div>
                        <button className="px-6 py-2 bg-yellow-400/10 border-2 border-yellow-400/50 hover:bg-yellow-400/20 hover:border-yellow-400/70 text-yellow-400 font-bold text-sm uppercase tracking-wider rounded-lg transition-all whitespace-nowrap">
                          FILL BOUNTY
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* My Bountys Section */}
            {buyOrderSection === "mine" && (
              <div className="space-y-3">
                {/* Placeholder card for user's orders */}
                <div className="mek-card-industrial mek-border-sharp-gold rounded-lg overflow-hidden">
                  <div className="absolute inset-0 mek-overlay-scratches pointer-events-none opacity-20" />
                  <div className="relative p-5">
                    <div className="flex items-stretch gap-4">
                      {/* Left: What you're buying */}
                      <div className="flex-1">
                        <div className="font-bold text-yellow-400 uppercase tracking-wide text-base mb-2">
                          Cameras & Film
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs text-gray-400 uppercase">Buying:</span>
                          <span className="text-2xl font-bold text-yellow-400">5.0</span>
                        </div>
                      </div>

                      {/* Right: Locked gold + cancel */}
                      <div className="flex flex-col items-end justify-between gap-3">
                        <div className="text-right">
                          <div className="text-[10px] text-red-400/60 uppercase tracking-wider mb-1">
                            LOCKED GOLD
                          </div>
                          <div className="text-3xl font-bold text-red-400">
                            2,500g
                          </div>
                          <div className="text-xs text-red-400/50 mt-0.5">
                            500g per unit
                          </div>
                        </div>
                        <button className="px-6 py-2 bg-red-900/30 border-2 border-red-500/50 hover:bg-red-900/50 hover:border-red-400/70 text-red-400 font-bold text-sm uppercase tracking-wider rounded-lg transition-all whitespace-nowrap">
                          ⊗ CANCEL BOUNTY
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </>
            )}

            {/* BOUNTIES LAYOUT 5: Slim Horizontal Card Design */}
            {buyOrderLayout === 5 && (
              <>
            {/* Toggle Buttons */}
            <div className="mb-6 flex gap-3">
              <button
                onClick={() => setBuyOrderSection("open")}
                className={`flex-1 px-6 py-4 font-bold uppercase tracking-wider text-sm transition-all rounded-lg relative overflow-hidden group ${
                  buyOrderSection === "open"
                    ? "bg-yellow-500/20 border-2 border-yellow-500/60 text-yellow-400"
                    : "bg-black/40 border-2 border-gray-700/40 text-gray-500 hover:border-gray-600/60 hover:text-gray-400"
                }`}
              >
                <div className={`absolute inset-0 mek-overlay-diagonal-stripes pointer-events-none ${
                  buyOrderSection === "open" ? "opacity-20" : "opacity-5"
                }`} />
                <div className="relative flex items-center justify-center gap-2">
                  <span className="text-lg">◆</span>
                  <span>OPEN BOUNTIES</span>
                </div>
              </button>

              <button
                onClick={() => setBuyOrderSection("mine")}
                className={`flex-1 px-6 py-4 font-bold uppercase tracking-wider text-sm transition-all rounded-lg relative overflow-hidden group ${
                  buyOrderSection === "mine"
                    ? "bg-blue-500/20 border-2 border-blue-500/60 text-blue-400"
                    : "bg-black/40 border-2 border-gray-700/40 text-gray-500 hover:border-gray-600/60 hover:text-gray-400"
                }`}
              >
                <div className={`absolute inset-0 mek-overlay-diagonal-stripes pointer-events-none ${
                  buyOrderSection === "mine" ? "opacity-20" : "opacity-5"
                }`} />
                <div className="relative flex items-center justify-center gap-2">
                  <span className="text-lg">◆</span>
                  <span>MY BOUNTIES</span>
                </div>
              </button>
            </div>

            {/* Open Bountys Section - Slim Card Style */}
            {buyOrderSection === "open" && (
              <div className="space-y-2">
                <div className="relative mek-card-industrial rounded overflow-hidden border border-yellow-500/30 hover:border-yellow-500/60 transition-all group">
                  <div className="absolute inset-0 mek-overlay-diagonal-stripes pointer-events-none opacity-5" />
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-500/80 to-yellow-500/20" />
                  <div className="relative flex items-center justify-between gap-4 px-4 py-2">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                      <div className="font-bold text-yellow-400 uppercase text-sm tracking-wider">Cameras & Film</div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[10px] text-gray-500 uppercase">Qty:</span>
                        <span className="text-base font-bold text-yellow-400">5.0</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xl font-bold text-yellow-400 mek-glow-yellow">2,500g</div>
                        <div className="text-[9px] text-yellow-400/40 uppercase tracking-wide">500g/unit</div>
                      </div>
                      <button className="px-4 py-1.5 bg-yellow-400/10 border border-yellow-400/50 hover:bg-yellow-400/20 hover:border-yellow-400/70 text-yellow-400 font-bold text-xs uppercase tracking-wider rounded transition-all">
                        FILL BOUNTY
                      </button>
                    </div>
                  </div>
                </div>

                <div className="relative mek-card-industrial rounded overflow-hidden border border-yellow-500/30 hover:border-yellow-500/60 transition-all group">
                  <div className="absolute inset-0 mek-overlay-diagonal-stripes pointer-events-none opacity-5" />
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-500/80 to-yellow-500/20" />
                  <div className="relative flex items-center justify-between gap-4 px-4 py-2">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                      <div className="font-bold text-yellow-400 uppercase text-sm tracking-wider">Musical</div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[10px] text-gray-500 uppercase">Qty:</span>
                        <span className="text-base font-bold text-yellow-400">10.0</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xl font-bold text-yellow-400 mek-glow-yellow">7,000g</div>
                        <div className="text-[9px] text-yellow-400/40 uppercase tracking-wide">700g/unit</div>
                      </div>
                      <button className="px-4 py-1.5 bg-yellow-400/10 border border-yellow-400/50 hover:bg-yellow-400/20 hover:border-yellow-400/70 text-yellow-400 font-bold text-xs uppercase tracking-wider rounded transition-all">
                        FILL BOUNTY
                      </button>
                    </div>
                  </div>
                </div>

                <div className="relative mek-card-industrial rounded overflow-hidden border border-yellow-500/30 hover:border-yellow-500/60 transition-all group">
                  <div className="absolute inset-0 mek-overlay-diagonal-stripes pointer-events-none opacity-5" />
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-500/80 to-yellow-500/20" />
                  <div className="relative flex items-center justify-between gap-4 px-4 py-2">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                      <div className="font-bold text-yellow-400 uppercase text-sm tracking-wider">Materials</div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[10px] text-gray-500 uppercase">Qty:</span>
                        <span className="text-base font-bold text-yellow-400">3.0</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xl font-bold text-yellow-400 mek-glow-yellow">1,800g</div>
                        <div className="text-[9px] text-yellow-400/40 uppercase tracking-wide">600g/unit</div>
                      </div>
                      <button className="px-4 py-1.5 bg-yellow-400/10 border border-yellow-400/50 hover:bg-yellow-400/20 hover:border-yellow-400/70 text-yellow-400 font-bold text-xs uppercase tracking-wider rounded transition-all">
                        FILL BOUNTY
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* My Bountys Section - Slim Card Style */}
            {buyOrderSection === "mine" && (
              <div className="space-y-2">
                <div className="relative mek-card-industrial rounded overflow-hidden border border-blue-500/40 hover:border-blue-400/70 transition-all">
                  <div className="absolute inset-0 mek-overlay-diagonal-stripes pointer-events-none opacity-5" />
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500/80 to-blue-500/20" />
                  <div className="relative flex items-center justify-between gap-4 px-4 py-2">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <div className="font-bold text-yellow-400 uppercase text-sm tracking-wider">Cameras & Film</div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[10px] text-gray-500 uppercase">Buying:</span>
                        <span className="text-base font-bold text-yellow-400">5.0</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xl font-bold text-red-400">2,500g</div>
                        <div className="text-[9px] text-red-400/40 uppercase tracking-wide">Locked</div>
                      </div>
                      <button className="px-4 py-1.5 bg-red-900/30 border border-red-500/50 hover:bg-red-900/50 hover:border-red-400/70 text-red-400 font-bold text-xs uppercase tracking-wider rounded transition-all">
                        ⊗ CANCEL
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </>
            )}

            {/* BOUNTIES LAYOUT 6: Ultra-Compact List with Dividers */}
            {buyOrderLayout === 6 && (
              <>
            {/* Toggle Buttons */}
            <div className="mb-6 flex gap-3">
              <button
                onClick={() => setBuyOrderSection("open")}
                className={`flex-1 px-6 py-4 font-bold uppercase tracking-wider text-sm transition-all rounded-lg relative overflow-hidden group ${
                  buyOrderSection === "open"
                    ? "bg-yellow-500/20 border-2 border-yellow-500/60 text-yellow-400"
                    : "bg-black/40 border-2 border-gray-700/40 text-gray-500 hover:border-gray-600/60 hover:text-gray-400"
                }`}
              >
                <div className={`absolute inset-0 mek-overlay-diagonal-stripes pointer-events-none ${
                  buyOrderSection === "open" ? "opacity-20" : "opacity-5"
                }`} />
                <div className="relative flex items-center justify-center gap-2">
                  <span className="text-lg">◆</span>
                  <span>OPEN BOUNTIES</span>
                </div>
              </button>

              <button
                onClick={() => setBuyOrderSection("mine")}
                className={`flex-1 px-6 py-4 font-bold uppercase tracking-wider text-sm transition-all rounded-lg relative overflow-hidden group ${
                  buyOrderSection === "mine"
                    ? "bg-blue-500/20 border-2 border-blue-500/60 text-blue-400"
                    : "bg-black/40 border-2 border-gray-700/40 text-gray-500 hover:border-gray-600/60 hover:text-gray-400"
                }`}
              >
                <div className={`absolute inset-0 mek-overlay-diagonal-stripes pointer-events-none ${
                  buyOrderSection === "mine" ? "opacity-20" : "opacity-5"
                }`} />
                <div className="relative flex items-center justify-center gap-2">
                  <span className="text-lg">◆</span>
                  <span>MY BOUNTIES</span>
                </div>
              </button>
            </div>

            {/* Open Bountys Section - Ultra-Compact List */}
            {buyOrderSection === "open" && (
              <div className="mek-card-industrial rounded-lg overflow-hidden border border-yellow-500/40">
                <div className="absolute inset-0 mek-overlay-metal-texture pointer-events-none opacity-5" />

                {/* Header */}
                <div className="relative bg-black/80 border-b-2 border-yellow-500/50 px-4 py-1.5">
                  <div className="absolute inset-0 mek-overlay-hazard-stripes opacity-10" />
                  <div className="relative text-[10px] text-yellow-400 uppercase tracking-widest font-bold">
                    Available Orders
                  </div>
                </div>

                {/* Column Headers */}
                <div className="relative bg-black/60 border-b border-gray-700/50 px-4 py-2">
                  <div className="flex items-center gap-3">
                    {/* Essence name column header */}
                    <div className="flex-1 min-w-0"></div>

                    {/* Units column header */}
                    <div className="min-w-[60px] text-right">
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">Units</div>
                    </div>

                    <div className="w-px" />

                    {/* Gold per essence column header */}
                    <div className="text-right min-w-[75px]">
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">G/Essence</div>
                    </div>

                    <div className="w-px" />

                    {/* Total column header */}
                    <div className="text-right min-w-[70px]">
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">Total</div>
                    </div>

                    {/* Button column spacer */}
                    <div className="ml-2" style={{ width: '78px' }}></div>
                  </div>
                </div>

                {/* Order List */}
                <div className="relative divide-y divide-gray-700/50">
                  {/* Order 1 - User HAS enough essence (blue units) */}
                  <div className="group hover:bg-yellow-500/5 transition-all">
                    <div className="flex items-center gap-3 px-4 py-2.5">
                      {/* Essence thumbnail + name */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <img
                          src="/essence-images/named-100px/1011-fm.png"
                          alt="Cameras & Film"
                          className="w-6 h-6 rounded"
                        />
                        <div className="font-bold text-yellow-400 uppercase text-xs tracking-wider truncate">Cameras & Film</div>
                      </div>

                      {/* Units needed */}
                      <div className="min-w-[60px] text-right">
                        <div className="text-base font-bold text-blue-400" style={{ textShadow: '0 0 8px rgba(59, 130, 246, 0.8)' }}>5.0</div>
                      </div>

                      <div className="w-px h-4 bg-gray-700/50" />

                      {/* Gold per unit */}
                      <div className="text-right min-w-[75px]">
                        <div className="text-sm text-white">500g/unit</div>
                      </div>

                      <div className="w-px h-4 bg-gray-700/50" />

                      {/* Total gold */}
                      <div className="text-right min-w-[70px]">
                        <div className="text-base font-bold text-yellow-400">2,500g</div>
                      </div>

                      {/* Fulfill button - BLUE GLOW when has enough */}
                      <button
                        className="ml-2 px-3 py-1 bg-blue-500/20 border border-blue-400/60 hover:bg-blue-500/30 text-blue-400 font-bold text-[10px] uppercase tracking-widest rounded transition-all"
                        style={{ boxShadow: '0 0 12px rgba(59, 130, 246, 0.5)' }}
                      >
                        FULFILL
                      </button>
                    </div>
                  </div>

                  {/* Order 2 - User does NOT have enough essence (dull red units) */}
                  <div className="group hover:bg-yellow-500/5 transition-all">
                    <div className="flex items-center gap-3 px-4 py-2.5">
                      {/* Essence thumbnail + name */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <img
                          src="/essence-images/named-100px/arcade.png"
                          alt="Musical"
                          className="w-6 h-6 rounded"
                        />
                        <div className="font-bold text-yellow-400 uppercase text-xs tracking-wider truncate">Musical</div>
                      </div>

                      {/* Units needed - DULL RED when not enough */}
                      <div className="min-w-[60px] text-right">
                        <div className="text-base font-bold text-red-400/70">10.0</div>
                      </div>

                      <div className="w-px h-4 bg-gray-700/50" />

                      {/* Gold per unit */}
                      <div className="text-right min-w-[75px]">
                        <div className="text-sm text-white">700g/unit</div>
                      </div>

                      <div className="w-px h-4 bg-gray-700/50" />

                      {/* Total gold */}
                      <div className="text-right min-w-[70px]">
                        <div className="text-base font-bold text-yellow-400">7,000g</div>
                      </div>

                      {/* Fulfill button - GRAYED OUT when not enough */}
                      <button
                        disabled
                        className="ml-2 px-3 py-1 bg-gray-800/30 border border-gray-600/30 text-gray-500 font-bold text-[10px] uppercase tracking-widest rounded cursor-not-allowed"
                      >
                        FULFILL
                      </button>
                    </div>
                  </div>

                  {/* Order 3 - User HAS enough essence (blue units) */}
                  <div className="group hover:bg-yellow-500/5 transition-all">
                    <div className="flex items-center gap-3 px-4 py-2.5">
                      {/* Essence thumbnail + name */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <img
                          src="/essence-images/named-100px/concrete.png"
                          alt="Materials"
                          className="w-6 h-6 rounded"
                        />
                        <div className="font-bold text-yellow-400 uppercase text-xs tracking-wider truncate">Materials</div>
                      </div>

                      {/* Units needed */}
                      <div className="min-w-[60px] text-right">
                        <div className="text-base font-bold text-blue-400" style={{ textShadow: '0 0 8px rgba(59, 130, 246, 0.8)' }}>3.0</div>
                      </div>

                      <div className="w-px h-4 bg-gray-700/50" />

                      {/* Gold per unit */}
                      <div className="text-right min-w-[75px]">
                        <div className="text-sm text-white">600g/unit</div>
                      </div>

                      <div className="w-px h-4 bg-gray-700/50" />

                      {/* Total gold */}
                      <div className="text-right min-w-[70px]">
                        <div className="text-base font-bold text-yellow-400">1,800g</div>
                      </div>

                      {/* Fulfill button - BLUE GLOW when has enough */}
                      <button
                        className="ml-2 px-3 py-1 bg-blue-500/20 border border-blue-400/60 hover:bg-blue-500/30 text-blue-400 font-bold text-[10px] uppercase tracking-widest rounded transition-all"
                        style={{ boxShadow: '0 0 12px rgba(59, 130, 246, 0.5)' }}
                      >
                        FULFILL
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* My Bountys Section - Ultra-Compact List */}
            {buyOrderSection === "mine" && (
              <div className="mek-card-industrial rounded-lg overflow-hidden border border-blue-500/40">
                <div className="absolute inset-0 mek-overlay-metal-texture pointer-events-none opacity-5" />

                {/* Header */}
                <div className="relative bg-black/80 border-b-2 border-blue-500/50 px-4 py-1.5">
                  <div className="absolute inset-0 mek-overlay-diagonal-stripes opacity-10" />
                  <div className="relative text-[10px] text-blue-400 uppercase tracking-widest font-bold">
                    Your Active Orders
                  </div>
                </div>

                {/* Column Headers */}
                <div className="relative bg-black/60 border-b border-gray-700/50 px-4 py-2">
                  <div className="flex items-center gap-3">
                    {/* Essence name column header */}
                    <div className="flex-1 min-w-0"></div>

                    {/* Units column header */}
                    <div className="min-w-[60px] text-right">
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">Units</div>
                    </div>

                    <div className="w-px" />

                    {/* Gold per essence column header */}
                    <div className="text-right min-w-[75px]">
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">G/Essence</div>
                    </div>

                    <div className="w-px" />

                    {/* Total column header */}
                    <div className="text-right min-w-[70px]">
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">Total</div>
                    </div>

                    {/* Button column spacer */}
                    <div className="ml-2" style={{ width: '74px' }}></div>
                  </div>
                </div>

                {/* Order List */}
                <div className="relative divide-y divide-gray-700/50">
                  <div className="group hover:bg-blue-500/5 transition-all">
                    <div className="flex items-center gap-3 px-4 py-2.5">
                      {/* Essence thumbnail + name */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <img
                          src="/essence-images/named-100px/1011-fm.png"
                          alt="Cameras & Film"
                          className="w-6 h-6 rounded"
                        />
                        <div className="font-bold text-yellow-400 uppercase text-xs tracking-wider truncate">Cameras & Film</div>
                      </div>

                      {/* Units buying */}
                      <div className="min-w-[60px] text-right">
                        <div className="text-base font-bold text-blue-400">5.0</div>
                      </div>

                      <div className="w-px h-4 bg-gray-700/50" />

                      {/* Gold per unit */}
                      <div className="text-right min-w-[75px]">
                        <div className="text-sm text-white">500g/unit</div>
                      </div>

                      <div className="w-px h-4 bg-gray-700/50" />

                      {/* Total locked gold */}
                      <div className="text-right min-w-[70px]">
                        <div className="text-base font-bold text-red-400">2,500g</div>
                      </div>

                      {/* Cancel button */}
                      <button className="ml-2 px-3 py-1 bg-red-900/30 border border-red-500/50 hover:bg-red-900/50 text-red-400 font-bold text-[10px] uppercase tracking-widest rounded transition-all">
                        CANCEL
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </>
            )}

            {/* Create Bounty Modal - Industrial Sci-Fi Design */}
            {showCreateRequest && (
              <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                {/* Backdrop with scan lines */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(250, 182, 23, 0.03) 2px, rgba(250, 182, 23, 0.03) 4px)'
                  }} />
                </div>

                {/* Modal Container */}
                <div className="relative mek-card-industrial mek-border-sharp-gold p-0 max-w-lg w-full rounded-xl overflow-hidden animate-in">
                  {/* Hazard stripe header */}
                  <div className="absolute top-0 left-0 right-0 h-3 mek-overlay-hazard-stripes opacity-70 z-10" />

                  {/* Grunge overlays */}
                  <div className="absolute inset-0 mek-overlay-scratches pointer-events-none" />
                  <div className="absolute inset-0 mek-overlay-rust pointer-events-none" />
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 mek-overlay-metal-texture" />
                  </div>

                  {/* Animated corner indicators */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-yellow-500 opacity-60" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-yellow-500 opacity-60" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-yellow-500 opacity-60" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-yellow-500 opacity-60" />

                  {/* Content */}
                  <div className="relative p-6 pt-8">
                    {/* Header */}
                    <div className="mb-6 pb-4 border-b-2 border-yellow-500/30">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-1 h-8 bg-yellow-500 mek-glow-yellow" />
                        <h2 className="mek-text-industrial text-3xl text-yellow-400 mek-text-shadow">
                          CREATE BOUNTY
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                        <span className="mek-label-uppercase text-blue-400/70">BOUNTY PROTOCOL</span>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {/* Essence Variation Selector */}
                      <div>
                        <label className="block mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="mek-label-uppercase text-yellow-400/80">◆ DESIRED ESSENCE</span>
                            <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/30 to-transparent" />
                          </div>
                        </label>
                        <div className="relative">
                          <select
                            value={requestVariation}
                            onChange={(e) => setRequestVariation(e.target.value)}
                            className="w-full px-4 py-3 bg-black/80 border-2 border-gray-700/50 text-yellow-400 font-bold uppercase tracking-wider focus:border-yellow-500/70 focus:outline-none transition-all rounded-lg appearance-none cursor-pointer"
                            style={{
                              backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(250, 182, 23, 0.02) 10px, rgba(250, 182, 23, 0.02) 20px)'
                            }}
                          >
                            <option value="" className="bg-black">SELECT ESSENCE YOU WANT...</option>
                            {unownedEssenceVariations.map((variation) => (
                              <option key={variation.name} value={variation.name} className="bg-black">
                                {variation.name}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-yellow-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Amount Input with Industrial Styling */}
                      <div>
                        <label className="block mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="mek-label-uppercase text-yellow-400/80">◆ QUANTITY REQUESTED</span>
                            <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/30 to-transparent" />
                          </div>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={requestAmount}
                            onChange={(e) => setRequestAmount(e.target.value)}
                            min="0.1"
                            step="0.1"
                            className="w-full px-4 py-3 bg-black/80 border-2 border-gray-700/50 text-yellow-400 font-bold text-lg focus:border-yellow-500/70 focus:outline-none transition-all rounded-lg"
                            style={{
                              boxShadow: requestAmount ? "0 0 15px rgba(250, 182, 23, 0.15), inset 0 0 10px rgba(250, 182, 23, 0.05)" : "none"
                            }}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500/50 text-xs uppercase tracking-wider">
                            UNITS
                          </div>
                        </div>
                      </div>

                      {/* Total Price with Digit Controls */}
                      <div>
                        <label className="block mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="mek-label-uppercase text-yellow-400/80">◆ TOTAL OFFERING PRICE</span>
                            <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/30 to-transparent" />
                          </div>
                        </label>

                        {/* Price Display */}
                        <div className="mb-3 p-4 bg-black/80 border-2 border-yellow-500/30 rounded-lg">
                          <div className="text-center mb-2">
                            <div className="text-3xl font-bold text-yellow-400 font-mono tracking-wider">
                              {(parseInt(requestTotalPrice) || 0).toLocaleString()}
                              <span className="text-yellow-500/60 text-xl ml-2">g</span>
                            </div>
                            {requestAmount && requestTotalPrice && (
                              <div className="text-xs text-gray-400 mt-2">
                                ({(parseInt(requestTotalPrice) / parseFloat(requestAmount)).toFixed(0)}g per unit)
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Digit Place Controls */}
                        <div className="grid grid-cols-5 gap-2">
                          {[
                            { label: '10k', value: 10000 },
                            { label: '1k', value: 1000 },
                            { label: '100', value: 100 },
                            { label: '10', value: 10 },
                            { label: '1', value: 1 }
                          ].map((place) => (
                            <div key={place.value} className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const current = parseInt(requestTotalPrice) || 0;
                                  setRequestTotalPrice(String(Math.max(0, current + place.value)));
                                }}
                                className="relative bg-green-900/30 border border-green-500/30 hover:bg-green-900/50 hover:border-green-500/50 text-green-400 py-2 transition-all rounded-md group"
                              >
                                <div className="absolute inset-0 mek-overlay-diagonal-stripes opacity-10 group-hover:opacity-20" />
                                <div className="relative flex items-center justify-center">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                                  </svg>
                                </div>
                              </button>

                              <div className="text-center text-xs font-bold text-gray-400 py-1 bg-black/50 border border-gray-700/30 rounded-md">
                                {place.label}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const current = parseInt(requestTotalPrice) || 0;
                                  setRequestTotalPrice(String(Math.max(0, current - place.value)));
                                }}
                                className="relative bg-red-900/30 border border-red-500/30 hover:bg-red-900/50 hover:border-red-500/50 text-red-400 py-2 transition-all rounded-md group"
                              >
                                <div className="absolute inset-0 mek-overlay-diagonal-stripes opacity-10 group-hover:opacity-20" />
                                <div className="relative flex items-center justify-center">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 15l-7-7-7 7" transform="rotate(180 12 12)" />
                                  </svg>
                                </div>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Transaction Summary - Highlighted Panel */}
                      {requestTotalPrice && requestAmount && requestVariation && (
                        <div className="relative p-4 bg-black/90 border-2 border-yellow-500/40 rounded-lg overflow-hidden">
                          <div className="absolute inset-0 mek-overlay-diagonal-stripes opacity-20 pointer-events-none" />
                          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-500/0 via-yellow-500/50 to-yellow-500/0" />

                          <div className="relative space-y-3">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-yellow-500/20">
                              <div className="w-2 h-2 bg-yellow-400 rotate-45" />
                              <span className="mek-label-uppercase text-yellow-400 font-bold">ORDER SUMMARY</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-xs uppercase tracking-wider text-gray-400">Essence:</span>
                              <span className="text-yellow-400 font-bold text-sm">
                                {requestVariation}
                              </span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-xs uppercase tracking-wider text-gray-400">Quantity:</span>
                              <span className="text-blue-400 font-bold">
                                {parseFloat(requestAmount).toFixed(1)} units
                              </span>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-gray-700/50">
                              <span className="text-xs uppercase tracking-wider text-red-400/80">Gold to Lock:</span>
                              <span className="text-red-400 font-bold text-lg">
                                {parseInt(requestTotalPrice).toLocaleString()}
                                <span className="text-red-400/60 text-sm ml-1">g</span>
                              </span>
                            </div>

                            <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded mt-3">
                              <div className="flex items-start gap-2">
                                <span className="text-yellow-400 text-xs">⚠</span>
                                <span className="text-yellow-400/80 text-[10px] leading-tight">
                                  This gold will be locked until the order is filled or cancelled
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons - Industrial Style */}
                      <div className="flex gap-3 mt-6 pt-4 border-t-2 border-gray-800/50">
                        <button
                          onClick={handleCreateRequest}
                          className="relative flex-1 px-6 py-4 font-bold text-black bg-yellow-400 transition-all duration-200 uppercase tracking-wider overflow-hidden group rounded-lg"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity animate-shimmer pointer-events-none" />
                          <span className="relative flex items-center justify-center gap-2">
                            <span className="text-xl">◆</span>
                            DEPLOY BOUNTY
                          </span>
                        </button>

                        <button
                          onClick={() => setShowCreateRequest(false)}
                          className="relative flex-1 px-6 py-4 bg-gray-900/80 border-2 border-gray-700/50 hover:border-red-500/50 hover:bg-red-900/20 text-gray-400 hover:text-red-400 font-bold uppercase tracking-wider transition-all rounded-lg"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <span className="text-xl">⊗</span>
                            ABORT
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom hazard stripe */}
                  <div className="absolute bottom-0 left-0 right-0 h-2 mek-overlay-hazard-stripes opacity-50" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* REGULAR MARKET VIEW */}
        {!showOffersView && (
          <>
        {/* Search and Filters - Combined on One Card */}
        <div className="mb-6">
          <div className="flex gap-3 flex-wrap items-center p-3 bg-black/40 border border-gray-800 rounded-lg mek-overlay-metal-texture mb-3">
            {/* Category Dropdown */}
            <div className="relative category-dropdown-container">
              <button
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className={getHeaderMyListingsButtonClasses(headerButtonStyle, selectedRarity !== "all")}
              >
                <span>{RARITY_CATEGORIES.find(c => c.id === selectedRarity)?.name || "All Essence"}</span>
                <svg
                  className={`w-4 h-4 ml-2 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {categoryDropdownOpen && (
                <div
                  className={getDropdownMenuClasses(dropdownMenuStyle).container}
                  style={{ willChange: 'opacity, transform', transform: 'translate3d(0,0,0)' }}
                >
                  {RARITY_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedRarity(category.id);
                        setCategoryDropdownOpen(false);
                      }}
                      className={getDropdownMenuClasses(dropdownMenuStyle).item(selectedRarity === category.id)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search with Autocomplete */}
            <div className="relative w-80">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500/50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="SEARCH ESSENCE BY VARIATION NAME..."
                className="w-full pl-9 pr-3 py-2 bg-black/60 border border-gray-700/50 text-yellow-400 placeholder-gray-600 text-xs uppercase tracking-wider focus:border-yellow-500/50 focus:outline-none transition-all rounded"
                style={{
                  boxShadow: searchTerm ? "0 0 15px rgba(250, 182, 23, 0.15), inset 0 0 8px rgba(250, 182, 23, 0.08)" : "none",
                }}
              />

              {/* Autocomplete Suggestions */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-black/95 border-2 border-yellow-500/50 rounded-lg max-h-60 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchTerm(suggestion);
                        setShowSuggestions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-yellow-400 hover:bg-yellow-500/20 transition-colors border-b border-gray-800 last:border-0"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative sort-dropdown-container ml-auto">
              <button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className={getHeaderMyListingsButtonClasses(headerButtonStyle, false)}
              >
                <span>{SORT_OPTIONS.find(o => o.id === sortBy)?.name}</span>
                <svg
                  className={`w-4 h-4 ml-2 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {sortDropdownOpen && (
                <div
                  className={getDropdownMenuClasses(dropdownMenuStyle).container.replace('left-0', 'right-0')}
                  style={{ willChange: 'opacity, transform', transform: 'translate3d(0,0,0)' }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setSortBy(option.id);
                        setSortDropdownOpen(false);
                      }}
                      className={getDropdownMenuClasses(dropdownMenuStyle).item(sortBy === option.id)}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
          {sortedListings.length === 0 ? (
            <div className="col-span-full text-center py-12 mek-card-industrial mek-border-sharp-gray">
              <div className="text-6xl mb-4 text-yellow-500/20">⊗</div>
              <div className="mek-text-industrial text-xl text-gray-400">NO ESSENCE AVAILABLE</div>
              <div className="mek-label-uppercase text-gray-500 mt-2">ADJUST SEARCH PARAMETERS OR CHECK BACK LATER</div>
            </div>
          ) : (
            sortedListings.map((listing) => {
              const isOwn = listing.sellerId === userId;
              const canAfford = userProfile && userProfile.gold >= listing.pricePerUnit * listing.quantity;

              const cardStyles = getListingCardStyles(listingCardStyle);
              return (
                <div
                  key={listing._id}
                  className={cardStyles.className}
                  style={cardStyles.style}
                >
                  {/* Crosshatch pattern */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-40"
                    style={{
                      backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255, 255, 255, 0.01) 35px, rgba(255, 255, 255, 0.01) 70px),
                                        repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(255, 255, 255, 0.01) 35px, rgba(255, 255, 255, 0.01) 70px)`
                    }}
                  />
                  {/* Radial gradient accents */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 25% 25%, rgba(250, 182, 23, 0.04) 0%, transparent 25%),
                                   radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.03) 0%, transparent 25%),
                                   radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.01) 0%, transparent 50%)`
                    }}
                  />

                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent animate-shimmer" />
                  </div>

                  {isOwn && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[10px] px-3 py-1 font-bold uppercase tracking-wider rounded-md">
                      ◆ YOUR LISTING
                    </div>
                  )}

                  {/* Essence Image */}
                  <div className="flex justify-center items-center mb-3 h-24">
                    <img
                      src={`/essence-images/named-100px/${sanitizeVariationName(listing.itemVariation || '')}.png`}
                      alt={listing.itemVariation || "Essence"}
                      className="max-w-[100px] max-h-[100px] w-auto h-auto object-contain"
                      onError={(e) => {
                        // Fallback to placeholder if image not found
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Essence Details */}
                  <div className="mb-3">
                    <div className="font-bold text-yellow-400 uppercase tracking-wide text-center text-sm">
                      {listing.itemVariation || "Unknown Essence"}
                    </div>
                  </div>

                  {/* Price Display */}
                  {renderPriceDisplay(listing.pricePerUnit, listing.quantity, priceLayoutStyle)}

                  {/* Time Left - Countdown Timer */}
                  {listing.expiresAt && renderTimeRemaining(listing.expiresAt, timeRemainingStyle)}

                  {/* Action Button */}
                  {isOwn ? (
                    <button
                      onClick={() => handleCancelListing(listing._id)}
                      className="relative z-10 w-full px-4 py-2 bg-red-900/40 border-2 border-red-500/50 hover:bg-red-900/60 hover:border-red-400 text-red-400 font-bold uppercase tracking-wider transition-all rounded-lg cursor-pointer text-sm"
                    >
                      ⊗ CANCEL
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchase(listing._id, listing.quantity)}
                      disabled={!canAfford}
                      className={`${getButtonStyle(buttonStyle)} ${
                        canAfford
                          ? "mek-button-primary"
                          : "bg-gray-900/60 border-2 border-gray-700/50 text-gray-600 cursor-not-allowed"
                      }`}
                      style={{
                        clipPath: canAfford ? getButtonClipPath(buttonStyle) : undefined
                      }}
                    >
                      {canAfford ? (
                        getButtonTextures(buttonStyle)
                      ) : (
                        <>
                          <div className="absolute inset-0 mek-overlay-scratches opacity-15" />
                          <div className="absolute inset-0 mek-overlay-rust opacity-10" />
                        </>
                      )}
                      <span className="relative z-10">
                        {canAfford ? "◆ PURCHASE" : "⊗ INSUFFICIENT FUNDS"}
                      </span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* My Listings Section */}
        {myListings && myListings.filter(l => l.itemType === "essence").length > 0 && (
          <div className="mt-8">
            <div className="mb-4 p-3 bg-black/60 border-l-4 border-yellow-500 mek-overlay-diagonal-stripes">
              <h2 className="mek-text-industrial text-2xl text-yellow-400 mek-text-shadow">ACTIVE DEPLOYMENTS</h2>
              <p className="mek-label-uppercase text-yellow-400/60 mt-1">
                {myListings.filter(l => l.itemType === "essence").length} ESSENCE LISTINGS
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myListings
                .filter(l => l.itemType === "essence")
                .map((listing) => (
                  <div key={listing._id} className="relative p-4 rounded-lg overflow-hidden hover:border-yellow-400/10 transition-all duration-500"
                    style={{
                      background: `linear-gradient(105deg, rgba(255, 255, 255, 0.01) 0%, rgba(255, 255, 255, 0.03) 40%, rgba(255, 255, 255, 0.01) 100%)`,
                      backdropFilter: 'blur(3px) brightness(1.05)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    {/* Crosshatch pattern */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-40"
                      style={{
                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255, 255, 255, 0.01) 35px, rgba(255, 255, 255, 0.01) 70px),
                                          repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(255, 255, 255, 0.01) 35px, rgba(255, 255, 255, 0.01) 70px)`
                      }}
                    />
                    {/* Radial gradient accents */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 25% 25%, rgba(250, 182, 23, 0.04) 0%, transparent 25%),
                                     radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.03) 0%, transparent 25%),
                                     radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.01) 0%, transparent 50%)`
                      }}
                    />
                    <div className="relative">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-bold text-yellow-400 uppercase tracking-wide text-sm">
                            {listing.itemVariation || listing.itemType}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="mek-label-uppercase text-gray-500 text-xs">QTY:</span>
                            <span className="text-yellow-400">{listing.quantity}</span>
                            <span className="text-gray-600">×</span>
                            <span className="text-yellow-400">{listing.pricePerUnit}g</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="mek-label-uppercase text-gray-600 text-[10px]">DEPLOYED</div>
                          <div className="text-xs text-yellow-400/60">{new Date(listing.listedAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelListing(listing._id)}
                        className="w-full px-3 py-2 bg-red-900/30 border border-red-500/40 hover:bg-red-900/50 hover:border-red-400/60 text-red-400 font-bold uppercase tracking-wider transition-all text-sm rounded-lg"
                      >
                        ⊗ RECALL
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Create Listing Modal - Industrial Sci-Fi Design - REPLACED WITH V5 LIGHTBOX */}
        {false && showCreateListing && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            {/* Backdrop with scan lines */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(250, 182, 23, 0.03) 2px, rgba(250, 182, 23, 0.03) 4px)'
              }} />
            </div>

            {/* Modal Container */}
            <div className="relative mek-card-industrial mek-border-sharp-gold p-0 max-w-lg w-full rounded-xl overflow-hidden animate-in">
              {/* Hazard stripe header */}
              <div className="absolute top-0 left-0 right-0 h-3 mek-overlay-hazard-stripes opacity-70 z-10" />

              {/* Grunge overlays */}
              <div className="absolute inset-0 mek-overlay-scratches pointer-events-none" />
              <div className="absolute inset-0 mek-overlay-rust pointer-events-none" />
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 mek-overlay-metal-texture" />
              </div>

              {/* Animated corner indicators */}
              <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-yellow-500 opacity-60" />
              <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-yellow-500 opacity-60" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-yellow-500 opacity-60" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-yellow-500 opacity-60" />

              {/* Content */}
              <div className="relative p-6 pt-8">
                {/* Header */}
                <div className="mb-6 pb-4 border-b-2 border-yellow-500/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-8 bg-yellow-500 mek-glow-yellow" />
                    <h2 className="mek-text-industrial text-3xl text-yellow-400 mek-text-shadow">
                      MARKET DEPLOYMENT
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="mek-label-uppercase text-green-400/70">LISTING PROTOCOL ACTIVE</span>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Essence Variation Selector */}
                  <div>
                    <label className="block mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="mek-label-uppercase text-yellow-400/80">◆ ESSENCE VARIATION</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/30 to-transparent" />
                      </div>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedVariation}
                        onChange={(e) => setSelectedVariation(e.target.value)}
                        className="w-full px-4 py-3 bg-black/80 border-2 border-gray-700/50 text-yellow-400 font-bold uppercase tracking-wider focus:border-yellow-500/70 focus:outline-none transition-all rounded-lg appearance-none cursor-pointer"
                        style={{
                          backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(250, 182, 23, 0.02) 10px, rgba(250, 182, 23, 0.02) 20px)'
                        }}
                      >
                        <option value="" className="bg-black">SELECT ESSENCE TYPE...</option>
                        {ownedEssenceVariations.map((variation) => (
                          <option key={variation.name} value={variation.name} className="bg-black">
                            {variation.name} ({variation.amount.toFixed(2)} owned)
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-yellow-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Amount Input with Industrial Styling */}
                  <div>
                    <label className="block mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="mek-label-uppercase text-yellow-400/80">◆ QUANTITY</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/30 to-transparent" />
                      </div>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={essenceAmount}
                        onChange={(e) => setEssenceAmount(e.target.value)}
                        min="0.1"
                        step="0.1"
                        className="w-full px-4 py-3 bg-black/80 border-2 border-gray-700/50 text-yellow-400 font-bold text-lg focus:border-yellow-500/70 focus:outline-none transition-all rounded-lg"
                        style={{
                          boxShadow: essenceAmount ? "0 0 15px rgba(250, 182, 23, 0.15), inset 0 0 10px rgba(250, 182, 23, 0.05)" : "none"
                        }}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500/50 text-xs uppercase tracking-wider">
                        UNITS
                      </div>
                    </div>
                  </div>

                  {/* Price Per Unit with Digit Controls */}
                  <div>
                    <label className="block mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="mek-label-uppercase text-yellow-400/80">◆ UNIT PRICE</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/30 to-transparent" />
                      </div>
                    </label>

                    {/* Price Display */}
                    <div className="mb-3 p-4 bg-black/80 border-2 border-yellow-500/30 rounded-lg">
                      <div className="text-center mb-2">
                        <div className="text-3xl font-bold text-yellow-400 font-mono tracking-wider">
                          {(parseInt(pricePerUnit) || 0).toLocaleString()}
                          <span className="text-yellow-500/60 text-xl ml-2">g</span>
                        </div>
                      </div>
                    </div>

                    {/* Digit Place Controls */}
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { label: '10k', value: 10000 },
                        { label: '1k', value: 1000 },
                        { label: '100', value: 100 },
                        { label: '10', value: 10 },
                        { label: '1', value: 1 }
                      ].map((place) => (
                        <div key={place.value} className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const current = parseInt(pricePerUnit) || 0;
                              setPricePerUnit(String(Math.max(0, current + place.value)));
                            }}
                            className="relative bg-green-900/30 border border-green-500/30 hover:bg-green-900/50 hover:border-green-500/50 text-green-400 py-2 transition-all rounded-md group"
                          >
                            <div className="absolute inset-0 mek-overlay-diagonal-stripes opacity-10 group-hover:opacity-20" />
                            <div className="relative flex items-center justify-center">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                              </svg>
                            </div>
                          </button>

                          <div className="text-center text-xs font-bold text-gray-400 py-1 bg-black/50 border border-gray-700/30 rounded-md">
                            {place.label}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const current = parseInt(pricePerUnit) || 0;
                              setPricePerUnit(String(Math.max(0, current - place.value)));
                            }}
                            className="relative bg-red-900/30 border border-red-500/30 hover:bg-red-900/50 hover:border-red-500/50 text-red-400 py-2 transition-all rounded-md group"
                          >
                            <div className="absolute inset-0 mek-overlay-diagonal-stripes opacity-10 group-hover:opacity-20" />
                            <div className="relative flex items-center justify-center">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 15l-7-7-7 7" transform="rotate(180 12 12)" />
                              </svg>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Listing Duration - Industrial Button Grid */}
                  <div>
                    <label className="block mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="mek-label-uppercase text-yellow-400/80">◆ DEPLOYMENT DURATION</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/30 to-transparent" />
                      </div>
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {DURATION_OPTIONS.map((option) => (
                        <button
                          key={option.days}
                          onClick={() => setSelectedDuration(option.days)}
                          className={`relative p-3 transition-all duration-200 overflow-hidden group rounded-lg ${
                            selectedDuration === option.days
                              ? "bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400"
                              : "bg-black/60 border-2 border-gray-700/50 text-gray-400 hover:border-yellow-500/30 hover:text-yellow-400"
                          }`}
                        >
                          {selectedDuration === option.days && (
                            <div className="absolute inset-0 mek-overlay-diagonal-stripes opacity-30" />
                          )}
                          <div className="relative flex flex-col items-center gap-1">
                            <span className="font-bold text-lg">{option.days}</span>
                            <span className="text-[9px] uppercase tracking-wider opacity-70">DAY{option.days > 1 ? 'S' : ''}</span>
                          </div>
                          {selectedDuration === option.days && (
                            <div className="absolute inset-0 border border-yellow-400/30 pointer-events-none" />
                          )}
                        </button>
                      ))}
                    </div>
                    {/* Cost display under duration */}
                    <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
                      <div className="flex items-center justify-between text-xs">
                        <span className="mek-label-uppercase text-red-400/70">LISTING FEE:</span>
                        <span className="text-red-400 font-bold">
                          {DURATION_OPTIONS.find(d => d.days === selectedDuration)?.cost.toLocaleString()}g
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Summary - Highlighted Panel */}
                  {pricePerUnit && essenceAmount && (
                    <div className="relative p-4 bg-black/90 border-2 border-yellow-500/40 rounded-lg overflow-hidden">
                      <div className="absolute inset-0 mek-overlay-diagonal-stripes opacity-20 pointer-events-none" />
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-500/0 via-yellow-500/50 to-yellow-500/0" />

                      <div className="relative space-y-3">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-yellow-500/20">
                          <div className="w-2 h-2 bg-yellow-400 rotate-45" />
                          <span className="mek-label-uppercase text-yellow-400 font-bold">TRANSACTION SUMMARY</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs uppercase tracking-wider text-gray-400">Total Value:</span>
                          <span className="text-yellow-400 font-bold text-lg">
                            {(parseInt(pricePerUnit) * parseFloat(essenceAmount)).toLocaleString()}
                            <span className="text-yellow-500/60 text-sm ml-1">g</span>
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs uppercase tracking-wider text-gray-400">Units:</span>
                          <span className="text-blue-400 font-bold">
                            {parseFloat(essenceAmount).toFixed(1)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-gray-700/50">
                          <span className="text-xs uppercase tracking-wider text-red-400/80">Deployment Cost:</span>
                          <span className="text-red-400 font-bold">
                            -{DURATION_OPTIONS.find(d => d.days === selectedDuration)?.cost.toLocaleString()}
                            <span className="text-red-400/60 text-sm ml-1">g</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons - Industrial Style */}
                  <div className="flex gap-3 mt-6 pt-4 border-t-2 border-gray-800/50">
                    <button
                      onClick={handleCreateListing}
                      className="relative flex-1 px-6 py-4 font-bold text-black bg-yellow-400 transition-all duration-200 uppercase tracking-wider overflow-hidden group rounded-lg"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity animate-shimmer pointer-events-none" />
                      <span className="relative flex items-center justify-center gap-2">
                        <span className="text-xl">◆</span>
                        DEPLOY LISTING
                      </span>
                    </button>

                    <button
                      onClick={() => setShowCreateListing(false)}
                      className="relative flex-1 px-6 py-4 bg-gray-900/80 border-2 border-gray-700/50 hover:border-red-500/50 hover:bg-red-900/20 text-gray-400 hover:text-red-400 font-bold uppercase tracking-wider transition-all rounded-lg"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span className="text-xl">⊗</span>
                        ABORT
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom hazard stripe */}
              <div className="absolute bottom-0 left-0 right-0 h-2 mek-overlay-hazard-stripes opacity-50" />
            </div>
          </div>
        )}

        {/* NEW V5 Yellow Gradient Lightbox */}
        <EssenceListingLightboxV5YellowGradient
          show={showCreateListing}
          onClose={() => setShowCreateListing(false)}
          onSubmit={async (data) => {
            if (!userId) {
              alert("Please wait for user initialization...");
              return;
            }

            const amount = parseFloat(data.amount);
            const price = parseInt(data.price);
            const durationOption = DURATION_OPTIONS.find(d => d.days === data.duration);

            if (!durationOption) return;

            // Check if user can afford listing fee
            if (userProfile && userProfile.gold < durationOption.cost) {
              alert(`Insufficient gold. Listing fee: ${durationOption.cost}g`);
              return;
            }

            try {
              await createListing({
                sellerId: userId,
                itemType: "essence",
                itemVariation: data.variation,
                quantity: amount,
                pricePerUnit: price,
                durationDays: data.duration,
                listingFee: durationOption.cost,
              });

              setShowCreateListing(false);
              setSelectedVariation("");
              setEssenceAmount("1");
              setPricePerUnit("");
              alert("Listing created successfully!");
            } catch (error) {
              alert(error instanceof Error ? error.message : "An error occurred");
            }
          }}
          ownedEssenceVariations={ownedEssenceVariations}
          durationOptions={DURATION_OPTIONS}
        />
        </>
        )}
      </div>
    </div>
  );
}
