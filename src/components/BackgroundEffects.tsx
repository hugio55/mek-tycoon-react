"use client";

import { useState, useEffect } from "react";

export default function BackgroundEffects() {
  const [particles, setParticles] = useState<Array<{id: number, left: string, top: string, delay: string, duration: string}>>([]);
  const [stars, setStars] = useState<Array<{id: number, left: string, top: string, size: number, opacity: number, twinkle: boolean}>>([]);
  const [fineStars, setFineStars] = useState<Array<{id: number, left: string, top: string}>>([]);

  useEffect(() => {
    // Generate floating particles
    const generatedParticles = [...Array(15)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
      duration: `${5 + Math.random() * 5}s`,
    }));
    setParticles(generatedParticles);
    
    // Generate twinkling stars
    const generatedStars = [...Array(50)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() > 0.6,
    }));
    setStars(generatedStars);
    
    // Generate extra fine white stars
    const generatedFineStars = [...Array(100)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    }));
    setFineStars(generatedFineStars);
  }, []);

  return (
    <>
      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        
        @keyframes floatParticle {
          0% { transform: translateY(0px) translateX(0px); opacity: 0.5; }
          33% { transform: translateY(-20px) translateX(10px); opacity: 1; }
          66% { transform: translateY(10px) translateX(-10px); opacity: 0.7; }
          100% { transform: translateY(0px) translateX(0px); opacity: 0.5; }
        }
        
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(250, 182, 23, 0.3); }
          50% { box-shadow: 0 0 25px rgba(250, 182, 23, 0.6); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      
      {/* Background Effects Container */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Yellow gradient orbs */}
        <div 
          className="absolute left-0 top-0 w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse at 10% 20%, rgba(250, 182, 23, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 90% 80%, rgba(250, 182, 23, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(250, 182, 23, 0.05) 0%, transparent 70%)
            `
          }}
        />
        
        {/* Animated background pattern */}
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
        
        {/* Extra fine white stars */}
        {fineStars.map((star) => (
          <div
            key={`fine-${star.id}`}
            className="absolute rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
              width: '1px',
              height: '1px',
              opacity: 0.6,
            }}
          />
        ))}
        
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
              animation: star.twinkle ? `starTwinkle ${2 + Math.random() * 2}s ease-in-out infinite` : 'none',
              animationDelay: star.twinkle ? `${Math.random() * 2}s` : '0s',
            }}
          />
        ))}
        
        {/* Floating particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full"
            style={{
              left: particle.left,
              top: particle.top,
              animation: `floatParticle ${particle.duration} ease-in-out infinite`,
              animationDelay: particle.delay,
              boxShadow: '0 0 4px rgba(250, 182, 23, 0.6)',
            }}
          />
        ))}
      </div>
    </>
  );
}