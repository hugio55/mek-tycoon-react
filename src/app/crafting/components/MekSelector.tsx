'use client';

import { CraftedItem, UserMek } from '../types';
import { USER_MEKS } from '../constants';

interface MekSelectorProps {
  craftedItem: CraftedItem;
  onSelectMek: (mekId: string) => void;
  onClose: () => void;
}

export default function MekSelector({ craftedItem, onSelectMek, onClose }: MekSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-yellow-400">Select a Mek to Equip {craftedItem.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {USER_MEKS.map(mek => {
              const slotAvailable = 
                (craftedItem.type === 'heads' && !mek.headFilled) ||
                (craftedItem.type === 'bodies' && !mek.bodyFilled) ||
                (craftedItem.type === 'traits' && !mek.traitFilled);
              
              return (
                <div
                  key={mek.id}
                  className="relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl border-2 border-gray-600 overflow-hidden transition-all hover:border-yellow-400"
                  style={{
                    opacity: slotAvailable ? 1 : 0.7
                  }}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-white">{mek.name}</h3>
                      <div className="text-xs text-gray-400">ID: {mek.id}</div>
                    </div>
                    
                    {/* Mek Image Placeholder */}
                    <div className="w-full h-48 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-6xl">🤖</span>
                    </div>
                    
                    {/* Equipment Slots */}
                    <div className="flex justify-around mb-4">
                      <div className="text-center">
                        <div className={`w-12 h-12 rounded-full border-2 ${mek.headFilled ? 'border-gray-600 bg-gray-700' : 'border-green-400'} flex items-center justify-center`}>
                          {mek.headFilled ? '📷' : '➕'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Head</div>
                      </div>
                      <div className="text-center">
                        <div className={`w-12 h-12 rounded-full border-2 ${mek.bodyFilled ? 'border-gray-600 bg-gray-700' : 'border-green-400'} flex items-center justify-center`}>
                          {mek.bodyFilled ? '🤖' : '➕'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Body</div>
                      </div>
                      <div className="text-center">
                        <div className={`w-12 h-12 rounded-full border-2 ${mek.traitFilled ? 'border-gray-600 bg-gray-700' : 'border-green-400'} flex items-center justify-center`}>
                          {mek.traitFilled ? '⚡' : '➕'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Trait</div>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    {slotAvailable ? (
                      <button
                        onClick={() => onSelectMek(mek.id)}
                        className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-black font-bold rounded-lg transition-all hover:scale-105"
                      >
                        SELECT
                      </button>
                    ) : (
                      <div className="w-full px-4 py-3 bg-gray-700 text-gray-400 text-center rounded-lg">
                        {craftedItem.type.slice(0, -1)} Slot Filled
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}