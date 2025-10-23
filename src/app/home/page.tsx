'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function HomePage() {
  const [userId, setUserId] = useState<string | null>(null);

  // Get user profile for net gold
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { walletAddress: userId } : "skip"
  );

  // Mock userId for now - replace with actual wallet connection later
  useEffect(() => {
    setUserId("demo_wallet_123");
  }, []);

  const netGold = userProfile?.gold || 0;

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
          <div className="relative">
            <img
              src="/triangle/backplate_2.webp"
              alt="Mek Variations Triangle"
              className="w-full h-auto max-w-3xl"
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
