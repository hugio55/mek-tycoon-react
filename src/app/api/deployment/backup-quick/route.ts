import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { checkDeploymentAuth } from '@/lib/deployment/auth';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  const authError = checkDeploymentAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const notes = body.notes || '';

    // Get current branch and HEAD commit (records actual working code, not stale local master)
    const { stdout: branchOutput } = await execAsync('git branch --show-current');
    const currentBranch = branchOutput.trim();

    const { stdout: hashOutput } = await execAsync('git rev-parse HEAD');
    const commitHash = hashOutput.trim();

    const { stdout: msgOutput } = await execAsync('git log -1 --format=%s');
    const commitMessage = msgOutput.trim();

    const timestamp = Date.now();
    const backupId = `quick-${timestamp}`;

    const backupData = {
      id: backupId,
      type: 'quick' as const,
      timestamp: new Date(timestamp).toISOString(),
      commitHash: commitHash,
      commitMessage: commitMessage,
      branch: currentBranch,
      notes: notes,
    };

    // Ensure backup directory exists
    const backupDir = path.join(process.cwd(), 'backups', 'quick');
    await mkdir(backupDir, { recursive: true });

    // Write backup file
    const backupPath = path.join(backupDir, `${backupId}.json`);
    await writeFile(backupPath, JSON.stringify(backupData, null, 2));

    return NextResponse.json({
      success: true,
      backupId: backupId,
      commitHash: commitHash,
      commitMessage: commitMessage,
      branch: currentBranch,
      timestamp: backupData.timestamp,
      message: `Quick backup created: ${commitHash.substring(0, 7)} (${currentBranch})`,
    });
  } catch (error) {
    console.error('Quick backup error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
