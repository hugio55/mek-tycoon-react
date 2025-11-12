'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function AdminBetaSignups() {
  const signups = useQuery(api.betaSignups.getAllBetaSignups);

  if (!signups) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading beta signups...</div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Calculate IP statistics
  const ipCounts = signups.reduce((acc, signup) => {
    const ip = signup.ipAddress || 'unknown';
    acc[ip] = (acc[ip] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const uniqueIPs = Object.keys(ipCounts).filter(ip => ip !== 'unknown').length;
  const duplicateIPs = Object.entries(ipCounts).filter(([ip, count]) => count > 1 && ip !== 'unknown');

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-yellow-400">
          Beta Signups
        </h1>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-sm text-white/60 mb-1">Total Signups</div>
            <div className="text-3xl font-bold text-yellow-400">{signups.length}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-sm text-white/60 mb-1">Unique IPs</div>
            <div className="text-3xl font-bold text-green-400">{uniqueIPs}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-sm text-white/60 mb-1">Duplicate IPs</div>
            <div className="text-3xl font-bold text-red-400">{duplicateIPs.length}</div>
          </div>
        </div>

        {duplicateIPs.length > 0 && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="text-sm font-semibold text-red-400 mb-2">⚠️ IP Addresses with Multiple Signups:</div>
            <div className="space-y-1 text-sm">
              {duplicateIPs.map(([ip, count]) => (
                <div key={ip} className="text-white/70">
                  <span className="font-mono text-red-300">{ip}</span> - <span className="text-red-400">{count} signups</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-400">
                  #
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-400">
                  Stake Address
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-400">
                  IP Address
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-400">
                  Submitted At
                </th>
              </tr>
            </thead>
            <tbody>
              {signups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-white/50">
                    No signups yet
                  </td>
                </tr>
              ) : (
                signups.map((signup, index) => (
                  <tr
                    key={signup._id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-white/70">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">
                      {signup.stakeAddress}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-white/70">
                      {signup.ipAddress || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/70">
                      {formatDate(signup.submittedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {signups.length > 0 && (
          <div className="mt-6 space-y-4">
            <button
              onClick={() => {
                const addresses = signups.map(s => s.stakeAddress).join('\n');
                navigator.clipboard.writeText(addresses);
                alert('All stake addresses copied to clipboard!');
              }}
              className="px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Copy All Addresses
            </button>

            <button
              onClick={() => {
                const csv = [
                  'Stake Address,IP Address,Submitted At',
                  ...signups.map(s => `${s.stakeAddress},${s.ipAddress || 'N/A'},${formatDate(s.submittedAt)}`)
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `beta-signups-${Date.now()}.csv`;
                a.click();
              }}
              className="ml-4 px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              Export CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
