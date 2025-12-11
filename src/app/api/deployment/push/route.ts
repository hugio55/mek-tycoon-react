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

    // Push to origin
    const { stdout: pushOutput, stderr: pushStderr } = await execAsync(
      `git push origin ${currentBranch}`
    );

    // Check if there was anything to push
    const output = pushOutput + pushStderr;
    const alreadyUpToDate = output.includes('Everything up-to-date');

    if (alreadyUpToDate) {
      return NextResponse.json({
        success: true,
        message: 'Already up to date with GitHub',
        alreadyUpToDate: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Pushed ${currentBranch} to GitHub`,
      branch: currentBranch,
      alreadyUpToDate: false,
    });
  } catch (error) {
    console.error('Push error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
