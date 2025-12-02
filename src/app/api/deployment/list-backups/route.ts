import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { checkDeploymentAuth } from '@/lib/deployment/auth';

interface BackupMetadata {
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

export async function GET(request: NextRequest) {
  const authError = checkDeploymentAuth(request);
  if (authError) return authError;

  try {
    const backupsDir = path.join(process.cwd(), 'backups');
    const backups: BackupMetadata[] = [];

    // Read quick backups
    try {
      const quickDir = path.join(backupsDir, 'quick');
      const quickFiles = await readdir(quickDir);

      for (const file of quickFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(quickDir, file);
          const content = await readFile(filePath, 'utf-8');
          const backup = JSON.parse(content) as BackupMetadata;
          backups.push(backup);
        }
      }
    } catch (e) {
      // Quick directory doesn't exist or is empty
    }

    // Read full backups
    try {
      const fullDir = path.join(backupsDir, 'full');
      const fullFiles = await readdir(fullDir);

      for (const file of fullFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(fullDir, file);
          const content = await readFile(filePath, 'utf-8');
          const backup = JSON.parse(content) as BackupMetadata;
          backups.push(backup);
        }
      }
    } catch (e) {
      // Full directory doesn't exist or is empty
    }

    // Sort by timestamp, newest first
    backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Calculate total size
    const totalSize = backups.reduce((sum, b) => sum + (b.exportSizeBytes || 0), 0);
    const totalSizeDisplay =
      totalSize > 1024 * 1024
        ? `${(totalSize / (1024 * 1024)).toFixed(2)} MB`
        : `${(totalSize / 1024).toFixed(2)} KB`;

    return NextResponse.json({
      success: true,
      backups: backups,
      count: backups.length,
      quickCount: backups.filter((b) => b.type === 'quick').length,
      fullCount: backups.filter((b) => b.type === 'full').length,
      totalSizeBytes: totalSize,
      totalSizeDisplay: totalSizeDisplay,
    });
  } catch (error) {
    console.error('List backups error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
