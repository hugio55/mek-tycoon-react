'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface MekLevelsViewerProps {
  walletAddress: string;
  onClose: () => void;
}

interface MekWithTenure {
  currentTenure: number;
  tenureRate: number;
  isSlotted?: boolean;
}

export default function MekLevelsViewer({ walletAddress, onClose }: MekLevelsViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [tenureData, setTenureData] = useState<Map<string, MekWithTenure>>(new Map());
  const [sortColumn, setSortColumn] = useState<string>('level');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const mekLevels = useQuery(api.mekLeveling.getMekLevels, { walletAddress });
  const goldMiningData = useQuery(api.goldMining.getGoldMiningData, { walletAddress });
  const essenceSlots = useQuery(api.essence.getEssenceSlots, { walletAddress });

  // Mount portal and lock body scroll
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Client-side tenure accumulation for real-time updates
  useEffect(() => {
    if (!goldMiningData?.ownedMeks || !essenceSlots) return;

    // Create a set of slotted asset IDs from essenceSlots
    const slottedAssetIds = new Set<string>();
    essenceSlots.forEach(slot => {
      if (slot.slottedMekAssetId) {
        slottedAssetIds.add(slot.slottedMekAssetId);
      }
    });

    // Initialize tenure data from Meks
    const initialData = new Map<string, MekWithTenure>();
    goldMiningData.ownedMeks.forEach(mek => {
      const isActuallySlotted = slottedAssetIds.has(mek.assetId);
      initialData.set(mek.assetId, {
        currentTenure: mek.tenurePoints || 0,
        tenureRate: 1, // Base rate of 1 tenure/second
        isSlotted: isActuallySlotted
      });
    });
    setTenureData(initialData);

    // Update tenure every second for slotted Meks
    const interval = setInterval(() => {
      setTenureData(prevData => {
        const newData = new Map(prevData);
        goldMiningData.ownedMeks.forEach(mek => {
          const existing = prevData.get(mek.assetId);
          if (existing && existing.isSlotted) {
            // Increment tenure by rate per second
            newData.set(mek.assetId, {
              ...existing,
              currentTenure: existing.currentTenure + existing.tenureRate
            });
          }
        });
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [goldMiningData?.ownedMeks, essenceSlots]);

  const loadingContent = (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-yellow-500 rounded-lg p-8 max-w-4xl w-full mx-4">
        <div className="text-gray-400">Loading Mek levels...</div>
      </div>
    </div>
  );

  // Only render portal on client-side after mount
  if (!mounted) return null;

  if (!mekLevels || !goldMiningData) {
    return createPortal(loadingContent, document.body);
  }

  // Create a map of existing level records
  const levelMap = new Map(mekLevels.map(level => [level.assetId, level]));

  // Merge all owned Meks with their level data
  const allMeks = goldMiningData.ownedMeks.map(mek => {
    const levelData = levelMap.get(mek.assetId);
    return {
      assetId: mek.assetId,
      mekNumber: parseInt(mek.assetName.replace(/\D/g, '')) || 0,
      baseGoldPerHour: mek.baseGoldPerHour || mek.goldPerHour || 0,
      currentLevel: levelData?.currentLevel || 1,
      currentBoostPercent: levelData?.currentBoostPercent || 0,
      currentBoostAmount: levelData?.currentBoostAmount || 0,
      totalGoldSpent: levelData?.totalGoldSpent || 0,
      _id: levelData?._id || mek.assetId,
    };
  });

  // Sort: upgraded Meks first (by level desc), then level 1 Meks (by mek number)
  const sortedMeks = allMeks.sort((a, b) => {
    if (a.currentLevel !== b.currentLevel) {
      return b.currentLevel - a.currentLevel; // Higher levels first
    }
    return a.mekNumber - b.mekNumber; // Then by Mek number
  });

  const modalContent = (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 border-2 border-yellow-500 rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-yellow-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            Mek Levels - {walletAddress.substring(0, 12)}...
          </h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700 rounded transition-colors"
          >
            Close
          </button>
        </div>

        {sortedMeks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No Meks found for this wallet
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Mek #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Asset ID</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Level</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Base Gold/hr</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Boost %</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Boost Gold/hr</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Total Gold/hr</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Tenure</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Gold Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sortedMeks.map((mek) => {
                  const baseRate = mek.baseGoldPerHour || 0;
                  const boostAmount = mek.currentBoostAmount || 0;
                  const totalRate = baseRate + boostAmount;
                  const tenureInfo = tenureData.get(mek.assetId);

                  return (
                    <tr key={mek._id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-gray-300">
                          #{mek.mekNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-gray-400">
                          {mek.assetId.substring(0, 12)}...
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${
                          mek.currentLevel === 10 ? 'bg-purple-900/30 text-purple-400 border border-purple-700' :
                          mek.currentLevel >= 7 ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700' :
                          mek.currentLevel >= 4 ? 'bg-blue-900/30 text-blue-400 border border-blue-700' :
                          'bg-gray-800/30 text-gray-400 border border-gray-600'
                        }`}>
                          Level {mek.currentLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-gray-300">
                          {baseRate.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-green-400">
                          +{mek.currentBoostPercent || 0}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-green-400">
                          +{boostAmount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-yellow-400">
                          {totalRate.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {tenureInfo ? (
                          <div className="flex flex-col items-end">
                            <span className={`text-sm font-semibold ${tenureInfo.isSlotted ? 'text-cyan-400' : 'text-gray-400'}`}>
                              {tenureInfo.currentTenure.toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {tenureInfo.isSlotted ? '(accumulating)' : '(frozen)'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">0.0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-gray-300">
                          {mek.totalGoldSpent.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-6 p-4 bg-gray-800/30 rounded border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Total Meks:</span>
                  <span className="ml-2 text-white font-semibold">{sortedMeks.length}</span>
                </div>
                <div>
                  <span className="text-gray-400">Total Base Gold/hr:</span>
                  <span className="ml-2 text-white font-semibold">
                    {sortedMeks.reduce((sum, mek) => sum + (mek.baseGoldPerHour || 0), 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Total Boost Gold/hr:</span>
                  <span className="ml-2 text-green-400 font-semibold">
                    +{sortedMeks.reduce((sum, mek) => sum + (mek.currentBoostAmount || 0), 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Total Gold Spent:</span>
                  <span className="ml-2 text-yellow-400 font-semibold">
                    {sortedMeks.reduce((sum, mek) => sum + mek.totalGoldSpent, 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Average Level:</span>
                  <span className="ml-2 text-white font-semibold">
                    {(sortedMeks.reduce((sum, mek) => sum + mek.currentLevel, 0) / sortedMeks.length).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Max Level Meks:</span>
                  <span className="ml-2 text-purple-400 font-semibold">
                    {sortedMeks.filter(mek => mek.currentLevel === 10).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Only render portal on client-side after mount
  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
