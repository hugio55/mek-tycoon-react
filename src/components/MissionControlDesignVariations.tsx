import React from 'react';

interface RewardData {
  gold: string;
  essence: string | null;
  chipT1: string | null;
  special: string | null;
}

interface DesignVariationProps {
  rewards: RewardData;
  onDeploy: () => void;
  canDeploy: boolean;
  nodeType: string;
}

// DESIGN VARIATION 1: TACTICAL GRID - Compact 2x2 with Integrated Deploy
export const TacticalGrid: React.FC<DesignVariationProps> = ({ rewards, onDeploy, canDeploy, nodeType }) => {
  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 uppercase tracking-[0.2em] font-semibold">DEPLOYMENT PARAMETERS</div>

      {/* Compact 2x3 Grid - Deploy takes double width on top */}
      <div className="grid grid-cols-2 gap-2">

        {/* DEPLOY BUTTON - Full width top row */}
        <button
          onClick={onDeploy}
          disabled={!canDeploy}
          className={`
            col-span-2 h-12 relative overflow-hidden
            ${canDeploy
              ? 'bg-gradient-to-r from-yellow-600/80 to-yellow-500/80 border-2 border-yellow-400 hover:from-yellow-500 hover:to-yellow-400 transform hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-gray-800/60 border-2 border-gray-700 cursor-not-allowed opacity-50'}
            rounded-sm transition-all duration-200
            font-black text-sm tracking-[0.3em] uppercase
            ${canDeploy ? 'text-black shadow-[0_0_20px_rgba(250,204,21,0.3)]' : 'text-gray-600'}
          `}
          style={{ fontFamily: 'Orbitron, monospace' }}
        >
          {/* Hazard stripes overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="h-full w-full" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, black 10px, black 20px)'
            }} />
          </div>

          <span className="relative z-10 flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L22 8V16L12 22L2 16V8L12 2Z" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8V16M8 10L12 8L16 10" stroke="currentColor" strokeWidth="2" />
            </svg>
            DEPLOY
          </span>
        </button>

        {/* Reward Grid - 2x2 below deploy */}
        <div className="bg-black/60 border border-yellow-500/30 p-2 rounded-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-yellow-500/20 to-transparent" />
          <div className="text-[10px] text-gray-500 uppercase mb-1 tracking-wider">GOLD</div>
          <div className="text-yellow-400 font-bold text-sm" style={{ fontFamily: 'Orbitron, monospace' }}>
            {rewards.gold}
          </div>
        </div>

        <div className={`bg-black/60 border p-2 rounded-sm relative overflow-hidden ${rewards.essence ? 'border-purple-500/30' : 'border-gray-700/30'}`}>
          <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-purple-500/10 to-transparent" />
          <div className="text-[10px] text-gray-500 uppercase mb-1 tracking-wider">ESSENCE</div>
          <div className={rewards.essence ? 'text-purple-400 font-bold text-sm' : 'text-gray-600 text-sm'} style={{ fontFamily: 'Orbitron, monospace' }}>
            {rewards.essence || '---'}
          </div>
        </div>

        <div className={`bg-black/60 border p-2 rounded-sm relative overflow-hidden ${rewards.chipT1 ? 'border-cyan-500/30' : 'border-gray-700/30'}`}>
          <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-cyan-500/10 to-transparent" />
          <div className="text-[10px] text-gray-500 uppercase mb-1 tracking-wider">CHIP T1</div>
          <div className={rewards.chipT1 ? 'text-cyan-400 font-bold text-sm' : 'text-gray-600 text-sm'} style={{ fontFamily: 'Orbitron, monospace' }}>
            {rewards.chipT1 || '---'}
          </div>
        </div>

        <div className={`bg-black/60 border p-2 rounded-sm relative overflow-hidden ${rewards.special ? 'border-green-500/30' : 'border-gray-700/30'}`}>
          <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-green-500/10 to-transparent" />
          <div className="text-[10px] text-gray-500 uppercase mb-1 tracking-wider">SPECIAL</div>
          <div className={rewards.special ? 'text-green-400 font-bold text-sm' : 'text-gray-600 text-sm'} style={{ fontFamily: 'Orbitron, monospace' }}>
            {rewards.special || '---'}
          </div>
        </div>
      </div>
    </div>
  );
};

