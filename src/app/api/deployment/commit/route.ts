import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { checkDeploymentAuth } from '@/lib/deployment/auth';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  const authError = checkDeploymentAuth(request);
  if (authError) return authError;

  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ success: false, error: 'Commit message is required' }, { status: 400 });
    }

    // Check if there are any changes
    const { stdout: statusOutput } = await execAsync('git status --porcelain');

    if (!statusOutput.trim()) {
      return NextResponse.json({
        success: false,
        error: 'No changes to commit. All files are up to date.',
      }, { status: 400 });
    }

    // Add all changes
    await execAsync('git add -A');

    // Check AGAIN after staging - files may have been auto-modified back
    const { stdout: diffOutput } = await execAsync('git diff --cached --stat');
    if (!diffOutput.trim()) {
      return NextResponse.json({
        success: false,
        error: 'No changes to commit after staging. Files may have been auto-restored.',
      }, { status: 400 });
    }

    // Create commit message with proper newlines
    const commitMessage = `${message}

Generated via Deployment Control Center`;

    // Use a temp file for commit message (handles newlines properly on Windows)
    const tempMsgFile = path.join(process.cwd(), '.git', 'COMMIT_MSG_TEMP');
    await writeFile(tempMsgFile, commitMessage, 'utf-8');

    let commitOutput: string;
    try {
      const result = await execAsync(`git commit -F "${tempMsgFile}"`);
      commitOutput = result.stdout;
    } finally {
      // Clean up temp file
      try {
        await unlink(tempMsgFile);
      } catch {
        // Ignore cleanup errors
      }
    }

    // Get commit hash
    const { stdout: hashOutput } = await execAsync('git rev-parse HEAD');
    const commitHash = hashOutput.trim().substring(0, 7);

    // Get changed files count
    const filesChanged = commitOutput.match(/(\d+) files? changed/)?.[1] || '0';

    return NextResponse.json({
      success: true,
      message: `Commit ${commitHash} created with ${filesChanged} files changed`,
      commitHash,
      filesChanged: parseInt(filesChanged),
    });
  } catch (error: any) {
    console.error('Commit error:', error);

    // Check if it's a "nothing to commit" error from git
    const errorMessage = error?.message || error?.stderr || 'Unknown error';
    if (errorMessage.includes('nothing to commit') || errorMessage.includes('no changes added')) {
      return NextResponse.json({
        success: false,
        error: 'No changes to commit. Working tree is clean.',
      }, { status: 400 });
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
