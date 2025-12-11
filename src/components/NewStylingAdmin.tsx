'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import FillTextButton from '@/components/controls/FillTextButton';
import { getMediaUrl } from '@/lib/media-url';

const STYLE_CATEGORIES = [
  { id: 'lightboxes', name: 'Lightboxes', icon: '🪟' },
  { id: 'liquid-glass', name: 'Liquid Glass Cards', icon: '💎' },
  { id: 'dropdowns', name: 'Dropdowns', icon: '📋' },
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
  const [showVerifiedLightbox, setShowVerifiedLightbox] = useState(false);
  const [demoInput, setDemoInput] = useState('');

  const renderContent = () => {
    switch (activeCategory) {
      case 'lightboxes':
        return <LightboxStyles onShowDemo={() => setShowDemoLightbox(true)} onShowVerified={() => setShowVerifiedLightbox(true)} />;
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
        return <LightboxStyles onShowDemo={() => setShowDemoLightbox(true)} onShowVerified={() => setShowVerifiedLightbox(true)} />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-yellow-400 mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          Space Age Style
        </h1>
        <p className="text-gray-400">
          Live demos of the Space Age styling system. Technical details are collapsed by default.
        </p>
      </div>

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

      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
        {renderContent()}
      </div>

      {showDemoLightbox && (
        <DemoLightbox
          onClose={() => setShowDemoLightbox(false)}
          inputValue={demoInput}
          onInputChange={setDemoInput}
        />
      )}

      {showVerifiedLightbox && (
        <VerifiedLightbox onClose={() => setShowVerifiedLightbox(false)} />
      )}
    </div>
  );
}

// ============================================================================
// COLLAPSIBLE TECHNICAL DETAILS
// ============================================================================
function TechnicalDetails({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-6 border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-800/50 flex items-center justify-between text-left hover:bg-gray-800/70 transition-colors"
      >
        <span className="text-sm text-gray-400 font-medium">
          {isOpen ? '▼' : '▶'} {title}
        </span>
        <span className="text-xs text-gray-500">
          {isOpen ? 'Click to collapse' : 'Click to expand'}
        </span>
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-900/30 border-t border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// LIGHTBOX STYLES
// ============================================================================
function LightboxStyles({ onShowDemo, onShowVerified }: { onShowDemo: () => void; onShowVerified: () => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Lightbox Styling</h2>

      {/* LIVE DEMOS AT TOP */}
      <div className="p-6 bg-black/30 rounded-xl border border-gray-600">
        <h3 className="text-lg font-semibold text-yellow-400 mb-4">Live Demos</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={onShowDemo}
            className="px-6 py-3 bg-yellow-500/20 border border-yellow-500 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-all"
          >
            Input Lightbox (Stake Address)
          </button>
          <button
            onClick={onShowVerified}
            className="px-6 py-3 bg-cyan-500/20 border border-cyan-500 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all"
          >
            Verified Lightbox (Corporation)
          </button>
        </div>
      </div>

      {/* Technical Details - Collapsed */}
      <TechnicalDetails title="Technical Implementation Details">
        <div className="space-y-6">
          <StyleSection title="Backdrop">
            <CodeBlock
              description="Full-screen backdrop with blur effect"
              code={`<div className="fixed inset-0 bg-black/60" style={{ backdropFilter: 'blur(20px)' }} />`}
            />
          </StyleSection>

          <StyleSection title="Modal Container">
            <PropertyTable properties={[
              { name: 'Border Radius', value: 'rounded-2xl (16px)', css: 'border-radius: 16px' },
              { name: 'Border', value: 'border-white/10', css: 'border: 1px solid rgba(255,255,255,0.1)' },
              { name: 'Background', value: 'Gradient 5% to 2% white', css: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))' },
              { name: 'Backdrop Blur', value: '30px', css: 'backdrop-filter: blur(30px)' },
            ]} />
          </StyleSection>

          <StyleSection title="Close Button (X)">
            <PropertyTable properties={[
              { name: 'Position', value: 'absolute top-4 right-4', css: 'top: 16px; right: 16px' },
              { name: 'Color', value: 'text-white/50 hover:white/80', css: 'rgba(255,255,255,0.5)' },
              { name: 'Touch Target', value: '44x44px minimum', css: 'min-width: 44px' },
            ]} />
          </StyleSection>

          <StyleSection title="Primary Button (Yellow)">
            <PropertyTable properties={[
              { name: 'Background', value: 'from-yellow-400 to-yellow-500', css: 'linear-gradient(to right, #facc15, #eab308)' },
              { name: 'Text Color', value: 'text-black', css: 'color: black' },
              { name: 'Border Radius', value: 'rounded-xl (12px)', css: 'border-radius: 12px' },
            ]} />
          </StyleSection>

          <StyleSection title="Cyan Glow Text (Verified)">
            <PropertyTable properties={[
              { name: 'Color', value: 'cyan-400 (#22d3ee)', css: 'color: #22d3ee' },
              { name: 'Text Shadow', value: '3-layer glow', css: 'text-shadow: 0 0 20px rgba(34,211,238,0.8), 0 0 40px rgba(34,211,238,0.6), 0 0 60px rgba(34,211,238,0.4)' },
            ]} />
          </StyleSection>
        </div>
      </TechnicalDetails>
    </div>
  );
}

// ============================================================================
// LIQUID GLASS STYLES
// ============================================================================
function LiquidGlassStyles() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Liquid Glass Cards</h2>

      {/* LIVE DEMO WITH PLANET BACKGROUND */}
      <div
        className="relative p-8 rounded-xl overflow-hidden"
        style={{
          backgroundImage: `url(${getMediaUrl('/random-images/planet1.png')})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay to make cards readable */}
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">Live Demo (with backdrop blur visible)</h3>
          <div className="space-y-3 max-w-md">
            {/* Phase I Style */}
            <button
              className="w-full px-6 py-3 rounded-lg text-center text-left relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] transition-transform"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
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
                PHASE I (Completed) - Hover me
              </span>
            </button>

            {/* Phase II Style - Active */}
            <button
              className="w-full px-6 py-3 rounded-lg text-center text-left relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] transition-transform"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              {/* Sliding particles animation */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                  animation: 'slideParticles 3s linear infinite',
                }}
              />
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-[0.07]"
                style={{
                  backgroundImage: `url('/random-images/honey-png-big.webp')`,
                  backgroundSize: '100%',
                  backgroundPosition: 'center',
                }}
              />
              <span className="text-white font-medium relative z-10" style={{ fontFamily: 'Saira, sans-serif' }}>
                PHASE II (Active) - With sliding particles
              </span>
            </button>

            {/* Locked Style */}
            <button
              className="w-full px-6 py-3 rounded-lg text-center text-left relative overflow-hidden group opacity-60 hover:scale-[1.02] active:scale-[0.98] transition-transform"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-[0.04]"
                style={{
                  backgroundImage: `url('/random-images/honey-png-big.webp')`,
                  backgroundSize: '100%',
                  backgroundPosition: 'center',
                }}
              />
              <span className="text-white/35 font-medium relative z-10" style={{ fontFamily: 'Saira, sans-serif' }}>
                PHASE III (Locked)
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Animation keyframes for sliding particles */}
      <style>{`
        @keyframes slideParticles {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Technical Details - Collapsed */}
      <TechnicalDetails title="Technical Implementation Details">
        <div className="space-y-6">
          <StyleSection title="Glass Effect Values">
            <PropertyTable properties={[
              { name: 'Phase I (completed)', value: '12% to 6% opacity', css: 'rgba(255,255,255,0.12) to rgba(255,255,255,0.06)' },
              { name: 'Phase II (active)', value: '15% to 8% + border', css: 'rgba(255,255,255,0.15) to rgba(255,255,255,0.08)' },
              { name: 'Locked', value: '5% to 2% opacity', css: 'rgba(255,255,255,0.05) to rgba(255,255,255,0.02)' },
              { name: 'Backdrop Blur', value: '12px', css: 'backdrop-filter: blur(12px)' },
              { name: 'Border Radius', value: '8px', css: 'border-radius: 8px' },
              { name: 'Hover Scale', value: '1.02', css: 'transform: scale(1.02)' },
              { name: 'Active Scale', value: '0.98', css: 'transform: scale(0.98)' },
            ]} />
          </StyleSection>
        </div>
      </TechnicalDetails>
    </div>
  );
}

// ============================================================================
// TYPOGRAPHY STYLES
// ============================================================================
function TypographyStyles() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Typography</h2>

      {/* LIVE DEMOS AT TOP */}
      <div className="p-6 bg-black/30 rounded-xl border border-gray-600">
        <h3 className="text-lg font-semibold text-yellow-400 mb-6">Live Font Examples</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-black/50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Saira - Phase Labels</p>
            <p className="text-2xl text-white uppercase tracking-wider" style={{ fontFamily: 'Saira, sans-serif' }}>
              PHASE I
            </p>
          </div>

          <div className="p-4 bg-black/50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Play - Body Text</p>
            <p className="text-base text-white/75" style={{ fontFamily: 'Play, sans-serif' }}>
              Your commemorative NFT is ready to be claimed.
            </p>
          </div>

          <div className="p-4 bg-black/50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Inter - Buttons & UI</p>
            <p className="text-lg text-white font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
              Continue to Claim
            </p>
          </div>

          <div className="p-4 bg-black/50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Orbitron - Special Titles</p>
            <p className="text-xl text-yellow-400 font-bold uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              NFT CLAIMED!
            </p>
          </div>
        </div>

        {/* Complete badge example */}
        <div className="mt-6 p-4 bg-black/50 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Complete Badge with Glow</p>
          <span
            className="uppercase font-bold text-sm"
            style={{
              fontFamily: 'Play, sans-serif',
              color: '#00d4ff',
              textShadow: '0 0 10px rgba(0, 212, 255, 0.8)',
              letterSpacing: '2px',
            }}
          >
            COMPLETE
          </span>
        </div>
      </div>

      <TechnicalDetails title="Technical Implementation Details">
        <CodeBlock
          description="Google Fonts import"
          code={`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Play:wght@400;700&family=Saira:wght@400;700&family=Inter:wght@400;600;700&display=swap');`}
        />
      </TechnicalDetails>
    </div>
  );
}

