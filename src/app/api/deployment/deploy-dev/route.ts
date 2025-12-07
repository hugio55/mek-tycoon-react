import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { checkDeploymentAuth } from '@/lib/deployment/auth';

const execAsync = promisify(exec);

/**
 * deploy-dev route - DUAL DATABASE MODE
 *
 * Deploys to Trout (wry-trout-962) - the STAGING/DEV database.
 * This is safe for testing and development.
 */

export async function POST(request: NextRequest) {
  const authError = checkDeploymentAuth(request);
  if (authError) return authError;

  try {
    // Deploy to Trout (dev database)
    // NEXT_PUBLIC_CONVEX_URL points to wry-trout-962 (staging)
    const troutUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!troutUrl) {
      return NextResponse.json({
        success: false,
        error: 'NEXT_PUBLIC_CONVEX_URL not configured',
      }, { status: 500 });
    }

    // Verify we're deploying to Trout, not Sturgeon
    if (troutUrl.includes('sturgeon')) {
      return NextResponse.json({
        success: false,
        error: 'NEXT_PUBLIC_CONVEX_URL appears to be production (Sturgeon). Use deploy-prod route instead.',
      }, { status: 400 });
    }

    const { stdout, stderr } = await execAsync(
      `npx convex deploy --url "${troutUrl}" --yes --typecheck=disable`,
      {
        timeout: 120000, // 2 minute timeout
        env: {
          ...process.env,
          CONVEX_URL: troutUrl
        }
      }
    );

    const output = stdout + stderr;

    // Check for success indicators
    const success = output.includes('Deployed') ||
                   output.includes('deployed') ||
                   !output.includes('Error');

    return NextResponse.json({
      success,
      message: success ? 'Deployed to Trout (STAGING database)' : 'Deployment may have failed',
      output: output.substring(0, 1000), // Limit output size
      database: 'Trout (wry-trout-962)',
      isProduction: false,
    });
  } catch (error) {
    console.error('Dev deploy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        database: 'Trout (wry-trout-962)',
        isProduction: false
      },
      { status: 500 }
    );
  }
}
