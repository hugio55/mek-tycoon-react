"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export default function AdminSavePage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedSaveId, setSelectedSaveId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // Convex queries and mutations
  const saves = useQuery(api.saves.listSaves);
  const createSave = useMutation(api.saves.createSave);
  const deleteSave = useMutation(api.saves.deleteSave);

  // Handle creating a new save
  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: 'info', text: 'Creating save backup...' });

    try {
      // Generate automatic save name with timestamp
      const now = new Date();
      const saveName = `Save_${now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}_${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '')}`.replace(/[,\s]/g, '_');
      
      // Use fetch to call our API endpoint
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName,
          description: `Automatic save on ${now.toLocaleString()}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Record in database
        await createSave({
          name: saveName,
          description: `Automatic save on ${now.toLocaleString()}`,
          filesCount: result.filesCount,
          sizeInBytes: result.sizeInBytes,
        });

        setMessage({ type: 'success', text: `Save created successfully! ${result.filesCount} files backed up.` });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error creating save: ' + (error instanceof Error ? error.message : 'Unknown error') });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle restoring from a save
  const handleRestore = async (saveId: string, saveName: string) => {
    if (!confirm(`Are you sure you want to restore from save "${saveName}"? This will overwrite current code files.`)) {
      return;
    }

    setIsRestoring(true);
    setSelectedSaveId(saveId);
    setMessage({ type: 'info', text: 'Restoring from backup...' });

    try {
      const response = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saveName }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: `Successfully restored ${result.filesRestored} files from backup!` });
        // Reload page after 2 seconds to show restored code
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to restore from save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error restoring save: ' + (error instanceof Error ? error.message : 'Unknown error') });
    } finally {
      setIsRestoring(false);
      setSelectedSaveId(null);
    }
  };

  // Handle deleting a save
  const handleDelete = async (saveId: Id<"saves">, saveName: string) => {
    if (!confirm(`Are you sure you want to delete save "${saveName}"?`)) {
      return;
    }

    try {
      // Delete from filesystem
      const response = await fetch('/api/delete-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saveName }),
      });

      const result = await response.json();

      if (result.success) {
        // Delete from database
        await deleteSave({ saveId });
        setMessage({ type: 'success', text: 'Save deleted successfully' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting save: ' + (error instanceof Error ? error.message : 'Unknown error') });
    }
  };

  // Auto-hide messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">Code Save System</h1>
          <p className="text-gray-400">Create backups of your entire codebase and restore from previous saves</p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' ? 'bg-green-900/20 border-green-500 text-green-400' :
            message.type === 'error' ? 'bg-red-900/20 border-red-500 text-red-400' :
            'bg-blue-900/20 border-blue-500 text-blue-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Create Save Section */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">Quick Save</h2>
              <p className="text-sm text-gray-400">Creates an instant backup of all code files</p>
            </div>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                isSaving
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-600 hover:to-yellow-700 shadow-lg hover:shadow-yellow-500/30 hover:scale-105'
              }`}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⚙️</span>
                  Creating Save...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  💾 <span>SAVE NOW</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Existing Saves Section */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">Previous Saves</h2>
          
          {!saves ? (
            <div className="text-center py-8 text-gray-500">Loading saves...</div>
          ) : saves.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📁</div>
              <div>No saves yet. Create your first backup above!</div>
            </div>
          ) : (
            <div className="space-y-3">
              {saves.map((save) => (
                <div
                  key={save._id}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-yellow-500/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{save.name}</h3>
                        <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded">
                          {save.filesCount} files
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded">
                          {save.formattedSize}
                        </span>
                      </div>
                      
                      {save.description && (
                        <p className="text-sm text-gray-400 mb-2">{save.description}</p>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        Created: {save.formattedDate}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleRestore(save._id, save.name)}
                        disabled={isRestoring}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                          isRestoring && selectedSaveId === save._id
                            ? 'bg-blue-700 text-white animate-pulse'
                            : isRestoring
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isRestoring && selectedSaveId === save._id ? (
                          <span className="flex items-center gap-1">
                            <span className="animate-spin">⚙️</span>
                            Restoring...
                          </span>
                        ) : (
                          '📥 Restore'
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleDelete(save._id, save.name)}
                        disabled={isRestoring}
                        className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div className="text-sm text-gray-400">
              <p className="mb-2">This system saves the following directories:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li>src/ - All source code</li>
                <li>convex/ - Backend functions</li>
                <li>components/ - React components</li>
                <li>lib/ - Utility libraries</li>
                <li>Configuration files (package.json, tsconfig.json, etc.)</li>
              </ul>
              <p className="mt-2">Not included: node_modules, public images, .next build files</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}