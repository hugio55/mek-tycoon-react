'use client';

import React, { useState, useEffect } from 'react';

export interface ContractSlot {
  id: number;
  status: 'available' | 'active' | 'locked';
  nodeId?: string;
  nodeName?: string;
  startTime?: number;
  duration?: number;
  unlockChapter?: number;
}

interface ContractSlotsProps {
  slots: ContractSlot[];
  onSlotClick: (slot: ContractSlot, action?: 'view' | 'abort') => void;
  className?: string;
  fillColorStyle?: 'cyan' | 'purple' | 'gold' | 'emerald' | 'crimson';
}

export default function ContractSlots({ slots, onSlotClick, className = '', fillColorStyle = 'cyan' }: ContractSlotsProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [activePopup, setActivePopup] = useState<number | null>(null);
  const [showAvailableMessage, setShowAvailableMessage] = useState<number | null>(null);

  // Color schemes for active slots
  const colorSchemes = {
    cyan: {
      bg: 'bg-cyan-950/40',
      border: 'border-cyan-400/60',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.6)]',
      text: 'text-cyan-400',
      progress: 'from-cyan-500 to-cyan-400'
    },
    purple: {
      bg: 'bg-purple-950/40',
      border: 'border-purple-400/60',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.6)]',
      text: 'text-purple-400',
      progress: 'from-purple-500 to-purple-400'
    },
    gold: {
      bg: 'bg-yellow-950/40',
      border: 'border-yellow-400/60',
      glow: 'shadow-[0_0_20px_rgba(250,182,23,0.6)]',
      text: 'text-yellow-400',
      progress: 'from-yellow-500 to-yellow-400'
    },
    emerald: {
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-400/60',
      glow: 'shadow-[0_0_20px_rgba(52,211,153,0.6)]',
      text: 'text-emerald-400',
      progress: 'from-emerald-500 to-emerald-400'
    },
    crimson: {
      bg: 'bg-red-950/40',
      border: 'border-red-400/60',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.6)]',
      text: 'text-red-400',
      progress: 'from-red-500 to-red-400'
    }
  };

  const activeColors = colorSchemes[fillColorStyle];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeRemaining = (endTime: number) => {
    const remaining = Math.max(0, endTime - currentTime);
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Render active slot content
  const renderActiveSlotContent = (slot: ContractSlot) => {
    const timeDisplay = slot.startTime && slot.duration
      ? formatTimeRemaining(slot.startTime + slot.duration)
      : 'Processing...';

    // Format display name - if it contains "Mek" show as "Mek #XXXX", otherwise use as-is
    const displayName = slot.nodeName
      ? (slot.nodeName.includes('Mek') || slot.nodeName.match(/^\d+$/)
        ? `Mek #${slot.nodeName.replace(/\D/g, '')}`
        : slot.nodeName)
      : 'Mission';

    return (
      <div className="flex-1 text-center">
        <div className="text-xs text-cyan-300 font-['Orbitron'] uppercase tracking-wider font-semibold">
          {displayName}
        </div>
        <div className="text-base font-bold font-mono text-cyan-400">
          {timeDisplay}
        </div>
      </div>
    );
  };

  // Active slot classes with diagonal stripes texture
  const getActiveSlotClasses = () => {
    return "relative overflow-hidden border-2 transition-all duration-300 py-2 px-2 text-center flex items-center justify-between bg-cyan-950/40 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.8)]";
  };

  return (
    <div className={`contract-slots-bar ${className}`} style={{ position: 'relative', zIndex: 9999 }}>
      <div className="bg-black/60 backdrop-blur-sm border border-yellow-500/30 py-1 px-3" style={{ overflow: 'visible' }}>
        {/* Label at the top */}
        <div className="text-center mb-1">
          <span className="text-xs text-white uppercase tracking-wider font-['Orbitron'] font-bold">
            Contracts
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2" style={{ overflow: 'visible' }}>
          {slots.map((slot) => (
            <div
              key={slot.id}
              data-slot-id={slot.id}
              className={`
                relative group
                ${slot.status === 'locked' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              onClick={() => {
                if (slot.status === 'locked') return;
                if (slot.status === 'active') {
                  setActivePopup(activePopup === slot.id ? null : slot.id);
                  setShowAvailableMessage(null);
                } else if (slot.status === 'available') {
                  setShowAvailableMessage(showAvailableMessage === slot.id ? null : slot.id);
                  setActivePopup(null);
                }
              }}
            >
              {/* Slot Container */}
              <div className={
                slot.status === 'active'
                  ? getActiveSlotClasses()
                  : `relative overflow-hidden border-2 transition-all duration-300 py-2 px-2 text-center flex items-center justify-between bg-black/40 border-yellow-500/20 ${slot.status === 'available' ? 'hover:border-yellow-500/50 hover:bg-yellow-950/10' : ''}`
              }>
                {/* Corner Brackets */}
                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-yellow-500/40" />
                <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-yellow-500/40" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-yellow-500/40" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-yellow-500/40" />

                {/* Diagonal stripes texture overlay for active slots */}
                {slot.status === 'active' && (
                  <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,255,255,0.1) 8px, rgba(0,255,255,0.1) 16px)'
                  }} />
                )}

                {/* Slot Content based on status */}
                {slot.status === 'available' && (
                  <div className="flex-1 text-center">
                    <div className="text-xs font-bold uppercase tracking-wider font-['Orbitron'] text-cyan-500">
                      CONTRACT {slot.id}
                    </div>
                    <div className="text-xs font-mono text-gray-400 mt-0.5">
                      Available
                    </div>
                  </div>
                )}

                {slot.status === 'active' && renderActiveSlotContent(slot)}

                {slot.status === 'locked' && (
                  <div className="flex-1 text-center flex items-center justify-center py-2">
                    <svg className="w-8 h-8 text-gray-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="6" y="10" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
                      <path d="M8 10V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="15" r="1.5" fill="currentColor"/>
                    </svg>
                  </div>
                )}

                {/* Hover Tooltip for Locked Slots */}
                {slot.status === 'locked' && (
                  <div className="
                    absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                    bg-black/90 border border-yellow-500/50 px-3 py-2 rounded
                    text-xs text-yellow-400 whitespace-nowrap
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200
                    pointer-events-none z-50
                  ">
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-yellow-500/50" />
                    </div>
                    Contract slot is locked. Please unlock by completing Chapter {slot.unlockChapter}.
                  </div>
                )}

                {/* Progress Bar for Active Contracts */}
                {slot.status === 'active' && slot.startTime && slot.duration && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-1000"
                      style={{
                        width: `${Math.max(0, Math.min(100, ((currentTime - slot.startTime) / slot.duration) * 100))}%`
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Popup Menu for Active Contracts */}
              {slot.status === 'active' && activePopup === slot.id && (
                <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-black/95 border border-yellow-500/50 rounded-sm shadow-lg" style={{ zIndex: 99999 }}>
                  <button
                    className="block w-full px-3 py-1 text-xs text-left text-yellow-500 hover:bg-yellow-500/20 transition-colors font-['Orbitron'] uppercase tracking-wider"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSlotClick(slot, 'view');
                      setActivePopup(null);
                    }}
                  >
                    View
                  </button>
                  <button
                    className="block w-full px-3 py-1 text-xs text-left text-red-500 hover:bg-red-500/20 transition-colors font-['Orbitron'] uppercase tracking-wider border-t border-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSlotClick(slot, 'abort');
                      setActivePopup(null);
                    }}
                  >
                    Abort
                  </button>
                </div>
              )}

              {/* Message for Available Slots */}
              {slot.status === 'available' && showAvailableMessage === slot.id && (
                <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-black/95 border border-yellow-500/50 rounded-sm shadow-lg p-3 w-48" style={{ zIndex: 99999 }}>
                  <div className="text-yellow-500 text-xs font-['Orbitron'] uppercase tracking-wider text-center mb-2">
                    Available Contract Slot
                  </div>
                  <div className="text-gray-400 text-xs text-center">
                    Please select an available contract from the node tree below
                  </div>
                  <button
                    className="mt-2 w-full px-2 py-1 text-xs text-gray-300 bg-gray-800/50 border border-gray-600 hover:bg-gray-700/50 transition-colors font-['Orbitron'] uppercase tracking-wider"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAvailableMessage(null);
                    }}
                  >
                    OK
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}