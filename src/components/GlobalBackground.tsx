"use client";

import { useState, useEffect } from "react";

export default function GlobalBackground() {
  const [particles, setParticles] = useState<Array<{id: number, left: string, top: string, delay: string, duration: string, size: number}>>([]);
  const [stars, setStars] = useState<Array<{id: number, left: string, top: string, size: number, opacity: number, twinkle: boolean, fastPulse?: boolean}>>([]);
  const [satellites, setSatellites] = useState<Array<{id: number, startX: string, startY: string, endX: string, endY: string, delay: string, duration: string}>>([]);

  useEffect(() => {
    // Generate floating particles with size variation
    const generatedParticles = [...Array(20)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
      duration: `${5 + Math.random() * 5}s`,
      size: 0.8 + Math.random() * 0.8, // Size between 0.8px and 1.6px
    }));
    setParticles(generatedParticles);
    
    // Generate twinkling stars (35% more = 81 stars)
    const generatedStars = [...Array(81)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() > 0.5,
      fastPulse: i < 5 && Math.random() > 0.5, // Only first 5 stars can pulse fast, and only 50% chance
    }));
    setStars(generatedStars);
    
    // Generate occasional satellites (3-4 that move diagonally across screen)
    const generatedSatellites = [...Array(4)].map((_, i) => {
      const goingRight = Math.random() > 0.5;
      const goingDown = Math.random() > 0.5;
      return {
        id: i,
        startX: goingRight ? '-5%' : '105%',
        startY: goingDown ? '-5%' : '105%',
        endX: goingRight ? '105%' : '-5%',
        endY: goingDown ? '105%' : '-5%',
        delay: `${i * 15 + Math.random() * 20}s`, // Stagger them significantly
        duration: `${40 + Math.random() * 20}s`, // 40-60 seconds to cross
      };
    });
    setSatellites(generatedSatellites);
  }, []);

  return (
    <>
      {/* Background Effects Container - exact copy from shop page */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }}>
        {/* Gradient orbs - gaseous and smoky nebula clouds with smoother gradients */}
        <div 
          className="absolute left-0 top-0 w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse 600px 400px at -10% 25%, 
                rgba(250, 182, 23, 0.25) 0%, 
                rgba(250, 182, 23, 0.23) 5%,
                rgba(250, 182, 23, 0.21) 10%,
                rgba(250, 182, 23, 0.19) 15%,
                rgba(250, 182, 23, 0.15) 20%, 
                rgba(250, 182, 23, 0.13) 25%,
                rgba(250, 182, 23, 0.11) 30%,
                rgba(250, 182, 23, 0.09) 35%,
                rgba(250, 182, 23, 0.08) 40%, 
                rgba(250, 182, 23, 0.06) 45%,
                rgba(250, 182, 23, 0.04) 50%,
                rgba(250, 182, 23, 0.02) 60%,
                transparent 70%),
              radial-gradient(ellipse 500px 700px at 110% 75%, 
                rgba(250, 182, 23, 0.22) 0%, 
                rgba(250, 182, 23, 0.20) 5%,
                rgba(250, 182, 23, 0.18) 10%,
                rgba(250, 182, 23, 0.16) 15%,
                rgba(250, 182, 23, 0.14) 20%,
                rgba(250, 182, 23, 0.12) 25%, 
                rgba(250, 182, 23, 0.10) 30%,
                rgba(250, 182, 23, 0.08) 35%,
                rgba(250, 182, 23, 0.06) 45%, 
                rgba(250, 182, 23, 0.04) 55%,
                rgba(250, 182, 23, 0.02) 65%,
                transparent 70%)
            `,
            filter: 'blur(40px)',
            transform: 'translateZ(0)', // GPU acceleration
            willChange: 'transform',
          }}
        />
        
        {/* Secondary nebula layer for depth and complexity with more gradient stops */}
        <div 
          className="absolute left-0 top-0 w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse 450px 300px at 5% 40%, 
                rgba(250, 182, 23, 0.12) 0%, 
                rgba(250, 182, 23, 0.10) 10%,
                rgba(250, 182, 23, 0.08) 20%,
                rgba(250, 182, 23, 0.06) 30%, 
                rgba(250, 182, 23, 0.04) 40%,
                rgba(250, 182, 23, 0.02) 50%,
                transparent 60%),
              radial-gradient(ellipse 350px 500px at 95% 60%, 
                rgba(250, 182, 23, 0.10) 0%, 
                rgba(250, 182, 23, 0.09) 10%,
                rgba(250, 182, 23, 0.07) 20%,
                rgba(250, 182, 23, 0.05) 35%, 
                rgba(250, 182, 23, 0.03) 50%,
                rgba(250, 182, 23, 0.01) 60%,
                transparent 65%)
            `,
            filter: 'blur(60px)',
            mixBlendMode: 'screen',
            transform: 'translateZ(0)', // GPU acceleration
            willChange: 'transform',
          }}
        />
        
        {/* Noise texture overlay to reduce banding */}
        <div 
          className="absolute left-0 top-0 w-full h-full opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
            mixBlendMode: 'overlay',
          }}
        />
        
        {/* Pattern overlay - exact copy from shop page */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 35px,
                rgba(250, 182, 23, 0.03) 35px,
                rgba(250, 182, 23, 0.03) 70px
              )
            `,
          }}
        />
        
        {/* Stars */}
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animation: star.fastPulse ? `starTwinkle ${0.8 + Math.random() * 0.4}s ease-in-out infinite` : 
                       star.twinkle ? `starTwinkle ${2 + Math.random() * 2}s ease-in-out infinite` : 'none',
              animationDelay: star.twinkle || star.fastPulse ? `${Math.random() * 2}s` : '0s',
            }}
          />
        ))}
        
        {/* Floating particles with size variation */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute bg-yellow-400 rounded-full"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: particle.left,
              top: particle.top,
              animation: `floatParticle ${particle.duration} ease-in-out infinite`,
              animationDelay: particle.delay,
              boxShadow: '0 0 6px rgba(250, 182, 23, 0.6)',
            }}
          />
        ))}
        
        {/* Satellites moving diagonally across screen */}
        {satellites.map((satellite) => {
          const translateX = satellite.startX === '-5%' ? 'calc(110vw)' : 'calc(-110vw)';
          const translateY = satellite.startY === '-5%' ? 'calc(110vh)' : 'calc(-110vh)';
          
          return (
            <div
              key={satellite.id}
              className="absolute w-[2px] h-[2px] bg-white rounded-full"
              style={{
                left: satellite.startX,
                top: satellite.startY,
                '--translate-x': translateX,
                '--translate-y': translateY,
                animation: `satelliteMove ${satellite.duration} linear infinite`,
                animationDelay: satellite.delay,
                boxShadow: '0 0 3px rgba(255, 255, 255, 0.8)',
              } as React.CSSProperties}
            />
          );
        })}
      </div>
    </>
  );
}