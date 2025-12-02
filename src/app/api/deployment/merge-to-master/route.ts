import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Get current branch
    const { stdout: branchOutput } = await execAsync('git branch --show-current');
    const currentBranch = branchOutput.trim();

    if (currentBranch === 'master') {
      return NextResponse.json({
        success: true,
        message: 'Already on master branch',
        alreadyOnMaster: true,
      });
    }

    // Switch to master
    await execAsync('git checkout master');

    // Merge the feature branch into master
    const { stdout: mergeOutput, stderr: mergeStderr } = await execAsync(
      `git merge ${currentBranch} --no-edit`
    );

    const output = mergeOutput + mergeStderr;

    // Check if merge was successful
    if (output.includes('Already up to date') || output.includes('Already up-to-date')) {
      return NextResponse.json({
        success: true,
        message: `Master already contains all changes from ${currentBranch}`,
        alreadyUpToDate: true,
        previousBranch: currentBranch,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Merged ${currentBranch} into master`,
      previousBranch: currentBranch,
    });
  } catch (error: any) {
    // If merge fails, try to abort and go back
    try {
      await execAsync('git merge --abort');
    } catch (e) {
      // Ignore abort errors
    }

    console.error('Merge error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Merge failed' },
      { status: 500 }
    );
  }
}
