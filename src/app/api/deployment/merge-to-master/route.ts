import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { checkDeploymentAuth } from '@/lib/deployment/auth';

const execAsync = promisify(exec);

/**
 * Push current branch directly to origin/master WITHOUT switching branches locally.
 * This prevents the dev server from crashing when the working directory changes.
 *
 * Uses: git push origin <current-branch>:master --force
 * This pushes the local branch to the remote master branch directly.
 */
export async function POST(request: NextRequest) {
  const authError = checkDeploymentAuth(request);
  if (authError) return authError;

  try {
    // Get current branch
    const { stdout: branchOutput } = await execAsync('git branch --show-current');
    const currentBranch = branchOutput.trim();

    if (currentBranch === 'master') {
      // If we're already on master, just push normally
      const { stdout: pushOutput, stderr: pushStderr } = await execAsync(
        'git push origin master',
        { timeout: 120000 }
      );

      const output = pushOutput + pushStderr;
      const alreadyUpToDate = output.includes('Everything up-to-date');

      return NextResponse.json({
        success: true,
        message: alreadyUpToDate
          ? 'Master already up to date with GitHub'
          : 'Pushed master to GitHub - Vercel production deployment triggered',
        alreadyOnMaster: true,
        alreadyUpToDate,
      });
    }

    // Push current branch directly to origin/master (without switching branches locally)
    // This is the key change - we never checkout master, so dev server stays running
    const { stdout: pushOutput, stderr: pushStderr } = await execAsync(
      `git push origin ${currentBranch}:master --force`,
      { timeout: 120000 } // 2 minute timeout
    );

    const output = pushOutput + pushStderr;
    const alreadyUpToDate = output.includes('Everything up-to-date');

    // Sync local master to match origin/master (prevents stale local branch confusion)
    await execAsync('git fetch origin master:master', { timeout: 30000 });

    return NextResponse.json({
      success: true,
      message: alreadyUpToDate
        ? `origin/master already matches ${currentBranch}`
        : `Pushed ${currentBranch} to origin/master - Vercel production deployment triggered`,
      previousBranch: currentBranch,
      alreadyUpToDate,
      localMasterSynced: true,
      method: 'direct-push', // Indicates we used the new method
    });
  } catch (error: any) {
    console.error('Push to master error:', error);

    // Extract useful error info
    const errorMessage = error.message || 'Push failed';
    const stderr = error.stderr || '';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: stderr.substring(0, 500), // Include some stderr for debugging
      },
      { status: 500 }
    );
  }
}
