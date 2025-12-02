import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Make sure we're on master
    const { stdout: branchOutput } = await execAsync('git branch --show-current');
    const currentBranch = branchOutput.trim();

    if (currentBranch !== 'master') {
      return NextResponse.json({
        success: false,
        error: `Not on master branch (currently on ${currentBranch}). Run merge-to-master first.`,
      }, { status: 400 });
    }

    // Push master to origin
    const { stdout: pushOutput, stderr: pushStderr } = await execAsync(
      'git push origin master'
    );

    const output = pushOutput + pushStderr;
    const alreadyUpToDate = output.includes('Everything up-to-date');

    if (alreadyUpToDate) {
      return NextResponse.json({
        success: true,
        message: 'Master already up to date with GitHub',
        alreadyUpToDate: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Pushed master to GitHub - Vercel production deployment triggered',
    });
  } catch (error) {
    console.error('Push master error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
