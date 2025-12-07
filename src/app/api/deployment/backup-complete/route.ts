import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, stat, access } from 'fs/promises';
import path from 'path';
import { checkDeploymentAuth } from '@/lib/deployment/auth';

const execAsync = promisify(exec);

// Minimum required disk space for backup (1GB for both databases)
const MIN_DISK_SPACE_BYTES = 1024 * 1024 * 1024;

async function checkDiskSpace(directory: string): Promise<{ available: number; hasEnoughSpace: boolean }> {
  try {
    const { stdout } = await execAsync(
      `powershell -Command "(Get-PSDrive -Name (Split-Path -Qualifier '${directory.replace(/'/g, "''")}').TrimEnd(':')).Free"`,
      { timeout: 10000 }
    );
    const available = parseInt(stdout.trim(), 10);
    return {
      available: isNaN(available) ? 0 : available,
      hasEnoughSpace: !isNaN(available) && available > MIN_DISK_SPACE_BYTES,
    };
  } catch (e) {
    return { available: 0, hasEnoughSpace: true };
  }
}

function formatBytes(bytes: number): string {
  if (bytes > 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  if (bytes > 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(2)} KB`;
}

/**
 * NUCLEAR BACKUP - Complete backup of EVERYTHING
 *
 * This is the "save absolutely everything" option for disaster recovery.
 *
 * Steps:
 * 1. Git commit on current branch (capture exact code state)
 * 2. Push current branch to GitHub (get code off machine)
 * 3. Export Sturgeon (production database + file storage)
 * 4. Export Trout (dev database + file storage)
 * 5. Save metadata file with all details
 */
export async function POST(request: NextRequest) {
  const authError = checkDeploymentAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const notes = body.notes || '';

    const steps: string[] = [];
    const timestamp = Date.now();
    const backupId = `complete-${timestamp}`;

    // Get current branch
    const { stdout: branchOutput } = await execAsync('git branch --show-current');
    const currentBranch = branchOutput.trim();

    // ========== STEP 1: Git Commit ==========
    // Check if there are changes to commit
    const { stdout: statusOutput } = await execAsync('git status --porcelain');
    const hasChanges = statusOutput.trim().length > 0;

    let commitHash: string;
    let commitMessage: string;

    if (hasChanges) {
      // Stage all changes
      await execAsync('git add -A');

      // Create backup commit
      const backupCommitMessage = `Backup checkpoint: ${new Date(timestamp).toLocaleString()}`;
      try {
        await execAsync(`git commit -m "${backupCommitMessage}"`);
        steps.push(`Committed changes: "${backupCommitMessage}"`);
      } catch (e: any) {
        // Commit might fail if nothing to commit after staging
        if (!e.message?.includes('nothing to commit')) {
          steps.push('Warning: Commit failed, continuing with current HEAD');
        }
      }
    } else {
      steps.push('No uncommitted changes (using current HEAD)');
    }

    // Get the current commit hash after potential commit
    const { stdout: hashOutput } = await execAsync('git rev-parse HEAD');
    commitHash = hashOutput.trim();

    const { stdout: msgOutput } = await execAsync('git log -1 --format=%s');
    commitMessage = msgOutput.trim();

    steps.push(`Code state: ${commitHash.substring(0, 7)}`);

    // ========== STEP 2: Push to GitHub ==========
    try {
      const { stdout: pushOutput, stderr: pushStderr } = await execAsync(
        `git push origin ${currentBranch}`,
        { timeout: 120000 }
      );
      const pushResult = pushOutput + pushStderr;
      if (pushResult.includes('Everything up-to-date')) {
        steps.push(`GitHub: ${currentBranch} already up to date`);
      } else {
        steps.push(`GitHub: Pushed ${currentBranch} successfully`);
      }
    } catch (e: any) {
      steps.push(`GitHub: Push failed - ${e.message?.substring(0, 100) || 'unknown error'}`);
      // Don't fail the whole backup if push fails - we still want the database exports
    }

    // ========== STEP 3 & 4: Export Databases ==========
    // Ensure backup directory exists
    const backupDir = path.join(process.cwd(), 'backups', 'complete');
    await mkdir(backupDir, { recursive: true });

    // Check disk space
    const diskCheck = await checkDiskSpace(backupDir);
    if (!diskCheck.hasEnoughSpace) {
      return NextResponse.json({
        success: false,
        error: `Insufficient disk space. Available: ${formatBytes(diskCheck.available)}, Required: ${formatBytes(MIN_DISK_SPACE_BYTES)}`,
        steps,
      }, { status: 507 });
    }

    const sturgeonUrl = process.env.NEXT_PUBLIC_STURGEON_URL;
    const troutUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!sturgeonUrl) {
      return NextResponse.json({
        success: false,
        error: 'NEXT_PUBLIC_STURGEON_URL not configured',
        steps,
      }, { status: 500 });
    }

    if (!troutUrl) {
      return NextResponse.json({
        success: false,
        error: 'NEXT_PUBLIC_CONVEX_URL not configured',
        steps,
      }, { status: 500 });
    }

    let sturgeonSize = 0;
    let troutSize = 0;

    // Export Sturgeon (Production)
    const sturgeonFileName = `sturgeon-${timestamp}.zip`;
    const sturgeonPath = path.join(backupDir, sturgeonFileName);

    try {
      steps.push('Exporting Sturgeon (production)...');
      await execAsync(
        `npx convex export --prod --include-file-storage --path "${sturgeonPath}"`,
        { timeout: 600000 }
      );
      await access(sturgeonPath);
      const sturgeonStats = await stat(sturgeonPath);
      sturgeonSize = sturgeonStats.size;
      steps.push(`Sturgeon: ${formatBytes(sturgeonSize)}`);
    } catch (e: any) {
      return NextResponse.json({
        success: false,
        error: `Failed to export Sturgeon: ${e.message?.substring(0, 200) || 'unknown error'}`,
        steps,
      }, { status: 500 });
    }

    // Export Trout (Development)
    const troutFileName = `trout-${timestamp}.zip`;
    const troutPath = path.join(backupDir, troutFileName);

    try {
      steps.push('Exporting Trout (development)...');
      await execAsync(
        `npx convex export --url "${troutUrl}" --include-file-storage --path "${troutPath}"`,
        { timeout: 600000 }
      );
      await access(troutPath);
      const troutStats = await stat(troutPath);
      troutSize = troutStats.size;
      steps.push(`Trout: ${formatBytes(troutSize)}`);
    } catch (e: any) {
      // Trout export failed, but we have Sturgeon - continue with warning
      steps.push(`Trout: FAILED - ${e.message?.substring(0, 100) || 'unknown error'}`);
    }

    const totalSize = sturgeonSize + troutSize;

    // ========== STEP 5: Save Metadata ==========
    const backupData = {
      id: backupId,
      type: 'complete' as const,
      timestamp: new Date(timestamp).toISOString(),
      branch: currentBranch,
      commitHash: commitHash,
      commitMessage: commitMessage,
      pushedToGitHub: steps.some(s => s.includes('Pushed') && s.includes('successfully')),
      sturgeonExportPath: `./backups/complete/${sturgeonFileName}`,
      sturgeonSizeBytes: sturgeonSize,
      troutExportPath: troutSize > 0 ? `./backups/complete/${troutFileName}` : null,
      troutSizeBytes: troutSize,
      totalSizeBytes: totalSize,
      includesFileStorage: true,
      notes: notes,
      steps: steps,
    };

    const metadataPath = path.join(backupDir, `${backupId}.json`);
    await writeFile(metadataPath, JSON.stringify(backupData, null, 2));

    steps.push(`Metadata saved: ${backupId}.json`);

    return NextResponse.json({
      success: true,
      backupId: backupId,
      branch: currentBranch,
      commitHash: commitHash,
      commitMessage: commitMessage,
      timestamp: backupData.timestamp,
      sturgeonSize: formatBytes(sturgeonSize),
      troutSize: troutSize > 0 ? formatBytes(troutSize) : 'failed',
      totalSize: formatBytes(totalSize),
      steps: steps,
      message: `Nuclear backup complete: ${formatBytes(totalSize)}`,
    });
  } catch (error) {
    console.error('Nuclear backup error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
