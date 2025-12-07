'use client';

import React, { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface TalentNode {
  id: string;
  name: string;
  x: number;
  y: number;
  tier: number;
  desc: string;
  xp: number;
  nodeType?: 'stat' | 'ability' | 'passive' | 'special';
  isLabel?: boolean;
  labelText?: string;
}

interface Connection {
  from: string;
  to: string;
}

interface TransformedNode extends TalentNode {
  normalX: number;
  normalY: number;
}

interface MekAbilitiesTreeProps {
  // Option 1: Pass template data directly
  nodes?: TalentNode[];
  connections?: Connection[];
  // Option 2: Load template by ID
  templateId?: string;
  // Option 3: Load template by category ID (gets active template)
  categoryId?: string;
  // Display options
  rotated?: boolean; // Rotate 90° for horizontal display (default: true)
  showNodeNames?: boolean;
  nodeColor?: string;
  connectionColor?: string;
  className?: string;
}

export default function MekAbilitiesTree({
  nodes: propNodes,
  connections: propConnections,
  templateId,
  categoryId,
  rotated = true,
  showNodeNames = false,
  nodeColor = '#fbbf24',
  connectionColor = '#666',
  className = ''
}: MekAbilitiesTreeProps) {
  // Load template by ID if provided
  const templateById = useQuery(
    api.mekTreeTemplates.getTemplate,
    templateId ? { templateId: templateId as Id<"mekTreeTemplates"> } : 'skip'
  );

  // Load active template directly from category (single query that handles the lookup)
  const activeTemplateFromCategory = useQuery(
    api.mekTreeCategories.getActiveTemplateForCategory,
    categoryId ? { categoryId: categoryId as Id<"mekTreeCategories"> } : 'skip'
  );

  // Debug logging
  console.log('[🌳TREE] Props:', { categoryId, templateId, hasPropNodes: !!propNodes });
  console.log('[🌳TREE] templateById:', templateById);
  console.log('[🌳TREE] activeTemplateFromCategory:', activeTemplateFromCategory);

  // Determine which nodes/connections to use
  const { nodes, connections } = useMemo(() => {
    // Priority: direct props > templateId > categoryId's active template
    if (propNodes && propConnections) {
      console.log('[🌳TREE] Using propNodes:', propNodes.length, 'nodes');
      return { nodes: propNodes, connections: propConnections };
    }
    if (templateById) {
      console.log('[🌳TREE] Using templateById:', templateById.nodes?.length || 0, 'nodes');
      return { nodes: templateById.nodes || [], connections: templateById.connections || [] };
    }
    if (activeTemplateFromCategory) {
      console.log('[🌳TREE] Using activeTemplateFromCategory:', activeTemplateFromCategory.nodes?.length || 0, 'nodes');
      return { nodes: activeTemplateFromCategory.nodes || [], connections: activeTemplateFromCategory.connections || [] };
    }
    console.log('[🌳TREE] No data source available');
    return { nodes: [], connections: [] };
  }, [propNodes, propConnections, templateById, activeTemplateFromCategory]);

  // Calculate bounding box and transform for rendering
  const { transformedNodes, viewBox, isEmpty } = useMemo(() => {
    if (!nodes || nodes.length === 0) {
      return { transformedNodes: [], viewBox: { x: 0, y: 0, width: 100, height: 100 }, isEmpty: true };
    }

    // Filter out label nodes for bounding box calculation
    const regularNodes = nodes.filter((n: TalentNode) => !n.isLabel);
    if (regularNodes.length === 0) {
      return { transformedNodes: [], viewBox: { x: 0, y: 0, width: 100, height: 100 }, isEmpty: true };
    }

    const NODE_SIZE = 30;
    const PADDING = 40;

    // Find bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    regularNodes.forEach((node: TalentNode) => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x + NODE_SIZE);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y + NODE_SIZE);
    });

    // Add padding
    minX -= PADDING;
    minY -= PADDING;
    maxX += PADDING;
    maxY += PADDING;

    const originalWidth = maxX - minX;
    const originalHeight = maxY - minY;

    // Transform nodes to normalized coordinates
    const transformed = nodes.map((node: TalentNode) => ({
      ...node,
      // Normalize to start from 0
      normalX: node.x - minX,
      normalY: node.y - minY
    }));

    // For rotated view, swap width/height in viewBox
    const viewBox = rotated
      ? { x: 0, y: 0, width: originalHeight, height: originalWidth }
      : { x: 0, y: 0, width: originalWidth, height: originalHeight };

    return {
      transformedNodes: transformed,
      viewBox,
      isEmpty: false,
      originalWidth,
      originalHeight
    };
  }, [nodes, rotated]);

  // Loading state - queries return undefined while loading, null if not found
  const isLoading = (templateId && templateById === undefined) ||
                    (categoryId && activeTemplateFromCategory === undefined);

  if (isLoading) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className}`}>
        <div className="text-yellow-400/60 text-sm border border-yellow-500/20 px-4 py-2 rounded bg-black/30">
          Loading tree...
        </div>
      </div>
    );
  }

  // No active template set for category
  if (categoryId && activeTemplateFromCategory === null) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className}`}>
        <div className="text-yellow-400/60 text-sm border border-yellow-500/20 px-4 py-2 rounded bg-black/30">
          No active template set for this category
        </div>
      </div>
    );
  }

  // Empty state - no category or template selected
  if (isEmpty) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className}`}>
        <div className="text-yellow-400/60 text-sm border border-yellow-500/20 px-4 py-2 rounded bg-black/30">
          {!categoryId && !templateId
            ? 'Select a category from Style Variations panel'
            : 'No abilities tree assigned'}
        </div>
      </div>
    );
  }

  const NODE_SIZE = 30;
  const NODE_RADIUS = NODE_SIZE / 2;

  // For rotated display, we need to transform coordinates
  // Original: x goes right, y goes down
  // Rotated 90° CCW: old_y becomes new_x, old_x becomes new_y (inverted)
  const getCoords = (normalX: number, normalY: number) => {
    if (rotated) {
      // Rotate 90° counter-clockwise for horizontal display
      // This makes the tree flow left-to-right instead of top-to-bottom
      return {
        x: normalY,
        y: viewBox.height - normalX - NODE_SIZE
      };
    }
    return { x: normalX, y: normalY };
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <svg
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background gradient */}
        <defs>
          <linearGradient id="treeBgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.2)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
          </linearGradient>
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connections */}
        {connections.map((conn: Connection, index: number) => {
          const fromNode = transformedNodes.find((n: TransformedNode) => n.id === conn.from);
          const toNode = transformedNodes.find((n: TransformedNode) => n.id === conn.to);

          if (!fromNode || !toNode) return null;

          const fromCoords = getCoords(fromNode.normalX, fromNode.normalY);
          const toCoords = getCoords(toNode.normalX, toNode.normalY);

          const fromCenterX = fromCoords.x + NODE_RADIUS;
          const fromCenterY = fromCoords.y + NODE_RADIUS;
          const toCenterX = toCoords.x + NODE_RADIUS;
          const toCenterY = toCoords.y + NODE_RADIUS;

          return (
            <line
              key={`conn-${index}`}
              x1={fromCenterX}
              y1={fromCenterY}
              x2={toCenterX}
              y2={toCenterY}
              stroke={connectionColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}

        {/* Nodes */}
        {transformedNodes.map((node: TransformedNode) => {
          if (node.isLabel) return null;

          const coords = getCoords(node.normalX, node.normalY);
          const isStart = node.id === 'start' || node.id.startsWith('start-');

          // Determine node color based on type
          let fillColor = nodeColor;
          if (isStart) {
            fillColor = '#00ff88';
          } else if (node.nodeType === 'ability') {
            fillColor = '#3b82f6';
          } else if (node.nodeType === 'passive') {
            fillColor = '#8b5cf6';
          } else if (node.nodeType === 'special') {
            fillColor = '#f59e0b';
          }

          return (
            <g key={node.id}>
              {/* Node circle */}
              <circle
                cx={coords.x + NODE_RADIUS}
                cy={coords.y + NODE_RADIUS}
                r={NODE_RADIUS - 2}
                fill={fillColor}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
                filter="url(#nodeGlow)"
              />
              {/* Tier indicator */}
              <text
                x={coords.x + NODE_RADIUS}
                y={coords.y + NODE_RADIUS + 4}
                textAnchor="middle"
                fill="white"
                fontSize="10"
                fontWeight="bold"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
              >
                {isStart ? 'S' : node.tier}
              </text>
              {/* Node name (optional) */}
              {showNodeNames && node.name && (
                <text
                  x={coords.x + NODE_RADIUS}
                  y={coords.y + NODE_SIZE + 12}
                  textAnchor="middle"
                  fill="white"
                  fontSize="8"
                  opacity="0.8"
                >
                  {node.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
