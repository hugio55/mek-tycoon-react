'use client';

import { useState } from 'react';
import MekProfileLightbox, { CardInteriorStyle, DesignationCardStyle, GoldGenerationStyle, CombinedGoldCardStyle, LevelProgressStyle, StatsLayoutStyle } from '@/components/MekProfileLightbox';
import GoldGenerationDetailsLightbox from '@/components/GoldGenerationDetailsLightbox';

export default function MekLayoutsPage() {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isGoldDetailsOpen, setIsGoldDetailsOpen] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  const [styleVariation, setStyleVariation] = useState<'default' | 'variation1' | 'variation2'>('default');
  const [cardInteriorStyle, setCardInteriorStyle] = useState<CardInteriorStyle>('compact');
  const [buffDetailsLayout, setBuffDetailsLayout] = useState<'classic' | 'compact-grid' | 'detailed-cards' | 'minimal'>('classic');
  const [designationCardStyle, setDesignationCardStyle] = useState<DesignationCardStyle>('neon-edge');
  const [cumulativeGoldStyle, setCumulativeGoldStyle] = useState<'stacked-emphasis' | 'side-split' | 'badge-style' | 'horizontal-bar' | 'diagonal-layout'>('stacked-emphasis');
  const [cumulativeGoldFont, setCumulativeGoldFont] = useState('Orbitron');
  const [goldGenerationStyle, setGoldGenerationStyle] = useState<GoldGenerationStyle>('matrix-badge');
  const [combinedGoldCardStyle, setCombinedGoldCardStyle] = useState<CombinedGoldCardStyle>('vertical-stacked');
  const [showCombinedGoldCard, setShowCombinedGoldCard] = useState(false);
  const [levelProgressStyle, setLevelProgressStyle] = useState<LevelProgressStyle>('flat-bar');
  const [useYellowGlow, setUseYellowGlow] = useState(true);
  const [backdropDarkness, setBackdropDarkness] = useState(22);
  const [cardDarkness, setCardDarkness] = useState(7);
  const [backdropBlur, setBackdropBlur] = useState(0);
  const [cardBackdropBlur, setCardBackdropBlur] = useState(9);
  const [headerGap, setHeaderGap] = useState(32);
  const [headerBottomPadding, setHeaderBottomPadding] = useState(15);
  const [contentSpacing, setContentSpacing] = useState(16);
  const [slidersCollapsed, setSlidersCollapsed] = useState(false);
  const [showLeftDebugPanel, setShowLeftDebugPanel] = useState(true);
  const [headerDarkness, setHeaderDarkness] = useState(29);
  const [headerBlur, setHeaderBlur] = useState(13);
  const [variationGlowIntensity, setVariationGlowIntensity] = useState(0.6);
  const [variationGlowSize, setVariationGlowSize] = useState(25);
  const [variationTextStyle, setVariationTextStyle] = useState<'hero-focus' | 'tech-readout' | 'minimal-labels' | 'data-grid' | 'compact-badge'>('hero-focus');
  const [statsLayoutStyle, setStatsLayoutStyle] = useState<StatsLayoutStyle>('inline-dot');

  return (
    <div className="min-h-screen text-white flex flex-col items-center p-4">
      {/* Page Title */}
      <h1 className="text-4xl font-bold mb-6 text-yellow-400 uppercase tracking-wider font-orbitron mt-8">
        Mek Profile
      </h1>

      {/* Open Lightbox Button */}
      <button
        onClick={() => setIsLightboxOpen(true)}
        className="mek-button-primary px-8 py-4 text-lg font-bold uppercase tracking-wider mb-12"
      >
        View Mek Details
      </button>

      {/* Gold Generation Card */}
      <div className="w-full max-w-md bg-black/30 backdrop-blur-sm border-2 border-yellow-500/50 rounded-lg p-6 relative overflow-hidden">
        {/* Industrial decorations */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-400/60" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-400/60" />

        {/* Card Header */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold font-orbitron text-yellow-400 uppercase tracking-wider">
            Gold Generation
          </h2>
        </div>

        {/* Stats */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400 uppercase tracking-wider">Base Rate:</span>
            <span className="text-xl font-bold text-yellow-400">20.0 g/hr</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400 uppercase tracking-wider">Effective Rate:</span>
            <span className="text-2xl font-bold text-green-400" style={{ textShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}>
              24.0 g/hr
            </span>
          </div>
        </div>

        {/* Details Button */}
        <button
          onClick={() => setIsGoldDetailsOpen(true)}
          className="w-full mek-button-secondary px-4 py-3 text-sm font-bold uppercase tracking-wider"
        >
          View Details
        </button>
      </div>

      {/* Left Debug Toggle Button - Fixed Position */}
      <button
        onClick={() => setShowLeftDebugPanel(!showLeftDebugPanel)}
        className="fixed top-4 left-4 z-[99999] px-4 py-2 bg-black/80 border-2 border-cyan-500/50 rounded hover:bg-cyan-500/20 hover:border-cyan-500 transition-all"
      >
        <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Header Controls</span>
      </button>

      {/* Right Debug Toggle Button - Fixed Position */}
      <button
        onClick={() => setShowDebugPanel(!showDebugPanel)}
        className="fixed top-4 right-4 z-[999999] px-4 py-2 bg-black/80 border-2 border-cyan-500/50 rounded hover:bg-cyan-500/20 hover:border-cyan-500 transition-all pointer-events-auto"
      >
        <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Style Variations</span>
      </button>

      {/* LEFT DEBUG PANEL - Header Controls */}
      {showLeftDebugPanel && (
        <div className="fixed left-4 top-16 z-[999999] w-72 bg-black/95 border-2 border-purple-500/50 rounded-lg shadow-2xl pointer-events-auto">
        <div className="p-4">
          <h3 className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-3 border-b border-purple-500/30 pb-2">
            Header Controls
          </h3>

          {/* Slider 1: Header Darkness */}
          <div className="mb-3">
            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
              Header Darkness: {headerDarkness}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={headerDarkness}
              onChange={(e) => setHeaderDarkness(Number(e.target.value))}
              className="w-full h-1 bg-black/60 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Slider 2: Header Blur */}
          <div className="mb-3">
            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
              Header Blur: {headerBlur}px
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={headerBlur}
              onChange={(e) => setHeaderBlur(Number(e.target.value))}
              className="w-full h-1 bg-black/60 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Separator */}
          <div className="my-4 border-t border-purple-500/30" />
          <h4 className="text-purple-400 text-[9px] font-bold uppercase tracking-wider mb-3">
            Level
          </h4>

          {/* Dropdown: Level Progress Style */}
          <div className="mb-3">
            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
              Progress Display
            </label>
            <select
              value={levelProgressStyle}
              onChange={(e) => setLevelProgressStyle(e.target.value as LevelProgressStyle)}
              className="w-full bg-black/60 border border-purple-500/50 rounded px-2 py-1.5 text-purple-300 text-xs font-bold uppercase tracking-wider cursor-pointer hover:border-purple-500 focus:outline-none focus:border-purple-400 transition-all"
            >
              <option value="flat-bar">Flat Bar</option>
              <option value="arch">Arch</option>
              <option value="segmented">Segmented</option>
              <option value="orbital">Orbital</option>
              <option value="diagonal">Diagonal</option>
              <option value="segmented-vertical">Segmented Vertical</option>
              <option value="segmented-hex">Segmented Hex</option>
              <option value="segmented-dual-row">Segmented Dual Row</option>
            </select>
          </div>

          {/* Separator */}
          <div className="my-4 border-t border-purple-500/30" />
          <h4 className="text-purple-400 text-[9px] font-bold uppercase tracking-wider mb-3">
            Variation PNG Glow
          </h4>

          {/* Slider 3: Variation Glow Intensity */}
          <div className="mb-3">
            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
              Glow Intensity: {(variationGlowIntensity * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={variationGlowIntensity}
              onChange={(e) => setVariationGlowIntensity(Number(e.target.value))}
              className="w-full h-1 bg-black/60 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
          </div>

          {/* Slider 4: Variation Glow Size */}
          <div className="mb-3">
            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
              Glow Size: {variationGlowSize}px
            </label>
            <input
              type="range"
              min="0"
              max="60"
              value={variationGlowSize}
              onChange={(e) => setVariationGlowSize(Number(e.target.value))}
              className="w-full h-1 bg-black/60 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
          </div>

          {/* Separator */}
          <div className="my-4 border-t border-purple-500/30" />
          <h4 className="text-purple-400 text-[9px] font-bold uppercase tracking-wider mb-3">
            Variation Text Style
          </h4>

          {/* Dropdown: Variation Text Style */}
          <div className="mb-3">
            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
              Text Layout
            </label>
            <select
              value={variationTextStyle}
              onChange={(e) => setVariationTextStyle(e.target.value as 'hero-focus' | 'tech-readout' | 'minimal-labels' | 'data-grid' | 'compact-badge')}
              className="w-full bg-black/60 border border-purple-500/50 rounded px-2 py-1.5 text-purple-300 text-xs font-bold uppercase tracking-wider cursor-pointer hover:border-purple-500 focus:outline-none focus:border-purple-400 transition-all"
            >
              <option value="hero-focus">Hero Focus</option>
              <option value="tech-readout">Tech Readout</option>
              <option value="minimal-labels">Minimal Labels</option>
              <option value="data-grid">Data Grid</option>
              <option value="compact-badge">Compact Badge</option>
            </select>
          </div>

          {/* Dropdown: Stats Layout (only shows for minimal-labels) */}
          {variationTextStyle === 'minimal-labels' && (
            <>
              <div className="my-3 border-t border-purple-500/30" />
              <h4 className="text-purple-400 text-[9px] font-bold uppercase tracking-wider mb-3">
                Stats Layout (Minimal Labels)
              </h4>
              <div className="mb-3">
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                  Two-Column Style
                </label>
                <select
                  value={statsLayoutStyle}
                  onChange={(e) => setStatsLayoutStyle(e.target.value as StatsLayoutStyle)}
                  className="w-full bg-black/60 border border-purple-500/50 rounded px-2 py-1.5 text-purple-300 text-xs font-bold uppercase tracking-wider cursor-pointer hover:border-purple-500 focus:outline-none focus:border-purple-400 transition-all"
                >
                  <option value="inline-dot">Inline Dot</option>
                  <option value="vertical-divider">Vertical Divider</option>
                  <option value="badge-pills">Badge Pills</option>
                  <option value="label-above">Label Above</option>
                  <option value="glow-separator">Glow Separator</option>
                </select>
              </div>
            </>
          )}
        </div>
        </div>
      )}

      {/* Right Debug Panel - Fixed Position with Style Dropdowns */}
      {showDebugPanel && (
        <div className="fixed top-16 right-4 z-[999999] w-72 bg-black/95 border-2 border-cyan-500/50 rounded-lg shadow-2xl max-h-[85vh] overflow-y-auto pointer-events-auto">
          <div className="p-4">
            <h3 className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-3 border-b border-cyan-500/30 pb-2">
              Style Controls
            </h3>

            {/* Dropdown 1: Page Styling */}
            <div className="mb-3">
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                Overall Theme
              </label>
              <select
                value={styleVariation}
                onChange={(e) => setStyleVariation(e.target.value as 'default' | 'variation1' | 'variation2')}
                className="w-full bg-black/60 border border-cyan-500/50 rounded px-2 py-1.5 text-cyan-300 text-xs font-bold uppercase tracking-wider cursor-pointer hover:border-cyan-500 focus:outline-none focus:border-cyan-400 transition-all"
              >
                <option value="default">Industrial Yellow</option>
                <option value="variation1">Cyberpunk Cyan</option>
                <option value="variation2">Military Green</option>
              </select>
            </div>

            {/* Dropdown 2: Card Interior Styling */}
            <div className="mb-3">
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                Card Layout
              </label>
              <select
                value={cardInteriorStyle}
                onChange={(e) => setCardInteriorStyle(e.target.value as CardInteriorStyle)}
                className="w-full bg-black/60 border border-cyan-500/50 rounded px-2 py-1.5 text-cyan-300 text-xs font-bold uppercase tracking-wider cursor-pointer hover:border-cyan-500 focus:outline-none focus:border-cyan-400 transition-all"
              >
                <option value="compact">Classic Stack</option>
                <option value="spacious">Side-by-Side</option>
                <option value="modern">Minimal Centered</option>
                <option value="tech-badge">Tech Badge</option>
                <option value="cyber-compact">Cyber Compact</option>
                <option value="tactical-display">Tactical Display</option>
              </select>
            </div>

            {/* Dropdown 3: Buff Details Layout */}
            <div className="mb-3">
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                Buff Details Layout
              </label>
              <select
                value={buffDetailsLayout}
                onChange={(e) => setBuffDetailsLayout(e.target.value as 'classic' | 'compact-grid' | 'detailed-cards' | 'minimal')}
                className="w-full bg-black/60 border border-cyan-500/50 rounded px-2 py-1.5 text-cyan-300 text-xs font-bold uppercase tracking-wider cursor-pointer hover:border-cyan-500 focus:outline-none focus:border-cyan-400 transition-all"
              >
                <option value="classic">Classic Stack</option>
                <option value="compact-grid">Compact Grid</option>
                <option value="detailed-cards">Detailed Cards</option>
                <option value="minimal">Minimal List</option>
              </select>
            </div>

            {/* Dropdown 4: Designation Card Style */}
            <div className="mb-3">
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                Designation Card Style
              </label>
              <select
                value={designationCardStyle}
                onChange={(e) => setDesignationCardStyle(e.target.value as DesignationCardStyle)}
                className="w-full bg-black/60 border border-cyan-500/50 rounded px-2 py-1.5 text-cyan-300 text-xs font-bold uppercase tracking-wider cursor-pointer hover:border-cyan-500 focus:outline-none focus:border-cyan-400 transition-all"
              >
                <option value="corner-brackets">Corner Brackets</option>
                <option value="split-hud">Split HUD</option>
                <option value="data-terminal">Data Terminal</option>
                <option value="holographic-overlay">Holographic Overlay</option>
                <option value="cyber-minimal">Cyber Minimal</option>
                <option value="tech-frame">Tech Frame</option>
                <option value="neon-edge">Neon Edge</option>
                <option value="matrix-grid">Matrix Grid</option>
              </select>
            </div>

            {/* Dropdown 5: Cumulative Gold Style */}
            <div className="mb-3">
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                Cumulative Gold Style
              </label>
              <select
                value={cumulativeGoldStyle}
                onChange={(e) => setCumulativeGoldStyle(e.target.value as 'stacked-emphasis' | 'side-split' | 'badge-style' | 'horizontal-bar' | 'diagonal-layout' | 'stacked-compact' | 'stacked-wide' | 'stacked-minimal')}
                className="w-full bg-black/60 border border-cyan-500/50 rounded px-2 py-1.5 text-cyan-300 text-xs font-bold uppercase tracking-wider cursor-pointer hover:border-cyan-500 focus:outline-none focus:border-cyan-400 transition-all"
              >
                <option value="stacked-emphasis">Stacked Emphasis</option>
                <option value="side-split">Side Split</option>
                <option value="badge-style">Badge Style</option>
                <option value="horizontal-bar">Horizontal Bar</option>
                <option value="diagonal-layout">Diagonal Layout</option>
                <option value="stacked-compact">Stacked Compact</option>
                <option value="stacked-wide">Stacked Wide</option>
                <option value="stacked-minimal">Stacked Minimal</option>
              </select>
            </div>

            {/* Dropdown 6: Cumulative Gold Font */}
            <div className="mb-3">
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                Gold Card Font
              </label>
              <select
                value={cumulativeGoldFont}
                onChange={(e) => setCumulativeGoldFont(e.target.value)}
                className="w-full bg-black/60 border border-cyan-500/50 rounded px-2 py-1.5 text-cyan-300 text-xs font-bold uppercase tracking-wider cursor-pointer hover:border-cyan-500 focus:outline-none focus:border-cyan-400 transition-all"
              >
                <option value="Orbitron">Orbitron</option>
                <option value="Rajdhani">Rajdhani (Light)</option>
                <option value="Space Grotesk">Space Grotesk (Elegant)</option>
                <option value="Exo 2">Exo 2 (Ultra Thin)</option>
                <option value="JetBrains Mono">JetBrains Mono</option>
                <option value="IBM Plex Mono">IBM Plex Mono</option>
                <option value="Share Tech Mono">Share Tech Mono</option>
                <option value="Inter">Inter</option>
                <option value="Roboto Mono">Roboto Mono</option>
                <option value="Michroma">Michroma</option>
                <option value="Saira Condensed">Saira Condensed (Thin)</option>
                <option value="Teko">Teko (Light)</option>
                <option value="Abel">Abel (Condensed)</option>
                <option value="Josefin Sans">Josefin Sans (Thin)</option>
                <option value="Economica">Economica (Condensed)</option>
                <option value="Advent Pro">Advent Pro (Thin)</option>
                <option value="Archivo Narrow">Archivo Narrow (Condensed)</option>
              </select>
            </div>

            {/* Dropdown 7: Gold Generation Style */}
            <div className="mb-3">
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                Gold Generation Style
              </label>
              <select
                value={goldGenerationStyle}
                onChange={(e) => setGoldGenerationStyle(e.target.value as GoldGenerationStyle)}
                className="w-full bg-black/60 border border-cyan-500/50 rounded px-2 py-1.5 text-cyan-300 text-xs font-bold uppercase tracking-wider cursor-pointer hover:border-cyan-500 focus:outline-none focus:border-cyan-400 transition-all"
              >
                <option value="matrix-badge">Matrix Badge</option>
                <option value="command-line">Command Line</option>
                <option value="energy-display">Energy Display</option>
                <option value="split-panels">Split Panels</option>
                <option value="holographic-readout">Holographic Readout</option>
                <option value="tech-metrics">Tech Metrics</option>
                <option value="data-stream">Data Stream</option>
                <option value="compact-table">Compact Table</option>
                <option value="inline-metrics">Inline Metrics</option>
                <option value="dense-grid">Dense Grid</option>
                <option value="stat-bar">Stat Bar</option>
                <option value="compact-table-v2">Compact Table V2</option>
                <option value="compact-table-v3">Compact Table V3</option>
                <option value="compact-table-v4">Compact Table V4</option>
              </select>
            </div>

            {/* Dropdown 8: Combined Gold Card Style */}
            <div className="mb-3">
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                Combined Gold Card Style
              </label>
              <select
                value={combinedGoldCardStyle}
                onChange={(e) => setCombinedGoldCardStyle(e.target.value as CombinedGoldCardStyle)}
                className="w-full bg-black/60 border border-cyan-500/50 rounded px-2 py-1.5 text-cyan-300 text-xs font-bold uppercase tracking-wider cursor-pointer hover:border-cyan-500 focus:outline-none focus:border-cyan-400 transition-all"
              >
                <option value="vertical-stacked">Vertical Stacked</option>
                <option value="side-by-side">Side by Side</option>
                <option value="dashboard-grid">Dashboard Grid</option>
                <option value="hero-emphasis">Hero Emphasis</option>
                <option value="elegant-split">Elegant Split</option>
                <option value="cascade-accumulation">Cascade Accumulation</option>
                <option value="energy-conduit">Energy Conduit</option>
                <option value="clean-horizontal">Clean Horizontal (2 Fields)</option>
                <option value="stacked-minimal">Stacked Minimal (2 Fields)</option>
                <option value="badge-pair">Badge Pair (2 Fields)</option>
              </select>
            </div>

            {/* Toggle: Show Combined vs Individual Cards */}
            <div className="mb-3">
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                Gold Card Display
              </label>
              <button
                onClick={() => setShowCombinedGoldCard(!showCombinedGoldCard)}
                className={`w-full px-3 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                  showCombinedGoldCard
                    ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-400'
                    : 'bg-gray-500/20 border-2 border-gray-500 text-gray-400'
                }`}
              >
                {showCombinedGoldCard ? '🔗 Combined Card' : '📊 Individual Cards'}
              </button>
            </div>

            {/* Toggle: Glow Color */}
            <div className="mb-3">
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                Glow Color
              </label>
              <button
                onClick={() => setUseYellowGlow(!useYellowGlow)}
                className={`w-full px-3 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                  useYellowGlow
                    ? 'bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400'
                    : 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400'
                }`}
              >
                {useYellowGlow ? '⚡ Industrial Yellow' : '💠 Cyber Cyan'}
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-cyan-500/30 my-3"></div>

            {/* Opacity & Blur Controls - Collapsible */}
            <div className="mb-3">
              <button
                onClick={() => setSlidersCollapsed(!slidersCollapsed)}
                className="w-full flex items-center justify-between text-[10px] text-cyan-400 uppercase tracking-wider font-bold mb-2 hover:text-cyan-300 transition-colors"
              >
                <span>Opacity & Blur</span>
                <span className="text-xs">{slidersCollapsed ? '▼' : '▲'}</span>
              </button>

              {!slidersCollapsed && (
                <div className="space-y-3">
                  {/* Slider 1: Backdrop Darkness */}
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                      Backdrop Darkness: {backdropDarkness}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={backdropDarkness}
                      onChange={(e) => setBackdropDarkness(Number(e.target.value))}
                      className="w-full h-1 bg-black/60 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  {/* Slider 2: Card Darkness */}
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                      Card Darkness: {cardDarkness}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={cardDarkness}
                      onChange={(e) => setCardDarkness(Number(e.target.value))}
                      className="w-full h-1 bg-black/60 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  {/* Slider 3: Backdrop Blur */}
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                      Backdrop Blur: {backdropBlur}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={backdropBlur}
                      onChange={(e) => setBackdropBlur(Number(e.target.value))}
                      className="w-full h-1 bg-black/60 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  {/* Slider 4: Card Backdrop Blur */}
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                      Card Backdrop Blur: {cardBackdropBlur}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={cardBackdropBlur}
                      onChange={(e) => setCardBackdropBlur(Number(e.target.value))}
                      className="w-full h-1 bg-black/60 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  {/* Slider 5: Header Bottom Padding */}
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                      Header Bottom Padding: {headerBottomPadding}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={headerBottomPadding}
                      onChange={(e) => setHeaderBottomPadding(Number(e.target.value))}
                      className="w-full h-1 bg-black/60 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  {/* Slider 6: Header Gap (Top Padding) */}
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                      Content Top Padding: {headerGap}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={headerGap}
                      onChange={(e) => setHeaderGap(Number(e.target.value))}
                      className="w-full h-1 bg-black/60 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  {/* Slider 7: Content Spacing (space-y gap) */}
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                      Content Card Spacing: {contentSpacing}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="64"
                      value={contentSpacing}
                      onChange={(e) => setContentSpacing(Number(e.target.value))}
                      className="w-full h-1 bg-black/60 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Current Selection Display */}
            <div className="pt-2 border-t border-cyan-500/30">
              <div className="text-[10px] text-gray-500 mb-1">Active:</div>
              <div className="text-[10px] text-cyan-300 space-y-0.5">
                <div>
                  {styleVariation === 'default' && 'Industrial Yellow'}
                  {styleVariation === 'variation1' && 'Cyberpunk Cyan'}
                  {styleVariation === 'variation2' && 'Military Green'}
                </div>
                <div>
                  {cardInteriorStyle === 'compact' && 'Classic Stack'}
                  {cardInteriorStyle === 'spacious' && 'Side-by-Side'}
                  {cardInteriorStyle === 'modern' && 'Minimal Centered'}
                  {cardInteriorStyle === 'tech-badge' && 'Tech Badge'}
                  {cardInteriorStyle === 'cyber-compact' && 'Cyber Compact'}
                  {cardInteriorStyle === 'tactical-display' && 'Tactical Display'}
                </div>
                <div>
                  {buffDetailsLayout === 'classic' && 'Classic Stack'}
                  {buffDetailsLayout === 'compact-grid' && 'Compact Grid'}
                  {buffDetailsLayout === 'detailed-cards' && 'Detailed Cards'}
                  {buffDetailsLayout === 'minimal' && 'Minimal List'}
                </div>
                <div>Direct on Lightbox (Locked)</div>
                <div>
                  {designationCardStyle === 'corner-brackets' && 'Corner Brackets'}
                  {designationCardStyle === 'split-hud' && 'Split HUD'}
                  {designationCardStyle === 'data-terminal' && 'Data Terminal'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mek Profile Lightbox Modal */}
      <MekProfileLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        styleVariation={styleVariation}
        onStyleVariationChange={setStyleVariation}
        cardInteriorStyle={cardInteriorStyle}
        onCardInteriorStyleChange={setCardInteriorStyle}
        buffDetailsLayout={buffDetailsLayout}
        onBuffDetailsLayoutChange={setBuffDetailsLayout}
        designationCardStyle={designationCardStyle}
        onDesignationCardStyleChange={setDesignationCardStyle}
        cumulativeGoldStyle={cumulativeGoldStyle}
        cumulativeGoldFont={cumulativeGoldFont}
        goldGenerationStyle={goldGenerationStyle}
        onGoldGenerationStyleChange={setGoldGenerationStyle}
        combinedGoldCardStyle={combinedGoldCardStyle}
        onCombinedGoldCardStyleChange={setCombinedGoldCardStyle}
        showCombinedGoldCard={showCombinedGoldCard}
        levelProgressStyle={levelProgressStyle}
        onLevelProgressStyleChange={setLevelProgressStyle}
        useYellowGlow={useYellowGlow}
        backdropDarkness={backdropDarkness}
        onBackdropDarknessChange={setBackdropDarkness}
        cardDarkness={cardDarkness}
        onCardDarknessChange={setCardDarkness}
        backdropBlur={backdropBlur}
        onBackdropBlurChange={setBackdropBlur}
        cardBackdropBlur={cardBackdropBlur}
        onCardBackdropBlurChange={setCardBackdropBlur}
        headerGap={headerGap}
        onHeaderGapChange={setHeaderGap}
        headerBottomPadding={headerBottomPadding}
        onHeaderBottomPaddingChange={setHeaderBottomPadding}
        contentSpacing={contentSpacing}
        onContentSpacingChange={setContentSpacing}
        headerDarkness={headerDarkness}
        headerBlur={headerBlur}
        variationGlowIntensity={variationGlowIntensity}
        variationGlowSize={variationGlowSize}
        variationTextStyle={variationTextStyle}
        onVariationTextStyleChange={setVariationTextStyle}
      />

      {/* Gold Generation Details Lightbox */}
      <GoldGenerationDetailsLightbox
        isOpen={isGoldDetailsOpen}
        onClose={() => setIsGoldDetailsOpen(false)}
        layout={buffDetailsLayout}
      />
    </div>
  );
}
