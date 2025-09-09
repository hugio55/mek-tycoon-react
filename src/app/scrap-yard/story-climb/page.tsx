"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface StoryNode {
  id: string;
  label: string;
  storyNodeType: "normal" | "boss" | "event" | "final_boss";
  x: number;
  y: number;
}

interface Connection {
  from: string;
  to: string;
}

export default function StoryClimbPage() {
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Load the Test 5 story tree
  const storyTrees = useQuery(api.storyTrees.getAllStoryTrees);
  const test5Tree = storyTrees?.find(tree => tree.name.toLowerCase() === "test 5");

  // Calculate canvas size and node scaling
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
      if (containerRef.current) {
        const container = containerRef.current.querySelector('.bg-black\\/60');
        if (container) {
          const width = container.clientWidth;
          const height = Math.floor(width * 1.5); // 2:3 aspect ratio (width:height)
          setCanvasSize({ width, height });
        }
      }
    };
    
    // Small delay to ensure DOM is ready
    setTimeout(updateSize, 100);
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Draw the tree on canvas
  useEffect(() => {
    if (!canvasRef.current || !test5Tree || canvasSize.width === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Find bounds of all nodes to calculate scaling
    const nodes = test5Tree.nodes;
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y));
    
    const treeWidth = maxX - minX;
    const treeHeight = maxY - minY;
    
    // Calculate scale to fit canvas - prioritize horizontal fill
    const padding = 40; // Small padding
    const scaleX = (canvas.width - padding * 2) / treeWidth;
    const scaleY = (canvas.height - padding * 2) / treeHeight;
    // Use horizontal scale primarily to fill width
    const scale = scaleX * 0.9; // Scale to fill most of the width
    
    // Transform function to convert node coordinates to canvas coordinates
    const transform = (x: number, y: number) => {
      // Scale the coordinates
      const scaledX = (x - minX) * scale;
      const scaledY = (y - minY) * scale;
      
      // Center horizontally
      const offsetX = (canvas.width - treeWidth * scale) / 2;
      // Position vertically so tree fits with start at bottom
      const offsetY = canvas.height - (treeHeight * scale) - padding;
      
      // Don't flip Y axis - keep tree orientation with start at bottom
      return {
        x: scaledX + offsetX,
        y: scaledY + offsetY
      };
    };
    
    // Draw connections first (so they appear behind nodes)
    ctx.strokeStyle = '#fab617';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fab617';
    
    test5Tree.connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      
      if (fromNode && toNode) {
        const from = transform(fromNode.x, fromNode.y);
        const to = transform(toNode.x, toNode.y);
        
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    });
    
    // Draw nodes
    nodes.forEach(node => {
      const pos = transform(node.x, node.y);
      const nodeSize = node.storyNodeType === 'boss' || node.storyNodeType === 'final_boss' ? 40 : 30;
      
      // Set colors based on node type
      let fillColor = '#3b82f6'; // blue for normal
      let strokeColor = '#60a5fa';
      
      if (node.storyNodeType === 'boss') {
        fillColor = '#ef4444'; // red
        strokeColor = '#f87171';
      } else if (node.storyNodeType === 'event') {
        fillColor = '#8b5cf6'; // purple
        strokeColor = '#a78bfa';
      } else if (node.storyNodeType === 'final_boss') {
        fillColor = '#fab617'; // gold
        strokeColor = '#fbbf24';
      } else if (node.id === 'start') {
        fillColor = '#10b981'; // green
        strokeColor = '#34d399';
      }
      
      // Draw node shadow
      ctx.shadowBlur = 20;
      ctx.shadowColor = strokeColor;
      
      // Draw node shape
      if (node.storyNodeType === 'boss' || node.storyNodeType === 'final_boss') {
        // Draw square for boss nodes
        ctx.fillStyle = fillColor;
        ctx.fillRect(pos.x - nodeSize/2, pos.y - nodeSize/2, nodeSize, nodeSize);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(pos.x - nodeSize/2, pos.y - nodeSize/2, nodeSize, nodeSize);
      } else {
        // Draw circle for normal/event nodes
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, nodeSize/2, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      // Draw node label
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Orbitron';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (node.id === 'start') {
        ctx.fillText('Start', pos.x, pos.y + nodeSize/2 + 20);
      } else if (node.storyNodeType === 'boss') {
        // Draw crown icon for boss
        ctx.font = '20px serif';
        ctx.fillText('👑', pos.x, pos.y);
      } else if (node.storyNodeType === 'final_boss') {
        // Draw fire icon for final boss
        ctx.font = '20px serif';
        ctx.fillText('🔥', pos.x, pos.y);
      } else if (node.storyNodeType === 'event') {
        // Draw lightning icon for event
        ctx.font = '20px serif';
        ctx.fillText('⚡', pos.x, pos.y);
      } else {
        // Draw node number for normal nodes
        const nodeNumber = node.label.match(/\d+/) || [''];
        ctx.fillText(nodeNumber[0], pos.x, pos.y);
      }
    });
  }, [test5Tree, canvasSize]);

  // Handle canvas click to select nodes
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !test5Tree) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Find bounds and calculate transform (same as in drawing)
    const nodes = test5Tree.nodes;
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y));
    
    const treeWidth = maxX - minX;
    const treeHeight = maxY - minY;
    const padding = 40;
    const scaleX = (canvas.width - padding * 2) / treeWidth;
    const scaleY = (canvas.height - padding * 2) / treeHeight;
    const scale = scaleX * 0.9; // Same scaling as drawing
    
    const transform = (nodeX: number, nodeY: number) => {
      const scaledX = (nodeX - minX) * scale;
      const scaledY = (nodeY - minY) * scale;
      const offsetX = (canvas.width - treeWidth * scale) / 2;
      const offsetY = canvas.height - (treeHeight * scale) - padding;
      return {
        x: scaledX + offsetX,
        y: scaledY + offsetY
      };
    };
    
    // Check if click is on any node
    for (const node of nodes) {
      const pos = transform(node.x, node.y);
      const nodeSize = (node.storyNodeType === 'boss' || node.storyNodeType === 'final_boss') ? 40 : 30;
      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      
      if (distance <= nodeSize / 2) {
        setSelectedNode(node);
        break;
      }
    }
  }, [test5Tree]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      {/* Header Section */}
      <div className="bg-black/80 backdrop-blur-sm border-b-2 border-yellow-500/50 p-4">
        <h1 className="text-3xl font-bold text-yellow-500 text-center font-orbitron tracking-wider">
          STORY MODE - CHAPTER 1
        </h1>
      </div>

      {/* Two Column Layout */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Column - Tree Canvas */}
        <div className="flex-1 lg:flex-[2] bg-gray-900/50 border-r-2 border-yellow-500/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-transparent to-gray-900/20" />
          
          {/* Canvas Container */}
          <div ref={containerRef} className="relative w-full h-full p-4 flex items-center justify-center">
            <div className="relative w-full bg-black/60 border-2 border-yellow-500/20 rounded-lg overflow-hidden" style={{ aspectRatio: '2/3' }}>
              {/* Grid Background */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    linear-gradient(0deg, #fab617 1px, transparent 1px),
                    linear-gradient(90deg, #fab617 1px, transparent 1px)
                  `,
                  backgroundSize: '50px 50px'
                }} />
              </div>
              
              {/* Canvas */}
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                className="absolute inset-0 cursor-pointer"
                onClick={handleCanvasClick}
                style={{ imageRendering: 'crisp-edges' }}
              />
              
              {/* Corner Decorations */}
              <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-yellow-500/50" />
              <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-yellow-500/50" />
              <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-yellow-500/50" />
              <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-yellow-500/50" />
            </div>
          </div>
        </div>

        {/* Right Column - Details Pane */}
        <div className="lg:w-[400px] bg-gray-800/50 relative overflow-y-auto">
          <div className="p-6">
            <div className="bg-black/60 border-2 border-yellow-500/20 rounded-lg p-6 min-h-[300px]">
              <h2 className="text-xl font-bold text-yellow-500 mb-4 font-orbitron tracking-wider">
                MISSION DETAILS
              </h2>
              
              {selectedNode ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-400 text-sm uppercase tracking-wider">Node ID</span>
                    <p className="text-white text-lg font-bold">{selectedNode.id}</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-400 text-sm uppercase tracking-wider">Type</span>
                    <p className="text-yellow-500 text-lg font-bold capitalize">
                      {selectedNode.storyNodeType.replace('_', ' ')}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-gray-400 text-sm uppercase tracking-wider">Position</span>
                    <p className="text-white">X: {selectedNode.x}, Y: {selectedNode.y}</p>
                  </div>
                  
                  {selectedNode.storyNodeType === 'boss' && (
                    <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded">
                      <p className="text-red-400 font-bold">⚠️ BOSS ENCOUNTER</p>
                      <p className="text-gray-300 text-sm mt-2">
                        Prepare for a challenging battle!
                      </p>
                    </div>
                  )}
                  
                  {selectedNode.storyNodeType === 'final_boss' && (
                    <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded">
                      <p className="text-yellow-400 font-bold">🔥 FINAL BOSS</p>
                      <p className="text-gray-300 text-sm mt-2">
                        The ultimate challenge awaits!
                      </p>
                    </div>
                  )}
                  
                  {selectedNode.storyNodeType === 'event' && (
                    <div className="mt-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded">
                      <p className="text-purple-400 font-bold">⚡ SPECIAL EVENT</p>
                      <p className="text-gray-300 text-sm mt-2">
                        A unique encounter with special rewards!
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">Click on a node to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}