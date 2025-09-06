import React from 'react';
import { Achievement, TIER_ACCENTS, REWARD_COLORS } from '@/types/achievements';
import { calculateProgressPercentage, formatDate } from '@/utils/achievements.utils';

interface AchievementItemProps {
  achievement: Achievement;
  index: number;
  totalItems: number;
  isExpanded: boolean;
  isHovered: boolean;
  onToggle: () => void;
  onHover: (id: string | null) => void;
}

export const AchievementItem: React.FC<AchievementItemProps> = ({
  achievement,
  index,
  totalItems,
  isExpanded,
  isHovered,
  onToggle,
  onHover
}) => {
  const progressPercent = calculateProgressPercentage(achievement.progress, achievement.maxProgress);
  
  const renderProgressDots = () => {
    if (achievement.maxProgress <= 1) {
      return achievement.unlocked && <span className="text-green-400">✓</span>;
    }
    
    const dotsCount = Math.min(5, achievement.maxProgress);
    return (
      <div className="flex gap-1">
        {[...Array(dotsCount)].map((_, i) => {
          const segmentSize = achievement.maxProgress / dotsCount;
          const filled = achievement.progress >= (i + 1) * segmentSize;
          const partial = achievement.progress > i * segmentSize && achievement.progress < (i + 1) * segmentSize;
          return (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                filled 
                  ? "bg-yellow-400 shadow-[0_0_4px_rgba(250,182,23,0.5)]" 
                  : partial
                  ? "bg-yellow-400/40"
                  : "bg-gray-700/50 border border-gray-600/30"
              }`}
            />
          );
        })}
      </div>
    );
  };

  const renderRewards = () => {
    const rewards = achievement.rewards || [];
    if (rewards.length === 0) return null;
    
    return (
      <div style={{ width: '33.333%' }}>
        <div className="text-xs text-gray-500 mb-1">Rewards</div>
        {rewards.map((reward, idx) => (
          <div key={idx} className={`flex items-center gap-2 py-1 ${idx > 0 ? 'border-t border-gray-800/50' : ''}`}>
            <div className={`w-3 h-3 rounded-sm ${REWARD_COLORS[reward.type]}`}></div>
            <span className="text-xs text-yellow-400">
              {reward.amount && reward.amount > 0 ? `+${reward.amount.toLocaleString()}` : ''}
              {reward.name || reward.type}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => onHover(achievement.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Vertical Line (except for last item) */}
      {index < totalItems - 1 && (
        <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-700/30" />
      )}
      
      <div className="relative">
        <div 
          className={`relative flex items-center gap-2 py-1 px-2 rounded-lg transition-all cursor-pointer ${
            isHovered ? "bg-gray-800/40" : ""
          } ${isExpanded ? "bg-yellow-400/10 border border-yellow-400/20" : ""}`}
          onClick={onToggle}
        >
          {/* Tier Dot */}
          <div className={`w-6 h-6 rounded-full border-2 ${
            achievement.unlocked 
              ? `${TIER_ACCENTS[achievement.tier]} border-gray-900`
              : "bg-gray-700 border-gray-800"
          } shadow-lg z-10`} />

          {/* Right Column Description Display */}
          <div className="flex-1 relative overflow-visible">
            <div className="grid grid-cols-2 gap-2">
              <div className={`font-medium text-sm ${
                achievement.unlocked ? "text-yellow-400" : "text-white"
              }`}>
                {achievement.name}
              </div>
              <div className="text-xs text-gray-500 text-right">
                {achievement.description}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-1 min-w-[60px] justify-end">
            {renderProgressDots()}
          </div>

          {/* Points */}
          <div className={`text-sm font-bold min-w-[50px] text-right ${
            achievement.unlocked ? "text-yellow-400" : "text-gray-600"
          }`}>
            {achievement.points}pts
          </div>

          {/* Expand/Collapse Indicator */}
          <div className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="ml-9 mt-3">
            <div className="p-3 rounded-lg bg-gradient-to-r from-gray-900/40 to-black/40 border-l-2 border-yellow-400/30">
              <div className="flex gap-4">
                {/* Left: Progress (2/3 width) */}
                <div style={{ width: '66.666%' }}>
                  <p className="text-xs text-gray-300 mb-3">{achievement.description}</p>
                  {achievement.maxProgress > 1 && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span className="text-yellow-400">{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${achievement.unlocked ? "bg-green-400" : "bg-yellow-400"}`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{Math.round(progressPercent)}% Complete</div>
                    </div>
                  )}
                  
                  {/* Date */}
                  {achievement.unlocked && achievement.unlockedAt && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs font-bold text-green-400">COLLECTED</span>
                      <span className="text-sm font-medium text-gray-300">
                        {formatDate(achievement.unlockedAt)}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Right: Rewards */}
                {renderRewards()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};