"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { COMPLETE_VARIATION_RARITY } from "@/lib/completeVariationRarity";
import { getMediaUrl } from "@/lib/media-url";

// ============================================================================
// TYPES
// ============================================================================
type InventoryTab = 'meks' | 'items' | 'essence' | 'frames' | 'achievements';
type ItemFilter = 'all' | 'head' | 'body' | 'trait';
type SortOption = 'name' | 'rarity' | 'quantity' | 'recent';

interface TabConfig {
  id: InventoryTab;
  name: string;
  icon: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const INVENTORY_TABS: TabConfig[] = [
  { id: 'meks', name: 'Meks', icon: '🤖' },
  { id: 'items', name: 'Items', icon: '🔧' },
  { id: 'essence', name: 'Essence', icon: '💎' },
  { id: 'frames', name: 'Frames', icon: '🖼️' },
  { id: 'achievements', name: 'Achievements', icon: '🏆' },
];

const ITEM_FILTERS: { id: ItemFilter; name: string }[] = [
  { id: 'all', name: 'All' },
  { id: 'head', name: 'Heads' },
  { id: 'body', name: 'Bodies' },
  { id: 'trait', name: 'Traits' },
];

const SORT_OPTIONS: { id: SortOption; name: string }[] = [
  { id: 'name', name: 'Name' },
  { id: 'rarity', name: 'Rarity' },
  { id: 'quantity', name: 'Quantity' },
  { id: 'recent', name: 'Recent' },
];

const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
  mythic: 'text-red-400',
};

