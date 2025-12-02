import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, stat } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const notes = body.notes || '';

    // Get master branch commit info
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

    // Export Convex production data
    const exportFileName = `convex-${timestamp}.zip`;
    const exportPath = path.join(backupDir, exportFileName);

    // Run Convex export for production (Sturgeon)
    await execAsync(`npx convex export --prod --path "${exportPath}"`, {
      timeout: 300000, // 5 minute timeout for large databases
    });

    // Get file size
    const fileStats = await stat(exportPath);
    const exportSizeBytes = fileStats.size;

    const backupData = {
      id: backupId,
      type: 'full' as const,
      timestamp: new Date(timestamp).toISOString(),
      commitHash: masterCommitHash,
      commitMessage: commitMessage,
      branch: 'master',
      convexExportPath: `./backups/full/${exportFileName}`,
      exportSizeBytes: exportSizeBytes,
      notes: notes,
    };

    // Write metadata file
    const metadataPath = path.join(backupDir, `${backupId}.json`);
    await writeFile(metadataPath, JSON.stringify(backupData, null, 2));

    // Format size for display
    const sizeDisplay =
      exportSizeBytes > 1024 * 1024
        ? `${(exportSizeBytes / (1024 * 1024)).toFixed(2)} MB`
        : `${(exportSizeBytes / 1024).toFixed(2)} KB`;

    return NextResponse.json({
      success: true,
      backupId: backupId,
      commitHash: masterCommitHash,
      commitMessage: commitMessage,
      timestamp: backupData.timestamp,
      exportPath: backupData.convexExportPath,
      sizeBytes: exportSizeBytes,
      sizeDisplay: sizeDisplay,
      message: `Full backup created: ${masterCommitHash.substring(0, 7)} + ${sizeDisplay} data`,
    });
  } catch (error) {
    console.error('Full backup error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
