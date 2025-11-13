import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { folderPath, sourceKeys, type } = await request.json();

    if (!folderPath || !sourceKeys || !Array.isArray(sourceKeys) || !type) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Check if folder exists
    if (!fs.existsSync(folderPath)) {
      return NextResponse.json({ error: 'Folder does not exist' }, { status: 400 });
    }

    // Read all files in folder
    const files = fs.readdirSync(folderPath);

    // Extract segments from filenames based on type
    // Files are named like: aa1-bi1-nm1.png (body-head-trait)
    // Position mapping: bodies=0 (first), heads=1 (middle), traits=2 (last)
    const positionIndex = type === 'bodies' ? 0 : type === 'heads' ? 1 : 2;

    // Build a set of found variation codes from files
    const foundVariationCodes = new Set<string>();
    files.forEach(file => {
      const parsed = path.parse(file);
      const filename = parsed.name.toLowerCase();
      const segments = filename.split('-');

      // Extract the relevant segment based on type
      if (segments.length >= 3 && segments[positionIndex]) {
        foundVariationCodes.add(segments[positionIndex]);
      }
    });

    // Check each source key (case-insensitive)
    const results: Record<string, boolean> = {};
    sourceKeys.forEach((key: string) => {
      results[key] = foundVariationCodes.has(key.toLowerCase());
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error scanning folder:', error);
    return NextResponse.json({ error: 'Failed to scan folder' }, { status: 500 });
  }
}
