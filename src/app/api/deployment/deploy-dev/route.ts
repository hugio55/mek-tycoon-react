import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Deploy to Trout (dev database)
    // This uses the default CONVEX_URL from .env.local which points to Trout
    const { stdout, stderr } = await execAsync('npx convex deploy', {
      timeout: 120000, // 2 minute timeout
      env: {
        ...process.env,
        // Ensure we're using the dev URL
        CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL
      }
    });

    const output = stdout + stderr;

    // Check for success indicators
    const success = output.includes('Deployed') ||
                   output.includes('deployed') ||
                   !output.includes('Error');

    return NextResponse.json({
      success,
      message: success ? 'Deployed to Trout (dev database)' : 'Deployment may have failed',
      output: output.substring(0, 1000), // Limit output size
      database: 'Trout (wry-trout-962)',
    });
  } catch (error) {
    console.error('Dev deploy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        database: 'Trout (wry-trout-962)'
      },
      { status: 500 }
    );
  }
}
