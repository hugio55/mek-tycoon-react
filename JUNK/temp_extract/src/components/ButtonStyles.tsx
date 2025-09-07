"use client";

import React from 'react';
import { useClickSound } from '@/lib/useClickSound';

// Component library for special button styles

export const PlasmaEnergyButton: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}> = ({ children, onClick, disabled = false, className = '' }) => {
  const playSound = useClickSound();

  const handleClick = () => {
    if (!disabled) {
      playSound();
      onClick?.();
    }
  };

  return (
    <button 
      className={`btn-plasma-energy ${className}`}
      onClick={handleClick}
      disabled={disabled}
    >
      <div className="plasma-core">
        <div className="plasma-field"></div>
        <div className="plasma-inner">
          <span className="plasma-text">{children}</span>
        </div>
      </div>
    </button>
  );
};

// Export the styles as a string for reference
export const plasmaButtonStyles = `
/* Plasma Energy Button - Updated Style */
.btn-plasma-energy {
  position: relative;
  width: 280px;
  height: 80px;
  background: transparent;
  border: none;
  cursor: pointer;
  isolation: isolate;
  transition: transform 0.2s ease;
}

.btn-plasma-energy:hover {
  transform: scale(1.05);
}

.btn-plasma-energy:active {
  transform: scale(0.98);
}

.btn-plasma-energy:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.plasma-core {
  position: absolute;
  inset: 0;
  background: #000;
  border-radius: 40px;
  overflow: hidden;
}

.plasma-field {
  position: absolute;
  inset: -50%;
  background: conic-gradient(
    from 0deg,
    #fab617,
    #ff6b35,
    #fab617,
    #ffc633,
    #fab617
  );
  animation: plasma-rotate 4s linear infinite;
  filter: blur(20px);
  opacity: 0.8;
}

.btn-plasma-energy:hover .plasma-field {
  animation-duration: 2s;
  opacity: 1;
}

@keyframes plasma-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.plasma-inner {
  position: absolute;
  inset: 3px;
  background: #0a0a0a;
  border-radius: 37px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.plasma-inner::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent,
    rgba(250, 182, 23, 0.1),
    transparent
  );
  animation: plasma-shimmer 3s linear infinite;
}

@keyframes plasma-shimmer {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.plasma-text {
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: 1.2rem;
  color: #fab617;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 0 20px currentColor;
  position: relative;
  z-index: 1;
}

.btn-plasma-energy:hover .plasma-text {
  text-shadow: 0 0 30px currentColor, 0 0 60px currentColor;
}
`;

// Additional button styles can be added here
export const NeonPulseButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  color?: string;
}> = ({ children, onClick, color = '#00ff88' }) => {
  const playSound = useClickSound();

  const handleClick = () => {
    playSound();
    onClick?.();
  };

  return (
    <button 
      className="neon-pulse-btn"
      onClick={handleClick}
      style={{ '--neon-color': color } as React.CSSProperties}
    >
      {children}
    </button>
  );
};

export const GlitchButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ children, onClick }) => {
  const playSound = useClickSound();

  const handleClick = () => {
    playSound();
    onClick?.();
  };

  return (
    <button className="glitch-btn" onClick={handleClick}>
      <span data-text={children}>{children}</span>
    </button>
  );
};

// Export all button styles
export const allButtonStyles = `
${plasmaButtonStyles}

/* Neon Pulse Button */
.neon-pulse-btn {
  padding: 16px 32px;
  font-size: 16px;
  font-weight: bold;
  color: var(--neon-color, #00ff88);
  background: transparent;
  border: 2px solid currentColor;
  border-radius: 8px;
  position: relative;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 2px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.neon-pulse-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: currentColor;
  opacity: 0.1;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

.neon-pulse-btn:hover::before {
  transform: scaleX(1);
}

.neon-pulse-btn:hover {
  box-shadow: 
    0 0 20px currentColor,
    inset 0 0 20px rgba(255, 255, 255, 0.1);
  text-shadow: 0 0 10px currentColor;
}

/* Glitch Button */
.glitch-btn {
  padding: 16px 32px;
  font-size: 18px;
  font-weight: bold;
  background: #000;
  color: #fff;
  border: 2px solid #fff;
  position: relative;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 2px;
  overflow: hidden;
}

.glitch-btn span {
  position: relative;
  z-index: 2;
}

.glitch-btn:hover span::before,
.glitch-btn:hover span::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.glitch-btn:hover span::before {
  animation: glitch-1 0.3s infinite;
  color: #00ffff;
  animation-delay: 0s;
}

.glitch-btn:hover span::after {
  animation: glitch-2 0.3s infinite;
  color: #ff00ff;
  animation-delay: 0.1s;
}

@keyframes glitch-1 {
  0% { clip-path: inset(40% 0 61% 0); transform: translate(-2px, 2px); }
  20% { clip-path: inset(92% 0 1% 0); transform: translate(2px, -2px); }
  40% { clip-path: inset(43% 0 1% 0); transform: translate(-2px, 2px); }
  60% { clip-path: inset(25% 0 58% 0); transform: translate(2px, -2px); }
  80% { clip-path: inset(54% 0 7% 0); transform: translate(-2px, 2px); }
  100% { clip-path: inset(58% 0 43% 0); transform: translate(2px, -2px); }
}

@keyframes glitch-2 {
  0% { clip-path: inset(40% 0 61% 0); transform: translate(2px, -2px); }
  20% { clip-path: inset(92% 0 1% 0); transform: translate(-2px, 2px); }
  40% { clip-path: inset(43% 0 1% 0); transform: translate(2px, -2px); }
  60% { clip-path: inset(25% 0 58% 0); transform: translate(-2px, 2px); }
  80% { clip-path: inset(54% 0 7% 0); transform: translate(2px, -2px); }
  100% { clip-path: inset(58% 0 43% 0); transform: translate(-2px, 2px); }
}
`;