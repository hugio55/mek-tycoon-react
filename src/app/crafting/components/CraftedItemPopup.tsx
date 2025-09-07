'use client';

import { CraftedItem } from '../types';
import { getVariationImagePath, getComponentIcon } from '../utils';

interface CraftedItemPopupProps {
  craftedItem: CraftedItem;
  onEquip: () => void;
  onContinue: () => void;
  onClose: () => void;
}

export default function CraftedItemPopup({ 
  craftedItem, 
  onEquip, 
  onContinue, 
  onClose 
}: CraftedItemPopupProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div 
        className="bg-gradient-to-b from-gray-900 to-gray-800 border-2 border-yellow-400 rounded-2xl p-8 max-w-md transform animate-popIn"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 0 50px rgba(255, 204, 0, 0.3)',
          animation: 'popIn 0.3s ease-out'
        }}
      >
        <h2 className="text-3xl font-bold text-yellow-400 text-center mb-6">🎉 Congratulations! 🎉</h2>
        <div className="text-center mb-6">
          <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-green-400 bg-gradient-to-br from-gray-700 to-gray-800"
            style={{
              boxShadow: '0 0 30px rgba(34, 197, 94, 0.6)'
            }}
          >
            <img 
              src={getVariationImagePath(craftedItem.name)}
              alt={craftedItem.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-5xl">${
                    getComponentIcon(craftedItem.type)
                  }</div>`;
                }
              }}
            />
          </div>
          <p className="text-xl text-white mb-2">You have crafted:</p>
          <p className="text-2xl font-bold text-green-400">{craftedItem.name}</p>
          <p className="text-sm text-gray-400 capitalize">{craftedItem.type.slice(0, -1)} Component</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onEquip}
            className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-black font-bold rounded-lg transition-all hover:scale-105"
          >
            EQUIP
          </button>
          <button
            onClick={onContinue}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
          >
            CONTINUE CRAFTING
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes popIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}