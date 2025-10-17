"use client";

import { useState, useEffect, useMemo } from "react";
import { SeededRandom } from "@/lib/seeded-random";

export default function GlobalBackgroundStarfield() {
  // Use useMemo to generate deterministic values that are consistent between server and client
  const particles = useMemo(() => {
    const rng = new SeededRandom(12345); // Fixed seed for particles
    return [...Array(25)].map((_, i) => {
      const driftAngle = -60 + rng.random() * 120;
      return {
        id: i,
        left: `${-10 + rng.random() * 120}%`,
        top: `${rng.random() * 100}%`,
        delay: `${rng.random() * 30}s`,
        duration: `${20 + rng.random() * 15}s`,
        size: 0.8 + rng.random() * 0.8,
        driftAngle: driftAngle,
      };
    });
  }, []);

  const stars = useMemo(() => {
    const rng = new SeededRandom(67890); // Different seed for stars
    return [...Array(81)].map((_, i) => ({
      id: i,
      left: `${rng.random() * 100}%`,
      top: `${rng.random() * 100}%`,
      size: rng.random() * 3 + 0.5,
      opacity: rng.random() * 0.8 + 0.2,
      twinkle: rng.boolean(0.5),
      fastPulse: i < 5 && rng.boolean(0.5),
    }));
  }, []);

  const satellites = useMemo(() => {
    const rng = new SeededRandom(11111); // Different seed for satellites
    return [...Array(8)].map((_, i) => {
      const edge = Math.floor(rng.random() * 4);
      let startX: number, startY: number, endX: number, endY: number;

      if (edge === 0) {
        startX = -15 - rng.random() * 10;
        startY = rng.random() * 100;
        endX = 115 + rng.random() * 10;
        endY = rng.random() * 100;
      } else if (edge === 1) {
        startX = 115 + rng.random() * 10;
        startY = rng.random() * 100;
        endX = -15 - rng.random() * 10;
        endY = rng.random() * 100;
      } else if (edge === 2) {
        startX = rng.random() * 100;
        startY = -15 - rng.random() * 10;
        endX = rng.random() * 100;
        endY = 115 + rng.random() * 10;
      } else {
        startX = rng.random() * 100;
        startY = 115 + rng.random() * 10;
        endX = rng.random() * 100;
        endY = -15 - rng.random() * 10;
      }

      return {
        id: i,
        startX: `${startX}%`,
        startY: `${startY}%`,
        endX: `${endX}%`,
        endY: `${endY}%`,
        delay: `${rng.random() * 10}s`,
        duration: `${30 + rng.random() * 20}s`,
      };
    });
  }, []);

  const [mounted, setMounted] = useState(false);

  // Set mounted state to handle animations that should only run on client
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Background Effects Container - exact copy from shop page */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1, minWidth: '100vw', minHeight: '100vh', width: '100vw', height: '100vh' }}>
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
              // Use deterministic animation durations based on star id
              // Using separate animation properties to avoid React warning
              animationName: mounted && (star.fastPulse || star.twinkle) ? 'starTwinkle' : 'none',
              animationDuration: mounted ? (
                star.fastPulse ? `${0.8 + (star.id % 5) * 0.1}s` :
                star.twinkle ? `${2 + (star.id % 8) * 0.25}s` : '0s'
              ) : '0s',
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: mounted && (star.fastPulse || star.twinkle) ? 'infinite' : 1,
              animationDelay: mounted && (star.twinkle || star.fastPulse) ? `${(star.id % 4) * 0.5}s` : '0s',
            }}
          />
        ))}

        {/* Floating particles drifting in straight lines like space debris */}
        {mounted && particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute bg-yellow-400 rounded-full"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: particle.left,
              top: particle.top,
              animation: `linearDrift ${particle.duration} linear infinite`,
              animationDelay: particle.delay,
              boxShadow: '0 0 6px rgba(250, 182, 23, 0.6)',
              '--drift-x': `${Math.cos(particle.driftAngle * Math.PI / 180) * 150}vw`,
              '--drift-y': `${Math.sin(particle.driftAngle * Math.PI / 180) * 150}vh`,
            } as React.CSSProperties}
          />
        ))}

        {/* Satellites moving in random directions across screen */}
        {mounted && satellites.map((satellite) => {
          const startXNum = parseFloat(satellite.startX);
          const startYNum = parseFloat(satellite.startY);
          const endXNum = parseFloat(satellite.endX);
          const endYNum = parseFloat(satellite.endY);

          const translateX = `${(endXNum - startXNum)}vw`;
          const translateY = `${(endYNum - startYNum)}vh`;

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
