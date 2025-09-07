'use client';

import { RARITY_BIAS_DATA } from '../constants';

export default function RarityBiasChart() {
  return (
    <div 
      className="p-6 rounded-lg mb-6"
      style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.6) 0%, rgba(42, 42, 42, 0.6) 100%)',
        border: '2px solid #8b5cf6',
        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="text-left flex-1">
          <p className="text-xs text-gray-400 mb-1">This chart represents your chances to craft at different qualities</p>
          <div className="text-md text-purple-400">Your Rarity Bias Rating</div>
        </div>
        <div 
          className="text-4xl font-thin"
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6347 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
            fontFamily: 'Rajdhani, sans-serif',
            letterSpacing: '0.05em',
            fontWeight: '200',
          }}
        >
          245
        </div>
      </div>
      
      {/* Bar chart with percentages */}
      <div className="flex items-end justify-center h-64 mb-8 px-4">
        {RARITY_BIAS_DATA.map((item) => {
          const maxHeight = 234;
          const height = Math.max(5, (item.height / 100) * maxHeight);
          
          return (
            <div
              key={item.rank}
              className="flex-1 mx-1 relative group transition-all duration-200 hover:brightness-125"
              style={{
                height: `${height}px`,
                background: `linear-gradient(to top, ${item.color}88, ${item.color})`,
                borderRadius: '4px 4px 0 0',
                boxShadow: item.active ? `0 0 20px ${item.color}` : `0 0 8px ${item.color}55`
              }}
            >
              <div 
                className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs bg-black/70 px-1 rounded whitespace-nowrap"
                style={{ color: item.color }}
              >
                {item.percent}%
              </div>
              <div 
                className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 font-bold text-sm"
                style={{ color: item.color }}
              >
                {item.rank}
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-300">You are most likely to craft an item in the <span className="text-yellow-400 font-bold">A quality tier</span></p>
      </div>
    </div>
  );
}