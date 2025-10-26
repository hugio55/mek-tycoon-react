'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

export default function WhitelistManagerAdmin() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingWhitelist, setEditingWhitelist] = useState<any | null>(null);
  const [selectedWhitelist, setSelectedWhitelist] = useState<Id<"whitelists"> | null>(null);
  const [viewingWhitelistTable, setViewingWhitelistTable] = useState<any | null>(null);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotDescription, setSnapshotDescription] = useState('');

  // Queries
  const allWhitelists = useQuery(api.whitelists.getAllWhitelists);
  const allCriteria = useQuery(api.whitelists.getAllCriteria);
  const selectedWhitelistData = useQuery(
    api.whitelists.getWhitelistById,
    selectedWhitelist ? { whitelistId: selectedWhitelist } : "skip"
  );
  const snapshots = useQuery(
    api.whitelists.getSnapshotsByWhitelist,
    selectedWhitelist ? { whitelistId: selectedWhitelist } : "skip"
  );

  // Mutations
  const initializeCriteria = useMutation(api.whitelists.initializeDefaultCriteria);
  const deleteWhitelist = useMutation(api.whitelists.deleteWhitelist);
  const generateWhitelist = useMutation(api.whitelists.generateWhitelist);
  const removeUserFromWhitelist = useMutation(api.whitelists.removeUserFromWhitelist);
  const addUserToWhitelistByCompanyName = useMutation(api.whitelists.addUserToWhitelistByCompanyName);
  const createSnapshot = useMutation(api.whitelists.createSnapshot);
  const deleteSnapshot = useMutation(api.whitelists.deleteSnapshot);
  const createManualWhitelist = useMutation(api.whitelists.createManualWhitelist);

  // Initialize default criteria on mount
  useEffect(() => {
    if (allCriteria && allCriteria.length === 0) {
      initializeCriteria({});
    }
  }, [allCriteria, initializeCriteria]);

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
      ['Wallet Address', 'Display Name'],
      ...whitelist.eligibleUsers.map((u: any) => [
        u.walletAddress,
        u.displayName || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

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
        <div className="flex gap-3">
          <button
            onClick={() => setShowManualModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-all"
          >
            📋 Manual Whitelist
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-bold transition-all"
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
            {allWhitelists?.reduce((sum, w) => sum + (w.userCount || 0), 0) || 0}
          </div>
        </div>
      </div>

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
              {allWhitelists.map((whitelist) => (
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateWhitelist(whitelist._id);
                      }}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-3 py-1 rounded"
                    >
                      Regenerate
                    </button>
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
                {selectedWhitelistData.rules.map((rule, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                    <div className="text-sm">
                      <span className="text-cyan-300">
                        {allCriteria?.find(c => c.field === rule.criteriaField)?.displayName || rule.criteriaField}
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
                      {selectedWhitelistData.eligibleUsers.map((user, index) => (
                        <div
                          key={index}
                          className="bg-black/30 rounded p-3 text-sm"
                        >
                          <div className="text-white font-mono text-xs truncate">
                            {user.walletAddress}
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
                    {snapshots.map((snapshot) => (
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
      {showCreateModal && (
        <WhitelistCreateModal
          allCriteria={allCriteria || []}
          editingWhitelist={editingWhitelist}
          onClose={() => {
            setShowCreateModal(false);
            setEditingWhitelist(null);
          }}
        />
      )}

      {/* View Table Modal */}
      {viewingWhitelistTable && (
        <WhitelistTableModal
          whitelist={viewingWhitelistTable}
          onClose={() => setViewingWhitelistTable(null)}
          onExportCSV={handleExportCSV}
          removeUserFromWhitelist={removeUserFromWhitelist}
          addUserToWhitelistByCompanyName={addUserToWhitelistByCompanyName}
        />
      )}

      {/* Snapshot Creation Modal */}
      {showSnapshotModal && (
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
      {showManualModal && (
        <ManualWhitelistModal
          onClose={() => setShowManualModal(false)}
          createManualWhitelist={createManualWhitelist}
        />
      )}
    </div>
  );
}

// Create/Edit Whitelist Modal Component
function WhitelistCreateModal({
  allCriteria,
  editingWhitelist,
  onClose,
}: {
  allCriteria: any[];
  editingWhitelist: any | null;
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

  const createWhitelist = useMutation(api.whitelists.createWhitelist);
  const updateWhitelist = useMutation(api.whitelists.updateWhitelist);

  const [isSaving, setIsSaving] = useState(false);

  const handleAddRule = () => {
    setRules([...rules, { criteriaField: '', operator: 'greater_than', value: '' }]);
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a whitelist name');
      return;
    }

    if (rules.some(r => !r.criteriaField || r.value === '')) {
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
            {rules.map((rule, index) => (
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
                      {allCriteria.map((criteria) => (
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
                    {allCriteria.find(c => c.field === rule.criteriaField)?.description}
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
  onClose,
  onExportCSV,
  removeUserFromWhitelist,
  addUserToWhitelistByCompanyName,
}: {
  whitelist: any;
  onClose: () => void;
  onExportCSV: (whitelist: any) => void;
  removeUserFromWhitelist: any;
  addUserToWhitelistByCompanyName: any;
}) {
  const [companyNameInput, setCompanyNameInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Search for matching company names
  const searchResults = useQuery(
    api.whitelists.searchCompanyNames,
    companyNameInput.length >= 2 ? { searchTerm: companyNameInput } : "skip"
  );

  const handleRemoveUser = async (walletAddress: string, displayName?: string) => {
    if (!confirm(`Remove "${displayName || walletAddress}" from this whitelist?`)) return;

    try {
      await removeUserFromWhitelist({
        whitelistId: whitelist._id,
        walletAddress,
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
    if (!companyNameInput.trim()) {
      alert('Please enter a corporation name');
      return;
    }

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
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <label className="block text-sm text-cyan-300 mb-2">Add User Manually</label>
              <input
                type="text"
                value={companyNameInput}
                onChange={(e) => {
                  setCompanyNameInput(e.target.value);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !showDropdown) handleAddUser();
                }}
                onFocus={() => {
                  if (searchResults && searchResults.length > 0) {
                    setShowDropdown(true);
                  }
                }}
                placeholder="Enter corporation name..."
                className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white"
                disabled={isAdding}
              />

              {/* Autocomplete Dropdown */}
              {showDropdown && searchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-cyan-500/50 rounded shadow-lg max-h-60 overflow-y-auto z-50">
                  {searchResults.map((result, index) => (
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
            <button
              onClick={handleAddUser}
              disabled={isAdding}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? 'Adding...' : '+ Add User'}
            </button>
          </div>
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
                  <th className="text-left py-3 px-4 text-cyan-300 font-bold uppercase tracking-wider">Wallet Address</th>
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
                      {user.walletAddress}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {user.displayName || <span className="text-gray-600 italic">No name</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRemoveUser(user.walletAddress, user.displayName)}
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
          <div className="text-sm text-gray-400">
            Total: <span className="text-cyan-400 font-bold">{whitelist.userCount}</span> eligible users
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

      if (trimmed.startsWith('addr1') || trimmed.startsWith('addr_test1')) {
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
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (addresses.length === 0) {
      alert('Please paste at least one payment address');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createManualWhitelist({
        name: name.trim(),
        description: description.trim() || undefined,
        addresses,
      });
      alert(`Manual whitelist created! ${result.userCount} payment addresses added.`);
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
          <div className="font-bold text-yellow-400 mb-2">⚠️ IMPORTANT: Payment Addresses Only</div>
          <div className="text-gray-300">
            <div>• Only paste <span className="font-mono text-green-400">payment addresses</span> (addr1... or addr_test1...)</div>
            <div>• <span className="font-mono text-red-400">Stake addresses</span> (stake1...) <span className="font-bold">CANNOT</span> receive NFTs and will be rejected</div>
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
            className="w-full bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm text-green-300 mb-2">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes about this whitelist..."
            className="w-full bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white h-20"
          />
        </div>

        {/* Addresses Textarea */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm text-green-300">Payment Addresses</label>
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
            placeholder="Paste payment addresses here (one per line)&#10;addr_test1qz04lcdw53xuhq89lw93m293e6tk82xtwzplyl66p7ajxgsaqtsv4ju9gl6rducnhv5u83ke4fxpwmtun2yh0melw28qzm7v40&#10;addr_test1qpq3w8lqspr0vxa89n64kpq5urqvfuwvazggkvgulumgxssaqtsv4ju9gl6rducnhv5u83ke4fxpwmtun2yh0melw28qgntca8k"
            className="w-full bg-black/50 border border-green-500/30 rounded px-3 py-2 text-white h-64 font-mono text-xs"
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
              <div className="text-green-400">• Valid payment addresses: <span className="font-bold">{validationResult.valid}</span></div>
              {validationResult.invalid > 0 && (
                <div className="text-red-400">• Invalid addresses: <span className="font-bold">{validationResult.invalid}</span></div>
              )}
            </div>
            {validationResult.invalid > 0 && (
              <div className="mt-3 text-xs text-red-300">
                Invalid addresses will be rejected when you create the whitelist. Please remove or fix them.
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
