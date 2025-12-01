'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function RouteVisualization() {
  const siteSettings = useQuery(api.siteSettings.getSiteSettings);

  // Current routing configuration (hardcoded for now based on our setup)
  const routingConfig = {
    landingToggleEnabled: true, // Hardcoded in middleware.ts
    actualBehavior: 'Landing page enabled - all game routes redirect to /',
    middlewareActive: true, // Global middleware protection is active
  };

  const routes = [
    {
      url: '/',
      name: 'Root',
      description: 'Main entry point',
      behavior: 'Shows landing-v2 (public)',
      component: 'RootPageController → landing-v2',
      canAccess: true,
      color: 'green'
    },
    {
      url: '/landing-v2',
      name: 'Landing Page',
      description: 'Marketing/splash page',
      behavior: 'Directly accessible (public)',
      component: 'landing-v2/page.tsx',
      canAccess: true,
      color: 'green'
    },
    {
      url: '/home, /profile, /shop, /crafting, /essence, /achievements, etc.',
      name: 'All Game Routes',
      description: 'Game interface, profile, shop, crafting, and all other game pages',
      behavior: 'Protected by middleware → redirects to /',
      component: 'Multiple game pages',
      canAccess: false,
      color: 'red'
    },
    {
      url: '/admin-*',
      name: 'Admin Routes',
      description: 'Admin control panel',
      behavior: 'Always accessible (admin only)',
      component: 'admin-*/page.tsx',
      canAccess: true,
      color: 'green'
    },
    {
      url: '/api/*',
      name: 'API Routes',
      description: 'Backend endpoints',
      behavior: 'Always accessible',
      component: 'api/*',
      canAccess: true,
      color: 'green'
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-yellow-400 mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          Route Configuration
        </h2>
        <p className="text-gray-400 text-sm">
          Visual overview of how URLs are routed and which pages are accessible
        </p>
      </div>

      {/* Current Status */}
      <div className="mb-6 p-4 bg-blue-900/20 border-2 border-blue-500/50 rounded-lg">
        <h3 className="text-lg font-bold text-blue-300 mb-3">Current Configuration</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Middleware Protection:</span>
            <span className="px-2 py-1 bg-green-900/30 text-green-400 border border-green-700 rounded text-xs font-bold">
              ACTIVE
            </span>
            <span className="text-gray-500 text-xs">(Global route protection enabled)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Landing Page Toggle (middleware):</span>
            <span className="px-2 py-1 bg-green-900/30 text-green-400 border border-green-700 rounded text-xs font-bold">
              ENABLED
            </span>
            <span className="text-gray-500 text-xs">(Hardcoded in middleware.ts)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Database Toggle Value:</span>
            <span className={`px-2 py-1 border rounded text-xs font-bold ${
              siteSettings?.landingPageEnabled
                ? 'bg-green-900/30 text-green-400 border-green-700'
                : 'bg-gray-900/30 text-gray-400 border-gray-700'
            }`}>
              {siteSettings?.landingPageEnabled ? 'ENABLED' : 'DISABLED'}
            </span>
            <span className="text-gray-500 text-xs">(Future: will control middleware)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Actual Behavior:</span>
            <span className="text-yellow-400 font-bold">{routingConfig.actualBehavior}</span>
          </div>
        </div>
      </div>

      {/* Routes Table */}
      <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800">
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">URL</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Current Behavior</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {routes.map((route) => (
              <tr key={route.url} className="hover:bg-gray-800/30">
                <td className="px-4 py-3">
                  <div className="font-mono text-sm text-yellow-400">{route.url}</div>
                  <div className="text-xs text-gray-500">{route.name}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-300">{route.description}</div>
                  <div className="text-xs text-gray-500 mt-1">{route.component}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-200">{route.behavior}</div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    route.color === 'green'
                      ? 'bg-green-900/30 text-green-400 border border-green-700'
                      : route.color === 'red'
                      ? 'bg-red-900/30 text-red-400 border border-red-700'
                      : 'bg-yellow-900/30 text-yellow-400 border border-yellow-700'
                  }`}>
                    {route.canAccess ? '✓ Public' : '✗ Hidden'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visual Flow Diagram */}
      <div className="mt-6 p-6 bg-gray-900/50 rounded-lg border border-gray-700">
        <h3 className="text-lg font-bold text-yellow-400 mb-4">User Flow Diagram</h3>
        <div className="space-y-4">
          {/* User visits landing */}
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-blue-900/30 border border-blue-500 rounded text-blue-300 font-mono text-sm">
              User visits: <span className="text-yellow-400">/ or /landing-v2</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="px-4 py-2 bg-green-900/30 border border-green-500 rounded text-green-300 text-sm">
              ✓ Shows: Landing-v2
            </div>
          </div>

          {/* User visits any game route */}
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-blue-900/30 border border-blue-500 rounded text-blue-300 font-mono text-sm">
              User visits: <span className="text-yellow-400">ANY game route</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="px-4 py-2 bg-purple-900/30 border border-purple-500 rounded text-purple-300 text-sm">
              🛡️ Middleware intercepts
            </div>
            <div className="text-gray-400">→</div>
            <div className="px-4 py-2 bg-yellow-900/30 border border-yellow-500 rounded text-yellow-300 text-sm">
              ↪️ Redirects to: /
            </div>
            <div className="text-gray-400">→</div>
            <div className="px-4 py-2 bg-green-900/30 border border-green-500 rounded text-green-300 text-sm">
              ✓ Shows: Landing-v2
            </div>
          </div>

          {/* User visits admin */}
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-blue-900/30 border border-blue-500 rounded text-blue-300 font-mono text-sm">
              User visits: <span className="text-yellow-400">/admin-*</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="px-4 py-2 bg-green-900/30 border border-green-500 rounded text-green-300 text-sm">
              ✓ Allowed through (admin access)
            </div>
          </div>
        </div>
      </div>

      {/* Protection Status */}
      <div className="mt-6 p-4 bg-green-900/30 border-2 border-green-500 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <div className="text-green-400 font-bold text-lg mb-2">Full Protection Active</div>
            <div className="text-green-200 text-sm space-y-1">
              <p>✓ <strong>Middleware protection active</strong> - All game routes are protected</p>
              <p>✓ <strong>Landing page enabled</strong> - All non-admin routes redirect to /</p>
              <p>✓ <strong>No game routes accessible</strong> - Typing URLs directly will redirect</p>
              <p>✓ <strong>Admin routes protected</strong> - Only admin users can access /admin-*</p>
              <p className="mt-2 text-xs text-green-300/70">
                Middleware runs BEFORE every page load, intercepting all requests globally.
                When you're ready to launch the game, change LANDING_PAGE_ENABLED to false in middleware.ts
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
