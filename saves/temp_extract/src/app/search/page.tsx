"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import MekImage from "../../components/MekImage";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRarity, setFilterRarity] = useState("");
  const [filterHead, setFilterHead] = useState("");
  const [filterBody, setFilterBody] = useState("");
  const [sortBy, setSortBy] = useState("rank");
  const [currentPage, setCurrentPage] = useState(1);
  const meksPerPage = 50;

  // Fetch meks with optimized search query
  const meksResult = useQuery(api.meks.searchMeks, {
    headVariation: filterHead || undefined,
    bodyVariation: filterBody || undefined,
    rarityTier: filterRarity || undefined,
    limit: 500, // Get more for client-side filtering
  });
  
  const allMeksData = meksResult;
  
  // Memoize the filtered and sorted meks
  const displayedMeks = useMemo(() => {
    if (!allMeksData || allMeksData.length === 0) {
      return [];
    }

    let filtered = allMeksData;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(mek => 
        mek.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mek.assetId?.toString().includes(searchTerm) ||
        mek.owner?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply rarity filter
    if (filterRarity) {
      filtered = filtered.filter(mek => mek.rarityTier === filterRarity);
    }

    // Apply head filter
    if (filterHead) {
      filtered = filtered.filter(mek => 
        mek.headVariation?.toLowerCase().includes(filterHead.toLowerCase())
      );
    }

    // Apply body filter
    if (filterBody) {
      filtered = filtered.filter(mek => 
        mek.bodyVariation?.toLowerCase().includes(filterBody.toLowerCase())
      );
    }

    // Sort - create a copy before sorting to avoid mutating
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "rank":
          return (a.rarityRank || 9999) - (b.rarityRank || 9999);
        case "level":
          return (b.level || 0) - (a.level || 0);
        case "goldRate":
          const aRate = (a.level || 1) * 3.5;
          const bRate = (b.level || 1) * 3.5;
          return bRate - aRate;
        default:
          return 0;
      }
    });

    return sorted;
  }, [allMeksData, searchTerm, filterRarity, filterHead, filterBody, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRarity, filterHead, filterBody, sortBy]);

  // Pagination
  const indexOfLastMek = currentPage * meksPerPage;
  const indexOfFirstMek = indexOfLastMek - meksPerPage;
  const currentMeks = displayedMeks.slice(indexOfFirstMek, indexOfLastMek);
  const totalPages = Math.ceil(displayedMeks.length / meksPerPage);

  // Get unique values for filters
  const uniqueRarities = useMemo(() => 
    [...new Set((allMeksData || []).map(m => m.rarityTier).filter(Boolean))],
    [allMeksData]
  );
  const uniqueHeads = useMemo(() => 
    [...new Set((allMeksData || []).map(m => m.headVariation).filter(Boolean))].sort(),
    [allMeksData]
  );
  const uniqueBodies = useMemo(() => 
    [...new Set((allMeksData || []).map(m => m.bodyVariation).filter(Boolean))].sort(),
    [allMeksData]
  );

  return (
    <div className="text-white py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-yellow-400">Search All Meks</h1>
        <Link href="/profile" className="text-yellow-400 hover:text-yellow-300">
          ← Back to Profile
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by name, ID, or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-gray-700 rounded border border-gray-600 text-white"
          />
          
          <select
            value={filterRarity}
            onChange={(e) => setFilterRarity(e.target.value)}
            className="px-4 py-2 bg-gray-700 rounded border border-gray-600 text-white"
          >
            <option value="">All Rarities</option>
            {uniqueRarities.map(rarity => (
              <option key={rarity} value={rarity}>{rarity}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-gray-700 rounded border border-gray-600 text-white"
          >
            <option value="rank">Sort by Rank</option>
            <option value="level">Sort by Level</option>
            <option value="goldRate">Sort by Gold Rate</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={filterHead}
            onChange={(e) => setFilterHead(e.target.value)}
            className="px-4 py-2 bg-gray-700 rounded border border-gray-600 text-white"
          >
            <option value="">All Head Types</option>
            {uniqueHeads.map(head => (
              <option key={head} value={head}>{head}</option>
            ))}
          </select>

          <select
            value={filterBody}
            onChange={(e) => setFilterBody(e.target.value)}
            className="px-4 py-2 bg-gray-700 rounded border border-gray-600 text-white"
          >
            <option value="">All Body Types</option>
            {uniqueBodies.map(body => (
              <option key={body} value={body}>{body}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-gray-400 mb-4">
        Found {displayedMeks.length} meks
        {searchTerm && ` matching "${searchTerm}"`}
        {filterRarity && ` (${filterRarity})`}
      </div>

      {/* Meks Grid - 4 columns with bigger images */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {currentMeks.map((mek) => {
          // Extract Mek number from assetId (e.g., "MEK0001" -> "0001")
          const mekNumber = mek.assetId?.replace('MEK', '') || mek.assetId || '????';
          
          // Calculate gold per hour (base rate * level * buffs)
          const baseGoldRate = (mek.level || 1) * 3.5;
          const buffMultiplier = 1.0; // TODO: Get actual buff multiplier from user
          const goldPerHour = baseGoldRate * buffMultiplier;
          
          // Check for equipped items (placeholder - need actual data)
          const hasItems = [false, false, false]; // [head item, body item, trait item]
          
          return (
            <Link
              href={`/mek/${mek.assetId}`}
              key={mek._id}
              className="block bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:bg-gray-700/50 transition-all cursor-pointer"
            >
              {/* Mek Image - Bigger display */}
              <div className="relative mb-2">
                <MekImage
                  src={mek.sourceKeyBase || mek.sourceKey}
                  headVariation={mek.headVariation}
                  bodyVariation={mek.bodyVariation}
                  assetId={mek.assetId}
                  size={200}
                  alt={`Mek #${mekNumber}`}
                  className="w-full aspect-square bg-gray-700 rounded"
                />
                
                {/* Item Slot Indicators - Overlay on image */}
                <div className="absolute bottom-2 right-2 flex gap-1 bg-black/50 p-1 rounded">
                  {hasItems.map((hasItem, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full ${
                        hasItem ? 'bg-yellow-400' : 'bg-gray-600'
                      }`}
                      title={idx === 0 ? "Head Item" : idx === 1 ? "Body Item" : "Trait Item"}
                    />
                  ))}
                </div>
              </div>

              {/* Mek Info - Compact */}
              <div className="space-y-0.5">
                <div className="font-bold text-yellow-400 text-sm">
                  Mek #{mekNumber}
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Rank #{mek.rarityRank || "?"}</span>
                  <span className="text-gray-400">Lvl {mek.level || 1}</span>
                </div>
                <div className="text-xs text-green-400 font-semibold">
                  {goldPerHour.toFixed(1)} g/hr
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600"
          >
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            {[...Array(Math.min(5, totalPages))].map((_, idx) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = idx + 1;
              } else if (currentPage <= 3) {
                pageNum = idx + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + idx;
              } else {
                pageNum = currentPage - 2 + idx;
              }
              
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded ${
                    currentPage === pageNum 
                      ? "bg-yellow-400 text-black" 
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}