'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';

interface Variation {
  variationId: number;
  name: string;
  type: 'head' | 'body' | 'item';
  imageUrl?: string;
  copies?: number;
}

interface FederationVariation {
  variationId: number;
  count: number;
  contributingGroups: string[];
}

interface FederationVariationGridProps {
  allVariations: Variation[];
  ownedVariations: FederationVariation[];
  showType?: 'all' | 'heads' | 'bodies' | 'items';
  onVariationClick?: (variation: Variation, owned: FederationVariation | null) => void;
}

export default function FederationVariationGrid({
  allVariations,
  ownedVariations,
  showType = 'all',
  onVariationClick,
}: FederationVariationGridProps) {

  const filteredVariations = useMemo(() => {
    let filtered = allVariations;

    if (showType !== 'all') {
      const typeMap: Record<string, 'head' | 'body' | 'item'> = {
        heads: 'head',
        bodies: 'body',
        items: 'item',
      };
      filtered = filtered.filter(v => v.type === typeMap[showType]);
    }

    return filtered.sort((a, b) => a.variationId - b.variationId);
  }, [allVariations, showType]);

  const ownedMap = useMemo(() => {
    const map = new Map<number, FederationVariation>();
    ownedVariations.forEach(fv => {
      map.set(fv.variationId, fv);
    });
    return map;
  }, [ownedVariations]);

  const stats = useMemo(() => {
    const total = filteredVariations.length;
    const owned = filteredVariations.filter(v => ownedMap.has(v.variationId)).length;
    const totalCopies = filteredVariations.reduce((sum, v) => {
      const fedVar = ownedMap.get(v.variationId);
      return sum + (fedVar?.count || 0);
    }, 0);

    return {
      total,
      owned,
      percentage: total > 0 ? Math.round((owned / total) * 100) : 0,
      totalCopies,
    };
  }, [filteredVariations, ownedMap]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'head': return 'border-yellow-500/50 bg-yellow-500/5';
      case 'body': return 'border-blue-500/50 bg-blue-500/5';
      case 'item': return 'border-purple-500/50 bg-purple-500/5';
      default: return 'border-gray-500/50 bg-gray-500/5';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'head': return 'H';
      case 'body': return 'B';
      case 'item': return 'I';
      default: return '?';
    }
  };

  return (
    <div className="w-full">
      {/* Stats Header */}
      <div className="mek-card-industrial mek-border-sharp-gold p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="mek-text-industrial text-lg">VARIATION COLLECTION</h3>
          <div className="flex gap-4 text-sm">
            <div className="text-gray-400">
              <span className="mek-label-uppercase">Type:</span>
              <span className="ml-2 text-yellow-500 uppercase font-bold">{showType}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="mek-value-primary text-2xl">{stats.owned}</div>
            <div className="mek-label-uppercase mt-1">Unique Owned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{stats.total}</div>
            <div className="mek-label-uppercase mt-1">Total Variations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">{stats.percentage}%</div>
            <div className="mek-label-uppercase mt-1">Completion</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.totalCopies}</div>
            <div className="mek-label-uppercase mt-1">Total Copies</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2 bg-black/50 rounded-full overflow-hidden border border-yellow-500/30">
          <div
            className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-500 mek-glow-yellow"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
      </div>

      {/* Grid Display */}
      <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 xl:grid-cols-20 gap-2">
        {filteredVariations.map((variation) => {
          const owned = ownedMap.get(variation.variationId);
          const isOwned = !!owned;

          return (
            <div
              key={variation.variationId}
              onClick={() => onVariationClick?.(variation, owned || null)}
              className={`
                relative aspect-square rounded border-2 transition-all cursor-pointer
                ${isOwned
                  ? `${getTypeColor(variation.type)} border-opacity-100 hover:scale-110 hover:z-10`
                  : 'border-gray-700/30 bg-black/30 hover:border-gray-600/50 opacity-40'
                }
              `}
              title={`${variation.name} (#${variation.variationId})${isOwned ? ` - ${owned.count} copies` : ''}`}
            >
              {/* Type Badge */}
              <div className="absolute top-0 left-0 w-4 h-4 flex items-center justify-center text-[8px] font-bold bg-black/70 border-b border-r border-gray-600">
                {getTypeLabel(variation.type)}
              </div>

              {/* Variation ID */}
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-gray-500">
                {variation.variationId}
              </div>

              {/* Count Badge (if owned) */}
              {isOwned && owned.count > 1 && (
                <div className="absolute bottom-0 right-0 px-1.5 py-0.5 bg-yellow-500 text-black text-[10px] font-bold rounded-tl">
                  ×{owned.count}
                </div>
              )}

              {/* Owned Indicator */}
              {isOwned && (
                <div className="absolute inset-0 border-2 border-yellow-400 rounded animate-pulse pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-yellow-500/50 bg-yellow-500/5 rounded" />
          <span>Heads</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500/50 bg-blue-500/5 rounded" />
          <span>Bodies</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-purple-500/50 bg-purple-500/5 rounded" />
          <span>Items</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-700/30 bg-black/30 rounded opacity-40" />
          <span>Not Owned</span>
        </div>
      </div>
    </div>
  );
}
