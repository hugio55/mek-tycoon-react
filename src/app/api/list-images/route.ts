import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { folderPath } = await request.json();

    if (!folderPath) {
      return NextResponse.json({ error: 'Folder path is required' }, { status: 400 });
    }

    // Check if path exists
    if (!fs.existsSync(folderPath)) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Read directory
    const files = fs.readdirSync(folderPath);

    // Filter for image files
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });

    // Convert to web paths
    const extractWebPath = (filePath: string): string => {
      const publicIndex = filePath.lastIndexOf('public\\');
      const publicIndexForward = filePath.lastIndexOf('public/');

      let startIndex = -1;
      if (publicIndex !== -1) startIndex = publicIndex + 7;
      else if (publicIndexForward !== -1) startIndex = publicIndexForward + 7;

      if (startIndex !== -1) {
        let webPath = filePath.substring(startIndex);
        webPath = webPath.replace(/\\/g, '/');
        if (!webPath.startsWith('/')) webPath = '/' + webPath;
        return webPath;
      }
      return filePath;
    };

    const images = imageFiles.map(file => {
      const fullPath = path.join(folderPath, file);
      const webPath = extractWebPath(fullPath);
      const nameWithoutExt = path.basename(file, path.extname(file));

      return {
        name: nameWithoutExt,
        path: webPath,
        filename: file,
      };
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error listing images:', error);
    return NextResponse.json({ error: 'Failed to list images' }, { status: 500 });
  }
}
