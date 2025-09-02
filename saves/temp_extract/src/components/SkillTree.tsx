"use client";

import React from "react";

type SkillNode = {
  id: string;
  name: string;
  icon: string;
  description: string;
  level: number;
  x: number;
  y: number;
  requires?: string[];
  path: "combat" | "economy" | "tech";
  unlocked: boolean;
};

type SkillTreeProps = {
  currentLevel: number;
  unlockedNodes?: string[];
};

const skillNodes: SkillNode[] = [
  // Starting Node
  { id: "start", name: "Basic Training", icon: "⭐", description: "+1 gold/hr", level: 1, x: 50, y: 10, path: "economy", unlocked: false },
  
  // Combat Path (Left)
  { id: "combat1", name: "Combat Ready", icon: "⚔️", description: "+10 Attack", level: 2, x: 20, y: 25, requires: ["start"], path: "combat", unlocked: false },
  { id: "combat2", name: "Armor Up", icon: "🛡️", description: "+15 Defense", level: 3, x: 15, y: 40, requires: ["combat1"], path: "combat", unlocked: false },
  { id: "combat3", name: "Berserker", icon: "🔥", description: "+25 Attack, -5 Defense", level: 5, x: 10, y: 55, requires: ["combat2"], path: "combat", unlocked: false },
  { id: "combat4", name: "Fortress", icon: "🏰", description: "+30 Defense", level: 7, x: 20, y: 70, requires: ["combat2"], path: "combat", unlocked: false },
  { id: "combat5", name: "Warlord", icon: "👑", description: "+50 Attack, +20 Defense", level: 10, x: 15, y: 85, requires: ["combat3", "combat4"], path: "combat", unlocked: false },
  
  // Economy Path (Center)
  { id: "econ1", name: "Investor", icon: "💰", description: "+2 gold/hr", level: 2, x: 50, y: 25, requires: ["start"], path: "economy", unlocked: false },
  { id: "econ2", name: "Merchant", icon: "🏪", description: "-10% market fees", level: 3, x: 50, y: 40, requires: ["econ1"], path: "economy", unlocked: false },
  { id: "econ3", name: "Banker", icon: "🏦", description: "+5% interest rate", level: 4, x: 45, y: 55, requires: ["econ2"], path: "economy", unlocked: false },
  { id: "econ4", name: "Trader", icon: "📈", description: "+10% stock gains", level: 6, x: 55, y: 55, requires: ["econ2"], path: "economy", unlocked: false },
  { id: "econ5", name: "Tycoon", icon: "🎩", description: "+10 gold/hr, No fees", level: 9, x: 50, y: 70, requires: ["econ3", "econ4"], path: "economy", unlocked: false },
  { id: "econ6", name: "Mogul", icon: "💎", description: "Double all gold income", level: 10, x: 50, y: 85, requires: ["econ5"], path: "economy", unlocked: false },
  
  // Tech Path (Right)
  { id: "tech1", name: "Engineer", icon: "🔧", description: "+1 craft slot", level: 2, x: 80, y: 25, requires: ["start"], path: "tech", unlocked: false },
  { id: "tech2", name: "Inventor", icon: "⚡", description: "-20% craft time", level: 3, x: 85, y: 40, requires: ["tech1"], path: "tech", unlocked: false },
  { id: "tech3", name: "Scientist", icon: "🔬", description: "+15% success rate", level: 5, x: 90, y: 55, requires: ["tech2"], path: "tech", unlocked: false },
  { id: "tech4", name: "Alchemist", icon: "⚗️", description: "-30% essence cost", level: 6, x: 80, y: 70, requires: ["tech2"], path: "tech", unlocked: false },
  { id: "tech5", name: "Master Crafter", icon: "🏆", description: "+3 slots, 100% success", level: 10, x: 85, y: 85, requires: ["tech3", "tech4"], path: "tech", unlocked: false },
  
  // Cross-path connections
  { id: "hybrid1", name: "Warrior Merchant", icon: "⚔️💰", description: "+15 Attack, +3 gold/hr", level: 8, x: 35, y: 60, requires: ["combat2", "econ2"], path: "combat", unlocked: false },
  { id: "hybrid2", name: "Tech Warrior", icon: "⚡⚔️", description: "+20 Attack, +1 slot", level: 8, x: 65, y: 60, requires: ["tech2", "combat2"], path: "tech", unlocked: false },
];