const RARITY_BG_COLORS: Record<string, string> = {
  common: 'bg-gray-500/20 border-gray-500/40',
  uncommon: 'bg-green-500/20 border-green-500/40',
  rare: 'bg-blue-500/20 border-blue-500/40',
  epic: 'bg-purple-500/20 border-purple-500/40',
  legendary: 'bg-yellow-500/20 border-yellow-500/40',
  mythic: 'bg-red-500/20 border-red-500/40',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function InventoryPage() {
  // State
  const [activeTab, setActiveTab] = useState<InventoryTab>('meks');
  const [itemFilter, setItemFilter] = useState<ItemFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedMek, setSelectedMek] = useState<string | null>(null);

  // User/wallet state
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Refs for dropdowns
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Convex mutations
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);

  // Initialize user from localStorage
  useEffect(() => {
    setMounted(true);
    const initUser = async () => {
      try {
        const storedWallet = localStorage.getItem('walletAddress') || localStorage.getItem('stakeAddress');
        if (storedWallet) {
          setWalletAddress(storedWallet);
          const user = await getOrCreateUser({ walletAddress: storedWallet });
          if (user) {
            setUserId(user._id as Id<"users">);
          }
        }
      } catch (error) {
        console.error('[INVENTORY] Error initializing user:', error);
      }
    };
    initUser();
  }, []);

  // Convex queries
  const userMeks = useQuery(
    api.meks.getMeksByOwner,
    walletAddress ? { owner: walletAddress } : "skip"
  );

  const essenceState = useQuery(
    api.essence.getPlayerEssenceState,
    walletAddress ? { walletAddress } : "skip"
  );

  const userProfile = useQuery(
    api.users.getUserProfile,
    walletAddress ? { walletAddress } : "skip"
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(target)) {
        setSortDropdownOpen(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(target)) {
        setFilterDropdownOpen(false);
      }
    };

    if (sortDropdownOpen || filterDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [sortDropdownOpen, filterDropdownOpen]);

  // Get essence balances with amounts
  const essenceBalances = (essenceState?.balances || [])
    .filter((b: { accumulatedAmount: number }) => b.accumulatedAmount > 0)
    .sort((a: { accumulatedAmount: number }, b: { accumulatedAmount: number }) =>
      b.accumulatedAmount - a.accumulatedAmount
    );

  // Helper to get Mek image path
  const getMekImagePath = (sourceKey: string) => {
    const cleanKey = sourceKey
      .replace(/-[A-Z]$/, '')
      .toLowerCase();
    return `/mek-images/150px/${cleanKey}.webp`;
  };

  // Helper to get essence image path
  const getEssenceImagePath = (variationName: string): string => {
    const sanitized = variationName
      .replace(/\s+essence$/i, '')
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
    return `/essence-images/named-bottles-1k/${sanitized}.png`;
  };

  // Get rarity tier from variation
  const getVariationRarity = (name: string): string => {
    const variation = COMPLETE_VARIATION_RARITY.find(v => v.name === name);
    return variation?.tier || 'common';
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'meks':
        return <MeksTab meks={userMeks || []} selectedMek={selectedMek} onSelectMek={setSelectedMek} getMekImagePath={getMekImagePath} />;
      case 'items':
        return <ItemsTab filter={itemFilter} searchTerm={searchTerm} />;
      case 'essence':
        return <EssenceTab balances={essenceBalances} getEssenceImagePath={getEssenceImagePath} getVariationRarity={getVariationRarity} />;
      case 'frames':
        return <FramesTab equippedFrame={userProfile?.profileFrame} />;
      case 'achievements':
        return <AchievementsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Background with subtle gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(34, 211, 238, 0.03) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1
            className="text-4xl font-bold tracking-wider mb-2"
            style={{
              fontFamily: 'Orbitron, sans-serif',
              color: '#fab617',
              textShadow: '0 0 20px rgba(250, 182, 23, 0.3)',
            }}
          >
            INVENTORY
          </h1>
          <p className="text-white/60" style={{ fontFamily: 'Play, sans-serif' }}>
            Manage your Meks, items, essence, and collectibles
          </p>
        </div>

        {/* Tab Navigation - Space Age Style */}
        <div className="mb-6">
          <div
            className="inline-flex gap-2 p-2 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {INVENTORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-5 py-3 rounded-lg font-medium transition-all duration-300 overflow-hidden group ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/80'
                }`}
                style={{
                  fontFamily: 'Saira, sans-serif',
                  background: activeTab === tab.id
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))'
                    : 'transparent',
                  border: activeTab === tab.id
                    ? '1px solid rgba(255,255,255,0.3)'
                    : '1px solid transparent',
                  boxShadow: activeTab === tab.id
                    ? '0 0 20px rgba(255,255,255,0.1)'
                    : 'none',
                }}
              >
                {/* Honeycomb hover effect */}
                <div
                  className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-[0.07]"
                  style={{
                    backgroundImage: `url('/random-images/honey-png-big.webp')`,
                    backgroundSize: '750px',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'repeat',
                  }}
                />
                {/* Sliding particles for active tab */}
                {activeTab === tab.id && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                      animation: 'slideParticles 4s linear infinite',
                    }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <span>{tab.icon}</span>
                  <span className="uppercase tracking-wider text-sm">{tab.name}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filters Row */}
        {(activeTab === 'meks' || activeTab === 'items' || activeTab === 'essence') && (
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            {/* Search Input */}
            <div className="flex-1 min-w-[280px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full px-4 py-3 text-white placeholder-white/30 focus:outline-none transition-all"
                style={{
                  fontFamily: 'Play, sans-serif',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                }}
              />
            </div>

            {/* Filter Dropdown (for Items tab) */}
            {activeTab === 'items' && (
              <div className="relative" ref={filterDropdownRef}>
                <button
                  onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                  className="px-4 py-3 flex items-center gap-2 text-white/80 hover:text-white transition-all"
                  style={{
                    fontFamily: 'Play, sans-serif',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                  }}
                >
                  <span>Filter: {ITEM_FILTERS.find(f => f.id === itemFilter)?.name}</span>
                  <svg className={`w-4 h-4 transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {filterDropdownOpen && mounted && createPortal(
                  <div
                    className="fixed z-[9999] py-2 min-w-[150px]"
                    style={{
                      top: filterDropdownRef.current?.getBoundingClientRect().bottom! + 8,
                      left: filterDropdownRef.current?.getBoundingClientRect().left,
                      background: 'linear-gradient(135deg, rgba(20,20,20,0.98), rgba(10,10,10,0.98))',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                    }}
                  >
                    {ITEM_FILTERS.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => {
                          setItemFilter(filter.id);
                          setFilterDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left transition-colors ${
                          itemFilter === filter.id
                            ? 'text-cyan-400 bg-cyan-500/10'
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                        style={{ fontFamily: 'Play, sans-serif' }}
                      >
                        {filter.name}
                      </button>
                    ))}
                  </div>,
                  document.body
                )}
              </div>
            )}

            {/* Sort Dropdown */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="px-4 py-3 flex items-center gap-2 text-white/80 hover:text-white transition-all"
                style={{
                  fontFamily: 'Play, sans-serif',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                }}
              >
                <span>Sort: {SORT_OPTIONS.find(s => s.id === sortBy)?.name}</span>
                <svg className={`w-4 h-4 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {sortDropdownOpen && mounted && createPortal(
                <div
                  className="fixed z-[9999] py-2 min-w-[150px]"
                  style={{
                    top: sortDropdownRef.current?.getBoundingClientRect().bottom! + 8,
                    left: sortDropdownRef.current?.getBoundingClientRect().left,
                    background: 'linear-gradient(135deg, rgba(20,20,20,0.98), rgba(10,10,10,0.98))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                  }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setSortBy(option.id);
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left transition-colors ${
                        sortBy === option.id
                          ? 'text-cyan-400 bg-cyan-500/10'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                      style={{ fontFamily: 'Play, sans-serif' }}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>,
                document.body
              )}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {renderTabContent()}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slideParticles {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// MEKS TAB COMPONENT
// ============================================================================
interface MeksTabProps {
  meks: any[];
  selectedMek: string | null;
  onSelectMek: (id: string | null) => void;
  getMekImagePath: (sourceKey: string) => string;
}

function MeksTab({ meks, selectedMek, onSelectMek, getMekImagePath }: MeksTabProps) {
  if (!meks || meks.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🤖</div>
        <h3 className="text-xl font-semibold text-white/80 mb-2" style={{ fontFamily: 'Saira, sans-serif' }}>
          No Meks Found
        </h3>
        <p className="text-white/50 mb-6" style={{ fontFamily: 'Play, sans-serif' }}>
          Connect your wallet to see your Meks, or acquire some from the marketplace.
        </p>
        <a
          href="/essence-market"
          className="inline-block px-6 py-3 rounded-xl font-semibold transition-all"
          style={{
            fontFamily: 'Inter, sans-serif',
            background: 'linear-gradient(to right, #22d3ee, #06b6d4)',
            color: 'black',
          }}
        >
          Visit Marketplace
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {meks.map((mek) => (
        <div
          key={mek._id}
          onClick={() => onSelectMek(selectedMek === mek._id ? null : mek._id)}
          className="relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
            border: selectedMek === mek._id
              ? '2px solid rgba(34, 211, 238, 0.6)'
              : '1px solid rgba(255,255,255,0.1)',
            boxShadow: selectedMek === mek._id
              ? '0 0 30px rgba(34, 211, 238, 0.2)'
              : 'none',
          }}
        >
          {/* Honeycomb hover */}
          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-[0.05]"
            style={{
              backgroundImage: `url('/random-images/honey-png-big.webp')`,
              backgroundSize: '750px',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat',
            }}
          />

          {/* Mek Image */}
          <div className="relative aspect-square bg-black/30 flex items-center justify-center">
            {mek.sourceKey ? (
              <img
                src={getMekImagePath(mek.sourceKey)}
                alt={mek.assetName || 'Mek'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="text-6xl">🤖</span>
            )}

            {/* Rarity Badge */}
            <div
              className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold uppercase"
              style={{
                background: 'rgba(0,0,0,0.7)',
                color: mek.rarityTier === 'legendary' ? '#fab617'
                     : mek.rarityTier === 'epic' ? '#a855f7'
                     : mek.rarityTier === 'rare' ? '#3b82f6'
                     : '#9ca3af',
                fontFamily: 'Saira, sans-serif',
              }}
            >
              {mek.rarityTier || 'Common'}
            </div>

            {/* Slotted indicator */}
            {mek.isSlotted && (
              <div
                className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold"
                style={{
                  background: 'rgba(34, 211, 238, 0.2)',
                  border: '1px solid rgba(34, 211, 238, 0.5)',
                  color: '#22d3ee',
                  fontFamily: 'Saira, sans-serif',
                }}
              >
                SLOTTED
              </div>
            )}
          </div>

          {/* Mek Info */}
          <div className="p-4">
            <h3
              className="font-semibold text-white truncate mb-2"
              style={{ fontFamily: 'Saira, sans-serif' }}
            >
              {mek.assetName || `Mek #${mek.assetId}`}
            </h3>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Head</span>
                <span className="text-white/80">{mek.headVariation || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Body</span>
                <span className="text-white/80">{mek.bodyVariation || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Trait</span>
                <span className="text-white/80">{mek.itemVariation || '-'}</span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-sm">
              <div>
                <span className="text-white/40 text-xs">Level</span>
                <div className="text-cyan-400 font-bold">{mek.level || 1}</div>
              </div>
              <div className="text-right">
                <span className="text-white/40 text-xs">Power</span>
                <div className="text-yellow-400 font-bold">{(mek.powerScore || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Expanded Actions */}
          {selectedMek === mek._id && (
            <div className="p-4 pt-0 space-y-2">
              <button
                className="w-full py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: 'linear-gradient(to right, #22d3ee, #06b6d4)',
                  color: 'black',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                View Details
              </button>
              <button
                className="w-full py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {mek.isSlotted ? 'Unslot' : 'Slot for Essence'}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// ITEMS TAB COMPONENT
// ============================================================================
interface ItemsTabProps {
  filter: ItemFilter;
  searchTerm: string;
}

function ItemsTab({ filter, searchTerm }: ItemsTabProps) {
  // TODO: Connect to real Convex query for crafted items
  const items: any[] = [];

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🔧</div>
        <h3 className="text-xl font-semibold text-white/80 mb-2" style={{ fontFamily: 'Saira, sans-serif' }}>
          No Items Yet
        </h3>
        <p className="text-white/50 mb-6" style={{ fontFamily: 'Play, sans-serif' }}>
          Craft items using essence to see them here.
        </p>
        <a
          href="/crafting"
          className="inline-block px-6 py-3 rounded-xl font-semibold transition-all"
          style={{
            fontFamily: 'Inter, sans-serif',
            background: 'linear-gradient(to right, #fab617, #f59e0b)',
            color: 'black',
          }}
        >
          Go to Crafting
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {/* Items would render here */}
    </div>
  );
}

// ============================================================================
// ESSENCE TAB COMPONENT
// ============================================================================
interface EssenceTabProps {
  balances: any[];
  getEssenceImagePath: (name: string) => string;
  getVariationRarity: (name: string) => string;
}

function EssenceTab({ balances, getEssenceImagePath, getVariationRarity }: EssenceTabProps) {
  if (!balances || balances.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">💎</div>
        <h3 className="text-xl font-semibold text-white/80 mb-2" style={{ fontFamily: 'Saira, sans-serif' }}>
          No Essence Collected
        </h3>
        <p className="text-white/50 mb-6" style={{ fontFamily: 'Play, sans-serif' }}>
          Slot your Meks to start collecting essence over time.
        </p>
        <a
          href="/home"
          className="inline-block px-6 py-3 rounded-xl font-semibold transition-all"
          style={{
            fontFamily: 'Inter, sans-serif',
            background: 'linear-gradient(to right, #a855f7, #8b5cf6)',
            color: 'white',
          }}
        >
          Manage Slots
        </a>
      </div>
    );
  }

  // Calculate summary stats
  const totalTypes = balances.length;
  const totalAmount = balances.reduce((sum: number, b: { accumulatedAmount: number }) => sum + b.accumulatedAmount, 0);
  const mostAbundant = balances[0];

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Total Types" value={totalTypes.toString()} icon="📊" />
        <SummaryCard label="Total Essence" value={totalAmount.toFixed(1)} icon="💎" />
        <SummaryCard label="Most Abundant" value={mostAbundant?.variationName || '-'} icon="👑" />
        <SummaryCard label="Unique" value={`${totalTypes}/291`} icon="✨" />
      </div>

      {/* Essence Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {balances.map((balance: { variationName: string; accumulatedAmount: number; variationType?: string }) => {
          const rarity = getVariationRarity(balance.variationName);
          return (
            <div
              key={balance.variationName}
              className="relative group rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {/* Honeycomb hover */}
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-[0.05]"
                style={{
                  backgroundImage: `url('/random-images/honey-png-big.webp')`,
                  backgroundSize: '750px',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'repeat',
                }}
              />

              {/* Bottle Image */}
              <div className="relative aspect-square bg-black/20 flex items-center justify-center p-4">
                <img
                  src={getEssenceImagePath(balance.variationName)}
                  alt={balance.variationName}
                  className="w-full h-full object-contain drop-shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/essence-images/default-bottle.png';
                  }}
                />

                {/* Rarity glow */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: rarity === 'legendary'
                      ? 'radial-gradient(circle at center, rgba(250,182,23,0.15) 0%, transparent 70%)'
                      : rarity === 'epic'
                      ? 'radial-gradient(circle at center, rgba(168,85,247,0.15) 0%, transparent 70%)'
                      : 'none',
                  }}
                />
              </div>

              {/* Info */}
              <div className="p-3">
                <h4
                  className="font-semibold text-white text-sm truncate mb-1"
                  style={{ fontFamily: 'Saira, sans-serif' }}
                >
                  {balance.variationName}
                </h4>
                <div className="flex items-baseline justify-between">
                  <span
                    className={`text-xs uppercase ${RARITY_COLORS[rarity] || 'text-gray-400'}`}
                    style={{ fontFamily: 'Play, sans-serif' }}
                  >
                    {rarity}
                  </span>
                  <span
                    className="text-lg font-bold text-cyan-400"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    {balance.accumulatedAmount.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// FRAMES TAB COMPONENT
// ============================================================================
interface FramesTabProps {
  equippedFrame?: string;
}

function FramesTab({ equippedFrame }: FramesTabProps) {
  // Frame definitions
  const frames = [
    { id: 'bronze', name: 'Bronze Frame', description: 'Standard frame for all players', rarity: 'common', unlocked: true },
    { id: 'silver', name: 'Silver Frame', description: 'Reach level 10 to unlock', rarity: 'uncommon', unlocked: false },
    { id: 'gold', name: 'Gold Frame', description: 'Reach level 25 to unlock', rarity: 'rare', unlocked: false },
    { id: 'platinum', name: 'Platinum Frame', description: 'Reach level 50 to unlock', rarity: 'epic', unlocked: false },
    { id: 'diamond', name: 'Diamond Frame', description: 'Own 10+ Meks to unlock', rarity: 'legendary', unlocked: false },
    { id: 'wren-prestige', name: 'Wren Prestige', description: 'Own all 3 Wren variations', rarity: 'mythic', unlocked: false },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {frames.map((frame) => (
          <div
            key={frame.id}
            className={`relative group rounded-xl overflow-hidden transition-all duration-300 ${
              frame.unlocked ? 'hover:scale-[1.02] cursor-pointer' : 'opacity-50'
            }`}
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
              border: equippedFrame === frame.id
                ? '2px solid rgba(34, 211, 238, 0.6)'
                : '1px solid rgba(255,255,255,0.1)',
              boxShadow: equippedFrame === frame.id
                ? '0 0 30px rgba(34, 211, 238, 0.2)'
                : 'none',
            }}
          >
            {/* Locked overlay */}
            {!frame.unlocked && (
              <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
                <span className="text-4xl">🔒</span>
              </div>
            )}

            {/* Frame preview */}
            <div className="aspect-square bg-black/30 flex items-center justify-center p-6">
              <div
                className={`w-full h-full rounded-lg border-4 ${RARITY_BG_COLORS[frame.rarity] || ''}`}
                style={{
                  borderColor: frame.rarity === 'legendary' ? '#fab617'
                    : frame.rarity === 'epic' ? '#a855f7'
                    : frame.rarity === 'rare' ? '#3b82f6'
                    : frame.rarity === 'uncommon' ? '#22c55e'
                    : frame.rarity === 'mythic' ? '#ef4444'
                    : '#6b7280',
                }}
              >
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  🖼️
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <h4
                className="font-semibold text-white mb-1"
                style={{ fontFamily: 'Saira, sans-serif' }}
              >
                {frame.name}
              </h4>
              <p className="text-xs text-white/50 mb-3" style={{ fontFamily: 'Play, sans-serif' }}>
                {frame.description}
              </p>

              {frame.unlocked ? (
                <button
                  className="w-full py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: equippedFrame === frame.id
                      ? 'rgba(34, 211, 238, 0.2)'
                      : 'rgba(255,255,255,0.1)',
                    border: equippedFrame === frame.id
                      ? '1px solid rgba(34, 211, 238, 0.5)'
                      : '1px solid rgba(255,255,255,0.2)',
                    color: equippedFrame === frame.id ? '#22d3ee' : 'white',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {equippedFrame === frame.id ? 'Equipped' : 'Equip'}
                </button>
              ) : (
                <div
                  className={`text-center text-xs uppercase tracking-wider ${RARITY_COLORS[frame.rarity]}`}
                  style={{ fontFamily: 'Saira, sans-serif' }}
                >
                  {frame.rarity}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ACHIEVEMENTS TAB COMPONENT
// ============================================================================
function AchievementsTab() {
  // Achievement definitions
  const achievements = [
    { id: 'first-mek', name: 'First Mek', description: 'Acquire your first Mek', progress: 100, icon: '🎉' },
    { id: 'collector', name: 'Collector', description: 'Own 10 different Meks', progress: 40, icon: '📦' },
    { id: 'essence-master', name: 'Essence Master', description: 'Collect 100 total essence', progress: 75, icon: '💎' },
    { id: 'crafter', name: 'Master Crafter', description: 'Craft 50 items', progress: 20, icon: '🔨' },
    { id: 'trader', name: 'Market Maven', description: 'Complete 25 marketplace trades', progress: 0, icon: '💰' },
  ];

  return (
    <div className="space-y-3">
      {achievements.map((achievement) => (
        <div
          key={achievement.id}
          className="relative group rounded-xl overflow-hidden transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
            border: achievement.progress === 100
              ? '1px solid rgba(34, 211, 238, 0.4)'
              : '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-4 p-4">
            {/* Icon */}
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                achievement.progress === 100
                  ? 'bg-cyan-500/20 border border-cyan-500/40'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {achievement.progress === 100 ? '✅' : achievement.icon}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4
                  className={`font-semibold ${achievement.progress === 100 ? 'text-cyan-400' : 'text-white'}`}
                  style={{ fontFamily: 'Saira, sans-serif' }}
                >
                  {achievement.name}
                </h4>
                {achievement.progress === 100 && (
                  <span className="text-xs text-cyan-400" style={{ fontFamily: 'Play, sans-serif' }}>
                    COMPLETE
                  </span>
                )}
              </div>
              <p className="text-sm text-white/50 mb-2" style={{ fontFamily: 'Play, sans-serif' }}>
                {achievement.description}
              </p>

              {/* Progress bar */}
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${achievement.progress}%`,
                    background: achievement.progress === 100
                      ? 'linear-gradient(to right, #22d3ee, #06b6d4)'
                      : 'linear-gradient(to right, #fab617, #f59e0b)',
                  }}
                />
              </div>
            </div>

            {/* Progress percentage */}
            <div
              className="text-xl font-bold"
              style={{
                fontFamily: 'Orbitron, sans-serif',
                color: achievement.progress === 100 ? '#22d3ee' : '#fab617',
              }}
            >
              {achievement.progress}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================
interface SummaryCardProps {
  label: string;
  value: string;
  icon: string;
}

function SummaryCard({ label, value, icon }: SummaryCardProps) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-white/50 uppercase tracking-wider" style={{ fontFamily: 'Play, sans-serif' }}>
          {label}
        </span>
      </div>
      <div
        className="text-xl font-bold text-white truncate"
        style={{ fontFamily: 'Orbitron, sans-serif' }}
      >
        {value}
      </div>
    </div>
  );
}
