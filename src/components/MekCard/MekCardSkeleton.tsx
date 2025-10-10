import React from 'react';

export const MekCardSkeleton = () => {
  return (
    <div className="@container group relative">
      <div
        className="bg-black/10 border @sm:border-2 backdrop-blur-md border-gray-700/30 relative overflow-hidden"
        style={{
          transform: 'translate3d(0,0,0)',
        }}
      >
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 9px, #FAB617 9px, #FAB617 10px),
              repeating-linear-gradient(90deg, transparent, transparent 9px, #FAB617 9px, #FAB617 10px)
            `
          }}
        />

        {/* Image skeleton */}
        <div className="w-full aspect-square bg-gradient-to-br from-gray-900/50 to-black/50 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-yellow-500/20 border-t-yellow-500/40 rounded-full animate-spin" />
          </div>
          {/* Shimmer effect */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent animate-shimmer"
            style={{
              animation: 'shimmer 2s infinite',
              backgroundSize: '200% 100%'
            }}
          />
        </div>

        <div className="w-full relative">
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 via-purple-500/5 to-yellow-500/5 blur-xl" />

          <div className="relative space-y-2 p-2 sm:p-3 bg-black/80">
            {/* Identity section skeleton */}
            <div className="relative bg-gradient-to-r from-black/60 via-gray-900/60 to-black/60 backdrop-blur-md border border-gray-700/30 rounded-lg p-2 sm:p-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-3 w-24 bg-gray-700/50 rounded mb-1 animate-pulse" />
                  <div className="h-5 w-32 bg-gray-700/50 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-700/50 rounded mt-1 animate-pulse" />
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-3 w-12 bg-gray-700/50 rounded mb-1 animate-pulse" />
                  <div className="h-8 w-8 bg-gray-700/50 rounded animate-pulse" />
                </div>
              </div>
            </div>

            {/* Level bar skeleton */}
            <div className="relative bg-gradient-to-r from-black/60 via-gray-900/60 to-black/60 backdrop-blur-md border border-gray-700/30 rounded-lg p-2 sm:p-2">
              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full w-0 bg-gray-700/50 animate-pulse" />
              </div>
            </div>

            {/* Income rate skeleton */}
            <div className="relative bg-gradient-to-r from-black/60 via-yellow-950/30 to-black/60 border border-yellow-500/30 rounded-lg p-2 @sm:p-3">
              <div className="h-3 w-20 bg-gray-700/50 rounded mb-2 animate-pulse" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-10 bg-gray-700/50 rounded animate-pulse" />
                  <div className="h-5 w-16 bg-gray-700/50 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-12 bg-gray-700/50 rounded animate-pulse" />
                  <div className="h-5 w-16 bg-gray-700/50 rounded animate-pulse" />
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent my-1" />
                <div className="flex items-center gap-2">
                  <div className="h-3 w-12 bg-gray-700/50 rounded animate-pulse" />
                  <div className="h-6 w-20 bg-gray-700/50 rounded animate-pulse" />
                </div>
              </div>
            </div>

            {/* Upgrade button skeleton */}
            <div className="relative bg-gradient-to-r from-black/60 via-gray-900/60 to-black/60 border border-gray-700/30 rounded-lg p-2 @sm:p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-3 w-24 bg-gray-700/50 rounded mb-1 animate-pulse" />
                  <div className="h-5 w-28 bg-gray-700/50 rounded mb-1 animate-pulse" />
                  <div className="h-3 w-32 bg-gray-700/50 rounded animate-pulse" />
                </div>
                <div className="h-10 w-20 bg-gray-700/50 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};
