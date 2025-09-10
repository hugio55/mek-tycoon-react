'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  GlassCard,
  Button, 
  IconButton,
  Modal,
  IndustrialModal,
  ProgressBar,
  LEDIndicator,
  GlowText,
  GlowCounter,
  Stat,
  StatCard,
  StatGroup,
  SearchBar,
  InlineSearch
} from '@/components/ui';

export default function UIShowcase() {
  const [showModal, setShowModal] = useState(false);
  const [showIndustrialModal, setShowIndustrialModal] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [inlineSearchValue, setInlineSearchValue] = useState('');
  const [progressValue, setProgressValue] = useState(65);
  const [particles, setParticles] = useState<Array<{id: number, left: string, top: string, delay: string, duration: string}>>([]);
  const [stars, setStars] = useState<Array<{id: number, left: string, top: string, size: number, opacity: number, twinkle: boolean}>>([]);
  
  useEffect(() => {
    // Generate background effects - matching shop page
    const generatedParticles = [...Array(20)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
      duration: `${5 + Math.random() * 5}s`,
    }));
    setParticles(generatedParticles);
    
    const generatedStars = [...Array(60)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() > 0.5,
    }));
    setStars(generatedStars);
  }, []);

  const sampleStats = [
    { label: 'Total Gold', value: '1.2M', trend: 'up' as const, trendValue: '+12%', color: 'yellow' as const },
    { label: 'Essence Rate', value: '0.115', trend: 'up' as const, trendValue: '+0.003', color: 'green' as const },
    { label: 'Meks Active', value: '42', trend: 'neutral' as const, color: 'blue' as const },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      
      {/* Background Effects - Universal BG from Shop Page */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Gradient orbs */}
        <div 
          className="absolute left-0 top-0 w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(250, 182, 23, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(250, 182, 23, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(250, 182, 23, 0.08) 0%, transparent 70%)
            `
          }}
        />
        
        {/* Pattern overlay */}
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
              animation: star.twinkle ? `starTwinkle ${2 + Math.random() * 2}s ease-in-out infinite` : 'none',
              animationDelay: star.twinkle ? `${Math.random() * 2}s` : '0s',
            }}
          />
        ))}
        
        {/* Floating particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full"
            style={{
              left: particle.left,
              top: particle.top,
              animation: `floatParticle ${particle.duration} ease-in-out infinite`,
              animationDelay: particle.delay,
              boxShadow: '0 0 6px rgba(250, 182, 23, 0.6)',
            }}
          />
        ))}
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <GlowText size="3xl" color="yellow" intensity="high" as="h1">
            UI Component Showcase
          </GlowText>
          <p className="text-gray-400 mt-2">All available UI components for Mek Tycoon</p>
        </div>

        {/* Buttons Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Buttons</h2>
          
          <Card padding="lg">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Style A</p>
                  <Button variant="primary">Primary Button</Button>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Style B</p>
                  <Button variant="secondary">Secondary</Button>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Style C</p>
                  <Button variant="danger">Danger</Button>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Style D</p>
                  <Button variant="success">Success</Button>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Style E</p>
                  <Button variant="ghost">Ghost</Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Style F</p>
                  <Button size="sm">Small</Button>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Style G</p>
                  <Button size="md">Medium</Button>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Style H</p>
                  <Button size="lg">Large</Button>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Style I</p>
                  <Button size="xl">Extra Large</Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Style J</p>
                  <Button variant="primary" glow>Glow Effect</Button>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Style K</p>
                  <Button disabled>Disabled</Button>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Style L</p>
                  <Button fullWidth>Full Width Button</Button>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Style M</p>
                  <IconButton icon="🏠" title="Home" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Style N</p>
                  <IconButton icon="⚙️" variant="primary" title="Settings" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Style O</p>
                  <IconButton icon="❌" variant="danger" size="lg" title="Close" />
                </div>
              </div>
              
              {/* Particle Button */}
              <div className="pt-6 border-t border-gray-800/50 mt-6">
                <p className="text-gray-400 mb-4">Style P - Special Effects Button (from Crafting):</p>
                <div className="particle-button-wrapper" suppressHydrationWarning>
                  <button 
                    className="btn-particles relative"
                    onClick={(e) => {
                      e.currentTarget.classList.add('clicked');
                      setTimeout(() => e.currentTarget.classList.remove('clicked'), 600);
                    }}
                    suppressHydrationWarning
                  >
                    <div className="particles-bg"></div>
                    <span className="particles-text">CRAFT WITH PARTICLES</span>
                    {typeof window !== 'undefined' && (
                      <div className="particle-container">
                        {[...Array(30)].map((_, i) => (
                          <div
                            key={i}
                            className="particle"
                            style={{
                              left: `${Math.random() * 100}%`,
                              top: `${Math.random() * 100}%`,
                              '--x': `${(Math.random() - 0.5) * 200}px`,
                              '--y': `${(Math.random() - 0.5) * 200}px`,
                              '--duration': `${3 + Math.random() * 3}s`,
                              animationDelay: `${Math.random() * 6}s`
                            } as React.CSSProperties}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Cards Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Cards</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <h3 className="text-lg font-bold mb-2">Style A - Basic Card</h3>
              <p className="text-gray-400">Standard card with glass effect</p>
            </Card>
            
            <Card hover glow>
              <h3 className="text-lg font-bold mb-2">Style B - Interactive Card</h3>
              <p className="text-gray-400">With hover and glow effects</p>
            </Card>
            
            <GlassCard borderGlow="yellow">
              <h3 className="text-lg font-bold mb-2">Style C - Glass Card</h3>
              <p className="text-gray-400">With yellow border glow</p>
            </GlassCard>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card gradient padding="xl">
              <h3 className="text-lg font-bold mb-2">Style D - Gradient Card</h3>
              <p className="text-gray-400">With gradient background</p>
            </Card>
            
            <Card 
              hover 
              onClick={() => alert('Card clicked!')}
              className="cursor-pointer"
            >
              <h3 className="text-lg font-bold mb-2">Style E - Clickable Card</h3>
              <p className="text-gray-400">Click me!</p>
            </Card>
          </div>

          {/* New Cards with Decreasing Transparency */}
          <h3 className="text-lg font-semibold text-yellow-400 mt-8 mb-4">Decreasing Transparency Series</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div 
              className="relative p-6 rounded-lg border border-blue-400/30"
              style={{
                background: 'rgba(30, 58, 138, 0.25)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <h3 className="text-lg font-bold mb-2">Style F</h3>
              <p className="text-gray-400">25% blue opacity</p>
            </div>
            
            <div 
              className="relative p-6 rounded-lg border border-blue-400/20"
              style={{
                background: 'rgba(30, 58, 138, 0.15)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <h3 className="text-lg font-bold mb-2">Style G</h3>
              <p className="text-gray-400">15% blue opacity</p>
            </div>
            
            <div 
              className="relative p-6 rounded-lg border border-blue-400/10"
              style={{
                background: 'rgba(30, 58, 138, 0.08)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <h3 className="text-lg font-bold mb-2">Style H</h3>
              <p className="text-gray-400">8% blue opacity</p>
            </div>
            
            <div 
              className="relative p-6 rounded-lg border border-gray-400/10"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <h3 className="text-lg font-bold mb-2">Style I</h3>
              <p className="text-gray-400">Almost transparent</p>
            </div>
          </div>

          {/* Dirty Glass Series */}
          <h3 className="text-lg font-semibold text-yellow-400 mt-8 mb-4">Dirty Glass Series</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div 
              className="relative p-6 rounded-lg overflow-hidden"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.02) 0%, 
                    rgba(255, 255, 255, 0.05) 50%, 
                    rgba(255, 255, 255, 0.02) 100%)`,
                backdropFilter: 'blur(6px)',
                boxShadow: 'inset 0 0 40px rgba(255, 255, 255, 0.03)',
              }}
            >
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `
                    radial-gradient(circle at 20% 30%, rgba(250, 182, 23, 0.08) 0%, transparent 30%),
                    radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.06) 0%, transparent 25%),
                    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 40%)`,
                  mixBlendMode: 'screen',
                }}
              />
              <div 
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
              <h3 className="text-lg font-bold mb-2 relative z-10">Style J</h3>
              <p className="text-gray-400 relative z-10">Dirty glass with smudges</p>
            </div>
            
            <div 
              className="relative p-6 rounded-lg border border-gray-600/20 overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(4px) contrast(1.1)',
              }}
            >
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `
                    linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.01) 50%, transparent 70%),
                    linear-gradient(-45deg, transparent 30%, rgba(255, 255, 255, 0.01) 50%, transparent 70%)`,
                }}
              />
              <div 
                className="absolute -inset-1 opacity-20"
                style={{
                  background: `
                    radial-gradient(ellipse at top left, rgba(250, 182, 23, 0.15) 0%, transparent 40%),
                    radial-gradient(ellipse at bottom right, rgba(147, 51, 234, 0.1) 0%, transparent 40%),
                    radial-gradient(circle at 30% 60%, rgba(255, 255, 255, 0.05) 0%, transparent 20%),
                    radial-gradient(circle at 70% 40%, rgba(255, 255, 255, 0.05) 0%, transparent 20%)`,
                  filter: 'blur(8px)',
                }}
              />
              <h3 className="text-lg font-bold mb-2 relative z-10">Style K</h3>
              <p className="text-gray-400 relative z-10">Streaked glass texture</p>
            </div>
            
            <div 
              className="relative p-6 rounded-lg overflow-hidden"
              style={{
                background: `
                  linear-gradient(105deg, 
                    rgba(255, 255, 255, 0.01) 0%, 
                    rgba(255, 255, 255, 0.03) 40%, 
                    rgba(255, 255, 255, 0.01) 100%)`,
                backdropFilter: 'blur(3px) brightness(1.05)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div 
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                  backgroundImage: `
                    repeating-linear-gradient(45deg, 
                      transparent, 
                      transparent 35px, 
                      rgba(255, 255, 255, 0.01) 35px, 
                      rgba(255, 255, 255, 0.01) 70px),
                    repeating-linear-gradient(-45deg, 
                      transparent, 
                      transparent 35px, 
                      rgba(255, 255, 255, 0.01) 35px, 
                      rgba(255, 255, 255, 0.01) 70px)`,
                }}
              />
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `
                    radial-gradient(circle at 25% 25%, rgba(250, 182, 23, 0.04) 0%, transparent 25%),
                    radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.03) 0%, transparent 25%),
                    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.01) 0%, transparent 50%)`,
                }}
              />
              <h3 className="text-lg font-bold mb-2 relative z-10">Style L</h3>
              <p className="text-gray-400 relative z-10">Crosshatch dirty glass</p>
            </div>
            
            <div 
              className="relative p-6 rounded-lg overflow-hidden group hover:border-yellow-400/20 transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.01)',
                backdropFilter: 'blur(2px)',
                border: '1px solid rgba(255, 255, 255, 0.03)',
                boxShadow: '0 0 30px rgba(0, 0, 0, 0.3) inset',
              }}
            >
              <div 
                className="absolute inset-0 pointer-events-none opacity-50"
                style={{
                  background: `
                    conic-gradient(from 45deg at 30% 30%, transparent 0deg, rgba(250, 182, 23, 0.03) 90deg, transparent 180deg),
                    conic-gradient(from 225deg at 70% 70%, transparent 0deg, rgba(147, 51, 234, 0.02) 90deg, transparent 180deg),
                    radial-gradient(circle at 50% 50%, transparent 30%, rgba(255, 255, 255, 0.01) 70%, transparent 100%)`,
                  filter: 'blur(4px)',
                }}
              />
              <div 
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E")`,
                }}
              />
              <h3 className="text-lg font-bold mb-2 relative z-10">Style M</h3>
              <p className="text-gray-400 relative z-10">Ultra-thin dirty glass</p>
            </div>
          </div>

          {/* Space-Weathered Glass Series */}
          <h3 className="text-lg font-semibold text-yellow-400 mt-8 mb-4">Space-Weathered Glass Series</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div 
              className="relative p-6 rounded-lg overflow-hidden group"
              style={{
                background: 'rgba(255, 255, 255, 0.005)',
                backdropFilter: 'blur(1px)',
                border: '1px solid rgba(255, 255, 255, 0.015)',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.2) inset',
              }}
            >
              {/* Micro cracks on edges */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                <path d="M0,20 L8,15 L12,22 L18,18" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" fill="none"/>
                <path d="M0,80 L6,82 L10,78 L15,83" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" fill="none"/>
                <path d="M385,10 L380,12 L383,8 L378,6" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" fill="none" transform="translate(-280, 0)"/>
                <path d="M385,90 L382,85 L388,88 L384,92" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" fill="none" transform="translate(-280, 0)"/>
              </svg>
              <div 
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                  background: `
                    radial-gradient(circle at 15% 20%, rgba(250, 182, 23, 0.02) 0%, transparent 20%),
                    radial-gradient(circle at 85% 80%, rgba(147, 51, 234, 0.015) 0%, transparent 20%),
                    radial-gradient(circle at 50% 50%, transparent 30%, rgba(255, 255, 255, 0.005) 70%, transparent 100%)`,
                  filter: 'blur(3px)',
                }}
              />
              <div 
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence baseFrequency='1.5' numOctaves='3' seed='2' /%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noiseFilter)' opacity='0.01'/%3E%3C/svg%3E")`,
                }}
              />
              <h3 className="text-lg font-bold mb-2 relative z-10">Style N</h3>
              <p className="text-gray-400 relative z-10">Ancient space glass</p>
            </div>
            
            <div 
              className="relative p-6 rounded-lg overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.005)',
                backdropFilter: 'blur(1px)',
                border: '1px solid rgba(255, 255, 255, 0.015)',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.2) inset',
              }}
            >
              {/* Dense fractal crack patterns */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                <path d="M5,15 L12,12 L15,18 L22,14 L25,20 L30,16 L35,22" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" fill="none"/>
                <path d="M0,50 L5,48 L8,52 L12,49 L16,53 L20,50" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" fill="none"/>
                <path d="M95,0 L92,5 L96,8 L93,12 L97,15" stroke="rgba(255,255,255,0.13)" strokeWidth="0.3" fill="none" transform="translate(0, 0)"/>
                <path d="M100,95 L98,92 L102,90 L99,88 L103,85 L100,82" stroke="rgba(255,255,255,0.11)" strokeWidth="0.3" fill="none" transform="translate(-5, 0)"/>
                <path d="M2,95 L4,92 L6,94 L8,91 L11,94 L14,91" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" fill="none"/>
                <path d="M40,30 L45,28 L48,32 L52,29 L55,33" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none"/>
                <path d="M60,60 L65,58 L68,62 L72,59" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" fill="none"/>
                <path d="M30,70 L35,68 L38,72 L42,69" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" fill="none"/>
              </svg>
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `
                    linear-gradient(115deg, transparent 40%, rgba(255, 255, 255, 0.003) 50%, transparent 60%),
                    radial-gradient(ellipse at 20% 30%, rgba(59, 130, 246, 0.01) 0%, transparent 30%),
                    radial-gradient(ellipse at 80% 70%, rgba(250, 182, 23, 0.01) 0%, transparent 30%)`,
                }}
              />
              <div 
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  background: `
                    repeating-linear-gradient(90deg, 
                      transparent, 
                      transparent 50px, 
                      rgba(255, 255, 255, 0.002) 50px, 
                      rgba(255, 255, 255, 0.002) 51px)`,
                }}
              />
              <h3 className="text-lg font-bold mb-2 relative z-10">Style O</h3>
              <p className="text-gray-400 relative z-10">Shattered void crystal</p>
            </div>
            
            <div 
              className="relative p-6 rounded-lg overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.005)',
                backdropFilter: 'blur(1px)',
                border: '1px solid rgba(255, 255, 255, 0.015)',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.2) inset',
              }}
            >
              {/* Multiple impact crater cracks */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-35" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15" cy="15" r="8" stroke="rgba(255,255,255,0.08)" strokeWidth="0.4" fill="none"/>
                <path d="M15,15 L10,10 M15,15 L20,12 M15,15 L18,20 M15,15 L12,18 M15,15 L13,11 M15,15 L19,17" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3"/>
                <circle cx="90%" cy="85%" r="6" stroke="rgba(255,255,255,0.07)" strokeWidth="0.3" fill="none"/>
                <path d="M90,85 L87,82 M90,85 L93,83 M90,85 L91,88 M90,85 L88,81" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" transform="translate(210, 175)"/>
                <circle cx="60%" cy="40%" r="10" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" fill="none"/>
                <path d="M60,40 L55,35 M60,40 L65,37 M60,40 L62,45 M60,40 L57,42 M60,40 L58,36 M60,40 L64,43" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" transform="translate(80, 40)"/>
                <circle cx="30%" cy="70%" r="5" stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" fill="none"/>
                <path d="M30,70 L28,68 M30,70 L32,69 M30,70 L31,72" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" transform="translate(50, 140)"/>
              </svg>
              <div 
                className="absolute inset-0 pointer-events-none opacity-50"
                style={{
                  background: `
                    conic-gradient(from 180deg at 25% 25%, transparent 0deg, rgba(250, 182, 23, 0.015) 45deg, transparent 90deg),
                    conic-gradient(from 0deg at 75% 75%, transparent 0deg, rgba(139, 92, 246, 0.01) 45deg, transparent 90deg),
                    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.002) 0%, transparent 60%)`,
                  filter: 'blur(2px)',
                }}
              />
              <div 
                className="absolute inset-0 pointer-events-none opacity-15"
                style={{
                  backgroundImage: `
                    repeating-radial-gradient(circle at 30% 30%, 
                      transparent, 
                      transparent 20px, 
                      rgba(255, 255, 255, 0.003) 20px, 
                      rgba(255, 255, 255, 0.003) 21px)`,
                }}
              />
              <h3 className="text-lg font-bold mb-2 relative z-10">Style P</h3>
              <p className="text-gray-400 relative z-10">Heavy meteor damage</p>
            </div>
            
            <div 
              className="relative p-6 rounded-lg overflow-hidden group hover:border-yellow-400/10 transition-all duration-500"
              style={{
                background: 'rgba(255, 255, 255, 0.005)',
                backdropFilter: 'blur(1px)',
                border: '1px solid rgba(255, 255, 255, 0.015)',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.2) inset',
              }}
            >
              {/* Complex stress fracture network */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" xmlns="http://www.w3.org/2000/svg">
                <path d="M0,30 L3,28 L5,31 L8,29 L11,32 L14,30 L17,33 L20,31" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" fill="none"/>
                <path d="M100,0 L98,3 L101,5 L99,8 L102,10 L100,13" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none" transform="translate(-8, 0)"/>
                <path d="M95,95 L93,93 L96,91 L94,89 L97,87 L95,85" stroke="rgba(255,255,255,0.11)" strokeWidth="0.3" fill="none" transform="translate(0, 0)"/>
                <path d="M0,70 L2,68 L4,71 L6,69 L8,72 L10,70 L12,73" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" fill="none"/>
                <path d="M20,45 L35,42 L40,48 L55,45 L60,50" stroke="rgba(255,255,255,0.08)" strokeWidth="0.2" fill="none"/>
                <path d="M45,20 L50,18 L53,22 L58,19 L62,23" stroke="rgba(255,255,255,0.07)" strokeWidth="0.2" fill="none"/>
                <path d="M10,60 L25,58 L30,62 L45,59 L50,63" stroke="rgba(255,255,255,0.06)" strokeWidth="0.2" fill="none"/>
                {/* Micro debris */}
                <circle cx="20%" cy="40%" r="0.5" fill="rgba(255,255,255,0.03)"/>
                <circle cx="70%" cy="60%" r="0.3" fill="rgba(255,255,255,0.02)"/>
                <circle cx="45%" cy="25%" r="0.4" fill="rgba(255,255,255,0.025)"/>
                <circle cx="85%" cy="45%" r="0.3" fill="rgba(255,255,255,0.02)"/>
                <circle cx="15%" cy="75%" r="0.4" fill="rgba(255,255,255,0.02)"/>
                <circle cx="55%" cy="85%" r="0.3" fill="rgba(255,255,255,0.015)"/>
              </svg>
              <div 
                className="absolute inset-0 pointer-events-none opacity-60"
                style={{
                  background: `
                    radial-gradient(ellipse at 10% 10%, rgba(250, 182, 23, 0.008) 0%, transparent 25%),
                    radial-gradient(ellipse at 90% 90%, rgba(59, 130, 246, 0.006) 0%, transparent 25%),
                    radial-gradient(circle at 50% 50%, transparent 20%, rgba(255, 255, 255, 0.001) 50%, transparent 80%),
                    linear-gradient(135deg, transparent 45%, rgba(255, 255, 255, 0.002) 50%, transparent 55%)`,
                }}
              />
              <div 
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='300' height='300' viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='cosmicNoise'%3E%3CfeTurbulence baseFrequency='2' numOctaves='1' seed='5' /%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23cosmicNoise)' opacity='0.008'/%3E%3C/svg%3E")`,
                }}
              />
              <h3 className="text-lg font-bold mb-2 relative z-10">Style Q</h3>
              <p className="text-gray-400 relative z-10">Extreme fracture network</p>
            </div>
          </div>

          {/* Space Colony Frame */}
          <h3 className="text-lg font-semibold text-yellow-400 mt-8 mb-4">Space Colony Frame</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              className="relative p-6 rounded-lg overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.005)',
                backdropFilter: 'blur(1px)',
                border: '1px solid rgba(255, 255, 255, 0.015)',
                boxShadow: '0 0 25px rgba(0, 0, 0, 0.3) inset',
              }}
            >
              {/* Colony lights on edges - like tiny windows */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Top edge colony lights */}
                <div className="absolute top-0 left-0 w-full h-2 flex items-center justify-between px-2">
                  <div className="w-1 h-1 bg-yellow-400 rounded-full opacity-60 animate-pulse" style={{animationDelay: '0s'}}></div>
                  <div className="w-0.5 h-0.5 bg-blue-400 rounded-full opacity-40"></div>
                  <div className="w-1 h-1 bg-yellow-300 rounded-full opacity-50 animate-pulse" style={{animationDelay: '1s'}}></div>
                  <div className="w-0.5 h-0.5 bg-white rounded-full opacity-30"></div>
                  <div className="w-0.5 h-0.5 bg-yellow-400 rounded-full opacity-40 animate-pulse" style={{animationDelay: '2s'}}></div>
                  <div className="w-1 h-1 bg-orange-400 rounded-full opacity-50"></div>
                  <div className="w-0.5 h-0.5 bg-blue-300 rounded-full opacity-30 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  <div className="w-0.5 h-0.5 bg-yellow-300 rounded-full opacity-40"></div>
                  <div className="w-1 h-1 bg-white rounded-full opacity-60 animate-pulse" style={{animationDelay: '1.5s'}}></div>
                </div>
                
                {/* Bottom edge colony lights */}
                <div className="absolute bottom-0 left-0 w-full h-2 flex items-center justify-between px-3">
                  <div className="w-0.5 h-0.5 bg-blue-400 rounded-full opacity-50 animate-pulse" style={{animationDelay: '1.2s'}}></div>
                  <div className="w-1 h-1 bg-yellow-400 rounded-full opacity-40"></div>
                  <div className="w-0.5 h-0.5 bg-white rounded-full opacity-30 animate-pulse" style={{animationDelay: '0.3s'}}></div>
                  <div className="w-1 h-1 bg-orange-300 rounded-full opacity-60"></div>
                  <div className="w-0.5 h-0.5 bg-yellow-300 rounded-full opacity-40 animate-pulse" style={{animationDelay: '2.1s'}}></div>
                  <div className="w-0.5 h-0.5 bg-blue-400 rounded-full opacity-30"></div>
                  <div className="w-1 h-1 bg-yellow-400 rounded-full opacity-50 animate-pulse" style={{animationDelay: '0.8s'}}></div>
                </div>
                
                {/* Left edge colony lights */}
                <div className="absolute left-0 top-0 w-2 h-full flex flex-col items-center justify-between py-3">
                  <div className="w-1 h-1 bg-yellow-300 rounded-full opacity-50 animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  <div className="w-0.5 h-0.5 bg-white rounded-full opacity-30"></div>
                  <div className="w-0.5 h-0.5 bg-blue-400 rounded-full opacity-40 animate-pulse" style={{animationDelay: '1.8s'}}></div>
                  <div className="w-1 h-1 bg-yellow-400 rounded-full opacity-60"></div>
                  <div className="w-0.5 h-0.5 bg-orange-400 rounded-full opacity-40 animate-pulse" style={{animationDelay: '0.9s'}}></div>
                  <div className="w-0.5 h-0.5 bg-white rounded-full opacity-30"></div>
                </div>
                
                {/* Right edge colony lights */}
                <div className="absolute right-0 top-0 w-2 h-full flex flex-col items-center justify-between py-3">
                  <div className="w-0.5 h-0.5 bg-blue-300 rounded-full opacity-40"></div>
                  <div className="w-1 h-1 bg-yellow-400 rounded-full opacity-50 animate-pulse" style={{animationDelay: '1.3s'}}></div>
                  <div className="w-0.5 h-0.5 bg-white rounded-full opacity-30 animate-pulse" style={{animationDelay: '2.2s'}}></div>
                  <div className="w-0.5 h-0.5 bg-orange-300 rounded-full opacity-40"></div>
                  <div className="w-1 h-1 bg-yellow-300 rounded-full opacity-60 animate-pulse" style={{animationDelay: '0.6s'}}></div>
                  <div className="w-0.5 h-0.5 bg-blue-400 rounded-full opacity-30"></div>
                  <div className="w-0.5 h-0.5 bg-yellow-400 rounded-full opacity-40 animate-pulse" style={{animationDelay: '1.7s'}}></div>
                </div>
              </div>
              
              {/* Glass cracks */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15" xmlns="http://www.w3.org/2000/svg">
                <path d="M10,20 L15,18 L18,22 L23,19" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" fill="none"/>
                <path d="M85,90 L88,87 L91,91 L94,88" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" fill="none"/>
              </svg>
              
              {/* Subtle glow from colony */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                  background: `
                    radial-gradient(circle at 5% 5%, rgba(250, 182, 23, 0.03) 0%, transparent 15%),
                    radial-gradient(circle at 95% 5%, rgba(250, 182, 23, 0.025) 0%, transparent 15%),
                    radial-gradient(circle at 5% 95%, rgba(250, 182, 23, 0.02) 0%, transparent 15%),
                    radial-gradient(circle at 95% 95%, rgba(250, 182, 23, 0.025) 0%, transparent 15%)`,
                }}
              />
              
              <h3 className="text-lg font-bold mb-2 relative z-10">Style R</h3>
              <p className="text-gray-400 relative z-10">Colony viewport glass</p>
            </div>
          </div>

          {/* Realistic Shattered Glass Series */}
          <h3 className="text-lg font-semibold text-yellow-400 mt-8 mb-4">Realistic Shattered Glass Series</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div 
              className="relative p-6 rounded-lg overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.004)',
                backdropFilter: 'blur(0.5px)',
                border: '1px solid rgba(255, 255, 255, 0.02)',
                boxShadow: '0 0 30px rgba(0, 0, 0, 0.4) inset',
              }}
            >
              {/* Tempered glass dicing pattern - small cubic fragments */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
                {/* Irregular cubic fragmentation pattern */}
                <path d="M15,0 L18,25 L14,50 L17,75 L15,100" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" fill="none"/>
                <path d="M30,0 L32,20 L28,45 L31,70 L30,100" stroke="rgba(255,255,255,0.14)" strokeWidth="0.4" fill="none"/>
                <path d="M45,0 L43,30 L47,55 L44,80 L45,100" stroke="rgba(255,255,255,0.16)" strokeWidth="0.4" fill="none"/>
                <path d="M60,0 L62,25 L58,50 L61,75 L60,100" stroke="rgba(255,255,255,0.13)" strokeWidth="0.4" fill="none"/>
                <path d="M75,0 L73,35 L77,60 L74,85 L75,100" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" fill="none"/>
                <path d="M85,0 L87,20 L83,45 L86,70 L85,100" stroke="rgba(255,255,255,0.14)" strokeWidth="0.4" fill="none"/>
                
                {/* Horizontal fractures creating cubic pattern */}
                <path d="M0,15 L25,18 L50,14 L75,17 L100,15" stroke="rgba(255,255,255,0.14)" strokeWidth="0.4" fill="none"/>
                <path d="M0,35 L20,32 L45,36 L70,33 L100,35" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" fill="none"/>
                <path d="M0,55 L30,58 L55,54 L80,57 L100,55" stroke="rgba(255,255,255,0.13)" strokeWidth="0.4" fill="none"/>
                <path d="M0,75 L25,72 L50,76 L75,73 L100,75" stroke="rgba(255,255,255,0.14)" strokeWidth="0.4" fill="none"/>
                <path d="M0,85 L35,87 L65,83 L90,86 L100,85" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" fill="none"/>
                
                {/* Slight angular variations to make it realistic */}
                <path d="M22,25 L38,28" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none"/>
                <path d="M52,42 L68,45" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" fill="none"/>
                <path d="M12,62 L28,65" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" fill="none"/>
                <path d="M42,78 L58,81" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" fill="none"/>
                
                {/* Edge fracture on left side */}
                <path d="M0,40 L-2,42 L0,44" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" fill="none"/>
                <path d="M0,41 L-1,43" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" fill="none"/>
              </svg>
              
              <h3 className="text-lg font-bold mb-2 relative z-10">Style S</h3>
              <p className="text-gray-400 relative z-10">Tempered glass dicing</p>
            </div>
            
            <div 
              className="relative p-6 rounded-lg overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.003)',
                backdropFilter: 'blur(0.3px)',
                border: '1px solid rgba(255, 255, 255, 0.018)',
                boxShadow: '0 0 35px rgba(0, 0, 0, 0.5) inset',
              }}
            >
              {/* Annealed glass - long sharp shards from impact */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-45" xmlns="http://www.w3.org/2000/svg">
                {/* Primary radial cracks - long, straight lines */}
                <path d="M35,40 L0,0" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" fill="none"/>
                <path d="M35,40 L0,85" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" fill="none"/>
                <path d="M35,40 L70,0" stroke="rgba(255,255,255,0.19)" strokeWidth="0.5" fill="none"/>
                <path d="M35,40 L100,15" stroke="rgba(255,255,255,0.17)" strokeWidth="0.4" fill="none"/>
                <path d="M35,40 L100,70" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" fill="none"/>
                <path d="M35,40 L65,100" stroke="rgba(255,255,255,0.16)" strokeWidth="0.4" fill="none"/>
                <path d="M35,40 L10,100" stroke="rgba(255,255,255,0.17)" strokeWidth="0.4" fill="none"/>
                
                {/* Secondary branching cracks */}
                <path d="M20,20 L28,35" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" fill="none"/>
                <path d="M50,15 L45,30" stroke="rgba(255,255,255,0.11)" strokeWidth="0.3" fill="none"/>
                <path d="M60,55 L52,45" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none"/>
                <path d="M25,65 L30,50" stroke="rgba(255,255,255,0.11)" strokeWidth="0.3" fill="none"/>
                
                {/* Mirror-mist-hackle texture near impact */}
                <ellipse cx="35" cy="40" rx="8" ry="6" stroke="rgba(255,255,255,0.08)" strokeWidth="0.2" fill="none" opacity="0.3"/>
                <ellipse cx="35" cy="40" rx="4" ry="3" stroke="rgba(255,255,255,0.1)" strokeWidth="0.2" fill="none" opacity="0.4"/>
                
                {/* Edge damage on top */}
                <path d="M50,0 L48,-2 L52,0" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" fill="none"/>
                <path d="M51,0 L50,-1" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" fill="none"/>
                
                {/* Edge chip on right */}
                <path d="M100,55 L102,57 L100,59" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" fill="none"/>
              </svg>
              
              <h3 className="text-lg font-bold mb-2 relative z-10">Style T</h3>
              <p className="text-gray-400 relative z-10">Annealed glass shards</p>
            </div>
            
            <div 
              className="relative p-6 rounded-lg overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.002)',
                backdropFilter: 'blur(0.2px)',
                border: '1px solid rgba(255, 255, 255, 0.015)',
                boxShadow: '0 0 40px rgba(0, 0, 0, 0.6) inset',
              }}
            >
              {/* Thermal stress breakage - characteristic wavy pattern */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50" xmlns="http://www.w3.org/2000/svg">
                {/* Main thermal stress crack - wavy, meandering line */}
                <path d="M0,30 Q20,25 35,35 T65,40 Q80,45 100,35" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" fill="none"/>
                <path d="M15,0 Q25,20 20,40 T25,70 Q20,85 30,100" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" fill="none"/>
                <path d="M70,0 Q75,15 80,35 T75,65 Q80,80 85,100" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" fill="none"/>
                
                {/* Secondary perpendicular cracks at 90 degrees */}
                <path d="M35,35 L45,15" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" fill="none"/>
                <path d="M35,35 L25,50" stroke="rgba(255,255,255,0.14)" strokeWidth="0.4" fill="none"/>
                <path d="M65,40 L75,25" stroke="rgba(255,255,255,0.13)" strokeWidth="0.4" fill="none"/>
                <path d="M65,40 L55,55" stroke="rgba(255,255,255,0.14)" strokeWidth="0.4" fill="none"/>
                
                {/* Branching pattern */}
                <path d="M20,40 Q30,50 40,48" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none"/>
                <path d="M75,65 Q85,70 90,75" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" fill="none"/>
                
                {/* Edge fracture on bottom */}
                <path d="M35,100 L33,102 L37,100" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" fill="none"/>
                <path d="M36,100 L35,101" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" fill="none"/>
                
                {/* Small edge chip on left */}
                <path d="M0,65 L-2,67 L0,69" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" fill="none"/>
              </svg>
              
              <h3 className="text-lg font-bold mb-2 relative z-10">Style U</h3>
              <p className="text-gray-400 relative z-10">Thermal stress pattern</p>
            </div>
            
            <div 
              className="relative p-6 rounded-lg overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.001)',
                backdropFilter: 'blur(0.1px)',
                border: '1px solid rgba(255, 255, 255, 0.012)',
                boxShadow: '0 0 45px rgba(0, 0, 0, 0.7) inset',
              }}
            >
              {/* Heat-strengthened glass - branching pattern */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-55" xmlns="http://www.w3.org/2000/svg">
                {/* Main trunk cracks */}
                <path d="M10,50 L30,45 L50,48 L70,44 L90,46" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" fill="none"/>
                <path d="M40,10 L42,30 L38,50 L41,70 L39,90" stroke="rgba(255,255,255,0.23)" strokeWidth="0.6" fill="none"/>
                <path d="M60,5 L62,25 L58,45 L61,65 L59,85 L60,100" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" fill="none"/>
                
                {/* Branching cracks */}
                <path d="M30,45 L25,30" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" fill="none"/>
                <path d="M30,45 L35,60" stroke="rgba(255,255,255,0.17)" strokeWidth="0.4" fill="none"/>
                <path d="M50,48 L45,35" stroke="rgba(255,255,255,0.16)" strokeWidth="0.4" fill="none"/>
                <path d="M50,48 L55,65" stroke="rgba(255,255,255,0.17)" strokeWidth="0.4" fill="none"/>
                <path d="M70,44 L65,25" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" fill="none"/>
                <path d="M70,44 L75,60" stroke="rgba(255,255,255,0.16)" strokeWidth="0.4" fill="none"/>
                
                {/* Secondary branches */}
                <path d="M25,30 L20,20" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" fill="none"/>
                <path d="M25,30 L15,35" stroke="rgba(255,255,255,0.11)" strokeWidth="0.3" fill="none"/>
                <path d="M35,60 L30,70" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none"/>
                <path d="M35,60 L45,65" stroke="rgba(255,255,255,0.11)" strokeWidth="0.3" fill="none"/>
                <path d="M45,35 L40,25" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none"/>
                <path d="M55,65 L50,75" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" fill="none"/>
                <path d="M55,65 L65,70" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none"/>
                <path d="M65,25 L60,15" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" fill="none"/>
                <path d="M75,60 L80,70" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" fill="none"/>
                <path d="M75,60 L85,55" stroke="rgba(255,255,255,0.09)" strokeWidth="0.3" fill="none"/>
                
                {/* Multiple edge fractures */}
                <path d="M0,25 L-2,27 L0,29" stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" fill="none"/>
                <path d="M100,40 L102,42 L100,44" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" fill="none"/>
                <path d="M70,0 L68,-2 L72,0" stroke="rgba(255,255,255,0.19)" strokeWidth="0.4" fill="none"/>
                <path d="M20,100 L18,102 L22,100" stroke="rgba(255,255,255,0.17)" strokeWidth="0.4" fill="none"/>
                <path d="M100,75 L102,77 L100,79" stroke="rgba(255,255,255,0.16)" strokeWidth="0.3" fill="none"/>
              </svg>
              
              <h3 className="text-lg font-bold mb-2 relative z-10">Style V</h3>
              <p className="text-gray-400 relative z-10">Heat-strengthened branching</p>
            </div>
          </div>
        </section>

        {/* Progress Bars Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Progress Indicators</h2>
          
          <Card padding="lg">
            <div className="space-y-6">
              <ProgressBar value={75} max={100} color="yellow" label="Gold Progress" showValue />
              <ProgressBar value={45} max={100} color="green" label="Essence Collection" showValue />
              <ProgressBar value={90} max={100} color="red" height="lg" animated />
              <ProgressBar value={60} max={100} color="blue" height="sm" />
              
              <div className="pt-4">
                <p className="text-gray-400 mb-2">LED Indicators:</p>
                <div className="space-y-3">
                  <LEDIndicator value={7} max={10} color="yellow" />
                  <LEDIndicator value={5} max={10} color="green" size="lg" />
                  <LEDIndicator value={3} max={10} color="red" size="sm" ledCount={15} />
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setProgressValue(Math.max(0, progressValue - 10))}
                >
                  -10
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setProgressValue(Math.min(100, progressValue + 10))}
                >
                  +10
                </Button>
              </div>
              <ProgressBar value={progressValue} max={100} color="purple" label="Interactive Progress" showValue animated />
            </div>
          </Card>
        </section>

        {/* Text Effects Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Text Effects</h2>
          
          <Card padding="lg">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Style A</p>
                  <GlowText color="yellow">Yellow Glow</GlowText>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Style B</p>
                  <GlowText color="green" intensity="high">High Intensity</GlowText>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Style C</p>
                  <GlowText color="blue" size="xl">Extra Large</GlowText>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Style D</p>
                  <GlowText color="red" animate>Animated</GlowText>
                </div>
              </div>
              
              <div className="pt-4">
                <p className="text-xs text-gray-500 mb-1">Style E - Large Counter</p>
                <GlowCounter value={1234567} prefix="$" color="yellow" size="lg" />
              </div>
              
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Style F</p>
                  <GlowCounter value={42} suffix=" Meks" color="green" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Style G</p>
                  <GlowCounter value={0.115} decimals={3} suffix="/day" color="blue" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Style H</p>
                  <GlowCounter value={999999999} color="red" animate />
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Stats Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Statistics</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Stat label="Basic Stat" value="42" />
              <Stat label="With Trend" value="1.2K" trend="up" trendValue="+15%" color="green" />
              <Stat label="Large Stat" value="999" size="lg" color="blue" />
            </div>
            
            <StatGroup stats={sampleStats} columns={3} />
            
            <StatCard
              label="Advanced Stat Card"
              value="$10,000"
              trend="up"
              trendValue="+25%"
              color="yellow"
              description="This is a stat card with description and action"
              action={<Button size="sm" variant="ghost">View Details</Button>}
            />
          </div>
        </section>

        {/* Search Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Search Components</h2>
          
          <Card padding="lg">
            <div className="space-y-6">
              <SearchBar
                value={searchValue}
                onChange={setSearchValue}
                placeholder="Search with suggestions..."
                suggestions={['Gold', 'Essence', 'Meks', 'Crafting', 'Inventory']}
                showSuggestions
                onSearch={(val) => alert(`Searching for: ${val}`)}
              />
              
              <SearchBar
                value=""
                onChange={() => {}}
                placeholder="Basic search bar"
                icon={<span>🔍</span>}
              />
              
              <div className="max-w-xs">
                <InlineSearch
                  value={inlineSearchValue}
                  onChange={setInlineSearchValue}
                  placeholder="Inline filter..."
                />
              </div>
            </div>
          </Card>
        </section>

        {/* Modals Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Modals</h2>
          
          <Card padding="lg">
            <div className="flex gap-4">
              <Button onClick={() => setShowModal(true)}>
                Open Modal
              </Button>
              <Button variant="ghost" onClick={() => setShowIndustrialModal(true)}>
                Industrial Modal
              </Button>
            </div>
          </Card>
        </section>

        {/* Typography Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Typography & Fonts</h2>
          
          <Card padding="lg">
            <div className="space-y-6">
              <div>
                <p className="text-gray-400 mb-3">Style A - Monospace (Preferred for labels/stats):</p>
                <div className="text-2xl text-yellow-400" style={{ fontFamily: "'Consolas', 'Courier New', monospace", letterSpacing: '0.1em' }}>
                  Consolas Font Display
                </div>
                <div className="text-lg text-gray-300 mt-2" style={{ fontFamily: "'Consolas', 'Courier New', monospace", textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                  Earnings to Collect
                </div>
              </div>
              
              <div>
                <p className="text-gray-400 mb-3">Style B - Large Numbers (Shop Balance Style):</p>
                <div className="gold-display-large">
                  1,234,567
                </div>
                <div className="text-sm text-gray-500 mt-2">Ultra-light weight for large numbers</div>
              </div>
              
              <div>
                <p className="text-gray-400 mb-3">Style C - Headers (Orbitron - Preferred for HUB titles):</p>
                <div className="text-2xl text-yellow-400" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: '0.1em' }}>
                  ORBITRON HEADER DISPLAY
                </div>
                <div className="text-lg text-gray-300 mt-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  Used for major section titles
                </div>
              </div>
              
              <div>
                <p className="text-gray-400 mb-3">Style D & E - Alternative Headers:</p>
                <div className="text-2xl text-yellow-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                  Style D: Rajdhani Header Display
                </div>
                <div className="text-xl text-gray-300 mt-2" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
                  STYLE E: BEBAS NEUE ALTERNATIVE
                </div>
              </div>
              
              <div>
                <p className="text-gray-400 mb-3">Style F - Body Text (Light Weight):</p>
                <div className="text-base" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", fontWeight: 300 }}>
                  This is lighter body text using Inter or Segoe UI with reduced font weight for a more refined appearance in longer paragraphs.
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Effects Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Special Effects</h2>
          
          <Card padding="lg">
            <div className="space-y-8">
              <div>
                <p className="text-gray-400 mb-4">Multicolor Spinning Glow (from Crafting):</p>
                <div className="relative flex items-center justify-center h-64">
                  <div 
                    className="absolute rounded-full"
                    style={{
                      width: '200px',
                      height: '200px',
                      background: `
                        conic-gradient(from 0deg at 50% 50%,
                          rgba(250, 182, 23, 0.4) 0deg,
                          rgba(236, 72, 153, 0.3) 60deg,
                          rgba(147, 51, 234, 0.3) 120deg,
                          rgba(59, 130, 246, 0.3) 180deg,
                          rgba(147, 51, 234, 0.3) 240deg,
                          rgba(236, 72, 153, 0.3) 300deg,
                          rgba(250, 182, 23, 0.4) 360deg
                        )`,
                      filter: 'blur(30px)',
                      animation: 'spinGlow 10s linear infinite',
                    }}
                  />
                  <div className="relative w-32 h-32 bg-gray-900 rounded-full border-2 border-yellow-400/50 flex items-center justify-center">
                    <span className="text-yellow-400 font-bold">GLOW</span>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-gray-400 mb-4">Ultra Crazy Hover & Click Effects:</p>
                <div className="flex justify-center">
                  <button 
                    className="ultra-crazy-button"
                    onClick={(e) => {
                      const btn = e.currentTarget;
                      btn.classList.add('ultra-clicked');
                      setTimeout(() => btn.classList.remove('ultra-clicked'), 800);
                    }}
                  >
                    <div className="ultra-texture"></div>
                    <div className="ultra-gleam"></div>
                    <span className="ultra-text">ULTRA BUTTON</span>
                    <div className="ultra-particles">
                      {typeof window !== 'undefined' && [...Array(20)].map((_, i) => {
                        const angle = (360 / 20) * i;
                        const radian = (angle * Math.PI) / 180;
                        return (
                          <div
                            key={i}
                            className="edge-particle"
                            style={{
                              '--angle': `${angle}deg`,
                              '--tx': `${Math.cos(radian) * 150}px`,
                              '--ty': `${Math.sin(radian) * 150}px`,
                              animationDelay: `${i * 0.05}s`
                            } as React.CSSProperties}
                          />
                        );
                      })}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Color Palette */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Color Palette</h2>
          
          <Card padding="lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-full h-20 bg-yellow-400 rounded-lg mb-2"></div>
                <p className="text-sm">Primary Yellow</p>
                <p className="text-xs text-gray-500">#FAB617</p>
              </div>
              <div className="text-center">
                <div className="w-full h-20 bg-green-400 rounded-lg mb-2"></div>
                <p className="text-sm">Success Green</p>
                <p className="text-xs text-gray-500">#4ADE80</p>
              </div>
              <div className="text-center">
                <div className="w-full h-20 bg-blue-400 rounded-lg mb-2"></div>
                <p className="text-sm">Info Blue</p>
                <p className="text-xs text-gray-500">#60A5FA</p>
              </div>
              <div className="text-center">
                <div className="w-full h-20 bg-red-400 rounded-lg mb-2"></div>
                <p className="text-sm">Danger Red</p>
                <p className="text-xs text-gray-500">#F87171</p>
              </div>
            </div>
          </Card>
        </section>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Example Modal"
        size="md"
      >
        <p className="text-gray-300 mb-4">
          This is a standard modal with customizable size and content.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="ghost">
            Secondary Action
          </Button>
        </div>
      </Modal>

      <IndustrialModal
        isOpen={showIndustrialModal}
        onClose={() => setShowIndustrialModal(false)}
        title="Industrial Modal"
        size="lg"
        showWarningStripes
      >
        <p className="text-gray-300 mb-4">
          This modal has an industrial theme with optional warning stripes.
        </p>
        <Card className="mb-4">
          <p>Content can include other components</p>
        </Card>
        <Button fullWidth onClick={() => setShowIndustrialModal(false)}>
          Close Industrial Modal
        </Button>
      </IndustrialModal>
      </div>
    </div>
  );
}