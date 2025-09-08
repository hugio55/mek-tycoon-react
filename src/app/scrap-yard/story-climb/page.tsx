"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import IndustrialMissionCard from "./IndustrialMissionCard";
import { StoryNode, Connection, SavedStoryMode } from "./types";
import { getNodeSize, getNodeIcon } from "../../../lib/story-tree-utils";

export default function StoryClimbPage() {
  const router = useRouter();
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [savedTrees, setSavedTrees] = useState<SavedStoryMode[]>([]);
  const [currentTree, setCurrentTree] = useState<string>('');
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1000, height: 1000 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isMapPanning, setIsMapPanning] = useState(false);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });

  // Track canvas dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        setCanvasDimensions({
          width: canvasRef.current.offsetWidth || 1000,
          height: canvasRef.current.offsetHeight || 1000
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Load saved trees
  useEffect(() => {
    const saved = localStorage.getItem('storyClimbTrees');
    if (saved) {
      const trees = JSON.parse(saved);
      setSavedTrees(trees);
      if (trees.length > 0 && !currentTree) {
        loadTree(trees[0]);
      }
    } else {
      // Create default tree
      const defaultTree: SavedStoryMode = {
        name: "Chapter 1",
        chapter: 1,
        data: {
          nodes: [
            { id: 'start', x: 0, y: 100, label: 'START', storyNodeType: 'normal' },
            { id: 'node-1', x: -150, y: 250, label: 'Scout Path', storyNodeType: 'normal' },
            { id: 'node-2', x: 150, y: 250, label: 'Combat Path', storyNodeType: 'normal' },
            { id: 'node-3', x: 0, y: 400, label: 'Convergence', storyNodeType: 'event' },
            { id: 'node-4', x: -150, y: 550, label: 'Left Route', storyNodeType: 'normal' },
            { id: 'node-5', x: 150, y: 550, label: 'Right Route', storyNodeType: 'normal' },
            { id: 'node-6', x: 0, y: 700, label: 'Elite Guard', storyNodeType: 'boss' },
            { id: 'node-7', x: -100, y: 850, label: 'Supply Cache', storyNodeType: 'event' },
            { id: 'node-8', x: 100, y: 850, label: 'Preparation', storyNodeType: 'normal' },
            { id: 'node-9', x: 0, y: 1000, label: 'Chapter Boss', storyNodeType: 'final_boss' },
          ],
          connections: [
            { from: 'start', to: 'node-1' },
            { from: 'start', to: 'node-2' },
            { from: 'node-1', to: 'node-3' },
            { from: 'node-2', to: 'node-3' },
            { from: 'node-3', to: 'node-4' },
            { from: 'node-3', to: 'node-5' },
            { from: 'node-4', to: 'node-6' },
            { from: 'node-5', to: 'node-6' },
            { from: 'node-6', to: 'node-7' },
            { from: 'node-6', to: 'node-8' },
            { from: 'node-7', to: 'node-9' },
            { from: 'node-8', to: 'node-9' },
          ]
        }
      };
      setSavedTrees([defaultTree]);
      loadTree(defaultTree);
      localStorage.setItem('storyClimbTrees', JSON.stringify([defaultTree]));
    }
  }, []);

  const loadTree = (tree: SavedStoryMode) => {
    setCurrentTree(tree.name);
    
    // Process nodes for play mode
    const processedNodes = tree.data.nodes.map((node, index) => ({
      ...node,
      index: index,
      completed: index < currentNodeIndex,
      available: index <= currentNodeIndex + 1,
      current: index === currentNodeIndex,
    }));
    
    setNodes(processedNodes);
    setConnections(tree.data.connections);
    
    // Select start node
    const startNode = processedNodes.find(n => n.id === 'start' || n.current);
    if (startNode) {
      setSelectedNode(startNode);
    }
  };

  const handleNodeClick = (node: StoryNode) => {
    if (node.completed || node.available || node.current) {
      setSelectedNode(node);
    }
  };

  const handleStartMission = () => {
    if (selectedNode?.available || selectedNode?.current) {
      console.log("Starting mission at node", selectedNode.id);
      // Simulate progression
      setCurrentNodeIndex(prev => Math.min(prev + 1, nodes.length - 1));
    }
  };

  const getNodeStyle = (node: StoryNode) => {
    // Play mode styling
    if (node.id === 'start' || node.completed) {
      return "from-green-600 to-green-700 border-green-500";
    }
    if (node.current) {
      return "from-blue-500 to-blue-600 border-blue-400 animate-pulse";
    }
    
    const opacity = node.available ? '' : 'opacity-50';
    switch (node.storyNodeType) {
      case 'event': return `from-purple-600 to-purple-700 border-purple-500 ${opacity}`;
      case 'boss': return `from-red-600 to-red-700 border-red-500 ${opacity}`;
      case 'final_boss': return `from-orange-600 via-red-600 to-purple-600 border-yellow-500 ${opacity}`;
      default: return node.available 
        ? "from-yellow-500 to-amber-600 border-yellow-400"
        : "from-gray-700 to-gray-800 border-gray-600 opacity-50";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Cinematic Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Deep space background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-950" />
        
        {/* Animated scan lines */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(250, 182, 23, 0.1) 2px,
            rgba(250, 182, 23, 0.1) 4px
          )`,
          animation: 'scan 8s linear infinite',
        }} />
        
        {/* Holographic overlay */}
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(250, 182, 23, 0.02) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.02) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(34, 211, 238, 0.01) 0%, transparent 50%)
          `,
        }} />
      </div>
      {/* Header - Industrial Command Panel */}
      <div className="relative bg-black/90 border-b-2 border-yellow-500/30 overflow-hidden" style={{
        background: `
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 100px,
            rgba(250, 182, 23, 0.03) 100px,
            rgba(250, 182, 23, 0.03) 101px
          ),
          linear-gradient(to bottom, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.9))
        `,
      }}>
        {/* Header corner accents */}
        <div className="absolute top-0 left-0 w-20 h-1 bg-gradient-to-r from-yellow-500 to-transparent" />
        <div className="absolute top-0 right-0 w-20 h-1 bg-gradient-to-l from-yellow-500 to-transparent" />
        
        <div className="relative px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/scrap-yard')}
              className="group relative px-4 py-2 bg-black/50 border border-yellow-500/30 hover:border-yellow-500 transition-all overflow-hidden"
              style={{
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 100%, 8px 100%)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <span className="relative flex items-center gap-2 font-bold text-yellow-400 uppercase tracking-wider text-sm">
                <span className="text-lg">◄</span> RETREAT
              </span>
            </button>
            
            <div className="relative">
              <div className="absolute -inset-2 bg-yellow-500/5 blur-xl" />
              <h1 className="relative text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 uppercase tracking-wider" 
                style={{ fontFamily: "'Orbitron', sans-serif" }}>
                {currentTree || 'CHAPTER 01'}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
                  SECTOR LIBERATION
                </p>
                <div className="h-3 w-px bg-yellow-500/30" />
                <p className="text-xs text-yellow-500 font-bold">
                  {nodes.filter(n => n.completed).length} / {nodes.length} CLEARED
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Mission Status Indicators */}
            <div className="flex gap-2">
              <div className="px-3 py-1.5 bg-green-900/30 border border-green-500/30 rounded">
                <span className="text-xs text-green-400 font-bold">ACTIVE</span>
              </div>
              <div className="px-3 py-1.5 bg-yellow-900/30 border border-yellow-500/30 rounded">
                <span className="text-xs text-yellow-400 font-bold">THREAT: HIGH</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-32">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">COMPLETION</div>
              <div className="h-2 bg-black/60 border border-yellow-500/20 relative overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-500"
                  style={{ width: `${(nodes.filter(n => n.completed).length / nodes.length) * 100}%` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
        </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="relative flex flex-col lg:flex-row h-[calc(100vh-88px)] overflow-hidden">
        {/* Left Column - Holographic Mission Map */}
        <div className="flex-1 min-h-[400px] lg:min-h-0 min-w-0 relative overflow-hidden" style={{
          background: `
            linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.9) 100%),
            radial-gradient(circle at 30% 70%, rgba(250, 182, 23, 0.03) 0%, transparent 40%)
          `,
        }}>
          {/* Map Frame Decoration */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner brackets */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-yellow-500/50" />
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-yellow-500/50" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-yellow-500/50" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-yellow-500/50" />
            
            {/* HUD overlay elements */}
            <div className="absolute top-8 left-8 text-[10px] text-yellow-500/60 font-mono uppercase tracking-wider">
              <div>MAP // TACTICAL VIEW</div>
              <div className="text-gray-500">ZOOM: 100%</div>
            </div>
            
            <div className="absolute top-8 right-8 text-right text-[10px] text-yellow-500/60 font-mono uppercase tracking-wider">
              <div>NODE COUNT: {nodes.length}</div>
              <div className="text-gray-500">PATHS: {connections.length}</div>
            </div>
            
            {/* Animated scan effect */}
            <div className="absolute inset-0 opacity-10" style={{
              background: `linear-gradient(to bottom, transparent 0%, rgba(250, 182, 23, 0.1) 50%, transparent 100%)`,
              height: '20%',
              animation: 'scan 4s linear infinite',
            }} />
          </div>
          
          <div className="relative flex-1 min-h-[400px] lg:min-h-0 min-w-0 lg:border-r-2 border-b lg:border-b-0 border-yellow-500/20 overflow-auto">
          <div className="absolute inset-0 flex items-center justify-center p-8">
            {/* Canvas Container with holographic effect */}
            <div 
              ref={canvasRef}
              className="relative w-full h-full"
              style={{ 
                minWidth: '600px',
                minHeight: '800px',
                maxWidth: '1200px',
                maxHeight: '1400px',
                filter: 'contrast(1.1)',
              }}
            >
              {/* Holographic Grid Background */}
              <div className="absolute inset-0">
                <svg className="w-full h-full">
                  <defs>
                    {/* Main grid pattern */}
                    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(250, 182, 23, 0.1)" strokeWidth="0.5"/>
                    </pattern>
                    {/* Secondary grid for depth */}
                    <pattern id="grid2" width="100" height="100" patternUnits="userSpaceOnUse">
                      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(34, 211, 238, 0.05)" strokeWidth="1"/>
                    </pattern>
                    {/* Glow filter for nodes */}
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  <rect width="100%" height="100%" fill="url(#grid2)" opacity="0.5" />
                </svg>
              </div>

              {/* Connections with energy flow effect */}
              <svg className="absolute inset-0 pointer-events-none">
                <defs>
                  <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(250, 182, 23, 0.6)" />
                    <stop offset="50%" stopColor="rgba(250, 182, 23, 0.3)" />
                    <stop offset="100%" stopColor="rgba(250, 182, 23, 0.6)" />
                  </linearGradient>
                  <linearGradient id="inactiveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(100, 100, 100, 0.2)" />
                    <stop offset="100%" stopColor="rgba(100, 100, 100, 0.1)" />
                  </linearGradient>
                </defs>
                {connections.map((conn, idx) => {
                  const fromNode = nodes.find(n => n.id === conn.from);
                  const toNode = nodes.find(n => n.id === conn.to);
                  if (!fromNode || !toNode) return null;
                  
                  // Use tracked canvas dimensions
                  const centerX = canvasDimensions.width / 2;
                  
                  const x1 = centerX + fromNode.x;
                  const y1 = canvasDimensions.height - fromNode.y - 100;
                  const x2 = centerX + toNode.x;
                  const y2 = canvasDimensions.height - toNode.y - 100;
                  
                  const isActive = fromNode.completed || fromNode.current || fromNode.available;
                  const isHighlighted = (selectedNode?.id === fromNode.id || selectedNode?.id === toNode.id);
                  
                  return (
                    <g key={idx}>
                      {/* Shadow/glow for active connections */}
                      {isActive && (
                        <line
                          x1={x1} y1={y1} x2={x2} y2={y2}
                          stroke="rgba(250, 182, 23, 0.2)"
                          strokeWidth="6"
                          filter="blur(2px)"
                        />
                      )}
                      {/* Main connection line */}
                      <line
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke={isActive ? "url(#activeGradient)" : "url(#inactiveGradient)"}
                        strokeWidth={isHighlighted ? "3" : "2"}
                        strokeDasharray={isActive ? "0" : "5,5"}
                        opacity={isHighlighted ? 1 : isActive ? 0.7 : 0.3}
                        className={isActive ? "transition-all duration-300" : ""}
                      />
                      {/* Energy pulse animation for active paths */}
                      {isActive && fromNode.current && (
                        <circle r="3" fill="rgba(250, 182, 23, 0.8)">
                          <animateMotion dur="2s" repeatCount="indefinite">
                            <mpath href={`#path-${idx}`} />
                          </animateMotion>
                        </circle>
                      )}
                      <path
                        id={`path-${idx}`}
                        d={`M ${x1} ${y1} L ${x2} ${y2}`}
                        fill="none"
                        stroke="none"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Nodes with holographic styling */}
              {nodes.map(node => {
                const nodeSize = getNodeSize(node.storyNodeType);
                // Use tracked canvas dimensions
                const centerX = canvasDimensions.width / 2;
                
                const nodeX = centerX + node.x - nodeSize / 2;
                const nodeY = canvasDimensions.height - node.y - 100 - nodeSize / 2;
                
                const isHovered = hoveredNode === node.id;
                const isSelected = selectedNode?.id === node.id;
                
                return (
                  <div
                    key={node.id}
                    className={`absolute transition-all duration-300 
                      ${node.completed || node.available || node.current ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    style={{
                      left: `${nodeX}px`,
                      top: `${nodeY}px`,
                      width: `${nodeSize}px`,
                      height: `${nodeSize}px`,
                      transform: isHovered ? 'scale(1.15)' : isSelected ? 'scale(1.1)' : 'scale(1)',
                      zIndex: isHovered || isSelected ? 10 : 1,
                    }}
                    onClick={() => handleNodeClick(node)}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* Holographic glow effect */}
                    {(isHovered || isSelected || node.current) && (
                      <div className="absolute inset-0 rounded-xl" style={{
                        background: node.storyNodeType === 'final_boss' 
                          ? 'radial-gradient(circle, rgba(250, 182, 23, 0.3) 0%, transparent 70%)'
                          : node.storyNodeType === 'boss'
                          ? 'radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%)'
                          : node.storyNodeType === 'event'
                          ? 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)'
                          : 'radial-gradient(circle, rgba(250, 182, 23, 0.2) 0%, transparent 70%)',
                        filter: 'blur(8px)',
                        animation: node.current ? 'pulse 2s infinite' : '',
                      }} />
                    )}
                    
                    {/* Node container with industrial frame */}
                    <div className={`relative w-full h-full rounded-xl border-2 overflow-hidden
                      ${getNodeStyle(node)}
                      ${isSelected ? 'ring-4 ring-yellow-400/60 shadow-2xl shadow-yellow-400/30' : ''}
                    `}
                    style={{
                      background: `
                        linear-gradient(135deg, 
                          ${node.completed ? 'rgba(34, 197, 94, 0.2)' : 
                            node.current ? 'rgba(59, 130, 246, 0.2)' :
                            node.available ? 'rgba(250, 182, 23, 0.1)' :
                            'rgba(0, 0, 0, 0.3)'} 0%,
                          rgba(0, 0, 0, 0.6) 100%)
                      `,
                      backdropFilter: node.completed || node.available || node.current ? 'blur(4px)' : '',
                    }}>
                      {/* Inner holographic pattern */}
                      <div className="absolute inset-0 opacity-30" style={{
                        backgroundImage: `
                          repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 3px,
                            rgba(255, 255, 255, 0.03) 3px,
                            rgba(255, 255, 255, 0.03) 6px
                          )
                        `,
                      }} />
                      
                      {/* Node content */}
                      <div className="relative h-full flex flex-col items-center justify-center p-2">
                        <span className="text-2xl drop-shadow-lg" style={{
                          filter: node.storyNodeType === 'final_boss' || node.storyNodeType === 'boss' 
                            ? 'drop-shadow(0 0 8px rgba(250, 182, 23, 0.5))' 
                            : '',
                        }}>
                          {getNodeIcon(node.storyNodeType)}
                        </span>
                        <span className="text-xs font-bold mt-1 text-center px-1 uppercase tracking-wider"
                          style={{ 
                            fontFamily: "'Orbitron', sans-serif",
                            textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
                          }}>
                          {node.label}
                        </span>
                      </div>
                      
                      {/* Status badges */}
                      {node.current && (
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 rounded-full text-xs font-bold animate-pulse uppercase tracking-wider"
                          style={{ 
                            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
                            fontFamily: "'Orbitron', sans-serif",
                          }}>
                          ACTIVE
                        </div>
                      )}
                      {node.id === 'start' && (
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 rounded-full text-xs font-bold uppercase tracking-wider"
                          style={{ 
                            boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)',
                            fontFamily: "'Orbitron', sans-serif",
                          }}>
                          ORIGIN
                        </div>
                      )}
                      
                      {/* Corner accents for special nodes */}
                      {(node.storyNodeType === 'boss' || node.storyNodeType === 'final_boss') && (
                        <>
                          <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-yellow-400" />
                          <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-yellow-400" />
                          <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-yellow-400" />
                          <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-yellow-400" />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
          
          {/* Map Controls Overlay */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <button className="px-3 py-1.5 bg-black/80 border border-yellow-500/30 hover:border-yellow-500 text-xs text-yellow-400 font-bold uppercase tracking-wider transition-all"
              style={{ fontFamily: "'Orbitron', sans-serif" }}>
              <span className="text-lg">+</span>
            </button>
            <button className="px-3 py-1.5 bg-black/80 border border-yellow-500/30 hover:border-yellow-500 text-xs text-yellow-400 font-bold uppercase tracking-wider transition-all"
              style={{ fontFamily: "'Orbitron', sans-serif" }}>
              <span className="text-lg">-</span>
            </button>
            <button className="px-3 py-1.5 bg-black/80 border border-yellow-500/30 hover:border-yellow-500 text-xs text-yellow-400 font-bold uppercase tracking-wider transition-all"
              style={{ fontFamily: "'Orbitron', sans-serif" }}>
              CENTER
            </button>
          </div>
        </div>

        {/* Right Column - Tactical Briefing Panel */}
        <div className="w-full lg:w-[400px] xl:w-[450px] 2xl:w-[500px] min-h-[300px] lg:min-h-0 relative flex flex-col overflow-hidden"
          style={{
            background: `
              linear-gradient(to right, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.9)),
              radial-gradient(circle at 70% 30%, rgba(250, 182, 23, 0.02) 0%, transparent 40%)
            `,
          }}>
          {/* Panel frame decoration */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Vertical accent line */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-yellow-500/50 to-transparent" />
            
            {/* Panel header accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-yellow-500/50 via-yellow-500/20 to-transparent" />
          </div>
          <IndustrialMissionCard 
            nodeData={selectedNode}
            onStartMission={handleStartMission}
            simulateProgress={() => setCurrentNodeIndex(prev => Math.min(prev + 1, nodes.length - 1))}
          />
        </div>
      </div>
    </div>
  );
}