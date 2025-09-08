"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import MissionCard from "./MissionCard";
import { transformNodesToDisplaySpace, getNodeSize, getNodeIcon } from "../../../lib/story-tree-utils";

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

// Node utilities are imported from story-tree-utils

// Get node style based on type and state
const getNodeStyle = (node: StoryNode) => {
  // First check progress state
  if (node.id === 'start') {
    return "from-green-600 to-green-700 border-green-500";
  }
  if (node.completed) {
    return "from-green-600 to-green-700 border-green-500";
  }
  if (node.current) {
    return "from-blue-500 to-blue-600 border-blue-400 animate-pulse";
  }
  
  // Then apply type-based colors for available/locked nodes
  const opacity = node.available ? '' : 'opacity-50';
  
  switch (node.storyNodeType) {
    case 'event':
      return `from-purple-600 to-purple-700 border-purple-500 ${opacity}`;
    case 'boss':
      return `from-red-600 to-red-700 border-red-500 ${opacity}`;
    case 'final_boss':
      return `from-orange-600 via-red-600 to-purple-600 border-yellow-500 ${opacity}`;
    case 'normal':
    default:
      if (node.available) {
        return "from-yellow-500 to-amber-600 border-yellow-400";
      }
      return "from-gray-700 to-gray-800 border-gray-600 opacity-50";
  }
};


