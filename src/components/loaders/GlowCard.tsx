'use client';

import React from 'react';

interface GlowCardProps {
  children?: React.ReactNode;
  title?: string;
  color?: 'gold' | 'cyan' | 'white';
  shape?: 'rounded' | 'sharp' | 'angled';
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  showRay?: boolean;
  showLines?: boolean;
  className?: string;
}

/**
 * Glow Card - Transformed from Uiverse.io by Spacious74
 *
 * Original: White/gray gradient card with animated dot border
 * Transformed: Gold/Cyan/White variants matching Mek Tycoon design
 * Features: Animated corner dot, light ray effect, grid lines, radial gradients
 */
export default function GlowCard({
  children,
  title,
  color = 'gold',
  shape = 'rounded',
  size = 'md',
  showDot = true,
  showRay = true,
  showLines = true,
  className = ''
}: GlowCardProps) {
  const sizeStyles = {
    sm: { width: '200px', height: '160px', fontSize: '2rem' },
    md: { width: '300px', height: '250px', fontSize: '4rem' },
    lg: { width: '400px', height: '320px', fontSize: '5rem' }
  };

  const colorConfig = {
    gold: {
      outerGradient: 'radial-gradient(circle 230px at 0% 0%, #fab617, #0c0d0d)',
      innerGradient: 'radial-gradient(circle 280px at 0% 0%, #5a4a1a, #0c0d0d)',
      dotColor: '#fab617',
      dotShadow: '0 0 10px #fab617',
      rayColor: '#fab617',
      textGradient: 'linear-gradient(45deg, #000000 4%, #fab617, #000)',
      lineGradientH: 'linear-gradient(90deg, #fab617 30%, #1d1f1f 70%)',
      lineGradientV: 'linear-gradient(180deg, #b8860b 30%, #222424 70%)'
    },
    cyan: {
      outerGradient: 'radial-gradient(circle 230px at 0% 0%, #00d4ff, #0c0d0d)',
      innerGradient: 'radial-gradient(circle 280px at 0% 0%, #1a4a5a, #0c0d0d)',
      dotColor: '#00d4ff',
      dotShadow: '0 0 10px #00d4ff',
      rayColor: '#00d4ff',
      textGradient: 'linear-gradient(45deg, #000000 4%, #00d4ff, #000)',
      lineGradientH: 'linear-gradient(90deg, #00d4ff 30%, #1d1f1f 70%)',
      lineGradientV: 'linear-gradient(180deg, #0077a3 30%, #222424 70%)'
    },
    white: {
      outerGradient: 'radial-gradient(circle 230px at 0% 0%, #ffffff, #0c0d0d)',
      innerGradient: 'radial-gradient(circle 280px at 0% 0%, #444444, #0c0d0d)',
      dotColor: '#fff',
      dotShadow: '0 0 10px #ffffff',
      rayColor: '#c7c7c7',
      textGradient: 'linear-gradient(45deg, #000000 4%, #fff, #000)',
      lineGradientH: 'linear-gradient(90deg, #888888 30%, #1d1f1f 70%)',
      lineGradientV: 'linear-gradient(180deg, #747474 30%, #222424 70%)'
    }
  };

  const shapeStyles = {
    rounded: { outerRadius: '10px', innerRadius: '9px' },
    sharp: { outerRadius: '0px', innerRadius: '0px' },
    angled: { outerRadius: '4px', innerRadius: '3px' }
  };

  const config = colorConfig[color];
  const shapeConfig = shapeStyles[shape];
  const sizeConfig = sizeStyles[size];

  const dotKeyframes = `
    @keyframes moveDot-${color} {
      0%, 100% {
        top: 10%;
        right: 10%;
      }
      25% {
        top: 10%;
        right: calc(100% - 35px);
      }
      50% {
        top: calc(100% - 30px);
        right: calc(100% - 35px);
      }
      75% {
        top: calc(100% - 30px);
        right: 10%;
      }
    }
  `;

  return (
    <>
      <style>{dotKeyframes}</style>
      <div
        className={`relative ${className}`}
        style={{
          width: sizeConfig.width,
          height: sizeConfig.height,
          borderRadius: shapeConfig.outerRadius,
          padding: '1px',
          background: config.outerGradient
        }}
      >
        {/* Animated Dot */}
        {showDot && (
          <div
            style={{
              width: '5px',
              aspectRatio: '1',
              position: 'absolute',
              backgroundColor: config.dotColor,
              boxShadow: config.dotShadow,
              borderRadius: '100px',
              zIndex: 2,
              right: '10%',
              top: '10%',
              animation: `moveDot-${color} 6s linear infinite`
            }}
          />
        )}

        {/* Inner Card */}
        <div
          style={{
            zIndex: 1,
            width: '100%',
            height: '100%',
            borderRadius: shapeConfig.innerRadius,
            border: 'solid 1px #202222',
            background: config.innerGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            flexDirection: 'column',
            color: '#fff'
          }}
        >
          {/* Light Ray */}
          {showRay && (
            <div
              style={{
                width: '220px',
                height: '45px',
                borderRadius: '100px',
                position: 'absolute',
                backgroundColor: config.rayColor,
                opacity: 0.4,
                boxShadow: `0 0 50px ${config.rayColor}`,
                filter: 'blur(10px)',
                transformOrigin: '10%',
                top: '0%',
                left: '0',
                transform: 'rotate(40deg)'
              }}
            />
          )}

          {/* Grid Lines */}
          {showLines && (
            <>
              {/* Top Line */}
              <div
                style={{
                  width: '100%',
                  height: '1px',
                  position: 'absolute',
                  top: '10%',
                  background: config.lineGradientH
                }}
              />
              {/* Bottom Line */}
              <div
                style={{
                  width: '100%',
                  height: '1px',
                  position: 'absolute',
                  bottom: '10%',
                  backgroundColor: '#2c2c2c'
                }}
              />
              {/* Left Line */}
              <div
                style={{
                  left: '10%',
                  width: '1px',
                  height: '100%',
                  position: 'absolute',
                  background: config.lineGradientV
                }}
              />
              {/* Right Line */}
              <div
                style={{
                  right: '10%',
                  width: '1px',
                  height: '100%',
                  position: 'absolute',
                  backgroundColor: '#2c2c2c'
                }}
              />
            </>
          )}

          {/* Title Text */}
          {title && (
            <span
              style={{
                fontWeight: 'bolder',
                fontSize: sizeConfig.fontSize,
                background: config.textGradient,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                zIndex: 1
              }}
            >
              {title}
            </span>
          )}

          {/* Children Content */}
          {children && (
            <div className="relative z-10">
              {children}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
