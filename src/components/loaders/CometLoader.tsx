'use client';

/**
 * Comet Loader - Transformed from external CSS component
 *
 * Original: Two spinning circular orbits with rotating "comet" dots
 * Transformation applied: Mek Tycoon industrial design system
 * - Original gold and lime colors preserved
 * - Enhanced glow effects
 * - Leading comet dots
 */

export default function CometLoader() {
  return (
    <div className="w-[20em] h-[20em] text-[10px] relative flex items-center justify-center">
      {/* Outer orbit - Gold */}
      <div className="absolute w-full h-full rounded-full border-solid
                      border-r-[0.2em] border-t-[0.2em] border-b-0 border-l-0
                      animate-[spin_3s_linear_infinite]"
           style={{ borderColor: 'gold' }}>
        <div className="absolute w-[35%] h-[0.1em] top-1/2 left-1/2 bg-transparent
                        -rotate-45 origin-left">
          <div className="absolute -top-[0.5em] -left-[0.5em] w-[1em] h-[1em]
                          rounded-full"
               style={{
                 backgroundColor: 'gold',
                 boxShadow: '0 0 15px gold, 0 0 25px rgba(255, 215, 0, 0.5), 0 0 35px rgba(255, 215, 0, 0.3)'
               }} />
        </div>
      </div>

      {/* Inner orbit - Lime */}
      <div className="absolute w-[70%] h-[70%] rounded-full border-solid
                      border-l-[0.2em] border-r-0 border-t-0 border-b-[0.2em]
                      animate-[spin_3s_linear_infinite_reverse]"
           style={{ borderColor: 'lime' }}>
        <div className="absolute w-[35%] h-[0.1em] top-1/2 left-1/2 bg-transparent
                        -rotate-[135deg] origin-left">
          <div className="absolute -top-[0.5em] -left-[0.5em] w-[1em] h-[1em]
                          rounded-full"
               style={{
                 backgroundColor: 'lime',
                 boxShadow: '0 0 15px lime, 0 0 25px rgba(0, 255, 0, 0.5), 0 0 35px rgba(0, 255, 0, 0.3)'
               }} />
        </div>
      </div>
    </div>
  );
}
