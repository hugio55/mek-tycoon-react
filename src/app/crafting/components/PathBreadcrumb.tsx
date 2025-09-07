'use client';

import { ComponentType, Category } from '../types';

interface PathBreadcrumbProps {
  selectedType: ComponentType | null;
  selectedVariation: string | null;
  selectedStyle: string | null;
  currentCategory: Category;
  onNavigate: (category: Category) => void;
  onReset: () => void;
}

export default function PathBreadcrumb({
  selectedType,
  selectedVariation,
  selectedStyle,
  currentCategory,
  onNavigate,
  onReset
}: PathBreadcrumbProps) {
  const getTitle = () => {
    switch (currentCategory) {
      case 'group':
        return `SELECT ${selectedType?.toUpperCase()} VARIATION`;
      case 'style':
        return 'STYLE SELECTION';
      case 'variation':
        return 'FINAL CONFIGURATION';
      default:
        return '';
    }
  };

  return (
    <div className="text-center mb-8">
      <h3 className="text-2xl font-bold uppercase mb-2" style={{
        fontFamily: "'Orbitron', 'Rajdhani', 'Bebas Neue', sans-serif",
        fontSize: '28px',
        fontWeight: 900,
        color: '#fab617',
        letterSpacing: '0.15em',
        textShadow: '0 0 20px rgba(250, 182, 23, 0.4)'
      }}>
        {getTitle()}
      </h3>
      <div className="inline-block mx-auto mt-3 px-6 py-3 rounded-lg" style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(18, 18, 18, 0.9) 100%)',
        border: '2px solid rgba(255, 204, 0, 0.2)',
        boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5), 0 4px 20px rgba(255, 204, 0, 0.1)',
      }}>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono uppercase tracking-wider text-gray-500">Path:</span>
          <div className="flex items-center gap-2">
            {/* Component Type */}
            <button 
              onClick={onReset}
              className="px-3 py-1 rounded bg-gray-800/50 border border-gray-700 hover:border-yellow-400 transition-all cursor-pointer" 
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '14px',
                fontWeight: 'bold',
                color: currentCategory === 'group' ? '#fab617' : 
                       currentCategory === 'style' ? 'rgba(250, 182, 23, 0.7)' :
                       'rgba(250, 182, 23, 0.6)',
                textShadow: currentCategory === 'group' ? '0 0 10px rgba(250, 182, 23, 0.3)' :
                           currentCategory === 'style' ? '0 0 8px rgba(250, 182, 23, 0.2)' :
                           '0 0 6px rgba(250, 182, 23, 0.15)'
              }}
            >
              {selectedType?.toUpperCase() || '?'}
            </button>
            
            <span className="text-gray-600 text-xl">→</span>
            
            {/* Variation */}
            {selectedVariation ? (
              <button 
                onClick={() => onNavigate('group')}
                className="px-3 py-1 rounded bg-yellow-400/20 border border-yellow-400/50 hover:border-yellow-400 transition-all cursor-pointer" 
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#fab617',
                  textShadow: '0 0 10px rgba(250, 182, 23, 0.3)'
                }}
              >
                {selectedVariation}
              </button>
            ) : (
              <span className="px-3 py-1 rounded bg-gray-800/30 border border-gray-700/50" style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'rgba(250, 182, 23, 0.5)'
              }}>?</span>
            )}
            
            <span className="text-gray-600 text-xl">→</span>
            
            {/* Style */}
            {selectedStyle ? (
              <button 
                onClick={() => onNavigate('style')}
                className="px-3 py-1 rounded bg-yellow-400/15 border border-yellow-400/40 hover:border-yellow-400 transition-all cursor-pointer" 
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: 'rgba(250, 182, 23, 0.8)',
                  textShadow: '0 0 8px rgba(250, 182, 23, 0.2)'
                }}
              >
                {selectedStyle}
              </button>
            ) : (
              <span className={`px-3 py-1 rounded bg-gray-800/30 border border-gray-700/50 ${currentCategory === 'style' ? '' : currentCategory === 'variation' ? 'animate-pulse' : ''}`} style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '14px',
                fontWeight: 'bold',
                color: currentCategory === 'variation' ? '#fab617' : 'rgba(250, 182, 23, 0.3)',
                textShadow: currentCategory === 'variation' ? '0 0 10px rgba(250, 182, 23, 0.3)' : 'none'
              }}>?</span>
            )}
            
            {/* Final variation placeholder for style view */}
            {currentCategory === 'style' && (
              <>
                <span className="text-gray-600 text-xl">→</span>
                <span className="px-3 py-1 rounded bg-gray-800/20 border border-gray-700/30" style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: 'rgba(250, 182, 23, 0.3)'
                }}>?</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}