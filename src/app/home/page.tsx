'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { COMPLETE_VARIATION_RARITY } from '@/lib/completeVariationRarity';
import { OverlayRenderer } from '@/components/OverlayRenderer';
import { restoreWalletSession } from '@/lib/walletSessionManager';
import { getVariationInfoFromFullKey } from '@/lib/variationNameLookup';

export default function HomePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showMekSelector, setShowMekSelector] = useState(false);
  const [mekSearchTerm, setMekSearchTerm] = useState('');

  // Get user profile for net gold
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { walletAddress: userId } : "skip"
  );

  // Get user's gold mining data (includes correct Mek list)
  const goldMiningData = useQuery(
    api.goldMining.getGoldMiningData,
    userId ? { walletAddress: userId } : "skip"
  );

  // Extract owned Meks from gold mining data (this is the source of truth)
  const ownedMeks = goldMiningData?.ownedMeks || [];

  // Load triangle overlay data from database
  const triangleOverlayData = useQuery(api.overlays.getOverlay, { imageKey: "variation-triangle" });

  // Get essence slots state
  const essenceState = useQuery(
    api.essence.getPlayerEssenceState,
    userId ? { walletAddress: userId } : "skip"
  );

  // Mutations for essence system
  const initializeEssence = useMutation(api.essence.initializeEssenceSystem);
  const slotMek = useMutation(api.essence.slotMek);
  const unslotMek = useMutation(api.essence.unslotMek);
  const forceUnlockSlot = useMutation(api.adminUnlockSlot.forceUnlockSlot);

  // Restore wallet session on mount (same pattern as UnifiedHeader)
  useEffect(() => {
    const initWallet = async () => {
      const session = await restoreWalletSession();
      if (session) {
        // Use stake address as primary identifier (same as database)
        const address = session.stakeAddress || session.walletAddress;
        setUserId(address);
        console.log('[HomePage] ===== WALLET CONNECTION =====');
        console.log('[HomePage] Full Stake Address:', address);
        console.log('[HomePage] Session:', session);
      } else {
        console.log('[HomePage] No wallet session found');
      }
    };
    initWallet();
  }, []);

  // Auto-initialize essence system if needed
  useEffect(() => {
    if (userId && essenceState === null) {
      console.log('[HomePage] Initializing essence system...');
      initializeEssence({ walletAddress: userId })
        .then(() => console.log('[HomePage] Essence system initialized'))
        .catch((err) => console.error('[HomePage] Essence init failed:', err));
    }
  }, [userId, essenceState]);

  // Debug log when ownedMeks changes
  useEffect(() => {
    if (ownedMeks && userId) {
      console.log('[HomePage] ===== MEKS QUERY RESULT =====');
      console.log('[HomePage] User ID:', userId);
      console.log('[HomePage] Meks Count:', ownedMeks.length);
      console.log('[HomePage] All Mek Asset IDs:', ownedMeks.map((m: any) => m.assetId || m.assetName));

      // Check for duplicates
      const assetIds = ownedMeks.map((m: any) => m.assetId || m.assetName);
      const duplicates = assetIds.filter((id, index) => assetIds.indexOf(id) !== index);
      if (duplicates.length > 0) {
        console.warn('[HomePage] ⚠️ DUPLICATE MEKS FOUND:', duplicates);
      }

      console.log('[HomePage] First 3 Meks:', ownedMeks.slice(0, 3));
    }
  }, [ownedMeks, userId]);

  // Handler for slotting a Mek
  const handleSlotMek = async (mekAssetId: string, slotNumber: number) => {
    if (!userId) return;

    try {
      console.log('[HomePage] Slotting Mek:', { mekAssetId, slotNumber });

      // Find the Mek to get its variation data
      const mek = ownedMeks.find((m: any) => m.assetId === mekAssetId);
      if (!mek) {
        throw new Error('Mek not found');
      }

      // Resolve proper variation names using source key
      const sourceKey = mek.sourceKey || mek.sourceKeyBase;
      const fallback = {
        head: mek.headVariation,
        body: mek.bodyVariation,
        trait: mek.itemVariation
      };
      const variations = getVariationInfoFromFullKey(sourceKey, fallback);

      await slotMek({
        walletAddress: userId,
        slotNumber,
        mekAssetId,
        headVariationName: variations.head.name,
        bodyVariationName: variations.body.name,
        itemVariationName: variations.trait.name
      });
      console.log('[HomePage] Mek slotted successfully!');
      setShowMekSelector(false);
      setSelectedSlot(null);
    } catch (error) {
      console.error('[HomePage] Failed to slot Mek:', error);
      alert(`Failed to slot Mek: ${error}`);
    }
  };

  // Handler for unslotting a Mek
  const handleUnslotMek = async (slotNumber: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent triggering slot click
    }

    if (!userId) return;

    try {
      console.log('[HomePage] Unslotting Mek from slot:', slotNumber);
      await unslotMek({
        walletAddress: userId,
        slotNumber
      });
      console.log('[HomePage] Mek unslotted successfully!');
    } catch (error) {
      console.error('[HomePage] Failed to unslot Mek:', error);
      alert(`Failed to unslot Mek: ${error}`);
    }
  };

  // Filter Meks based on search term
  const filteredMeks = useMemo(() => {
    if (!mekSearchTerm.trim()) return ownedMeks;

    const term = mekSearchTerm.toLowerCase().trim();

    return ownedMeks.filter((mek: any) => {
      // Check asset name
      if (mek.assetName && mek.assetName.toLowerCase().includes(term)) {
        return true;
      }

      // Check asset ID
      if (mek.assetId && mek.assetId.toLowerCase().includes(term)) {
        return true;
      }

      // Check Mek number
      if (mek.mekNumber) {
        const mekNumStr = mek.mekNumber.toString();
        if (mekNumStr.includes(term) || mekNumStr.padStart(4, '0').includes(term)) {
          return true;
        }
      }

      // Check variation names
      const sourceKey = mek.sourceKey || mek.sourceKeyBase;
      if (sourceKey) {
        try {
          const fallback = {
            head: mek.headVariation,
            body: mek.bodyVariation,
            trait: mek.itemVariation
          };
          const variations = getVariationInfoFromFullKey(sourceKey, fallback);

          if (variations.head.name.toLowerCase().includes(term)) return true;
          if (variations.body.name.toLowerCase().includes(term)) return true;
          if (variations.trait.name.toLowerCase().includes(term)) return true;
        } catch (error) {
          // Ignore parsing errors
        }
      }

      return false;
    });
  }, [ownedMeks, mekSearchTerm]);

  // DEBUG: Force unlock a slot
  const handleDebugUnlockSlot = async (slotNumber: number) => {
    if (!userId) return;

    try {
      console.log(`[DEBUG] Unlocking slot ${slotNumber}...`);
      await forceUnlockSlot({
        walletAddress: userId,
        slotNumber
      });
      console.log(`[DEBUG] Slot ${slotNumber} unlocked!`);
    } catch (error) {
      console.error('[DEBUG] Failed to unlock slot:', error);
      alert(`Failed to unlock slot: ${error}`);
    }
  };

  // Handler for clicking a slot
  const handleSlotClick = (slotNumber: number) => {
    const slot = essenceState?.slots?.find((s: any) => s.slotNumber === slotNumber);

    if (!slot?.isUnlocked) {
      alert('This slot is locked. Unlock it first!');
      return;
    }

    if (slot.mekAssetId) {
      // Slot already has a Mek - don't open selector
      return;
    }

    // Open Mek selector
    setSelectedSlot(slotNumber);
    setShowMekSelector(true);
  };

  const netGold = userProfile?.gold || 0;

  // Extract variation names from SLOTTED Meks only (only slotted Meks generate essence)
  const ownedVariationNames = useMemo(() => {
    const variationSet = new Set<string>();

    // Get only slotted Meks (those actively generating essence)
    const slottedMeks = essenceState?.slots?.filter((slot: any) => slot.mekAssetId) || [];

    slottedMeks.forEach((slot: any) => {
      // Slot data already has variation names directly
      if (slot.headVariationName) {
        variationSet.add(slot.headVariationName.toUpperCase());
      }
      if (slot.bodyVariationName) {
        variationSet.add(slot.bodyVariationName.toUpperCase());
      }
      if (slot.itemVariationName) {
        variationSet.add(slot.itemVariationName.toUpperCase());
      }
    });

    return variationSet;
  }, [essenceState]);

  // Sprite rendering now handled by OverlayRenderer component
  // (Old sprite filtering code removed - component handles it internally)

  // Count how many slotted Meks have this variation
  const getOwnedCount = (variationName: string, variationType: string) => {
    let count = 0;
    const normalizedName = variationName.toUpperCase();

    // Only count from slotted Meks
    const slottedMeks = essenceState?.slots?.filter((slot: any) => slot.mekAssetId) || [];

    slottedMeks.forEach((slot: any) => {
      // Check if this slot has the variation we're looking for
      if (variationType === 'head' && slot.headVariationName?.toUpperCase() === normalizedName) {
        count++;
      } else if (variationType === 'body' && slot.bodyVariationName?.toUpperCase() === normalizedName) {
        count++;
      } else if (variationType === 'trait' && slot.itemVariationName?.toUpperCase() === normalizedName) {
        count++;
      }
    });

    return count;
  };

  // Get total count of a variation in the collection
  const getTotalCount = (variationName: string, variationType: string) => {
    const variation = COMPLETE_VARIATION_RARITY.find(
      v => v.name.toUpperCase() === variationName.toUpperCase() && v.type === variationType
    );
    return variation ? variation.count : 0;
  };

  // Ref to get actual triangle image size
  const triangleRef = useRef<HTMLImageElement>(null);
  const [triangleSize, setTriangleSize] = useState({ width: 768, height: 666 });

  // Update triangle size when image loads or window resizes
  useEffect(() => {
    const updateSize = () => {
      if (triangleRef.current) {
        setTriangleSize({
          width: triangleRef.current.offsetWidth,
          height: triangleRef.current.offsetHeight
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [triangleOverlayData]);

  // DEBUG: Log data flow and variation details
  useEffect(() => {
    console.log('=== TRIANGLE OVERLAY DEBUG ===');
    console.log('triangleOverlayData:', triangleOverlayData);
    console.log('zones count:', triangleOverlayData?.zones?.length);
    console.log('ownedVariationNames:', Array.from(ownedVariationNames));
    console.log('ownedMeks count:', ownedMeks.length);
    console.log('triangle display size:', triangleSize);

    // Debug: Log each Mek's variations (using full key lookup)
    console.log('\n=== MEK VARIATIONS BREAKDOWN ===');
    ownedMeks.forEach((mek: any, index: number) => {
      const sourceKey = mek.sourceKey || mek.sourceKeyBase;
      const fallback = {
        head: mek.headVariation,
        body: mek.bodyVariation,
        trait: mek.itemVariation
      };
      console.log(`Mek ${index + 1}: ${sourceKey || mek.assetName}`);
      console.log(`  Raw data: sourceKey=${sourceKey}, head=${mek.headVariation}, body=${mek.bodyVariation}, trait=${mek.itemVariation}`);

      const variations = getVariationInfoFromFullKey(sourceKey, fallback);
      console.log(`  Resolved - Head: ${variations.head.name}, Body: ${variations.body.name}, Trait: ${variations.trait.name}`);
    });

    // Debug: Log sprite metadata
    console.log('\n=== SPRITE METADATA ===');
    triangleOverlayData?.zones?.forEach((zone: any) => {
      if (zone.mode === 'sprite') {
        const varName = zone.metadata?.variationName?.toUpperCase();
        const isOwned = varName ? ownedVariationNames.has(varName) : false;
        console.log(`Sprite: ${zone.metadata?.variationName} (${zone.metadata?.variationType}) - Owned: ${isOwned}`);
      }
    });
  }, [triangleOverlayData, ownedVariationNames, ownedMeks, triangleSize]);

  // Get detailed variation breakdown for SLOTTED Meks only
  const variationBreakdown = useMemo(() => {
    const breakdown: { [key: string]: { name: string; type: string; count: number }[] } = {
      head: [],
      body: [],
      trait: []
    };

    // Only count slotted Meks
    const slottedMeks = essenceState?.slots?.filter((slot: any) => slot.mekAssetId) || [];

    slottedMeks.forEach((slot: any) => {
      // Count head variation
      if (slot.headVariationName) {
        const existing = breakdown.head.find(v => v.name === slot.headVariationName);
        if (existing) {
          existing.count++;
        } else {
          breakdown.head.push({ name: slot.headVariationName, type: 'head', count: 1 });
        }
      }

      // Count body variation
      if (slot.bodyVariationName) {
        const existing = breakdown.body.find(v => v.name === slot.bodyVariationName);
        if (existing) {
          existing.count++;
        } else {
          breakdown.body.push({ name: slot.bodyVariationName, type: 'body', count: 1 });
        }
      }

      // Count trait variation
      if (slot.itemVariationName) {
        const existing = breakdown.trait.find(v => v.name === slot.itemVariationName);
        if (existing) {
          existing.count++;
        } else {
          breakdown.trait.push({ name: slot.itemVariationName, type: 'trait', count: 1 });
        }
      }
    });

    // Sort each type by count descending
    Object.keys(breakdown).forEach(type => {
      breakdown[type].sort((a, b) => b.count - a.count);
    });

    return breakdown;
  }, [essenceState]);

  return (
    <div className="min-h-screen text-white relative">
      <div className="container mx-auto px-4 py-8">
        {/* DEBUG: Owned Variations Panel */}
        <details className="mb-8 mek-card-industrial mek-border-sharp-gold p-4 rounded-lg">
          <summary className="cursor-pointer text-yellow-400 font-bold text-lg uppercase mb-2">
            📊 Active Variations ({(essenceState?.slots?.filter((s: any) => s.mekAssetId) || []).length} Slotted Meks)
          </summary>
          <div className="text-gray-400 text-sm mb-4 px-2">
            Showing variations from SLOTTED Meks only (those generating essence).
            Triangle sprites light up for variations in your active slots.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {Object.entries(variationBreakdown).map(([type, variations]) => (
              <div key={type} className="border border-yellow-500/30 rounded p-3">
                <h3 className="text-yellow-400 font-bold uppercase mb-2">{type}s ({variations.length} unique)</h3>
                <div className="max-h-96 overflow-y-auto">
                  {variations.map((v, i) => {
                    const totalCount = getTotalCount(v.name, v.type);
                    return (
                      <div key={i} className="text-sm py-1 border-b border-gray-700/50 flex items-center justify-between">
                        <span className="text-gray-300">{v.name}</span>
                        <span className="font-mono">
                          <span className="text-yellow-400">{v.count}</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-gray-500">{totalCount}</span>
                          <span className="text-gray-400 ml-1 text-xs">owned</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </details>

        {/* Header with Triangle and Net Gold */}
        <div className="relative flex items-start justify-center mb-12">
          {/* Net Gold Display - Left of Triangle */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <div className="mek-card-industrial mek-border-sharp-gold p-6 rounded-xl">
              <div className="absolute inset-0 mek-overlay-scratches opacity-20 pointer-events-none" />
              <div className="absolute inset-0 mek-overlay-rust opacity-10 pointer-events-none" />
              <div className="relative z-10">
                <div className="mek-label-uppercase text-yellow-400/70 text-xs mb-2">
                  NET GOLD
                </div>
                <div className="mek-value-primary text-5xl mb-2">
                  {Math.floor(netGold).toLocaleString()}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-12 h-1 bg-yellow-500/50" />
                  <span className="mek-label-uppercase text-yellow-400/50 text-[10px]">G</span>
                </div>
              </div>
            </div>
          </div>

          {/* Triangle Image - Center - Floating on space */}
          <div className="relative" style={{ maxWidth: '48rem' }}>
            <img
              ref={triangleRef}
              src="/triangle/backplate_2.webp"
              alt="Mek Variations Triangle"
              className="w-full h-auto"
            />

            {/* Positioned sprites from database - using OverlayRenderer */}
            <OverlayRenderer
              overlayData={triangleOverlayData}
              displayWidth={triangleSize.width}
              // Only show sprites for variations the user owns
              filterSprites={(sprite) => {
                const variationName = sprite.metadata?.variationName?.toUpperCase();
                return variationName ? ownedVariationNames.has(variationName) : false;
              }}
              // All visible sprites glow with their color
              highlightFilter={() => true}
              useColorGlow={true}
              getOwnedCount={getOwnedCount}
              getTotalCount={getTotalCount}
            />
          </div>
        </div>

        {/* Mechanism Slots Section */}
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h2 className="mek-text-industrial text-3xl text-yellow-400 mek-text-shadow mb-2">
              MEKANISM SLOTS
            </h2>
            <div className="h-px bg-yellow-500/30 w-full" />
          </div>

          {/* Six Mechanism Slots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((slotNum) => {
              const slot = essenceState?.slots?.find((s: any) => s.slotNumber === slotNum);
              const isLocked = !slot?.isUnlocked;
              const hasMek = !!slot?.mekAssetId;

              return (
                <div
                  key={slotNum}
                  className="relative group"
                  onClick={() => !isLocked && !hasMek && handleSlotClick(slotNum)}
                >
                  {/* Slot Card */}
                  <div className={`mek-card-industrial mek-border-sharp-gold p-6 rounded-xl transition-all h-64 flex flex-col items-center justify-center ${
                    isLocked ? 'opacity-50 cursor-not-allowed' : hasMek ? 'cursor-default' : 'hover:border-yellow-400/70 cursor-pointer'
                  }`}>
                    {/* Background Effects */}
                    <div className="absolute inset-0 mek-overlay-scratches opacity-15 pointer-events-none" />
                    <div className="absolute inset-0 mek-overlay-rust opacity-10 pointer-events-none" />
                    <div className="absolute inset-0 mek-overlay-hazard-stripes opacity-5 pointer-events-none" />

                    {/* Slot Content */}
                    <div className="relative z-10 text-center w-full">
                      {/* Slot Number */}
                      <div className="mek-label-uppercase text-yellow-400/40 text-xs mb-3">
                        SLOT {slotNum} {isLocked && '🔒 LOCKED'}
                      </div>

                      {hasMek ? (
                        // Show slotted Mek
                        <div className="relative">
                          {/* Mek Image */}
                          {slot.mekSourceKey && (
                            <div className="w-32 h-32 mx-auto mb-3 relative">
                              <img
                                src={`/mek-images/150px/${slot.mekSourceKey.replace(/-[A-Z]$/, '').toLowerCase()}.webp`}
                                alt={slot.headVariationName}
                                className="w-full h-full object-contain rounded-lg"
                                onError={(e) => {
                                  // Fallback to placeholder if image fails to load
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <div className="text-yellow-400 text-lg font-bold mb-2">
                            {slot.headVariationName}
                          </div>
                          <div className="text-cyan-400 text-sm">
                            Generating Essence
                          </div>
                          <div className="text-gray-400 text-xs mt-2">
                            {slot.headVariationName}, {slot.bodyVariationName}, {slot.itemVariationName}
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={(e) => handleUnslotMek(slotNum, e)}
                            className="mt-4 px-4 py-2 bg-red-600/20 border border-red-500/50 text-red-400 text-xs uppercase tracking-wider rounded hover:bg-red-600/30 hover:border-red-500/70 transition-all"
                          >
                            Remove Mek
                          </button>
                        </div>
                      ) : isLocked ? (
                        // Locked slot
                        <div>
                          <div className="w-24 h-24 mx-auto mb-4 border-2 border-dashed border-gray-600/30 rounded-lg flex items-center justify-center">
                            <span className="text-4xl">🔒</span>
                          </div>
                          <div className="text-gray-600 text-sm mb-3">
                            Unlock Required
                          </div>
                          {/* DEBUG: Unlock button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDebugUnlockSlot(slotNum);
                            }}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                          >
                            🔓 DEBUG UNLOCK
                          </button>
                        </div>
                      ) : (
                        // Empty unlocked slot
                        <div>
                          <div className="w-24 h-24 mx-auto mb-4 border-2 border-dashed border-yellow-500/30 rounded-lg flex items-center justify-center group-hover:border-yellow-500/50 transition-colors">
                            <svg
                              className="w-12 h-12 text-yellow-500/20 group-hover:text-yellow-500/40 transition-colors"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </div>
                          <div className="text-yellow-400/50 text-sm font-bold uppercase tracking-wider">
                            Empty Slot
                          </div>
                          <div className="text-gray-500 text-xs mt-1">
                            Click to Assign
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Hover Glow Effect */}
                    {!isLocked && !hasMek && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="absolute inset-0 bg-yellow-500/5 rounded-xl" />
                        <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(250,182,23,0.1)] rounded-xl" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mek Selector Modal */}
        {showMekSelector && selectedSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-black/95 border-4 border-yellow-500/50 rounded-lg p-6 max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden">
              {/* Header - Fixed */}
              <div className="flex-shrink-0">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-yellow-400">
                    SELECT MEKANISM FOR SLOT {selectedSlot}
                  </h3>
                  <button
                    onClick={() => {
                      setShowMekSelector(false);
                      setSelectedSlot(null);
                      setMekSearchTerm(''); // Clear search when closing
                    }}
                    className="text-yellow-400 hover:text-yellow-300 text-3xl font-bold"
                  >
                    ×
                  </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search by Mek # or variation name (e.g., bumblebee, 2268)..."
                    value={mekSearchTerm}
                    onChange={(e) => setMekSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 bg-black/60 border-2 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500/60 focus:outline-none transition-colors rounded"
                  />
                  {mekSearchTerm && (
                    <div className="mt-2 text-sm text-gray-400">
                      Showing {filteredMeks.length} of {ownedMeks.length} Mekanisms
                    </div>
                  )}
                </div>
              </div>

              {/* Scrollable Grid Area */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredMeks.map((mek: any, index: number) => {
                  // Get proper variation names using the lookup function
                  const sourceKey = mek.sourceKey || mek.sourceKeyBase;
                  const fallback = {
                    head: mek.headVariation,
                    body: mek.bodyVariation,
                    trait: mek.itemVariation
                  };
                  const variations = getVariationInfoFromFullKey(sourceKey, fallback);

                  // Clean sourceKey for image path
                  const cleanSourceKey = sourceKey ? sourceKey.replace(/-[A-Z]$/, '').toLowerCase() : null;

                  // Debug logging for first 5 Meks to diagnose sourceKey issue
                  if (index < 5) {
                    console.log(`[MekSelector] Mek #${index + 1} (${mek.assetName || mek.assetId}):`, {
                      hasSourceKey: !!mek.sourceKey,
                      hasSourceKeyBase: !!mek.sourceKeyBase,
                      sourceKey: mek.sourceKey,
                      sourceKeyBase: mek.sourceKeyBase,
                      cleanSourceKey,
                      fallback,
                      variations: {
                        head: variations.head.name,
                        body: variations.body.name,
                        trait: variations.trait.name
                      },
                      imagePath: cleanSourceKey ? `/mek-images/150px/${cleanSourceKey}.webp` : 'NO sourceKey - image cannot load'
                    });
                  }

                  return (
                    <div
                      key={mek.assetId}
                      onClick={() => handleSlotMek(mek.assetId, selectedSlot)}
                      className="mek-card-industrial mek-border-sharp-gold p-4 rounded-lg cursor-pointer hover:border-yellow-400 transition-all"
                    >
                      {/* Mek Image */}
                      <div className="w-24 h-24 mx-auto mb-3 relative bg-gray-900/50 rounded-lg flex items-center justify-center">
                        {cleanSourceKey ? (
                          <img
                            src={`/mek-images/150px/${cleanSourceKey}.webp`}
                            alt={variations.head.name}
                            className="w-full h-full object-contain rounded-lg"
                            onError={(e) => {
                              console.error('[MekSelector] Image failed to load:', cleanSourceKey);
                              // Show placeholder
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="text-gray-600 text-xs">No Image</div>';
                              }
                            }}
                          />
                        ) : (
                          <div className="text-gray-600 text-xs">No Image</div>
                        )}
                      </div>
                      <div className="text-yellow-400 font-bold text-sm mb-2">
                        {mek.assetName || `Mek #${mek.assetId}`}
                      </div>
                      <div className="text-gray-400 text-xs space-y-1">
                        <div>Head: {variations.head.name}</div>
                        <div>Body: {variations.body.name}</div>
                        <div>Trait: {variations.trait.name}</div>
                      </div>
                    </div>
                  );
                  })}
                </div>

                {filteredMeks.length === 0 && (
                  <div className="text-center text-gray-500 py-12">
                    {mekSearchTerm
                      ? `No Mekanisms found matching "${mekSearchTerm}"`
                      : 'No Mekanisms available to slot'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
