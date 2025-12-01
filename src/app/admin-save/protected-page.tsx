"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Protection constants
const PROTECTION_CONFIG = {
  DELETE_CONFIRMATIONS: 2,
  DELETE_CONFIRMATION_TEXT: "DELETE",
  RESTORE_CONFIRMATIONS: 2,
  AUTO_BACKUP_BEFORE_RESTORE: true,
  PREVENT_MASS_DELETE: true,
  MAX_DELETES_PER_SESSION: 3,
  COOLDOWN_BETWEEN_DELETES: 5000, // 5 seconds
  REQUIRE_PASSWORD_FOR_DELETE: false, // Set to true to enable password protection
  DELETE_PASSWORD: "protect-my-saves-2024", // Change this password
};

// Backup tracker
let deleteCount = 0;
let lastDeleteTime = 0;
let sessionStartTime = Date.now();

export default function ProtectedAdminSavePage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedSaveId, setSelectedSaveId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info' | 'warning', text: string } | null>(null);
  const [isProtectionEnabled, setIsProtectionEnabled] = useState(true);
  const [backupBeforeRestore, setBackupBeforeRestore] = useState(PROTECTION_CONFIG.AUTO_BACKUP_BEFORE_RESTORE);
  
  // Protection states
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    saveId: Id<"saves">;
    saveName: string;
    step: number;
    inputText: string;
  } | null>(null);

  // Convex queries and mutations
  const saves = useQuery(api.saves.listSaves);
  const createSave = useMutation(api.saves.createSave);
  const deleteSave = useMutation(api.saves.deleteSave);

  // Reset delete count every hour
  useEffect(() => {
    const resetInterval = setInterval(() => {
      if (Date.now() - sessionStartTime > 3600000) { // 1 hour
        deleteCount = 0;
        sessionStartTime = Date.now();
      }
    }, 60000); // Check every minute

    return () => clearInterval(resetInterval);
  }, []);

  // Handle creating a new save (PROTECTED - No changes to save creation)
  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: 'info', text: 'Creating save backup...' });

    try {
      // Generate automatic save name with timestamp
      const now = new Date();
      const saveName = `Save_${now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}_${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '')}`.replace(/[,\s]/g, '_');
      
      // Create backup metadata
      const backupMetadata = {
        createdAt: now.toISOString(),
        protected: true,
        version: "1.0.0",
        autoBackup: false,
      };

      // Use fetch to call our API endpoint
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName,
          description: `Automatic save on ${now.toLocaleString()}`,
          metadata: backupMetadata,
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

        setMessage({ type: 'success', text: `✅ Save created successfully! ${result.filesCount} files backed up.` });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error creating save: ' + (error instanceof Error ? error.message : 'Unknown error') });
    } finally {
      setIsSaving(false);
    }
  };

  // Create automatic backup before restore
  const createAutoBackup = async (): Promise<boolean> => {
    try {
      const now = new Date();
      const backupName = `AutoBackup_PreRestore_${now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}_${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '')}`.replace(/[,\s]/g, '_');
      
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: backupName,
          description: `Automatic backup before restore - ${now.toLocaleString()}`,
          metadata: { autoBackup: true, protected: true },
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await createSave({
          name: backupName,
          description: `Automatic backup before restore - ${now.toLocaleString()}`,
          filesCount: result.filesCount,
          sizeInBytes: result.sizeInBytes,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Handle restoring from a save (PROTECTED)
  const handleRestore = async (saveId: string, saveName: string) => {
    // First confirmation
    const firstConfirm = confirm(
      `⚠️ RESTORE WARNING - STEP 1 of ${PROTECTION_CONFIG.RESTORE_CONFIRMATIONS}\n\n` +
      `You are about to restore from save "${saveName}".\n\n` +
      `This will OVERWRITE your current code files.\n\n` +
      `Are you ABSOLUTELY sure you want to proceed?`
    );
    
    if (!firstConfirm) return;

    // Second confirmation if enabled
    if (PROTECTION_CONFIG.RESTORE_CONFIRMATIONS >= 2) {
      const secondConfirm = confirm(
        `⚠️ FINAL RESTORE WARNING - STEP 2 of ${PROTECTION_CONFIG.RESTORE_CONFIRMATIONS}\n\n` +
        `This is your LAST CHANCE to cancel.\n\n` +
        `Restoring "${saveName}" will PERMANENTLY OVERWRITE current files.\n\n` +
        `${backupBeforeRestore ? '✅ An automatic backup will be created first.' : '❌ NO automatic backup will be created.'}\n\n` +
        `Confirm to proceed with restore?`
      );
      
      if (!secondConfirm) return;
    }

    setIsRestoring(true);
    setSelectedSaveId(saveId);

    // Create automatic backup if enabled
    if (backupBeforeRestore) {
      setMessage({ type: 'info', text: '🔄 Creating automatic backup before restore...' });
      const backupSuccess = await createAutoBackup();
      
      if (!backupSuccess) {
        const continueWithoutBackup = confirm(
          "⚠️ Failed to create automatic backup!\n\n" +
          "Do you want to continue with restore WITHOUT a backup?\n\n" +
          "This is RISKY - your current files will be lost if something goes wrong."
        );
        
        if (!continueWithoutBackup) {
          setIsRestoring(false);
          setSelectedSaveId(null);
          setMessage({ type: 'warning', text: '⚠️ Restore cancelled - backup creation failed' });
          return;
        }
      } else {
        setMessage({ type: 'success', text: '✅ Automatic backup created successfully!' });
        await new Promise(resolve => setTimeout(resolve, 1500)); // Brief pause to show message
      }
    }

    setMessage({ type: 'info', text: '🔄 Restoring from backup...' });

    try {
      const response = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saveName }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: `✅ Successfully restored ${result.filesRestored} files from backup!` });
        // Reload page after 3 seconds to show restored code
        setTimeout(() => window.location.reload(), 3000);
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

  // Handle deleting a save (HEAVILY PROTECTED)
  const initiateDelete = (saveId: Id<"saves">, saveName: string) => {
    if (!isProtectionEnabled) {
      // Bypass protection if disabled (NOT RECOMMENDED)
      performDelete(saveId, saveName);
      return;
    }

    // Check delete limits
    if (PROTECTION_CONFIG.PREVENT_MASS_DELETE) {
      if (deleteCount >= PROTECTION_CONFIG.MAX_DELETES_PER_SESSION) {
        setMessage({ 
          type: 'error', 
          text: `⛔ Delete limit reached! Maximum ${PROTECTION_CONFIG.MAX_DELETES_PER_SESSION} deletes per session. Please refresh the page to reset.` 
        });
        return;
      }

      const timeSinceLastDelete = Date.now() - lastDeleteTime;
      if (timeSinceLastDelete < PROTECTION_CONFIG.COOLDOWN_BETWEEN_DELETES) {
        const remainingTime = Math.ceil((PROTECTION_CONFIG.COOLDOWN_BETWEEN_DELETES - timeSinceLastDelete) / 1000);
        setMessage({ 
          type: 'warning', 
          text: `⏳ Please wait ${remainingTime} seconds before deleting another save.` 
        });
        return;
      }
    }

    // Start delete confirmation process
    setDeleteConfirmation({
      saveId,
      saveName,
      step: 1,
      inputText: '',
    });
  };

  // Continue delete confirmation process
  const continueDeleteConfirmation = () => {
    if (!deleteConfirmation) return;

    if (deleteConfirmation.step === 1) {
      // Move to step 2 - require typing confirmation
      setDeleteConfirmation({
        ...deleteConfirmation,
        step: 2,
      });
    } else if (deleteConfirmation.step === 2) {
      // Check if user typed the correct confirmation text
      if (deleteConfirmation.inputText !== PROTECTION_CONFIG.DELETE_CONFIRMATION_TEXT) {
        setMessage({ 
          type: 'error', 
          text: `❌ Incorrect confirmation text. Please type "${PROTECTION_CONFIG.DELETE_CONFIRMATION_TEXT}" exactly.` 
        });
        return;
      }

      // Final confirmation
      const finalConfirm = confirm(
        `🗑️ FINAL DELETE CONFIRMATION\n\n` +
        `You are about to PERMANENTLY DELETE:\n"${deleteConfirmation.saveName}"\n\n` +
        `This action CANNOT be undone!\n\n` +
        `Are you ABSOLUTELY CERTAIN?`
      );

      if (finalConfirm) {
        performDelete(deleteConfirmation.saveId, deleteConfirmation.saveName);
      }
      
      setDeleteConfirmation(null);
    }
  };

  // Actually perform the delete
  const performDelete = async (saveId: Id<"saves">, saveName: string) => {
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
        
        // Update delete tracking
        deleteCount++;
        lastDeleteTime = Date.now();
        
        setMessage({ type: 'success', text: `✅ Save "${saveName}" deleted successfully` });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting save: ' + (error instanceof Error ? error.message : 'Unknown error') });
    }
  };

  // Auto-hide messages after 7 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Protection Status */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-yellow-400">Protected Save System</h1>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={backupBeforeRestore}
                  onChange={(e) => setBackupBeforeRestore(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Auto-backup before restore</span>
              </label>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                isProtectionEnabled ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'
              }`}>
                {isProtectionEnabled ? '🛡️ PROTECTED' : '⚠️ UNPROTECTED'}
              </div>
            </div>
          </div>
          <p className="text-gray-400">Enhanced protection against accidental save deletion</p>
        </div>

        {/* Protection Info Banner */}
        <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🛡️</span>
            <div className="text-sm">
              <p className="text-green-400 font-bold mb-1">Protection Features Active:</p>
              <ul className="text-gray-400 space-y-1">
                <li>• {PROTECTION_CONFIG.DELETE_CONFIRMATIONS}x confirmation for deletes</li>
                <li>• Must type "{PROTECTION_CONFIG.DELETE_CONFIRMATION_TEXT}" to confirm deletion</li>
                <li>• Maximum {PROTECTION_CONFIG.MAX_DELETES_PER_SESSION} deletes per session</li>
                <li>• {PROTECTION_CONFIG.COOLDOWN_BETWEEN_DELETES / 1000}s cooldown between deletes</li>
                <li>• {backupBeforeRestore ? '✅' : '❌'} Auto-backup before restore</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' ? 'bg-green-900/20 border-green-500 text-green-400' :
            message.type === 'error' ? 'bg-red-900/20 border-red-500 text-red-400' :
            message.type === 'warning' ? 'bg-yellow-900/20 border-yellow-500 text-yellow-400' :
            'bg-blue-900/20 border-blue-500 text-blue-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirmation && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
            <div className="bg-gray-900 border-2 border-red-500 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-2xl font-bold text-red-400 mb-4">
                ⚠️ Delete Confirmation - Step {deleteConfirmation.step} of 2
              </h3>
              
              {deleteConfirmation.step === 1 ? (
                <>
                  <p className="text-gray-300 mb-4">
                    You are about to delete the save:
                  </p>
                  <p className="text-yellow-400 font-bold text-lg mb-4">
                    "{deleteConfirmation.saveName}"
                  </p>
                  <p className="text-red-300 mb-6">
                    This action cannot be undone. The save file will be permanently deleted.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirmation(null)}
                      className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={continueDeleteConfirmation}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Continue Delete
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-300 mb-4">
                    To confirm deletion of:
                  </p>
                  <p className="text-yellow-400 font-bold text-lg mb-4">
                    "{deleteConfirmation.saveName}"
                  </p>
                  <p className="text-gray-300 mb-2">
                    Please type <span className="text-red-400 font-bold">{PROTECTION_CONFIG.DELETE_CONFIRMATION_TEXT}</span> below:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmation.inputText}
                    onChange={(e) => setDeleteConfirmation({
                      ...deleteConfirmation,
                      inputText: e.target.value,
                    })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4"
                    placeholder={`Type ${PROTECTION_CONFIG.DELETE_CONFIRMATION_TEXT} here`}
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirmation(null)}
                      className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={continueDeleteConfirmation}
                      disabled={deleteConfirmation.inputText !== PROTECTION_CONFIG.DELETE_CONFIRMATION_TEXT}
                      className={`flex-1 px-4 py-2 rounded-lg ${
                        deleteConfirmation.inputText === PROTECTION_CONFIG.DELETE_CONFIRMATION_TEXT
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Confirm Delete
                    </button>
                  </div>
                </>
              )}
            </div>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-yellow-400">Previous Saves</h2>
            {saves && saves.length > 0 && (
              <div className="text-sm text-gray-500">
                {saves.length} saves • Deletes this session: {deleteCount}/{PROTECTION_CONFIG.MAX_DELETES_PER_SESSION}
              </div>
            )}
          </div>
          
          {!saves ? (
            <div className="text-center py-8 text-gray-500">Loading saves...</div>
          ) : saves.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📁</div>
              <div>No saves yet. Create your first backup above!</div>
            </div>
          ) : (
            <div className="space-y-3">
              {saves.map((save) => {
                const isAutoBackup = save.name.startsWith('AutoBackup_');
                
                return (
                  <div
                    key={save._id}
                    className={`bg-gray-800/50 border rounded-lg p-4 hover:border-yellow-500/50 transition-all ${
                      isAutoBackup ? 'border-green-500/30' : 'border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white">{save.name}</h3>
                          {isAutoBackup && (
                            <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded border border-green-500/30">
                              AUTO-BACKUP
                            </span>
                          )}
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
                          onClick={() => initiateDelete(save._id, save.name)}
                          disabled={isRestoring}
                          className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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