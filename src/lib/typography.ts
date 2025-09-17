/**
 * Typography System Utilities
 * Programmatic font selection and text styling for Mek Tycoon
 */

// Font Family Definitions
export const fonts = {
  // Display Fonts
  hero: "'Michroma', 'Orbitron', sans-serif",
  heading: "'Audiowide', 'Russo One', sans-serif",
  subheading: "'Exo 2', 'Rajdhani', sans-serif",

  // UI Fonts
  uiPrimary: "'Saira', 'Rajdhani', sans-serif",
  uiSecondary: "'Space Grotesk', sans-serif",
  label: "'Oxanium', 'Saira', sans-serif",

  // Data Fonts
  data: "'JetBrains Mono', 'Share Tech Mono', monospace",
  code: "'JetBrains Mono', monospace",
  timer: "'Teko', 'Bebas Neue', sans-serif",

  // Special Fonts
  military: "'Black Ops One', 'Russo One', cursive",
  impact: "'Bebas Neue', 'Teko', impact",
  tech: "'Share Tech Mono', 'Audiowide', monospace",

  // Legacy Support
  orbitron: "'Orbitron', monospace",
  rajdhani: "'Rajdhani', sans-serif",
  bebasNeue: "'Bebas Neue', sans-serif"
} as const;

// Typography Style Presets
export const typography = {
  // Hero & Display
  heroTitle: {
    fontFamily: fonts.hero,
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    fontWeight: 400,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    lineHeight: 1.1
  },

  pageTitle: {
    fontFamily: fonts.heading,
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: 400,
    letterSpacing: '0.03em',
    textTransform: 'uppercase' as const,
    lineHeight: 1.2
  },

  sectionHeader: {
    fontFamily: "'Russo One', " + fonts.heading,
    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
    fontWeight: 400,
    letterSpacing: '0.02em',
    textTransform: 'uppercase' as const
  },

  // Card Headers
  cardTitle: {
    fontFamily: fonts.subheading,
    fontSize: '1.25rem',
    fontWeight: 600,
    letterSpacing: '0.01em',
    textTransform: 'uppercase' as const
  },

  cardSubtitle: {
    fontFamily: "'Saira', " + fonts.uiPrimary,
    fontSize: '0.875rem',
    fontWeight: 500,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    opacity: 0.8
  },

  // UI Text
  uiPrimary: {
    fontFamily: fonts.uiPrimary,
    fontSize: '1rem',
    fontWeight: 400,
    letterSpacing: '0.01em',
    lineHeight: 1.5
  },

  uiSecondary: {
    fontFamily: fonts.uiSecondary,
    fontSize: '0.9375rem',
    fontWeight: 400,
    letterSpacing: '0.005em',
    lineHeight: 1.6
  },

  description: {
    fontFamily: "'Space Grotesk', " + fonts.uiSecondary,
    fontSize: '0.875rem',
    fontWeight: 300,
    letterSpacing: '0.01em',
    lineHeight: 1.6,
    opacity: 0.9
  },

  // Labels
  label: {
    fontFamily: fonts.label,
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const
  },

  labelSubtle: {
    fontFamily: "'Oxanium', " + fonts.label,
    fontSize: '0.6875rem',
    fontWeight: 500,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    opacity: 0.7
  },

  badge: {
    fontFamily: "'Saira', " + fonts.label,
    fontSize: '0.625rem',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const
  },

  // Data Display
  dataLarge: {
    fontFamily: fonts.data,
    fontSize: '2.5rem',
    fontWeight: 200,
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1
  },

  dataMedium: {
    fontFamily: fonts.data,
    fontSize: '1.75rem',
    fontWeight: 300,
    letterSpacing: '-0.01em',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1
  },

  dataSmall: {
    fontFamily: fonts.data,
    fontSize: '1rem',
    fontWeight: 400,
    letterSpacing: 0,
    fontVariantNumeric: 'tabular-nums'
  },

  statValue: {
    fontFamily: "'JetBrains Mono', " + fonts.data,
    fontSize: '1.25rem',
    fontWeight: 500,
    letterSpacing: '-0.01em',
    fontVariantNumeric: 'tabular-nums lining-nums'
  },

  statLabel: {
    fontFamily: "'Oxanium', " + fonts.label,
    fontSize: '0.625rem',
    fontWeight: 600,
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    opacity: 0.6
  },

  // Timers
  timer: {
    fontFamily: fonts.timer,
    fontSize: '3rem',
    fontWeight: 700,
    letterSpacing: '0.02em',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 0.9
  },

  countdown: {
    fontFamily: "'Teko', " + fonts.timer,
    fontSize: '2rem',
    fontWeight: 600,
    letterSpacing: '0.03em',
    fontVariantNumeric: 'tabular-nums'
  },

  // Special Context
  military: {
    fontFamily: fonts.military,
    fontSize: '1.5rem',
    fontWeight: 400,
    letterSpacing: '0.02em',
    textTransform: 'uppercase' as const
  },

  alert: {
    fontFamily: fonts.impact,
    fontSize: '1.25rem',
    fontWeight: 400,
    letterSpacing: '0.03em',
    textTransform: 'uppercase' as const
  },

  warning: {
    fontFamily: "'Russo One', " + fonts.military,
    fontSize: '1rem',
    fontWeight: 400,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const
  },

  techReadout: {
    fontFamily: fonts.tech,
    fontSize: '0.875rem',
    fontWeight: 400,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const
  },

  // Buttons
  buttonPrimary: {
    fontFamily: "'Russo One', " + fonts.heading,
    fontSize: '0.9375rem',
    fontWeight: 400,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const
  },

  buttonSecondary: {
    fontFamily: "'Saira', " + fonts.uiPrimary,
    fontSize: '0.875rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const
  },

  buttonSmall: {
    fontFamily: "'Oxanium', " + fonts.label,
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const
  }
} as const;

