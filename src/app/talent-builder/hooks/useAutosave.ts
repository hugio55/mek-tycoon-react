import { useEffect, useRef, useCallback, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useTalentBuilder } from '../TalentBuilderContext';
import { createSaveData } from '../saveMigrations';
import { Id } from '../../../../convex/_generated/dataModel';

interface UseAutosaveOptions {
  localStorageDebounce?: number; // Default: 2 seconds
  fileBackupInterval?: number; // Default: 5 minutes
  convexSyncInterval?: number; // Default: 5 minutes - sync to Convex if template is open
  maxAutoBackups?: number; // Default: 20 - cleanup older auto-backups
  enabled?: boolean;
}

interface UseAutosaveReturn {
  lastAutoSave: Date | null;
  lastBackup: Date | null;
  lastConvexSync: Date | null;
  autosaveError: string | null;
  changesSinceLastSave: number;
  hasUnsavedChanges: boolean;
  triggerLocalStorageSave: () => void;
  triggerFileBackup: () => Promise<void>;
  triggerConvexSync: () => Promise<void>;
}

const DEFAULT_LOCALSTORAGE_DEBOUNCE = 2 * 1000; // 2 seconds
const DEFAULT_FILE_BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_CONVEX_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes (only when a template is open)
const DEFAULT_MAX_AUTO_BACKUPS = 20;

// Helper to sanitize nodes for Convex (remove fields not in schema)
function sanitizeNodesForConvex(nodes: typeof import('../types').TalentNode[]): Parameters<typeof import('../../../../convex/_generated/api').api.mekTreeTemplates.updateTemplate>[0]['nodes'] {
  return nodes.map(node => ({
    id: node.id,
    name: node.name,
    x: node.x,
    y: node.y,
    tier: node.tier,
    desc: node.desc,
    xp: node.xp,
    unlocked: node.unlocked,
    nodeType: node.nodeType,
    statBonus: node.statBonus,
    abilityId: node.abilityId,
    passiveEffect: node.passiveEffect,
    buffGrant: node.buffGrant ? {
      buffType: node.buffGrant.buffType || '',
      baseValue: node.buffGrant.baseValue
    } : undefined
  }));
}

export function useAutosave(options: UseAutosaveOptions = {}): UseAutosaveReturn {
  const {
    localStorageDebounce = DEFAULT_LOCALSTORAGE_DEBOUNCE,
    fileBackupInterval = DEFAULT_FILE_BACKUP_INTERVAL,
    convexSyncInterval = DEFAULT_CONVEX_SYNC_INTERVAL,
    maxAutoBackups = DEFAULT_MAX_AUTO_BACKUPS,
    enabled = true
  } = options;

  const { state, dispatch } = useTalentBuilder();

  // State for hasUnsavedChanges (not a ref, so it triggers re-renders)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Convex mutation for syncing templates
  const updateTemplate = useMutation(api.mekTreeTemplates.updateTemplate);

  // Refs to access current state in callbacks
  const nodesRef = useRef(state.nodes);
  const connectionsRef = useRef(state.connections);
  const currentSaveNameRef = useRef(state.currentSaveName);
  const builderModeRef = useRef(state.builderMode);
  const selectedTemplateIdRef = useRef(state.selectedTemplateId);
  const templateNameRef = useRef(state.templateName);
  const viewportDimensionsRef = useRef(state.viewportDimensions);

  // Tracking refs
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileBackupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const convexSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedNodesRef = useRef<string>('');
  const lastSavedConnectionsRef = useRef<string>('');
  const lastConvexSyncNodesRef = useRef<string>('');
  const lastConvexSyncConnectionsRef = useRef<string>('');

  // Update refs when state changes
  useEffect(() => {
    nodesRef.current = state.nodes;
    connectionsRef.current = state.connections;
    currentSaveNameRef.current = state.currentSaveName;
    builderModeRef.current = state.builderMode;
    selectedTemplateIdRef.current = state.selectedTemplateId;
    templateNameRef.current = state.templateName;
    viewportDimensionsRef.current = state.viewportDimensions;
  }, [state.nodes, state.connections, state.currentSaveName, state.builderMode, state.selectedTemplateId, state.templateName, state.viewportDimensions]);

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

  // Perform Convex sync (only when a template is saved/open)
  const performConvexSync = useCallback(async () => {
    const templateId = selectedTemplateIdRef.current;
    const currentNodes = nodesRef.current;
    const currentConnections = connectionsRef.current;

    // Only sync if we have a saved template open
    if (!templateId || currentNodes.length === 0) {
      return;
    }

    // Check if anything actually changed since last sync
    const nodesJson = JSON.stringify(currentNodes);
    const connectionsJson = JSON.stringify(currentConnections);

    if (nodesJson === lastConvexSyncNodesRef.current && connectionsJson === lastConvexSyncConnectionsRef.current) {
      console.log('[ConvexSync] No changes since last sync, skipping');
      return;
    }

    try {
      console.log('[ConvexSync] Syncing template to Convex...', templateId);

      // Sanitize nodes to match Convex schema
      const sanitizedNodes = sanitizeNodesForConvex(currentNodes);

      await updateTemplate({
        templateId: templateId as Id<"mekTreeTemplates">,
        name: templateNameRef.current || undefined,
        nodes: sanitizedNodes,
        connections: currentConnections,
        viewportDimensions: viewportDimensionsRef.current
      });

      // Update tracking refs
      lastConvexSyncNodesRef.current = nodesJson;
      lastConvexSyncConnectionsRef.current = connectionsJson;

      dispatch({ type: 'SET_LAST_CONVEX_SYNC', payload: new Date() });
      console.log(`[ConvexSync] Synced ${currentNodes.length} nodes to Convex`);
    } catch (e) {
      console.error('[ConvexSync] Error:', e);
      // Don't set error state for background sync - just log it
    }
  }, [dispatch, updateTemplate]);

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

  // Convex sync timer - every 5 minutes (only when template is open)
  useEffect(() => {
    if (!enabled) return;

    convexSyncTimerRef.current = setInterval(() => {
      // Only sync if a template is open (selectedTemplateId exists)
      if (selectedTemplateIdRef.current && nodesRef.current.length > 0) {
        console.log('[ConvexSync] Triggered by 5-minute timer');
        performConvexSync();
      }
    }, convexSyncInterval);

    return () => {
      if (convexSyncTimerRef.current) {
        clearInterval(convexSyncTimerRef.current);
      }
    };
  }, [enabled, convexSyncInterval, performConvexSync]);

  return {
    lastAutoSave: state.lastAutoSave,
    lastBackup: state.lastConvexBackup,
    lastConvexSync: state.lastConvexSync,
    autosaveError: state.autosaveError,
    changesSinceLastSave: state.changeCounter,
    hasUnsavedChanges,
    triggerLocalStorageSave: performLocalStorageSave,
    triggerFileBackup: performFileBackup,
    triggerConvexSync: performConvexSync
  };
}
