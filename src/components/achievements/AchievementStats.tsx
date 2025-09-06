import React from 'react';
import { AchievementStats } from '@/types/achievements';

interface AchievementStatsDisplayProps {
  stats: AchievementStats;
}

export const AchievementStatsDisplay: React.FC<AchievementStatsDisplayProps> = ({ stats }) => {
  const { totalPoints, totalPossiblePoints, unlockedCount, totalCount, completionPercentage } = stats;

  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-800/50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {/* Center - Total Points with Style B Font and Glow */}
        <div className="text-center md:order-2">
          <div 
            className="text-yellow-400 relative inline-block"
            style={{ 
              fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
              fontSize: '48px',
              fontWeight: 200,
              letterSpacing: '1px',
              lineHeight: '1',
              fontVariantNumeric: 'tabular-nums',
              textShadow: '0 0 20px rgba(250, 182, 23, 0.5), 0 0 40px rgba(250, 182, 23, 0.3)',
            }}
          >
            {totalPoints.toLocaleString()}
          </div>
          <div className="text-base text-white mt-2 font-medium">Achievement Points</div>
          <div className="text-xs text-gray-500 mt-1">of {totalPossiblePoints.toLocaleString()} possible</div>
        </div>
        
        {/* Left - Unlocked (25% smaller) */}
        <div className="text-center md:order-1">
          <div 
            className="text-green-400"
            style={{ 
              fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
              fontSize: '36px',
              fontWeight: 200,
              letterSpacing: '1px',
              lineHeight: '1',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {unlockedCount}
          </div>
          <div className="text-sm text-gray-400 mt-2">Unlocked</div>
          <div className="text-xs text-gray-500 mt-1">of {totalCount} achievements</div>
        </div>
        
        {/* Right - Completion (25% smaller) */}
        <div className="text-center md:order-3">
          <div 
            className="text-blue-400"
            style={{ 
              fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
              fontSize: '36px',
              fontWeight: 200,
              letterSpacing: '1px',
              lineHeight: '1',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {completionPercentage}%
          </div>
          <div className="text-sm text-gray-400 mt-2">Completion</div>
          <div className="text-xs text-gray-500 mt-1">Keep going!</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};