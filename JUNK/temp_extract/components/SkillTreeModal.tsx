"use client";

import React from "react";
import SkillTree from "./SkillTree";

type SkillTreeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
  mekName?: string;
};

export default function SkillTreeModal({ isOpen, onClose, currentLevel, mekName }: SkillTreeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border-2 border-yellow-400 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-yellow-400">Skill Tree</h2>
            {mekName && <div className="text-sm text-gray-400">{mekName}</div>}
          </div>
          <button
            onClick={onClose}
            className="text-3xl text-gray-400 hover:text-yellow-400 transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          <SkillTree currentLevel={currentLevel} />
          
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-red-400 mb-2">⚔️ Combat Path</h3>
              <p className="text-sm text-gray-400">
                Focus on attack and defense bonuses. Unlock powerful combat abilities and become a formidable warrior.
              </p>
              <div className="mt-2 text-xs text-gray-500">
                • Increased damage output<br/>
                • Better defense stats<br/>
                • Special combat moves
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-yellow-400 mb-2">💰 Economy Path</h3>
              <p className="text-sm text-gray-400">
                Maximize gold generation and trading benefits. Become a master of the marketplace.
              </p>
              <div className="mt-2 text-xs text-gray-500">
                • Higher gold income<br/>
                • Reduced fees<br/>
                • Better investment returns
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-blue-400 mb-2">⚡ Technology Path</h3>
              <p className="text-sm text-gray-400">
                Enhance crafting abilities and unlock advanced tech. Master the art of creation.
              </p>
              <div className="mt-2 text-xs text-gray-500">
                • More crafting slots<br/>
                • Faster crafting times<br/>
                • Higher success rates
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}