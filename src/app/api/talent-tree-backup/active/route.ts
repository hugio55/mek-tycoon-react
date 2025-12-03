import { NextResponse } from 'next/server';
import fs from 'fs-extra';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'saves', 'talent-trees');

/**
 * GET /api/talent-tree-backup/active
 * Returns the most recent backup file for use by other pages.
 * This serves as a fallback when localStorage is cleared.
 *
 * Query params:
 * - mode: 'cirutree' | 'mek' | 'story' (optional, defaults to 'cirutree')
 * - preferManual: 'true' | 'false' (optional, defaults to true - prefer manual saves over auto)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'cirutree';
    const preferManual = searchParams.get('preferManual') !== 'false';

    // Ensure backup directory exists
    await fs.ensureDir(BACKUP_DIR);

    // List all backup files
    const files = await fs.readdir(BACKUP_DIR);
    const matchingBackups: Array<{
      filename: string;
      isManual: boolean;
      savedAt: Date;
      data: unknown;
    }> = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      // Filter by mode (filename format: prefix_mode_name_timestamp.json)
      const parts = file.split('_');
      if (parts.length < 3) continue;

      const fileMode = parts[1];
      if (fileMode !== mode) continue;

      const filepath = path.join(BACKUP_DIR, file);

      try {
        const content = await fs.readJson(filepath);
        matchingBackups.push({
          filename: file,
          isManual: !content.isAutoBackup,
          savedAt: new Date(content.savedAt),
          data: content
        });
      } catch {
        // Skip corrupted files
        continue;
      }
    }

    if (matchingBackups.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No ${mode} backups found`
      }, { status: 404 });
    }

    // Sort: if preferManual, put manual saves first, then by date
    matchingBackups.sort((a, b) => {
      if (preferManual) {
        if (a.isManual && !b.isManual) return -1;
        if (!a.isManual && b.isManual) return 1;
      }
      return b.savedAt.getTime() - a.savedAt.getTime();
    });

    const bestMatch = matchingBackups[0];

    return NextResponse.json({
      success: true,
      filename: bestMatch.filename,
      data: bestMatch.data
    });
  } catch (error) {
    console.error('[TalentTreeBackup] Active tree error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
