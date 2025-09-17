'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface SuccessConfigProps {
  isOpen: boolean;
  onClose: () => void;
  buffCategoryId?: string;
}

export default function SuccessBuffConfig({ isOpen, onClose, buffCategoryId }: SuccessConfigProps) {
  // State for success rate configuration
  const [minSuccess, setMinSuccess] = useState(1); // Minimum success rate (for rank 4000)
  const [maxSuccess, setMaxSuccess] = useState(80); // Maximum success rate (for rank 1)
  const [curveExponent, setCurveExponent] = useState(2.5); // Curve steepness
  const [previewRank, setPreviewRank] = useState(2000); // For preview

  // Fetch mechanism tiers to understand rank distribution
  const mechanismTiers = useQuery(api.mechanismTiers.getAll);

  // Calculate success rate for a given rank
  const calculateSuccessRate = (rank: number): number => {
    // Normalize rank to 0-1 scale (inverted so rank 1 = 1, rank 4000 = 0)
    const normalizedRank = 1 - ((rank - 1) / 3999);

    // Apply exponential curve
    const curvedValue = Math.pow(normalizedRank, curveExponent);

    // Map to success rate range
    const successRate = minSuccess + (maxSuccess - minSuccess) * curvedValue;

    return Math.round(successRate * 10) / 10; // Round to 1 decimal place
  };

  // Generate preview data points for the curve visualization
  const curveData = useMemo(() => {
    const points = [];
    const steps = 40; // Number of points to plot

    for (let i = 0; i <= steps; i++) {
      const rank = Math.round(1 + (3999 * i / steps));
      const success = calculateSuccessRate(rank);
      points.push({ rank, success });
    }

    return points;
  }, [minSuccess, maxSuccess, curveExponent]);

  // Example ranks to show
  const exampleRanks = [1, 10, 50, 100, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <div className="bg-gray-900 border-2 border-yellow-500/50 rounded-xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-yellow-400">Success Rate Configuration</h2>
            <p className="text-gray-400 text-sm mt-1">Configure how success rates scale with Mek rarity ranks</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Main Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Controls */}
          <div className="space-y-6">
            {/* Range Settings */}
            <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-300 mb-4">Success Rate Range</h3>

              <div className="space-y-4">
                <div>
                  <label className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Minimum Success (Rank 4000 - Common)</span>
                    <span className="text-yellow-400 font-mono">{minSuccess}%</span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="20"
                    step="0.1"
                    value={minSuccess}
                    onChange={(e) => setMinSuccess(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.1%</span>
                    <span>20%</span>
                  </div>
                </div>

                <div>
                  <label className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Maximum Success (Rank 1 - Legendary)</span>
                    <span className="text-yellow-400 font-mono">{maxSuccess}%</span>
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="1"
                    value={maxSuccess}
                    onChange={(e) => setMaxSuccess(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>20%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Curve Settings */}
            <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-300 mb-4">Distribution Curve</h3>

              <div>
                <label className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Curve Steepness</span>
                  <span className="text-yellow-400 font-mono">{curveExponent.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={curveExponent}
                  onChange={(e) => setCurveExponent(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Linear (0.5)</span>
                  <span>Moderate (2.5)</span>
                  <span>Extreme (5.0)</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Higher values give more advantage to rare Meks
                </p>
              </div>
            </div>

            {/* Preview Calculator */}
            <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-300 mb-4">Test Calculator</h3>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Check Success Rate for Rank:</label>
                <input
                  type="number"
                  min="1"
                  max="4000"
                  value={previewRank}
                  onChange={(e) => setPreviewRank(Math.min(4000, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full bg-black/50 border border-yellow-500/30 rounded px-3 py-2 text-white"
                />
                <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Rank #{previewRank} Success Rate:</div>
                    <div className="text-3xl font-bold text-yellow-400 mt-1">
                      {calculateSuccessRate(previewRank).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Visualization */}
          <div className="space-y-6">
            {/* Curve Graph */}
            <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-300 mb-4">Success Rate Curve</h3>

              <div className="relative h-64 bg-black/30 rounded border border-gray-800">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 w-12">
                  <span>{maxSuccess}%</span>
                  <span>{((maxSuccess + minSuccess) / 2).toFixed(0)}%</span>
                  <span>{minSuccess}%</span>
                </div>

                {/* Graph area */}
                <svg className="absolute left-12 right-4 top-4 bottom-8 w-auto h-auto">
                  <defs>
                    <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgb(250, 182, 23)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="rgb(250, 182, 23)" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((pct) => (
                    <line
                      key={pct}
                      x1="0%"
                      x2="100%"
                      y1={`${pct}%`}
                      y2={`${pct}%`}
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Curve */}
                  <polyline
                    fill="none"
                    stroke="rgb(250, 182, 23)"
                    strokeWidth="2"
                    points={curveData.map((point, i) => {
                      const x = (i / (curveData.length - 1)) * 100;
                      const y = 100 - ((point.success - minSuccess) / (maxSuccess - minSuccess)) * 100;
                      return `${x}%,${y}%`;
                    }).join(' ')}
                  />

                  {/* Fill under curve */}
                  <polygon
                    fill="url(#curveGradient)"
                    points={`0%,100% ${curveData.map((point, i) => {
                      const x = (i / (curveData.length - 1)) * 100;
                      const y = 100 - ((point.success - minSuccess) / (maxSuccess - minSuccess)) * 100;
                      return `${x}%,${y}%`;
                    }).join(' ')} 100%,100%`}
                  />
                </svg>

                {/* X-axis labels */}
                <div className="absolute left-12 right-4 bottom-0 flex justify-between text-xs text-gray-500">
                  <span>Rank 1</span>
                  <span>1000</span>
                  <span>2000</span>
                  <span>3000</span>
                  <span>4000</span>
                </div>
              </div>
            </div>

            {/* Example Table */}
            <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-300 mb-4">Example Success Rates</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">Rank</th>
                      <th className="text-left py-2 text-gray-400">Rarity</th>
                      <th className="text-right py-2 text-gray-400">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exampleRanks.map((rank) => {
                      const success = calculateSuccessRate(rank);
                      let rarity = 'Common';
                      let rarityColor = 'text-gray-400';

                      if (rank <= 10) {
                        rarity = 'Legendary';
                        rarityColor = 'text-orange-400';
                      } else if (rank <= 100) {
                        rarity = 'Epic';
                        rarityColor = 'text-purple-400';
                      } else if (rank <= 500) {
                        rarity = 'Rare';
                        rarityColor = 'text-blue-400';
                      } else if (rank <= 1500) {
                        rarity = 'Uncommon';
                        rarityColor = 'text-green-400';
                      }

                      return (
                        <tr key={rank} className="border-b border-gray-800">
                          <td className="py-2 font-mono">#{rank}</td>
                          <td className={`py-2 ${rarityColor}`}>{rarity}</td>
                          <td className="py-2 text-right font-mono text-yellow-400">
                            {success.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            Success rates will be applied to all Meks based on their rarity rank
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="bg-gray-700 text-white font-bold px-6 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Save configuration logic would go here
                console.log('Saving success config:', { minSuccess, maxSuccess, curveExponent });
                onClose();
              }}
              className="bg-yellow-500 text-black font-bold px-6 py-2 rounded hover:bg-yellow-400 transition-colors"
            >
              Apply Configuration
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: rgb(250, 182, 23);
          cursor: pointer;
          border-radius: 50%;
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: rgb(250, 182, 23);
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }
      `}</style>
    </div>
  );
}