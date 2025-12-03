import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs-extra';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'saves', 'talent-trees');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, builderMode, nodes, connections, isAutoBackup } = body;

    if (!nodes || !Array.isArray(nodes)) {
      return NextResponse.json(
        { success: false, error: 'nodes array is required' },
        { status: 400 }
      );
    }

    // Ensure backup directory exists
    await fs.ensureDir(BACKUP_DIR);

    // Create filename
    const safeName = (name || 'Untitled').replace(/[^a-z0-9-_ ]/gi, '').replace(/\s+/g, '_');
    const mode = builderMode || 'cirutree';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const prefix = isAutoBackup ? 'auto' : 'manual';
    const filename = `${prefix}_${mode}_${safeName}_${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Create save data
    const saveData = {
      name: name || 'Untitled',
      builderMode: mode,
      nodes,
      connections: connections || [],
      savedAt: new Date().toISOString(),
      isAutoBackup: !!isAutoBackup,
      nodeCount: nodes.length,
      connectionCount: (connections || []).length
    };

    // Write file
    await fs.writeJson(filepath, saveData, { spaces: 2 });

    // Get file size
    const stats = await fs.stat(filepath);

    console.log(`[TalentTreeBackup] Saved: ${filename} (${nodes.length} nodes, ${stats.size} bytes)`);

    return NextResponse.json({
      success: true,
      filename,
      filepath,
      size: stats.size,
      nodeCount: nodes.length
    });
  } catch (error) {
    console.error('[TalentTreeBackup] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Ensure backup directory exists
    await fs.ensureDir(BACKUP_DIR);

    // List all backup files
    const files = await fs.readdir(BACKUP_DIR);
    const backups = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filepath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filepath);

        // Read just the metadata without loading full node data
        try {
          const content = await fs.readJson(filepath);
          backups.push({
            filename: file,
            name: content.name,
            builderMode: content.builderMode,
            savedAt: content.savedAt,
            isAutoBackup: content.isAutoBackup,
            nodeCount: content.nodeCount,
            connectionCount: content.connectionCount,
            size: stats.size
          });
        } catch {
          // Skip corrupted files
          console.warn(`[TalentTreeBackup] Skipping corrupted file: ${file}`);
        }
      }
    }

    // Sort by date, newest first
    backups.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

    return NextResponse.json({
      success: true,
      backups,
      count: backups.length
    });
  } catch (error) {
    console.error('[TalentTreeBackup] List error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
