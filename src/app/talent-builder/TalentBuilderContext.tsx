'use client';

import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from 'react';
import {
  talentReducer,
  initialState,
  TalentState,
  TalentAction
} from '@/components/talent-builder/talentReducer';
import {
  TalentNode,
  Connection,
  DragState,
  CanvasMode,
  BuilderMode,
  BoxSelection,
  LassoSelection,
  RotationHandle,
  ViewportDimensions,
  HistoryEntry,
  SavedSpell,
  SavedCiruTree,
  SavedStoryMode,
  BackupFile
} from './types';

// =============================================================================
// CONTEXT TYPE
// =============================================================================

interface TalentBuilderContextType {
  // State
  state: TalentState;
  dispatch: React.Dispatch<TalentAction>;

  // Computed values
  selectedNodeData: TalentNode | null;
  hasSelection: boolean;
  canUndo: boolean;
  canRedo: boolean;

  // Action creators (convenience methods)
  actions: {
    // Node actions
    addNode: (node: TalentNode) => void;
    updateNode: (nodeId: string, updates: Partial<TalentNode>) => void;
    deleteNode: (nodeId: string) => void;
    deleteSelectedNodes: () => void;

    // Connection actions
    addConnection: (from: string, to: string) => void;
    deleteConnection: (index: number) => void;

    // Selection actions
    selectNode: (nodeId: string | null) => void;
    toggleNodeSelection: (nodeId: string, addToSelection?: boolean) => void;
    selectNodesInRect: (rect: { x: number; y: number; width: number; height: number }) => void;
    clearSelection: () => void;

    // Canvas actions
    setMode: (mode: CanvasMode) => void;
    setZoom: (zoom: number) => void;
    setPanOffset: (offset: { x: number; y: number }) => void;
    resetView: () => void;

    // History actions
    pushHistory: () => void;
    undo: () => void;
    redo: () => void;

    // Save/Load actions
    loadTree: (nodes: TalentNode[], connections: Connection[], saveName?: string) => void;
    clearAll: () => void;
    setSaveStatus: (status: string, duration?: number) => void;

    // Builder mode
    setBuilderMode: (mode: BuilderMode) => void;

    // Modal toggles
    openSaveDialog: () => void;
    closeSaveDialog: () => void;
    openLoadDialog: () => void;
    closeLoadDialog: () => void;
  };
}

// =============================================================================
// CONTEXT CREATION
// =============================================================================

const TalentBuilderContext = createContext<TalentBuilderContextType | null>(null);

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

interface TalentBuilderProviderProps {
  children: ReactNode;
  initialNodes?: TalentNode[];
  initialConnections?: Connection[];
}

