// Timer display variations - floating text without card backgrounds
// To be integrated into essence-market/page.tsx

const renderTimeRemaining = (expiresAt: number, variation: 1 | 2 | 3 | 4 | 5) => {
  const styles = getCountdownStyles(expiresAt);
  const timeText = formatCountdown(expiresAt);

  // Check if timer is in red zone (less than 1 hour)
  const remaining = expiresAt - currentTime;
  const totalHours = remaining / (1000 * 60 * 60);
  const isUrgent = totalHours < 1;

  switch(variation) {
    case 1: // Plain text - centered (NO BACKGROUND)
      return (
        <div className="mb-2 text-center">
          <div className={`${styles.timeClass} text-[11px] font-bold ${isUrgent ? 'animate-red-glow-flash' : ''}`}>
            {timeText}
          </div>
        </div>
      );

    case 2: // With subtle underline
      return (
        <div className="mb-2 text-center">
          <div className={`${styles.timeClass} text-[11px] font-bold border-b ${styles.containerClass.includes('red') ? 'border-red-400/30' : styles.containerClass.includes('orange') ? 'border-orange-400/30' : styles.containerClass.includes('yellow') ? 'border-yellow-400/30' : 'border-white/20'} pb-1 inline-block ${isUrgent ? 'animate-red-glow-flash' : ''}`}>
            {timeText}
          </div>
        </div>
      );

    case 3: // With icon prefix
      return (
        <div className="mb-2 text-center">
          <div className={`${styles.timeClass} text-[10px] font-bold ${isUrgent ? 'animate-red-glow-flash' : ''}`}>
            ⏱ {timeText}
          </div>
        </div>
      );

    case 4: // Uppercase with letter spacing
      return (
        <div className="mb-2 text-center">
          <div className={`${styles.timeClass} text-[10px] font-bold uppercase tracking-wider ${isUrgent ? 'animate-red-glow-flash' : ''}`}>
            {timeText}
          </div>
        </div>
      );

    case 5: // With very subtle background - minimal (least intrusive)
      return (
        <div className="mb-2 text-center">
          <div className={`${styles.timeClass} text-[11px] font-bold px-2 py-0.5 rounded ${styles.containerClass.includes('red') ? 'bg-red-900/10' : styles.containerClass.includes('orange') ? 'bg-orange-900/10' : styles.containerClass.includes('yellow') ? 'bg-yellow-900/10' : 'bg-white/5'} ${isUrgent ? 'animate-red-glow-flash' : ''}`}>
            {timeText}
          </div>
        </div>
      );

    default:
      return null;
  }
};

// USAGE INSTRUCTIONS:
// 1. Replace the existing renderTimeRemaining function in essence-market/page.tsx with this one
// 2. Add a state variable to track which variation to use:
//    const [timerVariation, setTimerVariation] = useState<1 | 2 | 3 | 4 | 5>(1);
// 3. Update the function call to pass the variation:
//    {listing.expiresAt && renderTimeRemaining(listing.expiresAt, timerVariation)}
// 4. Add a selector in the debug panel to switch between variations

// VARIATION DESCRIPTIONS:
// Variation 1: Plain centered text - cleanest, no borders or backgrounds
// Variation 2: Text with subtle underline - adds minimal structure
// Variation 3: Clock icon prefix - adds visual indicator
// Variation 4: Uppercase with wide letter spacing - more dramatic
// Variation 5: Very subtle background - barely visible, just enough to separate from button
