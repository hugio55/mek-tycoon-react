/**
 * MEK TYCOON DESIGN SYSTEM CONSTANTS
 * Based on Industrial Contract Cards Design
 * Reference: /contracts/single-missions page
 */

// ===========================
// COLOR PALETTE
// ===========================
export const colors = {
  primary: {
    yellow: '#fab617',
    yellowRgb: 'rgba(250, 182, 23',
    gold: '#FFD700',
    goldRgb: 'rgba(255, 215, 0',
  },
  secondary: {
    black: '#000000',
    blackRgb: 'rgba(0, 0, 0',
    darkGray: '#1a1a1a',
    gray: '#4a4a4a',
  },
  accent: {
    orange: '#ff8c00',
    orangeRgb: 'rgba(255, 140, 0',
    blue: '#3b82f6',
    blueRgb: 'rgba(59, 130, 246',
    purple: '#8b5cf6',
    purpleRgb: 'rgba(139, 92, 246',
    cyan: '#22d3ee',
    cyanRgb: 'rgba(34, 211, 238',
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  }
};

// ===========================
// INDUSTRIAL PATTERNS
// ===========================
export const patterns = {
  hazardStripes: `
    repeating-linear-gradient(
      45deg,
      rgba(0, 0, 0, 0.9),
      rgba(0, 0, 0, 0.9) 10px,
      rgba(250, 182, 23, 0.15) 10px,
      rgba(250, 182, 23, 0.15) 20px
    )
  `,
  diagonalStripes: `
    repeating-linear-gradient(
      135deg,
      rgba(250, 182, 23, 0.05),
      rgba(250, 182, 23, 0.05) 2px,
      rgba(0, 0, 0, 0.95) 2px,
      rgba(0, 0, 0, 0.95) 20px
    )
  `,
  metalTexture: `
    repeating-linear-gradient(90deg, 
      transparent, 
      transparent 2px, 
      rgba(0, 0, 0, 0.1) 2px, 
      rgba(0, 0, 0, 0.1) 3px),
    repeating-linear-gradient(0deg, 
      transparent, 
      transparent 2px, 
      rgba(0, 0, 0, 0.08) 2px, 
      rgba(0, 0, 0, 0.08) 3px)
  `,
  glassOverlay: `
    radial-gradient(circle at 20% 30%, rgba(250, 182, 23, 0.08) 0%, transparent 30%),
    radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.06) 0%, transparent 25%),
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 40%)
  `,
  scratches: `
    linear-gradient(105deg, transparent 40%, rgba(0, 0, 0, 0.3) 41%, transparent 43%),
    linear-gradient(85deg, transparent 65%, rgba(0, 0, 0, 0.2) 66%, transparent 67%),
    linear-gradient(175deg, transparent 70%, rgba(0, 0, 0, 0.25) 71%, transparent 72%)
  `,
  rust: `
    radial-gradient(ellipse at 15% 20%, rgba(139, 69, 19, 0.4) 0%, transparent 25%),
    radial-gradient(ellipse at 85% 80%, rgba(101, 67, 33, 0.3) 0%, transparent 20%),
    radial-gradient(ellipse at 45% 60%, rgba(184, 134, 11, 0.2) 0%, transparent 30%)
  `
};

// ===========================
// CARD STYLES
// ===========================
export const cardStyles = {
  industrial: {
    background: `linear-gradient(135deg, 
      rgba(255, 255, 255, 0.02) 0%, 
      rgba(255, 255, 255, 0.05) 50%, 
      rgba(255, 255, 255, 0.02) 100%)`,
    backdropFilter: 'blur(6px)',
    boxShadow: 'inset 0 0 40px rgba(255, 255, 255, 0.03)',
  },
  industrialGlobal: {
    background: `linear-gradient(135deg, 
      rgba(250, 182, 23, 0.02) 0%, 
      rgba(250, 182, 23, 0.05) 50%, 
      rgba(250, 182, 23, 0.02) 100%)`,
    backdropFilter: 'blur(6px)',
    boxShadow: 'inset 0 0 40px rgba(250, 182, 23, 0.03)',
  }
};

