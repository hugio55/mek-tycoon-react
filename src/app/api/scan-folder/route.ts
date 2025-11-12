import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { folderPath, sourceKeys } = await request.json();

    if (!folderPath || !sourceKeys || !Array.isArray(sourceKeys)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Check if folder exists
    if (!fs.existsSync(folderPath)) {
      return NextResponse.json({ error: 'Folder does not exist' }, { status: 400 });
    }

    // Read all files in folder
    const files = fs.readdirSync(folderPath);

    // Normalize filenames (lowercase, no extension)
    const normalizedFiles = new Set(
      files.map(file => {
        const parsed = path.parse(file);
        return parsed.name.toLowerCase();
      })
    );

    // Check each source key (case-insensitive)
    const results: Record<string, boolean> = {};
    sourceKeys.forEach((key: string) => {
      results[key] = normalizedFiles.has(key.toLowerCase());
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error scanning folder:', error);
    return NextResponse.json({ error: 'Failed to scan folder' }, { status: 500 });
  }
}
