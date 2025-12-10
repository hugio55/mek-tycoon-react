'use client';

import { useState, useEffect } from 'react';
import { api } from '@/convex/_generated/api';
import { useDatabaseContext } from '@/contexts/DatabaseContext';

interface BetaSignup {
  _id: string;
  stakeAddress: string;
  submittedAt: number;
  ipAddress?: string | null;
}

export default function BetaSignupsViewer() {
  const { client, selectedDatabase } = useDatabaseContext();
  const [signups, setSignups] = useState<BetaSignup[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Debug logging
  console.log('[🎮BETA-VIEWER] Context:', { hasClient: !!client, selectedDatabase });

  // Fetch signups from the selected database
  useEffect(() => {
    console.log('[🎮BETA-VIEWER] useEffect triggered:', { hasClient: !!client, selectedDatabase });
    if (!client) {
      console.log('[🎮BETA-VIEWER] No client available, skipping fetch');
      return;
    }

    let cancelled = false;

    const fetchSignups = async () => {
      console.log('[🎮BETA-VIEWER] Fetching signups from:', selectedDatabase);
      try {
        const data = await client.query(api.betaSignups.getAllBetaSignups, {});
        console.log('[🎮BETA-VIEWER] Received data:', { count: data?.length || 0, data });
        if (!cancelled) {
          setSignups(data || []);
          setLoading(false);
        }
      } catch (error) {
        console.error('[🎮BETA-VIEWER] Error fetching signups:', error);
        if (!cancelled) {
          setSignups([]);
          setLoading(false);
        }
      }
    };

    fetchSignups();
    const interval = setInterval(fetchSignups, 5000); // Refresh every 5 seconds

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [client, selectedDatabase]);

  if (loading || !signups) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white/70 text-lg">Loading beta signups from {selectedDatabase}...</div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-lg text-white/90">
          Total Signups: <span className="text-yellow-400 font-bold">{signups.length}</span>
        </div>
        {signups.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                const addresses = signups.map((s) => s.stakeAddress).join('\n');
                navigator.clipboard.writeText(addresses);
                alert('All stake addresses copied to clipboard!');
              }}
              className="px-4 py-2 bg-yellow-500/90 text-black font-semibold rounded hover:bg-yellow-400 transition-colors text-sm"
            >
              Copy All Addresses
            </button>
            <button
              onClick={() => {
                const csv = [
                  'Stake Address,Submitted At',
                  ...signups.map((s) => `${s.stakeAddress},${formatDate(s.submittedAt)}`)
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `beta-signups-${Date.now()}.csv`;
                a.click();
              }}
              className="px-4 py-2 bg-white/10 text-white font-semibold rounded hover:bg-white/20 transition-colors border border-white/20 text-sm"
            >
              Export CSV
            </button>
          </div>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                Stake Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                Submitted At
              </th>
            </tr>
          </thead>
          <tbody>
            {signups.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-white/50">
                  No signups yet
                </td>
              </tr>
            ) : (
              signups.map((signup, index) => (
                <tr
                  key={signup._id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-3 text-sm text-white/70">
                    {index + 1}
                  </td>
                  <td className="px-6 py-3 font-mono text-sm text-white/90">
                    {signup.stakeAddress}
                  </td>
                  <td className="px-6 py-3 text-sm text-white/70">
                    {formatDate(signup.submittedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