// ============================================================================
// COLORS & GLOWS
// ============================================================================
function ColorStyles() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Colors & Glows</h2>

      {/* LIVE DEMOS AT TOP */}
      <div className="p-6 bg-black/30 rounded-xl border border-gray-600">
        <h3 className="text-lg font-semibold text-yellow-400 mb-6">Live Color Palette</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { name: 'Primary Yellow', nickname: 'Bumblebee', color: '#fab617', usage: 'Buttons, accents' },
            { name: 'Cyan', nickname: 'Cheeky Blue', color: '#22d3ee', usage: 'Success, verified, glows' },
            { name: 'Glass White', nickname: 'Ghost Glass', color: 'rgba(255,255,255,0.1)', usage: 'Glass effects, overlays' },
            { name: 'Deep Black', nickname: 'Void', color: '#0a0a0a', usage: 'Backgrounds, contrast' },
          ].map(c => (
            <div key={c.name} className="text-center">
              <div
                className="w-full h-16 rounded-lg mb-2 border border-white/20"
                style={{ background: c.color }}
              />
              <p className="text-sm font-medium text-white">{c.name}</p>
              <p className="text-xs text-cyan-400 italic mb-1">"{c.nickname}"</p>
              <p className="text-xs font-mono text-yellow-400/80 mb-1">{c.color}</p>
              <p className="text-xs text-gray-500">{c.usage}</p>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-semibold text-yellow-400 mb-4">Live Glow Examples</h3>
        <div className="space-y-4 bg-black rounded-lg p-6">
          <div>
            <span
              className="text-3xl font-bold"
              style={{
                color: '#22d3ee',
                textShadow: '0 0 20px rgba(34, 211, 238, 0.8), 0 0 40px rgba(34, 211, 238, 0.6), 0 0 60px rgba(34, 211, 238, 0.4)',
              }}
            >
              WrenCo
            </span>
            <p className="text-xs text-gray-500 mt-1">3-layer cyan glow (Corporation name)</p>
          </div>

          <div>
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
            <p className="text-xs text-gray-500 mt-1">Single layer blue glow</p>
          </div>

          <div>
            <span
              className="text-2xl font-bold text-white"
              style={{
                textShadow: '0 0 6px rgba(255,255,255,0.9), 0 0 12px rgba(255,255,255,0.6)',
              }}
            >
              Hover Text Glow
            </span>
            <p className="text-xs text-gray-500 mt-1">White text glow (button hover)</p>
          </div>
        </div>
      </div>

      <TechnicalDetails title="Technical Implementation Details">
        <StyleSection title="Glow CSS Values">
          <PropertyTable properties={[
            { name: 'Cyan 3-layer', value: 'Corporation name', css: 'text-shadow: 0 0 20px rgba(34,211,238,0.8), 0 0 40px rgba(34,211,238,0.6), 0 0 60px rgba(34,211,238,0.4)' },
            { name: 'Blue single', value: 'Complete badge', css: 'text-shadow: 0 0 10px rgba(0, 212, 255, 0.8)' },
            { name: 'White hover', value: 'Button text', css: 'text-shadow: 0 0 6px rgba(255,255,255,0.9), 0 0 12px rgba(255,255,255,0.6)' },
          ]} />
        </StyleSection>
      </TechnicalDetails>
    </div>
  );
}

