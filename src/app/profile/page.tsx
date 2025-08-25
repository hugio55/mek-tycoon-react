"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";
import MekImage from "@/components/MekImage";
import BackgroundEffects from "@/components/BackgroundEffects";

export default function MyMeksPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [walletAddress, setWalletAddress] = useState<string>("demo_wallet_123");
  const [filterEmployment, setFilterEmployment] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedMeks, setLoadedMeks] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20; // Load 20 meks at a time
  
  // Get or create user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  
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
  const meksData = useQuery(api.meks.getMeksPaginated, { 
    owner: walletAddress,
    page: currentPage,
    pageSize: pageSize
  });
  
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
    { id: "1234", name: "Demo Mek #1234", level: 5, goldRate: 15.5, employed: true, headVariation: "000-000-000", bodyVariation: "000-000-000", sourceKey: null, sourceKeyBase: null },
    { id: "2468", name: "Demo Mek #2468", level: 3, goldRate: 8.2, employed: false, headVariation: "000-000-000", bodyVariation: "000-000-000", sourceKey: null, sourceKeyBase: null },
    { id: "3691", name: "Demo Mek #3691", level: 7, goldRate: 22.1, employed: true, headVariation: "000-000-000", bodyVariation: "000-000-000", sourceKey: null, sourceKeyBase: null },
    { id: "0013", name: "Demo Mek #0013", level: 10, goldRate: 35.0, employed: true, headVariation: "000-000-000", bodyVariation: "000-000-000", sourceKey: null, sourceKeyBase: null },
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
  
  // Sort meks
  filteredMeks.sort((a, b) => {
    switch(sortBy) {
      case "employed":
        return (b.employed ? 1 : 0) - (a.employed ? 1 : 0);
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
  
  return (
    <div className="text-white relative overflow-hidden">
      <BackgroundEffects />
      
      {/* Compact Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-yellow-400">
          MY MEKS
        </h1>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-400">Total:</span> 
            <span className="text-yellow-400 font-bold ml-2">{collectionStats.totalMeks}</span>
          </div>
          <div>
            <span className="text-green-400">Employed:</span> 
            <span className="text-white font-bold ml-2">{collectionStats.employedCount}</span>
          </div>
          <div>
            <span className="text-gray-400">Unemployed:</span> 
            <span className="text-white font-bold ml-2">{collectionStats.unemployedCount}</span>
          </div>
          <div>
            <span className="text-yellow-400">Gold/hr:</span> 
            <span className="text-white font-bold ml-2">{collectionStats.totalGoldRate.toFixed(1)}</span>
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
            className="flex-1 px-4 py-3 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-2 border-yellow-500/30 rounded-lg text-yellow-400 placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:shadow-[0_0_15px_rgba(250,182,23,0.3)] transition-all"
          />
          
          <select
            value={filterEmployment}
            onChange={(e) => {
              setFilterEmployment(e.target.value);
              setCurrentPage(1); // Reset pagination on filter change
            }}
            className="px-4 py-3 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-2 border-yellow-500/30 rounded-lg text-yellow-400 focus:outline-none focus:border-yellow-400 transition-all"
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
            className="px-4 py-3 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-2 border-yellow-500/30 rounded-lg text-yellow-400 focus:outline-none focus:border-yellow-400 transition-all"
          >
            <option value="name">Sort by Name</option>
            <option value="employed">Sort by Employment</option>
            <option value="level">Sort by Level</option>
            <option value="goldRate">Sort by Gold Rate</option>
          </select>
        </div>
      </div>
      
      {/* Meks Collection Grid - Larger Images */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
        {filteredMeks.map(mek => {
          return (
            <Link
              key={mek.id}
              href={`/mek/${mek.id}`}
              className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105 block"
              style={{
                background: mek.employed 
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(26, 26, 26, 0.95) 100%)'
                  : 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(42, 42, 42, 0.95) 100%)',
                border: mek.employed ? '2px solid #22c55e' : '2px solid #6b7280',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: mek.employed 
                  ? '0 4px 20px rgba(34, 197, 94, 0.3)'
                  : '0 4px 20px rgba(0,0,0,0.5)',
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
              
              {/* Mek Image - Larger */}
              <div className="relative mb-3 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-lg overflow-hidden"
                style={{ aspectRatio: '1' }}
              >
                <MekImage 
                  src={mek.iconUrl}
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
                <h3 className="font-bold text-yellow-400 text-sm mb-2">{mek.name}</h3>
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
                
                {/* Talent Tree Button */}
                <Link
                  href={`/mek-tree/${mek.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2 inline-block px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-full transition-all"
                >
                  View Tree →
                </Link>
              </div>
              
            </Link>
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
      
      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
}