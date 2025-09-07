"use client";

import { missionAilments } from "@/app/contracts/constants/missionData";

interface WeaknessIndicatorsProps {
  weaknesses: string[];
  hoveredAilment?: string | null;
  setHoveredAilment?: (ailment: string | null) => void;
  matchedCount?: number;
  variant?: "default" | "compact" | "detailed";
  showTooltip?: boolean;
  className?: string;
}

export default function WeaknessIndicators({
  weaknesses,
  hoveredAilment,
  setHoveredAilment,
  matchedCount = 0,
  variant = "default",
  showTooltip = true,
  className = ""
}: WeaknessIndicatorsProps) {
  
  const renderTooltip = (weakness: string) => {
    const ailment = missionAilments[weakness as keyof typeof missionAilments];
    if (!ailment || !showTooltip) return null;
    
    return (
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 rounded-lg p-2 text-xs whitespace-nowrap z-50 border border-gray-700 pointer-events-none">
        <div className="font-semibold text-yellow-400 mb-1">{ailment.name}</div>
        <div className="text-gray-300">Counters: {ailment.counters.join(", ")}</div>
      </div>
    );
  };

  if (variant === "compact") {
    return (
      <div className={`flex gap-1 ${className}`}>
        {weaknesses.map(weakness => {
          const ailment = missionAilments[weakness as keyof typeof missionAilments];
          if (!ailment) return null;
          
          return (
            <div 
              key={weakness}
              className="relative group"
              onMouseEnter={() => setHoveredAilment?.(weakness)}
              onMouseLeave={() => setHoveredAilment?.(null)}
            >
              <div className={`w-6 h-6 rounded bg-black/40 border ${matchedCount > 0 ? 'border-yellow-500/50' : 'border-gray-700/50'} flex items-center justify-center text-xs`}>
                {ailment.icon}
              </div>
              {hoveredAilment === weakness && renderTooltip(weakness)}
            </div>
          );
        })}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="text-xs text-gray-400 uppercase tracking-wider">Mission Weaknesses</div>
        <div className="flex flex-wrap gap-2">
          {weaknesses.map(weakness => {
            const ailment = missionAilments[weakness as keyof typeof missionAilments];
            if (!ailment) return null;
            
            const isMatched = matchedCount > 0;
            
            return (
              <div 
                key={weakness}
                className="relative group"
                onMouseEnter={() => setHoveredAilment?.(weakness)}
                onMouseLeave={() => setHoveredAilment?.(null)}
              >
                <div className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border transition-all
                  ${isMatched 
                    ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/20' 
                    : 'border-gray-700/50 hover:border-gray-600'
                  }
                `}>
                  <span className="text-lg">{ailment.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-200">{ailment.name}</div>
                    <div className="text-xs text-gray-500">Weakness</div>
                  </div>
                  {isMatched && (
                    <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  )}
                </div>
                {hoveredAilment === weakness && renderTooltip(weakness)}
              </div>
            );
          })}
        </div>
        {matchedCount > 0 && (
          <div className="text-xs text-green-400">
            {matchedCount} weakness{matchedCount !== 1 ? 'es' : ''} countered!
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex gap-2 ${className}`}>
      {weaknesses.map(weakness => {
        const ailment = missionAilments[weakness as keyof typeof missionAilments];
        if (!ailment) return null;
        
        return (
          <div 
            key={weakness}
            className="relative group/tooltip"
            onMouseEnter={() => setHoveredAilment?.(weakness)}
            onMouseLeave={() => setHoveredAilment?.(null)}
          >
            <div className={`
              w-10 h-10 rounded-lg bg-black/40 border flex items-center justify-center transition-all hover:scale-110
              ${matchedCount > 0 
                ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/20' 
                : 'border-gray-700/50'
              }
            `}>
              <span className="text-lg">{ailment.icon}</span>
            </div>
            {hoveredAilment === weakness && renderTooltip(weakness)}
          </div>
        );
      })}
    </div>
  );
}