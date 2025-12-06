"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function VariationSpreadViewer() {
  const analysisData = useQuery(api.analysisVariationCoverage.analyzeVariationCoverage);

  console.log('[ANALYSIS] Query result:', analysisData);

  if (!analysisData) {
    return (
      <div className="text-gray-400">Loading analysis data...</div>
    );
  }

  const { summary, userBreakdown, variationList, missingVariationsList } = analysisData;

  console.log('[DEBUG] Found variations count:', variationList.length);
  console.log('[DEBUG] Missing variations count:', missingVariationsList?.length);
  console.log('[DEBUG] Summary says missing:', summary.missingVariations);
  console.log('[DEBUG] Missing variations list:', missingVariationsList);
  console.log('[DEBUG] ALL FOUND VARIATIONS:', variationList);

  return (
    <div className="space-y-8">
      {/* Summary Section */}
      <div className="bg-gray-900 border-2 border-yellow-500/50 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-yellow-400">Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="text-gray-400 text-sm">Verified Players (Phase I)</div>
            <div className="text-2xl font-bold text-white">{summary.totalVerifiedPlayers}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Total Meks</div>
            <div className="text-2xl font-bold text-white">{summary.totalMeks}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Unique Variations Found</div>
            <div className="text-2xl font-bold text-green-400">{summary.uniqueVariationsFound}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Total Possible Variations</div>
            <div className="text-2xl font-bold text-white">{summary.totalVariationsPossible}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Coverage Percentage</div>
            <div className="text-2xl font-bold text-yellow-400">{summary.coveragePercentage}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Missing Variations</div>
            <div className="text-2xl font-bold text-red-400">{summary.missingVariations}</div>
          </div>
          {summary.meksWithMissingVariations > 0 && (
            <div>
              <div className="text-gray-400 text-sm">Meks with Missing Data</div>
              <div className="text-2xl font-bold text-orange-400">{summary.meksWithMissingVariations}</div>
            </div>
          )}
        </div>
      </div>

      {/* User Breakdown Section */}
      <div className="bg-gray-900 border-2 border-yellow-500/50 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-yellow-400">
          Player Breakdown ({userBreakdown.length} players)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 px-4 text-gray-400">#</th>
                <th className="text-left py-2 px-4 text-gray-400">Display Name</th>
                <th className="text-left py-2 px-4 text-gray-400">Wallet Address</th>
                <th className="text-right py-2 px-4 text-gray-400">Mek Count</th>
                <th className="text-right py-2 px-4 text-gray-400">Unique Variations</th>
                <th className="text-right py-2 px-4 text-gray-400">Ratio</th>
              </tr>
            </thead>
            <tbody>
              {userBreakdown.map((user: any, index: number) => {
                const ratio = user.uniqueVariations > 0
                  ? (user.mekCount / user.uniqueVariations).toFixed(2)
                  : '0.00';

                return (
                  <tr key={user.walletAddress} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-2 px-4 text-gray-500">{index + 1}</td>
                    <td className="py-2 px-4 font-semibold">{user.displayName}</td>
                    <td className="py-2 px-4 font-mono text-xs text-gray-400">
                      {user.walletAddress.slice(0, 12)}...{user.walletAddress.slice(-8)}
                    </td>
                    <td className="py-2 px-4 text-right text-white">{user.mekCount}</td>
                    <td className="py-2 px-4 text-right text-green-400">{user.uniqueVariations}</td>
                    <td className="py-2 px-4 text-right text-blue-400">{ratio}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Variations List Section */}
      <div className="bg-gray-900 border-2 border-yellow-500/50 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-yellow-400">
          All Unique Variations Found ({variationList.length})
        </h2>
        <div className="max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {variationList.map((variation: any) => (
              <div
                key={variation}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 hover:border-yellow-500/50 hover:text-white transition-colors"
              >
                {variation}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Missing Variations Section */}
      {missingVariationsList && missingVariationsList.length > 0 && (
        <div className="bg-gray-900 border-2 border-red-500/50 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-red-400">
            Missing Variations ({missingVariationsList.length})
          </h2>
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {missingVariationsList.map((variation: any) => (
                <div
                  key={variation}
                  className="bg-gray-800 border border-red-700 rounded px-3 py-2 text-sm text-red-300 hover:border-red-500/50 hover:text-red-100 transition-colors"
                >
                  {variation}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
