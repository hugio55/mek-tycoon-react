"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import "@/styles/global-design-system.css";
import PowerSwitch from "@/components/controls/PowerSwitch";
import CloseButton from "@/components/controls/CloseButton";
import LevelProgress from "@/components/LevelProgress";
import type { LevelProgressStyle } from "@/components/LevelProgress";
import { DEFAULT_LEVEL_COLORS } from "@/components/MekCard/types";
import AnimatedBorderButton from "@/components/loaders/AnimatedBorderButton";
import MekAbilitiesTree from "@/components/MekAbilitiesTree";

export type CardInteriorStyle = 'compact' | 'spacious' | 'modern' | 'tech-badge' | 'cyber-compact' | 'tactical-display';
export type DesignationCardStyle = 'corner-brackets' | 'split-hud' | 'data-terminal' | 'holographic-overlay' | 'cyber-minimal' | 'tech-frame' | 'neon-edge' | 'matrix-grid';

export type BuffDetailsLayout = 'classic' | 'compact-grid' | 'detailed-cards' | 'minimal';
export type CumulativeGoldStyle = 'stacked-emphasis' | 'side-split' | 'badge-style' | 'horizontal-bar' | 'diagonal-layout' | 'stacked-compact' | 'stacked-wide' | 'stacked-minimal';
export type GoldGenerationStyle = 'matrix-badge' | 'command-line' | 'energy-display' | 'split-panels' | 'holographic-readout' | 'tech-metrics' | 'data-stream' | 'compact-table' | 'inline-metrics' | 'dense-grid' | 'stat-bar' | 'compact-table-v2' | 'compact-table-v3' | 'compact-table-v4';
export type CombinedGoldCardStyle = 'vertical-stacked' | 'side-by-side' | 'dashboard-grid' | 'hero-emphasis' | 'elegant-split' | 'cascade-accumulation' | 'energy-conduit' | 'clean-horizontal' | 'stacked-minimal' | 'badge-pair' | 'diagonal-split' | 'compact-density' | 'overlapping-layers' | 'compact-density-v1' | 'compact-density-v2' | 'compact-density-v3' | 'compact-density-v4' | 'compact-density-v5' | 'compact-density-v3-layout1' | 'compact-density-v3-layout2' | 'compact-density-v3-layout3' | 'compact-density-v3-layout4' | 'compact-density-v3-layout5';
export type StatsLayoutStyle = 'inline-dot' | 'vertical-divider' | 'badge-pills' | 'label-above' | 'glow-separator';
export type TenureLevelStyle = 'classic-side-labels' | 'stacked-compact' | 'inline-badges' | 'vertical-emphasis' | 'minimal-centered' | 'hero-level-v1' | 'hero-level-v2' | 'hero-level-v3' | 'card-slide-up' | 'card-floating-badge' | 'card-inset-panel' | 'card-tech-plate';
export type StatusCardStyle = 'compact-minimal' | 'wide-badge' | 'vertical-stack' | 'tech-panel' | 'holographic-glow';

export { LevelProgressStyle };

