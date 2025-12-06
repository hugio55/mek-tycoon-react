import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { checkDeploymentAuth } from '@/lib/deployment/auth';
import path from 'path';

const execAsync = promisify(exec);

// Paths for rclone and public folder
const RCLONE_PATH = 'C:\\Users\\Ben Meyers\\Tools\\rclone.exe';
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const R2_BUCKET = 'r2:mek-tycoon-2';

export async function POST(request: NextRequest) {
  const authError = checkDeploymentAuth(request);
  if (authError) return authError;

  try {
    console.log('[R2-SYNC] Starting sync...');
    console.log('[R2-SYNC] Public dir:', PUBLIC_DIR);
    console.log('[R2-SYNC] R2 bucket:', R2_BUCKET);

    // Run rclone sync
    const command = `"${RCLONE_PATH}" sync "${PUBLIC_DIR}" ${R2_BUCKET} --progress --transfers 8`;
    console.log('[R2-SYNC] Command:', command);

    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large output
      timeout: 300000, // 5 minute timeout
    });

    const output = stdout + stderr;
    console.log('[R2-SYNC] Output:', output.substring(0, 500));

    // Parse some stats from the output if available
    const transferredMatch = output.match(/Transferred:\s+(\d+)/);
    const filesTransferred = transferredMatch ? transferredMatch[1] : 'unknown';

    return NextResponse.json({
      success: true,
      message: `R2 sync completed. Files transferred: ${filesTransferred}`,
      details: output.substring(0, 1000), // First 1000 chars of output
    });
  } catch (error) {
    console.error('[R2-SYNC] Error:', error);

    // Check if it's a timeout error
    if (error instanceof Error && error.message.includes('ETIMEDOUT')) {
      return NextResponse.json(
        { success: false, error: 'Sync timed out. Try running sync-to-r2.bat manually for large syncs.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
