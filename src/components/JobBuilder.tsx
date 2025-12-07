'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id, Doc } from '@/convex/_generated/dataModel';

type JobWithUmbrella = Doc<'jobTypes'> & {
  umbrella: Doc<'jobUmbrellas'> | null;
};

interface JobFormData {
  name: string;
  description: string;
  isOneOff: boolean;
  umbrellaId: string;
  baseGoldPerHour: number;
  attaboyMin: number;
  attaboyMax: number;
  pitStopCount: number;
  tier: string;
}

const DEFAULT_FORM: JobFormData = {
  name: '',
  description: '',
  isOneOff: true,
  umbrellaId: '',
  baseGoldPerHour: 50,
  attaboyMin: 10,
  attaboyMax: 50,
  pitStopCount: 3,
  tier: 'tier1',
};

export default function JobBuilder() {
  // Sub-tab state
  const [activeSubTab, setActiveSubTab] = useState<'builder' | 'list' | 'umbrellas' | 'pitstops'>('builder');

  // Form state
  const [formData, setFormData] = useState<JobFormData>(DEFAULT_FORM);
  const [editingJobId, setEditingJobId] = useState<Id<'jobTypes'> | null>(null);
  const [showNewUmbrellaInput, setShowNewUmbrellaInput] = useState(false);
  const [newUmbrellaName, setNewUmbrellaName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Queries
  const jobs = useQuery(api.jobs.getJobsWithUmbrellas);
  const umbrellas = useQuery(api.jobs.getActiveUmbrellas);

  // Mutations
  const createJob = useMutation(api.jobs.createJob);
  const updateJob = useMutation(api.jobs.updateJob);
  const deleteJob = useMutation(api.jobs.deleteJob);
  const createUmbrella = useMutation(api.jobs.createUmbrella);
  const toggleJobActive = useMutation(api.jobs.toggleJobActive);

  // Auto-clear messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Reset form
  const resetForm = () => {
    setFormData(DEFAULT_FORM);
    setEditingJobId(null);
    setShowNewUmbrellaInput(false);
    setNewUmbrellaName('');
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Job name is required' });
      return;
    }

    if (formData.attaboyMin > formData.attaboyMax) {
      setMessage({ type: 'error', text: 'Attaboy minimum cannot be greater than maximum' });
      return;
    }

    try {
      const jobData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        isOneOff: formData.isOneOff,
        umbrellaId: formData.isOneOff ? undefined : (formData.umbrellaId as Id<'jobUmbrellas'>) || undefined,
        baseGoldPerHour: formData.baseGoldPerHour,
        attaboyMin: formData.attaboyMin,
        attaboyMax: formData.attaboyMax,
        pitStopCount: formData.pitStopCount,
        tier: formData.tier || undefined,
      };

      if (editingJobId) {
        await updateJob({ id: editingJobId, ...jobData });
        setMessage({ type: 'success', text: 'Job updated successfully' });
      } else {
        await createJob(jobData);
        setMessage({ type: 'success', text: 'Job created successfully' });
      }

      resetForm();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save job' });
    }
  };

  // Handle edit
  const handleEdit = (job: JobWithUmbrella) => {
    setFormData({
      name: job.name,
      description: job.description || '',
      isOneOff: job.isOneOff,
      umbrellaId: job.umbrellaId || '',
      baseGoldPerHour: job.baseGoldPerHour,
      attaboyMin: job.attaboyMin,
      attaboyMax: job.attaboyMax,
      pitStopCount: job.pitStopCount,
      tier: job.tier || 'tier1',
    });
    setEditingJobId(job._id);
    setActiveSubTab('builder');
  };

  // Handle delete
  const handleDelete = async (id: Id<'jobTypes'>) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    try {
      await deleteJob({ id });
      setMessage({ type: 'success', text: 'Job deleted' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete job' });
    }
  };

  // Handle new umbrella creation
  const handleCreateUmbrella = async () => {
    if (!newUmbrellaName.trim()) return;

    try {
      const id = await createUmbrella({ name: newUmbrellaName.trim() });
      setFormData(prev => ({ ...prev, umbrellaId: id, isOneOff: false }));
      setShowNewUmbrellaInput(false);
      setNewUmbrellaName('');
      setMessage({ type: 'success', text: 'Collection created' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to create collection' });
    }
  };

  // Stats
  const jobCount = jobs?.length || 0;
  const activeJobCount = jobs?.filter(j => j.isActive).length || 0;
  const umbrellaCount = umbrellas?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">briefcase</span>
          <h2 className="text-xl font-bold text-yellow-400 uppercase tracking-wider">Job System</h2>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4 text-sm">
          <div className="px-3 py-1.5 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
            <span className="text-cyan-400">{jobCount}</span>
            <span className="text-gray-400 ml-1">Jobs</span>
          </div>
          <div className="px-3 py-1.5 bg-green-500/20 rounded-lg border border-green-500/30">
            <span className="text-green-400">{activeJobCount}</span>
            <span className="text-gray-400 ml-1">Active</span>
          </div>
          <div className="px-3 py-1.5 bg-purple-500/20 rounded-lg border border-purple-500/30">
            <span className="text-purple-400">{umbrellaCount}</span>
            <span className="text-gray-400 ml-1">Collections</span>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`p-3 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-500/20 border-green-500/30 text-green-400'
              : 'bg-red-500/20 border-red-500/30 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {[
          { id: 'builder', label: 'Job Builder', icon: '+' },
          { id: 'list', label: 'All Jobs', icon: '#' },
          { id: 'umbrellas', label: 'Collections', icon: '@' },
          { id: 'pitstops', label: 'Pit Stops', icon: '!' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
            className={`px-4 py-2 text-sm font-medium uppercase tracking-wider rounded-t-lg transition-all ${
              activeSubTab === tab.id
                ? 'bg-yellow-500/20 text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* BUILDER TAB */}
      {activeSubTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Form */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingJobId ? 'Edit Job' : 'Create New Job'}
            </h3>

            <div className="space-y-4">
              {/* Job Name */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Job Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g., Miner, Engineer, Guard..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Description (Admin)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
                  placeholder="Optional admin notes"
                />
              </div>

              {/* Tier Selection */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Job Tier</label>
                <div className="flex gap-2">
                  {(['tier1', 'tier2', 'tier3'] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setFormData(prev => ({ ...prev, tier }))}
                      className={`flex-1 px-4 py-2 text-sm uppercase tracking-wider rounded-lg border transition-all ${
                        formData.tier === tier
                          ? tier === 'tier1'
                            ? 'bg-green-500/20 border-green-500 text-green-400'
                            : tier === 'tier2'
                            ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                            : 'bg-purple-500/20 border-purple-500 text-purple-400'
                          : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      {tier === 'tier1' ? 'Tier I' : tier === 'tier2' ? 'Tier II' : 'Tier III'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job Type (One-off vs Collection) */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Job Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, isOneOff: true, umbrellaId: '' }))}
                    className={`flex-1 px-4 py-2 text-sm uppercase tracking-wider rounded-lg border transition-all ${
                      formData.isOneOff
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                        : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    Standalone
                  </button>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, isOneOff: false }))}
                    className={`flex-1 px-4 py-2 text-sm uppercase tracking-wider rounded-lg border transition-all ${
                      !formData.isOneOff
                        ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                        : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    In Collection
                  </button>
                </div>
              </div>

              {/* Collection Selection (if not standalone) */}
              {!formData.isOneOff && (
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Collection</label>
                  {!showNewUmbrellaInput ? (
                    <div className="flex gap-2">
                      <select
                        value={formData.umbrellaId}
                        onChange={(e) => setFormData(prev => ({ ...prev, umbrellaId: e.target.value }))}
                        className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
                      >
                        <option value="">Select a collection...</option>
                        {umbrellas?.map((u: Doc<'jobUmbrellas'>) => (
                          <option key={u._id} value={u._id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setShowNewUmbrellaInput(true)}
                        className="px-3 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                      >
                        + New
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newUmbrellaName}
                        onChange={(e) => setNewUmbrellaName(e.target.value)}
                        placeholder="Collection name..."
                        className="flex-1 px-3 py-2 bg-gray-900 border border-green-500/50 rounded-lg text-white text-sm focus:border-green-500 focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={handleCreateUmbrella}
                        disabled={!newUmbrellaName.trim()}
                        className="px-3 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors disabled:opacity-50"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setShowNewUmbrellaInput(false);
                          setNewUmbrellaName('');
                        }}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg text-sm hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Parameters Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Pit Stops</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.pitStopCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, pitStopCount: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Gold/Hour</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.baseGoldPerHour}
                    onChange={(e) => setFormData(prev => ({ ...prev, baseGoldPerHour: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none text-center"
                  />
                </div>
              </div>

              {/* Attaboy Range */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Attaboy Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={formData.attaboyMin}
                    onChange={(e) => setFormData(prev => ({ ...prev, attaboyMin: parseInt(e.target.value) || 0 }))}
                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none text-center"
                    placeholder="Min"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.attaboyMax}
                    onChange={(e) => setFormData(prev => ({ ...prev, attaboyMax: parseInt(e.target.value) || 0 }))}
                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none text-center"
                    placeholder="Max"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg text-sm font-medium uppercase tracking-wider hover:bg-cyan-500/30 transition-colors"
                >
                  {editingJobId ? 'Update Job' : 'Create Job'}
                </button>
                {editingJobId && (
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium uppercase tracking-wider hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Preview</h3>

            <div className={`rounded-lg border p-4 ${
              formData.tier === 'tier1'
                ? 'bg-green-500/10 border-green-500/50'
                : formData.tier === 'tier2'
                ? 'bg-blue-500/10 border-blue-500/50'
                : 'bg-purple-500/10 border-purple-500/50'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-lg font-bold uppercase tracking-wider ${
                  formData.tier === 'tier1'
                    ? 'text-green-400'
                    : formData.tier === 'tier2'
                    ? 'text-blue-400'
                    : 'text-purple-400'
                }`}>
                  {formData.name || 'Untitled Job'}
                </span>
                <span className={`px-2 py-0.5 text-xs rounded ${
                  formData.tier === 'tier1'
                    ? 'bg-green-500/20 text-green-400'
                    : formData.tier === 'tier2'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {formData.tier === 'tier1' ? 'TIER I' : formData.tier === 'tier2' ? 'TIER II' : 'TIER III'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-black/30 rounded-lg p-3 text-center">
                  <div className="text-gray-400 text-xs uppercase mb-1">Gold/Hour</div>
                  <div className="text-yellow-400 font-bold">{formData.baseGoldPerHour}</div>
                </div>
                <div className="bg-black/30 rounded-lg p-3 text-center">
                  <div className="text-gray-400 text-xs uppercase mb-1">Attaboy</div>
                  <div className="text-green-400 font-bold">{formData.attaboyMin}-{formData.attaboyMax}</div>
                </div>
                <div className="bg-black/30 rounded-lg p-3 text-center">
                  <div className="text-gray-400 text-xs uppercase mb-1">Pit Stops</div>
                  <div className="text-cyan-400 font-bold">{formData.pitStopCount}</div>
                </div>
              </div>

              {!formData.isOneOff && formData.umbrellaId && (
                <div className="mt-3 text-xs text-gray-400">
                  Collection: <span className="text-purple-400">{umbrellas?.find((u: Doc<'jobUmbrellas'>) => u._id === formData.umbrellaId)?.name || 'Unknown'}</span>
                </div>
              )}
            </div>

            {/* Info Card */}
            <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
              <div className="text-xs text-gray-500 space-y-1">
                <p><span className="text-green-400">Tier I:</span> Basic jobs, 3-4 pit stops, lower rewards</p>
                <p><span className="text-blue-400">Tier II:</span> Intermediate, 5-6 pit stops, medium rewards</p>
                <p><span className="text-purple-400">Tier III:</span> Advanced, 8-10 pit stops, best rewards</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JOBS LIST TAB */}
      {activeSubTab === 'list' && (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">All Jobs ({jobs?.length || 0})</h3>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {jobs?.map((job: JobWithUmbrella) => (
              <div
                key={job._id}
                className={`p-3 rounded-lg border transition-all ${
                  job.isActive
                    ? 'bg-gray-700/50 border-gray-600'
                    : 'bg-gray-800/50 border-gray-700 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{job.name}</span>
                      <span className={`px-1.5 py-0.5 text-xs rounded ${
                        job.tier === 'tier1'
                          ? 'bg-green-500/20 text-green-400'
                          : job.tier === 'tier2'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {job.tier === 'tier1' ? 'I' : job.tier === 'tier2' ? 'II' : 'III'}
                      </span>
                      {job.umbrella && (
                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                          {job.umbrella.name}
                        </span>
                      )}
                      {!job.isActive && (
                        <span className="px-1.5 py-0.5 bg-gray-600 text-gray-400 text-xs rounded">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span><span className="text-yellow-400">{job.baseGoldPerHour}</span> gold/hr</span>
                      <span>Attaboy: <span className="text-green-400">{job.attaboyMin}-{job.attaboyMax}</span></span>
                      <span><span className="text-cyan-400">{job.pitStopCount}</span> pit stops</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleJobActive({ id: job._id })}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        job.isActive
                          ? 'text-yellow-400 hover:bg-yellow-500/20'
                          : 'text-green-400 hover:bg-green-500/20'
                      }`}
                    >
                      {job.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleEdit(job)}
                      className="px-2 py-1 text-xs text-cyan-400 hover:bg-cyan-500/20 rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(job._id)}
                      className="px-2 py-1 text-xs text-red-400 hover:bg-red-500/20 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {(!jobs || jobs.length === 0) && (
              <div className="text-center text-gray-500 py-8">
                No jobs created yet. Create your first job!
              </div>
            )}
          </div>
        </div>
      )}

      {/* UMBRELLAS/COLLECTIONS TAB */}
      {activeSubTab === 'umbrellas' && (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Job Collections ({umbrellas?.length || 0})</h3>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {umbrellas?.map((umbrella: Doc<'jobUmbrellas'>) => {
              const jobsInUmbrella = jobs?.filter(j => j.umbrellaId === umbrella._id) || [];
              return (
                <div
                  key={umbrella._id}
                  className="p-4 rounded-lg border border-gray-600 bg-gray-700/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{umbrella.name}</span>
                        <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded">
                          {jobsInUmbrella.length} jobs
                        </span>
                      </div>
                      {umbrella.description && (
                        <div className="text-xs text-gray-400 mt-1">{umbrella.description}</div>
                      )}
                      {jobsInUmbrella.length > 0 && (
                        <div className="text-xs text-gray-500 mt-2">
                          Jobs: {jobsInUmbrella.map(j => j.name).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {(!umbrellas || umbrellas.length === 0) && (
              <div className="text-center text-gray-500 py-8">
                No collections yet. Create a collection to group related jobs!
              </div>
            )}
          </div>
        </div>
      )}

      {/* PIT STOPS TAB */}
      {activeSubTab === 'pitstops' && (
        <div className="space-y-6">
          {/* Overview */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Pit Stop Buff System</h3>
            <p className="text-gray-400 text-sm mb-4">
              When a Mek reaches a pit stop milestone, they are presented with 3 random buff options to choose from.
              Each buff has a tier (Bronze, Silver, Gold, Diamond) that determines its value.
            </p>

            {/* Buff Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Flat Gold Buff */}
              <div className="bg-gray-900/50 rounded-lg border border-yellow-500/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">coins</span>
                  <h4 className="text-yellow-400 font-bold uppercase tracking-wider">Flat Gold</h4>
                </div>
                <p className="text-gray-500 text-xs mb-3">One-time gold bonus applied immediately</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-amber-600">Bronze</span>
                    <span className="text-gray-400">100 gold</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Silver</span>
                    <span className="text-gray-400">200 gold</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-400">Gold</span>
                    <span className="text-gray-400">500 gold</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-300">Diamond</span>
                    <span className="text-gray-400">1,000 gold</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Coming Soon</span>
                </div>
              </div>

              {/* Gold/Hour Buff */}
              <div className="bg-gray-900/50 rounded-lg border border-gray-600/30 p-4 opacity-50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">chart</span>
                  <h4 className="text-gray-400 font-bold uppercase tracking-wider">Gold/Hour</h4>
                </div>
                <p className="text-gray-500 text-xs mb-3">Permanent increase to gold mining rate</p>
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <span className="px-2 py-1 bg-gray-600/30 text-gray-500 text-xs rounded">Not Implemented</span>
                </div>
              </div>

              {/* Flat Essence Buff */}
              <div className="bg-gray-900/50 rounded-lg border border-gray-600/30 p-4 opacity-50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">gem</span>
                  <h4 className="text-gray-400 font-bold uppercase tracking-wider">Flat Essence</h4>
                </div>
                <p className="text-gray-500 text-xs mb-3">One-time essence bonus applied immediately</p>
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <span className="px-2 py-1 bg-gray-600/30 text-gray-500 text-xs rounded">Not Implemented</span>
                </div>
              </div>

              {/* Essence/Day Buff */}
              <div className="bg-gray-900/50 rounded-lg border border-gray-600/30 p-4 opacity-50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">sparkle</span>
                  <h4 className="text-gray-400 font-bold uppercase tracking-wider">Essence/Day</h4>
                </div>
                <p className="text-gray-500 text-xs mb-3">Permanent increase to essence generation</p>
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <span className="px-2 py-1 bg-gray-600/30 text-gray-500 text-xs rounded">Not Implemented</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tier Explanation */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Buff Tiers</h3>
            <p className="text-gray-400 text-sm mb-4">
              Each pit stop randomly selects 3 buffs. Each buff rolls its tier independently based on RNG.
            </p>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-amber-900/20 rounded-lg border border-amber-600/30 p-4 text-center">
                <div className="text-2xl font-bold text-amber-600 mb-1">Bronze</div>
                <div className="text-xs text-gray-500">Common</div>
              </div>
              <div className="bg-gray-600/20 rounded-lg border border-gray-400/30 p-4 text-center">
                <div className="text-2xl font-bold text-gray-300 mb-1">Silver</div>
                <div className="text-xs text-gray-500">Uncommon</div>
              </div>
              <div className="bg-yellow-900/20 rounded-lg border border-yellow-500/30 p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400 mb-1">Gold</div>
                <div className="text-xs text-gray-500">Rare</div>
              </div>
              <div className="bg-cyan-900/20 rounded-lg border border-cyan-400/30 p-4 text-center">
                <div className="text-2xl font-bold text-cyan-300 mb-1">Diamond</div>
                <div className="text-xs text-gray-500">Legendary</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
