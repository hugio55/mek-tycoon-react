import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';

export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json();
    
    if (!name) {
      return NextResponse.json({ success: false, error: 'Save name is required' }, { status: 400 });
    }

    // Sanitize name for filesystem
    const safeName = name.replace(/[^a-z0-9-_ ]/gi, '').replace(/\s+/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const saveFileName = `${safeName}_${timestamp}`;
    const savePath = path.join(process.cwd(), 'saves', `${saveFileName}.zip`);

    // Ensure saves directory exists
    await fs.ensureDir(path.join(process.cwd(), 'saves'));

    // Create a zip archive
    const output = fs.createWriteStream(savePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    let filesCount = 0;
    let totalSize = 0;

    // Pipe archive to file
    archive.pipe(output);

    // Directories to backup
    const dirsToBackup = [
      'src',
      'convex',
      'components',
      'lib',
    ];

    // Files to backup from root
    const filesToBackup = [
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'next.config.mjs',
      'tailwind.config.ts',
      '.env.local',
      'CLAUDE.md',
    ];

    // Add directories
    for (const dir of dirsToBackup) {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        archive.directory(dirPath, dir);
        // Count files in directory
        const files = await countFiles(dirPath);
        filesCount += files;
      }
    }

    // Add individual files
    for (const file of filesToBackup) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file });
        filesCount++;
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
    }

    // Create metadata file
    const metadata = {
      name,
      description,
      timestamp: Date.now(),
      date: new Date().toISOString(),
      filesCount,
    };
    archive.append(JSON.stringify(metadata, null, 2), { name: 'save_metadata.json' });

    // Finalize archive
    await archive.finalize();

    // Wait for stream to finish
    await new Promise((resolve) => output.on('close', resolve));

    // Get final size
    const stats = await fs.stat(savePath);
    totalSize = stats.size;

    return NextResponse.json({
      success: true,
      filesCount,
      sizeInBytes: totalSize,
      savePath: saveFileName,
    });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function countFiles(dir: string): Promise<number> {
  let count = 0;
  const files = await fs.readdir(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      count += await countFiles(filePath);
    } else if (stat.isFile()) {
      count++;
    }
  }
  
  return count;
}