interface MekProfileLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  styleVariation?: 'default' | 'variation1' | 'variation2';
  onStyleVariationChange?: (variation: 'default' | 'variation1' | 'variation2') => void;
  cardInteriorStyle?: CardInteriorStyle;
  onCardInteriorStyleChange?: (style: CardInteriorStyle) => void;
  buffDetailsLayout?: BuffDetailsLayout;
  onBuffDetailsLayoutChange?: (layout: BuffDetailsLayout) => void;
  designationCardStyle?: DesignationCardStyle;
  onDesignationCardStyleChange?: (style: DesignationCardStyle) => void;
  cumulativeGoldStyle?: CumulativeGoldStyle;
  onCumulativeGoldStyleChange?: (style: CumulativeGoldStyle) => void;
  cumulativeGoldFont?: string;
  goldGenerationStyle?: GoldGenerationStyle;
  onGoldGenerationStyleChange?: (style: GoldGenerationStyle) => void;
  combinedGoldCardStyle?: CombinedGoldCardStyle;
  onCombinedGoldCardStyleChange?: (style: CombinedGoldCardStyle) => void;
  showCombinedGoldCard?: boolean;
  levelProgressStyle?: LevelProgressStyle;
  onLevelProgressStyleChange?: (style: LevelProgressStyle) => void;
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
  headerDarkness?: number;
  headerBlur?: number;
  variationGlowIntensity?: number;
  variationGlowSize?: number;
  variationTextStyle?: 'hero-focus' | 'tech-readout' | 'minimal-labels' | 'data-grid' | 'compact-badge';
  onVariationTextStyleChange?: (style: 'hero-focus' | 'tech-readout' | 'minimal-labels' | 'data-grid' | 'compact-badge') => void;
  statsLayoutStyle?: StatsLayoutStyle;
  onStatsLayoutStyleChange?: (style: StatsLayoutStyle) => void;
  tenureLevelStyle?: TenureLevelStyle;
  onTenureLevelStyleChange?: (style: TenureLevelStyle) => void;
  statusCardStyle?: StatusCardStyle;
  onStatusCardStyleChange?: (style: StatusCardStyle) => void;
  // Abilities Tree props
  abilitiesTreeCategoryId?: string;
  abilitiesTreeTemplateId?: string;
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
  designationCardStyle = 'corner-brackets',
  onDesignationCardStyleChange,
  cumulativeGoldStyle = 'stacked-emphasis',
  onCumulativeGoldStyleChange,
  cumulativeGoldFont = 'Orbitron',
  goldGenerationStyle = 'matrix-badge',
  onGoldGenerationStyleChange,
  combinedGoldCardStyle = 'vertical-stacked',
  onCombinedGoldCardStyleChange,
  showCombinedGoldCard = false,
  levelProgressStyle = 'flat-bar',
  onLevelProgressStyleChange,
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
  useYellowGlow = true,
  headerDarkness = 50,
  headerBlur = 8,
  variationGlowIntensity = 0.6,
  variationGlowSize = 25,
  variationTextStyle = 'hero-focus',
  onVariationTextStyleChange,
  statsLayoutStyle = 'inline-dot',
  onStatsLayoutStyleChange,
  tenureLevelStyle = 'classic-side-labels',
  onTenureLevelStyleChange,
  statusCardStyle = 'compact-minimal',
  onStatusCardStyleChange,
  abilitiesTreeCategoryId,
  abilitiesTreeTemplateId
}: MekProfileLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [isEmployed, setIsEmployed] = useState(false);

  // Overlay rendering state and refs
  const overlayRef = useRef<HTMLImageElement>(null);
  const [overlaySize, setOverlaySize] = useState({ width: 0, height: 0 });

  // Query level colors from database
  const levelColors = useQuery(api.levelColors.getLevelColors) || DEFAULT_LEVEL_COLORS;

  // Load mek pfp overlay data from database
  const mekPfpOverlay = useQuery(api.overlays.getOverlay, { imageKey: "mek pfp" });

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

  // Render Status Card based on selected style
  const renderStatusCard = () => {
    // Neon edge color variables
    const accentColor = useYellowGlow ? 'text-yellow-400' : 'text-cyan-400';
    const accentColorDim = useYellowGlow ? 'text-yellow-400/60' : 'text-cyan-400/60';
    const borderColor = useYellowGlow ? 'border-yellow-400/50' : 'border-cyan-400/50';
    const glowRgba = useYellowGlow ? 'rgba(250, 182, 23, 0.3)' : 'rgba(0, 212, 255, 0.3)';
    const glowRgbaInset = useYellowGlow ? 'rgba(250, 182, 23, 0.1)' : 'rgba(0, 212, 255, 0.1)';
    const gradientColor = useYellowGlow ? 'rgba(250, 182, 23, 0.4)' : 'rgba(0, 212, 255, 0.4)';
    const textShadowColor = useYellowGlow
      ? '0 0 20px rgba(250, 182, 23, 1), 0 0 40px rgba(250, 182, 23, 0.5)'
      : '0 0 20px rgba(0, 212, 255, 1), 0 0 40px rgba(0, 212, 255, 0.5)';

    // Mock data for Tenure and Rate
    const tenure = "24d 3h";
    const rate = "10 T/h";

    switch (statusCardStyle) {
      case 'compact-minimal':
        return (
          <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
            {/* Glowing border */}
            <div
              className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
              style={{
                boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
                filter: 'blur(0.5px)'
              }}
            />

            {/* Gradient overlay */}
            <div
              className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
              style={{
                background: `linear-gradient(180deg, ${gradientColor} 0%, transparent 100%)`
              }}
            />

            <div className="relative z-10 grid grid-cols-2 gap-6">
              {/* LEFT: Stats */}
              <div className="space-y-2">
                <div className="space-y-1">
                  <div
                    className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    TENURE
                  </div>
                  <div
                    className="text-white text-sm"
                    style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                  >
                    {tenure}
                  </div>
                </div>
                <div className="space-y-1">
                  <div
                    className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    RATE
                  </div>
                  <div
                    className="text-white text-sm"
                    style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                  >
                    {rate}
                  </div>
                </div>
              </div>

              {/* RIGHT: Power Switch with Labels */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <div
                  className={`text-[9px] uppercase tracking-[0.2em] ${!isEmployed ? 'text-white/40' : 'text-white/20'}`}
                  style={{ fontFamily: 'Inter', fontWeight: 400 }}
                >
                  IDLE
                </div>
                <PowerSwitch
                  enabled={isEmployed}
                  onChange={setIsEmployed}
                />
                <div
                  className={`text-[9px] uppercase tracking-[0.2em] ${isEmployed ? accentColor : 'text-white/20'}`}
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    textShadow: isEmployed ? textShadowColor : 'none'
                  }}
                >
                  EMPLOYED
                </div>
              </div>
            </div>
          </div>
        );

      case 'wide-badge':
        return (
          <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
            {/* Glowing border */}
            <div
              className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
              style={{
                boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
                filter: 'blur(0.5px)'
              }}
            />

            {/* Gradient overlay */}
            <div
              className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
              style={{
                background: `linear-gradient(180deg, ${gradientColor} 0%, transparent 100%)`
              }}
            />

            <div className="relative z-10 space-y-4">
              {/* Top: Stats in badges */}
              <div className="flex gap-3 justify-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 bg-black/60 border ${borderColor} rounded-sm`}>
                  <div
                    className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    TENURE
                  </div>
                  <div
                    className="text-white text-sm"
                    style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                  >
                    {tenure}
                  </div>
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 bg-black/60 border ${borderColor} rounded-sm`}>
                  <div
                    className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    RATE
                  </div>
                  <div
                    className="text-white text-sm"
                    style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                  >
                    {rate}
                  </div>
                </div>
              </div>

              {/* Bottom: Power Switch */}
              <div className="flex flex-col items-center space-y-2">
                <div
                  className={`text-[9px] uppercase tracking-[0.2em] ${!isEmployed ? 'text-white/40' : 'text-white/20'}`}
                  style={{ fontFamily: 'Inter', fontWeight: 400 }}
                >
                  IDLE
                </div>
                <PowerSwitch
                  enabled={isEmployed}
                  onChange={setIsEmployed}
                />
                <div
                  className={`text-[9px] uppercase tracking-[0.2em] ${isEmployed ? accentColor : 'text-white/20'}`}
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    textShadow: isEmployed ? textShadowColor : 'none'
                  }}
                >
                  EMPLOYED
                </div>
              </div>
            </div>
          </div>
        );

      case 'vertical-stack':
        return (
          <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
            {/* Glowing border */}
            <div
              className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
              style={{
                boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
                filter: 'blur(0.5px)'
              }}
            />

            {/* Gradient overlay */}
            <div
              className="absolute top-0 left-0 right-0 h-32 opacity-20 pointer-events-none"
              style={{
                background: `linear-gradient(180deg, ${gradientColor} 0%, transparent 100%)`
              }}
            />

            <div className="relative z-10 space-y-5 text-center">
              {/* Status Label at Top */}
              <div
                className={`text-2xl uppercase tracking-wider ${isEmployed ? accentColor : 'text-white/40'}`}
                style={{
                  fontFamily: 'Saira Condensed',
                  fontWeight: 200,
                  letterSpacing: '0.1em',
                  textShadow: isEmployed ? textShadowColor : 'none'
                }}
              >
                {isEmployed ? 'EMPLOYED' : 'IDLE'}
              </div>

              {/* Power Switch */}
              <div className="flex justify-center">
                <PowerSwitch
                  enabled={isEmployed}
                  onChange={setIsEmployed}
                />
              </div>

              {/* Stats at Bottom */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
                <div className="space-y-1">
                  <div
                    className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    TENURE
                  </div>
                  <div
                    className="text-white text-sm"
                    style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                  >
                    {tenure}
                  </div>
                </div>
                <div className="space-y-1">
                  <div
                    className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    RATE
                  </div>
                  <div
                    className="text-white text-sm"
                    style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                  >
                    {rate}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'tech-panel':
        return (
          <div className="relative p-5 bg-black/40 backdrop-blur-sm overflow-hidden">
            {/* Glowing border */}
            <div
              className={`absolute inset-0 border ${borderColor} pointer-events-none`}
              style={{
                boxShadow: `0 0 20px ${glowRgba}, inset 0 0 20px ${glowRgbaInset}`,
                filter: 'blur(0.5px)'
              }}
            />

            {/* Scan lines effect */}
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
              }}
            />

            <div className="relative z-10">
              {/* Header with status */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div
                  className="text-[10px] text-white/40 uppercase tracking-[0.3em]"
                  style={{ fontFamily: 'Inter', fontWeight: 400 }}
                >
                  STATUS
                </div>
                <div
                  className={`text-xs uppercase tracking-wider ${isEmployed ? accentColor : 'text-white/40'}`}
                  style={{
                    fontFamily: 'Saira Condensed',
                    fontWeight: 300,
                    textShadow: isEmployed ? textShadowColor : 'none'
                  }}
                >
                  {isEmployed ? 'EMPLOYED' : 'IDLE'}
                </div>
              </div>

              {/* Grid layout */}
              <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                {/* Left: Stats */}
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <div
                      className="text-[8px] text-white/40 uppercase tracking-[0.3em] w-16"
                      style={{ fontFamily: 'Inter', fontWeight: 400 }}
                    >
                      TENURE
                    </div>
                    <div
                      className="text-white text-xs"
                      style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                    >
                      {tenure}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div
                      className="text-[8px] text-white/40 uppercase tracking-[0.3em] w-16"
                      style={{ fontFamily: 'Inter', fontWeight: 400 }}
                    >
                      RATE
                    </div>
                    <div
                      className="text-white text-xs"
                      style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                    >
                      {rate}
                    </div>
                  </div>
                </div>

                {/* Right: Power Switch */}
                <div className="flex flex-col items-center space-y-1">
                  <PowerSwitch
                    enabled={isEmployed}
                    onChange={setIsEmployed}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'holographic-glow':
        return (
          <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
            {/* Intense glowing border */}
            <div
              className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
              style={{
                boxShadow: `0 0 40px ${glowRgba}, 0 0 60px ${glowRgba}, inset 0 0 40px ${glowRgbaInset}`,
                filter: 'blur(1px)'
              }}
            />

            {/* Strong gradient overlay */}
            <div
              className="absolute top-0 left-0 right-0 h-32 opacity-30 pointer-events-none"
              style={{
                background: `linear-gradient(180deg, ${gradientColor} 0%, transparent 100%)`
              }}
            />

            {/* Radial glow from center */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none opacity-20"
              style={{
                background: `radial-gradient(circle, ${gradientColor} 0%, transparent 70%)`
              }}
            />

            <div className="relative z-10 space-y-4">
              {/* Hero status display */}
              <div className="text-center space-y-2">
                <div
                  className={`text-4xl uppercase tracking-wider ${isEmployed ? accentColor : 'text-white/40'}`}
                  style={{
                    fontFamily: 'Saira Condensed',
                    fontWeight: 200,
                    letterSpacing: '0.15em',
                    textShadow: isEmployed ? `0 0 30px ${useYellowGlow ? 'rgba(250, 182, 23, 1)' : 'rgba(0, 212, 255, 1)'}, 0 0 60px ${useYellowGlow ? 'rgba(250, 182, 23, 0.5)' : 'rgba(0, 212, 255, 0.5)'}` : 'none'
                  }}
                >
                  {isEmployed ? 'EMPLOYED' : 'IDLE'}
                </div>
              </div>

              {/* Power Switch */}
              <div className="flex justify-center">
                <PowerSwitch
                  enabled={isEmployed}
                  onChange={setIsEmployed}
                />
              </div>

              {/* Stats with intense glow */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center space-y-1">
                  <div
                    className={`text-[10px] uppercase tracking-[0.3em] ${accentColorDim}`}
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    TENURE
                  </div>
                  <div
                    className={`text-sm ${accentColor}`}
                    style={{
                      fontFamily: 'Saira Condensed',
                      fontWeight: 300,
                      textShadow: `0 0 10px ${useYellowGlow ? 'rgba(250, 182, 23, 0.5)' : 'rgba(0, 212, 255, 0.5)'}`
                    }}
                  >
                    {tenure}
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <div
                    className={`text-[10px] uppercase tracking-[0.3em] ${accentColorDim}`}
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    RATE
                  </div>
                  <div
                    className={`text-sm ${accentColor}`}
                    style={{
                      fontFamily: 'Saira Condensed',
                      fontWeight: 300,
                      textShadow: `0 0 10px ${useYellowGlow ? 'rgba(250, 182, 23, 0.5)' : 'rgba(0, 212, 255, 0.5)'}`
                    }}
                  >
                    {rate}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return renderStatusCard(); // Fallback to compact-minimal
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

    // Style 4: Holographic Overlay - Translucent panels with scan lines
    if (designationCardStyle === 'holographic-overlay') {
      return (
        <div className="relative p-6 bg-black/30 backdrop-blur-md border border-white/10 overflow-hidden">
          {/* Animated scanline effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, transparent 1px, transparent 2px, rgba(255,255,255,0.03) 3px)`,
              animation: 'scanline 6s linear infinite'
            }}
          />

          {/* Holographic shimmer */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background: `linear-gradient(45deg, transparent 30%, ${useYellowGlow ? 'rgba(250, 182, 23, 0.1)' : 'rgba(0, 212, 255, 0.1)'} 50%, transparent 70%)`,
              animation: 'shimmer 3s ease-in-out infinite'
            }}
          />

          {/* Content */}
          <div className="relative z-10 space-y-4">
            {/* Top row: Mekanism and Rank */}
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                  MEKANISM
                </div>
                <div className="text-white text-xl" style={{ fontFamily: 'Saira Condensed', fontWeight: 200 }}>
                  #{mekData.mekNumber}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                  RANK
                </div>
                <div
                  className={`${accentColor} text-3xl`}
                  style={{
                    fontFamily: 'Saira Condensed',
                    fontWeight: 200,
                    textShadow: textShadowGlow
                  }}
                >
                  {mekData.rank}
                </div>
              </div>
            </div>

            {/* Divider line with glow */}
            <div className={`h-px bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400/50' : 'via-cyan-400/50'} to-transparent`} />

            {/* Corporation */}
            <div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                CORPORATION
              </div>
              <div className="text-white text-sm" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                {mekData.corporation}
              </div>
            </div>

            {/* Employee ID */}
            <div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                EMPLOYEE ID
              </div>
              <div className="text-white text-base tracking-wide" style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}>
                {mekData.employeeId}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Style 5: Cyber Minimal - Ultra-clean, sharp corners
    if (designationCardStyle === 'cyber-minimal') {
      return (
        <div className={`relative p-5 bg-black/60 border-2 ${borderColor}`}>
          {/* Sharp corner accents */}
          <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${borderColor}`} />
          <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${borderColor}`} />
          <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 ${borderColor}`} />
          <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${borderColor}`} />

          <div className="space-y-3">
            {/* Rank - Hero element */}
            <div className="text-center pb-3 border-b border-white/10">
              <div className={`text-[10px] ${accentColorDim} uppercase tracking-[0.2em] mb-2`} style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                RANK
              </div>
              <div
                className={`${accentColor} text-5xl`}
                style={{
                  fontFamily: 'Saira Condensed',
                  fontWeight: 200,
                  textShadow: textShadowGlow,
                  letterSpacing: '0.05em'
                }}
              >
                {mekData.rank}
              </div>
            </div>

            {/* Data grid */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-[9px] text-white/30 uppercase mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                  MEKANISM
                </div>
                <div className="text-white text-sm" style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}>
                  #{mekData.mekNumber}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-white/30 uppercase mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                  CORP
                </div>
                <div className="text-white text-xs" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                  {mekData.corporation}
                </div>
              </div>
            </div>

            {/* Employee ID - full width */}
            <div className="text-center pt-2 border-t border-white/10">
              <div className="text-[9px] text-white/30 uppercase mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                ID
              </div>
              <div className="text-white text-base tracking-wider" style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}>
                {mekData.employeeId}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Style 6: Tech Frame - Industrial frame with corner bolts
    if (designationCardStyle === 'tech-frame') {
      return (
        <div className="relative p-6 bg-gradient-to-br from-black/70 to-black/50 border border-gray-700/50">
          {/* Corner bolt indicators */}
          <div className={`absolute top-2 left-2 w-2 h-2 rounded-full ${useYellowGlow ? 'bg-yellow-400' : 'bg-cyan-400'}`} style={{ boxShadow: `0 0 8px ${useYellowGlow ? 'rgba(250, 182, 23, 0.6)' : 'rgba(0, 212, 255, 0.6)'}` }} />
          <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${useYellowGlow ? 'bg-yellow-400' : 'bg-cyan-400'}`} style={{ boxShadow: `0 0 8px ${useYellowGlow ? 'rgba(250, 182, 23, 0.6)' : 'rgba(0, 212, 255, 0.6)'}` }} />
          <div className={`absolute bottom-2 left-2 w-2 h-2 rounded-full ${useYellowGlow ? 'bg-yellow-400' : 'bg-cyan-400'}`} style={{ boxShadow: `0 0 8px ${useYellowGlow ? 'rgba(250, 182, 23, 0.6)' : 'rgba(0, 212, 255, 0.6)'}` }} />
          <div className={`absolute bottom-2 right-2 w-2 h-2 rounded-full ${useYellowGlow ? 'bg-yellow-400' : 'bg-cyan-400'}`} style={{ boxShadow: `0 0 8px ${useYellowGlow ? 'rgba(250, 182, 23, 0.6)' : 'rgba(0, 212, 255, 0.6)'}` }} />

          {/* Metal frame bars */}
          <div className={`absolute top-0 left-6 right-6 h-px ${useYellowGlow ? 'bg-yellow-400/30' : 'bg-cyan-400/30'}`} />
          <div className={`absolute bottom-0 left-6 right-6 h-px ${useYellowGlow ? 'bg-yellow-400/30' : 'bg-cyan-400/30'}`} />
          <div className={`absolute left-0 top-6 bottom-6 w-px ${useYellowGlow ? 'bg-yellow-400/30' : 'bg-cyan-400/30'}`} />
          <div className={`absolute right-0 top-6 bottom-6 w-px ${useYellowGlow ? 'bg-yellow-400/30' : 'bg-cyan-400/30'}`} />

          <div className="space-y-3">
            {/* Rank bar - prominent */}
            <div className={`flex items-center gap-3 p-3 bg-black/40 border-l-4 ${useYellowGlow ? 'border-yellow-400' : 'border-cyan-400'}`}>
              <div className="flex-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                  RANK
                </div>
                <div
                  className={`${accentColor} text-3xl`}
                  style={{
                    fontFamily: 'Saira Condensed',
                    fontWeight: 200,
                    textShadow: textShadowGlow
                  }}
                >
                  {mekData.rank}
                </div>
              </div>
            </div>

            {/* Mekanism */}
            <div className="flex items-center gap-3 p-3 bg-black/20">
              <div className="flex-1">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                  MEKANISM
                </div>
                <div className="text-white text-lg" style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}>
                  #{mekData.mekNumber}
                </div>
              </div>
            </div>

            {/* Corporation */}
            <div className="flex items-center gap-3 p-3 bg-black/20">
              <div className="flex-1">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                  CORPORATION
                </div>
                <div className="text-white text-sm" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                  {mekData.corporation}
                </div>
              </div>
            </div>

            {/* Employee ID */}
            <div className="flex items-center gap-3 p-3 bg-black/20">
              <div className="flex-1">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                  EMPLOYEE ID
                </div>
                <div className="text-white text-base tracking-wide" style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}>
                  {mekData.employeeId}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Style 7: Neon Edge - Glowing borders with gradient overlays
    if (designationCardStyle === 'neon-edge') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          {/* Glowing border effect */}
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />

          {/* Gradient overlay accent */}
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? 'rgba(250, 182, 23, 0.4)' : 'rgba(0, 212, 255, 0.4)'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10 space-y-4">
            {/* Rank - Massive and glowing */}
            <div className="text-center">
              <div
                className={`${accentColor} text-6xl leading-none mb-2`}
                style={{
                  fontFamily: 'Saira Condensed',
                  fontWeight: 200,
                  textShadow: `0 0 20px ${useYellowGlow ? 'rgba(250, 182, 23, 1)' : 'rgba(0, 212, 255, 1)'}, 0 0 40px ${useYellowGlow ? 'rgba(250, 182, 23, 0.5)' : 'rgba(0, 212, 255, 0.5)'}`,
                  letterSpacing: '0.1em'
                }}
              >
                {mekData.rank}
              </div>
              <div className={`text-[10px] ${accentColorDim} uppercase tracking-[0.3em]`} style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                RANK
              </div>
            </div>

            {/* Horizontal divider with glow */}
            <div className="relative h-px">
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400' : 'via-cyan-400'} to-transparent`} style={{ filter: 'blur(1px)' }} />
            </div>

            {/* Data fields in grid */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-[9px] text-white/40 uppercase mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                  MEK
                </div>
                <div className="text-white text-sm" style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}>
                  #{mekData.mekNumber}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-[9px] text-white/40 uppercase mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                  CORPORATION
                </div>
                <div className="text-white text-xs" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                  {mekData.corporation}
                </div>
              </div>
            </div>

            {/* Employee ID badge */}
            <div className="flex justify-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 bg-black/60 border ${borderColor} rounded-sm`}>
                <div className="text-[9px] text-white/40 uppercase" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                  ID
                </div>
                <div className="text-white text-sm tracking-wider" style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}>
                  {mekData.employeeId}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Style 8: Matrix Grid - Grid-based data display
    if (designationCardStyle === 'matrix-grid') {
      return (
        <div className="relative p-5 bg-black/50 backdrop-blur-sm border border-green-500/30 overflow-hidden">
          {/* Matrix-style background pattern */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, transparent 0px, rgba(0, 255, 65, 0.1) 1px, transparent 2px, transparent 20px),
                                repeating-linear-gradient(0deg, transparent 0px, rgba(0, 255, 65, 0.1) 1px, transparent 2px, transparent 20px)`
            }}
          />

          <div className="relative z-10">
            {/* Header with rank */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-green-500/20">
              <div className="text-[10px] text-green-400/60 uppercase tracking-[0.2em]" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                DESIGNATION
              </div>
              <div
                className="text-green-400 text-3xl"
                style={{
                  fontFamily: 'Saira Condensed',
                  fontWeight: 200,
                  textShadow: '0 0 10px rgba(0, 255, 65, 0.6)'
                }}
              >
                {mekData.rank}
              </div>
            </div>

            {/* Data matrix grid */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <div className="text-[9px] text-green-400/40 uppercase w-24" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                  MEK_NUM:
                </div>
                <div className="text-green-300 text-sm flex-1" style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}>
                  {mekData.mekNumber}
                </div>
              </div>

              <div className="flex items-baseline gap-3">
                <div className="text-[9px] text-green-400/40 uppercase w-24" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                  CORP_ID:
                </div>
                <div className="text-green-300 text-xs flex-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                  {mekData.corporation}
                </div>
              </div>

              <div className="flex items-baseline gap-3">
                <div className="text-[9px] text-green-400/40 uppercase w-24" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                  EMP_ID:
                </div>
                <div className="text-green-300 text-sm flex-1 tracking-wide" style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}>
                  {mekData.employeeId}
                </div>
              </div>

              <div className="flex items-baseline gap-3">
                <div className="text-[9px] text-green-400/40 uppercase w-24" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                  RANK:
                </div>
                <div className="text-green-400 text-lg flex-1" style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: '0 0 8px rgba(0, 255, 65, 0.4)' }}>
                  {mekData.rank}
                </div>
              </div>
            </div>

            {/* Status indicator */}
            <div className="mt-4 pt-3 border-t border-green-500/20 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: '0 0 8px rgba(0, 255, 65, 0.8)' }} />
              <div className="text-[9px] text-green-400/60 uppercase tracking-wider" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                ACTIVE
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (combinedGoldCardStyle === 'cascade-accumulation') {
      // DESIGN 1: CASCADE ACCUMULATION
      // Visual Metaphor: Gold rate flows down like water cascading into cumulative pools
      // Flow Narrative: Rate pours from top → cascades down visual channels → accumulates into cumulative totals

      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          {/* Glowing border effect */}
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />

          {/* Gradient overlay accent */}
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? 'rgba(250, 182, 23, 0.4)' : 'rgba(0, 212, 255, 0.4)'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10 space-y-6">
            {/* RATE SECTION - Source at top (water source) */}
            <div className="space-y-4">
              <div
                className={`text-[10px] ${accentColor} uppercase tracking-[0.3em] text-center`}
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                ◆ INCOME RATE ◆
              </div>

              {/* Rate components in horizontal flow */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div
                    className="text-[9px] text-white/40 uppercase mb-1 tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    BASE
                  </div>
                  <div
                    className="text-white text-sm"
                    style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                  >
                    {formatGoldRate(goldGenData.base)}
                  </div>
                </div>

                <div>
                  <div
                    className="text-[9px] text-green-400/60 uppercase mb-1 tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    BONUS
                  </div>
                  <div
                    className="text-green-400 text-sm"
                    style={{
                      fontFamily: 'Saira Condensed',
                      fontWeight: 300,
                      textShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                    }}
                  >
                    +{formatGoldRate(goldGenData.bonus)}
                  </div>
                </div>

                <div>
                  <div
                    className={`text-[9px] ${accentColor} uppercase mb-1 tracking-[0.2em]`}
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    TOTAL
                  </div>
                  <div
                    className={`${accentColor} text-xl`}
                    style={{
                      fontFamily: 'Saira Condensed',
                      fontWeight: 200,
                      textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`
                    }}
                  >
                    {formatGoldRate(goldGenData.total)}
                  </div>
                </div>
              </div>
            </div>

            {/* CASCADE VISUAL - Three vertical flow lines connecting rate to cumulative */}
            <div className="relative h-12 flex items-center justify-center">
              {/* Left cascade line */}
              <div className="absolute left-[16.66%] top-0 bottom-0 w-px">
                <div
                  className={`absolute inset-0 bg-gradient-to-b from-white ${useYellowGlow ? 'via-yellow-400/60' : 'via-cyan-400/60'} to-transparent`}
                  style={{ filter: 'blur(1px)' }}
                />
              </div>

              {/* Center cascade line (brightest) */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2">
                <div
                  className={`absolute inset-0 bg-gradient-to-b ${useYellowGlow ? 'from-yellow-400' : 'from-cyan-400'} to-transparent`}
                  style={{ filter: 'blur(2px)' }}
                />
              </div>

              {/* Right cascade line */}
              <div className="absolute left-[83.33%] top-0 bottom-0 w-px">
                <div
                  className={`absolute inset-0 bg-gradient-to-b from-white ${useYellowGlow ? 'via-yellow-400/60' : 'via-cyan-400/60'} to-transparent`}
                  style={{ filter: 'blur(1px)' }}
                />
              </div>

              {/* Flow direction indicator (chevron pointing down) */}
              <div className={`${accentColor} text-xl opacity-60`} style={{ fontFamily: 'Saira Condensed' }}>
                ▼
              </div>
            </div>

            {/* CUMULATIVE SECTION - Reservoir at bottom (water pools) */}
            <div className="space-y-4">
              <div
                className={`text-[10px] ${accentColor} uppercase tracking-[0.3em] text-center`}
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                ◆ ACCUMULATED ◆
              </div>

              {/* Cumulative pools side by side */}
              <div className="grid grid-cols-2 gap-6">
                {/* Current Corp pool (main reservoir) */}
                <div className="text-center bg-black/30 p-4 rounded-sm border border-white/10">
                  <div
                    className="text-[9px] text-white/40 uppercase mb-2 tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    CURRENT CORP
                  </div>
                  <div
                    className={`${accentColor} text-6xl leading-none`}
                    style={{
                      fontFamily: 'Saira Condensed',
                      fontWeight: 200,
                      textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`,
                      letterSpacing: '0.1em'
                    }}
                  >
                    {formatGold(currentOwnerGold)}
                  </div>
                </div>

                {/* All-Time pool (overflow reservoir) */}
                <div className="text-center bg-black/30 p-4 rounded-sm border border-white/10">
                  <div
                    className="text-[9px] text-white/40 uppercase mb-2 tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    ALL-TIME
                  </div>
                  <div
                    className="text-white text-3xl leading-none"
                    style={{
                      fontFamily: 'Saira Condensed',
                      fontWeight: 200,
                      letterSpacing: '0.05em'
                    }}
                  >
                    {formatGold(allTimeGold)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (combinedGoldCardStyle === 'energy-conduit') {
      // DESIGN 2: ENERGY CONDUIT
      // Visual Metaphor: Rate is energy flowing through conduits that charge cumulative capacitors
      // Flow Narrative: Rate metrics connect via glowing energy lines → feed into cumulative displays as charging batteries

      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          {/* Glowing border effect */}
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />

          {/* Gradient overlay accent */}
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? 'rgba(250, 182, 23, 0.4)' : 'rgba(0, 212, 255, 0.4)'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10">
            {/* HORIZONTAL LAYOUT: Left (Rate) → Center (Conduit) → Right (Cumulative) */}
            <div className="grid grid-cols-[1fr_80px_1fr] gap-4 items-center">

              {/* LEFT: RATE SECTION (Energy Source) */}
              <div className="space-y-3">
                <div
                  className={`text-[10px] ${accentColor} uppercase tracking-[0.3em] text-center pb-2`}
                  style={{ fontFamily: 'Inter', fontWeight: 400 }}
                >
                  ENERGY SOURCE
                </div>

                {/* Rate breakdown vertically stacked */}
                <div className="space-y-3 bg-black/30 p-4 rounded-sm border border-white/10">
                  {/* Base */}
                  <div className="flex justify-between items-center">
                    <div
                      className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                      style={{ fontFamily: 'Inter', fontWeight: 400 }}
                    >
                      BASE
                    </div>
                    <div
                      className="text-white text-sm"
                      style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                    >
                      {formatGoldRate(goldGenData.base)}
                    </div>
                  </div>

                  {/* Bonus */}
                  <div className="flex justify-between items-center">
                    <div
                      className="text-[9px] text-green-400/60 uppercase tracking-[0.2em]"
                      style={{ fontFamily: 'Inter', fontWeight: 400 }}
                    >
                      BONUS
                    </div>
                    <div
                      className="text-green-400 text-sm"
                      style={{
                        fontFamily: 'Saira Condensed',
                        fontWeight: 300,
                        textShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                      }}
                    >
                      +{formatGoldRate(goldGenData.bonus)}
                    </div>
                  </div>

                  {/* Divider with pulse */}
                  <div className="relative h-px">
                    <div
                      className={`absolute inset-0 bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400' : 'via-cyan-400'} to-transparent`}
                      style={{ filter: 'blur(1px)' }}
                    />
                  </div>

                  {/* Total (output) */}
                  <div className="flex justify-between items-center">
                    <div
                      className={`text-[9px] ${accentColor} uppercase tracking-[0.2em]`}
                      style={{ fontFamily: 'Inter', fontWeight: 400 }}
                    >
                      OUTPUT
                    </div>
                    <div
                      className={`${accentColor} text-xl`}
                      style={{
                        fontFamily: 'Saira Condensed',
                        fontWeight: 200,
                        textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`
                      }}
                    >
                      {formatGoldRate(goldGenData.total)}
                    </div>
                  </div>
                </div>
              </div>

              {/* CENTER: ENERGY CONDUIT (Visual connection) */}
              <div className="flex flex-col items-center justify-center h-full py-4">
                {/* Horizontal energy flow lines */}
                <div className="relative w-full h-full flex flex-col justify-center space-y-4">
                  {/* Top conduit */}
                  <div className="relative h-px">
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${useYellowGlow ? 'from-yellow-400/60 via-yellow-400 to-yellow-400/60' : 'from-cyan-400/60 via-cyan-400 to-cyan-400/60'}`}
                      style={{ filter: 'blur(1.5px)' }}
                    />
                  </div>

                  {/* Center conduit (main flow - brightest) */}
                  <div className="relative h-px">
                    <div
                      className={`absolute inset-0 ${useYellowGlow ? 'bg-yellow-400' : 'bg-cyan-400'}`}
                      style={{ filter: 'blur(2px)', boxShadow: `0 0 10px ${glowRgba}` }}
                    />
                  </div>

                  {/* Bottom conduit */}
                  <div className="relative h-px">
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${useYellowGlow ? 'from-yellow-400/60 via-yellow-400 to-yellow-400/60' : 'from-cyan-400/60 via-cyan-400 to-cyan-400/60'}`}
                      style={{ filter: 'blur(1.5px)' }}
                    />
                  </div>
                </div>

                {/* Flow direction indicator */}
                <div className={`${accentColor} text-2xl mt-2`} style={{ fontFamily: 'Saira Condensed' }}>
                  ▶
                </div>
              </div>

              {/* RIGHT: CUMULATIVE SECTION (Energy Storage) */}
              <div className="space-y-3">
                <div
                  className={`text-[10px] ${accentColor} uppercase tracking-[0.3em] text-center pb-2`}
                  style={{ fontFamily: 'Inter', fontWeight: 400 }}
                >
                  CAPACITORS
                </div>

                {/* Cumulative values vertically stacked like battery levels */}
                <div className="space-y-4">
                  {/* Current Corp capacitor (primary charge) */}
                  <div className="bg-black/30 p-4 rounded-sm border border-white/10 relative overflow-hidden">
                    {/* Charge level indicator (filled background) */}
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        background: `linear-gradient(to right, ${useYellowGlow ? 'rgba(250, 182, 23, 0.3)' : 'rgba(0, 212, 255, 0.3)'} 0%, transparent 100%)`
                      }}
                    />

                    <div className="relative z-10 text-center">
                      <div
                        className="text-[9px] text-white/40 uppercase mb-2 tracking-[0.2em]"
                        style={{ fontFamily: 'Inter', fontWeight: 400 }}
                      >
                        CURRENT CORP
                      </div>
                      <div
                        className={`${accentColor} text-6xl leading-none`}
                        style={{
                          fontFamily: 'Saira Condensed',
                          fontWeight: 200,
                          textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`,
                          letterSpacing: '0.1em'
                        }}
                      >
                        {formatGold(currentOwnerGold)}
                      </div>
                    </div>
                  </div>

                  {/* All-Time capacitor (total charge) */}
                  <div className="bg-black/30 p-4 rounded-sm border border-white/10 relative overflow-hidden">
                    {/* Charge level indicator */}
                    <div
                      className="absolute inset-0 opacity-5"
                      style={{
                        background: `linear-gradient(to right, rgba(255, 255, 255, 0.2) 0%, transparent 100%)`
                      }}
                    />

                    <div className="relative z-10 text-center">
                      <div
                        className="text-[9px] text-white/40 uppercase mb-2 tracking-[0.2em]"
                        style={{ fontFamily: 'Inter', fontWeight: 400 }}
                      >
                        ALL-TIME TOTAL
                      </div>
                      <div
                        className="text-white text-3xl leading-none"
                        style={{
                          fontFamily: 'Saira Condensed',
                          fontWeight: 200,
                          letterSpacing: '0.05em'
                        }}
                      >
                        {formatGold(allTimeGold)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }


    return null;
  };

  // Render Cumulative Gold Card with 5 different styles
  const renderCumulativeGoldCard = () => {
    // Data with whole numbers (no decimals)
    const currentOwnerGold = Math.floor(12869);
    const allTimeGold = Math.floor(458414);

    // Format with commas and "G" suffix
    const formatGold = (num: number) => num.toLocaleString('en-US') + ' G';

    // Dynamic colors based on useYellowGlow
    const accentColor = useYellowGlow ? 'text-yellow-400' : 'text-cyan-400';
    const accentColorDim = useYellowGlow ? 'text-yellow-400/60' : 'text-cyan-400/60';
    const borderColor = useYellowGlow ? 'border-yellow-400/50' : 'border-cyan-400/50';
    const glowRgba = useYellowGlow ? 'rgba(250, 182, 23, 0.3)' : 'rgba(0, 212, 255, 0.3)';
    const glowRgbaInset = useYellowGlow ? 'rgba(250, 182, 23, 0.1)' : 'rgba(0, 212, 255, 0.1)';
    const textShadowGlow = useYellowGlow ? '0 0 15px rgba(250, 182, 23, 0.8)' : '0 0 15px rgba(0, 212, 255, 0.8)';
    const bgGradientFrom = useYellowGlow ? 'from-yellow-500/10' : 'from-cyan-500/10';

    // Style 1: Stacked Emphasis (locked fonts: Saira Condensed for current, Inter for all-time)
    if (cumulativeGoldStyle === 'stacked-emphasis') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm border border-yellow-500/40">
          {/* Border glow effect */}
          <div
            className={`absolute inset-0 border ${borderColor} pointer-events-none`}
            style={{ boxShadow: `0 0 20px ${glowRgba}, inset 0 0 20px ${glowRgbaInset}` }}
          />

          {/* Content */}
          <div className="relative z-10 space-y-3">
            {/* Title */}
            <div className={`text-[10px] ${accentColorDim} uppercase tracking-widest font-mono text-center mb-2`}>
              CUMULATIVE GOLD
            </div>

            {/* Current Corp - BIG and prominent */}
            <div className="text-center">
              <div className="text-[9px] text-gray-400 uppercase tracking-wider font-mono mb-1">
                Current Corp
              </div>
              <div
                className={`${accentColor} text-3xl`}
                style={{
                  textShadow: textShadowGlow,
                  fontFamily: 'Saira Condensed',
                  fontWeight: 200
                }}
              >
                {formatGold(currentOwnerGold)}
              </div>
            </div>

            {/* All-time - smaller, subdued */}
            <div className="text-center pt-2 border-t border-yellow-500/20">
              <div className="text-[9px] text-gray-500 uppercase tracking-wider font-mono mb-1">
                all-time
              </div>
              <div className="text-white text-base" style={{
                fontFamily: 'Inter',
                fontWeight: 400
              }}>
                {formatGold(allTimeGold)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Style 2: Side Split
    if (cumulativeGoldStyle === 'side-split') {
      const dividerColor = useYellowGlow ? 'via-yellow-500/50' : 'via-cyan-500/50';
      const dividerShadow = useYellowGlow ? '0 0 10px rgba(250, 182, 23, 0.5)' : '0 0 10px rgba(0, 212, 255, 0.5)';

      return (
        <div className={`relative p-4 bg-gradient-to-r from-black/60 via-black/40 to-black/60 backdrop-blur-sm border ${borderColor}`}>
          {/* Title spanning full width */}
          <div className={`text-[10px] ${accentColorDim} uppercase tracking-widest font-mono text-center mb-4`}>
            CUMULATIVE GOLD
          </div>

          {/* Split layout */}
          <div className="relative z-10 grid grid-cols-2 gap-4">
            {/* Left: Current Owner - BIG */}
            <div className="text-center">
              <div
                className={`${accentColor} text-2xl font-mono font-black`}
                style={{ textShadow: textShadowGlow }}
              >
                {formatGold(currentOwnerGold)}
              </div>
              <div className={`text-[9px] ${accentColorDim} uppercase tracking-wider font-mono mt-1`}>
                current
              </div>
            </div>

            {/* Vertical Divider with glow */}
            <div className="absolute left-1/2 top-8 bottom-0 w-px bg-gradient-to-b from-transparent ${dividerColor} to-transparent -translate-x-1/2"
                 style={{ boxShadow: dividerShadow }}
            />

            {/* Right: All-time - smaller */}
            <div className="text-center">
              <div className="text-white text-lg font-mono font-semibold">
                {formatGold(allTimeGold)}
              </div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wider font-mono mt-1">
                all-time
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Style 3: Badge Style
    if (cumulativeGoldStyle === 'badge-style') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm border border-yellow-500/40">
          {/* Border glow effect */}
          <div
            className={`absolute inset-0 border ${borderColor} pointer-events-none`}
            style={{ boxShadow: `0 0 20px ${glowRgba}, inset 0 0 20px ${glowRgbaInset}` }}
          />

          {/* Content */}
          <div className="relative z-10 space-y-4">
            {/* Title as glowing badge */}
            <div className="flex justify-center">
              <div className={`inline-block bg-gradient-to-r ${bgGradientFrom} to-transparent border ${borderColor} px-3 py-1 text-[10px] ${accentColor} uppercase tracking-widest font-mono`}>
                CUMULATIVE GOLD
              </div>
            </div>

            {/* Current Corp - BIG centered number */}
            <div className="text-center">
              <div className="text-[9px] text-gray-400 uppercase tracking-wider font-mono mb-1">
                Current Corp
              </div>
              <div
                className={`${accentColor} text-4xl`}
                style={{
                  textShadow: textShadowGlow,
                  fontFamily: 'Saira Condensed',
                  fontWeight: 200
                }}
              >
                {formatGold(currentOwnerGold)}
              </div>
            </div>

            {/* All-time as small badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 bg-black/60 border border-gray-600/40 px-3 py-1.5 rounded-sm">
                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">
                  all-time
                </span>
                <span className="text-white text-sm" style={{
                  fontFamily: 'Inter',
                  fontWeight: 400
                }}>
                  {formatGold(allTimeGold)}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Style 4: Horizontal Bar
    if (cumulativeGoldStyle === 'horizontal-bar') {
      const borderLeftColor = useYellowGlow ? 'border-yellow-500' : 'border-cyan-500';

      return (
        <div className={`relative p-4 bg-black/40 backdrop-blur-sm border ${borderColor} border-l-4 ${borderLeftColor}`}>
          {/* Horizontal layout */}
          <div className="flex items-center gap-6">
            {/* Title on left */}
            <div className={`text-[10px] ${accentColorDim} uppercase tracking-widest font-mono whitespace-nowrap`}>
              CUMULATIVE<br />GOLD
            </div>

            {/* Separator */}
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-yellow-500/50 to-transparent"></div>

            {/* Current in center - BIG */}
            <div className="flex-1 text-center">
              <div
                className={`${accentColor} text-2xl font-mono font-black`}
                style={{ textShadow: textShadowGlow }}
              >
                {formatGold(currentOwnerGold)}
              </div>
              <div className={`text-[9px] ${accentColorDim} uppercase tracking-wider font-mono mt-0.5`}>
                current
              </div>
            </div>

            {/* Separator */}
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-yellow-500/50 to-transparent"></div>

            {/* All-time on right - small */}
            <div className="text-right">
              <div className="text-white text-base font-mono font-semibold">
                {formatGold(allTimeGold)}
              </div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wider font-mono mt-0.5">
                all-time
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Style 5: Diagonal Layout
    if (cumulativeGoldStyle === 'diagonal-layout') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm border border-yellow-500/40 overflow-hidden">
          {/* Border glow effect */}
          <div
            className={`absolute inset-0 border ${borderColor} pointer-events-none`}
            style={{ boxShadow: `0 0 20px ${glowRgba}, inset 0 0 20px ${glowRgbaInset}` }}
          />

          {/* Diagonal background element */}
          <div
            className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${bgGradientFrom} to-transparent opacity-20`}
            style={{ transform: 'rotate(25deg) translateX(20px) translateY(-40px)' }}
          />

          {/* Content */}
          <div className="relative z-10 space-y-4">
            {/* Title at angle */}
            <div
              className={`text-[10px] ${accentColorDim} uppercase tracking-widest font-mono inline-block`}
              style={{ transform: 'skewX(-5deg)' }}
            >
              CUMULATIVE GOLD
            </div>

            {/* Current Owner - large and tilted slightly */}
            <div className="text-center">
              <div
                className={`${accentColor} text-3xl font-mono font-black inline-block`}
                style={{
                  textShadow: textShadowGlow,
                  transform: 'skewX(-2deg)'
                }}
              >
                {formatGold(currentOwnerGold)}
              </div>
            </div>

            {/* All-time tucked in corner */}
            <div className="absolute bottom-2 right-2 text-right bg-black/60 px-2 py-1 border-l-2 border-gray-600/40">
              <div className="text-[8px] text-gray-500 uppercase tracking-wider font-mono">
                all-time
              </div>
              <div className="text-white text-xs font-mono font-semibold">
                {formatGold(allTimeGold)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // NEW Style 6: Stacked Compact - tighter spacing, smaller overall
    if (cumulativeGoldStyle === 'stacked-compact') {
      return (
        <div className="relative p-4 bg-black/40 backdrop-blur-sm border border-yellow-500/40">
          {/* Border glow effect */}
          <div
            className={`absolute inset-0 border ${borderColor} pointer-events-none`}
            style={{ boxShadow: `0 0 15px ${glowRgba}, inset 0 0 15px ${glowRgbaInset}` }}
          />

          {/* Content */}
          <div className="relative z-10 space-y-2">
            {/* Title */}
            <div className={`text-[9px] ${accentColorDim} uppercase tracking-widest font-mono text-center mb-1`}>
              CUMULATIVE GOLD
            </div>

            {/* Current Corp - BIG and prominent */}
            <div className="text-center">
              <div className="text-[8px] text-gray-400 uppercase tracking-wider font-mono mb-0.5">
                Current Corp
              </div>
              <div
                className={`${accentColor} text-2xl`}
                style={{
                  textShadow: textShadowGlow,
                  fontFamily: 'Saira Condensed',
                  fontWeight: 200
                }}
              >
                {formatGold(currentOwnerGold)}
              </div>
            </div>

            {/* All-time - smaller, subdued */}
            <div className="text-center pt-1.5 border-t border-yellow-500/20">
              <div className="text-[8px] text-gray-500 uppercase tracking-wider font-mono mb-0.5">
                all-time
              </div>
              <div className="text-white text-sm" style={{
                fontFamily: 'Inter',
                fontWeight: 400
              }}>
                {formatGold(allTimeGold)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // NEW Style 7: Stacked Wide - wider layout with more breathing room
    if (cumulativeGoldStyle === 'stacked-wide') {
      return (
        <div className="relative p-8 bg-black/40 backdrop-blur-sm border border-yellow-500/40">
          {/* Border glow effect */}
          <div
            className={`absolute inset-0 border ${borderColor} pointer-events-none`}
            style={{ boxShadow: `0 0 25px ${glowRgba}, inset 0 0 25px ${glowRgbaInset}` }}
          />

          {/* Content */}
          <div className="relative z-10 space-y-4">
            {/* Title */}
            <div className={`text-[11px] ${accentColorDim} uppercase tracking-widest font-mono text-center mb-3`}>
              CUMULATIVE GOLD
            </div>

            {/* Current Corp - BIG and prominent */}
            <div className="text-center">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider font-mono mb-2">
                Current Corp
              </div>
              <div
                className={`${accentColor} text-4xl`}
                style={{
                  textShadow: textShadowGlow,
                  fontFamily: 'Saira Condensed',
                  fontWeight: 200
                }}
              >
                {formatGold(currentOwnerGold)}
              </div>
            </div>

            {/* All-time - smaller, subdued */}
            <div className="text-center pt-3 border-t border-yellow-500/20">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-mono mb-1.5">
                all-time
              </div>
              <div className="text-white text-lg" style={{
                fontFamily: 'Inter',
                fontWeight: 400
              }}>
                {formatGold(allTimeGold)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // NEW Style 8: Stacked Minimal - very clean, minimal borders and effects
    if (cumulativeGoldStyle === 'stacked-minimal') {
      return (
        <div className="relative p-6 bg-black/20 backdrop-blur-sm border border-yellow-500/20">
          {/* Content */}
          <div className="space-y-3">
            {/* Title */}
            <div className={`text-[10px] ${accentColorDim} uppercase tracking-widest font-mono text-center mb-2 opacity-60`}>
              CUMULATIVE GOLD
            </div>

            {/* Current Corp - BIG and prominent */}
            <div className="text-center">
              <div className="text-[9px] text-gray-400 uppercase tracking-wider font-mono mb-1 opacity-50">
                Current Corp
              </div>
              <div
                className={`${accentColor} text-3xl`}
                style={{
                  fontFamily: 'Saira Condensed',
                  fontWeight: 200
                }}
              >
                {formatGold(currentOwnerGold)}
              </div>
            </div>

            {/* All-time - smaller, subdued */}
            <div className="text-center pt-2 border-t border-yellow-500/10">
              <div className="text-[9px] text-gray-500 uppercase tracking-wider font-mono mb-1 opacity-50">
                all-time
              </div>
              <div className="text-white/80 text-base" style={{
                fontFamily: 'Inter',
                fontWeight: 400
              }}>
                {formatGold(allTimeGold)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (combinedGoldCardStyle === 'cascade-accumulation') {
      // DESIGN 1: CASCADE ACCUMULATION
      // Visual Metaphor: Gold rate flows down like water cascading into cumulative pools
      // Flow Narrative: Rate pours from top → cascades down visual channels → accumulates into cumulative totals

      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          {/* Glowing border effect */}
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />

          {/* Gradient overlay accent */}
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? 'rgba(250, 182, 23, 0.4)' : 'rgba(0, 212, 255, 0.4)'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10 space-y-6">
            {/* RATE SECTION - Source at top (water source) */}
            <div className="space-y-4">
              <div
                className={`text-[10px] ${accentColor} uppercase tracking-[0.3em] text-center`}
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                ◆ INCOME RATE ◆
              </div>

              {/* Rate components in horizontal flow */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div
                    className="text-[9px] text-white/40 uppercase mb-1 tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    BASE
                  </div>
                  <div
                    className="text-white text-sm"
                    style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                  >
                    {formatGoldRate(goldGenData.base)}
                  </div>
                </div>

                <div>
                  <div
                    className="text-[9px] text-green-400/60 uppercase mb-1 tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    BONUS
                  </div>
                  <div
                    className="text-green-400 text-sm"
                    style={{
                      fontFamily: 'Saira Condensed',
                      fontWeight: 300,
                      textShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                    }}
                  >
                    +{formatGoldRate(goldGenData.bonus)}
                  </div>
                </div>

                <div>
                  <div
                    className={`text-[9px] ${accentColor} uppercase mb-1 tracking-[0.2em]`}
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    TOTAL
                  </div>
                  <div
                    className={`${accentColor} text-xl`}
                    style={{
                      fontFamily: 'Saira Condensed',
                      fontWeight: 200,
                      textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`
                    }}
                  >
                    {formatGoldRate(goldGenData.total)}
                  </div>
                </div>
              </div>
            </div>

            {/* CASCADE VISUAL - Three vertical flow lines connecting rate to cumulative */}
            <div className="relative h-12 flex items-center justify-center">
              {/* Left cascade line */}
              <div className="absolute left-[16.66%] top-0 bottom-0 w-px">
                <div
                  className={`absolute inset-0 bg-gradient-to-b from-white ${useYellowGlow ? 'via-yellow-400/60' : 'via-cyan-400/60'} to-transparent`}
                  style={{ filter: 'blur(1px)' }}
                />
              </div>

              {/* Center cascade line (brightest) */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2">
                <div
                  className={`absolute inset-0 bg-gradient-to-b ${useYellowGlow ? 'from-yellow-400' : 'from-cyan-400'} to-transparent`}
                  style={{ filter: 'blur(2px)' }}
                />
              </div>

              {/* Right cascade line */}
              <div className="absolute left-[83.33%] top-0 bottom-0 w-px">
                <div
                  className={`absolute inset-0 bg-gradient-to-b from-white ${useYellowGlow ? 'via-yellow-400/60' : 'via-cyan-400/60'} to-transparent`}
                  style={{ filter: 'blur(1px)' }}
                />
              </div>

              {/* Flow direction indicator (chevron pointing down) */}
              <div className={`${accentColor} text-xl opacity-60`} style={{ fontFamily: 'Saira Condensed' }}>
                ▼
              </div>
            </div>

            {/* CUMULATIVE SECTION - Reservoir at bottom (water pools) */}
            <div className="space-y-4">
              <div
                className={`text-[10px] ${accentColor} uppercase tracking-[0.3em] text-center`}
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                ◆ ACCUMULATED ◆
              </div>

              {/* Cumulative pools side by side */}
              <div className="grid grid-cols-2 gap-6">
                {/* Current Corp pool (main reservoir) */}
                <div className="text-center bg-black/30 p-4 rounded-sm border border-white/10">
                  <div
                    className="text-[9px] text-white/40 uppercase mb-2 tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    CURRENT CORP
                  </div>
                  <div
                    className={`${accentColor} text-6xl leading-none`}
                    style={{
                      fontFamily: 'Saira Condensed',
                      fontWeight: 200,
                      textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`,
                      letterSpacing: '0.1em'
                    }}
                  >
                    {formatGold(currentOwnerGold)}
                  </div>
                </div>

                {/* All-Time pool (overflow reservoir) */}
                <div className="text-center bg-black/30 p-4 rounded-sm border border-white/10">
                  <div
                    className="text-[9px] text-white/40 uppercase mb-2 tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    ALL-TIME
                  </div>
                  <div
                    className="text-white text-3xl leading-none"
                    style={{
                      fontFamily: 'Saira Condensed',
                      fontWeight: 200,
                      letterSpacing: '0.05em'
                    }}
                  >
                    {formatGold(allTimeGold)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (combinedGoldCardStyle === 'energy-conduit') {
      // DESIGN 2: ENERGY CONDUIT
      // Visual Metaphor: Rate is energy flowing through conduits that charge cumulative capacitors
      // Flow Narrative: Rate metrics connect via glowing energy lines → feed into cumulative displays as charging batteries

      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          {/* Glowing border effect */}
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />

          {/* Gradient overlay accent */}
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? 'rgba(250, 182, 23, 0.4)' : 'rgba(0, 212, 255, 0.4)'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10">
            {/* HORIZONTAL LAYOUT: Left (Rate) → Center (Conduit) → Right (Cumulative) */}
            <div className="grid grid-cols-[1fr_80px_1fr] gap-4 items-center">

              {/* LEFT: RATE SECTION (Energy Source) */}
              <div className="space-y-3">
                <div
                  className={`text-[10px] ${accentColor} uppercase tracking-[0.3em] text-center pb-2`}
                  style={{ fontFamily: 'Inter', fontWeight: 400 }}
                >
                  ENERGY SOURCE
                </div>

                {/* Rate breakdown vertically stacked */}
                <div className="space-y-3 bg-black/30 p-4 rounded-sm border border-white/10">
                  {/* Base */}
                  <div className="flex justify-between items-center">
                    <div
                      className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                      style={{ fontFamily: 'Inter', fontWeight: 400 }}
                    >
                      BASE
                    </div>
                    <div
                      className="text-white text-sm"
                      style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                    >
                      {formatGoldRate(goldGenData.base)}
                    </div>
                  </div>

                  {/* Bonus */}
                  <div className="flex justify-between items-center">
                    <div
                      className="text-[9px] text-green-400/60 uppercase tracking-[0.2em]"
                      style={{ fontFamily: 'Inter', fontWeight: 400 }}
                    >
                      BONUS
                    </div>
                    <div
                      className="text-green-400 text-sm"
                      style={{
                        fontFamily: 'Saira Condensed',
                        fontWeight: 300,
                        textShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                      }}
                    >
                      +{formatGoldRate(goldGenData.bonus)}
                    </div>
                  </div>

                  {/* Divider with pulse */}
                  <div className="relative h-px">
                    <div
                      className={`absolute inset-0 bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400' : 'via-cyan-400'} to-transparent`}
                      style={{ filter: 'blur(1px)' }}
                    />
                  </div>

                  {/* Total (output) */}
                  <div className="flex justify-between items-center">
                    <div
                      className={`text-[9px] ${accentColor} uppercase tracking-[0.2em]`}
                      style={{ fontFamily: 'Inter', fontWeight: 400 }}
                    >
                      OUTPUT
                    </div>
                    <div
                      className={`${accentColor} text-xl`}
                      style={{
                        fontFamily: 'Saira Condensed',
                        fontWeight: 200,
                        textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`
                      }}
                    >
                      {formatGoldRate(goldGenData.total)}
                    </div>
                  </div>
                </div>
              </div>

              {/* CENTER: ENERGY CONDUIT (Visual connection) */}
              <div className="flex flex-col items-center justify-center h-full py-4">
                {/* Horizontal energy flow lines */}
                <div className="relative w-full h-full flex flex-col justify-center space-y-4">
                  {/* Top conduit */}
                  <div className="relative h-px">
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${useYellowGlow ? 'from-yellow-400/60 via-yellow-400 to-yellow-400/60' : 'from-cyan-400/60 via-cyan-400 to-cyan-400/60'}`}
                      style={{ filter: 'blur(1.5px)' }}
                    />
                  </div>

                  {/* Center conduit (main flow - brightest) */}
                  <div className="relative h-px">
                    <div
                      className={`absolute inset-0 ${useYellowGlow ? 'bg-yellow-400' : 'bg-cyan-400'}`}
                      style={{ filter: 'blur(2px)', boxShadow: `0 0 10px ${glowRgba}` }}
                    />
                  </div>

                  {/* Bottom conduit */}
                  <div className="relative h-px">
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${useYellowGlow ? 'from-yellow-400/60 via-yellow-400 to-yellow-400/60' : 'from-cyan-400/60 via-cyan-400 to-cyan-400/60'}`}
                      style={{ filter: 'blur(1.5px)' }}
                    />
                  </div>
                </div>

                {/* Flow direction indicator */}
                <div className={`${accentColor} text-2xl mt-2`} style={{ fontFamily: 'Saira Condensed' }}>
                  ▶
                </div>
              </div>

              {/* RIGHT: CUMULATIVE SECTION (Energy Storage) */}
              <div className="space-y-3">
                <div
                  className={`text-[10px] ${accentColor} uppercase tracking-[0.3em] text-center pb-2`}
                  style={{ fontFamily: 'Inter', fontWeight: 400 }}
                >
                  CAPACITORS
                </div>

                {/* Cumulative values vertically stacked like battery levels */}
                <div className="space-y-4">
                  {/* Current Corp capacitor (primary charge) */}
                  <div className="bg-black/30 p-4 rounded-sm border border-white/10 relative overflow-hidden">
                    {/* Charge level indicator (filled background) */}
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        background: `linear-gradient(to right, ${useYellowGlow ? 'rgba(250, 182, 23, 0.3)' : 'rgba(0, 212, 255, 0.3)'} 0%, transparent 100%)`
                      }}
                    />

                    <div className="relative z-10 text-center">
                      <div
                        className="text-[9px] text-white/40 uppercase mb-2 tracking-[0.2em]"
                        style={{ fontFamily: 'Inter', fontWeight: 400 }}
                      >
                        CURRENT CORP
                      </div>
                      <div
                        className={`${accentColor} text-6xl leading-none`}
                        style={{
                          fontFamily: 'Saira Condensed',
                          fontWeight: 200,
                          textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`,
                          letterSpacing: '0.1em'
                        }}
                      >
                        {formatGold(currentOwnerGold)}
                      </div>
                    </div>
                  </div>

                  {/* All-Time capacitor (total charge) */}
                  <div className="bg-black/30 p-4 rounded-sm border border-white/10 relative overflow-hidden">
                    {/* Charge level indicator */}
                    <div
                      className="absolute inset-0 opacity-5"
                      style={{
                        background: `linear-gradient(to right, rgba(255, 255, 255, 0.2) 0%, transparent 100%)`
                      }}
                    />

                    <div className="relative z-10 text-center">
                      <div
                        className="text-[9px] text-white/40 uppercase mb-2 tracking-[0.2em]"
                        style={{ fontFamily: 'Inter', fontWeight: 400 }}
                      >
                        ALL-TIME TOTAL
                      </div>
                      <div
                        className="text-white text-3xl leading-none"
                        style={{
                          fontFamily: 'Saira Condensed',
                          fontWeight: 200,
                          letterSpacing: '0.05em'
                        }}
                      >
                        {formatGold(allTimeGold)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }


    return null;
  };

  const renderCombinedGoldCard = () => {
    const goldGenData = { base: 1250, bonus: 875, total: 2125 };
    const currentOwnerGold = Math.floor(12869);
    const allTimeGold = Math.floor(458414);
    const formatGoldRate = (num: number) => num.toLocaleString('en-US') + ' G/hr';
    const formatGold = (num: number) => num.toLocaleString('en-US') + ' G';
    const accentColor = useYellowGlow ? 'text-yellow-400' : 'text-cyan-400';
    const accentColorDim = useYellowGlow ? 'text-yellow-400/60' : 'text-cyan-400/60';
    const borderColor = useYellowGlow ? 'border-yellow-400/50' : 'border-cyan-400/50';
    const glowRgba = useYellowGlow ? 'rgba(250, 182, 23, 0.3)' : 'rgba(0, 212, 255, 0.3)';
    const glowRgbaInset = useYellowGlow ? 'rgba(250, 182, 23, 0.1)' : 'rgba(0, 212, 255, 0.1)';
    const textShadowPrimary = useYellowGlow ? 'rgba(250, 182, 23, 0.8)' : 'rgba(0, 212, 255, 0.8)';
    const textShadowSecondary = useYellowGlow ? 'rgba(250, 182, 23, 0.4)' : 'rgba(0, 212, 255, 0.4)';

    if (combinedGoldCardStyle === 'vertical-stacked') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          <div className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`} style={{ boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`, filter: 'blur(0.5px)' }} />
          <div className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none" style={{ background: `linear-gradient(180deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)` }} />
          <div className="relative z-10 space-y-6">
            <div className={`text-[10px] ${accentColorDim} uppercase tracking-widest text-center mb-4`} style={{ fontFamily: 'Inter', fontWeight: 400 }}>◆ GOLD MASTER CARD ◆</div>
            <div className="border-b border-gray-600/50 pb-4"><div className={`text-[10px] ${accentColor} uppercase tracking-widest mb-3`} style={{ fontFamily: 'Inter', fontWeight: 400 }}>Rate</div><div className="grid grid-cols-3 gap-3"><div className="text-center"><div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Base</div><div className="text-white text-sm" style={{ fontFamily: 'Saira Condensed', fontWeight: 200 }}>{formatGoldRate(goldGenData.base)}</div></div><div className="text-center"><div className="text-[9px] text-green-400 uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Bonus</div><div className="text-green-400 text-sm" style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: '0 0 10px rgba(0, 255, 0, 0.6)' }}>+{formatGoldRate(goldGenData.bonus)}</div></div><div className="text-center"><div className={`text-[9px] ${accentColor} uppercase tracking-wider mb-1`} style={{ fontFamily: 'Inter', fontWeight: 400 }}>Total</div><div className={`${accentColor} text-lg`} style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: `0 0 15px ${textShadowPrimary}` }}>{formatGoldRate(goldGenData.total)}</div></div></div></div>
            <div><div className={`text-[10px] ${accentColor} uppercase tracking-widest mb-3`} style={{ fontFamily: 'Inter', fontWeight: 400 }}>Cumulative</div><div className="grid grid-cols-2 gap-4"><div className="text-center"><div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Current Corp</div><div className={`${accentColor} text-2xl`} style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}` }}>{formatGold(currentOwnerGold)}</div></div><div className="text-center"><div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>All-Time</div><div className="text-white text-base" style={{ fontFamily: 'Inter', fontWeight: 400 }}>{formatGold(allTimeGold)}</div></div></div></div>
          </div>
        </div>
      );
    }

    if (combinedGoldCardStyle === 'side-by-side') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          <div className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`} style={{ boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`, filter: 'blur(0.5px)' }} />
          <div className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none" style={{ background: `linear-gradient(180deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)` }} />
          <div className="relative z-10">
            <div className={`text-[10px] ${accentColorDim} uppercase tracking-widest text-center mb-4`} style={{ fontFamily: 'Inter', fontWeight: 400 }}>◆ GOLD MASTER CARD ◆</div>
            <div className="grid grid-cols-2 gap-6">
              <div className="border-r border-gray-600/50 pr-4"><div className={`text-[10px] ${accentColor} uppercase tracking-widest mb-3`} style={{ fontFamily: 'Inter', fontWeight: 400 }}>Rate</div><div className="space-y-2"><div className="flex justify-between items-center"><span className="text-[9px] text-gray-400 uppercase tracking-wider" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Base</span><span className="text-white text-sm" style={{ fontFamily: 'Saira Condensed', fontWeight: 200 }}>{formatGoldRate(goldGenData.base)}</span></div><div className="flex justify-between items-center"><span className="text-[9px] text-green-400 uppercase tracking-wider" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Bonus</span><span className="text-green-400 text-sm" style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: '0 0 10px rgba(0, 255, 0, 0.6)' }}>+{formatGoldRate(goldGenData.bonus)}</span></div><div className="flex justify-between items-center pt-2 border-t border-gray-700/30"><span className={`text-[9px] ${accentColor} uppercase tracking-wider font-bold`} style={{ fontFamily: 'Inter', fontWeight: 400 }}>Total</span><span className={`${accentColor} text-lg font-bold`} style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: `0 0 15px ${textShadowPrimary}` }}>{formatGoldRate(goldGenData.total)}</span></div></div></div>
              <div><div className={`text-[10px] ${accentColor} uppercase tracking-widest mb-3`} style={{ fontFamily: 'Inter', fontWeight: 400 }}>Cumulative</div><div className="space-y-3"><div className="text-center"><div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Current Corp</div><div className={`${accentColor} text-2xl`} style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}` }}>{formatGold(currentOwnerGold)}</div></div><div className="text-center pt-2 border-t border-gray-700/30"><div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>All-Time</div><div className="text-white text-base" style={{ fontFamily: 'Inter', fontWeight: 400 }}>{formatGold(allTimeGold)}</div></div></div></div>
            </div>
          </div>
        </div>
      );
    }

    if (combinedGoldCardStyle === 'dashboard-grid') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          <div className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`} style={{ boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`, filter: 'blur(0.5px)' }} />
          <div className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none" style={{ background: `linear-gradient(180deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)` }} />
          <div className="relative z-10">
            <div className={`text-[10px] ${accentColorDim} uppercase tracking-widest text-center mb-4`} style={{ fontFamily: 'Inter', fontWeight: 400 }}>◆ GOLD MASTER CARD ◆</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/30 p-3 border border-gray-600/40"><div className={`text-[9px] ${accentColor} uppercase tracking-widest mb-2`} style={{ fontFamily: 'Inter', fontWeight: 400 }}>Rate</div><div className="space-y-1.5"><div className="flex justify-between"><span className="text-[8px] text-gray-400 uppercase" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Base</span><span className="text-white text-xs" style={{ fontFamily: 'Saira Condensed', fontWeight: 200 }}>{formatGoldRate(goldGenData.base)}</span></div><div className="flex justify-between"><span className="text-[8px] text-green-400 uppercase" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Bonus</span><span className="text-green-400 text-xs" style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: '0 0 8px rgba(0, 255, 0, 0.6)' }}>+{formatGoldRate(goldGenData.bonus)}</span></div><div className="flex justify-between pt-1 border-t border-gray-700/30"><span className={`text-[8px] ${accentColor} uppercase font-bold`} style={{ fontFamily: 'Inter', fontWeight: 400 }}>Total</span><span className={`${accentColor} text-sm font-bold`} style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: `0 0 12px ${textShadowPrimary}` }}>{formatGoldRate(goldGenData.total)}</span></div></div></div>
              <div className="bg-black/30 p-3 border border-gray-600/40"><div className={`text-[9px] ${accentColor} uppercase tracking-widest mb-2`} style={{ fontFamily: 'Inter', fontWeight: 400 }}>Current Corp</div><div className={`${accentColor} text-xl text-center`} style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}` }}>{formatGold(currentOwnerGold)}</div></div>
              <div className="col-span-2 bg-black/30 p-3 border border-gray-600/40"><div className={`text-[9px] ${accentColor} uppercase tracking-widest mb-2`} style={{ fontFamily: 'Inter', fontWeight: 400 }}>All-Time Total</div><div className="text-white text-lg text-center" style={{ fontFamily: 'Inter', fontWeight: 400 }}>{formatGold(allTimeGold)}</div></div>
            </div>
          </div>
        </div>
      );
    }

    if (combinedGoldCardStyle === 'hero-emphasis') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          {/* Glowing border effect */}
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />

          {/* Gradient overlay accent */}
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? 'rgba(250, 182, 23, 0.4)' : 'rgba(0, 212, 255, 0.4)'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10 space-y-4">
            {/* Hero: Total Rate - Massive and glowing */}
            <div className="text-center">
              <div
                className={`${accentColor} text-6xl leading-none mb-2`}
                style={{
                  fontFamily: 'Saira Condensed',
                  fontWeight: 200,
                  textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`,
                  letterSpacing: '0.1em'
                }}
              >
                {formatGoldRate(goldGenData.total)}
              </div>
              <div
                className={`text-[10px] ${accentColorDim} uppercase tracking-[0.3em]`}
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                TOTAL RATE
              </div>
            </div>

            {/* Horizontal divider with glow */}
            <div className="relative h-px">
              <div
                className={`absolute inset-0 bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400' : 'via-cyan-400'} to-transparent`}
                style={{ filter: 'blur(1px)' }}
              />
            </div>

            {/* Rate breakdown in grid */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div
                  className="text-[9px] text-white/40 uppercase mb-1 tracking-[0.2em]"
                  style={{ fontFamily: 'Inter', fontWeight: 400 }}
                >
                  BASE
                </div>
                <div
                  className="text-white text-sm"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                >
                  {formatGoldRate(goldGenData.base)}
                </div>
              </div>
              <div>
                <div
                  className="text-[9px] text-green-400/60 uppercase mb-1 tracking-[0.2em]"
                  style={{ fontFamily: 'Inter', fontWeight: 400 }}
                >
                  BONUS
                </div>
                <div
                  className="text-green-400 text-sm"
                  style={{
                    fontFamily: 'Saira Condensed',
                    fontWeight: 300,
                    textShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                  }}
                >
                  +{formatGoldRate(goldGenData.bonus)}
                </div>
              </div>
            </div>

            {/* Second divider */}
            <div className="relative h-px">
              <div
                className={`absolute inset-0 bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400' : 'via-cyan-400'} to-transparent`}
                style={{ filter: 'blur(1px)' }}
              />
            </div>

            {/* Cumulative section */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div
                  className="text-[9px] text-white/40 uppercase mb-1 tracking-[0.2em]"
                  style={{ fontFamily: 'Inter', fontWeight: 400 }}
                >
                  CURRENT CORP
                </div>
                <div
                  className={`${accentColor} text-2xl`}
                  style={{
                    fontFamily: 'Saira Condensed',
                    fontWeight: 200,
                    textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`
                  }}
                >
                  {formatGold(currentOwnerGold)}
                </div>
              </div>
              <div>
                <div
                  className="text-[9px] text-white/40 uppercase mb-1 tracking-[0.2em]"
                  style={{ fontFamily: 'Inter', fontWeight: 400 }}
                >
                  ALL-TIME
                </div>
                <div
                  className="text-white text-base"
                  style={{ fontFamily: 'Inter', fontWeight: 400 }}
                >
                  {formatGold(allTimeGold)}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (combinedGoldCardStyle === 'elegant-split') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          {/* Glowing border effect */}
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />

          {/* Gradient overlay accent */}
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? 'rgba(250, 182, 23, 0.4)' : 'rgba(0, 212, 255, 0.4)'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10 space-y-4">
            {/* Title */}
            <div
              className={`text-[10px] ${accentColorDim} uppercase tracking-[0.3em] text-center`}
              style={{ fontFamily: 'Inter', fontWeight: 400 }}
            >
              ◆ GOLD OVERVIEW ◆
            </div>

            {/* Main content: Two-column layout */}
            <div className="grid grid-cols-2 gap-6">
              {/* LEFT COLUMN: Rate Section */}
              <div className="space-y-4">
                <div
                  className={`text-[10px] ${accentColor} uppercase tracking-[0.3em] text-center pb-2`}
                  style={{ fontFamily: 'Inter', fontWeight: 400 }}
                >
                  RATE
                </div>

                {/* Base */}
                <div className="text-center">
                  <div
                    className="text-[9px] text-white/40 uppercase mb-1 tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    BASE
                  </div>
                  <div
                    className="text-white text-lg"
                    style={{ fontFamily: 'Saira Condensed', fontWeight: 200 }}
                  >
                    {formatGoldRate(goldGenData.base)}
                  </div>
                </div>

                {/* Bonus */}
                <div className="text-center">
                  <div
                    className="text-[9px] text-green-400/60 uppercase mb-1 tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    BONUS
                  </div>
                  <div
                    className="text-green-400 text-lg"
                    style={{
                      fontFamily: 'Saira Condensed',
                      fontWeight: 200,
                      textShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                    }}
                  >
                    +{formatGoldRate(goldGenData.bonus)}
                  </div>
                </div>

                {/* Divider */}
                <div className="relative h-px mx-4">
                  <div
                    className={`absolute inset-0 bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400' : 'via-cyan-400'} to-transparent`}
                    style={{ filter: 'blur(1px)' }}
                  />
                </div>

                {/* Total */}
                <div className="text-center">
                  <div
                    className={`text-[9px] ${accentColor} uppercase mb-1 tracking-[0.2em]`}
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    TOTAL
                  </div>
                  <div
                    className={`${accentColor} text-2xl`}
                    style={{
                      fontFamily: 'Saira Condensed',
                      fontWeight: 200,
                      textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`,
                      letterSpacing: '0.05em'
                    }}
                  >
                    {formatGoldRate(goldGenData.total)}
                  </div>
                </div>
              </div>

              {/* Vertical divider */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2">
                <div
                  className={`absolute inset-0 bg-gradient-to-b from-transparent ${useYellowGlow ? 'via-yellow-400' : 'via-cyan-400'} to-transparent`}
                  style={{ filter: 'blur(1px)' }}
                />
              </div>

              {/* RIGHT COLUMN: Cumulative Section */}
              <div className="space-y-4">
                <div
                  className={`text-[10px] ${accentColor} uppercase tracking-[0.3em] text-center pb-2`}
                  style={{ fontFamily: 'Inter', fontWeight: 400 }}
                >
                  CUMULATIVE
                </div>

                {/* Current Corp */}
                <div className="text-center pt-8">
                  <div
                    className="text-[9px] text-white/40 uppercase mb-1 tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    CURRENT CORP
                  </div>
                  <div
                    className={`${accentColor} text-3xl`}
                    style={{
                      fontFamily: 'Saira Condensed',
                      fontWeight: 200,
                      textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`,
                      letterSpacing: '0.05em'
                    }}
                  >
                    {formatGold(currentOwnerGold)}
                  </div>
                </div>

                {/* Divider */}
                <div className="relative h-px mx-4">
                  <div
                    className={`absolute inset-0 bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400' : 'via-cyan-400'} to-transparent`}
                    style={{ filter: 'blur(1px)' }}
                  />
                </div>

                {/* All-Time */}
                <div className="text-center">
                  <div
                    className="text-[9px] text-white/40 uppercase mb-1 tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    ALL-TIME
                  </div>
                  <div
                    className="text-white text-xl"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    {formatGold(allTimeGold)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (combinedGoldCardStyle === 'cascade-accumulation') {
      // DESIGN 1: CASCADE ACCUMULATION
      // Visual Metaphor: Gold rate flows down like water cascading into cumulative pools
      // Flow Narrative: Rate pours from top → cascades down visual channels → accumulates into cumulative totals

      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          {/* Glowing border effect */}
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />

          {/* Gradient overlay accent */}
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? 'rgba(250, 182, 23, 0.4)' : 'rgba(0, 212, 255, 0.4)'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10 space-y-6">
            {/* RATE SECTION - Source at top (water source) */}
            <div className="space-y-4">
              <div
                className={`text-[10px] ${accentColor} uppercase tracking-[0.3em] text-center`}
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                ◆ INCOME RATE ◆
              </div>

              {/* Rate components in horizontal flow */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div
                    className="text-[9px] text-white/40 uppercase mb-1 tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    BASE
                  </div>
                  <div
                    className="text-white text-sm"
                    style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                  >
                    {formatGoldRate(goldGenData.base)}
                  </div>
                </div>

                <div>
                  <div
                    className="text-[9px] text-green-400/60 uppercase mb-1 tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    BONUS
                  </div>
                  <div
                    className="text-green-400 text-sm"
                    style={{
                      fontFamily: 'Saira Condensed',
                      fontWeight: 300,
                      textShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                    }}
                  >
                    +{formatGoldRate(goldGenData.bonus)}
                  </div>
                </div>

                <div>
                  <div
                    className={`text-[9px] ${accentColor} uppercase mb-1 tracking-[0.2em]`}
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    TOTAL
                  </div>
                  <div
                    className={`${accentColor} text-xl`}
                    style={{
                      fontFamily: 'Saira Condensed',
                      fontWeight: 200,
                      textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`
                    }}
                  >
                    {formatGoldRate(goldGenData.total)}
                  </div>
                </div>
              </div>
            </div>

            {/* CASCADE VISUAL - Three vertical flow lines connecting rate to cumulative */}
            <div className="relative h-12 flex items-center justify-center">
              {/* Left cascade line */}
              <div className="absolute left-[16.66%] top-0 bottom-0 w-px">
                <div
                  className={`absolute inset-0 bg-gradient-to-b from-white ${useYellowGlow ? 'via-yellow-400/60' : 'via-cyan-400/60'} to-transparent`}
                  style={{ filter: 'blur(1px)' }}
                />
              </div>

              {/* Center cascade line (brightest) */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2">
                <div
                  className={`absolute inset-0 bg-gradient-to-b ${useYellowGlow ? 'from-yellow-400' : 'from-cyan-400'} to-transparent`}
                  style={{ filter: 'blur(2px)' }}
                />
              </div>

              {/* Right cascade line */}
              <div className="absolute left-[83.33%] top-0 bottom-0 w-px">
                <div
                  className={`absolute inset-0 bg-gradient-to-b from-white ${useYellowGlow ? 'via-yellow-400/60' : 'via-cyan-400/60'} to-transparent`}
                  style={{ filter: 'blur(1px)' }}
                />
              </div>

              {/* Flow direction indicator (chevron pointing down) */}
              <div className={`${accentColor} text-xl opacity-60`} style={{ fontFamily: 'Saira Condensed' }}>
                ▼
              </div>
            </div>

            {/* CUMULATIVE SECTION - Reservoir at bottom (water pools) */}
            <div className="space-y-4">
              <div
                className={`text-[10px] ${accentColor} uppercase tracking-[0.3em] text-center`}
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                ◆ ACCUMULATED ◆
              </div>

              {/* Cumulative pools side by side */}
              <div className="grid grid-cols-2 gap-6">
                {/* Current Corp pool (main reservoir) */}
                <div className="text-center bg-black/30 p-4 rounded-sm border border-white/10">
                  <div
                    className="text-[9px] text-white/40 uppercase mb-2 tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    CURRENT CORP
                  </div>
                  <div
                    className={`${accentColor} text-6xl leading-none`}
                    style={{
                      fontFamily: 'Saira Condensed',
                      fontWeight: 200,
                      textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`,
                      letterSpacing: '0.1em'
                    }}
                  >
                    {formatGold(currentOwnerGold)}
                  </div>
                </div>

                {/* All-Time pool (overflow reservoir) */}
                <div className="text-center bg-black/30 p-4 rounded-sm border border-white/10">
                  <div
                    className="text-[9px] text-white/40 uppercase mb-2 tracking-[0.2em]"
                    style={{ fontFamily: 'Inter', fontWeight: 400 }}
                  >
                    ALL-TIME
                  </div>
                  <div
                    className="text-white text-3xl leading-none"
                    style={{
                      fontFamily: 'Saira Condensed',
                      fontWeight: 200,
                      letterSpacing: '0.05em'
                    }}
                  >
                    {formatGold(allTimeGold)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (combinedGoldCardStyle === 'energy-conduit') {
      // DESIGN 2: ENERGY CONDUIT
      // Visual Metaphor: Rate is energy flowing through conduits that charge cumulative capacitors
      // Flow Narrative: Rate metrics connect via glowing energy lines → feed into cumulative displays as charging batteries

      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          {/* Glowing border effect */}
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />

          {/* Gradient overlay accent */}
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? 'rgba(250, 182, 23, 0.4)' : 'rgba(0, 212, 255, 0.4)'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10">
            {/* HORIZONTAL LAYOUT: Left (Rate) → Center (Conduit) → Right (Cumulative) */}
            <div className="grid grid-cols-[1fr_80px_1fr] gap-4 items-center">

              {/* LEFT: RATE SECTION (Energy Source) */}
              <div className="space-y-3">
                <div
                  className={`text-[10px] ${accentColor} uppercase tracking-[0.3em] text-center pb-2`}
                  style={{ fontFamily: 'Inter', fontWeight: 400 }}
                >
                  ENERGY SOURCE
                </div>

                {/* Rate breakdown vertically stacked */}
                <div className="space-y-3 bg-black/30 p-4 rounded-sm border border-white/10">
                  {/* Base */}
                  <div className="flex justify-between items-center">
                    <div
                      className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                      style={{ fontFamily: 'Inter', fontWeight: 400 }}
                    >
                      BASE
                    </div>
                    <div
                      className="text-white text-sm"
                      style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                    >
                      {formatGoldRate(goldGenData.base)}
                    </div>
                  </div>

                  {/* Bonus */}
                  <div className="flex justify-between items-center">
                    <div
                      className="text-[9px] text-green-400/60 uppercase tracking-[0.2em]"
                      style={{ fontFamily: 'Inter', fontWeight: 400 }}
                    >
                      BONUS
                    </div>
                    <div
                      className="text-green-400 text-sm"
                      style={{
                        fontFamily: 'Saira Condensed',
                        fontWeight: 300,
                        textShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                      }}
                    >
                      +{formatGoldRate(goldGenData.bonus)}
                    </div>
                  </div>

                  {/* Divider with pulse */}
                  <div className="relative h-px">
                    <div
                      className={`absolute inset-0 bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400' : 'via-cyan-400'} to-transparent`}
                      style={{ filter: 'blur(1px)' }}
                    />
                  </div>

                  {/* Total (output) */}
                  <div className="flex justify-between items-center">
                    <div
                      className={`text-[9px] ${accentColor} uppercase tracking-[0.2em]`}
                      style={{ fontFamily: 'Inter', fontWeight: 400 }}
                    >
                      OUTPUT
                    </div>
                    <div
                      className={`${accentColor} text-xl`}
                      style={{
                        fontFamily: 'Saira Condensed',
                        fontWeight: 200,
                        textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`
                      }}
                    >
                      {formatGoldRate(goldGenData.total)}
                    </div>
                  </div>
                </div>
              </div>

              {/* CENTER: ENERGY CONDUIT (Visual connection) */}
              <div className="flex flex-col items-center justify-center h-full py-4">
                {/* Horizontal energy flow lines */}
                <div className="relative w-full h-full flex flex-col justify-center space-y-4">
                  {/* Top conduit */}
                  <div className="relative h-px">
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${useYellowGlow ? 'from-yellow-400/60 via-yellow-400 to-yellow-400/60' : 'from-cyan-400/60 via-cyan-400 to-cyan-400/60'}`}
                      style={{ filter: 'blur(1.5px)' }}
                    />
                  </div>

                  {/* Center conduit (main flow - brightest) */}
                  <div className="relative h-px">
                    <div
                      className={`absolute inset-0 ${useYellowGlow ? 'bg-yellow-400' : 'bg-cyan-400'}`}
                      style={{ filter: 'blur(2px)', boxShadow: `0 0 10px ${glowRgba}` }}
                    />
                  </div>

                  {/* Bottom conduit */}
                  <div className="relative h-px">
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${useYellowGlow ? 'from-yellow-400/60 via-yellow-400 to-yellow-400/60' : 'from-cyan-400/60 via-cyan-400 to-cyan-400/60'}`}
                      style={{ filter: 'blur(1.5px)' }}
                    />
                  </div>
                </div>

                {/* Flow direction indicator */}
                <div className={`${accentColor} text-2xl mt-2`} style={{ fontFamily: 'Saira Condensed' }}>
                  ▶
                </div>
              </div>

              {/* RIGHT: CUMULATIVE SECTION (Energy Storage) */}
              <div className="space-y-3">
                <div
                  className={`text-[10px] ${accentColor} uppercase tracking-[0.3em] text-center pb-2`}
                  style={{ fontFamily: 'Inter', fontWeight: 400 }}
                >
                  CAPACITORS
                </div>

                {/* Cumulative values vertically stacked like battery levels */}
                <div className="space-y-4">
                  {/* Current Corp capacitor (primary charge) */}
                  <div className="bg-black/30 p-4 rounded-sm border border-white/10 relative overflow-hidden">
                    {/* Charge level indicator (filled background) */}
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        background: `linear-gradient(to right, ${useYellowGlow ? 'rgba(250, 182, 23, 0.3)' : 'rgba(0, 212, 255, 0.3)'} 0%, transparent 100%)`
                      }}
                    />

                    <div className="relative z-10 text-center">
                      <div
                        className="text-[9px] text-white/40 uppercase mb-2 tracking-[0.2em]"
                        style={{ fontFamily: 'Inter', fontWeight: 400 }}
                      >
                        CURRENT CORP
                      </div>
                      <div
                        className={`${accentColor} text-6xl leading-none`}
                        style={{
                          fontFamily: 'Saira Condensed',
                          fontWeight: 200,
                          textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`,
                          letterSpacing: '0.1em'
                        }}
                      >
                        {formatGold(currentOwnerGold)}
                      </div>
                    </div>
                  </div>

                  {/* All-Time capacitor (total charge) */}
                  <div className="bg-black/30 p-4 rounded-sm border border-white/10 relative overflow-hidden">
                    {/* Charge level indicator */}
                    <div
                      className="absolute inset-0 opacity-5"
                      style={{
                        background: `linear-gradient(to right, rgba(255, 255, 255, 0.2) 0%, transparent 100%)`
                      }}
                    />

                    <div className="relative z-10 text-center">
                      <div
                        className="text-[9px] text-white/40 uppercase mb-2 tracking-[0.2em]"
                        style={{ fontFamily: 'Inter', fontWeight: 400 }}
                      >
                        ALL-TIME TOTAL
                      </div>
                      <div
                        className="text-white text-3xl leading-none"
                        style={{
                          fontFamily: 'Saira Condensed',
                          fontWeight: 200,
                          letterSpacing: '0.05em'
                        }}
                      >
                        {formatGold(allTimeGold)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // SIMPLIFIED DESIGN 1: CLEAN HORIZONTAL
    // Layout: Horizontal side-by-side, total rate left, current corp right
    if (combinedGoldCardStyle === 'clean-horizontal') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          {/* Glowing border effect */}
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />

          {/* Gradient overlay accent */}
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10">
            {/* Two columns side by side */}
            <div className="grid grid-cols-2 gap-4">
              {/* LEFT: Income Rate */}
              <div className="text-center">
                <div
                  className="text-[10px] text-white/40 uppercase tracking-[0.3em] mb-1"
                  style={{ fontFamily: 'Inter', fontWeight: 400 }}
                >
                  INCOME RATE
                </div>
                <div
                  className={`${accentColor} text-4xl leading-none`}
                  style={{
                    fontFamily: 'Saira Condensed',
                    fontWeight: 200,
                    textShadow: `0 0 20px ${useYellowGlow ? 'rgba(250, 182, 23, 1)' : 'rgba(0, 212, 255, 1)'}, 0 0 40px ${useYellowGlow ? 'rgba(250, 182, 23, 0.5)' : 'rgba(0, 212, 255, 0.5)'}`
                  }}
                >
                  {formatGoldRate(goldGenData.total)}
                </div>
              </div>

              {/* Vertical divider */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2">
                <div
                  className={`absolute inset-0 bg-gradient-to-b from-transparent ${useYellowGlow ? 'via-yellow-400' : 'via-cyan-400'} to-transparent`}
                  style={{ filter: 'blur(1px)' }}
                />
              </div>

              {/* RIGHT: Cumulative */}
              <div className="text-center">
                <div
                  className="text-[10px] text-white/40 uppercase tracking-[0.3em] mb-1"
                  style={{ fontFamily: 'Inter', fontWeight: 400 }}
                >
                  CUMULATIVE
                </div>
                <div
                  className={`${accentColor} text-4xl leading-none`}
                  style={{
                    fontFamily: 'Saira Condensed',
                    fontWeight: 200,
                    textShadow: `0 0 20px ${useYellowGlow ? 'rgba(250, 182, 23, 1)' : 'rgba(0, 212, 255, 1)'}, 0 0 40px ${useYellowGlow ? 'rgba(250, 182, 23, 0.5)' : 'rgba(0, 212, 255, 0.5)'}`
                  }}
                >
                  {formatGold(currentOwnerGold)}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // SIMPLIFIED DESIGN 2: STACKED MINIMAL
    // Layout: Vertical stack with generous spacing, rate on top, corp below
    if (combinedGoldCardStyle === 'stacked-minimal') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          {/* Glowing border effect */}
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />

          {/* Gradient overlay accent */}
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10 space-y-4">
            {/* TOP: Income Rate */}
            <div className="text-center">
              <div
                className="text-[10px] text-white/40 uppercase tracking-[0.3em] mb-1"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                INCOME RATE
              </div>
              <div
                className={`${accentColor} text-6xl leading-none mb-2`}
                style={{
                  fontFamily: 'Saira Condensed',
                  fontWeight: 200,
                  letterSpacing: '0.1em',
                  textShadow: `0 0 20px ${useYellowGlow ? 'rgba(250, 182, 23, 1)' : 'rgba(0, 212, 255, 1)'}, 0 0 40px ${useYellowGlow ? 'rgba(250, 182, 23, 0.5)' : 'rgba(0, 212, 255, 0.5)'}`
                }}
              >
                {formatGoldRate(goldGenData.total)}
              </div>
            </div>

            {/* Horizontal divider */}
            <div className="relative h-px">
              <div
                className={`absolute inset-0 bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400' : 'via-cyan-400'} to-transparent`}
                style={{ filter: 'blur(1px)' }}
              />
            </div>

            {/* BOTTOM: Cumulative */}
            <div className="text-center">
              <div
                className="text-[10px] text-white/40 uppercase tracking-[0.3em] mb-1"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                CUMULATIVE
              </div>
              <div
                className={`${accentColor} text-6xl leading-none mb-2`}
                style={{
                  fontFamily: 'Saira Condensed',
                  fontWeight: 200,
                  letterSpacing: '0.1em',
                  textShadow: `0 0 20px ${useYellowGlow ? 'rgba(250, 182, 23, 1)' : 'rgba(0, 212, 255, 1)'}, 0 0 40px ${useYellowGlow ? 'rgba(250, 182, 23, 0.5)' : 'rgba(0, 212, 255, 0.5)'}`
                }}
              >
                {formatGold(currentOwnerGold)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // SIMPLIFIED DESIGN 3: BADGE PAIR
    // Layout: Two badge-style elements in a centered row
    if (combinedGoldCardStyle === 'badge-pair') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          {/* Glowing border effect */}
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />

          {/* Gradient overlay accent */}
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10 space-y-4">
            {/* Income Rate Badge */}
            <div className="flex justify-center">
              <div className={`inline-flex flex-col items-center gap-2 px-4 py-2 bg-black/60 border ${borderColor} rounded-sm`}>
                <div
                  className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                  style={{ fontFamily: 'Inter', fontWeight: 400 }}
                >
                  INCOME RATE
                </div>
                <div
                  className={`text-white text-sm tracking-wider`}
                  style={{
                    fontFamily: 'Saira Condensed',
                    fontWeight: 300
                  }}
                >
                  {formatGoldRate(goldGenData.total)}
                </div>
              </div>
            </div>

            {/* Cumulative Badge */}
            <div className="flex justify-center">
              <div className={`inline-flex flex-col items-center gap-2 px-4 py-2 bg-black/60 border ${borderColor} rounded-sm`}>
                <div
                  className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                  style={{ fontFamily: 'Inter', fontWeight: 400 }}
                >
                  CUMULATIVE
                </div>
                <div
                  className={`text-white text-sm tracking-wider`}
                  style={{
                    fontFamily: 'Saira Condensed',
                    fontWeight: 300
                  }}
                >
                  {formatGold(currentOwnerGold)}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // DIAGONAL SPLIT - Asymmetric diagonal orientation with one field dominant
    if (combinedGoldCardStyle === 'diagonal-split') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          {/* Glowing border effect */}
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />

          {/* Gradient overlay accent */}
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)`
            }}
          />

          {/* Diagonal divider line */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className={`absolute w-px h-full origin-top-left`}
              style={{
                left: '0%',
                top: '0%',
                transform: 'rotate(25deg) translateX(50%)',
                background: `linear-gradient(to bottom, transparent, ${useYellowGlow ? 'rgba(250, 182, 23, 0.6)' : 'rgba(0, 212, 255, 0.6)'}, transparent)`,
                filter: 'blur(1px)',
                height: '180%'
              }}
            />
          </div>

          <div className="relative z-10">
            {/* Top left: Income Rate (Dominant - larger) */}
            <div className="mb-4">
              <div
                className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-2"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                INCOME RATE
              </div>
              <div
                className={`${accentColor} text-5xl leading-none`}
                style={{
                  fontFamily: 'Saira Condensed',
                  fontWeight: 200,
                  letterSpacing: '0.05em',
                  textShadow: `0 0 20px ${useYellowGlow ? 'rgba(250, 182, 23, 1)' : 'rgba(0, 212, 255, 1)'}, 0 0 40px ${useYellowGlow ? 'rgba(250, 182, 23, 0.5)' : 'rgba(0, 212, 255, 0.5)'}`
                }}
              >
                {formatGoldRate(goldGenData.total)}
              </div>
            </div>

            {/* Bottom right: Cumulative (Secondary - smaller, offset) */}
            <div className="text-right mt-6">
              <div
                className="text-[9px] text-white/40 uppercase tracking-[0.2em] mb-1"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                CUMULATIVE
              </div>
              <div
                className={`${accentColor} text-3xl leading-none`}
                style={{
                  fontFamily: 'Saira Condensed',
                  fontWeight: 200,
                  textShadow: `0 0 20px ${useYellowGlow ? 'rgba(250, 182, 23, 1)' : 'rgba(0, 212, 255, 1)'}, 0 0 40px ${useYellowGlow ? 'rgba(250, 182, 23, 0.5)' : 'rgba(0, 212, 255, 0.5)'}`
                }}
              >
                {formatGold(currentOwnerGold)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // COMPACT DENSITY - Tight, information-dense layout with minimal spacing
    if (combinedGoldCardStyle === 'compact-density') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          {/* Glowing border effect */}
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />

          {/* Gradient overlay accent */}
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10 space-y-2">
            {/* Income Rate - Compact */}
            <div className="flex items-baseline justify-between">
              <div
                className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                INCOME RATE
              </div>
              <div
                className={`${accentColor} text-2xl leading-none`}
                style={{
                  fontFamily: 'Saira Condensed',
                  fontWeight: 200,
                  textShadow: `0 0 20px ${useYellowGlow ? 'rgba(250, 182, 23, 1)' : 'rgba(0, 212, 255, 1)'}, 0 0 40px ${useYellowGlow ? 'rgba(250, 182, 23, 0.5)' : 'rgba(0, 212, 255, 0.5)'}`
                }}
              >
                {formatGoldRate(goldGenData.total)}
              </div>
            </div>

            {/* Subtle divider */}
            <div className="relative h-px">
              <div
                className={`absolute inset-0 bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400/30' : 'via-cyan-400/30'} to-transparent`}
              />
            </div>

            {/* Cumulative - Compact */}
            <div className="flex items-baseline justify-between">
              <div
                className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                CUMULATIVE
              </div>
              <div
                className={`${accentColor} text-2xl leading-none`}
                style={{
                  fontFamily: 'Saira Condensed',
                  fontWeight: 200,
                  textShadow: `0 0 20px ${useYellowGlow ? 'rgba(250, 182, 23, 1)' : 'rgba(0, 212, 255, 1)'}, 0 0 40px ${useYellowGlow ? 'rgba(250, 182, 23, 0.5)' : 'rgba(0, 212, 255, 0.5)'}`
                }}
              >
                {formatGold(currentOwnerGold)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // COMPACT DENSITY V1 - Size Contrast (BIG income vs small cumulative)
    if (combinedGoldCardStyle === 'compact-density-v1') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10 space-y-2">
            {/* Income Rate - DOMINANT (huge size) */}
            <div className="flex items-baseline justify-between">
              <div
                className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                INCOME RATE
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={`${accentColor} text-5xl leading-none`}
                  style={{
                    fontFamily: 'Saira Condensed',
                    fontWeight: 200,
                    textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`
                  }}
                >
                  {goldGenData.total.toLocaleString('en-US')}
                </span>
                <span
                  className="text-xs text-white/50"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 200 }}
                >
                  g/hr
                </span>
              </div>
            </div>

            <div className="relative h-px">
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400/30' : 'via-cyan-400/30'} to-transparent`} />
            </div>

            {/* Cumulative - subdued (small size) */}
            <div className="flex items-baseline justify-between">
              <div
                className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                CUMULATIVE
              </div>
              <div className="flex items-baseline">
                <span
                  className="text-white text-xl leading-none"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 200 }}
                >
                  {currentOwnerGold.toLocaleString('en-US')}
                </span>
                <span
                  className="text-xs text-white/50"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 200 }}
                >
                  g
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // COMPACT DENSITY V2 - Color Contrast (glowing income vs plain cumulative)
    if (combinedGoldCardStyle === 'compact-density-v2') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10 space-y-2">
            {/* Income Rate - DOMINANT (accent color with glow) */}
            <div className="flex items-baseline justify-between">
              <div
                className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                INCOME RATE
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={`${accentColor} text-4xl leading-none`}
                  style={{
                    fontFamily: 'Saira Condensed',
                    fontWeight: 200,
                    textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`
                  }}
                >
                  {goldGenData.total.toLocaleString('en-US')}
                </span>
                <span
                  className="text-sm text-white/40"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 200 }}
                >
                  g/hr
                </span>
              </div>
            </div>

            <div className="relative h-px">
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400/30' : 'via-cyan-400/30'} to-transparent`} />
            </div>

            {/* Cumulative - subdued (white, no glow) */}
            <div className="flex items-baseline justify-between">
              <div
                className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                CUMULATIVE
              </div>
              <div className="flex items-baseline">
                <span
                  className="text-white/60 text-2xl leading-none"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                >
                  {currentOwnerGold.toLocaleString('en-US')}
                </span>
                <span
                  className="text-xs text-white/40"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                >
                  g
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // COMPACT DENSITY V3 - Weight Contrast (bold income vs thin cumulative)
    if (combinedGoldCardStyle === 'compact-density-v3') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10 space-y-2">
            {/* Income Rate - DOMINANT (thick/bold) */}
            <div className="flex items-baseline justify-between">
              <div
                className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                INCOME RATE
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={`${accentColor} text-4xl leading-none`}
                  style={{
                    fontFamily: 'Saira Condensed',
                    fontWeight: 700,
                    textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`
                  }}
                >
                  {goldGenData.total.toLocaleString('en-US')}
                </span>
                <span
                  className="text-sm text-white/50"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                >
                  g/hr
                </span>
              </div>
            </div>

            <div className="relative h-px">
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400/30' : 'via-cyan-400/30'} to-transparent`} />
            </div>

            {/* Cumulative - subdued (ultra thin) */}
            <div className="flex items-baseline justify-between">
              <div
                className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                CUMULATIVE
              </div>
              <div className="flex items-baseline">
                <span
                  className={`${accentColor} text-2xl leading-none`}
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 100 }}
                >
                  {currentOwnerGold.toLocaleString('en-US')}
                </span>
                <span
                  className="text-xs text-white/50"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 100 }}
                >
                  g
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // COMPACT DENSITY V4 - Spacing Contrast (spacious income vs tight cumulative)
    if (combinedGoldCardStyle === 'compact-density-v4') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10">
            {/* Income Rate - DOMINANT (spacious padding) */}
            <div className="flex items-baseline justify-between py-3">
              <div
                className="text-[10px] text-white/40 uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                INCOME RATE
              </div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`${accentColor} text-5xl leading-none`}
                  style={{
                    fontFamily: 'Saira Condensed',
                    fontWeight: 200,
                    textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`,
                    letterSpacing: '0.02em'
                  }}
                >
                  {goldGenData.total.toLocaleString('en-US')}
                </span>
                <span
                  className="text-sm text-white/50"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 200 }}
                >
                  g/hr
                </span>
              </div>
            </div>

            <div className="relative h-px my-3">
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400/30' : 'via-cyan-400/30'} to-transparent`} />
            </div>

            {/* Cumulative - subdued (tight spacing) */}
            <div className="flex items-baseline justify-between py-1">
              <div
                className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                CUMULATIVE
              </div>
              <div className="flex items-baseline gap-0.5">
                <span
                  className="text-white/70 text-xl leading-none"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 200 }}
                >
                  {currentOwnerGold.toLocaleString('en-US')}
                </span>
                <span
                  className="text-xs text-white/50"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 200 }}
                >
                  g
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // COMPACT DENSITY V5 - Mixed Contrast (combine multiple approaches)
    if (combinedGoldCardStyle === 'compact-density-v5') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10">
            {/* Income Rate - DOMINANT (big, colored, bold, spacious) */}
            <div className="flex items-baseline justify-between py-3">
              <div
                className="text-[10px] text-white/50 uppercase tracking-[0.15em]"
                style={{ fontFamily: 'Inter', fontWeight: 500 }}
              >
                INCOME RATE
              </div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`${accentColor} text-6xl leading-none`}
                  style={{
                    fontFamily: 'Saira Condensed',
                    fontWeight: 600,
                    textShadow: `0 0 25px ${textShadowPrimary}, 0 0 50px ${textShadowSecondary}`,
                    letterSpacing: '0.03em'
                  }}
                >
                  {goldGenData.total.toLocaleString('en-US')}
                </span>
                <span
                  className="text-xs text-white/40"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 200 }}
                >
                  g/hr
                </span>
              </div>
            </div>

            <div className="relative h-px my-2">
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400/30' : 'via-cyan-400/30'} to-transparent`} />
            </div>

            {/* Cumulative - subdued (small, white, thin, tight) */}
            <div className="flex items-baseline justify-between py-0.5">
              <div
                className="text-[8px] text-white/30 uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                CUMULATIVE
              </div>
              <div className="flex items-baseline">
                <span
                  className="text-white/50 text-lg leading-none"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 100 }}
                >
                  {currentOwnerGold.toLocaleString('en-US')}
                </span>
                <span
                  className="text-[10px] text-white/40"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 100 }}
                >
                  g
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // COMPACT DENSITY V3 - LAYOUT 1: Centered Stack (all centered alignment)
    if (combinedGoldCardStyle === 'compact-density-v3-layout1') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10 space-y-3">
            {/* INCOME header - centered */}
            <div
              className="text-center text-[10px] text-white/40 uppercase tracking-[0.3em]"
              style={{ fontFamily: 'Inter', fontWeight: 400 }}
            >
              INCOME
            </div>

            {/* Income Rate - label above, centered */}
            <div className="text-center space-y-1">
              <div
                className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                INCOME RATE
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span
                  className={`${accentColor} text-4xl leading-none`}
                  style={{
                    fontFamily: 'Saira Condensed',
                    fontWeight: 700,
                    textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`
                  }}
                >
                  21
                </span>
                <span
                  className="text-sm text-white/50"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                >
                  g/hr
                </span>
              </div>
            </div>

            <div className="relative h-px">
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400/30' : 'via-cyan-400/30'} to-transparent`} />
            </div>

            {/* Cumulative - label above, centered */}
            <div className="text-center space-y-1">
              <div
                className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                CUMULATIVE
              </div>
              <div className="flex items-baseline justify-center gap-0.5">
                <span
                  className={`${accentColor} text-2xl leading-none`}
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 100 }}
                >
                  453,412
                </span>
                <span
                  className="text-xs text-white/50"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 100 }}
                >
                  g
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // COMPACT DENSITY V3 - LAYOUT 2: Left Labels, Right Numbers (with header)
    if (combinedGoldCardStyle === 'compact-density-v3-layout2') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10 space-y-3">
            {/* INCOME header - left aligned */}
            <div
              className="text-[10px] text-white/40 uppercase tracking-[0.3em]"
              style={{ fontFamily: 'Inter', fontWeight: 400 }}
            >
              INCOME
            </div>

            {/* Income Rate - label left, number right */}
            <div className="flex items-baseline justify-between">
              <div
                className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                INCOME RATE
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={`${accentColor} text-4xl leading-none`}
                  style={{
                    fontFamily: 'Saira Condensed',
                    fontWeight: 700,
                    textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`
                  }}
                >
                  21
                </span>
                <span
                  className="text-sm text-white/50"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                >
                  g/hr
                </span>
              </div>
            </div>

            <div className="relative h-px">
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400/30' : 'via-cyan-400/30'} to-transparent`} />
            </div>

            {/* Cumulative - label left, number right */}
            <div className="flex items-baseline justify-between">
              <div
                className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                CUMULATIVE
              </div>
              <div className="flex items-baseline gap-0.5">
                <span
                  className={`${accentColor} text-2xl leading-none`}
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 100 }}
                >
                  453,412
                </span>
                <span
                  className="text-xs text-white/50"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 100 }}
                >
                  g
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // COMPACT DENSITY V3 - LAYOUT 3: Numbers First (reversed pattern)
    if (combinedGoldCardStyle === 'compact-density-v3-layout3') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10 space-y-3">
            {/* INCOME header */}
            <div
              className="text-[10px] text-white/40 uppercase tracking-[0.3em]"
              style={{ fontFamily: 'Inter', fontWeight: 400 }}
            >
              INCOME
            </div>

            {/* Income Rate - number first (big), label below (small) */}
            <div className="space-y-0.5">
              <div className="flex items-baseline justify-center gap-1">
                <span
                  className={`${accentColor} text-4xl leading-none`}
                  style={{
                    fontFamily: 'Saira Condensed',
                    fontWeight: 700,
                    textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`
                  }}
                >
                  21
                </span>
                <span
                  className="text-sm text-white/50"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                >
                  g/hr
                </span>
              </div>
              <div
                className="text-center text-[9px] text-white/40 uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                INCOME RATE
              </div>
            </div>

            <div className="relative h-px">
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400/30' : 'via-cyan-400/30'} to-transparent`} />
            </div>

            {/* Cumulative - number first (big), label below (small) */}
            <div className="space-y-0.5">
              <div className="flex items-baseline justify-center gap-0.5">
                <span
                  className={`${accentColor} text-2xl leading-none`}
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 100 }}
                >
                  453,412
                </span>
                <span
                  className="text-xs text-white/50"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 100 }}
                >
                  g
                </span>
              </div>
              <div
                className="text-center text-[9px] text-white/40 uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                CUMULATIVE
              </div>
            </div>
          </div>
        </div>
      );
    }

    // COMPACT DENSITY V3 - LAYOUT 4: Split Layout (alternating alignment)
    if (combinedGoldCardStyle === 'compact-density-v3-layout4') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10 space-y-3">
            {/* INCOME header - spans full width */}
            <div
              className="text-center text-[10px] text-white/40 uppercase tracking-[0.3em]"
              style={{ fontFamily: 'Inter', fontWeight: 400 }}
            >
              INCOME
            </div>

            {/* Income Rate - number left, label right */}
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span
                  className={`${accentColor} text-4xl leading-none`}
                  style={{
                    fontFamily: 'Saira Condensed',
                    fontWeight: 700,
                    textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`
                  }}
                >
                  21
                </span>
                <span
                  className="text-sm text-white/50"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                >
                  g/hr
                </span>
              </div>
              <div
                className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                INCOME RATE
              </div>
            </div>

            <div className="relative h-px">
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400/30' : 'via-cyan-400/30'} to-transparent`} />
            </div>

            {/* Cumulative - label left, number right (opposite of income) */}
            <div className="flex items-baseline justify-between">
              <div
                className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                CUMULATIVE
              </div>
              <div className="flex items-baseline gap-0.5">
                <span
                  className={`${accentColor} text-2xl leading-none`}
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 100 }}
                >
                  453,412
                </span>
                <span
                  className="text-xs text-white/50"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 100 }}
                >
                  g
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // COMPACT DENSITY V3 - LAYOUT 5: Vertical Emphasis (full vertical stack)
    if (combinedGoldCardStyle === 'compact-density-v3-layout5') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10 space-y-2">
            {/* INCOME header */}
            <div
              className="text-[10px] text-white/40 uppercase tracking-[0.3em]"
              style={{ fontFamily: 'Inter', fontWeight: 400 }}
            >
              INCOME
            </div>

            {/* Income Rate - full vertical stack */}
            <div className="space-y-1">
              <div
                className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                INCOME RATE
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={`${accentColor} text-4xl leading-none`}
                  style={{
                    fontFamily: 'Saira Condensed',
                    fontWeight: 700,
                    textShadow: `0 0 20px ${textShadowPrimary}, 0 0 40px ${textShadowSecondary}`
                  }}
                >
                  21
                </span>
                <span
                  className="text-sm text-white/50"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}
                >
                  g/hr
                </span>
              </div>
            </div>

            <div className="relative h-px">
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${useYellowGlow ? 'via-yellow-400/30' : 'via-cyan-400/30'} to-transparent`} />
            </div>

            {/* Cumulative - full vertical stack */}
            <div className="space-y-1">
              <div
                className="text-[9px] text-white/40 uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                CUMULATIVE
              </div>
              <div className="flex items-baseline gap-0.5">
                <span
                  className={`${accentColor} text-2xl leading-none`}
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 100 }}
                >
                  453,412
                </span>
                <span
                  className="text-xs text-white/50"
                  style={{ fontFamily: 'Saira Condensed', fontWeight: 100 }}
                >
                  g
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // OVERLAPPING LAYERS - Cards that overlap with depth/layering effect
    if (combinedGoldCardStyle === 'overlapping-layers') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm overflow-hidden">
          {/* Glowing border effect */}
          <div
            className={`absolute inset-0 border-2 ${borderColor} pointer-events-none`}
            style={{
              boxShadow: `0 0 30px ${glowRgba}, inset 0 0 30px ${glowRgbaInset}`,
              filter: 'blur(0.5px)'
            }}
          />

          {/* Gradient overlay accent */}
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, ${useYellowGlow ? '#fab617' : '#00d4ff'} 0%, transparent 100%)`
            }}
          />

          <div className="relative z-10">
            {/* Back layer: Cumulative (positioned lower) */}
            <div
              className="relative bg-black/50 border border-gray-600/30 p-4 mb-4"
              style={{
                transform: 'translateY(12px)',
                zIndex: 1
              }}
            >
              <div
                className="text-[9px] text-white/40 uppercase tracking-[0.2em] mb-1"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                CUMULATIVE
              </div>
              <div
                className="text-white text-xl"
                style={{
                  fontFamily: 'Saira Condensed',
                  fontWeight: 300
                }}
              >
                {formatGold(currentOwnerGold)}
              </div>
            </div>

            {/* Front layer: Income Rate (overlaps back layer, elevated) */}
            <div
              className={`relative bg-black/70 border-2 ${borderColor} p-4`}
              style={{
                transform: 'translateY(-28px)',
                zIndex: 2,
                boxShadow: `0 4px 20px rgba(0, 0, 0, 0.5), 0 0 30px ${useYellowGlow ? 'rgba(250, 182, 23, 0.2)' : 'rgba(0, 212, 255, 0.2)'}`
              }}
            >
              <div
                className="text-[9px] text-white/40 uppercase tracking-[0.2em] mb-1"
                style={{ fontFamily: 'Inter', fontWeight: 400 }}
              >
                INCOME RATE
              </div>
              <div
                className={`${accentColor} text-3xl leading-none`}
                style={{
                  fontFamily: 'Saira Condensed',
                  fontWeight: 200,
                  textShadow: `0 0 20px ${useYellowGlow ? 'rgba(250, 182, 23, 1)' : 'rgba(0, 212, 255, 1)'}, 0 0 40px ${useYellowGlow ? 'rgba(250, 182, 23, 0.5)' : 'rgba(0, 212, 255, 0.5)'}`
                }}
              >
                {formatGoldRate(goldGenData.total)}
              </div>
            </div>
          </div>
        </div>
      );
    }


    return null;
  };

  // Render Gold Generation Card (Base + Bonus + Total) with 7 different styles
  const renderGoldProducedCard = () => {
    // Sample gold generation data (G/hr)
    const goldGenData = {
      base: 1250,
      bonus: 875,
      total: 2125
    };

    // Format gold numbers with commas
    const formatGold = (num: number) => num.toLocaleString('en-US') + ' G/hr';

    // Dynamic colors based on useYellowGlow
    const accentColor = useYellowGlow ? 'text-yellow-400' : 'text-cyan-400';
    const accentColorDim = useYellowGlow ? 'text-yellow-400/60' : 'text-cyan-400/60';
    const borderColor = useYellowGlow ? 'border-yellow-400/50' : 'border-cyan-400/50';
    const glowRgba = useYellowGlow ? 'rgba(250, 182, 23, 0.3)' : 'rgba(0, 212, 255, 0.3)';
    const glowRgbaInset = useYellowGlow ? 'rgba(250, 182, 23, 0.1)' : 'rgba(0, 212, 255, 0.1)';
    const textShadowGlow = useYellowGlow ? '0 0 15px rgba(250, 182, 23, 0.8)' : '0 0 15px rgba(0, 212, 255, 0.8)';

    // Style 1: Pulsing Button Center - Bonus as glowing, pulsing button between Base/Total
    if (goldGenerationStyle === 'pulsing-button') {
      return (
        <div className="relative p-6 bg-black/40 backdrop-blur-sm border border-gray-700/50">
          <div className="space-y-4">
            {/* Base - Top */}
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                Base
              </div>
              <div className="text-white text-xl" style={{ fontFamily: 'Saira Condensed', fontWeight: 200 }}>
                {formatGold(goldGenData.base)}
              </div>
            </div>

            {/* Bonus - Clickable Pulsing Button */}
            <button
              className={`w-full p-4 bg-gradient-to-r ${useYellowGlow ? 'from-yellow-500/20 to-yellow-600/10' : 'from-cyan-500/20 to-cyan-600/10'} border-2 ${borderColor} rounded cursor-pointer transition-all hover:scale-105 active:scale-95`}
              style={{
                boxShadow: `0 0 20px ${glowRgba}, inset 0 0 15px ${glowRgbaInset}`,
                animation: 'pulse 2s ease-in-out infinite'
              }}
            >
              <div className="text-center">
                <div className={`text-[10px] ${accentColorDim} uppercase tracking-wider mb-2`} style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                  Bonus
                </div>
                <div
                  className={`${accentColor} text-3xl mb-1`}
                  style={{
                    fontFamily: 'Saira Condensed',
                    fontWeight: 200,
                    textShadow: textShadowGlow
                  }}
                >
                  +{formatGold(goldGenData.bonus)}
                </div>
                <div className={`text-[9px] ${accentColorDim} uppercase tracking-widest`} style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                  ▸ TAP FOR DETAILS ◂
                </div>
              </div>
            </button>

            {/* Total - Bottom */}
            <div className="pt-3 border-t border-gray-700/50">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
                Total
              </div>
              <div
                className={`${accentColor} text-2xl`}
                style={{
                  fontFamily: 'Saira Condensed',
                  fontWeight: 200,
                  textShadow: `0 0 10px ${useYellowGlow ? 'rgba(250, 182, 23, 0.6)' : 'rgba(0, 212, 255, 0.6)'}`
                }}
              >
                {formatGold(goldGenData.total)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if(goldGenerationStyle==='interactive-cards'){return(<div className="relative p-4 bg-black/40 backdrop-blur-sm border border-gray-700/50"><div className="flex gap-3"><div className="flex-1 p-3 bg-black/60 border border-gray-600/50"><div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1"style={{fontFamily:'Inter',fontWeight:400}}>Base</div><div className="text-white text-lg"style={{fontFamily:'Saira Condensed',fontWeight:200}}>{formatGold(goldGenData.base)}</div></div><button className={`flex-1 p-3 bg-gradient-to-br ${useYellowGlow?'from-yellow-500/30 to-yellow-600/10':'from-cyan-500/30 to-cyan-600/10'} border-2 ${borderColor} cursor-pointer transition-all hover:-translate-y-2 hover:shadow-2xl active:translate-y-0`}style={{boxShadow:`0 4px 20px ${glowRgba}`,transitionDuration:'200ms'}}><div className="text-center"><div className={`text-[9px] ${accentColor} uppercase tracking-wider mb-1`}style={{fontFamily:'Inter',fontWeight:400}}>Bonus ✦</div><div className={`${accentColor} text-2xl mb-1`}style={{fontFamily:'Saira Condensed',fontWeight:200,textShadow:textShadowGlow}}>+{formatGold(goldGenData.bonus)}</div><div className={`text-[8px] ${accentColorDim} uppercase tracking-widest`}style={{fontFamily:'Inter',fontWeight:400}}>CLICK ME</div></div></button><div className="flex-1 p-3 bg-black/60 border border-gray-600/50"><div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1"style={{fontFamily:'Inter',fontWeight:400}}>Total</div><div className={`${accentColor} text-lg`}style={{fontFamily:'Saira Condensed',fontWeight:200,textShadow:`0 0 8px ${useYellowGlow?'rgba(250, 182, 23, 0.5)':'rgba(0, 212, 255, 0.5)'}`}}>{formatGold(goldGenData.total)}</div></div></div></div>);}
    if(goldGenerationStyle==='progress-bar'){const basePercent=(goldGenData.base/goldGenData.total)*100;const bonusPercent=(goldGenData.bonus/goldGenData.total)*100;return(<div className="relative p-6 bg-black/40 backdrop-blur-sm border border-gray-700/50"><div className="flex justify-between mb-4"><div><div className="text-[9px] text-gray-400 uppercase tracking-wider"style={{fontFamily:'Inter',fontWeight:400}}>Base</div><div className="text-white text-sm"style={{fontFamily:'Saira Condensed',fontWeight:200}}>{formatGold(goldGenData.base)}</div></div><div className="text-center"><div className={`text-[9px] ${accentColor} uppercase tracking-wider`}style={{fontFamily:'Inter',fontWeight:400}}>Bonus</div><div className={`${accentColor} text-sm`}style={{fontFamily:'Saira Condensed',fontWeight:200}}>+{formatGold(goldGenData.bonus)}</div></div><div className="text-right"><div className="text-[9px] text-gray-400 uppercase tracking-wider"style={{fontFamily:'Inter',fontWeight:400}}>Total</div><div className={`${accentColor} text-sm`}style={{fontFamily:'Saira Condensed',fontWeight:200}}>{formatGold(goldGenData.total)}</div></div></div><div className="relative h-16 bg-black/60 border border-gray-600/50 overflow-hidden"><div className="absolute left-0 top-0 bottom-0 bg-gray-600/40"style={{width:`${basePercent}%`}}/><button className={`absolute top-0 bottom-0 bg-gradient-to-r ${useYellowGlow?'from-yellow-500/50 to-yellow-400/30':'from-cyan-500/50 to-cyan-400/30'} border-x-2 ${borderColor} cursor-pointer transition-all hover:brightness-125 active:brightness-90 group`}style={{left:`${basePercent}%`,width:`${bonusPercent}%`,boxShadow:`0 0 20px ${glowRgba}, inset 0 0 15px ${glowRgbaInset}`}}><div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><div className={`${accentColor} text-xl group-hover:scale-110 transition-transform`}style={{fontFamily:'Saira Condensed',fontWeight:200,textShadow:textShadowGlow}}>+{formatGold(goldGenData.bonus)}</div><div className={`text-[8px] ${accentColor} uppercase tracking-widest opacity-80`}style={{fontFamily:'Inter',fontWeight:400}}>▸ TAP ◂</div></div></div></button></div></div>);}
    if(goldGenerationStyle==='floating-panel'){return(<div className="relative p-6 bg-black/40 backdrop-blur-sm border border-gray-700/50"><div className="grid grid-cols-2 gap-4 mb-6"><div className="p-3 bg-black/60"><div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1"style={{fontFamily:'Inter',fontWeight:400}}>Base</div><div className="text-white text-lg"style={{fontFamily:'Saira Condensed',fontWeight:200}}>{formatGold(goldGenData.base)}</div></div><div className="p-3 bg-black/60"><div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1"style={{fontFamily:'Inter',fontWeight:400}}>Total</div><div className={`${accentColor} text-lg`}style={{fontFamily:'Saira Condensed',fontWeight:200}}>{formatGold(goldGenData.total)}</div></div></div><button className={`w-full p-5 bg-gradient-to-br ${useYellowGlow?'from-yellow-500/40 via-yellow-600/20 to-yellow-700/10':'from-cyan-500/40 via-cyan-600/20 to-cyan-700/10'} border-2 ${borderColor} cursor-pointer transition-all hover:scale-105 hover:-translate-y-1 active:scale-100 active:translate-y-0`}style={{boxShadow:`0 8px 32px ${glowRgba}, 0 0 40px ${glowRgba}, inset 0 0 20px ${glowRgbaInset}`,transform:'translateZ(20px)'}}><div className="text-center"><div className={`text-[10px] ${accentColor} uppercase tracking-widest mb-2 opacity-80`}style={{fontFamily:'Inter',fontWeight:400}}>✦ Bonus ✦</div><div className={`${accentColor} text-4xl mb-2`}style={{fontFamily:'Saira Condensed',fontWeight:200,textShadow:`0 0 20px ${useYellowGlow?'rgba(250, 182, 23, 1)':'rgba(0, 212, 255, 1)'}`}}>+{formatGold(goldGenData.bonus)}</div><div className={`text-[10px] ${accentColor} uppercase tracking-widest flex items-center justify-center gap-2`}style={{fontFamily:'Inter',fontWeight:400}}><span>▸</span><span>VIEW BREAKDOWN</span><span>◂</span></div></div></button></div>);}
    if(goldGenerationStyle==='tech-grid'){return(<div className="relative p-5 bg-black/40 backdrop-blur-sm border border-gray-700/50"><div className="absolute inset-0 opacity-5"style={{backgroundImage:useYellowGlow?'linear-gradient(rgba(250, 182, 23, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(250, 182, 23, 0.4) 1px, transparent 1px)':'linear-gradient(rgba(0, 212, 255, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.4) 1px, transparent 1px)',backgroundSize:'15px 15px'}}/><div className="relative z-10 grid grid-cols-3 gap-4"><div className="p-4 bg-black/60 border border-gray-600/50"><div className="text-[9px] text-gray-400 uppercase tracking-wider mb-2"style={{fontFamily:'Inter',fontWeight:400}}>Base</div><div className="text-white text-lg"style={{fontFamily:'Saira Condensed',fontWeight:200}}>{formatGold(goldGenData.base)}</div></div><button className={`p-4 bg-gradient-to-br ${useYellowGlow?'from-yellow-500/30 to-yellow-700/10':'from-cyan-500/30 to-cyan-700/10'} border-2 cursor-pointer transition-all hover:scale-110 active:scale-105 relative overflow-hidden`}style={{borderColor:useYellowGlow?'#fab617':'#00d4ff',boxShadow:`0 0 25px ${glowRgba}`}}><div className={`absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 ${borderColor}`}style={{animation:'pulse 1.5s ease-in-out infinite'}}/><div className={`absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 ${borderColor}`}style={{animation:'pulse 1.5s ease-in-out infinite 0.3s'}}/><div className={`absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 ${borderColor}`}style={{animation:'pulse 1.5s ease-in-out infinite 0.6s'}}/><div className={`absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 ${borderColor}`}style={{animation:'pulse 1.5s ease-in-out infinite 0.9s'}}/><div className="text-center"><div className={`text-[9px] ${accentColor} uppercase tracking-wider mb-2`}style={{fontFamily:'Inter',fontWeight:400}}>Bonus</div><div className={`${accentColor} text-xl`}style={{fontFamily:'Saira Condensed',fontWeight:200,textShadow:textShadowGlow}}>+{formatGold(goldGenData.bonus)}</div><div className={`text-[7px] ${accentColorDim} uppercase tracking-widest mt-1`}style={{fontFamily:'Inter',fontWeight:400}}>ANALYZE</div></div></button><div className="p-4 bg-black/60 border border-gray-600/50"><div className="text-[9px] text-gray-400 uppercase tracking-wider mb-2"style={{fontFamily:'Inter',fontWeight:400}}>Total</div><div className={`${accentColor} text-lg`}style={{fontFamily:'Saira Condensed',fontWeight:200}}>{formatGold(goldGenData.total)}</div></div></div></div>);}
    if(goldGenerationStyle==='command-line'){return(<div className="relative p-5 bg-black/60 backdrop-blur-sm border border-gray-700/50 font-mono"><div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700/50"><div className="w-3 h-3 rounded-full bg-red-500/50"/><div className="w-3 h-3 rounded-full bg-yellow-500/50"/><div className="w-3 h-3 rounded-full bg-green-500/50"/><div className="text-[9px] text-gray-500 uppercase tracking-wider ml-2"style={{fontFamily:'Inter',fontWeight:400}}>Gold Generation Terminal</div></div><div className="space-y-3"><div className="flex items-center gap-3"><span className="text-green-500 text-xs">$</span><span className="text-gray-400 text-xs"style={{fontFamily:'Inter',fontWeight:400}}>BASE_RATE:</span><span className="text-white text-sm"style={{fontFamily:'Saira Condensed',fontWeight:200}}>{formatGold(goldGenData.base)}</span></div><div className="w-full flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-green-500/20 to-transparent border-l-4 border-green-400/50"style={{boxShadow:'0 0 15px rgba(0, 255, 0, 0.3)'}}><span className="text-green-400 text-xs">❯</span><span className="text-green-400 text-xs"style={{fontFamily:'Inter',fontWeight:400}}>BONUS_RATE:</span><span className="text-green-400 text-sm"style={{fontFamily:'Saira Condensed',fontWeight:200,textShadow:'0 0 15px rgba(0, 255, 0, 0.8)'}}>+{formatGold(goldGenData.bonus)}</span></div><div className="flex items-center gap-3 pt-2 border-t border-gray-700/50"><span className="text-green-500 text-xs">$</span><span className="text-gray-400 text-xs"style={{fontFamily:'Inter',fontWeight:400}}>TOTAL_OUTPUT:</span><span className={`${accentColor} text-sm`}style={{fontFamily:'Saira Condensed',fontWeight:200,textShadow:`0 0 8px ${useYellowGlow?'rgba(250, 182, 23, 0.5)':'rgba(0, 212, 255, 0.5)'}`}}>{formatGold(goldGenData.total)}</span></div></div></div>);}
    if (goldGenerationStyle === 'matrix-badge') {return (<div className="relative p-6 bg-black/50 backdrop-blur-sm border border-gray-700/50 overflow-hidden"><div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 255, 0, 0.2) 0px, transparent 2px, transparent 4px, rgba(0, 255, 0, 0.2) 6px)', animation: 'matrixRain 3s linear infinite' }} /><div className="relative z-10 space-y-4"><div className="flex justify-between items-center px-3 py-2 bg-black/40"><div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Base</div><div className="text-white text-lg" style={{ fontFamily: 'Saira Condensed', fontWeight: 200 }}>{formatGold(goldGenData.base)}</div></div><div className="relative p-4 bg-gradient-to-br from-green-500/20 via-green-600/10 to-black/40 border-2 border-green-400/50" style={{ boxShadow: '0 0 30px rgba(0, 255, 0, 0.3), inset 0 0 20px rgba(0, 255, 0, 0.1)' }}><div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-green-400/50" /><div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-green-400/50" /><div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-green-400/50" /><div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-green-400/50" /><div className="text-center"><div className="text-[10px] text-green-400/60 uppercase tracking-widest mb-2" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Bonus Generation</div><div className="text-green-400 text-3xl" style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: '0 0 15px rgba(0, 255, 0, 0.8)' }}>+{formatGold(goldGenData.bonus)}</div></div></div><div className="flex justify-between items-center px-3 py-2 bg-black/40 border-t-2 border-gray-700/50"><div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Total</div><div className={`${accentColor} text-xl`} style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: `0 0 10px ${useYellowGlow ? 'rgba(250, 182, 23, 0.6)' : 'rgba(0, 212, 255, 0.6)'}` }}>{formatGold(goldGenData.total)}</div></div></div></div>);}
    if (goldGenerationStyle === 'energy-display') {return (<div className="relative p-6 bg-black/40 backdrop-blur-sm border border-gray-700/50"><div className="space-y-4"><div className="p-3 bg-black/60 border border-gray-600/50"><div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Base</div><div className="text-white text-xl" style={{ fontFamily: 'Saira Condensed', fontWeight: 200 }}>{formatGold(goldGenData.base)}</div></div><div className="p-4 bg-gradient-to-r from-green-500/20 to-green-600/10 border-2 border-green-400/50 rounded" style={{ boxShadow: '0 0 20px rgba(0, 255, 0, 0.3), inset 0 0 15px rgba(0, 255, 0, 0.1)', animation: 'pulse 2s ease-in-out infinite' }}><div className="text-center"><div className="text-[10px] text-green-400/60 uppercase tracking-wider mb-2" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Bonus</div><div className="text-green-400 text-3xl" style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: '0 0 15px rgba(0, 255, 0, 0.8)' }}>+{formatGold(goldGenData.bonus)}</div></div></div><div className="p-3 bg-black/60 border border-gray-600/50 border-t-2"><div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Total</div><div className={`${accentColor} text-2xl`} style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: `0 0 10px ${useYellowGlow ? 'rgba(250, 182, 23, 0.6)' : 'rgba(0, 212, 255, 0.6)'}` }}>{formatGold(goldGenData.total)}</div></div></div></div>);}
    if (goldGenerationStyle === 'split-panels') {return (<div className="relative p-0 bg-black/40 backdrop-blur-sm border border-gray-700/50 overflow-hidden"><div className="flex divide-x divide-gray-600/50"><div className="flex-1 p-5 bg-black/20"><div className="text-[9px] text-gray-400 uppercase tracking-wider mb-2" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Base</div><div className="text-white text-xl" style={{ fontFamily: 'Saira Condensed', fontWeight: 200 }}>{formatGold(goldGenData.base)}</div></div><div className="flex-1 p-5 bg-gradient-to-b from-green-500/10 to-black/30 border-x-2 border-green-400/30" style={{ boxShadow: 'inset 0 0 20px rgba(0, 255, 0, 0.1)' }}><div className="text-[9px] text-green-400/60 uppercase tracking-wider mb-2" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Bonus</div><div className="text-green-400 text-2xl" style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: '0 0 15px rgba(0, 255, 0, 0.8)' }}>+{formatGold(goldGenData.bonus)}</div></div><div className="flex-1 p-5 bg-black/20"><div className="text-[9px] text-gray-400 uppercase tracking-wider mb-2" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Total</div><div className={`${accentColor} text-xl`} style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: `0 0 10px ${useYellowGlow ? 'rgba(250, 182, 23, 0.6)' : 'rgba(0, 212, 255, 0.6)'}` }}>{formatGold(goldGenData.total)}</div></div></div></div>);}
    if (goldGenerationStyle === 'holographic-readout') {return (<div className="relative p-6 bg-black/50 backdrop-blur-sm border border-gray-700/50 overflow-hidden"><div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 212, 255, 0.3) 0px, transparent 1px, transparent 2px, rgba(0, 212, 255, 0.3) 3px)', animation: 'scanlines 8s linear infinite' }} /><div className="relative z-10 space-y-3"><div className="p-3 bg-black/40 border-l-4 border-gray-500/50" style={{ transform: 'skewX(-2deg)' }}><div style={{ transform: 'skewX(2deg)' }}><div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Base Generation</div><div className="text-white text-lg" style={{ fontFamily: 'Saira Condensed', fontWeight: 200 }}>{formatGold(goldGenData.base)}</div></div></div><div className="p-4 bg-gradient-to-br from-green-500/30 via-green-400/15 to-green-600/10 border-l-4 border-green-400/70" style={{ transform: 'skewX(-2deg)', boxShadow: '0 0 25px rgba(0, 255, 0, 0.4), inset 0 0 20px rgba(0, 255, 0, 0.15)', backgroundImage: 'linear-gradient(135deg, rgba(0, 255, 0, 0.1) 25%, transparent 25%, transparent 50%, rgba(0, 255, 0, 0.1) 50%, rgba(0, 255, 0, 0.1) 75%, transparent 75%, transparent)', backgroundSize: '20px 20px', animation: 'holographicShift 3s linear infinite' }}><div style={{ transform: 'skewX(2deg)' }}><div className="text-[10px] text-green-400/70 uppercase tracking-wider mb-2" style={{ fontFamily: 'Inter', fontWeight: 400 }}>◆ Bonus Enhancement ◆</div><div className="text-green-400 text-3xl" style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: '0 0 20px rgba(0, 255, 0, 1)' }}>+{formatGold(goldGenData.bonus)}</div></div></div><div className="p-3 bg-black/40 border-l-4 border-gray-500/50" style={{ transform: 'skewX(-2deg)' }}><div style={{ transform: 'skewX(2deg)' }}><div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Total Output</div><div className={`${accentColor} text-lg`} style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: `0 0 10px ${useYellowGlow ? 'rgba(250, 182, 23, 0.6)' : 'rgba(0, 212, 255, 0.6)'}` }}>{formatGold(goldGenData.total)}</div></div></div></div></div>);}
    if (goldGenerationStyle === 'tech-metrics') {return (<div className="relative p-5 bg-black/40 backdrop-blur-sm border border-gray-700/50"><div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(0, 212, 255, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.4) 1px, transparent 1px)', backgroundSize: '15px 15px' }} /><div className="relative z-10 grid grid-cols-3 gap-4"><div className="relative p-4 bg-black/60 border border-gray-600/50"><div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gray-500/50" /><div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gray-500/50" /><div className="text-[9px] text-gray-400 uppercase tracking-wider mb-2" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Base</div><div className="text-white text-lg" style={{ fontFamily: 'Saira Condensed', fontWeight: 200 }}>{formatGold(goldGenData.base)}</div></div><div className="relative p-4 bg-gradient-to-br from-green-500/30 to-green-700/10 border-2 border-green-400/50" style={{ boxShadow: '0 0 25px rgba(0, 255, 0, 0.3)' }}><div className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-green-400/70" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} /><div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-green-400/70" style={{ animation: 'pulse 1.5s ease-in-out infinite 0.3s' }} /><div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-green-400/70" style={{ animation: 'pulse 1.5s ease-in-out infinite 0.6s' }} /><div className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-green-400/70" style={{ animation: 'pulse 1.5s ease-in-out infinite 0.9s' }} /><div className="text-center"><div className="text-[9px] text-green-400/70 uppercase tracking-wider mb-2" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Bonus</div><div className="text-green-400 text-xl" style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: '0 0 15px rgba(0, 255, 0, 0.8)' }}>+{formatGold(goldGenData.bonus)}</div></div></div><div className="relative p-4 bg-black/60 border border-gray-600/50"><div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gray-500/50" /><div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gray-500/50" /><div className="text-[9px] text-gray-400 uppercase tracking-wider mb-2" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Total</div><div className={`${accentColor} text-lg`} style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: `0 0 10px ${useYellowGlow ? 'rgba(250, 182, 23, 0.6)' : 'rgba(0, 212, 255, 0.6)'}` }}>{formatGold(goldGenData.total)}</div></div></div></div>);}
    if (goldGenerationStyle === 'data-stream') {return (<div className="relative p-6 bg-black/40 backdrop-blur-sm border border-gray-700/50 overflow-hidden"><div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0, 255, 0, 0.3) 50%, transparent 100%)', backgroundSize: '200% 100%', animation: 'dataFlow 3s linear infinite' }} /><div className="relative z-10 space-y-4"><div className="flex justify-between items-center p-3 bg-black/50 border-l-2 border-gray-500/50"><div className="text-[9px] text-gray-400 uppercase tracking-wider" style={{ fontFamily: 'Inter', fontWeight: 400 }}>▸ Base Stream</div><div className="text-white text-lg" style={{ fontFamily: 'Saira Condensed', fontWeight: 200 }}>{formatGold(goldGenData.base)}</div></div><div className="relative p-4 bg-gradient-to-r from-green-500/30 via-green-400/20 to-green-500/30 border-l-4 border-green-400/70" style={{ boxShadow: '0 0 30px rgba(0, 255, 0, 0.4), inset 0 0 20px rgba(0, 255, 0, 0.1)' }}><div className="absolute inset-0 opacity-30" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0, 255, 0, 0.5) 50%, transparent 100%)', backgroundSize: '200% 100%', animation: 'dataFlow 2s linear infinite' }} /><div className="relative text-center"><div className="text-[10px] text-green-400/70 uppercase tracking-widest mb-2" style={{ fontFamily: 'Inter', fontWeight: 400 }}>◆◆ Bonus Data Stream ◆◆</div><div className="text-green-400 text-3xl" style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: '0 0 20px rgba(0, 255, 0, 1)' }}>+{formatGold(goldGenData.bonus)}</div></div></div><div className="flex justify-between items-center p-3 bg-black/50 border-l-2 border-gray-500/50 border-t-2 border-t-gray-700/50"><div className="text-[9px] text-gray-400 uppercase tracking-wider" style={{ fontFamily: 'Inter', fontWeight: 400 }}>▸ Total Output</div><div className={`${accentColor} text-lg`} style={{ fontFamily: 'Saira Condensed', fontWeight: 200, textShadow: `0 0 10px ${useYellowGlow ? 'rgba(250, 182, 23, 0.6)' : 'rgba(0, 212, 255, 0.6)'}` }}>{formatGold(goldGenData.total)}</div></div></div></div>);}
    if(goldGenerationStyle==='compact-table'){return(<div className="relative p-3 bg-black/40 backdrop-blur-sm border border-gray-700/50"><div className="space-y-2"><div className="flex justify-between items-center py-1 border-b border-gray-700/30"><span className="text-[10px] text-gray-400 uppercase tracking-wider"style={{fontFamily:'Inter',fontWeight:400}}>Base</span><span className="text-white text-sm"style={{fontFamily:'Saira Condensed',fontWeight:200}}>{formatGold(goldGenData.base)}</span></div><div className="flex justify-between items-center py-1 border-b border-gray-700/30"><span className="text-[10px] text-green-400 uppercase tracking-wider"style={{fontFamily:'Inter',fontWeight:400}}>Bonus</span><span className="text-green-400 text-sm"style={{fontFamily:'Saira Condensed',fontWeight:200,textShadow:'0 0 10px rgba(0, 255, 0, 0.6)'}}>+{formatGold(goldGenData.bonus)}</span></div><div className="flex justify-between items-center py-1 pt-2"><span className={`text-[10px] ${accentColor} uppercase tracking-wider font-bold`}style={{fontFamily:'Inter',fontWeight:400}}>Total</span><span className={`${accentColor} text-base font-bold`}style={{fontFamily:'Saira Condensed',fontWeight:200,textShadow:`0 0 8px ${useYellowGlow?'rgba(250, 182, 23, 0.5)':'rgba(0, 212, 255, 0.5)'}`}}>{formatGold(goldGenData.total)}</span></div></div></div>);}
    if(goldGenerationStyle==='inline-metrics'){return(<div className="relative p-2 bg-black/40 backdrop-blur-sm border border-gray-700/50"><div className="flex items-center justify-between divide-x divide-gray-700/50"><div className="flex-1 px-2 text-center"><div className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5"style={{fontFamily:'Inter',fontWeight:400}}>Base</div><div className="text-white text-xs"style={{fontFamily:'Saira Condensed',fontWeight:200}}>{formatGold(goldGenData.base)}</div></div><div className="flex-1 px-2 text-center"><div className="text-[9px] text-green-400 uppercase tracking-wider mb-0.5"style={{fontFamily:'Inter',fontWeight:400}}>Bonus</div><div className="text-green-400 text-xs"style={{fontFamily:'Saira Condensed',fontWeight:200,textShadow:'0 0 8px rgba(0, 255, 0, 0.6)'}}>+{formatGold(goldGenData.bonus)}</div></div><div className="flex-1 px-2 text-center"><div className={`text-[9px] ${accentColor} uppercase tracking-wider mb-0.5 font-bold`}style={{fontFamily:'Inter',fontWeight:400}}>Total</div><div className={`${accentColor} text-sm font-bold`}style={{fontFamily:'Saira Condensed',fontWeight:200,textShadow:`0 0 8px ${useYellowGlow?'rgba(250, 182, 23, 0.5)':'rgba(0, 212, 255, 0.5)'}`}}>{formatGold(goldGenData.total)}</div></div></div></div>);}
    if(goldGenerationStyle==='dense-grid'){return(<div className="relative p-2 bg-black/40 backdrop-blur-sm border border-gray-700/50"><div className="grid grid-cols-2 gap-2"><div className="p-2 bg-black/30 border border-gray-700/30"><div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1"style={{fontFamily:'Inter',fontWeight:400}}>Base</div><div className="text-white text-xs"style={{fontFamily:'Saira Condensed',fontWeight:200}}>{formatGold(goldGenData.base)}</div></div><div className="p-2 bg-green-500/10 border border-green-500/30"><div className="text-[9px] text-green-400 uppercase tracking-wider mb-1"style={{fontFamily:'Inter',fontWeight:400}}>Bonus</div><div className="text-green-400 text-xs"style={{fontFamily:'Saira Condensed',fontWeight:200,textShadow:'0 0 8px rgba(0, 255, 0, 0.6)'}}>+{formatGold(goldGenData.bonus)}</div></div><div className={`col-span-2 p-2 ${useYellowGlow?'bg-yellow-500/10 border border-yellow-500/30':'bg-cyan-500/10 border border-cyan-500/30'}`}><div className={`text-[9px] ${accentColor} uppercase tracking-wider mb-1 font-bold`}style={{fontFamily:'Inter',fontWeight:400}}>Total Output</div><div className={`${accentColor} text-sm font-bold`}style={{fontFamily:'Saira Condensed',fontWeight:200,textShadow:`0 0 8px ${useYellowGlow?'rgba(250, 182, 23, 0.5)':'rgba(0, 212, 255, 0.5)'}`}}>{formatGold(goldGenData.total)}</div></div></div></div>);}
    if(goldGenerationStyle==='stat-bar'){return(<div className="relative bg-black/40 backdrop-blur-sm border border-gray-700/50"><div className="flex divide-x divide-gray-700/50"><div className="flex-1 px-3 py-2"><div className="flex items-baseline justify-between"><span className="text-[9px] text-gray-400 uppercase tracking-wider"style={{fontFamily:'Inter',fontWeight:400}}>Base</span><span className="text-white text-sm ml-2"style={{fontFamily:'Saira Condensed',fontWeight:200}}>{formatGold(goldGenData.base)}</span></div></div><div className="flex-1 px-3 py-2 bg-green-500/5"><div className="flex items-baseline justify-between"><span className="text-[9px] text-green-400 uppercase tracking-wider"style={{fontFamily:'Inter',fontWeight:400}}>Bonus</span><span className="text-green-400 text-sm ml-2"style={{fontFamily:'Saira Condensed',fontWeight:200,textShadow:'0 0 8px rgba(0, 255, 0, 0.6)'}}>+{formatGold(goldGenData.bonus)}</span></div></div></div><div className={`px-3 py-2 border-t-2 ${useYellowGlow?'border-yellow-500/50 bg-yellow-500/5':'border-cyan-500/50 bg-cyan-500/5'}`}><div className="flex items-baseline justify-between"><span className={`text-[10px] ${accentColor} uppercase tracking-wider font-bold`}style={{fontFamily:'Inter',fontWeight:400}}>Total Output</span><span className={`${accentColor} text-base font-bold ml-2`}style={{fontFamily:'Saira Condensed',fontWeight:200,textShadow:`0 0 10px ${useYellowGlow?'rgba(250, 182, 23, 0.6)':'rgba(0, 212, 255, 0.6)'}`}}>{formatGold(goldGenData.total)}</span></div></div></div>);}
    if(goldGenerationStyle==='compact-table-v2'){return(<div className="relative p-3 bg-black/40 backdrop-blur-sm border border-gray-700/50"><div className="space-y-2"><div className="flex justify-between items-center py-1 border-b border-gray-700/30"><span className="text-[10px] text-gray-400 uppercase tracking-wider"style={{fontFamily:'Inter',fontWeight:400}}>Base</span><span className="text-white text-sm"style={{fontFamily:'Inter',fontWeight:400}}>{formatGold(goldGenData.base)}</span></div><div className="flex justify-between items-center py-1 border-b border-gray-700/30"><span className="text-[10px] text-green-400 uppercase tracking-wider"style={{fontFamily:'Inter',fontWeight:400}}>Bonus</span><span className="text-green-400 text-sm"style={{fontFamily:'Inter',fontWeight:400,textShadow:'0 0 10px rgba(0, 255, 0, 0.6)'}}>+{formatGold(goldGenData.bonus)}</span></div><div className="flex justify-between items-center py-2 pt-3"><span className={`text-[10px] ${accentColor} uppercase tracking-wider font-bold`}style={{fontFamily:'Inter',fontWeight:400}}>Total</span><span className={`${accentColor} text-xl font-bold`}style={{fontFamily:'Inter',fontWeight:400,textShadow:`0 0 12px ${useYellowGlow?'rgba(250, 182, 23, 0.7)':'rgba(0, 212, 255, 0.7)'}`}}>{formatGold(goldGenData.total)}</span></div></div></div>);}
    if(goldGenerationStyle==='compact-table-v3'){return(<div className="relative p-3 bg-black/40 backdrop-blur-sm border border-gray-700/50"><div className="space-y-3"><div className="grid grid-cols-2 gap-3"><div className="text-center py-1 border-r border-gray-700/30"><div className="text-[9px] text-gray-400 uppercase tracking-wider mb-1"style={{fontFamily:'Inter',fontWeight:400}}>Base</div><div className="text-white text-sm"style={{fontFamily:'Inter',fontWeight:400}}>{formatGold(goldGenData.base)}</div></div><div className="text-center py-1"><div className="text-[9px] text-green-400 uppercase tracking-wider mb-1"style={{fontFamily:'Inter',fontWeight:400}}>Bonus</div><div className="text-green-400 text-sm"style={{fontFamily:'Inter',fontWeight:400,textShadow:'0 0 10px rgba(0, 255, 0, 0.6)'}}>+{formatGold(goldGenData.bonus)}</div></div></div><div className={`text-center py-2 border-t-2 ${useYellowGlow?'border-yellow-500/50':'border-cyan-500/50'}`}><div className={`text-[10px] ${accentColor} uppercase tracking-wider font-bold mb-1`}style={{fontFamily:'Inter',fontWeight:400}}>Total Output</div><div className={`${accentColor} text-2xl font-bold`}style={{fontFamily:'Inter',fontWeight:400,textShadow:`0 0 15px ${useYellowGlow?'rgba(250, 182, 23, 0.8)':'rgba(0, 212, 255, 0.8)'}`}}>{formatGold(goldGenData.total)}</div></div></div></div>);}
    if(goldGenerationStyle==='compact-table-v4'){return(<div className="relative p-3 bg-black/40 backdrop-blur-sm border border-gray-700/50"><div className="space-y-3"><div className="flex justify-between items-center"><div className="flex-1"><div className="text-[9px] text-gray-400 uppercase tracking-wider"style={{fontFamily:'Inter',fontWeight:400}}>Base</div><div className="text-white text-xs"style={{fontFamily:'Inter',fontWeight:400}}>{formatGold(goldGenData.base)}</div></div><div className="flex-1 text-right"><div className="text-[9px] text-green-400 uppercase tracking-wider"style={{fontFamily:'Inter',fontWeight:400}}>Bonus</div><div className="text-green-400 text-xs"style={{fontFamily:'Inter',fontWeight:400,textShadow:'0 0 8px rgba(0, 255, 0, 0.6)'}}>+{formatGold(goldGenData.bonus)}</div></div></div><div className={`text-center py-3 border-t-2 ${useYellowGlow?'border-yellow-500/60 bg-yellow-500/5':'border-cyan-500/60 bg-cyan-500/5'}`}><div className={`text-[9px] ${accentColor} uppercase tracking-widest font-bold mb-2`}style={{fontFamily:'Inter',fontWeight:400}}>Total Output</div><div className={`${accentColor} text-3xl font-bold`}style={{fontFamily:'Inter',fontWeight:400,textShadow:`0 0 20px ${useYellowGlow?'rgba(250, 182, 23, 1)':'rgba(0, 212, 255, 1)'}`}}>{formatGold(goldGenData.total)}</div></div></div></div>);}

    return null;
  };

  // Render Tenure/Level Display with 10 bars - 5 Creative Variations
  const renderTenureLevelDisplay = () => {
    const currentLevel = 8;
    const displayLevel = currentLevel <= 10 ? currentLevel : 10;
    const tenureRate = "10.0/h";
    const levelValue = "5";

    // Generate the 10 bars (shared across all styles)
    const renderBars = () => (
      <div className="flex gap-1 sm:gap-1.5 flex-1">
        {Array.from({ length: 10 }, (_, i) => {
          const barLevel = i + 1;
          const isActive = barLevel <= displayLevel;
          const levelColor = levelColors[currentLevel - 1] || '#FFFFFF';

          return (
            <div key={barLevel} className="flex-1">
              <div
                className="h-12 sm:h-10 transition-all duration-500 rounded-sm relative overflow-hidden"
                style={{
                  backgroundColor: isActive ? levelColor : '#1a1a1a',
                  backgroundImage: isActive
                    ? 'none'
                    : 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(102, 102, 102, 0.1) 2px, rgba(102, 102, 102, 0.1) 4px)',
                  border: isActive ? `1px solid ${levelColor}` : '1px solid #666',
                  boxShadow: isActive
                    ? `0 0 12px ${levelColor}80, inset 0 -4px 8px rgba(0,0,0,0.4)`
                    : 'inset 0 2px 4px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(102, 102, 102, 0.2)',
                  opacity: isActive ? 1 : 0.5,
                }}
              >
                {isActive && (
                  <>
                    <div
                      className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                      style={{
                        height: '100%',
                        background: `linear-gradient(to top, ${levelColor}, ${levelColor}80 50%, transparent)`,
                      }}
                    />
                    <div
                      className="absolute top-0 left-0 right-0 h-1/4"
                      style={{
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );

    // Style 1: Classic Side Labels (Original)
    if (tenureLevelStyle === 'classic-side-labels') {
      return (
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className="mek-label-uppercase text-[9px]">TENURE</div>
            <div className="text-white text-sm font-bold">{tenureRate}</div>
          </div>
          {renderBars()}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className="mek-label-uppercase text-[9px] text-center">LEVEL</div>
            <div className="text-white text-sm font-bold text-center">{levelValue}</div>
          </div>
        </div>
      );
    }

    // Style 2: Stacked Compact (Labels above bars)
    if (tenureLevelStyle === 'stacked-compact') {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="mek-label-uppercase text-[9px]">TENURE</span>
              <span className="text-white text-sm font-bold">{tenureRate}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="mek-label-uppercase text-[9px]">LEVEL</span>
              <span className="text-white text-sm font-bold">{levelValue}</span>
            </div>
          </div>
          {renderBars()}
        </div>
      );
    }

    // Style 3: Inline Badges (Horizontal layout with badge styling)
    if (tenureLevelStyle === 'inline-badges') {
      return (
        <div className="space-y-3">
          {renderBars()}
          <div className="flex items-center justify-center gap-4">
            <div className="px-3 py-1.5 bg-black/60 border border-yellow-500/30 rounded-sm">
              <div className="flex items-center gap-2">
                <span className="mek-label-uppercase text-[8px] text-gray-400">TENURE</span>
                <span className="text-yellow-400 text-sm font-bold">{tenureRate}</span>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-black/60 border border-cyan-500/30 rounded-sm">
              <div className="flex items-center gap-2">
                <span className="mek-label-uppercase text-[8px] text-gray-400">LEVEL</span>
                <span className="text-cyan-400 text-sm font-bold">{levelValue}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Style 4: Vertical Emphasis (Larger values, vertical stack)
    if (tenureLevelStyle === 'vertical-emphasis') {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-white text-2xl font-bold mb-1">{tenureRate}</div>
              <div className="mek-label-uppercase text-[9px]">TENURE</div>
            </div>
            <div>
              <div className="text-white text-2xl font-bold mb-1">{levelValue}</div>
              <div className="mek-label-uppercase text-[9px]">LEVEL</div>
            </div>
          </div>
          {renderBars()}
        </div>
      );
    }

    // Style 5: Minimal Centered (Simple centered layout)
    if (tenureLevelStyle === 'minimal-centered') {
      return (
        <div className="space-y-2">
          {renderBars()}
          <div className="flex items-center justify-center gap-6 text-center">
            <div>
              <div className="text-white text-xs font-bold">{tenureRate}</div>
              <div className="mek-label-uppercase text-[8px] text-gray-500">TENURE</div>
            </div>
            <div className="h-4 w-px bg-gray-700"></div>
            <div>
              <div className="text-white text-xs font-bold">{levelValue}</div>
              <div className="mek-label-uppercase text-[8px] text-gray-500">LEVEL</div>
            </div>
          </div>
        </div>
      );
    }

    // ========== NEW HERO LEVEL VARIATIONS ==========
    // Get current level color for dynamic styling
    const levelColor = levelColors[currentLevel - 1] || '#FFFFFF';

    // HERO LEVEL V1: Massive Level Number with Dramatic Glow
    // Concept: Extra-large level number (4x size of tenure) with matching color glow
    if (tenureLevelStyle === 'hero-level-v1') {
      return (
        <div className="flex items-center justify-between gap-3">
          {/* Tenure - Small and subdued on left */}
          <div className="flex flex-col items-start gap-0.5 shrink-0">
            <div className="text-gray-500 text-[8px] uppercase tracking-wider font-mono">TENURE</div>
            <div className="text-white/80 text-xs font-semibold">{tenureRate}</div>
          </div>

          {/* Bars - Center */}
          {renderBars()}

          {/* Level - MASSIVE and prominent on right */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="text-gray-500 text-[8px] uppercase tracking-wider font-mono">LEVEL</div>
            <div
              className="font-bold leading-none"
              style={{
                fontSize: '3rem',
                fontFamily: 'Saira Condensed',
                fontWeight: 200,
                color: levelColor,
                textShadow: `
                  0 0 20px ${levelColor}aa,
                  0 0 40px ${levelColor}66,
                  0 0 60px ${levelColor}33,
                  0 2px 8px rgba(0,0,0,0.8)
                `
              }}
            >
              {levelValue}
            </div>
          </div>
        </div>
      );
    }

    // HERO LEVEL V2: Bold Tech Display with Color Bar Accent
    // Concept: Bars on top, inset card with level below - clean separation
    // NO TENURE - Bars extend to full width
    if (tenureLevelStyle === 'hero-level-v2') {
      return (
        <div className="flex flex-col gap-3">
          {/* Bars - Full width, full height */}
          <div className="h-12 sm:h-10">
            {renderBars()}
          </div>

          {/* Inset Card - Centered below bars */}
          <div className="flex justify-center">
            <div
              className="flex flex-col items-center justify-center px-6 py-3 rounded-lg border-2"
              style={{
                background: `linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.8) 100%)`,
                boxShadow: `
                  inset 0 2px 8px rgba(0,0,0,0.6),
                  inset 0 -2px 4px rgba(255,255,255,0.05),
                  0 2px 8px rgba(0,0,0,0.3)
                `,
                borderColor: levelColor
              }}
            >
              {/* Large level number */}
              <div
                className="font-bold leading-none text-center"
                style={{
                  fontSize: '2rem',
                  fontFamily: 'Orbitron',
                  fontWeight: 700,
                  color: levelColor,
                  textShadow: `
                    0 0 15px ${levelColor}dd,
                    0 0 30px ${levelColor}88,
                    0 0 45px ${levelColor}44,
                    2px 2px 6px rgba(0,0,0,0.9)
                  `,
                  letterSpacing: '-0.05em'
                }}
              >
                {levelValue}
              </div>
              {/* LVL label below */}
              <div className="text-gray-400 text-[8px] uppercase tracking-[0.2em] font-mono mt-1 text-center">LVL</div>
            </div>
          </div>
        </div>
      );
    }

    // HERO LEVEL V3: Asymmetric Dramatic - Level Dominates
    // Concept: Tiny tenure, absolutely massive level with stacked glow layers
    if (tenureLevelStyle === 'hero-level-v3') {
      return (
        <div className="flex items-center justify-between gap-2">
          {/* Tenure - Tiny and tucked away */}
          <div className="flex items-center gap-1.5 shrink-0 opacity-60">
            <div className="text-gray-500 text-[7px] uppercase tracking-[0.1em] font-mono">TEN</div>
            <div className="text-white/70 text-[10px] font-medium">{tenureRate}</div>
          </div>

          {/* Bars - Center */}
          {renderBars()}

          {/* Level - ABSOLUTELY MASSIVE with multi-layer glow */}
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <div className="text-gray-400 text-[7px] uppercase tracking-[0.25em] font-mono opacity-50">LVL</div>
            <div className="relative">
              {/* Background glow layers */}
              <div
                className="absolute inset-0 blur-xl opacity-60"
                style={{
                  background: `radial-gradient(circle, ${levelColor} 0%, transparent 70%)`,
                  transform: 'scale(1.5)'
                }}
              />
              {/* The number itself */}
              <div
                className="relative font-bold leading-none"
                style={{
                  fontSize: '3.5rem',
                  fontFamily: 'Saira Condensed',
                  fontWeight: 200,
                  color: levelColor,
                  textShadow: `
                    0 0 10px ${levelColor}ff,
                    0 0 20px ${levelColor}dd,
                    0 0 40px ${levelColor}88,
                    0 0 60px ${levelColor}44,
                    0 0 80px ${levelColor}22,
                    0 3px 10px rgba(0,0,0,0.9)
                  `,
                  WebkitTextStroke: `0.5px ${levelColor}33`
                }}
              >
                {levelValue}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // HERO LEVEL V4: Aligned Bars & Stacked Level Display
    // Concept: Bars and level display have EXACTLY the same height - bars (48px) match number (32px) + label (16px)
    if (tenureLevelStyle === 'hero-level-v4') {
      return (
        <div className="flex items-stretch gap-3">
          {/* Tenure - Left side, minimal */}
          <div className="flex flex-col justify-center gap-0.5 shrink-0 opacity-70">
            <div className="text-gray-400 text-[7px] uppercase tracking-wider font-mono">TEN</div>
            <div className="text-white/80 text-[10px] font-medium">{tenureRate}</div>
          </div>

          {/* Bars - Increased height to h-12 (48px) */}
          <div className="flex gap-1 sm:gap-1.5 flex-1">
            {Array.from({ length: 10 }, (_, i) => {
              const barLevel = i + 1;
              const isActive = barLevel <= displayLevel;

              return (
                <div key={barLevel} className="flex-1">
                  <div
                    className="h-12 transition-all duration-500 rounded-sm relative overflow-hidden"
                    style={{
                      backgroundColor: isActive ? levelColor : '#1a1a1a',
                      backgroundImage: isActive
                        ? 'none'
                        : 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(102, 102, 102, 0.1) 2px, rgba(102, 102, 102, 0.1) 4px)',
                      border: isActive ? `1px solid ${levelColor}` : '1px solid #666',
                      boxShadow: isActive
                        ? `0 0 12px ${levelColor}80, inset 0 -4px 8px rgba(0,0,0,0.4)`
                        : 'inset 0 2px 4px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(102, 102, 102, 0.2)',
                      opacity: isActive ? 1 : 0.5,
                    }}
                  >
                    {isActive && (
                      <>
                        <div
                          className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                          style={{
                            height: '100%',
                            background: `linear-gradient(to top, ${levelColor}, ${levelColor}80 50%, transparent)`,
                          }}
                        />
                        <div
                          className="absolute top-0 left-0 right-0 h-1/4"
                          style={{
                            background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Level Display - RIGHT SIDE - Stacked number + label = 48px total height */}
          <div className="flex flex-col justify-center items-center shrink-0" style={{ height: '48px' }}>
            {/* Level Number - 32px */}
            <div
              className="font-bold leading-none"
              style={{
                fontSize: '32px',
                height: '32px',
                fontFamily: 'Saira Condensed',
                fontWeight: 200,
                color: levelColor,
                textShadow: `
                  0 0 15px ${levelColor}dd,
                  0 0 30px ${levelColor}88,
                  0 2px 6px rgba(0,0,0,0.8)
                `,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {levelValue}
            </div>
            {/* LEVEL Label - 16px */}
            <div
              className="uppercase tracking-widest font-mono"
              style={{
                fontSize: '9px',
                height: '16px',
                color: '#9ca3af',
                letterSpacing: '0.15em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              LEVEL
            </div>
          </div>
        </div>
      );
    }

    // CARD SLIDE-UP: Card overlaps bars from below with strong drop shadow
    if (tenureLevelStyle === 'card-slide-up') {
      return (
        <div className="relative">
          {/* Tenure - Tiny left side */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-10 opacity-70">
            <div className="text-gray-400 text-[7px] uppercase tracking-wider font-mono">TEN</div>
            <div className="text-white/80 text-[10px] font-medium">{tenureRate}</div>
          </div>

          {/* Bars - Full width */}
          <div className="flex gap-1 sm:gap-1.5 pl-12">
            {Array.from({ length: 10 }, (_, i) => {
              const barLevel = i + 1;
              const isActive = barLevel <= displayLevel;

              return (
                <div key={barLevel} className="flex-1">
                  <div
                    className="h-8 transition-all duration-500 rounded-sm relative overflow-hidden"
                    style={{
                      backgroundColor: isActive ? levelColor : '#1a1a1a',
                      border: isActive ? `1px solid ${levelColor}` : '1px solid #666',
                      boxShadow: isActive ? `0 0 8px ${levelColor}80` : 'none',
                      opacity: isActive ? 1 : 0.4,
                    }}
                  >
                    {isActive && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-3/4"
                        style={{
                          background: `linear-gradient(to top, ${levelColor}, transparent)`,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Card - Centered, overlapping from below with slide-up effect */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 z-20">
            <div
              className="px-4 py-2 rounded flex flex-col items-center justify-center"
              style={{
                background: `linear-gradient(135deg, rgba(20,20,20,0.95) 0%, rgba(40,40,40,0.95) 100%)`,
                border: `2px solid ${levelColor}`,
                boxShadow: `
                  0 4px 12px rgba(0,0,0,0.9),
                  0 0 20px ${levelColor}40,
                  inset 0 1px 0 rgba(255,255,255,0.1)
                `,
              }}
            >
              <div
                className="font-bold leading-none"
                style={{
                  fontSize: '28px',
                  fontFamily: 'Orbitron',
                  fontWeight: 700,
                  color: levelColor,
                  textShadow: `0 0 15px ${levelColor}dd, 0 2px 4px rgba(0,0,0,0.8)`,
                }}
              >
                {levelValue}
              </div>
              <div className="text-gray-400 text-[9px] uppercase tracking-widest font-mono mt-0.5">
                LVL
              </div>
            </div>
          </div>
        </div>
      );
    }

    // CARD FLOATING-BADGE: Heavy multi-layer shadow with glow, feels like hovering
    if (tenureLevelStyle === 'card-floating-badge') {
      return (
        <div className="relative">
          {/* Tenure - Tiny left side */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-10 opacity-70">
            <div className="text-gray-400 text-[7px] uppercase tracking-wider font-mono">TEN</div>
            <div className="text-white/80 text-[10px] font-medium">{tenureRate}</div>
          </div>

          {/* Bars - Full width */}
          <div className="flex gap-1 sm:gap-1.5 pl-12">
            {Array.from({ length: 10 }, (_, i) => {
              const barLevel = i + 1;
              const isActive = barLevel <= displayLevel;

              return (
                <div key={barLevel} className="flex-1">
                  <div
                    className="h-8 transition-all duration-500 rounded-sm relative overflow-hidden"
                    style={{
                      backgroundColor: isActive ? levelColor : '#1a1a1a',
                      border: isActive ? `1px solid ${levelColor}` : '1px solid #666',
                      boxShadow: isActive ? `0 0 8px ${levelColor}80` : 'none',
                      opacity: isActive ? 1 : 0.4,
                    }}
                  >
                    {isActive && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-3/4"
                        style={{
                          background: `linear-gradient(to top, ${levelColor}, transparent)`,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Badge - Centered, floating with heavy glow */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 z-20">
            <div
              className="w-16 h-16 rounded-full flex flex-col items-center justify-center"
              style={{
                background: `radial-gradient(circle at center, rgba(30,30,30,0.98) 0%, rgba(20,20,20,0.98) 100%)`,
                border: `3px solid ${levelColor}`,
                boxShadow: `
                  0 0 30px ${levelColor}dd,
                  0 0 50px ${levelColor}88,
                  0 0 70px ${levelColor}44,
                  0 6px 20px rgba(0,0,0,0.9),
                  0 2px 8px rgba(0,0,0,0.8),
                  inset 0 2px 4px rgba(255,255,255,0.15)
                `,
              }}
            >
              <div
                className="font-bold leading-none"
                style={{
                  fontSize: '26px',
                  fontFamily: 'Orbitron',
                  fontWeight: 700,
                  color: levelColor,
                  textShadow: `0 0 20px ${levelColor}ff, 0 0 40px ${levelColor}88`,
                }}
              >
                {levelValue}
              </div>
              <div className="text-gray-400 text-[8px] uppercase tracking-widest font-mono mt-0.5">
                LVL
              </div>
            </div>
          </div>
        </div>
      );
    }

    // CARD INSET-PANEL: Recessed look with inner shadows and embossed effect
    if (tenureLevelStyle === 'card-inset-panel') {
      return (
        <div className="relative">
          {/* Tenure - Tiny left side */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-10 opacity-70">
            <div className="text-gray-400 text-[7px] uppercase tracking-wider font-mono">TEN</div>
            <div className="text-white/80 text-[10px] font-medium">{tenureRate}</div>
          </div>

          {/* Bars - Full width */}
          <div className="flex gap-1 sm:gap-1.5 pl-12">
            {Array.from({ length: 10 }, (_, i) => {
              const barLevel = i + 1;
              const isActive = barLevel <= displayLevel;

              return (
                <div key={barLevel} className="flex-1">
                  <div
                    className="h-8 transition-all duration-500 rounded-sm relative overflow-hidden"
                    style={{
                      backgroundColor: isActive ? levelColor : '#1a1a1a',
                      border: isActive ? `1px solid ${levelColor}` : '1px solid #666',
                      boxShadow: isActive ? `0 0 8px ${levelColor}80` : 'none',
                      opacity: isActive ? 1 : 0.4,
                    }}
                  >
                    {isActive && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-3/4"
                        style={{
                          background: `linear-gradient(to top, ${levelColor}, transparent)`,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Inset Panel - Centered, recessed with inner shadows */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 z-20">
            <div
              className="px-5 py-2.5 rounded flex flex-col items-center justify-center"
              style={{
                background: `linear-gradient(135deg, rgba(15,15,15,0.98) 0%, rgba(25,25,25,0.98) 100%)`,
                border: `1px solid ${levelColor}88`,
                boxShadow: `
                  inset 0 4px 8px rgba(0,0,0,0.8),
                  inset 0 -2px 4px rgba(255,255,255,0.05),
                  0 0 15px ${levelColor}30,
                  0 2px 8px rgba(0,0,0,0.6)
                `,
              }}
            >
              <div
                className="font-bold leading-none"
                style={{
                  fontSize: '30px',
                  fontFamily: 'Orbitron',
                  fontWeight: 700,
                  color: levelColor,
                  textShadow: `0 0 10px ${levelColor}aa, 0 1px 2px rgba(0,0,0,0.9)`,
                }}
              >
                {levelValue}
              </div>
              <div
                className="uppercase tracking-widest font-mono mt-1"
                style={{
                  fontSize: '9px',
                  color: '#6b7280',
                  textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                }}
              >
                LVL
              </div>
            </div>
          </div>
        </div>
      );
    }

    // CARD TECH-PLATE: Angular industrial plate with metallic gradient and sharp edges
    if (tenureLevelStyle === 'card-tech-plate') {
      return (
        <div className="relative">
          {/* Tenure - Tiny left side */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-10 opacity-70">
            <div className="text-gray-400 text-[7px] uppercase tracking-wider font-mono">TEN</div>
            <div className="text-white/80 text-[10px] font-medium">{tenureRate}</div>
          </div>

          {/* Bars - Full width */}
          <div className="flex gap-1 sm:gap-1.5 pl-12">
            {Array.from({ length: 10 }, (_, i) => {
              const barLevel = i + 1;
              const isActive = barLevel <= displayLevel;

              return (
                <div key={barLevel} className="flex-1">
                  <div
                    className="h-8 transition-all duration-500 relative overflow-hidden"
                    style={{
                      backgroundColor: isActive ? levelColor : '#1a1a1a',
                      border: isActive ? `1px solid ${levelColor}` : '1px solid #666',
                      boxShadow: isActive ? `0 0 8px ${levelColor}80` : 'none',
                      opacity: isActive ? 1 : 0.4,
                      clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
                    }}
                  >
                    {isActive && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-3/4"
                        style={{
                          background: `linear-gradient(to top, ${levelColor}, transparent)`,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tech Plate - Centered, angular with metallic gradient */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 z-20">
            <div
              className="px-6 py-2 flex flex-col items-center justify-center"
              style={{
                background: `linear-gradient(135deg,
                  rgba(50,50,50,0.95) 0%,
                  rgba(30,30,30,0.95) 25%,
                  rgba(20,20,20,0.95) 50%,
                  rgba(30,30,30,0.95) 75%,
                  rgba(50,50,50,0.95) 100%
                )`,
                border: `2px solid ${levelColor}`,
                borderTop: `3px solid ${levelColor}dd`,
                borderBottom: `1px solid ${levelColor}44`,
                boxShadow: `
                  0 0 20px ${levelColor}60,
                  0 4px 12px rgba(0,0,0,0.9),
                  inset 0 1px 0 rgba(255,255,255,0.2),
                  inset 0 -1px 0 rgba(0,0,0,0.8)
                `,
                clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)',
              }}
            >
              <div
                className="font-bold leading-none"
                style={{
                  fontSize: '32px',
                  fontFamily: 'Orbitron',
                  fontWeight: 700,
                  color: levelColor,
                  textShadow: `
                    0 0 15px ${levelColor}ff,
                    0 0 30px ${levelColor}88,
                    0 2px 6px rgba(0,0,0,0.9)
                  `,
                  WebkitTextStroke: `0.5px ${levelColor}44`,
                }}
              >
                {levelValue}
              </div>
              <div
                className="uppercase tracking-[0.2em] font-mono mt-0.5"
                style={{
                  fontSize: '8px',
                  color: '#9ca3af',
                  textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                }}
              >
                LVL
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
        {/* Scrollable Content */}
        <div className="w-full flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="relative text-white">
            {/* Industrial Header - Made Sticky with Dynamic Blur & Darkness */}
            <div
              className="sticky top-0 z-40 w-full"
              style={{
                backgroundColor: `rgba(0, 0, 0, ${headerDarkness / 100})`,
                backdropFilter: `blur(${headerBlur}px) saturate(80%)`,
                WebkitBackdropFilter: `blur(${headerBlur}px) saturate(80%)`
              }}
            >
              {/* Additional blur overlay layer for stronger effect */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backdropFilter: `blur(${Math.floor(headerBlur / 2)}px)`,
                  WebkitBackdropFilter: `blur(${Math.floor(headerBlur / 2)}px)`,
                  zIndex: -1
                }}
              />
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #fab617 0, #fab617 10px, transparent 10px, transparent 20px)',
                  }} />
                </div>

                <div className="max-w-7xl mx-auto px-4" style={{ paddingTop: `${headerBottomPadding}px`, paddingBottom: `${headerBottomPadding}px` }}>
                  {/* Close Button - Inside scrollable content at top right */}
                  <div className="absolute top-4 right-4 z-50">
                    <CloseButton onClick={onClose} className="!mt-0 scale-75" />
                  </div>

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
            <div
              className="max-w-7xl mx-auto px-4 pb-6"
              style={{
                paddingTop: `${headerGap}px`
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${contentSpacing}px` }}>
                {/* MOBILE: Mek PFP Overlay (only visible on mobile) */}
                <div className="lg:hidden">
                  {mekPfpOverlay && mekPfpOverlay.imagePath && (() => {
                    // Calculate scale factor based on displayed image size vs original size
                    const displayScale = overlaySize.width > 0
                      ? overlaySize.width / mekPfpOverlay.imageWidth
                      : 1;

                    // Find the "Slotted Mek PFP" display zone
                    const displayZone = mekPfpOverlay.zones?.find(
                      (z: any) => z.mode === 'zone' && z.type === 'display' && z.metadata?.displayType === 'slotted-mek-pfp'
                    );

                    // Find the "Mek Name" display zone
                    const nameZone = mekPfpOverlay.zones?.find(
                      (z: any) => z.mode === 'zone' && z.type === 'display' && z.metadata?.displayType === 'mek-name'
                    );

                    // Mock Mek data for testing
                    const mockMekSourceKey = "aa2-bl2-hn1";
                    const mockMekName = "SENTINEL ALPHA";

                    return (
                      <div className="overflow-hidden relative">
                        {/* Base Overlay Image */}
                        <img
                          ref={overlayRef}
                          src={mekPfpOverlay.imagePath}
                          alt="Mek Profile Overlay"
                          className="w-full h-auto"
                          onLoad={() => {
                            if (overlayRef.current) {
                              const rect = overlayRef.current.getBoundingClientRect();
                              setOverlaySize({ width: rect.width, height: rect.height });
                            }
                          }}
                        />

                        {/* Display Zone - Show Mek Image */}
                        {displayZone && overlaySize.width > 0 && (
                          <div
                            className="absolute"
                            style={{
                              left: `${displayZone.x * displayScale}px`,
                              top: `${displayZone.y * displayScale}px`,
                              width: `${(displayZone.width || 150) * displayScale}px`,
                              height: `${(displayZone.height || 150) * displayScale}px`,
                            }}
                          >
                            <img
                              src={`/mek-images/150px/${mockMekSourceKey.toLowerCase()}.webp`}
                              alt="Mek"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}

                        {/* Name Zone - Show Mek's Name */}
                        {nameZone && overlaySize.width > 0 && (
                          <div
                            className="absolute flex items-center"
                            style={{
                              left: `${nameZone.x * displayScale}px`,
                              top: `${nameZone.y * displayScale}px`,
                              width: `${(nameZone.width || 200) * displayScale}px`,
                              height: `${(nameZone.height || 40) * displayScale}px`,
                              justifyContent: nameZone.metadata?.displayAlign || 'center',
                            }}
                          >
                            <div
                              className="text-yellow-400 font-bold"
                              style={{
                                fontSize: `${(nameZone.metadata?.displayFontSize || 16) * displayScale}px`,
                                lineHeight: 1.2,
                                fontFamily: nameZone.metadata?.fontFamily || 'Orbitron, sans-serif',
                                textAlign: (nameZone.metadata?.displayAlign || 'center') as any,
                              }}
                            >
                              {mockMekName}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* MOBILE: Animated Details Button - Wider & Shorter (Pancake Shape) */}
                <div className="lg:hidden flex justify-center">
                  <AnimatedBorderButton
                    className="w-full text-sm py-1.5 px-8"
                    onClick={() => console.log('Details clicked')}
                  >
                    DEEP SCAN
                  </AnimatedBorderButton>
                </div>

                {/* MOBILE: Primary Info Panel (Designation - Dynamic Style) */}
                <div className="lg:hidden">
                  {renderDesignationCard()}
                </div>

                {/* MOBILE: Level & Gold Panel (grouped together) */}
                <div className="lg:hidden space-y-3">
                  {/* Level Progress */}
                  <div className="mek-card-industrial mek-border-sharp-gold p-4">
                    <LevelProgress
                      currentLevel={8}
                      currentXP={6720}
                      requiredXP={10000}
                      style={levelProgressStyle}
                      useYellowGlow={useYellowGlow}
                    />
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

                    {/* Gold Cards - Combined or Individual */}
                    {showCombinedGoldCard ? (
                      renderCombinedGoldCard()
                    ) : (
                      <>
                        {/* Gold Generation */}
                        {renderGoldProducedCard()}

                        {/* Cumulative Gold */}
                        {renderCumulativeGoldCard()}
                      </>
                    )}
                  </div>

                  {/* CENTER - MEK PFP OVERLAY */}
                  <div className="lg:col-span-6 flex flex-col items-start justify-center gap-4">
                    {mekPfpOverlay && mekPfpOverlay.imagePath && (() => {
                      // Calculate scale factor based on displayed image size vs original size
                      const displayScale = overlaySize.width > 0
                        ? overlaySize.width / mekPfpOverlay.imageWidth
                        : 1;

                      // Find the "Slotted Mek PFP" display zone
                      const displayZone = mekPfpOverlay.zones?.find(
                        (z: any) => z.mode === 'zone' && z.type === 'display' && z.metadata?.displayType === 'slotted-mek-pfp'
                      );

                      // Find the "Mek Name" display zone
                      const nameZone = mekPfpOverlay.zones?.find(
                        (z: any) => z.mode === 'zone' && z.type === 'display' && z.metadata?.displayType === 'mek-name'
                      );

                      // Mock Mek data for testing
                      const mockMekSourceKey = "aa2-bl2-hn1";
                      const mockMekName = "SENTINEL ALPHA";

                      return (
                        <div className="relative w-full">
                          {/* Base Overlay Image */}
                          <img
                            ref={overlayRef}
                            src={mekPfpOverlay.imagePath}
                            alt="Mek Profile Overlay"
                            className="w-full h-auto"
                            onLoad={() => {
                              if (overlayRef.current) {
                                const rect = overlayRef.current.getBoundingClientRect();
                                setOverlaySize({ width: rect.width, height: rect.height });
                              }
                            }}
                          />

                          {/* Display Zone - Show Mek Image */}
                          {displayZone && overlaySize.width > 0 && (
                            <div
                              className="absolute"
                              style={{
                                left: `${displayZone.x * displayScale}px`,
                                top: `${displayZone.y * displayScale}px`,
                                width: `${(displayZone.width || 150) * displayScale}px`,
                                height: `${(displayZone.height || 150) * displayScale}px`,
                              }}
                            >
                              <img
                                src={`/mek-images/150px/${mockMekSourceKey.toLowerCase()}.webp`}
                                alt="Mek"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}

                          {/* Name Zone - Show Mek's Name */}
                          {nameZone && overlaySize.width > 0 && (
                            <div
                              className="absolute flex items-center"
                              style={{
                                left: `${nameZone.x * displayScale}px`,
                                top: `${nameZone.y * displayScale}px`,
                                width: `${(nameZone.width || 200) * displayScale}px`,
                                height: `${(nameZone.height || 40) * displayScale}px`,
                                justifyContent: nameZone.metadata?.displayAlign || 'center',
                              }}
                            >
                              <div
                                className="text-yellow-400 font-bold"
                                style={{
                                  fontSize: `${(nameZone.metadata?.displayFontSize || 16) * displayScale}px`,
                                  lineHeight: 1.2,
                                  fontFamily: nameZone.metadata?.fontFamily || 'Orbitron, sans-serif',
                                  textAlign: (nameZone.metadata?.displayAlign || 'center') as any,
                                }}
                              >
                                {mockMekName}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* DESKTOP: Animated Details Button - Wider & Shorter (Pancake Shape) */}
                    <div className="w-full flex justify-center">
                      <AnimatedBorderButton
                        className="w-full text-sm py-1.5 px-8"
                        onClick={() => console.log('Details clicked')}
                      >
                        DEEP SCAN
                      </AnimatedBorderButton>
                    </div>
                  </div>

                  {/* RIGHT SIDEBAR - Abilities Tree (Small Vertical) */}
                  <div className="lg:col-span-3">
                    <div className="h-full bg-black/40 border border-yellow-500/30 rounded overflow-hidden relative">
                      <div className="absolute inset-0 mek-overlay-scratches opacity-5 pointer-events-none"></div>
                      <MekAbilitiesTree
                        categoryId={abilitiesTreeCategoryId}
                        templateId={abilitiesTreeTemplateId}
                        rotated={false}
                        showNodeNames={false}
                        nodeColor="#fbbf24"
                        connectionColor="#555"
                        className="relative z-10 h-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Variation Cards - Responsive Grid - Direct on Lightbox Style (no outer card) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <VariationCard
                    title="HEAD VARIATION"
                    imagePath="/variation-images-art-400px/ae1-gn3-ev1.png"
                    glowSize={variationGlowSize}
                    glowIntensity={variationGlowIntensity}
                    variationTextStyle={variationTextStyle}
                    useYellowGlow={useYellowGlow}
                    statsLayoutStyle={statsLayoutStyle}
                  />
                  <VariationCard
                    title="BODY VARIATION"
                    imagePath="/variation-images-art-400px/ak3-aa5-mo1.png"
                    glowSize={variationGlowSize}
                    glowIntensity={variationGlowIntensity}
                    variationTextStyle={variationTextStyle}
                    useYellowGlow={useYellowGlow}
                    statsLayoutStyle={statsLayoutStyle}
                  />
                  <VariationCard
                    title="TRAIT VARIATION"
                    imagePath="/variation-images-art-400px/ar1-at1-nm1.png"
                    glowSize={variationGlowSize}
                    glowIntensity={variationGlowIntensity}
                    variationTextStyle={variationTextStyle}
                    useYellowGlow={useYellowGlow}
                    statsLayoutStyle={statsLayoutStyle}
                  />
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

// Reusable Variation Card Component - Direct on Lightbox Style with Yellow Glow
// Images and text float directly on lightbox base layer, NO card containers
function VariationCard({
  title,
  imagePath,
  glowSize = 25,
  glowIntensity = 0.6,
  variationTextStyle = 'hero-focus',
  useYellowGlow = true,
  statsLayoutStyle = 'inline-dot'
}: {
  title: string;
  imagePath?: string;
  glowSize?: number;
  glowIntensity?: number;
  variationTextStyle?: 'hero-focus' | 'tech-readout' | 'minimal-labels' | 'data-grid' | 'compact-badge';
  useYellowGlow?: boolean;
  statsLayoutStyle?: 'inline-dot' | 'vertical-divider' | 'badge-pills' | 'label-above' | 'glow-separator';
}) {
  // Mock data (replace with real data later)
  const name = 'Variation Name';
  const count = 3;
  const total = 4000;
  const base = 100;
  const bonus = 25;
  const totalValue = base + bonus;

  // NEON EDGE color variables
  const accentColor = useYellowGlow ? 'text-yellow-400' : 'text-cyan-400';
  const textShadowColor = useYellowGlow
    ? '0 0 20px rgba(250, 182, 23, 1), 0 0 40px rgba(250, 182, 23, 0.5)'
    : '0 0 20px rgba(0, 212, 255, 1), 0 0 40px rgba(0, 212, 255, 0.5)';

  // Render text based on selected style
  const renderTextVariation = () => {
    switch (variationTextStyle) {
      case 'hero-focus':
        // Style 1: Large glowing name, minimal supporting info
        return (
          <div className="text-center w-full">
            {/* Hero name with massive glow */}
            <div
              className={`${accentColor} text-4xl leading-none mb-2`}
              style={{
                fontFamily: 'Saira Condensed',
                fontWeight: 200,
                textShadow: textShadowColor,
                letterSpacing: '0.1em'
              }}
            >
              {name}
            </div>
            {/* Minimal category label */}
            <div
              className="text-[9px] text-white/40 uppercase mb-3"
              style={{ fontFamily: 'Inter', fontWeight: 400, letterSpacing: '0.2em' }}
            >
              {title}
            </div>
            {/* Count and total inline */}
            <div className="flex items-center justify-center gap-3 text-sm">
              <span className="text-white/60" style={{ fontFamily: 'Inter' }}>{count} of {total}</span>
              <span className="text-white/40">•</span>
              <span className={`${accentColor} font-bold`} style={{ fontFamily: 'Saira Condensed' }}>
                {totalValue}
              </span>
            </div>
          </div>
        );

      case 'tech-readout':
        // Style 2: Clean terminal/data display
        return (
          <div className="w-full font-mono text-left space-y-1" style={{ fontFamily: 'JetBrains Mono' }}>
            <div className="text-[10px] text-white/40 uppercase tracking-wider">{title}</div>
            <div className={`text-xl ${accentColor} font-bold mb-2`} style={{ letterSpacing: '0.05em' }}>
              {name}
            </div>
            <div className="text-xs text-white/60 space-y-0.5">
              <div className="flex justify-between">
                <span>OWNED:</span>
                <span className="text-white">{count}/{total}</span>
              </div>
              <div className="flex justify-between">
                <span>BASE:</span>
                <span className="text-white">{base}</span>
              </div>
              <div className="flex justify-between">
                <span>BONUS:</span>
                <span className="text-green-400">+{bonus}</span>
              </div>
              <div className="flex justify-between border-t border-white/20 pt-0.5 mt-0.5">
                <span>TOTAL:</span>
                <span className={accentColor}>{totalValue}</span>
              </div>
            </div>
          </div>
        );

      case 'minimal-labels':
        // Style 3: Ultra-compact with tiny labels and two-column stats layout
        const percentage = ((count / total) * 100).toFixed(3);

        // Render stats in two-column layout based on selected style
        const renderTwoColumnStats = () => {
          switch (statsLayoutStyle) {
            case 'inline-dot':
              // Option 1: Simple inline with bullet separator
              return (
                <div className="flex items-center justify-center gap-2 text-sm text-white/80" style={{ fontFamily: 'Saira Condensed' }}>
                  <span>Total Copies: {count}</span>
                  <span className="text-white/40">•</span>
                  <span>{percentage}%</span>
                </div>
              );

            case 'vertical-divider':
              // Option 2: Two columns with vertical line divider
              return (
                <div className="flex items-center justify-center gap-3">
                  <div className="text-center">
                    <div className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5" style={{ fontFamily: 'Inter' }}>
                      Total Copies
                    </div>
                    <div className="text-sm text-white font-semibold" style={{ fontFamily: 'Saira Condensed' }}>
                      {count}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5" style={{ fontFamily: 'Inter' }}>
                      Percentage
                    </div>
                    <div className="text-sm text-white font-semibold" style={{ fontFamily: 'Saira Condensed' }}>
                      {percentage}%
                    </div>
                  </div>
                </div>
              );

            case 'badge-pills':
              // Option 3: Each stat in its own badge/pill
              return (
                <div className="flex items-center justify-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/40 border border-white/20 rounded-full">
                    <span className="text-[9px] text-white/40 uppercase tracking-wider" style={{ fontFamily: 'Inter' }}>
                      Copies
                    </span>
                    <span className="text-sm text-white font-semibold" style={{ fontFamily: 'Saira Condensed' }}>
                      {count}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/40 border border-white/20 rounded-full">
                    <span className="text-[9px] text-white/40 uppercase tracking-wider" style={{ fontFamily: 'Inter' }}>
                      %
                    </span>
                    <span className="text-sm text-white font-semibold" style={{ fontFamily: 'Saira Condensed' }}>
                      {percentage}
                    </span>
                  </div>
                </div>
              );

            case 'label-above':
              // Option 4: Labels above each value, side by side
              return (
                <div className="flex items-start justify-center gap-6">
                  <div className="text-center">
                    <div className="text-[9px] text-white/40 uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter', letterSpacing: '0.2em' }}>
                      Total Copies
                    </div>
                    <div className="text-base text-white font-bold" style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}>
                      {count}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] text-white/40 uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter', letterSpacing: '0.2em' }}>
                      Percentage
                    </div>
                    <div className="text-base text-white font-bold" style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}>
                      {percentage}%
                    </div>
                  </div>
                </div>
              );

            case 'glow-separator':
              // Option 5: Two columns with small glowing accent separator
              const glowColor = useYellowGlow ? 'rgb(250, 182, 23)' : 'rgb(0, 212, 255)';
              return (
                <div className="flex items-center justify-center gap-3">
                  <div className="text-right">
                    <div className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5" style={{ fontFamily: 'Inter' }}>
                      Total
                    </div>
                    <div className="text-sm text-white font-semibold" style={{ fontFamily: 'Saira Condensed' }}>
                      {count}
                    </div>
                  </div>
                  <div
                    className="w-1 h-1 rounded-full"
                    style={{
                      backgroundColor: glowColor,
                      boxShadow: `0 0 8px ${glowColor}, 0 0 16px ${glowColor}`
                    }}
                  ></div>
                  <div className="text-left">
                    <div className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5" style={{ fontFamily: 'Inter' }}>
                      Percent
                    </div>
                    <div className="text-sm text-white font-semibold" style={{ fontFamily: 'Saira Condensed' }}>
                      {percentage}%
                    </div>
                  </div>
                </div>
              );

            default:
              return null;
          }
        };

        return (
          <div className="text-center w-full space-y-2">
            <div className="text-lg text-white font-semibold" style={{ fontFamily: 'Inter' }}>
              {name}
            </div>
            <div
              className="text-[8px] text-white/40 uppercase tracking-widest"
              style={{ fontFamily: 'Inter', letterSpacing: '0.3em' }}
            >
              {title}
            </div>
            {renderTwoColumnStats()}
            <div className="flex flex-col items-center justify-center gap-1 mt-3">
              <div
                className={`${accentColor} text-4xl font-bold`}
                style={{
                  fontFamily: 'Saira Condensed',
                  fontWeight: 200,
                  textShadow: textShadowColor,
                  letterSpacing: '0.05em'
                }}
              >
                0.1
              </div>
              <div
                className="text-[9px] text-white/50 uppercase tracking-widest"
                style={{ fontFamily: 'Inter', letterSpacing: '0.2em' }}
              >
                Essence per day
              </div>
            </div>
          </div>
        );

      case 'data-grid':
        // Style 4: Structured grid with all data
        return (
          <div className="w-full">
            <div className="text-center mb-3">
              <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1" style={{ letterSpacing: '0.3em' }}>
                {title}
              </div>
              <div className="text-xl text-white font-bold" style={{ fontFamily: 'Saira Condensed', fontWeight: 300 }}>
                {name}
              </div>
              <div className="text-xs text-white/60 mt-1">{count} of {total}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="text-[9px] text-white/40 uppercase mb-1">Base</div>
                <div className="text-white font-bold">{base}</div>
              </div>
              <div>
                <div className="text-[9px] text-white/40 uppercase mb-1">Bonus</div>
                <div className="text-green-400 font-bold">+{bonus}</div>
              </div>
              <div>
                <div className="text-[9px] text-white/40 uppercase mb-1">Total</div>
                <div className={`${accentColor} font-bold text-base`}>{totalValue}</div>
              </div>
            </div>
          </div>
        );

      case 'compact-badge':
        // Style 5: Horizontal inline badges
        return (
          <div className="w-full space-y-2">
            <div className="text-center">
              <div className="text-lg text-white font-semibold mb-1" style={{ fontFamily: 'Saira Condensed' }}>
                {name}
              </div>
              <div className="text-[9px] text-white/40 uppercase tracking-wider">
                {title}
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-black/40 border border-white/20 rounded-sm text-[10px]">
                <span className="text-white/40">COUNT</span>
                <span className="text-white">{count}/{total}</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-black/40 border border-white/20 rounded-sm text-[10px]">
                <span className="text-white/40">BASE</span>
                <span className="text-white">{base}</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-black/40 border border-green-400/30 rounded-sm text-[10px]">
                <span className="text-green-400/60">BONUS</span>
                <span className="text-green-400">+{bonus}</span>
              </div>
              <div
                className={`inline-flex items-center gap-1 px-2 py-1 bg-black/60 border-2 ${useYellowGlow ? 'border-yellow-400/50' : 'border-cyan-400/50'} rounded-sm text-xs`}
              >
                <span className="text-white/60">TOTAL</span>
                <span className={`${accentColor} font-bold`}>{totalValue}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center relative">
      {/* Image floating directly on lightbox background with yellow glow behind */}
      <div className="relative mb-3">
        {imagePath ? (
          <img
            src={imagePath}
            alt={title}
            className="w-full h-48 object-contain scale-[0.7]"
            style={{
              filter: `
                drop-shadow(0 0 ${glowSize * 0.5}px rgba(250, 182, 23, ${glowIntensity}))
                drop-shadow(0 0 ${glowSize}px rgba(250, 182, 23, ${glowIntensity * 0.8}))
                drop-shadow(0 0 ${glowSize * 1.3}px rgba(250, 182, 23, ${glowIntensity * 0.6}))
                drop-shadow(0 0 ${glowSize * 1.6}px rgba(250, 182, 23, ${glowIntensity * 0.4}))
                drop-shadow(0 0 ${glowSize * 2}px rgba(250, 182, 23, ${glowIntensity * 0.2}))
              `.trim()
            }}
          />
        ) : (
          <div className="w-full h-48 flex items-center justify-center">
            <span className="text-gray-500 text-xs">Image</span>
          </div>
        )}
      </div>

      {/* Text content with NEON EDGE style variations */}
      {renderTextVariation()}
    </div>
  );
}
