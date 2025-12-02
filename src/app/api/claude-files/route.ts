import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import yaml from 'js-yaml';

// Paths to scan
const PROJECT_CLAUDE_DIR = path.join(process.cwd(), '.claude');
const PROJECT_ROOT_DIR = process.cwd(); // For root-level reference docs
const PARENT_CLAUDE_DIR = path.join('C:', 'Users', 'Ben Meyers', 'Documents', 'Mek Tycoon', '.claude');
const COMPUTER_CLAUDE_DIR = path.join('C:', 'Users', 'Ben Meyers', '.claude');

interface ClaudeFile {
  name: string;
  path: string;
  type: 'command' | 'document' | 'agent' | 'config' | 'reference';
  location: 'project' | 'parent' | 'computer';
  description?: string;
  content: string;
  frontmatter?: Record<string, any>;
  lastModified?: number;
  format?: 'yaml' | 'markdown'; // New field to distinguish YAML agents
}

async function scanDirectory(dir: string, location: 'project' | 'parent' | 'computer', rootLevelOnly: boolean = false): Promise<ClaudeFile[]> {
  const files: ClaudeFile[] = [];

  try {
    const exists = await fs.access(dir).then(() => true).catch(() => false);
    if (!exists) return files;

    async function scanRecursive(currentDir: string, relativePath: string = '', depth: number = 0) {
      // Prevent infinite recursion
      if (depth > 10) {
        return;
      }

      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          try {
            const fullPath = path.join(currentDir, entry.name);
            const relPath = path.join(relativePath, entry.name);

            if (entry.isDirectory()) {
              // If root-level only mode, skip ALL subdirectories
              if (rootLevelOnly) {
                continue;
              }
              // Skip node_modules and hidden directories except .claude
              if (entry.name === 'node_modules' || (entry.name.startsWith('.') && entry.name !== '.claude')) {
                continue;
              }
              await scanRecursive(fullPath, relPath, depth + 1);
            } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
              // Check file size first - skip files larger than 1MB to avoid hanging
              const stats = await fs.stat(fullPath);
              if (stats.size > 1024 * 1024) {
                continue;
              }

              const content = await fs.readFile(fullPath, 'utf-8');
              const isYaml = entry.name.endsWith('.yaml') || entry.name.endsWith('.yml');

              // Parse frontmatter/YAML content
              let frontmatter: Record<string, any> = {};
              let description: string | undefined;
              let format: 'yaml' | 'markdown' = isYaml ? 'yaml' : 'markdown';

              if (isYaml) {
                // Parse YAML file
                try {
                  const parsed = yaml.load(content) as Record<string, any>;
                  frontmatter = parsed || {};
                  // Extract description from YAML - could be 'description' field or first line of it
                  if (typeof parsed?.description === 'string') {
                    description = parsed.description.split('\n')[0].trim().substring(0, 150);
                  } else if (parsed?.name) {
                    description = parsed.name;
                  }
                } catch {
                  description = 'YAML agent configuration';
                }
              } else {
                // Parse markdown frontmatter
                try {
                  const parsed = matter(content);
                  frontmatter = parsed.data;
                  description = frontmatter.description || frontmatter.name;
                } catch {
                  // No frontmatter, try to extract first line as description
                  const firstLine = content.split('\n').find(line => line.trim().length > 0);
                  description = firstLine?.replace(/^#+\s*/, '').substring(0, 100);
                }
              }

              // Determine type based on path and filename patterns
              let type: ClaudeFile['type'] = 'document';
              if (relPath.startsWith('commands')) type = 'command';
              else if (relPath.startsWith('agents')) type = 'agent';
              else if (relPath.startsWith('config')) type = 'config';
              // Root-level files with specific patterns = reference docs
              else if (rootLevelOnly && (
                entry.name.includes('PATTERN') ||
                entry.name.includes('REFERENCE') ||
                entry.name.includes('GUIDE') ||
                entry.name.includes('SPECIALIST') ||
                entry.name === 'MEK_DESIGN_PATTERNS.md'
              )) {
                type = 'reference';
              }

              // Remove file extension from name
              let displayName = entry.name;
              if (displayName.endsWith('.md')) displayName = displayName.slice(0, -3);
              else if (displayName.endsWith('.yaml')) displayName = displayName.slice(0, -5);
              else if (displayName.endsWith('.yml')) displayName = displayName.slice(0, -4);

              files.push({
                name: displayName,
                path: fullPath,
                type,
                location,
                description,
                content,
                frontmatter,
                lastModified: stats.mtimeMs,
                format
              });
            }
          } catch (entryError) {
            console.error(`[CLAUDE_API] Error processing entry ${entry.name}:`, entryError);
            // Continue with other entries
          }
        }
      } catch (readError) {
        console.error(`[CLAUDE_API] Error reading directory ${currentDir}:`, readError);
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
    const [projectClaudeFiles, projectRootFiles, parentFiles, computerFiles] = await Promise.all([
      scanDirectory(PROJECT_CLAUDE_DIR, 'project'),
      scanDirectory(PROJECT_ROOT_DIR, 'project', true), // rootLevelOnly = true
      scanDirectory(PARENT_CLAUDE_DIR, 'parent'),
      scanDirectory(COMPUTER_CLAUDE_DIR, 'computer')
    ]);

    const allFiles = [...projectClaudeFiles, ...projectRootFiles, ...parentFiles, ...computerFiles];

    return NextResponse.json({
      success: true,
      files: allFiles,
      stats: {
        total: allFiles.length,
        project: projectClaudeFiles.length + projectRootFiles.length,
        parent: parentFiles.length,
        computer: computerFiles.length,
        byType: {
          commands: allFiles.filter(f => f.type === 'command').length,
          documents: allFiles.filter(f => f.type === 'document').length,
          agents: allFiles.filter(f => f.type === 'agent').length,
          config: allFiles.filter(f => f.type === 'config').length,
          reference: allFiles.filter(f => f.type === 'reference').length
        }
      }
    });
  } catch (error) {
    console.error('[CLAUDE_API] Error fetching Claude files:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to fetch Claude files: ${errorMessage}` },
      { status: 500 }
    );
  }
}
