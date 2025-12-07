import { useCallback, useEffect } from 'react';
import { useTalentBuilder } from '../TalentBuilderContext';
import { createSaveData, loadSaveDataSafely } from '../saveMigrations';
import { TalentNode, Connection, SavedCiruTree, SavedStoryMode, BackupFile } from '../types';

interface UseSaveLoadReturn {
  // Save functions
  saveToLocalStorage: (saveName: string, isOverwrite?: boolean) => Promise<boolean>;
  saveStoryMode: (saveName: string, chapter: number) => Promise<boolean>;

  // Load functions
  loadFromLocalStorage: () => boolean;
  loadTree: (nodes: TalentNode[], connections: Connection[], saveName?: string) => void;
  loadFromBackup: (filename: string) => Promise<boolean>;

  // Management
  startNewTree: () => void;
  refreshBackupList: () => Promise<void>;
  deleteLocalSave: (saveName: string) => void;
  setActiveTree: (saveName: string) => void;

  // Data
  savedCiruTrees: SavedCiruTree[];
  savedStoryModes: SavedStoryMode[];
  backupFiles: BackupFile[];
  currentSaveName: string | null;
  hasUnsavedChanges: boolean;
}

export function useSaveLoad(): UseSaveLoadReturn {
  const { state, dispatch, actions } = useTalentBuilder();

  // Load saved trees from localStorage on mount
  useEffect(() => {
    try {
      const ciruTreeSaves = localStorage.getItem('ciruTreeSaves');
      if (ciruTreeSaves) {
        const parsed = JSON.parse(ciruTreeSaves);
        dispatch({ type: 'SET_SAVED_CIRU_TREES', payload: parsed });
      }

      const storyModeSaves = localStorage.getItem('savedStoryModes');
      if (storyModeSaves) {
        const parsed = JSON.parse(storyModeSaves);
        dispatch({ type: 'SET_SAVED_STORY_MODES', payload: parsed });
      }
    } catch (e) {
      console.error('Failed to load saved trees:', e);
    }
  }, [dispatch]);

  // Refresh backup list from API
  const refreshBackupList = useCallback(async () => {
    try {
      const response = await fetch('/api/talent-tree-backup');
      const data = await response.json();
      if (data.success) {
        dispatch({ type: 'SET_BACKUP_FILES', payload: data.backups });
      }
    } catch (e) {
      console.error('Failed to load backups:', e);
    }
  }, [dispatch]);

  // Save to localStorage with optional file backup
  const saveToLocalStorage = useCallback(async (
    saveName: string,
    isOverwrite: boolean = false
  ): Promise<boolean> => {
    try {
      const existingSaves = JSON.parse(localStorage.getItem('ciruTreeSaves') || '[]');

      const saveData = {
        name: saveName,
        data: createSaveData(state.nodes, state.connections),
        isActive: false
      };

      if (isOverwrite) {
        const existingIndex = existingSaves.findIndex((s: SavedCiruTree) => s.name === saveName);
        if (existingIndex >= 0) {
          existingSaves[existingIndex] = saveData;
        } else {
          existingSaves.push(saveData);
        }
      } else {
        existingSaves.push(saveData);
      }

      // Save to localStorage
      localStorage.setItem('ciruTreeSaves', JSON.stringify(existingSaves));
      localStorage.setItem('talentTreeData', JSON.stringify(saveData.data));

      dispatch({ type: 'SET_SAVED_CIRU_TREES', payload: existingSaves });
      dispatch({ type: 'SET_HAS_UNSAVED_CHANGES', payload: false });
      dispatch({ type: 'SET_CURRENT_SAVE_NAME', payload: saveName });

      // Create file system backup
      try {
        const response = await fetch('/api/talent-tree-backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: saveName,
            builderMode: state.builderMode,
            nodes: state.nodes,
            connections: state.connections,
            isAutoBackup: false
          })
        });

        const result = await response.json();
        if (result.success) {
          actions.setSaveStatus(`Saved: ${saveName} (file backup created)`, 2000);
        } else {
          actions.setSaveStatus(`Saved: ${saveName} (file backup failed)`, 2000);
        }
      } catch (backupError) {
        actions.setSaveStatus(`Saved: ${saveName} (file backup failed)`, 2000);
      }

      return true;
    } catch (e) {
      console.error('Failed to save:', e);
      actions.setSaveStatus('Save failed', 3000);
      return false;
    }
  }, [state.nodes, state.connections, state.builderMode, dispatch, actions]);

  // Save story mode
  const saveStoryMode = useCallback(async (saveName: string, chapter: number): Promise<boolean> => {
    try {
      const existingSaves = JSON.parse(localStorage.getItem('savedStoryModes') || '[]');

      const saveData = {
        name: saveName,
        chapter,
        data: createSaveData(state.nodes, state.connections)
      };

      // Check if updating existing save
      const existingIndex = existingSaves.findIndex(
        (s: SavedStoryMode) => s.name === saveName && s.chapter === chapter
      );

      if (existingIndex >= 0) {
        existingSaves[existingIndex] = saveData;
      } else {
        existingSaves.push(saveData);
      }

      localStorage.setItem('savedStoryModes', JSON.stringify(existingSaves));
      dispatch({ type: 'SET_SAVED_STORY_MODES', payload: existingSaves });
      dispatch({ type: 'SET_HAS_UNSAVED_CHANGES', payload: false });

      // Create file backup for story mode too
      try {
        const response = await fetch('/api/talent-tree-backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${saveName}_Ch${chapter}`,
            builderMode: 'story',
            nodes: state.nodes,
            connections: state.connections,
            isAutoBackup: false
          })
        });

        const result = await response.json();
        if (result.success) {
          actions.setSaveStatus(`Story saved: ${saveName} Ch${chapter} (file backup created)`, 2000);
        } else {
          actions.setSaveStatus(`Story saved: ${saveName} Ch${chapter} (backup failed)`, 2000);
        }
      } catch {
        actions.setSaveStatus(`Story saved: ${saveName} Ch${chapter} (backup failed)`, 2000);
      }

      return true;
    } catch (e) {
      console.error('Failed to save story mode:', e);
      actions.setSaveStatus('Save failed', 3000);
      return false;
    }
  }, [state.nodes, state.connections, dispatch, actions]);

  // Load from localStorage
  const loadFromLocalStorage = useCallback((): boolean => {
    const savedData = localStorage.getItem('talentTreeData');
    if (!savedData) {
      actions.setSaveStatus('No saved tree found', 3000);
      return false;
    }

    try {
      const rawData = JSON.parse(savedData);
      const migratedData = loadSaveDataSafely(rawData);

      dispatch({ type: 'SET_SKIP_NEXT_HISTORY_PUSH', payload: true });
      dispatch({
        type: 'LOAD_TREE',
        nodes: migratedData.nodes || [],
        connections: migratedData.connections || []
      });

      actions.setSaveStatus('Loaded', 2000);
      return true;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      actions.setSaveStatus(`Load failed: ${errorMsg}`, 3000);
      return false;
    }
  }, [dispatch, actions]);

  // Load tree from nodes/connections
  const loadTree = useCallback((
    nodes: TalentNode[],
    connections: Connection[],
    saveName?: string
  ) => {
    dispatch({ type: 'SET_SKIP_NEXT_HISTORY_PUSH', payload: true });
    dispatch({ type: 'LOAD_TREE', nodes, connections, saveName });
  }, [dispatch]);

  // Load from backup file
  const loadFromBackup = useCallback(async (filename: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/talent-tree-backup/load?filename=${encodeURIComponent(filename)}`);
      const result = await response.json();

      if (!result.success) {
        actions.setSaveStatus(`Load failed: ${result.error}`, 3000);
        return false;
      }

      // The new endpoint returns data directly (not nested under .data)
      const backupData = result.data;
      const migratedData = loadSaveDataSafely({
        nodes: backupData.nodes,
        connections: backupData.connections
      });

      dispatch({ type: 'SET_SKIP_NEXT_HISTORY_PUSH', payload: true });
      dispatch({
        type: 'LOAD_TREE',
        nodes: migratedData.nodes || [],
        connections: migratedData.connections || [],
        saveName: backupData.name
      });

      // Set builder mode if available
      if (backupData.builderMode) {
        dispatch({ type: 'SET_BUILDER_MODE', payload: backupData.builderMode });
      }

      actions.setSaveStatus(`Loaded from backup: ${backupData.name}`, 2000);
      return true;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      actions.setSaveStatus(`Load failed: ${errorMsg}`, 3000);
      return false;
    }
  }, [dispatch, actions]);

  // Start new tree
  const startNewTree = useCallback(() => {
    // Position at 1485 so the 30px node's center lands on the grid center (1500)
    const startNode: TalentNode = {
      id: 'start',
      name: 'START',
      x: 1500 - 15,
      y: 1500 - 15,
      tier: 0,
      desc: 'The beginning of your journey',
      xp: 0
    };

    dispatch({ type: 'LOAD_TREE', nodes: [startNode], connections: [] });
    dispatch({ type: 'SET_CURRENT_SAVE_NAME', payload: null });
    actions.setSaveStatus('New tree created', 2000);
  }, [dispatch, actions]);

  // Delete local save
  const deleteLocalSave = useCallback((saveName: string) => {
    try {
      const existingSaves = JSON.parse(localStorage.getItem('ciruTreeSaves') || '[]');
      const filtered = existingSaves.filter((s: SavedCiruTree) => s.name !== saveName);
      localStorage.setItem('ciruTreeSaves', JSON.stringify(filtered));
      dispatch({ type: 'SET_SAVED_CIRU_TREES', payload: filtered });
      actions.setSaveStatus(`Deleted: ${saveName}`, 2000);
    } catch (e) {
      console.error('Failed to delete save:', e);
    }
  }, [dispatch, actions]);

  // Set active tree (for website display)
  const setActiveTree = useCallback((saveName: string) => {
    try {
      const existingSaves = JSON.parse(localStorage.getItem('ciruTreeSaves') || '[]');
      const updatedSaves = existingSaves.map((s: SavedCiruTree) => ({
        ...s,
        isActive: s.name === saveName
      }));

      const activeTree = updatedSaves.find((s: SavedCiruTree) => s.name === saveName);
      if (activeTree) {
        localStorage.setItem('publicTalentTree', JSON.stringify(activeTree.data));
      }

      localStorage.setItem('ciruTreeSaves', JSON.stringify(updatedSaves));
      dispatch({ type: 'SET_SAVED_CIRU_TREES', payload: updatedSaves });
      actions.setSaveStatus(`Set as active: ${saveName}`, 2000);
    } catch (e) {
      console.error('Failed to set active tree:', e);
    }
  }, [dispatch, actions]);

  return {
    saveToLocalStorage,
    saveStoryMode,
    loadFromLocalStorage,
    loadTree,
    loadFromBackup,
    startNewTree,
    refreshBackupList,
    deleteLocalSave,
    setActiveTree,
    savedCiruTrees: state.savedCiruTrees,
    savedStoryModes: state.savedStoryModes,
    backupFiles: state.backupFiles,
    currentSaveName: state.currentSaveName,
    hasUnsavedChanges: state.hasUnsavedChanges
  };
}