// DESIGN VARIATION 2: COMMAND CENTER - Horizontal Strip with Side Deploy
export const CommandCenter: React.FC<DesignVariationProps> = ({ rewards, onDeploy, canDeploy, nodeType }) => {
  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 uppercase tracking-[0.2em] font-semibold">MISSION RESOURCES</div>

      <div className="flex gap-2">
        {/* Left - Rewards in horizontal strip */}
        <div className="flex-1 bg-black/80 border-2 border-yellow-500/20 rounded-sm p-3">
          <div className="grid grid-cols-4 gap-3">
            {/* Gold */}
            <div className="text-center">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">GOLD</div>
              <div className="bg-gradient-to-b from-yellow-500/20 to-transparent px-2 py-1 rounded-sm border border-yellow-500/40">
                <div className="text-yellow-400 font-bold text-xs" style={{ fontFamily: 'Orbitron, monospace' }}>
                  {rewards.gold}
                </div>
              </div>
            </div>

            {/* Essence */}
            <div className="text-center">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">ESSENCE</div>
              <div className={`bg-gradient-to-b px-2 py-1 rounded-sm border ${rewards.essence ? 'from-purple-500/20 to-transparent border-purple-500/40' : 'from-gray-800/20 to-transparent border-gray-700/40'}`}>
                <div className={rewards.essence ? 'text-purple-400 font-bold text-xs' : 'text-gray-600 text-xs'} style={{ fontFamily: 'Orbitron, monospace' }}>
                  {rewards.essence || '---'}
                </div>
              </div>
            </div>

            {/* Chip T1 */}
            <div className="text-center">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">CHIP T1</div>
              <div className={`bg-gradient-to-b px-2 py-1 rounded-sm border ${rewards.chipT1 ? 'from-cyan-500/20 to-transparent border-cyan-500/40' : 'from-gray-800/20 to-transparent border-gray-700/40'}`}>
                <div className={rewards.chipT1 ? 'text-cyan-400 font-bold text-xs' : 'text-gray-600 text-xs'} style={{ fontFamily: 'Orbitron, monospace' }}>
                  {rewards.chipT1 || '---'}
                </div>
              </div>
            </div>

            {/* Special */}
            <div className="text-center">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">SPECIAL</div>
              <div className={`bg-gradient-to-b px-2 py-1 rounded-sm border ${rewards.special ? 'from-green-500/20 to-transparent border-green-500/40' : 'from-gray-800/20 to-transparent border-gray-700/40'}`}>
                <div className={rewards.special ? 'text-green-400 font-bold text-xs' : 'text-gray-600 text-xs'} style={{ fontFamily: 'Orbitron, monospace' }}>
                  {rewards.special || '---'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Tall Deploy Button */}
        <button
          onClick={onDeploy}
          disabled={!canDeploy}
          className={`
            w-24 relative overflow-hidden
            ${canDeploy
              ? 'bg-gradient-to-b from-yellow-600 to-yellow-700 border-2 border-yellow-400 hover:from-yellow-500 hover:to-yellow-600 transform hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-gray-800/60 border-2 border-gray-700 cursor-not-allowed opacity-50'}
            rounded-sm transition-all duration-200
            font-black text-xs tracking-[0.2em] uppercase
            ${canDeploy ? 'text-black shadow-[0_0_30px_rgba(250,204,21,0.4)]' : 'text-gray-600'}
          `}
          style={{ fontFamily: 'Orbitron, monospace' }}
        >
          <div className="flex flex-col items-center justify-center h-full gap-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L20 7V12L12 17L4 12V7L12 2Z" stroke="currentColor" strokeWidth="2.5" fill={canDeploy ? 'currentColor' : 'none'} opacity={canDeploy ? 0.3 : 1} />
              <path d="M12 7V13M9 9L12 7L15 9" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>DEPLOY</span>
          </div>
        </button>
      </div>
    </div>
  );
};

