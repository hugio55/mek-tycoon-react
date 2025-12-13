'use client';

import { useState, useEffect } from 'react';
import { api } from '@/convex/_generated/api';
import { useDatabaseContext } from '@/contexts/DatabaseContext';
import { sturgeonClient } from '@/lib/sturgeonClient';

interface BetaSignup {
  _id: string;
  stakeAddress: string;
  submittedAt: number;
  ipAddress?: string | null;
}

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

export default function BetaSignupsViewer() {
  const { client, selectedDatabase } = useDatabaseContext();
  const [signups, setSignups] = useState<BetaSignup[] | null>(null);
  const [veterans, setVeterans] = useState<VeteranInfo[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Name change history lightbox state
  const [historyLightbox, setHistoryLightbox] = useState<{
    isOpen: boolean;
    veteranName: string;
    history: NameChangeEntry[];
  }>({ isOpen: false, veteranName: '', history: [] });

  // Debug logging
  console.log('[🎮BETA-VIEWER] Context:', { hasClient: !!client, selectedDatabase });

  // Fetch signups from selected database, but ALWAYS fetch veterans from Sturgeon
  // (Name reservations are stored on Sturgeon regardless of which database is selected)
  useEffect(() => {
    console.log('[🎮BETA-VIEWER] useEffect triggered:', { hasClient: !!client, selectedDatabase });
    if (!client) {
      console.log('[🎮BETA-VIEWER] No client available, skipping fetch');
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      console.log('[🎮BETA-VIEWER] Fetching signups from:', selectedDatabase);
      console.log('[🎮BETA-VIEWER] Fetching veterans from: Sturgeon (always)');
      try {
        // Signups come from selected database
        // Veterans ALWAYS come from Sturgeon (that's where name reservations are stored)
        const [signupsData, veteransData] = await Promise.all([
          client.query(api.betaSignups.getAllBetaSignups, {}),
          sturgeonClient.query(api.phase1Veterans.getAllVeterans, {})
        ]);
        console.log('[🎮BETA-VIEWER] Received data:', {
          signups: signupsData?.length || 0,
          veterans: veteransData?.length || 0
        });
        if (!cancelled) {
          setSignups(signupsData || []);
          setVeterans(veteransData || []);
          setLoading(false);
        }
      } catch (error) {
        console.error('[🎮BETA-VIEWER] Error fetching data:', error);
        if (!cancelled) {
          setSignups([]);
          setVeterans([]);
          setLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [client, selectedDatabase]);

  // Create a map of stake address -> veteran info for quick lookup
  const veteranMap = new Map<string, VeteranInfo>();
  if (veterans) {
    veterans.forEach((v: VeteranInfo) => {
      veteranMap.set(v.stakeAddress.toLowerCase(), v);
    });
  }

  const truncateAddress = (addr: string) => {
    if (addr.length <= 20) return addr;
    return `${addr.slice(0, 12)}...${addr.slice(-8)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // CSV-safe date format (no commas)
  const formatDateForCSV = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  };

  const openHistoryLightbox = (veteran: VeteranInfo) => {
    setHistoryLightbox({
      isOpen: true,
      veteranName: veteran.reservedCorporationName || veteran.originalCorporationName,
      history: veteran.nameChangeHistory || [],
    });
  };

  const handleDelete = async (signupId: string, stakeAddress: string) => {
    if (!client) return;

    const confirmed = window.confirm(
      `Delete beta signup for:\n${stakeAddress}\n\nThis will remove them from the ${selectedDatabase} database.`
    );
    if (!confirmed) return;

    setDeletingId(signupId);
    try {
      await client.mutation(api.betaSignups.deleteBetaSignup, {
        signupId: signupId as any,
      });
      // Refresh the list by removing from local state
      setSignups(prev => prev ? prev.filter(s => s._id !== signupId) : null);
    } catch (error) {
      console.error('[🎮BETA-VIEWER] Error deleting signup:', error);
      alert('Failed to delete signup: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading || !signups) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white/70 text-lg">Loading beta signups from {selectedDatabase}...</div>
      </div>
    );
  }

  // Count veterans in signups
  const veteranSignups = signups.filter((s) => veteranMap.has(s.stakeAddress.toLowerCase())).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-6 text-lg text-white/90">
          <div>
            Total Signups: <span className="text-yellow-400 font-bold">{signups.length}</span>
          </div>
          <div>
            P1 Veterans: <span className="text-cyan-400 font-bold">{veteranSignups}</span>
          </div>
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
                  'Stake Address,P1 Veteran,P1 Corp Name,Reserved Name,Submitted At',
                  ...signups.map((s) => {
                    const vet = veteranMap.get(s.stakeAddress.toLowerCase());
                    const d = new Date(s.submittedAt);
                    const dateStr = `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear().toString().slice(-2)} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
                    return `${s.stakeAddress},${vet ? 'Yes' : 'No'},${vet?.originalCorporationName || ''},${vet?.reservedCorporationName || ''},"${dateStr}"`;
                  })
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

      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                Stake Address
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                P1 Vet
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                P1 Corp Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                Name Change
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                Submitted At
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {signups.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-white/50">
                  No signups yet
                </td>
              </tr>
            ) : (
              signups.map((signup, index) => {
                const veteran = veteranMap.get(signup.stakeAddress.toLowerCase());
                const isVeteran = !!veteran;
                const hasNameChange = veteran?.hasReservedName && veteran.reservedCorporationName !== veteran.originalCorporationName;

                return (
                  <tr
                    key={signup._id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-white/70">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-white/90" title={signup.stakeAddress}>
                      {truncateAddress(signup.stakeAddress)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isVeteran ? (
                        <span className="text-cyan-400 font-semibold">Yes</span>
                      ) : (
                        <span className="text-white/40">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isVeteran ? (
                        <span className="text-white">{veteran.originalCorporationName}</span>
                      ) : (
                        <span className="text-white/30">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
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
                    <td className="px-4 py-3 text-sm text-white/70">
                      {formatDate(signup.submittedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(signup._id, signup.stakeAddress)}
                        disabled={deletingId === signup._id}
                        className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50 rounded text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === signup._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
