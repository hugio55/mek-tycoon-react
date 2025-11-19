'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function RouteVisualization() {
  const siteSettings = useQuery(api.siteSettings.getSiteSettings);

  // Current routing configuration (hardcoded for now based on our setup)
  const routingConfig = {
    landingToggleEnabled: false, // We disabled this in RootPageController
    actualBehavior: 'Always show landing-v2',
  };

  const routes = [
    {
      url: '/',
      name: 'Root',
      description: 'Main entry point',
      behavior: 'Always shows landing-v2 (toggle disabled for safety)',
      component: 'RootPageController → landing-v2',
      canAccess: true,
      color: 'green'
    },
    {
      url: '/landing-v2',
      name: 'Landing Page',
      description: 'Marketing/splash page',
      behavior: 'Directly accessible',
      component: 'landing-v2/page.tsx',
      canAccess: true,
      color: 'green'
    },
    {
      url: '/home',
      name: 'Game Interface',
      description: 'Triangle, gold, Mek management',
      behavior: 'CODE EXISTS but never linked/accessible (safe from accidental access)',
      component: 'home/page.tsx',
      canAccess: false,
      color: 'red'
    },
    {
      url: '/mech-rate-logging',
      name: 'Legacy Route',
      description: 'Old URL',
      behavior: 'Redirects to root (/) → landing-v2',
      component: 'Redirect',
      canAccess: true,
      color: 'yellow'
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
            <span className="text-gray-400">Landing Page Toggle (in code):</span>
            <span className="px-2 py-1 bg-red-900/30 text-red-400 border border-red-700 rounded text-xs font-bold">
              DISABLED
            </span>
            <span className="text-gray-500 text-xs">(Hardcoded to always show landing)</span>
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
            <span className="text-gray-500 text-xs">(Currently ignored by code)</span>
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
          {/* User visits root */}
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-blue-900/30 border border-blue-500 rounded text-blue-300 font-mono text-sm">
              User visits: <span className="text-yellow-400">/</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="px-4 py-2 bg-green-900/30 border border-green-500 rounded text-green-300 text-sm">
              Shows: Landing-v2
            </div>
          </div>

          {/* User visits mech-rate-logging */}
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-blue-900/30 border border-blue-500 rounded text-blue-300 font-mono text-sm">
              User visits: <span className="text-yellow-400">/mech-rate-logging</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="px-4 py-2 bg-yellow-900/30 border border-yellow-500 rounded text-yellow-300 text-sm">
              Redirects to: /
            </div>
            <div className="text-gray-400">→</div>
            <div className="px-4 py-2 bg-green-900/30 border border-green-500 rounded text-green-300 text-sm">
              Shows: Landing-v2
            </div>
          </div>

          {/* User visits home */}
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-blue-900/30 border border-blue-500 rounded text-blue-300 font-mono text-sm">
              User visits: <span className="text-yellow-400">/home</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="px-4 py-2 bg-green-900/30 border border-green-500 rounded text-green-300 text-sm">
              Shows: Game Interface
            </div>
            <div className="px-3 py-1 bg-orange-900/30 border border-orange-500 rounded text-orange-300 text-xs">
              ⚠️ ACCESSIBLE (no redirect)
            </div>
          </div>

          {/* User visits landing-v2 */}
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-blue-900/30 border border-blue-500 rounded text-blue-300 font-mono text-sm">
              User visits: <span className="text-yellow-400">/landing-v2</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="px-4 py-2 bg-green-900/30 border border-green-500 rounded text-green-300 text-sm">
              Shows: Landing-v2
            </div>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="mt-6 p-4 bg-orange-900/30 border-2 border-orange-500 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="text-orange-400 font-bold text-lg mb-2">Current Protection Status</div>
            <div className="text-orange-200 text-sm space-y-1">
              <p>✓ Root (/) is safe - always shows landing-v2</p>
              <p>✓ Landing page toggle is disabled in code</p>
              <p>⚠️ <strong>/home is still accessible if someone types the URL directly</strong></p>
              <p className="mt-2 text-xs text-orange-300/70">
                Note: As long as you don't link to /home from anywhere, users won't find it.
                If you need stronger protection, we can add a redirect to /home as well.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
