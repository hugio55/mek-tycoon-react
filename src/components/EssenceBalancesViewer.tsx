'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEssence } from '@/contexts/EssenceContext';
import { useDemoWallet } from '@/contexts/DemoWalletContext';

interface EssenceBalancesViewerProps {
  onClose: () => void;
}

type SortColumn = 'name' | 'type' | 'generating' | 'amount' | 'count' | 'growthRate' | 'cap' | 'lastUpdated';
type SortDirection = 'asc' | 'desc';

// Buff breakdown row component
function BuffBreakdownRow({
  variationId,
  walletAddress,
  slots
}: {
  variationId: number;
  walletAddress: string;
  slots: any[];
}) {
  const breakdown = useQuery(api.essence.getPlayerBuffBreakdown, {
    walletAddress,
    variationId,
  });

  // Find mechanisms that have this variation
  const mechanismSources = slots.filter(slot => {
    if (!slot.mekAssetId) return false;
    return (
      slot.headVariationId === variationId ||
      slot.bodyVariationId === variationId ||
      slot.itemVariationId === variationId
    );
  }).map(slot => ({
    slotIndex: slot.slotNumber,
    mekId: slot.mekSourceKey || slot.mekAssetId,
    variationType:
      slot.headVariationId === variationId ? 'head' :
      slot.bodyVariationId === variationId ? 'body' : 'item'
  }));

  const hasBuffs = breakdown && breakdown.length > 0;
  const hasMechanisms = mechanismSources.length > 0;

  if (!hasBuffs && !hasMechanisms) {
    return (
      <tr>
        <td colSpan={8} className="px-4 py-4 bg-gray-800/70">
          <div className="text-sm text-gray-400 italic">No active buffs or mechanisms for this variation</div>
        </td>
      </tr>
    );
  }

  const variation = breakdown?.[0];
  const rateBoostPercent = variation ? ((variation.totalRateMultiplier - 1.0) * 100).toFixed(0) : '0';
  const hasRateBoost = variation ? variation.totalRateMultiplier > 1.0 : false;
  const hasCapBonus = variation ? variation.totalCapBonus > 0 : false;

  // Base rate per mechanism (from config)
  const baseRatePerMechanism = 0.1; // TODO: Get from config

  return (
    <tr>
      <td colSpan={8} className="px-4 py-4 bg-gray-800/70">
        <div className="space-y-4">
          {/* Base Generation Sources */}
          {hasMechanisms && (
            <div>
              <div className="flex items-center gap-4 pb-2 border-b border-gray-600">
                <span className="text-xs text-gray-400 uppercase font-semibold">Base Generation Sources:</span>
                <span className="text-green-400 font-bold">
                  {mechanismSources.length} mechanism{mechanismSources.length !== 1 ? 's' : ''} × {baseRatePerMechanism}/day = {(mechanismSources.length * baseRatePerMechanism).toFixed(1)}/day
                </span>
              </div>
              <table className="w-full text-sm mt-2">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-2 text-xs text-gray-400 uppercase">Slot</th>
                    <th className="text-left py-2 px-2 text-xs text-gray-400 uppercase">Mechanism</th>
                    <th className="text-left py-2 px-2 text-xs text-gray-400 uppercase">Variation Part</th>
                    <th className="text-right py-2 px-2 text-xs text-gray-400 uppercase">Base Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {mechanismSources.map((source, index) => (
                    <tr key={index} className="border-b border-gray-700/50">
                      <td className="py-2 px-2">
                        <span className="inline-block px-2 py-1 rounded bg-blue-700/50 text-xs">
                          Slot {source.slotIndex}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-gray-200 font-mono text-xs">
                        {source.mekId}
                      </td>
                      <td className="py-2 px-2">
                        <span className="inline-block px-2 py-1 rounded bg-gray-700/50 text-xs uppercase">
                          {source.variationType}
                        </span>
                      </td>
                      <td className="text-right py-2 px-2">
                        <span className="text-green-400 font-bold">+{baseRatePerMechanism}/day</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Buff Sources */}
          {hasBuffs && (
            <div>
              <div className="flex items-center gap-4 pb-2 border-b border-gray-600">
                <span className="text-xs text-gray-400 uppercase font-semibold">Buff Sources (Multipliers):</span>
                {hasRateBoost && (
                  <span className="text-yellow-400 font-bold">
                    +{rateBoostPercent}% Rate Bonus
                  </span>
                )}
                {hasCapBonus && (
                  <span className="text-blue-400 font-bold">
                    +{variation.totalCapBonus} Cap Bonus
                  </span>
                )}
                {!hasRateBoost && !hasCapBonus && (
                  <span className="text-gray-500">No active bonuses</span>
                )}
              </div>

          {/* Buff Sources Table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 px-2 text-xs text-gray-400 uppercase">Source Type</th>
                <th className="text-left py-2 px-2 text-xs text-gray-400 uppercase">Source Name</th>
                <th className="text-left py-2 px-2 text-xs text-gray-400 uppercase">Description</th>
                <th className="text-right py-2 px-2 text-xs text-gray-400 uppercase">Rate Bonus</th>
                <th className="text-right py-2 px-2 text-xs text-gray-400 uppercase">Cap Bonus</th>
              </tr>
            </thead>
            <tbody>
              {variation.sources.map((source: any) => {
                const sourceRateBoost = ((source.rateMultiplier - 1.0) * 100).toFixed(0);
                const hasSourceRateBoost = source.rateMultiplier > 1.0;

                return (
                  <tr key={source.sourceId} className="border-b border-gray-700/50">
                    <td className="py-2 px-2">
                      <span className="inline-block px-2 py-1 rounded bg-gray-700/50 text-xs uppercase">
                        {source.sourceType}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-gray-200 font-semibold">
                      {source.sourceName}
                    </td>
                    <td className="py-2 px-2 text-gray-400 text-xs">
                      {source.sourceDescription || '—'}
                    </td>
                    <td className="text-right py-2 px-2">
                      {hasSourceRateBoost ? (
                        <span className="text-yellow-400 font-bold">+{sourceRateBoost}%</span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="text-right py-2 px-2">
                      {source.capBonus > 0 ? (
                        <span className="text-blue-400 font-bold">+{source.capBonus}</span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// Animated essence amount component - updates in real-time based on growth rate
function AnimatedEssenceAmount({
  baseAmount,
  ratePerDay,
  cap,
  variationId,
  backendCalculationTime,
  isGenerating = false
}: {
  baseAmount: number;
  ratePerDay: number;
  cap: number;
  variationId: number;
  backendCalculationTime: number;
  isGenerating?: boolean;
}) {
  const [displayAmount, setDisplayAmount] = useState(baseAmount);
  const baseAmountRef = useRef(baseAmount);
  const backendTimeRef = useRef(backendCalculationTime);
  const previousBackendTimeRef = useRef(backendCalculationTime); // Track previous value to detect changes

  // Update baseline when backend sends new values
  useEffect(() => {
    const previousBackendTime = previousBackendTimeRef.current;
    const backendTimeChanged = backendCalculationTime !== previousBackendTime;

    // CRITICAL LOG: Detect when backend sends NEW snapshot data
    if (backendTimeChanged) {
      console.log('🟢🔥 [ADMIN BALANCES] *** BACKEND SNAPSHOT UPDATE DETECTED ***', {
        component: 'AnimatedEssenceAmount',
        variationId,
        OLD_backendTime: new Date(previousBackendTime).toISOString(),
        NEW_backendTime: new Date(backendCalculationTime).toISOString(),
        timeDifference_ms: backendCalculationTime - previousBackendTime,
        timeDifference_seconds: ((backendCalculationTime - previousBackendTime) / 1000).toFixed(1),
        OLD_baseAmount: baseAmountRef.current.toFixed(12),
        NEW_baseAmount: baseAmount.toFixed(12),
        amountDifference: (baseAmount - baseAmountRef.current).toFixed(12),
        ratePerDay: ratePerDay.toFixed(12),
        cap
      });
    } else {
      // Regular baseline update (not a new snapshot, just component re-render)
      console.log('🟢 [ADMIN BALANCES] Baseline update (no backend change):', {
        component: 'AnimatedEssenceAmount',
        variationId,
        baseAmount: baseAmount.toFixed(12),
        backendTime: new Date(backendCalculationTime).toISOString(),
        backendTimeMs: backendCalculationTime,
        ratePerDay: ratePerDay.toFixed(12),
        cap
      });
    }

    // Update all refs with new values
    previousBackendTimeRef.current = backendCalculationTime;
    baseAmountRef.current = baseAmount;
    backendTimeRef.current = backendCalculationTime;
    setDisplayAmount(baseAmount);
  }, [baseAmount, backendCalculationTime, variationId]);

  // Animate if generating
  useEffect(() => {
    if (ratePerDay <= 0 || displayAmount >= cap) {
      setDisplayAmount(Math.min(baseAmount, cap));
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - backendTimeRef.current;
      const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
      const accumulated = ratePerDay * elapsedDays;
      const newAmount = Math.min(baseAmountRef.current + accumulated, cap);

      // Log every 5 seconds (100 intervals at 50ms)
      const intervalCount = Math.floor(elapsedMs / 50);
      if (intervalCount % 100 === 0) {
        console.log('🟢 [ADMIN BALANCES] Animation tick:', {
          component: 'AnimatedEssenceAmount',
          variationId,
          now: new Date(now).toISOString(),
          elapsedMs,
          elapsedDays: elapsedDays.toFixed(12),
          baseAmount: baseAmountRef.current.toFixed(12),
          ratePerDay: ratePerDay.toFixed(12),
          accumulated: accumulated.toFixed(12),
          newAmount: newAmount.toFixed(12)
        });
      }

      setDisplayAmount(newAmount);
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(interval);
  }, [ratePerDay, cap, baseAmount, variationId]);

  return (
    <span className={`text-lg font-bold tabular-nums ${
      isGenerating ? 'text-yellow-400' : 'text-white'
    }`}>
      {displayAmount.toFixed(7)}
    </span>
  );
}

export default function EssenceBalancesViewer({ onClose }: EssenceBalancesViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('amount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedVariationId, setExpandedVariationId] = useState<number | null>(null);

  // Get wallet address from demo wallet context
  const { walletAddress } = useDemoWallet();

  // Toggle buff breakdown visibility
  const toggleBuffBreakdown = (variationId: number) => {
    setExpandedVariationId(prev => prev === variationId ? null : variationId);
  };

  // Get essence data from shared context (single source of truth)
  const { playerEssenceState, isLoading } = useEssence();
  const essenceState = playerEssenceState; // Alias for compatibility with existing code

  // Get slots from essenceState (already queried in context)
  const allSlots = essenceState?.slots || [];

  // Count how many slots use each variation
  const getVariationCount = (variationName: string, variationType: 'head' | 'body' | 'item'): number => {
    if (!allSlots) return 0;

    let count = 0;
    for (const slot of allSlots) {
      if (variationType === 'head' && slot.headVariationName === variationName) count++;
      if (variationType === 'body' && slot.bodyVariationName === variationName) count++;
      if (variationType === 'item' && slot.itemVariationName === variationName) count++;
    }
    return count;
  };

  console.log('🟢🔥 [ADMIN BALANCES VIEWER] Using shared context data:', {
    hasData: !!essenceState,
    isLoading,
    balanceCount: essenceState?.balances?.length || 0,
    lastCalculationTime: essenceState?.lastCalculationTime
      ? new Date(essenceState.lastCalculationTime).toISOString()
      : 'N/A'
  });

  // Mount portal and lock body scroll
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const loadingContent = (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-yellow-500 rounded-lg p-8 max-w-4xl w-full mx-4">
        <div className="text-gray-400">Loading essence data...</div>
      </div>
    </div>
  );

  // Only render portal on client-side after mount
  if (!mounted) return null;

  if (!essenceState) {
    return createPortal(loadingContent, document.body);
  }

  const balances = essenceState.balances || [];

  // Filter by search term
  const filteredBalances = balances.filter(balance =>
    balance.variationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    balance.variationType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort balances
  const sortedBalances = [...filteredBalances].sort((a, b) => {
    let compareValue = 0;

    switch (sortColumn) {
      case 'name':
        compareValue = a.variationName.localeCompare(b.variationName);
        break;
      case 'type':
        compareValue = a.variationType.localeCompare(b.variationType);
        break;
      case 'generating':
        const rateA = essenceState?.essenceRates?.[a.variationId] || 0;
        const rateB = essenceState?.essenceRates?.[b.variationId] || 0;
        // Sort by whether it's generating (rate > 0), then by rate value
        const genA = rateA > 0 ? 1 : 0;
        const genB = rateB > 0 ? 1 : 0;
        if (genA !== genB) {
          compareValue = genA - genB;
        } else {
          compareValue = rateA - rateB;
        }
        break;
      case 'amount':
        compareValue = a.accumulatedAmount - b.accumulatedAmount;
        break;
      case 'count':
        const countA = getVariationCount(a.variationName, a.variationType);
        const countB = getVariationCount(b.variationName, b.variationType);
        compareValue = countA - countB;
        break;
      case 'growthRate':
        const growthRateA = essenceState?.essenceRates?.[a.variationId] || 0;
        const growthRateB = essenceState?.essenceRates?.[b.variationId] || 0;
        compareValue = growthRateA - growthRateB;
        break;
      case 'cap':
        const capA = essenceState?.caps?.[a.variationId] || 0;
        const capB = essenceState?.caps?.[b.variationId] || 0;
        compareValue = capA - capB;
        break;
      case 'lastUpdated':
        compareValue = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
        break;
    }

    return sortDirection === 'asc' ? compareValue : -compareValue;
  });

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if clicking same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending for new column
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return '⇅';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const totalEssence = balances.reduce((sum, b) => sum + b.accumulatedAmount, 0);

  const modalContent = (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 border-2 border-yellow-500 rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-yellow-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            Essence Balances - {walletAddress.substring(0, 12)}...
          </h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700 rounded transition-colors"
          >
            Close
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by variation name or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-gray-300 placeholder-gray-500 focus:outline-none focus:border-yellow-500"
          />
        </div>

        {sortedBalances.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {searchTerm ? 'No matching essence found' : 'No essence collected yet'}
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-800 border-b border-gray-700">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-yellow-400 transition-colors select-none"
                    onClick={() => handleSort('name')}
                  >
                    Variation Name {getSortIcon('name')}
                  </th>
                  <th
                    className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-yellow-400 transition-colors select-none"
                    onClick={() => handleSort('type')}
                  >
                    Type {getSortIcon('type')}
                  </th>
                  <th
                    className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-yellow-400 transition-colors select-none"
                    onClick={() => handleSort('generating')}
                  >
                    Generating {getSortIcon('generating')}
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-yellow-400 transition-colors select-none"
                    onClick={() => handleSort('amount')}
                  >
                    Amount {getSortIcon('amount')}
                  </th>
                  <th
                    className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-yellow-400 transition-colors select-none"
                    onClick={() => handleSort('count')}
                  >
                    Count {getSortIcon('count')}
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-yellow-400 transition-colors select-none"
                    onClick={() => handleSort('growthRate')}
                  >
                    Growth Rate {getSortIcon('growthRate')}
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-yellow-400 transition-colors select-none"
                    onClick={() => handleSort('cap')}
                  >
                    Cap {getSortIcon('cap')}
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-yellow-400 transition-colors select-none"
                    onClick={() => handleSort('lastUpdated')}
                  >
                    Last Updated {getSortIcon('lastUpdated')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sortedBalances.map((balance) => {
                  const typeColor =
                    balance.variationType === 'head' ? 'text-blue-400' :
                    balance.variationType === 'body' ? 'text-green-400' :
                    'text-purple-400';

                  const lastUpdated = new Date(balance.lastUpdated).toLocaleString();
                  const isExpanded = expandedVariationId === balance.variationId;

                  return (
                    <Fragment key={balance._id}>
                      <tr className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleBuffBreakdown(balance.variationId)}
                            className="text-sm font-semibold text-gray-300 hover:text-yellow-400 transition-colors cursor-pointer text-left flex items-center gap-2"
                          >
                            <span className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                            {balance.variationName}
                          </button>
                        </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          balance.variationType === 'head' ? 'bg-blue-900/30 border border-blue-700' :
                          balance.variationType === 'body' ? 'bg-green-900/30 border border-green-700' :
                          'bg-purple-900/30 border border-purple-700'
                        } ${typeColor}`}>
                          {balance.variationType === 'item' ? 'trait' : balance.variationType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(essenceState?.essenceRates?.[balance.variationId] || 0) > 0 ? (
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold uppercase bg-green-900/30 border border-green-700 text-green-400">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold uppercase bg-gray-900/30 border border-gray-700 text-gray-500">
                            IDLE
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AnimatedEssenceAmount
                          baseAmount={balance.accumulatedAmount}
                          ratePerDay={essenceState?.essenceRates?.[balance.variationId] || 0}
                          cap={essenceState?.caps?.[balance.variationId] || 10}
                          variationId={balance.variationId}
                          backendCalculationTime={essenceState?.lastCalculationTime || Date.now()}
                          isGenerating={(essenceState?.essenceRates?.[balance.variationId] || 0) > 0}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-semibold ${
                          getVariationCount(balance.variationName, balance.variationType) > 0
                            ? 'text-yellow-400'
                            : 'text-gray-400'
                        }`}>
                          {getVariationCount(balance.variationName, balance.variationType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm ${
                          (essenceState?.essenceRates?.[balance.variationId] || 0) > 0
                            ? 'text-green-400'
                            : 'text-gray-400'
                        }`}>
                          {essenceState?.essenceRates?.[balance.variationId]?.toFixed(2) || '0.00'}/d
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm ${
                          (essenceState?.caps?.[balance.variationId] || 10) > 10
                            ? 'text-blue-400'
                            : 'text-gray-400'
                        }`}>
                          {essenceState?.caps?.[balance.variationId]?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs text-gray-400">
                          {lastUpdated}
                        </span>
                      </td>
                    </tr>

                    {/* Expandable Buff Breakdown Row */}
                    {isExpanded && (
                      <BuffBreakdownRow
                        variationId={balance.variationId}
                        walletAddress={walletAddress}
                        slots={allSlots}
                      />
                    )}
                  </Fragment>
                  );
                })}
              </tbody>
            </table>

            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-800/30 rounded border border-yellow-500/30">
              <h3 className="text-sm font-semibold text-yellow-400 mb-4 uppercase tracking-wider">Summary</h3>

              {/* Main Stats Row */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-black/40 rounded p-3 text-center border border-gray-700">
                  <div className="text-2xl font-bold text-white">{balances.length}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Total Variations</div>
                </div>
                <div className="bg-black/40 rounded p-3 text-center border border-yellow-500/30">
                  <div className="text-2xl font-bold text-yellow-400">{totalEssence.toFixed(7)}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Total Essence</div>
                </div>
                <div className="bg-black/40 rounded p-3 text-center border border-gray-700">
                  <div className="text-2xl font-bold text-gray-300">
                    {balances.length > 0 ? (totalEssence / balances.length).toFixed(7) : '0.0000000'}
                  </div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Avg per Type</div>
                </div>
              </div>

              {/* Variation Type Breakdown */}
              <div className="bg-black/30 rounded p-3 border border-gray-700">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Variation Types</div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-bold text-lg">{balances.filter(b => b.variationType === 'head').length}</span>
                    <span className="text-xs text-gray-400">Heads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold text-lg">{balances.filter(b => b.variationType === 'body').length}</span>
                    <span className="text-xs text-gray-400">Bodies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-bold text-lg">{balances.filter(b => b.variationType === 'item').length}</span>
                    <span className="text-xs text-gray-400">Traits</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