// ============================================================================
// HOVER EFFECTS
// ============================================================================
function HoverEffectStyles() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Hover Effects</h2>

      {/* LIVE DEMOS AT TOP */}
      <div className="p-6 bg-black/30 rounded-xl border border-gray-600">
        <h3 className="text-lg font-semibold text-yellow-400 mb-4">Live Hover Demos (hover over these)</h3>

        <div className="space-y-4 max-w-md">
          {/* Phase Card with Honeycomb */}
          <button
            className="w-full px-6 py-4 rounded-lg text-center relative overflow-hidden group"
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
              Phase Card - Honeycomb on hover
            </span>
          </button>

          {/* Glass Button with Honeycomb + Text Glow */}
          <button
            className="px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] group relative overflow-hidden"
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
              Claim NFT - Honeycomb + text glow
            </span>
          </button>

          {/* Wallet Button Style */}
          <button
            className="w-full group relative bg-black/30 border border-cyan-500/30 text-white px-4 py-3 rounded-xl transition-all hover:bg-cyan-500/10 hover:border-cyan-500/50 flex items-center justify-center overflow-hidden"
          >
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-[0.15] z-[1]"
              style={{
                backgroundImage: `url('/random-images/honey-png-big.webp')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '12px'
              }}
            />
            <span className="font-medium relative z-[2]">Wallet Button - Cyan border hover</span>
          </button>
        </div>
      </div>

      <TechnicalDetails title="Technical Implementation Details">
        <StyleSection title="Honeycomb Pattern">
          <PropertyTable properties={[
            { name: 'Large Pattern', value: '/random-images/honey-png-big.webp', css: 'backgroundSize: 100%' },
            { name: 'Small Pattern', value: '/random-images/honey-png1.webp', css: 'backgroundSize: 125%' },
            { name: 'Card Opacity', value: '0 → 0.07', css: 'opacity: 0.07' },
            { name: 'Button Opacity', value: '0 → 1', css: 'opacity: 1' },
            { name: 'Transition', value: '300ms', css: 'transition-duration: 300ms' },
          ]} />
        </StyleSection>
      </TechnicalDetails>
    </div>
  );
}

// ============================================================================
// BUTTON STYLES
// ============================================================================
function ButtonStyles() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Button Styles</h2>

      {/* LIVE DEMOS AT TOP */}
      <div className="p-6 bg-black rounded-xl border border-gray-600">
        <h3 className="text-lg font-semibold text-yellow-400 mb-6">Live Button Demos</h3>

        <div className="space-y-8">
          {/* FillTextButton */}
          <div>
            <p className="text-sm text-gray-400 mb-3">FillTextButton - Blue line sweep animation (hover it)</p>
            <div className="flex justify-center py-4">
              <FillTextButton
                text="join beta"
                fontFamily="Play"
                onClick={() => console.log('Clicked!')}
              />
            </div>
          </div>

          {/* Primary Yellow */}
          <div>
            <p className="text-sm text-gray-400 mb-3">Primary Button (Yellow Gradient)</p>
            <button
              className="w-full max-w-md py-3 text-lg font-semibold tracking-wider text-black bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 shadow-lg shadow-yellow-500/20 active:scale-[0.98]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Continue
            </button>
          </div>

          {/* Secondary Cyan */}
          <div>
            <p className="text-sm text-gray-400 mb-3">Secondary Button (Cyan Gradient)</p>
            <button
              className="w-full max-w-md py-3 text-lg font-semibold tracking-wider text-black bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-xl hover:from-cyan-300 hover:to-cyan-400 transition-all duration-300 shadow-lg shadow-cyan-500/30 active:scale-[0.98]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Continue to Claim
            </button>
          </div>

          {/* Glass Button */}
          <div>
            <p className="text-sm text-gray-400 mb-3">Glass Button with Honeycomb Hover</p>
            <button
              className="px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] hover:border-white/50 hover:brightness-125 group relative overflow-hidden"
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

      <TechnicalDetails title="Technical Implementation Details">
        <StyleSection title="FillTextButton Props">
          <PropertyTable properties={[
            { name: 'Line Color', value: 'Cyan (#3DD1FF)', css: 'background-color: #3DD1FF' },
            { name: 'Line Width', value: '3px', css: 'width: 3px' },
            { name: 'Transition', value: '500ms cubic-bezier', css: 'transition: 500ms cubic-bezier(0.4, 0, 0.2, 1)' },
            { name: 'Text Transform', value: 'uppercase', css: 'text-transform: uppercase' },
            { name: 'Letter Spacing', value: '3px', css: 'letter-spacing: 3px' },
          ]} />
        </StyleSection>
      </TechnicalDetails>
    </div>
  );
}

// ============================================================================
// FOOTER STYLES
// ============================================================================
function FooterStyles() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Footer Styling</h2>

      {/* LIVE DEMO AT TOP */}
      <div className="relative p-8 rounded-xl overflow-hidden" style={{ minHeight: '200px' }}>
        {/* Background to show blur */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/random-images/planet1.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Footer demo */}
        <div
          className="absolute bottom-0 left-0 right-0 p-6"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            backgroundColor: 'rgba(255, 255, 255, 0.005)',
          }}
        >
          {/* Honeycomb SVG Pattern */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
            <defs>
              <pattern id="honeycomb-demo" width="28" height="49" patternUnits="userSpaceOnUse">
                <path d="M14 0 L21 4 L21 12 L14 16 L7 12 L7 4 Z" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5"/>
                <path d="M0 24.5 L7 28.5 L7 36.5 L0 40.5 L-7 36.5 L-7 28.5 Z" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5"/>
                <path d="M28 24.5 L35 28.5 L35 36.5 L28 40.5 L21 36.5 L21 28.5 Z" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#honeycomb-demo)" />
          </svg>

          <div className="relative z-10 flex items-center justify-center gap-6">
            {/* Social Icons Demo */}
            <a className="text-gray-400 hover:text-white transition-all hover:scale-110 cursor-pointer">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a>
            <a className="text-gray-400 hover:text-white transition-all hover:scale-110 cursor-pointer">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <span className="text-white/50 text-sm">Social icons with hover scale</span>
          </div>
        </div>
      </div>

      <TechnicalDetails title="Technical Implementation Details">
        <StyleSection title="Footer Properties">
          <PropertyTable properties={[
            { name: 'Backdrop Blur', value: '12px', css: 'backdrop-filter: blur(12px)' },
            { name: 'Background', value: '0.5% white', css: 'rgba(255, 255, 255, 0.005)' },
            { name: 'Pattern Stroke', value: '22% white', css: 'rgba(255,255,255,0.22)' },
            { name: 'Icon Hover Scale', value: '1.1', css: 'transform: scale(1.1)' },
          ]} />
        </StyleSection>
      </TechnicalDetails>
    </div>
  );
}

// ============================================================================
// ANIMATION STYLES
// ============================================================================
function AnimationStyles() {
  const [showFadeDemo, setShowFadeDemo] = useState(false);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Animations</h2>

      {/* LIVE DEMOS AT TOP */}
      <div className="p-6 bg-black/30 rounded-xl border border-gray-600">
        <h3 className="text-lg font-semibold text-yellow-400 mb-6">Live Animation Demos</h3>

        <div className="space-y-8">
          {/* Fade In Demo */}
          <div>
            <div className="flex items-center gap-4 mb-3">
              <p className="text-sm text-gray-400">Fade In with Slide Up</p>
              <button
                onClick={() => {
                  setShowFadeDemo(false);
                  setTimeout(() => setShowFadeDemo(true), 100);
                }}
                className="px-3 py-1 text-xs bg-yellow-500/20 border border-yellow-500 text-yellow-400 rounded hover:bg-yellow-500/30"
              >
                Replay
              </button>
            </div>
            <div
              className="p-4 bg-black/50 rounded-lg transition-all duration-[900ms] ease-out"
              style={{
                opacity: showFadeDemo ? 1 : 0,
                transform: `translateY(${showFadeDemo ? 0 : 20}px)`,
              }}
            >
              <span className="text-white">Content fades in and slides up</span>
            </div>
          </div>

          {/* Sliding Particles Demo */}
          <div>
            <p className="text-sm text-gray-400 mb-3">Sliding Particles (Phase II active state)</p>
            <div
              className="relative p-4 rounded-lg overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                  animation: 'slideParticles 3s linear infinite',
                }}
              />
              <span className="text-white relative z-10">Active phase with sliding light effect</span>
            </div>
          </div>

          {/* FillTextButton Animation */}
          <div>
            <p className="text-sm text-gray-400 mb-3">Line Sweep Animation (hover the button)</p>
            <div className="flex justify-center py-2">
              <FillTextButton
                text="hover me"
                fontFamily="Play"
                onClick={() => {}}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideParticles {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      <TechnicalDetails title="Technical Implementation Details">
        <StyleSection title="Animation Values">
          <PropertyTable properties={[
            { name: 'Fade In Duration', value: '900ms', css: 'transition-duration: 900ms' },
            { name: 'Fade In Easing', value: 'ease-out', css: 'transition-timing-function: ease-out' },
            { name: 'Slide Distance', value: '20px', css: 'translateY(20px)' },
            { name: 'Particles Duration', value: '3s', css: 'animation: 3s linear infinite' },
            { name: 'Line Sweep', value: '500ms cubic-bezier', css: 'transition: 500ms cubic-bezier(0.4, 0, 0.2, 1)' },
          ]} />
        </StyleSection>
      </TechnicalDetails>
    </div>
  );
}

// ============================================================================
// DEMO LIGHTBOXES
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
      <div
        className="fixed inset-0 bg-black/60"
        style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      />
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
        <div className="px-6 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-5">
          <div className="text-center">
            <div className="mb-6 sm:mb-8 pt-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-white tracking-wide mb-3">
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
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(lightboxContent, document.body);
}

function VerifiedLightbox({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

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
      <div
        className="fixed inset-0 bg-black/60"
        style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      />
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
        <div className="px-6 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-8">
          <div className="text-center">
            {/* Checkmark */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-cyan-500/20 border-2 border-cyan-400/50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-white/60 mb-2">Corporation Verified</p>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
              style={{
                fontFamily: "'Inter', 'Arial', sans-serif",
                color: '#22d3ee',
                textShadow: '0 0 20px rgba(34, 211, 238, 0.8), 0 0 40px rgba(34, 211, 238, 0.6), 0 0 60px rgba(34, 211, 238, 0.4)',
                letterSpacing: '-0.02em',
              }}
            >
              WrenCo
            </h2>
            <p className="text-sm text-white/60 mb-6">Your commemorative NFT is ready to be claimed.</p>
            <div className="space-y-3">
              <button
                className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold tracking-wider text-black bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-xl hover:from-cyan-300 hover:to-cyan-400 transition-all duration-300 shadow-lg shadow-cyan-500/30 active:scale-[0.98]"
                style={{ minHeight: '48px', fontFamily: "'Inter', 'Arial', sans-serif" }}
              >
                Continue to Claim
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 text-sm font-medium transition-all duration-200 hover:text-red-400"
                style={{ fontFamily: 'Inter, sans-serif', color: '#bae6fd' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(lightboxContent, document.body);
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================
function StyleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-gray-300 mb-2">{title}</h4>
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
      <p className="text-xs text-gray-500 mb-1">{description}</p>
      <div className="relative">
        <pre className="bg-black/50 border border-gray-700 rounded p-3 overflow-x-auto text-xs text-gray-400">
          <code>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-1 right-1 px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
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
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-800/50">
            <th className="text-left px-2 py-1 text-gray-500 font-medium border border-gray-700">Property</th>
            <th className="text-left px-2 py-1 text-gray-500 font-medium border border-gray-700">Value</th>
            <th className="text-left px-2 py-1 text-gray-500 font-medium border border-gray-700">CSS</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((prop, i) => (
            <tr key={i} className="hover:bg-gray-800/30">
              <td className="px-2 py-1 text-gray-300 border border-gray-700">{prop.name}</td>
              <td className="px-2 py-1 text-yellow-400/70 font-mono border border-gray-700">{prop.value}</td>
              <td className="px-2 py-1 text-gray-500 font-mono border border-gray-700">{prop.css}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
