'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { COMPLETE_VARIATION_RARITY } from '@/lib/completeVariationRarity';
import { OverlayRenderer } from '@/components/OverlayRenderer';
import { restoreWalletSession } from '@/lib/walletSessionManager';
import { getVariationInfoFromFullKey } from '@/lib/variationNameLookup';
import { getMediaUrl } from '@/lib/media-url';

export default function HomePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showMekSelector, setShowMekSelector] = useState(false);

  // Get user profile for net gold
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { walletAddress: userId } : "skip"
  );

  // Phase II: Get user data (includes correct Mek list from meks table)
  const userData = useQuery(
    api.userData.getUserData,
    userId ? { walletAddress: userId } : "skip"
  );

  // Extract owned Meks from user data (Phase II: meks table is source of truth)
  const ownedMeks = userData?.ownedMeks || [];

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
      await slotMek({
        walletAddress: userId,
        slotNumber,
        mekAssetId
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

  // Extract owned variation names from FULL source keys using the complete lookup
  const ownedVariationNames = useMemo(() => {
    const variationSet = new Set<string>();

    ownedMeks.forEach((mek: any) => {
      const sourceKey = mek.sourceKey || mek.sourceKeyBase;
      // Fallback to individual variation fields if sourceKey not available
      const fallback = {
        head: mek.headVariation,
        body: mek.bodyVariation,
        trait: mek.itemVariation
      };

      // Use the complete lookup to get actual variation names
      const variations = getVariationInfoFromFullKey(sourceKey, fallback);

      // Add all three variation names (head, body, trait)
      if (variations.head.name && variations.head.name !== 'Unknown') {
        variationSet.add(variations.head.name.toUpperCase());
      }
      if (variations.body.name && variations.body.name !== 'Unknown') {
        variationSet.add(variations.body.name.toUpperCase());
      }
      if (variations.trait.name && variations.trait.name !== 'Unknown') {
        variationSet.add(variations.trait.name.toUpperCase());
      }
    });

    return variationSet;
  }, [ownedMeks]);

  // Sprite rendering now handled by OverlayRenderer component
  // (Old sprite filtering code removed - component handles it internally)

  // Count how many of each specific variation the user owns using full key lookup
  const getOwnedCount = (variationName: string, variationType: string) => {
    let count = 0;
    const normalizedName = variationName.toUpperCase();

    ownedMeks.forEach((mek: any) => {
      const sourceKey = mek.sourceKey || mek.sourceKeyBase;
      const fallback = {
        head: mek.headVariation,
        body: mek.bodyVariation,
        trait: mek.itemVariation
      };

      const variations = getVariationInfoFromFullKey(sourceKey, fallback);

      // Check if this Mek has the variation we're looking for
      if (variationType === 'head' && variations.head.name.toUpperCase() === normalizedName) {
        count++;
      } else if (variationType === 'body' && variations.body.name.toUpperCase() === normalizedName) {
        count++;
      } else if (variationType === 'trait' && variations.trait.name.toUpperCase() === normalizedName) {
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

  // Get detailed variation breakdown using full key lookup
  const variationBreakdown = useMemo(() => {
    const breakdown: { [key: string]: { name: string; type: string; count: number }[] } = {
      head: [],
      body: [],
      trait: []
    };

    const slottedMeks = essenceState?.slots?.filter((slot: any) => slot.mekAssetId) || [];
    slottedMeks.forEach((slot: any) => {
      const mek = ownedMeks.find((m: any) => (m.assetId || m.assetName) === slot.mekAssetId);
      if (!mek) return;

      const sourceKey = mek.sourceKey || mek.sourceKeyBase;
      const fallback = {
        head: mek.headVariation,
        body: mek.bodyVariation,
        trait: mek.itemVariation
      };

      const variations = getVariationInfoFromFullKey(sourceKey, fallback);

      // Count head variation
      if (variations.head.name !== 'Unknown') {
        const existing = breakdown.head.find(v => v.name === variations.head.name);
        if (existing) {
          existing.count++;
        } else {
          breakdown.head.push({ name: variations.head.name, type: 'head', count: 1 });
        }
      }

      // Count body variation
      if (variations.body.name !== 'Unknown') {
        const existing = breakdown.body.find(v => v.name === variations.body.name);
        if (existing) {
          existing.count++;
        } else {
          breakdown.body.push({ name: variations.body.name, type: 'body', count: 1 });
        }
      }

      // Count trait variation
      if (variations.trait.name !== 'Unknown') {
        const existing = breakdown.trait.find(v => v.name === variations.trait.name);
        if (existing) {
          existing.count++;
        } else {
          breakdown.trait.push({ name: variations.trait.name, type: 'trait', count: 1 });
        }
      }
    });

    // Sort each type by count descending
    Object.keys(breakdown).forEach(type => {
      breakdown[type].sort((a, b) => b.count - a.count);
    });

    return breakdown;
  }, [essenceState, ownedMeks]);

  return (
    <div className="min-h-screen text-white relative">
      <div className="container mx-auto px-4 py-8">
        {/* DEBUG: Owned Variations Panel */}
        <details className="mb-8 mek-card-industrial mek-border-sharp-gold p-4 rounded-lg">
          <summary className="cursor-pointer text-yellow-400 font-bold text-lg uppercase mb-2">
            📊 Owned Variations ({ownedMeks.length} Meks × 3 = {ownedMeks.length * 3} total variations)
          </summary>
          <div className="text-gray-400 text-sm mb-4 px-2">
            Showing specific variation names extracted from Mek source keys using the complete rarity master data.
            Triangle sprites will light up for variations you own.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {Object.entries(variationBreakdown).map(([type, variations]) => (
              <div key={type} className="border border-yellow-500/30 rounded p-3">
                <h3 className="text-yellow-400 font-bold uppercase mb-2">{type}s ({variations.length} unique)</h3>
                <div className="max-h-96 overflow-y-auto">
                  {variations.map((v, i) => (
                    <div key={i} className="text-sm text-gray-300 py-1 border-b border-gray-700/50">
                      <span className="text-yellow-400 font-mono">{v.count}×</span> {v.name}
                    </div>
                  ))}
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
          {/* OverlayRenderer handles both base image and sprites */}
          <div className="relative" style={{ maxWidth: '48rem' }}>
            <OverlayRenderer
              overlayData={triangleOverlayData}
              displayWidth={triangleSize.width}
              imageRef={triangleRef}
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
                                src={getMediaUrl(`/mek-images/150px/${slot.mekSourceKey.replace(/-[A-Z]$/, '').toLowerCase()}.webp`)}
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
                          <div className="text-gray-600 text-sm">
                            Unlock Required
                          </div>
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
            <div className="bg-black/95 border-4 border-yellow-500/50 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-yellow-400">
                  SELECT MEKANISM FOR SLOT {selectedSlot}
                </h3>
                <button
                  onClick={() => {
                    setShowMekSelector(false);
                    setSelectedSlot(null);
                  }}
                  className="text-yellow-400 hover:text-yellow-300 text-3xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {ownedMeks.map((mek: any) => (
                  <div
                    key={mek.assetId}
                    onClick={() => handleSlotMek(mek.assetId, selectedSlot)}
                    className="mek-card-industrial mek-border-sharp-gold p-4 rounded-lg cursor-pointer hover:border-yellow-400 transition-all"
                  >
                    <div className="text-yellow-400 font-bold text-sm mb-2">
                      {mek.assetName || `Mek #${mek.assetId}`}
                    </div>
                    <div className="text-gray-400 text-xs space-y-1">
                      <div>Head: {mek.headVariation}</div>
                      <div>Body: {mek.bodyVariation}</div>
                      <div>Trait: {mek.itemVariation}</div>
                    </div>
                  </div>
                ))}
              </div>

              {ownedMeks.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  No Mekanisms available to slot
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
