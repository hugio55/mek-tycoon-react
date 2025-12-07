import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import path from 'path';
import { checkDeploymentAuth } from '@/lib/deployment/auth';

const execAsync = promisify(exec);

interface BackupMetadata {
  id: string;
  type: 'quick' | 'full' | 'full-dev' | 'complete';
  database?: string;
  timestamp: string;
  commitHash: string;
  commitMessage: string;
  branch: string;
  convexExportPath?: string;
  exportSizeBytes?: number;
  // For complete backups
  sturgeonExportPath?: string;
  sturgeonSizeBytes?: number;
  troutExportPath?: string | null;
  troutSizeBytes?: number;
}

/**
 * ROLLBACK - Restore from a backup
 *
 * This route restores the system to a previous backup state.
 *
 * IMPORTANT: This uses direct push to remote master WITHOUT switching branches locally.
 * This keeps your dev server running and is consistent with the deploy workflow.
 *
 * Steps:
 * 1. Push backup commit directly to origin/master (triggers Vercel rollback)
 * 2. Sync local master ref to match remote
 * 3. Restore database(s) from backup exports
 * 4. Deploy Convex functions to match the restored code
 */
export async function POST(request: NextRequest) {
  const authError = checkDeploymentAuth(request);
  if (authError) return authError;

  try {
    const { backupId } = await request.json();

    if (!backupId) {
      return NextResponse.json({
        success: false,
        error: 'Backup ID is required',
      }, { status: 400 });
    }

    // Validate backup ID format to prevent path traversal
    const validIdPattern = /^(quick|full|full-dev|complete)-\d+$/;
    if (!validIdPattern.test(backupId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid backup ID format',
      }, { status: 400 });
    }

    // Determine backup type from ID
    const isCompleteBackup = backupId.startsWith('complete-');
    const isFullBackup = backupId.startsWith('full-') && !backupId.startsWith('full-dev-');
    const isFullDevBackup = backupId.startsWith('full-dev-');

    let backupDirName = 'quick';
    if (isCompleteBackup) backupDirName = 'complete';
    else if (isFullDevBackup) backupDirName = 'full-dev';
    else if (isFullBackup) backupDirName = 'full';

    const backupDir = path.join(process.cwd(), 'backups', backupDirName);
    const metadataPath = path.join(backupDir, `${backupId}.json`);

    // Load backup metadata
    let metadata: BackupMetadata;
    try {
      const content = await readFile(metadataPath, 'utf-8');
      metadata = JSON.parse(content);
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: `Backup not found: ${backupId}`,
      }, { status: 404 });
    }

    const steps: string[] = [];

    // Get current branch for reference
    let currentBranch = 'custom-minting-system';
    try {
      const { stdout: branchOutput } = await execAsync('git branch --show-current');
      currentBranch = branchOutput.trim() || 'custom-minting-system';
      steps.push(`Current branch: ${currentBranch}`);
    } catch (e) {
      steps.push('Warning: Could not detect current branch');
    }

    // ========== STEP 1: Push backup commit directly to origin/master ==========
    // This does NOT switch branches locally - your dev server keeps running!
    try {
      const { stdout: pushOutput, stderr: pushStderr } = await execAsync(
        `git push origin ${metadata.commitHash}:master --force`,
        { timeout: 120000 }
      );
      const pushResult = pushOutput + pushStderr;

      if (pushResult.includes('Everything up-to-date')) {
        steps.push(`origin/master already at ${metadata.commitHash.substring(0, 7)}`);
      } else {
        steps.push(`Pushed ${metadata.commitHash.substring(0, 7)} to origin/master (Vercel rolling back)`);
      }
    } catch (e: any) {
      return NextResponse.json({
        success: false,
        error: `Failed to push to origin/master: ${e.message?.substring(0, 200) || 'unknown error'}`,
        steps,
      }, { status: 500 });
    }

    // ========== STEP 2: Sync local master ref to match remote ==========
    // This updates your local master reference without switching to it
    try {
      await execAsync('git fetch origin master:master', { timeout: 30000 });
      steps.push('Synced local master ref to match origin');
    } catch (e) {
      // Non-critical - local ref sync is nice to have
      steps.push('Warning: Could not sync local master ref');
    }

    // ========== STEP 3: Restore database(s) ==========
    const troutUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    const sturgeonUrl = process.env.NEXT_PUBLIC_STURGEON_URL;

    // For legacy full backups (production only)
    if (isFullBackup && metadata.convexExportPath) {
      const exportPath = path.join(process.cwd(), metadata.convexExportPath.replace('./', ''));
      steps.push('Restoring Sturgeon (production)...');

      try {
        await execAsync(`npx convex import --prod --replace "${exportPath}"`, {
          timeout: 600000,
        });
        steps.push('Restored Sturgeon database');
      } catch (e: any) {
        return NextResponse.json({
          success: false,
          error: `Failed to restore Sturgeon: ${e.message?.substring(0, 200) || 'unknown error'}`,
          steps,
        }, { status: 500 });
      }
    }

    // For legacy full-dev backups (dev only)
    if (isFullDevBackup && metadata.convexExportPath) {
      if (!troutUrl) {
        return NextResponse.json({
          success: false,
          error: 'NEXT_PUBLIC_CONVEX_URL not configured for dev database restore',
          steps,
        }, { status: 500 });
      }

      const exportPath = path.join(process.cwd(), metadata.convexExportPath.replace('./', ''));
      steps.push('Restoring Trout (development)...');

      try {
        await execAsync(`npx convex import --url "${troutUrl}" --replace "${exportPath}"`, {
          timeout: 600000,
        });
        steps.push('Restored Trout database');
      } catch (e: any) {
        return NextResponse.json({
          success: false,
          error: `Failed to restore Trout: ${e.message?.substring(0, 200) || 'unknown error'}`,
          steps,
        }, { status: 500 });
      }
    }

    // For complete backups (BOTH databases)
    if (isCompleteBackup) {
      // Restore Sturgeon (production) - CRITICAL
      if (metadata.sturgeonExportPath) {
        const sturgeonPath = path.join(process.cwd(), metadata.sturgeonExportPath.replace('./', ''));
        steps.push('Restoring Sturgeon (production)...');

        try {
          await execAsync(`npx convex import --prod --replace "${sturgeonPath}"`, {
            timeout: 600000,
          });
          steps.push('Restored Sturgeon database');
        } catch (e: any) {
          return NextResponse.json({
            success: false,
            error: `Failed to restore Sturgeon: ${e.message?.substring(0, 200) || 'unknown error'}`,
            steps,
          }, { status: 500 });
        }
      }

      // Restore Trout (development) - Non-critical
      if (metadata.troutExportPath && troutUrl) {
        const troutPath = path.join(process.cwd(), metadata.troutExportPath.replace('./', ''));
        steps.push('Restoring Trout (development)...');

        try {
          await execAsync(`npx convex import --url "${troutUrl}" --replace "${troutPath}"`, {
            timeout: 600000,
          });
          steps.push('Restored Trout database');
        } catch (e: any) {
          // Trout restore failed, but Sturgeon succeeded - warn but continue
          steps.push(`Warning: Trout restore failed - ${e.message?.substring(0, 100) || 'unknown error'}`);
        }
      }
    }

    // ========== STEP 4: Deploy Convex functions to match restored code ==========
    // For complete backups, deploy to BOTH databases
    // For other backups, deploy to the appropriate database

    if (isCompleteBackup || isFullBackup) {
      // Deploy to Sturgeon (production)
      steps.push('Deploying Convex functions to Sturgeon...');
      try {
        await execAsync('npx convex deploy --prod --yes --typecheck=disable', {
          timeout: 180000,
        });
        steps.push('Deployed Convex to Sturgeon (production)');
      } catch (e: any) {
        steps.push(`Warning: Convex deploy to Sturgeon failed - ${e.message?.substring(0, 100) || 'unknown error'}`);
      }
    }

    if (isCompleteBackup || isFullDevBackup) {
      // Deploy to Trout (development)
      if (troutUrl) {
        steps.push('Deploying Convex functions to Trout...');
        try {
          await execAsync(`npx convex deploy --url "${troutUrl}" --yes --typecheck=disable`, {
            timeout: 180000,
          });
          steps.push('Deployed Convex to Trout (development)');
        } catch (e: any) {
          steps.push(`Warning: Convex deploy to Trout failed - ${e.message?.substring(0, 100) || 'unknown error'}`);
        }
      }
    }

    // For quick backups, just deploy to production (code-only restore)
    if (!isCompleteBackup && !isFullBackup && !isFullDevBackup) {
      steps.push('Deploying Convex functions to Sturgeon...');
      try {
        await execAsync('npx convex deploy --prod --yes --typecheck=disable', {
          timeout: 180000,
        });
        steps.push('Deployed Convex to Sturgeon (production)');
      } catch (e: any) {
        steps.push(`Warning: Convex deploy failed - ${e.message?.substring(0, 100) || 'unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Rolled back to ${metadata.type} backup from ${new Date(metadata.timestamp).toLocaleString()}`,
      type: metadata.type,
      commitHash: metadata.commitHash,
      commitMessage: metadata.commitMessage,
      steps,
    });
  } catch (error) {
    console.error('Rollback error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