// DESIGN VARIATION 3: HIERARCHICAL STACK - Resources Above, Deploy Below
export const HierarchicalStack: React.FC<DesignVariationProps> = ({ rewards, onDeploy, canDeploy, nodeType }) => {
  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 uppercase tracking-[0.2em] font-semibold flex items-center gap-2">
        <div className="w-8 h-[1px] bg-yellow-500/30" />
        DEPLOYMENT COST
        <div className="flex-1 h-[1px] bg-yellow-500/30" />
      </div>

      {/* Primary Resource Highlight */}
      <div className="bg-gradient-to-br from-yellow-500/10 to-transparent border-2 border-yellow-500/40 rounded-sm p-3 relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-400" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-yellow-400" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-yellow-400" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-400" />
        </div>

        <div className="text-center relative z-10">
          <div className="text-[10px] text-yellow-600 uppercase tracking-[0.3em] mb-1 font-semibold">PRIMARY</div>
          <div className="text-2xl font-black text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {rewards.gold}
          </div>
          <div className="text-[9px] text-yellow-500/60 uppercase mt-1">GOLD REQUIRED</div>
        </div>
      </div>

      {/* Secondary Resources */}
      <div className="grid grid-cols-3 gap-2">
        <div className={`bg-black/60 border rounded-sm p-2 text-center ${rewards.essence ? 'border-purple-500/40' : 'border-gray-700/30'}`}>
          <div className="text-[9px] text-gray-500 uppercase tracking-wider">ESSENCE</div>
          <div className={rewards.essence ? 'text-purple-400 font-bold text-sm mt-1' : 'text-gray-600 text-sm mt-1'} style={{ fontFamily: 'Orbitron, monospace' }}>
            {rewards.essence || '---'}
          </div>
        </div>

        <div className={`bg-black/60 border rounded-sm p-2 text-center ${rewards.chipT1 ? 'border-cyan-500/40' : 'border-gray-700/30'}`}>
          <div className="text-[9px] text-gray-500 uppercase tracking-wider">CHIP T1</div>
          <div className={rewards.chipT1 ? 'text-cyan-400 font-bold text-sm mt-1' : 'text-gray-600 text-sm mt-1'} style={{ fontFamily: 'Orbitron, monospace' }}>
            {rewards.chipT1 || '---'}
          </div>
        </div>

        <div className={`bg-black/60 border rounded-sm p-2 text-center ${rewards.special ? 'border-green-500/40' : 'border-gray-700/30'}`}>
          <div className="text-[9px] text-gray-500 uppercase tracking-wider">SPECIAL</div>
          <div className={rewards.special ? 'text-green-400 font-bold text-sm mt-1' : 'text-gray-600 text-sm mt-1'} style={{ fontFamily: 'Orbitron, monospace' }}>
            {rewards.special || '---'}
          </div>
        </div>
      </div>

      {/* Full Width Deploy at Bottom */}
      <button
        onClick={onDeploy}
        disabled={!canDeploy}
        className={`
          w-full h-11 relative overflow-hidden
          ${canDeploy
            ? 'bg-gradient-to-r from-yellow-600/90 via-yellow-500/90 to-yellow-600/90 border-y-2 border-yellow-400 hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-500 transform hover:scale-[1.01] active:scale-[0.99]'
            : 'bg-gray-900/60 border-y-2 border-gray-700 cursor-not-allowed opacity-40'}
          transition-all duration-200
          font-black text-sm tracking-[0.35em] uppercase
          ${canDeploy ? 'text-black shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]' : 'text-gray-600'}
        `}
        style={{ fontFamily: 'Orbitron, monospace' }}
      >
        {/* Animated scan line for active state */}
        {canDeploy && (
          <div className="absolute inset-0 opacity-30">
            <div className="h-full w-full animate-pulse bg-gradient-to-r from-transparent via-yellow-300 to-transparent" />
          </div>
        )}

        <span className="relative z-10">INITIATE DEPLOYMENT</span>
      </button>
    </div>
  );
};

