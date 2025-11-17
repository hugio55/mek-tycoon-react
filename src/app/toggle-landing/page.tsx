'use client';

import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function ToggleLandingPage() {
  const siteSettings = useQuery(api.siteSettings.getSiteSettings);
  const toggleLanding = useMutation(api.siteSettings.toggleLandingPage);

  const handleToggle = async (enabled: boolean) => {
    await toggleLanding({ enabled });
    alert(`Landing page ${enabled ? 'enabled' : 'disabled'}!`);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-gray-900 rounded-lg p-8 border border-yellow-500">
        <h1 className="text-2xl font-bold text-yellow-400 mb-4">Site Settings Toggle</h1>

        <div className="mb-6">
          <p className="text-gray-300 mb-2">Current Status:</p>
          <p className="text-xl font-mono">
            Landing Page: {siteSettings?.landingPageEnabled ?
              <span className="text-green-400">ENABLED ✓</span> :
              <span className="text-red-400">DISABLED ✗</span>
            }
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => handleToggle(true)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded"
          >
            Enable Landing Page
          </button>
          <button
            onClick={() => handleToggle(false)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded"
          >
            Disable Landing Page
          </button>
        </div>

        <p className="text-gray-400 text-sm mt-4">
          When enabled: Root (/) shows landing page<br/>
          When disabled: Root (/) redirects to /home
        </p>
      </div>
    </div>
  );
}
