'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

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
  const [activeSubTab, setActiveSubTab] = useState<'builder' | 'list'>('builder');

  // Form state
  const [formData, setFormData] = useState<JobFormData>(DEFAULT_FORM);
  const [editingJobId, setEditingJobId] = useState<Id<'jobTypes'> | null>(null);
  const [showNewUmbrellaInput, setShowNewUmbrellaInput] = useState(false);
  const [newUmbrellaName, setNewUmbrellaName] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Queries
  const jobs = useQuery(api.jobs.getJobsWithUmbrellas);
  const umbrellas = useQuery(api.jobs.getActiveUmbrellas);

  // Mutations
  const createJob = useMutation(api.jobs.createJob);
  const updateJob = useMutation(api.jobs.updateJob);
  const deleteJob = useMutation(api.jobs.deleteJob);
  const createUmbrella = useMutation(api.jobs.createUmbrella);
  const toggleJobActive = useMutation(api.jobs.toggleJobActive);

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
      alert('Job name is required');
      return;
    }

    if (formData.attaboyMin > formData.attaboyMax) {
      alert('Attaboy minimum cannot be greater than maximum');
      return;
    }

    setSaveStatus('saving');

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
      } else {
        await createJob(jobData);
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      resetForm();
    } catch (error) {
      console.error('Error saving job:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Handle edit
  const handleEdit = (job: NonNullable<typeof jobs>[0]) => {
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
    await deleteJob({ id });
  };

  // Handle new umbrella creation
  const handleCreateUmbrella = async () => {
    if (!newUmbrellaName.trim()) return;

    try {
      const id = await createUmbrella({ name: newUmbrellaName.trim() });
      setFormData(prev => ({ ...prev, umbrellaId: id, isOneOff: false }));
      setShowNewUmbrellaInput(false);
      setNewUmbrellaName('');
    } catch (error) {
      console.error('Error creating umbrella:', error);
    }
  };

  // Tier colors
  const tierColors: Record<string, { bg: string; border: string; text: string }> = {
    tier1: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400' },
    tier2: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400' },
    tier3: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400' },
  };

  const currentTierColors = tierColors[formData.tier] || tierColors.tier1;

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700/50 pb-3">
        <button
          onClick={() => setActiveSubTab('builder')}
          className={`px-4 py-2 font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'builder'
              ? 'bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400'
              : 'bg-black/50 border-2 border-gray-600/50 text-gray-400 hover:border-yellow-500/50'
          }`}
        >
          Job Builder
        </button>
        <button
          onClick={() => setActiveSubTab('list')}
          className={`px-4 py-2 font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'list'
              ? 'bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400'
              : 'bg-black/50 border-2 border-gray-600/50 text-gray-400 hover:border-yellow-500/50'
          }`}
        >
          Job List ({jobs?.length ?? 0})
        </button>
      </div>

      {/* Builder Tab */}
      {activeSubTab === 'builder' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-yellow-400 uppercase tracking-wider">
              {editingJobId ? 'Edit Job' : 'Create New Job'}
            </h4>
            {editingJobId && (
              <button
                onClick={resetForm}
                className="px-3 py-1 text-sm bg-gray-600/50 border border-gray-500 text-gray-300 hover:bg-gray-600 transition-all"
              >
                Cancel Edit
              </button>
            )}
          </div>

          {/* Job Name */}
          <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
              Job Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Miner, Engineer, Guard..."
              className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-500/50 rounded text-yellow-300 text-lg font-bold focus:border-yellow-500 focus:outline-none placeholder:text-gray-600"
            />
          </div>

          {/* Tier Selection */}
          <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
              Job Tier
            </label>
            <div className="flex gap-3">
              {(['tier1', 'tier2', 'tier3'] as const).map((tier) => {
                const colors = tierColors[tier];
                const isSelected = formData.tier === tier;
                return (
                  <button
                    key={tier}
                    onClick={() => setFormData(prev => ({ ...prev, tier }))}
                    className={`flex-1 px-4 py-3 font-bold uppercase tracking-wider transition-all ${
                      isSelected
                        ? `${colors.bg} border-2 ${colors.border} ${colors.text}`
                        : `bg-black/50 border-2 border-gray-600/50 text-gray-400 hover:${colors.border}/50`
                    }`}
                  >
                    {tier === 'tier1' ? 'Tier I' : tier === 'tier2' ? 'Tier II' : 'Tier III'}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Tier I: Basic jobs (3-4 pit stops) | Tier II: Intermediate (5-6 pit stops) | Tier III: Advanced (8-10 pit stops)
            </p>
          </div>

          {/* One-off vs Umbrella */}
          <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
              Job Type
            </label>
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setFormData(prev => ({ ...prev, isOneOff: true, umbrellaId: '' }))}
                className={`flex-1 px-4 py-3 font-bold uppercase tracking-wider transition-all ${
                  formData.isOneOff
                    ? 'bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400'
                    : 'bg-black/50 border-2 border-gray-600/50 text-gray-400 hover:border-yellow-500/50'
                }`}
              >
                Standalone (One-off)
              </button>
              <button
                onClick={() => setFormData(prev => ({ ...prev, isOneOff: false }))}
                className={`flex-1 px-4 py-3 font-bold uppercase tracking-wider transition-all ${
                  !formData.isOneOff
                    ? 'bg-blue-500/20 border-2 border-blue-500 text-blue-400'
                    : 'bg-black/50 border-2 border-gray-600/50 text-gray-400 hover:border-blue-500/50'
                }`}
              >
                Part of Collection
              </button>
            </div>

            {/* Umbrella Selection (only shown if not one-off) */}
            {!formData.isOneOff && (
              <div className="space-y-3">
                {!showNewUmbrellaInput ? (
                  <>
                    <div className="flex gap-2">
                      <select
                        value={formData.umbrellaId}
                        onChange={(e) => setFormData(prev => ({ ...prev, umbrellaId: e.target.value }))}
                        className="flex-1 px-4 py-3 bg-black/50 border-2 border-blue-500/50 rounded text-blue-300 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select a collection...</option>
                        {umbrellas?.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setShowNewUmbrellaInput(true)}
                        className="px-4 py-3 bg-green-500/20 border-2 border-green-500/50 text-green-400 font-bold hover:bg-green-500/30 hover:border-green-500 transition-all"
                      >
                        + New
                      </button>
                    </div>
                    {umbrellas?.length === 0 && (
                      <p className="text-xs text-gray-500">
                        No collections yet. Create one to group related jobs together.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newUmbrellaName}
                      onChange={(e) => setNewUmbrellaName(e.target.value)}
                      placeholder="New collection name (e.g., Mining, Combat...)"
                      className="flex-1 px-4 py-3 bg-black/50 border-2 border-green-500/50 rounded text-green-300 focus:border-green-500 focus:outline-none placeholder:text-gray-600"
                      autoFocus
                    />
                    <button
                      onClick={handleCreateUmbrella}
                      disabled={!newUmbrellaName.trim()}
                      className="px-4 py-3 bg-green-500/20 border-2 border-green-500/50 text-green-400 font-bold hover:bg-green-500/30 hover:border-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowNewUmbrellaInput(false);
                        setNewUmbrellaName('');
                      }}
                      className="px-4 py-3 bg-gray-600/50 border-2 border-gray-500 text-gray-300 hover:bg-gray-600 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Parameters Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Pit Stop Count */}
            <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                Pit Stop Count
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.pitStopCount}
                onChange={(e) => setFormData(prev => ({ ...prev, pitStopCount: parseInt(e.target.value) || 1 }))}
                className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-500/50 rounded text-yellow-300 text-2xl font-bold text-center focus:border-yellow-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Buff milestones per level
              </p>
            </div>

            {/* Base Gold per Hour */}
            <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                Base Gold/Hour
              </label>
              <input
                type="number"
                min="0"
                value={formData.baseGoldPerHour}
                onChange={(e) => setFormData(prev => ({ ...prev, baseGoldPerHour: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-500/50 rounded text-yellow-300 text-2xl font-bold text-center focus:border-yellow-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Guaranteed hourly income
              </p>
            </div>

            {/* Attaboy Range */}
            <div className="col-span-2 bg-black/40 border border-yellow-500/30 rounded-lg p-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                Attaboy Range (Daily Bonus)
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Minimum</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.attaboyMin}
                    onChange={(e) => setFormData(prev => ({ ...prev, attaboyMin: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-black/50 border-2 border-green-500/50 rounded text-green-300 text-xl font-bold text-center focus:border-green-500 focus:outline-none"
                  />
                </div>
                <span className="text-2xl text-gray-500 font-bold">→</span>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Maximum</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.attaboyMax}
                    onChange={(e) => setFormData(prev => ({ ...prev, attaboyMax: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-black/50 border-2 border-orange-500/50 rounded text-orange-300 text-xl font-bold text-center focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Daily RNG bonus range (bell curve distribution)
              </p>
            </div>
          </div>

          {/* Preview Card */}
          <div className={`${currentTierColors.bg} border-2 ${currentTierColors.border} rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs uppercase tracking-wider ${currentTierColors.text}`}>Preview</span>
              <span className={`px-2 py-1 text-xs font-bold ${currentTierColors.bg} ${currentTierColors.text} rounded`}>
                {formData.tier === 'tier1' ? 'TIER I' : formData.tier === 'tier2' ? 'TIER II' : 'TIER III'}
              </span>
            </div>
            <h5 className={`text-xl font-bold ${currentTierColors.text} uppercase tracking-wider`}>
              {formData.name || 'Untitled Job'}
            </h5>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div className="bg-black/30 rounded p-2 text-center">
                <span className="text-gray-400 block text-xs">Gold/Hour</span>
                <span className="text-yellow-300 font-bold">{formData.baseGoldPerHour}</span>
              </div>
              <div className="bg-black/30 rounded p-2 text-center">
                <span className="text-gray-400 block text-xs">Attaboy</span>
                <span className="text-green-300 font-bold">{formData.attaboyMin}-{formData.attaboyMax}</span>
              </div>
              <div className="bg-black/30 rounded p-2 text-center">
                <span className="text-gray-400 block text-xs">Pit Stops</span>
                <span className="text-blue-300 font-bold">{formData.pitStopCount}</span>
              </div>
            </div>
            {!formData.isOneOff && formData.umbrellaId && (
              <div className="mt-2 text-xs text-gray-400">
                Collection: {umbrellas?.find(u => u._id === formData.umbrellaId)?.name || 'Unknown'}
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`w-full px-6 py-4 font-bold uppercase tracking-wider text-lg transition-all ${
              saveStatus === 'saving'
                ? 'bg-gray-600/50 border-2 border-gray-500 text-gray-400 cursor-wait'
                : saveStatus === 'saved'
                ? 'bg-green-500/30 border-2 border-green-500 text-green-400'
                : saveStatus === 'error'
                ? 'bg-red-500/30 border-2 border-red-500 text-red-400'
                : 'bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500/30'
            }`}
          >
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error - Try Again' : editingJobId ? 'Update Job' : 'Create Job'}
          </button>
        </div>
      )}

      {/* List Tab */}
      {activeSubTab === 'list' && (
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-yellow-400 uppercase tracking-wider">
            All Jobs
          </h4>

          {!jobs || jobs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No jobs created yet</p>
              <button
                onClick={() => setActiveSubTab('builder')}
                className="text-yellow-400 hover:underline"
              >
                Create your first job
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const colors = tierColors[job.tier || 'tier1'] || tierColors.tier1;
                return (
                  <div
                    key={job._id}
                    className={`${colors.bg} border-2 ${colors.border} rounded-lg p-4 ${!job.isActive ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h5 className={`text-lg font-bold ${colors.text} uppercase tracking-wider`}>
                          {job.name}
                        </h5>
                        <span className={`px-2 py-0.5 text-xs font-bold ${colors.bg} ${colors.text} rounded`}>
                          {job.tier === 'tier1' ? 'I' : job.tier === 'tier2' ? 'II' : 'III'}
                        </span>
                        {job.umbrella && (
                          <span className="px-2 py-0.5 text-xs bg-blue-500/30 text-blue-300 rounded">
                            {job.umbrella.name}
                          </span>
                        )}
                        {!job.isActive && (
                          <span className="px-2 py-0.5 text-xs bg-red-500/30 text-red-300 rounded">
                            INACTIVE
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleJobActive({ id: job._id })}
                          className={`px-3 py-1 text-xs font-bold transition-all ${
                            job.isActive
                              ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30'
                              : 'bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30'
                          }`}
                        >
                          {job.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleEdit(job)}
                          className="px-3 py-1 text-xs bg-blue-500/20 border border-blue-500/50 text-blue-400 font-bold hover:bg-blue-500/30 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(job._id)}
                          className="px-3 py-1 text-xs bg-red-500/20 border border-red-500/50 text-red-400 font-bold hover:bg-red-500/30 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                      <div className="bg-black/30 rounded p-2 text-center">
                        <span className="text-gray-400 block text-xs">Gold/Hour</span>
                        <span className="text-yellow-300 font-bold">{job.baseGoldPerHour}</span>
                      </div>
                      <div className="bg-black/30 rounded p-2 text-center">
                        <span className="text-gray-400 block text-xs">Attaboy</span>
                        <span className="text-green-300 font-bold">{job.attaboyMin}-{job.attaboyMax}</span>
                      </div>
                      <div className="bg-black/30 rounded p-2 text-center">
                        <span className="text-gray-400 block text-xs">Pit Stops</span>
                        <span className="text-blue-300 font-bold">{job.pitStopCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
