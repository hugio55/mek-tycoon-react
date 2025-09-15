"use client";

import { useState, useEffect, useRef } from "react";

interface ViewActiveContractsButtonEnhancedProps {
  activeContracts: number;
  maxContracts: number;
  onClick?: () => void;
  variant?: "plasma" | "holographic" | "quantum" | "holographic-yellow" | "quantum-yellow" | "holographic-yellow-active" | "quantum-yellow-active";
  buttonText?: string;
  isActive?: boolean;
}

export default function ViewActiveContractsButtonEnhanced({
  activeContracts = 5,
  maxContracts = 14,
  onClick,
  variant = "plasma",
  buttonText,
  isActive = true
}: ViewActiveContractsButtonEnhancedProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);

  // Particle class for effects
  class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
    type: string;

    constructor(x: number, y: number, type: string) {
      this.x = x;
      this.y = y;
      this.type = type;
      this.life = 0;
      this.maxLife = 60 + Math.random() * 60;
      
      if (type === "plasma") {
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.size = 2 + Math.random() * 3;
        this.color = `hsl(${45 + Math.random() * 15}, 100%, 50%)`;
      } else if (type === "holographic") {
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = -Math.random() * 2;
        this.size = 1 + Math.random() * 2;
        this.color = `hsl(${180 + Math.random() * 60}, 100%, 50%)`;
      } else if (type === "holographic-yellow") {
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = -Math.random() * 2;
        this.size = 1 + Math.random() * 2;
        this.color = `hsl(${45 + Math.random() * 15}, 100%, 50%)`;
      } else if (type === "quantum-yellow") {
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3;
        this.size = 1 + Math.random() * 4;
        this.color = `hsl(${45 + Math.random() * 15}, 100%, 50%)`;
      } else if (type === "holographic-yellow-active") {
        // 62.5% slower than original (25% slower, then 50% slower)
        this.vx = (Math.random() - 0.5) * 0.375;
        this.vy = -Math.random() * 0.75;
        this.size = 1 + Math.random() * 2;
        this.color = `hsl(48, 100%, 50%)`; // Single yellow color, no rainbow
      } else if (type === "quantum-yellow-active") {
        // 62.5% slower than original (25% slower, then 50% slower)
        this.vx = (Math.random() - 0.5) * 1.125;
        this.vy = (Math.random() - 0.5) * 1.125;
        this.size = 1 + Math.random() * 4;
        this.color = `hsl(${45 + Math.random() * 15}, 100%, 50%)`;
      } else {
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3;
        this.size = 1 + Math.random() * 4;
        this.color = `hsl(${270 + Math.random() * 60}, 100%, 50%)`;
      }
    }

    update() {
      this.life++;
      this.x += this.vx;
      this.y += this.vy;
      
      if (this.type === "plasma") {
        this.vx *= 0.99;
        this.vy *= 0.99;
      } else if (this.type === "quantum" || this.type === "quantum-yellow" || this.type === "quantum-yellow-active") {
        this.vx += (Math.random() - 0.5) * 0.5;
        this.vy += (Math.random() - 0.5) * 0.5;
      }
    }

    draw(ctx: CanvasRenderingContext2D) {
      const alpha = 1 - (this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      
      if (this.type === "plasma") {
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
      } else if (this.type === "holographic" || this.type === "holographic-yellow" || this.type === "holographic-yellow-active") {
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.color;
      } else {
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
      }
      
      ctx.fillStyle = this.color;
      ctx.beginPath();
      // Ensure radius is never negative or too small
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

    // Set canvas size
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Add new particles
      const isAlwaysActive = (variant === 'holographic-yellow-active' || variant === 'quantum-yellow-active') && isActive;
      const particleSpeed = isHovered && isAlwaysActive ? 0.48 : isAlwaysActive ? 0.1125 : 0.3; // 62.5% slower base rate (was 0.225), 20% faster on hover (was 0.4)

      if (isHovered || particlesRef.current.length > 0 || isAlwaysActive) {
        if ((isHovered || isAlwaysActive) && Math.random() < particleSpeed) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          particlesRef.current.push(new Particle(x, y, variant));
        }

        // Update and draw particles
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
  }, [isHovered, variant, isActive]);

  // Calculate fill percentage
  const fillPercentage = (activeContracts / maxContracts) * 100;

  // Variant 1: Plasma Pulse
  if (variant === "plasma") {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        className={`
          relative group overflow-hidden
          ${isPressed ? 'scale-95' : ''}
          transition-transform duration-100
        `}
      >
        {/* Base container */}
        <div className="relative">
          {/* Background with plasma effect */}
          <div className={`
            relative bg-gradient-to-br from-gray-900 via-gray-950 to-black
            border-2 transition-all duration-300
            ${isHovered 
              ? 'border-yellow-400 shadow-[0_0_30px_rgba(250,182,23,0.5)]' 
              : 'border-yellow-500/50 shadow-[0_0_15px_rgba(250,182,23,0.2)]'
            }
            p-4
          `}>
            {/* Animated plasma background */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: `radial-gradient(circle at ${isHovered ? '50%' : '0%'} 50%, 
                  rgba(250,182,23,0.4) 0%, 
                  transparent 70%)`,
                animation: 'plasma-morph 3s ease-in-out infinite',
                transition: 'all 0.5s ease'
              }}
            />

            {/* Electric pulse rings */}
            {isHovered && (
              <>
                <div 
                  className="absolute inset-0 border-2 border-yellow-400/30"
                  style={{
                    animation: 'electric-pulse 1s ease-out infinite'
                  }}
                />
                <div 
                  className="absolute inset-0 border-2 border-yellow-400/20"
                  style={{
                    animation: 'electric-pulse 1s ease-out infinite 0.3s'
                  }}
                />
              </>
            )}

            {/* Particle canvas */}
            <canvas 
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none"
              style={{ width: '100%', height: '100%' }}
            />

            {/* Energy field effect */}
            <div 
              className={`absolute inset-0 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
              style={{
                background: `linear-gradient(45deg, 
                  transparent 30%, 
                  rgba(250,182,23,0.1) 50%, 
                  transparent 70%)`,
                animation: 'energy-sweep 2s linear infinite'
              }}
            />

            {/* Content */}
            <div className="relative z-10 flex items-center gap-4">
              {/* Status indicators */}
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  {Array.from({ length: 7 }, (_, i) => (
                    <div
                      key={i}
                      className={`
                        w-2 h-6 transition-all duration-300
                        ${i < Math.ceil(activeContracts / 2) 
                          ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,182,23,0.8)]' 
                          : 'bg-gray-700'
                        }
                      `}
                      style={{
                        animation: i < Math.ceil(activeContracts / 2) && isHovered 
                          ? `plasma-glow 1s ease-in-out infinite ${i * 0.1}s` 
                          : 'none'
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 7 }, (_, i) => (
                    <div
                      key={i}
                      className={`
                        w-2 h-6 transition-all duration-300
                        ${i + 7 < activeContracts 
                          ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,182,23,0.8)]' 
                          : i + 7 < maxContracts
                          ? 'bg-gray-700'
                          : 'bg-black/70'
                        }
                      `}
                      style={{
                        animation: i + 7 < activeContracts && isHovered 
                          ? `plasma-glow 1s ease-in-out infinite ${i * 0.1}s` 
                          : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Main display */}
              <div className="flex flex-col">
                <div className="text-[10px] font-bold text-yellow-500/80 uppercase tracking-[0.3em] mb-1">
                  Active Contracts
                </div>
                <div className="relative">
                  {/* Glow backdrop */}
                  <div className="absolute inset-0 bg-yellow-400/20 blur-xl" />
                  
                  <div className="relative bg-black/80 border border-yellow-500/50 px-3 py-1">
                    <div className="flex items-baseline">
                      <span 
                        className="text-3xl font-bold text-yellow-400" 
                        style={{ 
                          fontFamily: 'Orbitron, monospace',
                          textShadow: isHovered 
                            ? '0 0 20px rgba(250, 182, 23, 0.8), 0 0 40px rgba(250, 182, 23, 0.4)' 
                            : '0 0 10px rgba(250, 182, 23, 0.5)',
                          letterSpacing: '0.1em',
                          animation: isHovered ? 'plasma-flicker 0.5s ease-in-out infinite' : 'none'
                        }}
                      >
                        {String(activeContracts).padStart(2, '0')}
                      </span>
                      <span className="text-yellow-600/60 text-2xl mx-1 font-bold">/</span>
                      <span 
                        className="text-xl text-yellow-500/80 font-semibold" 
                        style={{ 
                          fontFamily: 'Orbitron, monospace' 
                        }}
                      >
                        {String(maxContracts).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Energy bar */}
                <div className="mt-2 h-1 bg-gray-800 relative overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-300"
                    style={{
                      width: `${fillPercentage}%`,
                      boxShadow: '0 0 10px rgba(250, 182, 23, 0.8)',
                      animation: 'energy-flow 2s linear infinite'
                    }}
                  />
                  {isHovered && (
                    <div 
                      className="absolute inset-y-0 left-0 bg-white/30"
                      style={{
                        width: `${fillPercentage}%`,
                        animation: 'pulse-bar 1s ease-in-out infinite'
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Corner accents */}
            <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 transition-all duration-300 ${
              isHovered ? 'border-yellow-400' : 'border-yellow-500/30'
            }`} />
            <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 transition-all duration-300 ${
              isHovered ? 'border-yellow-400' : 'border-yellow-500/30'
            }`} />
            <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 transition-all duration-300 ${
              isHovered ? 'border-yellow-400' : 'border-yellow-500/30'
            }`} />
            <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 transition-all duration-300 ${
              isHovered ? 'border-yellow-400' : 'border-yellow-500/30'
            }`} />
          </div>
        </div>
      </button>
    );
  }

  // Variant 2: Holographic Matrix
  if (variant === "holographic") {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        className={`
          relative group overflow-hidden
          ${isPressed ? 'scale-95' : ''}
          transition-transform duration-100
        `}
      >
        <div className="relative">
          <div className={`
            relative bg-gradient-to-br from-gray-900/90 via-blue-950/90 to-black/90
            backdrop-blur-md
            border-2 transition-all duration-300
            ${isHovered 
              ? 'border-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.5)]' 
              : 'border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
            }
            p-4
          `}>
            {/* Holographic grid background */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(6,182,212,0.05) 25%, rgba(6,182,212,0.05) 26%, transparent 27%, transparent 74%, rgba(6,182,212,0.05) 75%, rgba(6,182,212,0.05) 76%, transparent 77%, transparent),
                  linear-gradient(90deg, transparent 24%, rgba(6,182,212,0.05) 25%, rgba(6,182,212,0.05) 26%, transparent 27%, transparent 74%, rgba(6,182,212,0.05) 75%, rgba(6,182,212,0.05) 76%, transparent 77%, transparent)`,
                backgroundSize: '20px 20px',
                animation: 'holo-grid 10s linear infinite'
              }}
            />

            {/* Data stream effect */}
            {isHovered && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 w-px bg-gradient-to-b from-transparent via-cyan-400 to-transparent h-full opacity-50"
                    style={{
                      left: `${20 * (i + 1)}%`,
                      animation: `data-stream ${2 + i * 0.5}s linear infinite ${i * 0.2}s`
                    }}
                  />
                ))}
              </div>
            )}

            {/* Holographic shimmer */}
            <div 
              className={`absolute inset-0 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
              style={{
                background: `linear-gradient(105deg, 
                  transparent 30%, 
                  rgba(6,182,212,0.2) 40%,
                  rgba(139,92,246,0.2) 50%,
                  rgba(6,182,212,0.2) 60%,
                  transparent 70%)`,
                animation: 'holo-shimmer 3s ease-in-out infinite'
              }}
            />

            {/* Particle canvas */}
            <canvas 
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none"
              style={{ width: '100%', height: '100%' }}
            />

            {/* Content */}
            <div className="relative z-10 flex items-center gap-4">
              {/* Holographic display matrix */}
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-400/10 blur-md" />
                <div className="relative grid grid-cols-7 gap-0.5 p-1 bg-black/50 border border-cyan-500/30">
                  {Array.from({ length: 14 }, (_, i) => (
                    <div
                      key={i}
                      className={`
                        w-3 h-3 transition-all duration-300
                        ${i < activeContracts 
                          ? 'bg-gradient-to-br from-cyan-400 to-blue-500' 
                          : i < maxContracts
                          ? 'bg-gray-800/50'
                          : 'bg-black/70'
                        }
                      `}
                      style={{
                        boxShadow: i < activeContracts 
                          ? '0 0 10px rgba(6,182,212,0.8), inset 0 0 5px rgba(139,92,246,0.5)' 
                          : 'none',
                        animation: i < activeContracts && isHovered 
                          ? `holo-pulse 2s ease-in-out infinite ${i * 0.1}s` 
                          : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Main holographic display */}
              <div className="flex flex-col">
                <div className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-[0.3em] mb-1">
                  System Status
                </div>
                <div className="relative">
                  {/* Holographic projection effect */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-cyan-400/20 blur-lg" />
                  
                  <div className="relative bg-black/60 backdrop-blur-sm border border-cyan-400/50 px-3 py-1">
                    {/* Scan line effect */}
                    {isHovered && (
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'linear-gradient(transparent 0%, rgba(6,182,212,0.1) 50%, transparent 100%)',
                          height: '20%',
                          animation: 'scan-line 3s linear infinite'
                        }}
                      />
                    )}
                    
                    <div className="flex items-baseline relative">
                      <span 
                        className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent" 
                        style={{ 
                          fontFamily: 'Orbitron, monospace',
                          letterSpacing: '0.1em',
                          filter: isHovered ? 'drop-shadow(0 0 20px rgba(6,182,212,0.8))' : 'drop-shadow(0 0 10px rgba(6,182,212,0.5))',
                          animation: isHovered ? 'holo-glitch 3s ease-in-out infinite' : 'none'
                        }}
                      >
                        {String(activeContracts).padStart(2, '0')}
                      </span>
                      <span className="text-cyan-600/60 text-2xl mx-1 font-bold">/</span>
                      <span 
                        className="text-xl text-cyan-400/80 font-semibold" 
                        style={{ 
                          fontFamily: 'Orbitron, monospace' 
                        }}
                      >
                        {String(maxContracts).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Holographic progress indicator */}
                <div className="mt-2 relative">
                  <div className="h-1 bg-gray-900/50 border border-cyan-500/20 relative overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-600 via-blue-400 to-cyan-300"
                      style={{
                        width: `${fillPercentage}%`,
                        boxShadow: '0 0 15px rgba(6,182,212,0.8)',
                        animation: 'holo-flow 3s linear infinite'
                      }}
                    />
                    {isHovered && (
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        style={{
                          animation: 'shimmer-bar 2s linear infinite'
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Holographic frame corners */}
            <svg className="absolute top-0 left-0 w-8 h-8" viewBox="0 0 32 32">
              <path 
                d="M0 8 L0 0 L8 0" 
                stroke={isHovered ? "#06b6d4" : "#06b6d466"} 
                strokeWidth="2" 
                fill="none"
                style={{
                  filter: isHovered ? 'drop-shadow(0 0 5px #06b6d4)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            </svg>
            <svg className="absolute top-0 right-0 w-8 h-8" viewBox="0 0 32 32">
              <path 
                d="M24 0 L32 0 L32 8" 
                stroke={isHovered ? "#06b6d4" : "#06b6d466"} 
                strokeWidth="2" 
                fill="none"
                style={{
                  filter: isHovered ? 'drop-shadow(0 0 5px #06b6d4)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            </svg>
            <svg className="absolute bottom-0 left-0 w-8 h-8" viewBox="0 0 32 32">
              <path 
                d="M0 24 L0 32 L8 32" 
                stroke={isHovered ? "#06b6d4" : "#06b6d466"} 
                strokeWidth="2" 
                fill="none"
                style={{
                  filter: isHovered ? 'drop-shadow(0 0 5px #06b6d4)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            </svg>
            <svg className="absolute bottom-0 right-0 w-8 h-8" viewBox="0 0 32 32">
              <path 
                d="M24 32 L32 32 L32 24" 
                stroke={isHovered ? "#06b6d4" : "#06b6d466"} 
                strokeWidth="2" 
                fill="none"
                style={{
                  filter: isHovered ? 'drop-shadow(0 0 5px #06b6d4)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            </svg>
          </div>
        </div>
      </button>
    );
  }

  // Variant 2b: Holographic Matrix - Yellow
  if (variant === "holographic-yellow") {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        className={`
          relative group overflow-hidden
          ${isPressed ? 'scale-95' : ''}
          transition-transform duration-100
        `}
      >
        <div className="relative">
          <div className={`
            relative bg-gradient-to-br from-gray-900/90 via-amber-950/90 to-black/90
            backdrop-blur-md
            border-2 transition-all duration-300
            ${isHovered 
              ? 'border-yellow-400 shadow-[0_0_40px_rgba(250,182,23,0.5)]' 
              : 'border-yellow-500/30 shadow-[0_0_20px_rgba(250,182,23,0.2)]'
            }
            px-8 py-6
          `}>
            {/* Holographic grid background */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(250,182,23,0.05) 25%, rgba(250,182,23,0.05) 26%, transparent 27%, transparent 74%, rgba(250,182,23,0.05) 75%, rgba(250,182,23,0.05) 76%, transparent 77%, transparent),
                  linear-gradient(90deg, transparent 24%, rgba(250,182,23,0.05) 25%, rgba(250,182,23,0.05) 26%, transparent 27%, transparent 74%, rgba(250,182,23,0.05) 75%, rgba(250,182,23,0.05) 76%, transparent 77%, transparent)`,
                backgroundSize: '20px 20px',
                animation: 'holo-grid 10s linear infinite'
              }}
            />

            {/* Data stream effect */}
            {isHovered && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 w-px bg-gradient-to-b from-transparent via-yellow-400 to-transparent h-full opacity-50"
                    style={{
                      left: `${20 * (i + 1)}%`,
                      animation: `data-stream ${2 + i * 0.5}s linear infinite ${i * 0.2}s`
                    }}
                  />
                ))}
              </div>
            )}

            {/* Holographic shimmer */}
            <div 
              className={`absolute inset-0 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
              style={{
                background: `linear-gradient(105deg, 
                  transparent 30%, 
                  rgba(250,182,23,0.2) 40%,
                  rgba(251,191,36,0.2) 50%,
                  rgba(250,182,23,0.2) 60%,
                  transparent 70%)`,
                animation: 'holo-shimmer 3s ease-in-out infinite'
              }}
            />

            {/* Particle canvas */}
            <canvas 
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none"
              style={{ width: '100%', height: '100%' }}
            />

            {/* Content - Simplified single word */}
            <div className="relative z-10 flex items-center justify-center">
              <span 
                className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent uppercase" 
                style={{ 
                  fontFamily: 'Orbitron, monospace',
                  letterSpacing: '0.2em',
                  filter: isHovered ? 'drop-shadow(0 0 20px rgba(250,182,23,0.8))' : 'drop-shadow(0 0 10px rgba(250,182,23,0.5))',
                  animation: isHovered ? 'holo-glitch 3s ease-in-out infinite' : 'none'
                }}
              >
                {buttonText || 'SUBMIT'}
              </span>
            </div>

            {/* Holographic frame corners */}
            <svg className="absolute top-0 left-0 w-8 h-8" viewBox="0 0 32 32">
              <path 
                d="M0 8 L0 0 L8 0" 
                stroke={isHovered ? "#fab617" : "#fab61766"} 
                strokeWidth="2" 
                fill="none"
                style={{
                  filter: isHovered ? 'drop-shadow(0 0 5px #fab617)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            </svg>
            <svg className="absolute top-0 right-0 w-8 h-8" viewBox="0 0 32 32">
              <path 
                d="M24 0 L32 0 L32 8" 
                stroke={isHovered ? "#fab617" : "#fab61766"} 
                strokeWidth="2" 
                fill="none"
                style={{
                  filter: isHovered ? 'drop-shadow(0 0 5px #fab617)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            </svg>
            <svg className="absolute bottom-0 left-0 w-8 h-8" viewBox="0 0 32 32">
              <path 
                d="M0 24 L0 32 L8 32" 
                stroke={isHovered ? "#fab617" : "#fab61766"} 
                strokeWidth="2" 
                fill="none"
                style={{
                  filter: isHovered ? 'drop-shadow(0 0 5px #fab617)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            </svg>
            <svg className="absolute bottom-0 right-0 w-8 h-8" viewBox="0 0 32 32">
              <path 
                d="M24 32 L32 32 L32 24" 
                stroke={isHovered ? "#fab617" : "#fab61766"} 
                strokeWidth="2" 
                fill="none"
                style={{
                  filter: isHovered ? 'drop-shadow(0 0 5px #fab617)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            </svg>
          </div>
        </div>
      </button>
    );
  }

  // Variant 3: Quantum Flux
  if (variant === "quantum") {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        className={`
          relative group overflow-hidden
          ${isPressed ? 'scale-95' : ''}
          transition-transform duration-100
        `}
      >
        <div className="relative">
          <div className={`
            relative bg-gradient-to-br from-purple-950/90 via-black/90 to-violet-950/90
            backdrop-blur-lg
            border-2 transition-all duration-300
            ${isHovered 
              ? 'border-purple-400 shadow-[0_0_50px_rgba(168,85,247,0.5)]' 
              : 'border-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.2)]'
            }
            p-4
          `}>
            {/* Quantum distortion field */}
            <div 
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at ${isHovered ? '50% 50%' : '100% 100%'}, 
                  rgba(168,85,247,0.2) 0%, 
                  transparent 60%)`,
                filter: isHovered ? 'blur(0px)' : 'blur(10px)',
                animation: 'quantum-warp 4s ease-in-out infinite',
                transition: 'all 0.5s ease'
              }}
            />

            {/* Reality distortion waves */}
            {isHovered && (
              <>
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent, rgba(168,85,247,0.1), transparent, rgba(139,92,246,0.1), transparent)',
                    animation: 'quantum-spin 3s linear infinite'
                  }}
                />
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'conic-gradient(from 180deg, transparent, rgba(217,70,239,0.1), transparent, rgba(168,85,247,0.1), transparent)',
                    animation: 'quantum-spin 4s linear infinite reverse'
                  }}
                />
              </>
            )}

            {/* Particle canvas for quantum particles */}
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
            <div 
              className={`absolute inset-0 pointer-events-none ${isHovered ? 'opacity-30' : 'opacity-0'} transition-opacity duration-500`}
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 10px,
                  rgba(168,85,247,0.1) 10px,
                  rgba(168,85,247,0.1) 20px
                ), repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 10px,
                  rgba(217,70,239,0.1) 10px,
                  rgba(217,70,239,0.1) 20px
                )`,
                animation: 'quantum-interference 2s linear infinite'
              }}
            />

            {/* Content */}
            <div className="relative z-10 flex items-center gap-4">
              {/* Quantum state indicators */}
              <div className="relative">
                <div className="absolute inset-0 bg-purple-400/10 blur-xl" />
                <div className="relative">
                  {/* Quantum probability cloud */}
                  <div className="grid grid-cols-3 gap-1 p-1">
                    {Array.from({ length: 9 }, (_, i) => {
                      const row = Math.floor(i / 3);
                      const col = i % 3;
                      const isCenter = row === 1 && col === 1;
                      const isActive = i < Math.ceil(activeContracts * 9 / maxContracts);
                      
                      return (
                        <div
                          key={i}
                          className={`
                            w-4 h-4 rounded-full transition-all duration-500
                            ${isActive 
                              ? 'bg-gradient-to-br from-purple-400 via-violet-500 to-pink-500' 
                              : 'bg-gray-800/30'
                            }
                          `}
                          style={{
                            boxShadow: isActive 
                              ? '0 0 20px rgba(168,85,247,0.8), inset 0 0 10px rgba(217,70,239,0.5)' 
                              : 'none',
                            animation: isActive && isHovered 
                              ? `quantum-phase ${1.5 + Math.random()}s ease-in-out infinite ${i * 0.1}s` 
                              : 'none',
                            transform: isHovered && isActive 
                              ? `scale(${isCenter ? 1.2 : 1.1})` 
                              : 'scale(1)'
                          }}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Quantum entanglement lines */}
                  {isHovered && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <line x1="20%" y1="20%" x2="50%" y2="50%" 
                        stroke="url(#quantum-gradient)" strokeWidth="1" opacity="0.5"
                        style={{ animation: 'quantum-link 2s ease-in-out infinite' }}
                      />
                      <line x1="80%" y1="20%" x2="50%" y2="50%" 
                        stroke="url(#quantum-gradient)" strokeWidth="1" opacity="0.5"
                        style={{ animation: 'quantum-link 2s ease-in-out infinite 0.5s' }}
                      />
                      <line x1="20%" y1="80%" x2="50%" y2="50%" 
                        stroke="url(#quantum-gradient)" strokeWidth="1" opacity="0.5"
                        style={{ animation: 'quantum-link 2s ease-in-out infinite 1s' }}
                      />
                      <line x1="80%" y1="80%" x2="50%" y2="50%" 
                        stroke="url(#quantum-gradient)" strokeWidth="1" opacity="0.5"
                        style={{ animation: 'quantum-link 2s ease-in-out infinite 1.5s' }}
                      />
                      <defs>
                        <linearGradient id="quantum-gradient">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="50%" stopColor="#d946ef" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                    </svg>
                  )}
                </div>
              </div>

              {/* Main quantum display */}
              <div className="flex flex-col">
                <div className="text-[10px] font-bold text-purple-400/80 uppercase tracking-[0.3em] mb-1">
                  Quantum State
                </div>
                <div className="relative">
                  {/* Quantum glow effect */}
                  <div className="absolute -inset-3 bg-gradient-to-r from-purple-500/30 via-violet-500/30 to-pink-500/30 blur-xl" 
                    style={{
                      animation: isHovered ? 'quantum-breathe 2s ease-in-out infinite' : 'none'
                    }}
                  />
                  
                  <div className="relative bg-black/70 backdrop-blur-md border border-purple-400/50 px-3 py-1">
                    {/* Quantum fluctuation effect */}
                    {isHovered && (
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle at 50% 50%, rgba(168,85,247,0.2) 0%, transparent 50%)',
                          animation: 'quantum-fluctuate 1s ease-in-out infinite'
                        }}
                      />
                    )}
                    
                    <div className="flex items-baseline relative">
                      <span 
                        className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-violet-400 to-pink-400 bg-clip-text text-transparent" 
                        style={{ 
                          fontFamily: 'Orbitron, monospace',
                          letterSpacing: '0.1em',
                          filter: isHovered 
                            ? 'drop-shadow(0 0 25px rgba(168,85,247,0.9))' 
                            : 'drop-shadow(0 0 15px rgba(168,85,247,0.6))',
                          animation: isHovered ? 'quantum-glitch 2s steps(3) infinite' : 'none'
                        }}
                      >
                        {String(activeContracts).padStart(2, '0')}
                      </span>
                      <span className="text-purple-600/60 text-2xl mx-1 font-bold"
                        style={{
                          animation: isHovered ? 'quantum-phase 2s ease-in-out infinite' : 'none'
                        }}
                      >⟩⟨</span>
                      <span 
                        className="text-xl text-purple-400/80 font-semibold" 
                        style={{ 
                          fontFamily: 'Orbitron, monospace',
                          opacity: isHovered ? 0.8 : 1,
                          animation: isHovered ? 'quantum-fade 2s ease-in-out infinite' : 'none'
                        }}
                      >
                        {String(maxContracts).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quantum probability bar */}
                <div className="mt-2 relative">
                  <div className="h-2 bg-gray-900/50 border border-purple-500/20 relative overflow-hidden rounded-full">
                    <div 
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${fillPercentage}%`,
                        background: 'linear-gradient(90deg, #a855f7, #d946ef, #a855f7, #d946ef)',
                        backgroundSize: '200% 100%',
                        boxShadow: '0 0 20px rgba(168,85,247,0.8), inset 0 0 10px rgba(217,70,239,0.5)',
                        animation: 'quantum-flow 2s linear infinite',
                        filter: isHovered ? 'hue-rotate(30deg)' : 'none'
                      }}
                    />
                    {isHovered && (
                      <>
                        <div 
                          className="absolute inset-y-0 left-0 bg-white/20 rounded-full"
                          style={{
                            width: `${fillPercentage}%`,
                            animation: 'quantum-collapse 3s ease-in-out infinite'
                          }}
                        />
                        <div 
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                            animation: 'quantum-sweep 2s linear infinite'
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Quantum state label */}
                <div className="text-[9px] font-mono text-purple-400/60 mt-1"
                  style={{
                    animation: isHovered ? 'quantum-text 3s steps(10) infinite' : 'none'
                  }}
                >
                  {isHovered ? '⟨ψ|SUPERPOSITION|ψ⟩' : '⟨ψ|COLLAPSED|ψ⟩'}
                </div>
              </div>
            </div>

            {/* Quantum field distortion corners */}
            <div className={`absolute -top-1 -left-1 w-6 h-6 transition-all duration-500 ${
              isHovered ? 'opacity-100' : 'opacity-50'
            }`}>
              <div className="absolute inset-0 bg-purple-400 rounded-full blur-md animate-pulse" />
              <div className="absolute inset-1 bg-violet-500 rounded-full" />
            </div>
            <div className={`absolute -top-1 -right-1 w-6 h-6 transition-all duration-500 ${
              isHovered ? 'opacity-100' : 'opacity-50'
            }`}>
              <div className="absolute inset-0 bg-purple-400 rounded-full blur-md animate-pulse" />
              <div className="absolute inset-1 bg-violet-500 rounded-full" />
            </div>
            <div className={`absolute -bottom-1 -left-1 w-6 h-6 transition-all duration-500 ${
              isHovered ? 'opacity-100' : 'opacity-50'
            }`}>
              <div className="absolute inset-0 bg-purple-400 rounded-full blur-md animate-pulse" />
              <div className="absolute inset-1 bg-violet-500 rounded-full" />
            </div>
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 transition-all duration-500 ${
              isHovered ? 'opacity-100' : 'opacity-50'
            }`}>
              <div className="absolute inset-0 bg-purple-400 rounded-full blur-md animate-pulse" />
              <div className="absolute inset-1 bg-violet-500 rounded-full" />
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Variant 2c: Holographic Matrix - Yellow Active
  if (variant === "holographic-yellow-active") {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        className={`
          relative group overflow-hidden
          ${isPressed ? 'scale-95' : ''}
          transition-all duration-300
          ${!isActive ? 'grayscale opacity-60' : ''}
        `}
      >
        <div className="relative">
          <div className={`
            relative bg-gradient-to-br
            ${isActive
              ? 'from-gray-900/90 via-amber-950/90 to-black/90'
              : 'from-gray-900/90 via-gray-800/90 to-black/90'
            }
            backdrop-blur-md
            border-2 transition-all duration-300
            ${isActive
              ? isHovered
                ? 'border-yellow-300 shadow-[0_0_50px_rgba(252,211,77,0.6)]'
                : 'border-yellow-400 shadow-[0_0_40px_rgba(250,182,23,0.5)]'
              : 'border-gray-600 shadow-[0_0_10px_rgba(156,163,175,0.2)]'
            }
            px-8 py-6
          `}>
            {/* Holographic grid background - dimmed when inactive */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: isActive
                  ? `linear-gradient(0deg, transparent 24%, rgba(250,182,23,0.05) 25%, rgba(250,182,23,0.05) 26%, transparent 27%, transparent 74%, rgba(250,182,23,0.05) 75%, rgba(250,182,23,0.05) 76%, transparent 77%, transparent),
                    linear-gradient(90deg, transparent 24%, rgba(250,182,23,0.05) 25%, rgba(250,182,23,0.05) 26%, transparent 27%, transparent 74%, rgba(250,182,23,0.05) 75%, rgba(250,182,23,0.05) 76%, transparent 77%, transparent)`
                  : `linear-gradient(0deg, transparent 24%, rgba(156,163,175,0.03) 25%, rgba(156,163,175,0.03) 26%, transparent 27%, transparent 74%, rgba(156,163,175,0.03) 75%, rgba(156,163,175,0.03) 76%, transparent 77%, transparent),
                    linear-gradient(90deg, transparent 24%, rgba(156,163,175,0.03) 25%, rgba(156,163,175,0.03) 26%, transparent 27%, transparent 74%, rgba(156,163,175,0.03) 75%, rgba(156,163,175,0.03) 76%, transparent 77%, transparent)`,
                backgroundSize: '20px 20px',
                animation: isActive ? `holo-grid ${isHovered ? '7.5s' : '10s'} linear infinite` : 'none'
              }}
            />

            {/* Data stream effect - stopped when inactive */}
            {isActive && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 w-px bg-gradient-to-b from-transparent via-yellow-400 to-transparent h-full opacity-50"
                    style={{
                      left: `${20 * (i + 1)}%`,
                      animation: `data-stream ${isHovered ? (1.5 + i * 0.375) : (2 + i * 0.5)}s linear infinite ${i * 0.2}s`
                    }}
                  />
                ))}
              </div>
            )}

            {/* Holographic shimmer - hidden when inactive */}
            {isActive && (
              <div
                className={`absolute inset-0 pointer-events-none transition-opacity duration-500`}
                style={{
                  opacity: isHovered ? 1 : 0.7,
                  background: `linear-gradient(105deg,
                    transparent 30%,
                    rgba(250,182,23,0.2) 40%,
                    rgba(251,191,36,0.2) 50%,
                    rgba(250,182,23,0.2) 60%,
                    transparent 70%)`,
                  animation: `holo-shimmer ${isHovered ? '2.25s' : '3s'} ease-in-out infinite`
                }}
              />
            )}

            {/* Particle canvas - always active */}
            <canvas 
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none"
              style={{ width: '100%', height: '100%' }}
            />

            {/* Content - Simplified single word */}
            <div className="relative z-10 flex items-center justify-center">
              <span
                className={`text-4xl font-bold uppercase ${
                  isActive ? 'text-yellow-400' : 'text-gray-500'
                }`}
                style={{
                  fontFamily: 'Orbitron, monospace',
                  letterSpacing: '0.2em',
                  filter: isActive
                    ? isHovered
                      ? 'drop-shadow(0 0 25px rgba(252,211,77,0.9)) brightness(1.1)'
                      : 'drop-shadow(0 0 20px rgba(250,182,23,0.8))'
                    : 'none',
                  textShadow: isActive
                    ? isHovered
                      ? '0 0 30px rgba(252,211,77,0.9), 0 0 60px rgba(252,211,77,0.5)'
                      : '0 0 20px rgba(250,182,23,0.8), 0 0 40px rgba(250,182,23,0.4)'
                    : 'none'
                }}
              >
                {buttonText || 'SUBMIT'}
              </span>
            </div>

            {/* Holographic frame corners - grey when inactive */}
            <svg className="absolute top-0 left-0 w-8 h-8" viewBox="0 0 32 32">
              <path
                d="M0 8 L0 0 L8 0"
                stroke={isActive ? (isHovered ? "#fcd34d" : "#fab617") : "#6b7280"}
                strokeWidth="2"
                fill="none"
                style={{
                  filter: isActive ? `drop-shadow(0 0 ${isHovered ? '8px' : '5px'} ${isHovered ? '#fcd34d' : '#fab617'})` : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            </svg>
            <svg className="absolute top-0 right-0 w-8 h-8" viewBox="0 0 32 32">
              <path
                d="M24 0 L32 0 L32 8"
                stroke={isActive ? (isHovered ? "#fcd34d" : "#fab617") : "#6b7280"}
                strokeWidth="2"
                fill="none"
                style={{
                  filter: isActive ? `drop-shadow(0 0 ${isHovered ? '8px' : '5px'} ${isHovered ? '#fcd34d' : '#fab617'})` : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            </svg>
            <svg className="absolute bottom-0 left-0 w-8 h-8" viewBox="0 0 32 32">
              <path
                d="M0 24 L0 32 L8 32"
                stroke={isActive ? (isHovered ? "#fcd34d" : "#fab617") : "#6b7280"}
                strokeWidth="2"
                fill="none"
                style={{
                  filter: isActive ? `drop-shadow(0 0 ${isHovered ? '8px' : '5px'} ${isHovered ? '#fcd34d' : '#fab617'})` : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            </svg>
            <svg className="absolute bottom-0 right-0 w-8 h-8" viewBox="0 0 32 32">
              <path
                d="M24 32 L32 32 L32 24"
                stroke={isActive ? (isHovered ? "#fcd34d" : "#fab617") : "#6b7280"}
                strokeWidth="2"
                fill="none"
                style={{
                  filter: isActive ? `drop-shadow(0 0 ${isHovered ? '8px' : '5px'} ${isHovered ? '#fcd34d' : '#fab617'})` : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            </svg>
          </div>
        </div>
      </button>
    );
  }

  // Variant 3b: Quantum Flux - Yellow
  if (variant === "quantum-yellow") {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        className={`
          relative group overflow-hidden
          ${isPressed ? 'scale-95' : ''}
          transition-transform duration-100
        `}
      >
        <div className="relative">
          <div className={`
            relative bg-gradient-to-br from-amber-950/90 via-black/90 to-yellow-950/90
            backdrop-blur-lg
            border-2 transition-all duration-300
            ${isHovered 
              ? 'border-yellow-400 shadow-[0_0_50px_rgba(250,182,23,0.5)]' 
              : 'border-yellow-500/30 shadow-[0_0_25px_rgba(250,182,23,0.2)]'
            }
            px-8 py-6
          `}>
            {/* Quantum distortion field */}
            <div 
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at ${isHovered ? '50% 50%' : '100% 100%'}, 
                  rgba(250,182,23,0.2) 0%, 
                  transparent 60%)`,
                filter: isHovered ? 'blur(0px)' : 'blur(10px)',
                animation: 'quantum-warp 4s ease-in-out infinite',
                transition: 'all 0.5s ease'
              }}
            />

            {/* Reality distortion waves */}
            {isHovered && (
              <>
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent, rgba(250,182,23,0.1), transparent, rgba(251,191,36,0.1), transparent)',
                    animation: 'quantum-spin 3s linear infinite'
                  }}
                />
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'conic-gradient(from 180deg, transparent, rgba(245,158,11,0.1), transparent, rgba(250,182,23,0.1), transparent)',
                    animation: 'quantum-spin 4s linear infinite reverse'
                  }}
                />
              </>
            )}

            {/* Particle canvas for quantum particles */}
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
            <div 
              className={`absolute inset-0 pointer-events-none ${isHovered ? 'opacity-30' : 'opacity-0'} transition-opacity duration-500`}
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 10px,
                  rgba(250,182,23,0.1) 10px,
                  rgba(250,182,23,0.1) 20px
                ), repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 10px,
                  rgba(245,158,11,0.1) 10px,
                  rgba(245,158,11,0.1) 20px
                )`,
                animation: 'quantum-interference 2s linear infinite'
              }}
            />

            {/* Content - Simplified single word */}
            <div className="relative z-10 flex items-center justify-center">
              <div className="relative">
                {/* Quantum glow effect */}
                <div className="absolute -inset-3 bg-gradient-to-r from-yellow-500/30 via-amber-500/30 to-yellow-500/30 blur-xl" 
                  style={{
                    animation: isHovered ? 'quantum-breathe 2s ease-in-out infinite' : 'none'
                  }}
                />
                
                <span 
                  className="relative text-4xl font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent uppercase" 
                  style={{ 
                    fontFamily: 'Orbitron, monospace',
                    letterSpacing: '0.2em',
                    filter: isHovered 
                      ? 'drop-shadow(0 0 25px rgba(250,182,23,0.9))' 
                      : 'drop-shadow(0 0 15px rgba(250,182,23,0.6))',
                    animation: isHovered ? 'quantum-glitch 2s steps(3) infinite' : 'none'
                  }}
                >
                  {buttonText || 'DEPLOY'}
                </span>
              </div>
            </div>

            {/* Quantum field distortion corners */}
            <div className={`absolute -top-1 -left-1 w-6 h-6 transition-all duration-500 ${
              isHovered ? 'opacity-100' : 'opacity-50'
            }`}>
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-md animate-pulse" />
              <div className="absolute inset-1 bg-amber-500 rounded-full" />
            </div>
            <div className={`absolute -top-1 -right-1 w-6 h-6 transition-all duration-500 ${
              isHovered ? 'opacity-100' : 'opacity-50'
            }`}>
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-md animate-pulse" />
              <div className="absolute inset-1 bg-amber-500 rounded-full" />
            </div>
            <div className={`absolute -bottom-1 -left-1 w-6 h-6 transition-all duration-500 ${
              isHovered ? 'opacity-100' : 'opacity-50'
            }`}>
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-md animate-pulse" />
              <div className="absolute inset-1 bg-amber-500 rounded-full" />
            </div>
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 transition-all duration-500 ${
              isHovered ? 'opacity-100' : 'opacity-50'
            }`}>
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-md animate-pulse" />
              <div className="absolute inset-1 bg-amber-500 rounded-full" />
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Variant 3c: Quantum Flux - Yellow Active
  if (variant === "quantum-yellow-active") {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        className={`
          relative group overflow-hidden
          ${isPressed ? 'scale-95' : ''}
          transition-all duration-300
          ${!isActive ? 'grayscale opacity-60' : ''}
        `}
      >
        <div className="relative">
          <div className={`
            relative bg-gradient-to-br
            ${isActive
              ? 'from-amber-950/90 via-black/90 to-yellow-950/90'
              : 'from-gray-900/90 via-black/90 to-gray-800/90'
            }
            backdrop-blur-lg
            border-2 transition-all duration-300
            ${isActive
              ? isHovered
                ? 'border-yellow-300 shadow-[0_0_60px_rgba(252,211,77,0.6)]'
                : 'border-yellow-400 shadow-[0_0_50px_rgba(250,182,23,0.5)]'
              : 'border-gray-600 shadow-[0_0_10px_rgba(156,163,175,0.2)]'
            }
            px-8 py-6
          `}>
            {/* Quantum distortion field - inactive aware */}
            <div
              className="absolute inset-0"
              style={{
                background: isActive
                  ? `radial-gradient(circle at 50% 50%,
                    rgba(250,182,23,0.2) 0%,
                    transparent 60%)`
                  : `radial-gradient(circle at 50% 50%,
                    rgba(156,163,175,0.1) 0%,
                    transparent 60%)`,
                filter: 'blur(0px)',
                animation: isActive ? `quantum-warp ${isHovered ? '3s' : '6s'} ease-in-out infinite` : 'none',
                transition: 'all 0.5s ease'
              }}
            />

            {/* Reality distortion waves - stopped when inactive */}
            {isActive && (
              <>
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent, rgba(250,182,23,0.1), transparent, rgba(251,191,36,0.1), transparent)',
                    animation: `quantum-spin ${isHovered ? '2.25s' : '5s'} linear infinite`
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'conic-gradient(from 180deg, transparent, rgba(245,158,11,0.1), transparent, rgba(250,182,23,0.1), transparent)',
                    animation: `quantum-spin ${isHovered ? '3s' : '6s'} linear infinite reverse`
                  }}
                />
              </>
            )}

            {/* Particle canvas for quantum particles - always active */}
            <canvas 
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none"
              style={{ 
                width: '100%', 
                height: '100%',
                mixBlendMode: 'screen'
              }}
            />

            {/* Quantum interference pattern - hidden when inactive */}
            {isActive && (
              <div
                className={`absolute inset-0 pointer-events-none transition-opacity duration-500`}
                style={{
                  opacity: isHovered ? 0.4 : 0.3,
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(250,182,23,0.1) 10px,
                    rgba(250,182,23,0.1) 20px
                  ), repeating-linear-gradient(
                    -45deg,
                    transparent,
                    transparent 10px,
                    rgba(245,158,11,0.1) 10px,
                    rgba(245,158,11,0.1) 20px
                  )`,
                  animation: `quantum-interference ${isHovered ? '1.5s' : '3.5s'} linear infinite`
                }}
              />
            )}

            {/* Content - Simplified single word */}
            <div className="relative z-10 flex items-center justify-center">
              <div className="relative">
                {/* Quantum glow effect - dimmed when inactive */}
                {isActive && (
                  <div className="absolute -inset-3 bg-gradient-to-r from-yellow-500/30 via-amber-500/30 to-yellow-500/30 blur-xl"
                    style={{
                      animation: `quantum-breathe ${isHovered ? '1.5s' : '3.5s'} ease-in-out infinite`,
                      opacity: isHovered ? 1 : 0.8
                    }}
                  />
                )}

                <span
                  className={`relative text-4xl font-bold uppercase ${
                    isActive
                      ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent'
                      : 'text-gray-500'
                  }`}
                  style={{
                    fontFamily: 'Orbitron, monospace',
                    letterSpacing: '0.2em',
                    filter: isActive
                      ? isHovered
                        ? 'drop-shadow(0 0 30px rgba(252,211,77,1)) brightness(1.15)'
                        : 'drop-shadow(0 0 25px rgba(250,182,23,0.9))'
                      : 'none',
                    animation: isActive ? `quantum-glitch ${isHovered ? '1.5s' : '4s'} steps(3) infinite` : 'none'
                  }}
                >
                  {buttonText || 'DEPLOY'}
                </span>
              </div>
            </div>

            {/* Quantum field distortion corners - grey when inactive */}
            <div className={`absolute -top-1 -left-1 w-6 h-6 transition-all duration-500 opacity-100`}>
              <div className={`absolute inset-0 rounded-full blur-md ${
                isActive ? 'bg-yellow-400 animate-pulse' : 'bg-gray-500'
              }`}
                style={{ animationDuration: isActive ? (isHovered ? '0.75s' : '2s') : '0s' }} />
              <div className={`absolute inset-1 rounded-full ${
                isActive ? 'bg-amber-500' : 'bg-gray-600'
              }`}
                style={{ filter: isActive && isHovered ? 'brightness(1.2)' : 'none' }} />
            </div>
            <div className={`absolute -top-1 -right-1 w-6 h-6 transition-all duration-500 opacity-100`}>
              <div className={`absolute inset-0 rounded-full blur-md ${
                isActive ? 'bg-yellow-400 animate-pulse' : 'bg-gray-500'
              }`}
                style={{ animationDuration: isActive ? (isHovered ? '0.75s' : '2s') : '0s', animationDelay: isActive ? '0.5s' : '0s' }} />
              <div className={`absolute inset-1 rounded-full ${
                isActive ? 'bg-amber-500' : 'bg-gray-600'
              }`}
                style={{ filter: isActive && isHovered ? 'brightness(1.2)' : 'none' }} />
            </div>
            <div className={`absolute -bottom-1 -left-1 w-6 h-6 transition-all duration-500 opacity-100`}>
              <div className={`absolute inset-0 rounded-full blur-md ${
                isActive ? 'bg-yellow-400 animate-pulse' : 'bg-gray-500'
              }`}
                style={{ animationDuration: isActive ? (isHovered ? '0.75s' : '2s') : '0s', animationDelay: isActive ? '1s' : '0s' }} />
              <div className={`absolute inset-1 rounded-full ${
                isActive ? 'bg-amber-500' : 'bg-gray-600'
              }`}
                style={{ filter: isActive && isHovered ? 'brightness(1.2)' : 'none' }} />
            </div>
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 transition-all duration-500 opacity-100`}>
              <div className={`absolute inset-0 rounded-full blur-md ${
                isActive ? 'bg-yellow-400 animate-pulse' : 'bg-gray-500'
              }`}
                style={{ animationDuration: isActive ? (isHovered ? '0.75s' : '2s') : '0s', animationDelay: isActive ? '1.5s' : '0s' }} />
              <div className={`absolute inset-1 rounded-full ${
                isActive ? 'bg-amber-500' : 'bg-gray-600'
              }`}
                style={{ filter: isActive && isHovered ? 'brightness(1.2)' : 'none' }} />
            </div>
          </div>
        </div>
      </button>
    );
  }

  return null;
}