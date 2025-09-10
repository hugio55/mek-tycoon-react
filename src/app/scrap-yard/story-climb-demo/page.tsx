"use client";

import { useState, useEffect, useRef } from "react";

// Mock data for demo
const mockTree = {
  name: "Test 5",
  nodes: [
    { id: "start", x: 400, y: 50, label: "Start", storyNodeType: "normal" },
    { id: "node1", x: 300, y: 150, label: "Node 1", storyNodeType: "normal" },
    { id: "node2", x: 500, y: 150, label: "Node 2", storyNodeType: "normal" },
    { id: "node3", x: 200, y: 250, label: "Node 3", storyNodeType: "normal" },
    { id: "node4", x: 400, y: 250, label: "Node 4", storyNodeType: "event" },
    { id: "node5", x: 600, y: 250, label: "Node 5", storyNodeType: "normal" },
    { id: "boss1", x: 300, y: 350, label: "Boss 1", storyNodeType: "boss" },
    { id: "node6", x: 500, y: 350, label: "Node 6", storyNodeType: "normal" },
    { id: "node7", x: 400, y: 450, label: "Node 7", storyNodeType: "event" },
    { id: "final", x: 400, y: 550, label: "Final Boss", storyNodeType: "final_boss" },
  ],
  connections: [
    { from: "start", to: "node1" },
    { from: "start", to: "node2" },
    { from: "node1", to: "node3" },
    { from: "node1", to: "node4" },
    { from: "node2", to: "node4" },
    { from: "node2", to: "node5" },
    { from: "node3", to: "boss1" },
    { from: "node4", to: "boss1" },
    { from: "node4", to: "node6" },
    { from: "node5", to: "node6" },
    { from: "boss1", to: "node7" },
    { from: "node6", to: "node7" },
    { from: "node7", to: "final" },
  ]
};

interface StoryNode {
  id: string;
  label: string;
  storyNodeType: "normal" | "boss" | "event" | "final_boss";
  x: number;
  y: number;
}

export default function StoryClimbDemoPage() {
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate canvas size
  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    
    const updateSize = () => {
      if (containerRef.current) {
        const container = containerRef.current.querySelector('[class*="bg-black"]');
        if (container) {
          const width = container.clientWidth;
          const height = container.clientHeight;
          setCanvasSize({ width, height });
        }
      }
    };
    
    setTimeout(updateSize, 100);
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [mounted]);

  // Draw the tree on canvas
  useEffect(() => {
    if (!canvasRef.current || !mounted || canvasSize.width === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Find bounds of all nodes
    const nodes = mockTree.nodes;
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y));
    
    const treeWidth = maxX - minX;
    const treeHeight = maxY - minY;
    
    // Calculate scale to fit canvas
    const padding = 40;
    const scaleX = (canvas.width - padding * 2) / treeWidth;
    const scaleY = (canvas.height - padding * 2) / treeHeight;
    const scale = Math.min(scaleX, scaleY) * 0.9;
    
    // Transform function
    const transform = (x: number, y: number) => {
      const scaledX = (x - minX) * scale;
      const scaledY = (y - minY) * scale;
      const offsetX = (canvas.width - treeWidth * scale) / 2;
      const offsetY = (canvas.height - treeHeight * scale) / 2;
      return { x: scaledX + offsetX, y: scaledY + offsetY };
    };
    
    // Draw connections
    ctx.strokeStyle = '#fab617';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fab617';
    
    mockTree.connections.forEach(conn => {
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
        ctx.font = '20px serif';
        ctx.fillText('👑', pos.x, pos.y);
      } else if (node.storyNodeType === 'final_boss') {
        ctx.font = '20px serif';
        ctx.fillText('🔥', pos.x, pos.y);
      } else if (node.storyNodeType === 'event') {
        ctx.font = '20px serif';
        ctx.fillText('⚡', pos.x, pos.y);
      } else {
        const nodeNumber = node.label.match(/\d+/) || [''];
        ctx.fillText(nodeNumber[0], pos.x, pos.y);
      }
    });
  }, [mounted, canvasSize]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-yellow-500 text-xl">Loading Story Mode...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 pt-4">
      {/* Header Section */}
      <div className="bg-black/80 backdrop-blur-sm border-b-2 border-yellow-500/50 p-3 mb-4">
        <h1 className="text-2xl font-bold text-yellow-500 text-center font-orbitron tracking-wider">
          STORY MODE - CHAPTER 1 (DEMO)
        </h1>
      </div>

      {/* Two Column Layout */}
      <div className="flex h-[calc(100vh-320px)]">
        {/* Left Column - Tree Canvas */}
        <div className="flex-1 lg:flex-[2] bg-gray-900/50 border-r-2 border-yellow-500/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-transparent to-gray-900/20" />
          
          {/* Canvas Container */}
          <div ref={containerRef} className="relative w-full h-full p-4 flex items-center justify-center">
            <div className="relative w-full max-w-[600px] h-[90%] bg-black/60 border-2 border-yellow-500/20 rounded-lg overflow-hidden">
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
              <p className="text-gray-400">Click on a node to view details</p>
              <div className="mt-6 text-sm text-gray-500">
                <p>This is a demo version showing the layout.</p>
                <p>The canvas is now properly positioned and fills the available space.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}