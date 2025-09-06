"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Node types matching the story system
type NodeType = "battle" | "boss" | "event" | "treasure" | "rest" | "shop" | "start";

interface StoryNode {
  id: number;
  level: number;
  type: NodeType;
  x: number;
  y: number;
  connections: number[];
  completed?: boolean;
  available?: boolean;
  current?: boolean;
  name?: string;
  difficulty?: number;
  rewards?: {
    gold?: number;
    xp?: number;
    items?: string[];
  };
  enemy?: {
    name: string;
    image: string;
    power: number;
  };
}

// Generate a test chapter tree (similar to the saved "Chapter 1 Test")
const generateTestChapterTree = (): StoryNode[] => {
  const nodes: StoryNode[] = [];
  const totalLevels = 12; // Test chapter with fewer levels
  
  // Start node
  nodes.push({
    id: 0,
    level: 0,
    type: "start",
    x: 0,
    y: 0,
    connections: [1, 2],
    completed: true,
    name: "Chapter Beginning",
    difficulty: 0,
  });
  
  // Generate branching paths
  let nodeId = 1;
  for (let level = 1; level <= totalLevels; level++) {
    const nodesAtLevel = level === totalLevels ? 1 : Math.min(3 + Math.floor(level / 3), 5);
    const isBossLevel = level === totalLevels;
    
    for (let i = 0; i < nodesAtLevel; i++) {
      let nodeType: NodeType = "battle";
      
      if (isBossLevel) {
        nodeType = "boss";
      } else if (level % 4 === 0 && i === Math.floor(nodesAtLevel / 2)) {
        nodeType = "rest";
      } else if (Math.random() < 0.2) {
        nodeType = ["event", "treasure", "shop"][Math.floor(Math.random() * 3)] as NodeType;
      }
      
      const connections: number[] = [];
      if (level < totalLevels) {
        const nextLevelNodes = level === totalLevels - 1 ? 1 : Math.min(3 + Math.floor((level + 1) / 3), 5);
        const connectCount = Math.min(2, nextLevelNodes);
        const startIdx = Math.max(0, i - 1);
        for (let j = 0; j < connectCount; j++) {
          const targetIdx = Math.min(startIdx + j, nextLevelNodes - 1);
          connections.push(nodeId + nodesAtLevel - i + targetIdx);
        }
      }
      
      nodes.push({
        id: nodeId,
        level: level,
        type: nodeType,
        x: (i - (nodesAtLevel - 1) / 2) * 200,
        y: level * 120,
        connections,
        completed: level < 3,
        available: level === 3,
        current: level === 3 && i === 1,
        name: nodeType === "boss" ? "Chapter Boss: Mek Guardian" : 
              nodeType === "event" ? "Mysterious Encounter" :
              nodeType === "treasure" ? "Hidden Cache" :
              nodeType === "shop" ? "Wandering Merchant" :
              nodeType === "rest" ? "Safe Haven" :
              `Battle Point ${nodeId}`,
        difficulty: level,
        rewards: {
          gold: level * (nodeType === "boss" ? 1000 : nodeType === "treasure" ? 500 : 100),
          xp: level * (nodeType === "boss" ? 500 : 100),
        },
        enemy: (nodeType === "battle" || nodeType === "boss") ? {
          name: nodeType === "boss" ? "Mek Guardian Alpha" : `Rogue Mek #${(nodeId * 137 % 1000) + 1}`,
          image: `/mek-images/150px/mek${String((nodeId * 137 % 1000) + 1).padStart(4, '0')}.png`,
          power: level * (nodeType === "boss" ? 100 : 20) + 50
        } : undefined
      });
      
      nodeId++;
    }
  }
  
  return nodes;
};

// Get node style based on state
const getNodeStyle = (node: StoryNode) => {
  if (node.completed) {
    return "bg-gradient-to-br from-green-600 to-green-700 border-green-500";
  }
  if (node.current) {
    return "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 animate-pulse";
  }
  if (node.available) {
    return "bg-gradient-to-br from-yellow-500 to-amber-600 border-yellow-400";
  }
  return "bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 opacity-50";
};

