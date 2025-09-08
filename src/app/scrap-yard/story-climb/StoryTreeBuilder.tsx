"use client";

import { useState, useRef, useEffect } from "react";
import { StoryNode, Connection } from "./types";

interface StoryTreeBuilderProps {
  nodes: StoryNode[];
  connections: Connection[];
  onNodesChange: (nodes: StoryNode[]) => void;
  onConnectionsChange: (connections: Connection[]) => void;
  canvasWidth: number;
  canvasHeight: number;
}

export default function StoryTreeBuilder({
  nodes,
  connections,
  onNodesChange,
  onConnectionsChange,
  canvasWidth,
  canvasHeight
}: StoryTreeBuilderProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Node types with colors
  const nodeTypes = [
    { type: 'normal', color: 'from-gray-600 to-gray-700', icon: '⚔️', label: 'Normal' },
    { type: 'event', color: 'from-purple-600 to-purple-700', icon: '❓', label: 'Event' },
    { type: 'boss', color: 'from-red-600 to-red-700', icon: '👹', label: 'Boss' },
    { type: 'final_boss', color: 'from-orange-600 to-purple-600', icon: '👑', label: 'Final Boss' }
  ];

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (connectionStart) {
      // Cancel connection mode
      setConnectionStart(null);
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left - canvasWidth / 2;
    const y = canvasHeight - (e.clientY - rect.top);

    // Check if clicking on empty space
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2));
      return distance < 40;
    });

    if (!clickedNode) {
      // Add new node
      const newNode: StoryNode = {
        id: `node-${Date.now()}`,
        x: Math.round(x / 10) * 10, // Snap to grid
        y: Math.round(y / 10) * 10,
        label: `Node ${nodes.length + 1}`,
        storyNodeType: 'normal',
        index: nodes.length + 1
      };
      onNodesChange([...nodes, newNode]);
      setSelectedNode(newNode.id);
    }
  };

  const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (connectionStart && connectionStart !== nodeId) {
      // Create connection
      const newConnection: Connection = {
        from: connectionStart,
        to: nodeId
      };
      
      // Check if connection already exists
      const exists = connections.some(c => 
        (c.from === connectionStart && c.to === nodeId) ||
        (c.from === nodeId && c.to === connectionStart)
      );
      
      if (!exists) {
        onConnectionsChange([...connections, newConnection]);
      }
      setConnectionStart(null);
    } else {
      setSelectedNode(nodeId);
    }
  };

  const handleNodeDrag = (nodeId: string, e: React.MouseEvent) => {
    if (e.buttons !== 1) return;
    setDraggingNode(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left - canvasWidth / 2;
    const y = canvasHeight - (e.clientY - rect.top);
    setMousePos({ x, y });

    if (draggingNode) {
      const updatedNodes = nodes.map(node => {
        if (node.id === draggingNode) {
          return {
            ...node,
            x: Math.round(x / 10) * 10,
            y: Math.round(y / 10) * 10
          };
        }
        return node;
      });
      onNodesChange(updatedNodes);
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  const deleteSelectedNode = () => {
    if (selectedNode) {
      onNodesChange(nodes.filter(n => n.id !== selectedNode));
      onConnectionsChange(connections.filter(c => c.from !== selectedNode && c.to !== selectedNode));
      setSelectedNode(null);
    }
  };

  const changeNodeType = (type: StoryNode['storyNodeType']) => {
    if (selectedNode) {
      const updatedNodes = nodes.map(node => {
        if (node.id === selectedNode) {
          return { ...node, storyNodeType: type };
        }
        return node;
      });
      onNodesChange(updatedNodes);
    }
  };

  const changeNodeLabel = (label: string) => {
    if (selectedNode) {
      const updatedNodes = nodes.map(node => {
        if (node.id === selectedNode) {
          return { ...node, label };
        }
        return node;
      });
      onNodesChange(updatedNodes);
    }
  };

  return (
    <div className="relative h-full">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-30 bg-black/80 backdrop-blur-md border border-yellow-400/30 rounded-lg p-4 space-y-4">
        <div>
          <h3 className="text-yellow-400 font-bold mb-2">Builder Mode</h3>
          <div className="text-xs text-gray-400 space-y-1">
            <div>• Click empty space to add node</div>
            <div>• Drag nodes to move</div>
            <div>• C + Click to connect nodes</div>
            <div>• Delete key to remove node</div>
          </div>
        </div>

        {selectedNode && (
          <div className="border-t border-gray-700 pt-4">
            <div className="text-sm text-yellow-400 mb-2">Selected Node</div>
            <input
              type="text"
              value={nodes.find(n => n.id === selectedNode)?.label || ''}
              onChange={(e) => changeNodeLabel(e.target.value)}
              className="w-full px-2 py-1 bg-black/50 border border-gray-600 rounded text-sm text-white mb-2"
            />
            <div className="grid grid-cols-2 gap-1">
              {nodeTypes.map(nt => (
                <button
                  key={nt.type}
                  onClick={() => changeNodeType(nt.type as StoryNode['storyNodeType'])}
                  className={`px-2 py-1 text-xs rounded border ${
                    nodes.find(n => n.id === selectedNode)?.storyNodeType === nt.type
                      ? 'border-yellow-400 bg-yellow-400/20'
                      : 'border-gray-600 hover:border-yellow-400/50'
                  }`}
                >
                  {nt.icon} {nt.label}
                </button>
              ))}
            </div>
            <button
              onClick={deleteSelectedNode}
              className="w-full mt-2 px-2 py-1 bg-red-600/20 hover:bg-red-600/30 border border-red-600 rounded text-xs text-red-400"
            >
              Delete Node
            </button>
          </div>
        )}

        <div className="border-t border-gray-700 pt-4">
          <button
            onClick={() => setConnectionStart(connectionStart ? null : selectedNode)}
            disabled={!selectedNode}
            className={`w-full px-3 py-2 rounded text-xs font-bold transition-all ${
              connectionStart 
                ? 'bg-orange-600 text-white'
                : selectedNode
                ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {connectionStart ? 'Cancel Connection' : 'Start Connection (C)'}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
      >
        {/* Grid */}
        <svg className="absolute inset-0 pointer-events-none opacity-10">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="gray" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Connections */}
        <svg className="absolute inset-0 pointer-events-none">
          {connections.map((conn, idx) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            const x1 = canvasWidth / 2 + fromNode.x;
            const y1 = canvasHeight - fromNode.y;
            const x2 = canvasWidth / 2 + toNode.x;
            const y2 = canvasHeight - toNode.y;

            return (
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#facc15"
                strokeWidth="2"
              />
            );
          })}
          
          {/* Connection preview */}
          {connectionStart && (
            <line
              x1={canvasWidth / 2 + (nodes.find(n => n.id === connectionStart)?.x || 0)}
              y1={canvasHeight - (nodes.find(n => n.id === connectionStart)?.y || 0)}
              x2={canvasWidth / 2 + mousePos.x}
              y2={canvasHeight - mousePos.y}
              stroke="#facc15"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.5"
            />
          )}
        </svg>

        {/* Nodes */}
        {nodes.map(node => {
          const nodeType = nodeTypes.find(nt => nt.type === node.storyNodeType) || nodeTypes[0];
          const x = canvasWidth / 2 + node.x - 40;
          const y = canvasHeight - node.y - 40;

          return (
            <div
              key={node.id}
              className={`absolute w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center cursor-move select-none transition-all
                bg-gradient-to-br ${nodeType.color}
                ${selectedNode === node.id ? 'border-yellow-400 ring-4 ring-yellow-400/30' : 'border-gray-600'}
                ${draggingNode === node.id ? 'opacity-50' : ''}
                hover:border-yellow-400/50
              `}
              style={{
                left: `${x}px`,
                top: `${y}px`,
              }}
              onClick={(e) => handleNodeClick(node.id, e)}
              onMouseDown={(e) => handleNodeDrag(node.id, e)}
            >
              <span className="text-2xl">{nodeType.icon}</span>
              <span className="text-xs font-bold mt-1 text-center px-1 truncate w-full">
                {node.label}
              </span>
              {node.id === 'start' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-green-500 rounded text-xs font-bold">
                  START
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Keyboard shortcuts */}
      <div className="absolute bottom-4 left-4 z-30 text-xs text-gray-500">
        Press C for connection mode | DEL to delete selected
      </div>
    </div>
  );
}