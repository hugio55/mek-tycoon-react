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

export async function POST(request: NextRequest) {
  const authError = checkDeploymentAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const notes = body.notes || '';

    // Get master branch commit info (master = production code)
    const { stdout: branchOutput } = await execAsync('git branch --show-current');
    const currentBranch = branchOutput.trim();

    let masterCommitHash: string;
    let commitMessage: string;

    if (currentBranch === 'master') {
      const { stdout: hashOutput } = await execAsync('git rev-parse HEAD');
      masterCommitHash = hashOutput.trim();

      const { stdout: msgOutput } = await execAsync('git log -1 --format=%s');
      commitMessage = msgOutput.trim();
    } else {
      const { stdout: hashOutput } = await execAsync('git rev-parse master');
      masterCommitHash = hashOutput.trim();

      const { stdout: msgOutput } = await execAsync('git log -1 --format=%s master');
      commitMessage = msgOutput.trim();
    }

    const timestamp = Date.now();
    const backupId = `full-${timestamp}`;

    // Ensure backup directory exists
    const backupDir = path.join(process.cwd(), 'backups', 'full');
    await mkdir(backupDir, { recursive: true });

    // Check disk space before attempting export
    const diskCheck = await checkDiskSpace(backupDir);
    if (!diskCheck.hasEnoughSpace) {
      return NextResponse.json({
        success: false,
        error: `Insufficient disk space. Available: ${formatBytes(diskCheck.available)}, Required: ${formatBytes(MIN_DISK_SPACE_BYTES)}`,
      }, { status: 507 }); // 507 = Insufficient Storage
    }

    // Export Convex production data (Sturgeon) INCLUDING file storage
    const exportFileName = `convex-${timestamp}.zip`;
    const exportPath = path.join(backupDir, exportFileName);

    // Run Convex export for production with file storage included
    const { stdout: exportOutput, stderr: exportStderr } = await execAsync(
      `npx convex export --prod --include-file-storage --path "${exportPath}"`,
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
      type: 'full' as const,
      timestamp: new Date(timestamp).toISOString(),
      commitHash: masterCommitHash,
      commitMessage: commitMessage,
      branch: 'master',
      convexExportPath: `./backups/full/${exportFileName}`,
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
      commitHash: masterCommitHash,
      commitMessage: commitMessage,
      timestamp: backupData.timestamp,
      exportPath: backupData.convexExportPath,
      sizeBytes: exportSizeBytes,
      sizeDisplay: sizeDisplay,
      includesFileStorage: true,
      message: `Full backup created: ${masterCommitHash.substring(0, 7)} + ${sizeDisplay} (includes file storage)`,
    });
  } catch (error) {
    console.error('Full backup error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
