"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BackgroundEffects from "@/components/BackgroundEffects";
import MiniSkillTree from "@/components/MiniSkillTree";
import SkillTreeModal from "@/components/SkillTreeModal";

type Mek = {
  id: string;
  name: string;
  level: number;
  currentXP: number;
  xpToNext: number;
  maxXP: number;
  status: string;
  goldRate: number;
};

type UndoState = {
  pooledXP: number;
  mek: Mek;
};

export default function XPAllocationPage() {
  const [pooledXP, setPooledXP] = useState(15000);
  const [selectedMekId, setSelectedMekId] = useState<string | null>(null);
  const [mekUndoStacks, setMekUndoStacks] = useState<Record<string, UndoState[]>>({});
  const [showLevelUpModal, setShowLevelUpModal] = useState<{ mek: Mek; newLevel: number } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<{ message: string; onConfirm: () => void; onCancel?: () => void } | null>(null);
  const [showSkillTreeModal, setShowSkillTreeModal] = useState<{ mek: Mek } | null>(null);
  
  const [meks, setMeks] = useState<Mek[]>([
    {
      id: '7890',
      name: 'Mek #7890',
      level: 10,
      currentXP: 45000,
      xpToNext: 0,
      maxXP: 45000,
      status: 'Max Level',
      goldRate: 25.0
    },
    {
      id: '3456',
      name: 'Mek #3456',
      level: 7,
      currentXP: 14500,
      xpToNext: 7500,
      maxXP: 22000,
      status: 'Active',
      goldRate: 18.2
    },
    {
      id: '1234',
      name: 'Mek #1234',
      level: 5,
      currentXP: 6200,
      xpToNext: 3800,
      maxXP: 10000,
      status: 'Active',
      goldRate: 15.5
    },
    {
      id: '5678',
      name: 'Mek #5678',
      level: 3,
      currentXP: 2400,
      xpToNext: 1600,
      maxXP: 4000,
      status: 'Active',
      goldRate: 10.0
    },
    {
      id: '9012',
      name: 'Mek #9012',
      level: 2,
      currentXP: 1200,
      xpToNext: 1800,
      maxXP: 3000,
      status: 'Active',
      goldRate: 6.5
    }
  ]);

  const calculateMaxXP = (level: number) => level * level * 1000;

  const saveStateForMek = (mekId: string) => {
    const mek = meks.find(m => m.id === mekId);
    if (!mek) return;
    
    const state: UndoState = {
      pooledXP: pooledXP,
      mek: JSON.parse(JSON.stringify(mek))
    };
    
    setMekUndoStacks(prev => {
      const stacks = { ...prev };
      if (!stacks[mekId]) stacks[mekId] = [];
      stacks[mekId].push(state);
      if (stacks[mekId].length > 50) stacks[mekId].shift();
      return stacks;
    });
  };

  const undoLastActionForMek = (mekId: string) => {
    const stacks = mekUndoStacks[mekId];
    if (!stacks || stacks.length === 0) return;
    
    const previousState = stacks[stacks.length - 1];
    setPooledXP(previousState.pooledXP);
    
    setMeks(prevMeks => prevMeks.map(m => 
      m.id === mekId ? previousState.mek : m
    ));
    
    setMekUndoStacks(prev => {
      const newStacks = { ...prev };
      newStacks[mekId] = newStacks[mekId].slice(0, -1);
      return newStacks;
    });
  };

  const hasUnsavedChanges = (mekId: string) => {
    return mekUndoStacks[mekId] && mekUndoStacks[mekId].length > 0;
  };

  const allocateXP = (mekId: string, amount: number) => {
    if (pooledXP < amount) return;
    
    const mek = meks.find(m => m.id === mekId);
    if (!mek || mek.level >= 10) return;
    
    if (amount <= 100) {
      saveStateForMek(mekId);
    }
    
    let newPooledXP = pooledXP - amount;
    let updatedMek = { ...mek };
    updatedMek.currentXP += amount;
    
    const initialLevel = updatedMek.level;
    
    while (updatedMek.currentXP >= updatedMek.maxXP && updatedMek.level < 10) {
      const overflow = updatedMek.currentXP - updatedMek.maxXP;
      updatedMek.level++;
      updatedMek.currentXP = overflow;
      updatedMek.maxXP = calculateMaxXP(updatedMek.level);
      updatedMek.xpToNext = updatedMek.maxXP - updatedMek.currentXP;
      updatedMek.goldRate += 2.0;
      
      if (updatedMek.level >= 10) {
        updatedMek.status = 'Max Level';
        updatedMek.xpToNext = 0;
      }
    }
    
    if (updatedMek.level < 10) {
      updatedMek.xpToNext = updatedMek.maxXP - updatedMek.currentXP;
    }
    
    setPooledXP(newPooledXP);
    setMeks(prevMeks => prevMeks.map(m => 
      m.id === mekId ? updatedMek : m
    ));
    
    if (updatedMek.level > initialLevel) {
      setShowLevelUpModal({ mek: updatedMek, newLevel: updatedMek.level });
    }
  };

  const allocateToNextLevel = (mekId: string) => {
    const mek = meks.find(m => m.id === mekId);
    if (!mek || mek.level >= 10) return;
    
    saveStateForMek(mekId);
    allocateXP(mekId, mek.xpToNext);
  };

  const allocateAll = (mekId: string) => {
    const mek = meks.find(m => m.id === mekId);
    if (!mek) return;
    
    saveStateForMek(mekId);
    allocateXP(mekId, pooledXP);
  };

  const selectMek = (mekId: string) => {
    if (selectedMekId && selectedMekId !== mekId && hasUnsavedChanges(selectedMekId)) {
      const currentMek = meks.find(m => m.id === selectedMekId);
      setShowConfirmModal({
        message: `Would you like to save changes to ${currentMek?.name}?`,
        onConfirm: () => {
          setMekUndoStacks(prev => ({ ...prev, [selectedMekId]: [] }));
          setSelectedMekId(selectedMekId === mekId ? null : mekId);
          setShowConfirmModal(null);
        },
        onCancel: () => {
          setShowConfirmModal(null);
        }
      });
      return;
    }
    
    setSelectedMekId(selectedMekId === mekId ? null : mekId);
  };

  const goBack = () => {
    let hasAnyUnsavedChanges = false;
    let mekWithChanges: Mek | undefined;
    
    for (const mekId in mekUndoStacks) {
      if (hasUnsavedChanges(mekId)) {
        hasAnyUnsavedChanges = true;
        mekWithChanges = meks.find(m => m.id === mekId);
        break;
      }
    }
    
    if (hasAnyUnsavedChanges && mekWithChanges) {
      setShowConfirmModal({
        message: `Would you like to save changes to ${mekWithChanges.name}?`,
        onConfirm: () => {
          window.location.href = '/hub';
        }
      });
    } else {
      window.location.href = '/hub';
    }
  };

  return (
    <div className="min-h-screen p-5 relative text-white">
      <BackgroundEffects />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Streamlined Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-yellow-400">📈 XP Allocation</h1>
          <div className="text-right">
            <div className="text-3xl font-bold text-yellow-400">
              {pooledXP.toLocaleString()} XP
            </div>
            <div className="text-xs text-gray-400">Available Points</div>
          </div>
        </div>

        {/* Mek Grid - More Compact */}
        <div className={`grid ${selectedMekId ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'} gap-3 mb-6`}>
          {meks.map(mek => {
            const isSelected = selectedMekId === mek.id;
            const isMaxLevel = mek.level >= 10;
            const xpPercent = (mek.currentXP / mek.maxXP) * 100;
            const hasUndo = mekUndoStacks[mek.id] && mekUndoStacks[mek.id].length > 0;

            return (
              <div
                key={mek.id}
                onClick={() => selectMek(mek.id)}
                className={`
                  bg-gray-800/50 border rounded-lg p-3 cursor-pointer transition-all backdrop-blur-sm
                  ${isSelected ? 'border-yellow-400 shadow-xl col-span-full' : 'border-gray-700 hover:border-yellow-400/50'}
                `}
              >
                {isSelected ? (
                  // Expanded View - More Condensed
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left Side - Mek Info & Controls */}
                    <div>
                      <div className="flex gap-3 mb-3">
                        <div className="w-20 h-20 bg-gray-900 rounded-lg flex items-center justify-center">
                          <span className="text-gray-600 text-xs">IMAGE</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-yellow-400">{mek.name}</h3>
                          <div className="text-sm text-gray-300">
                            Level {mek.level} {isMaxLevel && <span className="text-yellow-500">(MAX)</span>}
                          </div>
                          <div className="text-sm text-green-400">{mek.goldRate}/hr gold</div>
                        </div>
                      </div>

                      {/* XP Bar */}
                      <div className="mb-3">
                        <div className="relative h-3 bg-gray-900 rounded-full overflow-hidden">
                          <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-500 to-yellow-400"
                            style={{ width: `${xpPercent}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-400 mt-1 text-center">
                          {mek.currentXP.toLocaleString()} / {mek.maxXP.toLocaleString()} XP
                        </div>
                      </div>

                      {!isMaxLevel && (
                        <>
                          {/* Quick Allocate Buttons */}
                          <div className="grid grid-cols-4 gap-2 mb-3">
                            {[1, 10, 100, 1000].map(amount => (
                              <button
                                key={amount}
                                onClick={(e) => { e.stopPropagation(); allocateXP(mek.id, amount); }}
                                disabled={pooledXP < amount}
                                className="px-2 py-1.5 bg-yellow-500 text-black font-bold rounded text-sm hover:bg-yellow-400 transition-colors disabled:bg-gray-700 disabled:text-gray-500"
                              >
                                +{amount}
                              </button>
                            ))}
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); allocateToNextLevel(mek.id); }}
                              disabled={pooledXP < mek.xpToNext}
                              className="px-2 py-1.5 bg-green-600 text-white font-bold rounded text-sm hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500"
                            >
                              Next Lvl
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); allocateAll(mek.id); }}
                              disabled={pooledXP < 1}
                              className="px-2 py-1.5 bg-yellow-600 text-white font-bold rounded text-sm hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500"
                            >
                              Use All
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); undoLastActionForMek(mek.id); }}
                              disabled={!hasUndo}
                              className="px-2 py-1.5 bg-gray-600 text-white font-bold rounded text-sm hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500"
                            >
                              Undo
                            </button>
                          </div>
                        </>
                      )}

                      {isMaxLevel && (
                        <div className="text-center py-3 bg-gray-900/50 rounded">
                          <div className="text-lg text-yellow-400 font-bold">🏆 MAX LEVEL</div>
                        </div>
                      )}
                    </div>

                    {/* Right Side - Mini Skill Tree */}
                    <MiniSkillTree 
                      currentLevel={mek.level} 
                      onClick={() => setShowSkillTreeModal({ mek })}
                    />
                  </div>
                ) : (
                  // Compact View - Larger Thumbnails
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <span className="text-gray-600 text-xs">IMAGE</span>
                    </div>
                    <div className="text-yellow-400 font-bold text-base">Lv.{mek.level}</div>
                    <div className="text-gray-400 text-sm">{mek.name.replace('Mek ', '')}</div>
                    {!isMaxLevel && (
                      <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden mt-2">
                        <div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-500 to-yellow-400"
                          style={{ width: `${xpPercent}%` }}
                        />
                      </div>
                    )}
                    {isMaxLevel && <div className="text-xs text-yellow-500 mt-2">MAX LEVEL</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Back Button */}
        <button
          onClick={goBack}
          className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-yellow-400 rounded border border-gray-700 hover:border-yellow-500 transition-all"
        >
          ← Back to Hub
        </button>
      </div>

      {/* Level Up Modal - Simplified */}
      {showLevelUpModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border-2 border-yellow-400 rounded-lg p-6 max-w-sm w-full">
            <div className="text-2xl font-bold text-yellow-400 text-center mb-3">LEVEL UP!</div>
            <div className="text-center mb-4">
              <div className="text-white mb-2">{showLevelUpModal.mek.name}</div>
              <div className="text-3xl font-bold text-yellow-400">Level {showLevelUpModal.newLevel}</div>
            </div>
            
            <div className="bg-gray-800 rounded p-3 mb-4">
              <div className="text-sm text-gray-400">
                New skills unlocked! Check the skill tree to see your available paths.
              </div>
            </div>
            
            <button
              onClick={() => setShowLevelUpModal(null)}
              className="w-full px-4 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal - Simplified */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-yellow-400 rounded-lg p-5 max-w-sm w-full">
            <div className="text-lg font-bold text-yellow-400 mb-3">Save Changes</div>
            <div className="text-sm text-gray-300 mb-4">{showConfirmModal.message}</div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (showConfirmModal.onCancel) showConfirmModal.onCancel();
                  setShowConfirmModal(null);
                }}
                className="flex-1 px-3 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={showConfirmModal.onConfirm}
                className="flex-1 px-3 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skill Tree Modal */}
      {showSkillTreeModal && (
        <SkillTreeModal
          isOpen={true}
          onClose={() => setShowSkillTreeModal(null)}
          currentLevel={showSkillTreeModal.mek.level}
          mekName={showSkillTreeModal.mek.name}
        />
      )}
    </div>
  );
}