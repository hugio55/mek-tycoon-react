'use client';

export default function AnimationTest() {
  return (
    <div className="min-h-screen bg-black p-8">
      <h1 className="text-4xl font-['Orbitron'] text-yellow-500 text-center mb-12 uppercase tracking-wider">
        Wallet Connection Animation Options
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {/* Variation 1: Orbital Scanner */}
        <div className="bg-black/30 border border-yellow-500/30 p-8 backdrop-blur-sm">
          <h2 className="text-xl font-['Orbitron'] text-yellow-500 text-center mb-6 uppercase">
            Variation 1: Orbital Scanner
          </h2>
          <div className="relative mx-auto w-28 h-28 mb-6">
            {/* Static frame */}
            <div className="absolute inset-0 border-2 border-yellow-500/20 rounded-full" />
            <div className="absolute inset-0 border border-yellow-500/10 rounded-full"
                 style={{ clipPath: 'polygon(0 0, 100% 0, 100% 2px, 0 2px)' }} />

            {/* Orbiting particles - outer orbit */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '6s' }}>
              <div className="absolute top-0 left-1/2 w-2 h-2 -ml-1 -mt-1 bg-yellow-500 rounded-full shadow-[0_0_8px_rgba(250,182,23,0.8)]" />
            </div>

            {/* Middle orbit */}
            <div className="absolute inset-4 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
              <div className="absolute top-0 left-1/2 w-1.5 h-1.5 -ml-0.5 -mt-0.5 bg-yellow-500/80 rounded-full shadow-[0_0_6px_rgba(250,182,23,0.6)]" />
            </div>

            {/* Inner orbit */}
            <div className="absolute inset-8 animate-spin" style={{ animationDuration: '3s' }}>
              <div className="absolute top-0 left-1/2 w-1 h-1 -ml-0.5 -mt-0.5 bg-yellow-500/60 rounded-full shadow-[0_0_4px_rgba(250,182,23,0.4)]" />
            </div>

            {/* Center hub */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-yellow-500/40 rounded-full animate-pulse" style={{ animationDuration: '2s' }} />
            </div>
          </div>
          <p className="text-gray-400 text-sm text-center font-mono">
            Counter-rotating orbits, dynamic searching pattern
          </p>
        </div>

        {/* Variation 2: Hexagonal Pulse Grid */}
        <div className="bg-black/30 border border-yellow-500/30 p-8 backdrop-blur-sm">
          <h2 className="text-xl font-['Orbitron'] text-yellow-500 text-center mb-6 uppercase">
            Variation 2: Hexagonal Pulse
          </h2>
          <div className="relative mx-auto w-28 h-28 mb-6">
            {/* Hexagonal frame with custom shape */}
            <div className="absolute inset-0 border-2 border-yellow-500/30"
                 style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }} />

            {/* Corner indicators */}
            <div className="absolute top-0 left-[30%] w-2 h-2 border-t-2 border-l-2 border-yellow-500 -translate-y-0.5 animate-pulse" style={{ animationDuration: '2s', animationDelay: '0s' }} />
            <div className="absolute top-0 right-[30%] w-2 h-2 border-t-2 border-r-2 border-yellow-500 -translate-y-0.5 animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
            <div className="absolute bottom-0 left-[30%] w-2 h-2 border-b-2 border-l-2 border-yellow-500 translate-y-0.5 animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.6s' }} />
            <div className="absolute bottom-0 right-[30%] w-2 h-2 border-b-2 border-r-2 border-yellow-500 translate-y-0.5 animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.9s' }} />

            {/* Expanding pulse rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-4 h-4 border-2 border-yellow-500 rounded-full animate-ping"
                   style={{
                     clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
                     animationDuration: '3s'
                   }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-4 h-4 border-2 border-yellow-500 rounded-full animate-ping"
                   style={{
                     clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
                     animationDuration: '3s',
                     animationDelay: '1s'
                   }} />
            </div>

            {/* Center active indicator */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-yellow-500 shadow-[0_0_12px_rgba(250,182,23,0.9)]"
                   style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }} />
            </div>
          </div>
          <p className="text-gray-400 text-sm text-center font-mono">
            Military tactical grid, sequential corner pulses
          </p>
        </div>

        {/* Variation 3: Segmented Arc Loader */}
        <div className="bg-black/30 border border-yellow-500/30 p-8 backdrop-blur-sm">
          <h2 className="text-xl font-['Orbitron'] text-yellow-500 text-center mb-6 uppercase">
            Variation 3: Segmented Arc
          </h2>
          <div className="relative mx-auto w-28 h-28 mb-6">
            {/* Outer frame circle */}
            <div className="absolute inset-0 border-2 border-yellow-500/20 rounded-full" />

            {/* Segment markers - 8 divisions */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 flex items-start justify-center"
                style={{ transform: `rotate(${i * 45}deg)` }}
              >
                <div className="w-0.5 h-3 bg-yellow-500/40" />
              </div>
            ))}

            {/* Animated arc segments */}
            <div className="absolute inset-1">
              {/* Segment 1 */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-500 animate-pulse"
                   style={{
                     clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%)',
                     animationDuration: '1.5s',
                     animationDelay: '0s'
                   }} />

              {/* Segment 2 */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-r-yellow-500/80 animate-pulse"
                   style={{
                     clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)',
                     animationDuration: '1.5s',
                     animationDelay: '0.2s'
                   }} />

              {/* Segment 3 */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-b-yellow-500/60 animate-pulse"
                   style={{
                     clipPath: 'polygon(50% 50%, 50% 100%, 0% 100%, 0% 50%)',
                     animationDuration: '1.5s',
                     animationDelay: '0.4s'
                   }} />

              {/* Segment 4 */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-l-yellow-500/40 animate-pulse"
                   style={{
                     clipPath: 'polygon(50% 50%, 0% 50%, 0% 0%, 50% 0%)',
                     animationDuration: '1.5s',
                     animationDelay: '0.6s'
                   }} />
            </div>

            {/* Rotating connection beam */}
            <div className="absolute inset-0 flex items-center justify-center animate-spin" style={{ animationDuration: '6s' }}>
              <div className="w-0.5 h-10 bg-gradient-to-t from-transparent via-yellow-500/50 to-transparent" />
            </div>

            {/* Center status light */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-yellow-500/50 bg-yellow-500/20 rounded-full" />
              <div className="absolute w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{ animationDuration: '1.5s' }} />
            </div>
          </div>
          <p className="text-gray-400 text-sm text-center font-mono">
            Industrial gauge, systems initializing feel
          </p>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-500 font-mono text-sm">
          Navigate to <span className="text-yellow-500">localhost:3100/animation-test</span> to view
        </p>
      </div>
    </div>
  );
}
