"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface MekDetails {
  id: Id<"meks">;
  assetId: string;
  assetName: string;
  rarityRank?: number;
  gameRank?: number;
  rarityTier?: string;
  headVariation: string;
  bodyVariation: string;
  itemVariation?: string;
  goldRate?: number;
  level?: number;
  powerScore?: number;
  iconUrl?: string;
  sourceKey?: string;
  isGenesis?: boolean;
}

export default function MekDetailViewer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"number" | "rank">("number");
  const [selectedMek, setSelectedMek] = useState<MekDetails | null>(null);
  const [showNodeTree, setShowNodeTree] = useState(false);

  // Query all meks from database
  const allMeks = useQuery(api.meks.listAll) as MekDetails[] | undefined;

  // Get success rate configuration
  const successRateConfig = useQuery(api.mekSuccessRates.getConfig);

  // Search/filter meks based on query
  const searchResults = useMemo(() => {
    if (!allMeks || !searchQuery) return [];

    const query = searchQuery.trim().toLowerCase();

    if (searchType === "number") {
      // Search by Mek number/ID
      return allMeks.filter(mek => {
        const mekNumber = mek.assetName.toLowerCase();
        const assetId = mek.assetId.toLowerCase();
        // Debug log to see sourceKey
        if (mek.assetId === "1111") {
          console.log("Mek 1111 data:", mek);
        }
        return mekNumber.includes(query) || assetId.includes(query);
      });
    } else {
      // Search by rank
      const rankNum = parseInt(query);
      if (isNaN(rankNum)) return [];

      return allMeks.filter(mek => {
        return mek.rarityRank === rankNum || mek.gameRank === rankNum;
      });
    }
  }, [allMeks, searchQuery, searchType]);

  // Calculate base success rate for a mek based on rank
  const calculateSuccessRate = (rank: number | undefined): number => {
    if (!rank || !successRateConfig) return 50; // Default if no config

    const { curveType, minSuccess, maxSuccess, steepness, midPoint, totalMeks } = successRateConfig;
    const normalizedRank = rank / totalMeks;
    let normalizedValue: number;

    switch (curveType) {
      case 'linear':
        normalizedValue = 1 - normalizedRank;
        break;
      case 'exponential':
        normalizedValue = Math.pow(1 - normalizedRank, steepness);
        break;
      case 'logarithmic':
        normalizedValue = normalizedRank === 0 ? 1 : Math.max(0, 1 + Math.log10(1 - normalizedRank + 0.1));
        break;
      case 'sigmoid':
        const x = (rank - midPoint) / (totalMeks / 4);
        normalizedValue = 1 / (1 + Math.exp(steepness * x));
        break;
      default:
        normalizedValue = 1 - normalizedRank;
    }

    return Math.round(minSuccess + (normalizedValue * (maxSuccess - minSuccess)));
  };

  // Calculate base gold per hour based on rarity
  const calculateBaseGoldPerHour = (rarityTier: string | undefined, rank: number | undefined): number => {
    // Base values by tier
    const tierMultipliers: Record<string, number> = {
      "God Tier": 10,
      "Legendary": 5,
      "Epic": 3,
      "Rare": 2,
      "Uncommon": 1.5,
      "Common": 1
    };

    const baseGold = 100; // Base gold per hour for common
    const tierMultiplier = tierMultipliers[rarityTier || "Common"] || 1;

    // Additional multiplier based on rank (better rank = higher gold)
    const rankMultiplier = rank ? Math.max(1, 5 - (rank / 1000)) : 1;

    return Math.round(baseGold * tierMultiplier * rankMultiplier);
  };

  const getRarityColor = (tier: string | undefined) => {
    switch (tier) {
      case "God Tier": return "text-yellow-400";
      case "Legendary": return "text-orange-400";
      case "Epic": return "text-purple-400";
      case "Rare": return "text-blue-400";
      case "Uncommon": return "text-green-400";
      case "Common": return "text-gray-400";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Controls */}
      <div className="bg-black/60 rounded-lg p-4 border border-gray-700">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search Type Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Search by:</label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as "number" | "rank")}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm text-gray-300"
            >
              <option value="number">Mek Number/Name</option>
              <option value="rank">Rank</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchType === "number" ? "Enter Mek number or name..." : "Enter rank number..."}
              className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-gray-300 placeholder-gray-500"
            />
          </div>

          {/* Results Count */}
          {searchQuery && (
            <div className="text-sm text-gray-400">
              Found: <span className="text-yellow-400 font-bold">{searchResults.length}</span> Mek(s)
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-3 max-h-40 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {searchResults.slice(0, 9).map((mek) => (
                <button
                  key={mek.id}
                  onClick={() => setSelectedMek(mek)}
                  className={`p-2 rounded border text-left transition-all ${
                    selectedMek?.id === mek.id
                      ? "bg-yellow-900/30 border-yellow-500"
                      : "bg-gray-900/30 border-gray-700 hover:bg-gray-800/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-yellow-400">{mek.assetName}</span>
                    <span className={`text-xs ${getRarityColor(mek.rarityTier)}`}>
                      Rank #{mek.gameRank || mek.rarityRank || "N/A"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {mek.headVariation} / {mek.bodyVariation}
                  </div>
                </button>
              ))}
            </div>
            {searchResults.length > 9 && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Showing first 9 results. Refine your search for more specific results.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Mek Details Display */}
      {selectedMek && (
        <div className="bg-black/60 rounded-lg border-2 border-yellow-500/30 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 p-4 border-b border-yellow-500/20">
            <div className="flex items-start gap-4">
              {/* Mek Thumbnail */}
              <div className="flex-shrink-0">
                <div className="w-[150px] h-[150px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-yellow-500/30 overflow-hidden relative">
                  <img
                    src={(() => {
                      if (selectedMek.sourceKey) {
                        // Remove the -B suffix and lowercase the sourceKey
                        const cleanKey = selectedMek.sourceKey
                          .replace(/-[A-Z]$/, '') // Remove trailing -B, -C, etc.
                          .toLowerCase();
                        return `/mek-images/150px/${cleanKey}.webp`;
                      }
                      // Fallback to assetId
                      return `/mek-images/150px/${selectedMek.assetId}.webp`;
                    })()}
                    alt={selectedMek.assetName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // Show fallback if image fails
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden w-full h-full flex items-center justify-center bg-gray-800/50">
                    <div className="text-center">
                      <div className="text-5xl mb-2">🤖</div>
                      <div className="text-xs text-gray-500 px-2">
                        Mek #{selectedMek.assetId}
                      </div>
                      <div className="text-[10px] text-gray-400 px-2 mt-1">
                        {selectedMek.sourceKey || 'No source key'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mek Info */}
              <div className="flex-1 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-yellow-400">
                    {selectedMek.assetName}
                    {selectedMek.isGenesis && (
                      <span className="ml-2 px-2 py-1 bg-purple-600/30 text-purple-400 text-xs rounded">GENESIS</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">Asset ID: {selectedMek.assetId}</p>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getRarityColor(selectedMek.rarityTier)}`}>
                    {selectedMek.rarityTier || "Unknown Tier"}
                  </div>
                  <div className="text-sm text-gray-400">
                    Rank: #{selectedMek.gameRank || selectedMek.rarityRank || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Base Gold Per Hour */}
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Base Gold/Hour</div>
              <div className="text-2xl font-bold text-yellow-400">
                {calculateBaseGoldPerHour(selectedMek.rarityTier, selectedMek.gameRank || selectedMek.rarityRank)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {selectedMek.goldRate && `(Current: ${selectedMek.goldRate})`}
              </div>
            </div>

            {/* Base Success Rate */}
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Base Success Rate</div>
              <div className="text-2xl font-bold text-green-400">
                {calculateSuccessRate(selectedMek.gameRank || selectedMek.rarityRank)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">Based on rank curve</div>
            </div>

            {/* Power Score */}
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Power Score</div>
              <div className="text-2xl font-bold text-purple-400">
                {selectedMek.powerScore || "N/A"}
              </div>
              <div className="text-xs text-gray-500 mt-1">Overall rating</div>
            </div>

            {/* Variations */}
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700 lg:col-span-2">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Variations</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Head:</span>
                  <span className="text-sm text-yellow-300 font-bold">{selectedMek.headVariation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Body:</span>
                  <span className="text-sm text-blue-300 font-bold">{selectedMek.bodyVariation}</span>
                </div>
                {selectedMek.itemVariation && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Item:</span>
                    <span className="text-sm text-purple-300 font-bold">{selectedMek.itemVariation}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Level */}
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Level</div>
              <div className="text-2xl font-bold text-cyan-400">
                {selectedMek.level || 1}
              </div>
              <div className="text-xs text-gray-500 mt-1">Experience level</div>
            </div>
          </div>

          {/* Node Tree Section */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-bold text-yellow-400">Talent Tree</h4>
              <button
                onClick={() => setShowNodeTree(!showNodeTree)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-all"
              >
                {showNodeTree ? "Hide Tree" : "View Tree"}
              </button>
            </div>

            {showNodeTree && (
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <div className="text-center text-gray-500 py-8">
                  <div className="text-lg mb-2">🌳</div>
                  <p className="text-sm">Talent tree visualization coming soon...</p>
                  <p className="text-xs mt-2">This will display the node tree for {selectedMek.assetName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Additional Info */}
          {selectedMek.sourceKey && (
            <div className="px-4 pb-4">
              <div className="bg-gray-900/30 rounded p-2 text-xs text-gray-500">
                <span className="text-gray-400">Source Key:</span> {selectedMek.sourceKey}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!selectedMek && !searchQuery && (
        <div className="bg-gray-900/30 rounded-lg p-8 border border-gray-700 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-400">Search for a Mek by number or rank to view detailed statistics</p>
          <p className="text-xs text-gray-500 mt-2">
            Example: Search "101-010-101" or rank "1" to find Genesis Meks
          </p>
        </div>
      )}
    </div>
  );
}