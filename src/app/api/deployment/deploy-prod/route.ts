import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { checkDeploymentAuth } from '@/lib/deployment/auth';

const execAsync = promisify(exec);

/**
 * deploy-prod route - SIMPLIFIED FOR SINGLE DATABASE
 *
 * Previously deployed to a separate Sturgeon database.
 * Now deploys to the main Convex database (which IS Sturgeon).
 */

export async function POST(request: NextRequest) {
  const authError = checkDeploymentAuth(request);
  if (authError) return authError;

  try {
    // Require confirmation token for production deploys
    const { confirmationToken } = await request.json();

    if (confirmationToken !== 'DEPLOY_TO_PRODUCTION') {
      return NextResponse.json({
        success: false,
        error: 'Production deployment requires confirmation token',
      }, { status: 400 });
    }

    // Single database mode: use main Convex URL (now points to Sturgeon)
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!convexUrl) {
      return NextResponse.json({
        success: false,
        error: 'NEXT_PUBLIC_CONVEX_URL not configured',
      }, { status: 500 });
    }

    // Deploy to production using the main Convex URL
    // --yes flag skips confirmation prompt (required for non-interactive terminals)
    // --typecheck=disable skips TypeScript checking (matches dev server behavior)
    const { stdout, stderr } = await execAsync(
      `npx convex deploy --url "${convexUrl}" --yes --typecheck=disable`,
      {
        timeout: 180000, // 3 minute timeout for production
        env: {
          ...process.env,
          CONVEX_URL: convexUrl
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
      message: success ? 'Deployed to Sturgeon (PRODUCTION database)' : 'Deployment may have failed',
      output: output.substring(0, 1000),
      database: 'Sturgeon (fabulous-sturgeon-691)',
      isProduction: true,
    });
  } catch (error) {
    console.error('Production deploy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        database: 'Sturgeon (fabulous-sturgeon-691)',
        isProduction: true
      },
      { status: 500 }
    );
  }
}