// Get node icon
const getNodeIcon = (type: NodeType) => {
  switch (type) {
    case "start": return "🚀";
    case "battle": return "⚔️";
    case "boss": return "👹";
    case "event": return "❓";
    case "treasure": return "💎";
    case "rest": return "🏕️";
    case "shop": return "🛒";
    default: return "📍";
  }
};

// Get reward color based on rarity
const getRewardColor = (value: number): string => {
  if (value >= 1000) return "text-orange-400"; // Legendary
  if (value >= 500) return "text-purple-400";  // Epic
  if (value >= 250) return "text-blue-400";    // Rare
  if (value >= 100) return "text-green-400";   // Uncommon
  return "text-gray-400"; // Common
};

export default function StoryClimbPage() {
  const router = useRouter();
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  
  useEffect(() => {
    const tree = generateTestChapterTree();
    setNodes(tree);
    const current = tree.find(n => n.current);
    if (current) {
      setSelectedNode(current);
    }
  }, []);
  
  const handleNodeClick = (node: StoryNode) => {
    if (node.completed || node.available || node.current) {
      setSelectedNode(node);
    }
  };
  
  const handleStartMission = () => {
    if (selectedNode?.available || selectedNode?.current) {
      console.log("Starting mission at node", selectedNode.id);
      // In production: router.push(`/battle?nodeId=${selectedNode.id}`);
    }
  };
  
  // Calculate canvas dimensions
  const canvasWidth = 1200;
  const canvasHeight = nodes.length > 0 ? Math.max(...nodes.map(n => n.y)) + 200 : 800;
  const centerX = canvasWidth / 2;
  
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Effects - matching contracts page */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl" />
        
        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 35px,
                rgba(250, 182, 23, 0.03) 35px,
                rgba(250, 182, 23, 0.03) 70px
              )
            `,
          }}
        />
        
        {/* Animated particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${15 + Math.random() * 10}s`
              }}
            >
              <div className="w-1 h-1 bg-yellow-400/30 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 flex h-screen">
        {/* Left Panel - Node Tree */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-gray-900/50 backdrop-blur-md border-b border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/scrap-yard')}
                  className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-yellow-400 rounded-lg transition-all text-gray-400 hover:text-white"
                >
                  ← Back
                </button>
                <div>
                  <h1 className="text-2xl font-bold font-orbitron bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                    Chapter 1 Test
                  </h1>
                  <p className="text-gray-400 text-sm">Story Mode Campaign</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
                  Progress: 25%
                </div>
              </div>
            </div>
          </div>
          
          {/* Node Canvas */}
          <div className="flex-1 overflow-auto bg-gray-900/20" style={{ scrollbarWidth: 'thin' }}>
            <div className="relative" style={{ width: canvasWidth, height: canvasHeight, margin: '0 auto' }}>
              {/* Draw connections */}
              <svg className="absolute inset-0 pointer-events-none" width={canvasWidth} height={canvasHeight}>
                {nodes.map(node => 
                  node.connections.map(targetId => {
                    const target = nodes.find(n => n.id === targetId);
                    if (!target) return null;
                    
                    const isActive = node.completed || node.current || node.available;
                    const isHovered = hoveredNode === node.id || hoveredNode === targetId;
                    
                    return (
                      <line
                        key={`${node.id}-${targetId}`}
                        x1={centerX + node.x}
                        y1={node.y + 40}
                        x2={centerX + target.x}
                        y2={target.y + 40}
                        stroke={isHovered ? "#facc15" : isActive ? "#4b5563" : "#1f2937"}
                        strokeWidth={isHovered ? "3" : "2"}
                        strokeDasharray={isActive ? "0" : "5,5"}
                        opacity={isHovered ? 1 : isActive ? 0.6 : 0.3}
                      />
                    );
                  })
                )}
              </svg>
              
              {/* Draw nodes */}
              {nodes.map(node => (
                <div
                  key={node.id}
                  className={`absolute cursor-pointer transition-all duration-200 ${
                    node.completed || node.available || node.current ? 'hover:scale-110' : 'cursor-not-allowed'
                  }`}
                  style={{
                    left: centerX + node.x - 40,
                    top: node.y,
                    zIndex: selectedNode?.id === node.id ? 20 : 10
                  }}
                  onClick={() => handleNodeClick(node)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <div className={`
                    w-20 h-20 rounded-xl border-2 flex items-center justify-center
                    ${getNodeStyle(node)}
                    ${selectedNode?.id === node.id ? 'ring-4 ring-yellow-400/50' : ''}
                    transition-all duration-200
                  `}>
                    <span className="text-2xl">{getNodeIcon(node.type)}</span>
                    {node.type === "boss" && (
                      <div className="absolute -top-2 -right-2 text-xl">👑</div>
                    )}
                    {node.current && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-500 rounded text-xs font-bold">
                        HERE
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Panel - Node Details */}
        <div className="w-96 bg-gray-900/50 backdrop-blur-md border-l border-gray-800 flex flex-col">
          {selectedNode ? (
            <>
              {/* Node Header */}
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getNodeIcon(selectedNode.type)}</span>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-yellow-400 font-orbitron">
                      {selectedNode.name}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Stage {selectedNode.level} • Difficulty {selectedNode.difficulty}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Node Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Enemy Preview */}
                {selectedNode.enemy && (
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">
                      Enemy Forces
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                        <Image
                          src={selectedNode.enemy.image}
                          alt={selectedNode.enemy.name}
                          width={96}
                          height={96}
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white">{selectedNode.enemy.name}</p>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Power</span>
                            <span className="text-red-400 font-bold">{selectedNode.enemy.power}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Rewards */}
                {selectedNode.rewards && (
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">
                      Victory Rewards
                    </h3>
                    <div className="space-y-2">
                      {selectedNode.rewards.gold && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 flex items-center gap-2">
                            <span className="text-yellow-400">💰</span> Gold
                          </span>
                          <span className={`font-bold ${getRewardColor(selectedNode.rewards.gold)}`}>
                            {selectedNode.rewards.gold.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedNode.rewards.xp && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 flex items-center gap-2">
                            <span className="text-blue-400">⭐</span> Experience
                          </span>
                          <span className={`font-bold ${getRewardColor(selectedNode.rewards.xp)}`}>
                            +{selectedNode.rewards.xp} XP
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Node Status */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">
                    Mission Status
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.completed && (
                      <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-bold">
                        ✓ Completed
                      </span>
                    )}
                    {selectedNode.current && (
                      <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-bold animate-pulse">
                        Current Position
                      </span>
                    )}
                    {selectedNode.available && !selectedNode.current && (
                      <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-sm font-bold">
                        Available
                      </span>
                    )}
                    {!selectedNode.completed && !selectedNode.available && !selectedNode.current && (
                      <span className="px-3 py-1 bg-gray-600/20 text-gray-400 rounded-full text-sm font-bold">
                        🔒 Locked
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <div className="p-6 border-t border-gray-800">
                {(selectedNode.available || selectedNode.current) && !selectedNode.completed ? (
                  <button
                    onClick={handleStartMission}
                    className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold rounded-lg transition-all transform hover:scale-105 font-orbitron uppercase tracking-wider"
                  >
                    {selectedNode.type === "battle" || selectedNode.type === "boss" ? "Enter Battle" :
                     selectedNode.type === "shop" ? "Visit Shop" :
                     selectedNode.type === "rest" ? "Rest Here" :
                     selectedNode.type === "event" ? "Investigate" :
                     selectedNode.type === "treasure" ? "Claim Treasure" :
                     "Enter Stage"}
                  </button>
                ) : selectedNode.completed ? (
                  <div className="text-center text-gray-500">
                    <p className="text-sm">Mission Complete</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <p className="text-sm">Complete previous stages to unlock</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>Select a node to view details</p>
            </div>
          )}
        </div>
      </div>
      
      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}