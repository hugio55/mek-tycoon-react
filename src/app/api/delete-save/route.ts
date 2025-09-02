import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs-extra';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { saveName } = await request.json();
    
    if (!saveName) {
      return NextResponse.json({ success: false, error: 'Save name is required' }, { status: 400 });
    }

    // Find and delete the save file
    const savesDir = path.join(process.cwd(), 'saves');
    const files = await fs.readdir(savesDir);
    
    // Find matching save file
    const saveFile = files.find(f => f.startsWith(saveName.replace(/\s+/g, '_')) && f.endsWith('.zip'));
    
    if (!saveFile) {
      return NextResponse.json({ success: false, error: 'Save file not found' }, { status: 404 });
    }

    const savePath = path.join(savesDir, saveFile);
    await fs.remove(savePath);

    return NextResponse.json({
      success: true,
      message: 'Save deleted successfully',
    });
  } catch (error) {
    console.error('Delete save error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}