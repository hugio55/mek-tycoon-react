import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs-extra';
import path from 'path';
import AdmZip from 'adm-zip';

export async function POST(request: NextRequest) {
  try {
    const { saveName } = await request.json();
    
    if (!saveName) {
      return NextResponse.json({ success: false, error: 'Save name is required' }, { status: 400 });
    }

    // Find the save file
    const savesDir = path.join(process.cwd(), 'saves');
    const files = await fs.readdir(savesDir);
    
    // Find matching save file (could have timestamp appended)
    const saveFile = files.find(f => f.startsWith(saveName.replace(/\s+/g, '_')) && f.endsWith('.zip'));
    
    if (!saveFile) {
      return NextResponse.json({ success: false, error: 'Save file not found' }, { status: 404 });
    }

    const savePath = path.join(savesDir, saveFile);
    
    // Create a temporary extraction directory
    const tempDir = path.join(savesDir, 'temp_restore');
    await fs.ensureDir(tempDir);

    let filesRestored = 0;

    try {
      // Extract the zip file
      const zip = new AdmZip(savePath);
      zip.extractAllTo(tempDir, true);

      // Read metadata if exists
      const metadataPath = path.join(tempDir, 'save_metadata.json');
      if (fs.existsSync(metadataPath)) {
        const metadata = await fs.readJson(metadataPath);
        filesRestored = metadata.filesCount || 0;
      }

      // Restore directories
      const dirsToRestore = ['src', 'convex', 'components', 'lib'];
      
      for (const dir of dirsToRestore) {
        const sourcePath = path.join(tempDir, dir);
        const targetPath = path.join(process.cwd(), dir);
        
        if (fs.existsSync(sourcePath)) {
          // Backup current directory if it exists
          if (fs.existsSync(targetPath)) {
            const backupPath = `${targetPath}_backup_${Date.now()}`;
            await fs.move(targetPath, backupPath);
          }
          
          // Move restored directory
          await fs.move(sourcePath, targetPath);
        }
      }

      // Restore individual files
      const filesToRestore = [
        'package.json',
        'tsconfig.json',
        'next.config.mjs',
        'tailwind.config.ts',
        'CLAUDE.md',
      ];

      for (const file of filesToRestore) {
        const sourcePath = path.join(tempDir, file);
        const targetPath = path.join(process.cwd(), file);
        
        if (fs.existsSync(sourcePath)) {
          // Backup current file if it exists
          if (fs.existsSync(targetPath)) {
            const backupPath = `${targetPath}.backup_${Date.now()}`;
            await fs.copy(targetPath, backupPath);
          }
          
          // Copy restored file
          await fs.copy(sourcePath, targetPath);
        }
      }

      // Clean up temp directory
      await fs.remove(tempDir);

      return NextResponse.json({
        success: true,
        filesRestored,
        message: 'Files restored successfully. Please restart the development server.',
      });
    } catch (error) {
      // Clean up on error
      await fs.remove(tempDir).catch(() => {});
      throw error;
    }
  } catch (error) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}