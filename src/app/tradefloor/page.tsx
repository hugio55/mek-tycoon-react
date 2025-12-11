"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "convex/react";
import { useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { restoreWalletSession } from "@/lib/walletSessionManager";
import TradeListingCard from "@/components/tradefloor/TradeListingCard";
import CreateListingLightbox from "@/components/tradefloor/CreateListingLightbox";
import MatchingMeksLightbox from "@/components/tradefloor/MatchingMeksLightbox";
import ViewOffersLightbox from "@/components/tradefloor/ViewOffersLightbox";
import EditListingLightbox from "@/components/tradefloor/EditListingLightbox";
import ConfirmationLightbox from "@/components/tradefloor/ConfirmationLightbox";
import OfferCard from "@/components/tradefloor/OfferCard";

type Tab = "browse" | "my-listings" | "my-offers";
type SortOption = "newest" | "oldest" | "most-offers" | "least-offers";

const SORT_OPTIONS: { id: SortOption; name: string }[] = [
  { id: "newest", name: "Newest First" },
  { id: "oldest", name: "Oldest First" },
  { id: "most-offers", name: "Most Offers" },
  { id: "least-offers", name: "Least Offers" },
];

interface ConfirmAction {
  type: "cancel-listing" | "withdraw-offer";
  id: Id<"tradeListings"> | Id<"tradeOffers">;
  title: string;
  message: string;
}

export default function TradeFloorPage() {
  const searchParams = useSearchParams();
  const [stakeAddress, setStakeAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("browse");
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [selectedListingForOffer, setSelectedListingForOffer] = useState<any>(null);
  const [selectedListingForViewOffers, setSelectedListingForViewOffers] = useState<any>(null);
  const [selectedListingForEdit, setSelectedListingForEdit] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [browseSortOption, setBrowseSortOption] = useState<SortOption>("newest");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [sortDropdownRect, setSortDropdownRect] = useState<DOMRect | null>(null);
  const sortDropdownBtnRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [showUnlockSlotsLightbox, setShowUnlockSlotsLightbox] = useState(false);

  // For portal mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownOpen && sortDropdownBtnRef.current && !sortDropdownBtnRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sortDropdownOpen]);

  // Read tab from URL query parameter (for notification deep links)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["browse", "my-listings", "my-offers"].includes(tabParam)) {
      setActiveTab(tabParam as Tab);
    }
  }, [searchParams]);

  // Restore wallet session on mount (same pattern as HomePage)
  useEffect(() => {
    const initWallet = async () => {
      const session = await restoreWalletSession();
      if (session) {
        // Use stake address as primary identifier (same as database)
        const address = session.stakeAddress || session.walletAddress;
        setStakeAddress(address);
        console.log('[TradeFloor] Wallet connected:', address);
      } else {
        console.log('[TradeFloor] No wallet session found');
      }
    };
    initWallet();
  }, []);

  // Queries
  const browseListings = useQuery(
    api.tradeFloor.getBrowseListings,
    stakeAddress ? { viewerStakeAddress: stakeAddress } : {}
  );

  const myListings = useQuery(
    api.tradeFloor.getMyListings,
    stakeAddress ? { stakeAddress } : "skip"
  );

  const myOffers = useQuery(
    api.tradeFloor.getMyOffers,
    stakeAddress ? { stakeAddress } : "skip"
  );

  const activeListingCount = useQuery(
    api.tradeFloor.getActiveListingCount,
    stakeAddress ? { stakeAddress } : "skip"
  );

  // Sort browse listings based on selected option
  const sortedBrowseListings = useMemo(() => {
    if (!browseListings) return undefined;

    const listings = [...browseListings];

    switch (browseSortOption) {
      case "newest":
        return listings.sort((a: any, b: any) => b.createdAt - a.createdAt);
      case "oldest":
        return listings.sort((a: any, b: any) => a.createdAt - b.createdAt);
      case "most-offers":
        return listings.sort((a: any, b: any) => (b.offerCount || 0) - (a.offerCount || 0));
      case "least-offers":
        return listings.sort((a: any, b: any) => (a.offerCount || 0) - (b.offerCount || 0));
      default:
        return listings;
    }
  }, [browseListings, browseSortOption]);

  // Mutations
  const cancelListing = useMutation(api.tradeFloor.cancelListing);
  const withdrawOffer = useMutation(api.tradeFloor.withdrawOffer);

  const handleCancelListing = (listingId: Id<"tradeListings">) => {
    if (!stakeAddress) return;
    setConfirmAction({
      type: "cancel-listing",
      id: listingId,
      title: "Cancel Listing",
      message: "Are you sure you want to cancel this listing? All pending offers will be notified.",
    });
  };

  const handleWithdrawOffer = (offerId: Id<"tradeOffers">) => {
    if (!stakeAddress) return;
    setConfirmAction({
      type: "withdraw-offer",
      id: offerId,
      title: "Withdraw Offer",
      message: "Are you sure you want to withdraw this offer?",
    });
  };

  const executeConfirmAction = async () => {
    if (!confirmAction || !stakeAddress) return;

    try {
      if (confirmAction.type === "cancel-listing") {
        await cancelListing({
          listingId: confirmAction.id as Id<"tradeListings">,
          ownerStakeAddress: stakeAddress
        });
      } else if (confirmAction.type === "withdraw-offer") {
        await withdrawOffer({
          offerId: confirmAction.id as Id<"tradeOffers">,
          offererStakeAddress: stakeAddress
        });
      }
    } catch (error) {
      console.error("Action failed:", error);
      alert("Action failed. Please try again.");
    } finally {
      setConfirmAction(null);
    }
  };

  const tabs = [
    { id: "browse" as Tab, label: "Browse Listings" },
    { id: "my-listings" as Tab, label: "My Listings" },
    { id: "my-offers" as Tab, label: "My Offers" },
  ];

  const canCreateListing = stakeAddress && activeListingCount !== undefined && activeListingCount < 5;

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Main Content Container with padding */}
      <div className="relative z-10 py-6 px-4 md:px-[100px]">
        {/* Header Card - Space Age Glass Style (matching Market) */}
        <div
          className="relative mb-6 rounded-2xl p-5 overflow-hidden transition-all duration-500"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
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
              TRADE FLOOR
            </h1>
            <div className="flex items-center gap-3">
              {/* List Item Button - Cyan style (matching Market) */}
              <button
                onClick={() => stakeAddress && setShowCreateListing(true)}
                disabled={!stakeAddress}
                className="group relative px-6 py-2.5 rounded-xl font-semibold uppercase tracking-wider text-sm transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: stakeAddress
                    ? 'linear-gradient(135deg, rgba(34,211,238,0.2) 0%, rgba(34,211,238,0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
                  border: stakeAddress
                    ? '1px solid rgba(34,211,238,0.4)'
                    : '1px solid rgba(255,255,255,0.2)',
                  color: stakeAddress ? '#22d3ee' : 'rgba(255,255,255,0.4)',
                  fontFamily: "'Play', sans-serif",
                  cursor: stakeAddress ? 'pointer' : 'not-allowed',
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    backgroundImage: "url('/random-images/honey-png1.webp')",
                    backgroundSize: '150%',
                    backgroundPosition: 'center',
                  }}
                />
                <span className="relative z-10 transition-all duration-300 group-hover:[text-shadow:0_0_10px_rgba(34,211,238,0.8)]">
                  LIST MEK
                </span>
                {stakeAddress && activeListingCount !== undefined && (
                  <span
                    className="ml-2 px-1.5 py-0.5 rounded text-xs relative z-10"
                    style={{ background: 'rgba(34,211,238,0.2)' }}
                  >
                    {activeListingCount}/5
                  </span>
                )}
              </button>

              {/* My Listings Button - Ghost style (matching Market) */}
              <button
                onClick={() => setActiveTab("my-listings")}
                className="group relative px-6 py-2.5 rounded-xl font-medium uppercase tracking-wider text-sm transition-all duration-300 overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: activeTab === "my-listings"
                    ? 'linear-gradient(135deg, rgba(34,211,238,0.15) 0%, rgba(34,211,238,0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
                  border: activeTab === "my-listings"
                    ? '1px solid rgba(34,211,238,0.3)'
                    : '1px solid rgba(255,255,255,0.2)',
                  color: activeTab === "my-listings" ? '#22d3ee' : 'rgba(255,255,255,0.8)',
                  fontFamily: "'Play', sans-serif",
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    backgroundImage: "url('/random-images/honey-png1.webp')",
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

          {/* Description */}
          <p
            className="relative mt-4 max-w-3xl"
            style={{
              fontFamily: 'Play, sans-serif',
              fontSize: '14px',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: '1.6',
            }}
          >
            Looking to do some trading? List Mekanisms you're looking to trade and the variations you are seeking. If another collector has the variation you seek, or simply likes the Mek, they can place an offer. This website does not facilitate the trading transaction! For that, we recommend{' '}
            <a
              href="https://app.tradingtent.io"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-cyan-300"
              style={{ color: '#22d3ee' }}
            >
              Trading Tent
            </a>. We highly discourage sending assets privately without the use of a trustless system (such as{' '}
            <a
              href="https://app.tradingtent.io"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-cyan-300"
              style={{ color: '#22d3ee' }}
            >
              Trading Tent
            </a>).
          </p>
        </div>

        {/* Tab Navigation + Filters Card (matching Market) */}
        <div
          className="mb-6 rounded-2xl relative z-50"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}
        >
          {/* Category Tabs Row */}
          <div
            className="flex items-stretch px-2 pt-2"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {tabs.map((tab, index) => (
              <div key={tab.id} className="flex items-stretch">
                {/* Vertical divider between tabs */}
                {index > 0 && (
                  <div
                    className="w-px my-2"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                  />
                )}
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative px-6 py-3 font-medium uppercase tracking-wider text-sm
                    transition-all duration-200
                    ${activeTab === tab.id ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'}
                  `}
                  style={{
                    fontFamily: "'Play', sans-serif",
                  }}
                >
                  {tab.label}
                  {/* Badge for my-offers */}
                  {tab.id === "my-offers" && myOffers && myOffers.length > 0 && (
                    <span
                      className="ml-2 px-2 py-0.5 text-xs rounded-full"
                      style={{
                        background: 'rgba(34, 211, 238, 0.2)',
                        color: '#22d3ee',
                      }}
                    >
                      {myOffers.length}
                    </span>
                  )}
                  {/* Badge for my-listings */}
                  {tab.id === "my-listings" && myListings && myListings.length > 0 && (
                    <span
                      className="ml-2 px-2 py-0.5 text-xs rounded-full"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.7)',
                      }}
                    >
                      {myListings.length}/5
                    </span>
                  )}
                  {/* Active tab underline indicator */}
                  <div
                    className="absolute bottom-0 left-2 right-2 h-0.5 transition-all duration-200"
                    style={{
                      background: activeTab === tab.id
                        ? 'linear-gradient(90deg, transparent, #22d3ee, transparent)'
                        : 'transparent',
                      boxShadow: activeTab === tab.id
                        ? '0 0 10px rgba(34,211,238,0.5)'
                        : 'none',
                    }}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Subtitle/Description Row */}
          <div className="px-4 py-3 flex items-center justify-between">
            <p
              className="text-sm"
              style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
            >
              {activeTab === "browse" && "Browse trade listings from other players"}
              {activeTab === "my-listings" && "Meks you're looking to trade for specific variations"}
              {activeTab === "my-offers" && "Offers you've made on other players' listings"}
            </p>

            {/* Listing Counter + Unlock Button - My Listings Tab Only */}
            {activeTab === "my-listings" && stakeAddress && (
              <div className="flex items-center gap-3">
                {/* Listing Counter */}
                <span
                  className="text-sm"
                  style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.6)' }}
                >
                  <span style={{ color: '#22d3ee' }}>{activeListingCount ?? 0}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>/5</span>
                </span>

                {/* Unlock More Slots Button */}
                <button
                  onClick={() => setShowUnlockSlotsLightbox(true)}
                  className="px-3 py-1.5 text-xs rounded font-medium transition-all hover:brightness-125"
                  style={{
                    fontFamily: 'Play, sans-serif',
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.08))',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    color: '#fbbf24',
                  }}
                >
                  Unlock More Slots
                </button>
              </div>
            )}

            {/* Sort Dropdown - Browse Tab Only (Portal-based, matching Market style) */}
            {activeTab === "browse" && (
              <div className="relative">
                {/* Dropdown Button */}
                <button
                  ref={sortDropdownBtnRef}
                  onClick={() => {
                    if (!sortDropdownOpen && sortDropdownBtnRef.current) {
                      setSortDropdownRect(sortDropdownBtnRef.current.getBoundingClientRect());
                    }
                    setSortDropdownOpen(!sortDropdownOpen);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm uppercase tracking-wider font-medium transition-all"
                  style={{
                    background: 'linear-gradient(105deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.10) 40%, rgba(255, 255, 255, 0.06) 100%)',
                    backdropFilter: 'blur(4px) brightness(1.25)',
                    WebkitBackdropFilter: 'blur(4px) brightness(1.25)',
                    border: sortDropdownOpen
                      ? '1px solid rgba(34,211,238,0.4)'
                      : '1px solid rgba(255,255,255,0.12)',
                    borderRadius: sortDropdownOpen ? '8px 8px 0 0' : '8px',
                    color: 'rgba(255,255,255,0.8)',
                    fontFamily: "'Play', sans-serif",
                  }}
                >
                  <span>{SORT_OPTIONS.find(o => o.id === browseSortOption)?.name}</span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0 ${sortDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Floating Dropdown Menu - Rendered via Portal (identical to Market) */}
                {mounted && sortDropdownOpen && sortDropdownRect && createPortal(
                  <div
                    className="fixed"
                    style={{
                      zIndex: 99999,
                      top: sortDropdownRect.bottom,
                      left: sortDropdownRect.left,
                      width: sortDropdownRect.width,
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.08) 100%)',
                      backdropFilter: 'blur(8px) brightness(1.1)',
                      WebkitBackdropFilter: 'blur(8px) brightness(1.1)',
                      border: '1px solid rgba(34,211,238,0.4)',
                      borderTop: 'none',
                      borderRadius: '0 0 8px 8px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    }}
                  >
                    {SORT_OPTIONS.map((option, index) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setBrowseSortOption(option.id);
                          setSortDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm tracking-wide transition-all whitespace-nowrap hover:bg-white/10 hover:pl-4 hover:brightness-125"
                        style={{
                          background: browseSortOption === option.id
                            ? 'rgba(34,211,238,0.25)'
                            : 'transparent',
                          color: browseSortOption === option.id
                            ? '#22d3ee'
                            : 'rgba(255,255,255,0.8)',
                          fontFamily: "'Play', sans-serif",
                          borderBottom: index < SORT_OPTIONS.length - 1
                            ? '1px solid rgba(255,255,255,0.1)'
                            : 'none',
                        }}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>,
                  document.body
                )}
              </div>
            )}
          </div>
        </div>

        {/* Not logged in message */}
        {!stakeAddress && (
          <div
            className="text-center py-12 rounded-2xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div className="relative z-10">
              <div
                className="text-6xl mb-4"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(234, 179, 8, 0.5))',
                }}
              >
                🔒
              </div>
              <h2
                className="text-2xl font-bold mb-2"
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  color: '#22d3ee',
                  textShadow: '0 0 20px rgba(34, 211, 238, 0.5)',
                }}
              >
                Connect Your Wallet
              </h2>
              <p style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.6)' }}>
                Connect your wallet to browse listings and make trade offers
              </p>
            </div>
          </div>
        )}

        {/* Browse Listings Tab */}
        {stakeAddress && activeTab === "browse" && (
          <div>
            {sortedBrowseListings === undefined ? (
              <div
                className="text-center py-12"
                style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
              >
                Loading listings...
              </div>
            ) : sortedBrowseListings.length === 0 ? (
              <div
                className="text-center py-12 rounded-2xl relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div className="relative z-10">
                  {/* Space Age Handshake Icon */}
                  <div className="mb-4 flex justify-center">
                    <svg
                      width="80"
                      height="80"
                      viewBox="0 0 80 80"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.4))',
                      }}
                    >
                      {/* Outer glow ring */}
                      <circle cx="40" cy="40" r="38" stroke="url(#handshakeGradient)" strokeWidth="1.5" opacity="0.3"/>
                      {/* Inner ring */}
                      <circle cx="40" cy="40" r="32" stroke="url(#handshakeGradient)" strokeWidth="1" opacity="0.2"/>
                      {/* Left hand coming from left */}
                      <path
                        d="M18 42c0-1 0.5-2 1.5-2.5l8-3c1-0.4 2-0.2 2.8 0.5l5 4.5c0.8 0.7 1.2 1.8 1 2.8l-0.5 2c-0.2 1-1 1.8-2 2l-3 0.5"
                        stroke="url(#handshakeGradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                      {/* Right hand coming from right */}
                      <path
                        d="M62 42c0-1-0.5-2-1.5-2.5l-8-3c-1-0.4-2-0.2-2.8 0.5l-5 4.5c-0.8 0.7-1.2 1.8-1 2.8l0.5 2c0.2 1 1 1.8 2 2l3 0.5"
                        stroke="url(#handshakeGradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                      {/* Handshake clasp in center */}
                      <path
                        d="M35 40l3 2.5c1 0.8 2.5 0.8 3.5 0l3-2.5"
                        stroke="url(#handshakeGradient)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                      {/* Energy lines */}
                      <path d="M40 25v-5" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                      <path d="M50 28l3-4" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                      <path d="M30 28l-3-4" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                      <path d="M55 35l4-2" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                      <path d="M25 35l-4-2" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                      {/* Gradient definitions */}
                      <defs>
                        <linearGradient id="handshakeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#22d3ee"/>
                          <stop offset="100%" stopColor="#06b6d4"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <h3
                    className="text-xl font-semibold text-white mb-2"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    No Listings Yet
                  </h3>
                  <p style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}>
                    Be the first to list a Mek for trade!
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedBrowseListings.map((listing: any) => (
                  <TradeListingCard
                    key={listing._id}
                    listing={listing}
                    viewerStakeAddress={stakeAddress || undefined}
                    viewerMatchCount={listing.viewerMatchCount}
                    onMakeOffer={() => setSelectedListingForOffer(listing)}
                    showMakeOffer={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Listings Tab */}
        {stakeAddress && activeTab === "my-listings" && (
          <div>
            {myListings === undefined ? (
              <div
                className="text-center py-12"
                style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
              >
                Loading your listings...
              </div>
            ) : myListings.length === 0 ? (
              <div
                className="text-center py-12 rounded-2xl relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div className="relative z-10">
                  {/* Space Age Box/Listing Icon */}
                  <div className="mb-4 flex justify-center">
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 64 64"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        filter: 'drop-shadow(0 0 15px rgba(34, 211, 238, 0.4))',
                      }}
                    >
                      <rect x="12" y="20" width="40" height="32" rx="3" stroke="url(#listingGradient)" strokeWidth="2" fill="none"/>
                      <path d="M12 28h40" stroke="url(#listingGradient)" strokeWidth="2"/>
                      <path d="M32 8v12" stroke="url(#listingGradient)" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M26 14l6-6 6 6" stroke="url(#listingGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="32" cy="40" r="8" stroke="#22d3ee" strokeWidth="1.5" opacity="0.5"/>
                      <path d="M32 36v8M28 40h8" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"/>
                      <defs>
                        <linearGradient id="listingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#22d3ee"/>
                          <stop offset="100%" stopColor="#06b6d4"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <h3
                    className="text-xl font-semibold text-white mb-2"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    No Active Listings
                  </h3>
                  <p className="mb-4" style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}>
                    List a Mek you want to trade and specify the variations you're looking for
                  </p>
                  <button
                    onClick={() => setShowCreateListing(true)}
                    className="px-8 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      background: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
                      color: 'black',
                      boxShadow: '0 0 30px rgba(34, 211, 238, 0.4)',
                    }}
                  >
                    Create Your First Listing
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myListings.map((listing: any) => (
                  <TradeListingCard
                    key={listing._id}
                    listing={listing}
                    viewerStakeAddress={stakeAddress || undefined}
                    isOwner={true}
                    pendingOfferCount={listing.pendingOfferCount}
                    newOfferCount={listing.newOfferCount}
                    onViewOffers={() => setSelectedListingForViewOffers(listing)}
                    onEditListing={() => setSelectedListingForEdit(listing)}
                    onCancel={() => handleCancelListing(listing._id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Offers Tab */}
        {stakeAddress && activeTab === "my-offers" && (
          <div>
            {myOffers === undefined ? (
              <div
                className="text-center py-12"
                style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}
              >
                Loading your offers...
              </div>
            ) : myOffers.length === 0 ? (
              <div
                className="text-center py-12 rounded-2xl relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div className="relative z-10">
                  {/* Space Age Handshake Icon */}
                  <div className="mb-4 flex justify-center">
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 80 80"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        filter: 'drop-shadow(0 0 15px rgba(34, 211, 238, 0.4))',
                      }}
                    >
                      <circle cx="40" cy="40" r="30" stroke="url(#offerGradient)" strokeWidth="1.5" opacity="0.3"/>
                      <path
                        d="M22 42c0-1 0.5-2 1.5-2.5l6-2.5c1-0.4 2-0.2 2.8 0.5l4 3.5c0.8 0.7 1.2 1.8 1 2.8l-0.5 2"
                        stroke="url(#offerGradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <path
                        d="M58 42c0-1-0.5-2-1.5-2.5l-6-2.5c-1-0.4-2-0.2-2.8 0.5l-4 3.5c-0.8 0.7-1.2 1.8-1 2.8l0.5 2"
                        stroke="url(#offerGradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <path
                        d="M35 41l2.5 2c1 0.8 2.5 0.8 3.5 0l2.5-2"
                        stroke="url(#offerGradient)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <path d="M40 28v-4" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                      <path d="M48 31l2-3" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                      <path d="M32 31l-2-3" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                      <defs>
                        <linearGradient id="offerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#22d3ee"/>
                          <stop offset="100%" stopColor="#06b6d4"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <h3
                    className="text-xl font-semibold text-white mb-2"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    No Pending Offers
                  </h3>
                  <p style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.5)' }}>
                    Browse listings to find Meks you want and make offers
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myOffers.map((offer: any) => (
                  <OfferCard
                    key={offer._id}
                    offer={offer}
                    onWithdraw={() => handleWithdrawOffer(offer._id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sliding particles animation keyframe */}
      <style>{`
        @keyframes slideParticles {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Create Listing Lightbox */}
      {showCreateListing && stakeAddress && (
        <CreateListingLightbox
          stakeAddress={stakeAddress}
          onClose={() => setShowCreateListing(false)}
          onSuccess={() => setActiveTab("my-listings")}
        />
      )}

      {/* Make Offer Lightbox */}
      {selectedListingForOffer && stakeAddress && (
        <MatchingMeksLightbox
          listing={selectedListingForOffer}
          viewerStakeAddress={stakeAddress}
          onClose={() => setSelectedListingForOffer(null)}
        />
      )}

      {/* View Offers Lightbox */}
      {selectedListingForViewOffers && stakeAddress && (
        <ViewOffersLightbox
          listing={selectedListingForViewOffers}
          ownerStakeAddress={stakeAddress}
          onClose={() => setSelectedListingForViewOffers(null)}
        />
      )}

      {/* Edit Listing Lightbox */}
      {selectedListingForEdit && (
        <EditListingLightbox
          listing={selectedListingForEdit}
          onClose={() => setSelectedListingForEdit(null)}
        />
      )}

      {/* Confirmation Lightbox */}
      {confirmAction && (
        <ConfirmationLightbox
          title={confirmAction.title}
          message={confirmAction.message}
          confirmText={confirmAction.type === "cancel-listing" ? "Cancel Listing" : "Withdraw"}
          confirmStyle="danger"
          onConfirm={executeConfirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Unlock More Slots Informative Lightbox */}
      {mounted && showUnlockSlotsLightbox && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowUnlockSlotsLightbox(false)}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          />

          {/* Content */}
          <div
            className="relative max-w-md w-full p-6 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="text-center mb-4">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1))',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2
              className="text-xl font-bold text-center text-white mb-3"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              Unlock More Listing Slots
            </h2>

            {/* Description */}
            <p
              className="text-center mb-6"
              style={{ fontFamily: 'Play, sans-serif', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}
            >
              Additional listing slots can be unlocked by playing the game and accumulating achievement points. Keep exploring, trading, and completing challenges to expand your trading capacity!
            </p>

            {/* Info Box */}
            <div
              className="p-4 rounded-lg mb-6"
              style={{
                background: 'rgba(34, 211, 238, 0.1)',
                border: '1px solid rgba(34, 211, 238, 0.2)',
              }}
            >
              <div
                className="text-sm text-center"
                style={{ fontFamily: 'Play, sans-serif', color: '#22d3ee' }}
              >
                Current Limit: <span className="font-bold">5 Active Listings</span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowUnlockSlotsLightbox(false)}
              className="w-full py-3 rounded-xl font-medium transition-all hover:brightness-110"
              style={{
                fontFamily: 'Inter, sans-serif',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              Got It
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
