'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import FillTextButton from '@/components/controls/FillTextButton';

/**
 * NewStylingAdmin - Comprehensive Styling Reference for Landing Page V2
 *
 * This page documents all styling aspects from the landing/phases page
 * to serve as a reference for applying consistent styling to other pages.
 */

// Styling categories
const STYLE_CATEGORIES = [
  { id: 'lightboxes', name: 'Lightboxes', icon: '🪟' },
  { id: 'liquid-glass', name: 'Liquid Glass Cards', icon: '💎' },
  { id: 'typography', name: 'Typography', icon: '🔤' },
  { id: 'colors', name: 'Colors & Glows', icon: '🎨' },
  { id: 'hover-effects', name: 'Hover Effects', icon: '✨' },
  { id: 'buttons', name: 'Buttons', icon: '🔘' },
  { id: 'footer', name: 'Footer', icon: '📄' },
  { id: 'animations', name: 'Animations', icon: '🎬' },
];

export default function NewStylingAdmin() {
  const [activeCategory, setActiveCategory] = useState('lightboxes');
  const [showDemoLightbox, setShowDemoLightbox] = useState(false);
  const [demoInput, setDemoInput] = useState('');

  const renderContent = () => {
    switch (activeCategory) {
      case 'lightboxes':
        return <LightboxStyles onShowDemo={() => setShowDemoLightbox(true)} />;
      case 'liquid-glass':
        return <LiquidGlassStyles />;
      case 'typography':
        return <TypographyStyles />;
      case 'colors':
        return <ColorStyles />;
      case 'hover-effects':
        return <HoverEffectStyles />;
      case 'buttons':
        return <ButtonStyles />;
      case 'footer':
        return <FooterStyles />;
      case 'animations':
        return <AnimationStyles />;
      default:
        return <LightboxStyles onShowDemo={() => setShowDemoLightbox(true)} />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-yellow-400 mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          New Styling Reference
        </h1>
        <p className="text-gray-400">
          Complete documentation of Landing Page V2 styling for consistent application across all pages.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STYLE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400'
                : 'bg-gray-800/50 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
            }`}
          >
            <span className="mr-2">{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
        {renderContent()}
      </div>

      {/* Demo Lightbox */}
      {showDemoLightbox && (
        <DemoLightbox
          onClose={() => setShowDemoLightbox(false)}
          inputValue={demoInput}
          onInputChange={setDemoInput}
        />
      )}
    </div>
  );
}

// ============================================================================
// LIGHTBOX STYLES
// ============================================================================
function LightboxStyles({ onShowDemo }: { onShowDemo: () => void }) {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-4">Lightbox Styling</h2>

      {/* Live Demo Button */}
      <div className="mb-6">
        <button
          onClick={onShowDemo}
          className="px-6 py-3 bg-cyan-500/20 border border-cyan-500 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all"
        >
          Show Live Demo Lightbox
        </button>
      </div>

      {/* Container/Backdrop */}
      <StyleSection title="Backdrop">
        <CodeBlock
          description="Full-screen backdrop with blur effect"
          code={`<div
  className="fixed inset-0 z-[9999] flex items-center justify-center"
  onClick={handleClose}
>
  {/* Blur backdrop */}
  <div
    className="fixed inset-0 bg-black/60"
    style={{
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)'
    }}
  />
  {/* Content */}
</div>`}
        />
      </StyleSection>

      {/* Modal Container */}
      <StyleSection title="Modal Container">
        <CodeBlock
          description="Rounded glass container with gradient background"
          code={`<div
  className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10"
  style={{
    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1) inset',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    maxHeight: '90vh',
    overflowY: 'auto'
  }}
  onClick={(e) => e.stopPropagation()}
>
  {/* Content */}
