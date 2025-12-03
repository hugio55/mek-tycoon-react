import { useCallback, useRef } from 'react';
import { useTalentBuilder } from '../TalentBuilderContext';
import { TalentNode, Connection } from '../types';

interface UseHistoryReturn {
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
  currentIndex: number;
}

export function useHistory(): UseHistoryReturn {
  const { state, dispatch, canUndo, canRedo } = useTalentBuilder();
  const lastPushRef = useRef<number>(0);

  const pushHistory = useCallback(() => {
    // Debounce: Don't push if we just pushed within 100ms
    const now = Date.now();
    if (now - lastPushRef.current < 100) {
      return;
    }
    lastPushRef.current = now;

    // Create a deep copy of current state to store in history
    const entry = {
      nodes: JSON.parse(JSON.stringify(state.nodes)) as TalentNode[],
      connections: JSON.parse(JSON.stringify(state.connections)) as Connection[]
    };

    dispatch({ type: 'PUSH_HISTORY', entry });
  }, [state.nodes, state.connections, dispatch]);

  const undo = useCallback(() => {
    if (canUndo) {
      dispatch({ type: 'UNDO' });
    }
  }, [canUndo, dispatch]);

  const redo = useCallback(() => {
    if (canRedo) {
      dispatch({ type: 'REDO' });
    }
  }, [canRedo, dispatch]);

  return {
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength: state.history.length,
    currentIndex: state.historyIndex
  };
}
