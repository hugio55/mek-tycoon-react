"use client";

import { useState, useEffect, useRef } from "react";

interface QuantumButtonProps {
  text?: string;
  onClick?: () => void;
  isActive?: boolean;
  variant?: 'purple' | 'yellow';
  alwaysOn?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function QuantumButton({
  text = "DEPLOY",
  onClick,
  isActive = true,
  variant = 'yellow',
  alwaysOn = false,
  className = "",
  disabled = false
}: QuantumButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);

  // Particle class for quantum effects
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
      this.life = 0;
      this.maxLife = 60 + Math.random() * 60;

      if (alwaysOn) {
        this.vx = (Math.random() - 0.5) * 1.125;
        this.vy = (Math.random() - 0.5) * 1.125;
      } else {
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3;
      }

      this.size = 1 + Math.random() * 4;

      if (variantColor === 'yellow') {
        this.color = `hsl(${45 + Math.random() * 15}, 100%, 50%)`;
      } else {
        this.color = `hsl(${270 + Math.random() * 60}, 100%, 50%)`;
      }
    }

    update() {
      this.life++;
      this.x += this.vx;
      this.y += this.vy;
      this.vx += (Math.random() - 0.5) * 0.5;
      this.vy += (Math.random() - 0.5) * 0.5;
    }

    draw(ctx: CanvasRenderingContext2D) {
      const alpha = 1 - (this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 15;
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
        tertiary: '#f59e0b',
        glow: 'rgba(250,182,23,',
        glowBright: 'rgba(252,211,77,',
        gradient: 'from-amber-950/90 via-black/90 to-yellow-950/90'
      }
    : {
        primary: '#a855f7',
        secondary: '#c084fc',
        tertiary: '#9333ea',
        glow: 'rgba(168,85,247,',
        glowBright: 'rgba(192,132,252,',
        gradient: 'from-purple-950/90 via-black/90 to-violet-950/90'
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
        <div className={`
          relative bg-gradient-to-br
          ${isActive ? colors.gradient : 'from-gray-900/90 via-black/90 to-gray-800/90'}
          backdrop-blur-lg
          border-2 transition-all duration-300
          ${isActive
            ? isHovered
              ? `border-[${colors.secondary}] shadow-[0_0_60px_${colors.glowBright}0.6)]`
              : `border-[${colors.primary}] shadow-[0_0_50px_${colors.glow}0.5)]`
            : 'border-gray-600 shadow-[0_0_10px_rgba(156,163,175,0.2)]'
          }
          px-8 py-6
        `}>
          {/* Quantum distortion field */}
          <div
            className="absolute inset-0"
            style={{
              background: isActive
                ? `radial-gradient(circle at 50% 50%,
                  ${colors.glow}0.2) 0%,
                  transparent 60%)`
                : `radial-gradient(circle at 50% 50%,
                  rgba(156,163,175,0.1) 0%,
                  transparent 60%)`,
              filter: 'blur(0px)',
              animation: isActive ? `quantum-warp ${isHovered ? '3s' : '6s'} ease-in-out infinite` : 'none',
              transition: 'all 0.5s ease'
            }}
          />

          {/* Reality distortion waves */}
          {isActive && (
            <>
              <div
                className="absolute inset-0"
                style={{
                  background: `conic-gradient(from 0deg, transparent, ${colors.glow}0.1), transparent, ${colors.glow}0.1), transparent)`,
                  animation: `quantum-spin ${isHovered ? '2.25s' : '5s'} linear infinite`
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `conic-gradient(from 180deg, transparent, ${colors.glow}0.1), transparent, ${colors.glow}0.1), transparent)`,
                  animation: `quantum-spin ${isHovered ? '3s' : '6s'} linear infinite reverse`
                }}
              />
            </>
          )}

          {/* Particle canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{
              width: '100%',
              height: '100%',
              mixBlendMode: 'screen'
            }}
          />

          {/* Quantum interference pattern */}
          {isActive && (
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-500"
              style={{
                opacity: isHovered ? 0.4 : (alwaysOn ? 0.3 : 0),
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 10px,
                  ${colors.glow}0.1) 10px,
                  ${colors.glow}0.1) 20px
                ), repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 10px,
                  ${colors.glow}0.1) 10px,
                  ${colors.glow}0.1) 20px
                )`,
                animation: `quantum-interference ${isHovered ? '1.5s' : '3.5s'} linear infinite`
              }}
            />
          )}

          {/* Content */}
          <div className="relative z-10 flex items-center justify-center">
            <div className="relative">
              {/* Quantum glow effect */}
              {isActive && (
                <div
                  className={`absolute -inset-3 blur-xl bg-gradient-to-r ${
                    variant === 'yellow'
                      ? 'from-yellow-500/30 via-amber-500/30 to-yellow-500/30'
                      : 'from-purple-500/30 via-violet-500/30 to-purple-500/30'
                  }`}
                  style={{
                    animation: `quantum-breathe ${isHovered ? '1.5s' : '3.5s'} ease-in-out infinite`,
                    opacity: isHovered ? 1 : (alwaysOn ? 0.8 : 0)
                  }}
                />
              )}

              <span
                className={`relative text-4xl font-bold uppercase ${
                  isActive
                    ? variant === 'yellow'
                      ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent'
                      : 'bg-gradient-to-r from-purple-400 via-violet-400 to-purple-400 bg-clip-text text-transparent'
                    : 'text-gray-500'
                }`}
                style={{
                  fontFamily: 'Orbitron, monospace',
                  letterSpacing: '0.2em',
                  filter: isActive
                    ? isHovered
                      ? `drop-shadow(0 0 30px ${colors.glowBright}1)) brightness(1.15)`
                      : `drop-shadow(0 0 25px ${colors.glow}0.9))`
                    : 'none',
                  animation: isActive ? `quantum-glitch ${isHovered ? '1.5s' : '4s'} steps(3) infinite` : 'none'
                }}
              >
                {text}
              </span>
            </div>
          </div>

          {/* Quantum field distortion corners */}
          <div className={`absolute -top-1 -left-1 w-6 h-6 transition-all duration-500 opacity-100`}>
            <div
              className={`absolute inset-0 rounded-full blur-md ${
                isActive ? `bg-[${colors.primary}] animate-pulse` : 'bg-gray-500'
              }`}
              style={{ animationDuration: isActive ? (isHovered ? '0.75s' : '2s') : '0s' }}
            />
            <div
              className={`absolute inset-1 rounded-full ${
                isActive ? `bg-[${colors.tertiary}]` : 'bg-gray-600'
              }`}
              style={{ filter: isActive && isHovered ? 'brightness(1.2)' : 'none' }}
            />
          </div>
          <div className={`absolute -top-1 -right-1 w-6 h-6 transition-all duration-500 opacity-100`}>
            <div
              className={`absolute inset-0 rounded-full blur-md ${
                isActive ? `bg-[${colors.primary}] animate-pulse` : 'bg-gray-500'
              }`}
              style={{ animationDuration: isActive ? (isHovered ? '0.75s' : '2s') : '0s', animationDelay: isActive ? '0.5s' : '0s' }}
            />
            <div
              className={`absolute inset-1 rounded-full ${
                isActive ? `bg-[${colors.tertiary}]` : 'bg-gray-600'
              }`}
              style={{ filter: isActive && isHovered ? 'brightness(1.2)' : 'none' }}
            />
          </div>
          <div className={`absolute -bottom-1 -left-1 w-6 h-6 transition-all duration-500 opacity-100`}>
            <div
              className={`absolute inset-0 rounded-full blur-md ${
                isActive ? `bg-[${colors.primary}] animate-pulse` : 'bg-gray-500'
              }`}
              style={{ animationDuration: isActive ? (isHovered ? '0.75s' : '2s') : '0s', animationDelay: isActive ? '1s' : '0s' }}
            />
            <div
              className={`absolute inset-1 rounded-full ${
                isActive ? `bg-[${colors.tertiary}]` : 'bg-gray-600'
              }`}
              style={{ filter: isActive && isHovered ? 'brightness(1.2)' : 'none' }}
            />
          </div>
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 transition-all duration-500 opacity-100`}>
            <div
              className={`absolute inset-0 rounded-full blur-md ${
                isActive ? `bg-[${colors.primary}] animate-pulse` : 'bg-gray-500'
              }`}
              style={{ animationDuration: isActive ? (isHovered ? '0.75s' : '2s') : '0s', animationDelay: isActive ? '1.5s' : '0s' }}
            />
            <div
              className={`absolute inset-1 rounded-full ${
                isActive ? `bg-[${colors.tertiary}]` : 'bg-gray-600'
              }`}
              style={{ filter: isActive && isHovered ? 'brightness(1.2)' : 'none' }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}