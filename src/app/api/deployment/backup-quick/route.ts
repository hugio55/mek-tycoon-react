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

    // Ensure we're on master to get production commit
    const { stdout: branchOutput } = await execAsync('git branch --show-current');
    const currentBranch = branchOutput.trim();

    let masterCommitHash: string;
    let commitMessage: string;

    if (currentBranch === 'master') {
      // Already on master, get current commit
      const { stdout: hashOutput } = await execAsync('git rev-parse HEAD');
      masterCommitHash = hashOutput.trim();

      const { stdout: msgOutput } = await execAsync('git log -1 --format=%s');
      commitMessage = msgOutput.trim();
    } else {
      // Get master's commit without switching
      const { stdout: hashOutput } = await execAsync('git rev-parse master');
      masterCommitHash = hashOutput.trim();

      const { stdout: msgOutput } = await execAsync('git log -1 --format=%s master');
      commitMessage = msgOutput.trim();
    }

    const timestamp = Date.now();
    const backupId = `quick-${timestamp}`;

    const backupData = {
      id: backupId,
      type: 'quick' as const,
      timestamp: new Date(timestamp).toISOString(),
      commitHash: masterCommitHash,
      commitMessage: commitMessage,
      branch: 'master',
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
      commitHash: masterCommitHash,
      commitMessage: commitMessage,
      timestamp: backupData.timestamp,
      message: `Quick backup created: ${masterCommitHash.substring(0, 7)}`,
    });
  } catch (error) {
    console.error('Quick backup error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
