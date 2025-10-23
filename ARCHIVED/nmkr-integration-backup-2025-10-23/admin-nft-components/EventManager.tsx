'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import VariationEditor from './VariationEditor';

type EventStatus = "draft" | "active" | "completed" | "archived";

interface CreateEventForm {
  eventNumber: number;
  eventName: string;
  eventSlug: string;
  storyNodeId: string;
  storyContext: string;
  nmkrProjectId: string;
  nmkrProjectName: string;
}

export default function EventManager() {
  const [mode, setMode] = useState<"list" | "create" | "edit" | "variations">("list");
  const [selectedEventId, setSelectedEventId] = useState<Id<"nftEvents"> | null>(null);
  const [selectedEventName, setSelectedEventName] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Queries
  const allEvents = useQuery(api.nftEvents.getAllEvents, {
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  // Mutations
  const createEvent = useMutation(api.nftEvents.createEvent);
  const updateEvent = useMutation(api.nftEvents.updateEvent);
  const toggleActive = useMutation(api.nftEvents.toggleEventActive);
  const archiveEvent = useMutation(api.nftEvents.archiveEvent);

  // Filter events by search term
  const filteredEvents = allEvents?.filter(event =>
    event.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.eventNumber.toString().includes(searchTerm)
  );

  const handleCreateEvent = async (formData: CreateEventForm) => {
    try {
      const eventId = await createEvent({
        eventNumber: formData.eventNumber,
        eventName: formData.eventName,
        eventSlug: formData.eventSlug || formData.eventName.toLowerCase().replace(/\s+/g, '-'),
        storyNodeId: formData.storyNodeId || undefined,
        storyContext: formData.storyContext || undefined,
        nmkrProjectId: formData.nmkrProjectId || undefined,
        nmkrProjectName: formData.nmkrProjectName || undefined,
        createdBy: "admin", // TODO: Get from auth
      });

      setMode("list");
      alert(`Event #${formData.eventNumber} created successfully!`);
    } catch (error) {
      console.error('Error creating event:', error);
      alert(error instanceof Error ? error.message : 'Failed to create event');
    }
  };

  const handleToggleActive = async (eventId: Id<"nftEvents">) => {
    try {
      await toggleActive({ eventId });
    } catch (error) {
      console.error('Error toggling event:', error);
      alert(error instanceof Error ? error.message : 'Failed to toggle event');
    }
  };

  const handleArchive = async (eventId: Id<"nftEvents">) => {
    if (!confirm('Are you sure you want to archive this event?')) return;

    try {
      await archiveEvent({ eventId });
    } catch (error) {
      console.error('Error archiving event:', error);
      alert(error instanceof Error ? error.message : 'Failed to archive event');
    }
  };

  if (mode === "create") {
    return <CreateEventForm onSubmit={handleCreateEvent} onCancel={() => setMode("list")} />;
  }

  if (mode === "edit" && selectedEventId) {
    return (
      <EditEventForm
        eventId={selectedEventId}
        onSave={() => setMode("list")}
        onCancel={() => setMode("list")}
      />
    );
  }

  if (mode === "variations" && selectedEventId) {
    return (
      <VariationEditor
        eventId={selectedEventId}
        eventName={selectedEventName}
        onSave={() => setMode("list")}
        onCancel={() => setMode("list")}
      />
    );
  }

  // List view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 uppercase tracking-wider font-['Orbitron']">
            NFT Events
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Manage Story Climb event NFTs with difficulty variations
          </p>
        </div>
        <button
          onClick={() => setMode("create")}
          className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/30"
          style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
        >
          + Create Event
        </button>
      </div>

      {/* Filters */}
      <div className="bg-black/50 border-2 border-yellow-500/30 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Search Events
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or number..."
              className="w-full bg-black/70 border border-yellow-500/30 rounded px-3 py-2 text-white text-sm focus:border-yellow-500 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EventStatus | "all")}
              className="w-full bg-black/70 border border-yellow-500/30 rounded px-3 py-2 text-white text-sm focus:border-yellow-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {!filteredEvents || filteredEvents.length === 0 ? (
          <div className="bg-black/30 border border-gray-700 rounded-lg p-12 text-center">
            <p className="text-gray-500 text-lg">
              {searchTerm || statusFilter !== "all"
                ? "No events match your filters"
                : "No events created yet. Click 'Create Event' to get started."}
            </p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              onEdit={() => {
                setSelectedEventId(event._id);
                setMode("edit");
              }}
              onManageVariations={() => {
                setSelectedEventId(event._id);
                setSelectedEventName(event.eventName);
                setMode("variations");
              }}
              onToggleActive={() => handleToggleActive(event._id)}
              onArchive={() => handleArchive(event._id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Event Card Component
function EventCard({ event, onEdit, onManageVariations, onToggleActive, onArchive }: any) {
  const eventStats = useQuery(api.nftEvents.getEventStats, { eventId: event._id });

  const statusColors = {
    draft: "bg-gray-600/30 text-gray-400 border-gray-600",
    active: "bg-green-600/30 text-green-400 border-green-600",
    completed: "bg-blue-600/30 text-blue-400 border-blue-600",
    archived: "bg-red-600/30 text-red-400 border-red-600",
  };

  return (
    <div className="bg-gradient-to-r from-black/80 to-gray-900/80 border-2 border-yellow-500/30 rounded-lg p-6 hover:border-yellow-500/60 transition-all">
      <div className="flex items-start justify-between">
        {/* Left side: Event Info */}
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded px-3 py-1">
              <span className="text-yellow-400 font-bold text-lg">#{event.eventNumber}</span>
            </div>
            <h3 className="text-xl font-bold text-white font-['Orbitron']">
              {event.eventName}
            </h3>
            <div className={`px-3 py-1 rounded text-xs font-bold border-2 ${statusColors[event.status as keyof typeof statusColors]}`}>
              {event.status.toUpperCase()}
            </div>
            {event.isActive && (
              <div className="px-3 py-1 rounded text-xs font-bold bg-green-500/20 border-2 border-green-500 text-green-400">
                🟢 LIVE
              </div>
            )}
          </div>

          {event.storyContext && (
            <p className="text-sm text-gray-400 mb-3 max-w-2xl">
              {event.storyContext}
            </p>
          )}

          {/* Stats */}
          {eventStats && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="bg-black/50 border border-blue-500/30 rounded p-3">
                <div className="text-xs text-gray-400 uppercase">Total Supply</div>
                <div className="text-lg font-bold text-blue-400">{eventStats.totalSupply}</div>
              </div>
              <div className="bg-black/50 border border-yellow-500/30 rounded p-3">
                <div className="text-xs text-gray-400 uppercase">Minted</div>
                <div className="text-lg font-bold text-yellow-400">{eventStats.totalMinted}</div>
              </div>
              <div className="bg-black/50 border border-green-500/30 rounded p-3">
                <div className="text-xs text-gray-400 uppercase">Revenue</div>
                <div className="text-lg font-bold text-green-400">{eventStats.totalRevenue.toFixed(0)} ₳</div>
              </div>
              <div className="bg-black/50 border border-purple-500/30 rounded p-3">
                <div className="text-xs text-gray-400 uppercase">Buyers</div>
                <div className="text-lg font-bold text-purple-400">{eventStats.uniqueBuyers}</div>
              </div>
            </div>
          )}

          {/* NMKR Info */}
          {event.nmkrProjectId && (
            <div className="mt-4 text-xs text-gray-500">
              <span className="font-bold">NMKR:</span> {event.nmkrProjectName || event.nmkrProjectId}
            </div>
          )}
        </div>

        {/* Right side: Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onManageVariations}
            className="px-4 py-2 bg-yellow-600/20 border border-yellow-500 text-yellow-400 text-sm font-bold rounded hover:bg-yellow-600/30 transition-all"
          >
            ⚙️ Manage Variations
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600/20 border border-blue-500 text-blue-400 text-sm font-bold rounded hover:bg-blue-600/30 transition-all"
          >
            Edit Event
          </button>
          <button
            onClick={onToggleActive}
            className={`px-4 py-2 border text-sm font-bold rounded transition-all ${
              event.isActive
                ? 'bg-orange-600/20 border-orange-500 text-orange-400 hover:bg-orange-600/30'
                : 'bg-green-600/20 border-green-500 text-green-400 hover:bg-green-600/30'
            }`}
          >
            {event.isActive ? 'Disable' : 'Enable'}
          </button>
          {event.status !== "archived" && (
            <button
              onClick={onArchive}
              className="px-4 py-2 bg-red-600/20 border border-red-500 text-red-400 text-sm font-bold rounded hover:bg-red-600/30 transition-all"
            >
              Archive
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Create Event Form Component
function CreateEventForm({ onSubmit, onCancel }: {
  onSubmit: (data: CreateEventForm) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<CreateEventForm>({
    eventNumber: 1,
    eventName: '',
    eventSlug: '',
    storyNodeId: '',
    storyContext: '',
    nmkrProjectId: '',
    nmkrProjectName: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-yellow-400 uppercase tracking-wider font-['Orbitron']">
          Create New Event
        </h2>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded transition-all"
        >
          ← Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-black/50 border-2 border-yellow-500/30 rounded-lg p-6 space-y-6">
        {/* Event Number */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-yellow-400 mb-2 font-bold">
            Event Number *
          </label>
          <input
            type="number"
            required
            value={formData.eventNumber}
            onChange={(e) => setFormData({ ...formData, eventNumber: parseInt(e.target.value) })}
            className="w-full bg-black/70 border border-yellow-500/30 rounded px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
            placeholder="1"
          />
          <p className="text-xs text-gray-500 mt-1">Unique event number (e.g., 1, 2, 3...)</p>
        </div>

        {/* Event Name */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-yellow-400 mb-2 font-bold">
            Event Name *
          </label>
          <input
            type="text"
            required
            value={formData.eventName}
            onChange={(e) => {
              setFormData({
                ...formData,
                eventName: e.target.value,
                eventSlug: generateSlug(e.target.value),
              });
            }}
            className="w-full bg-black/70 border border-yellow-500/30 rounded px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
            placeholder="Microphone Challenge"
          />
        </div>

        {/* Event Slug (auto-generated) */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
            Event Slug (auto-generated)
          </label>
          <input
            type="text"
            value={formData.eventSlug}
            readOnly
            className="w-full bg-gray-900/50 border border-gray-700 rounded px-3 py-2 text-gray-500 cursor-not-allowed"
          />
        </div>

        {/* Story Context */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-yellow-400 mb-2 font-bold">
            Story Context
          </label>
          <textarea
            value={formData.storyContext}
            onChange={(e) => setFormData({ ...formData, storyContext: e.target.value })}
            className="w-full bg-black/70 border border-yellow-500/30 rounded px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
            rows={3}
            placeholder="Describe the story event that triggers this NFT opportunity..."
          />
        </div>

        {/* Story Node ID */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-yellow-400 mb-2 font-bold">
            Story Node ID (Optional)
          </label>
          <input
            type="text"
            value={formData.storyNodeId}
            onChange={(e) => setFormData({ ...formData, storyNodeId: e.target.value })}
            className="w-full bg-black/70 border border-yellow-500/30 rounded px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
            placeholder="story-node-123"
          />
        </div>

        {/* NMKR Project ID */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-yellow-400 mb-2 font-bold">
            NMKR Project ID (Optional)
          </label>
          <input
            type="text"
            value={formData.nmkrProjectId}
            onChange={(e) => setFormData({ ...formData, nmkrProjectId: e.target.value })}
            className="w-full bg-black/70 border border-yellow-500/30 rounded px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
            placeholder="37f3f44a1d004aceb88aa43fb400cedd"
          />
          <p className="text-xs text-gray-500 mt-1">Link to existing NMKR project if already created</p>
        </div>

        {/* NMKR Project Name */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-yellow-400 mb-2 font-bold">
            NMKR Project Name (Optional)
          </label>
          <input
            type="text"
            value={formData.nmkrProjectName}
            onChange={(e) => setFormData({ ...formData, nmkrProjectName: e.target.value })}
            className="w-full bg-black/70 border border-yellow-500/30 rounded px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
            placeholder="Microphone Challenge NFTs"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider transition-all shadow-lg shadow-yellow-500/30"
          >
            Create Event
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold uppercase tracking-wider transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// Edit Event Form Component (similar to create, but with existing data)
function EditEventForm({ eventId, onSave, onCancel }: {
  eventId: Id<"nftEvents">;
  onSave: () => void;
  onCancel: () => void;
}) {
  const event = useQuery(api.nftEvents.getEventById, { eventId });
  const updateEventMutation = useMutation(api.nftEvents.updateEvent);

  const [formData, setFormData] = useState({
    eventName: '',
    eventSlug: '',
    storyNodeId: '',
    storyContext: '',
    status: 'draft' as EventStatus,
    nmkrProjectId: '',
    nmkrProjectName: '',
  });

  // Load event data when available
  useState(() => {
    if (event) {
      setFormData({
        eventName: event.eventName,
        eventSlug: event.eventSlug,
        storyNodeId: event.storyNodeId || '',
        storyContext: event.storyContext || '',
        status: event.status,
        nmkrProjectId: event.nmkrProjectId || '',
        nmkrProjectName: event.nmkrProjectName || '',
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateEventMutation({
        eventId,
        eventName: formData.eventName,
        eventSlug: formData.eventSlug,
        storyNodeId: formData.storyNodeId || undefined,
        storyContext: formData.storyContext || undefined,
        status: formData.status,
        nmkrProjectId: formData.nmkrProjectId || undefined,
        nmkrProjectName: formData.nmkrProjectName || undefined,
      });
      onSave();
    } catch (error) {
      console.error('Error updating event:', error);
      alert(error instanceof Error ? error.message : 'Failed to update event');
    }
  };

  if (!event) {
    return <div className="text-center py-8 text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 uppercase tracking-wider font-['Orbitron']">
            Edit Event #{event.eventNumber}
          </h2>
          <p className="text-sm text-gray-400 mt-1">{event.eventName}</p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded transition-all"
        >
          ← Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-black/50 border-2 border-yellow-500/30 rounded-lg p-6 space-y-6">
        {/* Similar fields as create form, but event number is readonly */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold">
            Event Number
          </label>
          <input
            type="number"
            value={event.eventNumber}
            readOnly
            className="w-full bg-gray-900/50 border border-gray-700 rounded px-3 py-2 text-gray-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-yellow-400 mb-2 font-bold">
            Event Name *
          </label>
          <input
            type="text"
            required
            value={formData.eventName}
            onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
            className="w-full bg-black/70 border border-yellow-500/30 rounded px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-yellow-400 mb-2 font-bold">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as EventStatus })}
            className="w-full bg-black/70 border border-yellow-500/30 rounded px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-yellow-400 mb-2 font-bold">
            Story Context
          </label>
          <textarea
            value={formData.storyContext}
            onChange={(e) => setFormData({ ...formData, storyContext: e.target.value })}
            className="w-full bg-black/70 border border-yellow-500/30 rounded px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-yellow-400 mb-2 font-bold">
            NMKR Project ID
          </label>
          <input
            type="text"
            value={formData.nmkrProjectId}
            onChange={(e) => setFormData({ ...formData, nmkrProjectId: e.target.value })}
            className="w-full bg-black/70 border border-yellow-500/30 rounded px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider transition-all shadow-lg shadow-yellow-500/30"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold uppercase tracking-wider transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
