'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { createSeededRandomFromString } from '@/lib/seeded-random';

interface NodeReward {
  name: string;
  quantity: number;
  chance: number;
  icon?: string;
}

interface StoryNode {
  id: string;
  label: string;
  x: number;
  y: number;
  storyNodeType: 'normal' | 'event' | 'boss' | 'final_boss';
  challenger?: boolean;
  index?: number;
}

interface Connection {
  from: string;
  to: string;
}

interface TreeData {
  nodes: StoryNode[];
  connections: Connection[];
  name?: string;
  chapter?: number;
}

interface TreeNode {
  id: string;
  label: string;
  x: number;
  y: number;
  level: number;
  type: 'normal' | 'challenger' | 'event' | 'boss' | 'final_boss';
  rewards?: NodeReward[];
  mechanisms?: number[];
}

interface PreviewTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  seed: string;
  chapter: number;
}

export default function PreviewTreeModal({ isOpen, onClose, seed, chapter }: PreviewTreeModalProps) {
  // Load actual story trees from database
  const storyTrees = useQuery(api.storyTrees.getAllStoryTrees);
  const v2Tree = storyTrees?.find(tree => tree.name === "V2");
  const v1Tree = storyTrees?.find(tree => tree.name === "V1");
  const test5Tree = storyTrees?.find(tree => tree.name === "test 5");

  // Use actual tree data if available, otherwise generate preview
  const databaseTree = v2Tree || v1Tree || test5Tree;

  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<TreeNode | null>(null);
  const [zoom, setZoom] = useState(0.7);
  const [panOffset, setPanOffset] = useState({ x: 0, y: -100 });
  const [isPanning, setIsPanning] = useState(false);
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate rewards based on node type
  const generateRewards = (nodeType: string, level: number, rng: () => number): NodeReward[] => {
    const baseRewards: NodeReward[] = [];

    if (nodeType === 'final_boss') {
      baseRewards.push(
        { name: "Legendary Power Chip", quantity: 3, chance: 100, icon: "💎" },
        { name: "Epic Frame", quantity: 2, chance: 100, icon: "🖼️" },
        { name: "DMT Canister", quantity: 10, chance: 100, icon: "🧪" },
        { name: "Bumblebee Essence", quantity: 50, chance: 100, icon: "🐝" },
        { name: "Paul Essence", quantity: 75, chance: 100, icon: "⚡" }
      );
    } else if (nodeType === 'boss') {
      baseRewards.push(
        { name: "Rare Power Chip", quantity: 2, chance: 80, icon: "💠" },
        { name: "Epic Frame", quantity: 1, chance: 30, icon: "🖼️" },
        { name: "DMT Canister", quantity: 3, chance: 75, icon: "🧪" },
        { name: "Bumblebee Essence", quantity: 15, chance: 90, icon: "🐝" },
        { name: "Paul Essence", quantity: 20, chance: 85, icon: "⚡" }
      );
    } else if (nodeType === 'event') {
      const eventType = Math.floor(rng() * 3);
      if (eventType === 0) { // Mystery Box
        baseRewards.push(
          { name: "Random Power Chip", quantity: 1 + Math.floor(rng() * 3), chance: 100, icon: "📦" },
          { name: "Gold", quantity: 100 * level, chance: 100, icon: "💰" }
        );
      } else if (eventType === 1) { // Essence Cache
        baseRewards.push(
          { name: "Bumblebee Essence", quantity: 5 + Math.floor(rng() * 10), chance: 100, icon: "🐝" },
          { name: "Paul Essence", quantity: 8 + Math.floor(rng() * 12), chance: 100, icon: "⚡" }
        );
      } else { // Challenge Event
        baseRewards.push(
          { name: "DMT Canister", quantity: 1 + Math.floor(rng() * 2), chance: 100, icon: "🧪" },
          { name: "Rare Power Chip", quantity: 1, chance: 50, icon: "💠" }
        );
      }
    } else if (nodeType === 'challenger') {
      baseRewards.push(
        { name: "Common Power Chip", quantity: 3, chance: 100, icon: "🔷" },
        { name: "Bumblebee Essence", quantity: 3, chance: 75, icon: "🐝" },
        { name: "Paul Essence", quantity: 4, chance: 65, icon: "⚡" },
        { name: "DMT Canister", quantity: 1, chance: 30, icon: "🧪" }
      );
    } else { // normal
      baseRewards.push(
        { name: "Common Power Chip", quantity: 1, chance: 60, icon: "🔷" },
        { name: "Bumblebee Essence", quantity: 1, chance: 45, icon: "🐝" },
        { name: "Paul Essence", quantity: 1, chance: 35, icon: "⚡" }
      );
    }

    return baseRewards;
  };

  // Convert database tree nodes to preview format
  const convertDatabaseNodes = useCallback((treeData: TreeData): TreeNode[] => {
    if (!treeData || !treeData.nodes) return [];

    // Find bounds to normalize coordinates
    const minX = Math.min(...treeData.nodes.map(n => n.x));
    const maxX = Math.max(...treeData.nodes.map(n => n.x));
    const minY = Math.min(...treeData.nodes.map(n => n.y));
    const maxY = Math.max(...treeData.nodes.map(n => n.y));

    const xRange = maxX - minX || 1;
    const yRange = maxY - minY || 1;

    return treeData.nodes.map(node => {
      // Normalize coordinates to fit in preview window
      const normalizedX = ((node.x - minX) / xRange - 0.5) * 600;
      const normalizedY = -((node.y - minY) / yRange) * 800; // Negative for upward growth

      // Determine display type from storyNodeType and challenger flag
      let displayType: TreeNode['type'] = 'normal';
      if (node.storyNodeType === 'final_boss') displayType = 'final_boss';
      else if (node.storyNodeType === 'boss') displayType = 'boss';
      else if (node.storyNodeType === 'event') displayType = 'event';
      else if (node.challenger) displayType = 'challenger';

      // Calculate level based on Y position (lower Y = higher level)
      const level = Math.floor((maxY - node.y) / (yRange / 42));

      return {
        id: node.id,
        label: node.label ||
               (displayType === 'final_boss' ? `Ch${chapter} Boss` :
                displayType === 'boss' ? `Boss` :
                displayType === 'event' ? `Event` :
                displayType === 'challenger' ? `Elite` :
                `Node`),
        x: normalizedX,
        y: normalizedY,
        level: level,
        type: displayType,
        rewards: generateRewards(displayType, level + 1, () => Math.random()),
        mechanisms: displayType === 'normal' ?
          [3651 - Math.floor(Math.random() * 350) - (chapter - 1) * 350] : undefined
      };
    });
  }, [chapter]);

  // Generate tree nodes
  useEffect(() => {
    if (!isOpen) return;

    // If we have database tree data, use it
    if (databaseTree && databaseTree.nodes) {
      console.log('Using database tree:', databaseTree.name);
      const convertedNodes = convertDatabaseNodes(databaseTree);
      setNodes(convertedNodes);
      return;
    }

    // Otherwise generate preview nodes
    console.log('No database tree found, generating preview with seed:', seed);
    const rng = createSeededRandomFromString(seed + chapter);
    const generatedNodes: TreeNode[] = [];
    const levelsPerChapter = 42;

    // Generate nodes for the chapter
    for (let level = 0; level < levelsPerChapter; level++) {
      const nodeCount = Math.floor(3 + rng.random() * 4); // 3-6 nodes per level

      for (let i = 0; i < nodeCount; i++) {
        const nodeId = `${chapter}-${level}-${i}`;
        const x = (i / (nodeCount - 1)) * 500 - 250;
        const y = -level * 20;

        // Determine node type based on position and random
        let nodeType: TreeNode['type'] = 'normal';

        if (level === levelsPerChapter - 1 && i === Math.floor(nodeCount / 2)) {
          nodeType = 'final_boss';
        } else if (level % 10 === 9 && i === Math.floor(nodeCount / 2)) {
          nodeType = 'boss';
        } else if (level % 5 === 2 && rng.random() < 0.15) {
          nodeType = 'event';
        } else if (rng.random() < 0.12) {
          nodeType = 'challenger';
        }

        const node: TreeNode = {
          id: nodeId,
          label: nodeType === 'final_boss' ? `Ch${chapter} Boss` :
                 nodeType === 'boss' ? `Boss ${Math.floor(level/10)+1}` :
                 nodeType === 'event' ? `Event` :
                 nodeType === 'challenger' ? `Elite` :
                 `Node ${i+1}`,
          x,
          y,
          level,
          type: nodeType,
          rewards: generateRewards(nodeType, level + 1, () => rng.random()),
          mechanisms: nodeType === 'normal' ?
            [3651 - Math.floor(rng.random() * 350) - (chapter - 1) * 350] : undefined
        };

        generatedNodes.push(node);
      }
    }

    setNodes(generatedNodes);
  }, [isOpen, seed, chapter, databaseTree, convertDatabaseNodes]);

  // Draw the tree
  useEffect(() => {
    if (!canvasRef.current || !isOpen) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save context
    ctx.save();

    // Apply transforms
    ctx.translate(canvas.width / 2 + panOffset.x, canvas.height - 50 + panOffset.y);
    ctx.scale(zoom, zoom);

    // Draw connections
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;

    // If we have database connections, use them
    if (databaseTree && databaseTree.connections) {
      databaseTree.connections.forEach(conn => {
        const fromNode = nodes.find(n => n.id === conn.from);
        const toNode = nodes.find(n => n.id === conn.to);
        if (fromNode && toNode) {
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.stroke();
        }
      });
    } else {
      // Otherwise use level-based connections
      for (let level = 1; level < 42; level++) {
        const currentLevelNodes = nodes.filter(n => n.level === level);
        const prevLevelNodes = nodes.filter(n => n.level === level - 1);

        currentLevelNodes.forEach(current => {
          prevLevelNodes.forEach(prev => {
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(current.x, current.y);
            ctx.stroke();
          });
        });
      }
    }

    // Draw nodes
    nodes.forEach(node => {
      const isHovered = hoveredNode?.id === node.id;
      const radius = node.type === 'final_boss' ? 20 :
                     node.type === 'boss' ? 15 :
                     node.type === 'event' ? 12 :
                     node.type === 'challenger' ? 10 : 8;

      // Node glow effect
      if (isHovered) {
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius * 2);
        gradient.addColorStop(0, 'rgba(250, 182, 23, 0.3)');
        gradient.addColorStop(1, 'rgba(250, 182, 23, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Node fill
      ctx.fillStyle = node.type === 'final_boss' ? '#FFD700' :
                     node.type === 'boss' ? '#FF4444' :
                     node.type === 'event' ? '#9B59B6' :
                     node.type === 'challenger' ? '#FF8800' :
                     '#4A9EFF';

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Node border
      ctx.strokeStyle = isHovered ? '#FFF' : '#222';
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.stroke();

      // Node icon
      if (node.type !== 'normal') {
        ctx.fillStyle = '#FFF';
        ctx.font = `${radius}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icon = node.type === 'final_boss' ? '👑' :
                    node.type === 'boss' ? '💀' :
                    node.type === 'event' ? '❓' :
                    node.type === 'challenger' ? '⚔️' : '';
        ctx.fillText(icon, node.x, node.y);
      }
    });

    // Restore context
    ctx.restore();
  }, [nodes, hoveredNode, zoom, panOffset, isOpen, databaseTree]);

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setPanStart({ x: panOffset.x, y: panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isPanning) {
      const dx = e.clientX - mouseDownPos.x;
      const dy = e.clientY - mouseDownPos.y;
      setPanOffset({ x: panStart.x + dx, y: panStart.y + dy });
    } else {
      // Check for hover
      const canvasX = (x - canvasRef.current.width / 2 - panOffset.x) / zoom;
      const canvasY = (y - canvasRef.current.height + 50 - panOffset.y) / zoom;

      const hoveredNode = nodes.find(node => {
        const dx = node.x - canvasX;
        const dy = node.y - canvasY;
        const radius = node.type === 'final_boss' ? 20 :
                       node.type === 'boss' ? 15 :
                       node.type === 'event' ? 12 :
                       node.type === 'challenger' ? 10 : 8;
        return Math.sqrt(dx * dx + dy * dy) < radius;
      });

      setHoveredNode(hoveredNode || null);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.3, Math.min(2, prev * delta)));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg border-2 border-yellow-500/50 p-6 max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-yellow-500">
            Chapter {chapter} Preview {databaseTree ? `(${databaseTree.name} tree)` : `(Seed: ${seed})`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 relative bg-black/50 rounded-lg overflow-hidden" ref={containerRef}>
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />

          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={() => setZoom(prev => Math.min(2, prev * 1.2))}
              className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded"
            >
              +
            </button>
            <button
              onClick={() => setZoom(prev => Math.max(0.3, prev * 0.8))}
              className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded"
            >
              -
            </button>
            <button
              onClick={() => {
                setZoom(0.7);
                setPanOffset({ x: 0, y: -100 });
              }}
              className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded"
            >
              Reset
            </button>
          </div>

          {/* Hover Tooltip */}
          {hoveredNode && (
            <div className="absolute top-4 left-4 bg-gray-900/95 border-2 border-yellow-500/50 rounded-lg p-4 max-w-sm">
              <h3 className="text-yellow-400 font-bold mb-2">
                {hoveredNode.label} (Level {hoveredNode.level + 1})
              </h3>
              {hoveredNode.mechanisms && (
                <div className="text-gray-300 text-sm mb-2">
                  Mechanism Rank: #{hoveredNode.mechanisms[0]}
                </div>
              )}
              {hoveredNode.rewards && hoveredNode.rewards.length > 0 && (
                <div className="space-y-1">
                  <div className="text-gray-400 text-xs font-bold uppercase">Rewards:</div>
                  {hoveredNode.rewards.map((reward, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">
                        {reward.icon} {reward.name}
                      </span>
                      <span className="text-yellow-400">
                        x{reward.quantity} ({reward.chance}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="absolute top-4 right-4 bg-gray-900/90 rounded-lg p-3 text-xs">
            <div className="font-bold text-yellow-400 mb-2">Node Types</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#4A9EFF] rounded-full"></div>
                <span className="text-gray-300">Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#FF8800] rounded-full"></div>
                <span className="text-gray-300">Challenger</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#9B59B6] rounded-full"></div>
                <span className="text-gray-300">Event</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#FF4444] rounded-full"></div>
                <span className="text-gray-300">Boss</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#FFD700] rounded-full"></div>
                <span className="text-gray-300">Final Boss</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}