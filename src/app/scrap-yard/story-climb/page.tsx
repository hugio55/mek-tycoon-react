"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Node types matching the story builder
type StoryNodeType = 'normal' | 'event' | 'boss' | 'final_boss';

interface StoryNode {
  id: string;
  x: number;
  y: number;
  label: string;
  index?: number;
  storyNodeType?: StoryNodeType;
  completed?: boolean;
  available?: boolean;
  current?: boolean;
}

interface Connection {
  from: string;
  to: string;
}

interface SavedStoryMode {
  name: string;
  chapter: number;
  data: {
    nodes: StoryNode[];
    connections: Connection[];
  };
}

// Get node icon based on type
const getNodeIcon = (type?: StoryNodeType) => {
  switch (type) {
    case 'event': return '❓';
    case 'boss': return '👹';
    case 'final_boss': return '👑';
    case 'normal':
    default: return '⚔️';
  }
};

// Get node size multiplier
const getNodeSize = (type?: StoryNodeType) => {
  switch (type) {
    case 'event': return 2;
    case 'boss': return 3;
    case 'final_boss': return 4;
    case 'normal':
    default: return 1;
  }
};

// Get node style based on state
const getNodeStyle = (node: StoryNode) => {
  if (node.id === 'start') {
    return "from-green-600 to-green-700 border-green-500";
  }
  if (node.completed) {
    return "from-green-600 to-green-700 border-green-500";
  }
  if (node.current) {
    return "from-blue-500 to-blue-600 border-blue-400 animate-pulse";
  }
  if (node.available) {
    return "from-yellow-500 to-amber-600 border-yellow-400";
  }
  return "from-gray-700 to-gray-800 border-gray-600 opacity-50";
};

// Get reward color
const getRewardColor = (value: number): string => {
  if (value >= 1000) return "text-orange-400";
  if (value >= 500) return "text-purple-400";
  if (value >= 250) return "text-blue-400";
  if (value >= 100) return "text-green-400";
  return "text-gray-400";
};

