"use client";

import { useState, useEffect, useRef } from "react";
import { useClickSound } from "@/lib/useClickSound";

type TalentNode = {
  id: string;
  name: string;
  x: number;
  y: number;
  tier: number;
  desc: string;
  xp: number;
  unlocked?: boolean;
};

type Connection = {
  from: string;
  to: string;
};

interface MekTalentTreeProps {
  mekId: string;
  mekLevel?: number;
}

// MEK 1 specific talent tree data
const mek1TalentData = {
  nodes: [
    // Core node
    { id: 'core', name: 'MEK 1 CORE', x: 400, y: 50, tier: 0, desc: 'Enhanced MEK processing core', xp: 0, unlocked: true },
    
    // Tier 1 - Three main branches
    { id: 'gold-gen', name: 'Gold\nGenerator', x: 200, y: 150, tier: 1, desc: '+5 gold/hr base generation', xp: 50 },
    { id: 'efficiency', name: 'Efficiency\nProtocol', x: 400, y: 150, tier: 1, desc: '+10% work speed', xp: 50 },
    { id: 'bank-link', name: 'Bank\nInterface', x: 600, y: 150, tier: 1, desc: '+0.5% bank interest', xp: 50 },
    
    // Tier 2 - Gold branch
    { id: 'gold-boost', name: 'Gold\nBoost', x: 150, y: 250, tier: 2, desc: '+8 gold/hr generation', xp: 100 },
    { id: 'gold-multi', name: 'Gold\nMultiplier', x: 250, y: 250, tier: 2, desc: '1.1x gold generation', xp: 120 },
    
    // Tier 2 - Efficiency branch
    { id: 'quick-craft', name: 'Quick\nCraft', x: 350, y: 250, tier: 2, desc: '+15% crafting speed', xp: 100 },
    { id: 'auto-collect', name: 'Auto\nCollect', x: 450, y: 250, tier: 2, desc: 'Auto-collect resources', xp: 120 },
    
    // Tier 2 - Bank branch
    { id: 'compound', name: 'Compound\nInterest', x: 550, y: 250, tier: 2, desc: '+0.8% bank interest', xp: 100 },
    { id: 'invest-boost', name: 'Investment\nBoost', x: 650, y: 250, tier: 2, desc: '+5% investment returns', xp: 120 },
    
    // Tier 3 - Advanced nodes
    { id: 'gold-rush', name: 'Gold\nRush', x: 200, y: 350, tier: 3, desc: '+20 gold/hr for 1 hour daily', xp: 200 },
    { id: 'hyper-mode', name: 'Hyper\nMode', x: 400, y: 350, tier: 3, desc: '2x speed for 30 min daily', xp: 200 },
    { id: 'bank-vault', name: 'Bank\nVault', x: 600, y: 350, tier: 3, desc: '+50% bank capacity', xp: 200 },
    
    // Tier 4 - Ultimate abilities
    { id: 'midas-touch', name: 'Midas\nTouch', x: 300, y: 450, tier: 4, desc: 'Convert items to gold', xp: 500 },
    { id: 'time-warp', name: 'Time\nWarp', x: 500, y: 450, tier: 4, desc: 'Skip 1 hour of production', xp: 500 },
  ] as TalentNode[],
  connections: [
    // From core to tier 1
    { from: 'core', to: 'gold-gen' },
    { from: 'core', to: 'efficiency' },
    { from: 'core', to: 'bank-link' },
    
    // Gold branch
    { from: 'gold-gen', to: 'gold-boost' },
    { from: 'gold-gen', to: 'gold-multi' },
    { from: 'gold-boost', to: 'gold-rush' },
    { from: 'gold-multi', to: 'gold-rush' },
    
    // Efficiency branch
    { from: 'efficiency', to: 'quick-craft' },
    { from: 'efficiency', to: 'auto-collect' },
    { from: 'quick-craft', to: 'hyper-mode' },
    { from: 'auto-collect', to: 'hyper-mode' },
    
    // Bank branch
    { from: 'bank-link', to: 'compound' },
    { from: 'bank-link', to: 'invest-boost' },
    { from: 'compound', to: 'bank-vault' },
    { from: 'invest-boost', to: 'bank-vault' },
    
    // Cross connections to ultimate
    { from: 'gold-rush', to: 'midas-touch' },
    { from: 'hyper-mode', to: 'midas-touch' },
    { from: 'hyper-mode', to: 'time-warp' },
    { from: 'bank-vault', to: 'time-warp' },
  ] as Connection[]
};

