import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs-extra';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'saves', 'talent-trees');

export async function GET(request: NextRequest) {
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

    const data = await fs.readJson(filepath);

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('[TalentTreeBackup] Load error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
