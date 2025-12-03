"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { COMPLETE_VARIATION_RARITY } from "@/lib/completeVariationRarity";
import EssenceListingLightboxV6FullMarketMatch from "@/components/EssenceListingLightbox-V6-FullMarketMatch";
import { renderHeaderButtons } from "@/lib/headerButtonVariations";
import { Tooltip } from "@/components/ui/tooltip-card";
// Removed: restoreWalletSession - using localStorage directly like hub page

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
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [selectedRarity, setSelectedRarity] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const dropdownMenuStyle = 3; // Locked to Style 3: Black Gloss
  const [debugPanelCollapsed, setDebugPanelCollapsed] = useState(true);
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
  const headerLayout = 5; // Locked to Option 5: Compact Grid - Gold Prominent
  const headerButtonStyle = 5; // Locked to Style 5: Brushed Metal
  const goldDisplayVariation = 2; // Locked to Variation 2: Inline - Number + G
  const timerDisplayVariation = 5; // Locked to Variation 5: Clock + Text w/ Background
  const pricingInfoLayout = 34; // LOCKED to Option 34: Vertical v4 - Bold Labels
  const bottleImageSize = 130; // Locked to 130px
  const priceLayoutStyle = 8; // Locked to Style 8: Tapping Mode
  const listingCardStyle = 1; // Locked to Style 1: Ultra Bright Glass
  const [buyOrderSection, setBuyOrderSection] = useState<"open" | "mine">("open");
  const buttonVariation = 3; // Locked to Style 3: Minimal Modern
  const [debugListingCount, setDebugListingCount] = useState<number>(0);
  const [showExpiredListings, setShowExpiredListings] = useState(false);
  const essenceLabelFont = 'exo'; // Locked to Exo 2
  const essenceLabelFontSize = 24; // Locked to 24px base size
  const stockNumberFontSize = 30; // LOCKED at 30px
  const priceNumberFontSize = 29; // LOCKED at 29px
  const [listingScale, setListingScale] = useState<number>(100); // Listing card scale: 50 (small/more cols) to 150 (large/fewer cols)
  const cardScale = 95; // Overall card scale: LOCKED at 95%
  const essenceTitleColor = 'white'; // LOCKED to white
  const [essenceTitleCase, setEssenceTitleCase] = useState<'uppercase' | 'titlecase'>('uppercase'); // Toggle between uppercase and title case
  const [siphonLayoutChoice, setSiphonLayoutChoice] = useState<1 | 2 | 3 | 4 | 5>(5); // Siphon modal layout style
  const lightboxVersion = 6; // New listing lightbox design version - locked to V6

  // Space Age styling toggle for header
  const [useSpaceAgeHeader, setUseSpaceAgeHeader] = useState(false);

  // Purchase modal state
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [purchaseAmount, setPurchaseAmount] = useState(0.1);

  // Tooltip state for insufficient funds
  const [hoveredInsufficientListing, setHoveredInsufficientListing] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [mounted, setMounted] = useState(false);

  // Purchase history modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyListingId, setHistoryListingId] = useState<Id<"marketListings"> | null>(null);

  // My Listings modal state
  const [showMyListingsModal, setShowMyListingsModal] = useState(false);

  // Recall confirmation modal state
  const [showRecallConfirm, setShowRecallConfirm] = useState(false);
  const [recallListingId, setRecallListingId] = useState<Id<"marketListings"> | null>(null);
  const [showRecallSuccess, setShowRecallSuccess] = useState(false);

  // Listing success modal state
  const [showListingSuccess, setShowListingSuccess] = useState(false);
  const [successListingData, setSuccessListingData] = useState<{
    variation: string;
    amount: number;
    pricePerUnit: number;
    duration: number;
    durationFee: number;
  } | null>(null);

  // Listing form state
  const [selectedVariation, setSelectedVariation] = useState("");
  const [essenceAmount, setEssenceAmount] = useState("1");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(7);

  // Request form state
  const [requestVariation, setRequestVariation] = useState("");
  const [requestAmount, setRequestAmount] = useState("1");
  const [requestTotalPrice, setRequestTotalPrice] = useState("");

  // My Listings layout variation
  const [myListingsLayoutVariation, setMyListingsLayoutVariation] = useState(1);

  // ⚠️ TEMPORARY TEST DATA - DELETE BEFORE PRODUCTION ⚠️
  // Mock transaction data for visualizing transaction logs
  // This generates fake transactions to preview the UI layout (up to 20 for testing scrolling)
  // Uses deterministic amounts based on index to prevent regeneration on every render
  const getMockTransactions = (listingId: string, count: number = 20) => {
    const transactions = [];
    const now = Date.now();
    const amounts = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5];
    const corporations = [
      "Stellar Industries",
      "Nova Corp",
      "Quantum Dynamics",
      "Nexus Enterprises",
      "Titan Systems",
      "Eclipse Trading Co",
      "Apex Solutions",
      "Zenith Corporation"
    ];

    for (let i = 0; i < count; i++) {
      const hoursAgo = count - i;
      const timestamp = new Date(now - hoursAgo * 60 * 60 * 1000);
      // Use index to deterministically pick amount (not random)
      const amountSiphoned = amounts[i % amounts.length];
      const corporation = corporations[i % corporations.length];

      // Format date with 2-digit year
      const dateObj = new Date(timestamp);
      const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getUTCDate()).padStart(2, '0');
      const year = String(dateObj.getUTCFullYear()).slice(-2); // Last 2 digits

      transactions.push({
        id: `mock-${listingId}-${i}`,
        date: `${month}/${day}/${year}`,
        time: timestamp.toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: false }) + ' UTC',
        amountSiphoned,
        goldEarned: Math.floor(amountSiphoned * 50000),
        corporation
      });
    }

    return transactions.reverse(); // Most recent first
  };
  // ⚠️ END TEMPORARY TEST DATA ⚠️

  // Update current time every second for countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Set mounted state for portal rendering
  useEffect(() => {
    setMounted(true);
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

    // Expired - red
    if (remaining <= 0) {
      return {
        containerClass: "bg-red-900/30 border-2 border-red-400/60",
        labelClass: "text-red-300/80",
        timeClass: "text-red-200 font-extrabold"
      };
    }

    const totalHours = remaining / (1000 * 60 * 60);

    // 0-1 hour - red (bright and urgent)
    if (totalHours < 1) {
      return {
        containerClass: "bg-red-900/30 border-2 border-red-400/60",
        labelClass: "text-red-300/80",
        timeClass: "text-red-200 font-extrabold"
      };
    }

    // 1-5 hours - orange
    if (totalHours < 5) {
      return {
        containerClass: "bg-orange-900/20 border border-orange-400/40",
        labelClass: "text-orange-300/80",
        timeClass: "text-orange-200 font-bold"
      };
    }

    // 5-12 hours - yellow
    if (totalHours < 12) {
      return {
        containerClass: "bg-yellow-900/20 border border-yellow-400/40",
        labelClass: "text-yellow-300/80",
        timeClass: "text-yellow-200 font-bold"
      };
    }

    // 12+ hours - white (calm and neutral)
    return {
      containerClass: "bg-white/10 border border-white/30",
      labelClass: "text-white/80",
      timeClass: "text-white font-bold"
    };
  };

  // Get or create user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);

  useEffect(() => {
    const initUser = async () => {
      try {
        // SIMPLIFIED: Match hub page pattern - localStorage FIRST (no encrypted session complexity)
        const storedWallet = localStorage.getItem('walletAddress') || localStorage.getItem('stakeAddress') || "demo_wallet_123";

        console.log('[💰WALLET] Using wallet address from localStorage:', storedWallet);
        setWalletAddress(storedWallet);

        const user = await getOrCreateUser({ walletAddress: storedWallet });
        if (user) {
          console.log('[💰WALLET] User found/created:', user);
          console.log('[💰WALLET] User gold balance:', user.gold);
          setUserId(user._id as Id<"users">);
        }
      } catch (error) {
        console.error('[💰WALLET] Error initializing user:', error);
      }
    };
    initUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount - getOrCreateUser changes on every render

  // Get user profile
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId && walletAddress ? { walletAddress } : "skip"
  );

  // DEBUG: Track when userProfile query is skipped
  useEffect(() => {
    console.log('[🔍PROFILE] Query state:', {
      userId: userId ? 'exists' : 'MISSING',
      walletAddress: walletAddress ? 'exists' : 'MISSING',
      userProfile: userProfile ? `loaded (${userProfile.stats?.totalMeks} Meks)` : 'UNDEFINED',
      queryStatus: (userId && walletAddress) ? 'ACTIVE' : 'SKIPPED'
    });
  }, [userId, walletAddress, userProfile]);

  // Get gold mining data for real-time updates
  const goldMiningData = useQuery(
    api.goldMining.getGoldMiningData,
    walletAddress ? { walletAddress } : "skip"
  );

  // State for real-time gold display
  const [displayGold, setDisplayGold] = useState(0);

  // Debug: Log goldMiningData when it changes
  useEffect(() => {
    console.log('[Essence Market DEBUG] goldMiningData:', goldMiningData);
  }, [goldMiningData]);

  // Get essence listings
  const listingsData = useQuery(
    api.marketplace.getActiveListings,
    {
      itemType: "essence",
      searchTerm: searchTerm.length >= 2 ? searchTerm : undefined, // Only search when term is meaningful
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
    walletAddress ? { walletAddress } : "skip"
  );

  // Mutations
  const createListing = useMutation(api.marketplace.createListing);
  const purchaseItem = useMutation(api.marketplace.purchaseItem);
  const cancelListing = useMutation(api.marketplace.cancelListing);
  const clearMarketplace = useMutation(api.seedMarketplace.clearMarketplaceListings);
  const seedMarketplace = useMutation(api.seedMarketplace.seedMarketplaceListings);
  const updateGold = useMutation(api.adminUsers.updateGold);

  // Filter to only owned essence variations with amounts
  const ownedEssenceVariationsReal = (essenceState?.balances || [])
    .filter((b: { accumulatedAmount: number; variationName: string }) => b.accumulatedAmount > 0)
    .map((b: { accumulatedAmount: number; variationName: string }) => ({
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
  const unownedEssenceVariations = COMPLETE_VARIATION_RARITY.filter(variation => {
    const owned = essenceState?.balances?.find((b: { variationName: string; accumulatedAmount: number }) => b.variationName === variation.name);
    return !owned || owned.accumulatedAmount === 0;
  });

  // Autocomplete search
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const matches = COMPLETE_VARIATION_RARITY
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

  // Initialize displayGold from goldMiningData.accumulatedGold (matches hub page)
  // This is the NET GOLD (pending accumulated gold)
  useEffect(() => {
    if (goldMiningData?.accumulatedGold !== undefined) {
      console.log('[Essence Market] Setting displayGold to NET GOLD:', goldMiningData.accumulatedGold);
      console.log('[Essence Market] goldMiningData full:', goldMiningData);
      setDisplayGold(goldMiningData.accumulatedGold);
    }
  }, [goldMiningData?.accumulatedGold]);

  // Real-time gold increment animation (matches hub page)
  useEffect(() => {
    if (!goldMiningData?.totalGoldPerHour) return;

    const goldPerSecond = goldMiningData.totalGoldPerHour / 3600;
    console.log('[Essence Market] Starting gold animation with rate:', goldMiningData.totalGoldPerHour, 'gold/hr');
    let lastTimestamp = performance.now();
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      const deltaTime = (timestamp - lastTimestamp) / 1000; // Convert to seconds
      lastTimestamp = timestamp;

      setDisplayGold(prev => prev + (goldPerSecond * deltaTime));

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [goldMiningData?.totalGoldPerHour]);

  // Filter and sort listings
  const filteredListings = listings.filter((listing: { sellerId: Id<"users">; expiresAt?: number; itemVariation?: string }) => {
    if (showOnlyMyListings && listing.sellerId !== userId) return false;

    // Filter out expired listings if not showing them
    if (!showExpiredListings && listing.expiresAt) {
      const isExpired = listing.expiresAt - currentTime <= 0;
      if (isExpired) return false;
    }

    // Filter by variation type (head/body/trait)
    if (selectedRarity !== "all" && listing.itemVariation) {
      const variation = COMPLETE_VARIATION_RARITY.find(v => v.name === listing.itemVariation);
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

    // Debug: Log gold values
    console.log('[💰GOLD] walletAddress:', walletAddress);
    console.log('[💰GOLD] goldMiningData:', goldMiningData);
    console.log('[💰GOLD] goldMiningData.accumulatedGold:', goldMiningData?.accumulatedGold);

    const currentGold = goldMiningData?.accumulatedGold ?? 0;
    const totalFee = durationOption.cost + Math.ceil((amount * price) * 0.02); // duration + market fee
    console.log('[💰GOLD] Current gold:', currentGold);
    console.log('[💰GOLD] Total fee:', totalFee, '(Duration:', durationOption.cost, '+ Market:', Math.ceil((amount * price) * 0.02) + ')');
    console.log('[💰GOLD] Can afford?', currentGold >= totalFee);

    // Check if goldMiningData has loaded
    if (!goldMiningData) {
      alert('Loading gold data, please try again in a moment.');
      return;
    }

    // Check if user can afford TOTAL listing fee (duration + market fee)
    if (currentGold < totalFee) {
      alert(`Insufficient gold. Listing fee: ${totalFee}g (Duration: ${durationOption.cost}g + Market: ${Math.ceil((amount * price) * 0.02)}g)`);
      return;
    }

    try {
      await createListing({
        sellerId: userId,
        itemType: "essence",
        itemVariation: selectedVariation,
        quantity: amount,
        pricePerUnit: price,
        duration: selectedDuration * 24, // Convert days to hours
        durationFee: durationOption.cost, // Pass duration cost to backend
      });

      setShowCreateListing(false);
      setSuccessListingData({
        variation: selectedVariation,
        amount,
        pricePerUnit: price,
        duration: selectedDuration,
        durationFee: durationOption.cost,
      });
      setSelectedVariation("");
      setEssenceAmount("1");
      setPricePerUnit("");
      setShowListingSuccess(true);
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
      setShowPurchaseModal(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred");
    }
  };

  // Handle opening purchase modal
  const handleOpenPurchaseModal = (listing: any) => {
    setSelectedListing(listing);
    setPurchaseAmount(0.1); // Set to minimum
    setShowPurchaseModal(true);
  };

  // Calculate tooltip position based on button position
  const handleTooltipHover = (listingId: string, show: boolean) => {
    if (show) {
      const button = buttonRefs.current[listingId];
      if (button) {
        const rect = button.getBoundingClientRect();
        setTooltipPosition({
          top: rect.top - 40, // Position above button
          left: rect.left + rect.width / 2 // Center horizontally
        });
      }
      setHoveredInsufficientListing(listingId);
    } else {
      setHoveredInsufficientListing(null);
      setTooltipPosition(null);
    }
  };

  // Handle purchase history modal
  const handleOpenHistoryModal = (listingId: Id<"marketListings">) => {
    setHistoryListingId(listingId);
    setShowHistoryModal(true);
  };

  // Handle cancel listing - show confirmation modal first
  const handleCancelListing = (listingId: Id<"marketListings">) => {
    setRecallListingId(listingId);
    setShowRecallConfirm(true);
  };

  // Confirm recall listing
  const confirmRecallListing = async () => {
    if (!userId || !recallListingId) return;

    try {
      await cancelListing({ userId, listingId: recallListingId });
      setShowRecallConfirm(false);
      setRecallListingId(null);
      setShowRecallSuccess(true);
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

  // Siphon button style - locked to style 19 (Solid Cyan with constant white glow)
  const getSiphonButtonStyle = () => {
    return "relative w-full px-4 py-2 font-bold uppercase transition-none cursor-pointer overflow-hidden rounded-lg tracking-[0.5em] text-base font-normal";
  };

  const getSiphonButtonClipPath = () => {
    return undefined; // Style 19 uses rounded corners, no clip path
  };

  const getSiphonButtonTextures = () => {
    // Style 19: Solid Cyan with constant white glow (no animation)
    return (
      <>
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255, 255, 255, 0.15) 3px, rgba(255, 255, 255, 0.15) 4px), repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255, 255, 255, 0.15) 3px, rgba(255, 255, 255, 0.15) 4px)'
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.2) 0%, transparent 70%)'
        }} />
      </>
    );
  };

  const getSiphonButtonColors = (canAfford: boolean) => {
    if (!canAfford) {
      return "bg-gray-900/40 border-2 border-gray-700/40 text-gray-500/70 cursor-not-allowed";
    }

    // Style 19: Solid Cyan with constant white glow
    return "bg-cyan-500 border border-cyan-400/30 text-white hover:bg-cyan-600 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] [text-shadow:0_0_7px_rgba(255,255,255,0.6),0_0_14px_rgba(255,255,255,0.4)]";
  };

  // Siphon button hover effect - locked to intense glow with reduced zoom
  const getSiphonHoverEffect = () => {
    return "hover:scale-[1.0425] hover:shadow-[0_0_30px_rgba(34,211,238,0.8),0_0_60px_rgba(34,211,238,0.5)]";
  };

  // Helper to sanitize variation name to match bottle filenames
  const sanitizeVariationName = (name: string): string => {
    return name
      .replace(/\s+essence$/i, '') // Remove " Essence" suffix
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

  // Helper to get essence image path with sourceKey support for duplicates (Aztec, Rust)
  const getEssenceImagePath = (variationName: string, variationType?: string): string => {
    // Variations with duplicate names that need sourceKey differentiation
    const duplicateNames = ['Aztec', 'Rust'];
    const normalizedName = variationName.replace(/\s+essence$/i, '').trim();

    if (duplicateNames.includes(normalizedName) && variationType) {
      // Look up the sourceKey from completeVariationRarity
      const variation = COMPLETE_VARIATION_RARITY.find(
        v => v.name === normalizedName && v.type === variationType
      );

      if (variation?.sourceKey) {
        // Use sourceKey format: "aztec-ak1.png" or "rust-am1.png"
        return `/essence-images/named-bottles-1k/${normalizedName.toLowerCase()}-${variation.sourceKey.toLowerCase()}.png`;
      }
    }

    // Default: use sanitized name for all other variations
    return `/essence-images/named-bottles-1k/${sanitizeVariationName(variationName)}.png`;
  };

  // Calculate dynamic font size for essence label based on name length
  const getEssenceLabelFontSize = (essenceName: string, baseFontSize: number): { fontSize: number, lineClamp: number } => {
    const nameLength = essenceName.length;

    // Very short names (≤8 chars): use full base size, single line
    if (nameLength <= 8) {
      return { fontSize: baseFontSize, lineClamp: 1 };
    }

    // Short names (9-11 chars): keep same size, single line
    if (nameLength <= 11) {
      return { fontSize: baseFontSize, lineClamp: 1 };
    }

    // Medium names (12-16 chars): wrap to 2 lines, keep readable size
    if (nameLength <= 16) {
      return { fontSize: Math.round(baseFontSize * 0.85), lineClamp: 2 };
    }

    // Long names (17-21 chars): wrap to 2 lines, reduce slightly more
    if (nameLength <= 21) {
      return { fontSize: Math.round(baseFontSize * 0.75), lineClamp: 2 };
    }

    // Very long names (22+ chars): wrap to 2 lines, more compact
    return { fontSize: Math.round(baseFontSize * 0.65), lineClamp: 2 };
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

      case 8: // Tapping Mode - Remaining and Price Per Essence
        return (
          <div className="mb-3 p-3 bg-black/80 border border-yellow-500/20 rounded-lg">
            <div className="space-y-2">
              {/* Remaining Amount */}
              <div className="flex items-center justify-between">
                <span className="mek-label-uppercase text-gray-500 text-xs">REMAINING:</span>
                <span className="text-yellow-400 font-bold">{quantityFormatted}</span>
              </div>
              <div className="h-px bg-yellow-500/20" />

              {/* Price Per Essence */}
              <div className="p-3 bg-black/80 border border-yellow-500/20 rounded-lg">
                <div className="mek-label-uppercase text-yellow-400/60 text-[10px] text-center mb-1">PRICE</div>
                <div className="text-2xl font-bold text-yellow-400 text-center">{pricePerUnit.toLocaleString()}g</div>
                <div className="text-[10px] text-gray-400 text-center">per essence</div>
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

  // Pricing Info Layout - Remaining and Price Per Essence
  const renderPricingInfo = (pricePerUnit: number, quantity: number, layoutNum: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35) => {
    const quantityFormatted = quantity.toFixed(1);

    switch(layoutNum) {
      case 1: // Horizontal Split Panel - Side by side
        return (
          <div className="mb-3 p-3 bg-black/80 border border-yellow-500/20 rounded-lg">
            <div className="grid grid-cols-2 gap-3">
              {/* Left: Remaining */}
              <div className="border-r border-yellow-500/20 pr-3">
                <div className="mek-label-uppercase text-gray-500 text-[9px] mb-1">REMAINING</div>
                <div className="text-xl font-bold text-yellow-400">{quantityFormatted}</div>
              </div>
              {/* Right: Price */}
              <div className="pl-3">
                <div className="mek-label-uppercase text-gray-500 text-[9px] mb-1">PRICE</div>
                <div className="text-xl font-bold text-yellow-400">{pricePerUnit.toLocaleString()}g</div>
                <div className="text-[9px] text-gray-400">per essence</div>
              </div>
            </div>
          </div>
        );

      case 2: // Stat Cards (Gaming Style) - Two cards side by side
        return (
          <div className="mb-3 flex gap-2">
            {/* Remaining Card */}
            <div className="flex-1 p-2.5 bg-black/70 border border-yellow-500/30 rounded shadow-[0_0_8px_rgba(250,182,23,0.2)]">
              <div className="text-2xl font-bold text-yellow-400 text-center mb-1">{quantityFormatted}</div>
              <div className="mek-label-uppercase text-yellow-400/60 text-[8px] text-center">IN STOCK</div>
            </div>
            {/* Price Card */}
            <div className="flex-1 p-2.5 bg-black/70 border border-yellow-500/30 rounded shadow-[0_0_8px_rgba(250,182,23,0.2)]">
              <div className="text-2xl font-bold text-yellow-400 text-center mb-1">{pricePerUnit.toLocaleString()}g</div>
              <div className="mek-label-uppercase text-yellow-400/60 text-[8px] text-center">PER UNIT</div>
            </div>
          </div>
        );

      case 3: // Compact Single Row - All in one line
        return (
          <div className="mb-3 px-3 py-2 bg-black/70 border border-yellow-500/20 rounded">
            <div className="flex items-center justify-between text-sm">
              <span className="text-yellow-400 font-bold">{quantityFormatted} REMAINING</span>
              <span className="text-gray-400 mx-2">•</span>
              <span className="text-yellow-400 font-bold">{pricePerUnit.toLocaleString()}g per essence</span>
            </div>
          </div>
        );

      case 4: // Emphasized Price (Current Style Enhanced) - Price gets focus
        return (
          <div className="mb-3 p-3 bg-black/80 border border-yellow-500/20 rounded-lg">
            <div className="space-y-2">
              {/* Remaining Amount - Small at top */}
              <div className="flex items-center justify-between">
                <span className="mek-label-uppercase text-gray-500 text-xs">REMAINING:</span>
                <span className="text-yellow-400 font-bold">{quantityFormatted}</span>
              </div>
              <div className="h-px bg-yellow-500/20" />

              {/* Price Per Essence - Large emphasized box */}
              <div className="p-3 bg-black/80 border border-yellow-500/20 rounded-lg">
                <div className="mek-label-uppercase text-yellow-400/60 text-[10px] text-center mb-1">PRICE</div>
                <div className="text-2xl font-bold text-yellow-400 text-center">{pricePerUnit.toLocaleString()}g</div>
                <div className="text-[10px] text-gray-400 text-center">per essence</div>
              </div>
            </div>
          </div>
        );

      case 5: // Data Table Style - Structured rows
        return (
          <div className="mb-3 p-3 bg-black/80 border border-yellow-500/20 rounded-lg">
            <div className="space-y-2">
              {/* Row 1: Remaining */}
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Remaining</span>
                <span className="text-yellow-400 font-bold">{quantityFormatted} essence</span>
              </div>
              <div className="h-px bg-yellow-500/10" />

              {/* Row 2: Unit Price */}
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Unit Price</span>
                <span className="text-yellow-400 font-bold">{pricePerUnit.toLocaleString()}g</span>
              </div>
              <div className="h-px bg-yellow-500/10" />

              {/* Row 3: Total Value */}
              <div className="flex items-center justify-between py-1 bg-yellow-500/5 -mx-3 px-3">
                <span className="text-yellow-400/70 text-xs uppercase tracking-wider font-bold">Total Value</span>
                <span className="text-yellow-400 font-bold text-lg">{(pricePerUnit * quantity).toLocaleString()}g</span>
              </div>
            </div>
          </div>
        );

      case 6: // HUD Tactical Display - Military interface with scan lines
        return (
          <div className="mb-3 relative p-4 bg-black/90 border-2 border-cyan-400/30 rounded overflow-hidden">
            {/* Scan line overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'repeating-linear-gradient(0deg, rgba(0,255,255,0.03) 0px, rgba(0,255,255,0.03) 1px, transparent 1px, transparent 2px)',
            }} />

            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

            <div className="relative space-y-3">
              {/* Quantity - Cyan themed */}
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] text-cyan-400/70 uppercase tracking-widest font-mono">QTY.AVAIL</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-cyan-400 font-mono">{quantityFormatted}</span>
                  <span className="text-xs text-cyan-400/50">UNITS</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-cyan-400/20 via-yellow-400/40 to-cyan-400/20" />

              {/* Price - Yellow themed */}
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] text-yellow-400/70 uppercase tracking-widest font-mono">COST/UNIT</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-yellow-400 font-mono">{pricePerUnit.toLocaleString()}</span>
                  <span className="text-xs text-yellow-400/50">GOLD</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 7: // Holographic Data Panel - Futuristic with glow effects
        return (
          <div className="mb-3 relative">
            {/* Outer glow container */}
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 rounded-lg blur opacity-75" />

            <div className="relative bg-black/95 border border-cyan-400/40 rounded-lg p-3 overflow-hidden">
              {/* Animated background shimmer */}
              <div className="absolute inset-0 opacity-10" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.3) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative grid grid-cols-2 gap-4">
                {/* Stock Count */}
                <div className="text-center p-2">
                  <div className="text-[8px] text-cyan-300/60 uppercase tracking-widest mb-1 font-mono">
                    STOCK LEVEL
                  </div>
                  <div className="text-2xl font-bold text-cyan-300 mb-0.5 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]">
                    {quantityFormatted}
                  </div>
                  <div className="text-[9px] text-cyan-400/40 uppercase">essence</div>
                </div>

                {/* Vertical divider with glow */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-3/4 bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent" />

                {/* Unit Price */}
                <div className="text-center p-2">
                  <div className="text-[8px] text-yellow-300/60 uppercase tracking-widest mb-1 font-mono">
                    UNIT COST
                  </div>
                  <div className="text-2xl font-bold text-yellow-300 mb-0.5 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">
                    {pricePerUnit.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-yellow-400/40 uppercase">gold/essence</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 8: // Industrial Warning Panel - Hazard stripes and grunge
        return (
          <div className="mb-3 relative">
            {/* Hazard stripe background */}
            <div className="absolute inset-0 opacity-10" style={{
              background: 'repeating-linear-gradient(45deg, #000 0px, #000 10px, #facc15 10px, #facc15 20px)',
            }} />

            <div className="relative border-2 border-yellow-500/40 bg-black/85 p-3 clip-path-[polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]">
              {/* Metal scratch overlay */}
              <div className="absolute inset-0 opacity-5 mix-blend-overlay" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cline x1=\'0\' y1=\'10\' x2=\'100\' y2=\'15\' stroke=\'white\' stroke-width=\'0.5\'/%3E%3Cline x1=\'0\' y1=\'40\' x2=\'100\' y2=\'38\' stroke=\'white\' stroke-width=\'0.3\'/%3E%3Cline x1=\'0\' y1=\'70\' x2=\'100\' y2=\'75\' stroke=\'white\' stroke-width=\'0.4\'/%3E%3C/svg%3E")',
              }} />

              <div className="relative space-y-2">
                {/* Stock warning block */}
                <div className="bg-black/60 border-l-4 border-cyan-400 p-2.5 pl-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[9px] text-cyan-400/60 uppercase tracking-wider font-bold mb-0.5">
                        INVENTORY
                      </div>
                      <div className="text-2xl font-bold text-cyan-300 leading-none">
                        {quantityFormatted}
                      </div>
                    </div>
                    <div className="text-[10px] text-cyan-400/40 uppercase -rotate-90 origin-center">
                      UNITS
                    </div>
                  </div>
                </div>

                {/* Price info block */}
                <div className="bg-black/60 border-l-4 border-yellow-500 p-2.5 pl-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[9px] text-yellow-400/60 uppercase tracking-wider font-bold mb-0.5">
                        COST PER ESSENCE
                      </div>
                      <div className="text-2xl font-bold text-yellow-400 leading-none">
                        {pricePerUnit.toLocaleString()}g
                      </div>
                    </div>
                    <div className="text-xs text-yellow-400/30 uppercase font-bold">
                      /EA
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 9: // Sleek Hexagonal Tech - Angular modern design
        return (
          <div className="mb-3 flex gap-2">
            {/* Quantity Hex */}
            <div className="flex-1 relative group">
              {/* Hexagonal border effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-cyan-700/20" style={{
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              }} />
              <div className="absolute inset-[2px] bg-black/90" style={{
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              }} />

              <div className="relative px-4 py-3 text-center">
                <div className="text-[8px] text-cyan-400/50 uppercase tracking-widest mb-1">
                  AVAILABLE
                </div>
                <div className="text-3xl font-bold text-cyan-400 mb-0.5 drop-shadow-[0_0_6px_rgba(0,255,255,0.5)]">
                  {quantityFormatted}
                </div>
                <div className="text-[8px] text-cyan-400/40 uppercase tracking-wide">
                  essence
                </div>
              </div>
            </div>

            {/* Price Hex */}
            <div className="flex-1 relative group">
              {/* Hexagonal border effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-yellow-700/20" style={{
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              }} />
              <div className="absolute inset-[2px] bg-black/90" style={{
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              }} />

              <div className="relative px-4 py-3 text-center">
                <div className="text-[8px] text-yellow-400/50 uppercase tracking-widest mb-1">
                  PRICE/UNIT
                </div>
                <div className="text-3xl font-bold text-yellow-400 mb-0.5 drop-shadow-[0_0_6px_rgba(250,182,23,0.5)]">
                  {pricePerUnit.toLocaleString()}
                </div>
                <div className="text-[8px] text-yellow-400/40 uppercase tracking-wide">
                  gold
                </div>
              </div>
            </div>
          </div>
        );

      case 10: // Compact Terminal Readout - Minimal monospace style
        return (
          <div className="mb-3 relative bg-black/95 border border-green-500/30 rounded font-mono text-xs overflow-hidden">
            {/* CRT scanline effect */}
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{
              background: 'repeating-linear-gradient(0deg, rgba(0,255,0,0.1) 0px, rgba(0,255,0,0.1) 1px, transparent 1px, transparent 3px)',
            }} />

            <div className="relative p-3 space-y-1.5">
              {/* Terminal prompt style */}
              <div className="flex items-center gap-2">
                <span className="text-green-400/60">{'>'}</span>
                <span className="text-cyan-400/70 uppercase">stock_query</span>
                <span className="text-cyan-400/40">=</span>
                <span className="text-cyan-300 font-bold">{quantityFormatted}</span>
                <span className="text-cyan-400/50">essence</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-green-400/60">{'>'}</span>
                <span className="text-yellow-400/70 uppercase">price_query</span>
                <span className="text-yellow-400/40">=</span>
                <span className="text-yellow-300 font-bold">{pricePerUnit.toLocaleString()}</span>
                <span className="text-yellow-400/50">gold</span>
                <span className="text-yellow-400/40">/</span>
                <span className="text-yellow-400/50">unit</span>
              </div>

              {/* Blinking cursor */}
              <div className="flex items-center gap-2">
                <span className="text-green-400/60">{'>'}</span>
                <span className="inline-block w-2 h-3 bg-green-400/60 animate-pulse" />
              </div>
            </div>
          </div>
        );

      case 11: // Holographic Compact - Reduced padding, larger fonts
        return (
          <div className="mb-3 relative">
            {/* Outer glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 rounded blur opacity-75" />

            <div className="relative bg-black/95 border border-cyan-400/40 rounded p-2 overflow-hidden">
              {/* Animated shimmer */}
              <div className="absolute inset-0 opacity-10" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.3) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative grid grid-cols-2 gap-2">
                {/* Stock Count */}
                <div className="text-center py-1">
                  <div className="text-[10px] text-cyan-300/70 uppercase tracking-wider mb-1 font-mono">
                    STOCK
                  </div>
                  <div className="text-3xl font-bold text-cyan-300 drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]">
                    {quantityFormatted}
                  </div>
                  <div className="text-[10px] text-cyan-400/40 uppercase mt-0.5">essence</div>
                </div>

                {/* Vertical divider */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-4/5 bg-gradient-to-b from-transparent via-cyan-400/60 to-transparent" />

                {/* Unit Price */}
                <div className="text-center py-1">
                  <div className="text-[10px] text-yellow-300/70 uppercase tracking-wider mb-1 font-mono">
                    PRICE
                  </div>
                  <div className="text-3xl font-bold text-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">
                    {pricePerUnit.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-yellow-400/40 uppercase mt-0.5">gold/unit</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 12: // Holographic Tight - Minimal gap, large numbers (responsive sizing)
        return (
          <div className="mb-3 relative">
            {/* Outer glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

            <div className="relative bg-black/95 border border-cyan-400/50 rounded px-2 py-1.5 overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-15" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.4) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative grid grid-cols-2 gap-1.5">
                {/* Stock */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-cyan-300/80 uppercase tracking-wide mb-0.5 font-mono font-bold">
                    STOCK
                  </div>
                  <div className={`font-bold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] ${
                    quantityFormatted.length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {quantityFormatted}
                  </div>
                  <div className="text-xs text-cyan-400/50 uppercase mt-0.5">ESS</div>
                </div>

                {/* Vertical divider */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-400/70 to-transparent" />

                {/* Price */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-yellow-300/80 uppercase tracking-wide mb-0.5 font-mono font-bold">
                    PRICE
                  </div>
                  <div className={`font-bold text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] ${
                    pricePerUnit.toLocaleString().length > 5 ? 'text-2xl' : pricePerUnit.toLocaleString().length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {pricePerUnit.toLocaleString()}
                  </div>
                  <div className="text-xs text-yellow-400/50 uppercase mt-0.5">G/EA</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 13: // Holographic Maximized - Huge numbers, minimal padding
        return (
          <div className="mb-3 relative">
            {/* Outer glow - stronger */}
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-cyan-500/30 rounded blur opacity-90" />

            <div className="relative bg-black/95 border-2 border-cyan-400/60 rounded px-1.5 py-1 overflow-hidden">
              {/* Shimmer */}
              <div className="absolute inset-0 opacity-20" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.5) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative grid grid-cols-2 gap-1">
                {/* Stock - cyan */}
                <div className="text-center">
                  <div className="text-[11px] text-cyan-300/90 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    QTY
                  </div>
                  <div className="text-5xl font-bold text-cyan-300 leading-none drop-shadow-[0_0_15px_rgba(0,255,255,1)]">
                    {quantityFormatted}
                  </div>
                </div>

                {/* Divider */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-cyan-400/80 to-transparent shadow-[0_0_8px_rgba(0,255,255,0.6)]" />

                {/* Price - yellow */}
                <div className="text-center">
                  <div className="text-[11px] text-yellow-300/90 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    GOLD/EA
                  </div>
                  <div className="text-5xl font-bold text-yellow-300 leading-none drop-shadow-[0_0_15px_rgba(250,204,21,1)]">
                    {pricePerUnit.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 14: // Holographic Edge-to-Edge - Maximum space usage
        return (
          <div className="mb-3 relative">
            {/* Strong outer glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/40 via-blue-500/40 to-cyan-400/40 rounded blur-md opacity-95" />

            <div className="relative bg-black/95 border-2 border-cyan-400/70 rounded px-1 py-0.5 overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-25" style={{
                background: 'linear-gradient(45deg, transparent 25%, rgba(0,255,255,0.6) 50%, transparent 75%)',
                animation: 'shimmer 2.5s ease-in-out infinite',
              }} />

              <div className="relative grid grid-cols-2 gap-0.5">
                {/* Stock - cyan themed */}
                <div className="text-center">
                  <div className="text-xs text-cyan-300 uppercase tracking-widest font-mono font-extrabold mb-0.5">
                    STOCK
                  </div>
                  <div className="text-6xl font-extrabold text-cyan-300 leading-none drop-shadow-[0_0_20px_rgba(0,255,255,1)]">
                    {quantityFormatted}
                  </div>
                </div>

                {/* Glowing divider */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500/40 via-cyan-400 to-cyan-500/40 shadow-[0_0_12px_rgba(0,255,255,0.8)]" style={{
                  transform: 'translateX(-50%)'
                }} />

                {/* Price - yellow themed */}
                <div className="text-center">
                  <div className="text-xs text-yellow-300 uppercase tracking-widest font-mono font-extrabold mb-0.5">
                    PER ESS
                  </div>
                  <div className="text-6xl font-extrabold text-yellow-300 leading-none drop-shadow-[0_0_20px_rgba(250,204,21,1)]">
                    {pricePerUnit.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 15: // Holographic Ultra-Compact - Absolute maximum
        return (
          <div className="mb-3 relative">
            {/* Maximum glow */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-400/50 via-blue-500/50 to-cyan-400/50 rounded-lg blur-lg opacity-100" />

            <div className="relative bg-black/98 border-2 border-cyan-400/80 rounded overflow-hidden">
              {/* Strong shimmer */}
              <div className="absolute inset-0 opacity-30" style={{
                background: 'linear-gradient(45deg, transparent 20%, rgba(0,255,255,0.7) 50%, transparent 80%)',
                animation: 'shimmer 2s ease-in-out infinite',
              }} />

              <div className="relative grid grid-cols-2 divide-x divide-cyan-400/60">
                {/* Stock - Maximum cyan glow */}
                <div className="text-center px-0.5 py-1">
                  <div className="text-sm text-cyan-200 uppercase tracking-widest font-mono font-black mb-1 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]">
                    QTY
                  </div>
                  <div className="text-7xl font-black text-cyan-200 leading-none drop-shadow-[0_0_25px_rgba(0,255,255,1)] filter brightness-110">
                    {quantityFormatted}
                  </div>
                </div>

                {/* Price - Maximum yellow glow */}
                <div className="text-center px-0.5 py-1">
                  <div className="text-sm text-yellow-200 uppercase tracking-widest font-mono font-black mb-1 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">
                    G/EA
                  </div>
                  <div className="text-7xl font-black text-yellow-200 leading-none drop-shadow-[0_0_25px_rgba(250,204,21,1)] filter brightness-110">
                    {pricePerUnit.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 16: // Holographic Tight v2 - Sans-serif, more padding
        return (
          <div className="mb-3 relative">
            {/* Outer glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

            <div className="relative bg-black/95 border border-cyan-400/50 rounded px-3 py-2 overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-15" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.4) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative grid grid-cols-2 gap-2">
                {/* Stock */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-cyan-300/80 uppercase tracking-wider mb-1 font-bold">
                    STOCK
                  </div>
                  <div className={`font-bold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] ${
                    quantityFormatted.length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {quantityFormatted}
                  </div>
                  <div className="text-xs text-cyan-400/50 uppercase mt-1">ESS</div>
                </div>

                {/* Vertical divider */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-400/70 to-transparent" />

                {/* Price */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-yellow-300/80 uppercase tracking-wider mb-1 font-bold">
                    PRICE
                  </div>
                  <div className={`font-bold text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] ${
                    pricePerUnit.toLocaleString().length > 5 ? 'text-2xl' : pricePerUnit.toLocaleString().length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {pricePerUnit.toLocaleString()}
                  </div>
                  <div className="text-xs text-yellow-400/50 uppercase mt-1">G/EA</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 17: // Holographic Tight v3 - Condensed, tighter tracking
        return (
          <div className="mb-3 relative">
            {/* Outer glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

            <div className="relative bg-black/95 border border-cyan-400/50 rounded px-2 py-1.5 overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-15" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.4) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative grid grid-cols-2 gap-1">
                {/* Stock */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-cyan-300/80 uppercase tracking-tight mb-0.5 font-mono font-extrabold">
                    STOCK
                  </div>
                  <div className={`font-extrabold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] tracking-tighter ${
                    quantityFormatted.length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {quantityFormatted}
                  </div>
                  <div className="text-[10px] text-cyan-400/50 uppercase mt-0.5 tracking-tight">ESS</div>
                </div>

                {/* Vertical divider */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-400/70 to-transparent" />

                {/* Price */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-yellow-300/80 uppercase tracking-tight mb-0.5 font-mono font-extrabold">
                    PRICE
                  </div>
                  <div className={`font-extrabold text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] tracking-tighter ${
                    pricePerUnit.toLocaleString().length > 5 ? 'text-2xl' : pricePerUnit.toLocaleString().length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {pricePerUnit.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-yellow-400/50 uppercase mt-0.5 tracking-tight">G/EA</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 18: // Holographic Tight v4 - Wider tracking, more column space
        return (
          <div className="mb-3 relative">
            {/* Outer glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

            <div className="relative bg-black/95 border border-cyan-400/50 rounded px-2 py-1.5 overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-15" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.4) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative grid grid-cols-2 gap-3">
                {/* Stock */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-cyan-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    STOCK
                  </div>
                  <div className={`font-bold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] tracking-wide ${
                    quantityFormatted.length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {quantityFormatted}
                  </div>
                  <div className="text-xs text-cyan-400/50 uppercase mt-0.5 tracking-widest">ESS</div>
                </div>

                {/* Vertical divider */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-400/70 to-transparent" />

                {/* Price */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-yellow-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    PRICE
                  </div>
                  <div className={`font-bold text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] tracking-wide ${
                    pricePerUnit.toLocaleString().length > 5 ? 'text-2xl' : pricePerUnit.toLocaleString().length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {pricePerUnit.toLocaleString()}
                  </div>
                  <div className="text-xs text-yellow-400/50 uppercase mt-0.5 tracking-widest">G/EA</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 19: // Holographic Tight v5 - Rounded weights, adjusted vertical spacing
        return (
          <div className="mb-3 relative">
            {/* Outer glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

            <div className="relative bg-black/95 border border-cyan-400/50 rounded px-2 py-2 overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-15" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.4) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative grid grid-cols-2 gap-1.5">
                {/* Stock */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-cyan-300/80 uppercase tracking-wide mb-1 font-semibold">
                    STOCK
                  </div>
                  <div className={`font-semibold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] ${
                    quantityFormatted.length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {quantityFormatted}
                  </div>
                  <div className="text-xs text-cyan-400/50 uppercase mt-1 font-light">ESS</div>
                </div>

                {/* Vertical divider */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-400/70 to-transparent" />

                {/* Price */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-yellow-300/80 uppercase tracking-wide mb-1 font-semibold">
                    PRICE
                  </div>
                  <div className={`font-semibold text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] ${
                    pricePerUnit.toLocaleString().length > 5 ? 'text-2xl' : pricePerUnit.toLocaleString().length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {pricePerUnit.toLocaleString()}
                  </div>
                  <div className="text-xs text-yellow-400/50 uppercase mt-1 font-light">G/EA</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 20: // Holographic Tight v6 - Mixed fonts (mono numbers, sans labels)
        return (
          <div className="mb-3 relative">
            {/* Outer glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

            <div className="relative bg-black/95 border border-cyan-400/50 rounded px-2 py-1.5 overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-15" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.4) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative grid grid-cols-2 gap-1.5">
                {/* Stock */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-cyan-300/80 uppercase tracking-wide mb-0.5 font-bold">
                    STOCK
                  </div>
                  <div className={`font-bold font-mono text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] ${
                    quantityFormatted.length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {quantityFormatted}
                  </div>
                  <div className="text-xs text-cyan-400/50 uppercase mt-0.5">ESS</div>
                </div>

                {/* Vertical divider */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-400/70 to-transparent" />

                {/* Price */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-yellow-300/80 uppercase tracking-wide mb-0.5 font-bold">
                    PRICE
                  </div>
                  <div className={`font-bold font-mono text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] ${
                    pricePerUnit.toLocaleString().length > 5 ? 'text-2xl' : pricePerUnit.toLocaleString().length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {pricePerUnit.toLocaleString()}
                  </div>
                  <div className="text-xs text-yellow-400/50 uppercase mt-0.5">G/EA</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 21: // Mixed: Left from option 18, Right with thin font
        return (
          <div className="mb-3 relative">
            {/* Outer glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

            <div className="relative bg-black/95 border border-cyan-400/50 rounded px-2 py-1.5 overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-15" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.4) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative grid grid-cols-2 gap-3">
                {/* Stock - From option 18 style */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-cyan-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    STOCK
                  </div>
                  <div className={`font-bold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] tracking-wide ${
                    quantityFormatted.length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {quantityFormatted}
                  </div>
                  <div className="text-xs text-cyan-400/50 tracking-widest mt-0.5">essence</div>
                </div>

                {/* Vertical divider */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-400/70 to-transparent" />

                {/* Price - Thin font */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-yellow-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    PRICE
                  </div>
                  <div
                    className="font-thin text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] tracking-wide inline-flex items-baseline justify-center"
                    style={{
                      fontSize: `${(pricePerUnit.toLocaleString().length > 5 ? 24 :
                        pricePerUnit.toLocaleString().length > 4 ? 30 : 36) * (priceNumberFontSize / 36)}px`
                    }}
                  >
                    <span>{pricePerUnit.toLocaleString()}</span>
                    <span className="font-thin" style={{ fontSize: '0.45em' }}>G</span>
                  </div>
                  <div className="text-xs text-yellow-400/50 tracking-widest mt-0.5">PER 1 COMPLETE ESSENCE</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 22: // Mixed: Left from option 18, Right with extralight font
        return (
          <div className="mb-3 relative">
            {/* Outer glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

            <div className="relative bg-black/95 border border-cyan-400/50 rounded px-2 py-1.5 overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-15" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.4) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative grid grid-cols-2 gap-3">
                {/* Stock - From option 18 style */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-cyan-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    STOCK
                  </div>
                  <div className={`font-bold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] tracking-wide ${
                    quantityFormatted.length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {quantityFormatted}
                  </div>
                  <div className="text-xs text-cyan-400/50 tracking-widest mt-0.5">essence</div>
                </div>

                {/* Vertical divider */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-400/70 to-transparent" />

                {/* Price - Extralight font */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-yellow-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    PRICE
                  </div>
                  <div
                    className="font-extralight text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] tracking-wide inline-flex items-baseline justify-center"
                    style={{
                      fontSize: `${(pricePerUnit.toLocaleString().length > 5 ? 24 :
                        pricePerUnit.toLocaleString().length > 4 ? 30 : 36) * (priceNumberFontSize / 36)}px`
                    }}
                  >
                    <span>{pricePerUnit.toLocaleString()}</span>
                    <span className="font-thin" style={{ fontSize: '0.45em' }}>G</span>
                  </div>
                  <div className="text-xs text-yellow-400/50 tracking-widest mt-0.5">PER 1 COMPLETE ESSENCE</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 23: // Mixed: Left from option 18, Right with light font
        return (
          <div className="mb-3 relative">
            {/* Outer glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

            <div className="relative bg-black/95 border border-cyan-400/50 rounded px-2 py-1.5 overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-15" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.4) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative grid grid-cols-2 gap-3">
                {/* Stock - From option 18 style */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-cyan-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    STOCK
                  </div>
                  <div className={`font-bold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] tracking-wide ${
                    quantityFormatted.length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {quantityFormatted}
                  </div>
                  <div className="text-xs text-cyan-400/50 tracking-widest mt-0.5">essence</div>
                </div>

                {/* Vertical divider */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-400/70 to-transparent" />

                {/* Price - Light font */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-yellow-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    PRICE
                  </div>
                  <div
                    className="font-light text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] tracking-wide inline-flex items-baseline justify-center"
                    style={{
                      fontSize: `${(pricePerUnit.toLocaleString().length > 5 ? 24 :
                        pricePerUnit.toLocaleString().length > 4 ? 30 : 36) * (priceNumberFontSize / 36)}px`
                    }}
                  >
                    <span>{pricePerUnit.toLocaleString()}</span>
                    <span className="font-thin" style={{ fontSize: '0.45em' }}>G</span>
                  </div>
                  <div className="text-xs text-yellow-400/50 tracking-widest mt-0.5">PER 1 COMPLETE ESSENCE</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 24: // Mixed: Left from option 18, Right with normal font
        return (
          <div className="mb-3 relative">
            {/* Outer glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

            <div className="relative bg-black/95 border border-cyan-400/50 rounded px-2 py-1.5 overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-15" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.4) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative grid grid-cols-2 gap-3">
                {/* Stock - From option 18 style */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-cyan-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    STOCK
                  </div>
                  <div className={`font-bold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] tracking-wide ${
                    quantityFormatted.length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {quantityFormatted}
                  </div>
                  <div className="text-xs text-cyan-400/50 tracking-widest mt-0.5">essence</div>
                </div>

                {/* Vertical divider */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-400/70 to-transparent" />

                {/* Price - Normal font weight */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-yellow-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    PRICE
                  </div>
                  <div
                    className="font-normal text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] tracking-wide inline-flex items-baseline justify-center"
                    style={{
                      fontSize: `${(pricePerUnit.toLocaleString().length > 5 ? 24 :
                        pricePerUnit.toLocaleString().length > 4 ? 30 : 36) * (priceNumberFontSize / 36)}px`
                    }}
                  >
                    <span>{pricePerUnit.toLocaleString()}</span>
                    <span className="font-thin" style={{ fontSize: '0.45em' }}>G</span>
                  </div>
                  <div className="text-xs text-yellow-400/50 tracking-widest mt-0.5">PER 1 COMPLETE ESSENCE</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 25: // Mixed: Left from option 18, Right with light font + tighter tracking
        return (
          <div className="mb-3 relative">
            {/* Outer glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

            <div className="relative bg-black/95 border border-cyan-400/50 rounded px-2 py-1.5 overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-15" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.4) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative grid grid-cols-2 gap-3">
                {/* Stock - From option 18 style */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-cyan-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    STOCK
                  </div>
                  <div className={`font-bold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] tracking-wide ${
                    quantityFormatted.length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {quantityFormatted}
                  </div>
                  <div className="text-xs text-cyan-400/50 tracking-widest mt-0.5">essence</div>
                </div>

                {/* Vertical divider */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-400/70 to-transparent" />

                {/* Price - Light font with tighter tracking */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-yellow-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    PRICE
                  </div>
                  <div
                    className="font-light text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] tracking-tight inline-flex items-baseline justify-center"
                    style={{
                      fontSize: `${(pricePerUnit.toLocaleString().length > 5 ? 24 :
                        pricePerUnit.toLocaleString().length > 4 ? 30 : 36) * (priceNumberFontSize / 36)}px`
                    }}
                  >
                    <span>{pricePerUnit.toLocaleString()}</span>
                    <span className="font-thin" style={{ fontSize: '0.45em' }}>G</span>
                  </div>
                  <div className="text-xs text-yellow-400/50 tracking-widest mt-0.5">PER 1 COMPLETE ESSENCE</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 26: // Option 21 refined - Smaller base font size
        return (
          <div className="mb-3 relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

            <div className="relative bg-black/95 border border-cyan-400/50 rounded px-2 py-1.5 overflow-hidden">
              <div className="absolute inset-0 opacity-15" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.4) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative grid grid-cols-2 gap-3">
                {/* Stock */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-cyan-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    STOCK
                  </div>
                  <div className={`font-bold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] tracking-wide ${
                    quantityFormatted.length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {quantityFormatted}
                  </div>
                  <div className="text-xs text-cyan-400/50 tracking-widest mt-0.5">essence</div>
                </div>

                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-400/70 to-transparent" />

                {/* Price - Smaller base size */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-yellow-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    PRICE
                  </div>
                  <div className={`font-thin text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] tracking-wide ${
                    pricePerUnit.toLocaleString().length > 5 ? 'text-xl' : pricePerUnit.toLocaleString().length > 4 ? 'text-2xl' : 'text-3xl'
                  }`}>
                    {pricePerUnit.toLocaleString()}g
                  </div>
                  <div className="text-xs text-yellow-400/80 tracking-widest mt-0.5">PER 1 COMPLETE ESSENCE</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 27: // Option 21 refined - More aggressive responsive sizing
        return (
          <div className="mb-3 relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

            <div className="relative bg-black/95 border border-cyan-400/50 rounded px-2 py-1.5 overflow-hidden">
              <div className="absolute inset-0 opacity-15" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.4) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative grid grid-cols-2 gap-3">
                {/* Stock */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-cyan-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    STOCK
                  </div>
                  <div className={`font-bold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] tracking-wide ${
                    quantityFormatted.length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {quantityFormatted}
                  </div>
                  <div className="text-xs text-cyan-400/50 tracking-widest mt-0.5">essence</div>
                </div>

                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-400/70 to-transparent" />

                {/* Price - More aggressive responsive sizing */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-yellow-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    PRICE
                  </div>
                  <div className={`font-thin text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] tracking-wide ${
                    pricePerUnit.toLocaleString().length > 6 ? 'text-lg' :
                    pricePerUnit.toLocaleString().length > 5 ? 'text-xl' :
                    pricePerUnit.toLocaleString().length > 4 ? 'text-2xl' : 'text-3xl'
                  }`}>
                    {pricePerUnit.toLocaleString()}g
                  </div>
                  <div className="text-xs text-yellow-400/80 tracking-widest mt-0.5">PER 1 COMPLETE ESSENCE</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 28: // Option 21 refined - Tighter tracking on numbers
        return (
          <div className="mb-3 relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

            <div className="relative bg-black/95 border border-cyan-400/50 rounded px-2 py-1.5 overflow-hidden">
              <div className="absolute inset-0 opacity-15" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.4) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative grid grid-cols-2 gap-3">
                {/* Stock */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-cyan-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    STOCK
                  </div>
                  <div className={`font-bold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] tracking-wide ${
                    quantityFormatted.length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {quantityFormatted}
                  </div>
                  <div className="text-xs text-cyan-400/50 tracking-widest mt-0.5">essence</div>
                </div>

                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-400/70 to-transparent" />

                {/* Price - Tighter tracking */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-yellow-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    PRICE
                  </div>
                  <div className={`font-thin text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] tracking-tighter ${
                    pricePerUnit.toLocaleString().length > 5 ? 'text-xl' :
                    pricePerUnit.toLocaleString().length > 4 ? 'text-2xl' : 'text-3xl'
                  }`}>
                    {pricePerUnit.toLocaleString()}g
                  </div>
                  <div className="text-xs text-yellow-400/80 tracking-widest mt-0.5">PER 1 COMPLETE ESSENCE</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 29: // Option 21 refined - Reduced base + tighter tracking
        return (
          <div className="mb-3 relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

            <div className="relative bg-black/95 border border-cyan-400/50 rounded px-2 py-1.5 overflow-hidden">
              <div className="absolute inset-0 opacity-15" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.4) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative grid grid-cols-2 gap-3">
                {/* Stock */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-cyan-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    STOCK
                  </div>
                  <div className={`font-bold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] tracking-wide ${
                    quantityFormatted.length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {quantityFormatted}
                  </div>
                  <div className="text-xs text-cyan-400/50 tracking-widest mt-0.5">essence</div>
                </div>

                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-400/70 to-transparent" />

                {/* Price - Both reduced size and tighter tracking */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-yellow-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    PRICE
                  </div>
                  <div className={`font-thin text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] tracking-tighter ${
                    pricePerUnit.toLocaleString().length > 6 ? 'text-base' :
                    pricePerUnit.toLocaleString().length > 5 ? 'text-lg' :
                    pricePerUnit.toLocaleString().length > 4 ? 'text-xl' : 'text-2xl'
                  }`}>
                    {pricePerUnit.toLocaleString()}g
                  </div>
                  <div className="text-xs text-yellow-400/80 tracking-widest mt-0.5">PER 1 COMPLETE ESSENCE</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 30: // Option 21 refined - Ultra compact price
        return (
          <div className="mb-3 relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

            <div className="relative bg-black/95 border border-cyan-400/50 rounded px-2 py-1.5 overflow-hidden">
              <div className="absolute inset-0 opacity-15" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.4) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative grid grid-cols-2 gap-3">
                {/* Stock */}
                <div className="text-center min-w-0">
                  <div className="text-xs text-cyan-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    STOCK
                  </div>
                  <div className={`font-bold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] tracking-wide ${
                    quantityFormatted.length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {quantityFormatted}
                  </div>
                  <div className="text-xs text-cyan-400/50 tracking-widest mt-0.5">essence</div>
                </div>

                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-400/70 to-transparent" />

                {/* Price - Ultra compact with very tight tracking */}
                <div className="text-center min-w-0 px-1">
                  <div className="text-xs text-yellow-300/80 uppercase tracking-widest mb-0.5 font-mono font-bold">
                    PRICE
                  </div>
                  <div className={`font-thin text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] tracking-[-0.05em] ${
                    pricePerUnit.toLocaleString().length > 6 ? 'text-sm' :
                    pricePerUnit.toLocaleString().length > 5 ? 'text-base' :
                    pricePerUnit.toLocaleString().length > 4 ? 'text-lg' : 'text-2xl'
                  }`}>
                    {pricePerUnit.toLocaleString()}g
                  </div>
                  <div className="text-xs text-yellow-400/80 tracking-widest mt-0.5">PER 1 COMPLETE ESSENCE</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 31: // Vertical v1 - Based on option 19 aesthetic
        return (
          <div className="mb-3 relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

            <div className="relative bg-black/95 border border-cyan-400/50 rounded px-3 py-3 overflow-hidden">
              <div className="absolute inset-0 opacity-15" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.4) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative space-y-2">
                {/* Stock */}
                <div className="text-center h-[60px] flex flex-col justify-between">
                  <div className="text-xs text-cyan-300/80 uppercase tracking-wide mb-1 font-semibold">
                    STOCK
                  </div>
                  <div className={`font-semibold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] ${
                    quantityFormatted.length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {quantityFormatted}
                  </div>
                  <div className="text-xs text-cyan-400/50 uppercase mt-1 font-light">ESS</div>
                </div>

                {/* Horizontal divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />

                {/* Price */}
                <div className="text-center">
                  <div className="text-xs text-yellow-300/80 uppercase tracking-wide mb-1 font-semibold">
                    PRICE
                  </div>
                  <div className={`font-semibold text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] ${
                    pricePerUnit.toLocaleString().length > 6 ? 'text-xl' :
                    pricePerUnit.toLocaleString().length > 5 ? 'text-2xl' :
                    pricePerUnit.toLocaleString().length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {pricePerUnit.toLocaleString()}
                  </div>
                  <div className="text-xs text-yellow-400/50 uppercase mt-1 font-light">G/EA</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 32: // Vertical v2 - Tighter spacing
        return (
          <div className="mb-3 relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

            <div className="relative bg-black/95 border border-cyan-400/50 rounded px-2 py-2 overflow-hidden">
              <div className="absolute inset-0 opacity-15" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.4) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative space-y-1.5">
                <div className="text-center h-[60px] flex flex-col justify-between">
                  <div className="text-[10px] text-cyan-300/80 uppercase tracking-wide mb-0.5 font-semibold">
                    STOCK
                  </div>
                  <div className={`font-semibold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] ${
                    quantityFormatted.length > 4 ? 'text-2xl' : 'text-3xl'
                  }`}>
                    {quantityFormatted}
                  </div>
                  <div className="text-[10px] text-cyan-400/50 uppercase mt-0.5 font-light">ESS</div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />

                {/* Price */}
                <div className="text-center">
                  <div className="text-[10px] text-yellow-300/80 uppercase tracking-wide mb-0.5 font-semibold">
                    PRICE
                  </div>
                  <div
                    className="font-semibold text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] inline-flex items-baseline justify-center"
                    style={{
                      fontSize: `${(pricePerUnit.toLocaleString().length > 6 ? 16 :
                        pricePerUnit.toLocaleString().length > 5 ? 20 :
                        pricePerUnit.toLocaleString().length > 4 ? 24 : 30) * (priceNumberFontSize / 36)}px`
                    }}
                  >
                    <span>{pricePerUnit.toLocaleString()}</span>
                    <span className="font-thin" style={{ fontSize: '0.45em' }}>G</span>
                  </div>
                  <div className="text-[10px] text-yellow-400/50 uppercase mt-0.5 font-light">G/EA</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 33: // Vertical v3 - Larger text, minimal labels
        return (
          <div className="mb-3 relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

            <div className="relative bg-black/95 border border-cyan-400/50 rounded px-3 py-2.5 overflow-hidden">
              <div className="absolute inset-0 opacity-15" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.4) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative space-y-2">
                {/* Stock */}
                <div className="text-center">
                  <div className="text-[9px] text-cyan-300/60 uppercase tracking-widest mb-0.5 font-bold">
                    STOCK
                  </div>
                  <div className={`font-bold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] ${
                    quantityFormatted.length > 4 ? 'text-3xl' : 'text-5xl'
                  }`}>
                    {quantityFormatted}
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />

                {/* Price */}
                <div className="text-center">
                  <div className="text-[9px] text-yellow-300/60 uppercase tracking-widest mb-0.5 font-bold">
                    PRICE
                  </div>
                  <div
                    className="font-bold text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] inline-flex items-baseline justify-center"
                    style={{
                      fontSize: `${(pricePerUnit.toLocaleString().length > 6 ? 20 :
                        pricePerUnit.toLocaleString().length > 5 ? 24 :
                        pricePerUnit.toLocaleString().length > 4 ? 30 : 48) * (priceNumberFontSize / 36)}px`
                    }}
                  >
                    <span>{pricePerUnit.toLocaleString()}</span>
                    <span className="font-thin" style={{ fontSize: '0.45em' }}>G</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 34: // Vertical v4 - Bold labels, medium numbers
        return (
          <div className="mb-3 relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

            <div className="relative bg-black/95 border border-cyan-400/50 rounded px-2.5 py-2.5 overflow-hidden">

              <div className="relative space-y-2">
                {/* Stock */}
                <div className="text-center h-[60px] flex flex-col justify-between">
                  <div className="text-xs text-cyan-300/60 uppercase tracking-wider font-bold">
                    STOCK
                  </div>
                  <div
                    className="font-semibold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] flex items-center justify-center"
                    style={{ fontSize: `${stockNumberFontSize}px` }}
                  >
                    {quantityFormatted}
                  </div>
                  <div className="text-xs text-cyan-400/40 uppercase font-light">essence</div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />

                {/* Price - Extra responsive sizing for very large numbers */}
                <div className="text-center h-[60px] flex flex-col justify-between">
                  <div className="text-xs text-yellow-300/60 uppercase tracking-wider font-bold">
                    PRICE
                  </div>
                  <div
                    className="font-semibold text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] inline-flex items-baseline justify-center"
                    style={{
                      fontSize: `${
                        pricePerUnit.toLocaleString().length > 7 ? priceNumberFontSize * 0.56 :
                        pricePerUnit.toLocaleString().length > 6 ? priceNumberFontSize * 0.67 :
                        pricePerUnit.toLocaleString().length > 5 ? priceNumberFontSize * 0.83 :
                        pricePerUnit.toLocaleString().length > 4 ? priceNumberFontSize * 0.83 : priceNumberFontSize
                      }px`
                    }}
                  >
                    <span>{pricePerUnit.toLocaleString()}</span>
                    <span className="font-thin ml-0.5" style={{ fontSize: `${Math.round(priceNumberFontSize * 0.45)}px` }}>G</span>
                  </div>
                  <div className="text-xs text-yellow-400/40 uppercase font-light">each</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 35: // Vertical v5 - Ultra spacious for large numbers
        return (
          <div className="mb-3 relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

            <div className="relative bg-black/95 border border-cyan-400/50 rounded px-4 py-3 overflow-hidden">
              <div className="absolute inset-0 opacity-15" style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(0,255,255,0.4) 50%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              }} />

              <div className="relative space-y-3">
                {/* Stock */}
                <div className="text-center">
                  <div className="text-xs text-cyan-300/80 uppercase tracking-wide mb-1.5 font-semibold">
                    STOCK
                  </div>
                  <div className={`font-semibold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] ${
                    quantityFormatted.length > 4 ? 'text-3xl' : 'text-4xl'
                  }`}>
                    {quantityFormatted}
                  </div>
                  <div className="text-xs text-cyan-400/50 uppercase mt-1.5 font-light">essence</div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />

                {/* Price - Extra responsive sizing for very large numbers */}
                <div className="text-center">
                  <div className="text-xs text-yellow-300/80 uppercase tracking-wide mb-1.5 font-semibold">
                    PRICE
                  </div>
                  <div
                    className="font-semibold text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] inline-flex items-baseline justify-center"
                    style={{
                      fontSize: `${(pricePerUnit.toLocaleString().length > 7 ? 16 :
                        pricePerUnit.toLocaleString().length > 6 ? 20 :
                        pricePerUnit.toLocaleString().length > 5 ? 24 :
                        pricePerUnit.toLocaleString().length > 4 ? 30 : 36) * (priceNumberFontSize / 36)}px`
                    }}
                  >
                    <span>{pricePerUnit.toLocaleString()}</span>
                    <span className="font-thin" style={{ fontSize: '0.45em' }}>G</span>
                  </div>
                  <div className="text-xs text-yellow-400/50 uppercase mt-1.5 font-light">each</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Helper function to get full time breakdown for tooltip
  const getFullTimeBreakdown = (expiresAt: number) => {
    const remaining = expiresAt - currentTime;
    if (remaining <= 0) return "This listing has expired";

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
  };

  // Time remaining display variations
  const renderTimeRemaining = (expiresAt: number, variation: 1 | 2 | 3 | 4 | 5) => {
    const styles = getCountdownStyles(expiresAt);
    const timeText = formatCountdown(expiresAt);

    // Check if timer is in red zone (less than 1 hour)
    const remaining = expiresAt - currentTime;
    const totalHours = remaining / (1000 * 60 * 60);
    const isUrgent = totalHours < 1;

    // Custom clock SVG icon component
    const ClockIcon = ({ className = "" }: { className?: string }) => (
      <svg
        className={className}
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );

    switch(variation) {
      case 1: // Clock icon left, text right (compact)
        return (
          <div className="mb-2 flex items-center justify-center gap-1.5">
            <ClockIcon className={`${styles.timeClass} ${isUrgent ? 'animate-red-glow-flash' : ''}`} />
            <div className={`${styles.timeClass} text-[11px] font-bold ${isUrgent ? 'animate-red-glow-flash' : ''}`}>
              {timeText}
            </div>
          </div>
        );

      case 2: // Clock icon above text (stacked)
        return (
          <div className="mb-2 flex flex-col items-center gap-0.5">
            <ClockIcon className={`${styles.timeClass} ${isUrgent ? 'animate-red-glow-flash' : ''}`} />
            <div className={`${styles.timeClass} text-[10px] font-bold ${isUrgent ? 'animate-red-glow-flash' : ''}`}>
              {timeText}
            </div>
          </div>
        );

      case 3: // Clock icon with circular container
        return (
          <div className="mb-2 flex items-center justify-center gap-2">
            <div className={`rounded-full p-1 ${styles.containerClass}`}>
              <ClockIcon className={`${styles.timeClass} ${isUrgent ? 'animate-red-glow-flash' : ''}`} />
            </div>
            <div className={`${styles.timeClass} text-[11px] font-bold ${isUrgent ? 'animate-red-glow-flash' : ''}`}>
              {timeText}
            </div>
          </div>
        );

      case 4: // Large clock icon with small text below
        return (
          <div className="mb-2 flex flex-col items-center gap-1">
            <ClockIcon className={`w-4 h-4 ${styles.timeClass} ${isUrgent ? 'animate-red-glow-flash' : ''}`} />
            <div className={`${styles.timeClass} text-[9px] font-bold tracking-wide ${isUrgent ? 'animate-red-glow-flash' : ''}`}>
              {timeText}
            </div>
          </div>
        );

      case 5: // Clock icon + text with subtle background
        return (
          <div className="mt-3 flex items-center justify-center">
            <Tooltip
              content={
                <div className="text-center">
                  <p className="font-semibold mb-1">Time Remaining on Listing</p>
                  <p className="text-xs">{getFullTimeBreakdown(expiresAt)}</p>
                </div>
              }
            >
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-help ${styles.containerClass.includes('red') ? 'bg-red-900/10' : styles.containerClass.includes('orange') ? 'bg-orange-900/10' : styles.containerClass.includes('yellow') ? 'bg-yellow-900/10' : 'bg-white/5'}`}>
                <ClockIcon className={`${styles.timeClass} ${isUrgent ? 'animate-red-glow-flash' : ''}`} />
                <div className={`${styles.timeClass} text-[11px] font-bold ${isUrgent ? 'animate-red-glow-flash' : ''}`}>
                  {timeText}
                </div>
              </div>
            </Tooltip>
          </div>
        );

      default:
        return null;
    }
  };

  // Corporation name display - Compact Inline (clickable)
  const renderCorporationName = (companyName: string) => {
    return (
      <div className="mb-3 text-center">
        <button
          className="group inline-flex items-center gap-2 text-[10px] cursor-pointer hover:scale-105"
          style={{
            transition: 'transform 0.033s ease-out, color 0.15s ease-out' // 30fps = 33ms
          }}
          onClick={() => {
            // TODO: Navigate to corporation page
            console.log('Navigate to corporation:', companyName);
          }}
        >
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-gray-500/60 group-hover:to-yellow-400 transition-all duration-150" />
          <span className="text-gray-500 uppercase tracking-wide group-hover:text-yellow-400 group-hover:tracking-widest transition-all duration-150">
            {companyName}
          </span>
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-gray-500/60 group-hover:to-yellow-400 transition-all duration-150" />
        </button>
      </div>
    );
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
          <div className="bg-black/90 border border-yellow-500/50 p-3 rounded-lg backdrop-blur-sm space-y-4 max-h-[calc(100vh-100px)] overflow-y-auto" style={{ transform: 'scale(0.85)', transformOrigin: 'top right' }}>
            <div className="text-yellow-400 text-xs uppercase tracking-wider font-bold mb-2 pb-2 border-b border-yellow-500/30">Debug Controls</div>

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

            {/* Expiration Filter */}
            <div>
              <label className="block mb-2 text-yellow-400 text-xs uppercase tracking-wider">Listing Status</label>
              <select
                value={showExpiredListings ? "all" : "active"}
                onChange={(e) => setShowExpiredListings(e.target.value === "all")}
                className="w-full px-3 py-2 bg-black border border-yellow-500/30 text-yellow-400 text-sm rounded focus:outline-none focus:border-yellow-500"
              >
                <option value="active">Active Only</option>
                <option value="all">Show All (Including Expired)</option>
              </select>
            </div>


            {/* Listing Scale Control */}
            <div>
              <label className="block mb-2 text-yellow-400 text-xs uppercase tracking-wider">
                Listing Scale: {listingScale}% {listingScale <= 60 && "(5 cols)"} {listingScale > 60 && listingScale <= 80 && "(4 cols)"} {listingScale > 80 && listingScale <= 110 && "(3 cols)"} {listingScale > 110 && listingScale <= 140 && "(2 cols)"} {listingScale > 140 && "(1 col)"}
              </label>
              <input
                type="range"
                min="50"
                max="150"
                step="5"
                value={listingScale}
                onChange={(e) => setListingScale(Number(e.target.value))}
                className="w-full debug-slider"
                style={{
                  background: `linear-gradient(to right, #fab617 0%, #fab617 ${((listingScale - 50) / 100) * 100}%, #374151 ${((listingScale - 50) / 100) * 100}%, #374151 100%)`
                }}
              />
              <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                <span>More Columns</span>
                <span>Fewer Columns</span>
              </div>
            </div>

            {/* Essence Title Case Toggle */}
            <div>
              <label className="block mb-2 text-yellow-400 text-xs uppercase tracking-wider">Essence Title Case</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setEssenceTitleCase('uppercase')}
                  className={`flex-1 px-3 py-2 text-xs font-bold rounded transition-all ${
                    essenceTitleCase === 'uppercase'
                      ? 'bg-yellow-500 text-black'
                      : 'bg-black border border-yellow-500/30 text-yellow-400 hover:border-yellow-500'
                  }`}
                >
                  UPPERCASE
                </button>
                <button
                  onClick={() => setEssenceTitleCase('titlecase')}
                  className={`flex-1 px-3 py-2 text-xs font-bold rounded transition-all ${
                    essenceTitleCase === 'titlecase'
                      ? 'bg-yellow-500 text-black'
                      : 'bg-black border border-yellow-500/30 text-yellow-400 hover:border-yellow-500'
                  }`}
                >
                  Title Case
                </button>
              </div>
            </div>

            {/* Siphon Modal Layout */}
            <div>
              <label className="block mb-2 text-yellow-400 text-xs uppercase tracking-wider">Siphon Modal Layout</label>
              <div className="grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((layout) => (
                  <button
                    key={layout}
                    onClick={() => setSiphonLayoutChoice(layout as 1 | 2 | 3 | 4 | 5)}
                    className={`px-2 py-2 text-xs font-bold rounded transition-all ${
                      siphonLayoutChoice === layout
                        ? 'bg-cyan-500 text-black'
                        : 'bg-black border border-cyan-500/30 text-cyan-400 hover:border-cyan-500'
                    }`}
                  >
                    {layout}
                  </button>
                ))}
              </div>
              <div className="mt-1 text-[9px] text-gray-500">
                {siphonLayoutChoice === 1 && "Vertical Bars"}
                {siphonLayoutChoice === 2 && "Horizontal Bars"}
                {siphonLayoutChoice === 3 && "Stacked Progress"}
                {siphonLayoutChoice === 4 && "Triple Bars"}
                {siphonLayoutChoice === 5 && "Circular Progress"}
              </div>
            </div>

            {/* Space Age Header Toggle */}
            <div className="pt-4 border-t border-cyan-500/30">
              <label className="block mb-2 text-cyan-400 text-xs uppercase tracking-wider">Header Style</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setUseSpaceAgeHeader(false)}
                  className={`flex-1 px-3 py-2 text-xs font-bold rounded transition-all ${
                    !useSpaceAgeHeader
                      ? 'bg-yellow-500 text-black'
                      : 'bg-black border border-yellow-500/30 text-yellow-400 hover:border-yellow-500'
                  }`}
                >
                  Industrial
                </button>
                <button
                  onClick={() => setUseSpaceAgeHeader(true)}
                  className={`flex-1 px-3 py-2 text-xs font-bold rounded transition-all ${
                    useSpaceAgeHeader
                      ? 'bg-cyan-500 text-black'
                      : 'bg-black border border-cyan-500/30 text-cyan-400 hover:border-cyan-500'
                  }`}
                >
                  Space Age
                </button>
              </div>
              <div className="mt-1 text-[9px] text-gray-500">
                {useSpaceAgeHeader ? "Liquid glass style from landing page" : "Industrial military style (current)"}
              </div>
            </div>

            {/* Gold Management */}
            <div className="pt-4 border-t border-yellow-500/30">
              <label className="block mb-2 text-yellow-400 text-xs uppercase tracking-wider">Gold</label>
              <button
                onClick={async () => {
                  if (userId) {
                    await updateGold({ userId, gold: 10000 });
                  }
                }}
                className="w-full px-3 py-2 bg-yellow-900/30 border border-yellow-500/50 text-yellow-400 text-xs font-bold rounded hover:bg-yellow-900/50 transition-all"
              >
                SET GOLD TO 10,000
              </button>
            </div>

            {/* Marketplace Reseed */}
            <div className="pt-4 border-t border-yellow-500/30">
              <label className="block mb-2 text-yellow-400 text-xs uppercase tracking-wider">Marketplace Data</label>
              <div className="space-y-2">
                <button
                  onClick={async () => {
                    if (confirm("Clear all marketplace listings? This cannot be undone.")) {
                      await clearMarketplace();
                      alert("Marketplace cleared!");
                    }
                  }}
                  className="w-full px-3 py-2 bg-red-900/30 border border-red-500/50 text-red-400 text-xs font-bold rounded hover:bg-red-900/50 transition-all"
                >
                  CLEAR ALL LISTINGS
                </button>
                <button
                  onClick={async () => {
                    await seedMarketplace();
                    alert("Marketplace reseeded with new timer variations!");
                  }}
                  className="w-full px-3 py-2 bg-green-900/30 border border-green-500/50 text-green-400 text-xs font-bold rounded hover:bg-green-900/50 transition-all"
                >
                  RESEED MARKETPLACE
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 py-6">
        {/* Title Section - Conditional Header Style */}
        {useSpaceAgeHeader ? (
          /* Space Age Style Header - Liquid Glass Aesthetic */
          <div
            className="relative mb-6 rounded-2xl p-5 overflow-hidden transition-all duration-500"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.05)',
            }}
          >
            {/* Subtle gradient shimmer overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
                animation: 'slideParticles 8s linear infinite',
              }}
            />

            {/* Header Layout */}
            <div className="relative flex justify-between items-center">
              <h1
                className="text-5xl font-bold tracking-wider uppercase"
                style={{
                  fontFamily: "'Saira', 'Orbitron', sans-serif",
                  color: '#ffffff',
                  textShadow: '0 0 20px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.5)',
                  letterSpacing: '0.15em',
                }}
              >
                MARKET
              </h1>
              <div className="flex items-center gap-3">
                {/* Space Age List Item Button */}
                <button
                  onClick={() => setShowCreateListing(true)}
                  className="group relative px-6 py-2.5 rounded-xl font-semibold uppercase tracking-wider text-sm transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(34,211,238,0.2) 0%, rgba(34,211,238,0.1) 100%)',
                    border: '1px solid rgba(34,211,238,0.4)',
                    color: '#22d3ee',
                    fontFamily: "'Play', sans-serif",
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      backgroundImage: `url('/random-images/honey-png1.webp')`,
                      backgroundSize: '150%',
                      backgroundPosition: 'center',
                    }}
                  />
                  <span className="relative z-10 transition-all duration-300 group-hover:[text-shadow:0_0_10px_rgba(34,211,238,0.8)]">
                    LIST ITEM
                  </span>
                </button>

                {/* Space Age My Listings Button */}
                <button
                  onClick={() => setShowMyListingsModal(true)}
                  className="group relative px-6 py-2.5 rounded-xl font-medium uppercase tracking-wider text-sm transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'rgba(255,255,255,0.8)',
                    fontFamily: "'Play', sans-serif",
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      backgroundImage: `url('/random-images/honey-png1.webp')`,
                      backgroundSize: '150%',
                      backgroundPosition: 'center',
                    }}
                  />
                  <span className="relative z-10 transition-all duration-300 group-hover:text-white group-hover:[text-shadow:0_0_6px_rgba(255,255,255,0.6)]">
                    MY LISTINGS
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Industrial Style Header - Military Command Panel (Original) */
          <div className="relative mb-6 mek-card-industrial mek-border-sharp-gold rounded-xl p-4 mek-glow-yellow">
            <div className="absolute top-0 left-0 right-0 h-3 mek-overlay-hazard-stripes opacity-60" />
            <div className="absolute inset-0 mek-overlay-scratches pointer-events-none" />
            <div className="absolute inset-0 mek-overlay-rust pointer-events-none" />
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 mek-overlay-metal-texture" />
            </div>

            {/* Header Layout - Compact Grid (headerLayout locked to 5) */}
            <div className="relative">
              <div className="flex justify-between items-center">
                <h1 className="mek-text-industrial text-5xl text-yellow-400 mek-text-shadow">
                  MARKET
                </h1>
                <div className="flex items-center gap-4">
                  {renderHeaderButtons({
                    onCreateListing: () => setShowCreateListing(true),
                    onToggleMyListings: () => setShowMyListingsModal(true),
                    showOnlyMyListings,
                    listingCount: debugListingCount
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

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

            {/* BOUNTIES LAYOUT 1: Table + Cards */}
            {false && (
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
            {false && (
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
            {false && (
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

            {/* BOUNTIES LAYOUT 5: Slim Horizontal Card Design */}
            {false && (
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
            {false && (
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
                            {unownedEssenceVariations.map((variation: { name: string; amount: number }) => (
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
        <div
          className="grid mt-6"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(200, 250 * (listingScale / 100)) * (cardScale / 100)}px, 1fr))`,
            gap: '5px'
          }}
        >
          {sortedListings.length === 0 ? (
            <div className="col-span-full text-center py-12 mek-card-industrial mek-border-sharp-gray">
              <div className="text-6xl mb-4 text-yellow-500/20">⊗</div>
              <div className="mek-text-industrial text-xl text-gray-400">NO ESSENCE AVAILABLE</div>
              <div className="mek-label-uppercase text-gray-500 mt-2">ADJUST SEARCH PARAMETERS OR CHECK BACK LATER</div>
            </div>
          ) : (
            sortedListings.map((listing: any) => {
              const isOwn = listing.sellerId === userId;
              // Check affordability based on minimum purchase (0.1 essence), not full listing quantity
              const minPurchase = 0.1;
              const canAfford = displayGold >= listing.pricePerUnit * minPurchase;

              const cardStyles = getListingCardStyles(listingCardStyle);
              return (
                <div
                  key={listing._id}
                  className={cardStyles.className}
                  style={{
                    ...cardStyles.style,
                    transform: `scale(${cardScale / 100})`,
                    transformOrigin: 'top center'
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

                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent animate-shimmer" />
                  </div>

                  {/* Essence Image */}
                  <div className="flex justify-center items-center mb-3" style={{ height: `${bottleImageSize}px` }}>
                    <img
                      src={getEssenceImagePath(listing.itemVariation || '', (listing as any).variationType)}
                      alt={listing.itemVariation || "Essence"}
                      className="w-auto h-auto object-contain"
                      style={{ maxWidth: `${bottleImageSize}px`, maxHeight: `${bottleImageSize}px` }}
                      onError={(e) => {
                        // Show placeholder text when image not found
                        const target = e.target as HTMLImageElement;
                        const parent = target.parentElement;
                        if (parent) {
                          target.style.display = 'none';
                          const placeholder = document.createElement('div');
                          placeholder.className = 'rounded-lg border-2 border-dashed border-yellow-500/30 flex items-center justify-center bg-black/40';
                          placeholder.style.width = `${bottleImageSize}px`;
                          placeholder.style.height = `${bottleImageSize}px`;
                          placeholder.innerHTML = `<span class="text-yellow-500/50 text-xs font-bold uppercase text-center px-2">${listing.itemVariation?.replace(/\s+essence$/i, '') || 'Essence'}</span>`;
                          parent.appendChild(placeholder);
                        }
                      }}
                    />
                  </div>

                  {/* Essence Details */}
                  <div className="mb-3 h-14 flex flex-col items-center justify-center gap-1">
                    {(() => {
                      const essenceName = listing.itemVariation || "Unknown Essence";
                      const { fontSize, lineClamp } = getEssenceLabelFontSize(essenceName, essenceLabelFontSize);

                      // Convert to title case if needed
                      const displayName = essenceTitleCase === 'titlecase'
                        ? essenceName.split(' ').map((word: string) =>
                            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                          ).join(' ')
                        : essenceName;

                      return (
                        <>
                          <div
                            className={`font-bold tracking-wide text-center font-exo text-white ${
                              essenceTitleCase === 'uppercase' ? 'uppercase' : ''
                            } ${lineClamp === 2 ? 'line-clamp-2' : 'line-clamp-1'} px-1`}
                            style={{
                              fontSize: `${fontSize}px`,
                              lineHeight: '1.2',
                              wordWrap: 'break-word',
                              overflowWrap: 'break-word',
                              hyphens: 'auto',
                              display: '-webkit-box',
                              WebkitBoxOrient: 'vertical',
                              WebkitLineClamp: lineClamp,
                              overflow: 'hidden'
                            }}
                          >
                            {displayName}
                          </div>
                          {isOwn && (
                            <div className="bg-yellow-400 text-black text-[10px] px-3 py-0.5 font-bold uppercase tracking-wider rounded-md">
                              ◆ YOUR LISTING
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Price Display */}
                  {renderPricingInfo(listing.pricePerUnit, listing.quantity, pricingInfoLayout)}

                  {/* Corporation Name - Always show */}
                  {renderCorporationName((listing as any).sellerCompanyName || "OVER EXPOSED")}

                  {/* Action Button */}
                  {isOwn ? (
                    <button
                      onClick={() => handleCancelListing(listing._id)}
                      className={`${getSiphonButtonStyle()} bg-red-900/40 border-2 border-red-500/50 hover:bg-red-900/60 hover:border-red-400 text-red-400`}
                    >
                      ⊗ RECALL
                    </button>
                  ) : (
                    <>
                      <button
                        ref={(el) => { buttonRefs.current[listing._id] = el; }}
                        onClick={() => canAfford && handleOpenPurchaseModal(listing)}
                        disabled={!canAfford}
                        onMouseEnter={() => !canAfford && handleTooltipHover(listing._id, true)}
                        onMouseLeave={() => handleTooltipHover(listing._id, false)}
                        className={`${getSiphonButtonStyle()} ${getSiphonButtonColors(canAfford)} ${canAfford ? getSiphonHoverEffect() : ''}`}
                        style={{
                          clipPath: canAfford ? getSiphonButtonClipPath() : undefined
                        }}
                      >
                        {canAfford ? (
                          getSiphonButtonTextures()
                        ) : (
                          <>
                            <div className="absolute inset-0 mek-overlay-scratches opacity-15 pointer-events-none" />
                            <div className="absolute inset-0 mek-overlay-rust opacity-10 pointer-events-none" />
                          </>
                        )}
                        <span className="relative z-10 pointer-events-none">
                          SIPHON
                        </span>
                      </button>
                    </>
                  )}

                  {/* Time Left - Countdown Timer (Below Button) */}
                  {listing.expiresAt && renderTimeRemaining(listing.expiresAt, timerDisplayVariation)}
                </div>
              );
            })
          )}
        </div>

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
                        {ownedEssenceVariations.map((variation: { name: string; amount: number }) => (
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

        {/* New Listing Lightbox - V6 Full Market Match */}
        <EssenceListingLightboxV6FullMarketMatch
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

              // Debug: Log gold values
              console.log('[💰GOLD] walletAddress:', walletAddress);
              console.log('[💰GOLD] goldMiningData:', goldMiningData);
              console.log('[💰GOLD] goldMiningData.accumulatedGold:', goldMiningData?.accumulatedGold);

              const currentGold = goldMiningData?.accumulatedGold ?? 0;
              const totalFee = durationOption.cost + Math.ceil((amount * price) * 0.02); // duration + market fee
              console.log('[💰GOLD] Current gold:', currentGold);
              console.log('[💰GOLD] Total fee:', totalFee, '(Duration:', durationOption.cost, '+ Market:', Math.ceil((amount * price) * 0.02) + ')');
              console.log('[💰GOLD] Can afford?', currentGold >= totalFee);

              // Check if goldMiningData has loaded
              if (!goldMiningData) {
                alert('Loading gold data, please try again in a moment.');
                return;
              }

              // Check if user can afford TOTAL listing fee (duration + market fee)
              if (currentGold < totalFee) {
                alert(`Insufficient gold. Listing fee: ${totalFee}g (Duration: ${durationOption.cost}g + Market: ${Math.ceil((amount * price) * 0.02)}g)`);
                return;
              }

              try {
                await createListing({
                  sellerId: userId,
                  itemType: "essence",
                  itemVariation: data.variation,
                  quantity: amount,
                  pricePerUnit: price,
                  duration: data.duration * 24, // Convert days to hours
                  durationFee: durationOption.cost, // Pass duration cost to backend
                });

                setShowCreateListing(false);
                setSuccessListingData({
                  variation: data.variation,
                  amount,
                  pricePerUnit: price,
                  duration: data.duration,
                  durationFee: durationOption.cost,
                });
                setSelectedVariation("");
                setEssenceAmount("1");
                setPricePerUnit("");
                setShowListingSuccess(true);
              } catch (error) {
                alert(error instanceof Error ? error.message : "An error occurred");
              }
            }}
            ownedEssenceVariations={ownedEssenceVariations}
            durationOptions={DURATION_OPTIONS}
          />

        {/* Purchase Modal with Slider - LAYOUT OPTIONS */}
        {showPurchaseModal && selectedListing && (() => {
          const remainingStock = selectedListing.quantity - purchaseAmount;
          const totalCost = purchaseAmount * selectedListing.pricePerUnit;
          const canAffordPurchase = userProfile && userProfile.gold >= totalCost;

          return (
            <div
              className="fixed inset-0 bg-black/90 backdrop-blur flex items-center justify-center z-50 p-4"
              onClick={() => setShowPurchaseModal(false)}
            >

              {/* LAYOUT 1: VERTICAL BARS - Side-by-side animated bars */}
              {siphonLayoutChoice === 1 && (
                <div
                  className="relative bg-gray-900/95 border border-gray-700/50 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={() => setShowPurchaseModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl font-bold z-10">×</button>

                  <div className="p-6">
                    <h2 className="text-center text-white font-bold text-xl uppercase mb-6">
                      {selectedListing.itemVariation || selectedListing.variation || "Unknown"}
                    </h2>

                    <div className="flex gap-4 mb-6 h-64">
                      {/* Remaining Bar */}
                      <div className="flex-1 flex flex-col">
                        <div className="text-xs text-cyan-400 font-bold mb-2 text-center">REMAINING</div>
                        <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden flex flex-col justify-end">
                          <div
                            className="bg-gradient-to-t from-cyan-500 to-cyan-400 transition-all duration-300"
                            style={{ height: `${(remainingStock / selectedListing.quantity) * 100}%` }}
                          />
                        </div>
                        <div className="text-2xl font-bold text-cyan-400 text-center mt-2">{remainingStock.toFixed(1)}</div>
                      </div>

                      {/* Purchase Bar */}
                      <div className="flex-1 flex flex-col">
                        <div className="text-xs text-yellow-400 font-bold mb-2 text-center">SIPHONING</div>
                        <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden flex flex-col justify-end">
                          <div
                            className="bg-gradient-to-t from-yellow-500 to-yellow-400 transition-all duration-300"
                            style={{ height: `${(purchaseAmount / selectedListing.quantity) * 100}%` }}
                          />
                        </div>
                        <div className="text-2xl font-bold text-yellow-400 text-center mt-2">{purchaseAmount.toFixed(1)}</div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <input
                        type="range"
                        min="0.1"
                        max={selectedListing.quantity}
                        step="0.1"
                        value={purchaseAmount}
                        onChange={(e) => setPurchaseAmount(parseFloat(e.target.value))}
                        className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between mt-2">
                        <button onClick={() => setPurchaseAmount(0.1)} className="text-xs text-gray-400 hover:text-cyan-400">MIN</button>
                        <button onClick={() => setPurchaseAmount(selectedListing.quantity)} className="text-xs text-gray-400 hover:text-cyan-400">MAX</button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                        <span className="text-gray-400 text-sm">PRICE PER ESSENCE</span>
                        <span className="text-lg font-bold text-yellow-400">{selectedListing.pricePerUnit.toLocaleString()}G</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-black/60 rounded-lg">
                        <span className="text-gray-400 text-sm">TOTAL COST</span>
                        <span className="text-xl font-bold text-yellow-400">{totalCost.toLocaleString()}G</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePurchase(selectedListing._id, purchaseAmount)}
                      disabled={!canAffordPurchase}
                      className={`w-full py-3 rounded-lg font-bold uppercase tracking-[0.3em] ${canAffordPurchase ? "bg-cyan-500 hover:bg-cyan-400 text-black" : "bg-gray-800 text-gray-600 cursor-not-allowed"}`}
                    >
                      {canAffordPurchase ? "SIPHON" : "INSUFFICIENT FUNDS"}
                    </button>
                  </div>
                </div>
              )}

              {/* LAYOUT 2: HORIZONTAL BARS - Left to right progress bars */}
              {siphonLayoutChoice === 2 && (
                <div
                  className="relative bg-gray-900/95 border border-gray-700/50 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={() => setShowPurchaseModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl font-bold z-10">×</button>

                  <div className="p-6">
                    <h2 className="text-center text-white font-bold text-xl uppercase mb-6">
                      {selectedListing.itemVariation || selectedListing.variation || "Unknown"}
                    </h2>

                    <div className="space-y-6 mb-6">
                      {/* Remaining Bar */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-cyan-400 font-bold">REMAINING</span>
                          <span className="text-xl font-bold text-cyan-400">{remainingStock.toFixed(1)}</span>
                        </div>
                        <div className="h-12 bg-gray-800 rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-300"
                            style={{ width: `${(remainingStock / selectedListing.quantity) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Siphoning Bar */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-yellow-400 font-bold">SIPHONING</span>
                          <span className="text-xl font-bold text-yellow-400">{purchaseAmount.toFixed(1)}</span>
                        </div>
                        <div className="h-12 bg-gray-800 rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-300"
                            style={{ width: `${(purchaseAmount / selectedListing.quantity) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <input
                        type="range"
                        min="0.1"
                        max={selectedListing.quantity}
                        step="0.1"
                        value={purchaseAmount}
                        onChange={(e) => setPurchaseAmount(parseFloat(e.target.value))}
                        className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between mt-2">
                        <button onClick={() => setPurchaseAmount(0.1)} className="text-xs text-gray-400 hover:text-cyan-400">MIN</button>
                        <button onClick={() => setPurchaseAmount(selectedListing.quantity)} className="text-xs text-gray-400 hover:text-cyan-400">MAX</button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                        <span className="text-gray-400 text-sm">PRICE PER ESSENCE</span>
                        <span className="text-lg font-bold text-yellow-400">{selectedListing.pricePerUnit.toLocaleString()}G</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-black/60 rounded-lg">
                        <span className="text-gray-400 text-sm">TOTAL COST</span>
                        <span className="text-xl font-bold text-yellow-400">{totalCost.toLocaleString()}G</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePurchase(selectedListing._id, purchaseAmount)}
                      disabled={!canAffordPurchase}
                      className={`w-full py-3 rounded-lg font-bold uppercase tracking-[0.3em] ${canAffordPurchase ? "bg-cyan-500 hover:bg-cyan-400 text-black" : "bg-gray-800 text-gray-600 cursor-not-allowed"}`}
                    >
                      {canAffordPurchase ? "SIPHON" : "INSUFFICIENT FUNDS"}
                    </button>
                  </div>
                </div>
              )}

              {/* LAYOUT 3: STACKED PROGRESS - Single bar showing both portions */}
              {siphonLayoutChoice === 3 && (
                <div
                  className="relative bg-gray-900/95 border border-gray-700/50 rounded-xl shadow-2xl max-w-xl w-full overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={() => setShowPurchaseModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl font-bold z-10">×</button>

                  <div className="p-6">
                    <h2 className="text-center text-white font-bold text-xl uppercase mb-6">
                      {selectedListing.itemVariation || selectedListing.variation || "Unknown"}
                    </h2>

                    {/* Stacked Bar */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-400 font-bold">TOTAL STOCK</span>
                        <span className="text-lg text-gray-300">{selectedListing.quantity.toFixed(1)}</span>
                      </div>
                      <div className="h-32 bg-gray-800 rounded-lg overflow-hidden flex flex-col justify-end relative">
                        {/* Remaining portion (cyan) */}
                        <div
                          className="bg-gradient-to-t from-cyan-500 to-cyan-400 transition-all duration-300 flex items-center justify-center relative"
                          style={{ height: `${(remainingStock / selectedListing.quantity) * 100}%` }}
                        >
                          {remainingStock > 1 && <span className="text-white font-bold text-sm">REMAINING: {remainingStock.toFixed(1)}</span>}
                        </div>
                        {/* Siphoning portion (yellow) - overlayed at bottom */}
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-yellow-500 to-yellow-400 transition-all duration-300 flex items-center justify-center"
                          style={{ height: `${(purchaseAmount / selectedListing.quantity) * 100}%` }}
                        >
                          {purchaseAmount > 1 && <span className="text-black font-bold text-sm">SIPHONING: {purchaseAmount.toFixed(1)}</span>}
                        </div>
                      </div>
                      <div className="flex justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-cyan-400"></div>
                          <span className="text-xs text-cyan-400">Remaining: {remainingStock.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-yellow-400"></div>
                          <span className="text-xs text-yellow-400">Siphoning: {purchaseAmount.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <input
                        type="range"
                        min="0.1"
                        max={selectedListing.quantity}
                        step="0.1"
                        value={purchaseAmount}
                        onChange={(e) => setPurchaseAmount(parseFloat(e.target.value))}
                        className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between mt-2">
                        <button onClick={() => setPurchaseAmount(0.1)} className="text-xs text-gray-400 hover:text-cyan-400">MIN</button>
                        <button onClick={() => setPurchaseAmount(selectedListing.quantity)} className="text-xs text-gray-400 hover:text-cyan-400">MAX</button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                        <span className="text-gray-400 text-sm">PRICE PER ESSENCE</span>
                        <span className="text-lg font-bold text-yellow-400">{selectedListing.pricePerUnit.toLocaleString()}G</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-black/60 rounded-lg">
                        <span className="text-gray-400 text-sm">TOTAL COST</span>
                        <span className="text-xl font-bold text-yellow-400">{totalCost.toLocaleString()}G</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePurchase(selectedListing._id, purchaseAmount)}
                      disabled={!canAffordPurchase}
                      className={`w-full py-3 rounded-lg font-bold uppercase tracking-[0.3em] ${canAffordPurchase ? "bg-cyan-500 hover:bg-cyan-400 text-black" : "bg-gray-800 text-gray-600 cursor-not-allowed"}`}
                    >
                      {canAffordPurchase ? "SIPHON" : "INSUFFICIENT FUNDS"}
                    </button>
                  </div>
                </div>
              )}

              {/* LAYOUT 4: TRIPLE BARS - Three bars showing total, remaining, and siphoning */}
              {siphonLayoutChoice === 4 && (
                <div
                  className="relative bg-gray-900/95 border border-gray-700/50 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={() => setShowPurchaseModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl font-bold z-10">×</button>

                  <div className="p-6">
                    <h2 className="text-center text-white font-bold text-xl uppercase mb-6">
                      {selectedListing.itemVariation || selectedListing.variation || "Unknown"}
                    </h2>

                    <div className="flex gap-3 mb-6 h-64">
                      {/* Total Stock Bar */}
                      <div className="flex-1 flex flex-col">
                        <div className="text-xs text-gray-400 font-bold mb-2 text-center">TOTAL STOCK</div>
                        <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden flex flex-col justify-end">
                          <div
                            className="bg-gradient-to-t from-gray-500 to-gray-400 transition-all duration-300"
                            style={{ height: '100%' }}
                          />
                        </div>
                        <div className="text-2xl font-bold text-gray-400 text-center mt-2">{selectedListing.quantity.toFixed(1)}</div>
                      </div>

                      {/* Remaining Bar */}
                      <div className="flex-1 flex flex-col">
                        <div className="text-xs text-cyan-400 font-bold mb-2 text-center">REMAINING</div>
                        <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden flex flex-col justify-end">
                          <div
                            className="bg-gradient-to-t from-cyan-500 to-cyan-400 transition-all duration-300"
                            style={{ height: `${(remainingStock / selectedListing.quantity) * 100}%` }}
                          />
                        </div>
                        <div className="text-2xl font-bold text-cyan-400 text-center mt-2">{remainingStock.toFixed(1)}</div>
                      </div>

                      {/* Siphoning Bar */}
                      <div className="flex-1 flex flex-col">
                        <div className="text-xs text-yellow-400 font-bold mb-2 text-center">SIPHONING</div>
                        <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden flex flex-col justify-end">
                          <div
                            className="bg-gradient-to-t from-yellow-500 to-yellow-400 transition-all duration-300"
                            style={{ height: `${(purchaseAmount / selectedListing.quantity) * 100}%` }}
                          />
                        </div>
                        <div className="text-2xl font-bold text-yellow-400 text-center mt-2">{purchaseAmount.toFixed(1)}</div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <input
                        type="range"
                        min="0.1"
                        max={selectedListing.quantity}
                        step="0.1"
                        value={purchaseAmount}
                        onChange={(e) => setPurchaseAmount(parseFloat(e.target.value))}
                        className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between mt-2">
                        <button onClick={() => setPurchaseAmount(0.1)} className="text-xs text-gray-400 hover:text-cyan-400">MIN</button>
                        <button onClick={() => setPurchaseAmount(selectedListing.quantity)} className="text-xs text-gray-400 hover:text-cyan-400">MAX</button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                        <span className="text-gray-400 text-sm">PRICE PER ESSENCE</span>
                        <span className="text-lg font-bold text-yellow-400">{selectedListing.pricePerUnit.toLocaleString()}G</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-black/60 rounded-lg">
                        <span className="text-gray-400 text-sm">TOTAL COST</span>
                        <span className="text-xl font-bold text-yellow-400">{totalCost.toLocaleString()}G</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePurchase(selectedListing._id, purchaseAmount)}
                      disabled={!canAffordPurchase}
                      className={`w-full py-3 rounded-lg font-bold uppercase tracking-[0.3em] ${canAffordPurchase ? "bg-cyan-500 hover:bg-cyan-400 text-black" : "bg-gray-800 text-gray-600 cursor-not-allowed"}`}
                    >
                      {canAffordPurchase ? "SIPHON" : "INSUFFICIENT FUNDS"}
                    </button>
                  </div>
                </div>
              )}

              {/* LAYOUT 5: CIRCULAR PROGRESS - Ring progress indicators */}
              {siphonLayoutChoice === 5 && (
                <div
                  className="relative bg-gray-900/95 border border-gray-700/50 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={() => setShowPurchaseModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl font-bold z-10">×</button>

                  <div className="p-6">
                    <h2 className="text-center text-white font-bold text-xl uppercase mb-6">
                      {selectedListing.itemVariation || selectedListing.variation || "Unknown"}
                    </h2>

                    <div className="flex justify-center gap-12 mb-8">
                      {/* Remaining Circle */}
                      <div className="relative">
                        <div className="text-xs text-cyan-400 font-bold mb-3 text-center">REMAINING</div>
                        <svg className="w-32 h-32 transform -rotate-90">
                          {/* Background circle */}
                          <circle cx="64" cy="64" r="56" stroke="#1f2937" strokeWidth="12" fill="none" />
                          {/* Progress circle */}
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="url(#cyanGradient)"
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 56}`}
                            strokeDashoffset={`${2 * Math.PI * 56 * (1 - remainingStock / selectedListing.quantity)}`}
                            className="transition-all duration-300"
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#06b6d4" />
                              <stop offset="100%" stopColor="#22d3ee" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-cyan-400">{remainingStock.toFixed(1)}</div>
                            <div className="text-xs text-cyan-600">{((remainingStock / selectedListing.quantity) * 100).toFixed(0)}%</div>
                          </div>
                        </div>
                      </div>

                      {/* Siphoning Circle */}
                      <div className="relative">
                        <div className="text-xs text-yellow-400 font-bold mb-3 text-center">SIPHONING</div>
                        <svg className="w-32 h-32 transform -rotate-90">
                          {/* Background circle */}
                          <circle cx="64" cy="64" r="56" stroke="#1f2937" strokeWidth="12" fill="none" />
                          {/* Progress circle */}
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="url(#yellowGradient)"
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 56}`}
                            strokeDashoffset={`${2 * Math.PI * 56 * (1 - purchaseAmount / selectedListing.quantity)}`}
                            className="transition-all duration-300"
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#eab308" />
                              <stop offset="100%" stopColor="#fbbf24" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">{purchaseAmount.toFixed(1)}</div>
                            <div className="text-xs text-yellow-600">{((purchaseAmount / selectedListing.quantity) * 100).toFixed(0)}%</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <input
                        type="range"
                        min="0.1"
                        max={selectedListing.quantity}
                        step="0.1"
                        value={purchaseAmount}
                        onChange={(e) => setPurchaseAmount(parseFloat(e.target.value))}
                        className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between mt-2">
                        <button onClick={() => setPurchaseAmount(0.1)} className="text-xs text-gray-400 hover:text-cyan-400">MIN</button>
                        <button onClick={() => setPurchaseAmount(selectedListing.quantity)} className="text-xs text-gray-400 hover:text-cyan-400">MAX</button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                        <span className="text-gray-400 text-sm">PRICE PER ESSENCE</span>
                        <span className="text-lg font-bold text-yellow-400">{selectedListing.pricePerUnit.toLocaleString()}G</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-black/60 rounded-lg">
                        <span className="text-gray-400 text-sm">TOTAL COST</span>
                        <span className="text-xl font-bold text-yellow-400">{totalCost.toLocaleString()}G</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePurchase(selectedListing._id, purchaseAmount)}
                      disabled={!canAffordPurchase}
                      className={`w-full py-3 rounded-lg font-bold uppercase tracking-[0.3em] ${canAffordPurchase ? "bg-cyan-500 hover:bg-cyan-400 text-black" : "bg-gray-800 text-gray-600 cursor-not-allowed"}`}
                    >
                      {canAffordPurchase ? "SIPHON" : "INSUFFICIENT FUNDS"}
                    </button>
                  </div>
                </div>
              )}

            </div>
          );
        })()}

        {/* Purchase History Modal */}
        {showHistoryModal && historyListingId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative max-w-2xl w-full mek-card-industrial mek-border-sharp-gold p-6 rounded-lg max-h-[80vh] overflow-y-auto">
              {/* Close button */}
              <button
                onClick={() => setShowHistoryModal(false)}
                className="absolute top-4 right-4 text-yellow-400 hover:text-yellow-300 text-2xl font-bold"
              >
                ×
              </button>

              {/* Title */}
              <h2 className="mek-text-industrial text-2xl text-yellow-400 mb-4">PURCHASE HISTORY</h2>

              {/* History list would go here - requires query implementation */}
              <div className="text-gray-400">
                <p>Purchase history tracking will be available once backend queries are implemented.</p>
              </div>
            </div>
          </div>
        )}

        {/* My Listings Modal */}
        {showMyListingsModal && (
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4"
            style={{ backdropFilter: 'blur(2px)' }}
            onClick={() => setShowMyListingsModal(false)}
          >
            <div
              className="relative w-[960px] max-w-[95vw] h-auto max-h-[90vh] bg-black/20 backdrop-blur-xl border-2 border-yellow-500/50 rounded-lg overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowMyListingsModal(false)}
                className="absolute top-4 right-4 z-50 flex items-center justify-center hover:scale-110 transition-transform"
              >
                <span className="text-yellow-400 text-3xl font-bold" style={{ textShadow: '0 0 10px rgba(250, 182, 23, 0.5)' }}>×</span>
              </button>

              {/* Scrollable Content */}
              <div className="w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide">
                <div className="relative text-white">
                  {/* Industrial Header */}
                  <div className="w-full bg-gradient-to-b from-black via-black to-transparent">
                    <div className="relative overflow-hidden">
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                          backgroundImage: 'repeating-linear-gradient(45deg, #fab617 0, #fab617 10px, transparent 10px, transparent 20px)',
                        }} />
                      </div>

                      <div className="max-w-7xl mx-auto px-4 py-[15px]">
                        <h1 className="text-5xl font-bold font-orbitron tracking-wider text-center mb-1">
                          <span className="text-yellow-400">MY</span>{" "}
                          <span className="text-gray-400">LISTINGS</span>
                        </h1>
                        <p className="text-center text-gray-400 text-xs max-w-2xl mx-auto" style={{
                          lineHeight: '1.6'
                        }}>
                          View and manage your active marketplace listings. Track sales, monitor remaining stock, and recall listings at any time.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="max-w-7xl mx-auto px-4 py-6">

              {/* Active Deployments Content */}
              {myListings && myListings.filter((l: { itemType: string }) => l.itemType === "essence").length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myListings
                    .filter((l: { itemType: string }) => l.itemType === "essence")
                    .map((listing: any) => {
                      // ⚠️ TEMPORARY TEST DATA ⚠️
                      const mockTransactions = getMockTransactions(listing._id);
                      const originalStock = listing.quantity + 0.4; // Mock: simulate 0.4 already sold
                      const remainingStock = listing.quantity;
                      const totalProfit = mockTransactions.reduce((sum, tx) => sum + tx.goldEarned, 0); // Calculate total profit
                      // ⚠️ END TEMPORARY TEST DATA ⚠️

                      return (
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

                        {/* LAYOUT 1: Compact Vertical with Transaction Log */}
                        {myListingsLayoutVariation === 1 && (
                          <div className="relative p-4">
                            {/* Bottle Image */}
                            <div className="flex justify-center mb-3">
                              <div className="w-24 h-24 relative">
                                <img
                                  src={`/essence-images/named-bottles-1k/${(listing.itemVariation || 'default').toLowerCase().replace(/\s+/g, '-')}.png`}
                                  alt={listing.itemVariation}
                                  className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(250,182,23,0.3)]"
                                  onError={(e) => { e.currentTarget.src = '/essence-images/named-bottles-1k/default.png'; }}
                                />
                              </div>
                            </div>

                            {/* Essence Name */}
                            <div className="text-center mb-3">
                              <div className="text-yellow-400 font-bold text-lg uppercase tracking-wide">
                                {listing.itemVariation || listing.itemType}
                              </div>
                            </div>

                            {/* Stock: Original → Remaining */}
                            <div className="mb-3 p-2 bg-cyan-900/20 border border-cyan-500/20 rounded">
                              <div className="flex items-center justify-center gap-2 text-sm">
                                <span className="text-gray-400">{originalStock}</span>
                                <span className="text-cyan-400">→</span>
                                <span className="text-cyan-400 font-bold">{remainingStock}</span>
                                <span className="text-gray-500 text-xs">ESSENCE</span>
                              </div>
                            </div>

                            {/* Price Per Unit & Profit So Far - Two Columns */}
                            <div className="mb-3 grid grid-cols-2 gap-2">
                              <div className="p-2 bg-yellow-900/20 border border-yellow-500/20 rounded text-center">
                                <div className="text-gray-500 text-xs mb-1">PRICE/UNIT</div>
                                <div className="text-yellow-400 font-bold text-lg">{listing.pricePerUnit.toLocaleString()}g</div>
                              </div>
                              <div className="p-2 bg-yellow-900/20 border border-yellow-500/20 rounded text-center">
                                <div className="text-gray-500 text-xs mb-1">PROFIT SO FAR</div>
                                <div className="text-yellow-400 font-bold text-lg">{totalProfit.toLocaleString()}g</div>
                              </div>
                            </div>

                            {/* Transaction Log */}
                            <div className="mb-3">
                              <div className="text-gray-400 text-xs uppercase mb-2 flex items-center gap-2">
                                <div className="w-4 h-px bg-gray-600" />
                                Transactions
                                <div className="flex-1 h-px bg-gray-600" />
                              </div>
                              <div className="max-h-32 overflow-y-auto space-y-1">
                                {mockTransactions.map(tx => (
                                  <div key={tx.id} className="p-2 bg-black/60 border border-gray-700/30 rounded text-xs">
                                    <div className="flex justify-between mb-1">
                                      <span className="text-gray-500">{tx.date} {tx.time}</span>
                                      <span className="text-purple-400 font-semibold">{tx.corporation}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-cyan-400 font-bold" style={{ textShadow: '0 0 8px rgba(6, 182, 212, 0.6)' }}>
                                        Siphoned: -{tx.amountSiphoned}
                                      </span>
                                      <span className="text-yellow-400 font-semibold">+{tx.goldEarned.toLocaleString()}g</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Recall Button */}
                            <button
                              onClick={() => handleCancelListing(listing._id)}
                              className="relative w-full px-4 py-2 font-bold uppercase transition-none cursor-pointer overflow-hidden rounded-lg tracking-[0.5em] text-base font-normal bg-red-900/40 border-2 border-red-500/50 hover:bg-red-900/60 hover:border-red-400 text-red-400"
                            >
                              ⊗ RECALL
                            </button>
                          </div>
                        )}
                      </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg">
                    No active listings found.
                  </div>
                  <p className="text-gray-500 text-sm mt-2">
                    Click "LIST ITEM" to create a new essence listing.
                  </p>
                </div>
              )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
        )}

        {/* Recall Confirmation Modal */}
        {showRecallConfirm && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowRecallConfirm(false)}>
            <div
              className="relative mek-card-industrial mek-border-sharp-gold p-8 max-w-md w-full rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Grunge overlays */}
              <div className="absolute inset-0 mek-overlay-scratches pointer-events-none opacity-30" />
              <div className="absolute inset-0 mek-overlay-rust pointer-events-none opacity-15" />

              {/* Content */}
              <div className="relative z-10">
                {/* Title */}
                <div className="mb-6 pb-4 border-b-2 border-yellow-500/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-8 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                    <h2 className="mek-text-industrial text-2xl text-red-400 mek-text-shadow">
                      RECALL LISTING
                    </h2>
                  </div>
                </div>

                {/* Warning Message */}
                <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    This will return the essence to your inventory, but{' '}
                    <span className="text-red-400 font-bold">you will not be refunded the listing fees</span>.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRecallConfirm(false)}
                    className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 hover:bg-gray-700 text-gray-300 hover:text-white font-bold uppercase tracking-wider transition-all text-sm rounded-lg"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={confirmRecallListing}
                    className="flex-1 px-4 py-3 bg-red-900/40 border-2 border-red-500/50 hover:bg-red-900/60 hover:border-red-400 text-red-400 font-bold uppercase tracking-wider transition-all text-sm rounded-lg"
                  >
                    CONFIRM RECALL
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recall Success Modal */}
        {showRecallSuccess && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowRecallSuccess(false)}>
            <div
              className="relative mek-card-industrial p-8 max-w-md w-full rounded-xl overflow-hidden border-2 border-green-500/50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Grunge overlays */}
              <div className="absolute inset-0 mek-overlay-scratches pointer-events-none opacity-30" />
              <div className="absolute inset-0 mek-overlay-metal-texture pointer-events-none opacity-20" />

              {/* Content */}
              <div className="relative z-10">
                {/* Title */}
                <div className="mb-6 pb-4 border-b-2 border-green-500/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-8 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    <h2 className="mek-text-industrial text-2xl text-green-400 mek-text-shadow">
                      LISTING RECALLED
                    </h2>
                  </div>
                </div>

                {/* Success Message */}
                <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Listing recalled! Essence returned to inventory.
                  </p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setShowRecallSuccess(false)}
                  className="w-full px-4 py-3 bg-green-900/40 border-2 border-green-500/50 hover:bg-green-900/60 hover:border-green-400 text-green-400 font-bold uppercase tracking-wider transition-all text-sm rounded-lg"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Listing Success Modal */}
        {showListingSuccess && successListingData && (() => {
          const totalValue = successListingData.amount * successListingData.pricePerUnit;
          const marketFee = Math.ceil(totalValue * 0.02);
          const netProfit = totalValue - successListingData.durationFee - marketFee;

          return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowListingSuccess(false)}>
              {/* Main Modal */}
              <div
                className="relative mek-card-industrial p-8 max-w-xl w-full rounded-xl overflow-hidden border-2 border-cyan-500/50"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Grunge overlays */}
                <div className="absolute inset-0 mek-overlay-scratches pointer-events-none opacity-30" />
                <div className="absolute inset-0 mek-overlay-metal-texture pointer-events-none opacity-20" />

                {/* Content */}
                <div className="relative z-10">
                  {/* Title */}
                  <div className="mb-6 pb-4 border-b-2 border-cyan-500/30">
                    <div className="text-cyan-400 text-5xl font-bold mek-text-industrial animate-pulse" style={{ textShadow: '0 0 10px rgba(6,182,212,0.8), 0 0 20px rgba(6,182,212,0.4)' }}>
                      SUCCESS
                    </div>
                    <div className="text-gray-400 text-xs uppercase tracking-wider mt-2">
                      Listing Created
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-6 p-4 bg-cyan-900/10 border border-cyan-500/20 rounded-lg">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Your essence is now committed to the marketplace and removed from your inventory.
                      Other users may purchase any amount they wish, from small portions to the entire listing. You can cancel this listing at any time by visiting{' '}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowListingSuccess(false);
                          setShowMyListingsModal(true);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 underline font-bold transition-colors"
                      >
                        My Listings
                      </button>.
                    </p>
                  </div>

                  {/* Listing Details */}
                  <div className="mb-6">
                    <div className="bg-black/60 border-2 border-cyan-500/30 rounded-lg overflow-hidden">
                      {/* Header with image */}
                      <div className="bg-cyan-900/20 p-6 flex items-center justify-between border-b-2 border-cyan-500/30">
                        <div>
                          <div className="text-gray-400 text-sm mb-2">ESSENCE TYPE</div>
                          <div className="text-cyan-400 text-3xl font-bold mek-text-industrial">{successListingData.variation}</div>
                        </div>
                        <div className="w-32 h-32 relative">
                          <img
                            src={`/essence-images/named-bottles-1k/${successListingData.variation.toLowerCase().replace(/\s+/g, '-')}.png`}
                            alt={successListingData.variation}
                            className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                            onError={(e) => {
                              e.currentTarget.src = '/essence-images/named-bottles-1k/default.png';
                            }}
                          />
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="p-6 grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-gray-500 text-xs uppercase mb-2">Amount</div>
                          <div className="text-cyan-400 text-2xl font-bold">{successListingData.amount}</div>
                        </div>
                        <div className="text-center border-x border-cyan-500/20">
                          <div className="text-gray-500 text-xs uppercase mb-2">Price/Unit</div>
                          <div className="text-cyan-400 text-2xl font-bold">{successListingData.pricePerUnit.toLocaleString()}g</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-500 text-xs uppercase mb-2">Duration</div>
                          <div className="text-cyan-400 text-2xl font-bold">{successListingData.duration}d</div>
                        </div>
                      </div>

                      {/* Net Profit */}
                      <div className="p-4 bg-green-900/20 border-t-2 border-green-500/30">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 uppercase tracking-wider text-sm">Net Profit (if sold):</span>
                          <span className="text-green-400 text-2xl font-bold">{netProfit.toLocaleString()}g</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => setShowListingSuccess(false)}
                    className="w-full px-4 py-3 bg-cyan-900/40 border-2 border-cyan-500/50 hover:bg-cyan-900/60 hover:border-cyan-400 text-cyan-400 font-bold uppercase tracking-wider transition-all text-sm rounded-lg"
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Portal-based Tooltip for Insufficient Funds */}
      {mounted && hoveredInsufficientListing && tooltipPosition && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="relative px-3 py-1.5 bg-gray-900/95 border border-yellow-500/40 rounded text-yellow-400 text-xs font-bold uppercase tracking-wider whitespace-nowrap">
            <div className="absolute inset-0 mek-overlay-scratches opacity-10" />
            <span className="relative z-10">Insufficient Funds</span>
            {/* Arrow pointing down */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-yellow-500/40" />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
