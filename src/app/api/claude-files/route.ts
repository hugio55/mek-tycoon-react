import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Paths to scan
const PROJECT_CLAUDE_DIR = path.join(process.cwd(), '.claude');
const PARENT_CLAUDE_DIR = path.join('C:', 'Users', 'Ben Meyers', 'Documents', 'Mek Tycoon', '.claude');
const COMPUTER_CLAUDE_DIR = path.join('C:', 'Users', 'Ben Meyers', '.claude');

interface ClaudeFile {
  name: string;
  path: string;
  type: 'command' | 'document' | 'agent' | 'config';
  location: 'project' | 'parent' | 'computer';
  description?: string;
  content: string;
  frontmatter?: Record<string, any>;
}

async function scanDirectory(dir: string, location: 'project' | 'parent' | 'computer'): Promise<ClaudeFile[]> {
  const files: ClaudeFile[] = [];

  try {
    const exists = await fs.access(dir).then(() => true).catch(() => false);
    if (!exists) return files;

    async function scanRecursive(currentDir: string, relativePath: string = '') {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relPath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          await scanRecursive(fullPath, relPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const content = await fs.readFile(fullPath, 'utf-8');

          // Parse frontmatter if exists
          let frontmatter: Record<string, any> = {};
          let description: string | undefined;

          try {
            const parsed = matter(content);
            frontmatter = parsed.data;
            description = frontmatter.description || frontmatter.name;
          } catch {
            // No frontmatter, try to extract first line as description
            const firstLine = content.split('\n').find(line => line.trim().length > 0);
            description = firstLine?.replace(/^#+\s*/, '').substring(0, 100);
          }

          // Determine type based on path
          let type: ClaudeFile['type'] = 'document';
          if (relPath.startsWith('commands')) type = 'command';
          else if (relPath.startsWith('agents')) type = 'agent';
          else if (relPath.startsWith('config')) type = 'config';

          files.push({
            name: entry.name.replace('.md', ''),
            path: fullPath,
            type,
            location,
            description,
            content,
            frontmatter
          });
        }
      }
    }

    await scanRecursive(dir);
  } catch (error) {
    console.error(`Error scanning ${dir}:`, error);
  }

  return files;
}

export async function GET() {
  try {
    console.log('[CLAUDE_API] Starting to scan directories...');
    console.log('[CLAUDE_API] Project dir:', PROJECT_CLAUDE_DIR);
    console.log('[CLAUDE_API] Parent dir:', PARENT_CLAUDE_DIR);
    console.log('[CLAUDE_API] Computer dir:', COMPUTER_CLAUDE_DIR);

    const [projectFiles, parentFiles, computerFiles] = await Promise.all([
      scanDirectory(PROJECT_CLAUDE_DIR, 'project'),
      scanDirectory(PARENT_CLAUDE_DIR, 'parent'),
      scanDirectory(COMPUTER_CLAUDE_DIR, 'computer')
    ]);

    console.log('[CLAUDE_API] Scan complete:', {
      project: projectFiles.length,
      parent: parentFiles.length,
      computer: computerFiles.length
    });

    const allFiles = [...projectFiles, ...parentFiles, ...computerFiles];

    const response = {
      success: true,
      files: allFiles,
      stats: {
        total: allFiles.length,
        project: projectFiles.length,
        parent: parentFiles.length,
        computer: computerFiles.length,
        byType: {
          commands: allFiles.filter(f => f.type === 'command').length,
          documents: allFiles.filter(f => f.type === 'document').length,
          agents: allFiles.filter(f => f.type === 'agent').length,
          config: allFiles.filter(f => f.type === 'config').length
        }
      }
    };

    console.log('[CLAUDE_API] Returning response with', allFiles.length, 'files');
    return NextResponse.json(response);
  } catch (error) {
    console.error('[CLAUDE_API] Error fetching Claude files:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to fetch Claude files: ${errorMessage}` },
      { status: 500 }
    );
  }
}