</div>`}
        />
        <PropertyTable properties={[
          { name: 'Border Radius', value: 'rounded-2xl (16px)', css: 'border-radius: 16px' },
          { name: 'Border', value: 'border-white/10', css: 'border: 1px solid rgba(255,255,255,0.1)' },
          { name: 'Background', value: 'Gradient from 5% to 2% white', css: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))' },
          { name: 'Backdrop Blur', value: '30px', css: 'backdrop-filter: blur(30px)' },
          { name: 'Shadow', value: 'Multi-layer shadow', css: '0 20px 60px rgba(0,0,0,0.5), inset 0 0 1px rgba(255,255,255,0.1)' },
          { name: 'Max Height', value: '90vh with overflow scroll', css: 'max-height: 90vh; overflow-y: auto' },
        ]} />
      </StyleSection>

      {/* Close Button (X) */}
      <StyleSection title="Close Button (X)">
        <CodeBlock
          description="Simple X button in top-right corner"
          code={`<button
  onClick={onClose}
  className="absolute top-4 right-4 text-white/50 hover:text-white/80 transition-colors z-10"
  style={{
    minWidth: '44px',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}
  aria-label="Close"
>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
</button>`}
        />
        <PropertyTable properties={[
          { name: 'Position', value: 'absolute top-4 right-4', css: 'position: absolute; top: 16px; right: 16px' },
          { name: 'Color', value: 'text-white/50 hover:text-white/80', css: 'color: rgba(255,255,255,0.5)' },
          { name: 'Touch Target', value: '44x44px minimum', css: 'min-width: 44px; min-height: 44px' },
          { name: 'Icon Size', value: '24x24px', css: 'width: 24px; height: 24px' },
          { name: 'Stroke', value: '2px', css: 'stroke-width: 2' },
        ]} />
      </StyleSection>

      {/* Input Field */}
      <StyleSection title="Input Field">
        <CodeBlock
          description="Stake address input with placeholder"
          code={`<input
  type="text"
  value={value}
  onChange={handleChange}
  placeholder="stake1..."
  className="w-full px-4 py-3 sm:py-4 text-base sm:text-lg bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:bg-white/10 transition-all border-white/10 focus:border-yellow-500/50"
  style={{ minHeight: '48px' }}
  autoComplete="off"
/>`}
        />
        <PropertyTable properties={[
          { name: 'Background', value: 'bg-white/5', css: 'background: rgba(255,255,255,0.05)' },
          { name: 'Border', value: 'border-white/10 → border-yellow-500/50', css: 'border: 1px solid rgba(255,255,255,0.1)' },
          { name: 'Border Radius', value: 'rounded-xl (12px)', css: 'border-radius: 12px' },
          { name: 'Text Color', value: 'text-white', css: 'color: white' },
          { name: 'Placeholder', value: 'placeholder-white/30', css: 'color: rgba(255,255,255,0.3)' },
          { name: 'Focus Background', value: 'bg-white/10', css: 'background: rgba(255,255,255,0.1)' },
          { name: 'Min Height', value: '48px', css: 'min-height: 48px' },
        ]} />
      </StyleSection>

      {/* Primary Button (Yellow) */}
      <StyleSection title="Primary Button (Yellow)">
        <CodeBlock
          description="Yellow gradient button for primary actions"
          code={`<button
  className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold tracking-wider text-black bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 shadow-lg shadow-yellow-500/20 active:scale-[0.98]"
  style={{
    minHeight: '48px',
    fontFamily: "'Inter', 'Arial', sans-serif"
  }}
>
  Continue
</button>`}
        />
        <PropertyTable properties={[
          { name: 'Background', value: 'Gradient yellow-400 to yellow-500', css: 'background: linear-gradient(to right, #facc15, #eab308)' },
          { name: 'Hover', value: 'Gradient yellow-300 to yellow-400', css: 'background: linear-gradient(to right, #fde047, #facc15)' },
          { name: 'Text Color', value: 'text-black', css: 'color: black' },
          { name: 'Font', value: "Inter, Arial, sans-serif", css: "font-family: 'Inter', sans-serif" },
          { name: 'Font Weight', value: 'font-semibold (600)', css: 'font-weight: 600' },
          { name: 'Letter Spacing', value: 'tracking-wider', css: 'letter-spacing: 0.05em' },
          { name: 'Border Radius', value: 'rounded-xl (12px)', css: 'border-radius: 12px' },
          { name: 'Shadow', value: 'shadow-yellow-500/20', css: 'box-shadow: 0 10px 15px rgba(234, 179, 8, 0.2)' },
          { name: 'Active Scale', value: 'scale(0.98)', css: 'transform: scale(0.98)' },
        ]} />
      </StyleSection>

      {/* Secondary Button (Cyan) */}
      <StyleSection title="Secondary Button (Cyan)">
        <CodeBlock
          description="Cyan gradient button for secondary actions (like 'Continue to Claim')"
          code={`<button
  className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold tracking-wider text-black bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-xl hover:from-cyan-300 hover:to-cyan-400 transition-all duration-300 shadow-lg shadow-cyan-500/30 active:scale-[0.98]"
  style={{
    minHeight: '48px',
    fontFamily: "'Inter', 'Arial', sans-serif"
  }}
>
  Continue to Claim
</button>`}
        />
      </StyleSection>

      {/* Cancel Link */}
      <StyleSection title="Cancel Link">
        <CodeBlock
          description="Text link for cancel actions"
          code={`<button
  onClick={onClose}
  className="w-full mt-3 py-2 px-4 text-sm font-medium transition-all duration-200 hover:text-red-400"
  style={{
    fontFamily: 'Inter, sans-serif',
    color: '#bae6fd',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer'
  }}
>
  Cancel
</button>`}
        />
      </StyleSection>

      {/* Corporation Verified State */}
      <StyleSection title="Verified State - Glowing Text">
        <CodeBlock
          description="Big glowing cyan corporation name"
          code={`<h2
  className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6"
  style={{
    fontFamily: "'Inter', 'Arial', sans-serif",
    color: '#22d3ee',
    textShadow: '0 0 20px rgba(34, 211, 238, 0.8), 0 0 40px rgba(34, 211, 238, 0.6), 0 0 60px rgba(34, 211, 238, 0.4)',
    letterSpacing: '-0.02em',
  }}
>
  WrenCo
</h2>`}
        />
        <PropertyTable properties={[
          { name: 'Color', value: 'cyan-400 (#22d3ee)', css: 'color: #22d3ee' },
          { name: 'Text Shadow', value: '3-layer cyan glow', css: 'text-shadow: 0 0 20px rgba(34,211,238,0.8), 0 0 40px rgba(34,211,238,0.6), 0 0 60px rgba(34,211,238,0.4)' },
          { name: 'Font', value: 'Inter', css: "font-family: 'Inter', sans-serif" },
          { name: 'Letter Spacing', value: '-0.02em (tight)', css: 'letter-spacing: -0.02em' },
        ]} />
      </StyleSection>

      {/* Checkmark Icon */}
      <StyleSection title="Checkmark Icon in Circle">
        <CodeBlock
          description="Verified checkmark with cyan border"
          code={`<div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-cyan-500/20 border-2 border-cyan-400/50 flex items-center justify-center">
  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
</div>`}
        />
      </StyleSection>
    </div>
  );
}

// ============================================================================
// LIQUID GLASS STYLES
// ============================================================================
function LiquidGlassStyles() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-4">Liquid Glass Cards</h2>

      <p className="text-gray-400 mb-6">
        The "liquid glass" effect creates translucent cards with subtle gradients and backdrop blur,
        giving a frosted glass appearance that allows background content to show through.
      </p>

      {/* Base Card */}
      <StyleSection title="Phase Card - Base State">
        <CodeBlock
          description="Base liquid glass card for Phase I style"
          code={`<button
  className="w-full text-left relative overflow-hidden group cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
  style={{
    height: '44px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))',
    transition: 'all 200ms ease',
  }}
>
  {/* Content */}
</button>`}
        />
        <PropertyTable properties={[
          { name: 'Height', value: '44px', css: 'height: 44px' },
          { name: 'Border Radius', value: '8px', css: 'border-radius: 8px' },
          { name: 'Background (Phase I)', value: 'Gradient 12% to 6% white', css: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))' },
          { name: 'Background (Phase II)', value: 'Gradient 15% to 8% white + border', css: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))' },
          { name: 'Background (Locked)', value: 'Gradient 5% to 2% white', css: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))' },
          { name: 'Hover Scale', value: 'scale(1.02)', css: 'transform: scale(1.02)' },
          { name: 'Active Scale', value: 'scale(0.98)', css: 'transform: scale(0.98)' },
        ]} />
      </StyleSection>

      {/* Phase II Active State */}
      <StyleSection title="Phase Card - Active State (Phase II)">
        <CodeBlock
          description="Active phase with border and glow"
          code={`style={{
  background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
}}`}
        />
      </StyleSection>

      {/* Expanded Content Area */}
      <StyleSection title="Expanded Content Area">
        <CodeBlock
          description="Expanded panel below card with backdrop blur"
          code={`<div
  className="mt-2 px-6 py-4"
  style={{
    background: 'rgba(20, 30, 40, 0.92)', // Phase I - more opaque
    // OR
    background: 'rgba(0, 0, 0, 0.4)', // Other phases - more translucent
    borderRadius: '8px',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  }}
>
  {/* Expanded content */}
</div>`}
        />
      </StyleSection>

      {/* Sliding Particles Animation */}
      <StyleSection title="Sliding Particles Animation (Phase II)">
        <CodeBlock
          description="Horizontal sliding light effect"
          code={`// CSS Animation
@keyframes slideParticles {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

// JSX
<div
  className="absolute inset-0 pointer-events-none"
  style={{
    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
    animation: 'slideParticles 3s linear infinite',
  }}
/>`}
        />
      </StyleSection>

      {/* Live Demo */}
      <div className="mt-8 p-6 bg-gray-800/50 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Live Examples</h3>
        <div className="space-y-3 max-w-md">
          {/* Phase I Style */}
          <div
            className="px-6 py-3 rounded-lg text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))',
            }}
          >
            <span className="text-white font-medium" style={{ fontFamily: 'Saira, sans-serif' }}>
              Phase I (Completed)
            </span>
          </div>

          {/* Phase II Style */}
          <div
            className="px-6 py-3 rounded-lg text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
            }}
          >
            <span className="text-white font-medium" style={{ fontFamily: 'Saira, sans-serif' }}>
              Phase II (Active)
            </span>
          </div>

          {/* Locked Style */}
          <div
            className="px-6 py-3 rounded-lg text-center opacity-50"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            }}
          >
            <span className="text-white/35 font-medium" style={{ fontFamily: 'Saira, sans-serif' }}>
              Phase III (Locked)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TYPOGRAPHY STYLES
// ============================================================================
function TypographyStyles() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-4">Typography</h2>

      {/* Font Imports */}
      <StyleSection title="Font Imports (globals.css)">
        <CodeBlock
          description="Google Fonts import statement"
          code={`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;700&family=Saira+Condensed:wght@400;700&family=Teko:wght@400;700&family=Michroma&family=Audiowide&family=Quantico:wght@400;700&family=Electrolize&family=Russo+One&family=Exo+2:wght@400;700&display=swap');`}
        />
      </StyleSection>

      {/* Font Usage */}
      <StyleSection title="Primary Fonts">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Saira - Phase Labels</p>
            <p className="text-xl text-white uppercase tracking-wider" style={{ fontFamily: 'Saira, sans-serif' }}>
              PHASE I
            </p>
            <code className="text-xs text-gray-500 mt-2 block">fontFamily: 'Saira, sans-serif'</code>
          </div>

          <div className="p-4 bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Play - Body Text</p>
            <p className="text-base text-white/75" style={{ fontFamily: 'Play, sans-serif' }}>
              Your commemorative NFT is ready to be claimed.
            </p>
            <code className="text-xs text-gray-500 mt-2 block">fontFamily: 'Play, sans-serif'</code>
          </div>

          <div className="p-4 bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Inter - Buttons & UI</p>
            <p className="text-lg text-white font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
              Continue to Claim
            </p>
            <code className="text-xs text-gray-500 mt-2 block">fontFamily: "'Inter', 'Arial', sans-serif"</code>
          </div>

          <div className="p-4 bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Orbitron - Special Titles</p>
            <p className="text-xl text-yellow-400 font-bold uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              NFT CLAIMED!
            </p>
            <code className="text-xs text-gray-500 mt-2 block">fontFamily: 'Orbitron, sans-serif'</code>
          </div>
        </div>
      </StyleSection>

      {/* Text Styles */}
      <StyleSection title="Common Text Styles">
        <PropertyTable properties={[
          { name: 'Lightbox Title', value: 'text-xl sm:text-2xl md:text-3xl font-light tracking-wide', css: 'font-size: 1.5rem; font-weight: 300; letter-spacing: 0.025em' },
          { name: 'Subtitle/Description', value: 'text-sm sm:text-base text-white/60 font-light', css: 'font-size: 0.875rem; color: rgba(255,255,255,0.6)' },
          { name: 'Phase Label', value: 'uppercase tracking-wider font-medium text-white', css: 'text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500' },
          { name: 'Phase Label (Locked)', value: 'text-white/35', css: 'color: rgba(255,255,255,0.35)' },
          { name: 'Expanded Title', value: 'text-yellow-400 uppercase tracking-wider', css: 'color: #facc15; text-transform: uppercase' },
          { name: 'Complete Badge', value: 'text-[#00d4ff] uppercase font-bold text-xs', css: 'color: #00d4ff; font-weight: 700; font-size: 12px' },
        ]} />
      </StyleSection>

      {/* Live Examples */}
      <div className="mt-6 p-6 bg-gray-800/50 rounded-xl space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Live Typography Examples</h3>

        <div className="p-4 bg-black/30 rounded-lg">
          <h4 className="text-xl sm:text-2xl md:text-3xl font-light text-white tracking-wide mb-2">
            Commemorative NFT
          </h4>
          <p className="text-sm sm:text-base text-white/60 font-light">
            Please enter the stake address of the wallet you used to create your corporation.
          </p>
        </div>

        <div className="p-4 bg-black/30 rounded-lg">
          <h4 className="text-yellow-400 uppercase tracking-wider font-medium" style={{ fontFamily: 'Saira, sans-serif' }}>
            Phase I Complete
          </h4>
          <div className="uppercase font-bold mt-1 text-xs" style={{ fontFamily: 'Play, sans-serif', color: '#00d4ff', textShadow: '0 0 10px rgba(0, 212, 255, 0.8)' }}>
            COMPLETE
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COLORS & GLOWS
// ============================================================================
function ColorStyles() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-4">Colors & Glows</h2>

      {/* Color Palette */}
      <StyleSection title="Primary Color Palette">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Primary Yellow', color: '#fab617', tailwind: 'yellow-500', usage: 'Primary accent, buttons' },
            { name: 'Cyan/Blue', color: '#22d3ee', tailwind: 'cyan-400', usage: 'Success states, verified' },
            { name: 'White/Glass', color: 'rgba(255,255,255,0.1)', tailwind: 'white/10', usage: 'Glass effects, borders' },
            { name: 'Complete Blue', color: '#00d4ff', tailwind: 'N/A', usage: 'Complete badge' },
          ].map(c => (
            <div key={c.name} className="p-4 bg-gray-800/50 rounded-lg">
              <div
                className="w-full h-12 rounded-lg mb-2 border border-white/10"
                style={{ background: c.color }}
              />
              <p className="text-sm font-medium text-white">{c.name}</p>
              <p className="text-xs text-gray-500">{c.color}</p>
              <p className="text-xs text-gray-400 mt-1">{c.usage}</p>
            </div>
          ))}
        </div>
      </StyleSection>

      {/* Glow Effects */}
      <StyleSection title="Text Glow Effects">
        <CodeBlock
          description="Cyan glow for verified corporation name"
          code={`style={{
  color: '#22d3ee',
  textShadow: '0 0 20px rgba(34, 211, 238, 0.8), 0 0 40px rgba(34, 211, 238, 0.6), 0 0 60px rgba(34, 211, 238, 0.4)',
}}`}
        />

        <CodeBlock
          description="Blue glow for COMPLETE badge"
          code={`style={{
  color: '#00d4ff',
  textShadow: '0 0 10px rgba(0, 212, 255, 0.8)',
}}`}
        />
      </StyleSection>

      {/* Live Glow Examples */}
      <div className="mt-6 p-6 bg-gray-800/50 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Live Glow Examples</h3>
        <div className="space-y-4">
          <div className="p-4 bg-black rounded-lg">
            <span
              className="text-3xl font-bold"
              style={{
                color: '#22d3ee',
                textShadow: '0 0 20px rgba(34, 211, 238, 0.8), 0 0 40px rgba(34, 211, 238, 0.6), 0 0 60px rgba(34, 211, 238, 0.4)',
              }}
            >
              WrenCo
            </span>
            <p className="text-xs text-gray-500 mt-2">3-layer cyan glow</p>
          </div>

          <div className="p-4 bg-black rounded-lg">
            <span
              className="text-sm uppercase font-bold"
              style={{
                color: '#00d4ff',
                textShadow: '0 0 10px rgba(0, 212, 255, 0.8)',
                letterSpacing: '2px',
              }}
            >
              COMPLETE
            </span>
            <p className="text-xs text-gray-500 mt-2">Single layer blue glow</p>
          </div>

          <div className="p-4 bg-black rounded-lg">
            <span
              className="text-2xl font-bold text-white"
              style={{
                textShadow: '0 0 6px rgba(255,255,255,0.9), 0 0 12px rgba(255,255,255,0.6)',
              }}
            >
              Claim NFT
            </span>
            <p className="text-xs text-gray-500 mt-2">White text glow on hover</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HOVER EFFECTS
