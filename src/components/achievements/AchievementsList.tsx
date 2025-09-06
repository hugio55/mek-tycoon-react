import React, { useState } from 'react';
import { Achievement } from '@/types/achievements';
import { AchievementItem } from './AchievementItem';

interface AchievementsListProps {
  achievements: Achievement[];
}

export const AchievementsList: React.FC<AchievementsListProps> = ({ achievements }) => {
  const [hoveredAchievement, setHoveredAchievement] = useState<string | null>(null);
  const [expandedAchievement, setExpandedAchievement] = useState<string | null>(null);

  const toggleAchievement = (id: string) => {
    setExpandedAchievement(expandedAchievement === id ? null : id);
  };

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 max-h-[600px] overflow-y-auto custom-scrollbar">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(250, 182, 23, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(250, 182, 23, 0.5);
        }
      `}</style>
      
      {achievements.map((achievement, index) => (
        <AchievementItem
          key={achievement.id}
          achievement={achievement}
          index={index}
          totalItems={achievements.length}
          isExpanded={expandedAchievement === achievement.id}
          isHovered={hoveredAchievement === achievement.id}
          onToggle={() => toggleAchievement(achievement.id)}
          onHover={setHoveredAchievement}
        />
      ))}

      {/* Empty State */}
      {achievements.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-400">No achievements found</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
};