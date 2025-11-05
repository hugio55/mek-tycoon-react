'use client';

/**
 * Comet Loader - Transformed from external CSS component
 *
 * Original: Two spinning circular orbits with rotating "comet" dots
 * Transformation applied: Mek Tycoon industrial design system
 * - Gold (#fab617) color palette
 * - Smooth animations
 * - Responsive sizing
 */

export default function CometLoader() {
  return (
    <div className="w-[20em] h-[20em] text-[10px] relative flex items-center justify-center">
      {/* Outer orbit - Gold */}
      <div className="absolute w-full h-full rounded-full border-solid border-yellow-400
                      border-r-[0.2em] border-t-[0.2em] border-b-0 border-l-0
                      animate-[spin_3s_linear_infinite]">
        <div className="absolute w-1/2 h-[0.1em] top-1/2 left-1/2 bg-transparent
                        -rotate-45 origin-left">
          <div className="absolute -top-[0.5em] -right-[0.5em] w-[1em] h-[1em]
                          rounded-full bg-yellow-400
                          shadow-[0_0_10px_rgba(250,182,23,0.5)]" />
        </div>
      </div>

      {/* Inner orbit - Yellow (lighter) */}
      <div className="absolute w-[70%] h-[70%] rounded-full border-solid border-yellow-300
                      border-l-[0.2em] border-r-0 border-t-0 border-b-[0.2em]
                      animate-[spin_3s_linear_infinite_reverse]">
        <div className="absolute w-1/2 h-[0.1em] top-1/2 left-1/2 bg-transparent
                        -rotate-[135deg] origin-left">
          <div className="absolute -top-[0.5em] -right-[0.5em] w-[1em] h-[1em]
                          rounded-full bg-yellow-300
                          shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
        </div>
      </div>
    </div>
  );
}
