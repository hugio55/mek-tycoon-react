import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LOG_FILE_PATH = path.join(process.cwd(), 'logs', 'deployment-activity.log');
const LOG_DIR = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
function ensureLogDirectory() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

// Format timestamp for log entry
function formatTimestamp(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

// Format log entry
function formatLogEntry(data: {
  action: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  gitBranch?: string;
  gitCommitHash?: string;
  details?: Record<string, unknown>;
}): string {
  const timestamp = formatTimestamp(new Date());
  const statusIcon = data.status === 'success' ? '✓' : data.status === 'error' ? '✗' : '○';

  let entry = `[${timestamp}] [${statusIcon} ${data.status.toUpperCase().padEnd(7)}] ${data.action}: ${data.message}`;

  if (data.gitBranch) {
    entry += `\n    Branch: ${data.gitBranch}`;
  }
  if (data.gitCommitHash) {
    entry += `\n    Commit: ${data.gitCommitHash}`;
  }
  if (data.details && Object.keys(data.details).length > 0) {
    entry += `\n    Details: ${JSON.stringify(data.details)}`;
  }

  return entry + '\n' + '-'.repeat(80) + '\n';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { action, status, message, gitBranch, gitCommitHash, details } = body;

    if (!action || !status || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: action, status, message' },
        { status: 400 }
      );
    }

    // Ensure log directory exists
    ensureLogDirectory();

    // Format and append log entry
    const logEntry = formatLogEntry({
      action,
      status,
      message,
      gitBranch,
      gitCommitHash,
      details,
    });

    // Append to file
    fs.appendFileSync(LOG_FILE_PATH, logEntry, 'utf8');

    return NextResponse.json({
      success: true,
      message: 'Activity logged to file',
      logPath: LOG_FILE_PATH,
    });

  } catch (error) {
    console.error('[DEPLOY-LOG] Error writing to log file:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to write log' },
      { status: 500 }
    );
  }
}

// GET endpoint to read recent log entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lines = parseInt(searchParams.get('lines') || '50');

    if (!fs.existsSync(LOG_FILE_PATH)) {
      return NextResponse.json({
        success: true,
        logs: [],
        message: 'No log file exists yet',
      });
    }

    const content = fs.readFileSync(LOG_FILE_PATH, 'utf8');
    const allLines = content.split('\n');
    const recentLines = allLines.slice(-lines).join('\n');

    return NextResponse.json({
      success: true,
      logs: recentLines,
      totalLines: allLines.length,
      logPath: LOG_FILE_PATH,
    });

  } catch (error) {
    console.error('[DEPLOY-LOG] Error reading log file:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to read log' },
      { status: 500 }
    );
  }
}
