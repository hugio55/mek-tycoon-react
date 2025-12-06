import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { checkDeploymentAuth } from '@/lib/deployment/auth';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  const authError = checkDeploymentAuth(request);
  if (authError) return authError;

  try {
    // Deploy to Sturgeon (single database mode)
    // NEXT_PUBLIC_CONVEX_URL points to fabulous-sturgeon-691 (production)
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
      message: success ? 'Deployed to Sturgeon (production)' : 'Deployment may have failed',
      output: output.substring(0, 1000), // Limit output size
      database: 'Sturgeon (fabulous-sturgeon-691)',
    });
  } catch (error) {
    console.error('Deploy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        database: 'Sturgeon (fabulous-sturgeon-691)'
      },
      { status: 500 }
    );
  }
}
