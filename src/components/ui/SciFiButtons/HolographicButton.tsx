"use client";

import { useState, useEffect, useRef } from "react";

interface HolographicButtonProps {
  text?: string;
  onClick?: () => void;
  isActive?: boolean;
  variant?: 'blue' | 'yellow' | 'gray' | 'red';
  alwaysOn?: boolean;
  className?: string;
  disabled?: boolean;
  hideIcon?: boolean;
}

export default function HolographicButton({
  text = "SUBMIT",
  onClick,
  isActive = true,
  variant = 'yellow',
  alwaysOn = false,
  className = "",
  disabled = false,
  hideIcon = false
}: HolographicButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);

  // Particle class for holographic effects
  class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;

    constructor(x: number, y: number, variantColor: string) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * (alwaysOn ? 0.375 : 1);
      this.vy = -Math.random() * (alwaysOn ? 0.75 : 2);
      this.life = 0;
      this.maxLife = 60 + Math.random() * 60;
      this.size = 1 + Math.random() * 2;

      if (variantColor === 'yellow') {
        this.color = alwaysOn ? `hsl(48, 100%, 50%)` : `hsl(${45 + Math.random() * 15}, 100%, 50%)`;
      } else if (variantColor === 'gray') {
        this.color = `hsl(0, 0%, ${40 + Math.random() * 20}%)`;
      } else if (variantColor === 'red') {
        this.color = alwaysOn ? `hsl(0, 100%, 50%)` : `hsl(${Math.random() * 15}, 100%, 50%)`;
      } else {
        this.color = `hsl(${180 + Math.random() * 60}, 100%, 50%)`;
      }
    }

    update() {
      this.life++;
      this.x += this.vx;
      this.y += this.vy;
    }

    draw(ctx: CanvasRenderingContext2D) {
      const alpha = 1 - (this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 5;
      ctx.shadowColor = this.color;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      const radius = Math.max(0.1, this.size * alpha);
      ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    isDead() {
      return this.life >= this.maxLife;
    }
  }

  // Canvas animation loop
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isAlwaysActive = alwaysOn && isActive;
      const particleSpeed = isHovered && isAlwaysActive ? 0.48 : isAlwaysActive ? 0.1125 : 0.3;

      if (isHovered || particlesRef.current.length > 0 || isAlwaysActive) {
        if ((isHovered || isAlwaysActive) && Math.random() < particleSpeed) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          particlesRef.current.push(new Particle(x, y, variant));
        }

        particlesRef.current = particlesRef.current.filter(particle => {
          particle.update();
          particle.draw(ctx);
          return !particle.isDead();
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [isHovered, variant, isActive, alwaysOn]);

  const colors = variant === 'yellow'
    ? {
        primary: '#fab617',
        secondary: '#fcd34d',
        glow: 'rgba(250,182,23,',
        glowBright: 'rgba(252,211,77,',
        gradient: 'from-gray-900/90 via-amber-950/90 to-black/90'
      }
    : variant === 'gray'
    ? {
        primary: '#6b7280',
        secondary: '#9ca3af',
        glow: 'rgba(107,114,128,',
        glowBright: 'rgba(156,163,175,',
        gradient: 'from-gray-900/90 via-gray-800/90 to-black/90'
      }
    : variant === 'red'
    ? {
        primary: '#ef4444',
        secondary: '#f87171',
        glow: 'rgba(239,68,68,',
        glowBright: 'rgba(248,113,113,',
        gradient: 'from-gray-900/90 via-red-950/90 to-black/90'
      }
    : {
        primary: '#06b6d4',
        secondary: '#22d3ee',
        glow: 'rgba(6,182,212,',
        glowBright: 'rgba(34,211,238,',
        gradient: 'from-gray-900/90 via-blue-950/90 to-black/90'
      };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      disabled={disabled}
      className={`
        relative group overflow-hidden
        ${isPressed ? 'scale-95' : ''}
        transition-all duration-300
        ${!isActive ? 'grayscale opacity-60' : ''}
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <div className="relative">
        <div
          className={`
            relative bg-gradient-to-br
            ${isActive
              ? variant === 'yellow'
                ? 'from-gray-900/90 via-amber-950/90 to-black/90'
                : variant === 'gray'
                ? 'from-gray-900/90 via-gray-800/90 to-black/90'
                : variant === 'red'
                ? 'from-gray-900/90 via-red-950/90 to-black/90'
                : 'from-gray-900/90 via-blue-950/90 to-black/90'
              : 'from-gray-900/90 via-gray-800/90 to-black/90'
            }
            backdrop-blur-md
            border-2 transition-all duration-300
            px-8 py-3
          `}
          style={{
            borderColor: isActive
              ? (isHovered ? colors.secondary : colors.primary)
              : '#4b5563',
            boxShadow: isActive
              ? isHovered
                ? `0 0 50px ${colors.glowBright}0.6)`
                : `0 0 40px ${colors.glow}0.5)`
              : '0 0 10px rgba(156,163,175,0.2)'
          }}>
          {/* Holographic grid background */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: isActive
                ? `linear-gradient(0deg, transparent 24%, ${colors.glow}0.05) 25%, ${colors.glow}0.05) 26%, transparent 27%, transparent 74%, ${colors.glow}0.05) 75%, ${colors.glow}0.05) 76%, transparent 77%, transparent),
                  linear-gradient(90deg, transparent 24%, ${colors.glow}0.05) 25%, ${colors.glow}0.05) 26%, transparent 27%, transparent 74%, ${colors.glow}0.05) 75%, ${colors.glow}0.05) 76%, transparent 77%, transparent)`
                : `linear-gradient(0deg, transparent 24%, rgba(156,163,175,0.03) 25%, rgba(156,163,175,0.03) 26%, transparent 27%, transparent 74%, rgba(156,163,175,0.03) 75%, rgba(156,163,175,0.03) 76%, transparent 77%, transparent),
                  linear-gradient(90deg, transparent 24%, rgba(156,163,175,0.03) 25%, rgba(156,163,175,0.03) 26%, transparent 27%, transparent 74%, rgba(156,163,175,0.03) 75%, rgba(156,163,175,0.03) 76%, transparent 77%, transparent)`,
              backgroundSize: '20px 20px',
              animation: isActive ? `holo-grid ${isHovered ? '7.5s' : '10s'} linear infinite` : 'none'
            }}
          />

          {/* Data stream effect */}
          {isActive && alwaysOn && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className={`absolute top-0 w-px h-full opacity-50 bg-gradient-to-b from-transparent ${
                    variant === 'yellow' ? 'via-yellow-400' : variant === 'red' ? 'via-red-400' : 'via-cyan-400'
                  } to-transparent`}
                  style={{
                    left: `${20 * (i + 1)}%`,
                    animation: `data-stream ${isHovered ? (1.5 + i * 0.375) : (2 + i * 0.5)}s linear infinite ${i * 0.2}s`
                  }}
                />
              ))}
            </div>
          )}

          {/* Holographic shimmer */}
          {isActive && (
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-500"
              style={{
                opacity: isHovered ? 1 : (alwaysOn ? 0.7 : 0),
                background: `linear-gradient(105deg,
                  transparent 30%,
                  ${colors.glow}0.2) 40%,
                  ${colors.glow}0.2) 50%,
                  ${colors.glow}0.2) 60%,
                  transparent 70%)`,
                animation: `holo-shimmer ${isHovered ? '2.25s' : '3s'} ease-in-out infinite`
              }}
            />
          )}

          {/* Particle canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          />

          {/* Content */}
          <div className="relative z-10 flex items-center justify-center h-full">
            {/* Arrow and Text */}
            <div className="flex flex-col items-center justify-center">
              {/* Upward arrow icon - moved down 5px */}
              {!hideIcon && (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className={isActive && isHovered ? 'animate-pulse' : ''} style={{ marginTop: '5px', marginBottom: '-4px' }}>
                  <path d="M12 2L22 8V16L12 22L2 16V8L12 2Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={isActive
                          ? variant === 'yellow' ? 'text-yellow-400' : variant === 'gray' ? 'text-gray-500' : variant === 'red' ? 'text-red-400' : 'text-cyan-400'
                          : 'text-gray-500'}
                        fill={isActive ? 'currentColor' : 'none'}
                        fillOpacity={isActive ? 0.2 : 0} />
                  <path d="M12 7V17M7 10L12 7L17 10"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className={isActive
                          ? variant === 'yellow' ? 'text-yellow-400' : variant === 'gray' ? 'text-gray-500' : variant === 'red' ? 'text-red-400' : 'text-cyan-400'
                          : 'text-gray-500'} />
                </svg>
              )}

              {/* Text moved up 5px (from 15px to 10px) */}
              <span
                className={`text-2xl font-bold uppercase whitespace-nowrap ${
                  isActive
                    ? variant === 'yellow' ? 'text-yellow-400' : variant === 'gray' ? 'text-gray-500' : variant === 'red' ? 'text-red-400' : 'text-cyan-400'
                    : 'text-gray-500'
                }`}
                style={{
                  fontFamily: 'Orbitron, monospace',
                  letterSpacing: '0.2em',
                  marginTop: '2px',
                  filter: isActive
                    ? isHovered
                      ? `drop-shadow(0 0 25px ${colors.glowBright}0.9)) brightness(1.1)`
                      : `drop-shadow(0 0 20px ${colors.glow}0.8))`
                    : 'none',
                  textShadow: isActive
                    ? isHovered
                      ? `0 0 30px ${colors.glowBright}0.9), 0 0 60px ${colors.glowBright}0.5)`
                      : `0 0 20px ${colors.glow}0.8), 0 0 40px ${colors.glow}0.4)`
                    : 'none'
                }}
              >
                {text}
              </span>
            </div>
          </div>

          {/* Frame corners */}
          <svg className="absolute top-0 left-0 w-8 h-8" viewBox="0 0 32 32">
            <path
              d="M0 8 L0 0 L8 0"
              stroke={isActive ? (isHovered ? colors.secondary : colors.primary) : "#6b7280"}
              strokeWidth="2"
              fill="none"
              style={{
                filter: isActive ? `drop-shadow(0 0 ${isHovered ? '8px' : '5px'} ${isHovered ? colors.secondary : colors.primary})` : 'none',
                transition: 'all 0.3s ease'
              }}
            />
          </svg>
          <svg className="absolute top-0 right-0 w-8 h-8" viewBox="0 0 32 32">
            <path
              d="M24 0 L32 0 L32 8"
              stroke={isActive ? (isHovered ? colors.secondary : colors.primary) : "#6b7280"}
              strokeWidth="2"
              fill="none"
              style={{
                filter: isActive ? `drop-shadow(0 0 ${isHovered ? '8px' : '5px'} ${isHovered ? colors.secondary : colors.primary})` : 'none',
                transition: 'all 0.3s ease'
              }}
            />
          </svg>
          <svg className="absolute bottom-0 left-0 w-8 h-8" viewBox="0 0 32 32">
            <path
              d="M0 24 L0 32 L8 32"
              stroke={isActive ? (isHovered ? colors.secondary : colors.primary) : "#6b7280"}
              strokeWidth="2"
              fill="none"
              style={{
                filter: isActive ? `drop-shadow(0 0 ${isHovered ? '8px' : '5px'} ${isHovered ? colors.secondary : colors.primary})` : 'none',
                transition: 'all 0.3s ease'
              }}
            />
          </svg>
          <svg className="absolute bottom-0 right-0 w-8 h-8" viewBox="0 0 32 32">
            <path
              d="M24 32 L32 32 L32 24"
              stroke={isActive ? (isHovered ? colors.secondary : colors.primary) : "#6b7280"}
              strokeWidth="2"
              fill="none"
              style={{
                filter: isActive ? `drop-shadow(0 0 ${isHovered ? '8px' : '5px'} ${isHovered ? colors.secondary : colors.primary})` : 'none',
                transition: 'all 0.3s ease'
              }}
            />
          </svg>
        </div>
      </div>
    </button>
  );
}