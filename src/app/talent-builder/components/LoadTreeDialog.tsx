'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useTalentBuilder } from '../TalentBuilderContext';
import { useSaveLoad } from '../hooks';
import { loadSaveDataSafely } from '../saveMigrations';
import { SavedCiruTree, BackupFile } from '../types';

interface LoadTreeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoadTreeDialog({ isOpen, onClose }: LoadTreeDialogProps) {
  const { dispatch, actions } = useTalentBuilder();
  const { loadTree, refreshBackupList, backupFiles } = useSaveLoad();
  const [localSaves, setLocalSaves] = useState<SavedCiruTree[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load saves from localStorage and fetch backups when dialog opens
  useEffect(() => {
    if (isOpen) {
      try {
        const saves = JSON.parse(localStorage.getItem('ciruTreeSaves') || '[]');
        setLocalSaves(saves);
      } catch {
        setLocalSaves([]);
      }
      refreshBackupList();
    }
  }, [isOpen, refreshBackupList]);

  if (!isOpen) return null;

  const handleLoadSave = (save: SavedCiruTree) => {
    try {
      const migratedData = loadSaveDataSafely(save.data);
      dispatch({ type: 'SET_SKIP_NEXT_HISTORY_PUSH', payload: true });
      loadTree(migratedData.nodes || [], migratedData.connections || [], save.name);
      localStorage.setItem('talentTreeData', JSON.stringify(migratedData));
      actions.setSaveStatus(`Loaded: ${save.name}`, 2000);
      onClose();
    } catch (e) {
      alert(`Failed to load save: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const handleSetActive = (save: SavedCiruTree, index: number) => {
    const saves = [...localSaves];
    saves.forEach((s) => s.isActive = false);
    saves[index].isActive = true;
    localStorage.setItem('ciruTreeSaves', JSON.stringify(saves));
    localStorage.setItem('publicTalentTree', JSON.stringify(save.data));
    setLocalSaves(saves);
    actions.setSaveStatus('Set as active website tree', 2000);
    onClose();
  };

  const handleDeleteSave = (index: number) => {
    if (confirm('Delete this saved tree?')) {
      const saves = [...localSaves];
      saves.splice(index, 1);
      localStorage.setItem('ciruTreeSaves', JSON.stringify(saves));
      setLocalSaves(saves);
    }
  };

  const handleLoadBackup = async (backup: BackupFile) => {
    try {
      const response = await fetch(`/api/load-backup?filename=${encodeURIComponent(backup.filename)}`);
      const result = await response.json();

      if (result.success && result.data) {
        const migratedData = loadSaveDataSafely(result.data.data);
        dispatch({ type: 'SET_SKIP_NEXT_HISTORY_PUSH', payload: true });
        loadTree(migratedData.nodes || [], migratedData.connections || [], result.data.name || 'Backup');
        localStorage.setItem('talentTreeData', JSON.stringify(migratedData));
        actions.setSaveStatus(`Loaded backup: ${backup.filename}`, 2000);
        onClose();
      } else {
        alert('Failed to load backup: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error loading backup:', error);
      alert(`Failed to load backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Load CiruTree</h2>

        <div className="flex-1 overflow-y-auto space-y-6" ref={canvasRef}>
          {/* Current Saves Section */}
          <div>
            <h3 className="text-lg font-bold text-yellow-400 mb-3">Current Saves (LocalStorage)</h3>
            {localSaves.length === 0 ? (
              <div className="text-center py-4 text-gray-400 bg-gray-800/50 rounded">
                No saved CiruTrees found. Create and save a tree first!
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {localSaves.map((save, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-all"
                  >
                    <h3 className="font-bold text-yellow-400 mb-2">{save.name}</h3>
                    <div className="text-sm text-gray-400 mb-3">
                      Nodes: {save.data.nodes?.length || 0} |
                      Connections: {save.data.connections?.length || 0}
                    </div>
                    {save.isActive && (
                      <div className="text-xs text-green-400 mb-2">Currently Active on Website</div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadSave(save)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleSetActive(save, index)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                      >
                        Set as Active
                      </button>
                      <button
                        onClick={() => handleDeleteSave(index)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Backup Files Section */}
          <div>
            <h3 className="text-lg font-bold text-blue-400 mb-3">
              File System Backups ({backupFiles.length})
            </h3>
            {backupFiles.length === 0 ? (
              <div className="text-center py-4 text-gray-400 bg-gray-800/50 rounded">
                No backup files found. Backups are created automatically when you save.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {backupFiles.map((backup, index) => {
                  const date = new Date(backup.timestamp);
                  const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                  return (
                    <div
                      key={index}
                      className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-all border border-blue-900/30"
                    >
                      <h3 className="font-bold text-blue-400 mb-2 text-sm">{backup.filename}</h3>
                      <div className="text-xs text-gray-400 mb-3">
                        <div>Date: {formattedDate}</div>
                        <div>Size: {(backup.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadBackup(backup)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                        >
                          Load
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}
