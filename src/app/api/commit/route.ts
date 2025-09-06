import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json({ success: false, error: 'Commit message is required' }, { status: 400 });
    }

    // Execute git commands
    try {
      // Add all changes
      await execAsync('git add -A');
      
      // Create commit with the provided message
      const commitMessage = `${message}

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>`;
      
      // Use a heredoc-style approach for the commit
      const { stdout: commitOutput } = await execAsync(
        `git commit -m "${commitMessage.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
      );
      
      // Get commit hash
      const { stdout: hashOutput } = await execAsync('git rev-parse HEAD');
      const commitHash = hashOutput.trim().substring(0, 7);
      
      // Get changed files count
      const filesChanged = commitOutput.match(/(\d+) files? changed/)?.[1] || '0';
      
      return NextResponse.json({
        success: true,
        message: `Commit ${commitHash} created with ${filesChanged} files changed`,
        commitHash,
        filesChanged,
      });
    } catch (gitError: any) {
      // Check if it's because there's nothing to commit
      if (gitError.message.includes('nothing to commit')) {
        return NextResponse.json({
          success: false,
          error: 'No changes to commit. All files are up to date.',
        }, { status: 400 });
      }
      
      throw gitError;
    }
  } catch (error) {
    console.error('Commit error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}