// DESIGN VARIATION 4: MILITARY CONSOLE - Segmented Display with Corner Deploy
export const MilitaryConsole: React.FC<DesignVariationProps> = ({ rewards, onDeploy, canDeploy, nodeType }) => {
  return (
    <div className="space-y-3">
      <div className="bg-black/90 border-2 border-yellow-500/30 rounded-sm relative">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent border-b border-yellow-500/20 px-3 py-1">
          <div className="text-[10px] text-yellow-500 uppercase tracking-[0.3em] font-bold text-center" style={{ fontFamily: 'Orbitron, monospace' }}>
            RESOURCE ALLOCATION
          </div>
        </div>

        {/* Content Area */}
        <div className="p-3">
          <div className="flex gap-3">
            {/* Left - Resources in vertical stack */}
            <div className="flex-1 space-y-2">
              {/* Gold - Primary */}
              <div className="bg-gradient-to-r from-yellow-500/5 to-transparent border-l-3 border-yellow-500 pl-3 py-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">GOLD</span>
                  <span className="text-yellow-400 font-bold text-sm" style={{ fontFamily: 'Orbitron, monospace' }}>
                    {rewards.gold}
                  </span>
                </div>
              </div>

              {/* Essence */}
              <div className={`bg-gradient-to-r ${rewards.essence ? 'from-purple-500/5' : 'from-gray-800/5'} to-transparent border-l-3 ${rewards.essence ? 'border-purple-500' : 'border-gray-700'} pl-3 py-1`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">ESSENCE</span>
                  <span className={rewards.essence ? 'text-purple-400 font-bold text-sm' : 'text-gray-600 text-sm'} style={{ fontFamily: 'Orbitron, monospace' }}>
                    {rewards.essence || '---'}
                  </span>
                </div>
              </div>

              {/* Chip T1 */}
              <div className={`bg-gradient-to-r ${rewards.chipT1 ? 'from-cyan-500/5' : 'from-gray-800/5'} to-transparent border-l-3 ${rewards.chipT1 ? 'border-cyan-500' : 'border-gray-700'} pl-3 py-1`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">CHIP T1</span>
                  <span className={rewards.chipT1 ? 'text-cyan-400 font-bold text-sm' : 'text-gray-600 text-sm'} style={{ fontFamily: 'Orbitron, monospace' }}>
                    {rewards.chipT1 || '---'}
                  </span>
                </div>
              </div>

              {/* Special */}
              <div className={`bg-gradient-to-r ${rewards.special ? 'from-green-500/5' : 'from-gray-800/5'} to-transparent border-l-3 ${rewards.special ? 'border-green-500' : 'border-gray-700'} pl-3 py-1`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">SPECIAL</span>
                  <span className={rewards.special ? 'text-green-400 font-bold text-sm' : 'text-gray-600 text-sm'} style={{ fontFamily: 'Orbitron, monospace' }}>
                    {rewards.special || '---'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right - Square Deploy Button */}
            <button
              onClick={onDeploy}
              disabled={!canDeploy}
              className={`
                w-20 h-20 relative overflow-hidden
                ${canDeploy
                  ? 'bg-gradient-to-br from-yellow-600 via-yellow-500 to-orange-600 border-2 border-yellow-400 hover:from-yellow-500 hover:via-yellow-400 hover:to-orange-500 transform hover:scale-[1.05] active:scale-[0.95]'
                  : 'bg-gray-800/60 border-2 border-gray-700 cursor-not-allowed opacity-50'}
                rounded-sm transition-all duration-200 group
                ${canDeploy ? 'shadow-[0_0_30px_rgba(250,204,21,0.5)]' : ''}
              `}
              style={{ fontFamily: 'Orbitron, monospace' }}
            >
              {/* Corner brackets */}
              <div className="absolute inset-1 border-2 border-black/30 rounded-sm pointer-events-none" />

              <div className="flex flex-col items-center justify-center h-full relative z-10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={canDeploy ? 'group-hover:rotate-12 transition-transform' : ''}>
                  <path d="M12 3L21 8V16L12 21L3 16V8L12 3Z" stroke="currentColor" strokeWidth="2" className={canDeploy ? 'text-black' : 'text-gray-600'} />
                  <path d="M12 8V16M8 10L12 8L16 10" stroke="currentColor" strokeWidth="2" className={canDeploy ? 'text-black' : 'text-gray-600'} />
                </svg>
                <span className={`font-black text-[11px] tracking-[0.25em] uppercase mt-1 ${canDeploy ? 'text-black' : 'text-gray-600'}`}>
                  DEPLOY
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// DESIGN VARIATION 5: ASYMMETRIC FOCUS - Hero Deploy with Supporting Resources
export const AsymmetricFocus: React.FC<DesignVariationProps> = ({ rewards, onDeploy, canDeploy, nodeType }) => {
  return (
    <div className="space-y-3">
      <div className="flex gap-3 items-stretch">
        {/* Left - Large Deploy Button */}
        <div className="flex-shrink-0">
          <button
            onClick={onDeploy}
            disabled={!canDeploy}
            className={`
              w-32 h-full min-h-[120px] relative overflow-hidden
              ${canDeploy
                ? 'bg-gradient-to-b from-yellow-500 via-yellow-600 to-yellow-700 border-2 border-yellow-400 hover:from-yellow-400 hover:via-yellow-500 hover:to-yellow-600 transform hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-gray-900/80 border-2 border-gray-700 cursor-not-allowed opacity-40'}
              rounded-sm transition-all duration-200
              ${canDeploy ? 'shadow-[0_10px_40px_rgba(250,204,21,0.3)]' : ''}
            `}
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            {/* Top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${canDeploy ? 'bg-gradient-to-r from-transparent via-white/30 to-transparent' : ''}`} />

            {/* Hazard frame */}
            <div className="absolute inset-2 border border-black/20 rounded-sm pointer-events-none" />

            <div className="flex flex-col items-center justify-center h-full relative z-10 gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className={canDeploy ? 'animate-pulse' : ''}>
                <path d="M12 2L22 8V16L12 22L2 16V8L12 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={canDeploy ? 'text-black' : 'text-gray-600'}
                      fill={canDeploy ? 'currentColor' : 'none'}
                      fillOpacity={canDeploy ? 0.2 : 0} />
                <path d="M12 7V17M7 10L12 7L17 10"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={canDeploy ? 'text-black' : 'text-gray-600'} />
              </svg>

              <div>
                <div className={`font-black text-base tracking-[0.3em] uppercase ${canDeploy ? 'text-black' : 'text-gray-600'}`}>
                  DEPLOY
                </div>
                <div className={`text-[9px] tracking-[0.2em] uppercase mt-0.5 ${canDeploy ? 'text-black/60' : 'text-gray-700'}`}>
                  MISSION READY
                </div>
              </div>
            </div>

            {/* Bottom accent line */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${canDeploy ? 'bg-gradient-to-r from-transparent via-orange-400/30 to-transparent' : ''}`} />
          </button>
        </div>

        {/* Right - Resource Grid */}
        <div className="flex-1">
          <div className="bg-black/80 border border-yellow-500/20 rounded-sm h-full p-3">
            <div className="text-[9px] text-gray-500 uppercase tracking-[0.3em] mb-2 text-center">MISSION COSTS</div>

            <div className="grid grid-cols-2 gap-2">
              {/* Gold - Larger emphasis */}
              <div className="col-span-2 bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent border border-yellow-500/30 rounded-sm p-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-yellow-600 uppercase tracking-wider font-semibold">GOLD</span>
                  <span className="text-yellow-400 font-black text-base" style={{ fontFamily: 'Orbitron, monospace' }}>
                    {rewards.gold}
                  </span>
                </div>
              </div>

              {/* Secondary resources - smaller */}
              <div className={`bg-black/40 border rounded-sm p-1.5 ${rewards.essence ? 'border-purple-500/30' : 'border-gray-700/20'}`}>
                <div className="text-[9px] text-gray-500 uppercase">ESSENCE</div>
                <div className={rewards.essence ? 'text-purple-400 font-bold text-xs' : 'text-gray-600 text-xs'} style={{ fontFamily: 'Orbitron, monospace' }}>
                  {rewards.essence || '---'}
                </div>
              </div>

              <div className={`bg-black/40 border rounded-sm p-1.5 ${rewards.chipT1 ? 'border-cyan-500/30' : 'border-gray-700/20'}`}>
                <div className="text-[9px] text-gray-500 uppercase">CHIP T1</div>
                <div className={rewards.chipT1 ? 'text-cyan-400 font-bold text-xs' : 'text-gray-600 text-xs'} style={{ fontFamily: 'Orbitron, monospace' }}>
                  {rewards.chipT1 || '---'}
                </div>
              </div>

              {/* Special - full width at bottom */}
              <div className={`col-span-2 bg-black/40 border rounded-sm p-1.5 ${rewards.special ? 'border-green-500/30' : 'border-gray-700/20'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-gray-500 uppercase">SPECIAL</span>
                  <span className={rewards.special ? 'text-green-400 font-bold text-xs' : 'text-gray-600 text-xs'} style={{ fontFamily: 'Orbitron, monospace' }}>
                    {rewards.special || '---'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export all variations
export const MissionControlVariations = {
  TacticalGrid,
  CommandCenter,
  HierarchicalStack,
  MilitaryConsole,
  AsymmetricFocus
};