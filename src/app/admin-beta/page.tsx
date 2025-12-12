'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface NameChangeEntry {
  previousName: string;
  newName: string;
  changedAt: number;
}

interface VeteranInfo {
  stakeAddress: string;
  originalCorporationName: string;
  reservedCorporationName: string | null;
  nameReservedAt: number | null;
  hasReservedName: boolean;
  nameChangeHistory: NameChangeEntry[];
}

export default function AdminBetaSignups() {
  const signups = useQuery(api.betaSignups.getAllBetaSignups);
  const veterans = useQuery(api.phase1Veterans.getAllVeterans);
  const deleteBetaSignup = useMutation(api.betaSignups.deleteBetaSignup);

  const [historyLightbox, setHistoryLightbox] = useState<{
    isOpen: boolean;
    veteranName: string;
    history: NameChangeEntry[];
  }>({ isOpen: false, veteranName: '', history: [] });

  // Create a map of stake address -> veteran info for quick lookup
  const veteranMap = new Map<string, VeteranInfo>();
  if (veterans) {
    veterans.forEach((v: VeteranInfo) => {
      veteranMap.set(v.stakeAddress.toLowerCase(), v);
    });
  }

  const handleDelete = async (signupId: Id<"betaSignups">, stakeAddress: string) => {
    if (confirm(`Are you sure you want to delete signup:\n${stakeAddress}?`)) {
      try {
        await deleteBetaSignup({ signupId });
      } catch (error) {
        alert('Failed to delete signup');
        console.error(error);
      }
    }
  };

  const truncateAddress = (addr: string) => {
    if (addr.length <= 20) return addr;
    return `${addr.slice(0, 12)}...${addr.slice(-8)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const openHistoryLightbox = (veteran: VeteranInfo) => {
    setHistoryLightbox({
      isOpen: true,
      veteranName: veteran.reservedCorporationName || veteran.originalCorporationName,
      history: veteran.nameChangeHistory || [],
    });
  };

  if (!signups || !veterans) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading beta signups...</div>
      </div>
    );
  }

  // Calculate IP statistics
  const ipCounts = signups.reduce((acc: Record<string, number>, signup: any) => {
    const ip = signup.ipAddress || 'unknown';
    acc[ip] = (acc[ip] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const uniqueIPs = Object.keys(ipCounts).filter((ip: string) => ip !== 'unknown').length;
  const duplicateIPs = Object.entries(ipCounts).filter(([ip, count]) => (count as number) > 1 && ip !== 'unknown');

  // Count veterans in signups
  const veteranSignups = signups.filter((s: any) => veteranMap.has(s.stakeAddress.toLowerCase())).length;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-yellow-400">
          Beta Signups
        </h1>

        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-sm text-white/60 mb-1">Total Signups</div>
            <div className="text-3xl font-bold text-yellow-400">{signups.length}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-sm text-white/60 mb-1">P1 Veterans</div>
            <div className="text-3xl font-bold text-cyan-400">{veteranSignups}</div>
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
            <div className="text-sm font-semibold text-red-400 mb-2">IP Addresses with Multiple Signups:</div>
            <div className="space-y-1 text-sm">
              {duplicateIPs.map(([ip, count]) => (
                <div key={ip} className="text-white/70">
                  <span className="font-mono text-red-300">{ip}</span> - <span className="text-red-400">{count} signups</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-4 text-left text-sm font-semibold text-yellow-400">#</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-yellow-400">Stake Address</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-yellow-400">P1 Vet</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-yellow-400">P1 Corp Name</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-yellow-400">Name Change</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-yellow-400">IP Address</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-yellow-400">Submitted At</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-yellow-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {signups.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-white/50">
                    No signups yet
                  </td>
                </tr>
              ) : (
                signups.map((signup: any, index: number) => {
                  const veteran = veteranMap.get(signup.stakeAddress.toLowerCase());
                  const isVeteran = !!veteran;
                  const hasNameChange = veteran?.hasReservedName && veteran.reservedCorporationName !== veteran.originalCorporationName;

                  return (
                    <tr
                      key={signup._id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-4 text-sm text-white/70">{index + 1}</td>
                      <td className="px-4 py-4 font-mono text-sm" title={signup.stakeAddress}>
                        {truncateAddress(signup.stakeAddress)}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {isVeteran ? (
                          <span className="text-cyan-400 font-semibold">Yes</span>
                        ) : (
                          <span className="text-white/40">No</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {isVeteran ? (
                          <span className="text-white">{veteran.originalCorporationName}</span>
                        ) : (
                          <span className="text-white/30">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {isVeteran && hasNameChange ? (
                          <button
                            onClick={() => openHistoryLightbox(veteran)}
                            className="text-cyan-400 hover:text-cyan-300 hover:underline font-semibold transition-colors"
                          >
                            {veteran.reservedCorporationName}
                          </button>
                        ) : isVeteran ? (
                          <span className="text-white/40 italic">No change</span>
                        ) : (
                          <span className="text-white/30">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 font-mono text-sm text-white/70">
                        {signup.ipAddress || 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm text-white/70">
                        {formatDate(signup.submittedAt)}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleDelete(signup._id, signup.stakeAddress)}
                          className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50 rounded-md text-sm font-semibold transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {signups.length > 0 && (
          <div className="mt-6 space-x-4">
            <button
              onClick={() => {
                const addresses = signups.map((s: any) => s.stakeAddress).join('\n');
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
                  'Stake Address,P1 Veteran,P1 Corp Name,Reserved Name,IP Address,Submitted At',
                  ...signups.map((s: any) => {
                    const vet = veteranMap.get(s.stakeAddress.toLowerCase());
                    return `${s.stakeAddress},${vet ? 'Yes' : 'No'},${vet?.originalCorporationName || ''},${vet?.reservedCorporationName || ''},${s.ipAddress || 'N/A'},${formatDate(s.submittedAt)}`;
                  })
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `beta-signups-${Date.now()}.csv`;
                a.click();
              }}
              className="px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              Export CSV
            </button>
          </div>
        )}
      </div>

      {/* Name Change History Lightbox */}
      {historyLightbox.isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={() => setHistoryLightbox({ ...historyLightbox, isOpen: false })}
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-gray-900 border border-cyan-500/40 rounded-2xl overflow-hidden shadow-2xl p-6"
            style={{ boxShadow: '0 0 40px rgba(6, 182, 212, 0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-cyan-400 mb-4">
              Name Change History
            </h3>
            <p className="text-white/60 text-sm mb-4">
              Current name: <span className="text-white font-semibold">{historyLightbox.veteranName}</span>
            </p>

            {historyLightbox.history.length === 0 ? (
              <div className="text-white/50 text-center py-8">
                No name change history recorded
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {historyLightbox.history.map((entry, i) => (
                  <div
                    key={i}
                    className="bg-white/5 border border-white/10 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white/60">{entry.previousName}</span>
                      <span className="text-cyan-400">→</span>
                      <span className="text-white font-semibold">{entry.newName}</span>
                    </div>
                    <div className="text-xs text-white/40 mt-1">
                      {formatDate(entry.changedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setHistoryLightbox({ ...historyLightbox, isOpen: false })}
              className="mt-6 w-full py-3 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
