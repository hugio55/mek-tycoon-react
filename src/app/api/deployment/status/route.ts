import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { checkDeploymentAuth } from '@/lib/deployment/auth';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  const authError = checkDeploymentAuth(request);
  if (authError) return authError;

  try {
    // Get current branch
    const { stdout: branchOutput } = await execAsync('git branch --show-current');
    const currentBranch = branchOutput.trim();

    // Get git status (uncommitted changes)
    const { stdout: statusOutput } = await execAsync('git status --porcelain');
    const uncommittedChanges = statusOutput.trim().split('\n').filter(line => line.trim()).length;
    const hasUncommittedChanges = uncommittedChanges > 0;

    // Get list of changed files
    const changedFiles = statusOutput.trim().split('\n')
      .filter(line => line.trim())
      .map(line => ({
        status: line.substring(0, 2).trim(),
        file: line.substring(3)
      }));

    // Check if local is ahead of remote
    let commitsAhead = 0;
    let commitsBehind = 0;
    try {
      await execAsync('git fetch origin --quiet');
      const { stdout: aheadBehind } = await execAsync(
        `git rev-list --left-right --count ${currentBranch}...origin/${currentBranch}`
      );
      const [ahead, behind] = aheadBehind.trim().split('\t').map(Number);
      commitsAhead = ahead || 0;
      commitsBehind = behind || 0;
    } catch (e) {
      // Branch might not have upstream tracking
    }

    // Get recent commits
    const { stdout: logOutput } = await execAsync(
      'git log --oneline -10 --format="%h|%s|%cr"'
    );
    const recentCommits = logOutput.trim().split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [hash, message, timeAgo] = line.split('|');
        return { hash, message, timeAgo };
      });

    // Get last commit info
    const { stdout: lastCommitOutput } = await execAsync(
      'git log -1 --format="%h|%s|%ci"'
    );
    const [lastHash, lastMessage, lastDate] = lastCommitOutput.trim().split('|');

    return NextResponse.json({
      success: true,
      data: {
        currentBranch,
        hasUncommittedChanges,
        uncommittedChanges,
        changedFiles,
        commitsAhead,
        commitsBehind,
        recentCommits,
        lastCommit: {
          hash: lastHash,
          message: lastMessage,
          date: lastDate
        }
      }
    });
  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
