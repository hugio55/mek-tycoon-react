"use client";

export type LevelProgressStyle =
  | 'flat-bar'
  | 'arch'
  | 'segmented'
  | 'orbital'
  | 'diagonal';

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
    case 'flat-bar':
    default:
      return renderFlatBar();
  }
}
