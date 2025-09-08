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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-black/80 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/scrap-yard')}
              className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-yellow-400 rounded-lg transition-all"
            >
              ← Back
            </button>
            
            <div>
              <h1 className="text-2xl font-bold text-yellow-400">
                {currentTree || 'Chapter 1'}
              </h1>
              <p className="text-sm text-gray-400">
                {nodes.filter(n => n.completed).length} Missions Completed
              </p>
            </div>
          </div>
          
          <div className="text-sm text-gray-400">
            Progress: {nodes.filter(n => n.completed).length} / {nodes.length}
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden">
        {/* Left Column - Tree Canvas */}
        <div className="flex-1 min-h-[400px] lg:min-h-0 min-w-0 bg-gray-950/50 lg:border-r border-b lg:border-b-0 border-gray-800 relative overflow-auto">
          <div className="absolute inset-0 flex items-center justify-center p-4">
            {/* Canvas Container */}
            <div 
              ref={canvasRef}
              className="relative w-full h-full"
              style={{ 
                minWidth: '600px',
                minHeight: '800px',
                maxWidth: '1200px',
                maxHeight: '1400px'
              }}
            >
              {/* Background Grid */}
              <div className="absolute inset-0 opacity-5">
                <svg className="w-full h-full">
                  <defs>
                    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Connections */}
              <svg className="absolute inset-0 pointer-events-none">
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
                  
                  return (
                    <line
                      key={idx}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={isActive ? "#6b7280" : "#1f2937"}
                      strokeWidth="2"
                      strokeDasharray={isActive ? "0" : "5,5"}
                      opacity={isActive ? 0.6 : 0.3}
                    />
                  );
                })}
              </svg>

              {/* Nodes */}
              {nodes.map(node => {
                const nodeSize = getNodeSize(node.storyNodeType);
                // Use tracked canvas dimensions
                const centerX = canvasDimensions.width / 2;
                
                const nodeX = centerX + node.x - nodeSize / 2;
                const nodeY = canvasDimensions.height - node.y - 100 - nodeSize / 2;
                
                return (
                  <div
                    key={node.id}
                    className={`absolute cursor-pointer transition-all duration-200 
                      ${node.completed || node.available || node.current ? 'hover:scale-110' : 'cursor-not-allowed'}`}
                    style={{
                      left: `${nodeX}px`,
                      top: `${nodeY}px`,
                      width: `${nodeSize}px`,
                      height: `${nodeSize}px`,
                    }}
                    onClick={() => handleNodeClick(node)}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <div className={`w-full h-full rounded-xl border-2 flex flex-col items-center justify-center
                      bg-gradient-to-br ${getNodeStyle(node)}
                      ${selectedNode?.id === node.id ? 'ring-4 ring-yellow-400/50 shadow-lg shadow-yellow-400/25' : ''}
                    `}>
                      <span className="text-2xl">{getNodeIcon(node.storyNodeType)}</span>
                      <span className="text-xs font-bold mt-1 text-center px-1">{node.label}</span>
                      {node.current && (
                        <div className="absolute -bottom-3 px-2 py-0.5 bg-blue-500 rounded text-xs font-bold animate-pulse">
                          CURRENT
                        </div>
                      )}
                      {node.id === 'start' && (
                        <div className="absolute -bottom-3 px-2 py-0.5 bg-green-500 rounded text-xs font-bold">
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

        {/* Right Column - Mission Details */}
        <div className="w-full lg:w-[400px] xl:w-[450px] 2xl:w-[500px] min-h-[300px] lg:min-h-0 bg-black/90 flex flex-col overflow-hidden">
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