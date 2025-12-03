'use client';

import React, { useState, useEffect } from 'react';
import { useTalentBuilder } from '../TalentBuilderContext';
import { useSaveLoad } from '../hooks';
import { SavedCiruTree } from '../types';

interface SaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SaveDialog({ isOpen, onClose }: SaveDialogProps) {
  const { state } = useTalentBuilder();
  const { saveToLocalStorage, savedCiruTrees } = useSaveLoad();
  const [newSaveName, setNewSaveName] = useState('');
  const [localSaves, setLocalSaves] = useState<SavedCiruTree[]>([]);

  // Load saves from localStorage when dialog opens
  useEffect(() => {
    if (isOpen) {
      try {
        const saves = JSON.parse(localStorage.getItem('ciruTreeSaves') || '[]');
        setLocalSaves(saves);
      } catch {
        setLocalSaves([]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverwrite = async (saveName: string) => {
    await saveToLocalStorage(saveName, true);
    onClose();
  };

  const handleSaveNew = async (name: string) => {
    if (name.trim()) {
      await saveToLocalStorage(name.trim(), false);
      onClose();
    }
  };

  const handleQuickSave = async () => {
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    await saveToLocalStorage(timestamp, false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">Save Tree</h2>

        <div className="space-y-4">
          {state.currentSaveName && (
            <div className="mb-4 p-3 bg-gray-800 rounded">
              <p className="text-sm text-gray-400">
                Current save: <span className="text-yellow-400">{state.currentSaveName}</span>
              </p>
            </div>
          )}

          {localSaves.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Overwrite existing save:</h3>
              <select
                className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-yellow-400 mb-2"
                onChange={(e) => {
                  if (e.target.value) {
                    handleOverwrite(e.target.value);
                  }
                }}
                defaultValue=""
              >
                <option value="">Select a save to overwrite...</option>
                {localSaves.map((save) => (
                  <option key={save.name} value={save.name}>
                    {save.name}
                  </option>
                ))}
              </select>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-400">OR</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Save as new file:</h3>
            <input
              type="text"
              placeholder="Enter save name..."
              value={newSaveName}
              onChange={(e) => setNewSaveName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-yellow-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newSaveName.trim()) {
                  handleSaveNew(newSaveName);
                }
              }}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">Press Enter to save or use Quick Save for timestamp</p>
          </div>

          <div className="flex gap-2 justify-end mt-6">
            <button
              onClick={handleQuickSave}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
            >
              Quick Save (Timestamp)
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
