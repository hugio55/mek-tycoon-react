import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { checkDeploymentAuth } from '@/lib/deployment/auth';

const execAsync = promisify(exec);

// The expected working branch - push will be blocked if on any other branch
const EXPECTED_BRANCH = 'custom-minting-system';

export async function POST(request: NextRequest) {
  const authError = checkDeploymentAuth(request);
  if (authError) return authError;

  try {
    // Get current branch
    const { stdout: branchOutput } = await execAsync('git branch --show-current');
    const currentBranch = branchOutput.trim();

    // Safety check: Only allow pushing from the expected working branch
    if (currentBranch !== EXPECTED_BRANCH) {
      console.warn(`[🚨PUSH] Blocked push attempt from wrong branch: ${currentBranch}`);
      return NextResponse.json({
        success: false,
        error: `Wrong branch! You're on "${currentBranch}" but should be on "${EXPECTED_BRANCH}". Push blocked for safety.`,
        currentBranch,
        expectedBranch: EXPECTED_BRANCH,
        wrongBranch: true,
      }, { status: 400 });
    }

    // Check for uncommitted changes
    const { stdout: statusOutput } = await execAsync('git status --porcelain');
    const hasUncommittedChanges = statusOutput.trim().length > 0;
    let didCommit = false;
    let committedFiles = 0;

    // If there are uncommitted changes, auto-commit first
    if (hasUncommittedChanges) {
      console.log('[🔄PUSH] Found uncommitted changes, auto-committing...');

      // Count changed files
      committedFiles = statusOutput.trim().split('\n').filter(line => line.trim()).length;

      // Stage all changes
      await execAsync('git add .');

      // Create commit with timestamp
      const timestamp = new Date().toLocaleString('en-US', {
        month: 'short', day: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
      const commitMessage = `Auto-commit before push: ${timestamp}`;

      await execAsync(`git commit -m "${commitMessage}"`);
      didCommit = true;
      console.log(`[🔄PUSH] Auto-committed ${committedFiles} file(s)`);
    }

    // Push to origin
    const { stdout: pushOutput, stderr: pushStderr } = await execAsync(
      `git push origin ${currentBranch}`
    );

    // Check if there was anything to push
    const output = pushOutput + pushStderr;
    const alreadyUpToDate = output.includes('Everything up-to-date');

    if (alreadyUpToDate && !didCommit) {
      return NextResponse.json({
        success: true,
        message: 'Already up to date with GitHub',
        alreadyUpToDate: true,
        didCommit: false,
      });
    }

    // Build success message
    let message = '';
    if (didCommit) {
      message = `Auto-committed ${committedFiles} file(s) and pushed to GitHub`;
    } else {
      message = `Pushed ${currentBranch} to GitHub`;
    }

    return NextResponse.json({
      success: true,
      message,
      branch: currentBranch,
      alreadyUpToDate: false,
      didCommit,
      committedFiles,
    });
  } catch (error) {
    console.error('Push error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
