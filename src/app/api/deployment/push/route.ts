import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { checkDeploymentAuth } from '@/lib/deployment/auth';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  const authError = checkDeploymentAuth(request);
  if (authError) return authError;

  try {
    // Get current branch
    const { stdout: branchOutput } = await execAsync('git branch --show-current');
    const currentBranch = branchOutput.trim();

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