// ============================================================================
function HoverEffectStyles() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-4">Hover Effects</h2>

      {/* Honeycomb Pattern */}
      <StyleSection title="Honeycomb Pattern Overlay">
        <CodeBlock
          description="Honeycomb pattern that appears on hover"
          code={`{/* Honeycomb pattern overlay on hover */}
<div
  className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-[0.07]"
  style={{
    backgroundImage: \`url('/random-images/honey-png-big.webp')\`,
    backgroundSize: '100%',
    backgroundPosition: 'center',
    borderRadius: '8px'
  }}
/>`}
        />
        <PropertyTable properties={[
          { name: 'Image', value: '/random-images/honey-png-big.webp', css: "backgroundImage: url('/random-images/honey-png-big.webp')" },
          { name: 'Opacity (rest)', value: '0', css: 'opacity: 0' },
          { name: 'Opacity (hover)', value: '0.07 (active) or 0.04 (locked)', css: 'opacity: 0.07' },
          { name: 'Transition', value: '300ms', css: 'transition-duration: 300ms' },
          { name: 'Background Size', value: '100%', css: 'background-size: 100%' },
        ]} />
      </StyleSection>

      {/* Button Honeycomb */}
      <StyleSection title="Button Honeycomb (Claim NFT)">
        <CodeBlock
          description="Honeycomb on button hover with text glow"
          code={`<button className="group relative overflow-hidden">
  {/* Honeycomb pattern overlay on hover */}
  <div
    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg"
    style={{
      backgroundImage: \`url('/random-images/honey-png1.webp')\`,
      backgroundSize: '125%',
      backgroundPosition: 'center'
    }}
  />
  <span className="transition-all duration-300 group-hover:[text-shadow:0_0_6px_rgba(255,255,255,0.9),0_0_12px_rgba(255,255,255,0.6)]">
    Claim NFT
  </span>
</button>`}
        />
      </StyleSection>

      {/* Live Demo */}
      <div className="mt-6 p-6 bg-gray-800/50 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Live Hover Demo</h3>
        <p className="text-sm text-gray-400 mb-4">Hover over these elements to see the honeycomb effect</p>

        <div className="space-y-4 max-w-md">
          {/* Phase Card Demo */}
          <button
            className="w-full px-6 py-3 rounded-lg text-center relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-[0.07]"
              style={{
                backgroundImage: `url('/random-images/honey-png-big.webp')`,
                backgroundSize: '100%',
                backgroundPosition: 'center',
              }}
            />
            <span className="text-white font-medium relative z-10" style={{ fontFamily: 'Saira, sans-serif' }}>
              PHASE II - Hover me
            </span>
          </button>

          {/* Button Demo */}
          <button
            className="px-6 py-2.5 rounded-lg font-medium transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] group relative overflow-hidden"
            style={{
              fontFamily: "'Play', sans-serif",
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
              color: '#e0e0e0',
              border: '1px solid rgba(255, 255, 255, 0.25)',
            }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg"
              style={{
                backgroundImage: `url('/random-images/honey-png1.webp')`,
                backgroundSize: '125%',
                backgroundPosition: 'center'
              }}
            />
            <span className="relative z-10 transition-all duration-300 group-hover:[text-shadow:0_0_6px_rgba(255,255,255,0.9),0_0_12px_rgba(255,255,255,0.6)]">
              Claim NFT
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// BUTTON STYLES
// ============================================================================
function ButtonStyles() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-4">Button Styles</h2>

      {/* Fill Text Button */}
      <StyleSection title="FillTextButton (Join Beta)">
        <CodeBlock
          description="Animated button with blue line sweep effect"
          code={`import FillTextButton from '@/components/controls/FillTextButton';

<FillTextButton
  text="join beta"
  fontFamily="Play"
  onClick={handleClick}
/>`}
        />
        <PropertyTable properties={[
          { name: 'Animation', value: 'Blue line sweeps left to right on hover', css: 'N/A - component internal' },
          { name: 'Text Color (rest)', value: 'White (#FFFFFF)', css: 'color: #FFFFFF' },
          { name: 'Text Color (hover)', value: 'Cyan (#3DD1FF)', css: 'color: #3DD1FF' },
          { name: 'Line Color', value: 'Cyan (#3DD1FF)', css: 'background-color: #3DD1FF' },
          { name: 'Line Width', value: '3px', css: 'width: 3px' },
          { name: 'Transition Duration', value: '500ms', css: 'transition: 500ms cubic-bezier(0.4, 0, 0.2, 1)' },
          { name: 'Text Transform', value: 'uppercase', css: 'text-transform: uppercase' },
          { name: 'Letter Spacing', value: '3px', css: 'letter-spacing: 3px' },
        ]} />
      </StyleSection>

      {/* Live Demo */}
      <div className="mt-6 p-6 bg-black rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Live Demo</h3>
        <div className="flex justify-center py-4">
          <FillTextButton
            text="join beta"
            fontFamily="Play"
            onClick={() => console.log('Clicked!')}
          />
        </div>
      </div>

      {/* Glass Button */}
      <StyleSection title="Glass Button (Claim NFT)">
        <CodeBlock
          description="Translucent button with honeycomb hover"
          code={`<button
  className="px-6 py-2.5 rounded-lg font-medium transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] hover:border-white/50 hover:brightness-125 group relative overflow-hidden"
  style={{
    fontFamily: "'Play', sans-serif",
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
    color: '#e0e0e0',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    letterSpacing: '0.06em',
    fontSize: '14px',
    fontWeight: 500
  }}
>
  {/* Honeycomb overlay */}
  <div
    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg"
    style={{
      backgroundImage: \`url('/random-images/honey-png1.webp')\`,
      backgroundSize: '125%',
      backgroundPosition: 'center'
    }}
  />
  <span className="transition-all duration-300 group-hover:[text-shadow:0_0_6px_rgba(255,255,255,0.9),0_0_12px_rgba(255,255,255,0.6)]">
    Claim NFT
  </span>
</button>`}
        />
      </StyleSection>

      {/* Wallet Button */}
      <StyleSection title="Wallet Selection Button">
        <CodeBlock
          description="Wallet button with honeycomb hover and icon"
          code={`<button
  className="group relative bg-black/30 border border-cyan-500/30 text-white px-4 py-3 rounded-xl transition-all hover:bg-cyan-500/10 hover:border-cyan-500/50 flex items-center justify-center overflow-hidden"
>
  {/* Honeycomb hover effect */}
  <div
    className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-[0.15] z-[1]"
    style={{
      backgroundImage: \`url('/random-images/honey-png-big.webp')\`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      borderRadius: '12px'
    }}
  />
  <img src={wallet.icon} className="absolute left-3 w-5 h-5 rounded z-[2]" />
  <span className="font-medium relative z-[2]">{wallet.name}</span>
</button>`}
        />
      </StyleSection>
    </div>
  );
}

