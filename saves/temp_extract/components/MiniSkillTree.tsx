"use client";

import React from "react";

type MiniSkillTreeProps = {
  currentLevel: number;
  onClick: () => void;
};

export default function MiniSkillTree({ currentLevel, onClick }: MiniSkillTreeProps) {
  // Simplified representation - 3 paths with dots
  const paths = [
    { name: "Combat", color: "bg-red-500", levels: [2, 3, 5, 7, 10] },
    { name: "Economy", color: "bg-yellow-500", levels: [2, 3, 4, 6, 9, 10] },
    { name: "Technology", color: "bg-blue-500", levels: [2, 3, 5, 6, 10] },
  ];

  return (
    <div 
      className="bg-gray-900/50 rounded-lg p-3 cursor-pointer hover:bg-gray-800/50 transition-all"
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs font-bold text-yellow-400">Skill Progress</h4>
        <span className="text-[10px] text-gray-500">Click to expand</span>
      </div>
      
      <div className="space-y-2">
        {paths.map((path) => (
          <div key={path.name} className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 w-12">{path.name}:</span>
            <div className="flex gap-1 flex-1">
              {path.levels.map((level) => (
                <div
                  key={level}
                  className={`w-2 h-2 rounded-full ${
                    level <= currentLevel
                      ? path.color
                      : "bg-gray-700 border border-gray-600"
                  }`}
                  title={`Level ${level}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-2">
        <div className="text-xs text-gray-400">
          Level {currentLevel}/10
        </div>
        <div className="w-full h-1 bg-gray-700 rounded-full mt-1">
          <div 
            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full"
            style={{ width: `${(currentLevel / 10) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}