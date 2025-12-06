'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface GitStatus {
  currentBranch: string;
  hasUncommittedChanges: boolean;
  uncommittedChanges: number;
  changedFiles: { status: string; file: string }[];
  commitsAhead: number;
  commitsBehind: number;
  recentCommits: { hash: string; message: string; timeAgo: string }[];
  lastCommit: { hash: string; message: string; date: string };
}

interface ActionLog {
  id: string;
  action: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  timestamp: Date;
}

interface Backup {
  id: string;
  type: 'quick' | 'full';
  timestamp: string;
  commitHash: string;
  commitMessage: string;
  branch: string;
  notes?: string;
  convexExportPath?: string;
  exportSizeBytes?: number;
}

// Format date to 12-hour time
function formatCommitDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dateString;
  }
}

export default function DeploymentsAdmin() {
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isDeployingDev, setIsDeployingDev] = useState(false);
  const [isDeployingProd, setIsDeployingProd] = useState(false);
  const [isFullDeploy, setIsFullDeploy] = useState(false);
  const [showProdConfirm, setShowProdConfirm] = useState(false);
  const [prodConfirmStep, setProdConfirmStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [sessionBackup, setSessionBackup] = useState<Backup | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupType, setBackupType] = useState<'quick' | 'full' | null>(null);
  const [selectedRollbackBackup, setSelectedRollbackBackup] = useState<Backup | null>(null);
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [deployStep, setDeployStep] = useState<number>(0); // Track which step we're on (1-7)
  const [willDoFullDeploy, setWillDoFullDeploy] = useState(false); // Intent to do full deploy (before confirmation)
  const [logCounter, setLogCounter] = useState(0); // Counter for unique log IDs
  const [deployError, setDeployError] = useState<string | null>(null); // Error message if deploy fails
  const [isSyncingR2, setIsSyncingR2] = useState(false); // R2 sync state

  useEffect(() => {
    setMounted(true);
  }, []);

  const addLog = (action: string, status: 'success' | 'error' | 'pending', message: string) => {
    setLogCounter(prev => prev + 1);
    setActionLogs(prev => [{
      id: `${Date.now()}-${logCounter}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      status,
      message,
      timestamp: new Date()
    }, ...prev].slice(0, 20)); // Keep last 20 logs
  };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/deployment/status');
      const data = await res.json();
      if (data.success) {
        setGitStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBackups = useCallback(async () => {
    try {
      const res = await fetch('/api/deployment/list-backups');
      const data = await res.json();
      if (data.success) {
        setBackups(data.backups);
      }
    } catch (error) {
      console.error('Failed to fetch backups:', error);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchBackups();
    const interval = setInterval(fetchStatus, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [fetchStatus, fetchBackups]);

  const handleQuickBackup = async () => {
    setIsBackingUp(true);
    setBackupType('quick');
    addLog('Quick Backup', 'pending', 'Creating code-only backup...');

    try {
      const res = await fetch('/api/deployment/backup-quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: '' })
      });
      const data = await res.json();

      if (data.success) {
        addLog('Quick Backup', 'success', data.message);
        setSessionBackup({
          id: data.backupId,
          type: 'quick',
          timestamp: data.timestamp,
          commitHash: data.commitHash,
          commitMessage: data.commitMessage,
          branch: 'master'
        });
        await fetchBackups();
      } else {
        addLog('Quick Backup', 'error', data.error);
      }
    } catch (error) {
      addLog('Quick Backup', 'error', 'Failed to create backup');
    } finally {
      setIsBackingUp(false);
      setBackupType(null);
    }
  };

  const handleFullBackup = async () => {
    setIsBackingUp(true);
    setBackupType('full');
    addLog('Full Backup', 'pending', 'Creating code + database backup (this may take a minute)...');

    try {
      const res = await fetch('/api/deployment/backup-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: '' })
      });
      const data = await res.json();

      if (data.success) {
        addLog('Full Backup', 'success', data.message);
        setSessionBackup({
          id: data.backupId,
          type: 'full',
          timestamp: data.timestamp,
          commitHash: data.commitHash,
          commitMessage: data.commitMessage,
          branch: 'master',
          convexExportPath: data.exportPath,
          exportSizeBytes: data.sizeBytes
        });
        await fetchBackups();
      } else {
        addLog('Full Backup', 'error', data.error);
      }
    } catch (error) {
      addLog('Full Backup', 'error', 'Failed to create backup');
    } finally {
      setIsBackingUp(false);
      setBackupType(null);
    }
  };

  const handleRollback = async () => {
    if (!selectedRollbackBackup) return;

    setIsRollingBack(true);
    addLog('Rollback', 'pending', `Rolling back to ${selectedRollbackBackup.type} backup from ${new Date(selectedRollbackBackup.timestamp).toLocaleString()}...`);

    try {
      const res = await fetch('/api/deployment/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId: selectedRollbackBackup.id })
      });
      const data = await res.json();

      if (data.success) {
        addLog('Rollback', 'success', data.message);
        if (data.steps && Array.isArray(data.steps)) {
          data.steps.forEach((step: string) => {
            addLog('Rollback', 'success', step);
          });
        }
        await fetchStatus();
      } else {
        addLog('Rollback', 'error', data.error);
        if (data.steps && Array.isArray(data.steps)) {
          data.steps.forEach((step: string) => {
            addLog('Rollback', 'success', step);
          });
        }
      }
    } catch (error) {
      addLog('Rollback', 'error', 'Failed to rollback');
    } finally {
      setIsRollingBack(false);
      setShowRollbackConfirm(false);
      setSelectedRollbackBackup(null);
    }
  };

  const handleDeleteBackup = async (backup: Backup, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the backup when clicking delete

    const confirmMsg = backup.type === 'full'
      ? `Delete this FULL backup (${backup.exportSizeBytes ? (backup.exportSizeBytes / (1024 * 1024)).toFixed(1) + ' MB' : 'unknown size'})?\n\nThis will permanently delete the backup and its database export.`
      : 'Delete this quick backup?';

    if (!confirm(confirmMsg)) return;

    addLog('Delete Backup', 'pending', `Deleting ${backup.type} backup ${backup.id}...`);

    try {
      const res = await fetch('/api/deployment/delete-backup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId: backup.id })
      });
      const data = await res.json();

      if (data.success) {
        addLog('Delete Backup', 'success', data.message);
        // Clear selection if this backup was selected
        if (selectedRollbackBackup?.id === backup.id) {
          setSelectedRollbackBackup(null);
        }
        // Clear session backup if this was it
        if (sessionBackup?.id === backup.id) {
          setSessionBackup(null);
        }
        await fetchBackups();
      } else {
        addLog('Delete Backup', 'error', data.error);
      }
    } catch (error) {
      addLog('Delete Backup', 'error', 'Failed to delete backup');
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      addLog('Commit', 'error', 'Please enter a commit message');
      return;
    }

    setIsCommitting(true);
    addLog('Commit', 'pending', 'Creating commit...');

    try {
      const res = await fetch('/api/deployment/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMessage })
      });
      const data = await res.json();

      if (data.success) {
        addLog('Commit', 'success', data.message);
        setCommitMessage('');
        await fetchStatus();
      } else {
        addLog('Commit', 'error', data.error);
      }
    } catch (error) {
      addLog('Commit', 'error', 'Failed to create commit');
    } finally {
      setIsCommitting(false);
    }
  };

  const handlePush = async () => {
    setIsPushing(true);
    addLog('Push', 'pending', 'Pushing to GitHub...');

    try {
      const res = await fetch('/api/deployment/push', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        addLog('Push', 'success', data.message);
        await fetchStatus();
      } else {
        addLog('Push', 'error', data.error);
      }
    } catch (error) {
      addLog('Push', 'error', 'Failed to push to GitHub');
    } finally {
      setIsPushing(false);
    }
  };

  const handleDeployDev = async () => {
    setIsDeployingDev(true);
    addLog('Deploy Dev', 'pending', 'Deploying to Trout (dev)...');

    try {
      const res = await fetch('/api/deployment/deploy-dev', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        addLog('Deploy Dev', 'success', data.message);
      } else {
        addLog('Deploy Dev', 'error', data.error);
      }
    } catch (error) {
      addLog('Deploy Dev', 'error', 'Failed to deploy to dev');
    } finally {
      setIsDeployingDev(false);
    }
  };

  const handleDeployProd = async () => {
    setIsDeployingProd(true);
    addLog('Deploy Prod', 'pending', 'Deploying to Sturgeon (PRODUCTION)...');

    try {
      const res = await fetch('/api/deployment/deploy-prod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationToken: 'DEPLOY_TO_PRODUCTION' })
      });
      const data = await res.json();

      if (data.success) {
        addLog('Deploy Prod', 'success', data.message);
      } else {
        addLog('Deploy Prod', 'error', data.error);
      }
    } catch (error) {
      addLog('Deploy Prod', 'error', 'Failed to deploy to production');
    } finally {
      setIsDeployingProd(false);
      setShowProdConfirm(false);
      setProdConfirmStep(0);
    }
  };

  const handleFullDeploy = async () => {
    console.log('[🚀DEPLOY] Starting full deploy process (direct push method)...');
    setDeployError(null); // Clear any previous error
    setIsFullDeploy(true);
    setDeployStep(1);
    const currentBranch = gitStatus?.currentBranch || 'custom-minting-system';

    // Fetch fresh status to avoid stale data issues
    let freshHasChanges = gitStatus?.hasUncommittedChanges;
    try {
      const statusRes = await fetch('/api/deployment/status');
      const statusData = await statusRes.json();
      if (statusData.success) {
        freshHasChanges = statusData.data.hasUncommittedChanges;
        console.log('[🚀DEPLOY] Fresh status: hasUncommittedChanges =', freshHasChanges);
      }
    } catch (e) {
      console.log('[🚀DEPLOY] Could not fetch fresh status, using cached');
    }

    // Step 1: Commit (if there are changes)
    if (freshHasChanges) {
      // Use provided message or auto-generate one (like auto-save does)
      const finalCommitMessage = commitMessage.trim() || `Pre-deploy commit (${new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })})`;

      console.log('[🚀DEPLOY] Step 1: Committing changes...');
      addLog('Full Deploy', 'pending', 'Step 1/4: Committing changes...');
      try {
        const res = await fetch('/api/deployment/commit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: finalCommitMessage })
        });
        const data = await res.json();
        console.log('[🚀DEPLOY] Step 1 result:', data);
        if (!data.success) {
          // Check if it's just "no changes" - that's OK, continue deployment
          if (data.error?.includes('No changes') || data.error?.includes('nothing to commit')) {
            console.log('[🚀DEPLOY] Step 1: No actual changes to commit, continuing...');
            addLog('Full Deploy', 'success', 'Step 1/4: No changes to commit (skipped)');
          } else {
            addLog('Full Deploy', 'error', `Commit failed: ${data.error}`);
            setDeployError(`Step 1 failed: ${data.error}`);
            setIsFullDeploy(false);
            setDeployStep(0);
            return;
          }
        } else {
          addLog('Full Deploy', 'success', 'Committed successfully');
          setCommitMessage('');
        }
      } catch (error) {
        console.error('[🚀DEPLOY] Step 1 error:', error);
        addLog('Full Deploy', 'error', 'Commit step failed - server may be down');
        setDeployError('Step 1 failed: Could not connect to server. Is the dev server running?');
        setIsFullDeploy(false);
        setDeployStep(0);
        return;
      }
    } else {
      console.log('[🚀DEPLOY] Step 1: No changes to commit (skipped)');
      addLog('Full Deploy', 'success', 'Step 1/4: No changes to commit (skipped)');
    }

    // Step 2: Push current branch to GitHub (backup)
    setDeployStep(2);
    console.log('[🚀DEPLOY] Step 2: Pushing to GitHub...');
    addLog('Full Deploy', 'pending', `Step 2/4: Pushing ${currentBranch} to GitHub (backup)...`);
    try {
      const res = await fetch('/api/deployment/push', { method: 'POST' });
      const data = await res.json();
      console.log('[🚀DEPLOY] Step 2 result:', data);
      if (data.success) {
        addLog('Full Deploy', 'success', `${currentBranch} backed up to GitHub`);
      } else {
        addLog('Full Deploy', 'error', `Push warning: ${data.error} - continuing...`);
        // Continue anyway - backup is nice to have but not critical
      }
    } catch (error) {
      console.error('[🚀DEPLOY] Step 2 error:', error);
      addLog('Full Deploy', 'error', 'Push warning - server may be down, continuing...');
    }

    // Step 3: Push current branch directly to origin/master (triggers Vercel production)
    // This is the NEW approach - no branch switching, dev server stays running!
    setDeployStep(3);
    console.log('[🚀DEPLOY] Step 3: Push directly to origin/master...');
    addLog('Full Deploy', 'pending', `Step 3/4: Pushing ${currentBranch} to origin/master (Vercel production)...`);
    try {
      const res = await fetch('/api/deployment/merge-to-master', { method: 'POST' });
      const data = await res.json();
      console.log('[🚀DEPLOY] Step 3 result:', data);
      if (!data.success) {
        addLog('Full Deploy', 'error', `Push to master failed: ${data.error}`);
        setDeployError(`Step 3 failed: ${data.error}`);
        setIsFullDeploy(false);
        setDeployStep(0);
        return;
      }
      addLog('Full Deploy', 'success', data.alreadyUpToDate
        ? 'origin/master already up to date'
        : `Pushed ${currentBranch} to origin/master - Vercel PRODUCTION deploying!`);
    } catch (error) {
      console.error('[🚀DEPLOY] Step 3 error:', error);
      addLog('Full Deploy', 'error', 'Push to master failed - server may be down');
      setDeployError('Step 3 failed: Could not connect to server. Is the dev server running?');
      setIsFullDeploy(false);
      setDeployStep(0);
      return;
    }

    // Step 4: Deploy Convex to production
    setDeployStep(4);
    console.log('[🚀DEPLOY] Step 4: Deploy Convex to production...');
    addLog('Full Deploy', 'pending', 'Step 4/4: Deploying Convex to Sturgeon (PRODUCTION)...');
    try {
      const res = await fetch('/api/deployment/deploy-prod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationToken: 'DEPLOY_TO_PRODUCTION' })
      });
      const data = await res.json();
      console.log('[🚀DEPLOY] Step 4 result:', data);
      if (data.success) {
        addLog('Full Deploy', 'success', 'Convex deployed to Sturgeon (production)');
      } else {
        addLog('Full Deploy', 'error', `Convex deploy warning: ${data.error}`);
        // Not critical - Vercel deploy already triggered
      }
    } catch (error) {
      console.error('[🚀DEPLOY] Step 4 error:', error);
      addLog('Full Deploy', 'error', 'Convex deploy warning - server may be down');
    }

    console.log('[🚀DEPLOY] COMPLETE!');
    addLog('Full Deploy', 'success', 'PRODUCTION DEPLOYMENT COMPLETE!');
    await fetchStatus();
    setIsFullDeploy(false);
    setDeployStep(0);
    setShowProdConfirm(false);
    setProdConfirmStep(0);
  };

  const openProdConfirm = (fullDeploy: boolean) => {
    setWillDoFullDeploy(fullDeploy);
    setShowProdConfirm(true);
    setProdConfirmStep(1);
  };

  const confirmationModal = showProdConfirm && mounted && createPortal(
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]"
      onClick={() => {
        if (!isFullDeploy && !isDeployingProd) {
          setShowProdConfirm(false);
          setProdConfirmStep(0);
          setWillDoFullDeploy(false);
        }
      }}
    >
      <div
        className={`bg-gray-900 border-2 rounded-lg p-6 max-w-lg mx-4 ${
          deployError ? 'border-orange-500' : 'border-red-500'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Error State */}
        {deployError ? (
          <div className="text-center">
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-orange-400 mb-4">
              Deployment Failed
            </h2>
            <p className="text-gray-300 mb-4">
              {deployError}
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Check the Activity Log below for more details. You may need to restart the dev server.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setDeployError(null);
                  setShowProdConfirm(false);
                  setProdConfirmStep(0);
                  setWillDoFullDeploy(false);
                }}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setDeployError(null);
                  setProdConfirmStep(2);
                }}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg font-bold"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : isFullDeploy && deployStep > 0 ? (
          /* Deploying State - Show Step Indicator */
          <div className="text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-xl font-bold text-yellow-400 mb-4">
              Deploying to Production
            </h2>
            <div className="text-yellow-400 font-bold mb-3">Step {deployStep}/4</div>
            <div className="flex gap-1 justify-center mb-4">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-10 h-3 rounded-full transition-colors ${
                    step < deployStep ? 'bg-green-500' :
                    step === deployStep ? 'bg-yellow-500 animate-pulse' :
                    'bg-gray-600'
                  }`}
                />
              ))}
            </div>
            <div className="text-gray-300 text-sm mb-4">
              {deployStep === 1 && 'Committing changes...'}
              {deployStep === 2 && 'Pushing branch to GitHub (backup)...'}
              {deployStep === 3 && 'Pushing to origin/master (Vercel production)...'}
              {deployStep === 4 && 'Deploying Convex to production...'}
            </div>
            <p className="text-gray-500 text-xs">
              Please wait... Do not close this window.
            </p>
          </div>
        ) : (
          /* Confirmation States */
          <div className="text-center">
            <div className="text-4xl mb-4">
              {prodConfirmStep === 1 ? '⚠️' : '‼️'}
            </div>
            <h2 className="text-xl font-bold text-red-400 mb-4">
              {prodConfirmStep === 1 ? 'Production Deployment' : 'Final Confirmation'}
            </h2>

            {prodConfirmStep === 1 && (
              <>
                <p className="text-gray-300 mb-4">
                  You are about to deploy to <span className="text-red-400 font-bold">PRODUCTION</span>.
                </p>
                <p className="text-gray-400 text-sm mb-6">
                  This will affect the live website (mek.overexposed.io) and all active players.
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => { setShowProdConfirm(false); setProdConfirmStep(0); setWillDoFullDeploy(false); }}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setProdConfirmStep(2)}
                    className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {prodConfirmStep === 2 && (
              <>
                <p className="text-gray-300 mb-4">
                  Are you <span className="text-red-400 font-bold">ABSOLUTELY SURE</span>?
                </p>
                <p className="text-gray-400 text-sm mb-6">
                  Changes will go live immediately. This cannot be undone without another deployment.
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => { setShowProdConfirm(false); setProdConfirmStep(0); setWillDoFullDeploy(false); }}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={willDoFullDeploy ? handleFullDeploy : handleDeployProd}
                    disabled={isDeployingProd || isFullDeploy}
                    className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold disabled:opacity-50"
                  >
                    {isDeployingProd || isFullDeploy ? 'Deploying...' : 'DEPLOY TO PRODUCTION'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
      </div>
    );
  }

  const anyActionRunning = isCommitting || isPushing || isDeployingDev || isDeployingProd || isFullDeploy || isBackingUp || isRollingBack;

  const rollbackModal = showRollbackConfirm && selectedRollbackBackup && mounted && createPortal(
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]"
      onClick={() => { setShowRollbackConfirm(false); setSelectedRollbackBackup(null); }}
    >
      <div
        className="bg-gray-900 border-2 border-orange-500 rounded-lg p-6 max-w-lg mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-4xl mb-4">!!</div>
          <h2 className="text-xl font-bold text-orange-400 mb-4">Confirm Rollback</h2>

          <div className="text-left bg-gray-800 rounded-lg p-4 mb-4">
            <div className="text-gray-400 text-sm mb-2">Rolling back to:</div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                selectedRollbackBackup.type === 'full' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {selectedRollbackBackup.type.toUpperCase()}
              </span>
              <span className="font-mono text-purple-400">{selectedRollbackBackup.commitHash.substring(0, 7)}</span>
            </div>
            <div className="text-sm text-gray-300 mb-1">{selectedRollbackBackup.commitMessage}</div>
            <div className="text-xs text-gray-500">
              {new Date(selectedRollbackBackup.timestamp).toLocaleString()}
            </div>
          </div>

          <p className="text-gray-400 text-sm mb-6">
            {selectedRollbackBackup.type === 'full'
              ? 'This will restore both code AND database to the backup state. Any data added since then will be lost.'
              : 'This will restore code only. Database data will remain as-is.'}
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => { setShowRollbackConfirm(false); setSelectedRollbackBackup(null); }}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleRollback}
              disabled={isRollingBack}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg font-bold disabled:opacity-50"
            >
              {isRollingBack ? 'Rolling Back...' : 'ROLLBACK'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <div className="space-y-6">
      {confirmationModal}
      {rollbackModal}

      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-yellow-400 tracking-wider">DEPLOYMENT CONTROL CENTER</h2>
        <p className="text-gray-400 text-sm mt-1">Manage code commits, pushes, and database deployments</p>
      </div>

      {/* Status Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Branch Status */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Current Branch</div>
          <div className="text-lg font-mono text-cyan-400">{gitStatus?.currentBranch || 'unknown'}</div>
        </div>

        {/* Uncommitted Changes */}
        <div className={`bg-gray-800/50 border rounded-lg p-4 ${
          gitStatus?.hasUncommittedChanges ? 'border-yellow-500/50' : 'border-gray-700'
        }`}>
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Uncommitted Changes</div>
          <div className={`text-lg font-bold ${gitStatus?.hasUncommittedChanges ? 'text-yellow-400' : 'text-green-400'}`}>
            {gitStatus?.uncommittedChanges || 0} files
          </div>
        </div>

        {/* Commits Ahead */}
        <div className={`bg-gray-800/50 border rounded-lg p-4 ${
          (gitStatus?.commitsAhead || 0) > 0 ? 'border-blue-500/50' : 'border-gray-700'
        }`}>
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Commits Ahead of GitHub</div>
          <div className={`text-lg font-bold ${(gitStatus?.commitsAhead || 0) > 0 ? 'text-blue-400' : 'text-green-400'}`}>
            {gitStatus?.commitsAhead || 0}
          </div>
        </div>

        {/* Last Commit */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Last Commit</div>
          <div className="text-sm font-mono text-purple-400">{gitStatus?.lastCommit?.hash || '---'}</div>
          <div className="text-xs text-gray-500 break-words">{gitStatus?.lastCommit?.message || '---'}</div>
          {gitStatus?.lastCommit?.date && (
            <div className="text-xs text-gray-600 mt-1">{formatCommitDate(gitStatus.lastCommit.date)}</div>
          )}
        </div>
      </div>

      {/* Commit Message Input */}
      {gitStatus?.hasUncommittedChanges && (
        <div className={`bg-gray-800/50 rounded-lg p-4 ${
          !commitMessage.trim() && sessionBackup
            ? 'border-2 border-yellow-500 animate-pulse'
            : 'border border-yellow-500/30'
        }`}>
          <label className={`text-xs uppercase tracking-wider mb-2 block ${
            !commitMessage.trim() && sessionBackup ? 'text-yellow-400 font-bold' : 'text-gray-400'
          }`}>
            {!commitMessage.trim() && sessionBackup
              ? '⚠️ ENTER COMMIT MESSAGE TO DEPLOY'
              : 'Commit Message (required for commit/deploy)'}
          </label>
          <input
            type="text"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Describe your changes..."
            className={`w-full bg-gray-900 rounded px-4 py-2 text-white focus:outline-none ${
              !commitMessage.trim() && sessionBackup
                ? 'border-2 border-yellow-500 focus:border-yellow-400'
                : 'border border-gray-700 focus:border-yellow-500'
            }`}
            disabled={anyActionRunning}
          />
          {gitStatus?.changedFiles && gitStatus.changedFiles.length > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              Changed: {gitStatus.changedFiles.slice(0, 5).map(f => f.file.split('/').pop()).join(', ')}
              {gitStatus.changedFiles.length > 5 && ` +${gitStatus.changedFiles.length - 5} more`}
            </div>
          )}
        </div>
      )}

      {/* Backup Panel */}
      <div className="bg-gray-800/50 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-yellow-400 font-bold uppercase tracking-wider">Backup Before Deploy</div>
            <div className="text-gray-400 text-xs mt-1">
              {sessionBackup
                ? `Last backup: ${sessionBackup.type === 'full' ? 'Full' : 'Quick'} @ ${new Date(sessionBackup.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
                : 'No backup this session - create one before deploying'}
            </div>
          </div>
          {sessionBackup && (
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              sessionBackup.type === 'full' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {sessionBackup.type === 'full' ? 'FULL BACKUP READY' : 'QUICK BACKUP READY'}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleQuickBackup}
            disabled={anyActionRunning}
            className={`
              px-4 py-3 rounded-lg transition-colors text-left
              ${isBackingUp && backupType === 'quick'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600'}
            `}
          >
            <div className="font-bold text-blue-400">Quick Backup</div>
            <div className="text-xs text-gray-400 mt-1">Code only (~5 sec)</div>
            <div className="text-xs text-gray-500">For routine code changes</div>
            {isBackingUp && backupType === 'quick' && (
              <div className="text-xs text-blue-300 mt-2 animate-pulse">Creating backup...</div>
            )}
          </button>

          <button
            onClick={handleFullBackup}
            disabled={anyActionRunning}
            className={`
              px-4 py-3 rounded-lg transition-colors text-left
              ${isBackingUp && backupType === 'full'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600'}
            `}
          >
            <div className="font-bold text-purple-400">Full Backup</div>
            <div className="text-xs text-gray-400 mt-1">Code + Database (~30-60 sec)</div>
            <div className="text-xs text-gray-500">For schema or risky changes</div>
            {isBackingUp && backupType === 'full' && (
              <div className="text-xs text-purple-300 mt-2 animate-pulse">Exporting database...</div>
            )}
          </button>
        </div>

        {backups.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="text-gray-500 text-xs">
              {backups.length} backup{backups.length !== 1 ? 's' : ''} available
              ({backups.filter(b => b.type === 'quick').length} quick, {backups.filter(b => b.type === 'full').length} full)
            </div>
          </div>
        )}
      </div>

      {/* Main Action Button */}
      <div className="flex justify-center">
        <button
          onClick={() => openProdConfirm(true)}
          disabled={anyActionRunning || !sessionBackup}
          className={`
            px-8 py-4 rounded-lg text-xl font-bold tracking-wider
            transition-all duration-300
            ${anyActionRunning || !sessionBackup
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg hover:shadow-red-500/25'
            }
            disabled:opacity-50
          `}
        >
          {isFullDeploy
            ? 'DEPLOYING...'
            : !sessionBackup
              ? 'CREATE BACKUP FIRST'
              : 'DEPLOY TO PRODUCTION'}
        </button>
      </div>

      {!sessionBackup && (
        <div className="text-center text-yellow-500 text-sm">
          You must create a backup before deploying to production
        </div>
      )}

      <div className="text-center text-gray-500 text-sm max-w-3xl mx-auto">
        <div>
          <span className="text-gray-400">1.</span> Commit →
          <span className="text-gray-400">2.</span> Push <span className="text-cyan-500">{gitStatus?.currentBranch || 'branch'}</span> to GitHub (backup) →
          <span className="text-gray-400">3.</span> Push to <span className="text-green-500">origin/master</span> (Vercel production) →
          <span className="text-gray-400">4.</span> Deploy Convex to Sturgeon
        </div>
      </div>

      {/* Individual Action Buttons */}
      <div className="border-t border-gray-700 pt-6">
        <div className="text-gray-400 text-sm uppercase tracking-wider mb-4 text-center">Or Do Individual Steps</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={handleCommit}
            disabled={anyActionRunning || !gitStatus?.hasUncommittedChanges || !commitMessage.trim()}
            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg transition-colors"
          >
            {isCommitting ? 'Committing...' : 'Commit Changes'}
          </button>

          <button
            onClick={handlePush}
            disabled={anyActionRunning || (gitStatus?.commitsAhead || 0) === 0}
            className="px-4 py-3 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg transition-colors"
          >
            {isPushing ? 'Pushing...' : 'Push to GitHub'}
          </button>

          <button
            onClick={handleDeployDev}
            disabled={anyActionRunning}
            className="px-4 py-3 bg-green-700 hover:bg-green-600 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg transition-colors"
          >
            {isDeployingDev ? 'Deploying...' : 'Deploy Dev (Trout)'}
          </button>

          <button
            onClick={() => openProdConfirm(false)}
            disabled={anyActionRunning}
            className="px-4 py-3 bg-red-700 hover:bg-red-600 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg transition-colors"
          >
            {isDeployingProd ? 'Deploying...' : 'Deploy Prod (Sturgeon)'}
          </button>
        </div>
      </div>

      {/* Rollback Section */}
      {backups.length > 0 && (
        <div className="border-t border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm uppercase tracking-wider">Emergency Rollback</div>
            <button
              onClick={() => {
                const backupPath = `${window.location.protocol}//${window.location.host}`.includes('localhost')
                  ? 'C:\\Users\\Ben Meyers\\Documents\\Mek Tycoon\\TYCOON REACT 8-27\\mek-tycoon-react-staging\\backups\\full'
                  : './backups/full';
                navigator.clipboard.writeText(backupPath);
                addLog('Copy', 'success', 'Backup folder path copied to clipboard');
              }}
              className="text-xs text-gray-500 hover:text-gray-300 bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition-colors"
              title="Click to copy backup folder path"
            >
              📁 Copy Path
            </button>
          </div>
          <div className="bg-gray-800/50 border border-orange-500/30 rounded-lg p-4">
            <div className="text-orange-400 text-sm mb-3">
              Select a backup to restore production to a previous state:
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {backups.slice(0, 10).map(backup => (
                <div
                  key={backup.id}
                  className={`
                    flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors
                    ${selectedRollbackBackup?.id === backup.id
                      ? 'bg-orange-500/20 border border-orange-500'
                      : 'bg-gray-700/50 hover:bg-gray-700 border border-transparent'}
                  `}
                  onClick={() => setSelectedRollbackBackup(
                    selectedRollbackBackup?.id === backup.id ? null : backup
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      backup.type === 'full' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {backup.type.toUpperCase()}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-purple-400 text-sm">{backup.commitHash.substring(0, 7)}</span>
                        <span className="text-gray-400 text-xs">
                          {new Date(backup.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                      <div className="text-gray-500 text-xs truncate max-w-md">{backup.commitMessage}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {backup.exportSizeBytes && (
                      <div className="text-xs text-gray-500">
                        {backup.exportSizeBytes > 1024 * 1024
                          ? `${(backup.exportSizeBytes / (1024 * 1024)).toFixed(1)} MB`
                          : `${(backup.exportSizeBytes / 1024).toFixed(1)} KB`}
                      </div>
                    )}
                    <button
                      onClick={(e) => handleDeleteBackup(backup, e)}
                      className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 p-1 rounded transition-colors"
                      title="Delete this backup"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {selectedRollbackBackup && (
              <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end">
                <button
                  onClick={() => setShowRollbackConfirm(true)}
                  disabled={anyActionRunning}
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-bold transition-colors"
                >
                  Rollback to Selected Backup
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity Log */}
      <div className="border-t border-gray-700 pt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-gray-400 text-sm uppercase tracking-wider">Activity Log</div>
          {actionLogs.length > 0 && (
            <button
              onClick={() => setActionLogs([])}
              className="text-xs text-gray-500 hover:text-gray-400"
            >
              Clear
            </button>
          )}
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg max-h-60 overflow-y-auto">
          {actionLogs.length === 0 ? (
            <div className="text-center text-gray-600 py-8">No recent activity</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {actionLogs.map(log => (
                <div key={log.id} className="px-4 py-2 flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    log.status === 'success' ? 'bg-green-500' :
                    log.status === 'error' ? 'bg-red-500' :
                    'bg-yellow-500 animate-pulse'
                  }`} />
                  <span className="text-gray-400 text-xs w-24">{log.action}</span>
                  <span className={`text-sm flex-1 ${
                    log.status === 'success' ? 'text-green-400' :
                    log.status === 'error' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {log.message}
                  </span>
                  <span className="text-gray-600 text-xs">
                    {log.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Commits */}
      <div className="border-t border-gray-700 pt-6">
        <div className="text-gray-400 text-sm uppercase tracking-wider mb-4">Recent Commits</div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg max-h-48 overflow-y-auto">
          {gitStatus?.recentCommits?.length === 0 ? (
            <div className="text-center text-gray-600 py-8">No commits found</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {gitStatus?.recentCommits?.map(commit => (
                <div key={commit.hash} className="px-4 py-2 flex items-center gap-3">
                  <span className="font-mono text-purple-400 text-sm">{commit.hash}</span>
                  <span className="text-gray-300 text-sm flex-1 truncate">{commit.message}</span>
                  <span className="text-gray-600 text-xs">{commit.timeAgo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 text-sm text-gray-500">
        <div className="font-bold text-gray-400 mb-2">How This Works:</div>
        <ul className="list-disc list-inside space-y-2">
          <li><span className="text-gray-400">Commit</span> - Saves your code changes to git history (local only)</li>
          <li><span className="text-gray-400">Push to GitHub</span> - Uploads commits to your current branch (creates Vercel preview)</li>
          <li><span className="text-gray-400">Deploy Dev (Trout)</span> - Updates Convex database functions for localhost testing</li>
          <li><span className="text-gray-400">Deploy Prod (Sturgeon)</span> - Updates Convex database functions for the live site</li>
        </ul>
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="font-bold text-gray-400 mb-1">What the Big Button Does (4 Steps):</div>
          <ol className="list-decimal list-inside space-y-1 text-gray-500">
            <li>Commits your changes (if any)</li>
            <li>Pushes your branch to GitHub (backs up your work)</li>
            <li>Pushes directly to <span className="text-green-400">origin/master</span> (triggers Vercel production - no branch switching!)</li>
            <li>Deploys Convex to Sturgeon (production database functions)</li>
          </ol>
          <div className="mt-2 text-xs text-gray-600">
            Note: This uses direct push (git push origin branch:master) so the dev server stays running!
          </div>
        </div>
      </div>
    </div>
  );
}
