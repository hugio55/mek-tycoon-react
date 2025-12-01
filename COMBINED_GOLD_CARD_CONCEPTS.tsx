/**
 * COMBINED GOLD CARD CONCEPTS - 3 Creative Layouts
 *
 * Each design displays BOTH income rate and cumulative gold in unique, creative ways.
 *
 * NEON EDGE System Constraints:
 * - p-6 padding
 * - border-2 with double glow (30px outer + inner)
 * - Gradient overlay (h-24, opacity-20)
 * - Saira Condensed 200 for numbers
 * - Inter 400 for labels
 * - Theme-aware yellow/cyan colors
 *
 * Data:
 * - Income Rate: 2,125 G/hr
 * - Cumulative: 12,869 G
 */

import React from 'react';

// ==========================================
// CONCEPT 1: "diagonal-split"
// Card split diagonally with overlapping corner accent
// ==========================================
const DiagonalSplitConcept = ({ useYellowGlow }: { useYellowGlow: boolean }) => {
  const themeColor = useYellowGlow ? 'yellow' : 'cyan';
  const glowColor = useYellowGlow ? 'rgba(250, 182, 23, 0.4)' : 'rgba(0, 212, 255, 0.4)';
  const textColor = useYellowGlow ? 'text-yellow-400' : 'text-cyan-400';

  return (
    <div className="relative p-6 bg-black/60 backdrop-blur-sm border-2 rounded-lg overflow-hidden"
         style={{
           borderColor: useYellowGlow ? '#fab617' : '#00d4ff',
           boxShadow: `0 0 30px ${glowColor}, inset 0 0 20px ${glowColor}`
         }}>
      {/* Diagonal gradient background */}
      <div className="absolute inset-0 h-24 opacity-20 pointer-events-none"
           style={{
             background: `linear-gradient(135deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)`
           }} />

      {/* Top-left section: Cumulative */}
      <div className="relative mb-8">
        <div className={`${textColor} text-sm uppercase tracking-wider mb-1`}
             style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
          Cumulative
        </div>
        <div className={`${textColor} text-5xl tabular-nums`}
             style={{
               fontFamily: 'Saira Condensed, sans-serif',
               fontWeight: 200,
               textShadow: `0 0 20px ${glowColor}`
             }}>
          12,869
        </div>
        <div className="text-white/40 text-xs uppercase mt-0.5"
             style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
          GOLD
        </div>
      </div>

      {/* Bottom-right section: Income Rate - offset placement */}
      <div className="relative flex items-end justify-end">
        <div className="text-right">
          <div className={`${textColor}/70 text-xs uppercase tracking-wider mb-1`}
               style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Income Rate
          </div>
          <div className="flex items-baseline justify-end gap-2">
            <div className={`${textColor} text-3xl tabular-nums`}
                 style={{
                   fontFamily: 'Saira Condensed, sans-serif',
                   fontWeight: 200,
                   textShadow: `0 0 15px ${glowColor}`
                 }}>
              2,125
            </div>
            <div className="text-white/50 text-sm uppercase"
                 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
              G/hr
            </div>
          </div>
        </div>
      </div>

      {/* Decorative diagonal line */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute ${useYellowGlow ? 'bg-yellow-400/20' : 'bg-cyan-400/20'}`}
             style={{
               width: '2px',
               height: '141.4%', // sqrt(2) * 100% for diagonal
               top: '-20%',
               left: '60%',
               transform: 'rotate(45deg)',
               transformOrigin: 'top left'
             }} />
      </div>
    </div>
  );
};

// ==========================================
// CONCEPT 2: "layered-cards"
// Two cards stacked with offset overlap creating depth
// ==========================================
const LayeredCardsConcept = ({ useYellowGlow }: { useYellowGlow: boolean }) => {
  const themeColor = useYellowGlow ? 'yellow' : 'cyan';
  const glowColor = useYellowGlow ? 'rgba(250, 182, 23, 0.4)' : 'rgba(0, 212, 255, 0.4)';
  const textColor = useYellowGlow ? 'text-yellow-400' : 'text-cyan-400';

  return (
    <div className="relative">
      {/* Back card (Income Rate) - positioned absolutely behind */}
      <div className="absolute top-4 left-4 right-0 p-6 bg-black/40 backdrop-blur-sm border-2 rounded-lg"
           style={{
             borderColor: useYellowGlow ? '#fab617' : '#00d4ff',
             boxShadow: `0 0 20px ${glowColor}, inset 0 0 15px ${glowColor}`,
             zIndex: 1
           }}>
        <div className="absolute inset-0 h-24 opacity-20 pointer-events-none rounded-lg"
             style={{
               background: `linear-gradient(180deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)`
             }} />
        <div className="relative flex items-center justify-between pt-12">
          <div className={`${textColor}/80 text-xs uppercase tracking-wider`}
               style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Income Rate
          </div>
          <div className="flex items-baseline gap-2">
            <div className={`${textColor} text-3xl tabular-nums`}
                 style={{
                   fontFamily: 'Saira Condensed, sans-serif',
                   fontWeight: 200,
                   textShadow: `0 0 15px ${glowColor}`
                 }}>
              2,125
            </div>
            <div className="text-white/50 text-sm"
                 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
              G/hr
            </div>
          </div>
        </div>
      </div>

      {/* Front card (Cumulative) - positioned relatively in front */}
      <div className="relative p-6 bg-black/70 backdrop-blur-sm border-2 rounded-lg"
           style={{
             borderColor: useYellowGlow ? '#fab617' : '#00d4ff',
             boxShadow: `0 0 30px ${glowColor}, inset 0 0 20px ${glowColor}`,
             zIndex: 2,
             marginBottom: '70px' // Space for back card visibility
           }}>
        <div className="absolute inset-0 h-24 opacity-20 pointer-events-none rounded-lg"
             style={{
               background: `linear-gradient(180deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)`
             }} />
        <div className="relative text-center">
          <div className={`${textColor} text-sm uppercase tracking-wider mb-2`}
               style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Cumulative Gold
          </div>
          <div className={`${textColor} text-6xl tabular-nums`}
               style={{
                 fontFamily: 'Saira Condensed, sans-serif',
                 fontWeight: 200,
                 textShadow: `0 0 25px ${glowColor}`
               }}>
            12,869
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// CONCEPT 3: "corner-bracket"
// Asymmetric layout with corner brackets and floating metrics
// ==========================================
const CornerBracketConcept = ({ useYellowGlow }: { useYellowGlow: boolean }) => {
  const themeColor = useYellowGlow ? 'yellow' : 'cyan';
  const glowColor = useYellowGlow ? 'rgba(250, 182, 23, 0.4)' : 'rgba(0, 212, 255, 0.4)';
  const textColor = useYellowGlow ? 'text-yellow-400' : 'text-cyan-400';
  const borderColor = useYellowGlow ? '#fab617' : '#00d4ff';

  return (
    <div className="relative p-6 bg-black/60 backdrop-blur-sm border-2 rounded-lg"
         style={{
           borderColor: borderColor,
           boxShadow: `0 0 30px ${glowColor}, inset 0 0 20px ${glowColor}`
         }}>
      {/* Gradient overlay */}
      <div className="absolute inset-0 h-24 opacity-20 pointer-events-none rounded-lg"
           style={{
             background: `linear-gradient(90deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 50%)`
           }} />

      {/* Top-left corner brackets */}
      <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none">
        <div className={`absolute top-4 left-4 w-8 h-0.5 ${useYellowGlow ? 'bg-yellow-400' : 'bg-cyan-400'}`}
             style={{ boxShadow: `0 0 8px ${glowColor}` }} />
        <div className={`absolute top-4 left-4 w-0.5 h-8 ${useYellowGlow ? 'bg-yellow-400' : 'bg-cyan-400'}`}
             style={{ boxShadow: `0 0 8px ${glowColor}` }} />
      </div>

      {/* Bottom-right corner brackets */}
      <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none">
        <div className={`absolute bottom-4 right-4 w-8 h-0.5 ${useYellowGlow ? 'bg-yellow-400' : 'bg-cyan-400'}`}
             style={{ boxShadow: `0 0 8px ${glowColor}` }} />
        <div className={`absolute bottom-4 right-4 w-0.5 h-8 ${useYellowGlow ? 'bg-yellow-400' : 'bg-cyan-400'}`}
             style={{ boxShadow: `0 0 8px ${glowColor}` }} />
      </div>

      {/* Main content - asymmetric grid */}
      <div className="relative grid grid-cols-3 gap-4 items-center">
        {/* Left: Cumulative (takes 2 columns) */}
        <div className="col-span-2">
          <div className="text-white/40 text-xs uppercase tracking-wider mb-1"
               style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            CUMULATIVE
          </div>
          <div className="flex items-baseline gap-2">
            <div className={`${textColor} text-5xl tabular-nums`}
                 style={{
                   fontFamily: 'Saira Condensed, sans-serif',
                   fontWeight: 200,
                   textShadow: `0 0 20px ${glowColor}`
                 }}>
              12,869
            </div>
            <div className="text-white/50 text-base uppercase"
                 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
              G
            </div>
          </div>
        </div>

        {/* Right: Divider + Income Rate (takes 1 column) */}
        <div className="col-span-1 flex items-center h-full">
          {/* Vertical divider */}
          <div className={`w-0.5 h-20 mr-4 ${useYellowGlow ? 'bg-yellow-400/30' : 'bg-cyan-400/30'}`}
               style={{ boxShadow: `0 0 10px ${glowColor}` }} />

          {/* Income metric - vertical layout */}
          <div className="flex-1">
            <div className={`${textColor}/70 text-[10px] uppercase tracking-wider mb-1`}
                 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
              INCOME
            </div>
            <div className={`${textColor} text-2xl tabular-nums leading-tight`}
                 style={{
                   fontFamily: 'Saira Condensed, sans-serif',
                   fontWeight: 200,
                   textShadow: `0 0 12px ${glowColor}`
                 }}>
              2,125
            </div>
            <div className="text-white/40 text-xs uppercase mt-0.5"
                 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
              G/hr
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// DEMO WRAPPER - Shows all 3 concepts
// ==========================================
export const CombinedGoldCardDemo = () => {
  const [useYellowGlow, setUseYellowGlow] = React.useState(true);

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Theme Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={() => setUseYellowGlow(true)}
            className={`px-6 py-2 rounded-lg border-2 transition-all ${
              useYellowGlow
                ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400'
                : 'border-gray-600 bg-gray-800 text-gray-400'
            }`}>
            Yellow Theme
          </button>
          <button
            onClick={() => setUseYellowGlow(false)}
            className={`px-6 py-2 rounded-lg border-2 transition-all ${
              !useYellowGlow
                ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400'
                : 'border-gray-600 bg-gray-800 text-gray-400'
            }`}>
            Cyan Theme
          </button>
        </div>

        {/* Concept 1: Diagonal Split */}
        <div>
          <h2 className="text-white text-xl font-bold mb-4 uppercase tracking-wider"
              style={{ fontFamily: 'Inter, sans-serif' }}>
            Concept 1: Diagonal Split
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Diagonal gradient with contrasting placement - cumulative dominates top-left, income floats bottom-right
          </p>
          <div className="max-w-md">
            <DiagonalSplitConcept useYellowGlow={useYellowGlow} />
          </div>
        </div>

        {/* Concept 2: Layered Cards */}
        <div>
          <h2 className="text-white text-xl font-bold mb-4 uppercase tracking-wider"
              style={{ fontFamily: 'Inter, sans-serif' }}>
            Concept 2: Layered Cards
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Stacked cards with offset overlap create depth - cumulative in front, income visible behind
          </p>
          <div className="max-w-md">
            <LayeredCardsConcept useYellowGlow={useYellowGlow} />
          </div>
        </div>

        {/* Concept 3: Corner Bracket */}
        <div>
          <h2 className="text-white text-xl font-bold mb-4 uppercase tracking-wider"
              style={{ fontFamily: 'Inter, sans-serif' }}>
            Concept 3: Corner Bracket
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Asymmetric 2:1 grid with corner brackets - cumulative takes 2/3 width, income in vertical column
          </p>
          <div className="max-w-md">
            <CornerBracketConcept useYellowGlow={useYellowGlow} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Export individual concepts for direct use
export const COMBINED_GOLD_CONCEPTS = {
  'diagonal-split': DiagonalSplitConcept,
  'layered-cards': LayeredCardsConcept,
  'corner-bracket': CornerBracketConcept,
};
