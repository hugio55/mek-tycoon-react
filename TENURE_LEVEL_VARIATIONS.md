// 5 TENURE/LEVEL BAR STYLE VARIATIONS
// Copy the variation you want into MekProfileLightbox.tsx

// =============================================================================
// VARIATION 1: CURRENT STYLE (Labels on Sides)
// Layout: TENURE (left) | [10 bars] | LEVEL (right)
// =============================================================================
<div className="flex items-center justify-between gap-2 sm:gap-3">
  {/* Left Label: TENURE */}
  <div className="flex flex-col items-center gap-0.5 shrink-0">
    <div className="mek-label-uppercase text-[9px]">TENURE</div>
    <div className="text-white text-sm font-bold">10/h</div>
  </div>

  {/* Middle: 10 Bars */}
  <div className="flex gap-1 sm:gap-1.5 flex-1">
    {Array.from({ length: 10 }, (_, i) => {
      const barLevel = i + 1;
      const currentLevel = 8;
      const displayLevel = currentLevel <= 10 ? currentLevel : 10;
      const isActive = barLevel <= displayLevel;
      const levelColor = levelColors[currentLevel - 1] || '#FFFFFF';

      return (
        <div key={barLevel} className="flex-1">
          <div
            className="h-10 sm:h-8 transition-all duration-500 rounded-sm relative overflow-hidden"
            style={{
              backgroundColor: isActive ? levelColor : '#1a1a1a',
              backgroundImage: isActive
                ? 'none'
                : 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(102, 102, 102, 0.1) 2px, rgba(102, 102, 102, 0.1) 4px)',
              border: isActive ? `1px solid ${levelColor}` : '1px solid #666',
              boxShadow: isActive
                ? `0 0 12px ${levelColor}80, inset 0 -4px 8px rgba(0,0,0,0.4)`
                : 'inset 0 2px 4px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(102, 102, 102, 0.2)',
              opacity: isActive ? 1 : 0.5,
            }}
          >
            {isActive && (
              <>
                <div
                  className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                  style={{
                    height: '100%',
                    background: `linear-gradient(to top, ${levelColor}, ${levelColor}80 50%, transparent)`,
                  }}
                />
                <div
                  className="absolute top-0 left-0 right-0 h-1/4"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
                  }}
                />
              </>
            )}
          </div>
        </div>
      );
    })}
  </div>

  {/* Right Label: LEVEL */}
  <div className="flex flex-col items-center gap-0.5 shrink-0">
    <div className="mek-label-uppercase text-[9px]">LEVEL</div>
    <div className="text-white text-sm font-bold">5</div>
  </div>
</div>


// =============================================================================
// VARIATION 2: STACKED STYLE (Labels Above Bars)
// Layout: TENURE (top left) | LEVEL (top right)
//         [10 bars spanning full width below]
// =============================================================================
<div className="flex flex-col gap-2">
  {/* Top Row: Both Labels */}
  <div className="flex items-center justify-between px-1">
    <div className="flex items-center gap-2">
      <div className="mek-label-uppercase text-[9px]">TENURE</div>
      <div className="text-yellow-400 text-base font-bold tracking-wide">10.0/h</div>
    </div>
    <div className="flex items-center gap-2">
      <div className="mek-label-uppercase text-[9px]">LEVEL</div>
      <div className="text-white text-base font-bold tracking-wide">5</div>
    </div>
  </div>

  {/* Bottom Row: 10 Bars */}
  <div className="flex gap-1 sm:gap-1.5">
    {Array.from({ length: 10 }, (_, i) => {
      const barLevel = i + 1;
      const currentLevel = 8;
      const displayLevel = currentLevel <= 10 ? currentLevel : 10;
      const isActive = barLevel <= displayLevel;
      const levelColor = levelColors[currentLevel - 1] || '#FFFFFF';

      return (
        <div key={barLevel} className="flex-1">
          <div
            className="h-10 sm:h-8 transition-all duration-500 rounded-sm relative overflow-hidden"
            style={{
              backgroundColor: isActive ? levelColor : '#1a1a1a',
              backgroundImage: isActive
                ? 'none'
                : 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(102, 102, 102, 0.1) 2px, rgba(102, 102, 102, 0.1) 4px)',
              border: isActive ? `1px solid ${levelColor}` : '1px solid #666',
              boxShadow: isActive
                ? `0 0 12px ${levelColor}80, inset 0 -4px 8px rgba(0,0,0,0.4)`
                : 'inset 0 2px 4px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(102, 102, 102, 0.2)',
              opacity: isActive ? 1 : 0.5,
            }}
          >
            {isActive && (
              <>
                <div
                  className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                  style={{
                    height: '100%',
                    background: `linear-gradient(to top, ${levelColor}, ${levelColor}80 50%, transparent)`,
                  }}
                />
                <div
                  className="absolute top-0 left-0 right-0 h-1/4"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
                  }}
                />
              </>
            )}
          </div>
        </div>
      );
    })}
  </div>
