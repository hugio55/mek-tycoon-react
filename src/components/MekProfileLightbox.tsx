"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "@/styles/global-design-system.css";
import MechanicalToggle from "@/components/controls/MechanicalToggle";

export type CardInteriorStyle = 'compact' | 'spacious' | 'modern' | 'tech-badge' | 'cyber-compact' | 'tactical-display';
export type VariationCardStyle = 'clean-frames' | 'image-focus' | 'subtle-accent' | 'no-cards-direct';
export type DesignationCardStyle = 'corner-brackets' | 'split-hud' | 'data-terminal';

export type BuffDetailsLayout = 'classic' | 'compact-grid' | 'detailed-cards' | 'minimal';

interface MekProfileLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  styleVariation?: 'default' | 'variation1' | 'variation2';
  onStyleVariationChange?: (variation: 'default' | 'variation1' | 'variation2') => void;
  cardInteriorStyle?: CardInteriorStyle;
  onCardInteriorStyleChange?: (style: CardInteriorStyle) => void;
  buffDetailsLayout?: BuffDetailsLayout;
  onBuffDetailsLayoutChange?: (layout: BuffDetailsLayout) => void;
  variationCardStyle?: VariationCardStyle;
  onVariationCardStyleChange?: (style: VariationCardStyle) => void;
  designationCardStyle?: DesignationCardStyle;
  onDesignationCardStyleChange?: (style: DesignationCardStyle) => void;
  backdropDarkness?: number;
  onBackdropDarknessChange?: (value: number) => void;
  cardDarkness?: number;
  onCardDarknessChange?: (value: number) => void;
  backdropBlur?: number;
  onBackdropBlurChange?: (value: number) => void;
  cardBackdropBlur?: number;
  onCardBackdropBlurChange?: (value: number) => void;
  headerGap?: number;
  onHeaderGapChange?: (value: number) => void;
  headerBottomPadding?: number;
  onHeaderBottomPaddingChange?: (value: number) => void;
  contentSpacing?: number;
  onContentSpacingChange?: (value: number) => void;
  useYellowGlow?: boolean;
}