// ============================================================================
// FOOTER STYLES
// ============================================================================
function FooterStyles() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-4">Footer Styling</h2>

      {/* Footer Container */}
      <StyleSection title="Footer Container">
        <CodeBlock
          description="Footer with backdrop blur and honeycomb pattern"
          code={`<footer
  className="w-full relative mt-auto transition-opacity duration-1000 ease-out"
  style={{
    marginTop: '50px',
    paddingTop: '32px',
    paddingBottom: '12px',
  }}
>
  {/* Backdrop blur effect */}
  <div
    className="absolute"
    style={{
      top: 0,
      left: 0,
      right: '17px', // Account for scrollbar
      bottom: 0,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      backgroundColor: 'rgba(255, 255, 255, 0.005)',
      transform: 'translate3d(0, 0, 0)', // iOS Safari fix
      isolation: 'isolate',
    }}
  />

  {/* Content */}
</footer>`}
        />
      </StyleSection>

      {/* Honeycomb SVG Pattern */}
      <StyleSection title="Honeycomb SVG Pattern with Fade">
        <CodeBlock
          description="SVG honeycomb pattern with vertical fade gradient"
          code={`<svg className="absolute inset-0 w-full h-full pointer-events-none">
  <defs>
    <pattern id="honeycomb" width="28" height="49" patternUnits="userSpaceOnUse">
      <path d="M14 0 L21 4 L21 12 L14 16 L7 12 L7 4 Z" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5"/>
      <path d="M0 24.5 L7 28.5 L7 36.5 L0 40.5 L-7 36.5 L-7 28.5 Z" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5"/>
      <path d="M28 24.5 L35 28.5 L35 36.5 L28 40.5 L21 36.5 L21 28.5 Z" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5"/>
    </pattern>
    <linearGradient id="fadeGradient" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stopColor="white" stopOpacity="1" />
      <stop offset="80%" stopColor="white" stopOpacity="0" />
    </linearGradient>
    <mask id="fadeMask">
      <rect x="0" y="0" width="100%" height="100%" fill="url(#fadeGradient)" />
    </mask>
  </defs>
  <rect width="100%" height="100%" fill="url(#honeycomb)" mask="url(#fadeMask)" />
</svg>`}
        />
        <PropertyTable properties={[
          { name: 'Pattern Size', value: '28x49px', css: 'width: 28, height: 49' },
          { name: 'Stroke Color', value: 'rgba(255,255,255,0.22)', css: 'stroke: rgba(255,255,255,0.22)' },
          { name: 'Stroke Width', value: '0.5px', css: 'stroke-width: 0.5' },
          { name: 'Fade Direction', value: 'Bottom (visible) to Top (transparent)', css: 'linearGradient y1=100% y2=0%' },
        ]} />
      </StyleSection>

      {/* Social Icons */}
      <StyleSection title="Social Icons">
        <CodeBlock
          description="Social icons with hover effects"
          code={`<a
  href="https://discord.gg/..."
  target="_blank"
  rel="noopener noreferrer"
  className="text-gray-400 hover:text-white transition-all hover:scale-110"
>
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    {/* SVG path */}
  </svg>
</a>`}
        />
        <PropertyTable properties={[
          { name: 'Icon Size', value: 'w-6 h-6 (24px)', css: 'width: 24px; height: 24px' },
          { name: 'Color (rest)', value: 'text-gray-400', css: 'color: #9ca3af' },
          { name: 'Color (hover)', value: 'text-white', css: 'color: white' },
          { name: 'Scale (hover)', value: 'scale(1.1)', css: 'transform: scale(1.1)' },
          { name: 'Container Scale', value: 'scale-[0.792]', css: 'transform: scale(0.792)' },
        ]} />
      </StyleSection>
    </div>
  );
}

