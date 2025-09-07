"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MekImage from "@/components/MekImage";
import BackgroundEffects from "@/components/BackgroundEffects";

interface MekData {
  id: string;
  name: string;
  level: number;
  goldRate: number;
  employed: boolean;
  headVariation: string;
  bodyVariation: string;
  iconUrl?: string;
  sourceKey?: string | null;
  sourceKeyBase?: string | null;
}

export default function MyMeksPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [walletAddress, setWalletAddress] = useState<string>("demo_wallet_123");
  const [filterEmployment, setFilterEmployment] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedMeks, setLoadedMeks] = useState<MekData[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState<string | null>(null);
  const [unspentXP, setUnspentXP] = useState<number>(25000); // Demo value for unspent XP
  const pageSize = 20; // Load 20 meks at a time
  
  // Get or create user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  
  // Get all saved templates
  const templates = useQuery(api.mekTreeTemplates.getAllTemplates);
  
  useEffect(() => {
    // Get stake address from localStorage (this is what NFTs are associated with)
    const stakeAddress = localStorage.getItem('stakeAddress');
    const paymentAddress = localStorage.getItem('walletAddress');
    
    // Use stake address for NFT lookups, fall back to payment address, then demo
    const addressToUse = stakeAddress || paymentAddress || "demo_wallet_123";
    setWalletAddress(addressToUse);
    
    const initUser = async () => {
      const user = await getOrCreateUser({ 
        walletAddress: addressToUse
      });
      if (user) {
        setUserId(user._id as Id<"users">);
      }
    };
    initUser();
  }, [getOrCreateUser]);
  
  // Fetch user's actual meks from database (using paginated version to save bandwidth)
  const meksData = useQuery(api.meks.getMeksPaginated, 
    walletAddress ? { 
      owner: walletAddress,
      page: currentPage,
      pageSize: pageSize
    } : "skip"
  );
  
  // Update loaded meks when new data arrives
  useEffect(() => {
    if (meksData?.meks) {
      const newMeks = meksData.meks.map(mek => ({
        id: mek.assetId,
        name: mek.assetName,
        level: mek.level || 1,
        goldRate: (mek.level || 1) * 3.5,
        employed: Math.random() > 0.5, // TODO: Get real employment status
        headVariation: mek.headVariation,
        bodyVariation: mek.bodyVariation,
        iconUrl: mek.iconUrl,
        sourceKey: mek.sourceKeyBase,
        sourceKeyBase: mek.sourceKeyBase,
      }));
      
      if (currentPage === 1) {
        setLoadedMeks(newMeks);
      } else {
        setLoadedMeks(prev => [...prev, ...newMeks]);
      }
      
      setHasMore(meksData.pagination.hasNextPage);
    }
  }, [meksData, currentPage]);
  
  // Use loaded meks or demo meks
  const displayMeks = loadedMeks.length > 0 ? loadedMeks : [
    { id: "1234", name: "Demo Mek #1234", level: 5, goldRate: 15.5, employed: true, headVariation: "aa1", bodyVariation: "aa1", sourceKey: "aa1-aa1-cd1", sourceKeyBase: "aa1-aa1-cd1" },
    { id: "2468", name: "Demo Mek #2468", level: 3, goldRate: 8.2, employed: false, headVariation: "bc2", bodyVariation: "dm1", sourceKey: "bc2-dm1-ap1", sourceKeyBase: "bc2-dm1-ap1" },
    { id: "3691", name: "Demo Mek #3691", level: 7, goldRate: 22.1, employed: true, headVariation: "dp2", bodyVariation: "bf4", sourceKey: "dp2-bf4-il2", sourceKeyBase: "dp2-bf4-il2" },
    { id: "0013", name: "Demo Mek #0013", level: 10, goldRate: 35.0, employed: true, headVariation: "hb1", bodyVariation: "gn1", sourceKey: "hb1-gn1-hn1", sourceKeyBase: "hb1-gn1-hn1" },
  ];
  
  // Filter and sort meks
  let filteredMeks = displayMeks.filter(mek => 
    mek.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mek.id.includes(searchQuery)
  );
  
  if (filterEmployment !== "all") {
    filteredMeks = filteredMeks.filter(mek => 
      filterEmployment === "employed" ? mek.employed : !mek.employed
    );
  }
  
  // Sort meks - employed meks always come first
  filteredMeks.sort((a, b) => {
    // First, sort by employment status (employed first)
    if (a.employed !== b.employed) {
      return b.employed ? 1 : -1;
    }
    
    // Then sort by the selected criteria within each employment group
    switch(sortBy) {
      case "employed":
        return 0; // Already sorted by employment above
      case "level":
        return b.level - a.level;
      case "goldRate":
        return b.goldRate - a.goldRate;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
  
  // Calculate collection stats
  const totalMekCount = meksData?.pagination?.totalItems || displayMeks.length;
  const collectionStats = {
    totalMeks: totalMekCount,
    employedCount: displayMeks.filter(m => m.employed).length,
    unemployedCount: displayMeks.filter(m => !m.employed).length,
    totalGoldRate: displayMeks.filter(m => m.employed).reduce((sum, m) => sum + m.goldRate, 0),
  };
  
  // Load more handler
  const loadMore = () => {
    setCurrentPage(prev => prev + 1);
  };
  
  // Show loading state while initializing
  if (!walletAddress) {
    return (
      <div className="text-white relative overflow-hidden min-h-screen flex items-center justify-center">
        <BackgroundEffects />
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🤖</div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-2">Initializing...</h2>
          <p className="text-gray-400">Setting up wallet connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white relative overflow-hidden">
      <BackgroundEffects />
      
      {/* Glass Frame Header */}
      <div className="mb-8 p-6 rounded-xl backdrop-blur-md bg-white/5 border border-white/10" 
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Left - Title and Stats */}
          <div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-3">MY MEKS</h1>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-gray-400">Total:</span>
                <span className="text-white font-bold">{collectionStats.totalMeks}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-400">Employed:</span>
                <span className="text-white font-bold">{collectionStats.employedCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-gray-400">Idle:</span>
                <span className="text-white font-bold">{collectionStats.unemployedCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-gray-400">Gold/hr:</span>
                <span className="text-yellow-400 font-bold">{collectionStats.totalGoldRate.toFixed(1)}</span>
              </div>
            </div>
          </div>
          
          {/* Center - XP Display */}
          <div className="text-center">
            <div 
              className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-1"
              style={{
                fontFamily: "'Orbitron', 'Rajdhani', 'Bebas Neue', sans-serif",
                fontWeight: 900,
              }}
            >
              {unspentXP.toLocaleString()}
            </div>
            <div className="text-gray-400 text-sm mb-3">Unspent Experience</div>
            <Link 
              href="/xp-allocation"
              className="inline-block px-8 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold rounded-lg hover:from-yellow-400 hover:to-yellow-300 transition-all transform hover:scale-105 shadow-lg"
            >
              Assign XP
            </Link>
          </div>
          
          {/* Right - Stats */}
          <div className="text-right">
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold text-yellow-400">B+</div>
                <div className="text-xs text-gray-400">Average Rank</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">30/54</div>
                <div className="text-xs text-gray-400">Slots Filled</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      
      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset pagination on search
            }}
            placeholder="Search your meks..."
            className="flex-1 px-3 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-yellow-400/30 focus:bg-white/10 transition-all"
            style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          />
          
          <select
            value={filterEmployment}
            onChange={(e) => {
              setFilterEmployment(e.target.value);
              setCurrentPage(1); // Reset pagination on filter change
            }}
            className="px-3 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-400/30 focus:bg-white/10 transition-all appearance-none cursor-pointer"
            style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <option value="all">All Meks</option>
            <option value="employed">Employed</option>
            <option value="unemployed">Unemployed</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1); // Reset pagination on sort change
            }}
            className="px-3 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-400/30 focus:bg-white/10 transition-all appearance-none cursor-pointer"
            style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <option value="name">Sort by Name</option>
            <option value="employed">Sort by Employment</option>
            <option value="level">Sort by Level</option>
            <option value="goldRate">Sort by Gold Rate</option>
          </select>
        </div>
      </div>
      
      {/* Meks Collection Grid - Larger Images */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6 mb-8 overflow-visible">
        {filteredMeks.map(mek => {
          return (
            <div
              key={mek.id}
              onClick={() => router.push(`/mek/${mek.id}`)}
              className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105 block"
              style={{
                background: mek.employed 
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(26, 26, 26, 0.8) 100%)'
                  : 'linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(42, 42, 42, 0.8) 100%)',
                border: mek.employed ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(107, 114, 128, 0.3)',
                borderRadius: '12px',
                padding: '10px',
                boxShadow: mek.employed 
                  ? '0 2px 10px rgba(34, 197, 94, 0.15)'
                  : '0 2px 10px rgba(0,0,0,0.3)',
              }}
            >
              {/* Employment Status Badge */}
              <div 
                className={`absolute top-2 right-2 z-10 px-3 py-1 rounded-full text-xs font-bold ${
                  mek.employed 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                {mek.employed ? 'EMPLOYED' : 'UNEMPLOYED'}
              </div>
              
              {/* Mek Image - Larger - Not Clickable */}
              <div className="relative mb-3 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-lg overflow-hidden"
                style={{ aspectRatio: '1' }}
              >
                <MekImage 
                  src={mek.sourceKeyBase || mek.iconUrl}
                  headVariation={mek.headVariation} 
                  bodyVariation={mek.bodyVariation}
                  assetId={mek.id}
                  size={200}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                />
                  
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <div className="text-white text-xs">
                    <div>Level: {mek.level}/10</div>
                    <div>Gold Rate: {mek.goldRate}/hr</div>
                  </div>
                </div>
              </div>
              
              {/* Mek Info */}
              <div className="text-center">
                <h3 className="font-bold text-yellow-400 text-sm mb-2">
                  {mek.name}
                </h3>
                <div className="space-y-1">
                  <div className="text-xs">
                    <span className="text-gray-400">Level:</span> 
                    <span className="text-white ml-1">{mek.level}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-400">Rate:</span> 
                    <span className={mek.employed ? "text-green-400 ml-1 font-bold" : "text-gray-500 ml-1 line-through"}>
                      {mek.goldRate}/hr
                    </span>
                  </div>
                </div>
                
                {/* Equipment Indicator - Minimal */}
                <div className="mt-2 flex justify-center gap-3">
                  <div className="text-center">
                    <div className={`w-3 h-3 rounded-full border ${Math.random() > 0.5 ? 'bg-green-500 border-green-400' : 'bg-transparent border-gray-600'}`} />
                    <div className="text-[8px] text-gray-500 mt-0.5">head</div>
                  </div>
                  <div className="text-center">
                    <div className={`w-3 h-3 rounded-full border ${Math.random() > 0.3 ? 'bg-blue-500 border-blue-400' : 'bg-transparent border-gray-600'}`} />
                    <div className="text-[8px] text-gray-500 mt-0.5">body</div>
                  </div>
                  <div className="text-center">
                    <div className={`w-3 h-3 rounded-full border ${Math.random() > 0.7 ? 'bg-purple-500 border-purple-400' : 'bg-transparent border-gray-600'}`} />
                    <div className="text-[8px] text-gray-500 mt-0.5">item</div>
                  </div>
                </div>
              </div>
              
            </div>
          );
        })}
      </div>
      
      {/* Load More Button */}
      {hasMore && filteredMeks.length > 0 && (
        <div className="text-center py-8">
          <button
            onClick={loadMore}
            className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold rounded-lg hover:from-yellow-400 hover:to-yellow-300 transition-all transform hover:scale-105 shadow-lg"
          >
            Load More Meks ({loadedMeks.length} / {totalMekCount})
          </button>
        </div>
      )}
      
      {/* Empty State */}
      {filteredMeks.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-2xl font-bold text-yellow-400 mb-2">No Meks Found</h3>
          <p className="text-gray-400 mb-6">
            {loadedMeks.length === 0 
              ? "You don't have any Meks yet. Visit the marketplace to get started!"
              : "No Meks match your current filters."}
          </p>
          <Link 
            href="/shop"
            className="inline-block px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold rounded-lg hover:from-yellow-400 hover:to-yellow-300 transition-all"
          >
            Visit Marketplace
          </Link>
        </div>
      )}
      
    </div>
  );
}