export default function MekProfileLightbox({
  isOpen,
  onClose,
  styleVariation = 'default',
  onStyleVariationChange,
  cardInteriorStyle = 'compact',
  onCardInteriorStyleChange,
  buffDetailsLayout = 'classic',
  onBuffDetailsLayoutChange,
  variationCardStyle = 'clean-frames',
  onVariationCardStyleChange,
  designationCardStyle = 'corner-brackets',
  onDesignationCardStyleChange,
  backdropDarkness = 40,
  onBackdropDarknessChange,
  cardDarkness = 20,
  onCardDarknessChange,
  backdropBlur = 2,
  onBackdropBlurChange,
  cardBackdropBlur = 12,
  onCardBackdropBlurChange,
  headerGap = 32,
  onHeaderGapChange,
  headerBottomPadding = 15,
  onHeaderBottomPaddingChange,
  contentSpacing = 16,
  onContentSpacingChange,
  useYellowGlow = false
}: MekProfileLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [isEmployed, setIsEmployed] = useState(false);

  // Define style classes based on variation (base classes only, opacity/blur applied inline)
  const getContainerClasses = () => {
    switch (styleVariation) {
      case 'variation1': // Cyber Tech
        return 'relative w-[960px] max-w-[95vw] max-h-[90vh] border-2 border-blue-500/60 rounded-2xl overflow-hidden shadow-2xl flex flex-col';
      case 'variation2': // Neon Fusion
        return 'relative w-[960px] max-w-[95vw] max-h-[90vh] border-2 border-purple-500/50 rounded-xl overflow-hidden shadow-2xl shadow-purple-500/20 flex flex-col';
      default: // Industrial
        return 'relative w-[960px] max-w-[95vw] max-h-[90vh] border-2 border-yellow-500/50 rounded-lg overflow-hidden shadow-2xl flex flex-col';
    }
  };

  const getHeaderTitleClasses = () => {
    switch (styleVariation) {
      case 'variation1':
        return 'text-5xl font-bold tracking-wider text-center mb-1';
      case 'variation2':
        return 'text-5xl font-bold tracking-wider text-center mb-1 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent';
      default:
        return 'text-5xl font-bold font-orbitron tracking-wider text-center mb-1';
    }
  };

  const getPrimaryColor = () => {
    switch (styleVariation) {
      case 'variation1':
        return 'text-blue-400';
      case 'variation2':
        return 'text-purple-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getCardClasses = () => {
    switch (styleVariation) {
      case 'variation1':
        return 'bg-black/40 backdrop-blur-sm border-2 border-blue-500/40 rounded-xl p-4';
      case 'variation2':
        return 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm border border-purple-500/50 rounded-lg p-4 shadow-lg shadow-purple-500/10';
      default:
        return 'mek-card-industrial mek-border-sharp-gold p-4';
    }
  };

  // Card Interior Style Functions
  const getCardInteriorClasses = () => {
    switch (cardInteriorStyle) {
      case 'spacious':
        return 'flex flex-row justify-between items-center';
      case 'modern':
        return 'flex flex-col items-center text-center';
      case 'tech-badge':
        return 'flex flex-row items-center justify-between bg-gradient-to-r from-yellow-500/5 to-transparent border-l-2 border-yellow-500/40 pl-3 pr-2 py-1.5';
      case 'cyber-compact':
        return 'flex flex-row items-center justify-between border border-cyan-500/30 bg-black/40 px-3 py-2 rounded-sm';
      case 'tactical-display':
        return 'relative bg-black/60 border-t border-b border-yellow-500/20 py-2 px-3 flex flex-row items-center justify-between';
      default: // compact
        return 'flex flex-col';
    }
  };

  const getLabelClasses = () => {
    switch (cardInteriorStyle) {
      case 'spacious':
        return 'text-xs text-gray-400 uppercase tracking-wider font-normal';
      case 'modern':
        return 'text-sm text-gray-300 uppercase tracking-widest font-light mb-2';
      case 'tech-badge':
        return 'inline-block bg-yellow-500/20 border border-yellow-500/50 px-2 py-0.5 text-[9px] text-yellow-300 uppercase tracking-widest font-black rounded-sm shadow-sm';
      case 'cyber-compact':
        return 'text-[10px] text-cyan-400 uppercase tracking-wider font-bold font-mono';
      case 'tactical-display':
        return 'text-[11px] text-gray-300 uppercase tracking-widest font-bold bg-yellow-500/10 px-2 py-0.5 border-l-2 border-yellow-500/60';
      default: // compact
        return 'mek-label-uppercase';
    }
  };

  const getValueClasses = () => {
    switch (cardInteriorStyle) {
      case 'spacious':
        return 'text-lg font-bold';
      case 'modern':
        return 'text-3xl font-bold tracking-wide';
      case 'tech-badge':
        return 'text-xl font-black tracking-tight text-white';
      case 'cyber-compact':
        return 'text-base font-bold font-mono text-cyan-300';
      case 'tactical-display':
        return 'text-lg font-bold tracking-wider text-white font-mono';
      default: // compact
        return '';
    }
  };

  const getCardSpacing = () => {
    switch (cardInteriorStyle) {
      case 'spacious':
        return 'space-y-3';
      case 'modern':
        return 'space-y-6';
      case 'tech-badge':
        return 'space-y-2';
      case 'cyber-compact':
        return 'space-y-1.5';
      case 'tactical-display':
        return 'space-y-1';
      default: // compact
        return 'space-y-2';
    }
  };

  // Render Designation Card based on selected style
  const renderDesignationCard = () => {
    const mekData = {
      mekNumber: '1234',
      rank: '2985',
      corporation: 'Apex Industries',
      employeeId: 'Golden Striker'
    };

    // Dynamic colors based on useYellowGlow
    const accentColor = useYellowGlow ? 'text-yellow-400' : 'text-cyan-400';
    const accentColorDim = useYellowGlow ? 'text-yellow-400/60' : 'text-cyan-400/60';
    const borderColor = useYellowGlow ? 'border-yellow-400/50' : 'border-cyan-400/50';
    const glowRgba = useYellowGlow ? 'rgba(250, 182, 23, 0.3)' : 'rgba(0, 212, 255, 0.3)';
    const glowRgbaInset = useYellowGlow ? 'rgba(250, 182, 23, 0.1)' : 'rgba(0, 212, 255, 0.1)';
    const textShadowGlow = useYellowGlow ? '0 0 15px rgba(250, 182, 23, 0.8)' : '0 0 15px rgba(0, 212, 255, 0.8)';

    // Option 1: Corner Brackets - Angular framing with glowing borders
    if (designationCardStyle === 'corner-brackets') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm">
          {/* Corner Bracket SVG Elements */}
          <svg className={`absolute top-0 left-0 w-8 h-8 ${accentColor}`} viewBox="0 0 32 32">
            <path d="M 0 8 L 0 0 L 8 0" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M 0 0 L 8 8" stroke="currentColor" strokeWidth="1" opacity="0.3" fill="none" />
          </svg>
          <svg className={`absolute top-0 right-0 w-8 h-8 ${accentColor}`} viewBox="0 0 32 32">
            <path d="M 32 8 L 32 0 L 24 0" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M 32 0 L 24 8" stroke="currentColor" strokeWidth="1" opacity="0.3" fill="none" />
          </svg>
          <svg className={`absolute bottom-0 left-0 w-8 h-8 ${accentColor}`} viewBox="0 0 32 32">
            <path d="M 0 24 L 0 32 L 8 32" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M 0 32 L 8 24" stroke="currentColor" strokeWidth="1" opacity="0.3" fill="none" />
          </svg>
          <svg className={`absolute bottom-0 right-0 w-8 h-8 ${accentColor}`} viewBox="0 0 32 32">
            <path d="M 32 24 L 32 32 L 24 32" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M 32 32 L 24 24" stroke="currentColor" strokeWidth="1" opacity="0.3" fill="none" />
          </svg>

          {/* Border glow effect */}
          <div
            className={`absolute inset-0 border ${borderColor} pointer-events-none`}
            style={{ boxShadow: `0 0 20px ${glowRgba}, inset 0 0 20px ${glowRgbaInset}` }}
          />

          {/* Content Grid */}
          <div className="relative z-10 grid grid-cols-2 gap-3">
            {/* Mekanism Number */}
            <div>
              <div className={`text-[10px] ${accentColorDim} uppercase tracking-widest font-mono mb-1`}>
                MEKANISM
              </div>
              <div className="text-white text-xl font-mono font-bold">
                #{mekData.mekNumber}
              </div>
            </div>

            {/* Rank - Prominent with glow */}
            <div className="text-right">
              <div className={`text-[10px] ${accentColorDim} uppercase tracking-widest font-mono mb-1`}>
                RANK
              </div>
              <div
                className={`${accentColor} text-2xl font-mono font-black`}
                style={{ textShadow: textShadowGlow }}
              >
                {mekData.rank}
              </div>
            </div>

            {/* Corporation */}
            <div className="col-span-2">
              <div className={`text-[10px] ${accentColorDim} uppercase tracking-widest font-mono mb-1`}>
                CORPORATION
              </div>
              <div className="text-white text-sm font-semibold">
                {mekData.corporation}
              </div>
            </div>

            {/* Employee ID */}
            <div className="col-span-2">
              <div className={`text-[10px] ${accentColorDim} uppercase tracking-widest font-mono mb-1`}>
                EMPLOYEE ID
              </div>
              <div className="text-white text-base font-bold tracking-wide">
                {mekData.employeeId}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Option 2: Split HUD - Left side large rank, right side stacked data
    if (designationCardStyle === 'split-hud') {
      const borderLeftColor = useYellowGlow ? 'border-yellow-500' : 'border-cyan-500';
      const bgGradientFrom = useYellowGlow ? 'from-yellow-500/20' : 'from-cyan-500/20';
      const bgGradientTo = useYellowGlow ? 'to-yellow-700/10' : 'to-cyan-700/10';
      const textGradientFrom = useYellowGlow ? 'from-yellow-400' : 'from-cyan-400';
      const textGradientTo = useYellowGlow ? 'to-yellow-600' : 'to-cyan-600';
      const dividerColor = useYellowGlow ? 'via-yellow-500/50' : 'via-cyan-500/50';
      const dividerShadow = useYellowGlow ? '0 0 10px rgba(250, 182, 23, 0.5)' : '0 0 10px rgba(0, 212, 255, 0.5)';
      const rankShadow = useYellowGlow ? '0 0 20px rgba(250, 182, 23, 0.6)' : '0 0 20px rgba(0, 212, 255, 0.6)';

      return (
        <div className={`relative p-4 bg-gradient-to-r from-black/60 via-black/40 to-black/60 backdrop-blur-sm border ${borderColor}`}>
          {/* Background grid pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: useYellowGlow
              ? 'linear-gradient(rgba(250, 182, 23, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(250, 182, 23, 0.3) 1px, transparent 1px)'
              : 'linear-gradient(rgba(0, 212, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.3) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />

          <div className="relative z-10 flex gap-4">
            {/* Left: Large Rank Display */}
            <div className={`flex-shrink-0 flex flex-col items-center justify-center px-6 py-4 bg-gradient-to-br ${bgGradientFrom} ${bgGradientTo} border-l-4 ${borderLeftColor}`}>
              <div className={`text-[9px] ${accentColor} uppercase tracking-widest font-mono mb-2`}>
                RANK
              </div>
              <div
                className={`text-5xl font-mono font-black bg-gradient-to-b ${textGradientFrom} ${textGradientTo} bg-clip-text text-transparent`}
                style={{ textShadow: rankShadow }}
              >
                {mekData.rank}
              </div>
            </div>

            {/* Vertical Divider with glow */}
            <div className={`w-px bg-gradient-to-b from-transparent ${dividerColor} to-transparent`}
                 style={{ boxShadow: dividerShadow }}
            />

            {/* Right: Stacked Technical Data */}
            <div className="flex-1 space-y-3 py-2">
              {/* Mekanism */}
              <div className="flex items-baseline gap-2">
                <div className={`text-[9px] ${accentColorDim} uppercase tracking-widest font-mono w-24`}>
                  MEKANISM
                </div>
                <div className="text-white text-lg font-mono font-bold">
                  #{mekData.mekNumber}
                </div>
              </div>

              {/* Corporation */}
              <div className="flex items-baseline gap-2">
                <div className={`text-[9px] ${accentColorDim} uppercase tracking-widest font-mono w-24`}>
                  CORP
                </div>
                <div className="text-white text-sm font-semibold">
                  {mekData.corporation}
                </div>
              </div>

              {/* Employee ID */}
              <div className="flex items-baseline gap-2">
                <div className={`text-[9px] ${accentColorDim} uppercase tracking-widest font-mono w-24`}>
                  EMPLOYEE
                </div>
                <div className="text-white text-sm font-bold">
                  {mekData.employeeId}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Option 3: Data Terminal - Full-width horizontal bars with scanline overlay
    if (designationCardStyle === 'data-terminal') {
      const borderBottomColor = useYellowGlow ? 'border-yellow-500/20' : 'border-cyan-500/20';
      const accentBgColor = useYellowGlow ? 'bg-yellow-400' : 'bg-cyan-400';
      const hoverBgFrom = useYellowGlow ? 'from-yellow-500/10' : 'from-cyan-500/10';
      const hoverBgHover = useYellowGlow ? 'hover:from-yellow-500/15' : 'hover:from-cyan-500/15';
      const hoverBg = useYellowGlow ? 'hover:bg-yellow-500/5' : 'hover:bg-cyan-500/5';
      const accentBarShadow = useYellowGlow ? '0 0 10px rgba(250, 182, 23, 0.5)' : '0 0 10px rgba(0, 212, 255, 0.5)';
      const scanlineRgba = useYellowGlow ? 'rgba(250, 182, 23, 0.03)' : 'rgba(0, 212, 255, 0.03)';

      return (
        <div className={`relative p-0 bg-black/50 backdrop-blur-sm border ${borderColor} overflow-hidden`}>
          {/* Scanline overlay effect */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `repeating-linear-gradient(0deg, ${scanlineRgba} 0px, transparent 1px, transparent 2px, ${scanlineRgba} 3px)`,
            animation: 'scanline 8s linear infinite'
          }} />

          <div className="relative z-10">
            {/* Mekanism Number Bar */}
            <div className={`flex items-center border-b ${borderBottomColor} px-4 py-3 bg-black/20 ${hoverBg} transition-colors`}>
              <div className={`w-1 h-8 ${accentBgColor} mr-3`} style={{ boxShadow: accentBarShadow }} />
              <div className="flex-1">
                <div className={`text-[9px] ${accentColorDim} uppercase tracking-widest font-mono mb-0.5`}>
                  MEKANISM
                </div>
                <div className="text-white text-base font-mono font-bold">
                  #{mekData.mekNumber}
                </div>
              </div>
            </div>

            {/* Rank Bar - Emphasized */}
            <div className={`flex items-center border-b ${borderBottomColor} px-4 py-3 bg-gradient-to-r ${hoverBgFrom} to-transparent ${hoverBgHover} transition-colors`}>
              <div className={`w-1 h-8 ${accentBgColor} mr-3`} style={{ boxShadow: accentBarShadow }} />
              <div className="flex-1">
                <div className={`text-[9px] ${accentColorDim} uppercase tracking-widest font-mono mb-0.5`}>
                  RANK
                </div>
                <div
                  className={`${accentColor} text-2xl font-mono font-black`}
                  style={{ textShadow: textShadowGlow }}
                >
                  {mekData.rank}
                </div>
              </div>
            </div>

            {/* Corporation Bar */}
            <div className={`flex items-center border-b ${borderBottomColor} px-4 py-3 bg-black/20 ${hoverBg} transition-colors`}>
              <div className={`w-1 h-8 ${accentBgColor} mr-3`} style={{ boxShadow: accentBarShadow }} />
              <div className="flex-1">
                <div className={`text-[9px] ${accentColorDim} uppercase tracking-widest font-mono mb-0.5`}>
                  CORPORATION
                </div>
                <div className="text-white text-sm font-mono font-semibold">
                  {mekData.corporation}
                </div>
              </div>
            </div>

            {/* Employee ID Bar */}
            <div className={`flex items-center px-4 py-3 bg-black/20 ${hoverBg} transition-colors`}>
              <div className={`w-1 h-8 ${accentBgColor} mr-3`} style={{ boxShadow: accentBarShadow }} />
              <div className="flex-1">
                <div className={`text-[9px] ${accentColorDim} uppercase tracking-widest font-mono mb-0.5`}>
                  EMPLOYEE ID
                </div>
                <div className="text-white text-base font-mono font-bold tracking-wide">
                  {mekData.employeeId}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Render Gold Produced Card based on selected style
  const renderGoldProducedCard = () => {
    const goldData = {
      currentOwner: '12,869.015',
      allTime: '458,414.324'
    };

    // Dynamic colors based on useYellowGlow
    const accentColor = useYellowGlow ? 'text-yellow-400' : 'text-cyan-400';
    const accentColorDim = useYellowGlow ? 'text-yellow-400/60' : 'text-cyan-400/60';
    const borderColor = useYellowGlow ? 'border-yellow-400/50' : 'border-cyan-400/50';
    const glowRgba = useYellowGlow ? 'rgba(250, 182, 23, 0.3)' : 'rgba(0, 212, 255, 0.3)';
    const glowRgbaInset = useYellowGlow ? 'rgba(250, 182, 23, 0.1)' : 'rgba(0, 212, 255, 0.1)';
    const textShadowGlow = useYellowGlow ? '0 0 15px rgba(250, 182, 23, 0.8)' : '0 0 15px rgba(0, 212, 255, 0.8)';

    // Option 1: Corner Brackets
    if (designationCardStyle === 'corner-brackets') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm">
          {/* Corner Bracket SVG Elements */}
          <svg className={`absolute top-0 left-0 w-8 h-8 ${accentColor}`} viewBox="0 0 32 32">
            <path d="M 0 8 L 0 0 L 8 0" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M 0 0 L 8 8" stroke="currentColor" strokeWidth="1" opacity="0.3" fill="none" />
          </svg>
          <svg className={`absolute top-0 right-0 w-8 h-8 ${accentColor}`} viewBox="0 0 32 32">
            <path d="M 32 8 L 32 0 L 24 0" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M 32 0 L 24 8" stroke="currentColor" strokeWidth="1" opacity="0.3" fill="none" />
          </svg>
          <svg className={`absolute bottom-0 left-0 w-8 h-8 ${accentColor}`} viewBox="0 0 32 32">
            <path d="M 0 24 L 0 32 L 8 32" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M 0 32 L 8 24" stroke="currentColor" strokeWidth="1" opacity="0.3" fill="none" />
          </svg>
          <svg className={`absolute bottom-0 right-0 w-8 h-8 ${accentColor}`} viewBox="0 0 32 32">
            <path d="M 32 24 L 32 32 L 24 32" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M 32 32 L 24 24" stroke="currentColor" strokeWidth="1" opacity="0.3" fill="none" />
          </svg>

          {/* Border glow effect */}
          <div
            className={`absolute inset-0 border ${borderColor} pointer-events-none`}
            style={{ boxShadow: `0 0 20px ${glowRgba}, inset 0 0 20px ${glowRgbaInset}` }}
          />

          {/* Content */}
          <div className="relative z-10 space-y-4">
            {/* Current Owner - Prominent with glow */}
            <div>
              <div className={`text-[10px] ${accentColorDim} uppercase tracking-widest font-mono mb-1`}>
                CURRENT OWNER
              </div>
              <div
                className={`${accentColor} text-2xl font-mono font-black`}
                style={{ textShadow: textShadowGlow }}
              >
                {goldData.currentOwner}
              </div>
            </div>

            {/* All Time */}
            <div>
              <div className={`text-[10px] ${accentColorDim} uppercase tracking-widest font-mono mb-1`}>
                ALL TIME
              </div>
              <div className="text-white text-xl font-mono font-bold">
                {goldData.allTime}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Option 2: Split HUD
    if (designationCardStyle === 'split-hud') {
      const borderLeftColor = useYellowGlow ? 'border-yellow-500' : 'border-cyan-500';
      const bgGradientFrom = useYellowGlow ? 'from-yellow-500/20' : 'from-cyan-500/20';
      const bgGradientTo = useYellowGlow ? 'to-yellow-700/10' : 'to-cyan-700/10';
      const dividerColor = useYellowGlow ? 'via-yellow-500/50' : 'via-cyan-500/50';
      const dividerShadow = useYellowGlow ? '0 0 10px rgba(250, 182, 23, 0.5)' : '0 0 10px rgba(0, 212, 255, 0.5)';

      return (
        <div className={`relative p-4 bg-gradient-to-r from-black/60 via-black/40 to-black/60 backdrop-blur-sm border ${borderColor}`}>
          {/* Background grid pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: useYellowGlow
              ? 'linear-gradient(rgba(250, 182, 23, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(250, 182, 23, 0.3) 1px, transparent 1px)'
              : 'linear-gradient(rgba(0, 212, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.3) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />

          <div className="relative z-10 flex gap-4 items-center">
            {/* Left: Current Owner */}
            <div className={`flex-1 px-4 py-3 bg-gradient-to-br ${bgGradientFrom} ${bgGradientTo} border-l-4 ${borderLeftColor}`}>
              <div className={`text-[9px] ${accentColor} uppercase tracking-widest font-mono mb-2`}>
                CURRENT OWNER
              </div>
              <div className={`${accentColor} text-2xl font-mono font-black`} style={{ textShadow: textShadowGlow }}>
                {goldData.currentOwner}
              </div>
            </div>

            {/* Vertical Divider with glow */}
            <div className={`w-px h-16 bg-gradient-to-b from-transparent ${dividerColor} to-transparent`}
                 style={{ boxShadow: dividerShadow }}
            />

            {/* Right: All Time */}
            <div className="flex-1 px-4 py-3">
              <div className={`text-[9px] ${accentColorDim} uppercase tracking-widest font-mono mb-2`}>
                ALL TIME
              </div>
              <div className="text-white text-xl font-mono font-bold">
                {goldData.allTime}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Option 3: Data Terminal
    if (designationCardStyle === 'data-terminal') {
      const borderBottomColor = useYellowGlow ? 'border-yellow-500/20' : 'border-cyan-500/20';
      const accentBgColor = useYellowGlow ? 'bg-yellow-400' : 'bg-cyan-400';
      const hoverBgFrom = useYellowGlow ? 'from-yellow-500/10' : 'from-cyan-500/10';
      const hoverBgHover = useYellowGlow ? 'hover:from-yellow-500/15' : 'hover:from-cyan-500/15';
      const accentBarShadow = useYellowGlow ? '0 0 10px rgba(250, 182, 23, 0.5)' : '0 0 10px rgba(0, 212, 255, 0.5)';
      const scanlineRgba = useYellowGlow ? 'rgba(250, 182, 23, 0.03)' : 'rgba(0, 212, 255, 0.03)';

      return (
        <div className={`relative p-0 bg-black/50 backdrop-blur-sm border ${borderColor} overflow-hidden`}>
          {/* Scanline overlay effect */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `repeating-linear-gradient(0deg, ${scanlineRgba} 0px, transparent 1px, transparent 2px, ${scanlineRgba} 3px)`,
            animation: 'scanline 8s linear infinite'
          }} />

          <div className="relative z-10">
            {/* Current Owner Bar - Emphasized */}
            <div className={`flex items-center border-b ${borderBottomColor} px-4 py-3 bg-gradient-to-r ${hoverBgFrom} to-transparent ${hoverBgHover} transition-colors`}>
              <div className={`w-1 h-8 ${accentBgColor} mr-3`} style={{ boxShadow: accentBarShadow }} />
              <div className="flex-1">
                <div className={`text-[9px] ${accentColorDim} uppercase tracking-widest font-mono mb-0.5`}>
                  CURRENT OWNER
                </div>
                <div
                  className={`${accentColor} text-2xl font-mono font-black`}
                  style={{ textShadow: textShadowGlow }}
                >
                  {goldData.currentOwner}
                </div>
              </div>
            </div>

            {/* All Time Bar */}
            <div className={`flex items-center px-4 py-3 bg-black/20 ${useYellowGlow ? 'hover:bg-yellow-500/5' : 'hover:bg-cyan-500/5'} transition-colors`}>
              <div className={`w-1 h-8 ${accentBgColor} mr-3`} style={{ boxShadow: accentBarShadow }} />
              <div className="flex-1">
                <div className={`text-[9px] ${accentColorDim} uppercase tracking-widest font-mono mb-0.5`}>
                  ALL TIME
                </div>
                <div className="text-white text-xl font-mono font-bold">
                  {goldData.allTime}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Mount portal and lock body scroll
  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
      {/* Backdrop - Dynamic darkness */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${backdropDarkness / 100})`
        }}
        onClick={onClose}
      />

      {/* Lightbox Container - Dynamic styling based on variation with dynamic blur/darkness */}
      <div
        className={`${getContainerClasses()} pointer-events-auto`}
        style={{
          backgroundColor: styleVariation === 'variation2'
            ? `rgba(88, 28, 135, ${cardDarkness / 100})`
            : `rgba(0, 0, 0, ${cardDarkness / 100})`,
          backdropFilter: `blur(${cardBackdropBlur}px)`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <span className={`${getPrimaryColor()} text-3xl font-bold`} style={{ textShadow: `0 0 10px ${styleVariation === 'variation1' ? 'rgba(59, 130, 246, 0.5)' : styleVariation === 'variation2' ? 'rgba(168, 85, 247, 0.5)' : 'rgba(250, 182, 23, 0.5)'}` }}>×</span>
        </button>

        {/* Scrollable Content */}
        <div className="w-full flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="relative text-white">
            {/* Industrial Header */}
            <div className="w-full bg-gradient-to-b from-black via-gray-900/50 to-transparent">
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #fab617 0, #fab617 10px, transparent 10px, transparent 20px)',
                  }} />
                </div>

                <div className="max-w-7xl mx-auto px-4" style={{ paddingTop: `${headerBottomPadding}px`, paddingBottom: `${headerBottomPadding}px` }}>
                  <h1 className={getHeaderTitleClasses()}>
                    <span className={getPrimaryColor()}>MEK</span>{" "}
                    <span className="text-gray-400">PROFILE</span>
                  </h1>
                  <p className="text-center text-gray-400 text-xs max-w-2xl mx-auto" style={{
                    lineHeight: '1.6'
                  }}>
                    Detailed information about your Mekanism unit including stats, variations, and abilities.
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content - Layout 1 (Three-Column) */}
            <div className="max-w-7xl mx-auto px-4 pb-6" style={{ paddingTop: `${headerGap}px` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${contentSpacing}px` }}>
                {/* MOBILE: Mek Image Hero (only visible on mobile) */}
                <div className="lg:hidden mek-card-industrial mek-border-sharp-gold overflow-hidden">
                  <img
                    src="/mek-images/1000px/aa2-bl2-hn1.webp"
                    alt="Mek Profile"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* MOBILE: Primary Info Panel (Designation - Dynamic Style) */}
                <div className="lg:hidden">
                  {renderDesignationCard()}
                </div>

                {/* MOBILE: Level & Gold Panel (grouped together) */}
                <div className="lg:hidden space-y-3">
                  {/* Level Progress */}
                  <div className="mek-card-industrial mek-border-sharp-gold p-4">
                    <div className="mek-label-uppercase mb-2">LEVEL PROGRESS</div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">LEVEL 1</span>
                      <span className="text-gray-400">LEVEL 2</span>
                    </div>
                    <div className="relative w-full h-4 bg-black/60 border border-yellow-500/30 mb-2 overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-yellow-500 to-yellow-600" style={{
                        boxShadow: '0 0 10px rgba(250, 182, 23, 0.6)'
                      }}></div>
                    </div>
                    <div className="text-xs text-gray-400 text-center">6,720 / 10,000 XP</div>
                  </div>

                  {/* Gold Stats Combined */}
                  <div className="mek-card-industrial mek-border-sharp-gold p-4">
                    <div className="mek-label-uppercase mb-3">GOLD STATS</div>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Gold Generation */}
                      <div>
                        <div className="mek-label-uppercase mb-2">GENERATION</div>
                        <div className={`text-sm ${getCardSpacing()}`}>
                          <div className={getCardInteriorClasses()}>
                            <span className={getLabelClasses()}>Base:</span>
                            <span className={`text-white ${getValueClasses()}`}>20.0/hr</span>
                          </div>
                          <div className={getCardInteriorClasses()}>
                            <span className={getLabelClasses()}>Effective:</span>
                            <span className={`text-green-400 font-bold ${getValueClasses()}`}>24.0/hr</span>
                          </div>
                        </div>
                      </div>

                      {/* Gold Produced */}
                      <div>
                        <div className="mek-label-uppercase mb-2">PRODUCED</div>
                        <div className={`text-sm ${getCardSpacing()}`}>
                          <div className={getCardInteriorClasses()}>
                            <div className={getLabelClasses()}>Current:</div>
                            <div className={`mek-value-primary ${getValueClasses()}`}>12,869</div>
                          </div>
                          <div className={getCardInteriorClasses()}>
                            <div className={getLabelClasses()}>All Time:</div>
                            <div className={`text-white ${getValueClasses()}`}>458,414</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DESKTOP & TABLET: Three Columns */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-4">

                  {/* LEFT SIDEBAR */}
                  <div className="lg:col-span-3 space-y-4">
                    {/* Designation Section - Dynamic Style */}
                    {renderDesignationCard()}

                    {/* Employment Status Toggle */}
                    <div className={getCardClasses()}>
                      <div className="mek-label-uppercase mb-3">STATUS</div>
                      <div className="flex flex-col items-center space-y-3">
                        <div className="text-white font-bold uppercase tracking-wider">
                          {isEmployed ? 'EMPLOYED' : 'IDLE'}
                        </div>
                        <div className="scale-75">
                          <MechanicalToggle
                            checked={isEmployed}
                            onChange={setIsEmployed}
                          />
                        </div>
                        <div className="text-xs text-gray-400 uppercase">Mechanical Toggle</div>
                      </div>
                    </div>
                  </div>

                  {/* CENTER - MEK IMAGE */}
                  <div className="lg:col-span-6 flex items-start justify-center">
                    <div className={`${getCardClasses()} overflow-hidden w-full`}>
                      <img
                        src="/mek-images/1000px/aa2-bl2-hn1.webp"
                        alt="Mek Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* RIGHT SIDEBAR */}
                  <div className="lg:col-span-3 space-y-4">
                    {/* Level Progress */}
                    <div className={getCardClasses()}>
                      <div className="mek-label-uppercase mb-2">LEVEL PROGRESS</div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">LEVEL 1</span>
                        <span className="text-gray-400">LEVEL 2</span>
                      </div>
                      <div className="relative w-full h-4 bg-black/60 border border-yellow-500/30 mb-2 overflow-hidden">
                        <div className="h-full w-3/4 bg-gradient-to-r from-yellow-500 to-yellow-600" style={{
                          boxShadow: '0 0 10px rgba(250, 182, 23, 0.6)'
                        }}></div>
                      </div>
                      <div className="text-xs text-gray-400 text-center">6,720 / 10,000 XP</div>
                    </div>

                    {/* Gold Generation */}
                    <div className={getCardClasses()}>
                      <div className="mek-label-uppercase mb-2">GOLD GENERATION</div>
                      <div className={getCardSpacing()}>
                        <div className={getCardInteriorClasses()}>
                          <div className={getLabelClasses()}>BASE</div>
                          <div className={`text-white ${getValueClasses()}`}>20.0/hr</div>
                        </div>
                        <div className={getCardInteriorClasses()}>
                          <div className={getLabelClasses()}>EFFECTIVE</div>
                          <div className={`text-green-400 font-bold ${getValueClasses()}`}>24.0/hr</div>
                        </div>
                      </div>
                    </div>

                    {/* Gold Produced */}
                    {renderGoldProducedCard()}
                  </div>
                </div>

                {/* Variation Cards - Responsive Grid */}
                <div className={variationCardStyle === 'no-cards-direct' ? '' : 'mek-card-industrial mek-border-sharp-gold p-4'}>
                  {variationCardStyle !== 'no-cards-direct' && (
                    <div className="mek-label-uppercase mb-3">VARIATION CARDS</div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <VariationCard
                      title="HEAD VARIATION"
                      imagePath="/variation-images-art-400px/ae1-gn3-ev1.png"
                      cardStyle={variationCardStyle}
                    />
                    <VariationCard
                      title="BODY VARIATION"
                      imagePath="/variation-images-art-400px/ak3-aa5-mo1.png"
                      cardStyle={variationCardStyle}
                    />
                    <VariationCard
                      title="TRAIT VARIATION"
                      imagePath="/variation-images-art-400px/ar1-at1-nm1.png"
                      cardStyle={variationCardStyle}
                    />
                  </div>
                </div>

                {/* Abilities Tree */}
                <div className="mek-card-industrial mek-border-sharp-gold p-4">
                  <div className="mek-label-uppercase mb-3">ABILITIES TREE</div>
                  <div className="w-full h-64 md:h-80 lg:h-96 bg-black/40 border border-yellow-500/20 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 mek-overlay-scratches opacity-5 pointer-events-none"></div>
                    <span className="text-gray-500 relative z-10">Node Tree / Talent Tree Area</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen || !mounted) return null;

  return createPortal(modalContent, document.body);
}

// Reusable Variation Card Component with 3 Style Options
// All styles now have images floating directly on the base card, no inner containers
function VariationCard({ title, imagePath, cardStyle = 'clean-frames' }: { title: string; imagePath?: string; cardStyle?: VariationCardStyle }) {

  // Option 1: Elevated Float - Image overlays card with drop shadow, creating floating effect
  if (cardStyle === 'clean-frames') {
    return (
      <div className="bg-black/30 border-2 border-yellow-500/40 p-4 relative overflow-visible">
        {/* Scratches overlay on base card */}
        <div className="absolute inset-0 mek-overlay-scratches opacity-5 pointer-events-none"></div>

        {/* Image floating ON the card with drop shadow */}
        <div className="relative -mt-2 mb-3">
          {imagePath ? (
            <img
              src={imagePath}
              alt={title}
              className="w-full h-44 object-contain relative z-20"
              style={{
                filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.7))'
              }}
            />
          ) : (
            <div className="w-full h-44 flex items-center justify-center">
              <span className="text-gray-500 text-xs">Image</span>
            </div>
          )}
        </div>

        <div className="mek-label-uppercase mb-2 text-[10px] relative z-10">{title}</div>
        <div className="text-white text-sm mb-1 relative z-10">Variation Name</div>
        <div className="text-gray-400 text-xs mb-3 relative z-10">3 of 4000</div>

        <div className="space-y-1 text-xs relative z-10">
          <div className="flex justify-between">
            <span className="text-gray-400">Base:</span>
            <span className="text-white">100</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Bonus:</span>
            <span className="text-green-400">+25</span>
          </div>
          <div className="flex justify-between border-t border-yellow-500/20 pt-1 mt-1">
            <span className="text-gray-400">Total:</span>
            <span className="mek-value-primary font-bold">125</span>
          </div>
        </div>
      </div>
    );
  }

  // Option 2: Centered Overlay - Image positioned in center of card with glow
  if (cardStyle === 'image-focus') {
    return (
      <div className="bg-gradient-to-b from-black/20 via-black/40 to-black/20 border border-yellow-500/30 p-4 relative overflow-hidden min-h-[360px] flex flex-col">
        {/* Hazard stripe accent at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent"></div>

        {/* Image positioned directly on card with glow */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          {imagePath ? (
            <img
              src={imagePath}
              alt={title}
              className="w-full max-w-[85%] h-auto object-contain"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(250, 182, 23, 0.4))'
              }}
            />
          ) : (
            <span className="text-gray-500 text-xs">Image</span>
          )}
        </div>

        {/* Info at bottom of card */}
        <div className="mt-auto relative z-20 bg-black/60 backdrop-blur-sm p-3 -m-4 border-t border-yellow-500/30">
          <div className="mek-label-uppercase mb-1 text-[10px] text-center">{title}</div>
          <div className="text-white text-sm mb-1 text-center">Variation Name</div>
          <div className="text-gray-400 text-xs mb-2 text-center">3 of 4000</div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Base:</span>
              <span className="text-white">100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Bonus:</span>
              <span className="text-green-400">+25</span>
            </div>
            <div className="flex justify-between border-t border-yellow-500/20 pt-1 mt-1">
              <span className="text-gray-400">Total:</span>
              <span className="mek-value-primary font-bold">125</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Option 3: Borderless Float - Minimal card with image sitting directly on surface
  if (cardStyle === 'subtle-accent') {
    return (
      <div className="bg-black/15 backdrop-blur-sm border border-yellow-500/15 p-3 relative overflow-hidden rounded-lg">
        {/* Subtle gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/3 via-transparent to-black/20 pointer-events-none"></div>

        {/* Image sits directly on card surface, no container */}
        <div className="relative mb-3">
          {imagePath ? (
            <img
              src={imagePath}
              alt={title}
              className="w-full h-40 object-contain relative z-10 opacity-95"
            />
          ) : (
            <div className="w-full h-40 flex items-center justify-center">
              <span className="text-gray-500 text-xs">Image</span>
            </div>
          )}
        </div>

        <div className="mek-label-uppercase mb-2 text-[10px] relative z-10 text-yellow-400/60">{title}</div>
        <div className="text-white/90 text-sm mb-1 relative z-10">Variation Name</div>
        <div className="text-gray-400/60 text-xs mb-3 relative z-10">3 of 4000</div>

        <div className="space-y-1 text-xs relative z-10">
          <div className="flex justify-between">
            <span className="text-gray-400/60">Base:</span>
            <span className="text-white/90">100</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400/60">Bonus:</span>
            <span className="text-green-400/80">+25</span>
          </div>
          <div className="flex justify-between border-t border-yellow-500/15 pt-1 mt-1">
            <span className="text-gray-400/60">Total:</span>
            <span className="text-yellow-400/90 font-bold">125</span>
          </div>
        </div>
      </div>
    );
  }

  // Option 4: No Cards Direct - Images and text float directly on lightbox base layer, NO card containers
  if (cardStyle === 'no-cards-direct') {
    return (
      <div className="flex flex-col items-center relative">
        {/* Image floating directly on lightbox background - no card wrapper at all */}
        <div className="relative mb-3">
          {imagePath ? (
            <img
              src={imagePath}
              alt={title}
              className="w-full h-48 object-contain scale-[0.7]"
              style={{
                filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))'
              }}
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center">
              <span className="text-gray-500 text-xs">Image</span>
            </div>
          )}
        </div>

        {/* All text content sitting directly on lightbox surface - no card background */}
        <div className="mek-label-uppercase mb-1 text-[10px] text-center text-yellow-400">{title}</div>
        <div className="text-white text-sm mb-1 text-center">Variation Name</div>
        <div className="text-gray-400 text-xs mb-3 text-center">3 of 4000</div>

        {/* Stats section - minimal styling, floating on lightbox */}
        <div className="space-y-1 text-xs w-full max-w-[200px]">
          <div className="flex justify-between">
            <span className="text-gray-400">Base:</span>
            <span className="text-white">100</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Bonus:</span>
            <span className="text-green-400">+25</span>
          </div>
          <div className="flex justify-between border-t border-yellow-500/20 pt-1 mt-1">
            <span className="text-gray-400">Total:</span>
            <span className="text-yellow-400 font-bold">125</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
