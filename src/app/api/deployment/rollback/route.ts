import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface BackupMetadata {
  id: string;
  type: 'quick' | 'full';
  timestamp: string;
  commitHash: string;
  commitMessage: string;
  branch: string;
  convexExportPath?: string;
  exportSizeBytes?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { backupId } = await request.json();

    if (!backupId) {
      return NextResponse.json({
        success: false,
        error: 'Backup ID is required',
      }, { status: 400 });
    }

    // Validate backup ID format to prevent path traversal
    const validIdPattern = /^(quick|full)-\d+$/;
    if (!validIdPattern.test(backupId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid backup ID format',
      }, { status: 400 });
    }

    // Determine backup type from ID
    const isFullBackup = backupId.startsWith('full-');
    const backupDir = path.join(process.cwd(), 'backups', isFullBackup ? 'full' : 'quick');
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

    // Get current branch before rollback so we can switch back
    let originalBranch = 'custom-minting-system';
    try {
      const { stdout: branchOutput } = await execAsync('git branch --show-current');
      originalBranch = branchOutput.trim() || 'custom-minting-system';
    } catch (e) {
      // Use default if we can't detect
    }

    // Step 1: Switch to master
    try {
      await execAsync('git checkout master');
      steps.push('Switched to master branch');
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: 'Failed to switch to master branch',
        steps,
      }, { status: 500 });
    }

    // Step 2: Reset to backup commit
    try {
      await execAsync(`git reset --hard ${metadata.commitHash}`);
      steps.push(`Reset to commit ${metadata.commitHash.substring(0, 7)}`);
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: `Failed to reset to commit ${metadata.commitHash}`,
        steps,
      }, { status: 500 });
    }

    // Step 3: Force push to GitHub (triggers Vercel rollback)
    try {
      await execAsync('git push origin master --force');
      steps.push('Force pushed master to GitHub (Vercel production rolling back)');
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: 'Failed to force push to GitHub',
        steps,
      }, { status: 500 });
    }

    // Step 4: For full backups, restore Convex data
    if (isFullBackup && metadata.convexExportPath) {
      const exportPath = path.join(process.cwd(), metadata.convexExportPath.replace('./', ''));

      try {
        await execAsync(`npx convex import --prod --replace "${exportPath}"`, {
          timeout: 600000, // 10 minute timeout for large databases
        });
        steps.push('Restored Convex production data');
      } catch (e) {
        return NextResponse.json({
          success: false,
          error: 'Failed to restore Convex data (code rollback succeeded)',
          steps,
        }, { status: 500 });
      }
    }

    // Step 5: Deploy Convex to ensure functions match the code
    try {
      await execAsync('npx convex deploy --prod', {
        timeout: 120000,
      });
      steps.push('Deployed Convex functions to production');
    } catch (e) {
      // Continue anyway - functions might already be correct
      steps.push('Warning: Could not redeploy Convex functions');
    }

    // Step 6: Switch back to working branch
    if (originalBranch !== 'master') {
      try {
        await execAsync(`git checkout ${originalBranch}`);
        steps.push(`Switched back to ${originalBranch}`);
      } catch (e) {
        steps.push(`Warning: Could not switch back to ${originalBranch}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Rolled back to ${metadata.type} backup from ${new Date(metadata.timestamp).toLocaleString()}`,
      type: metadata.type,
      commitHash: metadata.commitHash,
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
