'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

// Mock data for active contracts
const mockActiveContracts = [
  {
    id: 'contract1',
    name: 'Barren Wasteland',
    type: 'single',
    timeRemaining: Date.now() + 1 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000 + 13 * 60 * 1000 + 24 * 1000,
    goldReward: 3500,
    xpReward: 250,
    successChance: 62,
    progress: 45,
    mekSlots: 8,
    assignedMeks: [
      { name: 'Tech', type: 'head', power: 180, stats: { damage: '+28%', classic: '+10%', lightning: '+12%', corrosive: '+10%', rare: '+10%' } },
      { name: 'Oni', type: 'body', power: 203, stats: { damage: '+30%', classic: '+15%', lightning: '+13%', corrosive: '+10%', rare: '+10%' } },
      { name: 'Musical', type: 'trait', power: 187, stats: { damage: '+26%', classic: '+10%', lightning: '+10%', corrosive: '+13%', rare: '+10%' } },
      { name: 'Nose', type: 'head', power: 195, stats: { damage: '+29%', classic: '+10%', lightning: '+10%', corrosive: '+10%', rare: '+13%' } },
      { name: 'Cartoon', type: 'body', power: 210, stats: { damage: '+31%', classic: '+10%', lightning: '+10%', corrosive: '+15%', rare: '+10%' } },
      null,
      null,
      null
    ],
    potentialRewards: [
      { name: 'Common Power Chip', chance: 75, icon: '💾' },
      { name: 'Bumblebee Essence', chance: 45, icon: '🐝' },
      { name: 'Paul Essence', chance: 30, icon: '👤' },
      { name: 'DMT Canister', chance: 15, icon: '🧪' },
      { name: 'Rare Power Chip', chance: 8, icon: '💎' },
      { name: 'Legendary Frame', chance: 1, icon: '🏆' }
    ]
  },
  {
    id: 'contract2',
    name: 'Barren Wasteland',
    type: 'single',
    timeRemaining: Date.now() + 1 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000 + 13 * 60 * 1000 + 24 * 1000,
    goldReward: 3500,
    xpReward: 250,
    successChance: 62,
    progress: 45,
    mekSlots: 8,
    assignedMeks: [
      { name: 'Tech', type: 'head', power: 180, stats: { damage: '+28%', classic: '+10%', lightning: '+12%', corrosive: '+10%', rare: '+10%' } },
      { name: 'Oni', type: 'body', power: 203, stats: { damage: '+30%', classic: '+15%', lightning: '+13%', corrosive: '+10%', rare: '+10%' } },
      { name: 'Musical', type: 'trait', power: 187, stats: { damage: '+26%', classic: '+10%', lightning: '+10%', corrosive: '+13%', rare: '+10%' } },
      { name: 'Nose', type: 'head', power: 195, stats: { damage: '+29%', classic: '+10%', lightning: '+10%', corrosive: '+10%', rare: '+13%' } },
      { name: 'Cartoon', type: 'body', power: 210, stats: { damage: '+31%', classic: '+10%', lightning: '+10%', corrosive: '+15%', rare: '+10%' } },
      null,
      null,
      null
    ],
    potentialRewards: [
      { name: 'Common Power Chip', chance: 75, icon: '💾' },
      { name: 'Bumblebee Essence', chance: 45, icon: '🐝' },
      { name: 'Paul Essence', chance: 30, icon: '👤' },
      { name: 'DMT Canister', chance: 15, icon: '🧪' },
      { name: 'Core Power Chip', chance: 8, icon: '💎' },
      { name: 'Legendary Frame', chance: 1, icon: '🏆' }
    ]
  },
  {
    id: 'contract3',
    name: 'Barren Wasteland',
    type: 'single',
    timeRemaining: Date.now() + 1 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000 + 13 * 60 * 1000 + 24 * 1000,
    goldReward: 3500,
    xpReward: 250,
    successChance: 62,
    progress: 45,
    mekSlots: 8,
    assignedMeks: [
      { name: 'Tech', type: 'head', power: 180, stats: { damage: '+28%', classic: '+10%', lightning: '+12%', corrosive: '+10%', rare: '+10%' } },
      { name: 'Oni', type: 'body', power: 203, stats: { damage: '+30%', classic: '+15%', lightning: '+13%', corrosive: '+10%', rare: '+10%' } },
      { name: 'Musical', type: 'trait', power: 187, stats: { damage: '+26%', classic: '+10%', lightning: '+10%', corrosive: '+13%', rare: '+10%' } },
      { name: 'Nose', type: 'head', power: 195, stats: { damage: '+29%', classic: '+10%', lightning: '+10%', corrosive: '+10%', rare: '+13%' } },
      { name: 'Cartoon', type: 'body', power: 210, stats: { damage: '+31%', classic: '+10%', lightning: '+10%', corrosive: '+15%', rare: '+10%' } },
      null,
      null,
      null
    ],
    potentialRewards: [
      { name: 'Common Power Chip', chance: 75, icon: '💾' },
      { name: 'Bumblebee Essence', chance: 45, icon: '🐝' },
      { name: 'Paul Essence', chance: 30, icon: '👤' },
      { name: 'DMT Canister', chance: 15, icon: '🧪' },
      { name: 'Core Power Chip', chance: 8, icon: '💎' },
      { name: 'Legendary Frame', chance: 1, icon: '🏆' }
    ]
  },
  {
    id: 'contract4',
    name: 'Barren Wasteland',
    type: 'single',
    timeRemaining: Date.now() + 1 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000 + 13 * 60 * 1000 + 24 * 1000,
    goldReward: 3500,
    xpReward: 250,
    successChance: 62,
    progress: 45,
    mekSlots: 8,
    assignedMeks: [
      { name: 'Tech', type: 'head', power: 180, stats: { damage: '+28%', classic: '+10%', lightning: '+12%', corrosive: '+10%', rare: '+10%' } },
      { name: 'Oni', type: 'body', power: 203, stats: { damage: '+30%', classic: '+15%', lightning: '+13%', corrosive: '+10%', rare: '+10%' } },
      { name: 'Musical', type: 'trait', power: 187, stats: { damage: '+26%', classic: '+10%', lightning: '+10%', corrosive: '+13%', rare: '+10%' } },
      { name: 'Nose', type: 'head', power: 195, stats: { damage: '+29%', classic: '+10%', lightning: '+10%', corrosive: '+10%', rare: '+13%' } },
      { name: 'Cartoon', type: 'body', power: 210, stats: { damage: '+31%', classic: '+10%', lightning: '+10%', corrosive: '+15%', rare: '+10%' } },
      null,
      null,
      null
    ],
    potentialRewards: [
      { name: 'Common Power Chip', chance: 75, icon: '💾' },
      { name: 'Bumblebee Essence', chance: 45, icon: '🐝' },
      { name: 'Paul Essence', chance: 30, icon: '👤' },
      { name: 'DMT Canister', chance: 15, icon: '🧪' },
      { name: 'Core Power Chip', chance: 8, icon: '💎' },
      { name: 'Legendary Frame', chance: 1, icon: '🏆' }
    ]
  },
  {
    id: 'contract5',
    name: 'Barren Wasteland',
    type: 'single',
    timeRemaining: Date.now() + 1 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000 + 13 * 60 * 1000 + 24 * 1000,
    goldReward: 3500,
    xpReward: 250,
    successChance: 62,
    progress: 45,
    mekSlots: 8,
    assignedMeks: [
      { name: 'Tech', type: 'head', power: 180, stats: { damage: '+28%', classic: '+10%', lightning: '+12%', corrosive: '+10%', rare: '+10%' } },
      { name: 'Oni', type: 'body', power: 203, stats: { damage: '+30%', classic: '+15%', lightning: '+13%', corrosive: '+10%', rare: '+10%' } },
      { name: 'Musical', type: 'trait', power: 187, stats: { damage: '+26%', classic: '+10%', lightning: '+10%', corrosive: '+13%', rare: '+10%' } },
      { name: 'Nose', type: 'head', power: 195, stats: { damage: '+29%', classic: '+10%', lightning: '+10%', corrosive: '+10%', rare: '+13%' } },
      { name: 'Cartoon', type: 'body', power: 210, stats: { damage: '+31%', classic: '+10%', lightning: '+10%', corrosive: '+15%', rare: '+10%' } },
      null,
      null,
      null
    ],
    potentialRewards: [
      { name: 'Common Power Chip', chance: 75, icon: '💾' },
      { name: 'Bumblebee Essence', chance: 45, icon: '🐝' },
      { name: 'Paul Essence', chance: 30, icon: '👤' },
      { name: 'DMT Canister', chance: 15, icon: '🧪' },
      { name: 'Core Power Chip', chance: 8, icon: '💎' },
      { name: 'Legendary Frame', chance: 1, icon: '🏆' }
    ]
  }
];