export default function SkillTree({ currentLevel, unlockedNodes = [] }: SkillTreeProps) {
  const getNodeStatus = (node: SkillNode) => {
    if (node.level <= currentLevel) return "unlocked";
    if (node.level === currentLevel + 1) return "available";
    return "locked";
  };

  const getPathColor = (path: string) => {
    switch (path) {
      case "combat": return "from-red-500 to-orange-500";
      case "economy": return "from-yellow-500 to-green-500";
      case "tech": return "from-blue-500 to-purple-500";
      default: return "from-gray-500 to-gray-600";
    }
  };

  const renderConnection = (fromNode: SkillNode, toId: string) => {
    const toNode = skillNodes.find(n => n.id === toId);
    if (!toNode) return null;

    const fromUnlocked = fromNode.level <= currentLevel;
    const toUnlocked = toNode.level <= currentLevel;
    const isActive = fromUnlocked && toUnlocked;

    return (
      <line
        key={`${fromNode.id}-${toId}`}
        x1={`${fromNode.x}%`}
        y1={`${fromNode.y}%`}
        x2={`${toNode.x}%`}
        y2={`${toNode.y}%`}
        stroke={isActive ? "#facc15" : "#374151"}
        strokeWidth="2"
        strokeDasharray={isActive ? "0" : "5,5"}
        opacity={isActive ? 1 : 0.3}
      />
    );
  };

  return (
    <div className="bg-gray-900/50 rounded-lg p-4">
      <h4 className="text-lg font-bold text-yellow-400 mb-4">Skill Tree</h4>
      
      <div className="relative w-full" style={{ paddingBottom: "75%" }}>
        <svg className="absolute inset-0 w-full h-full">
          {/* Render connections */}
          {skillNodes.map(node => 
            node.requires?.map(reqId => renderConnection(node, reqId))
          )}
          
          {/* Render nodes */}
          {skillNodes.map(node => {
            const status = getNodeStatus(node);
            const isUnlocked = status === "unlocked";
            const isAvailable = status === "available";
            
            return (
              <g key={node.id}>
                {/* Node background */}
                <circle
                  cx={`${node.x}%`}
                  cy={`${node.y}%`}
                  r="18"
                  className={`
                    ${isUnlocked ? `fill-gradient ${getPathColor(node.path)}` : 
                      isAvailable ? "fill-gray-700" : "fill-gray-800"}
                    ${isAvailable ? "stroke-yellow-500 stroke-2" : "stroke-gray-600 stroke-1"}
                  `}
                  fill={isUnlocked ? "url(#gradient)" : undefined}
                />
                
                {/* Node icon */}
                <text
                  x={`${node.x}%`}
                  y={`${node.y}%`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`text-lg select-none ${
                    isUnlocked ? "fill-black" : "fill-gray-500"
                  }`}
                >
                  {node.icon}
                </text>
                
                {/* Node level */}
                <text
                  x={`${node.x}%`}
                  y={`${node.y + 5}%`}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-400 select-none"
                >
                  Lv.{node.level}
                </text>
                
                {/* Hover tooltip */}
                <g className="opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                  <rect
                    x={`${node.x - 15}%`}
                    y={`${node.y - 10}%`}
                    width="30%"
                    height="8%"
                    fill="black"
                    fillOpacity="0.9"
                    rx="4"
                  />
                  <text
                    x={`${node.x}%`}
                    y={`${node.y - 7}%`}
                    textAnchor="middle"
                    className="text-[10px] fill-yellow-400 font-bold"
                  >
                    {node.name}
                  </text>
                  <text
                    x={`${node.x}%`}
                    y={`${node.y - 5}%`}
                    textAnchor="middle"
                    className="text-[8px] fill-gray-300"
                  >
                    {node.description}
                  </text>
                </g>
              </g>
            );
          })}
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="gradient-combat" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
            <linearGradient id="gradient-economy" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
            <linearGradient id="gradient-tech" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Path Legend */}
      <div className="flex justify-around mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"></div>
          <span className="text-gray-400">Combat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-r from-yellow-500 to-green-500 rounded-full"></div>
          <span className="text-gray-400">Economy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          <span className="text-gray-400">Technology</span>
        </div>
      </div>
    </div>
  );
}