// ============================================================================
// ANIMATION STYLES
// ============================================================================
function AnimationStyles() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-4">Animations</h2>

      {/* Fade In */}
      <StyleSection title="Fade In with Slide Up">
        <CodeBlock
          description="Content entrance animation"
          code={`<div
  className="w-full transition-all duration-[900ms] ease-out"
  style={{
    opacity: shouldShow ? 1 : 0,
    transform: \`translateY(\${shouldShow ? 0 : 20}px)\`,
    backdropFilter: shouldShow ? 'blur(10px)' : 'blur(0px)',
  }}
>`}
        />
        <PropertyTable properties={[
          { name: 'Duration', value: '900ms', css: 'transition-duration: 900ms' },
          { name: 'Easing', value: 'ease-out', css: 'transition-timing-function: ease-out' },
          { name: 'Transform', value: 'translateY(0 → 20px)', css: 'transform: translateY(20px)' },
          { name: 'Opacity', value: '0 → 1', css: 'opacity: 0 → 1' },
        ]} />
      </StyleSection>

      {/* Staggered Content */}
      <StyleSection title="Staggered Content Reveal">
        <CodeBlock
          description="Phase cards appear with staggered delays"
          code={`// Content timing configuration
const contentDelay = 4000; // Start after logo

// Phase card delays (staggered)
const phaseDelays = [0, 550, 1100, 1650]; // ms from contentDelay

// Implementation
{phaseCards.map((card, index) => (
  <PhaseCard
    key={card._id}
    style={{
      transitionDelay: \`\${contentDelay + phaseDelays[index]}ms\`,
    }}
  />
))}`}
        />
      </StyleSection>

      {/* Sliding Particles */}
      <StyleSection title="Sliding Particles (Phase II)">
        <CodeBlock
          description="Horizontal sliding light animation"
          code={`@keyframes slideParticles {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

// Usage
<div
  style={{
    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
    animation: 'slideParticles 3s linear infinite',
  }}
/>`}
        />
      </StyleSection>

      {/* Line Glow */}
      <StyleSection title="FillTextButton Line Glow">
        <CodeBlock
          description="Subtle pulsing glow on the sweeping line"
          code={`@keyframes line-glow {
  0%, 100% {
    opacity: 0.8;
    box-shadow: 0 0 2px rgba(61, 209, 255, 0.6);
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 4px rgba(61, 209, 255, 0.8);
  }
}

// Applied to line element
style={{
  animation: isHovered ? 'line-glow 2s ease-in-out infinite' : 'none',
}}`}
        />
      </StyleSection>

      {/* Expanded Panel */}
      <StyleSection title="Expand/Collapse Animation">
        <CodeBlock
          description="Smooth max-height transition for expanded content"
          code={`<div
  style={{
    maxHeight: isExpanded ? '1000px' : '0',
    overflow: 'hidden',
    transition: 'max-height 300ms ease-out',
  }}
>
  <div
    style={{
      opacity: isExpanded ? 1 : 0,
      transition: 'opacity 300ms ease-out',
    }}
  >
    {/* Content */}
  </div>
</div>`}
        />
      </StyleSection>

      {/* Footer Fade */}
      <StyleSection title="Footer Fade In">
        <CodeBlock
          description="Footer fades in with content"
          code={`<footer
  className="transition-opacity duration-1000 ease-out"
  style={{
    opacity: showFooter ? 1 : 0,
    pointerEvents: showFooter ? 'auto' : 'none'
  }}
>`}
        />
      </StyleSection>
    </div>
  );
}