export default function StoryClimbPage() {
  const router = useRouter();
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [currentChapter, setCurrentChapter] = useState<SavedStoryMode | null>(null);
  const [savedStoryModes, setSavedStoryModes] = useState<SavedStoryMode[]>([]);
  // Removed maxScrollY - no manual scrolling allowed
  const [canvasHeight, setCanvasHeight] = useState(600); // Default height
  const [canvasWidth, setCanvasWidth] = useState(800); // Default width - wider for better spread
  const [currentNodeIndex, setCurrentNodeIndex] = useState(1); // Player's current progress
  const [viewportY, setViewportY] = useState(0); // Auto-positioned viewport based on progress
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Convex queries and mutations
  const dbStoryTrees = useQuery(api.storyTrees.getAllStoryTrees);
  const saveToDatabase = useMutation(api.storyTrees.saveStoryTree);
  
  // Load saved story modes from localStorage and database
  useEffect(() => {
    console.log('Loading story data...');
    
    let storyData: SavedStoryMode | null = null;
    let existingSaves: SavedStoryMode[] = [];
    
    // Check for preferred tree first
    const preferredTree = localStorage.getItem('preferredStoryTree');
    
    // Try to load from localStorage first
    const saved = localStorage.getItem('savedStoryModes');
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedStoryMode[];
        existingSaves = parsed;
        setSavedStoryModes(parsed);
        
        console.log('📂 Found existing saved story modes:', parsed.map(s => s.name).join(', '));
        
        // Priority order: test 3 > preferred tree > test 2 > chapter 1 > first available
        storyData = parsed.find(s => 
          s.name.toLowerCase() === 'test 3' ||
          s.name.toLowerCase() === 'chapter test 3' ||
          s.name.toLowerCase().includes('test 3')
        ) || (preferredTree ? parsed.find(s => s.name === preferredTree) : null)
          || parsed.find(s => 
          s.name.toLowerCase() === 'test 2' ||
          s.name.toLowerCase() === 'chapter test 2' ||
          s.name.toLowerCase().includes('test 2')
        ) || parsed.find(s => 
          s.name.toLowerCase().includes('chapter 1') || 
          s.chapter === 1
        ) || parsed[0] || null; // Fall back to first saved tree if available
        
        if (storyData) {
          console.log('✅ Loading saved story:', storyData.name);
          if (storyData.name.toLowerCase().includes('test 3')) {
            console.log('🌟 TEST 3 LOADED! Your latest work is safe.');
          }
        }
      } catch (error) {
        console.error('Error parsing saved story modes:', error);
      }
    }
    
    // Sync with database if available
    if (dbStoryTrees && dbStoryTrees.length > 0) {
      console.log('☁️ Found story trees in database:', dbStoryTrees.map(t => t.name).join(', '));
      
      // Merge database trees with local trees (local takes precedence for same name)
      const localNames = existingSaves.map(s => s.name.toLowerCase());
      dbStoryTrees.forEach(dbTree => {
        if (!localNames.includes(dbTree.name.toLowerCase())) {
          const treeData = {
            name: dbTree.name,
            chapter: dbTree.chapter,
            data: {
              nodes: dbTree.nodes,
              connections: dbTree.connections
            }
          };
          existingSaves.push(treeData);
        }
      });
      
      // Update localStorage with merged data
      if (existingSaves.length > 0) {
        localStorage.setItem('savedStoryModes', JSON.stringify(existingSaves));
        setSavedStoryModes(existingSaves);
      }
    }
    
    // Only create defaults if NO saved data exists at all (preserve user's saves)
    if (!storyData && existingSaves.length === 0) {
      console.log('No saved data found. Creating default layouts...');
      
      // Create test 2 layout - a more complex branching tree
      const test2Data = {
        name: "test 2",
        chapter: 2,
        data: {
          nodes: [
            // Start at bottom
            { id: 'start', x: 0, y: 100, label: 'START', storyNodeType: 'normal' },
            
            // Level 1 - Three initial paths
            { id: 'node-1', x: -200, y: 250, label: 'Scout Path', storyNodeType: 'normal' },
            { id: 'node-2', x: 0, y: 250, label: 'Main Path', storyNodeType: 'normal' },
            { id: 'node-3', x: 200, y: 250, label: 'Risk Path', storyNodeType: 'event' },
            
            // Level 2 - More branching
            { id: 'node-4', x: -250, y: 400, label: 'Hidden Cache', storyNodeType: 'event' },
            { id: 'node-5', x: -100, y: 400, label: 'Ambush Point', storyNodeType: 'normal' },
            { id: 'node-6', x: 100, y: 400, label: 'Stronghold', storyNodeType: 'normal' },
            { id: 'node-7', x: 250, y: 400, label: 'Elite Guard', storyNodeType: 'boss' },
            
            // Level 3 - Complex interconnections
            { id: 'node-8', x: -200, y: 550, label: 'Supply Route', storyNodeType: 'normal' },
            { id: 'node-9', x: -50, y: 550, label: 'Command Post', storyNodeType: 'normal' },
            { id: 'node-10', x: 50, y: 550, label: 'Weapons Cache', storyNodeType: 'event' },
            { id: 'node-11', x: 200, y: 550, label: 'Boss Arena', storyNodeType: 'boss' },
            
            // Level 4 - Convergence points
            { id: 'node-12', x: -150, y: 700, label: 'Rally Point', storyNodeType: 'normal' },
            { id: 'node-13', x: 0, y: 700, label: 'Central Hub', storyNodeType: 'event' },
            { id: 'node-14', x: 150, y: 700, label: 'Final Prep', storyNodeType: 'normal' },
            
            // Level 5 - Mini bosses
            { id: 'node-15', x: -100, y: 850, label: 'Twin Guards', storyNodeType: 'boss' },
            { id: 'node-16', x: 100, y: 850, label: 'War Machine', storyNodeType: 'boss' },
            
            // Level 6 - Final approach
            { id: 'node-17', x: -150, y: 1000, label: 'Secret Path', storyNodeType: 'event' },
            { id: 'node-18', x: 0, y: 1000, label: 'Main Gate', storyNodeType: 'normal' },
            { id: 'node-19', x: 150, y: 1000, label: 'Side Entry', storyNodeType: 'normal' },
            
            // Final boss
            { id: 'node-20', x: 0, y: 1150, label: 'Overlord', storyNodeType: 'final_boss' },
          ],
          connections: [
            // From start - three paths
            { from: 'start', to: 'node-1' },
            { from: 'start', to: 'node-2' },
            { from: 'start', to: 'node-3' },
            
            // Level 1 to 2
            { from: 'node-1', to: 'node-4' },
            { from: 'node-1', to: 'node-5' },
            { from: 'node-2', to: 'node-5' },
            { from: 'node-2', to: 'node-6' },
            { from: 'node-3', to: 'node-6' },
            { from: 'node-3', to: 'node-7' },
            
            // Level 2 to 3 - complex routing
            { from: 'node-4', to: 'node-8' },
            { from: 'node-5', to: 'node-8' },
            { from: 'node-5', to: 'node-9' },
            { from: 'node-6', to: 'node-9' },
            { from: 'node-6', to: 'node-10' },
            { from: 'node-7', to: 'node-10' },
            { from: 'node-7', to: 'node-11' },
            
            // Level 3 to 4
            { from: 'node-8', to: 'node-12' },
            { from: 'node-9', to: 'node-12' },
            { from: 'node-9', to: 'node-13' },
            { from: 'node-10', to: 'node-13' },
            { from: 'node-10', to: 'node-14' },
            { from: 'node-11', to: 'node-14' },
            
            // Level 4 to 5
            { from: 'node-12', to: 'node-15' },
            { from: 'node-13', to: 'node-15' },
            { from: 'node-13', to: 'node-16' },
            { from: 'node-14', to: 'node-16' },
            
            // Level 5 to 6
            { from: 'node-15', to: 'node-17' },
            { from: 'node-15', to: 'node-18' },
            { from: 'node-16', to: 'node-18' },
            { from: 'node-16', to: 'node-19' },
            
            // To final boss
            { from: 'node-17', to: 'node-20' },
            { from: 'node-18', to: 'node-20' },
            { from: 'node-19', to: 'node-20' },
          ]
        }
      };
      
      // Create chapter 1 as backup
      const chapter1Data = {
        name: "chapter test 1",
        chapter: 1,
        data: {
          nodes: [
            // Start at bottom
            { id: 'start', x: 0, y: 100, label: 'START', storyNodeType: 'normal' },
            
            // Level 1 - Two paths from start
            { id: 'node-1', x: -150, y: 250, label: 'mek 1341', storyNodeType: 'normal' },
            { id: 'node-2', x: 150, y: 250, label: 'mek 1341', storyNodeType: 'normal' },
            
            // Level 2 - Merge and split again
            { id: 'node-3', x: 0, y: 400, label: 'mek 1341', storyNodeType: 'normal' },
            
            // Level 3 - Three branches
            { id: 'node-4', x: -200, y: 550, label: 'mek 1341', storyNodeType: 'normal' },
            { id: 'node-5', x: 0, y: 550, label: 'mek 1341', storyNodeType: 'event' },
            { id: 'node-6', x: 200, y: 550, label: 'mek 1341', storyNodeType: 'normal' },
            
            // Level 4 - Converge
            { id: 'node-7', x: -100, y: 700, label: 'mek 1341', storyNodeType: 'normal' },
            { id: 'node-8', x: 100, y: 700, label: 'mek 1341', storyNodeType: 'normal' },
            
            // Level 5 - Boss
            { id: 'node-9', x: 0, y: 850, label: 'Boss', storyNodeType: 'boss' },
            
            // Level 6 - Final paths
            { id: 'node-10', x: -150, y: 1000, label: 'mek 1341', storyNodeType: 'normal' },
            { id: 'node-11', x: 150, y: 1000, label: 'mek 1341', storyNodeType: 'normal' },
            
            // Final boss
            { id: 'node-12', x: 0, y: 1150, label: 'Final Boss', storyNodeType: 'final_boss' },
          ],
          connections: [
            // From start
            { from: 'start', to: 'node-1' },
            { from: 'start', to: 'node-2' },
            
            // To middle merge
            { from: 'node-1', to: 'node-3' },
            { from: 'node-2', to: 'node-3' },
            
            // Split again
            { from: 'node-3', to: 'node-4' },
            { from: 'node-3', to: 'node-5' },
            { from: 'node-3', to: 'node-6' },
            
            // Converge paths
            { from: 'node-4', to: 'node-7' },
            { from: 'node-5', to: 'node-7' },
            { from: 'node-5', to: 'node-8' },
            { from: 'node-6', to: 'node-8' },
            
            // To boss
            { from: 'node-7', to: 'node-9' },
            { from: 'node-8', to: 'node-9' },
            
            // After boss
            { from: 'node-9', to: 'node-10' },
            { from: 'node-9', to: 'node-11' },
            
            // To final
            { from: 'node-10', to: 'node-12' },
            { from: 'node-11', to: 'node-12' },
          ]
        }
      };
      
      // Use test 2 as the default
      storyData = test2Data;
      
      // Save both layouts to localStorage (only if nothing exists)
      const defaultSaves = [test2Data, chapter1Data];
      localStorage.setItem('savedStoryModes', JSON.stringify(defaultSaves));
      console.log('Created default test 2 and chapter 1 layouts (no existing saves found)');
    } else if (!storyData && existingSaves.length > 0) {
      // If we have saves but couldn't find a matching one, use the first save
      storyData = existingSaves[0];
      console.log('Using first available saved story:', storyData.name);
    }
    
    // Set the current chapter
    setCurrentChapter(storyData);
    
    // Transform nodes from talent-builder space if needed
    // Pass canvas width for proper scaling
    const transformedNodes = transformNodesToDisplaySpace(storyData.data.nodes, canvasWidth);
    
    // Process nodes to add game state
    const processedNodes = transformedNodes.map((node, index) => {
      return {
        ...node,
        index: index + 1,
        completed: index < currentNodeIndex, // Nodes before current position are completed
        available: index === currentNodeIndex || index === currentNodeIndex + 1, // Current and next node available
        current: index === currentNodeIndex, // Current position
        label: node.label || node.name || `Node ${index + 1}`, // Ensure label exists
        storyNodeType: node.storyNodeType || 'normal'
      };
    });
    
    console.log('Processed nodes with normalized coords:', processedNodes);
    console.log('Node count:', processedNodes.length);
    console.log('Connection count:', storyData.data.connections.length);
    
    // Log coordinate ranges for debugging
    if (processedNodes.length > 0) {
      const xValues = processedNodes.map(n => n.x);
      const yValues = processedNodes.map(n => n.y);
      console.log('X range:', Math.min(...xValues), 'to', Math.max(...xValues));
      console.log('Y range:', Math.min(...yValues), 'to', Math.max(...yValues));
    }
    
    setNodes(processedNodes);
    setConnections(storyData.data.connections);
    
    // Select current node and auto-position viewport to show START
    const current = processedNodes.find(n => n.current);
    if (current) {
      setSelectedNode(current);
    }
    
    // Position viewport to show START node at bottom of screen
    // START is at y=100, inverted to canvasHeight - 50
    // We want to see from START up to the first few nodes
    const startViewport = Math.max(0, 1400 - canvasHeight - 50);
    setViewportY(startViewport);
  }, [dbStoryTrees, currentNodeIndex]); // Re-run when database trees load
  
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
      
      // Auto-update viewport to show new area
      const nextNode = nodes[next];
      if (nextNode) {
        // Smoothly transition viewport to show next area
        const nextY = canvasHeight - (nextNode.y - 100) - 50;
        const optimalViewport = Math.max(0, nextY - canvasHeight / 2);
        setViewportY(optimalViewport);
      }
      
      return next;
    });
  };
  
  // Set canvas dimensions to use full available width
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const headerHeight = 120; // Header height
      const sidebarWidth = 384; // Right panel width (w-96 = 24rem = 384px)
      const viewportHeight = window.innerHeight - headerHeight;
      const availableWidth = window.innerWidth - sidebarWidth - 100; // Minus sidebar and padding
      
      // Use most of available width for better node spread
      const width = Math.min(availableWidth, 1200); // Max 1200px for very wide screens
      const height = Math.min(viewportHeight - 20, 900); // Max height with some padding
      
      setCanvasWidth(width);
      setCanvasHeight(height);
      
      const handleResize = () => {
        const vh = window.innerHeight - headerHeight;
        const aw = window.innerWidth - sidebarWidth - 100;
        
        const w = Math.min(aw, 1200);
        const h = Math.min(vh - 20, 900);
        
        setCanvasWidth(w);
        setCanvasHeight(h);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  // No manual scrolling - viewport is locked and only moves with progression
  
  // Calculate canvas bounds
  const centerX = canvasWidth / 2; // Center position for nodes
  
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
        <div className="flex-1 flex flex-col px-8">
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
                    {currentChapter?.name || 'No Story Loaded'}
                  </h1>
                  <p className="text-gray-400 text-sm">
                    {nodes.filter(n => n.completed).length} / {nodes.length} Missions Completed
                  </p>
                </div>
                
                {/* Story Layout Selector */}
                {savedStoryModes.length > 0 && (
                  <select
                    value={currentChapter?.name || ''}
                    onChange={(e) => {
                      const selected = savedStoryModes.find(s => s.name === e.target.value);
                      if (selected) {
                        setCurrentChapter(selected);
                        
                        // Transform nodes from talent-builder space if needed
                        // Pass canvas width for proper scaling
                        const transformedNodes = transformNodesToDisplaySpace(selected.data.nodes, canvasWidth);
                        
                        const processedNodes = transformedNodes.map((node, index) => {
                          return {
                            ...node,
                            index: index + 1,
                            completed: index < currentNodeIndex,
                            available: index === currentNodeIndex || index === currentNodeIndex + 1,
                            current: index === currentNodeIndex,
                            label: node.label || node.name || `Node ${index + 1}`,
                            storyNodeType: node.storyNodeType || 'normal'
                          };
                        });
                        setNodes(processedNodes);
                        setConnections(selected.data.connections);
                        setViewportY(Math.max(0, 1400 - canvasHeight - 50)); // Position viewport to show START
                      }
                    }}
                    className="px-3 py-1 bg-gray-800/50 border border-gray-600 rounded text-sm text-gray-300 hover:border-yellow-400 transition-all"
                  >
                    {savedStoryModes.map(save => (
                      <option key={save.name} value={save.name}>
                        {save.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
                  Progress: {Math.round((nodes.filter(n => n.completed).length / nodes.length) * 100)}%
                </div>
              </div>
            </div>
          </div>
          
          {/* Node Canvas - 2:3 Aspect Ratio with Controlled Scrolling */}
          <div className="bg-gray-900/20 flex justify-center relative overflow-hidden" style={{ height: `${canvasHeight}px` }}>
            {/* Fade gradient at top for unexplored areas */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black via-black/50 to-transparent z-20 pointer-events-none" />
            
            {/* Scroll indicator when content available above */}
            
            {/* Progress indicator */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-black/70 px-3 py-1 rounded-full border border-yellow-400/30">
              <div className="text-yellow-400 text-sm font-bold">
                Stage {currentNodeIndex} / {nodes.length}
              </div>
            </div>
            
            <div 
              ref={canvasRef}
              className="relative" 
              style={{ 
                width: `${canvasWidth}px`, 
                height: '1400px', // Fixed height to contain full tree
                transform: `translateY(-${viewportY}px)`,
                transition: 'transform 0.3s ease-out'
              }}
            >
              
              {/* Draw connections */}
              <svg 
                className="absolute pointer-events-none" 
                width={canvasWidth} 
                height={2000} // Fixed height to accommodate full tree
                style={{ top: '0' }}
              >
                {connections.map((conn, idx) => {
                  const fromNode = nodes.find(n => n.id === conn.from);
                  const toNode = nodes.find(n => n.id === conn.to);
                  if (!fromNode || !toNode) return null;
                  
                  // Position connections - tree grows upward, but coordinates are normal
                  // START is at y=100, final boss at y=1150
                  // We'll keep the Y coordinates as they are (START at bottom of tree)
                  const x1 = centerX + fromNode.x;
                  const y1 = canvasHeight - (fromNode.y - 100) - 50; // Position from bottom
                  const x2 = centerX + toNode.x;
                  const y2 = canvasHeight - (toNode.y - 100) - 50; // Position from bottom
                  
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
              {nodes.length === 0 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-yellow-400">
                  Loading nodes...
                </div>
              )}
              {nodes.map(node => {
                const nodeSize = getNodeSize(node.storyNodeType);
                
                // Position nodes - START at bottom of canvas
                // Y values: START (100) should be at bottom, higher values go up
                const nodeY = canvasHeight - (node.y - 100) - nodeSize / 2 - 50; // Position from bottom
                const nodeX = centerX + node.x - nodeSize / 2;
                
                // Only render nodes that are within the visible area (with some buffer)
                // Since we inverted Y, we need to check visibility in the inverted space
                const viewTop = viewportY;
                const viewBottom = viewportY + canvasHeight;
                const actualNodeY = 1400 - node.y; // The actual Y position after inversion
                const nodeTop = actualNodeY - nodeSize / 2;
                const nodeBottom = actualNodeY + nodeSize / 2;
                
                if (nodeBottom < viewTop - 100 || nodeTop > viewBottom + 100) {
                  return null; // Don't render off-screen nodes for performance
                }
                
                // Calculate fade for unexplored areas (above current progress)
                let fadeOpacity = 1;
                if (!node.completed && !node.available && !node.current) {
                  fadeOpacity = 0.5; // Semi-fade locked nodes
                }
                
                return (
                  <div
                    key={node.id}
                    className={`absolute cursor-pointer transition-all duration-200 ${
                      node.completed || node.available || node.current ? 'hover:scale-110' : 'cursor-not-allowed'
                    }`}
                    style={{
                      left: `${nodeX}px`,
                      top: `${nodeY}px`,
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
                      ${node.storyNodeType === 'final_boss' && !node.completed ? 'animate-pulse shadow-lg shadow-orange-500/50' : ''}
                      transition-all duration-200
                    `}>
                      <span className={`${
                        nodeSize === 40 ? 'text-2xl' : 
                        nodeSize === 80 ? 'text-3xl' : 
                        nodeSize === 120 ? 'text-4xl' : 
                        'text-5xl'
                      }`}>
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
                      {node.storyNodeType === 'boss' && !node.completed && !node.current && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-red-500 rounded text-xs font-bold">
                          BOSS
                        </div>
                      )}
                      {node.storyNodeType === 'final_boss' && !node.completed && !node.current && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-purple-500 rounded text-xs font-bold">
                          FINAL BOSS
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Right Panel - Mission Card */}
        <div className="w-96 bg-gray-900/50 backdrop-blur-md border-l border-gray-800 flex flex-col">
          <MissionCard 
            nodeData={selectedNode}
            onStartMission={handleStartMission}
            simulateProgress={simulateProgress}
          />
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