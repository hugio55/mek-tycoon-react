import { NextRequest, NextResponse } from 'next/server';
import { unlink, readFile, readdir, stat } from 'fs/promises';
import path from 'path';
import { checkDeploymentAuth } from '@/lib/deployment/auth';

interface BackupMetadata {
  id: string;
  type: 'quick' | 'full';
  convexExportPath?: string;
}

export async function DELETE(request: NextRequest) {
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

    // Load backup metadata to find associated files
    let metadata: BackupMetadata | null = null;
    try {
      const content = await readFile(metadataPath, 'utf-8');
      metadata = JSON.parse(content);
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: `Backup not found: ${backupId}`,
      }, { status: 404 });
    }

    // Delete the metadata file
    await unlink(metadataPath);

    // For full backups, also delete the export ZIP
    if (isFullBackup && metadata?.convexExportPath) {
      const exportPath = path.join(process.cwd(), metadata.convexExportPath.replace('./', ''));
      try {
        await unlink(exportPath);
      } catch (e) {
        // Export file might already be deleted, ignore
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deleted backup: ${backupId}`,
    });
  } catch (error) {
    console.error('Delete backup error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Auto-cleanup endpoint - removes old backups beyond retention limits
export async function POST() {
  try {
    const QUICK_RETENTION = 10;  // Keep last 10 quick backups
    const FULL_RETENTION = 5;    // Keep last 5 full backups

    const backupsDir = path.join(process.cwd(), 'backups');
    let deletedCount = 0;
    let freedBytes = 0;

    // Clean up quick backups
    try {
      const quickDir = path.join(backupsDir, 'quick');
      const quickFiles = await readdir(quickDir);
      const quickBackups = quickFiles
        .filter(f => f.endsWith('.json'))
        .sort((a, b) => b.localeCompare(a)); // Newest first

      for (let i = QUICK_RETENTION; i < quickBackups.length; i++) {
        const filePath = path.join(quickDir, quickBackups[i]);
        try {
          const stats = await stat(filePath);
          freedBytes += stats.size;
          await unlink(filePath);
          deletedCount++;
        } catch (e) {
          // Ignore individual file errors
        }
      }
    } catch (e) {
      // Quick directory doesn't exist
    }

    // Clean up full backups
    try {
      const fullDir = path.join(backupsDir, 'full');
      const fullFiles = await readdir(fullDir);

      // Get metadata files sorted by timestamp (newest first)
      const metadataFiles = fullFiles
        .filter(f => f.endsWith('.json'))
        .sort((a, b) => b.localeCompare(a));

      for (let i = FULL_RETENTION; i < metadataFiles.length; i++) {
        const metadataPath = path.join(fullDir, metadataFiles[i]);

        try {
          // Read metadata to find associated export file
          const content = await readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(content) as BackupMetadata;

          // Delete metadata file
          const metaStats = await stat(metadataPath);
          freedBytes += metaStats.size;
          await unlink(metadataPath);
          deletedCount++;

          // Delete export file if it exists
          if (metadata.convexExportPath) {
            const exportPath = path.join(process.cwd(), metadata.convexExportPath.replace('./', ''));
            try {
              const exportStats = await stat(exportPath);
              freedBytes += exportStats.size;
              await unlink(exportPath);
              deletedCount++;
            } catch (e) {
              // Export file might not exist
            }
          }
        } catch (e) {
          // Ignore individual file errors
        }
      }
    } catch (e) {
      // Full directory doesn't exist
    }

    const freedDisplay = freedBytes > 1024 * 1024
      ? `${(freedBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(freedBytes / 1024).toFixed(2)} KB`;

    return NextResponse.json({
      success: true,
      message: deletedCount > 0
        ? `Cleaned up ${deletedCount} old backup files, freed ${freedDisplay}`
        : 'No old backups to clean up',
      deletedCount,
      freedBytes,
      freedDisplay,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
