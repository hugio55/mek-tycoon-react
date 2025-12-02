import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
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

    // Create commit
    const commitMessage = `${message}

Generated via Deployment Control Center`;

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
      filesChanged: parseInt(filesChanged),
    });
  } catch (error) {
    console.error('Commit error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
