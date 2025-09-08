'use client';

import { useState, useEffect, useRef } from 'react';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import theme from '@/lib/design-system';

interface ChipTier {
  tier: number;
  name: string;
  unlocked: boolean;
  color: string;
  glowColor: string;
  borderColor: string;
  description: string;
  requiredLevel: number;
  particleColor: string;
  energySignature: string;
}

interface RecipeRequirement {
  name: string;
  type: 'gold' | 'essence' | 'other';
  amount: number;
  current: number;
  icon?: string;
  image?: string;
  essenceType?: string;
}

interface DailyRecipe {
  id: string;
  tier: number;
  recipeIndex: number;
  recipeName: string;
  rarityBiasBonus: number;
  requirements: RecipeRequirement[];
  expiresAt: Date;
}

export default function UniChipsPage() {
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [selectedRecipe, setSelectedRecipe] = useState<DailyRecipe | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [hoveredTier, setHoveredTier] = useState<number | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Define all 10 chip tiers with industrial styling and quantum properties
  const chipTiers: ChipTier[] = [
    { tier: 1, name: 'T1', unlocked: true, color: '#1a1a1a', glowColor: 'rgba(250, 182, 23, 0.4)', borderColor: '#fab617', description: 'Basic Quantum Core - Entry Level Manufacturing', requiredLevel: 1, particleColor: '#fab617', energySignature: 'STABLE' },
    { tier: 2, name: 'T2', unlocked: false, color: '#0d2818', glowColor: 'rgba(34, 197, 94, 0.4)', borderColor: '#22c55e', description: 'Enhanced Processing Unit - Level 10 Clearance', requiredLevel: 10, particleColor: '#22c55e', energySignature: 'ENHANCED' },
    { tier: 3, name: 'T3', unlocked: false, color: '#1e3a5f', glowColor: 'rgba(59, 130, 246, 0.4)', borderColor: '#3b82f6', description: 'Advanced Quantum Matrix - Level 20 Clearance', requiredLevel: 20, particleColor: '#3b82f6', energySignature: 'ADVANCED' },
    { tier: 4, name: 'T4', unlocked: false, color: '#4c1d95', glowColor: 'rgba(139, 92, 246, 0.4)', borderColor: '#8b5cf6', description: 'Rare Element Integration - Level 30 Clearance', requiredLevel: 30, particleColor: '#8b5cf6', energySignature: 'VOLATILE' },
    { tier: 5, name: 'T5', unlocked: false, color: '#831843', glowColor: 'rgba(236, 72, 153, 0.4)', borderColor: '#ec4899', description: 'Epic Quantum Resonance - Level 40 Clearance', requiredLevel: 40, particleColor: '#ec4899', energySignature: 'RESONANT' },
    { tier: 6, name: 'T6', unlocked: false, color: '#7c2d12', glowColor: 'rgba(251, 146, 60, 0.4)', borderColor: '#fb923c', description: 'Legendary Fusion Core - Level 50 Clearance', requiredLevel: 50, particleColor: '#fb923c', energySignature: 'FUSION' },
    { tier: 7, name: 'T7', unlocked: false, color: '#713f12', glowColor: 'rgba(250, 204, 21, 0.4)', borderColor: '#facc15', description: 'Mythic Energy Conduit - Level 60 Clearance', requiredLevel: 60, particleColor: '#facc15', energySignature: 'MYTHIC' },
    { tier: 8, name: 'T8', unlocked: false, color: '#14532d', glowColor: 'rgba(74, 222, 128, 0.5)', borderColor: '#4ade80', description: 'Divine Quantum State - Level 70 Clearance', requiredLevel: 70, particleColor: '#4ade80', energySignature: 'DIVINE' },
    { tier: 9, name: 'T9', unlocked: false, color: '#1e1b4b', glowColor: 'rgba(165, 180, 252, 0.5)', borderColor: '#a5b4fc', description: 'Cosmic Entanglement Core - Level 80 Clearance', requiredLevel: 80, particleColor: '#a5b4fc', energySignature: 'COSMIC' },
    { tier: 10, name: 'T10', unlocked: false, color: '#701a75', glowColor: 'rgba(240, 171, 252, 0.6)', borderColor: '#f0abfc', description: 'Infinite Quantum Singularity - Level 100 Clearance', requiredLevel: 100, particleColor: '#f0abfc', energySignature: 'INFINITE' },
  ];

  // Generate daily recipes with requirements
  const getDailyRecipes = (tier: number): DailyRecipe[] => {
    const baseDate = new Date();
    baseDate.setHours(24, 0, 0, 0); // Tomorrow at midnight
    
    return [
      {
        id: `recipe-${tier}-1`,
        tier,
        recipeIndex: 1,
        recipeName: 'Standard Formula',
        rarityBiasBonus: 0,
        requirements: [
          { name: 'Gold', type: 'gold', amount: 1000 * tier, current: 1000 * tier, icon: '🪙' },
          { name: 'Accordion Essence', type: 'essence', amount: 0.5 * tier, current: 0.5, essenceType: 'accordion', image: '/essence-images/bumblebee 1.png' },
        ],
        expiresAt: baseDate,
      },
      {
        id: `recipe-${tier}-2`,
        tier,
        recipeIndex: 2,
        recipeName: 'Enhanced Formula',
        rarityBiasBonus: 15,
        requirements: [
          { name: 'Gold', type: 'gold', amount: 2500 * tier, current: 2500 * tier, icon: '🪙' },
          { name: 'Drill Essence', type: 'essence', amount: 0.8 * tier, current: 0.3, essenceType: 'drill', image: '/essence-images/bumblebee 3.png' },
          { name: 'Acid Essence', type: 'essence', amount: 0.3 * tier, current: 0, essenceType: 'acid', image: '/essence-images/bumblebee 1.png' },
        ],
        expiresAt: baseDate,
      },
      {
        id: `recipe-${tier}-3`,
        tier,
        recipeIndex: 3,
        recipeName: 'Premium Formula',
        rarityBiasBonus: 35,
        requirements: [
          { name: 'Gold', type: 'gold', amount: 10000 * tier, current: 8000 * tier, icon: '🪙' },
          { name: 'Gummy Essence', type: 'essence', amount: 2.8 * tier, current: 0.3, essenceType: 'gummy', image: '/essence-images/bumblebee 2.png' },
          { name: 'Bowling Essence', type: 'essence', amount: 4.1 * tier, current: 0, essenceType: 'bowling', image: '/essence-images/bumblebee 3.png' },
          { name: 'Crystal Essence', type: 'essence', amount: 1.5 * tier, current: 0.2, essenceType: 'crystal', image: '/essence-images/bumblebee 1.png' },
        ],
        expiresAt: baseDate,
      },
    ];
  };

  const dailyRecipes = getDailyRecipes(selectedTier);

  const handleTierSelect = (tier: number) => {
    const chipTier = chipTiers.find(t => t.tier === tier);
    if (chipTier?.unlocked) {
      setSelectedTier(tier);
      setSelectedRecipe(null);
    }
  };

  const handleMouseEnter = (tier: number, event: React.MouseEvent) => {
    const chipTier = chipTiers.find(t => t.tier === tier);
    if (!chipTier?.unlocked) {
      setHoveredTier(tier);
      setShowTooltip(true);
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredTier(null);
    setShowTooltip(false);
  };

  const getTimeRemaining = (expiresAt: Date) => {
    const remaining = Math.max(0, expiresAt.getTime() - currentTime);
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const canCraft = (recipe: DailyRecipe) => {
    return recipe.requirements.every(req => req.current >= req.amount);
  };

  const getChipGlow = (tier: ChipTier, isHovered: boolean = false) => {
    if (!tier.unlocked) {
      return `
        drop-shadow(0 0 5px rgba(0,0,0,0.8))
        brightness(0.3)
        contrast(1.2)
        saturate(0.2)
      `;
    }
    
    const baseIntensity = selectedTier === tier.tier ? 1.5 : (isHovered ? 1.2 : 1);
    const glowSize = selectedTier === tier.tier ? 40 : (isHovered ? 30 : 20);
    
    return `
      drop-shadow(0 0 ${glowSize}px ${tier.glowColor})
      drop-shadow(0 0 ${glowSize * 2}px ${tier.glowColor})
      drop-shadow(0 0 ${glowSize * 3}px ${tier.glowColor})
      brightness(${baseIntensity})
      contrast(1.1)
    `;
  };

  // Particle effect generation with stable random values
  const ParticleField = ({ color, count = 30 }: { color: string; count?: number }) => {
    const [particles, setParticles] = useState<Array<{
      left: number;
      top: number;
      delay: number;
      duration: number;
      opacity: number;
    }>>([]);

    useEffect(() => {
      // Generate particles on client side only
      const newParticles = Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 10 + Math.random() * 20,
        opacity: Math.random() * 0.6 + 0.4,
      }));
      setParticles(newParticles);
    }, [count]);

    if (particles.length === 0) {
      // Return empty during SSR and initial render
      return <div className="absolute inset-0 overflow-hidden pointer-events-none" />;
    }

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full animate-float-particle"
            style={{
              background: color,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              opacity: particle.opacity,
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden">

      <Navigation />
      
      <div className="container mx-auto px-4 pt-32 pb-20 relative">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Industrial Header with Cinematic Effects */}
          <div className="mb-16 relative">
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent blur-3xl" />
            
            {/* Main header container with industrial styling */}
            <div className="relative mek-card-industrial mek-border-sharp-gold p-8 overflow-hidden">
              {/* Animated corner indicators */}
              <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-yellow-400/60" />
              <div className="absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4 border-yellow-400/60" />
              <div className="absolute bottom-0 left-0 w-20 h-20 border-b-4 border-l-4 border-yellow-400/60" />
              <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 border-yellow-400/60" />
              
              {/* Scan line overlay */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent animate-scan" />
              </div>
              
              {/* Grunge texture overlay */}
              <div className="absolute inset-0 opacity-20 mek-overlay-scratches pointer-events-none" />
              
              <div className="flex justify-between items-start relative">
                <div className="flex-1">
                  
                  <h1 className="text-5xl font-black mb-3 mek-text-industrial" 
                      style={{ 
                        background: 'linear-gradient(135deg, #fab617 0%, #ffd700 50%, #fab617 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 30px rgba(250,182,23,0.5))',
                        letterSpacing: '4px'
                      }}>
                    UNIVERSAL CHIP FOUNDRY
                  </h1>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 uppercase tracking-wider">PRODUCTION TIER</span>
                      <span className="text-2xl font-bold text-yellow-400 font-mono">T{selectedTier}</span>
                    </div>
                    <div className="h-6 w-px bg-gray-700" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 uppercase tracking-wider">ENERGY SIGNATURE</span>
                      <span className="text-sm font-bold text-cyan-400">{chipTiers.find(t => t.tier === selectedTier)?.energySignature}</span>
                    </div>
                  </div>
                </div>
                
                {/* System timer with industrial frame */}
                <div className="text-right">
                  <div className="bg-black/60 border border-yellow-500/30 p-4 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase tracking-[0.3em] mb-2 font-bold">RECIPE RESET</div>
                    <div className="text-3xl font-mono font-bold" style={{ 
                      color: '#fab617',
                      textShadow: '0 0 20px rgba(250,204,21,0.5)' 
                    }}>
                      {getTimeRemaining(dailyRecipes[0].expiresAt)}
                    </div>
                    <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 animate-pulse" style={{
                        width: typeof window !== 'undefined' 
                          ? `${((24 * 60 * 60 * 1000 - (dailyRecipes[0].expiresAt.getTime() - currentTime)) / (24 * 60 * 60 * 1000)) * 100}%`
                          : '0%'
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Chip Tier Selection with Floating Animation */}
          <div className="mb-16">
            {/* Section header with industrial styling */}
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
              <h2 className="text-sm font-bold text-yellow-500/70 uppercase tracking-[0.4em] px-4">
                QUANTUM CHIP SELECTION
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
            </div>
            
            {/* Chip grid with cinematic effects */}
            <div className="grid grid-cols-5 gap-8 max-w-6xl mx-auto">
              {chipTiers.map((tier, index) => {
                const isLocked = !tier.unlocked;
                const isSelected = selectedTier === tier.tier;
                const [isHovered, setIsHovered] = useState(false);
                
                return (
                  <div
                    key={tier.tier}
                    className="relative"
                    onMouseEnter={(e) => {
                      setIsHovered(true);
                      handleMouseEnter(tier.tier, e);
                    }}
                    onMouseLeave={() => {
                      setIsHovered(false);
                      handleMouseLeave();
                    }}
                  >
                    {/* Energy field effect for selected chip */}
                    {isSelected && (
                      <div className="absolute inset-0 -m-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent blur-xl animate-pulse" />
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleTierSelect(tier.tier)}
                      disabled={isLocked}
                      className={`relative transition-all duration-500 transform-gpu ${
                        isLocked 
                          ? 'cursor-not-allowed scale-90 hover:scale-95' 
                          : isSelected
                            ? 'scale-110 -translate-y-4'
                            : 'hover:scale-110 hover:-translate-y-3'
                      }`}
                      style={{
                        animation: !isLocked ? `float-chip ${3 + index * 0.5}s ease-in-out infinite` : 'none',
                        animationDelay: `${index * 0.2}s`
                      }}
                    >
                      {/* Chip container with quantum effects */}
                      <div className="relative w-36 h-36 flex items-center justify-center">
                        {/* Quantum energy ring (for unlocked chips) */}
                        {!isLocked && (
                          <div 
                            className="absolute inset-0 rounded-full opacity-60"
                            style={{
                              background: `radial-gradient(circle, transparent 30%, ${tier.glowColor} 70%, transparent 100%)`,
                              animation: 'rotate-slow 20s linear infinite',
                            }}
                          />
                        )}
                        
                        {/* Chip image with advanced glow effects */}
                        <div className="relative">
                          <Image
                            src={`/chip-images/uni-chips/uni chips blank 200px webp/${tier.tier} blank.webp`}
                            alt={`Tier ${tier.tier} Universal Chip`}
                            width={140}
                            height={140}
                            className="object-contain transition-all duration-500"
                            style={{
                              filter: getChipGlow(tier, isHovered),
                              transform: isHovered && !isLocked ? 'rotateY(10deg) rotateX(-10deg)' : 'rotateY(0) rotateX(0)',
                            }}
                          />
                          
                          {/* Holographic overlay for unlocked chips */}
                          {!isLocked && (
                            <div 
                              className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen"
                              style={{
                                background: `linear-gradient(135deg, transparent 30%, ${tier.borderColor}40 50%, transparent 70%)`,
                                animation: 'shimmer 3s ease-in-out infinite',
                              }}
                            />
                          )}
                        </div>
                        
                        {/* Industrial tier badge */}
                        <div className={`absolute -bottom-2 -right-2 px-3 py-1.5 font-bold text-xs uppercase tracking-wider ${
                          isLocked 
                            ? 'bg-gray-900/90 text-gray-500 border border-gray-700' 
                            : isSelected
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-lg shadow-yellow-500/30'
                              : 'bg-black/80 text-yellow-400 border border-yellow-500/50'
                        }`}
                        style={{
                          clipPath: theme.clipPaths.cornerCut,
                        }}>
                          T{tier.tier}
                        </div>
                        
                        {/* Lock overlay with industrial styling */}
                        {isLocked && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black/80 border-2 border-red-900/50 rounded-lg p-4 backdrop-blur-sm">
                              <div className="text-red-500 text-3xl mb-1">⚠</div>
                              <div className="text-xs text-red-400 font-bold">LOCKED</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                    
                    {/* Enhanced tier info below chip */}
                    <div className="text-center mt-4 space-y-1">
                      <div className={`font-bold text-sm uppercase tracking-wider ${
                        isLocked ? 'text-gray-600' : isSelected ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        {tier.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enhanced Industrial Tooltip */}
          {showTooltip && hoveredTier && (
            <div 
              className="fixed z-50 pointer-events-none"
              style={{
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y}px`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <div className="relative">
                {/* Tooltip glow effect */}
                <div className="absolute inset-0 bg-red-500/20 blur-xl" />
                
                {/* Main tooltip body */}
                <div className="relative bg-gradient-to-b from-gray-900 to-black border-2 border-red-500/50 px-5 py-4 shadow-2xl backdrop-blur-sm mb-2"
                  style={{
                    clipPath: theme.clipPaths.cornerCut,
                  }}>
                  {/* Warning indicator */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <div className="text-red-400 font-bold text-sm uppercase tracking-wider">ACCESS DENIED</div>
                  </div>
                  
                  {/* Description */}
                  <div className="text-gray-300 text-sm mb-2">
                    {chipTiers.find(t => t.tier === hoveredTier)?.description}
                  </div>
                  
                  {/* Unlock requirement */}
                  <div className="pt-2 border-t border-gray-800">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">REQUIREMENT</div>
                    <div className="text-yellow-400 font-bold">
                      REACH LEVEL {chipTiers.find(t => t.tier === hoveredTier)?.requiredLevel}
                    </div>
                  </div>
                </div>
                
                {/* Arrow pointer */}
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-black mx-auto" />
              </div>
            </div>
          )}

          {/* Enhanced Recipe Cards Section */}
          <div className="mt-16">
            {/* Section header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
              <h2 className="text-sm font-bold text-cyan-400/70 uppercase tracking-[0.4em] px-4">
                DAILY PRODUCTION FORMULAS
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            </div>
            
            {/* Premium Recipe Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {dailyRecipes.map((recipe, index) => {
                const isSelected = selectedRecipe?.id === recipe.id;
                const craftable = canCraft(recipe);
                const rarityGradient = recipe.rarityBiasBonus > 30 
                  ? 'from-purple-600 via-pink-600 to-purple-600' 
                  : recipe.rarityBiasBonus > 0 
                    ? 'from-blue-600 via-cyan-500 to-blue-600'
                    : 'from-gray-700 via-gray-600 to-gray-700';
                
                return (
                  <div
                    key={recipe.id}
                    className={`relative transition-all duration-500 transform-gpu ${
                      isSelected 
                        ? 'scale-105 z-20' 
                        : 'hover:scale-102'
                    }`}
                    style={{
                      animation: `float-card ${4 + index}s ease-in-out infinite`,
                      animationDelay: `${index * 0.3}s`
                    }}
                  >
                    {/* Quantum energy field for selected card */}
                    {isSelected && (
                      <div className="absolute inset-0 -m-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 via-orange-500/30 to-yellow-500/30 blur-2xl animate-pulse" />
                      </div>
                    )}
                    
                    {/* Main card with industrial design */}
                    <div className={`relative mek-card-industrial overflow-hidden border-2 ${
                      isSelected 
                        ? 'border-yellow-400/80 shadow-[0_0_40px_rgba(250,204,21,0.4)]' 
                        : craftable
                          ? 'border-gray-700/70 hover:border-yellow-500/50'
                          : 'border-gray-800/50'
                    }`}>
                      {/* Rarity gradient bar at top */}
                      <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${rarityGradient}`} />
                      
                      {/* Scan line effect */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-white/50 to-transparent animate-scan" 
                          style={{ animationDelay: `${index * 0.5}s` }} />
                      </div>
                      
                      {/* Industrial texture overlay */}
                      <div className="absolute inset-0 opacity-10 mek-overlay-metal-texture pointer-events-none" />
                      
                      {/* Card content */}
                      <div className="relative p-6">
                        {/* Recipe Header with quantum indicators */}
                        <div className="mb-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`w-2 h-2 rounded-full animate-pulse ${
                                  craftable ? 'bg-green-400' : 'bg-red-400'
                                }`} />
                                <span className="text-xs text-gray-500 uppercase tracking-[0.2em] font-bold">
                                  FORMULA #{recipe.recipeIndex}
                                </span>
                              </div>
                              <h3 className="text-2xl font-black mek-text-industrial" style={{ 
                                color: '#fab617',
                                textShadow: '0 0 20px rgba(250,182,23,0.3)' 
                              }}>
                                {recipe.recipeName.toUpperCase()}
                              </h3>
                            </div>
                            
                            {/* Rarity bias indicator */}
                            <div className="text-right">
                              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">BIAS</div>
                              <div className={`text-3xl font-black ${
                                recipe.rarityBiasBonus > 30 ? 'text-purple-400' : 
                                recipe.rarityBiasBonus > 0 ? 'text-cyan-400' : 
                                'text-gray-600'
                              }`} style={{
                                textShadow: recipe.rarityBiasBonus > 0 
                                  ? `0 0 15px ${recipe.rarityBiasBonus > 30 ? 'rgba(168,85,247,0.5)' : 'rgba(34,211,238,0.5)'}` 
                                  : 'none'
                              }}>
                                {recipe.rarityBiasBonus > 0 ? `+${recipe.rarityBiasBonus}%` : '0%'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Enhanced Requirements Display */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-700" />
                            <span className="text-xs text-gray-500 uppercase tracking-[0.3em] font-bold px-2">
                              REQUIRED RESOURCES
                            </span>
                            <div className="h-px flex-1 bg-gradient-to-r from-gray-700 to-transparent" />
                          </div>
                          
                          {recipe.requirements.map((req, idx) => {
                            const isMet = req.current >= req.amount;
                            const progress = Math.min(100, (req.current / req.amount) * 100);
                            
                            return (
                              <div key={idx} className="relative group">
                                <div className="flex items-center gap-3">
                                  {/* Status indicator with glow */}
                                  <div className={`relative w-10 h-10 flex items-center justify-center ${
                                    isMet 
                                      ? 'bg-gradient-to-br from-green-900/30 to-green-950/30 border border-green-500/50' 
                                      : 'bg-gradient-to-br from-red-900/30 to-red-950/30 border border-red-500/50'
                                  }`}
                                  style={{
                                    clipPath: theme.clipPaths.cornerCut,
                                    boxShadow: isMet 
                                      ? '0 0 10px rgba(34,197,94,0.3)' 
                                      : '0 0 10px rgba(239,68,68,0.3)'
                                  }}>
                                    {req.type === 'gold' ? (
                                      <span className="text-yellow-400 text-lg">⬢</span>
                                    ) : req.type === 'essence' ? (
                                      <span className="text-purple-400 text-lg">◈</span>
                                    ) : (
                                      <span className={isMet ? 'text-green-400' : 'text-red-400'}>
                                        {isMet ? '✓' : '✗'}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1.5">
                                      <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                                        {req.name}
                                      </span>
                                      <span className={`text-sm font-mono font-bold ${
                                        isMet ? 'text-green-400' : progress > 50 ? 'text-yellow-400' : 'text-red-400'
                                      }`}>
                                        {req.current.toLocaleString()} / {req.amount.toLocaleString()}
                                      </span>
                                    </div>
                                    
                                    {/* Progress bar with glow effect */}
                                    <div className="relative w-full h-2 bg-black/60 overflow-hidden"
                                      style={{ 
                                        border: '1px solid rgba(250,182,23,0.2)',
                                        clipPath: 'polygon(2px 0, 100% 0, calc(100% - 2px) 100%, 0 100%)'
                                      }}>
                                      <div 
                                        className={`h-full transition-all duration-700 relative ${
                                          isMet 
                                            ? 'bg-gradient-to-r from-green-500 via-green-400 to-green-500' 
                                            : progress > 50
                                              ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500'
                                              : 'bg-gradient-to-r from-red-600 via-red-500 to-red-600'
                                        }`}
                                        style={{ 
                                          width: `${progress}%`,
                                          boxShadow: isMet ? '0 0 10px rgba(34,197,94,0.5)' : 'none'
                                        }}
                                      >
                                        {/* Animated shine effect on progress bar */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full animate-shimmer" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Premium Craft Button */}
                        <button
                          onClick={() => setSelectedRecipe(recipe)}
                          className={`relative w-full py-4 font-black text-lg uppercase tracking-[0.2em] transition-all overflow-hidden group ${
                            craftable
                              ? 'mek-button-primary text-black'
                              : 'bg-gray-900/50 text-gray-600 border-2 border-gray-800/50 cursor-not-allowed'
                          }`}
                          disabled={!craftable}
                          style={{
                            clipPath: craftable ? theme.clipPaths.angledButton : 'none',
                          }}
                        >
                          {/* Button glow effect */}
                          {craftable && (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500" />
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </>
                          )}
                          
                          <span className="relative flex items-center justify-center gap-3">
                            {craftable ? (
                              <>
                                <span className="text-xl">⚡</span>
                                <span>INITIATE QUANTUM FORGE</span>
                                <span className="text-xl">⚡</span>
                              </>
                            ) : (
                              <>
                                <span className="text-xl">⚠</span>
                                <span>INSUFFICIENT RESOURCES</span>
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Recipe Modal - Industrial Style */}
          {selectedRecipe && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gradient-to-b from-gray-900 to-black border-2 border-yellow-400/50 max-w-md w-full shadow-[0_0_50px_rgba(250,204,21,0.2)]">
                <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-gray-950 to-gray-900">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      CONFIRM PRODUCTION
                    </h3>
                    <button
                      onClick={() => setSelectedRecipe(null)}
                      className="text-gray-400 hover:text-white text-2xl transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-6 text-center p-4 bg-gradient-to-b from-gray-800/30 to-gray-900/30 border border-gray-700">
                    <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Output Product</div>
                    <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      T{selectedTier} UNIVERSAL CHIP ×1
                    </div>
                    {selectedRecipe.rarityBiasBonus > 0 && (
                      <div className="mt-2 text-cyan-400">
                        +{selectedRecipe.rarityBiasBonus}% Rarity Bias Applied
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedRecipe(null)}
                      className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold uppercase tracking-wider transition-colors"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={() => {
                        console.log('Crafting:', selectedRecipe);
                        setSelectedRecipe(null);
                      }}
                      disabled={!canCraft(selectedRecipe)}
                      className={`flex-1 py-3 font-bold uppercase tracking-wider transition-all ${
                        canCraft(selectedRecipe)
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {canCraft(selectedRecipe) ? 'EXECUTE' : 'UNAVAILABLE'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}