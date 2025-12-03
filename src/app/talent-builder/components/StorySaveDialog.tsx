'use client';

import React, { useMemo } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useTalentBuilder } from '../TalentBuilderContext';
import { useSaveLoad } from '../hooks';
import { SavedStoryMode } from '../types';

interface StorySaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StorySaveDialog({ isOpen, onClose }: StorySaveDialogProps) {
  const { state, dispatch, actions } = useTalentBuilder();
  const { savedStoryModes } = useSaveLoad();
  const saveStoryToDatabase = useMutation(api.storyTrees.saveStoryTree);

  // Get the most recent save name for this chapter
  const { recentSave, currentSaveName } = useMemo(() => {
    const recent = savedStoryModes
      .filter((s: SavedStoryMode) => s.chapter === state.storyChapter)
      .sort((a, b) => savedStoryModes.indexOf(b) - savedStoryModes.indexOf(a))[0];
    return {
      recentSave: recent,
      currentSaveName: recent?.name || `Chapter ${state.storyChapter} Layout`
    };
  }, [savedStoryModes, state.storyChapter]);

  if (!isOpen) return null;

  const handleUpdate = async () => {
    try {
      // Update existing save locally
      const saved = savedStoryModes.filter((s: SavedStoryMode) => s.name !== currentSaveName);
      saved.push({
        name: currentSaveName,
        chapter: state.storyChapter,
        data: { nodes: state.nodes, connections: state.connections }
      });
      dispatch({ type: 'SET_SAVED_STORY_MODES', payload: saved });
      localStorage.setItem('savedStoryModes', JSON.stringify(saved));

      // Save to database
      try {
        const dbNodes = state.nodes.map(node => ({
          id: node.id,
          x: node.x,
          y: node.y,
          label: node.name || 'Node',
          index: node.tier,
          storyNodeType: node.storyNodeType || 'normal',
          challenger: node.challenger,
          completed: false,
          available: false,
          current: false
        }));

        await saveStoryToDatabase({
          name: currentSaveName,
          chapter: state.storyChapter,
          nodes: dbNodes,
          connections: state.connections
        });
        actions.setSaveStatus(`Updated "${currentSaveName}"`, 3000);
      } catch (dbError) {
        console.error('Database save error:', dbError);
        actions.setSaveStatus(`Updated locally (cloud backup failed)`, 3000);
      }

      onClose();
    } catch (e) {
      console.error('Failed to save:', e);
      actions.setSaveStatus('Save failed', 3000);
    }
  };

  const handleMakeNewSave = async () => {
    try {
      // Create new save with timestamp
      const timestamp = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const newName = `Chapter ${state.storyChapter} - ${timestamp}`;

      const saved = [...savedStoryModes];
      saved.push({
        name: newName,
        chapter: state.storyChapter,
        data: { nodes: state.nodes, connections: state.connections }
      });
      dispatch({ type: 'SET_SAVED_STORY_MODES', payload: saved });
      localStorage.setItem('savedStoryModes', JSON.stringify(saved));

      // Save to database
      try {
        const dbNodes = state.nodes.map(node => ({
          id: node.id,
          x: node.x,
          y: node.y,
          label: node.name || 'Node',
          index: node.tier,
          storyNodeType: node.storyNodeType || 'normal',
          challenger: node.challenger,
          completed: false,
          available: false,
          current: false
        }));

        await saveStoryToDatabase({
          name: newName,
          chapter: state.storyChapter,
          nodes: dbNodes,
          connections: state.connections
        });
        actions.setSaveStatus(`Saved as "${newName}"`, 3000);
      } catch (dbError) {
        console.error('Database save error:', dbError);
        actions.setSaveStatus(`Saved locally (cloud backup failed)`, 3000);
      }

      onClose();
    } catch (e) {
      console.error('Failed to save:', e);
      actions.setSaveStatus('Save failed', 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-yellow-400/30">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">
          Save Story Mode - Chapter {state.storyChapter}
        </h2>

        <div className="space-y-4">
          {recentSave && (
            <div className="p-3 bg-gray-800 rounded">
              <p className="text-sm text-gray-400">
                Current save: <span className="text-white">{currentSaveName}</span>
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            {recentSave && (
              <button
                onClick={handleUpdate}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
              >
                Update
              </button>
            )}
            <button
              onClick={handleMakeNewSave}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
            >
              Make New Save
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
