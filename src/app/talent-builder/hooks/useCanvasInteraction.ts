import { useCallback, useRef, RefObject } from 'react';
import { useTalentBuilder } from '../TalentBuilderContext';
import { useHistory } from './useHistory';
import { TalentNode } from '../types';

interface UseCanvasInteractionOptions {
  canvasRef: RefObject<HTMLDivElement>;
  onAddNode?: (x: number, y: number) => void;
}

interface UseCanvasInteractionReturn {
  // Mouse handlers
  handleCanvasMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleWheel: (e: React.WheelEvent) => void;

  // Node handlers
  handleNodeClick: (nodeId: string, e: React.MouseEvent) => void;
  handleNodeMouseDown: (nodeId: string, e: React.MouseEvent) => void;

  // Utility
  snapPosition: (value: number) => number;
  rotateSelectedNodes: (angleDegrees: number) => void;

  // Grid settings
  GRID_SIZE: number;
}

const GRID_SIZE = 20;

export function useCanvasInteraction(options: UseCanvasInteractionOptions): UseCanvasInteractionReturn {
  const { canvasRef, onAddNode } = options;
  const { state, dispatch, actions } = useTalentBuilder();
  const { pushHistory } = useHistory();

  // Snap to grid helper
  const snapPosition = useCallback((value: number): number => {
    if (!state.snapToGrid) return value;
    const offset = GRID_SIZE / 2;
    return Math.round((value - offset) / GRID_SIZE) * GRID_SIZE + offset;
  }, [state.snapToGrid]);

  // Rotate selected nodes around their centroid
  const rotateSelectedNodes = useCallback((angleDegrees: number) => {
    if (state.selectedNodes.size === 0) return;

    const selectedNodeObjects = state.nodes.filter(n => state.selectedNodes.has(n.id));
    if (selectedNodeObjects.length === 0) return;

    const centroidX = selectedNodeObjects.reduce((sum, n) => sum + n.x, 0) / selectedNodeObjects.length;
    const centroidY = selectedNodeObjects.reduce((sum, n) => sum + n.y, 0) / selectedNodeObjects.length;

    const angleRad = (angleDegrees * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    // Build updates array for batch update
    const updates = selectedNodeObjects.map(node => {
      const translatedX = node.x - centroidX;
      const translatedY = node.y - centroidY;
      const rotatedX = translatedX * cos - translatedY * sin;
      const rotatedY = translatedX * sin + translatedY * cos;

      return {
        nodeId: node.id,
        updates: {
          x: rotatedX + centroidX,
          y: rotatedY + centroidY
        }
      };
    });

    dispatch({ type: 'UPDATE_NODES', updates });
    pushHistory();
  }, [state.selectedNodes, state.nodes, dispatch, pushHistory]);

  // Handle node click (for selection and connection)
  const handleNodeClick = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (state.mode === 'connect') {
      if (!state.connectFrom) {
        dispatch({ type: 'SET_CONNECT_FROM', payload: nodeId });
      } else if (state.connectFrom !== nodeId) {
        // Check if connection already exists
        const exists = state.connections.some(
          c => (c.from === state.connectFrom && c.to === nodeId) ||
               (c.from === nodeId && c.to === state.connectFrom)
        );

        if (!exists) {
          pushHistory();
          dispatch({ type: 'ADD_CONNECTION', payload: { from: state.connectFrom, to: nodeId } });
        }
        // Chain connection: set the target as the new source
        dispatch({ type: 'SET_CONNECT_FROM', payload: nodeId });
      }
    } else if (state.mode === 'select' || state.mode === 'add') {
      dispatch({
        type: 'SET_SELECTED_NODE',
        payload: state.selectedNode === nodeId ? null : nodeId
      });
    }
  }, [state.mode, state.connectFrom, state.connections, state.selectedNode, dispatch, pushHistory]);

  // Handle node mouse down (for dragging)
  const handleNodeMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    if (state.mode === 'connect') return;
    e.stopPropagation();

    // If this node isn't in the selection, make it the only selection (unless Shift/Ctrl held)
    if (!state.selectedNodes.has(nodeId) && !e.shiftKey && !e.ctrlKey) {
      dispatch({ type: 'SET_SELECTED_NODES', payload: new Set([nodeId]) });
      dispatch({ type: 'SET_SELECTED_NODE', payload: nodeId });
    } else if (e.shiftKey || e.ctrlKey) {
      // Toggle selection
      if (state.selectedNodes.has(nodeId)) {
        dispatch({ type: 'REMOVE_FROM_SELECTION', nodeId });
      } else {
        dispatch({ type: 'ADD_TO_SELECTION', nodeId });
      }
    }

    const nodeElement = e.currentTarget as HTMLElement;
    const rect = nodeElement.getBoundingClientRect();
    dispatch({
      type: 'SET_DRAG_STATE',
      payload: {
        isDragging: true,
        nodeId,
        offsetX: (e.clientX - rect.left) / state.zoom,
        offsetY: (e.clientY - rect.top) / state.zoom
      }
    });
  }, [state.mode, state.selectedNodes, state.zoom, dispatch]);

  // Handle canvas mouse down
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isNodeClick = target.closest('.talent-node');

    if (isNodeClick) return;

    // Middle mouse button for panning
    if (e.button === 1) {
      e.preventDefault();
      dispatch({ type: 'SET_IS_PANNING', payload: true });
      dispatch({ type: 'SET_PAN_START', payload: { x: e.clientX, y: e.clientY } });
      return;
    }

    // Clear connection in connect mode
    if (state.mode === 'connect' && e.button === 0) {
      dispatch({ type: 'SET_CONNECT_FROM', payload: null });
      return;
    }

    // Box selection in select mode
    if (state.mode === 'select' && e.button === 0) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const worldX = (e.clientX - rect.left - state.panOffset.x) / state.zoom;
      const worldY = (e.clientY - rect.top - state.panOffset.y) / state.zoom;

      dispatch({
        type: 'SET_BOX_SELECTION',
        payload: {
          isSelecting: true,
          startX: worldX,
          startY: worldY,
          endX: worldX,
          endY: worldY,
          addToSelection: e.shiftKey || e.ctrlKey
        }
      });

      if (!e.shiftKey && !e.ctrlKey) {
        dispatch({ type: 'CLEAR_SELECTION' });
      }
      return;
    }

    // Lasso selection in lasso mode
    if (state.mode === 'lasso' && e.button === 0) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const worldX = (e.clientX - rect.left - state.panOffset.x) / state.zoom;
      const worldY = (e.clientY - rect.top - state.panOffset.y) / state.zoom;

      dispatch({
        type: 'SET_LASSO_SELECTION',
        payload: {
          isSelecting: true,
          points: [{ x: worldX, y: worldY }]
        }
      });
      return;
    }

    // Add node in add mode
    if (state.mode === 'add' && e.button === 0) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clickX = (e.clientX - rect.left - state.panOffset.x) / state.zoom;
      const clickY = (e.clientY - rect.top - state.panOffset.y) / state.zoom;

      if (onAddNode) {
        onAddNode(snapPosition(clickX), snapPosition(clickY));
      }
      return;
    }
  }, [
    state.mode,
    state.panOffset,
    state.zoom,
    canvasRef,
    dispatch,
    snapPosition,
    onAddNode
  ]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Rotation handle dragging
    if (state.rotationHandle.isDragging) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = (e.clientX - rect.left - state.panOffset.x) / state.zoom;
      const mouseY = (e.clientY - rect.top - state.panOffset.y) / state.zoom;

      const currentAngle = Math.atan2(
        mouseY - state.rotationHandle.centroidY,
        mouseX - state.rotationHandle.centroidX
      );

      const angleDiff = (currentAngle - state.rotationHandle.startAngle) * 180 / Math.PI;
      rotateSelectedNodes(angleDiff);

      dispatch({
        type: 'SET_ROTATION_HANDLE',
        payload: { ...state.rotationHandle, startAngle: currentAngle }
      });
      return;
    }

    // Box selection
    if (state.boxSelection.isSelecting) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const worldX = (e.clientX - rect.left - state.panOffset.x) / state.zoom;
      const worldY = (e.clientY - rect.top - state.panOffset.y) / state.zoom;

      dispatch({
        type: 'SET_BOX_SELECTION',
        payload: { ...state.boxSelection, endX: worldX, endY: worldY }
      });
      return;
    }

    // Lasso selection
    if (state.lassoSelection.isSelecting) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const worldX = (e.clientX - rect.left - state.panOffset.x) / state.zoom;
      const worldY = (e.clientY - rect.top - state.panOffset.y) / state.zoom;

      const lastPoint = state.lassoSelection.points[state.lassoSelection.points.length - 1];
      const distance = Math.sqrt(
        Math.pow(worldX - lastPoint.x, 2) + Math.pow(worldY - lastPoint.y, 2)
      );

      if (distance > 5) {
        dispatch({
          type: 'SET_LASSO_SELECTION',
          payload: {
            ...state.lassoSelection,
            points: [...state.lassoSelection.points, { x: worldX, y: worldY }]
          }
        });
      }
      return;
    }

    // Panning
    if (state.isPanning) {
      const deltaX = e.clientX - state.panStart.x;
      const deltaY = e.clientY - state.panStart.y;
      dispatch({
        type: 'SET_PAN_OFFSET',
        payload: {
          x: state.panOffset.x + deltaX,
          y: state.panOffset.y + deltaY
        }
      });
      dispatch({ type: 'SET_PAN_START', payload: { x: e.clientX, y: e.clientY } });
      return;
    }

    // Node dragging
    if (!state.dragState.isDragging || !state.dragState.nodeId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const worldX = (e.clientX - rect.left - state.panOffset.x) / state.zoom - state.dragState.offsetX;
    const worldY = (e.clientY - rect.top - state.panOffset.y) / state.zoom - state.dragState.offsetY;

    const draggedNode = state.nodes.find(n => n.id === state.dragState.nodeId);
    if (!draggedNode) return;

    const deltaX = snapPosition(worldX) - draggedNode.x;
    const deltaY = snapPosition(worldY) - draggedNode.y;

    if (deltaX === 0 && deltaY === 0) return;

    // Move all selected nodes together
    if (state.selectedNodes.size > 1 && state.selectedNodes.has(state.dragState.nodeId)) {
      const updates = Array.from(state.selectedNodes).map(nodeId => {
        const node = state.nodes.find(n => n.id === nodeId);
        if (!node) return null;
        return {
          nodeId,
          updates: { x: node.x + deltaX, y: node.y + deltaY }
        };
      }).filter((u): u is { nodeId: string; updates: { x: number; y: number } } => u !== null);

      dispatch({ type: 'UPDATE_NODES', updates });
    } else {
      dispatch({
        type: 'UPDATE_NODE',
        nodeId: state.dragState.nodeId,
        updates: { x: snapPosition(worldX), y: snapPosition(worldY) }
      });
    }
  }, [
    state.rotationHandle,
    state.boxSelection,
    state.lassoSelection,
    state.isPanning,
    state.panStart,
    state.panOffset,
    state.dragState,
    state.zoom,
    state.nodes,
    state.selectedNodes,
    canvasRef,
    dispatch,
    rotateSelectedNodes,
    snapPosition
  ]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    // Rotation handle
    if (state.rotationHandle.isDragging) {
      dispatch({
        type: 'SET_ROTATION_HANDLE',
        payload: { isDragging: false, startAngle: 0, centroidX: 0, centroidY: 0 }
      });
      return;
    }

    // Box selection
    if (state.boxSelection.isSelecting) {
      const minX = Math.min(state.boxSelection.startX, state.boxSelection.endX);
      const maxX = Math.max(state.boxSelection.startX, state.boxSelection.endX);
      const minY = Math.min(state.boxSelection.startY, state.boxSelection.endY);
      const maxY = Math.max(state.boxSelection.startY, state.boxSelection.endY);

      const newSelectedIds = new Set<string>();
      state.nodes.forEach(node => {
        const isStart = node.id === 'start' || node.id.startsWith('start-');
        const nodeSize = isStart ? 25 : 15;
        const nodeCenterX = node.x + nodeSize;
        const nodeCenterY = node.y + nodeSize;

        if (nodeCenterX >= minX && nodeCenterX <= maxX &&
            nodeCenterY >= minY && nodeCenterY <= maxY) {
          newSelectedIds.add(node.id);
        }
      });

      if (newSelectedIds.size > 0) {
        if (state.boxSelection.addToSelection) {
          const merged = new Set([...state.selectedNodes, ...newSelectedIds]);
          dispatch({ type: 'SET_SELECTED_NODES', payload: merged });
          if (!state.selectedNode || !merged.has(state.selectedNode)) {
            dispatch({ type: 'SET_SELECTED_NODE', payload: Array.from(merged)[0] });
          }
        } else {
          dispatch({ type: 'SET_SELECTED_NODES', payload: newSelectedIds });
          dispatch({ type: 'SET_SELECTED_NODE', payload: Array.from(newSelectedIds)[0] });
        }
      }

      dispatch({
        type: 'SET_BOX_SELECTION',
        payload: { isSelecting: false, startX: 0, startY: 0, endX: 0, endY: 0, addToSelection: false }
      });
      return;
    }

    // Lasso selection
    if (state.lassoSelection.isSelecting) {
      const points = state.lassoSelection.points;
      if (points.length < 3) {
        dispatch({ type: 'SET_LASSO_SELECTION', payload: { isSelecting: false, points: [] } });
        return;
      }

      const newSelectedIds = new Set<string>();
      state.nodes.forEach(node => {
        const isStart = node.id === 'start' || node.id.startsWith('start-');
        const nodeSize = isStart ? 25 : 15;
        const nodeCenterX = node.x + nodeSize;
        const nodeCenterY = node.y + nodeSize;

        // Point-in-polygon test using ray casting
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const xi = points[i].x, yi = points[i].y;
          const xj = points[j].x, yj = points[j].y;

          const intersect = ((yi > nodeCenterY) !== (yj > nodeCenterY))
            && (nodeCenterX < (xj - xi) * (nodeCenterY - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
        }

        if (inside) {
          newSelectedIds.add(node.id);
        }
      });

      if (newSelectedIds.size > 0) {
        dispatch({ type: 'SET_SELECTED_NODES', payload: newSelectedIds });
        dispatch({ type: 'SET_SELECTED_NODE', payload: Array.from(newSelectedIds)[0] });
      }

      dispatch({ type: 'SET_LASSO_SELECTION', payload: { isSelecting: false, points: [] } });
      return;
    }

    dispatch({
      type: 'SET_DRAG_STATE',
      payload: { isDragging: false, nodeId: null, offsetX: 0, offsetY: 0 }
    });
    dispatch({ type: 'SET_IS_PANNING', payload: false });
  }, [
    state.rotationHandle,
    state.boxSelection,
    state.lassoSelection,
    state.nodes,
    state.selectedNodes,
    state.selectedNode,
    dispatch
  ]);

  // Handle wheel for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - state.panOffset.x) / state.zoom;
    const worldY = (mouseY - state.panOffset.y) / state.zoom;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.2, Math.min(3, state.zoom * delta));

    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;

    dispatch({ type: 'SET_ZOOM', payload: newZoom });
    dispatch({ type: 'SET_PAN_OFFSET', payload: { x: newPanX, y: newPanY } });
  }, [state.zoom, state.panOffset, canvasRef, dispatch]);

  return {
    handleCanvasMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleNodeClick,
    handleNodeMouseDown,
    snapPosition,
    rotateSelectedNodes,
    GRID_SIZE
  };
}
