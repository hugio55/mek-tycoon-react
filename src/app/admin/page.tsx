"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import PowerSwitchToggle from "@/components/controls/PowerSwitchToggle";

const BYPASS_SECRET = 'mektycoon2025';
const PRODUCTION_URL = 'https://mek.overexposed.io';

const BYPASS_LINKS = [
  { name: 'Landing Page', path: '/' },
  { name: 'Home (Hub)', path: '/home' },
  { name: 'Profile', path: '/profile' },
  { name: 'Contracts', path: '/contracts' },
  { name: 'NFT Phases', path: '/landing-v2' },
  { name: 'Marketplace', path: '/marketplace' },
  { name: 'Leaderboard', path: '/leaderboard' },
  { name: 'Admin Panel', path: '/admin' },
];

export default function AdminPage() {
  const router = useRouter();
  const [showBypassLinks, setShowBypassLinks] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Query site settings
  const siteSettings = useQuery(api.siteSettings.getSiteSettings);
  const toggleLandingPage = useMutation(api.siteSettings.toggleLandingPage);
  const toggleIgnoreLocalhostRule = useMutation(api.siteSettings.toggleIgnoreLocalhostRule);
  
  const adminTools = [
    {
      id: 'save-system',
      title: 'Save System Manager',
      description: 'Manage player saves and backups',
      icon: '💾',
      route: '/admin-save',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'mek-editor',
      title: 'Mek Database Editor',
      description: 'Edit and manage Mek stats and attributes',
      icon: '🤖',
      route: '/admin/mek-editor',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'balance',
      title: 'Game Balance Tools',
      description: 'Adjust economy and difficulty settings',
      icon: '⚖️',
      route: '/admin/balance',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'analytics',
      title: 'Player Analytics',
      description: 'View player statistics and behavior',
      icon: '📊',
      route: '/admin/analytics',
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      id: 'events',
      title: 'Event Manager',
      description: 'Create and schedule special events',
      icon: '🎉',
      route: '/admin/events',
      color: 'from-pink-500 to-pink-600'
    },
    {
      id: 'story-tree',
      title: 'Story Tree Builder',
      description: 'Design and manage story mode node trees',
      icon: '🌳',
      route: '/admin-story-tree',
      color: 'from-amber-500 to-orange-600'
    },
    {
      id: 'components',
      title: 'Component Showcase',
      description: 'Interactive UI components and toggle switches',
      icon: '🎨',
      route: '/admin-components-showcase',
      color: 'from-yellow-500 to-yellow-600'
    }
  ];
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-50" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 35px,
                rgba(250, 182, 23, 0.03) 35px,
                rgba(250, 182, 23, 0.03) 70px
              )
            `,
          }}
        />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Admin Control Panel
            </span>
          </h1>
          <p className="text-gray-400 text-lg">System administration and development tools</p>
        </div>
        
        {/* Top Buttons Row */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => router.push('/hub')}
            className="px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-yellow-400 rounded-lg transition-all text-gray-400 hover:text-white group"
          >
            <span className="mr-2 group-hover:translate-x--1 inline-block transition-transform">←</span>
            Back to Game
          </button>

          <button
            onClick={() => setShowBypassLinks(true)}
            className="px-6 py-3 bg-blue-900/50 hover:bg-blue-800/50 border border-blue-600 hover:border-blue-400 rounded-lg transition-all text-blue-300 hover:text-white"
          >
            🔗 Production Bypass Links
          </button>
        </div>

        {/* Landing Page Toggle Section */}
        <div className="mb-8 bg-gray-900/50 border-2 border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between gap-8">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-yellow-400 mb-2">
                Landing Page Toggle
              </h3>
              <p className="text-gray-400 text-sm mb-1">
                Control what visitors see at the root domain (/)
              </p>
              <div className="text-xs text-gray-500">
                <span className="font-semibold text-gray-400">OFF:</span> Shows game interface (redirects to /home)<br />
                <span className="font-semibold text-gray-400">ON:</span> Shows marketing landing page<br />
                <span className="font-semibold text-yellow-400">Note:</span> Localhost bypasses landing page by default (use toggle below to override)
              </div>

              {/* Localhost Override Toggle */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-blue-300">Ignore Localhost Rule</label>
                  <input
                    type="checkbox"
                    checked={siteSettings?.ignoreLocalhostRule ?? false}
                    onChange={async (e) => {
                      await toggleIgnoreLocalhostRule({ enabled: e.target.checked });
                    }}
                    className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span className={`text-xs font-bold ${siteSettings?.ignoreLocalhostRule ? 'text-blue-400' : 'text-gray-500'}`}>
                    {siteSettings?.ignoreLocalhostRule ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-1">
                  When enabled, localhost will show landing page (for testing)
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <PowerSwitchToggle
                checked={siteSettings?.landingPageEnabled ?? false}
                onChange={async (enabled) => {
                  await toggleLandingPage({ enabled });
                }}
                className="w-32 h-32"
              />
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Status</div>
                <div className={`text-sm font-bold ${siteSettings?.landingPageEnabled ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {siteSettings?.landingPageEnabled ? 'LANDING PAGE' : 'GAME INTERFACE'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Admin Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminTools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => router.push(tool.route)}
              className="group cursor-pointer"
            >
              <div className="relative bg-gray-900/50 border border-gray-800 rounded-xl p-6 transition-all duration-300 hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-400/10 hover:translate-y--1">
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`} />
                
                {/* Content */}
                <div className="relative">
                  {/* Icon */}
                  <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {tool.icon}
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                    {tool.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-400 text-sm">
                    {tool.description}
                  </p>
                  
                  {/* Arrow Icon */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Warning Section */}
        <div className="mt-12 p-6 bg-red-900/20 border border-red-800/50 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="text-2xl">⚠️</div>
            <div>
              <h4 className="text-red-400 font-bold mb-2">Admin Access Warning</h4>
              <p className="text-gray-400 text-sm">
                These tools can modify game data and affect player experience. Use with caution and always backup data before making changes.
              </p>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-800">
            <div className="text-gray-400 text-xs uppercase mb-1">Environment</div>
            <div className="text-yellow-400 font-bold">Development</div>
          </div>
          <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-800">
            <div className="text-gray-400 text-xs uppercase mb-1">Version</div>
            <div className="text-yellow-400 font-bold">0.1.0</div>
          </div>
          <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-800">
            <div className="text-gray-400 text-xs uppercase mb-1">Database</div>
            <div className="text-yellow-400 font-bold">Convex</div>
          </div>
          <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-800">
            <div className="text-gray-400 text-xs uppercase mb-1">Status</div>
            <div className="text-green-400 font-bold">Active</div>
          </div>
        </div>
      </div>

      {/* Production Bypass Links Lightbox */}
      {showBypassLinks && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowBypassLinks(false)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Production Bypass Links</h2>
              <button
                onClick={() => setShowBypassLinks(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Click the copy icon to copy URL with bypass parameter
            </p>
            <div className="space-y-2">
              {BYPASS_LINKS.map((link) => {
                const fullUrl = `${PRODUCTION_URL}${link.path}?bypass=${BYPASS_SECRET}`;
                return (
                  <div
                    key={link.path}
                    className="flex items-center justify-between bg-gray-800 rounded px-3 py-2"
                  >
                    <div>
                      <div className="text-white font-medium">{link.name}</div>
                      <div className="text-gray-500 text-xs truncate max-w-[300px]">{fullUrl}</div>
                    </div>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(fullUrl);
                        setCopiedUrl(link.path);
                        setTimeout(() => setCopiedUrl(null), 2000);
                      }}
                      className="ml-2 p-2 hover:bg-gray-700 rounded transition-colors"
                      title="Copy URL"
                    >
                      {copiedUrl === link.path ? (
                        <span className="text-green-400 text-sm">Copied!</span>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-400 hover:text-white">
                          <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}