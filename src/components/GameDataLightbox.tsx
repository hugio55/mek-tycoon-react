'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface GameConstant {
  category: string;
  setting: string;
  value: string | number;
  description: string;
  configurable: boolean;
}

interface GameDataLightboxProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GameDataLightbox({ isOpen, onClose }: GameDataLightboxProps) {
  const getConstants = useMutation(api.gameConstants.loadAll);
  const saveConstants = useMutation(api.gameConstants.saveAll);

  const [constants, setConstants] = useState<GameConstant[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string | number>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [lastLoadSize, setLastLoadSize] = useState<number | null>(null);
  const [lastPushSize, setLastPushSize] = useState<number | null>(null);

  // Warn about unsaved changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [hasUnsavedChanges]);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(constants[index].value);
  };

  const handleSaveEdit = (index: number) => {
    const newConstants = [...constants];

    // Convert value to appropriate type
    let finalValue: string | number = editValue;
    if (typeof newConstants[index].value === 'number' && typeof editValue === 'string') {
      const parsed = parseFloat(editValue);
      if (!isNaN(parsed)) {
        finalValue = parsed;
      }
    }

    newConstants[index].value = finalValue;
    setConstants(newConstants);
    setEditingIndex(null);
    setHasUnsavedChanges(true);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleDelete = (index: number) => {
    const confirmed = window.confirm(`Delete "${constants[index].setting}"?`);
    if (confirmed) {
      const newConstants = constants.filter((_, i) => i !== index);
      setConstants(newConstants);
      setHasUnsavedChanges(true);
    }
  };

  const handleToggleConfigurable = (index: number) => {
    const newConstants = [...constants];
    newConstants[index].configurable = !newConstants[index].configurable;
    setConstants(newConstants);
    setHasUnsavedChanges(true);
  };

  const handleLoadFromDatabase = async () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Loading will overwrite them. Continue?');
      if (!confirmed) return;
    }

    setIsLoading(true);
    try {
      const data = await getConstants();
      setConstants(data);
      setHasLoadedOnce(true);
      setHasUnsavedChanges(false);

      // Calculate bandwidth used
      const dataSize = new TextEncoder().encode(JSON.stringify(data)).length;
      setLastLoadSize(dataSize);
      console.log(`📊 Load bandwidth: ${(dataSize / 1024).toFixed(2)} KB`);

      alert(`Data loaded successfully! (${(dataSize / 1024).toFixed(2)} KB)`);
    } catch (error) {
      console.error('Failed to load:', error);
      alert('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushToDatabase = async () => {
    setIsSaving(true);
    try {
      // Calculate bandwidth for push
      const dataSize = new TextEncoder().encode(JSON.stringify(constants)).length;
      setLastPushSize(dataSize);
      console.log(`📊 Push bandwidth: ${(dataSize / 1024).toFixed(2)} KB`);

      await saveConstants({ constants });
      setHasUnsavedChanges(false);
      alert(`Settings pushed successfully! (${(dataSize / 1024).toFixed(2)} KB)`);
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to push settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }
    onClose();
  };

  let currentCategory = '';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative max-w-6xl w-full max-h-[90vh] overflow-hidden bg-black border-2 border-yellow-500/50 rounded-lg">
        {/* Header */}
        <div className="sticky top-0 bg-black border-b-2 border-yellow-500/50 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-yellow-500 font-orbitron uppercase">
              Global Game Data
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Global constants and configuration values that apply to all players
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-yellow-500 hover:text-yellow-400 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          {constants.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No data loaded. Click "Load from DB" below to fetch current settings.</p>
            </div>
          )}