// ===========================
// BORDER STYLES
// ===========================
export const borderStyles = {
  sharpGold: 'border-2 border-yellow-500/50',
  sharpGray: 'border border-gray-700/50',
  roundedGold: 'rounded-xl border-2 border-yellow-500/50',
  roundedGray: 'rounded-xl border border-gray-700/50',
  doubleGold: 'border-2 border-double border-yellow-500/60',
  neon: 'border-2 border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.3)]',
  gradient: 'rounded-xl border-2 border-transparent bg-gradient-to-r from-yellow-500/30 via-orange-500/30 to-red-500/30 p-[2px]',
};

// ===========================
// TYPOGRAPHY
// ===========================
export const typography = {
  fonts: {
    heading: "'Orbitron', 'Bebas Neue', sans-serif",
    body: "'Inter', 'Segoe UI', sans-serif",
    mono: "'Consolas', 'Monaco', monospace",
  },
  styles: {
    industrialHeading: {
      fontFamily: "'Orbitron', sans-serif",
      fontWeight: 'bold',
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
    },
    labelUppercase: {
      fontSize: '0.75rem',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.1em',
      fontWeight: '500',
    },
    valuePrimary: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#fab617',
    },
    valueSecondary: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#3b82f6',
    }
  }
};

// ===========================
// ANIMATIONS
// ===========================
export const animations = {
  pulseYellow: {
    animation: 'mek-pulse-yellow 2s infinite',
    '@keyframes mek-pulse-yellow': {
      '0%, 100%': { boxShadow: '0 0 10px rgba(250, 182, 23, 0.3)' },
      '50%': { boxShadow: '0 0 30px rgba(250, 182, 23, 0.6)' }
    }
  },
  scanLine: {
    animation: 'mek-scan-line 3s linear infinite',
    '@keyframes mek-scan-line': {
      '0%': { transform: 'translateY(-100%)' },
      '100%': { transform: 'translateY(100%)' }
    }
  },
  holographicShift: {
    animation: 'mek-holographic-shift 3s ease infinite',
    background: `linear-gradient(
      45deg,
      rgba(250, 182, 23, 0.1),
      rgba(139, 92, 246, 0.1),
      rgba(34, 211, 238, 0.1),
      rgba(250, 182, 23, 0.1)
    )`,
    backgroundSize: '400% 400%',
  }
};

// ===========================
// CLIP PATHS
// ===========================
export const clipPaths = {
  cornerCut: `polygon(
    0 10px,
    10px 0,
    calc(100% - 10px) 0,
    100% 10px,
    100% calc(100% - 10px),
    calc(100% - 10px) 100%,
    10px 100%,
    0 calc(100% - 10px)
  )`,
  hexagon: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
  angledButton: 'polygon(0 0, calc(100% - 10px) 0, 100% 100%, 10px 100%)',
};

// ===========================
// UTILITY FUNCTIONS
// ===========================

export const getIndustrialCardStyle = (isGlobal = false) => ({
  ...cardStyles[isGlobal ? 'industrialGlobal' : 'industrial'],
  className: `relative overflow-hidden ${borderStyles.sharpGold}`,
});

export const applyGrungeOverlays = (element: HTMLElement) => {
  const overlayDiv = document.createElement('div');
  overlayDiv.className = 'absolute inset-0 pointer-events-none';
  overlayDiv.style.background = patterns.scratches;
  overlayDiv.style.mixBlendMode = 'multiply';
  overlayDiv.style.opacity = '0.3';
  element.appendChild(overlayDiv);
};

export const formatGoldAmount = (amount: number): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toLocaleString();
};

// ===========================
// COMPONENT PRESETS
// ===========================

export const componentPresets = {
  button: {
    primary: {
      className: 'mek-button-primary',
      style: {
        clipPath: clipPaths.angledButton,
      }
    },
    secondary: {
      className: 'mek-button-secondary',
    }
  },
  header: {
    industrial: {
      className: 'mek-header-industrial',
      style: {
        background: `${patterns.hazardStripes}, linear-gradient(to right, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8))`,
      }
    }
  },
  slot: {
    empty: {
      className: 'mek-slot-empty',
      style: {
        background: `${patterns.diagonalStripes}, rgba(0, 0, 0, 0.4)`,
      }
    },
    filled: {
      className: 'mek-slot-filled',
    }
  }
};

// ===========================
// THEME CONFIGURATION
// ===========================

export const theme = {
  colors,
  patterns,
  cardStyles,
  borderStyles,
  typography,
  animations,
  clipPaths,
  componentPresets,
};

export default theme;