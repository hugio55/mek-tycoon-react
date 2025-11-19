"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { SeededRandom } from "@/lib/seeded-random";
import { useLoaderContext } from "@/features/page-loader";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function GlobalBackground() {
  const pathname = usePathname();
  const { isLoading } = useLoaderContext();
  const siteSettings = useQuery(api.siteSettings.getSiteSettings);
  const [mounted, setMounted] = useState(false);

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const backgroundStars = useMemo(() => {
    const rng = new SeededRandom(67890); // Seed for stationary stars
    return [...Array(200)].map((_, i) => ({
      id: i,
      left: `${rng.random() * 100}%`,
      top: `${rng.random() * 100}%`,
      size: rng.random() * 2 + 1, // Increased from 0.5 to 1 for better visibility
      opacity: rng.random() * 0.6 + 0.6, // Increased minimum opacity from 0.4 to 0.6
      twinkle: rng.random() > 0.5,
      delay: rng.random() * 4, // Random delay between 0-4 seconds for each star
    }));
  }, []);

  const particles = useMemo(() => {
    const rng = new SeededRandom(12345); // Seed for yellow particles
    return [...Array(25)].map((_, i) => {
      const driftAngle = -60 + rng.random() * 120;
      return {
        id: i,
        left: `${-10 + rng.random() * 120}%`,
        top: `${rng.random() * 100}%`,
        delay: `${rng.random() * 30}s`,
        duration: `${20 + rng.random() * 15}s`,
        size: 1.5 + rng.random() * 1.5, // Increased from 0.8-1.6 to 1.5-3.0 for better visibility
        driftAngle: driftAngle,
      };
    });
  }, []);

  const satellites = useMemo(() => {
    const rng = new SeededRandom(11111); // Seed for satellites
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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Background visibility check - AFTER all hooks are called
  // On landing-v2: only show during loader, then hide
  if (pathname === '/landing-v2' && !isLoading) {
    return null;
  }

  // Don't render background on original landing page (has its own custom background)
  if (pathname === '/landing') {
    return null;
  }

  // Don't render on root path if landing page is enabled (landing page has its own background)
  if (pathname === '/' && siteSettings?.landingPageEnabled && !isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: -1 }}>
      {/* Deep space background gradient - enhanced for visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950" style={{ transform: 'translateZ(0)', willChange: 'auto' }} />

      {/* Industrial grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(250, 182, 23, 0.1) 49px, rgba(250, 182, 23, 0.1) 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(250, 182, 23, 0.1) 49px, rgba(250, 182, 23, 0.1) 50px)',
        }}
      />

      {/* Stationary twinkling stars */}
      {backgroundStars.map((star) => {
        const finalOpacity = star.twinkle ? (mounted ? 0.3 : star.opacity) : star.opacity;
        return (
        <div
          key={star.id}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: finalOpacity,
            animationName: mounted && star.twinkle ? 'starTwinkle' : 'none',
            animationDuration: '2s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: `${star.delay}s`,
          }}
        />
        );
      })}

      {/* Yellow particles drifting like space debris */}
      {mounted && particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute bg-yellow-400 rounded-full pointer-events-none"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: particle.left,
            top: particle.top,
            animationName: 'linearDrift',
            animationDuration: particle.duration,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationDelay: particle.delay,
            boxShadow: '0 0 6px rgba(250, 182, 23, 0.6)',
            '--drift-x': `${Math.cos(particle.driftAngle * Math.PI / 180) * 150}vw`,
            '--drift-y': `${Math.sin(particle.driftAngle * Math.PI / 180) * 150}vh`,
          } as React.CSSProperties}
        />
      ))}

      {/* Satellites moving across screen */}
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
            className="absolute w-[3px] h-[3px] bg-white rounded-full pointer-events-none"
            style={{
              left: satellite.startX,
              top: satellite.startY,
              '--translate-x': translateX,
              '--translate-y': translateY,
              animationName: 'satelliteMove',
              animationDuration: satellite.duration,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              animationDelay: satellite.delay,
              boxShadow: '0 0 3px rgba(255, 255, 255, 0.8)',
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}
