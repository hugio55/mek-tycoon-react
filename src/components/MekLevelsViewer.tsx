'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ConvexReactClient } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface MekLevelsViewerProps {
  walletAddress: string;
  client: ConvexReactClient | null;
  selectedDatabase: 'sturgeon';
  onClose: () => void;
}

interface MekWithTenure {
  currentTenure: number;
  tenureRate: number;
  isSlotted?: boolean;
}

export default function MekLevelsViewer({ walletAddress, client, selectedDatabase, onClose }: MekLevelsViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [tenureData, setTenureData] = useState<Map<string, MekWithTenure>>(new Map());
  const [sortColumn, setSortColumn] = useState<string>('level');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [meksData, setMeksData] = useState<any[]>([]);
  const [essenceState, setEssenceState] = useState<any>(null);

  const essenceSlots = essenceState?.slots;

  // Query data from selected database
  useEffect(() => {
    if (!client) return;

    let cancelled = false;

    const fetchData = async () => {
      try {
        const [meks, essence] = await Promise.all([
          client.query(api.meks.getMeksWithLevelsAndTenure, { walletAddress }),
          client.query(api.essence.getPlayerEssenceState, { walletAddress })
        ]);

        if (!cancelled) {
          setMeksData(meks);
          setEssenceState(essence);
        }
      } catch (error) {
        console.error('[MekLevelsViewer] Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000); // Refresh every 2 seconds

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [client, walletAddress]);

  // DEBUG: Log what the query returns
  useEffect(() => {
    if (meksData) {
      console.log('[🔒TENURE-DEBUG] Query returned meks data:', meksData.map(m => ({
        assetId: m.assetId,
        tenurePoints: m.tenurePoints,
        lastTenureUpdate: m.lastTenureUpdate,
        isSlotted: m.isSlotted,
        slotNumber: m.slotNumber
      })));
    }
  }, [meksData]);

  // Mount portal and lock body scroll
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // CRITICAL FIX: Rebuild tenure data from meks table (authoritative source)
  useEffect(() => {
    if (!meksData) return;

    console.log('[🔒TENURE-DEBUG] === BUILDING TENURE DATA FROM MEKS TABLE ===');
    console.log('[🔒TENURE-DEBUG] meksData count:', meksData.length);

    const newData = new Map<string, MekWithTenure>();

    meksData.forEach((mek: any) => {
      const dbTenure = mek.tenurePoints || 0;
      const dbLastUpdate = mek.lastTenureUpdate || Date.now();
      const isSlotted = mek.isSlotted || false;

      console.log(`[🔒TENURE-DEBUG] Processing ${mek.assetName}:`);
      console.log(`  - Raw tenurePoints from DB: ${mek.tenurePoints} (type: ${typeof mek.tenurePoints})`);
      console.log(`  - Raw lastTenureUpdate from DB: ${mek.lastTenureUpdate} (type: ${typeof mek.lastTenureUpdate})`);
      console.log(`  - Raw isSlotted from DB: ${mek.isSlotted} (type: ${typeof mek.isSlotted})`);
      console.log(`  - Coerced dbTenure: ${dbTenure}`);
      console.log(`  - Coerced isSlotted: ${isSlotted}`);

      // For slotted Meks, calculate additional tenure since lastTenureUpdate
      let currentTenure = dbTenure;
      if (isSlotted && dbLastUpdate) {
        const elapsedSeconds = (Date.now() - dbLastUpdate) / 1000;
        console.log(`  - Elapsed seconds since lastTenureUpdate: ${elapsedSeconds.toFixed(1)}`);
        console.log(`  - Additional tenure to add: ${(elapsedSeconds * 1).toFixed(1)}`);
        currentTenure = dbTenure + (elapsedSeconds * 1); // 1 tenure/sec base rate
      }

      console.log(`  - FINAL currentTenure for display: ${currentTenure.toFixed(1)}`);

      newData.set(mek.assetId, {
        currentTenure,
        tenureRate: 1,
        isSlotted
      });
    });

    console.log('[🔒TENURE-DEBUG] === TENURE DATA BUILD COMPLETE ===');
    console.log('[🔒TENURE-DEBUG] newData map size:', newData.size);
    setTenureData(newData);
  }, [meksData]);

  // Accumulate tenure every second for slotted Meks
  useEffect(() => {
    const interval = setInterval(() => {
      setTenureData(prevData => {
        const newData = new Map(prevData);
        let hasChanges = false;

        newData.forEach((value, assetId) => {
          if (value.isSlotted) {
            hasChanges = true;
            newData.set(assetId, {
              ...value,
              currentTenure: value.currentTenure + value.tenureRate
            });
          }
        });

        // Only return new Map if there were changes (optimization)
        return hasChanges ? newData : prevData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []); // Empty deps - runs once, uses functional updates

  const loadingContent = (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-yellow-500 rounded-lg p-8 max-w-4xl w-full mx-4">
        <div className="text-gray-400">Loading Mek levels...</div>
      </div>
    </div>
  );

  // Only render portal on client-side after mount
  if (!mounted) return null;

  if (!meksData) {
    return createPortal(loadingContent, document.body);
  }

  // Phase II: Use data directly from meks table (level and tenure data only)
  // Gold rates are no longer per-Mek - they come from Job Slots
  const allMeks = meksData.map((mek: any) => ({
    assetId: mek.assetId,
    mekNumber: parseInt(mek.assetName.replace(/\D/g, '')) || 0,
    currentLevel: mek.currentLevel || 1,
    currentBoostPercent: mek.currentBoostPercent || 0,
    totalGoldSpent: mek.totalGoldSpent || 0,
    rarityRank: mek.rarityRank || 0,
    _id: mek.assetId,
  }));

  // Handle column sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Sort Meks based on selected column and direction
  const sortedMeks = [...allMeks].sort((a, b) => {
    const tenureA = tenureData.get(a.assetId);
    const tenureB = tenureData.get(b.assetId);

    let comparison = 0;

    // Phase II: Removed baseGold and totalGold sorting (gold comes from Job Slots)
    switch (sortColumn) {
      case 'mekNumber':
        comparison = a.mekNumber - b.mekNumber;
        break;
      case 'level':
        comparison = a.currentLevel - b.currentLevel;
        break;
      case 'rarity':
        comparison = a.rarityRank - b.rarityRank;
        break;
      case 'boost':
        comparison = a.currentBoostPercent - b.currentBoostPercent;
        break;
      case 'tenure':
        comparison = (tenureA?.currentTenure || 0) - (tenureB?.currentTenure || 0);
        break;
      case 'slotted':
        const aSlotted = tenureA?.isSlotted ? 1 : 0;
        const bSlotted = tenureB?.isSlotted ? 1 : 0;
        comparison = aSlotted - bSlotted;
        break;
      case 'goldSpent':
        comparison = a.totalGoldSpent - b.totalGoldSpent;
        break;
      default:
        comparison = b.currentLevel - a.currentLevel;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const modalContent = (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 border-2 border-yellow-500 rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-yellow-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            Mek Levels - {walletAddress.substring(0, 12)}...
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => {
                onClose();
                window.dispatchEvent(new Event('openWalletConnect'));
              }}
              className="px-4 py-2 bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400 border border-yellow-700 rounded transition-colors font-['Orbitron'] uppercase tracking-wider text-sm"
            >
              Connect Wallet
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700 rounded transition-colors"
            >
              Close
            </button>
          </div>
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
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-yellow-400"
                    onClick={() => handleSort('mekNumber')}
                  >
                    Mek # {sortColumn === 'mekNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Asset ID</th>
                  <th
                    className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-yellow-400"
                    onClick={() => handleSort('level')}
                  >
                    Level {sortColumn === 'level' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-yellow-400"
                    onClick={() => handleSort('baseGold')}
                  >
                    Base Gold/hr {sortColumn === 'baseGold' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-yellow-400"
                    onClick={() => handleSort('boost')}
                  >
                    Boost % {sortColumn === 'boost' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Boost Gold/hr</th>
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-yellow-400"
                    onClick={() => handleSort('totalGold')}
                  >
                    Total Gold/hr {sortColumn === 'totalGold' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-yellow-400"
                    onClick={() => handleSort('tenure')}
                  >
                    Tenure {sortColumn === 'tenure' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-yellow-400"
                    onClick={() => handleSort('slotted')}
                  >
                    Slotted {sortColumn === 'slotted' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-yellow-400"
                    onClick={() => handleSort('goldSpent')}
                  >
                    Gold Spent {sortColumn === 'goldSpent' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
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
                      <td className="px-4 py-3 text-center">
                        {tenureInfo?.isSlotted ? (
                          <span className="text-green-400 font-semibold">✓ Yes</span>
                        ) : (
                          <span className="text-gray-500">No</span>
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
