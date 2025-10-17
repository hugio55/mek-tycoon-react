import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const BACKUP_DIR = 'C:\\Users\\Ben Meyers\\Documents\\Mek Tycoon\\CircuTree-Backups';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Ensure backup directory exists
    await mkdir(BACKUP_DIR, { recursive: true });

    // Create timestamped filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `circutree-backup-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Write backup file
    await writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      filename,
      message: 'Backup created successfully'
    });
  } catch (error: any) {
    console.error('Error creating backup:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
