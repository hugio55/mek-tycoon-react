"use client";

import Image from "next/image";
import type { Mek } from "@/app/contracts/types";

interface MekSlotGridProps {
  mekSlots: number;
  selectedMeks?: Mek[];
  missionId: string;
  onSlotClick?: (missionId: string, slotIndex: number) => void;
  hoveredSlot?: number | null;
  setHoveredSlot?: (slot: number | null) => void;
  variant?: "default" | "compact" | "large" | "minimal" | "detailed";
  maxSlots?: number;
  className?: string;
}

export default function MekSlotGrid({
  mekSlots,
  selectedMeks = [],
  missionId,
  onSlotClick,
  hoveredSlot,
  setHoveredSlot,
  variant = "default",
  maxSlots = 6,
  className = ""
}: MekSlotGridProps) {
  const renderSlot = (index: number) => {
    const isLocked = index >= mekSlots;
    const mek = selectedMeks[index];
    const isHovered = hoveredSlot === index;

    const handleClick = () => {
      if (!isLocked && onSlotClick) {
        onSlotClick(missionId, index);
      }
    };

    const handleMouseEnter = () => setHoveredSlot?.(index);
    const handleMouseLeave = () => setHoveredSlot?.(null);

    if (variant === "detailed") {
      return (
        <button
          key={index}
          onClick={handleClick}
          disabled={isLocked}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`
            aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all
            ${isLocked 
              ? 'bg-gray-900/50 border-gray-800 cursor-not-allowed opacity-30' 
              : mek
                ? 'bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border-yellow-500/60 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-500/30'
                : isHovered
                  ? 'bg-yellow-900/20 border-yellow-500/40 scale-105'
                  : 'bg-black/60 border-gray-700 hover:border-yellow-500/40 hover:bg-black/80'
            }
          `}
        >
          {isLocked ? (
            <span className="text-gray-600 text-2xl">🔒</span>
          ) : mek ? (
            <div className="relative p-1.5">
              <Image 
                src={mek.image || "/variation-images/default.png"} 
                alt={mek.name}
                width={40}
                height={40}
                className="rounded"
              />
              {mek.matchedTraits && mek.matchedTraits.length > 0 && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  +{mek.matchedTraits.reduce((acc: number, trait: any) => acc + parseInt(trait.bonus.replace("%", "").replace("+", "")), 0)}%
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl text-yellow-500/60 hover:text-yellow-400 transition-colors">+</span>
              <span className="text-[9px] text-yellow-500/40 uppercase tracking-wider">EMPTY</span>
            </div>
          )}
        </button>
      );
    }

    if (variant === "minimal") {
      return (
        <button
          key={index}
          onClick={handleClick}
          disabled={isLocked}
          className={`
            aspect-square rounded border flex items-center justify-center transition-all
            ${isLocked 
              ? 'bg-gray-900/30 border-gray-800 cursor-not-allowed' 
              : mek
                ? 'bg-yellow-900/20 border-yellow-600/40'
                : 'bg-black/40 border-gray-700 hover:border-yellow-600/40'
            }
          `}
        >
          {isLocked ? '🔒' : mek ? '⚡' : '+'}
        </button>
      );
    }

    if (variant === "compact") {
      return (
        <button
          key={index}
          onClick={handleClick}
          disabled={isLocked}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`
            aspect-square rounded-lg border transition-all
            ${isLocked 
              ? 'bg-gray-900/30 border-gray-800 cursor-not-allowed' 
              : mek
                ? 'bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/50 hover:border-yellow-400'
                : 'bg-black/40 border-gray-700 hover:border-yellow-500/50 hover:bg-black/60'
            }
            ${isHovered && !isLocked ? 'scale-105 shadow-lg shadow-yellow-500/20' : ''}
          `}
        >
          {isLocked ? (
            <span className="text-gray-600 text-lg">🔒</span>
          ) : mek ? (
            <div className="p-1">
              <Image 
                src={mek.image || "/variation-images/default.png"} 
                alt={mek.name}
                width={24}
                height={24}
                className="rounded"
              />
            </div>
          ) : (
            <span className="text-gray-400 text-xl">+</span>
          )}
        </button>
      );
    }

    if (variant === "large") {
      return (
        <button
          key={index}
          onClick={handleClick}
          disabled={isLocked}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`
            aspect-square rounded-xl border-2 transition-all group relative overflow-hidden
            ${isLocked 
              ? 'bg-gradient-to-br from-gray-900/50 to-black/50 border-gray-800 cursor-not-allowed' 
              : mek
                ? 'bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border-yellow-500/60 hover:border-yellow-400'
                : 'bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-gray-700 hover:border-yellow-500/50'
            }
            ${isHovered && !isLocked ? 'scale-105 shadow-xl shadow-yellow-500/30' : ''}
          `}
        >
          {isLocked ? (
            <div className="flex flex-col items-center justify-center">
              <span className="text-gray-600 text-2xl mb-1">🔒</span>
              <span className="text-xs text-gray-600">Locked</span>
            </div>
          ) : mek ? (
            <div className="p-2 flex flex-col items-center justify-center">
              <Image 
                src={mek.image || "/variation-images/default.png"} 
                alt={mek.name}
                width={48}
                height={48}
                className="rounded-lg mb-1"
              />
              <span className="text-xs text-yellow-400 truncate max-w-full px-1">
                {mek.name}
              </span>
              {mek.hasMatch && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <span className="text-gray-400 text-3xl mb-1 group-hover:text-yellow-400 transition-colors">+</span>
              <span className="text-xs text-gray-500 group-hover:text-yellow-400/70 transition-colors">Add Mek</span>
            </div>
          )}
        </button>
      );
    }

    // Default variant
    return (
      <button
        key={index}
        onClick={handleClick}
        disabled={isLocked}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          aspect-square rounded-lg border flex items-center justify-center transition-all
          ${isLocked 
            ? 'bg-gray-900/30 border-gray-800 cursor-not-allowed' 
            : mek
              ? 'bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-500/30 hover:border-yellow-400/60'
              : 'bg-gray-800/30 border-yellow-500/15 hover:border-yellow-500/40 hover:bg-gray-800/50'
          }
          ${isHovered && !isLocked ? 'scale-105 shadow-md shadow-yellow-500/20' : ''}
        `}
      >
        {isLocked ? (
          <span className="text-gray-600">🔒</span>
        ) : mek ? (
          <div className="p-1.5">
            <Image 
              src={mek.image || "/variation-images/default.png"} 
              alt={mek.name}
              width={32}
              height={32}
              className="rounded"
            />
          </div>
        ) : (
          <span className="text-gray-400 text-2xl">+</span>
        )}
      </button>
    );
  };

  const getGridCols = () => {
    if (variant === "minimal") return "grid-cols-8";
    if (variant === "large") return "grid-cols-3";
    if (maxSlots <= 4) return "grid-cols-4";
    if (maxSlots <= 6) return "grid-cols-6";
    return "grid-cols-8";
  };

  return (
    <div className={`grid ${getGridCols()} gap-1.5 ${className}`}>
      {Array.from({ length: maxSlots }).map((_, i) => renderSlot(i))}
    </div>
  );
}