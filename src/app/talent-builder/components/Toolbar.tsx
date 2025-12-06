'use client';

import React, { useCallback, useState, useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useTalentBuilder } from '../TalentBuilderContext';
import { useSaveLoad, useConnectionAnalysis } from '../hooks';
import { BuilderMode, CanvasMode, TalentNode, TreeCategory } from '../types';
import { Id } from '../../../../convex/_generated/dataModel';

interface ToolbarProps {
  onExport: () => void;
  onImport: () => void;
  canvasRef: React.RefObject<HTMLDivElement>;
}

export function Toolbar({ onExport, onImport, canvasRef }: ToolbarProps) {
  const { state, dispatch, actions } = useTalentBuilder();
  const { saveToLocalStorage, startNewTree, currentSaveName } = useSaveLoad();
  const { findDisconnectedAndDeadEndNodes, clearHighlights, highlightDisconnected } = useConnectionAnalysis();

  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveMode, setSaveMode] = useState<'new' | 'overwrite'>('new');
  const [existingTemplateId, setExistingTemplateId] = useState<Id<"mekTreeTemplates"> | null>(null);

  // Category management state
  const [selectedCategoryId, setSelectedCategoryId] = useState<Id<"mekTreeCategories"> | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Convex queries for categories
  const categories = useQuery(api.mekTreeCategories.getAllCategoriesWithCounts);
  const uncategorizedTemplates = useQuery(api.mekTreeTemplates.getUncategorizedTemplates);

  // Get templates for selected category (or uncategorized)
  const categoryTemplates = useQuery(
    api.mekTreeTemplates.getTemplatesByCategory,
    selectedCategoryId ? { categoryId: selectedCategoryId } : 'skip'
  );

  // Templates to display: either category templates or uncategorized
  const displayedTemplates = useMemo(() => {
    if (selectedCategoryId) {
      return categoryTemplates || [];
    }
    return uncategorizedTemplates || [];
  }, [selectedCategoryId, categoryTemplates, uncategorizedTemplates]);

  // All templates (for name checking)
  const templates = useQuery(api.mekTreeTemplates.getAllTemplates);

  // Convex mutations for Mek templates and categories
  const createTemplate = useMutation(api.mekTreeTemplates.createTemplate);
  const updateTemplate = useMutation(api.mekTreeTemplates.updateTemplate);
  const createCategory = useMutation(api.mekTreeCategories.createCategory);
  const setActiveTemplate = useMutation(api.mekTreeCategories.setActiveTemplate);

  // Get current selected category
  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId || !categories) return null;
    return categories.find(c => c._id === selectedCategoryId) || null;
  }, [selectedCategoryId, categories]);

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

  const handleCiruTreeSaveClick = useCallback(() => {
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

  // Check if template name already exists
  const checkExistingTemplate = useCallback((name: string) => {
    if (!templates) return null;
    return templates.find(t => t.name.toLowerCase() === name.toLowerCase());
  }, [templates]);

  // Handle creating a new category
  const handleCreateCategory = useCallback(async () => {
    if (!newCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      const id = await createCategory({
        name: newCategoryName.trim(),
        description: 'Custom category'
      });
      setSelectedCategoryId(id);
      setNewCategoryName('');
      setShowCategoryDialog(false);
      actions.setSaveStatus(`Category "${newCategoryName}" created!`, 3000);
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      alert('Error creating category: ' + errorMsg);
    }
  }, [newCategoryName, createCategory, actions]);

  // Handle setting a template as active for its category
  const handleSetActiveTemplate = useCallback(async (templateId: Id<"mekTreeTemplates">) => {
    if (!selectedCategoryId) {
      alert('No category selected');
      return;
    }

    try {
      await setActiveTemplate({
        categoryId: selectedCategoryId,
        templateId: templateId
      });
      actions.setSaveStatus('Template set as active!', 3000);
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      alert('Error setting active template: ' + errorMsg);
    }
  }, [selectedCategoryId, setActiveTemplate, actions]);

  const handleSaveMekTemplate = useCallback(async (mode: 'new' | 'overwrite', templateId: Id<"mekTreeTemplates"> | null) => {
    const name = state.templateName;
    if (!name) return;

    const description = state.templateDescription || 'Custom Mek template';

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

      if (mode === 'overwrite' && templateId) {
        await updateTemplate({
          templateId: templateId,
          name: name,
          description: description,
          categoryId: selectedCategoryId || undefined,
          nodes: cleanedNodes,
          connections: state.connections,
          viewportDimensions: state.viewportDimensions
        });
        dispatch({ type: 'SET_SELECTED_TEMPLATE_ID', payload: templateId });
        actions.setSaveStatus(`Template "${name}" updated!`, 3000);
      } else {
        const id = await createTemplate({
          name: name,
          description: description,
          categoryId: selectedCategoryId || undefined,
          nodes: cleanedNodes,
          connections: state.connections,
          viewportDimensions: state.viewportDimensions
        });
        dispatch({ type: 'SET_SELECTED_TEMPLATE_ID', payload: id });
        actions.setSaveStatus(`Template "${name}" saved!`, 3000);
      }
      setShowSaveDialog(false);
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      alert('Error saving template: ' + errorMsg);
    }
  }, [state.templateName, state.templateDescription, state.nodes, state.connections, state.viewportDimensions, selectedCategoryId, dispatch, actions, createTemplate, updateTemplate]);

  // Handle save button click - shows dialog if name exists
  const handleSaveClick = useCallback(() => {
    const name = state.templateName;
    if (!name) {
      alert('Please enter a template name');
      return;
    }

    const existing = checkExistingTemplate(name);
    if (existing && existing._id !== state.selectedTemplateId) {
      // Name exists and it's not the current template - show dialog
      setExistingTemplateId(existing._id);
      setShowSaveDialog(true);
    } else if (state.selectedTemplateId) {
      // We're editing an existing template - just overwrite
      handleSaveMekTemplate('overwrite', state.selectedTemplateId);
    } else {
      // New template with unique name - save directly
      handleSaveMekTemplate('new', null);
    }
  }, [state.templateName, state.selectedTemplateId, checkExistingTemplate, handleSaveMekTemplate]);

  return (
    <div className="bg-gray-900 border-b border-gray-800 shrink-0">
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
              onClick={handleCiruTreeSaveClick}
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
            {/* Category Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Category:</label>
              <select
                value={selectedCategoryId || ''}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    setShowCategoryDialog(true);
                  } else {
                    setSelectedCategoryId(e.target.value ? e.target.value as Id<"mekTreeCategories"> : null);
                  }
                }}
                className="px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white min-w-[140px]"
              >
                <option value="">Uncategorized</option>
                {categories?.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name} ({cat.templateCount})
                    {cat.hasActiveTemplate ? ' ✓' : ''}
                  </option>
                ))}
                <option value="__new__">+ New Category...</option>
              </select>
            </div>

            {/* Template Name */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Save name..."
                value={state.templateName}
                onChange={(e) => dispatch({ type: 'SET_TEMPLATE_NAME', payload: e.target.value })}
                className="w-32 px-2 py-1 text-sm rounded bg-gray-800 text-white border border-gray-600 placeholder-gray-500"
              />
            </div>

            <button
              onClick={handleSaveClick}
              disabled={!state.templateName}
              className={`px-3 py-1 text-sm rounded ${
                state.templateName
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Save
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_SHOW_TEMPLATE_MANAGER', payload: true })}
              className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white"
            >
              Load
            </button>

            {/* Category info */}
            {selectedCategory && (
              <span className="text-xs text-purple-400 ml-2">
                {selectedCategory.name}
                {selectedCategory.activeTemplateId && (
                  <span className="text-green-400 ml-1">● Active set</span>
                )}
              </span>
            )}

            {/* Template count indicator */}
            {displayedTemplates && displayedTemplates.length > 0 && (
              <span className="text-xs text-gray-500 ml-2">
                {displayedTemplates.length} saves
              </span>
            )}

            {/* Editing indicator */}
            {state.selectedTemplateId && (
              <span className="text-xs text-yellow-500 ml-1">
                (editing)
              </span>
            )}
          </>
        )}

        {/* Save Confirmation Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-600">
              <h3 className="text-lg font-bold text-yellow-400 mb-4">
                Template Already Exists
              </h3>
              <p className="text-gray-300 mb-6">
                A template named "<span className="text-white font-medium">{state.templateName}</span>" already exists. What would you like to do?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (existingTemplateId) {
                      handleSaveMekTemplate('overwrite', existingTemplateId);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-medium"
                >
                  Overwrite
                </button>
                <button
                  onClick={() => {
                    dispatch({ type: 'SET_TEMPLATE_NAME', payload: state.templateName + ' (copy)' });
                    setShowSaveDialog(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                >
                  Save as New
                </button>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Category Dialog */}
        {showCategoryDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-600">
              <h3 className="text-lg font-bold text-purple-400 mb-4">
                Create New Category
              </h3>
              <p className="text-gray-300 mb-4">
                Categories group related template saves together. One save within each category can be set as the &quot;active&quot; template.
              </p>
              <input
                type="text"
                placeholder="Category name (e.g., Fire Tree, Tank Build)"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                className="w-full px-3 py-2 mb-4 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim()}
                  className={`flex-1 px-4 py-2 rounded font-medium ${
                    newCategoryName.trim()
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Create Category
                </button>
                <button
                  onClick={() => {
                    setShowCategoryDialog(false);
                    setNewCategoryName('');
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
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
