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
 * backup-complete route - COMPLETE BACKUP OF EVERYTHING
 *
 * Exports BOTH databases (Sturgeon + Trout) in one operation.
 * This is the "nuclear option" backup for maximum protection.
 */
export async function POST(request: NextRequest) {
  const authError = checkDeploymentAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const notes = body.notes || '';

    // Get git info
    const { stdout: branchOutput } = await execAsync('git branch --show-current');
    const currentBranch = branchOutput.trim();

    const { stdout: hashOutput } = await execAsync('git rev-parse HEAD');
    const commitHash = hashOutput.trim();

    const { stdout: msgOutput } = await execAsync('git log -1 --format=%s');
    const commitMessage = msgOutput.trim();

    // Also get master commit for reference
    let masterCommitHash = commitHash;
    try {
      if (currentBranch !== 'master') {
        const { stdout: masterHash } = await execAsync('git rev-parse master');
        masterCommitHash = masterHash.trim();
      }
    } catch (e) {
      // Master might not exist locally, use current
    }

    const timestamp = Date.now();
    const backupId = `complete-${timestamp}`;

    // Ensure backup directory exists
    const backupDir = path.join(process.cwd(), 'backups', 'complete');
    await mkdir(backupDir, { recursive: true });

    // Check disk space
    const diskCheck = await checkDiskSpace(backupDir);
    if (!diskCheck.hasEnoughSpace) {
      return NextResponse.json({
        success: false,
        error: `Insufficient disk space. Available: ${formatBytes(diskCheck.available)}, Required: ${formatBytes(MIN_DISK_SPACE_BYTES)}`,
      }, { status: 507 });
    }

    const sturgeonUrl = process.env.NEXT_PUBLIC_STURGEON_URL;
    const troutUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!sturgeonUrl) {
      return NextResponse.json({
        success: false,
        error: 'NEXT_PUBLIC_STURGEON_URL not configured',
      }, { status: 500 });
    }

    if (!troutUrl) {
      return NextResponse.json({
        success: false,
        error: 'NEXT_PUBLIC_CONVEX_URL not configured',
      }, { status: 500 });
    }

    const steps: string[] = [];
    let sturgeonSize = 0;
    let troutSize = 0;

    // Step 1: Export Sturgeon (Production)
    const sturgeonFileName = `sturgeon-${timestamp}.zip`;
    const sturgeonPath = path.join(backupDir, sturgeonFileName);

    try {
      await execAsync(
        `npx convex export --prod --include-file-storage --path "${sturgeonPath}"`,
        { timeout: 600000 }
      );
      await access(sturgeonPath);
      const sturgeonStats = await stat(sturgeonPath);
      sturgeonSize = sturgeonStats.size;
      steps.push(`Sturgeon (PROD): ${formatBytes(sturgeonSize)}`);
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: 'Failed to export Sturgeon (production) database',
        steps,
      }, { status: 500 });
    }

    // Step 2: Export Trout (Development)
    const troutFileName = `trout-${timestamp}.zip`;
    const troutPath = path.join(backupDir, troutFileName);

    try {
      await execAsync(
        `npx convex export --url "${troutUrl}" --include-file-storage --path "${troutPath}"`,
        { timeout: 600000 }
      );
      await access(troutPath);
      const troutStats = await stat(troutPath);
      troutSize = troutStats.size;
      steps.push(`Trout (DEV): ${formatBytes(troutSize)}`);
    } catch (e) {
      // Trout export failed, but we have Sturgeon - continue with warning
      steps.push('Trout (DEV): FAILED - continuing with Sturgeon only');
    }

    const totalSize = sturgeonSize + troutSize;

    const backupData = {
      id: backupId,
      type: 'complete' as const,
      timestamp: new Date(timestamp).toISOString(),
      commitHash: commitHash,
      masterCommitHash: masterCommitHash,
      commitMessage: commitMessage,
      branch: currentBranch,
      sturgeonExportPath: `./backups/complete/${sturgeonFileName}`,
      sturgeonSizeBytes: sturgeonSize,
      troutExportPath: troutSize > 0 ? `./backups/complete/${troutFileName}` : null,
      troutSizeBytes: troutSize,
      totalSizeBytes: totalSize,
      includesFileStorage: true,
      notes: notes,
    };

    // Write metadata file
    const metadataPath = path.join(backupDir, `${backupId}.json`);
    await writeFile(metadataPath, JSON.stringify(backupData, null, 2));

    return NextResponse.json({
      success: true,
      backupId: backupId,
      commitHash: commitHash,
      commitMessage: commitMessage,
      timestamp: backupData.timestamp,
      sturgeonSize: formatBytes(sturgeonSize),
      troutSize: troutSize > 0 ? formatBytes(troutSize) : 'skipped',
      totalSize: formatBytes(totalSize),
      steps: steps,
      message: `Complete backup: ${formatBytes(totalSize)} (Sturgeon + Trout)`,
    });
  } catch (error) {
    console.error('Complete backup error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