          {(hasLoadedOnce || constants.length > 0) && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b-2 border-yellow-500/50 sticky top-0 bg-black">
                <tr>
                  <th className="py-2 px-3 text-yellow-500 font-orbitron uppercase w-[20%]">Setting</th>
                  <th className="py-2 px-3 text-yellow-500 font-orbitron uppercase w-[15%]">Value</th>
                  <th className="py-2 px-3 text-yellow-500 font-orbitron uppercase w-[45%]">Description</th>
                  <th className="py-2 px-3 text-yellow-500 font-orbitron uppercase w-[10%]">Config</th>
                  <th className="py-2 px-3 text-yellow-500 font-orbitron uppercase w-[10%]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {constants.map((constant, index) => {
                  const isNewCategory = constant.category !== currentCategory;
                  if (isNewCategory) {
                    currentCategory = constant.category;
                  }

                  return (
                    <React.Fragment key={`constant-${index}`}>
                      {isNewCategory && (
                        <tr className="border-t-2 border-yellow-500/30">
                          <td colSpan={5} className="py-2 px-3 text-yellow-500 font-bold uppercase bg-yellow-500/5">
                            {constant.category}
                          </td>
                        </tr>
                      )}
                      <tr className="border-b border-gray-900 hover:bg-yellow-500/5 transition-colors">
                        <td className="py-2 px-3 font-medium">{constant.setting}</td>
                        <td className="py-2 px-3">
                          {editingIndex === index ? (
                            <div className="flex gap-1">
                              <input
                                type={typeof constant.value === 'number' ? 'number' : 'text'}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="px-2 py-1 bg-gray-800 border border-yellow-500/50 rounded text-blue-400 text-xs w-24"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit(index);
                                  if (e.key === 'Escape') handleCancelEdit();
                                }}
                              />
                              <button
                                onClick={() => handleSaveEdit(index)}
                                className="text-green-400 hover:text-green-300 text-xs"
                              >
                                ✓
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-red-400 hover:text-red-300 text-xs"
                              >
                                ✗
                              </button>
                            </div>
                          ) : (
                            <span
                              className="text-blue-400 font-mono font-bold cursor-pointer hover:text-blue-300"
                              onClick={() => handleEdit(index)}
                            >
                              {typeof constant.value === 'number' ? constant.value.toLocaleString() : constant.value}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-gray-400">{constant.description}</td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() => handleToggleConfigurable(index)}
                            className={`${
                              constant.configurable ? 'text-green-400' : 'text-gray-500'
                            } hover:opacity-80 cursor-pointer`}
                          >
                            {constant.configurable ? '✓ Yes' : '— No'}
                          </button>
                        </td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() => handleDelete(index)}
                            className="text-red-400 hover:text-red-300"
                            title="Delete row"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}

          {(hasLoadedOnce || constants.length > 0) && (
          <div className="mt-6 pt-4 border-t border-yellow-500/20">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-yellow-500/80 mb-2">Configuration Notes</h3>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Click any value to edit it inline</li>
                  <li>• Click the checkmark to toggle configurability</li>
                  <li>• Use the trash icon to delete unwanted rows</li>
                  <li>• Remember to save your changes before closing</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold text-yellow-500/80 mb-2">Important Limits</h3>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• <span className="text-yellow-500/60">Stack Size:</span> Max 99 items per inventory slot</li>
                  <li>• <span className="text-yellow-500/60">Inventory:</span> 5 tabs × 20 slots = 100 total slots</li>
                  <li>• <span className="text-yellow-500/60">Contracts:</span> No limit on Meks per contract</li>
                  <li>• <span className="text-yellow-500/60">Market:</span> No limit on market slots</li>
                </ul>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Footer with Load and Push Buttons */}
        <div className="sticky bottom-0 bg-black border-t-2 border-yellow-500/50 p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLoadFromDatabase}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                !isLoading
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Loading...' : '⬇ Load from DB'}
            </button>
            <div className="text-sm space-y-1">
              {hasUnsavedChanges && (
                <div className="text-yellow-400">⚠️ You have unsaved changes</div>
              )}
              {!hasLoadedOnce && constants.length === 0 && (
                <div className="text-gray-500">Load data to begin editing</div>
              )}
              {(lastLoadSize || lastPushSize) && (
                <div className="text-xs text-gray-500">
                  📊 Bandwidth:
                  {lastLoadSize && ` Load: ${(lastLoadSize / 1024).toFixed(1)}KB`}
                  {lastPushSize && ` | Push: ${(lastPushSize / 1024).toFixed(1)}KB`}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-semibold transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePushToDatabase}
              disabled={!hasUnsavedChanges || isSaving || constants.length === 0}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                hasUnsavedChanges && !isSaving && constants.length > 0
                  ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSaving ? 'Pushing...' : '⬆ Push to DB'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}