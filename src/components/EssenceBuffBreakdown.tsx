"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COMPLETE_VARIATION_RARITY } from "@/lib/completeVariationRarity";

interface EssenceBuffBreakdownProps {
  walletAddress: string;
  variationId?: number; // Optional: show breakdown for specific variation only
}

export default function EssenceBuffBreakdown({
  walletAddress,
  variationId
}: EssenceBuffBreakdownProps) {
  const breakdown = useQuery(api.essence.getPlayerBuffBreakdown, {
    walletAddress,
    variationId,
  });

  if (!breakdown || breakdown.length === 0) {
    return (
      <div className="mek-card-industrial p-6 text-center">
        <p className="text-gray-400">No active essence buffs</p>
      </div>
    );
  }

  // Helper to get variation name from ID
  const getVariationName = (variationId: number) => {
    const variation = COMPLETE_VARIATION_RARITY.find(v => v.id === variationId);
    return variation?.name || `Variation ${variationId}`;
  };

  // Helper to get variation type from ID
  const getVariationType = (variationId: number) => {
    const variation = COMPLETE_VARIATION_RARITY.find(v => v.id === variationId);
    return variation?.type || "unknown";
  };

  return (
    <div className="space-y-6">
      {breakdown.map((variation) => {
        const variationName = getVariationName(variation.variationId);
        const variationType = getVariationType(variation.variationId);
        const rateBoostPercent = ((variation.totalRateMultiplier - 1.0) * 100).toFixed(0);
        const hasRateBoost = variation.totalRateMultiplier > 1.0;
        const hasCapBonus = variation.totalCapBonus > 0;

        return (
          <div key={variation.variationId} className="mek-card-industrial mek-border-sharp-gold">
            {/* Header: Variation name and totals */}
            <div className="bg-gradient-to-r from-yellow-600/20 to-black/40 border-b-2 border-yellow-500/30 px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="mek-text-industrial text-xl">{variationName}</h3>
                  <span className="mek-label-uppercase text-xs text-gray-500">
                    {variationType}
                  </span>
                </div>
                <div className="text-right space-y-1">
                  {hasRateBoost && (
                    <div className="mek-value-primary text-2xl">
                      +{rateBoostPercent}% Rate
                    </div>
                  )}
                  {hasCapBonus && (
                    <div className="mek-value-secondary text-lg">
                      +{variation.totalCapBonus} Cap
                    </div>
                  )}
                  {!hasRateBoost && !hasCapBonus && (
                    <div className="text-gray-500 text-sm">No Bonuses</div>
                  )}
                </div>
              </div>
            </div>

            {/* Source Breakdown Table */}
            <div className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-yellow-500/30">
                    <th className="text-left py-3 px-2 mek-label-uppercase text-xs text-yellow-400">
                      Source Type
                    </th>
                    <th className="text-left py-3 px-2 mek-label-uppercase text-xs text-yellow-400">
                      Source Name
                    </th>
                    <th className="text-right py-3 px-2 mek-label-uppercase text-xs text-yellow-400">
                      Rate Bonus
                    </th>
                    <th className="text-right py-3 px-2 mek-label-uppercase text-xs text-yellow-400">
                      Cap Bonus
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {variation.sources.map((source: any, index: number) => {
                    const sourceRateBoost = ((source.rateMultiplier - 1.0) * 100).toFixed(0);
                    const hasSourceRateBoost = source.rateMultiplier > 1.0;

                    return (
                      <tr
                        key={source.sourceId}
                        className={`
                          border-b border-gray-700/50
                          ${index % 2 === 0 ? 'bg-black/20' : 'bg-black/40'}
                          hover:bg-yellow-500/10 transition-colors
                        `}
                      >
                        {/* Source Type */}
                        <td className="py-3 px-2">
                          <span className="inline-block px-2 py-1 rounded bg-gray-800/60 border border-gray-600 text-xs font-mono uppercase">
                            {source.sourceType}
                          </span>
                        </td>

                        {/* Source Name + Description */}
                        <td className="py-3 px-2">
                          <div>
                            <div className="text-gray-200 font-semibold">
                              {source.sourceName}
                            </div>
                            {source.sourceDescription && (
                              <div className="text-gray-500 text-xs mt-1">
                                {source.sourceDescription}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Rate Bonus */}
                        <td className="text-right py-3 px-2">
                          {hasSourceRateBoost ? (
                            <span className="text-yellow-400 font-mono font-bold">
                              +{sourceRateBoost}%
                            </span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>

                        {/* Cap Bonus */}
                        <td className="text-right py-3 px-2">
                          {source.capBonus > 0 ? (
                            <span className="text-blue-400 font-mono font-bold">
                              +{source.capBonus}
                            </span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Total Row */}
                <tfoot>
                  <tr className="border-t-2 border-yellow-500/50 bg-yellow-900/20">
                    <td colSpan={2} className="py-3 px-2 mek-label-uppercase text-sm font-bold text-yellow-300">
                      Total from {variation.sources.length} source{variation.sources.length !== 1 ? 's' : ''}
                    </td>
                    <td className="text-right py-3 px-2 font-mono font-bold text-yellow-400">
                      {hasRateBoost && `+${rateBoostPercent}%`}
                    </td>
                    <td className="text-right py-3 px-2 font-mono font-bold text-blue-400">
                      {hasCapBonus && `+${variation.totalCapBonus}`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
