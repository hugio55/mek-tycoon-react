import React, { memo, useRef, useEffect, useCallback } from 'react';
import { TalentNode, Connection, DragState, CanvasMode } from '@/app/talent-builder/types';
import { TalentAction } from './talentReducer';

interface CanvasProps {
  nodes: TalentNode[];
  connections: Connection[];
  selectedNode: string | null;
  mode: CanvasMode;
  connectFrom: string | null;
  dragState: DragState;
  showGrid: boolean;
  snapToGrid: boolean;
  panOffset: { x: number; y: number };
  zoom: number;
  isPanning: boolean;
  panStart: { x: number; y: number };
  dispatch: React.Dispatch<TalentAction>;
  onAddNode: (x: number, y: number) => void;
}

const GRID_SIZE = 20;

const Canvas: React.FC<CanvasProps> = memo(({
  nodes,
  connections,
  selectedNode,
  mode,
  connectFrom,
  dragState,
  showGrid,
  snapToGrid,
  panOffset,
  zoom,
  isPanning,
  panStart,
  dispatch,
  onAddNode
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Prevent page scroll when over canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    
    canvas.addEventListener('wheel', preventScroll, { passive: false });
    
    return () => {
      if (canvas) {
        canvas.removeEventListener('wheel', preventScroll);
      }
    };
  }, []);

  const snapPosition = useCallback((value: number): number => {
    if (!snapToGrid) return value;
    const offset = GRID_SIZE / 2;
    return Math.round((value - offset) / GRID_SIZE) * GRID_SIZE + offset;
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
      dispatch({ 
        type: 'SET_SELECTED_NODE', 
        payload: selectedNode === nodeId ? null : nodeId 
      });
    }
  }, [mode, connectFrom, connections, selectedNode, dispatch]);

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
    
    if (isNodeClick) return;
    
    if (mode === 'add') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = (e.clientX - rect.left - panOffset.x) / zoom;
      const y = (e.clientY - rect.top - panOffset.y) / zoom;
      
      onAddNode(snapPosition(x), snapPosition(y));
      return;
    }
    
    if (mode === 'select') {
      dispatch({ type: 'SET_IS_PANNING', payload: true });
      dispatch({ type: 'SET_PAN_START', payload: { x: e.clientX, y: e.clientY } });
    }
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
    
    if (!dragState.isDragging || !dragState.nodeId) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const worldX = (e.clientX - rect.left - panOffset.x) / zoom - dragState.offsetX;
    const worldY = (e.clientY - rect.top - panOffset.y) / zoom - dragState.offsetY;
    
    dispatch({
      type: 'UPDATE_NODE',
      nodeId: dragState.nodeId,
      updates: {
        x: snapPosition(worldX),
        y: snapPosition(worldY)
      }
    });
  }, [isPanning, panStart, panOffset, dragState, zoom, snapPosition, dispatch]);

  const handleMouseUp = useCallback(() => {
    dispatch({ 
      type: 'SET_DRAG_STATE', 
      payload: { isDragging: false, nodeId: null, offsetX: 0, offsetY: 0 } 
    });
    dispatch({ type: 'SET_IS_PANNING', payload: false });
  }, [dispatch]);

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

  return (
    <div 
      ref={canvasRef}
      className="fixed inset-0 bg-gray-950"
      style={{ top: '200px' }}
      onWheel={handleWheel}
    >
      <div 
        className={`relative w-full h-full ${
          mode === 'add' ? 'cursor-crosshair' :
          mode === 'addLabel' ? 'cursor-text' :
          mode === 'connect' ? 'cursor-pointer' :
          'cursor-grab active:cursor-grabbing'
        }`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="canvas-content absolute"
          style={{ 
            width: '3000px', 
            height: '3000px',
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: dragState.isDragging || isPanning ? 'none' : 'transform 0.1s'
          }}
        >
          {/* Grid */}
          {showGrid && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.2 }}>
              <defs>
                <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                  <circle cx={GRID_SIZE/2} cy={GRID_SIZE/2} r="1" fill="white"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          )}

          {/* Connections */}
          {connections.map((conn, index) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            
            if (!fromNode || !toNode) return null;
            
            const isFromStart = fromNode.id === 'start' || fromNode.id.startsWith('start-');
            const isToStart = toNode.id === 'start' || toNode.id.startsWith('start-');
            
            const fromRadius = isFromStart ? 25 : 15;
            const toRadius = isToStart ? 25 : 15;
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
          
          {/* Nodes */}
          {nodes.map(node => {
            const isSelected = selectedNode === node.id;
            const isConnecting = connectFrom === node.id;
            const isStart = node.id === 'start' || node.id.startsWith('start-');

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
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)'
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
                    width: isStart ? '50px' : '30px',
                    height: isStart ? '50px' : '30px',
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    background: isStart
                      ? 'radial-gradient(circle, #00ff88, #00cc66)'
                      : node.isSpell ? 'linear-gradient(135deg, #9333ea, #c084fc)'
                      : node.nodeType === 'stat' ? '#3b82f6'
                      : node.nodeType === 'ability' ? '#a855f7'
                      : node.nodeType === 'passive' ? '#f97316'
                      : node.nodeType === 'special' ? '#ef4444'
                      : '#6b7280',
                    border: `3px solid ${
                      isSelected ? '#fbbf24' : isConnecting ? '#10b981' : 'transparent'
                    }`,
                    borderRadius: node.isSpell ? '4px' : '50%',
                    boxShadow: isSelected ? '0 0 20px rgba(251, 191, 36, 0.5)' :
                              isConnecting ? '0 0 20px rgba(16, 185, 129, 0.5)' :
                              isStart ? '0 0 15px rgba(0, 255, 136, 0.5)' : 'none',
                    zIndex: isSelected ? 20 : 10,
                    transform: isSelected ? 'scale(1.2)' : 'scale(1)'
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
                      {node.tier}
                    </div>
                  )}
                </div>
                {/* Node name label */}
                {node.name && (
                  <div
                    className="absolute pointer-events-none text-xs text-white font-medium"
                    style={{
                      left: `${node.x + (isStart ? 25 : 15)}px`,
                      top: `${node.y + (isStart ? 55 : 35)}px`,
                      transform: 'translateX(-50%)',
                      width: '100px',
                      textAlign: 'center',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)'
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