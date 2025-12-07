import React, { memo, useRef, useEffect, useCallback } from 'react';
import { TalentNode, Connection, DragState, CanvasMode, BoxSelection, LassoSelection, BuilderMode, ViewportDimensions, ViewportPosition } from '@/app/talent-builder/types';
import { TalentAction } from './talentReducer';

interface CanvasProps {
  nodes: TalentNode[];
  connections: Connection[];
  selectedNode: string | null;
  selectedNodes: Set<string>;
  mode: CanvasMode;
  builderMode: BuilderMode;
  connectFrom: string | null;
  dragState: DragState;
  showGrid: boolean;
  snapToGrid: boolean;
  panOffset: { x: number; y: number };
  zoom: number;
  isPanning: boolean;
  panStart: { x: number; y: number };
  boxSelection: BoxSelection;
  lassoSelection: LassoSelection;
  showViewportBox: boolean;
  viewportDimensions: ViewportDimensions;
  viewportPosition: ViewportPosition;
  unconnectedNodes: Set<string>;
  deadEndNodes: Set<string>;
  highlightDisconnected: boolean;
  storyChapter: number;
  dispatch: React.Dispatch<TalentAction>;
  onAddNode: (x: number, y: number) => void;
}

const GRID_SIZE = 20;

const Canvas: React.FC<CanvasProps> = memo(({
  nodes,
  connections,
  selectedNode,
  selectedNodes,
  mode,
  builderMode,
  connectFrom,
  dragState,
  showGrid,
  snapToGrid,
  panOffset,
  zoom,
  isPanning,
  panStart,
  boxSelection,
  lassoSelection,
  showViewportBox,
  viewportDimensions,
  viewportPosition,
  unconnectedNodes,
  deadEndNodes,
  highlightDisconnected,
  storyChapter,
  dispatch,
  onAddNode
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Prevent page scroll and middle-click auto-scroll when over canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
      // Don't stopPropagation - we want React's onWheel handler to still receive the event
      return false;
    };

    // Prevent middle-click auto-scroll
    const preventMiddleClick = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        return false;
      }
    };

    // Prevent context menu on right-click
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    canvas.addEventListener('wheel', preventScroll, { passive: false });
    canvas.addEventListener('mousedown', preventMiddleClick);
    canvas.addEventListener('auxclick', preventMiddleClick);
    canvas.addEventListener('contextmenu', preventContextMenu);

    return () => {
      if (canvas) {
        canvas.removeEventListener('wheel', preventScroll);
        canvas.removeEventListener('mousedown', preventMiddleClick);
        canvas.removeEventListener('auxclick', preventMiddleClick);
        canvas.removeEventListener('contextmenu', preventContextMenu);
      }
    };
  }, []);

  const snapPosition = useCallback((value: number): number => {
    if (!snapToGrid) return value;
    // For 30px nodes (radius 15), snap so CENTER lands on grid dots
    // Center = corner + 15, and dots are at multiples of GRID_SIZE (20)
    // So corner should be at (multiple of GRID_SIZE) - 15
    const nodeRadius = 15; // Half of 30px node
    const centerPosition = value + nodeRadius;
    const nearestDot = Math.round(centerPosition / GRID_SIZE) * GRID_SIZE;
    return nearestDot - nodeRadius;
  }, [snapToGrid]);

  const handleNodeClick = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (mode === 'connect') {
      if (!connectFrom) {
        dispatch({ type: 'SET_CONNECT_FROM', payload: nodeId });
      } else if (connectFrom !== nodeId) {
        const exists = connections.some(
          c => (c.from === connectFrom && c.to === nodeId) ||
               (c.from === nodeId && c.to === connectFrom)
        );

        if (!exists) {
          dispatch({
            type: 'ADD_CONNECTION',
            payload: { from: connectFrom, to: nodeId }
          });
        }
        dispatch({ type: 'SET_CONNECT_FROM', payload: null });
      }
    } else if (mode === 'select' || mode === 'add') {
      // Handle multi-select with shift key
      if (e.shiftKey) {
        const newSelectedNodes = new Set(selectedNodes);
        if (newSelectedNodes.has(nodeId)) {
          newSelectedNodes.delete(nodeId);
        } else {
          newSelectedNodes.add(nodeId);
        }
        dispatch({ type: 'SET_SELECTED_NODES', payload: newSelectedNodes });
      } else {
        dispatch({
          type: 'SET_SELECTED_NODE',
          payload: selectedNode === nodeId ? null : nodeId
        });
        dispatch({ type: 'SET_SELECTED_NODES', payload: new Set() });
      }
    }
  }, [mode, connectFrom, connections, selectedNode, selectedNodes, dispatch]);

  const handleNodeMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    if (mode === 'connect') return;
    e.stopPropagation();
    const nodeElement = e.currentTarget as HTMLElement;
    const rect = nodeElement.getBoundingClientRect();
    dispatch({
      type: 'SET_DRAG_STATE',
      payload: {
        isDragging: true,
        nodeId,
        offsetX: (e.clientX - rect.left) / zoom,
        offsetY: (e.clientY - rect.top) / zoom
      }
    });
  }, [mode, zoom, dispatch]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isNodeClick = target.closest('.talent-node');

    // Middle mouse button (button 1) always starts panning
    if (e.button === 1) {
      e.preventDefault();
      dispatch({ type: 'SET_IS_PANNING', payload: true });
      dispatch({ type: 'SET_PAN_START', payload: { x: e.clientX, y: e.clientY } });
      return;
    }

    if (isNodeClick) return;

    if (mode === 'add' || mode === 'addLabel') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left - panOffset.x) / zoom;
      const y = (e.clientY - rect.top - panOffset.y) / zoom;

      // For add mode, snap click position directly to nearest grid dot
      // The click position is where the node CENTER should go
      // onAddNode will subtract nodeRadius to get the corner position
      const snappedX = snapToGrid ? Math.round(x / GRID_SIZE) * GRID_SIZE : x;
      const snappedY = snapToGrid ? Math.round(y / GRID_SIZE) * GRID_SIZE : y;

      onAddNode(snappedX, snappedY);
      return;
    }

    if (mode === 'select') {
      // Start box selection
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left - panOffset.x) / zoom;
      const y = (e.clientY - rect.top - panOffset.y) / zoom;

      dispatch({
        type: 'SET_BOX_SELECTION',
        payload: {
          isSelecting: true,
          startX: x,
          startY: y,
          endX: x,
          endY: y,
          addToSelection: e.shiftKey
        }
      });
      return;
    }

    if (mode === 'lasso') {
      // Start lasso selection
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left - panOffset.x) / zoom;
      const y = (e.clientY - rect.top - panOffset.y) / zoom;

      dispatch({
        type: 'SET_LASSO_SELECTION',
        payload: {
          isSelecting: true,
          points: [{ x, y }]
        }
      });
      return;
    }

    // Left mouse button starts panning in other modes
    dispatch({ type: 'SET_IS_PANNING', payload: true });
    dispatch({ type: 'SET_PAN_START', payload: { x: e.clientX, y: e.clientY } });
  }, [mode, panOffset, zoom, snapPosition, onAddNode, dispatch]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      dispatch({
        type: 'SET_PAN_OFFSET',
        payload: {
          x: panOffset.x + deltaX,
          y: panOffset.y + deltaY
        }
      });
      dispatch({ type: 'SET_PAN_START', payload: { x: e.clientX, y: e.clientY } });
      return;
    }

    // Handle box selection
    if (boxSelection.isSelecting) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left - panOffset.x) / zoom;
      const y = (e.clientY - rect.top - panOffset.y) / zoom;

      dispatch({
        type: 'SET_BOX_SELECTION',
        payload: { ...boxSelection, endX: x, endY: y }
      });
      return;
    }

    // Handle lasso selection
    if (lassoSelection.isSelecting) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left - panOffset.x) / zoom;
      const y = (e.clientY - rect.top - panOffset.y) / zoom;

      dispatch({
        type: 'SET_LASSO_SELECTION',
        payload: {
          isSelecting: true,
          points: [...lassoSelection.points, { x, y }]
        }
      });
      return;
    }

    if (!dragState.isDragging || !dragState.nodeId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const worldX = (e.clientX - rect.left - panOffset.x) / zoom - dragState.offsetX;
    const worldY = (e.clientY - rect.top - panOffset.y) / zoom - dragState.offsetY;

    // If multiple nodes selected, move all of them
    if (selectedNodes.size > 1 && selectedNodes.has(dragState.nodeId)) {
      const targetNode = nodes.find(n => n.id === dragState.nodeId);
      if (targetNode) {
        const deltaX = snapPosition(worldX) - targetNode.x;
        const deltaY = snapPosition(worldY) - targetNode.y;

        const updates = Array.from(selectedNodes).map(nodeId => {
          const node = nodes.find(n => n.id === nodeId);
          if (!node) return null;
          return {
            nodeId,
            updates: {
              x: node.x + deltaX,
              y: node.y + deltaY
            }
          };
        }).filter(Boolean);

        dispatch({ type: 'UPDATE_NODES', updates: updates as { nodeId: string; updates: Partial<TalentNode> }[] });
      }
    } else {
      dispatch({
        type: 'UPDATE_NODE',
        nodeId: dragState.nodeId,
        updates: {
          x: snapPosition(worldX),
          y: snapPosition(worldY)
        }
      });
    }
  }, [isPanning, panStart, panOffset, boxSelection, lassoSelection, dragState, zoom, snapPosition, nodes, selectedNodes, dispatch]);

  const handleMouseUp = useCallback(() => {
    // Finish box selection
    if (boxSelection.isSelecting) {
      const minX = Math.min(boxSelection.startX, boxSelection.endX);
      const maxX = Math.max(boxSelection.startX, boxSelection.endX);
      const minY = Math.min(boxSelection.startY, boxSelection.endY);
      const maxY = Math.max(boxSelection.startY, boxSelection.endY);

      const nodesInBox = nodes.filter(node => {
        const nodeSize = getNodeSize(node);
        const nodeRadius = nodeSize / 2;
        const nodeCenterX = node.x + nodeRadius;
        const nodeCenterY = node.y + nodeRadius;
        return nodeCenterX >= minX && nodeCenterX <= maxX && nodeCenterY >= minY && nodeCenterY <= maxY;
      });

      const newSelectedNodes = boxSelection.addToSelection ? new Set(selectedNodes) : new Set<string>();
      nodesInBox.forEach(node => newSelectedNodes.add(node.id));

      dispatch({ type: 'SET_SELECTED_NODES', payload: newSelectedNodes });
      dispatch({ type: 'SET_BOX_SELECTION', payload: { isSelecting: false, startX: 0, startY: 0, endX: 0, endY: 0, addToSelection: false } });
      return;
    }

    // Finish lasso selection
    if (lassoSelection.isSelecting && lassoSelection.points.length > 2) {
      const nodesInLasso = nodes.filter(node => {
        const nodeSize = getNodeSize(node);
        const nodeRadius = nodeSize / 2;
        const nodeCenterX = node.x + nodeRadius;
        const nodeCenterY = node.y + nodeRadius;
        return isPointInPolygon(nodeCenterX, nodeCenterY, lassoSelection.points);
      });

      const newSelectedNodes = new Set<string>();
      nodesInLasso.forEach(node => newSelectedNodes.add(node.id));

      dispatch({ type: 'SET_SELECTED_NODES', payload: newSelectedNodes });
      dispatch({ type: 'SET_LASSO_SELECTION', payload: { isSelecting: false, points: [] } });
      return;
    }

    dispatch({
      type: 'SET_DRAG_STATE',
      payload: { isDragging: false, nodeId: null, offsetX: 0, offsetY: 0 }
    });
    dispatch({ type: 'SET_IS_PANNING', payload: false });
    dispatch({ type: 'SET_BOX_SELECTION', payload: { isSelecting: false, startX: 0, startY: 0, endX: 0, endY: 0, addToSelection: false } });
    dispatch({ type: 'SET_LASSO_SELECTION', payload: { isSelecting: false, points: [] } });
  }, [boxSelection, lassoSelection, nodes, selectedNodes, dispatch]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - panOffset.x) / zoom;
    const worldY = (mouseY - panOffset.y) / zoom;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.2, Math.min(3, zoom * delta));

    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;

    dispatch({ type: 'SET_ZOOM', payload: newZoom });
    dispatch({ type: 'SET_PAN_OFFSET', payload: { x: newPanX, y: newPanY } });
  }, [zoom, panOffset, dispatch]);

  const handleConnectionDelete = useCallback((index: number) => {
    dispatch({ type: 'DELETE_CONNECTION', index });
  }, [dispatch]);

  // Helper function for point-in-polygon test (ray casting)
  const isPointInPolygon = (x: number, y: number, polygon: { x: number; y: number }[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;

      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  };

  // Get node size based on type
  const getNodeSize = (node: TalentNode): number => {
    const isStart = node.id === 'start' || node.id.startsWith('start-');
    // Start node is same size as normal nodes (30px)
    if (isStart) return 30;

    if (builderMode === 'story' && node.storyNodeType) {
      if (node.storyNodeType === 'normal') return 40;
      if (node.storyNodeType === 'event') return 80;
      if (node.storyNodeType === 'boss') return 120;
      if (node.storyNodeType === 'final_boss') return 160;
    }

    return 30;
  };

  // Get node styling based on type
  const getNodeStyle = (node: TalentNode, isSelected: boolean, isConnecting: boolean) => {
    const isStart = node.id === 'start' || node.id.startsWith('start-');
    const size = getNodeSize(node);

    let background = '#6b7280';
    let borderRadius = '50%';

    if (isStart) {
      background = 'radial-gradient(circle, #00ff88, #00cc66)';
    } else if (builderMode === 'story' && node.storyNodeType) {
      if (node.storyNodeType === 'normal') {
        borderRadius = '8px';
        background = node.challenger
          ? 'linear-gradient(135deg, #ff8c00, #ffa500)'
          : '#3b82f6';
      } else if (node.storyNodeType === 'event') {
        background = 'linear-gradient(135deg, #9333ea, #c084fc)';
      } else if (node.storyNodeType === 'boss') {
        background = 'linear-gradient(135deg, #ef4444, #f87171)';
      } else if (node.storyNodeType === 'final_boss') {
        background = 'linear-gradient(135deg, #f97316, #fb923c)';
      }
    } else if (node.isSpell) {
      background = 'linear-gradient(135deg, #9333ea, #c084fc)';
      borderRadius = '4px';
    } else if (node.nodeType) {
      if (node.nodeType === 'stat') background = '#3b82f6';
      else if (node.nodeType === 'ability') background = '#a855f7';
      else if (node.nodeType === 'passive') background = '#f97316';
      else if (node.nodeType === 'special') background = '#ef4444';
    }

    return {
      width: `${size}px`,
      height: `${size}px`,
      left: `${node.x}px`,
      top: `${node.y}px`,
      background,
      border: `3px solid ${isSelected ? '#fbbf24' : isConnecting ? '#10b981' : 'transparent'}`,
      borderRadius,
      boxShadow: isSelected
        ? '0 0 20px rgba(251, 191, 36, 0.5)'
        : isConnecting
        ? '0 0 20px rgba(16, 185, 129, 0.5)'
        : isStart
        ? '0 0 15px rgba(0, 255, 136, 0.5)'
        : 'none',
      zIndex: isSelected ? 20 : 10,
      transform: isSelected ? 'scale(1.1)' : 'scale(1)'
    };
  };

  const gridSize = builderMode === 'story' ? 6000 : 3000;

  return (
    <div
      ref={canvasRef}
      className="absolute inset-0 bg-gray-950 overflow-hidden select-none"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      onWheel={handleWheel}
    >
      <div
        className={`relative w-full h-full ${
          isPanning ? 'cursor-grabbing' :
          mode === 'add' ? 'cursor-crosshair' :
          mode === 'addLabel' ? 'cursor-text' :
          mode === 'connect' ? 'cursor-pointer' :
          mode === 'lasso' ? 'cursor-crosshair' :
          'cursor-grab'
        }`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="canvas-content absolute"
          style={{
            width: `${gridSize}px`,
            height: `${gridSize}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: dragState.isDragging || isPanning || boxSelection.isSelecting || lassoSelection.isSelecting ? 'none' : 'transform 0.1s'
          }}
        >
          {/* Grid - offset pattern so center of grid lands on a dot */}
          {showGrid && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.25 }}>
              <defs>
                <pattern
                  id="grid"
                  width={GRID_SIZE}
                  height={GRID_SIZE}
                  patternUnits="userSpaceOnUse"
                  patternTransform={`translate(${-GRID_SIZE/2}, ${-GRID_SIZE/2})`}
                >
                  <circle cx={GRID_SIZE/2} cy={GRID_SIZE/2} r="1" fill="white"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          )}

          {/* Grid Center Marker - Fixed at absolute center of grid */}
          {showGrid && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${gridSize / 2}px`,
                top: `${gridSize / 2}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: 5
              }}
            >
              {/* Horizontal line */}
              <div
                className="absolute bg-red-500/60"
                style={{
                  width: '24px',
                  height: '2px',
                  left: '-12px',
                  top: '-1px'
                }}
              />
              {/* Vertical line */}
              <div
                className="absolute bg-red-500/60"
                style={{
                  width: '2px',
                  height: '24px',
                  left: '-1px',
                  top: '-12px'
                }}
              />
              {/* Center dot */}
              <div
                className="absolute bg-red-500 rounded-full"
                style={{
                  width: '6px',
                  height: '6px',
                  left: '-3px',
                  top: '-3px'
                }}
              />
            </div>
          )}

          {/* Story Mode Runway Guidelines */}
          {builderMode === 'story' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute h-full bg-yellow-500" style={{ left: '2850px', width: '2px', opacity: 0.3 }} />
              <div className="absolute h-full bg-yellow-500" style={{ left: '3150px', width: '2px', opacity: 0.3 }} />
              <div className="absolute h-full bg-yellow-500" style={{ left: '3000px', width: '1px', opacity: 0.2 }} />
              <div className="absolute w-full bg-red-500" style={{ bottom: '50px', height: '2px', opacity: 0.3 }} />
              <div className="absolute text-yellow-500 text-sm font-bold" style={{ left: '3010px', top: '10px', opacity: 0.5 }}>
                STORY RUNWAY (300px)
              </div>
            </div>
          )}

          {/* Viewport Box - Positioned relative to grid center with offset */}
          {showViewportBox && (
            <div
              className="absolute border-2 border-dashed border-yellow-500 pointer-events-none"
              style={{
                left: `${gridSize / 2 - viewportDimensions.width / 2 + (viewportPosition?.x || 0)}px`,
                top: `${gridSize / 2 - viewportDimensions.height / 2 + (viewportPosition?.y || 0)}px`,
                width: `${viewportDimensions.width}px`,
                height: `${viewportDimensions.height}px`,
                zIndex: 50
              }}
            >
              {/* Viewport label */}
              <div
                className="absolute -top-6 left-0 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded font-bold"
              >
                VIEWPORT ({viewportDimensions.width}x{viewportDimensions.height})
              </div>
              {/* Center crosshair */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-0.5 bg-yellow-500/50" />
                <div className="absolute w-0.5 h-4 bg-yellow-500/50" />
              </div>
            </div>
          )}

          {/* Connections */}
          {connections.map((conn, index) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);

            if (!fromNode || !toNode) return null;

            const fromSize = getNodeSize(fromNode);
            const toSize = getNodeSize(toNode);
            const fromRadius = fromSize / 2;
            const toRadius = toSize / 2;

            const fromCenterX = fromNode.x + fromRadius;
            const fromCenterY = fromNode.y + fromRadius;
            const toCenterX = toNode.x + toRadius;
            const toCenterY = toNode.y + toRadius;

            const dx = toCenterX - fromCenterX;
            const dy = toCenterY - fromCenterY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            return (
              <div
                key={index}
                className="absolute cursor-pointer hover:bg-red-500"
                style={{
                  width: `${length}px`,
                  height: '3px',
                  left: `${fromCenterX}px`,
                  top: `${fromCenterY}px`,
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: '0 50%',
                  background: connectFrom === conn.from || connectFrom === conn.to ? '#fbbf24' : '#666',
                  zIndex: 1
                }}
                onClick={() => handleConnectionDelete(index)}
              />
            );
          })}

          {/* Box Selection Rectangle */}
          {boxSelection.isSelecting && (
            <div
              style={{
                position: 'absolute',
                left: `${Math.min(boxSelection.startX, boxSelection.endX)}px`,
                top: `${Math.min(boxSelection.startY, boxSelection.endY)}px`,
                width: `${Math.abs(boxSelection.endX - boxSelection.startX)}px`,
                height: `${Math.abs(boxSelection.endY - boxSelection.startY)}px`,
                border: '2px dashed #fbbf24',
                background: 'rgba(251, 191, 36, 0.1)',
                pointerEvents: 'none',
                zIndex: 100
              }}
            />
          )}

          {/* Lasso Selection Path */}
          {lassoSelection.isSelecting && lassoSelection.points.length > 1 && (
            <svg
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 100
              }}
            >
              <polyline
                points={lassoSelection.points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="rgba(251, 191, 36, 0.1)"
                stroke="#fbbf24"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            </svg>
          )}

          {/* Nodes */}
          {nodes.map(node => {
            const isSelected = selectedNode === node.id || selectedNodes.has(node.id);
            const isConnecting = connectFrom === node.id;
            const isStart = node.id === 'start' || node.id.startsWith('start-');
            const isUnconnected = unconnectedNodes.has(node.id);
            const isDeadEnd = deadEndNodes.has(node.id);
            const hasIssue = isUnconnected || isDeadEnd;
            const isDimmed = highlightDisconnected && !hasIssue && !isSelected;
            const nodeSize = getNodeSize(node);

            // Render label nodes differently
            if (node.isLabel) {
              return (
                <div
                  key={node.id}
                  className="talent-node absolute cursor-move transition-all duration-200 flex items-center justify-center px-3 py-2"
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    minWidth: '120px',
                    background: 'rgba(147, 51, 234, 0.2)',
                    border: `2px solid ${isSelected ? '#fbbf24' : '#9333ea'}`,
                    borderRadius: '4px',
                    boxShadow: isSelected ? '0 0 20px rgba(251, 191, 36, 0.5)' : '0 0 10px rgba(147, 51, 234, 0.3)',
                    zIndex: isSelected ? 20 : 10,
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                    opacity: isDimmed ? 0.3 : 1
                  }}
                  onClick={(e) => handleNodeClick(node.id, e)}
                  onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                  onDoubleClick={() => dispatch({ type: 'SET_EDITING_NODE', payload: node.id })}
                >
                  <div className="text-sm font-medium text-purple-200 pointer-events-none whitespace-nowrap">
                    {node.labelText || 'Label'}
                  </div>
                </div>
              );
            }

            return (
              <div key={node.id}>
                <div
                  className={`talent-node absolute flex items-center justify-center cursor-move transition-all duration-200`}
                  style={{
                    ...getNodeStyle(node, isSelected, isConnecting),
                    opacity: isDimmed ? 0.3 : 1,
                    outline: hasIssue ? `3px solid ${isUnconnected ? '#ef4444' : '#f97316'}` : 'none',
                    outlineOffset: '2px'
                  }}
                  onClick={(e) => handleNodeClick(node.id, e)}
                  onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                  onDoubleClick={() => dispatch({ type: 'SET_EDITING_NODE', payload: node.id })}
                >
                  {node.imageUrl ? (
                    <img
                      src={node.imageUrl}
                      alt={node.name}
                      className={`w-full h-full object-cover pointer-events-none ${node.isSpell ? 'rounded' : 'rounded-full'}`}
                    />
                  ) : (
                    <div className="text-xs font-bold text-white pointer-events-none">
                      {builderMode === 'story' ? (
                        node.storyNodeType === 'normal' ? 'M' :
                        node.storyNodeType === 'event' ? 'E' :
                        node.storyNodeType === 'boss' ? 'B' :
                        node.storyNodeType === 'final_boss' ? 'F' :
                        node.tier
                      ) : node.tier}
                    </div>
                  )}
                </div>
                {/* Node name label */}
                {node.name && (
                  <div
                    className="absolute pointer-events-none text-xs text-white font-medium"
                    style={{
                      left: `${node.x + nodeSize / 2}px`,
                      top: `${node.y + nodeSize + 5}px`,
                      transform: 'translateX(-50%)',
                      width: '100px',
                      textAlign: 'center',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)',
                      opacity: isDimmed ? 0.3 : 1
                    }}
                  >
                    {node.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-gray-900/90 p-2 rounded">
        <button
          onClick={() => dispatch({ type: 'SET_ZOOM', payload: Math.min(3, zoom * 1.2) })}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
        >
          +
        </button>
        <div className="text-center text-xs text-yellow-400">{Math.round(zoom * 100)}%</div>
        <button
          onClick={() => dispatch({ type: 'SET_ZOOM', payload: Math.max(0.2, zoom * 0.8) })}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
        >
          -
        </button>
        <button
          onClick={() => dispatch({ type: 'RESET_VIEW' })}
          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
        >
          Reset
        </button>
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
