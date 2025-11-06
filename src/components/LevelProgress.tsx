"use client";

export type LevelProgressStyle =
  | 'flat-bar'
  | 'arch'
  | 'segmented'
  | 'orbital'
  | 'diagonal'
  | 'segmented-vertical'
  | 'segmented-hex'
  | 'segmented-dual-row'
  | 'slide-up-card'
  | 'floating-badge'
  | 'recessed-panel'
  | 'tech-plate';

interface LevelProgressProps {
  currentLevel: number;
  currentXP: number;
  requiredXP: number;
  style?: LevelProgressStyle;
  useYellowGlow?: boolean;
}

export default function LevelProgress({
  currentLevel,
  currentXP,
  requiredXP,
  style = 'flat-bar',
  useYellowGlow = false
}: LevelProgressProps) {
  const progress = Math.min(Math.max((currentXP / requiredXP) * 100, 0), 100);
  const nextLevel = currentLevel + 1;

  // Color system based on useYellowGlow
  const primaryColor = useYellowGlow ? 'yellow' : 'cyan';
  const primaryHex = useYellowGlow ? '#fab617' : '#22d3ee';
  const primaryRGB = useYellowGlow ? '250, 182, 23' : '34, 211, 238';
  const gradientFrom = useYellowGlow ? 'from-yellow-500' : 'from-cyan-500';
  const gradientTo = useYellowGlow ? 'to-yellow-600' : 'to-cyan-600';
  const textColor = useYellowGlow ? 'text-yellow-400' : 'text-cyan-400';
  const borderColor = useYellowGlow ? 'border-yellow-500/30' : 'border-cyan-500/30';

  // Font classes
  const numberFont = 'font-[\'Saira_Condensed\']';
  const labelFont = 'font-[\'Inter\']';

  // Flat Bar Style (original style)
  const renderFlatBar = () => (
    <div className="space-y-2">
      {/* Title */}
      <div className={`${labelFont} text-xs ${textColor} uppercase tracking-widest text-center font-bold`}>
        LEVEL
      </div>

      {/* Level Numbers */}
      <div className="flex justify-between items-center">
        <span className={`${numberFont} text-3xl font-thin ${textColor}`}>{currentLevel}</span>
        <span className={`${numberFont} text-3xl font-thin text-gray-500`}>{nextLevel}</span>
      </div>

      {/* Progress Bar */}
      <div className={`relative w-full h-3 bg-black/60 border ${borderColor} overflow-hidden`}>
        <div
          className={`h-full bg-gradient-to-r ${gradientFrom} ${gradientTo} transition-all duration-500`}
          style={{
            width: `${progress}%`,
            boxShadow: `0 0 10px rgba(${primaryRGB}, 0.6)`
          }}
        />
      </div>

      {/* Label */}
      <div className={`${labelFont} text-[10px] text-gray-400 uppercase tracking-widest text-center`}>
        TENURE
      </div>
    </div>
  );

  // Arch Style
  const renderArch = () => (
    <div className="space-y-3">
      {/* Title */}
      <div className={`${labelFont} text-xs ${textColor} uppercase tracking-widest text-center font-bold`}>
        LEVEL
      </div>

      {/* Arch Container */}
      <div className="relative h-20 flex items-end justify-center">
        {/* Background Arch */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 80">
          <path
            d="M 20 70 Q 100 10, 180 70"
            fill="none"
            stroke={useYellowGlow ? 'rgba(250, 182, 23, 0.3)' : 'rgba(34, 211, 238, 0.3)'}
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Progress Arch */}
          <path
            d="M 20 70 Q 100 10, 180 70"
            fill="none"
            stroke={primaryHex}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="250"
            strokeDashoffset={250 - (250 * progress / 100)}
            style={{
              filter: `drop-shadow(0 0 6px ${primaryHex})`
            }}
          />
        </svg>

        {/* Level Numbers */}
        <div className="absolute inset-0 flex items-center justify-between px-2">
          <span className={`${numberFont} text-2xl font-thin ${textColor}`}>{currentLevel}</span>
          <span className={`${numberFont} text-2xl font-thin text-gray-500`}>{nextLevel}</span>
        </div>
      </div>

      {/* Label */}
      <div className={`${labelFont} text-[10px] text-gray-400 uppercase tracking-widest text-center`}>
        TENURE
      </div>
    </div>
  );

  // Segmented Style
  const renderSegmented = () => {
    const segments = 10;
    const filledSegments = Math.floor((progress / 100) * segments);

    return (
      <div className="space-y-2">
        {/* Title */}
        <div className={`${labelFont} text-xs ${textColor} uppercase tracking-widest text-center font-bold`}>
          LEVEL
        </div>

        {/* Level Numbers and Segments */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className={`${numberFont} text-3xl font-thin ${textColor}`}>{currentLevel}</span>
            <span className={`${numberFont} text-3xl font-thin text-gray-500`}>{nextLevel}</span>
          </div>

          {/* Segmented Bar */}
          <div className="flex gap-1">
            {Array.from({ length: segments }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 ${borderColor} border transition-all duration-300`}
                style={{
                  backgroundColor: i < filledSegments
                    ? primaryHex
                    : 'rgba(0, 0, 0, 0.6)',
                  boxShadow: i < filledSegments
                    ? `0 0 8px rgba(${primaryRGB}, 0.5)`
                    : 'none'
                }}
              />
            ))}
          </div>
        </div>

        {/* Label */}
        <div className={`${labelFont} text-[10px] text-gray-400 uppercase tracking-widest text-center`}>
          TENURE
        </div>
      </div>
    );
  };

  // Orbital Style
  const renderOrbital = () => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
      <div className="space-y-2">
        {/* Title */}
        <div className={`${labelFont} text-xs ${textColor} uppercase tracking-widest text-center font-bold`}>
          LEVEL
        </div>

        {/* Circular Progress */}
        <div className="flex items-center justify-center">
          <div className="relative w-28 h-28">
            {/* SVG Circle */}
            <svg className="w-full h-full -rotate-90">
              {/* Background Circle */}
              <circle
                cx="56"
                cy="56"
                r={radius}
                fill="none"
                stroke={useYellowGlow ? 'rgba(250, 182, 23, 0.2)' : 'rgba(34, 211, 238, 0.2)'}
                strokeWidth="6"
              />
              {/* Progress Circle */}
              <circle
                cx="56"
                cy="56"
                r={radius}
                fill="none"
                stroke={primaryHex}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{
                  filter: `drop-shadow(0 0 4px ${primaryHex})`,
                  transition: 'stroke-dashoffset 0.5s ease'
                }}
              />
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`${numberFont} text-4xl font-thin ${textColor}`}>{currentLevel}</span>
              <div className="w-8 h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent my-0.5" />
              <span className={`${numberFont} text-2xl font-thin text-gray-500`}>{nextLevel}</span>
            </div>
          </div>
        </div>

        {/* Label */}
        <div className={`${labelFont} text-[10px] text-gray-400 uppercase tracking-widest text-center`}>
          TENURE
        </div>
      </div>
    );
  };

  // Diagonal Style
  const renderDiagonal = () => (
    <div className="space-y-2">
      {/* Title */}
      <div className={`${labelFont} text-xs ${textColor} uppercase tracking-widest text-center font-bold`}>
        LEVEL
      </div>

      {/* Diagonal Container */}
      <div className="relative h-24 overflow-hidden">
        {/* Diagonal Background */}
        <div
          className="absolute inset-0 bg-black/60 border-2 border-gray-700/30"
          style={{
            transform: 'skewY(-3deg)',
            transformOrigin: 'left'
          }}
        />

        {/* Diagonal Progress */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} transition-all duration-500`}
          style={{
            transform: 'skewY(-3deg)',
            transformOrigin: 'left',
            width: `${progress}%`,
            boxShadow: `0 0 20px rgba(${primaryRGB}, 0.4)`
          }}
        />

        {/* Scan Line Effect */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_linear_infinite]"
          style={{
            transform: 'skewY(-3deg)',
            transformOrigin: 'left'
          }}
        />

        {/* Level Numbers */}
        <div className="relative h-full flex items-center justify-between px-4 z-10">
          <span className={`${numberFont} text-4xl font-thin ${textColor}`} style={{ textShadow: '0 0 10px rgba(0,0,0,0.8)' }}>
            {currentLevel}
          </span>
          <span className={`${numberFont} text-4xl font-thin text-gray-400`} style={{ textShadow: '0 0 10px rgba(0,0,0,0.8)' }}>
            {nextLevel}
          </span>
        </div>
      </div>

      {/* Label */}
      <div className={`${labelFont} text-[10px] text-gray-400 uppercase tracking-widest text-center`}>
        TENURE
      </div>
    </div>
  );

  // Segmented Vertical Style
  const renderSegmentedVertical = () => {
    const segments = 10;
    const filledSegments = Math.floor((progress / 100) * segments);

    return (
      <div className="space-y-2">
        {/* Title */}
        <div className={`${labelFont} text-xs ${textColor} uppercase tracking-widest text-center font-bold`}>
          LEVEL
        </div>

        {/* Main Container */}
        <div className="flex items-center justify-between gap-3">
          {/* Current Level */}
          <div className="flex flex-col items-center">
            <span className={`${numberFont} text-4xl font-thin ${textColor}`}>{currentLevel}</span>
            <span className={`${labelFont} text-[9px] text-gray-400 uppercase tracking-wider`}>LVL</span>
          </div>

          {/* Vertical Segments */}
          <div className="flex-1 flex items-end justify-center gap-1 h-16">
            {Array.from({ length: segments }).map((_, i) => (
              <div
                key={i}
                className={`w-full ${borderColor} border transition-all duration-300`}
                style={{
                  height: `${((i + 1) / segments) * 100}%`,
                  backgroundColor: i < filledSegments
                    ? primaryHex
                    : 'rgba(0, 0, 0, 0.6)',
                  boxShadow: i < filledSegments
                    ? `0 0 8px rgba(${primaryRGB}, 0.5)`
                    : 'none'
                }}
              />
            ))}
          </div>

          {/* Next Level */}
          <div className="flex flex-col items-center">
            <span className={`${numberFont} text-4xl font-thin text-gray-500`}>{nextLevel}</span>
            <span className={`${labelFont} text-[9px] text-gray-500 uppercase tracking-wider`}>LVL</span>
          </div>
        </div>

        {/* Label */}
        <div className={`${labelFont} text-[10px] text-gray-400 uppercase tracking-widest text-center`}>
          TENURE
        </div>
      </div>
    );
  };

  // Segmented Hex Style
  const renderSegmentedHex = () => {
    const segments = 8;
    const filledSegments = Math.floor((progress / 100) * segments);

    return (
      <div className="space-y-2">
        {/* Title */}
        <div className={`${labelFont} text-xs ${textColor} uppercase tracking-widest text-center font-bold`}>
          LEVEL
        </div>

        {/* Main Container */}
        <div className="space-y-3">
          {/* Level Numbers */}
          <div className="flex justify-between items-center px-2">
            <div className="flex flex-col items-center">
              <span className={`${numberFont} text-3xl font-thin ${textColor}`}>{currentLevel}</span>
              <span className={`${labelFont} text-[9px] text-gray-400 uppercase tracking-wider`}>LVL</span>
            </div>
            <div className="flex flex-col items-center">
              <span className={`${numberFont} text-3xl font-thin text-gray-500`}>{nextLevel}</span>
              <span className={`${labelFont} text-[9px] text-gray-500 uppercase tracking-wider`}>LVL</span>
            </div>
          </div>

          {/* Hexagonal Segments */}
          <div className="flex gap-1 justify-center">
            {Array.from({ length: segments }).map((_, i) => (
              <div
                key={i}
                className={`w-6 h-7 ${borderColor} border transition-all duration-300 relative`}
                style={{
                  clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
                  backgroundColor: i < filledSegments
                    ? primaryHex
                    : 'rgba(0, 0, 0, 0.6)',
                  boxShadow: i < filledSegments
                    ? `0 0 10px rgba(${primaryRGB}, 0.6)`
                    : 'none'
                }}
              />
            ))}
          </div>
        </div>

        {/* Label */}
        <div className={`${labelFont} text-[10px] text-gray-400 uppercase tracking-widest text-center`}>
          TENURE
        </div>
      </div>
    );
  };

  // Segmented Dual Row Style
  const renderSegmentedDualRow = () => {
    const segmentsPerRow = 5;
    const totalSegments = segmentsPerRow * 2;
    const filledSegments = Math.floor((progress / 100) * totalSegments);

    return (
      <div className="space-y-2">
        {/* Title */}
        <div className={`${labelFont} text-xs ${textColor} uppercase tracking-widest text-center font-bold`}>
          LEVEL
        </div>

        {/* Main Container */}
        <div className="space-y-2">
          {/* Level Numbers */}
          <div className="flex justify-between items-center">
            <div className="flex flex-col items-center">
              <span className={`${numberFont} text-3xl font-thin ${textColor}`}>{currentLevel}</span>
              <span className={`${labelFont} text-[9px] text-gray-400 uppercase tracking-wider`}>LVL</span>
            </div>
            <div className="flex flex-col items-center">
              <span className={`${numberFont} text-3xl font-thin text-gray-500`}>{nextLevel}</span>
              <span className={`${labelFont} text-[9px] text-gray-500 uppercase tracking-wider`}>LVL</span>
            </div>
          </div>

          {/* Dual Row Segments */}
          <div className="space-y-1">
            {/* First Row */}
            <div className="flex gap-1">
              {Array.from({ length: segmentsPerRow }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-3 ${borderColor} border transition-all duration-300`}
                  style={{
                    backgroundColor: i < filledSegments
                      ? primaryHex
                      : 'rgba(0, 0, 0, 0.6)',
                    boxShadow: i < filledSegments
                      ? `0 0 8px rgba(${primaryRGB}, 0.5)`
                      : 'none'
                  }}
                />
              ))}
            </div>
            {/* Second Row */}
            <div className="flex gap-1">
              {Array.from({ length: segmentsPerRow }).map((_, i) => {
                const segmentIndex = i + segmentsPerRow;
                return (
                  <div
                    key={segmentIndex}
                    className={`flex-1 h-3 ${borderColor} border transition-all duration-300`}
                    style={{
                      backgroundColor: segmentIndex < filledSegments
                        ? primaryHex
                        : 'rgba(0, 0, 0, 0.6)',
                      boxShadow: segmentIndex < filledSegments
                        ? `0 0 8px rgba(${primaryRGB}, 0.5)`
                        : 'none'
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Label */}
        <div className={`${labelFont} text-[10px] text-gray-400 uppercase tracking-widest text-center`}>
          TENURE
        </div>
      </div>
    );
  };

  // Slide-Up Card Style - Card slides up from behind bars with shadow
  const renderSlideUpCard = () => {
    const segments = 10;
    const filledSegments = Math.floor((progress / 100) * segments);

    return (
      <div className="relative">
        {/* Full-width segmented bars */}
        <div className="flex gap-1">
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-4 ${borderColor} border transition-all duration-300`}
              style={{
                backgroundColor: i < filledSegments
                  ? primaryHex
                  : 'rgba(0, 0, 0, 0.6)',
                boxShadow: i < filledSegments
                  ? `0 0 8px rgba(${primaryRGB}, 0.5)`
                  : 'none'
              }}
            />
          ))}
        </div>

        {/* Card emerging from behind with slide-up effect */}
        <div
          className="relative -mt-2 mx-auto w-20 bg-black/80 backdrop-blur-sm border-2 border-gray-700/50 py-1 px-2 transition-all duration-300 hover:-translate-y-1"
          style={{
            boxShadow: `0 4px 12px rgba(0, 0, 0, 0.8), 0 0 20px rgba(${primaryRGB}, 0.2)`
          }}
        >
          <div className="text-center">
            <div className={`${numberFont} text-3xl font-thin ${textColor} leading-none`}>
              {currentLevel}
            </div>
            <div className={`${labelFont} text-[10px] text-gray-400 uppercase tracking-widest`}>
              LVL
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Floating Badge Style - Card floats with heavy shadow and glow
  const renderFloatingBadge = () => {
    const segments = 12;
    const filledSegments = Math.floor((progress / 100) * segments);

    return (
      <div className="relative">
        {/* Full-width segmented bars */}
        <div className="flex gap-0.5">
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-3 transition-all duration-300`}
              style={{
                backgroundColor: i < filledSegments
                  ? primaryHex
                  : 'rgba(0, 0, 0, 0.5)',
                boxShadow: i < filledSegments
                  ? `0 0 6px rgba(${primaryRGB}, 0.4)`
                  : 'none'
              }}
            />
          ))}
        </div>

        {/* Floating badge with intense shadow and glow */}
        <div
          className="relative -mt-3 mx-auto w-24 bg-gradient-to-b from-gray-900 to-black border-2 rounded-sm py-1.5 px-3 transition-all duration-300"
          style={{
            borderColor: primaryHex,
            boxShadow: `
              0 8px 24px rgba(0, 0, 0, 0.9),
              0 0 40px rgba(${primaryRGB}, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `
          }}
        >
          <div className="text-center">
            <div className={`${numberFont} text-4xl font-thin ${textColor} leading-none`}
              style={{ textShadow: `0 0 12px rgba(${primaryRGB}, 0.6)` }}
            >
              {currentLevel}
            </div>
            <div className={`${labelFont} text-[9px] ${textColor} uppercase tracking-[0.2em] opacity-70`}>
              LVL
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Recessed Panel Style - Card looks embedded/inset into surface
  const renderRecessedPanel = () => {
    const segments = 10;
    const filledSegments = Math.floor((progress / 100) * segments);

    return (
      <div className="relative">
        {/* Full-width segmented bars with subtle gaps */}
        <div className="flex gap-1">
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-4 border ${borderColor} transition-all duration-300`}
              style={{
                backgroundColor: i < filledSegments
                  ? primaryHex
                  : 'rgba(0, 0, 0, 0.7)',
                boxShadow: i < filledSegments
                  ? `0 0 8px rgba(${primaryRGB}, 0.5)`
                  : 'inset 0 2px 4px rgba(0, 0, 0, 0.5)'
              }}
            />
          ))}
        </div>

        {/* Recessed panel with inset shadow effect */}
        <div
          className="relative -mt-2 mx-auto w-20 bg-black/90 border border-gray-800 py-1 px-2"
          style={{
            boxShadow: `
              inset 0 2px 6px rgba(0, 0, 0, 0.8),
              inset 0 -1px 2px rgba(255, 255, 255, 0.05),
              0 4px 8px rgba(0, 0, 0, 0.6)
            `
          }}
        >
          <div className="text-center">
            <div className={`${numberFont} text-3xl font-thin ${textColor} leading-none`}>
              {currentLevel}
            </div>
            <div className={`${labelFont} text-[10px] text-gray-500 uppercase tracking-widest`}>
              LVL
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Tech Plate Style - Card with angular cuts and metallic industrial look
  const renderTechPlate = () => {
    const segments = 8;
    const filledSegments = Math.floor((progress / 100) * segments);

    return (
      <div className="relative">
        {/* Full-width thick bars with sharp edges */}
        <div className="flex gap-1.5">
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-5 border-2 transition-all duration-300`}
              style={{
                borderColor: i < filledSegments ? primaryHex : 'rgba(255, 255, 255, 0.1)',
                backgroundColor: i < filledSegments
                  ? primaryHex
                  : 'rgba(0, 0, 0, 0.8)',
                boxShadow: i < filledSegments
                  ? `0 0 12px rgba(${primaryRGB}, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                  : 'inset 0 2px 4px rgba(0, 0, 0, 0.6)'
              }}
            />
          ))}
        </div>

        {/* Tech plate with angular design */}
        <div
          className="relative -mt-3 mx-auto w-28 bg-gradient-to-br from-gray-800 via-gray-900 to-black border-2 py-2 px-3"
          style={{
            borderColor: primaryHex,
            clipPath: 'polygon(8% 0%, 92% 0%, 100% 20%, 100% 100%, 0% 100%, 0% 20%)',
            boxShadow: `
              0 6px 16px rgba(0, 0, 0, 0.9),
              0 0 30px rgba(${primaryRGB}, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.15),
              inset 0 -1px 0 rgba(0, 0, 0, 0.5)
            `
          }}
        >
          {/* Corner accent lines */}
          <div className="absolute top-0 left-2 w-6 h-px opacity-50" style={{ background: primaryHex }} />
          <div className="absolute top-0 right-2 w-6 h-px opacity-50" style={{ background: primaryHex }} />

          <div className="text-center">
            <div className={`${numberFont} text-4xl font-thin ${textColor} leading-none tracking-wider`}
              style={{ textShadow: `0 0 10px rgba(${primaryRGB}, 0.5), 0 2px 4px rgba(0, 0, 0, 0.8)` }}
            >
              {currentLevel}
            </div>
            <div className={`${labelFont} text-[10px] ${textColor} uppercase tracking-[0.3em] opacity-60 font-bold`}>
              LVL
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render based on style prop
  switch (style) {
    case 'arch':
      return renderArch();
    case 'segmented':
      return renderSegmented();
    case 'orbital':
      return renderOrbital();
    case 'diagonal':
      return renderDiagonal();
    case 'segmented-vertical':
      return renderSegmentedVertical();
    case 'segmented-hex':
      return renderSegmentedHex();
    case 'segmented-dual-row':
      return renderSegmentedDualRow();
    case 'slide-up-card':
      return renderSlideUpCard();
    case 'floating-badge':
      return renderFloatingBadge();
    case 'recessed-panel':
      return renderRecessedPanel();
    case 'tech-plate':
      return renderTechPlate();
    case 'flat-bar':
    default:
      return renderFlatBar();
  }
}
