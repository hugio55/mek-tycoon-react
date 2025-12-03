import { useEffect, useRef, useCallback } from 'react';
import { useTalentBuilder } from '../TalentBuilderContext';
import { createSaveData } from '../saveMigrations';

interface UseAutosaveOptions {
  localStorageInterval?: number; // Default: 2 minutes
  backupInterval?: number; // Default: 10 minutes
  changeThreshold?: number; // Default: 10 changes
  enabled?: boolean;
}

interface UseAutosaveReturn {
  lastAutoSave: Date | null;
  lastBackup: Date | null;
  autosaveError: string | null;
  changesSinceLastSave: number;
  triggerAutoSave: () => void;
  triggerBackup: () => Promise<void>;
}

const DEFAULT_LOCAL_INTERVAL = 2 * 60 * 1000; // 2 minutes
const DEFAULT_BACKUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
const DEFAULT_CHANGE_THRESHOLD = 10;

export function useAutosave(options: UseAutosaveOptions = {}): UseAutosaveReturn {
  const {
    localStorageInterval = DEFAULT_LOCAL_INTERVAL,
    backupInterval = DEFAULT_BACKUP_INTERVAL,
    changeThreshold = DEFAULT_CHANGE_THRESHOLD,
    enabled = true
  } = options;

  const { state, dispatch } = useTalentBuilder();

  // Refs to access current state in timer callbacks
  const nodesRef = useRef(state.nodes);
  const connectionsRef = useRef(state.connections);
  const currentSaveNameRef = useRef(state.currentSaveName);

  // Timer refs
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backupTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update refs when state changes
  useEffect(() => {
    nodesRef.current = state.nodes;
    connectionsRef.current = state.connections;
    currentSaveNameRef.current = state.currentSaveName;
  }, [state.nodes, state.connections, state.currentSaveName]);

  // Perform autosave to localStorage
  const performAutoSave = useCallback(() => {
    const currentNodes = nodesRef.current;
    const currentConnections = connectionsRef.current;

    if (currentNodes.length === 0) return;

    try {
      const saveData = createSaveData(currentNodes, currentConnections);

      // Save to localStorage
      localStorage.setItem('talentTreeData', JSON.stringify(saveData));
      localStorage.setItem('talentTreeData-autosave', JSON.stringify({
        ...saveData,
        autoSavedAt: new Date().toISOString()
      }));

      dispatch({ type: 'SET_LAST_AUTO_SAVE', payload: new Date() });
      dispatch({ type: 'SET_CHANGE_COUNTER', payload: 0 });
      dispatch({ type: 'SET_AUTOSAVE_ERROR', payload: null });

      console.log('[Autosave] Saved to localStorage');
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      console.error('[Autosave] Failed:', e);
      dispatch({ type: 'SET_AUTOSAVE_ERROR', payload: `Autosave failed: ${errorMsg}` });
    }
  }, [dispatch]);

  // Perform backup to file system via API
  const performBackup = useCallback(async () => {
    const currentNodes = nodesRef.current;
    const currentConnections = connectionsRef.current;

    if (currentNodes.length === 0) return;

    try {
      const saveData = {
        name: currentSaveNameRef.current || 'Auto-backup',
        data: createSaveData(currentNodes, currentConnections),
        isActive: false
      };

      const response = await fetch('/api/save-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData)
      });

      const result = await response.json();
      if (result.success) {
        dispatch({ type: 'SET_LAST_CONVEX_BACKUP', payload: new Date() });
        console.log('[Backup] Created:', result.filename);
      } else {
        console.error('[Backup] Failed:', result.error);
      }
    } catch (e) {
      console.error('[Backup] Error:', e);
    }
  }, [dispatch]);

  // Track changes and trigger autosave at threshold
  useEffect(() => {
    if (!enabled) return;
    if (state.nodes.length === 0 && state.connections.length === 0) return;
    if (state.skipNextHistoryPush) return; // Skip if this is a load/undo/redo

    // Increment change counter
    dispatch({ type: 'INCREMENT_CHANGE_COUNTER' });

    // Check if we've hit the change threshold
    if (state.changeCounter + 1 >= changeThreshold) {
      console.log(`[Autosave] Triggered by change count (${changeThreshold} changes)`);
      performAutoSave();
    }
  }, [state.nodes, state.connections, enabled, changeThreshold, state.skipNextHistoryPush, state.changeCounter, dispatch, performAutoSave]);

  // Set up localStorage autosave timer
  useEffect(() => {
    if (!enabled) return;

    autoSaveTimerRef.current = setInterval(() => {
      if (nodesRef.current.length > 0) {
        console.log('[Autosave] Triggered by timer');
        performAutoSave();
      }
    }, localStorageInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [enabled, localStorageInterval, performAutoSave]);

  // Set up backup timer
  useEffect(() => {
    if (!enabled) return;

    backupTimerRef.current = setInterval(() => {
      if (nodesRef.current.length > 0) {
        console.log('[Backup] Triggered by timer');
        performBackup();
      }
    }, backupInterval);

    return () => {
      if (backupTimerRef.current) {
        clearInterval(backupTimerRef.current);
      }
    };
  }, [enabled, backupInterval, performBackup]);

  return {
    lastAutoSave: state.lastAutoSave,
    lastBackup: state.lastConvexBackup,
    autosaveError: state.autosaveError,
    changesSinceLastSave: state.changeCounter,
    triggerAutoSave: performAutoSave,
    triggerBackup: performBackup
  };
}
