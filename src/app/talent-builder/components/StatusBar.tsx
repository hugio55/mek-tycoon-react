'use client';

import React from 'react';
import { useTalentBuilder } from '../TalentBuilderContext';

interface StatusBarProps {
  lastAutoSave: Date | null;
  lastConvexBackup: Date | null;
  changeCounter: number;
  autosaveError: string | null;
  onDismissError: () => void;
}

export function StatusBar({
  lastAutoSave,
  lastConvexBackup,
  changeCounter,
  autosaveError,
  onDismissError
}: StatusBarProps) {
  const { state } = useTalentBuilder();

  const getModeHelpText = () => {
    switch (state.mode) {
      case 'connect':
        return state.connectFrom
          ? <span className="ml-2 text-green-400">Click target node</span>
          : null;
      case 'add':
        return <span className="ml-2 text-green-400">Click to place node</span>;
      case 'addLabel':
        return <span className="ml-2 text-purple-400">Click to place label</span>;
      case 'select':
        return <span className="ml-2 text-blue-400">Box select | Hold Shift to add to selection</span>;
      case 'lasso':
        return <span className="ml-2 text-cyan-400">Draw to select nodes</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 border-t border-gray-800 px-4 py-2 flex items-center justify-between">
      {/* Left - Mode Status */}
      <div className="flex items-center gap-4">
        <div className="text-yellow-400 text-sm font-medium">
          Mode:{' '}
          <span className="text-white">
            {state.mode.charAt(0).toUpperCase() + state.mode.slice(1)}
          </span>
          {getModeHelpText()}
          {state.selectedNodes.size > 1 && (
            <span className="ml-2 text-gray-400 text-xs">
              | {state.selectedNodes.size} nodes selected - drag rotation handle to rotate
            </span>
          )}
        </div>

        {/* Save Status */}
        {state.saveStatus && (
          <div className="px-3 py-1 bg-green-600 text-white rounded text-sm animate-pulse">
            {state.saveStatus}
          </div>
        )}
      </div>

      {/* Right - Autosave Indicators */}
      <div className="flex items-center gap-3">
        {/* Node Count */}
        <div className="px-3 py-1 bg-gray-800/50 border border-gray-700 text-gray-300 rounded text-xs">
          {state.nodes.length} nodes | {state.connections.length} connections
        </div>

        {/* Autosave Status */}
        {lastAutoSave && (
          <div className="px-3 py-1 bg-blue-900/50 border border-blue-500/30 text-blue-200 rounded text-xs">
            Autosaved {Math.floor((Date.now() - lastAutoSave.getTime()) / 1000)}s ago
            {changeCounter > 0 && (
              <span className="ml-2 text-blue-400">({changeCounter}/10 changes)</span>
            )}
          </div>
        )}

        {/* Convex Backup Status */}
        {lastConvexBackup && (
          <div className="px-3 py-1 bg-purple-900/50 border border-purple-500/30 text-purple-200 rounded text-xs">
            Backed up {Math.floor((Date.now() - lastConvexBackup.getTime()) / 60000)}m ago
          </div>
        )}

        {/* Autosave Error */}
        {autosaveError && (
          <div className="px-3 py-1 bg-red-900/80 border border-red-500/50 text-red-200 rounded text-xs flex items-center gap-2">
            <span>{autosaveError}</span>
            <button
              onClick={onDismissError}
              className="text-red-400 hover:text-red-200 font-bold"
            >
              x
            </button>
          </div>
        )}

        {/* Zoom Level */}
        <div className="px-3 py-1 bg-gray-800/50 border border-gray-700 text-yellow-400 rounded text-xs font-mono">
          {Math.round(state.zoom * 100)}%
        </div>
      </div>
    </div>
  );
}
