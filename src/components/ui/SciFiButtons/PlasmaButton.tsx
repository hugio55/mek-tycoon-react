"use client";

import { useState, useEffect, useRef } from "react";

interface PlasmaButtonProps {
  text?: string;
  onClick?: () => void;
  variant?: 'energy' | 'classic';
  className?: string;
  disabled?: boolean;
  showMetrics?: boolean;
  metricValue?: number;
  metricMax?: number;
}

export default function PlasmaButton({
  text = "ACTIVATE",
  onClick,
  variant = 'classic',
  className = "",
  disabled = false,
  showMetrics = false,
  metricValue = 5,
  metricMax = 14
}: PlasmaButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);

  // Particle class for plasma effects
  class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;

    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 2;
      this.vy = (Math.random() - 0.5) * 2;
      this.life = 0;
      this.maxLife = 60 + Math.random() * 60;
      this.size = 2 + Math.random() * 3;
      this.color = `hsl(${45 + Math.random() * 15}, 100%, 50%)`;
    }

    update() {
      this.life++;
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.99;
      this.vy *= 0.99;
    }

    draw(ctx: CanvasRenderingContext2D) {
      const alpha = 1 - (this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 10;
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

      if (isHovered || particlesRef.current.length > 0) {
        if (isHovered && Math.random() < 0.3) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          particlesRef.current.push(new Particle(x, y));
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
  }, [isHovered]);

  const fillPercentage = showMetrics ? (metricValue / metricMax) * 100 : 0;

  if (variant === 'energy') {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        disabled={disabled}
        className={`
          btn-plasma-energy
          ${isPressed ? 'scale-95' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        style={{ width: '280px', height: '80px' }}
      >
        <div className="plasma-core">
          <div className="plasma-field"></div>
          <div className="plasma-inner">
            <span className="plasma-text">{text}</span>
          </div>
        </div>
      </button>
    );
  }

  // Classic plasma variant
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
        transition-transform duration-100
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <div className="relative">
        <div className={`
          relative bg-gradient-to-br from-black via-gray-900 to-black
          backdrop-blur-sm
          border-2 transition-all duration-300
          ${isHovered
            ? 'border-yellow-400 shadow-[0_0_30px_rgba(250,182,23,0.6)]'
            : 'border-yellow-600/50 shadow-[0_0_15px_rgba(250,182,23,0.3)]'
          }
          rounded-lg
          px-8 py-6
        `}>
          {/* Electric field lines */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 10px,
                rgba(250,182,23,0.1) 10px,
                rgba(250,182,23,0.1) 11px
              )`,
              animation: 'electric-flow 2s linear infinite'
            }}
          />

          {/* Plasma glow */}
          <div
            className={`absolute inset-0 rounded-lg transition-opacity duration-300`}
            style={{
              background: `radial-gradient(ellipse at center,
                rgba(250,182,23,${isHovered ? '0.3' : '0.15'}) 0%,
                transparent 70%)`,
              animation: isHovered ? 'plasma-pulse 1s ease-in-out infinite' : 'none'
            }}
          />

          {/* Energy particles canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          />

          {/* Content */}
          {showMetrics ? (
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="text-yellow-400/60 text-sm uppercase tracking-wider">
                  Active Units
                </div>
                <div className="flex items-baseline">
                  <span
                    className="text-3xl font-bold text-yellow-400"
                    style={{
                      fontFamily: 'Orbitron, monospace',
                      textShadow: isHovered
                        ? '0 0 20px rgba(250,182,23,0.8)'
                        : '0 0 10px rgba(250,182,23,0.5)'
                    }}
                  >
                    {String(metricValue).padStart(2, '0')}
                  </span>
                  <span className="text-yellow-600/60 text-2xl mx-1">/</span>
                  <span className="text-xl text-yellow-500/80 font-semibold">
                    {String(metricMax).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative">
                <div className="h-2 bg-black/50 border border-yellow-600/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600"
                    style={{
                      width: `${fillPercentage}%`,
                      boxShadow: '0 0 10px rgba(250,182,23,0.8)',
                      animation: 'plasma-flow 3s linear infinite'
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="relative z-10 flex items-center justify-center">
              <span
                className="text-2xl font-bold text-yellow-400 uppercase"
                style={{
                  fontFamily: 'Orbitron, monospace',
                  letterSpacing: '0.15em',
                  textShadow: isHovered
                    ? '0 0 20px rgba(250,182,23,0.8), 0 0 40px rgba(250,182,23,0.4)'
                    : '0 0 10px rgba(250,182,23,0.5)'
                }}
              >
                {text}
              </span>
            </div>
          )}

          {/* Lightning bolts on hover */}
          {isHovered && (
            <>
              <div
                className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-yellow-400 to-transparent opacity-50"
                style={{
                  animation: 'lightning-strike 0.5s ease-out infinite',
                  animationDelay: '0s'
                }}
              />
              <div
                className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-yellow-400 to-transparent opacity-50"
                style={{
                  animation: 'lightning-strike 0.5s ease-out infinite',
                  animationDelay: '0.2s'
                }}
              />
            </>
          )}
        </div>
      </div>
    </button>
  );
}