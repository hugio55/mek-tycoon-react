import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { checkDeploymentAuth } from '@/lib/deployment/auth';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  const authError = checkDeploymentAuth(request);
  if (authError) return authError;

  try {
    const { branch } = await request.json();

    if (!branch) {
      return NextResponse.json({
        success: false,
        error: 'Branch name is required',
      }, { status: 400 });
    }

    // Switch to the specified branch
    await execAsync(`git checkout ${branch}`);

    return NextResponse.json({
      success: true,
      message: `Switched to ${branch}`,
      branch,
    });
  } catch (error) {
    console.error('Switch branch error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
