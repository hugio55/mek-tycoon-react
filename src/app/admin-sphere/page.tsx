'use client';

import BackgroundEffects from '@/components/BackgroundEffects';

export default function AdminSpherePage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundEffects />
      
      <div className="relative z-10 flex items-center justify-center p-4 min-h-screen">
        {/* Style M glass frame container */}
        <div 
          className="w-full max-w-7xl h-[90vh] rounded-lg overflow-hidden relative"
          style={{
            background: 'rgba(255, 255, 255, 0.01)',
            backdropFilter: 'blur(2px)',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.3) inset',
          }}
        >
          {/* Style M glass effects overlay */}
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
          
          {/* Noise texture overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E")`,
            }}
          />
          
          <iframe
            src="/games/sphere-selector/index-multi.html"
            className="w-full h-full border-0 relative z-10"
            title="Sphere Selector Game - Multi Layout"
          />
        </div>
      </div>
    </div>
  );
}