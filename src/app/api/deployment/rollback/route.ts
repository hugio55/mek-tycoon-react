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
        error: 'Failed to switch to master branch. You may have uncommitted changes.',
        steps,
      }, { status: 500 });
    }

    // Safety check: Verify no uncommitted changes on master before destructive reset
    try {
      const { stdout: statusCheck } = await execAsync('git status --porcelain');
      if (statusCheck.trim()) {
        // Switch back to original branch before returning error
        try {
          await execAsync(`git checkout ${originalBranch}`);
        } catch (e) { /* ignore */ }
        return NextResponse.json({
          success: false,
          error: 'Master branch has uncommitted changes. Cannot rollback safely. Please commit or stash changes first.',
          steps,
        }, { status: 400 });
      }
      steps.push('Verified master branch is clean');
    } catch (e) {
      // Continue anyway - status check is a safety net, not critical
      steps.push('Warning: Could not verify branch cleanliness');
    }

    // Step 2: Reset to backup commit (DESTRUCTIVE - destroys uncommitted changes)
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
        // Restore to Sturgeon (production)
        await execAsync(`npx convex import --prod --replace "${exportPath}"`, {
          timeout: 600000, // 10 minute timeout for large databases
        });
        steps.push('Restored Convex production data (Sturgeon)');
      } catch (e) {
        return NextResponse.json({
          success: false,
          error: 'Failed to restore Convex data (code rollback succeeded)',
          steps,
        }, { status: 500 });
      }
    }

    // Step 4b: For full-dev backups, restore Convex dev data
    if (isFullDevBackup && metadata.convexExportPath) {
      const exportPath = path.join(process.cwd(), metadata.convexExportPath.replace('./', ''));
      const troutUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

      if (!troutUrl) {
        return NextResponse.json({
          success: false,
          error: 'NEXT_PUBLIC_CONVEX_URL not configured for dev database restore',
          steps,
        }, { status: 500 });
      }

      try {
        // Restore to Trout (development)
        await execAsync(`npx convex import --url "${troutUrl}" --replace "${exportPath}"`, {
          timeout: 600000, // 10 minute timeout for large databases
        });
        steps.push('Restored Convex dev data (Trout)');
      } catch (e) {
        return NextResponse.json({
          success: false,
          error: 'Failed to restore Convex dev data (code rollback succeeded)',
          steps,
        }, { status: 500 });
      }
    }

    // Step 4c: For complete backups, restore BOTH databases
    if (isCompleteBackup) {
      const troutUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

      // Restore Sturgeon (production)
      if (metadata.sturgeonExportPath) {
        const sturgeonPath = path.join(process.cwd(), metadata.sturgeonExportPath.replace('./', ''));
        try {
          await execAsync(`npx convex import --prod --replace "${sturgeonPath}"`, {
            timeout: 600000,
          });
          steps.push('Restored Sturgeon (production)');
        } catch (e) {
          return NextResponse.json({
            success: false,
            error: 'Failed to restore Sturgeon database',
            steps,
          }, { status: 500 });
        }
      }

      // Restore Trout (development)
      if (metadata.troutExportPath && troutUrl) {
        const troutPath = path.join(process.cwd(), metadata.troutExportPath.replace('./', ''));
        try {
          await execAsync(`npx convex import --url "${troutUrl}" --replace "${troutPath}"`, {
            timeout: 600000,
          });
          steps.push('Restored Trout (development)');
        } catch (e) {
          // Trout restore failed, but Sturgeon succeeded - warn but don't fail
          steps.push('Warning: Trout restore failed (Sturgeon was restored)');
        }
      }
    }

    // Step 5: Deploy Convex to ensure functions match the code
    try {
      await execAsync('npx convex deploy', {
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
