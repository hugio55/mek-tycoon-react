'use client';

import React, { useState } from 'react';

interface NodeData {
  id: string;
  path: 'gold' | 'essence' | 'looter';
  label: string;
  x: number;
  y: number;
  connections: string[];
  crossConnections?: string[]; // Blue dashed connections
}

const TalentTree: React.FC = () => {
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Grid-based positioning
  // Columns: 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
  // Rows: Every 10 units
  
  const nodes: NodeData[] = [
    // GOLD PATH - Left side
    { id: 'G1', path: 'gold', label: '1', x: 20, y: 10, connections: ['G2'] },
    { id: 'G2', path: 'gold', label: '2', x: 20, y: 20, connections: ['G3A', 'G3B'] },
    { id: 'G3A', path: 'gold', label: '3A', x: 10, y: 30, connections: ['G4A'], crossConnections: ['G3B'] },
    { id: 'G3B', path: 'gold', label: '3B', x: 30, y: 30, connections: ['G4B'] },
    { id: 'G4A', path: 'gold', label: '4A', x: 10, y: 40, connections: ['G5A'] },
    { id: 'G4B', path: 'gold', label: '4B', x: 30, y: 40, connections: ['G5B'] },
    { id: 'G5A', path: 'gold', label: '5A', x: 10, y: 50, connections: ['G6A'] },
    { id: 'G5B', path: 'gold', label: '5B', x: 30, y: 50, connections: ['G6B'] },
    { id: 'G6A', path: 'gold', label: '6A', x: 10, y: 60, connections: ['G7A'] },
    { id: 'G6B', path: 'gold', label: '6B', x: 30, y: 60, connections: ['G7B'] },
    { id: 'G7A', path: 'gold', label: '7A', x: 10, y: 70, connections: ['G8A1', 'G8A2'] },
    { id: 'G7B', path: 'gold', label: '7B', x: 30, y: 70, connections: ['G8B'], crossConnections: ['E8'] },
    { id: 'G8A1', path: 'gold', label: '8A1', x: 0, y: 80, connections: ['G9A1'] },
    { id: 'G8A2', path: 'gold', label: '8A2', x: 10, y: 80, connections: ['G9A2'] },
    { id: 'G8B', path: 'gold', label: '8B', x: 30, y: 80, connections: ['G9B'], crossConnections: ['G8A2'] },
    { id: 'G9A1', path: 'gold', label: '9A1', x: 0, y: 90, connections: ['G10A1A'] },
    { id: 'G9A2', path: 'gold', label: '9A2', x: 10, y: 90, connections: ['G10A1B', 'G10A2'], crossConnections: ['G9B'] },
    { id: 'G9B', path: 'gold', label: '9B', x: 30, y: 90, connections: ['G10B'] },
    { id: 'G10A1A', path: 'gold', label: '10A1A', x: 0, y: 100, connections: [] },
    { id: 'G10A1B', path: 'gold', label: '10A1B', x: 10, y: 100, connections: [] },
    { id: 'G10A2', path: 'gold', label: '10A2', x: 20, y: 100, connections: [] },
    { id: 'G10B', path: 'gold', label: '10B', x: 30, y: 100, connections: [] },

    // ESSENCE PATH - Center
    { id: 'E1', path: 'essence', label: '1', x: 50, y: 10, connections: ['E2'] },
    { id: 'E2', path: 'essence', label: '2', x: 50, y: 20, connections: ['E3'] },
    { id: 'E3', path: 'essence', label: '3', x: 50, y: 30, connections: ['E4'] },
    { id: 'E4', path: 'essence', label: '4', x: 50, y: 40, connections: ['E5'] },
    { id: 'E5', path: 'essence', label: '5', x: 50, y: 50, connections: ['E6'] },
    { id: 'E6', path: 'essence', label: '6', x: 50, y: 60, connections: ['E7'] },
    { id: 'E7', path: 'essence', label: '7', x: 50, y: 70, connections: ['E8'] },
    { id: 'E8', path: 'essence', label: '8', x: 50, y: 80, connections: ['E9'], crossConnections: ['L7A'] },
    { id: 'E9', path: 'essence', label: '9', x: 50, y: 90, connections: ['E10'] },
    { id: 'E10', path: 'essence', label: '10', x: 50, y: 100, connections: [] },

    // LOOTER PATH - Right side
    { id: 'L1', path: 'looter', label: '1', x: 80, y: 10, connections: ['L2'] },
    { id: 'L2', path: 'looter', label: '2', x: 80, y: 20, connections: ['L3A', 'L3B'] },
    { id: 'L3A', path: 'looter', label: '3A', x: 70, y: 30, connections: ['L4A'], crossConnections: ['L3B'] },
    { id: 'L3B', path: 'looter', label: '3B', x: 90, y: 30, connections: ['L4B'] },
    { id: 'L4A', path: 'looter', label: '4A', x: 70, y: 40, connections: ['L5A'] },
    { id: 'L4B', path: 'looter', label: '4B', x: 90, y: 40, connections: ['L5B'] },
    { id: 'L5A', path: 'looter', label: '5A', x: 70, y: 50, connections: ['L6A'] },
    { id: 'L5B', path: 'looter', label: '5B', x: 90, y: 50, connections: ['L6B'] },
    { id: 'L6A', path: 'looter', label: '6A', x: 70, y: 60, connections: ['L7A'] },
    { id: 'L6B', path: 'looter', label: '6B', x: 90, y: 60, connections: ['L7B'] },
    { id: 'L7A', path: 'looter', label: '7A', x: 70, y: 70, connections: ['L8A2'] },
    { id: 'L7B', path: 'looter', label: '7B', x: 90, y: 70, connections: ['L8B', 'L8A1'] },
    { id: 'L8A1', path: 'looter', label: '8A1', x: 100, y: 80, connections: ['L9A1'] },
    { id: 'L8A2', path: 'looter', label: '8A2', x: 70, y: 80, connections: ['L9A2'] },
    { id: 'L8B', path: 'looter', label: '8B', x: 90, y: 80, connections: ['L9B'], crossConnections: ['L8A2'] },
    { id: 'L9A1', path: 'looter', label: '9A1', x: 100, y: 90, connections: ['L10A1A'] },
    { id: 'L9A2', path: 'looter', label: '9A2', x: 70, y: 90, connections: ['L10A2'], crossConnections: ['L9B'] },
    { id: 'L9B', path: 'looter', label: '9B', x: 90, y: 90, connections: ['L10B'] },
    { id: 'L10A1A', path: 'looter', label: '10A1A', x: 100, y: 100, connections: [] },
    { id: 'L10A1B', path: 'looter', label: '10A1B', x: 90, y: 100, connections: [] },
    { id: 'L10A2', path: 'looter', label: '10A2', x: 80, y: 100, connections: [] },
    { id: 'L10B', path: 'looter', label: '10B', x: 70, y: 100, connections: [] },
  ];

  const getNodeColor = (path: string) => {
    switch (path) {
      case 'gold': return '#8b5cf6'; // Purple
      case 'essence': return '#000000'; // Black
      case 'looter': return '#ef4444'; // Red
      default: return '#6b7280';
    }
  };

  const handleNodeClick = (nodeId: string) => {
    const newSelected = new Set(selectedNodes);
    if (newSelected.has(nodeId)) {
      newSelected.delete(nodeId);
    } else {
      newSelected.add(nodeId);
    }
    setSelectedNodes(newSelected);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-900 p-6 rounded-lg">
      <div className="flex justify-around mb-6">
        <div className="text-center">
          <div className="w-4 h-4 bg-purple-500 rounded-full mx-auto mb-1"></div>
          <span className="text-xs text-gray-300">Gold Path</span>
        </div>
        <div className="text-center">
          <div className="w-4 h-4 bg-black border border-gray-400 rounded-full mx-auto mb-1"></div>
          <span className="text-xs text-gray-300">Essence Path</span>
        </div>
        <div className="text-center">
          <div className="w-4 h-4 bg-red-500 rounded-full mx-auto mb-1"></div>
          <span className="text-xs text-gray-300">Looter Path</span>
        </div>
      </div>

      <svg
        viewBox="-5 5 110 100"
        className="w-full h-auto"
        style={{ maxHeight: '70vh' }}
      >
        {/* Draw regular connections */}
        {nodes.map(node => 
          node.connections.map(targetId => {
            const target = nodes.find(n => n.id === targetId);
            if (!target) return null;
            return (
              <line
                key={`${node.id}-${targetId}`}
                x1={node.x}
                y1={node.y}
                x2={target.x}
                y2={target.y}
                stroke={getNodeColor(node.path)}
                strokeWidth="0.5"
                opacity="0.7"
              />
            );
          })
        )}

        {/* Draw cross connections (blue dashed) */}
        {nodes.map(node => 
          node.crossConnections?.map(targetId => {
            const target = nodes.find(n => n.id === targetId);
            if (!target) return null;
            return (
              <line
                key={`cross-${node.id}-${targetId}`}
                x1={node.x}
                y1={node.y}
                x2={target.x}
                y2={target.y}
                stroke="#3b82f6"
                strokeWidth="0.5"
                opacity="0.6"
                strokeDasharray="2,1"
              />
            );
          })
        )}

        {/* Draw nodes */}
        {nodes.map(node => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r="4"
              fill={getNodeColor(node.path)}
              stroke={selectedNodes.has(node.id) ? '#fbbf24' : (node.path === 'essence' ? '#666' : 'none')}
              strokeWidth={selectedNodes.has(node.id) ? '1' : '0.5'}
              className="cursor-pointer transition-all"
              onClick={() => handleNodeClick(node.id)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            />
            <text
              x={node.x}
              y={node.y + 1}
              textAnchor="middle"
              fill="white"
              fontSize="3"
              fontWeight="bold"
              pointerEvents="none"
              className="select-none"
            >
              {node.label}
            </text>
          </g>
        ))}

        {/* Draw grid dots for reference (optional - remove in production) */}
        {/* {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(x =>
          [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(y => (
            <circle
              key={`grid-${x}-${y}`}
              cx={x}
              cy={y}
              r="0.5"
              fill="#333"
              opacity="0.3"
            />
          ))
        )} */}
      </svg>

      {hoveredNode && (
        <div className="mt-4 p-3 bg-gray-800 rounded text-sm text-gray-300">
          <p className="font-bold">{hoveredNode}</p>
          <p className="text-xs text-gray-500 mt-1">Click to select/deselect</p>
        </div>
      )}
    </div>
  );
};

export default TalentTree;