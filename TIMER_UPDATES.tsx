// TIMER UPDATES - More saturated colors + Custom clock icons + Move below button

// 1. UPDATE getCountdownStyles function - MORE SATURATED COLORS:
const getCountdownStyles = (expiresAt: number) => {
  const remaining = expiresAt - currentTime;

  // Expired - red (more saturated)
  if (remaining <= 0) {
    return {
      containerClass: "bg-red-900/30 border-2 border-red-500/60",
      labelClass: "text-red-400",
      timeClass: "text-red-500 font-extrabold"
    };
  }

  const totalHours = remaining / (1000 * 60 * 60);

  // 0-1 hour - red (bright, saturated, and urgent)
  if (totalHours < 1) {
    return {
      containerClass: "bg-red-900/30 border-2 border-red-500/60",
      labelClass: "text-red-400",
      timeClass: "text-red-500 font-extrabold"
    };
  }

  // 1-5 hours - orange (more saturated)
  if (totalHours < 5) {
    return {
      containerClass: "bg-orange-900/20 border border-orange-500/40",
      labelClass: "text-orange-400",
      timeClass: "text-orange-500 font-bold"
    };
  }

  // 5-12 hours - yellow (more saturated)
  if (totalHours < 12) {
    return {
      containerClass: "bg-yellow-900/20 border border-yellow-500/40",
      labelClass: "text-yellow-400",
      timeClass: "text-yellow-500 font-bold"
    };
  }

  // 12+ hours - white (brighter)
  return {
    containerClass: "bg-white/10 border border-white/30",
    labelClass: "text-gray-300",
    timeClass: "text-white font-bold"
  };
};

// 2. UPDATE renderTimeRemaining function - 5 CUSTOM CLOCK ICON VARIATIONS:
const renderTimeRemaining = (expiresAt: number, variation: 1 | 2 | 3 | 4 | 5) => {
  const styles = getCountdownStyles(expiresAt);
  const timeText = formatCountdown(expiresAt);

  // Check if timer is in red zone (less than 1 hour)
  const remaining = expiresAt - currentTime;
  const totalHours = remaining / (1000 * 60 * 60);
  const isUrgent = totalHours < 1;

  // Custom clock SVG icon
  const ClockIcon = ({ className = "" }: { className?: string }) => (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );

  switch(variation) {
    case 1: // Clock icon left, text right (compact)
      return (
        <div className="mb-2 flex items-center justify-center gap-1.5">
          <ClockIcon className={`${styles.timeClass} ${isUrgent ? 'animate-red-glow-flash' : ''}`} />
          <div className={`${styles.timeClass} text-[11px] font-bold ${isUrgent ? 'animate-red-glow-flash' : ''}`}>
            {timeText}
          </div>
        </div>
      );

    case 2: // Clock icon above text (stacked)
      return (
        <div className="mb-2 flex flex-col items-center gap-0.5">
          <ClockIcon className={`${styles.timeClass} ${isUrgent ? 'animate-red-glow-flash' : ''}`} />
          <div className={`${styles.timeClass} text-[10px] font-bold ${isUrgent ? 'animate-red-glow-flash' : ''}`}>
            {timeText}
          </div>
        </div>
      );

    case 3: // Clock icon with circular container
      return (
        <div className="mb-2 flex items-center justify-center gap-2">
          <div className={`rounded-full p-1 ${styles.containerClass}`}>
            <ClockIcon className={`${styles.timeClass} ${isUrgent ? 'animate-red-glow-flash' : ''}`} />
          </div>
          <div className={`${styles.timeClass} text-[11px] font-bold ${isUrgent ? 'animate-red-glow-flash' : ''}`}>
            {timeText}
          </div>
        </div>
      );

    case 4: // Large clock icon with small text below
      return (
        <div className="mb-2 flex flex-col items-center gap-1">
          <ClockIcon className={`w-4 h-4 ${styles.timeClass} ${isUrgent ? 'animate-red-glow-flash' : ''}`} />
          <div className={`${styles.timeClass} text-[9px] font-bold tracking-wide ${isUrgent ? 'animate-red-glow-flash' : ''}`}>
            {timeText}
          </div>
        </div>
      );

    case 5: // Clock icon + text with subtle background
      return (
        <div className="mb-2 flex items-center justify-center">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${styles.containerClass.includes('red') ? 'bg-red-900/10' : styles.containerClass.includes('orange') ? 'bg-orange-900/10' : styles.containerClass.includes('yellow') ? 'bg-yellow-900/10' : 'bg-white/5'}`}>
            <ClockIcon className={`${styles.timeClass} ${isUrgent ? 'animate-red-glow-flash' : ''}`} />
            <div className={`${styles.timeClass} text-[11px] font-bold ${isUrgent ? 'animate-red-glow-flash' : ''}`}>
              {timeText}
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};

// 3. UPDATE Debug Panel options to show new variations:
<select
  value={timerDisplayVariation}
  onChange={(e) => setTimerDisplayVariation(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
  className="w-full px-3 py-2 bg-black border border-yellow-500/30 text-yellow-400 text-sm rounded focus:outline-none focus:border-yellow-500"
>
  <option value={1}>Variation 1: Clock Left + Text</option>
  <option value={2}>Variation 2: Clock Above (Stacked)</option>
  <option value={3}>Variation 3: Clock in Circle + Text</option>
  <option value={4}>Variation 4: Large Clock + Small Text</option>
  <option value={5}>Variation 5: Clock + Text w/ Background</option>
</select>

// 4. TO MOVE TIMER BELOW SIPHON BUTTON:
// Find the listing card JSX structure and move the timer render AFTER the action button
// Current order (around line 4570):
/*
  {renderPricingInfo(...)}
  {listing.expiresAt && renderTimeRemaining(listing.expiresAt, timerDisplayVariation)}  // <- MOVE THIS
  {isOwn ? <CANCEL BUTTON> : <SIPHON BUTTON>}  // <- TO AFTER THIS
*/

// Should become:
/*
  {renderPricingInfo(...)}
  {isOwn ? <CANCEL BUTTON> : <SIPHON BUTTON>}
  {listing.expiresAt && renderTimeRemaining(listing.expiresAt, timerDisplayVariation)}  // <- MOVED HERE
*/
