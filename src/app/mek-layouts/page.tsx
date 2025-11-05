'use client';

import { useState } from 'react';
import MekProfileLightbox from '@/components/MekProfileLightbox';
import GoldGenerationDetailsLightbox from '@/components/GoldGenerationDetailsLightbox';

export default function MekLayoutsPage() {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isGoldDetailsOpen, setIsGoldDetailsOpen] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  const [styleVariation, setStyleVariation] = useState<'default' | 'variation1' | 'variation2'>('default');
  const [cardInteriorStyle, setCardInteriorStyle] = useState<'compact' | 'spacious' | 'modern'>('compact');
  const [buffDetailsLayout, setBuffDetailsLayout] = useState<'classic' | 'compact-grid' | 'detailed-cards' | 'minimal'>('classic');
  const [variationCardStyle, setVariationCardStyle] = useState<'clean-frames' | 'image-focus' | 'subtle-accent'>('clean-frames');
  const [backdropDarkness, setBackdropDarkness] = useState(22);
  const [cardDarkness, setCardDarkness] = useState(7);
  const [backdropBlur, setBackdropBlur] = useState(0);
  const [cardBackdropBlur, setCardBackdropBlur] = useState(9);
  const [slidersCollapsed, setSlidersCollapsed] = useState(false);

  return (
    <div className="min-h-screen text-white flex flex-col items-center p-4">
      {/* Page Title */}
      <h1 className="text-4xl font-bold mb-6 text-yellow-400 uppercase tracking-wider font-orbitron mt-8">
        Mek Profile
      </h1>

      {/* Open Lightbox Button */}
      <button
        onClick={() => setIsLightboxOpen(true)}
        className="mek-button-primary px-8 py-4 text-lg font-bold uppercase tracking-wider mb-8"
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

      {/* Debug Toggle Button - Fixed Position */}
      <button
        onClick={() => setShowDebugPanel(!showDebugPanel)}
        className="fixed top-4 right-4 z-[999999] px-4 py-2 bg-black/80 border-2 border-cyan-500/50 rounded hover:bg-cyan-500/20 hover:border-cyan-500 transition-all pointer-events-auto"
      >
        <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Style Variations</span>
      </button>

      {/* Debug Panel - Fixed Position with Style Dropdowns */}
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
                onChange={(e) => setCardInteriorStyle(e.target.value as 'compact' | 'spacious' | 'modern')}
                className="w-full bg-black/60 border border-cyan-500/50 rounded px-2 py-1.5 text-cyan-300 text-xs font-bold uppercase tracking-wider cursor-pointer hover:border-cyan-500 focus:outline-none focus:border-cyan-400 transition-all"
              >
                <option value="compact">Classic Stack</option>
                <option value="spacious">Side-by-Side</option>
                <option value="modern">Minimal Centered</option>
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

            {/* Dropdown 4: Variation Cards Style */}
            <div className="mb-3">
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                Variation Cards Style
              </label>
              <select
                value={variationCardStyle}
                onChange={(e) => setVariationCardStyle(e.target.value as 'clean-frames' | 'image-focus' | 'subtle-accent')}
                className="w-full bg-black/60 border border-cyan-500/50 rounded px-2 py-1.5 text-cyan-300 text-xs font-bold uppercase tracking-wider cursor-pointer hover:border-cyan-500 focus:outline-none focus:border-cyan-400 transition-all"
              >
                <option value="clean-frames">Clean Frames</option>
                <option value="image-focus">Image Focus</option>
                <option value="subtle-accent">Subtle Accent</option>
              </select>
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
                </div>
                <div>
                  {buffDetailsLayout === 'classic' && 'Classic Stack'}
                  {buffDetailsLayout === 'compact-grid' && 'Compact Grid'}
                  {buffDetailsLayout === 'detailed-cards' && 'Detailed Cards'}
                  {buffDetailsLayout === 'minimal' && 'Minimal List'}
                </div>
                <div>
                  {variationCardStyle === 'clean-frames' && 'Clean Frames'}
                  {variationCardStyle === 'image-focus' && 'Image Focus'}
                  {variationCardStyle === 'subtle-accent' && 'Subtle Accent'}
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
        variationCardStyle={variationCardStyle}
        onVariationCardStyleChange={setVariationCardStyle}
        backdropDarkness={backdropDarkness}
        onBackdropDarknessChange={setBackdropDarkness}
        cardDarkness={cardDarkness}
        onCardDarknessChange={setCardDarkness}
        backdropBlur={backdropBlur}
        onBackdropBlurChange={setBackdropBlur}
        cardBackdropBlur={cardBackdropBlur}
        onCardBackdropBlurChange={setCardBackdropBlur}
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