</div>


// =============================================================================
// VARIATION 3: VERTICAL SIDE-BY-SIDE (Labels Beside Bars)
// Layout: TENURE    [10 bars]
//         10/h
//         LEVEL     (bars vertically centered)
//         5
// =============================================================================
<div className="flex items-center gap-3">
  {/* Left Column: Labels Stacked Vertically */}
  <div className="flex flex-col items-end gap-1 shrink-0 pr-2 border-r border-yellow-500/30">
    <div className="flex flex-col items-end gap-0">
      <div className="mek-label-uppercase text-[8px] leading-tight">TENURE</div>
      <div className="text-yellow-400 text-xs font-bold">10.0/h</div>
    </div>
    <div className="flex flex-col items-end gap-0 mt-1">
      <div className="mek-label-uppercase text-[8px] leading-tight">LEVEL</div>
      <div className="text-white text-xs font-bold">5</div>
    </div>
  </div>

  {/* Right Column: 10 Bars */}
  <div className="flex gap-1 sm:gap-1.5 flex-1">
    {Array.from({ length: 10 }, (_, i) => {
      const barLevel = i + 1;
      const currentLevel = 8;
      const displayLevel = currentLevel <= 10 ? currentLevel : 10;
      const isActive = barLevel <= displayLevel;
      const levelColor = levelColors[currentLevel - 1] || '#FFFFFF';

      return (
        <div key={barLevel} className="flex-1">
          <div
            className="h-10 sm:h-8 transition-all duration-500 rounded-sm relative overflow-hidden"
            style={{
              backgroundColor: isActive ? levelColor : '#1a1a1a',
              backgroundImage: isActive
                ? 'none'
                : 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(102, 102, 102, 0.1) 2px, rgba(102, 102, 102, 0.1) 4px)',
              border: isActive ? `1px solid ${levelColor}` : '1px solid #666',
              boxShadow: isActive
                ? `0 0 12px ${levelColor}80, inset 0 -4px 8px rgba(0,0,0,0.4)`
                : 'inset 0 2px 4px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(102, 102, 102, 0.2)',
              opacity: isActive ? 1 : 0.5,
            }}
          >
            {isActive && (
              <>
                <div
                  className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                  style={{
                    height: '100%',
                    background: `linear-gradient(to top, ${levelColor}, ${levelColor}80 50%, transparent)`,
                  }}
                />
                <div
                  className="absolute top-0 left-0 right-0 h-1/4"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
                  }}
                />
              </>
            )}
          </div>
        </div>
      );
    })}
  </div>
</div>


