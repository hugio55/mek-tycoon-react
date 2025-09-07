import React from 'react';
import Image from 'next/image';

export const getMekCardStyle = (styleNum: number, hasMatch: boolean, matchedTraits: any[]) => {
  const baseClass = "border-2 rounded-lg p-2 transition-all";
  const hasMatchedTrait = matchedTraits.length > 0;
  const highlightedGlow = hasMatchedTrait ? "shadow-[0_0_20px_rgba(250,182,23,0.4)]" : "";

  switch(styleNum) {
    case 1: // Classic border
      return `${baseClass} ${hasMatchedTrait ? 'border-yellow-400 bg-yellow-900/10' : 'border-gray-600 bg-gray-900/50'}`;
    case 2: // Gradient border
      return `${baseClass} ${hasMatchedTrait ? 'bg-gradient-to-br from-yellow-400/20 to-transparent border-yellow-400' : 'bg-gradient-to-br from-gray-700/20 to-transparent border-gray-600'}`;
    case 3: // Glow effect
      return `${baseClass} ${hasMatchedTrait ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,182,23,0.5)]' : 'border-gray-600'}`;
    case 4: // Thick border
      return `${baseClass} ${hasMatchedTrait ? 'border-4 border-yellow-400' : 'border-4 border-gray-700'}`;
    case 5: // Double border
      return `${baseClass} ${hasMatchedTrait ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-black border-yellow-600' : 'border-gray-600'}`;
    case 6: // Dashed border
      return `${baseClass} ${hasMatchedTrait ? 'border-dashed border-yellow-400' : 'border-dashed border-gray-600'}`;
    case 7: // Rounded corners
      return `border-2 rounded-2xl p-2 transition-all ${hasMatchedTrait ? 'border-yellow-400 bg-yellow-900/10' : 'border-gray-600 bg-gray-900/50'}`;
    case 8: // Outline only
      return `${baseClass} ${hasMatchedTrait ? 'outline outline-2 outline-yellow-400 outline-offset-2 border-transparent' : 'border-gray-600'}`;
    case 9: // Inset border
      return `${baseClass} ${hasMatchedTrait ? 'shadow-[inset_0_0_0_2px_rgba(250,182,23,1)]' : 'shadow-[inset_0_0_0_1px_rgba(156,163,175,0.5)]'}`;
    case 10: // No border clean
      return `${baseClass} ${hasMatchedTrait ? 'bg-yellow-900/30' : 'bg-gray-900/30'} ${highlightedGlow}`;
    default:
      return `${baseClass} ${hasMatchedTrait ? 'border-2 border-yellow-400' : 'border-2 border-gray-600'}`;
  }
};

export const getTraitCircleStyle = (styleNum: number, trait: string, isMatched: boolean) => {
  const size = styleNum <= 5 ? "w-10 h-10" : "w-12 h-12";
  const baseClass = `${size} flex items-center justify-center transition-all duration-200 flex-shrink-0`;
  
  switch(styleNum) {
    case 1: // Small circles with variation images
      return {
        container: `${baseClass} rounded-full ${isMatched ? 'bg-yellow-400/30 border-2 border-yellow-400 shadow-lg shadow-yellow-400/30' : 'bg-gray-800/50 border border-gray-700'} overflow-hidden p-1`,
        content: <Image src={`/variation-images/${trait}.png`} width={32} height={32} alt={trait} className="object-contain" />
      };
    case 2: // Square badges
      return {
        container: `${baseClass} ${isMatched ? 'bg-yellow-400/30 border-2 border-yellow-400' : 'bg-gray-800/50 border border-gray-700'}`,
        content: <span className="text-[10px] font-bold">{trait.slice(0, 3).toUpperCase()}</span>
      };
    case 3: // Hexagon style
      return {
        container: `${baseClass} ${isMatched ? 'bg-yellow-400/30' : 'bg-gray-800/50'} clip-path-hexagon`,
        content: <span className="text-sm">◆</span>
      };
    case 4: // Text only
      return {
        container: `${baseClass}`,
        content: <span className={`text-xs font-bold ${isMatched ? 'text-yellow-400' : 'text-gray-500'}`}>{trait.toUpperCase()}</span>
      };
    case 5: // Large circles with images
      return {
        container: `w-14 h-14 rounded-full flex items-center justify-center ${isMatched ? 'bg-yellow-400/30 border-2 border-yellow-400' : 'bg-gray-800/50 border border-gray-700'}`,
        content: <Image src={`/item-images/${trait}.png`} width={28} height={28} alt={trait} className="object-contain" />
      };
    case 6: // Diamond shape
      return {
        container: `${baseClass} rotate-45 ${isMatched ? 'bg-yellow-400/30 border border-yellow-400' : 'bg-gray-800/50 border border-gray-700'}`,
        content: <span className="-rotate-45 text-xs">◈</span>
      };
    case 7: // Pill shape
      return {
        container: `px-3 py-1 rounded-full text-xs ${isMatched ? 'bg-yellow-400/30 border border-yellow-400' : 'bg-gray-800/50 border border-gray-700'}`,
        content: <span>{trait}</span>
      };
    case 8: // Icon only
      return {
        container: `${baseClass}`,
        content: <span className={`text-2xl ${isMatched ? 'text-yellow-400' : 'text-gray-500'}`}>⬢</span>
      };
    case 9: // Minimal dots
      return {
        container: `w-3 h-3 rounded-full ${isMatched ? 'bg-yellow-400' : 'bg-gray-600'}`,
        content: null
      };
    case 10: // Bar indicators
      return {
        container: `h-6 flex-1 ${isMatched ? 'bg-gradient-to-r from-yellow-400/50 to-yellow-400/20' : 'bg-gray-800/50'} border-l-4 ${isMatched ? 'border-yellow-400' : 'border-gray-600'}`,
        content: <span className="text-xs ml-2">{trait}</span>
      };
    default:
      return {
        container: `${baseClass} rounded-full ${isMatched ? 'bg-yellow-400/30 border border-yellow-400' : 'bg-gray-800/50 border border-gray-700'}`,
        content: <span className="text-xs">⚙️</span>
      };
  }
};