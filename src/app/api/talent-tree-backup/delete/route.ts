import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs-extra';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'saves', 'talent-trees');

/**
 * DELETE /api/talent-tree-backup/delete
 * Deletes a specific backup file
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'filename parameter is required' },
        { status: 400 }
      );
    }

    // Security: Prevent directory traversal
    const safeName = path.basename(filename);
    const filepath = path.join(BACKUP_DIR, safeName);

    if (!await fs.pathExists(filepath)) {
      return NextResponse.json(
        { success: false, error: 'Backup file not found' },
        { status: 404 }
      );
    }

    await fs.remove(filepath);

    console.log(`[TalentTreeBackup] Deleted: ${safeName}`);

    return NextResponse.json({
      success: true,
      deleted: safeName
    });
  } catch (error) {
    console.error('[TalentTreeBackup] Delete error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/talent-tree-backup/delete
 * Cleanup old auto-backups, keeping only the most recent N
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keepCount = 20, mode } = body; // Keep last 20 auto-backups by default

    await fs.ensureDir(BACKUP_DIR);

    const files = await fs.readdir(BACKUP_DIR);
    const autoBackups: Array<{ filename: string; savedAt: Date }> = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      if (!file.startsWith('auto_')) continue; // Only cleanup auto backups

      // Filter by mode if specified
      if (mode) {
        const parts = file.split('_');
        if (parts.length >= 2 && parts[1] !== mode) continue;
      }

      const filepath = path.join(BACKUP_DIR, file);

      try {
        const content = await fs.readJson(filepath);
        autoBackups.push({
          filename: file,
          savedAt: new Date(content.savedAt)
        });
      } catch {
        // Skip corrupted files (but could delete them)
        continue;
      }
    }

    // Sort by date, newest first
    autoBackups.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());

    // Delete old backups beyond keepCount
    const toDelete = autoBackups.slice(keepCount);
    let deletedCount = 0;

    for (const backup of toDelete) {
      try {
        await fs.remove(path.join(BACKUP_DIR, backup.filename));
        deletedCount++;
      } catch (e) {
        console.error(`[TalentTreeBackup] Failed to delete ${backup.filename}:`, e);
      }
    }

    console.log(`[TalentTreeBackup] Cleanup: deleted ${deletedCount} old auto-backups, kept ${Math.min(autoBackups.length, keepCount)}`);

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      kept: Math.min(autoBackups.length, keepCount),
      total: autoBackups.length
    });
  } catch (error) {
    console.error('[TalentTreeBackup] Cleanup error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
