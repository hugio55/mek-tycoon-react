'use client';

import React, { useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useTalentBuilder } from '../TalentBuilderContext';
import { useSaveLoad, useConnectionAnalysis } from '../hooks';
import { BuilderMode, CanvasMode, TalentNode } from '../types';

interface ToolbarProps {
  onExport: () => void;
  onImport: () => void;
  canvasRef: React.RefObject<HTMLDivElement>;
}

export function Toolbar({ onExport, onImport, canvasRef }: ToolbarProps) {
  console.log('[🔧TOOLBAR] Toolbar component mounting...');

  const { state, dispatch, actions } = useTalentBuilder();
  console.log('[🔧TOOLBAR] Context loaded, builderMode:', state?.builderMode);

  const { saveToLocalStorage, startNewTree, currentSaveName } = useSaveLoad();
  console.log('[🔧TOOLBAR] useSaveLoad loaded');

  const { findDisconnectedAndDeadEndNodes, clearHighlights, highlightDisconnected } = useConnectionAnalysis();
  console.log('[🔧TOOLBAR] useConnectionAnalysis loaded');

  // Convex mutations for Mek templates
  const templates = useQuery(api.mekTreeTemplates.getAllTemplates);
  const createTemplate = useMutation(api.mekTreeTemplates.createTemplate);
  const updateTemplate = useMutation(api.mekTreeTemplates.updateTemplate);
  console.log('[🔧TOOLBAR] All hooks loaded successfully');

  // Safety check - if state is undefined, show error
  if (!state || !dispatch || !actions) {
    console.error('[🔧TOOLBAR] Missing context values!', { state, dispatch, actions });
    return (
      <div className="bg-red-900 text-white p-4 border-b border-red-600">
        Toolbar Error: Missing context values
      </div>
    );
  }

  const handleBuilderModeChange = useCallback((newMode: BuilderMode) => {
    dispatch({ type: 'SET_BUILDER_MODE', payload: newMode });

    if (newMode === 'circutree') {
      // Initialize CiruTree with a start node
      const startNode: TalentNode = {
        id: 'start',
        name: 'START',
        x: 1500,
        y: 1500,
        tier: 0,
        desc: 'The beginning of your journey',
        xp: 0
      };
      dispatch({ type: 'SET_NODES', payload: [startNode] });
      dispatch({ type: 'SET_CONNECTIONS', payload: [] });
    } else if (newMode === 'mek') {
      // Initialize Mek template with a start node
      const startNode: TalentNode = {
        id: 'start',
        name: 'START',
        x: 1500,
        y: 1500,
        tier: 0,
        desc: 'Mek template start',
        xp: 0
      };
      dispatch({ type: 'SET_NODES', payload: [startNode] });
      dispatch({ type: 'SET_CONNECTIONS', payload: [] });
    } else if (newMode === 'story') {
      // Initialize Story mode with start node at bottom center
      const startNode: TalentNode = {
        id: 'start',
        name: 'Start',
        x: 3000 - 25,
        y: 5950 - 50,
        tier: 0,
        desc: 'Chapter Start',
        xp: 0
      };
      dispatch({ type: 'SET_NODES', payload: [startNode] });
      dispatch({ type: 'SET_CONNECTIONS', payload: [] });

      // Center viewport on start node
      if (canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const viewportHeight = canvasRect.height;
        dispatch({
          type: 'SET_PAN_OFFSET',
          payload: { x: -2850, y: -(5900 - viewportHeight + 150) }
        });
      } else {
        dispatch({ type: 'SET_PAN_OFFSET', payload: { x: -2850, y: -5300 } });
      }
      dispatch({ type: 'SET_ZOOM', payload: 1 });
    }
  }, [dispatch, canvasRef]);

  const handleModeChange = useCallback((newMode: CanvasMode) => {
    dispatch({ type: 'SET_MODE', payload: newMode });
    if (newMode === 'connect') {
      dispatch({ type: 'SET_CONNECT_FROM', payload: null });
    }
  }, [dispatch]);

  const handleSaveClick = useCallback(() => {
    dispatch({ type: 'SET_SHOW_SAVE_DIALOG', payload: true });
  }, [dispatch]);

  const handleLoadClick = useCallback(() => {
    dispatch({ type: 'SET_SHOW_CIRU_TREE_LOADER', payload: true });
  }, [dispatch]);

  const handleStorySaveClick = useCallback(() => {
    dispatch({ type: 'SET_SHOW_STORY_SAVE_DIALOG', payload: true });
  }, [dispatch]);

  const handleStoryLoadClick = useCallback(() => {
    dispatch({ type: 'SET_SHOW_STORY_LOADER', payload: true });
  }, [dispatch]);

  const handleClearAll = useCallback(() => {
    if (confirm('Clear all nodes and connections?')) {
      const startNode: TalentNode = {
        id: 'start',
        name: 'START',
        x: state.builderMode === 'story' ? 3000 - 25 : 1500,
        y: state.builderMode === 'story' ? 5950 - 50 : 1500,
        tier: 0,
        desc: state.builderMode === 'story' ? `Chapter ${state.storyChapter} Start` : 'Start',
        xp: 0
      };
      dispatch({ type: 'SET_NODES', payload: [startNode] });
      dispatch({ type: 'SET_CONNECTIONS', payload: [] });
      actions.setSaveStatus('Cleared', 2000);
    }
  }, [state.builderMode, state.storyChapter, dispatch, actions]);

  const handleHighlightToggle = useCallback(() => {
    if (!highlightDisconnected) {
      findDisconnectedAndDeadEndNodes();
    } else {
      clearHighlights();
    }
  }, [highlightDisconnected, findDisconnectedAndDeadEndNodes, clearHighlights]);

  const handleSaveMekTemplate = useCallback(async () => {
    let name: string | null = state.templateName;
    if (!name) {
      name = prompt('Enter template name:');
      if (!name) return;
      dispatch({ type: 'SET_TEMPLATE_NAME', payload: name });
    }

    const description = state.templateDescription || prompt('Enter template description (optional):') || 'Custom Mek template';
    if (description) dispatch({ type: 'SET_TEMPLATE_DESCRIPTION', payload: description });

    try {
      const cleanedNodes = state.nodes.map(node => {
        const cleaned: Record<string, unknown> = {
          id: node.id,
          name: node.name,
          x: node.x,
          y: node.y,
          tier: node.tier,
          desc: node.desc,
          xp: node.xp
        };
        if (node.unlocked !== undefined) cleaned.unlocked = node.unlocked;
        if (node.nodeType) cleaned.nodeType = node.nodeType;
        if (node.statBonus) cleaned.statBonus = node.statBonus;
        if (node.abilityId) cleaned.abilityId = node.abilityId;
        if (node.passiveEffect) cleaned.passiveEffect = node.passiveEffect;
        if (node.buffGrant) cleaned.buffGrant = node.buffGrant;
        return cleaned;
      });

      if (state.selectedTemplateId) {
        await updateTemplate({
          templateId: state.selectedTemplateId,
          nodes: cleanedNodes,
          connections: state.connections,
          viewportDimensions: state.viewportDimensions
        });
        actions.setSaveStatus('Template updated!', 3000);
      } else {
        const id = await createTemplate({
          name: name,
          description: description,
          category: 'custom',
          nodes: cleanedNodes,
          connections: state.connections,
          viewportDimensions: state.viewportDimensions
        });
        dispatch({ type: 'SET_SELECTED_TEMPLATE_ID', payload: id });
        actions.setSaveStatus('Template created: ' + name, 3000);
      }
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      if (errorMsg.includes('already exists')) {
        alert('A template with this name already exists. Please choose a different name.');
      } else {
        alert('Error saving template: ' + errorMsg);
      }
    }
  }, [state.templateName, state.templateDescription, state.nodes, state.connections, state.selectedTemplateId, state.viewportDimensions, dispatch, actions, createTemplate, updateTemplate]);

  console.log('[🔧TOOLBAR] About to return JSX');

  return (
    <div className="bg-gray-900 border-b border-gray-800 min-h-[80px]">
      {/* Primary Toolbar */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left - Builder Mode Selector */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Builder:</span>
          <div className="flex gap-1 bg-gray-800 p-1 rounded">
            <button
              onClick={() => handleBuilderModeChange('circutree')}
              className={`px-3 py-1 rounded transition-all ${
                state.builderMode === 'circutree'
                  ? 'bg-yellow-500 text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              CiruTree
            </button>
            <button
              onClick={() => handleBuilderModeChange('mek')}
              className={`px-3 py-1 rounded transition-all ${
                state.builderMode === 'mek'
                  ? 'bg-purple-500 text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Mek Template
            </button>
            <button
              onClick={() => handleBuilderModeChange('story')}
              className={`px-3 py-1 rounded transition-all ${
                state.builderMode === 'story'
                  ? 'bg-green-500 text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Story Mode
            </button>
          </div>
        </div>

        {/* Right - Grid/Snap/Viewport Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch({ type: 'SET_SHOW_GRID', payload: !state.showGrid })}
            className={`px-2 py-1 text-sm rounded ${
              state.showGrid ? 'bg-gray-600' : 'bg-gray-700'
            } hover:bg-gray-600 text-white`}
          >
            Grid: {state.showGrid ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_SNAP_TO_GRID', payload: !state.snapToGrid })}
            className={`px-2 py-1 text-sm rounded ${
              state.snapToGrid ? 'bg-gray-600' : 'bg-gray-700'
            } hover:bg-gray-600 text-white`}
          >
            Snap: {state.snapToGrid ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleHighlightToggle}
            className={`px-2 py-1 text-sm rounded ${
              highlightDisconnected ? 'bg-orange-600' : 'bg-gray-700'
            } hover:bg-orange-600 text-white`}
            title="Highlight nodes with no connections or dead-ends"
          >
            Highlight Issues: {highlightDisconnected ? 'ON' : 'OFF'}
          </button>

          {/* Viewport Box Controls */}
          <div className="border-l border-gray-700 pl-2 ml-2 flex items-center gap-2">
            <button
              onClick={() => dispatch({ type: 'SET_SHOW_VIEWPORT_BOX', payload: !state.showViewportBox })}
              className={`px-2 py-1 text-sm rounded transition-all ${
                state.showViewportBox
                  ? 'bg-yellow-600 text-black font-bold border border-yellow-400'
                  : 'bg-gray-700 text-white border border-gray-600'
              } hover:bg-yellow-500 hover:text-black`}
              title="Show/hide viewport preview box"
            >
              Viewport: {state.showViewportBox ? 'ON' : 'OFF'}
            </button>

            <div className="flex items-center gap-1">
              <input
                type="number"
                value={state.viewportDimensions.width}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_VIEWPORT_DIMENSIONS',
                    payload: { ...state.viewportDimensions, width: parseInt(e.target.value) || 800 }
                  })
                }
                className="w-16 px-1 py-1 text-sm rounded bg-gray-700 text-yellow-400 border border-yellow-500/30 font-mono text-center"
                min="100"
                max="5000"
              />
              <span className="text-gray-500">x</span>
              <input
                type="number"
                value={state.viewportDimensions.height}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_VIEWPORT_DIMENSIONS',
                    payload: { ...state.viewportDimensions, height: parseInt(e.target.value) || 600 }
                  })
                }
                className="w-16 px-1 py-1 text-sm rounded bg-gray-700 text-yellow-400 border border-yellow-500/30 font-mono text-center"
                min="100"
                max="5000"
              />
            </div>

            <select
              value="presets"
              onChange={(e) => {
                if (e.target.value !== 'presets') {
                  const [width, height] = e.target.value.split('x').map(Number);
                  dispatch({ type: 'SET_VIEWPORT_DIMENSIONS', payload: { width, height } });
                }
              }}
              className="px-2 py-1 text-sm rounded bg-gray-700 text-gray-400 border border-gray-600"
            >
              <option value="presets">Presets</option>
              <option value="800x600">800x600</option>
              <option value="1024x768">1024x768</option>
              <option value="1920x1080">1920x1080 (HD)</option>
              <option value="1280x720">1280x720 (HD)</option>
              <option value="375x667">375x667 (Phone)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Secondary Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-800">
        {/* File Operations - CiruTree Mode */}
        {state.builderMode === 'circutree' && (
          <>
            <button
              onClick={handleSaveClick}
              className="px-3 py-1 text-sm rounded bg-green-600 hover:bg-green-700 text-white"
            >
              Save
            </button>
            {currentSaveName && (
              <button
                onClick={() => saveToLocalStorage(currentSaveName, true)}
                className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white"
                title={`Update "${currentSaveName}"`}
              >
                Update
              </button>
            )}
            <button
              onClick={handleLoadClick}
              className="px-3 py-1 text-sm rounded bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              Load
            </button>
            <button
              onClick={startNewTree}
              className="px-3 py-1 text-sm rounded bg-purple-600 hover:bg-purple-700 text-white"
            >
              New Tree
            </button>
          </>
        )}

        {/* File Operations - Mek Template Mode */}
        {state.builderMode === 'mek' && (
          <>
            <button
              onClick={handleSaveMekTemplate}
              className="px-3 py-1 text-sm rounded bg-green-600 hover:bg-green-700 text-white"
            >
              Save Template
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_SHOW_TEMPLATE_MANAGER', payload: true })}
              className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white"
            >
              Load Template
            </button>
          </>
        )}

        {/* File Operations - Story Mode */}
        {state.builderMode === 'story' && (
          <>
            {/* Chapter Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Chapter:</label>
              <select
                value={state.storyChapter}
                onChange={(e) => dispatch({ type: 'SET_STORY_CHAPTER', payload: Number(e.target.value) })}
                className="px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Chapter {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Node Type Selector */}
            <div className="flex items-center gap-2 ml-4">
              <label className="text-xs text-gray-400">Node Type:</label>
              <div className="flex gap-1 bg-gray-800 p-1 rounded">
                {(['normal', 'event', 'boss', 'final_boss'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => dispatch({ type: 'SET_STORY_NODE_EDIT_MODE', payload: type })}
                    className={`px-2 py-1 text-xs rounded ${
                      state.storyNodeEditMode === type
                        ? type === 'normal'
                          ? 'bg-blue-600 text-white'
                          : type === 'event'
                          ? 'bg-purple-600 text-white'
                          : type === 'boss'
                          ? 'bg-red-600 text-white'
                          : 'bg-orange-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {type === 'normal'
                      ? 'Normal (Mek)'
                      : type === 'event'
                      ? 'Event (2x)'
                      : type === 'boss'
                      ? 'Boss (3x)'
                      : 'FINAL (4x)'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStorySaveClick}
              className="px-3 py-1 text-sm rounded bg-green-600 hover:bg-green-700 text-white ml-4"
            >
              Save
            </button>
            <button
              onClick={handleStoryLoadClick}
              className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white"
            >
              Load
            </button>
          </>
        )}

        {/* Mode Selector */}
        <div className="flex gap-1 bg-gray-800 p-1 rounded ml-4">
          <button
            onClick={() => handleModeChange('select')}
            className={`px-3 py-1 text-sm rounded ${
              state.mode === 'select' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Select
          </button>
          <button
            onClick={() => handleModeChange('add')}
            className={`px-3 py-1 text-sm rounded ${
              state.mode === 'add' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Add
          </button>
          <button
            onClick={() => handleModeChange('connect')}
            className={`px-3 py-1 text-sm rounded ${
              state.mode === 'connect' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Connect
          </button>
          <button
            onClick={() => handleModeChange('lasso')}
            className={`px-3 py-1 text-sm rounded ${
              state.mode === 'lasso' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Lasso selection (L)"
          >
            Lasso
          </button>
        </div>

        <button
          onClick={() => handleModeChange('addLabel')}
          className={`px-3 py-1 text-sm rounded ml-4 ${
            state.mode === 'addLabel' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Add Label
        </button>

        <button
          onClick={handleClearAll}
          className="px-2 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded ml-4"
        >
          Clear
        </button>

        <button
          onClick={onExport}
          className="px-2 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded ml-auto"
        >
          Export
        </button>

        <button
          onClick={onImport}
          className="px-2 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded"
        >
          Import
        </button>
      </div>
    </div>
  );
}