// =============================================================================
// VARIATION 4: MINIMAL NUMBERS-ONLY (No Label Text)
// Layout: 10.0/h | [10 bars] | LVL 5
// Super clean, just the essential data
// =============================================================================
<div className="flex items-center gap-2 sm:gap-3">
  {/* Left: Tenure Rate Only */}
  <div className="shrink-0 min-w-[48px] text-center">
    <div className="text-yellow-400 text-base font-bold tracking-wider">10.0/h</div>
  </div>

  {/* Middle: 10 Bars */}
  <div className="flex gap-1 sm:gap-1.5 flex-1">
    {Array.from({ length: 10 }, (_, i) => {
      const barLevel = i + 1;
      const currentLevel = 8;
      const displayLevel = currentLevel <= 10 ? currentLevel : 10;
      const isActive = barLevel <= displayLevel;
      const levelColor = levelColors[currentLevel - 1] || '#FFFFFF';

      return (
        <div key={barLevel} className="flex-1">
          <div
            className="h-10 sm:h-8 transition-all duration-500 rounded-sm relative overflow-hidden"
            style={{
              backgroundColor: isActive ? levelColor : '#1a1a1a',
              backgroundImage: isActive
                ? 'none'
                : 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(102, 102, 102, 0.1) 2px, rgba(102, 102, 102, 0.1) 4px)',
              border: isActive ? `1px solid ${levelColor}` : '1px solid #666',
              boxShadow: isActive
                ? `0 0 12px ${levelColor}80, inset 0 -4px 8px rgba(0,0,0,0.4)`
                : 'inset 0 2px 4px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(102, 102, 102, 0.2)',
              opacity: isActive ? 1 : 0.5,
            }}
          >
            {isActive && (
              <>
                <div
                  className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                  style={{
                    height: '100%',
                    background: `linear-gradient(to top, ${levelColor}, ${levelColor}80 50%, transparent)`,
                  }}
                />
                <div
                  className="absolute top-0 left-0 right-0 h-1/4"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
                  }}
                />
              </>
            )}
          </div>
        </div>
      );
    })}
  </div>

  {/* Right: Level Only */}
  <div className="shrink-0 min-w-[48px] text-center">
    <div className="text-white text-base font-bold tracking-wider">LVL 5</div>
  </div>
</div>


// =============================================================================
// VARIATION 5: BADGE STYLE (Labels as Pills/Badges)
// Layout: [TENURE 10.0/h] | [10 bars] | [LEVEL 5]
// Industrial badge aesthetic with borders and backgrounds
// =============================================================================
<div className="flex items-center gap-2 sm:gap-3">
  {/* Left Badge: TENURE */}
  <div className="shrink-0">
    <div className="bg-yellow-500/10 border border-yellow-500/50 px-2.5 py-1 rounded-sm">
      <div className="flex flex-col items-center gap-0">
        <div className="text-[8px] text-yellow-400 uppercase tracking-widest font-bold">TENURE</div>
        <div className="text-yellow-400 text-sm font-bold leading-tight">10.0/h</div>
      </div>
    </div>
  </div>

  {/* Middle: 10 Bars */}
  <div className="flex gap-1 sm:gap-1.5 flex-1">
    {Array.from({ length: 10 }, (_, i) => {
      const barLevel = i + 1;
      const currentLevel = 8;
      const displayLevel = currentLevel <= 10 ? currentLevel : 10;
      const isActive = barLevel <= displayLevel;
      const levelColor = levelColors[currentLevel - 1] || '#FFFFFF';

      return (
        <div key={barLevel} className="flex-1">
          <div
            className="h-10 sm:h-8 transition-all duration-500 rounded-sm relative overflow-hidden"
            style={{
              backgroundColor: isActive ? levelColor : '#1a1a1a',
              backgroundImage: isActive
                ? 'none'
                : 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(102, 102, 102, 0.1) 2px, rgba(102, 102, 102, 0.1) 4px)',
              border: isActive ? `1px solid ${levelColor}` : '1px solid #666',
              boxShadow: isActive
                ? `0 0 12px ${levelColor}80, inset 0 -4px 8px rgba(0,0,0,0.4)`
                : 'inset 0 2px 4px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(102, 102, 102, 0.2)',
              opacity: isActive ? 1 : 0.5,
            }}
          >
            {isActive && (
              <>
                <div
                  className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                  style={{
                    height: '100%',
                    background: `linear-gradient(to top, ${levelColor}, ${levelColor}80 50%, transparent)`,
                  }}
                />
                <div
                  className="absolute top-0 left-0 right-0 h-1/4"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
                  }}
                />
              </>
            )}
          </div>
        </div>
      );
    })}
  </div>

  {/* Right Badge: LEVEL */}
  <div className="shrink-0">
    <div className="bg-gray-800/60 border border-gray-500/50 px-2.5 py-1 rounded-sm">
      <div className="flex flex-col items-center gap-0">
        <div className="text-[8px] text-gray-300 uppercase tracking-widest font-bold">LEVEL</div>
        <div className="text-white text-sm font-bold leading-tight">5</div>
      </div>
    </div>
  </div>
</div>
