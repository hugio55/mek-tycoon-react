import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const savesDir = path.join(process.cwd(), 'saves');
    
    // Check if saves directory exists
    if (!fs.existsSync(savesDir)) {
      return NextResponse.json({ 
        success: false, 
        error: 'No saves directory found',
        savesFound: []
      });
    }

    // Get all .zip files in the saves directory
    const files = fs.readdirSync(savesDir);
    const saveFiles = files.filter(file => file.endsWith('.zip'));
    
    const savesData = [];
    
    for (const saveFile of saveFiles) {
      const filePath = path.join(savesDir, saveFile);
      const stats = fs.statSync(filePath);
      
      // Extract save name (without .zip extension)
      const saveName = saveFile.replace('.zip', '');
      
      // Try to parse the date from the filename
      // Format: Save_Sep_02_0028_2025-09-02T04-28-55.zip
      let createdAt = stats.mtime.getTime(); // Default to file modification time
      const dateMatch = saveFile.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
      if (dateMatch) {
        const dateStr = dateMatch[1].replace(/T/, ' ').replace(/-/g, ':');
        const parsedDate = new Date(dateStr.replace(' ', 'T').replace(/(\d{2}):(\d{2}):(\d{2})$/, '$1:$2:$3'));
        if (!isNaN(parsedDate.getTime())) {
          createdAt = parsedDate.getTime();
        }
      }
      
      savesData.push({
        name: saveName,
        description: `Imported from filesystem on ${new Date().toLocaleString()}`,
        filesCount: 0, // We don't know the actual count without unzipping
        sizeInBytes: stats.size,
        createdAt: createdAt,
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      savesFound: savesData,
      count: savesData.length
    });
  } catch (error) {
    console.error('Error syncing saves:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to sync saves' 
    });
  }
}