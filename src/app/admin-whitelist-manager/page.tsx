'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

export default function AdminWhitelistManager() {
  const convex = useConvex();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWhitelist, setEditingWhitelist] = useState<any | null>(null);
  const [selectedWhitelist, setSelectedWhitelist] = useState<Id<"whitelists"> | null>(null);
  const [viewingWhitelistTable, setViewingWhitelistTable] = useState<any | null>(null);

  // Standard Convex queries
  const allWhitelists = useQuery(api.whitelists.getAllWhitelists) || [];
  const allCriteria = useQuery(api.whitelists.getAllCriteria) || [];
  const selectedWhitelistData = useQuery(
    api.whitelists.getWhitelistById,
    selectedWhitelist ? { whitelistId: selectedWhitelist } : "skip"
  );

  // Standard Convex mutations
  const initializeCriteriaMutation = useMutation(api.whitelists.initializeDefaultCriteria);
  const deleteWhitelistMutation = useMutation(api.whitelists.deleteWhitelist);
  const generateWhitelistMutation = useMutation(api.whitelists.generateWhitelist);

  // Initialize default criteria on mount
  useEffect(() => {
    if (allCriteria && allCriteria.length === 0) {
      initializeCriteriaMutation({});
    }
  }, [allCriteria, initializeCriteriaMutation]);

  const handleGenerateWhitelist = async (whitelistId: Id<"whitelists">) => {
    try {
      const result = await generateWhitelistMutation({ whitelistId });
      alert(`Whitelist generated! ${result.userCount} eligible users found.`);
    } catch (error: any) {
      alert(`Error generating whitelist: ${error.message}`);
    }
  };

  const handleDeleteWhitelist = async (whitelistId: Id<"whitelists">) => {
    if (!confirm('Are you sure you want to delete this whitelist?')) return;
    try {
      await deleteWhitelistMutation({ whitelistId });
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
      ['Wallet Address', 'Display Name', 'User ID'],
      ...whitelist.eligibleUsers.map((u: any) => [
        u.walletAddress,
        u.displayName || 'N/A',
        u.userId || 'N/A'
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

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-cyan-400 mb-2">Whitelist Manager</h1>
            <p className="text-gray-400">Create and manage NFT whitelist eligibility rules</p>
          </div>
          <div className="flex gap-4 items-center">
            {/* Database indicator - single database now */}
            <div className="bg-gray-900 border border-green-500/30 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Database</div>
              <div className="text-green-400 font-bold">Production (Sturgeon)</div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-bold transition-all"
            >
              + Create New Whitelist
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

                    <div className="flex gap-2">
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
                  {selectedWhitelistData.rules.map((rule: any, index: number) => (
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
                <div className="bg-black/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-cyan-400">
                      Eligible Users ({selectedWhitelistData.userCount})
                    </h4>
                    {selectedWhitelistData.lastGenerated > 0 && (
                      <div className="text-xs text-gray-500">
                        Updated: {new Date(selectedWhitelistData.lastGenerated).toLocaleString()}
                      </div>
                    )}
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
              </div>
            )}
          </div>
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-cyan-500/50 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-cyan-500/30">
              <div>
                <h2 className="text-2xl font-bold text-cyan-400">{viewingWhitelistTable.name}</h2>
                {viewingWhitelistTable.description && (
                  <p className="text-gray-400 text-sm mt-1">{viewingWhitelistTable.description}</p>
                )}
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>{viewingWhitelistTable.userCount} eligible users</span>
                  <span>•</span>
                  <span>{viewingWhitelistTable.rules.length} rules ({viewingWhitelistTable.ruleLogic})</span>
                  {viewingWhitelistTable.lastGenerated > 0 && (
                    <>
                      <span>•</span>
                      <span>Last generated: {new Date(viewingWhitelistTable.lastGenerated).toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setViewingWhitelistTable(null)}
                className="text-gray-400 hover:text-white text-3xl"
              >
                ×
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-6">
              {viewingWhitelistTable.userCount === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <div className="text-6xl mb-4">📋</div>
                  <div className="text-xl">No eligible users yet</div>
                  <div className="text-sm mt-2">Click "Regenerate" to populate this whitelist</div>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-900">
                    <tr className="border-b-2 border-cyan-500/30">
                      <th className="text-left py-3 px-4 text-cyan-300 font-bold uppercase tracking-wider">#</th>
                      <th className="text-left py-3 px-4 text-cyan-300 font-bold uppercase tracking-wider">Wallet Address</th>
                      <th className="text-left py-3 px-4 text-cyan-300 font-bold uppercase tracking-wider">Display Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingWhitelistTable.eligibleUsers.map((user: any, index: number) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-cyan-500/30 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Total: <span className="text-cyan-400 font-bold">{viewingWhitelistTable.userCount}</span> eligible users
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleExportCSV(viewingWhitelistTable);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => setViewingWhitelistTable(null)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
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

  const [isSaving, setIsSaving] = useState(false);

  // Standard Convex mutations
  const createWhitelist = useMutation(api.whitelists.createWhitelist);
  const updateWhitelist = useMutation(api.whitelists.updateWhitelist);

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
