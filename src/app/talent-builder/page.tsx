'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { TalentBuilderProvider, useTalentBuilder } from './TalentBuilderContext';
import {
  useAutosave,
  useKeyboardShortcuts,
  useHistory,
  useSaveLoad,
  useConnectionAnalysis
} from './hooks';
import {
  Toolbar,
  StatusBar,
  SaveDialog,
  LoadTreeDialog,
  StorySaveDialog,
  StoryLoaderDialog
} from './components';
import Canvas from '@/components/talent-builder/Canvas';
import PropertyPanel from '@/components/talent-builder/PropertyPanel';
import TemplateManager from '@/components/talent-builder/TemplateManager';
import ErrorBoundary from '@/components/talent-builder/ErrorBoundary';
import Link from 'next/link';
import { TalentNode } from './types';

// =============================================================================
// INNER COMPONENT (uses context)
// =============================================================================

function TalentBuilderInner() {
  const { state, dispatch, selectedNodeData, actions } = useTalentBuilder();
  const canvasRef = useRef<HTMLDivElement>(null!);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Force re-render every second to update "X seconds ago" display
  const [, forceUpdate] = useState({});
  useEffect(() => {
    const timer = setInterval(() => forceUpdate({}), 1000);
    return () => clearInterval(timer);
  }, []);

  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------

  const { lastAutoSave, lastBackup, autosaveError, changesSinceLastSave } = useAutosave({
    enabled: true
  });

  const { pushHistory } = useHistory();

  const { savedCiruTrees, loadTree, startNewTree, currentSaveName } = useSaveLoad();

  const { findDisconnectedAndDeadEndNodes, clearHighlights } = useConnectionAnalysis();

  // Keyboard shortcuts with custom delete handler
  // Note: useKeyboardShortcuts already calls pushHistory() after onDelete
  useKeyboardShortcuts({
    enabled: true,
    onDelete: (nodeId) => {
      if (nodeId === 'start' || nodeId.startsWith('start-')) {
        alert('Cannot delete START nodes!');
        return;
      }
      actions.deleteNode(nodeId);
      // Don't call pushHistory here - useKeyboardShortcuts handles it
    }
  });

  // ---------------------------------------------------------------------------
  // Add node handler (passed to Canvas)
  // ---------------------------------------------------------------------------

  const handleAddNode = useCallback((x: number, y: number) => {
    // Generate unique ID
    const uniqueId = state.builderMode === 'story'
      ? `ch${state.storyChapter}_node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : `node-${Date.now()}`;

    // Determine node radius based on type
    let nodeRadius = 15;
    if (state.builderMode === 'story') {
      if (state.storyNodeEditMode === 'normal') nodeRadius = 20;
      else if (state.storyNodeEditMode === 'event') nodeRadius = 40;
      else if (state.storyNodeEditMode === 'boss') nodeRadius = 60;
      else if (state.storyNodeEditMode === 'final_boss') nodeRadius = 80;
    }

    const newNode: TalentNode = {
      id: uniqueId,
      name: '',
      x: x - nodeRadius,
      y: y - nodeRadius,
      tier: 1,
      desc: '',
      xp: 0,
      goldCost: 0,
      essences: [],
      ingredients: [],
      isSpell: false
    };

    // Add story mode specific fields
    if (state.builderMode === 'story') {
      newNode.storyNodeType = state.storyNodeEditMode;
      newNode.goldReward = 100;
      newNode.essenceRewards = [{ type: 'Fire', amount: 1 }];
      if (state.storyNodeEditMode === 'event') {
        newNode.eventName = 'Event Name';
        newNode.otherRewards = [];
      } else if (state.storyNodeEditMode === 'boss') {
        newNode.bossMekId = '';
        newNode.otherRewards = [];
      } else if (state.storyNodeEditMode === 'final_boss') {
        newNode.bossMekId = 'WREN';
        newNode.otherRewards = [{ item: 'Epic Loot Box', quantity: 1 }];
        newNode.goldReward = 10000;
      }
    }

    dispatch({ type: 'ADD_NODE', payload: newNode });
    dispatch({ type: 'SET_SELECTED_NODE', payload: newNode.id });
    dispatch({ type: 'SET_EDITING_NODE', payload: newNode.id });

    setTimeout(() => pushHistory(), 0);
  }, [state.builderMode, state.storyChapter, state.storyNodeEditMode, dispatch, pushHistory]);

  // ---------------------------------------------------------------------------
  // Export/Import handlers
  // ---------------------------------------------------------------------------

  const exportTree = useCallback(() => {
    const data = {
      nodes: state.nodes,
      connections: state.connections,
      viewportDimensions: state.viewportDimensions
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'talent-tree.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [state.nodes, state.connections, state.viewportDimensions]);

  const importTree = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        dispatch({ type: 'SET_SKIP_NEXT_HISTORY_PUSH', payload: true });
        loadTree(data.nodes || [], data.connections || []);
        if (data.viewportDimensions) {
          dispatch({ type: 'SET_VIEWPORT_DIMENSIONS', payload: data.viewportDimensions });
        }
      } catch {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
    // Reset file input so same file can be imported again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [dispatch, loadTree]);

  // ---------------------------------------------------------------------------
  // Load initial data
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const savedData = localStorage.getItem('talentTreeData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const loadedNodes = parsed.nodes || [];

        // Ensure START node exists
        const hasStart = loadedNodes.some((n: TalentNode) => n.id === 'start');
        if (!hasStart) {
          loadedNodes.push({
            id: 'start',
            name: 'START',
            x: 3000,
            y: 3000,
            tier: 0,
            desc: 'The beginning of your journey',
            xp: 0
          });
        }

        dispatch({ type: 'SET_SKIP_NEXT_HISTORY_PUSH', payload: true });
        dispatch({ type: 'SET_NODES', payload: loadedNodes });
        dispatch({ type: 'SET_CONNECTIONS', payload: parsed.connections || [] });

        // Center on start node
        const startNode = loadedNodes.find((n: TalentNode) => n.id === 'start');
        if (startNode && canvasRef.current) {
          const canvasRect = canvasRef.current.getBoundingClientRect();
          dispatch({
            type: 'SET_PAN_OFFSET',
            payload: {
              x: canvasRect.width / 2 - startNode.x,
              y: canvasRect.height / 2 - startNode.y
            }
          });
        }

        actions.setSaveStatus('Loaded from browser', 3000);
      } catch (e) {
        console.error('Failed to load saved data:', e);
      }
    } else {
      // Create initial start node
      const startNodes: TalentNode[] = [{
        id: 'start',
        name: 'START',
        x: 3000,
        y: 3000,
        tier: 0,
        desc: 'The beginning of your journey',
        xp: 0
      }];
      dispatch({ type: 'SET_NODES', payload: startNodes });

      if (canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        dispatch({
          type: 'SET_PAN_OFFSET',
          payload: {
            x: canvasRect.width / 2 - 3000,
            y: canvasRect.height / 2 - 3000
          }
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - dispatch and actions are stable

  // ---------------------------------------------------------------------------
  // Handle delete node
  // ---------------------------------------------------------------------------

  const handleDeleteNode = useCallback((nodeId: string) => {
    if (nodeId === 'start' || nodeId.startsWith('start-')) {
      alert('Cannot delete START nodes!');
      return;
    }
    actions.deleteNode(nodeId);
    pushHistory();
  }, [actions, pushHistory]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative flex flex-col">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={importTree}
        className="hidden"
      />

      {/* Back to Site Button */}
      <Link
        href="/home"
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-gray-800/90 hover:bg-gray-700
                   border border-yellow-500/50 text-yellow-400 rounded-lg
                   transition-all duration-200 text-sm font-medium backdrop-blur-sm"
      >
        Back to Site
      </Link>

      {/* Toolbar */}
      <Toolbar
        onExport={exportTree}
        onImport={() => fileInputRef.current?.click()}
        canvasRef={canvasRef}
      />

      {/* Canvas Container (ref needed for Toolbar centering) */}
      <div ref={canvasRef} className="flex-1">
        <Canvas
          nodes={state.nodes}
          connections={state.connections}
          selectedNode={state.selectedNode}
          selectedNodes={state.selectedNodes}
          mode={state.mode}
          builderMode={state.builderMode}
          connectFrom={state.connectFrom}
          dragState={state.dragState}
          showGrid={state.showGrid}
          snapToGrid={state.snapToGrid}
          panOffset={state.panOffset}
          zoom={state.zoom}
          isPanning={state.isPanning}
          panStart={state.panStart}
          boxSelection={state.boxSelection}
          lassoSelection={state.lassoSelection}
          showViewportBox={state.showViewportBox}
          viewportDimensions={state.viewportDimensions}
          unconnectedNodes={state.unconnectedNodes}
          deadEndNodes={state.deadEndNodes}
          highlightDisconnected={state.highlightDisconnected}
          storyChapter={state.storyChapter}
          dispatch={dispatch}
          onAddNode={handleAddNode}
        />
      </div>

      {/* Property Panel */}
      {selectedNodeData && (
        <PropertyPanel
          selectedNode={selectedNodeData}
          builderMode={state.builderMode}
          variationSearch={state.variationSearch}
          showVariationPicker={state.showVariationPicker}
          showEssencePicker={state.showEssencePicker}
          essenceSearch={state.essenceSearch}
          savedSpells={state.savedSpells}
          dispatch={dispatch}
          onDeleteNode={handleDeleteNode}
        />
      )}

      {/* Status Bar */}
      <StatusBar
        lastAutoSave={lastAutoSave}
        lastConvexBackup={lastBackup}
        changeCounter={changesSinceLastSave}
        autosaveError={autosaveError}
        onDismissError={() => dispatch({ type: 'SET_AUTOSAVE_ERROR', payload: null })}
      />

      {/* Modals */}
      <SaveDialog
        isOpen={state.showSaveDialog}
        onClose={() => dispatch({ type: 'SET_SHOW_SAVE_DIALOG', payload: false })}
      />

      <LoadTreeDialog
        isOpen={state.showCiruTreeLoader}
        onClose={() => dispatch({ type: 'SET_SHOW_CIRU_TREE_LOADER', payload: false })}
      />

      <StorySaveDialog
        isOpen={state.showStorySaveDialog}
        onClose={() => dispatch({ type: 'SET_SHOW_STORY_SAVE_DIALOG', payload: false })}
      />

      <StoryLoaderDialog
        isOpen={state.showStoryLoader}
        onClose={() => dispatch({ type: 'SET_SHOW_STORY_LOADER', payload: false })}
      />

      {state.showTemplateManager && (
        <TemplateManager
          show={state.showTemplateManager}
          savedCiruTrees={savedCiruTrees}
          dispatch={dispatch}
          mode={state.builderMode === 'mek' ? 'mek' : 'cirutree'}
          onClose={() => dispatch({ type: 'SET_SHOW_TEMPLATE_MANAGER', payload: false })}
          onLoadTemplate={(nodes, connections) => {
            dispatch({ type: 'SET_SKIP_NEXT_HISTORY_PUSH', payload: true });
            loadTree(nodes, connections);
            pushHistory();
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function TalentBuilderPage() {
  return (
    <ErrorBoundary>
      <TalentBuilderProvider>
        <TalentBuilderInner />
      </TalentBuilderProvider>
    </ErrorBoundary>
  );
}
