'use client';

/**
 * INCOME Stat Box - 5 Layout Variations
 *
 * Compact density design with NEON EDGE treatment
 * Testing different spatial arrangements of labels and numbers
 */

export default function IncomeStatVariations() {
  const incomeRate = "21 g/hr";
  const cumulative = "453,412g";

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-yellow-400 uppercase tracking-wider mb-2">
          INCOME Stat Box - 5 Layout Variations
        </h1>
        <p className="text-gray-400 text-sm">
          Compact-density-v3 base: Weight contrast (bold income rate, thin cumulative)
        </p>
      </div>

      {/* Grid of 5 Variations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Layout 1: Classic Centered */}
        <div className="relative">
          <div className="text-xs text-yellow-400/60 uppercase tracking-wider mb-2 text-center">
            Layout 1: Classic Centered
          </div>
          <div
            className="relative p-6 rounded-lg overflow-hidden border-2"
            style={{
              background: 'linear-gradient(135deg, rgba(10, 10, 15, 0.95) 0%, rgba(20, 20, 30, 0.95) 100%)',
              borderColor: 'rgba(250, 182, 23, 0.6)',
              boxShadow: '0 0 20px rgba(250, 182, 23, 0.3), inset 0 0 20px rgba(250, 182, 23, 0.1)',
            }}
          >
            {/* Gradient overlay */}
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(250, 182, 23, 0.1) 0%, transparent 50%, rgba(59, 130, 246, 0.1) 100%)'
              }}
            />

            {/* Content */}
            <div className="relative z-10 text-center flex flex-col items-center">
              {/* Header */}
              <div className="text-[10px] uppercase tracking-wider text-white/40 mb-4 font-normal">
                INCOME
              </div>

              {/* Income Rate */}
              <div className="text-[9px] uppercase tracking-wider text-white/60 mb-1 font-normal">
                INCOME RATE
              </div>
              <div
                className="text-4xl font-bold mb-4"
                style={{
                  color: '#fab617',
                  textShadow: '0 0 10px rgba(250, 182, 23, 0.6), 0 0 20px rgba(250, 182, 23, 0.3)'
                }}
              >
                {incomeRate}
              </div>

              {/* Cumulative */}
              <div className="text-[9px] uppercase tracking-wider text-white/60 mb-1 font-normal">
                CUMULATIVE
              </div>
              <div className="text-2xl font-thin text-white">
                {cumulative}
              </div>
            </div>
          </div>
        </div>

        {/* Layout 2: Left-Right Rows */}
        <div className="relative">
          <div className="text-xs text-yellow-400/60 uppercase tracking-wider mb-2 text-center">
            Layout 2: Left-Right Rows
          </div>
          <div
            className="relative p-6 rounded-lg overflow-hidden border-2"
            style={{
              background: 'linear-gradient(135deg, rgba(10, 10, 15, 0.95) 0%, rgba(20, 20, 30, 0.95) 100%)',
              borderColor: 'rgba(250, 182, 23, 0.6)',
              boxShadow: '0 0 20px rgba(250, 182, 23, 0.3), inset 0 0 20px rgba(250, 182, 23, 0.1)',
            }}
          >
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(250, 182, 23, 0.1) 0%, transparent 50%, rgba(59, 130, 246, 0.1) 100%)'
              }}
            />

            <div className="relative z-10">
              {/* Header */}
              <div className="text-[10px] uppercase tracking-wider text-white/40 mb-4 font-normal">
                INCOME
              </div>

              {/* Income Rate Row */}
              <div className="flex items-center justify-between mb-3">
                <div className="text-[9px] uppercase tracking-wider text-white/60 font-normal">
                  INCOME RATE
                </div>
                <div
                  className="text-4xl font-bold"
                  style={{
                    color: '#fab617',
                    textShadow: '0 0 10px rgba(250, 182, 23, 0.6), 0 0 20px rgba(250, 182, 23, 0.3)'
                  }}
                >
                  {incomeRate}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-yellow-400/20 my-3" />

              {/* Cumulative Row */}
              <div className="flex items-center justify-between">
                <div className="text-[9px] uppercase tracking-wider text-white/60 font-normal">
                  CUMULATIVE
                </div>
                <div className="text-2xl font-thin text-white">
                  {cumulative}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layout 3: Number-First */}
        <div className="relative">
          <div className="text-xs text-yellow-400/60 uppercase tracking-wider mb-2 text-center">
            Layout 3: Number-First
          </div>
          <div
            className="relative p-6 rounded-lg overflow-hidden border-2"
            style={{
              background: 'linear-gradient(135deg, rgba(10, 10, 15, 0.95) 0%, rgba(20, 20, 30, 0.95) 100%)',
              borderColor: 'rgba(250, 182, 23, 0.6)',
              boxShadow: '0 0 20px rgba(250, 182, 23, 0.3), inset 0 0 20px rgba(250, 182, 23, 0.1)',
            }}
          >
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(250, 182, 23, 0.1) 0%, transparent 50%, rgba(59, 130, 246, 0.1) 100%)'
              }}
            />

            <div className="relative z-10 text-center flex flex-col items-center">
              {/* Header */}
              <div className="text-[10px] uppercase tracking-wider text-white/40 mb-4 font-normal">
                INCOME
              </div>

              {/* Income Rate - Number First */}
              <div
                className="text-4xl font-bold mb-1"
                style={{
                  color: '#fab617',
                  textShadow: '0 0 10px rgba(250, 182, 23, 0.6), 0 0 20px rgba(250, 182, 23, 0.3)'
                }}
              >
                {incomeRate}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-white/60 mb-4 font-normal">
                INCOME RATE
              </div>

              {/* Cumulative - Number First */}
              <div className="text-2xl font-thin text-white mb-1">
                {cumulative}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-white/60 font-normal">
                CUMULATIVE
              </div>
            </div>
          </div>
        </div>

        {/* Layout 4: Alternating */}
        <div className="relative">
          <div className="text-xs text-yellow-400/60 uppercase tracking-wider mb-2 text-center">
            Layout 4: Alternating
          </div>
          <div
            className="relative p-6 rounded-lg overflow-hidden border-2"
            style={{
              background: 'linear-gradient(135deg, rgba(10, 10, 15, 0.95) 0%, rgba(20, 20, 30, 0.95) 100%)',
              borderColor: 'rgba(250, 182, 23, 0.6)',
              boxShadow: '0 0 20px rgba(250, 182, 23, 0.3), inset 0 0 20px rgba(250, 182, 23, 0.1)',
            }}
          >
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(250, 182, 23, 0.1) 0%, transparent 50%, rgba(59, 130, 246, 0.1) 100%)'
              }}
            />

            <div className="relative z-10">
              {/* Header */}
              <div className="text-[10px] uppercase tracking-wider text-white/40 mb-4 font-normal">
                INCOME
              </div>

              {/* Income Rate - Alternating (Number Left, Label Right) */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className="text-4xl font-bold"
                  style={{
                    color: '#fab617',
                    textShadow: '0 0 10px rgba(250, 182, 23, 0.6), 0 0 20px rgba(250, 182, 23, 0.3)'
                  }}
                >
                  {incomeRate}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-white/60 font-normal text-right">
                  INCOME RATE
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-yellow-400/20 my-3" />

              {/* Cumulative - Alternating (Label Left, Number Right) */}
              <div className="flex items-center justify-between">
                <div className="text-[9px] uppercase tracking-wider text-white/60 font-normal">
                  CUMULATIVE
                </div>
                <div className="text-2xl font-thin text-white">
                  {cumulative}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layout 5: Tight Vertical */}
        <div className="relative">
          <div className="text-xs text-yellow-400/60 uppercase tracking-wider mb-2 text-center">
            Layout 5: Tight Vertical
          </div>
          <div
            className="relative p-6 rounded-lg overflow-hidden border-2"
            style={{
              background: 'linear-gradient(135deg, rgba(10, 10, 15, 0.95) 0%, rgba(20, 20, 30, 0.95) 100%)',
              borderColor: 'rgba(250, 182, 23, 0.6)',
              boxShadow: '0 0 20px rgba(250, 182, 23, 0.3), inset 0 0 20px rgba(250, 182, 23, 0.1)',
            }}
          >
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(250, 182, 23, 0.1) 0%, transparent 50%, rgba(59, 130, 246, 0.1) 100%)'
              }}
            />

            <div className="relative z-10">
              {/* Header */}
              <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1 font-normal text-center">
                INCOME
              </div>

              {/* Top Divider */}
              <div className="h-px bg-yellow-400/30 mb-3" />

              {/* Income Rate */}
              <div className="text-[9px] uppercase tracking-wider text-white/60 font-normal text-center mb-1">
                INCOME RATE
              </div>
              <div
                className="text-4xl font-bold text-center mb-3"
                style={{
                  color: '#fab617',
                  textShadow: '0 0 10px rgba(250, 182, 23, 0.6), 0 0 20px rgba(250, 182, 23, 0.3)'
                }}
              >
                {incomeRate}
              </div>

              {/* Middle Divider */}
              <div className="h-px bg-yellow-400/30 mb-3" />

              {/* Cumulative */}
              <div className="text-[9px] uppercase tracking-wider text-white/60 font-normal text-center mb-1">
                CUMULATIVE
              </div>
              <div className="text-2xl font-thin text-white text-center">
                {cumulative}
              </div>
            </div>
          </div>
        </div>

        {/* Empty slot for grid alignment */}
        <div className="hidden lg:block" />

      </div>

      {/* Design Notes */}
      <div className="mt-12 p-6 bg-gray-900/50 border border-gray-700 rounded-lg">
        <h2 className="text-yellow-400 font-bold uppercase tracking-wider mb-4">Design Specs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="text-gray-400 font-bold mb-2">Typography:</h3>
            <ul className="text-gray-500 space-y-1">
              <li>"INCOME" header: text-[10px], Inter 400, uppercase, text-white/40</li>
              <li>Income Rate number: text-4xl, weight 700, #fab617 with glow</li>
              <li>Cumulative number: text-2xl, weight 100, text-white</li>
              <li>Labels: text-[9px], Inter 400, uppercase, text-white/60</li>
            </ul>
          </div>
          <div>
            <h3 className="text-gray-400 font-bold mb-2">NEON EDGE Treatment:</h3>
            <ul className="text-gray-500 space-y-1">
              <li>Padding: p-6</li>
              <li>Border: 2px solid rgba(250, 182, 23, 0.6)</li>
              <li>Double glow: outer shadow + inset shadow</li>
              <li>Gradient overlay: yellow-to-blue vertical fade</li>
              <li>Background: dark gradient with transparency</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
