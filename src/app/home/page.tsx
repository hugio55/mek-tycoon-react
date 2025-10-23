'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { COMPLETE_VARIATION_RARITY } from '@/lib/completeVariationRarity';
import { OverlayRenderer } from '@/components/OverlayRenderer';

export default function HomePage() {
  const [userId, setUserId] = useState<string | null>(null);

  // Get user profile for net gold
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { walletAddress: userId } : "skip"
  );

  // Get user's owned Meks
  const ownedMeks = useQuery(
    api.meks.getMeksByOwner,
    userId ? { owner: userId } : "skip"
  ) || [];

  // Load triangle overlay data from database
  const triangleOverlayData = useQuery(api.overlays.getOverlay, { imageKey: "variation-triangle" });

  // Mock userId for now - replace with actual wallet connection later
  useEffect(() => {
    setUserId("demo_wallet_123");
  }, []);

  const netGold = userProfile?.gold || 0;

  // Extract owned variation names from user's Meks
  const ownedVariationNames = useMemo(() => {
    const variationSet = new Set<string>();

    ownedMeks.forEach((mek: any) => {
      const sourceKey = mek.sourceKeyBase || mek.sourceKey;
      if (sourceKey) {
        const parts = sourceKey.split('-');
        if (parts.length === 3) {
          parts.forEach((sourceKeyCode: string) => {
            if (sourceKeyCode) {
              const variation = COMPLETE_VARIATION_RARITY.find(
                v => v.sourceKey.toUpperCase() === sourceKeyCode.toUpperCase()
              );
              if (variation) {
                variationSet.add(variation.name.toUpperCase());
              }
            }
          });
        }
      }
    });

    return variationSet;
  }, [ownedMeks]);

  // Sprite rendering now handled by OverlayRenderer component
  // (Old sprite filtering code removed - component handles it internally)

  // Count how many of each variation the user owns
  const getOwnedCount = (variationName: string, variationType: string) => {
    let count = 0;
    ownedMeks.forEach((mek: any) => {
      const sourceKey = mek.sourceKeyBase || mek.sourceKey;
      if (sourceKey) {
        const parts = sourceKey.split('-');
        parts.forEach((sourceKeyCode: string) => {
          const variation = COMPLETE_VARIATION_RARITY.find(
            v => v.sourceKey.toUpperCase() === sourceKeyCode.toUpperCase() &&
                 v.name.toUpperCase() === variationName.toUpperCase() &&
                 v.type === variationType
          );
          if (variation) count++;
        });
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

  // DEBUG: Log data flow
  useEffect(() => {
    console.log('=== TRIANGLE OVERLAY DEBUG ===');
    console.log('triangleOverlayData:', triangleOverlayData);
    console.log('zones count:', triangleOverlayData?.zones?.length);
    console.log('ownedVariationNames:', Array.from(ownedVariationNames));
    console.log('ownedMeks count:', ownedMeks.length);
    console.log('triangle display size:', triangleSize);
  }, [triangleOverlayData, ownedVariationNames, ownedMeks, triangleSize]);

  return (
    <div className="min-h-screen text-white relative">
      <div className="container mx-auto px-4 py-8">
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
              // TEMP: Show all sprites for positioning verification (no filter)
              highlightFilter={() => true} // All sprites glow with their color
              useColorGlow={true}
              getOwnedCount={getOwnedCount}
              getTotalCount={getTotalCount}
            />
            {/* TODO: Re-enable ownership filter once positioning verified:
              filterSprites={(sprite) => {
                const variationName = sprite.metadata?.variationName?.toUpperCase();
                return variationName ? ownedVariationNames.has(variationName) : false;
              }}
            */}
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
            {[1, 2, 3, 4, 5, 6].map((slotNum) => (
              <div
                key={slotNum}
                className="relative group"
              >
                {/* Placeholder Slot Card */}
                <div className="mek-card-industrial mek-border-sharp-gold p-6 rounded-xl hover:border-yellow-400/70 transition-all cursor-pointer h-64 flex flex-col items-center justify-center">
                  {/* Background Effects */}
                  <div className="absolute inset-0 mek-overlay-scratches opacity-15 pointer-events-none" />
                  <div className="absolute inset-0 mek-overlay-rust opacity-10 pointer-events-none" />
                  <div className="absolute inset-0 mek-overlay-hazard-stripes opacity-5 pointer-events-none" />

                  {/* Slot Content */}
                  <div className="relative z-10 text-center">
                    {/* Slot Number */}
                    <div className="mek-label-uppercase text-yellow-400/40 text-xs mb-3">
                      SLOT {slotNum}
                    </div>

                    {/* Empty Slot Icon */}
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

                    {/* Placeholder Text */}
                    <div className="text-yellow-400/50 text-sm font-bold uppercase tracking-wider">
                      Empty Slot
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      Assign Mekanism
                    </div>
                  </div>

                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="absolute inset-0 bg-yellow-500/5 rounded-xl" />
                    <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(250,182,23,0.1)] rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
