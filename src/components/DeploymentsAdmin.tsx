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

  useEffect(() => {
    setMounted(true);
  }, []);

  const addLog = (action: string, status: 'success' | 'error' | 'pending', message: string) => {
    setActionLogs(prev => [{
      id: Date.now().toString(),
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
    setIsFullDeploy(true);
    const originalBranch = gitStatus?.currentBranch || 'custom-minting-system';

    // Step 1: Commit (if there are changes and message provided)
    if (gitStatus?.hasUncommittedChanges) {
      if (!commitMessage.trim()) {
        addLog('Full Deploy', 'error', 'Please enter a commit message first');
        setIsFullDeploy(false);
        return;
      }

      addLog('Full Deploy', 'pending', 'Step 1/7: Committing changes...');
      try {
        const res = await fetch('/api/deployment/commit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: commitMessage })
        });
        const data = await res.json();
        if (!data.success) {
          addLog('Full Deploy', 'error', `Commit failed: ${data.error}`);
          setIsFullDeploy(false);
          return;
        }
        addLog('Full Deploy', 'success', 'Committed successfully');
        setCommitMessage('');
      } catch (error) {
        addLog('Full Deploy', 'error', 'Commit step failed');
        setIsFullDeploy(false);
        return;
      }
    } else {
      addLog('Full Deploy', 'success', 'Step 1/7: No changes to commit (skipped)');
    }

    // Step 2: Push current branch to GitHub (backup)
    addLog('Full Deploy', 'pending', `Step 2/7: Pushing ${originalBranch} to GitHub (backup)...`);
    try {
      const res = await fetch('/api/deployment/push', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addLog('Full Deploy', 'success', `${originalBranch} backed up to GitHub`);
      } else {
        addLog('Full Deploy', 'error', `Push warning: ${data.error} - continuing...`);
        // Continue anyway - backup is nice to have but not critical
      }
    } catch (error) {
      addLog('Full Deploy', 'error', 'Push warning - continuing...');
    }

    // Step 3: Switch to master
    // Step 4: Merge current branch into master
    addLog('Full Deploy', 'pending', `Step 3-4/7: Switching to master and merging ${originalBranch}...`);
    try {
      const res = await fetch('/api/deployment/merge-to-master', { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        addLog('Full Deploy', 'error', `Merge failed: ${data.error}`);
        // Try to switch back
        try {
          await fetch('/api/deployment/switch-branch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ branch: originalBranch })
          });
        } catch (e) { /* ignore */ }
        setIsFullDeploy(false);
        return;
      }
      addLog('Full Deploy', 'success', data.alreadyOnMaster ? 'Already on master' : `Merged ${originalBranch} into master`);
    } catch (error) {
      addLog('Full Deploy', 'error', 'Merge to master failed');
      setIsFullDeploy(false);
      return;
    }

    // Step 5: Push master to GitHub (triggers Vercel production)
    addLog('Full Deploy', 'pending', 'Step 5/7: Pushing master to GitHub (Vercel production)...');
    try {
      const res = await fetch('/api/deployment/push-master', { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        addLog('Full Deploy', 'error', `Push master failed: ${data.error}`);
        // Try to switch back to original branch
        try {
          await fetch('/api/deployment/switch-branch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ branch: originalBranch })
          });
        } catch (e) { /* ignore */ }
        setIsFullDeploy(false);
        return;
      }
      addLog('Full Deploy', 'success', 'Pushed master to GitHub (Vercel PRODUCTION deploying!)');
    } catch (error) {
      addLog('Full Deploy', 'error', 'Push master failed');
      // Try to switch back to original branch
      try {
        await fetch('/api/deployment/switch-branch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branch: originalBranch })
        });
      } catch (e) { /* ignore */ }
      setIsFullDeploy(false);
      return;
    }

    // Step 6: Deploy Convex to production
    addLog('Full Deploy', 'pending', 'Step 6/7: Deploying Convex to Sturgeon (PRODUCTION)...');
    try {
      const res = await fetch('/api/deployment/deploy-prod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationToken: 'DEPLOY_TO_PRODUCTION' })
      });
      const data = await res.json();
      if (data.success) {
        addLog('Full Deploy', 'success', 'Convex deployed to Sturgeon (production)');
      } else {
        addLog('Full Deploy', 'error', `Convex deploy warning: ${data.error}`);
        // Continue anyway to switch back to original branch
      }
    } catch (error) {
      addLog('Full Deploy', 'error', 'Convex deploy warning - continuing...');
    }

    // Step 7: Switch back to original branch
    addLog('Full Deploy', 'pending', `Step 7/7: Switching back to ${originalBranch}...`);
    try {
      const res = await fetch('/api/deployment/switch-branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: originalBranch })
      });
      const data = await res.json();
      if (data.success) {
        addLog('Full Deploy', 'success', `Back on ${originalBranch}`);
      } else {
        addLog('Full Deploy', 'error', `Could not switch back: ${data.error}`);
      }
    } catch (error) {
      addLog('Full Deploy', 'error', `Could not switch back to ${originalBranch}`);
    }

    addLog('Full Deploy', 'success', 'PRODUCTION DEPLOYMENT COMPLETE!');
    await fetchStatus();
    setIsFullDeploy(false);
    setShowProdConfirm(false);
    setProdConfirmStep(0);
  };

  const openProdConfirm = (fullDeploy: boolean) => {
    setShowProdConfirm(true);
    setProdConfirmStep(1);
    if (fullDeploy) {
      // Will do full deploy after confirmation
    }
  };

  const confirmationModal = showProdConfirm && mounted && createPortal(
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]"
      onClick={() => { setShowProdConfirm(false); setProdConfirmStep(0); }}
    >
      <div
        className="bg-gray-900 border-2 border-red-500 rounded-lg p-6 max-w-lg mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-4xl mb-4">
            {prodConfirmStep === 1 ? '!' : '!!'}
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
                  onClick={() => { setShowProdConfirm(false); setProdConfirmStep(0); }}
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
                  onClick={() => { setShowProdConfirm(false); setProdConfirmStep(0); }}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={isFullDeploy ? handleFullDeploy : handleDeployProd}
                  disabled={isDeployingProd || isFullDeploy}
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold disabled:opacity-50"
                >
                  {isDeployingProd || isFullDeploy ? 'Deploying...' : 'DEPLOY TO PRODUCTION'}
                </button>
              </div>
            </>
          )}
        </div>
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

  const anyActionRunning = isCommitting || isPushing || isDeployingDev || isDeployingProd || isFullDeploy || isBackingUp;

  return (
    <div className="space-y-6">
      {confirmationModal}

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
        <div className="bg-gray-800/50 border border-yellow-500/30 rounded-lg p-4">
          <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Commit Message (required for commit/deploy)</label>
          <input
            type="text"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Describe your changes..."
            className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
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

      {/* Main Action Button */}
      <div className="flex justify-center">
        <button
          onClick={() => {
            setIsFullDeploy(true);
            openProdConfirm(true);
          }}
          disabled={anyActionRunning || (gitStatus?.hasUncommittedChanges && !commitMessage.trim())}
          className={`
            px-8 py-4 rounded-lg text-xl font-bold tracking-wider
            transition-all duration-300
            ${anyActionRunning
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg hover:shadow-red-500/25'
            }
            disabled:opacity-50
          `}
        >
          {isFullDeploy ? 'DEPLOYING...' : 'DEPLOY TO PRODUCTION'}
        </button>
      </div>

      <div className="text-center text-gray-500 text-sm max-w-3xl mx-auto space-y-1">
        <div>
          <span className="text-gray-400">1.</span> Commit →
          <span className="text-gray-400">2.</span> Push <span className="text-cyan-500">{gitStatus?.currentBranch || 'branch'}</span> to GitHub →
          <span className="text-gray-400">3.</span> Switch to master →
          <span className="text-gray-400">4.</span> Merge
        </div>
        <div>
          <span className="text-gray-400">5.</span> Push <span className="text-green-500">master</span> to GitHub (Vercel production) →
          <span className="text-gray-400">6.</span> Deploy Convex to Sturgeon →
          <span className="text-gray-400">7.</span> Switch back
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
            onClick={() => {
              setIsFullDeploy(false);
              openProdConfirm(false);
            }}
            disabled={anyActionRunning}
            className="px-4 py-3 bg-red-700 hover:bg-red-600 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg transition-colors"
          >
            {isDeployingProd ? 'Deploying...' : 'Deploy Prod (Sturgeon)'}
          </button>
        </div>
      </div>

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
          <div className="font-bold text-gray-400 mb-1">What the Big Button Does (7 Steps):</div>
          <ol className="list-decimal list-inside space-y-1 text-gray-500">
            <li>Commits your changes (if any)</li>
            <li>Pushes your branch to GitHub (backs up your work)</li>
            <li>Switches to <span className="text-green-400">master</span></li>
            <li>Merges your branch into <span className="text-green-400">master</span></li>
            <li>Pushes <span className="text-green-400">master</span> to GitHub (triggers Vercel production)</li>
            <li>Deploys Convex to Sturgeon (production database functions)</li>
            <li>Switches you back to your working branch</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
