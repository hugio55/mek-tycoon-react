'use client';

/**
 * WhitelistManagerAdmin - PRODUCTION DATABASE ONLY
 *
 * Always reads from and writes to Sturgeon (production) database.
 * Accepts client prop from parent (NFTAdminTabs passes sturgeonClient).
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface WhitelistManagerAdminProps {
  client: any;
  mutationsEnabled: boolean;
}

function WhitelistManagerAdminContent({ client, mutationsEnabled }: WhitelistManagerAdminProps) {
  // canMutate helper - production mutations require explicit enablement
  const canMutate = () => mutationsEnabled;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingWhitelist, setEditingWhitelist] = useState<any | null>(null);
  const [selectedWhitelist, setSelectedWhitelist] = useState<Id<"whitelists"> | null>(null);
  const [viewingWhitelistTable, setViewingWhitelistTable] = useState<any | null>(null);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotDescription, setSnapshotDescription] = useState('');

  const [mounted, setMounted] = useState(false);

  // Mount portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // State for data
  const [allWhitelists, setAllWhitelists] = useState<any[]>([]);
  const [allCriteria, setAllCriteria] = useState<any[]>([]);
  const [allSnapshots, setAllSnapshots] = useState<any[]>([]);
  const [selectedWhitelistData, setSelectedWhitelistData] = useState<any>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);

  // Combined data fetching - single polling interval for all queries
  useEffect(() => {
    if (!client) return;

    let cancelled = false;

    const fetchAllData = async () => {
      try {
        // Build array of queries to run
        const queries: Promise<any>[] = [
          client.query(api.whitelists.getAllWhitelists),
          client.query(api.whitelists.getAllCriteria),
          client.query(api.whitelists.getAllWhitelistSnapshots)
        ];

        // Add selected whitelist queries if one is selected
        if (selectedWhitelist) {
          queries.push(
            client.query(api.whitelists.getWhitelistById, { whitelistId: selectedWhitelist }),
            client.query(api.whitelists.getSnapshotsByWhitelist, { whitelistId: selectedWhitelist })
          );
        }

        const results = await Promise.all(queries);

        if (!cancelled) {
          setAllWhitelists(results[0]);
          setAllCriteria(results[1]);
          setAllSnapshots(results[2]);

          if (selectedWhitelist) {
            setSelectedWhitelistData(results[3]);
            setSnapshots(results[4]);
          } else {
            setSelectedWhitelistData(null);
            setSnapshots([]);
          }
        }
      } catch (error) {
        console.error('[WhitelistManager] Error fetching data:', error);
      }
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [client, selectedWhitelist]);

  // Mutation helpers using client
  const initializeCriteria = async () => {
    if (!client || !canMutate()) throw new Error('Mutations disabled');
    return await client.mutation(api.whitelists.initializeDefaultCriteria, {});
  };

  const deleteWhitelist = async (args: any) => {
    if (!client || !canMutate()) throw new Error('Mutations disabled');
    return await client.mutation(api.whitelists.deleteWhitelist, args);
  };

  const generateWhitelist = async (args: any) => {
    if (!client || !canMutate()) throw new Error('Mutations disabled');
    return await client.mutation(api.whitelists.generateWhitelist, args);
  };

  const removeUserFromWhitelist = async (args: any) => {
    if (!client || !canMutate()) throw new Error('Mutations disabled');
    return await client.mutation(api.whitelists.removeUserFromWhitelist, args);
  };

  const clearAllUsersFromWhitelist = async (args: any) => {
    if (!client || !canMutate()) throw new Error('Mutations disabled');
    return await client.mutation(api.whitelists.clearAllUsersFromWhitelist, args);
  };

  const addUserToWhitelistByCompanyName = async (args: any) => {
    if (!client || !canMutate()) throw new Error('Mutations disabled');
    return await client.mutation(api.whitelists.addUserToWhitelistByCompanyName, args);
  };

  const addUserToWhitelistByAddress = async (args: any) => {
    if (!client || !canMutate()) throw new Error('Mutations disabled');
    return await client.mutation(api.whitelists.addUserToWhitelistByAddress, args);
  };

  const createSnapshot = async (args: any) => {
    if (!client || !canMutate()) throw new Error('Mutations disabled');
    return await client.mutation(api.whitelists.createSnapshot, args);
  };

  const deleteSnapshot = async (args: any) => {
    if (!client || !canMutate()) throw new Error('Mutations disabled');
    return await client.mutation(api.whitelists.deleteSnapshot, args);
  };

  const createManualWhitelist = async (args: any) => {
    if (!client || !canMutate()) throw new Error('Mutations disabled');
    return await client.mutation(api.whitelists.createManualWhitelist, args);
  };

  // Initialize default criteria on mount (only if mutations are enabled and client exists)
  useEffect(() => {
    if (allCriteria && allCriteria.length === 0 && client && canMutate()) {
      initializeCriteria();
    }
  }, [allCriteria, client, canMutate]);

  const handleGenerateWhitelist = async (whitelistId: Id<"whitelists">) => {
    try {
      const result = await generateWhitelist({ whitelistId });
      alert(`Whitelist generated! ${result.userCount} eligible users found.`);
    } catch (error: any) {
      alert(`Error generating whitelist: ${error.message}`);
    }
  };

  const handleDeleteWhitelist = async (whitelistId: Id<"whitelists">) => {
    if (!confirm('Are you sure you want to delete this whitelist?')) return;
    try {
      await deleteWhitelist({ whitelistId });
      if (selectedWhitelist === whitelistId) {
        setSelectedWhitelist(null);
      }
    } catch (error: any) {
      alert(`Error deleting whitelist: ${error.message}`);
    }
  };

  const handleExportCSV = (whitelist: any) => {
    if (!whitelist.eligibleUsers || whitelist.eligibleUsers.length === 0) {
      alert('No users to export. Generate the whitelist first.');
      return;
    }

    const csv = [
      ['Stake Address', 'Display Name'],
      ...whitelist.eligibleUsers.map((u: any) => [
        u.stakeAddress,
        u.displayName || 'N/A'
      ])
    ].map((row: any) => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whitelist_${whitelist.name.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTakeSnapshot = async () => {
    if (!selectedWhitelist || !selectedWhitelistData) return;

    if (!snapshotName.trim()) {
      alert('Please enter a snapshot name');
      return;
    }

    try {
      const result = await createSnapshot({
        whitelistId: selectedWhitelist,
        snapshotName: snapshotName.trim(),
        description: snapshotDescription.trim() || undefined,
      });
      alert(`Snapshot created! ${result.userCount} users captured.`);
      setShowSnapshotModal(false);
      setSnapshotName('');
      setSnapshotDescription('');
    } catch (error: any) {
      alert(`Error creating snapshot: ${error.message}`);
    }
  };

  const handleDeleteSnapshot = async (snapshotId: Id<"whitelistSnapshots">) => {
    if (!confirm('Are you sure you want to delete this snapshot? This cannot be undone.')) return;

    try {
      await deleteSnapshot({ snapshotId });
    } catch (error: any) {
      alert(`Error deleting snapshot: ${error.message}`);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-400">Create and manage NFT whitelist eligibility rules</p>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={() => {
              if (!mutationsEnabled) {
                alert('Please click "Enable Editing" first to create whitelists.');
                return;
              }
              setShowManualModal(true);
            }}
            disabled={!mutationsEnabled}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              mutationsEnabled
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            title={!mutationsEnabled ? 'Enable editing first' : 'Create a manual whitelist by pasting addresses'}
          >
            📋 Manual Whitelist
          </button>
          <button
            onClick={() => {
              if (!mutationsEnabled) {
                alert('Please click "Enable Editing" first to create whitelists.');
                return;
              }
              setShowCreateModal(true);
            }}
            disabled={!mutationsEnabled}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              mutationsEnabled
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            title={!mutationsEnabled ? 'Enable editing first' : 'Create a whitelist using eligibility rules'}
          >
            + Create Rule-Based Whitelist
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-black/50 border border-cyan-500/30 rounded-lg p-4">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Whitelists</div>
          <div className="text-3xl font-bold text-cyan-400">{allWhitelists?.length || 0}</div>
        </div>
        <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-4">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Available Criteria</div>
          <div className="text-3xl font-bold text-yellow-400">{allCriteria?.length || 0}</div>
        </div>
        <div className="bg-black/50 border border-green-500/30 rounded-lg p-4">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Eligible Users</div>
          <div className="text-3xl font-bold text-green-400">
            {allWhitelists?.reduce((sum: any, w: any) => sum + (w.userCount || 0), 0) || 0}
          </div>
        </div>
      </div>

      {/* All Snapshots Section - Shows ALL snapshots regardless of parent whitelist */}
      {allSnapshots && allSnapshots.length > 0 && (
        <div className="bg-purple-900/20 border-2 border-purple-500/50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-purple-400 mb-4">
            All Saved Snapshots ({allSnapshots.length})
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            These are all snapshots saved in the system. Delete any you no longer need.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allSnapshots.map((snapshot: any) => (
              <div
                key={snapshot._id}
                className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4"
              >
                <div className="mb-2">
                  <div className="font-bold text-white text-sm mb-1">
                    {snapshot.snapshotName}
                  </div>
                  {snapshot.description && (
                    <div className="text-xs text-gray-400 mb-2">
                      {snapshot.description}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-2">
                  <div className="bg-purple-600/30 text-purple-300 text-xs px-2 py-1 rounded">
                    {snapshot.userCount || snapshot.eligibleUsers?.length || 0} wallets
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(snapshot.takenAt).toLocaleDateString()}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteSnapshot(snapshot._id)}
                  className="w-full px-3 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-400 text-sm font-bold rounded transition-all"
                >
                  🗑️ Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Whitelist List */}
        <div className="bg-black/30 border border-cyan-500/30 rounded-lg p-6">
          <h2 className="text-xl font-bold text-cyan-300 mb-4">Saved Whitelists</h2>

          {!allWhitelists || allWhitelists.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <div>No whitelists created yet.</div>
              <div className="text-sm">Click "Create New Whitelist" to get started.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {allWhitelists.map((whitelist: any) => (
                <div
                  key={whitelist._id}
                  className={`bg-black/50 border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedWhitelist === whitelist._id
                      ? 'border-cyan-400 shadow-lg shadow-cyan-500/20'
                      : 'border-gray-700 hover:border-cyan-500/50'
                  }`}
                  onClick={() => setSelectedWhitelist(whitelist._id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-white">{whitelist.name}</h3>
                      {whitelist.description && (
                        <p className="text-sm text-gray-400 mt-1">{whitelist.description}</p>
                      )}
                    </div>
                    <div className="bg-cyan-900/30 text-cyan-400 text-xs px-2 py-1 rounded">
                      {whitelist.userCount} users
                    </div>
                  </div>

                  <div className="flex gap-2 text-xs text-gray-500 mb-3">
                    <span>{whitelist.rules.length} rules</span>
                    <span>•</span>
                    <span>{whitelist.ruleLogic}</span>
                    {whitelist.lastGenerated > 0 && (
                      <>
                        <span>•</span>
                        <span>Last generated: {new Date(whitelist.lastGenerated).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {/* Only show Regenerate for rule-based whitelists (not manual) */}
                    {whitelist.rules.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateWhitelist(whitelist._id);
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-3 py-1 rounded"
                      >
                        Regenerate
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingWhitelistTable(whitelist);
                      }}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs px-3 py-1 rounded"
                    >
                      View Table
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportCSV(whitelist);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingWhitelist(whitelist);
                        setShowCreateModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWhitelist(whitelist._id);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Whitelist Detail / Preview */}
        <div className="bg-black/30 border border-cyan-500/30 rounded-lg p-6">
          <h2 className="text-xl font-bold text-cyan-300 mb-4">Whitelist Details</h2>

          {!selectedWhitelistData ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">👈</div>
              <div>Select a whitelist to view details</div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h3 className="font-bold text-white text-lg mb-2">{selectedWhitelistData.name}</h3>
                {selectedWhitelistData.description && (
                  <p className="text-gray-400 text-sm">{selectedWhitelistData.description}</p>
                )}
              </div>

              {/* Rules */}
              <div className="bg-black/50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-bold text-cyan-400 mb-3">
                  Eligibility Rules ({selectedWhitelistData.ruleLogic})
                </h4>
                {selectedWhitelistData.rules.map((rule: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                    <div className="text-sm">
                      <span className="text-cyan-300">
                        {allCriteria?.find((c: any) => c.field === rule.criteriaField)?.displayName || rule.criteriaField}
                      </span>
                      <span className="text-gray-500 mx-2">{rule.operator.replace(/_/g, ' ')}</span>
                      <span className="text-yellow-400">{rule.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Eligible Users */}
              <div className="bg-black/50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-cyan-400">
                    Eligible Users ({selectedWhitelistData.userCount})
                  </h4>
                  <div className="flex items-center gap-2">
                    {selectedWhitelistData.lastGenerated > 0 && (
                      <div className="text-xs text-gray-500">
                        Updated: {new Date(selectedWhitelistData.lastGenerated).toLocaleString()}
                      </div>
                    )}
                    <button
                      onClick={() => setShowSnapshotModal(true)}
                      disabled={selectedWhitelistData.userCount === 0}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-bold rounded transition-all"
                    >
                      📸 Take Snapshot
                    </button>
                  </div>
                </div>

                {selectedWhitelistData.userCount === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No users match these criteria yet.
                    <br />
                    Click "Regenerate" to update.
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {selectedWhitelistData.eligibleUsers.map((user: any, index: number) => (
                        <div
                          key={index}
                          className="bg-black/30 rounded p-3 text-sm"
                        >
                          <div className="text-white font-mono text-xs truncate">
                            {user.stakeAddress}
                          </div>
                          {user.displayName && (
                            <div className="text-gray-400 text-xs mt-1">{user.displayName}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Snapshots */}
              <div className="bg-black/50 rounded-lg p-4">
                <h4 className="text-sm font-bold text-purple-400 mb-3">
                  Snapshots ({snapshots?.length || 0})
                </h4>

                {snapshots && snapshots.length > 0 ? (
                  <div className="space-y-2">
                    {snapshots.map((snapshot: any) => (
                      <div
                        key={snapshot._id}
                        className="bg-purple-900/20 border border-purple-500/30 rounded p-3"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold text-white text-sm">{snapshot.snapshotName}</div>
                            {snapshot.description && (
                              <div className="text-xs text-gray-400 mt-1">{snapshot.description}</div>
                            )}
                          </div>
                          <div className="bg-purple-600/30 text-purple-300 text-xs px-2 py-1 rounded">
                            {snapshot.userCount} users
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">
                            Taken: {new Date(snapshot.takenAt).toLocaleString()}
                          </div>
                          <button
                            onClick={() => handleDeleteSnapshot(snapshot._id)}
                            className="px-2 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-400 text-xs font-bold rounded transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    <div className="text-3xl mb-2">📸</div>
                    <div>No snapshots yet.</div>
                    <div className="text-xs mt-1">Click "Take Snapshot" to freeze the current eligible users list.</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {mounted && showCreateModal && (
        <WhitelistCreateModal
          allCriteria={allCriteria || []}
          editingWhitelist={editingWhitelist}
          client={client}
          canMutate={canMutate}
          onClose={() => {
            setShowCreateModal(false);
            setEditingWhitelist(null);
          }}
        />
      )}

      {/* View Table Modal */}
      {mounted && viewingWhitelistTable && (
        <WhitelistTableModal
          whitelist={viewingWhitelistTable}
          client={client}
          onClose={() => setViewingWhitelistTable(null)}
          onExportCSV={handleExportCSV}
          removeUserFromWhitelist={removeUserFromWhitelist}
          clearAllUsersFromWhitelist={clearAllUsersFromWhitelist}
          addUserToWhitelistByCompanyName={addUserToWhitelistByCompanyName}
          addUserToWhitelistByAddress={addUserToWhitelistByAddress}
        />
      )}

      {/* Snapshot Creation Modal */}
      {mounted && showSnapshotModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-purple-500/50 rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-purple-400">📸 Take Snapshot</h2>
              <button onClick={() => setShowSnapshotModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-purple-300 mb-2">Snapshot Name</label>
              <input
                type="text"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                placeholder="e.g., Early Bird - Oct 24, Launch Day Snapshot"
                className="w-full bg-black/50 border border-purple-500/30 rounded px-3 py-2 text-white"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-purple-300 mb-2">Description (Optional)</label>
              <textarea
                value={snapshotDescription}
                onChange={(e) => setSnapshotDescription(e.target.value)}
                placeholder="Add notes about this snapshot..."
                className="w-full bg-black/50 border border-purple-500/30 rounded px-3 py-2 text-white h-20"
              />
            </div>

            <div className="bg-purple-900/20 border border-purple-500/30 rounded p-3 mb-4 text-sm text-purple-300">
              <div className="font-bold mb-1">📋 Snapshot Info:</div>
              <div className="text-gray-400">
                <div>• Whitelist: {selectedWhitelistData?.name}</div>
                <div>• Users to capture: {selectedWhitelistData?.userCount}</div>
                <div>• This snapshot will be frozen and never change</div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSnapshotModal(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleTakeSnapshot}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded font-bold"
              >
                Take Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Whitelist Creation Modal */}
      {mounted && showManualModal && (
        <ManualWhitelistModal
          onClose={() => setShowManualModal(false)}
          createManualWhitelist={createManualWhitelist}
        />
      )}
    </div>
  );
}

// Export component - receives client and mutationsEnabled from parent (NFTAdminTabs)
export default function WhitelistManagerAdmin({ client, mutationsEnabled }: WhitelistManagerAdminProps) {
  return <WhitelistManagerAdminContent client={client} mutationsEnabled={mutationsEnabled} />;
}

// Create/Edit Whitelist Modal Component
function WhitelistCreateModal({
  allCriteria,
  editingWhitelist,
  client,
  canMutate,
  onClose,
}: {
  allCriteria: any[];
  editingWhitelist: any | null;
  client: any;
  canMutate: () => boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState(editingWhitelist?.name || '');
  const [description, setDescription] = useState(editingWhitelist?.description || '');
  const [ruleLogic, setRuleLogic] = useState<'AND' | 'OR'>(editingWhitelist?.ruleLogic || 'AND');
  const [rules, setRules] = useState<Array<{
    criteriaField: string;
    operator: string;
    value: any;
  }>>(editingWhitelist?.rules || [{ criteriaField: '', operator: 'greater_than', value: '' }]);

  const [isSaving, setIsSaving] = useState(false);

  // Mutation helpers
  const createWhitelist = async (args: any) => {
    if (!client || !canMutate()) throw new Error('Mutations disabled');
    return await client.mutation(api.whitelists.createWhitelist, args);
  };

  const updateWhitelist = async (args: any) => {
    if (!client || !canMutate()) throw new Error('Mutations disabled');
    return await client.mutation(api.whitelists.updateWhitelist, args);
  };

  const handleAddRule = () => {
    setRules([...rules, { criteriaField: '', operator: 'greater_than', value: '' }]);
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_: any, i: number) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a whitelist name');
      return;
    }

    if (rules.some((r: any) => !r.criteriaField || r.value === '')) {
      alert('Please complete all rules');
      return;
    }

    setIsSaving(true);
    try {
      if (editingWhitelist) {
        await updateWhitelist({
          whitelistId: editingWhitelist._id,
          name,
          description,
          rules,
          ruleLogic,
        });
      } else {
        await createWhitelist({
          name,
          description,
          rules,
          ruleLogic,
        });
      }
      onClose();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-cyan-500/50 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyan-400">
            {editingWhitelist ? 'Edit Whitelist' : 'Create New Whitelist'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm text-cyan-300 mb-2">Whitelist Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Gold Miners Tier 1"
            className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm text-cyan-300 mb-2">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe who this whitelist is for..."
            className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white h-20"
          />
        </div>

        {/* Rule Logic */}
        <div className="mb-4">
          <label className="block text-sm text-cyan-300 mb-2">Rule Logic</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="ruleLogic"
                checked={ruleLogic === 'AND'}
                onChange={() => setRuleLogic('AND')}
              />
              <span className="text-white">AND (All rules must match)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="ruleLogic"
                checked={ruleLogic === 'OR'}
                onChange={() => setRuleLogic('OR')}
              />
              <span className="text-white">OR (Any rule must match)</span>
            </label>
          </div>
        </div>

        {/* Rules */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm text-cyan-300">Eligibility Rules</label>
            <button
              onClick={handleAddRule}
              className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded"
            >
              + Add Rule
            </button>
          </div>

          <div className="space-y-3">
            {rules.map((rule: any, index: number) => (
              <div key={index} className="bg-black/30 border border-gray-700 rounded p-3">
                <div className="grid grid-cols-12 gap-2 mb-2">
                  <div className="col-span-4">
                    <select
                      value={rule.criteriaField}
                      onChange={(e) => {
                        const newRules = [...rules];
                        newRules[index].criteriaField = e.target.value;
                        setRules(newRules);
                      }}
                      className="w-full bg-black/50 border border-cyan-500/30 rounded px-2 py-1 text-sm text-white"
                    >
                      <option value="">Select field...</option>
                      {allCriteria.map((criteria: any) => (
                        <option key={criteria._id} value={criteria.field}>
                          {criteria.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <select
                      value={rule.operator}
                      onChange={(e) => {
                        const newRules = [...rules];
                        newRules[index].operator = e.target.value;
                        setRules(newRules);
                      }}
                      className="w-full bg-black/50 border border-cyan-500/30 rounded px-2 py-1 text-sm text-white"
                    >
                      <option value="greater_than">&gt;</option>
                      <option value="less_than">&lt;</option>
                      <option value="equals">=</option>
                      <option value="not_equals">≠</option>
                      <option value="greater_or_equal">≥</option>
                      <option value="less_or_equal">≤</option>
                      <option value="contains">contains</option>
                    </select>
                  </div>
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={rule.value}
                      onChange={(e) => {
                        const newRules = [...rules];
                        newRules[index].value = e.target.value;
                        setRules(newRules);
                      }}
                      placeholder="Value..."
                      className="w-full bg-black/50 border border-cyan-500/30 rounded px-2 py-1 text-sm text-white"
                    />
                  </div>
                  <div className="col-span-1 flex items-center">
                    {rules.length > 1 && (
                      <button
                        onClick={() => handleRemoveRule(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
                {rule.criteriaField && (
                  <div className="text-xs text-gray-500">
                    {allCriteria.find((c: any) => c.field === rule.criteriaField)?.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded font-bold"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : editingWhitelist ? 'Update Whitelist' : 'Create Whitelist'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Whitelist Table Modal with Add/Delete Functionality
function WhitelistTableModal({
  whitelist,
  client,
  onClose,
  onExportCSV,
  removeUserFromWhitelist,
  clearAllUsersFromWhitelist,
  addUserToWhitelistByCompanyName,
  addUserToWhitelistByAddress,
}: {
  whitelist: any;
  client: any;
  onClose: () => void;
  onExportCSV: (whitelist: any) => void;
  removeUserFromWhitelist: any;
  clearAllUsersFromWhitelist: any;
  addUserToWhitelistByCompanyName: any;
  addUserToWhitelistByAddress: any;
}) {
  const [companyNameInput, setCompanyNameInput] = useState('');
  const [manualWalletInput, setManualWalletInput] = useState('');
  const [manualDisplayNameInput, setManualDisplayNameInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Search for matching company names
  useEffect(() => {
    if (!client || companyNameInput.length < 2) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;

    const fetchSearchResults = async () => {
      try {
        const results = await client.query(api.whitelists.searchCompanyNames, {
          searchTerm: companyNameInput
        });
        if (!cancelled) {
          setSearchResults(results || []);
        }
      } catch (error) {
        console.error('[WhitelistTable] Error searching company names:', error);
      }
    };

    fetchSearchResults();

    return () => {
      cancelled = true;
    };
  }, [client, companyNameInput]);

  const handleRemoveUser = async (stakeAddress: string, displayName?: string) => {
    if (!confirm(`Remove "${displayName || stakeAddress}" from this whitelist?`)) return;

    try {
      await removeUserFromWhitelist({
        whitelistId: whitelist._id,
        stakeAddress,
      });
      alert('User removed successfully!');
    } catch (error: any) {
      alert(`Error removing user: ${error.message}`);
    }
  };

  const handleSelectCompany = (companyName: string) => {
    setCompanyNameInput(companyName);
    setShowDropdown(false);
  };

  const handleAddUser = async () => {
    // Check if using manual stake address or company name lookup
    if (manualWalletInput.trim()) {
      // Adding by manual stake address
      setIsAdding(true);
      try {
        await addUserToWhitelistByAddress({
          whitelistId: whitelist._id,
          stakeAddress: manualWalletInput.trim(),
          displayName: manualDisplayNameInput.trim() || undefined,
        });
        alert(`User added successfully!`);
        setManualWalletInput('');
        setManualDisplayNameInput('');
      } catch (error: any) {
        alert(`Error adding user: ${error.message}`);
      } finally {
        setIsAdding(false);
      }
    } else if (companyNameInput.trim()) {
      // Adding by company name lookup
      setIsAdding(true);
      try {
        await addUserToWhitelistByCompanyName({
          whitelistId: whitelist._id,
          companyName: companyNameInput.trim(),
        });
        alert(`User "${companyNameInput}" added successfully!`);
        setCompanyNameInput('');
        setShowDropdown(false);
      } catch (error: any) {
        alert(`Error adding user: ${error.message}`);
      } finally {
        setIsAdding(false);
      }
    } else {
      alert('Please enter either a corporation name or stake address');
    }
  };

  // Show dropdown when there are search results
  useEffect(() => {
    if (searchResults && searchResults.length > 0) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [searchResults]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-cyan-500/50 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-cyan-500/30">
          <div>
            <h2 className="text-2xl font-bold text-cyan-400">{whitelist.name}</h2>
            {whitelist.description && (
              <p className="text-gray-400 text-sm mt-1">{whitelist.description}</p>
            )}
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span>{whitelist.userCount} eligible users</span>
              <span>•</span>
              <span>{whitelist.rules.length} rules ({whitelist.ruleLogic})</span>
              {whitelist.lastGenerated > 0 && (
                <>
                  <span>•</span>
                  <span>Last generated: {new Date(whitelist.lastGenerated).toLocaleString()}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl"
          >
            ×
          </button>
        </div>

        {/* Add User Section */}
        <div className="p-6 border-b border-cyan-500/30 bg-black/30">
          <label className="block text-sm font-bold text-cyan-300 mb-4 uppercase tracking-wider">Add User Manually</label>

          {/* Option 1: Search by Corporation Name */}
          <div className="mb-4">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <label className="block text-xs text-gray-400 mb-2">Option 1: Search by Corporation Name</label>
                <input
                  type="text"
                  value={companyNameInput}
                  onChange={(e) => {
                    setCompanyNameInput(e.target.value);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !showDropdown && !manualWalletInput) handleAddUser();
                  }}
                  onFocus={() => {
                    if (searchResults && searchResults.length > 0) {
                      setShowDropdown(true);
                    }
                  }}
                  placeholder="Enter corporation name..."
                  className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white placeholder-gray-600"
                  disabled={isAdding || !!manualWalletInput.trim()}
                />

                {/* Autocomplete Dropdown */}
                {showDropdown && searchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-cyan-500/50 rounded shadow-lg max-h-60 overflow-y-auto z-50">
                    {searchResults.map((result: any, index: number) => (
                      <div
                        key={index}
                        onClick={() => handleSelectCompany(result.companyName)}
                        className="px-4 py-3 hover:bg-cyan-900/30 cursor-pointer border-b border-gray-700 last:border-0 transition-colors"
                      >
                        <div className="text-white font-medium">{result.companyName}</div>
                        <div className="text-xs text-gray-400 font-mono truncate mt-1">
                          {result.walletAddress}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 border-t border-gray-700"></div>
            <span className="text-xs text-gray-500 uppercase">OR</span>
            <div className="flex-1 border-t border-gray-700"></div>
          </div>

          {/* Option 2: Manual Stake Address */}
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-2">Option 2: Enter Stake Address Directly</label>
            <div className="flex gap-3 mb-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={manualWalletInput}
                  onChange={(e) => setManualWalletInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleAddUser();
                  }}
                  placeholder="stake1... or stake_test1..."
                  className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white font-mono text-sm placeholder-gray-600"
                  disabled={isAdding || !!companyNameInput.trim()}
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={manualDisplayNameInput}
                  onChange={(e) => setManualDisplayNameInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleAddUser();
                  }}
                  placeholder="Display name (optional)"
                  className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white placeholder-gray-600"
                  disabled={isAdding || !!companyNameInput.trim()}
                />
              </div>
            </div>
          </div>

          {/* Add Button */}
          <button
            onClick={handleAddUser}
            disabled={isAdding}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAdding ? 'Adding...' : '+ Add User'}
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-6">
          {whitelist.userCount === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-6xl mb-4">📋</div>
              <div className="text-xl">No eligible users yet</div>
              <div className="text-sm mt-2">Click "Regenerate" to populate this whitelist or add users manually</div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-900">
                <tr className="border-b-2 border-cyan-500/30">
                  <th className="text-left py-3 px-4 text-cyan-300 font-bold uppercase tracking-wider">#</th>
                  <th className="text-left py-3 px-4 text-cyan-300 font-bold uppercase tracking-wider">Stake Address</th>
                  <th className="text-left py-3 px-4 text-cyan-300 font-bold uppercase tracking-wider">Display Name</th>
                  <th className="text-right py-3 px-4 text-cyan-300 font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {whitelist.eligibleUsers.map((user: any, index: number) => (
                  <tr
                    key={index}
                    className="border-b border-gray-700/30 hover:bg-cyan-900/10 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-400">{index + 1}</td>
                    <td className="py-3 px-4 text-white font-mono text-xs">
                      {user.stakeAddress}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {user.displayName || <span className="text-gray-600 italic">No name</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRemoveUser(user.stakeAddress, user.displayName)}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-cyan-500/30 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              Total: <span className="text-cyan-400 font-bold">{whitelist.userCount}</span> eligible users
            </div>
            {whitelist.userCount > 0 && (
              <button
                onClick={async () => {
                  if (!confirm(`Are you sure you want to delete ALL ${whitelist.userCount} users from this whitelist? This cannot be undone.`)) return;
                  setIsClearing(true);
                  try {
                    await clearAllUsersFromWhitelist({ whitelistId: whitelist._id });
                  } catch (error: any) {
                    alert(error.message || 'Failed to clear users');
                  } finally {
                    setIsClearing(false);
                  }
                }}
                disabled={isClearing}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-wait text-white text-sm px-3 py-1 rounded"
              >
                {isClearing ? 'Deleting...' : 'Delete All'}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onExportCSV(whitelist)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Manual Whitelist Creation Modal
function ManualWhitelistModal({
  onClose,
  createManualWhitelist,
}: {
  onClose: () => void;
  createManualWhitelist: any;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [addressesText, setAddressesText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: number;
    invalid: number;
    total: number;
  } | null>(null);

  const handleValidate = () => {
    const lines = addressesText.split('\n');
    let valid = 0;
    let invalid = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue; // Skip empty lines

      if (trimmed.startsWith('stake1') || trimmed.startsWith('stake_test1')) {
        valid++;
      } else {
        invalid++;
      }
    }

    setValidationResult({
      valid,
      invalid,
      total: valid + invalid,
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Please enter a whitelist name');
      return;
    }

    const addresses = addressesText
      .split('\n')
      .map((line: any) => line.trim())
      .filter((line: any) => line.length > 0);

    if (addresses.length === 0) {
      alert('Please paste at least one stake address');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createManualWhitelist({
        name: name.trim(),
        description: description.trim() || undefined,
        addresses,
      });
      alert(`Manual whitelist created! ${result.userCount} stake addresses added.`);
      onClose();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-green-500/50 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-green-400">📋 Create Manual Whitelist</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        {/* Info Banner */}
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-4 mb-6 text-sm">
          <div className="font-bold text-yellow-400 mb-2">⚠️ IMPORTANT: Stake Addresses Only</div>
          <div className="text-gray-300">
            <div>• Only paste <span className="font-mono text-green-400">stake addresses</span> (stake1... or stake_test1...)</div>
            <div>• <span className="font-mono text-red-400">Payment addresses</span> (addr1...) will be <span className="font-bold">REJECTED</span></div>
            <div>• Stake addresses define eligibility (who can see the claim button)</div>
            <div>• NMKR collects payment addresses during checkout for NFT delivery</div>
            <div>• One address per line</div>
            <div>• Empty lines will be skipped</div>
          </div>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm text-green-300 mb-2">Whitelist Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Test Whitelist - Oct 25"
            className="w-full bg-black/50 border border-green-500/30 px-3 py-2 text-white focus:border-green-500/60 focus:outline-none transition-colors"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm text-green-300 mb-2">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes about this whitelist..."
            className="w-full bg-black/50 border border-green-500/30 px-3 py-2 text-white h-20 focus:border-green-500/60 focus:outline-none transition-colors"
          />
        </div>

        {/* Addresses Textarea */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm text-green-300">Stake Addresses</label>
            <button
              onClick={handleValidate}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded"
            >
              Validate Addresses
            </button>
          </div>
          <textarea
            value={addressesText}
            onChange={(e) => {
              setAddressesText(e.target.value);
              setValidationResult(null); // Clear validation on edit
            }}
            placeholder="Paste stake addresses here (one per line)&#10;stake_test1uzpq2pktgvn7n6qd3vd23jyy5ekgt4mhpggngz52cxw7zyclhw28g&#10;stake_test1uqx5w8r4km2eshaa4w09v74ruw5dpfnkz7qx8mnkj7pqnwcz4nfr2"
            className="w-full bg-black/50 border border-green-500/30 px-3 py-2 text-white h-64 font-mono text-xs focus:border-green-500/60 focus:outline-none transition-colors"
          />
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div className={`rounded p-4 mb-4 ${
            validationResult.invalid === 0 ? 'bg-green-900/20 border border-green-500/30' : 'bg-red-900/20 border border-red-500/30'
          }`}>
            <div className="font-bold mb-2">
              {validationResult.invalid === 0 ? '✅ All Addresses Valid' : '⚠️ Validation Results'}
            </div>
            <div className="text-sm space-y-1">
              <div>• Total addresses: <span className="font-bold">{validationResult.total}</span></div>
              <div className="text-green-400">• Valid stake addresses: <span className="font-bold">{validationResult.valid}</span></div>
              {validationResult.invalid > 0 && (
                <div className="text-red-400">• Invalid addresses: <span className="font-bold">{validationResult.invalid}</span></div>
              )}
            </div>
            {validationResult.invalid > 0 && (
              <div className="mt-3 text-xs text-red-300">
                Invalid addresses will be rejected when you create the whitelist. Please remove or fix them.
                <br/>
                <span className="font-bold">Remember: Only stake addresses (stake1... or stake_test1...) are allowed.</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold"
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Manual Whitelist'}
          </button>
        </div>
      </div>
    </div>
  );
}
