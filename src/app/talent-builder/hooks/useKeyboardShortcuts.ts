import { useEffect, useCallback } from 'react';
import { useTalentBuilder } from '../TalentBuilderContext';
import { useHistory } from './useHistory';

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  onDelete?: (nodeId: string) => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}): void {
  const { enabled = true, onDelete } = options;
  const { state, dispatch, actions } = useTalentBuilder();
  const { undo, redo, pushHistory } = useHistory();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't process hotkeys if typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Delete selected node(s)
    if (e.key === 'Delete' && state.selectedNode && !state.editingNode) {
      e.preventDefault();
      if (onDelete) {
        onDelete(state.selectedNode);
      } else {
        actions.deleteSelectedNodes();
      }
      pushHistory();
    }

    // Undo (Ctrl+Z)
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }

    // Redo (Ctrl+Shift+Z or Ctrl+Y)
    if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
      e.preventDefault();
      redo();
    }

    // Select All (Ctrl+A)
    if (e.ctrlKey && e.key === 'a') {
      e.preventDefault();
      dispatch({ type: 'SELECT_ALL' });
    }

    // Mode hotkeys
    if (e.key === '1') {
      e.preventDefault();
      dispatch({ type: 'SET_MODE', payload: 'select' });
    }
    if (e.key === '2') {
      e.preventDefault();
      dispatch({ type: 'SET_MODE', payload: 'add' });
    }
    if (e.key === '3') {
      e.preventDefault();
      dispatch({ type: 'SET_MODE', payload: 'connect' });
      dispatch({ type: 'SET_CONNECT_FROM', payload: null });
    }
    if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      dispatch({ type: 'SET_MODE', payload: 'lasso' });
    }

    // Escape to deselect / cancel
    if (e.key === 'Escape') {
      e.preventDefault();
      dispatch({ type: 'CLEAR_SELECTION' });
      dispatch({ type: 'SET_CONNECT_FROM', payload: null });
      dispatch({ type: 'SET_EDITING_NODE', payload: null });
    }

    // Story mode node type hotkeys
    if (state.builderMode === 'story') {
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        dispatch({ type: 'SET_STORY_NODE_EDIT_MODE', payload: 'normal' });
      }
      if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        dispatch({ type: 'SET_STORY_NODE_EDIT_MODE', payload: 'event' });
      }
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        dispatch({ type: 'SET_STORY_NODE_EDIT_MODE', payload: 'boss' });
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        dispatch({ type: 'SET_STORY_NODE_EDIT_MODE', payload: 'final_boss' });
      }

      // Toggle challenger status with 'C' key
      if ((e.key === 'c' || e.key === 'C') && state.selectedNode) {
        e.preventDefault();
        const node = state.nodes.find(n => n.id === state.selectedNode);
        if (node && (node.storyNodeType === 'normal' || !node.storyNodeType)) {
          dispatch({
            type: 'UPDATE_NODE',
            nodeId: state.selectedNode,
            updates: { challenger: !node.challenger }
          });
          dispatch({
            type: 'SET_SAVE_STATUS',
            payload: `${node.challenger ? 'Removed' : 'Added'} challenger status`
          });
          setTimeout(() => dispatch({ type: 'SET_SAVE_STATUS', payload: '' }), 2000);
        }
      }
    }

    // Grid toggle (G)
    if (e.key === 'g' || e.key === 'G') {
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        dispatch({ type: 'SET_SHOW_GRID', payload: !state.showGrid });
      }
    }

    // Snap toggle (S)
    if (e.key === 's' || e.key === 'S') {
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        dispatch({ type: 'SET_SNAP_TO_GRID', payload: !state.snapToGrid });
      }
    }

    // Reset view (Home or 0)
    if (e.key === 'Home' || e.key === '0') {
      e.preventDefault();
      dispatch({ type: 'RESET_VIEW' });
    }

  }, [
    state.selectedNode,
    state.editingNode,
    state.builderMode,
    state.nodes,
    state.showGrid,
    state.snapToGrid,
    dispatch,
    actions,
    undo,
    redo,
    pushHistory,
    onDelete
  ]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}
