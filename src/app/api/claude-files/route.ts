import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Paths to scan
const PROJECT_CLAUDE_DIR = path.join(process.cwd(), '.claude');
const COMPUTER_CLAUDE_DIR = path.join('C:', 'Users', 'Ben Meyers', '.claude');

interface ClaudeFile {
  name: string;
  path: string;
  type: 'command' | 'document' | 'agent' | 'config';
  location: 'project' | 'computer';
  description?: string;
  content: string;
  frontmatter?: Record<string, any>;
}

async function scanDirectory(dir: string, location: 'project' | 'computer'): Promise<ClaudeFile[]> {
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
    const [projectFiles, computerFiles] = await Promise.all([
      scanDirectory(PROJECT_CLAUDE_DIR, 'project'),
      scanDirectory(COMPUTER_CLAUDE_DIR, 'computer')
    ]);

    const allFiles = [...projectFiles, ...computerFiles];

    return NextResponse.json({
      success: true,
      files: allFiles,
      stats: {
        total: allFiles.length,
        project: projectFiles.length,
        computer: computerFiles.length,
        byType: {
          commands: allFiles.filter(f => f.type === 'command').length,
          documents: allFiles.filter(f => f.type === 'document').length,
          agents: allFiles.filter(f => f.type === 'agent').length,
          config: allFiles.filter(f => f.type === 'config').length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching Claude files:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Claude files' },
      { status: 500 }
    );
  }
}
