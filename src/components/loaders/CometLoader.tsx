'use client';

/**
 * Comet Loader - Transformed from external CSS component
 *
 * Original: Two spinning partial arcs with comet dots creating trails
 * Colors: Gold (outer) and Lime (inner)
 * The dots are positioned at the end of invisible arms that rotate
 */

export default function CometLoader() {
  return (
    <div className="w-[20em] h-[20em] text-[10px] relative flex items-center justify-center">
      {/* Outer orbit - Gold (top and right borders only) */}
      <div
        className="absolute w-full h-full rounded-full border-[0.2em] border-solid animate-[spin_3s_linear_infinite]"
        style={{
          borderColor: 'gold transparent transparent gold'
        }}
      >
        {/* Invisible rotating arm with dot at the end */}
        <div
          className="absolute w-1/2 h-[0.1em] top-1/2 left-1/2 bg-transparent origin-left"
          style={{ transform: 'rotate(-45deg)' }}
        >
          <div
            className="absolute -top-[0.5em] -right-[0.5em] w-[1em] h-[1em] rounded-full"
            style={{
              backgroundColor: 'gold',
              boxShadow: '0 0 15px gold, 0 0 25px rgba(255, 215, 0, 0.5), 0 0 35px rgba(255, 215, 0, 0.3)'
            }}
          />
        </div>
      </div>

      {/* Inner orbit - Lime (left and bottom borders only) */}
      <div
        className="absolute w-[70%] h-[70%] rounded-full border-[0.2em] border-solid animate-[spin_3s_linear_infinite_reverse]"
        style={{
          borderColor: 'transparent transparent lime lime'
        }}
      >
        {/* Invisible rotating arm with dot at the end */}
        <div
          className="absolute w-1/2 h-[0.1em] top-1/2 left-1/2 bg-transparent origin-left"
          style={{ transform: 'rotate(-135deg)' }}
        >
          <div
            className="absolute -top-[0.5em] -right-[0.5em] w-[1em] h-[1em] rounded-full"
            style={{
              backgroundColor: 'lime',
              boxShadow: '0 0 15px lime, 0 0 25px rgba(0, 255, 0, 0.5), 0 0 35px rgba(0, 255, 0, 0.3)'
            }}
          />
        </div>
      </div>
    </div>
  );
}