export function TalentBuilderProvider({
  children,
  initialNodes,
  initialConnections
}: TalentBuilderProviderProps) {
  const [state, dispatch] = useReducer(
    talentReducer,
    {
      ...initialState,
      nodes: initialNodes || [],
      connections: initialConnections || []
    }
  );

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------

  const selectedNodeData = useMemo(() => {
    if (!state.selectedNode) return null;
    return state.nodes.find(n => n.id === state.selectedNode) || null;
  }, [state.selectedNode, state.nodes]);

  const hasSelection = useMemo(() => {
    return state.selectedNode !== null || state.selectedNodes.size > 0;
  }, [state.selectedNode, state.selectedNodes]);

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  // ---------------------------------------------------------------------------
  // Action creators
  // ---------------------------------------------------------------------------

  const addNode = useCallback((node: TalentNode) => {
    dispatch({ type: 'ADD_NODE', payload: node });
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<TalentNode>) => {
    dispatch({ type: 'UPDATE_NODE', nodeId, updates });
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    dispatch({ type: 'DELETE_NODE', nodeId });
  }, []);

  const deleteSelectedNodes = useCallback(() => {
    if (state.selectedNodes.size > 0) {
      dispatch({ type: 'DELETE_NODES', nodeIds: Array.from(state.selectedNodes) });
    } else if (state.selectedNode) {
      dispatch({ type: 'DELETE_NODE', nodeId: state.selectedNode });
    }
  }, [state.selectedNode, state.selectedNodes]);

  const addConnection = useCallback((from: string, to: string) => {
    // Check if connection already exists
    const exists = state.connections.some(
      c => (c.from === from && c.to === to) || (c.from === to && c.to === from)
    );
    if (!exists) {
      dispatch({ type: 'ADD_CONNECTION', payload: { from, to } });
    }
  }, [state.connections]);

  const deleteConnection = useCallback((index: number) => {
    dispatch({ type: 'DELETE_CONNECTION', index });
  }, []);

  const selectNode = useCallback((nodeId: string | null) => {
    dispatch({ type: 'SET_SELECTED_NODE', payload: nodeId });
    if (nodeId) {
      dispatch({ type: 'SET_SELECTED_NODES', payload: new Set([nodeId]) });
    } else {
      dispatch({ type: 'SET_SELECTED_NODES', payload: new Set() });
    }
  }, []);

  const toggleNodeSelection = useCallback((nodeId: string, addToSelection = false) => {
    if (addToSelection) {
      if (state.selectedNodes.has(nodeId)) {
        dispatch({ type: 'REMOVE_FROM_SELECTION', nodeId });
      } else {
        dispatch({ type: 'ADD_TO_SELECTION', nodeId });
      }
    } else {
      selectNode(nodeId);
    }
  }, [state.selectedNodes, selectNode]);

  const selectNodesInRect = useCallback((rect: { x: number; y: number; width: number; height: number }) => {
    const nodesInRect = state.nodes.filter(node => {
      const nodeX = node.x;
      const nodeY = node.y;
      const nodeWidth = 30; // Default node size
      const nodeHeight = 30;

      return (
        nodeX + nodeWidth > rect.x &&
        nodeX < rect.x + rect.width &&
        nodeY + nodeHeight > rect.y &&
        nodeY < rect.y + rect.height
      );
    });

    dispatch({
      type: 'SET_SELECTED_NODES',
      payload: new Set(nodesInRect.map(n => n.id))
    });
  }, [state.nodes]);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const setMode = useCallback((mode: CanvasMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: 'SET_ZOOM', payload: Math.max(0.2, Math.min(3, zoom)) });
  }, []);

  const setPanOffset = useCallback((offset: { x: number; y: number }) => {
    dispatch({ type: 'SET_PAN_OFFSET', payload: offset });
  }, []);

  const resetView = useCallback(() => {
    dispatch({ type: 'RESET_VIEW' });
  }, []);

  const pushHistory = useCallback(() => {
    dispatch({
      type: 'PUSH_HISTORY',
      entry: {
        nodes: JSON.parse(JSON.stringify(state.nodes)),
        connections: JSON.parse(JSON.stringify(state.connections))
      }
    });
  }, [state.nodes, state.connections]);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const loadTree = useCallback((nodes: TalentNode[], connections: Connection[], saveName?: string) => {
    dispatch({ type: 'LOAD_TREE', nodes, connections, saveName });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const setSaveStatus = useCallback((status: string, duration = 2000) => {
    dispatch({ type: 'SET_SAVE_STATUS', payload: status });
    if (duration > 0) {
      setTimeout(() => {
        dispatch({ type: 'SET_SAVE_STATUS', payload: '' });
      }, duration);
    }
  }, []);

  const setBuilderMode = useCallback((mode: BuilderMode) => {
    dispatch({ type: 'SET_BUILDER_MODE', payload: mode });
  }, []);

  const openSaveDialog = useCallback(() => {
    dispatch({ type: 'SET_SHOW_SAVE_DIALOG', payload: true });
  }, []);

  const closeSaveDialog = useCallback(() => {
    dispatch({ type: 'SET_SHOW_SAVE_DIALOG', payload: false });
  }, []);

  const openLoadDialog = useCallback(() => {
    if (state.builderMode === 'story') {
      dispatch({ type: 'SET_SHOW_STORY_LOADER', payload: true });
    } else {
      dispatch({ type: 'SET_SHOW_CIRU_TREE_LOADER', payload: true });
    }
  }, [state.builderMode]);

  const closeLoadDialog = useCallback(() => {
    dispatch({ type: 'SET_SHOW_CIRU_TREE_LOADER', payload: false });
    dispatch({ type: 'SET_SHOW_STORY_LOADER', payload: false });
  }, []);

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------

  const actions = useMemo(() => ({
    addNode,
    updateNode,
    deleteNode,
    deleteSelectedNodes,
    addConnection,
    deleteConnection,
    selectNode,
    toggleNodeSelection,
    selectNodesInRect,
    clearSelection,
    setMode,
    setZoom,
    setPanOffset,
    resetView,
    pushHistory,
    undo,
    redo,
    loadTree,
    clearAll,
    setSaveStatus,
    setBuilderMode,
    openSaveDialog,
    closeSaveDialog,
    openLoadDialog,
    closeLoadDialog
  }), [
    addNode,
    updateNode,
    deleteNode,
    deleteSelectedNodes,
    addConnection,
    deleteConnection,
    selectNode,
    toggleNodeSelection,
    selectNodesInRect,
    clearSelection,
    setMode,
    setZoom,
    setPanOffset,
    resetView,
    pushHistory,
    undo,
    redo,
    loadTree,
    clearAll,
    setSaveStatus,
    setBuilderMode,
    openSaveDialog,
    closeSaveDialog,
    openLoadDialog,
    closeLoadDialog
  ]);

  const contextValue = useMemo<TalentBuilderContextType>(() => ({
    state,
    dispatch,
    selectedNodeData,
    hasSelection,
    canUndo,
    canRedo,
    actions
  }), [state, dispatch, selectedNodeData, hasSelection, canUndo, canRedo, actions]);

  return (
    <TalentBuilderContext.Provider value={contextValue}>
      {children}
    </TalentBuilderContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useTalentBuilder(): TalentBuilderContextType {
  const context = useContext(TalentBuilderContext);

  if (!context) {
    throw new Error('useTalentBuilder must be used within a TalentBuilderProvider');
  }

  return context;
}

// =============================================================================
// SELECTOR HOOKS (for performance optimization)
// =============================================================================

export function useTalentNodes(): TalentNode[] {
  const { state } = useTalentBuilder();
  return state.nodes;
}

export function useTalentConnections(): Connection[] {
  const { state } = useTalentBuilder();
  return state.connections;
}

export function useSelectedNode(): TalentNode | null {
  const { selectedNodeData } = useTalentBuilder();
  return selectedNodeData;
}

export function useCanvasMode(): CanvasMode {
  const { state } = useTalentBuilder();
  return state.mode;
}

export function useBuilderMode(): BuilderMode {
  const { state } = useTalentBuilder();
  return state.builderMode;
}

export function useZoomAndPan(): { zoom: number; panOffset: { x: number; y: number } } {
  const { state } = useTalentBuilder();
  return { zoom: state.zoom, panOffset: state.panOffset };
}

export function useSaveStatus(): string {
  const { state } = useTalentBuilder();
  return state.saveStatus;
}

export function useHasUnsavedChanges(): boolean {
  const { state } = useTalentBuilder();
  return state.hasUnsavedChanges;
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

export type { TalentState, TalentAction };
export { initialState };
