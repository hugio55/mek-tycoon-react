"use client";

import { useState, useMemo } from 'react';
import { VARIATION_HIERARCHY, type VariationHierarchy } from '@/lib/variationHierarchy';
import { COMPLETE_VARIATION_RARITY } from '@/lib/completeVariationRarity';

// Extended type that merges accurate rarity data with hierarchy info
interface EnrichedVariation {
  id: number;
  name: string;
  type: 'head' | 'body' | 'trait';
  style: string;
  group: string;
  rank: number;
  copies: number;
  percentage: string;
  sourceKey: string;
  tier: string;
}

export default function VariationSearchTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [styleFilter, setStyleFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'head' | 'body' | 'trait' | null>(null);
  const [rankSortOrder, setRankSortOrder] = useState<'asc' | 'desc' | null>('asc'); // Default to ascending

  // Merge COMPLETE_VARIATION_RARITY with VARIATION_HIERARCHY for style/group info
  const enrichedVariations = useMemo(() => {
    return COMPLETE_VARIATION_RARITY.map(variation => {
      const hierarchyData = VARIATION_HIERARCHY.find(v => v.name === variation.name);

      return {
        id: variation.id,
        name: variation.name,
        type: variation.type === 'trait' ? 'trait' : variation.type,
        style: hierarchyData?.style || 'Unknown',
        group: hierarchyData?.group || 'Unknown',
        rank: variation.rank,
        copies: variation.count,
        percentage: variation.percentage,
        sourceKey: variation.sourceKey,
        tier: variation.tier
      } as EnrichedVariation;
    });
  }, []);

  // Filter variations based on search and filters
  const filteredVariations = useMemo(() => {
    let results = enrichedVariations;

    // Apply type filter
    if (typeFilter) {
      results = results.filter(v => v.type === typeFilter);
    }

    // Apply group filter
    if (groupFilter) {
      results = results.filter(v => v.group === groupFilter);
    }

    // Apply style filter
    if (styleFilter) {
      results = results.filter(v => v.style === styleFilter);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.style.toLowerCase().includes(q) ||
        v.group.toLowerCase().includes(q)
      );
    }

    // Apply rank sorting
    if (rankSortOrder) {
      results = [...results].sort((a, b) => {
        if (rankSortOrder === 'asc') {
          return a.rank - b.rank; // 1, 2, 3... (rarest first)
        } else {
          return b.rank - a.rank; // 291, 290, 289... (most common first)
        }
      });
    }

    return results;
  }, [enrichedVariations, searchQuery, groupFilter, styleFilter, typeFilter, rankSortOrder]);

  // Get unique groups and styles for autocomplete
  const allGroups = useMemo(() => {
    const groups = new Set(enrichedVariations.map(v => v.group));
    return Array.from(groups).sort();
  }, [enrichedVariations]);

  const allStyles = useMemo(() => {
    const styles = new Set(enrichedVariations.map(v => v.style));
    return Array.from(styles).sort();
  }, [enrichedVariations]);

  // Handle group click
  const handleGroupClick = (group: string) => {
    setGroupFilter(group);
    setStyleFilter(null); // Clear style filter when group is clicked
    setSearchQuery(''); // Clear search
  };

  // Handle style click
  const handleStyleClick = (style: string) => {
    setStyleFilter(style);
    setGroupFilter(null); // Clear group filter when style is clicked
    setSearchQuery(''); // Clear search
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setGroupFilter(null);
    setStyleFilter(null);
    setTypeFilter(null);
  };

  // Toggle rank sort order
  const toggleRankSort = () => {
    if (rankSortOrder === 'asc') {
      setRankSortOrder('desc');
    } else if (rankSortOrder === 'desc') {
      setRankSortOrder('asc');
    } else {
      setRankSortOrder('asc');
    }
  };

  // Get type badge color
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'head':
        return <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">HEAD</span>;
      case 'body':
        return <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">BODY</span>;
      case 'trait':
        return <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">TRAIT</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Type Filter Buttons */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400 uppercase tracking-wider">Filter by Type</label>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setTypeFilter(null)}
            className={`px-4 py-2 rounded font-medium transition-all ${
              typeFilter === null
                ? 'bg-yellow-500 text-black border-2 border-yellow-400'
                : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setTypeFilter('head')}
            className={`px-4 py-2 rounded font-medium transition-all ${
              typeFilter === 'head'
                ? 'bg-cyan-500 text-black border-2 border-cyan-400'
                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
            }`}
          >
            Heads Only
          </button>
          <button
            onClick={() => setTypeFilter('body')}
            className={`px-4 py-2 rounded font-medium transition-all ${
              typeFilter === 'body'
                ? 'bg-purple-500 text-black border-2 border-purple-400'
                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30'
            }`}
          >
            Bodies Only
          </button>
          <button
            onClick={() => setTypeFilter('trait')}
            className={`px-4 py-2 rounded font-medium transition-all ${
              typeFilter === 'trait'
                ? 'bg-yellow-500 text-black border-2 border-yellow-400'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30'
            }`}
          >
            Traits Only
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400 uppercase tracking-wider">Search Variations</label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, style, or group..."
          className="w-full px-4 py-2 bg-black/30 border border-gray-700 rounded text-gray-200 placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
        />
      </div>

      {/* Active Filters */}
      {(groupFilter || styleFilter || typeFilter) && (
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="text-gray-400">Active Filters:</span>
          {typeFilter && (
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30">
              Type: {typeFilter.toUpperCase()}
            </span>
          )}
          {groupFilter && (
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
              Group: {groupFilter}
            </span>
          )}
          {styleFilter && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30">
              Style: {styleFilter}
            </span>
          )}
          <button
            onClick={clearFilters}
            className="px-3 py-1 bg-red-500/20 text-red-400 rounded border border-red-500/30 hover:bg-red-500/30 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-400">
        Showing {filteredVariations.length} of {enrichedVariations.length} variations
      </div>

      {/* Excel-style Table */}
      <div className="border border-gray-700 rounded overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="text-center px-4 py-3 text-sm font-bold text-yellow-400 uppercase tracking-wider border-r border-gray-700">
                  ID
                </th>
                <th className="text-left px-4 py-3 text-sm font-bold text-yellow-400 uppercase tracking-wider border-r border-gray-700">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-sm font-bold text-yellow-400 uppercase tracking-wider border-r border-gray-700">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-sm font-bold text-yellow-400 uppercase tracking-wider border-r border-gray-700">
                  Style
                </th>
                <th className="text-left px-4 py-3 text-sm font-bold text-yellow-400 uppercase tracking-wider border-r border-gray-700">
                  Group
                </th>
                <th className="text-center px-4 py-3 text-sm font-bold text-yellow-400 uppercase tracking-wider border-r border-gray-700">
                  Source Key
                </th>
                <th className="text-center px-4 py-3 text-sm font-bold text-yellow-400 uppercase tracking-wider border-r border-gray-700">
                  Copies
                </th>
                <th className="text-center px-4 py-3 text-sm font-bold text-yellow-400 uppercase tracking-wider border-r border-gray-700">
                  Percentage
                </th>
                <th className="text-center px-4 py-3 text-sm font-bold text-yellow-400 uppercase tracking-wider border-r border-gray-700">
                  Tier
                </th>
                <th
                  className="text-center px-4 py-3 text-sm font-bold text-yellow-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors select-none"
                  onClick={toggleRankSort}
                  title="Click to sort by rank"
                >
                  <div className="flex items-center justify-center gap-2">
                    Rank
                    {rankSortOrder === 'asc' && <span className="text-xs">▲</span>}
                    {rankSortOrder === 'desc' && <span className="text-xs">▼</span>}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-black/20">
              {filteredVariations.map((variation, index) => (
                <tr
                  key={`${variation.name}-${variation.type}-${index}`}
                  className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-4 py-3 text-center border-r border-gray-800">
                    <span className="text-gray-400 font-mono text-sm">
                      {variation.id}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-r border-gray-800">
                    {getTypeBadge(variation.type)}
                  </td>
                  <td className="px-4 py-3 text-gray-200 font-medium border-r border-gray-800">
                    {variation.name}
                  </td>
                  <td className="px-4 py-3 border-r border-gray-800">
                    <button
                      onClick={() => handleStyleClick(variation.style)}
                      className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors text-left"
                    >
                      {variation.style}
                    </button>
                  </td>
                  <td className="px-4 py-3 border-r border-gray-800">
                    <button
                      onClick={() => handleGroupClick(variation.group)}
                      className="text-purple-400 hover:text-purple-300 hover:underline transition-colors text-left"
                    >
                      {variation.group}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center border-r border-gray-800">
                    <span className="text-cyan-300 font-mono font-semibold">
                      {variation.sourceKey}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center border-r border-gray-800">
                    <span className="text-gray-300 font-mono">
                      {variation.copies}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center border-r border-gray-800">
                    <span className="text-gray-300 font-mono text-sm">
                      {variation.percentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center border-r border-gray-800">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      variation.tier === 'legendary' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      variation.tier === 'ultra-rare' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      variation.tier === 'very-rare' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      variation.tier === 'rare' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      variation.tier === 'uncommon' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {variation.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-yellow-400 font-mono">
                    #{variation.rank}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No Results Message */}
      {filteredVariations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No variations found matching your search.
        </div>
      )}
    </div>
  );
}