export default function StoryClimbPage() {
  const router = useRouter();
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [currentChapter, setCurrentChapter] = useState<SavedStoryMode | null>(null);
  const [savedStoryModes, setSavedStoryModes] = useState<SavedStoryMode[]>([]);
  const cameraOffset = 0; // Fixed camera, no scrolling
  const [canvasHeight, setCanvasHeight] = useState(600); // Default height
  const [currentNodeIndex, setCurrentNodeIndex] = useState(1); // Player's current progress
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Load saved story modes from localStorage or create sample data
  useEffect(() => {
    console.log('Loading story data...');
    
    let storyData: SavedStoryMode | null = null;
    
    // Try to load from localStorage first
    const saved = localStorage.getItem('savedStoryModes');
    console.log('Found saved data:', saved);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedStoryMode[];
        setSavedStoryModes(parsed);
        
        // Find and load "Chapter 1" or first chapter
        storyData = parsed.find(s => 
          s.name.toLowerCase().includes('chapter 1') || 
          s.chapter === 1
        ) || null;
        
        console.log('Found chapter data:', storyData);
      } catch (error) {
        console.error('Error parsing saved story modes:', error);
      }
    }
    
    // If no data found, create sample data for testing
    if (!storyData) {
      console.log('Creating sample story data...');
      
      storyData = {
        name: "Chapter 1",
        chapter: 1,
        data: {
          nodes: [
            { id: 'start', x: 0, y: -50, label: 'START', storyNodeType: 'normal' },
            { id: 'node-1', x: 0, y: -150, label: 'Stage 1', storyNodeType: 'normal' },
            { id: 'node-2', x: 0, y: -250, label: 'Stage 2', storyNodeType: 'normal' },
            { id: 'node-3', x: 0, y: -350, label: 'Stage 3', storyNodeType: 'event' },
            { id: 'node-4', x: 0, y: -450, label: 'Stage 4', storyNodeType: 'normal' },
            { id: 'node-5', x: 0, y: -550, label: 'Boss', storyNodeType: 'boss' },
            { id: 'node-6', x: 0, y: -650, label: 'Final', storyNodeType: 'final_boss' },
          ],
          connections: [
            { from: 'start', to: 'node-1' },
            { from: 'node-1', to: 'node-2' },
            { from: 'node-2', to: 'node-3' },
            { from: 'node-3', to: 'node-4' },
            { from: 'node-4', to: 'node-5' },
            { from: 'node-5', to: 'node-6' },
          ]
        }
      };
    }
    
    // Set the current chapter
    setCurrentChapter(storyData);
    
    // Process nodes to add game state
    const processedNodes = storyData.data.nodes.map((node, index) => ({
      ...node,
      index: index + 1,
      completed: index < currentNodeIndex, // Nodes before current position are completed
      available: index === currentNodeIndex || index === currentNodeIndex + 1, // Current and next node available
      current: index === currentNodeIndex, // Current position
    }));
    
    console.log('Processed nodes:', processedNodes);
    
    setNodes(processedNodes);
    setConnections(storyData.data.connections);
    
    // Select current node
    const current = processedNodes.find(n => n.current);
    if (current) {
      setSelectedNode(current);
      // Fixed camera - no movement needed
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
  
  
  // Function to simulate progression (for testing)
  const simulateProgress = () => {
    setCurrentNodeIndex(prev => {
      const next = Math.min(prev + 1, nodes.length - 1);
      // Fixed camera - no movement
      return next;
    });
  };
  
  // Set canvas height to fit viewport minus header (fixed height, no scrolling)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const headerHeight = 200; // Header + right panel header + padding
      const viewportHeight = window.innerHeight - headerHeight;
      setCanvasHeight(Math.max(400, Math.min(viewportHeight, 500))); // Constrain between 400-500px
      
      const handleResize = () => {
        const vh = window.innerHeight - headerHeight;
        setCanvasHeight(Math.max(400, Math.min(vh, 500)));
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  
  // Calculate canvas bounds
  const canvasWidth = 300; // Ultra-thin phone width
  const centerX = 3000; // Center position matching builder
  
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl" />
        
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
        
        {/* Static particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 53) % 100}%`,
                animationDelay: `${(i * 0.5) % 10}s`,
                animationDuration: `${15 + (i * 0.7) % 10}s`
              }}
            >
              <div className="w-1 h-1 bg-yellow-400/30 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 flex h-screen">
        {/* Left Panel - Fixed Canvas Area */}
        <div className="flex-1 flex flex-col max-w-[500px] mx-auto">
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
                    {currentChapter?.name || 'Chapter 1'}
                  </h1>
                  <p className="text-gray-400 text-sm">
                    {nodes.filter(n => n.completed).length} Missions Completed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
                  Progress: {Math.round((nodes.filter(n => n.completed).length / nodes.length) * 100)}%
                </div>
              </div>
            </div>
          </div>
          
          {/* Node Canvas - Fixed Height, No Scrolling */}
          <div className="bg-gray-900/20 flex justify-center relative overflow-hidden" style={{ height: `${canvasHeight}px` }}>
            {/* Fade gradient at top */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black via-black/50 to-transparent z-20 pointer-events-none" />
            
            
            <div 
              ref={canvasRef}
              className="relative" 
              style={{ 
                width: `${canvasWidth}px`, 
                height: `${canvasHeight}px`,
                transform: `translateY(${cameraOffset}px)`,
                transition: 'transform 0.3s ease-out'
              }}
            >
              
              {/* Draw connections */}
              <svg 
                className="absolute pointer-events-none" 
                width={canvasWidth} 
                height="3000"
                style={{ top: '-1000px' }}
              >
                {connections.map((conn, idx) => {
                  const fromNode = nodes.find(n => n.id === conn.from);
                  const toNode = nodes.find(n => n.id === conn.to);
                  if (!fromNode || !toNode) return null;
                  
                  // Position connections for bottom-up layout
                  const x1 = canvasWidth / 2 + (fromNode.x - centerX);
                  const y1 = canvasHeight - 100 + fromNode.y + cameraOffset; // Apply camera offset
                  const x2 = canvasWidth / 2 + (toNode.x - centerX);
                  const y2 = canvasHeight - 100 + toNode.y + cameraOffset;
                  
                  const isActive = fromNode.completed || fromNode.current || fromNode.available;
                  const isHovered = hoveredNode === fromNode.id || hoveredNode === toNode.id;
                  
                  return (
                    <line
                      key={idx}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isHovered ? "#facc15" : isActive ? "#4b5563" : "#1f2937"}
                      strokeWidth={isHovered ? "3" : "2"}
                      strokeDasharray={isActive ? "0" : "5,5"}
                      opacity={isHovered ? 1 : isActive ? 0.6 : 0.3}
                    />
                  );
                })}
              </svg>
              
              {/* Draw nodes */}
              {nodes.map(node => {
                const size = getNodeSize(node.storyNodeType);
                const baseSize = 60;
                const nodeSize = baseSize * size;
                
                // Position nodes from bottom-up with proper spacing
                const nodeY = canvasHeight - 100 + node.y - nodeSize / 2; // Start from bottom
                const nodeX = canvasWidth / 2 + (node.x - centerX) - nodeSize / 2;
                
                // Apply camera offset to move the world
                const adjustedY = nodeY + cameraOffset;
                
                // Only render nodes that are within the visible area (with some buffer)
                if (adjustedY < -nodeSize - 50 || adjustedY > canvasHeight + 50) {
                  return null; // Don't render off-screen nodes for performance
                }
                
                // Calculate fade based on distance from edges
                let fadeOpacity = 1;
                if (adjustedY < 50) {
                  fadeOpacity = Math.max(0.2, adjustedY / 50);
                } else if (adjustedY > canvasHeight - 50) {
                  fadeOpacity = Math.max(0.2, (canvasHeight - adjustedY) / 50);
                }
                
                return (
                  <div
                    key={node.id}
                    className={`absolute cursor-pointer transition-all duration-200 ${
                      node.completed || node.available || node.current ? 'hover:scale-110' : 'cursor-not-allowed'
                    }`}
                    style={{
                      left: `${nodeX}px`,
                      top: `${adjustedY}px`,
                      width: `${nodeSize}px`,
                      height: `${nodeSize}px`,
                      zIndex: selectedNode?.id === node.id ? 20 : 10,
                      opacity: fadeOpacity,
                      transform: selectedNode?.id === node.id ? 'scale(1.1)' : 'scale(1)'
                    }}
                    onClick={() => handleNodeClick(node)}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <div className={`
                      w-full h-full rounded-xl border-2 flex flex-col items-center justify-center
                      bg-gradient-to-br ${getNodeStyle(node)}
                      ${selectedNode?.id === node.id ? 'ring-4 ring-yellow-400/50 shadow-lg shadow-yellow-400/25' : ''}
                      transition-all duration-200
                    `}>
                      <span className={`text-${size === 1 ? '2xl' : size === 2 ? '3xl' : '4xl'}`}>
                        {getNodeIcon(node.storyNodeType)}
                      </span>
                      <span className="text-xs font-bold mt-1">
                        {node.id === 'start' ? 'START' : (node.index || parseInt(node.id.split('-')[1]) + 1)}
                      </span>
                      {node.current && (
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-500 rounded text-xs font-bold animate-pulse">
                          HERE
                        </div>
                      )}
                      {node.id === 'start' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-green-500 rounded text-xs font-bold">
                          START
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
                  <span className="text-3xl">{getNodeIcon(selectedNode.storyNodeType)}</span>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-yellow-400 font-orbitron">
                      Stage {selectedNode.index || parseInt(selectedNode.id.split('-')[1]) + 1}
                    </h2>
                    <p className="text-gray-400 text-sm capitalize">
                      {selectedNode.storyNodeType || 'Normal'} 
                      {selectedNode.storyNodeType === 'boss' && ' Battle'}
                      {selectedNode.storyNodeType === 'event' && ' Encounter'}
                      {!selectedNode.storyNodeType && ' Battle'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Node Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Enemy Preview for battle nodes */}
                {(!selectedNode.storyNodeType || selectedNode.storyNodeType === 'normal' || selectedNode.storyNodeType === 'boss') && (
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">
                      Enemy Forces
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                        <Image
                          src={`/mek-images/150px/mek${String((parseInt(selectedNode.id.split('-')[1]) * 137 % 1000) + 1).padStart(4, '0')}.png`}
                          alt="Enemy Mek"
                          width={96}
                          height={96}
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white">
                          {selectedNode.storyNodeType === 'boss' ? 'Boss Mek Guardian' : `Mek Opponent #${(parseInt(selectedNode.id.split('-')[1]) * 137 % 1000) + 1}`}
                        </p>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Power</span>
                            <span className="text-red-400 font-bold">
                              {(selectedNode.index || 1) * (selectedNode.storyNodeType === 'boss' ? 150 : 50) + 100}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Event description for event nodes */}
                {selectedNode.storyNodeType === 'event' && (
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">
                      Mystery Event
                    </h3>
                    <p className="text-gray-300">
                      A mysterious encounter awaits. Choose your path wisely...
                    </p>
                  </div>
                )}
                
                {/* Rewards */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">
                    Victory Rewards
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 flex items-center gap-2">
                        <span className="text-yellow-400">💰</span> Gold
                      </span>
                      <span className={`font-bold ${getRewardColor((selectedNode.index || 1) * (selectedNode.storyNodeType === 'boss' ? 500 : 100))}`}>
                        {((selectedNode.index || 1) * (selectedNode.storyNodeType === 'boss' ? 500 : 100)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 flex items-center gap-2">
                        <span className="text-blue-400">⭐</span> Experience
                      </span>
                      <span className={`font-bold ${getRewardColor((selectedNode.index || 1) * 50)}`}>
                        +{(selectedNode.index || 1) * 50} XP
                      </span>
                    </div>
                  </div>
                </div>
                
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
                
                {/* Controls Help */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">
                    Controls
                  </h3>
                  <div className="text-sm text-gray-300 space-y-1">
                    <div>W/S or ↑/↓ - Move view</div>
                    <div>Click nodes to view details</div>
                    <div>Progress unlocks new stages</div>
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
                    {selectedNode.storyNodeType === 'event' ? 'Enter Event' :
                     selectedNode.storyNodeType === 'boss' ? 'Challenge Boss' :
                     'Start Battle'}
                  </button>
                ) : selectedNode.completed ? (
                  <div className="text-center text-gray-500">
                    <p className="text-sm">Stage Complete</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">Complete previous stages to unlock</p>
                    <button 
                      onClick={simulateProgress}
                      className="px-3 py-1 bg-gray-600/50 hover:bg-gray-500/50 text-gray-300 text-xs rounded transition-all"
                    >
                      Debug: Simulate Progress
                    </button>
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