// Contextual Font Selection by Page/Feature
export const contextualFonts = {
  hub: {
    primary: fonts.hero,
    secondary: fonts.uiPrimary,
    data: fonts.data,
    heading: "'Michroma', 'Audiowide', sans-serif"
  },

  combat: {
    primary: fonts.military,
    secondary: "'Russo One', sans-serif",
    data: fonts.tech,
    heading: fonts.military
  },

  shop: {
    primary: fonts.subheading,
    secondary: fonts.uiSecondary,
    data: fonts.data,
    heading: "'Exo 2', sans-serif"
  },

  crafting: {
    primary: fonts.heading,
    secondary: fonts.label,
    data: fonts.tech,
    heading: "'Audiowide', 'Orbitron', sans-serif"
  },

  leaderboard: {
    primary: fonts.impact,
    secondary: fonts.uiPrimary,
    data: fonts.timer,
    heading: "'Bebas Neue', 'Teko', sans-serif"
  },

  inventory: {
    primary: fonts.uiPrimary,
    secondary: fonts.uiSecondary,
    data: fonts.data,
    heading: "'Saira', 'Rajdhani', sans-serif"
  },

  missions: {
    primary: fonts.military,
    secondary: fonts.tech,
    data: fonts.code,
    heading: "'Black Ops One', 'Russo One', sans-serif"
  },

  achievements: {
    primary: fonts.heading,
    secondary: fonts.uiPrimary,
    data: fonts.data,
    heading: "'Audiowide', sans-serif"
  },

  profile: {
    primary: fonts.uiPrimary,
    secondary: fonts.uiSecondary,
    data: fonts.statValue,
    heading: "'Saira', 'Space Grotesk', sans-serif"
  },

  admin: {
    primary: fonts.code,
    secondary: fonts.tech,
    data: fonts.data,
    heading: "'JetBrains Mono', monospace"
  }
} as const;

// Helper function to get font by context
export function getFontForContext(
  page: keyof typeof contextualFonts,
  type: 'primary' | 'secondary' | 'data' | 'heading'
): string {
  return contextualFonts[page]?.[type] || fonts.uiPrimary;
}

// Text Effects Utility Classes
export const textEffects = {
  glitch: 'typo-glitch',
  distort: 'typo-distort',
  scan: 'typo-scan',
  typewriter: 'typo-typewriter',
  variableWeight: 'typo-variable-weight'
} as const;

// Text Glow Utilities
export const textGlow = {
  yellow: { textShadow: '0 0 20px rgba(250, 182, 23, 0.5)' },
  blue: { textShadow: '0 0 20px rgba(59, 130, 246, 0.5)' },
  red: { textShadow: '0 0 20px rgba(239, 68, 68, 0.5)' },
  green: { textShadow: '0 0 20px rgba(34, 197, 94, 0.5)' },
  cyan: { textShadow: '0 0 20px rgba(34, 211, 238, 0.5)' },
  purple: { textShadow: '0 0 20px rgba(139, 92, 246, 0.5)' },
  orange: { textShadow: '0 0 20px rgba(251, 146, 60, 0.5)' }
} as const;

// Responsive Font Size Calculator
export function getResponsiveFontSize(
  base: number,
  min: number,
  max: number,
  unit: 'rem' | 'px' = 'rem'
): string {
  const vw = ((max - min) / 10); // Viewport width factor
  return `clamp(${min}${unit}, ${vw}vw, ${max}${unit})`;
}

// Generate font style object with fallbacks
export function getFontStyle(
  preset: keyof typeof typography,
  overrides?: Partial<typeof typography[keyof typeof typography]>
): React.CSSProperties {
  const baseStyle = typography[preset];
  return {
    ...baseStyle,
    ...overrides
  } as React.CSSProperties;
}

// Export all presets as CSS classes for easy use
export const typographyClasses = {
  // Display
  heroTitle: 'typo-hero-title',
  pageTitle: 'typo-page-title',
  sectionHeader: 'typo-section-header',

  // Cards
  cardTitle: 'typo-card-title',
  cardSubtitle: 'typo-card-subtitle',

  // UI
  uiPrimary: 'typo-ui-primary',
  uiSecondary: 'typo-ui-secondary',
  description: 'typo-description',

  // Labels
  label: 'typo-label',
  labelSubtle: 'typo-label-subtle',
  badge: 'typo-badge',

  // Data
  dataLarge: 'typo-data-large',
  dataMedium: 'typo-data-medium',
  dataSmall: 'typo-data-small',
  statValue: 'typo-stat-value',
  statLabel: 'typo-stat-label',

  // Timers
  timer: 'typo-timer',
  countdown: 'typo-countdown',

  // Special
  military: 'typo-military',
  alert: 'typo-alert',
  warning: 'typo-warning',
  techReadout: 'typo-tech-readout',

  // Buttons
  buttonPrimary: 'typo-button-primary',
  buttonSecondary: 'typo-button-secondary',
  buttonSmall: 'typo-button-small'
} as const;