export default function ActiveContractsPage() {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [expandedContract, setExpandedContract] = useState<string | null>(null);
  
  const maxContracts = 14;
  const activeContracts = mockActiveContracts;
  
  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const formatCountdown = (endTime: number): string => {
    const remaining = Math.max(0, endTime - currentTime);
    const d = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const h = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((remaining % (1000 * 60)) / 1000);
    
    if (remaining <= 0) return "Expired";
    if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
    return `${h}h ${m}m ${s}s`;
  };
  
  const getRewardColor = (chance: number): string => {
    if (chance >= 75) return 'text-green-400';
    if (chance >= 45) return 'text-yellow-400';
    if (chance >= 30) return 'text-orange-400';
    if (chance >= 15) return 'text-red-400';
    if (chance >= 8) return 'text-purple-400';
    return 'text-gray-400';
  };
  
  const renderMekSlot = (mek: any, index: number) => {
    if (!mek) {
      return (
        <div className="w-12 h-12 bg-black/40 border border-gray-700/50 rounded flex items-center justify-center">
          <span className="text-gray-600 text-xs">Empty</span>
        </div>
      );
    }
    
    const typeColors = {
      head: 'border-yellow-500/30',
      body: 'border-blue-500/30',
      trait: 'border-purple-500/30'
    };
    
    return (
      <div className={`relative group/mek`}>
        <div className={`w-12 h-12 bg-gradient-to-br from-gray-800/60 to-black/60 border-2 ${typeColors[mek.type]} rounded overflow-hidden flex items-center justify-center`}>
          <div className="text-[10px] font-bold text-gray-300 uppercase">{mek.name.slice(0, 4)}</div>
        </div>
        
        {/* Mek stats tooltip on hover */}
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/mek:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="bg-black/95 border border-yellow-500/30 rounded p-2 whitespace-nowrap">
            <div className="text-xs text-yellow-400 font-bold">{mek.name}</div>
            <div className="text-[10px] text-gray-400">Power: {mek.power}</div>
            {Object.entries(mek.stats).slice(0, 2).map(([key, value]) => (
              <div key={key} className="text-[10px] text-gray-300">
                {key}: <span className="text-green-400">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  const renderContractRow = (contract: any) => {
    const isExpanded = expandedContract === contract.id;
    const timeRemaining = contract.timeRemaining - currentTime;
    const isUrgent = timeRemaining < 15 * 60 * 1000; // Less than 15 minutes
    const isWarning = timeRemaining < 60 * 60 * 1000; // Less than 1 hour
    
    return (
      <div key={contract.id} className="group">
        {/* Main Contract Row */}
        <div 
          className={`relative bg-gradient-to-r from-gray-900/40 via-black/50 to-gray-900/40 backdrop-blur-sm border-l-4 ${
            contract.type === 'global' ? 'border-l-yellow-500' : 'border-l-gray-600'
          } hover:from-gray-900/60 hover:to-gray-900/60 transition-all cursor-pointer`}
          onClick={() => setExpandedContract(isExpanded ? null : contract.id)}
        >
          {/* Industrial overlay texture */}
          <div className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)`
            }}
          />
          
          <div className="relative p-4 flex items-center gap-6">
            {/* Left Section: Mission Info & Timer */}
            <div className="flex-shrink-0 w-48">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider">
                  {contract.name}
                </h3>
                <span className="text-[10px] px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400 uppercase">
                  {contract.type}
                </span>
              </div>
              <div className="text-xs text-gray-500">Time Remaining</div>
              <div className={`text-sm font-mono ${
                isUrgent ? 'text-red-400 animate-pulse' : 
                isWarning ? 'text-orange-400' : 
                'text-green-400'
              }`}>
                {formatCountdown(contract.timeRemaining)}
              </div>
            </div>
            
            {/* Center Section: Mek Slots & Progress */}
            <div className="flex-1">
              {/* Mek Slots */}
              <div className="flex items-center gap-2 mb-2">
                {Array.from({ length: contract.mekSlots }).map((_, i) => (
                  <React.Fragment key={i}>
                    {renderMekSlot(contract.assignedMeks[i], i)}
                  </React.Fragment>
                ))}
              </div>
              
              {/* Progress Bar */}
              <div className="relative h-1 bg-black/60 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${contract.progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>
              <div className="text-[10px] text-gray-500 mt-1">MISSION PROGRESS: {contract.progress}%</div>
            </div>
            
            {/* Right Section: Rewards & Success */}
            <div className="flex items-center gap-6">
              {/* Potential Rewards */}
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase mb-1">Potential Rewards</div>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-lg font-bold text-yellow-400">
                      {contract.goldReward.toLocaleString()} gold
                    </div>
                    <div className="text-xs text-blue-400">+{contract.xpReward} XP</div>
                  </div>
                </div>
              </div>
              
              {/* Success Chance */}
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase mb-1">Success Chance</div>
                <div className={`text-3xl font-bold ${
                  contract.successChance >= 80 ? 'text-green-400' :
                  contract.successChance >= 50 ? 'text-yellow-400' :
                  'text-orange-400'
                }`}>
                  {contract.successChance}%
                </div>
              </div>
              
              {/* Expand Indicator */}
              <div className="flex-shrink-0">
                <div className={`w-6 h-6 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Expanded Details */}
        {isExpanded && (
          <div className="bg-black/40 border-l-4 border-l-gray-800 border-b border-b-gray-800">
            <div className="p-4 grid grid-cols-2 gap-4">
              {/* Potential Rewards List */}
              <div>
                <h4 className="text-xs text-gray-500 uppercase mb-2">Drop Table</h4>
                <div className="space-y-1">
                  {contract.potentialRewards.map((reward: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span>{reward.icon}</span>
                        <span className="text-gray-300">{reward.name}</span>
                      </div>
                      <span className={getRewardColor(reward.chance)}>{reward.chance}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Mek Details */}
              <div>
                <h4 className="text-xs text-gray-500 uppercase mb-2">Deployed Meks</h4>
                <div className="grid grid-cols-4 gap-2">
                  {contract.assignedMeks.filter((m: any) => m).map((mek: any, i: number) => (
                    <div key={i} className="text-xs">
                      <div className="text-yellow-400 font-semibold">{mek.name}</div>
                      <div className="text-gray-500">PWR: {mek.power}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-2 border-yellow-500/50 bg-gradient-to-r from-gray-900/60 via-black/80 to-gray-900/60 backdrop-blur-sm p-6">
          <h1 className="text-3xl font-bold text-yellow-400 uppercase tracking-widest mb-4" style={{ fontFamily: 'Orbitron, monospace' }}>
            ACTIVE CONTRACTS
          </h1>
          
          {/* Contract Counter */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg text-gray-300">
              Active Contracts: <span className="text-yellow-400 font-bold">{activeContracts.length}/{maxContracts}</span>
            </div>
            
            {/* Progress Dots */}
            <div className="flex gap-1">
              {Array.from({ length: maxContracts }).map((_, i) => (
                <div 
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < activeContracts.length ? 'bg-yellow-400' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-2 text-sm uppercase tracking-wider transition-all ${
                selectedFilter === 'all' 
                  ? 'bg-yellow-500/20 border-b-2 border-yellow-500 text-yellow-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFilter('single')}
              className={`px-4 py-2 text-sm uppercase tracking-wider transition-all ${
                selectedFilter === 'single' 
                  ? 'bg-yellow-500/20 border-b-2 border-yellow-500 text-yellow-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Single Contracts
            </button>
            <button
              onClick={() => setSelectedFilter('story')}
              className={`px-4 py-2 text-sm uppercase tracking-wider transition-all ${
                selectedFilter === 'story' 
                  ? 'bg-yellow-500/20 border-b-2 border-yellow-500 text-yellow-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Story Contracts
            </button>
          </div>
        </div>
        
        {/* Contracts List */}
        <div className="space-y-1">
          {activeContracts.map(contract => renderContractRow(contract))}
        </div>
        
        {/* Add More Button */}
        <div className="mt-6 text-center">
          <button className="px-8 py-3 bg-gradient-to-r from-green-600/80 to-emerald-500/80 text-white font-bold uppercase tracking-wider border-2 border-green-500/50 hover:from-green-500 hover:to-emerald-400 transition-all">
            Add More Contracts
          </button>
        </div>
      </div>
      
      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}