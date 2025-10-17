import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import path from 'path';

const BACKUP_DIR = 'C:\\Users\\Ben Meyers\\Documents\\Mek Tycoon\\CircuTree-Backups';

export async function GET(request: NextRequest) {
  try {
    // Read all files in backup directory
    const files = await readdir(BACKUP_DIR);

    // Filter for JSON files and get their stats
    const backupFiles = await Promise.all(
      files
        .filter(file => file.endsWith('.json'))
        .map(async (file) => {
          const filepath = path.join(BACKUP_DIR, file);
          const stats = await stat(filepath);
          return {
            filename: file,
            timestamp: stats.mtime.toISOString(),
            size: stats.size
          };
        })
    );

    // Sort by timestamp descending (newest first)
    backupFiles.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      backups: backupFiles
    });
  } catch (error: any) {
    console.error('Error listing backups:', error);

    // If directory doesn't exist, return empty list
    if (error.code === 'ENOENT') {
      return NextResponse.json({
        success: true,
        backups: []
      });
    }

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
