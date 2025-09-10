"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import mekImagesList from './mek-images.json';

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
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set(['start'])); // Start is always completed
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 900 }); // 2:3 aspect ratio
  const [viewportOffset, setViewportOffset] = useState(0); // For scrolling the tree
  const [mounted, setMounted] = useState(false);
  const [nodeImages, setNodeImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Load the V1 story tree (primary) or Test 5 as fallback
  const storyTrees = useQuery(api.storyTrees.getAllStoryTrees);
  const v1Tree = storyTrees?.find(tree => tree.name.toLowerCase() === "v1");
  const test5Tree = storyTrees?.find(tree => tree.name.toLowerCase() === "test 5");
  
  const treeData = v1Tree || test5Tree; // Use V1 if available, otherwise fall back to Test 5

  // Function to get a deterministic image for each node
  const getNodeImage = useCallback((nodeId: string): string => {
    // Use node ID to deterministically select an image
    let hash = 0;
    for (let i = 0; i < nodeId.length; i++) {
      hash = ((hash << 5) - hash) + nodeId.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % mekImagesList.length;
    return mekImagesList[index];
  }, []);

  // Load images for nodes
  useEffect(() => {
    if (!treeData) return;
    
    const loadImages = async () => {
      const imageMap = new Map<string, HTMLImageElement>();
      
      for (const node of treeData.nodes) {
        // Only load images for normal, boss, and final_boss nodes
        if (node.storyNodeType === 'normal' || node.storyNodeType === 'boss' || node.storyNodeType === 'final_boss') {
          const imageName = getNodeImage(node.id);
          const img = new Image();
          img.src = `/mek-images/150px/${imageName}`;
          imageMap.set(node.id, img);
        }
      }
      
      setNodeImages(imageMap);
    };
    
    loadImages();
  }, [treeData, getNodeImage]);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate canvas size
  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    
    const updateSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const width = container.clientWidth;
        const height = Math.floor(width * 1.5); // 2:3 aspect ratio
        setCanvasSize({ width, height });
      }
    };
    
    setTimeout(updateSize, 100);
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [mounted]);

  // Auto-scroll logic - only scroll when highest node crosses above lower third threshold
  useEffect(() => {
    if (!treeData || !canvasRef.current || canvasSize.width === 0) return;
    
    const nodes = treeData.nodes;
    const completedNodesList = nodes.filter(n => completedNodes.has(n.id));
    
    
    if (completedNodesList.length > 0) {
      // Find the highest completed node (lowest Y value = highest up the tree)
      const highestNode = completedNodesList.reduce((highest, node) => 
        node.y < highest.y ? node : highest
      );
      
      // Calculate tree bounds and scaling
      const minX = Math.min(...nodes.map(n => n.x));
      const maxX = Math.max(...nodes.map(n => n.x));
      const minY = Math.min(...nodes.map(n => n.y));
      const maxY = Math.max(...nodes.map(n => n.y));
      
      const treeWidth = maxX - minX;
      const treeHeight = maxY - minY;
      const padding = 40;
      const scaleX = (canvasSize.width - padding * 2) / treeWidth;
      const scale = scaleX * 0.9;
      const scaledTreeHeight = treeHeight * scale;
      
      // Calculate where the highest node WOULD appear on canvas with NO scrolling
      const scaledNodeY = (highestNode.y - minY) * scale;
      const nodeScreenYWithoutScroll = canvasSize.height - scaledTreeHeight - padding + scaledNodeY;
      
      // Define the threshold line at lower third of canvas (67% from top)
      const thresholdY = canvasSize.height * 0.67;
      
      
      // Only scroll if the highest node has risen ABOVE the threshold line (when unscrolled)
      if (nodeScreenYWithoutScroll < thresholdY) {
        // Calculate how much we need to scroll to keep the node at the threshold
        const scrollNeeded = thresholdY - nodeScreenYWithoutScroll;
        
        // Ensure we don't scroll past the bounds
        const maxPossibleOffset = Math.max(0, scaledTreeHeight - canvasSize.height + padding * 2);
        const targetOffset = Math.min(scrollNeeded, maxPossibleOffset);
        
        
        // Smooth scroll to the target position
        setViewportOffset(targetOffset);
      }
    }
  }, [treeData, completedNodes, canvasSize]); // Only depend on actual changes, not viewport

  // Draw the tree on canvas
  useEffect(() => {
    if (!canvasRef.current || !treeData || canvasSize.width === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Find bounds of all nodes
    const nodes = treeData.nodes;
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y));
    
    const treeWidth = maxX - minX;
    const treeHeight = maxY - minY;
    
    // Calculate scale to fit width primarily
    const padding = 40;
    const scaleX = (canvas.width - padding * 2) / treeWidth;
    const scale = scaleX * 0.9; // Use horizontal scale
    
    // Calculate total tree height when scaled
    const scaledTreeHeight = treeHeight * scale;
    
    // Transform function - position tree for viewport
    const transform = (x: number, y: number) => {
      const scaledX = (x - minX) * scale;
      const scaledY = (y - minY) * scale;
      
      const offsetX = (canvas.width - treeWidth * scale) / 2;
      // Position so we see the bottom portion (start node area)
      const offsetY = canvas.height - scaledTreeHeight + viewportOffset - padding;
      
      return {
        x: scaledX + offsetX,
        y: scaledY + offsetY
      };
    };
    
    // Only draw nodes and connections that are visible in viewport
    const isInViewport = (y: number) => {
      return y >= -100 && y <= canvas.height + 100;
    };
    
    // Draw connections first
    ctx.strokeStyle = '#fab617';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fab617';
    
    treeData.connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      
      if (fromNode && toNode) {
        const from = transform(fromNode.x, fromNode.y);
        const to = transform(toNode.x, toNode.y);
        
        // Only draw if at least one end is visible
        if (isInViewport(from.y) || isInViewport(to.y)) {
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
        }
      }
    });
    
    // Draw nodes
    nodes.forEach(node => {
      const pos = transform(node.x, node.y);
      
      // Skip nodes outside viewport
      if (!isInViewport(pos.y)) return;
      
      // Check if node is completed
      const isCompleted = completedNodes.has(node.id);
      
      // Set node sizes and colors (matching builder ratios, normal nodes 10% bigger)
      let nodeSize = 22; // normal nodes 10% bigger than original 20
      let fillColor = '#fab617'; // yellow for normal
      let strokeColor = '#fbbf24';
      
      if (node.id === 'start') {
        nodeSize = 35; // slightly bigger
        fillColor = '#10b981'; // green
        strokeColor = '#34d399';
      } else if (node.storyNodeType === 'event') {
        nodeSize = 40; // much bigger circles (matching builder)
        fillColor = '#8b5cf6'; // purple
        strokeColor = '#a78bfa';
      } else if (node.storyNodeType === 'boss') {
        nodeSize = 50; // large squares (matching builder)
        fillColor = '#ef4444'; // red
        strokeColor = '#f87171';
      } else if (node.storyNodeType === 'final_boss') {
        nodeSize = 60; // extra large square (matching builder)
        fillColor = '#fab617'; // gold
        strokeColor = '#fbbf24';
      }
      
      // Check if node is available (connected to a completed node)
      const isAvailable = !isCompleted && treeData.connections.some(conn => {
        const otherNodeId = conn.from === node.id ? conn.to : (conn.to === node.id ? conn.from : null);
        return otherNodeId && completedNodes.has(otherNodeId);
      });
      
      // Draw glow for available nodes only
      if (isAvailable) {
        ctx.save();
        const glowIntensity = 0.5 + Math.sin(Date.now() / 500) * 0.3;
        ctx.shadowBlur = 30;
        ctx.shadowColor = `rgba(250, 204, 21, ${glowIntensity})`;
        
        // Draw glow shape
        if (node.storyNodeType === 'event') {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, nodeSize, 0, Math.PI * 2);
          ctx.fillStyle = 'transparent';
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 3;
          ctx.stroke();
        } else {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 3;
          ctx.strokeRect(pos.x - nodeSize, pos.y - nodeSize, nodeSize * 2, nodeSize * 2);
        }
        ctx.restore();
      }
      
      // Draw node shadow
      ctx.shadowBlur = isCompleted ? 5 : (isAvailable ? 15 : 8);
      ctx.shadowColor = isCompleted ? strokeColor + '40' : (isAvailable ? strokeColor : strokeColor + '20');
      
      // Draw node shape based on type
      if (node.storyNodeType === 'event') {
        // Events are circles (matching builder)
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, nodeSize, 0, Math.PI * 2);
        ctx.fillStyle = isCompleted ? fillColor + '60' : fillColor;
        ctx.fill();
        ctx.strokeStyle = isCompleted ? strokeColor + '60' : strokeColor;
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        // All others are squares (normal, boss, final boss, start)
        const halfSize = nodeSize;
        
        // Fill background
        ctx.fillStyle = isCompleted ? fillColor + '60' : fillColor;
        ctx.fillRect(pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
        
        // Draw mechanism image for normal, boss, and final_boss nodes
        if ((node.storyNodeType === 'normal' || node.storyNodeType === 'boss' || node.storyNodeType === 'final_boss') && nodeImages.has(node.id)) {
          const img = nodeImages.get(node.id)!;
          if (img.complete) {
            ctx.save();
            // Clip to square shape with padding
            const padding = 2;
            ctx.beginPath();
            ctx.rect(pos.x - halfSize + padding, pos.y - halfSize + padding, halfSize * 2 - padding * 2, halfSize * 2 - padding * 2);
            ctx.clip();
            // Draw image
            ctx.globalAlpha = isCompleted ? 0.4 : 0.85;
            ctx.drawImage(img, pos.x - halfSize + padding, pos.y - halfSize + padding, halfSize * 2 - padding * 2, halfSize * 2 - padding * 2);
            ctx.restore();
          }
        }
        
        // Draw border
        ctx.strokeStyle = isCompleted ? strokeColor + '60' : strokeColor;
        ctx.lineWidth = node.storyNodeType === 'final_boss' ? 4 : 3;
        ctx.strokeRect(pos.x - halfSize, pos.y - halfSize, halfSize * 2, halfSize * 2);
      }
      
      // Draw checkmark for completed nodes
      if (isCompleted && node.id !== 'start') {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pos.x - nodeSize/4, pos.y);
        ctx.lineTo(pos.x - nodeSize/8, pos.y + nodeSize/4);
        ctx.lineTo(pos.x + nodeSize/4, pos.y - nodeSize/4);
        ctx.stroke();
      }
      
      // Draw node label
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Orbitron';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (node.id === 'start') {
        ctx.fillText('START', pos.x, pos.y + nodeSize + 10);
      } else if (node.storyNodeType === 'boss') {
        ctx.fillText('BOSS', pos.x, pos.y);
      } else if (node.storyNodeType === 'final_boss') {
        ctx.fillStyle = '#000000';
        ctx.fillText('WREN', pos.x, pos.y);
      } else if (node.storyNodeType === 'event') {
        ctx.fillText('EVENT', pos.x, pos.y);
      } else {
        // Normal nodes - show number if available
        const nodeNumber = node.label.match(/\d+/) || [''];
        ctx.fillText(nodeNumber[0], pos.x, pos.y);
      }
    });
  }, [treeData, canvasSize, viewportOffset, completedNodes, nodeImages]);

  // Handle canvas click
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !treeData) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const nodes = treeData.nodes;
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y));
    
    const treeWidth = maxX - minX;
    const treeHeight = maxY - minY;
    const padding = 40;
    const scaleX = (canvas.width - padding * 2) / treeWidth;
    const scale = scaleX * 0.9;
    const scaledTreeHeight = treeHeight * scale;
    
    const transform = (nodeX: number, nodeY: number) => {
      const scaledX = (nodeX - minX) * scale;
      const scaledY = (nodeY - minY) * scale;
      const offsetX = (canvas.width - treeWidth * scale) / 2;
      const offsetY = canvas.height - scaledTreeHeight + viewportOffset - padding;
      return {
        x: scaledX + offsetX,
        y: scaledY + offsetY
      };
    };
    
    // Check if click is on any node
    for (const node of nodes) {
      const pos = transform(node.x, node.y);
      
      let nodeSize = 22; // 10% bigger normal nodes
      if (node.id === 'start') nodeSize = 35;
      else if (node.storyNodeType === 'event') nodeSize = 40;
      else if (node.storyNodeType === 'boss') nodeSize = 50;
      else if (node.storyNodeType === 'final_boss') nodeSize = 60;
      
      let inBounds = false;
      if (node.storyNodeType === 'event') {
        // Circle hit detection
        const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
        inBounds = distance <= nodeSize;
      } else {
        // Square hit detection - nodeSize is already the half-size
        inBounds = Math.abs(x - pos.x) <= nodeSize && Math.abs(y - pos.y) <= nodeSize;
      }
      
      if (inBounds) {
        setSelectedNode(node);
        
        // Toggle completion on click (for testing)
        if (!completedNodes.has(node.id)) {
          const newCompleted = new Set(completedNodes);
          newCompleted.add(node.id);
          setCompletedNodes(newCompleted);
        } else if (node.id !== 'start') {
          // Allow uncompleting nodes (except start)
          const newCompleted = new Set(completedNodes);
          newCompleted.delete(node.id);
          setCompletedNodes(newCompleted);
        }
        break;
      }
    }
  }, [treeData, viewportOffset, completedNodes, canvasSize]);

  // Handle mouse wheel scrolling
  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (!treeData || !canvasRef.current) return;
    
    // Don't preventDefault - causes passive listener warning
    // event.preventDefault();
    
    // Calculate max scroll based on tree size
    const nodes = treeData.nodes;
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y));
    const treeHeight = maxY - minY;
    
    const padding = 40;
    const scaleX = (canvasSize.width - padding * 2) / (maxY - minY);
    const scale = scaleX * 0.9;
    const scaledTreeHeight = treeHeight * scale;
    
    const maxPossibleOffset = Math.max(0, scaledTreeHeight - canvasSize.height + padding * 2);
    
    // Scroll with mouse wheel (inverted so scrolling down moves tree up)
    const scrollSpeed = 50;
    const newOffset = Math.max(0, Math.min(maxPossibleOffset, viewportOffset - event.deltaY * scrollSpeed / 100));
    setViewportOffset(newOffset);
  }, [treeData, viewportOffset, canvasSize]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-yellow-500 text-xl">Loading Story Mode...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-sm border-b-2 border-yellow-500/50 p-4 mb-6">
        <h1 className="text-2xl font-bold text-yellow-500 text-center font-orbitron tracking-wider">
          STORY MODE - CHAPTER 1
        </h1>
      </div>

      {/* Main Content - Normal width container */}
      <div className="max-w-[900px] mx-auto px-5">
        {/* Two Column Layout */}
        <div className="flex gap-4">
          {/* Left Column - Tree Canvas */}
          <div ref={containerRef} className="flex-1">
            {/* Canvas Container with Viewport - single frame */}
            <div 
              className="relative bg-black/80 border-2 border-yellow-500/30 rounded-lg overflow-hidden" 
              style={{ aspectRatio: '2/3' }}
              onWheel={handleWheel}
              onWheelCapture={(e) => e.stopPropagation()}
            >
              {/* Canvas */}
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                className="absolute inset-0 cursor-pointer"
                onClick={handleCanvasClick}
                style={{ imageRendering: 'crisp-edges' }}
              />
              
              {/* Fade gradient only at top */}
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black via-black/90 to-transparent pointer-events-none z-10" />
              
              {/* Corner decorations */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-yellow-500/50" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-yellow-500/50" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-yellow-500/50" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-yellow-500/50" />
            </div>
          </div>

          {/* Right Column - Details Pane */}
          <div className="w-[300px]">
            {/* Single frame for details */}
            <div className="bg-black/80 border-2 border-yellow-500/30 rounded-lg p-4 h-full overflow-y-auto">
                <h2 className="text-lg font-bold text-yellow-500 mb-3 font-orbitron tracking-wider">
                  MISSION DETAILS
                </h2>
                
                {/* Progress Counter */}
                <div className="mb-4 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <span className="text-xs text-gray-400 uppercase">Progress</span>
                  <p className="text-yellow-500 font-bold">
                    {completedNodes.size} / {treeData?.nodes.length || 0} Nodes
                  </p>
                </div>
                
                {selectedNode ? (
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-400 text-xs uppercase tracking-wider">Node ID</span>
                      <p className="text-white font-bold">{selectedNode.id}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-400 text-xs uppercase tracking-wider">Status</span>
                      <p className={`font-bold ${completedNodes.has(selectedNode.id) ? 'text-green-500' : 'text-gray-400'}`}>
                        {completedNodes.has(selectedNode.id) ? '✓ COMPLETED' : 'INCOMPLETE'}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-gray-400 text-xs uppercase tracking-wider">Type</span>
                      <p className="text-yellow-500 font-bold capitalize">
                        {selectedNode.storyNodeType.replace('_', ' ')}
                      </p>
                    </div>
                    
                    {selectedNode.storyNodeType === 'boss' && (
                      <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded">
                        <p className="text-red-400 font-bold text-xs">⚠️ BOSS ENCOUNTER</p>
                        <p className="text-gray-300 text-xs mt-1">
                          Prepare for battle!
                        </p>
                      </div>
                    )}
                    
                    {selectedNode.storyNodeType === 'final_boss' && (
                      <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded">
                        <p className="text-yellow-400 font-bold text-xs">🔥 FINAL BOSS</p>
                        <p className="text-gray-300 text-xs mt-1">
                          The ultimate challenge!
                        </p>
                      </div>
                    )}
                    
                    {selectedNode.storyNodeType === 'event' && (
                      <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded">
                        <p className="text-purple-400 font-bold text-xs">⚡ SPECIAL EVENT</p>
                        <p className="text-gray-300 text-xs mt-1">
                          Special rewards await!
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">Click on a node to view details</p>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}