// ============================================================================
// DEMO LIGHTBOX
// ============================================================================
function DemoLightbox({ onClose, inputValue, onInputChange }: {
  onClose: () => void;
  inputValue: string;
  onInputChange: (value: string) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (mounted) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mounted]);

  if (!mounted) return null;

  const lightboxContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-auto p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60"
        style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1) inset',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white/80 transition-colors z-10"
          style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Content */}
        <div className="px-6 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-5">
          <div className="text-center">
            <div className="mb-6 sm:mb-8 pt-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-white tracking-wide mb-3 whitespace-nowrap">
                Commemorative NFT
              </h2>
              <p className="text-sm sm:text-base text-white/60 font-light tracking-wide leading-relaxed">
                Please enter the stake address of the wallet you used to create your corporation.
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="stake1..."
                className="w-full px-4 py-3 sm:py-4 text-base sm:text-lg bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:bg-white/10 transition-all border-white/10 focus:border-yellow-500/50"
                style={{ minHeight: '48px' }}
              />

              <button
                className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold tracking-wider text-black bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 shadow-lg shadow-yellow-500/20 active:scale-[0.98]"
                style={{ minHeight: '48px', fontFamily: "'Inter', 'Arial', sans-serif" }}
                onClick={() => alert('Demo button clicked!')}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document.body, ensuring viewport-centered positioning
  return createPortal(lightboxContent, document.body);
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================
function StyleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-yellow-400 mb-3 border-b border-gray-700 pb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function CodeBlock({ description, code }: { description: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-4">
      <p className="text-sm text-gray-400 mb-2">{description}</p>
      <div className="relative">
        <pre className="bg-black/50 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300">
          <code>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

function PropertyTable({ properties }: { properties: { name: string; value: string; css: string }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-800/50">
            <th className="text-left px-3 py-2 text-gray-400 font-medium border border-gray-700">Property</th>
            <th className="text-left px-3 py-2 text-gray-400 font-medium border border-gray-700">Value / Class</th>
            <th className="text-left px-3 py-2 text-gray-400 font-medium border border-gray-700">CSS</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((prop, i) => (
            <tr key={i} className="hover:bg-gray-800/30">
              <td className="px-3 py-2 text-white border border-gray-700">{prop.name}</td>
              <td className="px-3 py-2 text-yellow-400 font-mono text-xs border border-gray-700">{prop.value}</td>
              <td className="px-3 py-2 text-gray-400 font-mono text-xs border border-gray-700">{prop.css}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