export default function MekTalentTree({ mekId, mekLevel = 1 }: MekTalentTreeProps) {
  const playClickSound = useClickSound();
  const [unlockedNodes, setUnlockedNodes] = useState<Set<string>>(new Set(['core']));
  const [hoveredNode, setHoveredNode] = useState<TalentNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<TalentNode | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: -20 });
  const [zoom, setZoom] = useState(0.9);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Calculate available skill points based on MEK level
  const totalSkillPoints = mekLevel * 100;
  const usedSkillPoints = Array.from(unlockedNodes).reduce((sum, nodeId) => {
    const node = mek1TalentData.nodes.find(n => n.id === nodeId);
    return sum + (node ? node.xp : 0);
  }, 0);
  const availableSkillPoints = totalSkillPoints - usedSkillPoints;

  // Load saved progress for this specific MEK
  useEffect(() => {
    const savedData = localStorage.getItem(`mek-talent-${mekId}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setUnlockedNodes(new Set(parsed.unlockedNodes || ['core']));
      } catch (e) {
        console.error('Failed to load MEK talent data:', e);
      }
    }
  }, [mekId]);

  // Save progress
  const saveProgress = (nodes: Set<string>) => {
    localStorage.setItem(`mek-talent-${mekId}`, JSON.stringify({
      unlockedNodes: Array.from(nodes)
    }));
  };

  const hasUnlockedPrerequisite = (node: TalentNode): boolean => {
    return mek1TalentData.connections.some(conn => 
      conn.to === node.id && unlockedNodes.has(conn.from)
    );
  };

  const canUnlockNode = (node: TalentNode): boolean => {
    if (unlockedNodes.has(node.id)) return false;
    if (node.tier === 0) return true;
    if (!hasUnlockedPrerequisite(node)) return false;
    return availableSkillPoints >= node.xp;
  };

  const unlockNode = (node: TalentNode) => {
    if (!canUnlockNode(node)) return;
    
    playClickSound();
    const newUnlocked = new Set(unlockedNodes);
    newUnlocked.add(node.id);
    setUnlockedNodes(newUnlocked);
    saveProgress(newUnlocked);
  };

  const resetTree = () => {
    if (confirm('Reset all MEK 1 talent points?')) {
      const newUnlocked = new Set(['core']);
      setUnlockedNodes(newUnlocked);
      saveProgress(newUnlocked);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('talent-node') && !target.closest('.talent-node')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(1.5, zoom * delta));
    setZoom(newZoom);
  };

  // Calculate progress
  const unlockedCount = unlockedNodes.size - 1; // Exclude core
  const totalNodes = mek1TalentData.nodes.length - 1; // Exclude core
  const progress = totalNodes > 0 ? Math.round((unlockedCount / totalNodes) * 100) : 0;

  return (
    <div className="relative border border-gray-800/50 bg-gray-950/30 backdrop-blur-[2px] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800/50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-gray-500 mb-1">MEK 1 TALENT TREE</div>
            <div className="text-lg font-bold text-yellow-400">SPECIALIZED ENHANCEMENTS</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">SKILL POINTS</div>
            <div className="text-xl font-mono font-bold text-green-400">{availableSkillPoints}</div>
            <div className="text-xs text-gray-600">{usedSkillPoints} / {totalSkillPoints} used</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress: {progress}%</span>
            <span>{unlockedCount} / {totalNodes} nodes</span>
          </div>
          <div className="h-2 bg-gray-800 rounded">
            <div 
              className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tree Canvas */}
      <div 
        ref={canvasRef}
        className="relative h-[500px] cursor-move overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <div 
          className="absolute inset-0"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isPanning ? 'none' : 'transform 0.3s ease'
          }}
        >
          {/* SVG for connections */}
          <svg className="absolute inset-0 pointer-events-none" style={{ width: 800, height: 600 }}>
            {mek1TalentData.connections.map((conn, idx) => {
              const fromNode = mek1TalentData.nodes.find(n => n.id === conn.from);
              const toNode = mek1TalentData.nodes.find(n => n.id === conn.to);
              if (!fromNode || !toNode) return null;
              
              const isActive = unlockedNodes.has(conn.from) && unlockedNodes.has(conn.to);
              const isPartial = unlockedNodes.has(conn.from) && !unlockedNodes.has(conn.to);
              
              return (
                <line
                  key={idx}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={isActive ? '#fbbf24' : isPartial ? '#4b5563' : '#1f2937'}
                  strokeWidth={isActive ? 3 : 2}
                  strokeDasharray={isPartial ? '5,5' : '0'}
                  opacity={isActive ? 1 : 0.5}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {mek1TalentData.nodes.map(node => {
            const isUnlocked = unlockedNodes.has(node.id);
            const canUnlock = canUnlockNode(node);
            const isHovered = hoveredNode?.id === node.id;
            const isSelected = selectedNode?.id === node.id;
            
            return (
              <div
                key={node.id}
                className={`talent-node absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200`}
                style={{ 
                  left: node.x, 
                  top: node.y,
                  zIndex: isHovered ? 20 : 10
                }}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => {
                  if (canUnlock) {
                    unlockNode(node);
                  } else {
                    setSelectedNode(node);
                  }
                }}
              >
                {/* Node Visual */}
                <div className={`
                  relative w-16 h-16 rounded-full border-2 flex items-center justify-center
                  ${isUnlocked 
                    ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 border-yellow-400 shadow-lg shadow-yellow-400/30' 
                    : canUnlock
                      ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-green-500 animate-pulse'
                      : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600'
                  }
                  ${isHovered ? 'scale-110' : ''}
                `}>
                  {/* Icon or tier number */}
                  <span className={`text-lg font-bold ${isUnlocked ? 'text-black' : 'text-gray-400'}`}>
                    {node.tier === 0 ? '★' : node.tier}
                  </span>
                </div>
                
                {/* Node Name */}
                <div className="mt-1 text-center">
                  <div className={`text-xs font-bold whitespace-pre-line ${
                    isUnlocked ? 'text-yellow-400' : 'text-gray-500'
                  }`}>
                    {node.name}
                  </div>
                </div>

                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gray-700 rounded p-3 text-xs whitespace-nowrap z-30 pointer-events-none">
                    <div className="font-bold text-yellow-400 mb-1">{node.name.replace(/\\n/g, ' ')}</div>
                    <div className="text-gray-300 mb-2">{node.desc}</div>
                    <div className="text-gray-400">
                      {node.xp > 0 && (
                        <div>Cost: <span className={canUnlock ? 'text-green-400' : 'text-red-400'}>{node.xp} SP</span></div>
                      )}
                      {!isUnlocked && !canUnlock && !hasUnlockedPrerequisite(node) && (
                        <div className="text-red-400 mt-1">Requires prerequisite</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="p-3 border-t border-gray-800/50 flex items-center justify-between">
        <button
          onClick={resetTree}
          className="px-3 py-1 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 rounded transition-all"
        >
          RESET TREE
        </button>
        
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Scroll to zoom • Drag to pan</span>
        </div>
      </div>
    </div>
  );
}