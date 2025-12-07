import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, stat, access } from 'fs/promises';
import path from 'path';
import { checkDeploymentAuth } from '@/lib/deployment/auth';

const execAsync = promisify(exec);

// Minimum required disk space for backup (500MB)
const MIN_DISK_SPACE_BYTES = 500 * 1024 * 1024;

async function checkDiskSpace(directory: string): Promise<{ available: number; hasEnoughSpace: boolean }> {
  try {
    // Windows: use wmic to get free space
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
    // If we can't check, assume there's enough space and proceed
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
 * backup-full-dev route - TROUT (DEV) DATABASE BACKUP
 *
 * Exports the Trout dev database for backup purposes.
 * This allows restoring dev database state if needed.
 */
export async function POST(request: NextRequest) {
  const authError = checkDeploymentAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const notes = body.notes || '';

    // Get current branch commit info
    const { stdout: branchOutput } = await execAsync('git branch --show-current');
    const currentBranch = branchOutput.trim();

    const { stdout: hashOutput } = await execAsync('git rev-parse HEAD');
    const commitHash = hashOutput.trim();

    const { stdout: msgOutput } = await execAsync('git log -1 --format=%s');
    const commitMessage = msgOutput.trim();

    const timestamp = Date.now();
    const backupId = `full-dev-${timestamp}`;

    // Ensure backup directory exists (separate from production backups)
    const backupDir = path.join(process.cwd(), 'backups', 'full-dev');
    await mkdir(backupDir, { recursive: true });

    // Check disk space before attempting export
    const diskCheck = await checkDiskSpace(backupDir);
    if (!diskCheck.hasEnoughSpace) {
      return NextResponse.json({
        success: false,
        error: `Insufficient disk space. Available: ${formatBytes(diskCheck.available)}, Required: ${formatBytes(MIN_DISK_SPACE_BYTES)}`,
      }, { status: 507 }); // 507 = Insufficient Storage
    }

    // Get Trout URL from env
    const troutUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!troutUrl) {
      return NextResponse.json({
        success: false,
        error: 'NEXT_PUBLIC_CONVEX_URL not configured',
      }, { status: 500 });
    }

    // Verify we're backing up Trout, not Sturgeon
    if (troutUrl.includes('sturgeon')) {
      return NextResponse.json({
        success: false,
        error: 'NEXT_PUBLIC_CONVEX_URL appears to be production (Sturgeon). Use backup-full route for production backups.',
      }, { status: 400 });
    }

    // Export Convex dev data (Trout) INCLUDING file storage
    const exportFileName = `convex-dev-${timestamp}.zip`;
    const exportPath = path.join(backupDir, exportFileName);

    // Run Convex export for dev database with file storage included
    const { stdout: exportOutput, stderr: exportStderr } = await execAsync(
      `npx convex export --url "${troutUrl}" --include-file-storage --path "${exportPath}"`,
      { timeout: 600000 } // 10 minute timeout for large databases + file storage
    );

    // Verify export succeeded - check file exists
    try {
      await access(exportPath);
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: 'Export command completed but backup file was not created. Check Convex CLI output.',
        details: exportOutput + exportStderr,
      }, { status: 500 });
    }

    // Verify export has content (not empty/corrupted)
    const fileStats = await stat(exportPath);
    const exportSizeBytes = fileStats.size;

    if (exportSizeBytes < 100) {
      return NextResponse.json({
        success: false,
        error: `Export file appears empty or corrupted (${exportSizeBytes} bytes). Backup aborted.`,
      }, { status: 500 });
    }

    const backupData = {
      id: backupId,
      type: 'full-dev' as const,
      database: 'Trout (wry-trout-962)',
      timestamp: new Date(timestamp).toISOString(),
      commitHash: commitHash,
      commitMessage: commitMessage,
      branch: currentBranch,
      convexExportPath: `./backups/full-dev/${exportFileName}`,
      exportSizeBytes: exportSizeBytes,
      includesFileStorage: true,
      notes: notes,
    };

    // Write metadata file
    const metadataPath = path.join(backupDir, `${backupId}.json`);
    await writeFile(metadataPath, JSON.stringify(backupData, null, 2));

    const sizeDisplay = formatBytes(exportSizeBytes);

    return NextResponse.json({
      success: true,
      backupId: backupId,
      database: 'Trout (wry-trout-962)',
      commitHash: commitHash,
      commitMessage: commitMessage,
      timestamp: backupData.timestamp,
      exportPath: backupData.convexExportPath,
      sizeBytes: exportSizeBytes,
      sizeDisplay: sizeDisplay,
      includesFileStorage: true,
      message: `Dev backup created: ${commitHash.substring(0, 7)} + ${sizeDisplay} (Trout database)`,
    });
  } catch (error) {
    console.error('Dev backup error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
