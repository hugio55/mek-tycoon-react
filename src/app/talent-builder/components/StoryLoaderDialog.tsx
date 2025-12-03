'use client';

import React, { useEffect, useState } from 'react';
import { useTalentBuilder } from '../TalentBuilderContext';
import { useSaveLoad } from '../hooks';
import { useHistory } from '../hooks';
import { SavedStoryMode } from '../types';

interface StoryLoaderDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StoryLoaderDialog({ isOpen, onClose }: StoryLoaderDialogProps) {
  const { dispatch, actions } = useTalentBuilder();
  const { loadTree, savedStoryModes } = useSaveLoad();
  const { pushHistory } = useHistory();
  const [localSaves, setLocalSaves] = useState<SavedStoryMode[]>([]);

  // Load saves from localStorage when dialog opens
  useEffect(() => {
    if (isOpen) {
      try {
        const saves = JSON.parse(localStorage.getItem('savedStoryModes') || '[]');
        setLocalSaves(saves);
      } catch {
        setLocalSaves([]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoadSave = (save: SavedStoryMode) => {
    dispatch({ type: 'SET_SKIP_NEXT_HISTORY_PUSH', payload: true });
    loadTree(save.data.nodes || [], save.data.connections || [], save.name);
    dispatch({ type: 'SET_STORY_CHAPTER', payload: save.chapter });
    actions.setSaveStatus(`Loaded "${save.name}"`, 2000);
    pushHistory();
    onClose();
  };

  const handleDeleteSave = (index: number) => {
    const save = localSaves[index];
    if (confirm(`Delete "${save.name}"?`)) {
      const filtered = localSaves.filter((_, i) => i !== index);
      setLocalSaves(filtered);
      localStorage.setItem('savedStoryModes', JSON.stringify(filtered));
      dispatch({ type: 'SET_SAVED_STORY_MODES', payload: filtered });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Load Story Mode Layout</h2>

        <div className="flex-1 overflow-y-auto">
          {localSaves.length === 0 ? (
            <p className="text-gray-400">No saved story layouts found</p>
          ) : (
            <div className="space-y-2">
              {localSaves.map((save, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded p-4 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-white">{save.name}</h3>
                      <p className="text-sm text-gray-400">Chapter {save.chapter}</p>
                      <p className="text-xs text-gray-500">
                        {save.data.nodes?.length || 0} nodes, {save.data.connections?.length || 0} connections
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadSave(save)}
                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteSave(index)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
