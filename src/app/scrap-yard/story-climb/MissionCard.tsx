"use client";

import Image from "next/image";

interface MissionCardProps {
  nodeData: {
    id: string;
    label: string;
    index?: number;
    storyNodeType?: 'normal' | 'event' | 'boss' | 'final_boss';
    completed?: boolean;
    available?: boolean;
    current?: boolean;
  };
  onStartMission: () => void;
  simulateProgress?: () => void;
}

// Get reward color based on value
const getRewardColor = (value: number): string => {
  if (value >= 1000) return "text-orange-400";
  if (value >= 500) return "text-purple-400";
  if (value >= 250) return "text-blue-400";
  if (value >= 100) return "text-green-400";
  return "text-gray-400";
};

// Get node icon based on type
const getNodeIcon = (type?: string) => {
  switch (type) {
    case 'event': return '❓';
    case 'boss': return '👹';
    case 'final_boss': return '👑';
    case 'normal':
    default: return '⚔️';
  }
};

export default function MissionCard({ nodeData, onStartMission, simulateProgress }: MissionCardProps) {
  if (!nodeData) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>Select a node to view details</p>
      </div>
    );
  }

  const goldReward = (nodeData.index || 1) * (nodeData.storyNodeType === 'boss' ? 500 : 100);
  const xpReward = (nodeData.index || 1) * 50;
  const enemyPower = (nodeData.index || 1) * (nodeData.storyNodeType === 'boss' ? 150 : 50) + 100;
  // Simplified image selection with small hardcoded list
  const getNodeImage = (nodeId: string): string => {
    // Sample of available .webp images from the directory
    const availableImages = [
      '000-000-000.webp', '111-111-111.webp', '222-222-222.webp', '333-333-333.webp',
      'aa1-aa1-cd1.webp', 'aa1-ak1-bc2.webp', 'bc1-aa1-nm1.webp', 'dp1-aa1-fb1.webp',
      'hb1-aa1-ap1.webp', 'ku1-ak1-ap1.webp', 'lz1-aa1-nm1.webp', 'ae1-ak1-bc1.webp'
    ];
    
    // Use node ID to deterministically select an image
    let hash = 0;
    for (let i = 0; i < nodeId.length; i++) {
      hash = ((hash << 5) - hash) + nodeId.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % availableImages.length;
    return availableImages[index];
  };

  const mekImageName = getNodeImage(nodeData.id);

  return (
    <>
      {/* Node Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getNodeIcon(nodeData.storyNodeType)}</span>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-yellow-400 font-orbitron">
              Stage {nodeData.index || parseInt(nodeData.id.split('-')[1]) + 1}
            </h2>
            <p className="text-gray-400 text-sm capitalize">
              {nodeData.storyNodeType || 'Normal'} 
              {nodeData.storyNodeType === 'boss' && ' Battle'}
              {nodeData.storyNodeType === 'event' && ' Encounter'}
              {!nodeData.storyNodeType && ' Battle'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Mission Content - Modern Card Style */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Main Mission Card */}
        <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50">
          
          {/* Mission Type Banner */}
          <div className="bg-gradient-to-r from-black/60 to-black/40 px-4 py-3 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-base text-gray-200">
                  {nodeData.storyNodeType === 'boss' ? 'Boss Battle' : 
                   nodeData.storyNodeType === 'event' ? 'Mystery Event' :
                   nodeData.storyNodeType === 'final_boss' ? 'Final Boss' :
                   'Combat Mission'}
                </h3>
                <div className="flex gap-1.5">
                  {/* Difficulty indicators */}
                  {Array.from({ length: Math.min(5, Math.ceil((nodeData.index || 1) / 2)) }).map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-red-500 rounded-full" />
                  ))}
                </div>
              </div>
              <div className="text-xs text-amber-400">
                Stage {nodeData.index || 1}
              </div>
            </div>
          </div>

          <div className="p-4">
            {/* Primary Rewards */}
            <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 rounded-xl p-4 mb-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-baseline gap-3">
                  <div className="text-2xl font-light text-yellow-400">
                    💰 {goldReward.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-400">
                    ⭐ +{xpReward} XP
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase mb-1">Victory Rewards</div>
                  <div className="text-lg font-bold text-green-400">Guaranteed</div>
                </div>
              </div>
            </div>

            {/* Enemy Preview for battle nodes */}
            {(!nodeData.storyNodeType || nodeData.storyNodeType === 'normal' || nodeData.storyNodeType === 'boss' || nodeData.storyNodeType === 'final_boss') && (
              <div className="bg-black/30 rounded-lg p-3 mb-4">
                <div className="text-xs text-gray-500 uppercase mb-2">Enemy Forces</div>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden border border-gray-700">
                    <Image
                      src={`/${mekImageName}`}
                      alt="Enemy Mek"
                      width={80}
                      height={80}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">
                      {nodeData.storyNodeType === 'boss' ? 'Boss Mek Guardian' : 
                       nodeData.storyNodeType === 'final_boss' ? 'Final Boss Overlord' :
                       `Mek Opponent #${mekImageName.replace('.webp', '')}`}
                    </p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Power Level</span>
                        <span className="text-red-400 font-bold">
                          {enemyPower}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Type</span>
                        <span className="text-yellow-400 capitalize">
                          {nodeData.storyNodeType || 'Normal'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Event description for event nodes */}
            {nodeData.storyNodeType === 'event' && (
              <div className="bg-black/30 rounded-lg p-4 mb-4">
                <div className="text-xs text-gray-500 uppercase mb-2">Mystery Event</div>
                <p className="text-gray-300">
                  A mysterious encounter awaits. Choose your path wisely...
                </p>
                <div className="mt-3 flex gap-2">
                  <div className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-xs">
                    Random Outcome
                  </div>
                  <div className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs">
                    Choice Based
                  </div>
                </div>
              </div>
            )}

            {/* Additional Rewards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase mb-1">Drop Rate</div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Power Chip</span>
                    <span className="text-xs text-yellow-400">60%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Scrap Metal</span>
                    <span className="text-xs text-yellow-400">95%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase mb-1">Bonus Drops</div>
                <div className="space-y-1">
                  {nodeData.storyNodeType === 'boss' && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-purple-400">Boss Essence</span>
                      <span className="text-xs text-purple-400">25%</span>
                    </div>
                  )}
                  {nodeData.storyNodeType === 'event' && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-400">Mystery Box</span>
                      <span className="text-xs text-blue-400">???</span>
                    </div>
                  )}
                  {(!nodeData.storyNodeType || nodeData.storyNodeType === 'normal') && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Common Loot</span>
                      <span className="text-xs text-gray-400">100%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Mission Status */}
            <div className="bg-black/30 rounded-lg p-3">
              <div className="text-xs text-gray-500 uppercase mb-2">Mission Status</div>
              <div className="flex flex-wrap gap-2">
                {nodeData.completed && (
                  <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-bold">
                    ✓ Completed
                  </span>
                )}
                {nodeData.current && (
                  <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-bold animate-pulse">
                    Current Position
                  </span>
                )}
                {nodeData.available && !nodeData.current && (
                  <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-sm font-bold">
                    Available
                  </span>
                )}
                {!nodeData.completed && !nodeData.available && !nodeData.current && (
                  <span className="px-3 py-1 bg-gray-600/20 text-gray-400 rounded-full text-sm font-bold">
                    🔒 Locked
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Controls Help */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">
            Controls
          </h3>
          <div className="text-sm text-gray-300 space-y-1">
            <div>W/S or ↑/↓ - Navigate up/down</div>
            <div>Mouse wheel - Scroll through map</div>
            <div>Click nodes - View mission details</div>
            <div>Complete missions to unlock new areas</div>
          </div>
        </div>
      </div>
      
      {/* Action Button */}
      <div className="p-6 border-t border-gray-800">
        {(nodeData.available || nodeData.current) && !nodeData.completed ? (
          <button
            onClick={onStartMission}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold rounded-lg transition-all transform hover:scale-105 font-orbitron uppercase tracking-wider"
          >
            {nodeData.storyNodeType === 'event' ? 'Enter Event' :
             nodeData.storyNodeType === 'boss' ? 'Challenge Boss' :
             nodeData.storyNodeType === 'final_boss' ? 'Face Final Boss' :
             'Start Battle'}
          </button>
        ) : nodeData.completed ? (
          <div className="text-center text-gray-500">
            <p className="text-sm">Stage Complete</p>
            <div className="mt-2 text-xs text-gray-600">
              Rewards Collected: 💰 {goldReward.toLocaleString()} | ⭐ +{xpReward} XP
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Complete previous stages to unlock</p>
            {simulateProgress && (
              <button 
                onClick={simulateProgress}
                className="px-3 py-1 bg-gray-600/50 hover:bg-gray-500/50 text-gray-300 text-xs rounded transition-all"
              >
                Debug: Simulate Progress
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}