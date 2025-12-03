import { useEffect, useRef, useCallback, useState } from 'react';
import { useTalentBuilder } from '../TalentBuilderContext';
import { createSaveData } from '../saveMigrations';

interface UseAutosaveOptions {
  localStorageDebounce?: number; // Default: 2 seconds
  fileBackupInterval?: number; // Default: 5 minutes
  maxAutoBackups?: number; // Default: 20 - cleanup older auto-backups
  enabled?: boolean;
}

interface UseAutosaveReturn {
  lastAutoSave: Date | null;
  lastBackup: Date | null;
  autosaveError: string | null;
  changesSinceLastSave: number;
  hasUnsavedChanges: boolean;
  triggerLocalStorageSave: () => void;
  triggerFileBackup: () => Promise<void>;
}

const DEFAULT_LOCALSTORAGE_DEBOUNCE = 2 * 1000; // 2 seconds
const DEFAULT_FILE_BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_AUTO_BACKUPS = 20;

export function useAutosave(options: UseAutosaveOptions = {}): UseAutosaveReturn {
  const {
    localStorageDebounce = DEFAULT_LOCALSTORAGE_DEBOUNCE,
    fileBackupInterval = DEFAULT_FILE_BACKUP_INTERVAL,
    maxAutoBackups = DEFAULT_MAX_AUTO_BACKUPS,
    enabled = true
  } = options;

  const { state, dispatch } = useTalentBuilder();

  // State for hasUnsavedChanges (not a ref, so it triggers re-renders)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Refs to access current state in callbacks
  const nodesRef = useRef(state.nodes);
  const connectionsRef = useRef(state.connections);
  const currentSaveNameRef = useRef(state.currentSaveName);
  const builderModeRef = useRef(state.builderMode);

  // Tracking refs
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileBackupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedNodesRef = useRef<string>('');
  const lastSavedConnectionsRef = useRef<string>('');

  // Update refs when state changes
  useEffect(() => {
    nodesRef.current = state.nodes;
    connectionsRef.current = state.connections;
    currentSaveNameRef.current = state.currentSaveName;
    builderModeRef.current = state.builderMode;
  }, [state.nodes, state.connections, state.currentSaveName, state.builderMode]);

  // Perform localStorage save
  const performLocalStorageSave = useCallback(() => {
    const currentNodes = nodesRef.current;
    const currentConnections = connectionsRef.current;

    if (currentNodes.length === 0) return;

    // Check if anything actually changed
    const nodesJson = JSON.stringify(currentNodes);
    const connectionsJson = JSON.stringify(currentConnections);

    if (nodesJson === lastSavedNodesRef.current && connectionsJson === lastSavedConnectionsRef.current) {
      return; // No changes, skip save
    }

    try {
      const saveData = createSaveData(currentNodes, currentConnections);

      // Save to localStorage
      localStorage.setItem('talentTreeData', JSON.stringify(saveData));
      localStorage.setItem('talentTreeData-autosave', JSON.stringify({
        ...saveData,
        autoSavedAt: new Date().toISOString()
      }));

      // Update tracking
      lastSavedNodesRef.current = nodesJson;
      lastSavedConnectionsRef.current = connectionsJson;
      setHasUnsavedChanges(true); // Mark that changes exist for file backup

      dispatch({ type: 'SET_LAST_AUTO_SAVE', payload: new Date() });
      dispatch({ type: 'SET_AUTOSAVE_ERROR', payload: null });

      console.log('[Autosave] Saved to localStorage');
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      console.error('[Autosave] Failed:', e);
      dispatch({ type: 'SET_AUTOSAVE_ERROR', payload: `Autosave failed: ${errorMsg}` });
    }
  }, [dispatch]);

  // Perform file backup
  const performFileBackup = useCallback(async () => {
    const currentNodes = nodesRef.current;
    const currentConnections = connectionsRef.current;

    if (currentNodes.length === 0) return;

    try {
      const response = await fetch('/api/talent-tree-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentSaveNameRef.current || 'Autosave',
          builderMode: builderModeRef.current,
          nodes: currentNodes,
          connections: currentConnections,
          isAutoBackup: true
        })
      });

      const result = await response.json();
      if (result.success) {
        setHasUnsavedChanges(false); // Reset change tracking
        dispatch({ type: 'SET_LAST_CONVEX_BACKUP', payload: new Date() });
        console.log(`[FileBackup] Created: ${result.filename} (${result.nodeCount} nodes)`);

        // Cleanup old auto-backups (fire and forget)
        fetch('/api/talent-tree-backup/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keepCount: maxAutoBackups,
            mode: builderModeRef.current
          })
        }).catch(() => {}); // Ignore cleanup errors
      } else {
        console.error('[FileBackup] Failed:', result.error);
      }
    } catch (e) {
      console.error('[FileBackup] Error:', e);
    }
  }, [dispatch, maxAutoBackups]);

  // Debounced localStorage save - triggers on every change
  useEffect(() => {
    if (!enabled) return;
    if (state.nodes.length === 0 && state.connections.length === 0) return;
    if (state.skipNextHistoryPush) return; // Skip if this is a load/undo/redo

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      performLocalStorageSave();
    }, localStorageDebounce);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [state.nodes, state.connections, enabled, localStorageDebounce, state.skipNextHistoryPush, performLocalStorageSave]);

  // File backup timer - every 5 minutes
  // Note: We use a ref to track hasUnsavedChanges for the interval check
  // because the interval callback captures the initial value otherwise
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!enabled) return;

    fileBackupTimerRef.current = setInterval(() => {
      if (nodesRef.current.length > 0 && hasUnsavedChangesRef.current) {
        console.log('[FileBackup] Triggered by 5-minute timer');
        performFileBackup();
      }
    }, fileBackupInterval);

    return () => {
      if (fileBackupTimerRef.current) {
        clearInterval(fileBackupTimerRef.current);
      }
    };
  }, [enabled, fileBackupInterval, performFileBackup]);

  return {
    lastAutoSave: state.lastAutoSave,
    lastBackup: state.lastConvexBackup,
    autosaveError: state.autosaveError,
    changesSinceLastSave: state.changeCounter,
    hasUnsavedChanges,
    triggerLocalStorageSave: performLocalStorageSave,
    triggerFileBackup: performFileBackup
  };
}
