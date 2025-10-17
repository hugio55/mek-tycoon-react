import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const BACKUP_DIR = 'C:\\Users\\Ben Meyers\\Documents\\Mek Tycoon\\CircuTree-Backups';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({
        success: false,
        error: 'Filename parameter is required'
      }, { status: 400 });
    }

    // Security: ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid filename'
      }, { status: 400 });
    }

    const filepath = path.join(BACKUP_DIR, filename);
    const content = await readFile(filepath, 'utf-8');
    const data = JSON.parse(content);

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Error loading backup:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
