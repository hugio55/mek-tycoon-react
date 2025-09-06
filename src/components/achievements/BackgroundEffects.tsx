import React, { useState, useEffect } from 'react';

export const AchievementsBackgroundEffects: React.FC = () => {
  const [stars, setStars] = useState<Array<{id: number, left: string, top: string, size: number, opacity: number}>>([]);
  const [fineStars, setFineStars] = useState<Array<{id: number, left: string, top: string}>>([]);

  useEffect(() => {
    // Generate star background
    const generatedStars = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
    }));
    setStars(generatedStars);
    
    // Generate extra fine white stars
    const generatedFineStars = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    }));
    setFineStars(generatedFineStars);
  }, []);

  return (
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
      
      {/* Fine stars */}
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
      
      {/* Regular stars */}
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
          }}
        />
      ))}
    </div>
  );
};