"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ALL_VARIATIONS_FLAT } from "@/lib/variationsReferenceData";

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
  const [headerButtonStyle, setHeaderButtonStyle] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [timeRemainingStyle, setTimeRemainingStyle] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [priceLayoutStyle, setPriceLayoutStyle] = useState<1 | 2 | 3 | 4>(1);

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
    };

    if (sortDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [sortDropdownOpen]);

  // Format countdown timer
  const formatCountdown = (expiresAt: number) => {
    const remaining = expiresAt - currentTime;
    if (remaining <= 0) return "EXPIRED";

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
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
  const ownedEssenceVariations = (essenceState?.balances || [])
    .filter(b => b.accumulatedAmount > 0)
    .map(b => ({
      name: b.variationName,
      amount: b.accumulatedAmount
    }));

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

  // Price layout variations - horizontal layouts
  const renderPriceDisplay = (pricePerUnit: number, quantity: number, styleNum: 1 | 2 | 3 | 4) => {
    const totalPrice = pricePerUnit * quantity;

    switch(styleNum) {
      case 1: // Split Columns - Two equal columns side by side
        return (
          <div className="mb-3 p-3 bg-black/80 border border-yellow-500/20 rounded-lg grid grid-cols-2 gap-3">
            <div>
              <div className="mek-label-uppercase text-yellow-400/60 text-[10px] mb-1">UNIT PRICE</div>
              <div className="text-lg font-bold text-yellow-400">{pricePerUnit.toLocaleString()}g</div>
              <div className="text-[10px] text-gray-400">per essence</div>
            </div>
            <div className="border-l border-yellow-500/20 pl-3">
              <div className="mek-label-uppercase text-yellow-400/60 text-[10px] mb-1">TOTAL</div>
              <div className="text-lg font-bold text-yellow-400">{totalPrice.toLocaleString()}g</div>
              <div className="text-[10px] text-gray-400">for {quantity} essence</div>
            </div>
          </div>
        );

      case 2: // Unified Bar - Single row with separator
        return (
          <div className="mb-3 p-2.5 bg-black/80 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="mek-label-uppercase text-yellow-400/60 text-[9px]">UNIT:</span>
                  <span className="text-base font-bold text-yellow-400">{pricePerUnit.toLocaleString()}g</span>
                </div>
              </div>
              <div className="w-px h-8 bg-yellow-500/30" />
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="mek-label-uppercase text-yellow-400/60 text-[9px]">TOTAL:</span>
                  <span className="text-base font-bold text-yellow-400">{totalPrice.toLocaleString()}g</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // Divided Panels - Two distinct boxes
        return (
          <div className="mb-3 flex gap-2">
            <div className="flex-1 p-2 bg-black/80 border border-yellow-500/20 rounded-md">
              <div className="mek-label-uppercase text-yellow-400/60 text-[9px] text-center mb-0.5">UNIT</div>
              <div className="text-base font-bold text-yellow-400 text-center">{pricePerUnit.toLocaleString()}g</div>
            </div>
            <div className="flex items-center">
              <div className="text-yellow-500/50 text-xl">×</div>
            </div>
            <div className="flex-1 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
              <div className="mek-label-uppercase text-yellow-400/70 text-[9px] text-center mb-0.5">TOTAL</div>
              <div className="text-base font-bold text-yellow-400 text-center">{totalPrice.toLocaleString()}g</div>
            </div>
          </div>
        );

      case 4: // Compact Inline - Minimal single line
        return (
          <div className="mb-3 p-2 bg-black/80 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-baseline gap-1.5">
                <span className="text-yellow-400 font-bold text-base">{pricePerUnit.toLocaleString()}g</span>
                <span className="text-gray-500 text-xs">ea</span>
              </div>
              <div className="h-4 w-px bg-yellow-500/20" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-gray-500 text-xs">×{quantity}</span>
                <span className="text-yellow-400/50">=</span>
                <span className="text-yellow-400 font-bold text-base">{totalPrice.toLocaleString()}g</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Time remaining display variations
  const renderTimeRemaining = (expiresAt: number, styleNum: 1 | 2 | 3 | 4 | 5) => {
    const styles = getCountdownStyles(expiresAt);
    const timeText = formatCountdown(expiresAt);

    switch(styleNum) {
      case 1: // Hexagonal Badge - Angular with monospace
        return (
          <div className="mb-3 relative">
            <div
              className={`p-3 ${styles.containerClass}`}
              style={{
                clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)',
              }}
            >
              <div className="absolute inset-0 mek-overlay-diagonal-stripes opacity-10" />
              <div className={`${styles.labelClass} text-[9px] text-center mb-1 font-mono tracking-widest`}>
                ⏱ TIME REMAINING
              </div>
              <div className={`${styles.timeClass} text-base font-black text-center font-mono tracking-wider`}>
                {timeText}
              </div>
            </div>
          </div>
        );

      case 2: // Circular Arc - Round badge with system font
        return (
          <div className="mb-3 flex justify-center">
            <div className={`relative w-28 h-28 rounded-full ${styles.containerClass} p-1`}>
              <div className="absolute inset-0 rounded-full" style={{
                background: `conic-gradient(${styles.timeClass.includes('red') ? '#ef4444' : styles.timeClass.includes('orange') ? '#f97316' : styles.timeClass.includes('yellow') ? '#facc15' : '#ffffff'} ${Math.random() * 360}deg, transparent 0deg)`
              }} />
              <div className="absolute inset-2 rounded-full bg-black/90 flex flex-col items-center justify-center">
                <div className={`${styles.labelClass} text-[8px] uppercase tracking-wide mb-1`} style={{fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'}}>
                  Time Left
                </div>
                <div className={`${styles.timeClass} text-sm font-semibold text-center leading-tight`} style={{fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'}}>
                  {timeText}
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // Diagonal Banner - Slanted with condensed font
        return (
          <div className="mb-3 relative">
            <div
              className={`p-2 ${styles.containerClass} transform -skew-x-6`}
            >
              <div className="absolute inset-0 mek-overlay-hazard-stripes opacity-20" />
              <div className="transform skew-x-6">
                <div className={`${styles.labelClass} text-[8px] text-center uppercase tracking-[0.2em] font-bold mb-0.5`}>
                  ⟨ COUNTDOWN ⟩
                </div>
                <div className={`${styles.timeClass} text-lg font-black text-center`} style={{fontFamily: 'Impact, "Arial Black", sans-serif', letterSpacing: '-0.05em'}}>
                  {timeText}
                </div>
              </div>
            </div>
          </div>
        );

      case 4: // Bracket Frame - Military with stencil font
        return (
          <div className="mb-3 relative">
            <div className={`p-3 ${styles.containerClass} relative`}>
              <div className="absolute inset-0 mek-overlay-metal-texture opacity-10" />
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2" style={{borderColor: 'currentColor'}} />
              <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2" style={{borderColor: 'currentColor'}} />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2" style={{borderColor: 'currentColor'}} />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2" style={{borderColor: 'currentColor'}} />

              <div className={`${styles.labelClass} text-[10px] text-center font-bold tracking-[0.3em] uppercase mb-1`}>
                ◢ MISSION TIMER ◣
              </div>
              <div className={`${styles.timeClass} text-base font-black text-center tracking-widest uppercase`} style={{fontFamily: '"Courier New", monospace'}}>
                {timeText}
              </div>
            </div>
          </div>
        );

      case 5: // Minimalist Pill - Simple rounded with light sans-serif
        return (
          <div className="mb-3">
            <div className={`px-4 py-2 ${styles.containerClass} rounded-full`}>
              <div className="flex items-center justify-center gap-2">
                <div className={`${styles.labelClass} text-[9px] uppercase tracking-wide font-light`} style={{fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'}}>
                  Expires in
                </div>
                <div className="w-px h-3 bg-current opacity-30" />
                <div className={`${styles.timeClass} text-sm font-medium`} style={{fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'}}>
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
        return `${baseClasses} px-4 py-2 ${isActive
          ? 'bg-gradient-to-b from-yellow-400 to-yellow-500 text-black border border-yellow-300 shadow-lg shadow-yellow-500/25'
          : 'bg-gradient-to-b from-gray-700/25 to-gray-800/20 border border-gray-600/50 hover:from-gray-700/30 hover:to-gray-800/25 text-gray-400'
        } rounded text-xs font-semibold tracking-wider uppercase shadow-inner`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className="min-h-screen text-white overflow-hidden relative">
      {/* Debug Dropdowns */}
      <div className="fixed right-4 top-20 z-50 bg-black/90 border border-yellow-500/50 p-3 rounded-lg backdrop-blur-sm space-y-4">
        {/* Header Layout Selector */}
        <div>
          <label className="block mb-2 text-yellow-400 text-xs uppercase tracking-wider">Header Layout</label>
          <select
            value={headerLayout}
            onChange={(e) => setHeaderLayout(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
            className="w-full px-3 py-2 bg-black border border-yellow-500/30 text-yellow-400 text-sm rounded focus:outline-none focus:border-yellow-500"
          >
            <option value="1">Layout 1: Centered Buttons</option>
            <option value="2">Layout 2: Stacked Left</option>
            <option value="3">Layout 3: Inline Right</option>
            <option value="4">Layout 4: Bar with Dividers</option>
            <option value="5">Layout 5: Split Sides</option>
          </select>
        </div>

        {/* Header Button Style Selector */}
        <div>
          <label className="block mb-2 text-yellow-400 text-xs uppercase tracking-wider">Header Button Style</label>
          <select
            value={headerButtonStyle}
            onChange={(e) => setHeaderButtonStyle(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
            className="w-full px-3 py-2 bg-black border border-yellow-500/30 text-yellow-400 text-sm rounded focus:outline-none focus:border-yellow-500"
          >
            <option value="1">Style 1: Sleek Minimal</option>
            <option value="2">Style 2: Heavy Industrial</option>
            <option value="3">Style 3: Holographic Glow</option>
            <option value="4">Style 4: Military Stencil</option>
            <option value="5">Style 5: Brushed Metal</option>
          </select>
        </div>

        {/* Time Remaining Style Selector */}
        <div>
          <label className="block mb-2 text-yellow-400 text-xs uppercase tracking-wider">Time Remaining Style</label>
          <select
            value={timeRemainingStyle}
            onChange={(e) => setTimeRemainingStyle(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
            className="w-full px-3 py-2 bg-black border border-yellow-500/30 text-yellow-400 text-sm rounded focus:outline-none focus:border-yellow-500"
          >
            <option value="1">Style 1: Hexagonal Badge</option>
            <option value="2">Style 2: Circular Arc</option>
            <option value="3">Style 3: Diagonal Banner</option>
            <option value="4">Style 4: Bracket Frame</option>
            <option value="5">Style 5: Minimalist Pill</option>
          </select>
        </div>

        {/* Purchase Button Style Selector */}
        <div>
          <label className="block mb-2 text-yellow-400 text-xs uppercase tracking-wider">Purchase Button</label>
          <select
            value={buttonStyle}
            onChange={(e) => setButtonStyle(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
            className="w-full px-3 py-2 bg-black border border-yellow-500/30 text-yellow-400 text-sm rounded focus:outline-none focus:border-yellow-500"
          >
            <option value="1">Style 1: Hazard Angled</option>
            <option value="2">Style 2: Military Notched</option>
            <option value="3">Style 3: Tactical Hex</option>
            <option value="4">Style 4: Industrial Frame</option>
            <option value="5">Style 5: Battle Scarred</option>
          </select>
        </div>

        {/* Price Layout Style Selector */}
        <div>
          <label className="block mb-2 text-yellow-400 text-xs uppercase tracking-wider">Price Layout</label>
          <select
            value={priceLayoutStyle}
            onChange={(e) => setPriceLayoutStyle(Number(e.target.value) as 1 | 2 | 3 | 4)}
            className="w-full px-3 py-2 bg-black border border-yellow-500/30 text-yellow-400 text-sm rounded focus:outline-none focus:border-yellow-500"
          >
            <option value="1">Style 1: Split Columns</option>
            <option value="2">Style 2: Unified Bar</option>
            <option value="3">Style 3: Divided Panels</option>
            <option value="4">Style 4: Compact Inline</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 py-6">
        {/* Title Section - Military Command Panel */}
        <div className="relative mb-6 mek-card-industrial mek-border-sharp-gold rounded-xl p-7 mek-glow-yellow">
          <div className="absolute top-0 left-0 right-0 h-3 mek-overlay-hazard-stripes opacity-60" />
          <div className="absolute inset-0 mek-overlay-scratches pointer-events-none" />
          <div className="absolute inset-0 mek-overlay-rust pointer-events-none" />
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 mek-overlay-metal-texture" />
          </div>

          {/* Layout Variation 1: Centered Buttons Below Title */}
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
                      <span>OFFERS</span>
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

          {/* Layout Variation 2: Stacked Buttons Left-Aligned */}
          {headerLayout === 2 && (
            <div className="relative flex justify-between">
              <div className="space-y-3">
                <h1 className="mek-text-industrial text-5xl text-yellow-400 mek-text-shadow mb-2">
                  MARKET
                </h1>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowCreateListing(true)}
                    className={getHeaderListButtonClasses(headerButtonStyle)}
                  >
                    <span className="text-lg">⊕</span>
                    <span>LIST ESSENCE</span>
                  </button>
                  <button
                    onClick={() => setShowOnlyMyListings(!showOnlyMyListings)}
                    className={getHeaderMyListingsButtonClasses(headerButtonStyle, showOnlyMyListings)}
                  >
                    {showOnlyMyListings && <span className="text-green-600">✓</span>}
                    <span>MY LISTINGS</span>
                  </button>
                </div>
              </div>
              <div className="relative bg-black/60 border border-yellow-500/30 rounded px-6 py-3 mek-overlay-diagonal-stripes self-start">
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
          )}

          {/* Layout Variation 3: Buttons Inline Right of Title */}
          {headerLayout === 3 && (
            <div className="relative flex justify-between items-center">
              <div className="flex items-center gap-6">
                <h1 className="mek-text-industrial text-5xl text-yellow-400 mek-text-shadow">
                  MARKET
                </h1>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateListing(true)}
                    className={getHeaderListButtonClasses(headerButtonStyle)}
                  >
                    <span>⊕</span>
                    <span>LIST</span>
                  </button>
                  <button
                    onClick={() => setShowOnlyMyListings(!showOnlyMyListings)}
                    className={getHeaderMyListingsButtonClasses(headerButtonStyle, showOnlyMyListings)}
                  >
                    {showOnlyMyListings && <span className="text-green-600">✓</span>}
                    <span>MY LISTINGS</span>
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
          )}

          {/* Layout Variation 4: Horizontal Bar with Dividers */}
          {headerLayout === 4 && (
            <div className="relative">
              <div className="flex justify-between items-start mb-3">
                <h1 className="mek-text-industrial text-5xl text-yellow-400 mek-text-shadow">
                  MARKET
                </h1>
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
              <div className="flex items-center gap-3 p-3 bg-black/40 border border-yellow-500/20 rounded-lg">
                <button
                  onClick={() => setShowCreateListing(true)}
                  className={`${getHeaderListButtonClasses(headerButtonStyle)} flex-1`}
                >
                  <span className="text-lg">⊕</span>
                  <span>LIST ESSENCE</span>
                </button>
                <div className="w-px h-8 bg-yellow-500/30" />
                <button
                  onClick={() => setShowOnlyMyListings(!showOnlyMyListings)}
                  className={`${getHeaderMyListingsButtonClasses(headerButtonStyle, showOnlyMyListings)} flex-1`}
                >
                  {showOnlyMyListings && <span className="text-green-600">✓</span>}
                  <span>MY LISTINGS</span>
                </button>
              </div>
            </div>
          )}

          {/* Layout Variation 5: Split Sides - Buttons Float on Opposite Ends */}
          {headerLayout === 5 && (
            <div className="relative">
              <div className="flex justify-between items-start mb-3">
                <h1 className="mek-text-industrial text-5xl text-yellow-400 mek-text-shadow">
                  MARKET
                </h1>
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
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setShowCreateListing(true)}
                  className={getHeaderListButtonClasses(headerButtonStyle)}
                >
                  <span className="text-lg">⊕</span>
                  <span>LIST ESSENCE</span>
                </button>
                <button
                  onClick={() => setShowOnlyMyListings(!showOnlyMyListings)}
                  className={getHeaderMyListingsButtonClasses(headerButtonStyle, showOnlyMyListings)}
                >
                  {showOnlyMyListings && <span className="text-green-600">✓</span>}
                  <span>MY LISTINGS</span>
                </button>
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

            {/* Create Request Button */}
            <div className="mb-6">
              <button
                onClick={() => setShowCreateRequest(true)}
                className="mek-button-primary px-6 py-3 font-bold uppercase tracking-wider"
              >
                <span className="text-lg mr-2">⊕</span>
                CREATE REQUEST
              </button>
            </div>

            {/* Available Requests Table */}
            <div className="mb-8">
              <div className="mb-4 p-3 bg-black/60 border-l-4 border-yellow-500 mek-overlay-diagonal-stripes">
                <h2 className="mek-text-industrial text-2xl text-yellow-400 mek-text-shadow">AVAILABLE REQUESTS</h2>
                <p className="mek-label-uppercase text-yellow-400/60 mt-1">FULFILL REQUESTS TO EARN GOLD</p>
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
                            Fulfill
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-yellow-500/5 transition-colors cursor-pointer">
                        <td className="px-4 py-3 text-yellow-400 font-semibold">Musical</td>
                        <td className="px-4 py-3 text-center text-gray-300">10.0</td>
                        <td className="px-4 py-3 text-right text-yellow-400 font-bold">7,000g</td>
                        <td className="px-4 py-3 text-center">
                          <button className="px-4 py-1 bg-yellow-400/10 border border-yellow-400/30 hover:bg-yellow-400/20 text-yellow-400 rounded text-xs font-semibold uppercase tracking-wider">
                            Fulfill
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* My Requests Section */}
            <div>
              <div className="mb-4 p-3 bg-black/60 border-l-4 border-blue-500 mek-overlay-diagonal-stripes">
                <h2 className="mek-text-industrial text-2xl text-blue-400 mek-text-shadow">MY REQUESTS</h2>
                <p className="mek-label-uppercase text-blue-400/60 mt-1">YOUR ACTIVE PURCHASE REQUESTS</p>
              </div>

              {/* My Requests Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Placeholder card - will be replaced with real data */}
                <div className="mek-card-industrial mek-border-sharp-gold p-4 rounded-lg">
                  <div className="absolute inset-0 mek-overlay-scratches pointer-events-none" />
                  <div className="relative">
                    <div className="mb-3">
                      <div className="font-bold text-yellow-400 uppercase tracking-wide text-sm">Cameras & Film</div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>Requesting: <span className="text-yellow-400 font-bold">5.0</span></span>
                      </div>
                    </div>
                    <div className="mb-3 p-2 bg-black/60 border border-yellow-500/20 rounded">
                      <div className="text-xs text-gray-400">Locked Gold:</div>
                      <div className="text-lg font-bold text-yellow-400">2,500g</div>
                    </div>
                    <button className="w-full px-3 py-2 bg-red-900/30 border border-red-500/40 hover:bg-red-900/50 hover:border-red-400/60 text-red-400 font-bold uppercase tracking-wider transition-all text-sm rounded-lg">
                      ⊗ CANCEL REQUEST
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Create Request Modal - Industrial Sci-Fi Design */}
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
                          CREATE REQUEST
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                        <span className="mek-label-uppercase text-blue-400/70">PURCHASE REQUEST PROTOCOL</span>
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
                              <span className="mek-label-uppercase text-yellow-400 font-bold">REQUEST SUMMARY</span>
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
                                  This gold will be locked until the request is fulfilled or cancelled
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
                            DEPLOY REQUEST
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
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search with Autocomplete */}
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
                onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="SEARCH ESSENCE BY VARIATION NAME..."
                className="w-full pl-10 pr-4 py-3 bg-black/60 border-2 border-gray-700/50 text-yellow-400 placeholder-gray-600 font-mono text-sm uppercase tracking-wider focus:border-yellow-500/50 focus:outline-none transition-all rounded-lg"
                style={{
                  boxShadow: searchTerm ? "0 0 20px rgba(250, 182, 23, 0.2), inset 0 0 10px rgba(250, 182, 23, 0.1)" : "none",
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

          </div>

          {/* Rarity Filters and Sort Dropdown */}
          <div className="flex gap-2 flex-wrap items-center justify-between p-3 bg-black/40 border border-gray-800 rounded-lg mek-overlay-metal-texture mb-3">
            {/* Rarity Filter Buttons */}
            <div className="flex gap-2 flex-wrap items-center">
              {RARITY_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedRarity(category.id)}
                  className={`relative px-4 py-2 text-sm font-medium uppercase tracking-wide transition-all rounded-lg ${
                    selectedRarity === category.id
                      ? "bg-yellow-400 text-black shadow-lg shadow-yellow-500/30"
                      : "bg-black/60 text-gray-400 hover:text-yellow-400 border-2 border-gray-700/50 hover:border-yellow-500/50"
                  }`}
                >
                  <span className="relative z-10">{category.name}</span>
                  {selectedRarity === category.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent pointer-events-none" />
                  )}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="relative sort-dropdown-container">
              <button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="relative px-5 py-3 bg-white/5 border-b-2 border-white/20 text-white hover:border-white/40 hover:bg-white/10 focus:outline-none backdrop-blur-sm transition-all duration-500 ease-out group text-sm font-medium uppercase tracking-wide"
              >
                <span>Sort: {SORT_OPTIONS.find(o => o.id === sortBy)?.name}</span>
                <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-white/60 to-transparent w-0 group-hover:w-full transition-all duration-700 ease-out" />
              </button>

              {sortDropdownOpen && (
                <div
                  className="absolute right-0 mt-1 z-50 min-w-[200px] bg-black/90 backdrop-blur-md border border-white/20 overflow-hidden"
                  style={{ willChange: 'opacity, transform', transform: 'translate3d(0,0,0)' }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setSortBy(option.id);
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm font-medium uppercase tracking-wide hover:bg-white/10 transition-colors duration-200 ${
                        sortBy === option.id ? 'text-yellow-400' : 'text-white'
                      }`}
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

              return (
                <div
                  key={listing._id}
                  className="relative mek-card-industrial mek-border-sharp-gray p-4 hover:border-yellow-500/50 transition-all group rounded-lg"
                >
                  <div className="absolute inset-0 mek-overlay-metal-texture opacity-5 pointer-events-none" />
                  <div className="absolute inset-0 mek-overlay-scratches pointer-events-none" />

                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent animate-shimmer" />
                  </div>

                  {isOwn && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[10px] px-3 py-1 font-bold uppercase tracking-wider rounded-md">
                      ◆ YOUR LISTING
                    </div>
                  )}

                  {/* Essence Image */}
                  <div className="flex justify-center items-center mb-3 h-20">
                    <img
                      src={`/essence-images/75px/webp/${listing.itemVariation?.toLowerCase().replace(/\s+/g, ' ')}_tn1.webp`}
                      alt={listing.itemVariation || "Essence"}
                      className="max-w-[75px] max-h-[75px] w-auto h-auto object-contain"
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
                    <div className="flex items-center gap-2 mt-2 justify-center">
                      <span className="mek-label-uppercase text-gray-500 text-xs">QTY:</span>
                      <span className="text-yellow-400 font-bold">{listing.quantity}</span>
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
                  <div key={listing._id} className="relative mek-card-industrial mek-border-sharp-gold p-4 rounded-lg">
                    <div className="absolute inset-0 mek-overlay-scratches pointer-events-none" />
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

        {/* Create Listing Modal - Industrial Sci-Fi Design */}
        {showCreateListing && (
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
        </>
        )}
      </div>
    </div>
  );
}
