import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

/**
 * Site Config API
 * Provides site settings for middleware to check without direct database access
 * Used by middleware to determine:
 * - Landing page enabled/disabled
 * - Localhost bypass enabled/disabled
 * - Maintenance mode enabled/disabled
 */

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  try {
    // Query site settings from Convex
    const settings = await convex.query(api.siteSettings.getSiteSettings);

    return NextResponse.json({
      success: true,
      settings: {
        landingPageEnabled: settings.landingPageEnabled ?? true,
        localhostBypass: settings.localhostBypass ?? true,
        maintenanceMode: settings.maintenanceMode ?? false,
      },
      timestamp: Date.now()
    }, {
      headers: {
        // Cache for 10 seconds to reduce database load
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=30'
      }
    });
  } catch (error) {
    console.error('[🗺️SITE-CONFIG-API] Error fetching settings:', error);

    // Return safe defaults if database is unreachable
    return NextResponse.json({
      success: false,
      settings: {
        landingPageEnabled: true, // Safe default: show landing page
        localhostBypass: true, // Safe default: allow dev work
        maintenanceMode: false, // Safe default: not in maintenance
      },
      error: String(error),
      timestamp: Date.now()
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
  }
}
