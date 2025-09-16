'use client';

import React, { useState, useEffect } from 'react';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface EventNode {
  eventNumber: number;
  name: string;
  goldReward: number;
  xpReward: number;
  essenceRewards?: Array<{
    variation: string;
    abundanceRank: number; // 1-80, where 1 is least abundant
  }>;
  items?: Array<{
    id: string;
    name: string;
    type: string;
    category?: string;
  }>;
}

export default function EventNodeEditor() {
  const [itemSearchTerms, setItemSearchTerms] = useState<{ [key: number]: string }>({});
  const [showItemSearch, setShowItemSearch] = useState<{ [key: number]: boolean }>({});
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [currentConfigId, setCurrentConfigId] = useState<Id<"eventNodeConfigs"> | null>(null);
  const [currentConfigName, setCurrentConfigName] = useState<string>('');
  const [saveName, setSaveName] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set([1]));
  const [bulkNames, setBulkNames] = useState('');
  const [showLoadLightbox, setShowLoadLightbox] = useState(false);
  const [previewImage, setPreviewImage] = useState<number | null>(null);

  // Global ranges for all 200 events
  const [globalRanges, setGlobalRanges] = useState({
    minGold: 100,
    maxGold: 10000,
    goldRounding: 'none' as 'none' | '5' | '10',
    minXP: 10,
    maxXP: 1000,
    xpRounding: 'none' as 'none' | '5' | '10'
  });

  const saveConfiguration = useMutation(api.eventNodeRewards.saveConfiguration);
  const updateConfiguration = useMutation(api.eventNodeRewards.updateConfiguration);
  const deleteConfiguration = useMutation(api.eventNodeRewards.deleteConfiguration);
  const savedConfigs = useQuery(api.eventNodeRewards.getConfigurations);
  const selectedConfig = useQuery(
    api.eventNodeRewards.loadConfiguration,
    currentConfigId ? { configId: currentConfigId } : "skip"
  );

  // Get search results for the active search
  const activeSearchTerm = activeSearchIndex !== null ? (itemSearchTerms[activeSearchIndex] || '') : '';
  const searchResults = useQuery(
    api.gameItemsSearch.searchGameItems,
    activeSearchTerm.length >= 2 ? { searchTerm: activeSearchTerm } : "skip"
  );

  const [eventsData, setEventsData] = useState<EventNode[]>(() => {
    // Initialize with 200 events (20 per chapter × 10 chapters)
    const initialData: EventNode[] = [];
    for (let i = 1; i <= 200; i++) {
      initialData.push({
        eventNumber: i,
        name: `Event ${i}`,
        goldReward: 100,
        xpReward: 10,
        items: []
      });
    }
    return initialData;
  });

  // Load selected configuration
  useEffect(() => {
    if (selectedConfig?.data) {
      try {
        const loadedData = JSON.parse(selectedConfig.data);
        if (loadedData.events) {
          setEventsData(loadedData.events);
        }
        if (loadedData.globalRanges) {
          setGlobalRanges(loadedData.globalRanges);
        }
      } catch (error) {
        console.error('Failed to parse configuration data:', error);
      }
    }
  }, [selectedConfig]);

  // Apply rounding based on setting
  const applyRounding = (value: number, rounding: 'none' | '5' | '10'): number => {
    switch (rounding) {
      case '5':
        // Round to nearest 5
        return Math.round(value / 5) * 5;
      case '10':
        // Round to nearest 10
        return Math.round(value / 10) * 10;
      default:
        return Math.round(value);
    }
  };

  // Apply linear distribution to all 200 events
  const applyGlobalRanges = () => {
    const goldStep = (globalRanges.maxGold - globalRanges.minGold) / 199;
    const xpStep = (globalRanges.maxXP - globalRanges.minXP) / 199;

    const newEventsData = eventsData.map((event, index) => ({
      ...event,
      goldReward: applyRounding(globalRanges.minGold + (goldStep * index), globalRanges.goldRounding),
      xpReward: applyRounding(globalRanges.minXP + (xpStep * index), globalRanges.xpRounding)
    }));

    setEventsData(newEventsData);
  };

  // Apply bulk names to all events
  const applyBulkNames = () => {
    const names = bulkNames.split(',').map(name => name.trim());
    if (names.length === 0) return;

    const newEventsData = eventsData.map((event, index) => ({
      ...event,
      name: names[index] || `Event ${index + 1}`
    }));

    setEventsData(newEventsData);
  };

  // Update event name
  const updateEventName = (eventIndex: number, name: string) => {
    const newEventsData = [...eventsData];
    newEventsData[eventIndex].name = name;
    setEventsData(newEventsData);
  };

  // Update individual event rewards
  const updateEventRewards = (eventIndex: number, gold: number, xp: number) => {
    const newEventsData = [...eventsData];
    newEventsData[eventIndex].goldReward = gold;
    newEventsData[eventIndex].xpReward = xp;
    setEventsData(newEventsData);
  };

  // Add item to event
  const addItemToEvent = (eventIndex: number, item: any) => {
    const newEventsData = [...eventsData];
    if (!newEventsData[eventIndex].items) {
      newEventsData[eventIndex].items = [];
    }
    const exists = newEventsData[eventIndex].items?.some(
      i => i.id === item.id
    );
    if (!exists) {
      newEventsData[eventIndex].items?.push(item);
      setEventsData(newEventsData);
    }
    setItemSearchTerms(prev => ({ ...prev, [eventIndex]: '' }));
    setShowItemSearch(prev => ({ ...prev, [eventIndex]: false }));
  };

  // Remove item from event
  const removeItemFromEvent = (eventIndex: number, itemId: string) => {
    const newEventsData = [...eventsData];
    newEventsData[eventIndex].items =
      newEventsData[eventIndex].items?.filter(
        item => item.id !== itemId
      ) || [];
    setEventsData(newEventsData);
  };

  // Toggle chapter expansion
  const toggleChapter = (chapter: number) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapter)) {
      newExpanded.delete(chapter);
    } else {
      newExpanded.add(chapter);
    }
    setExpandedChapters(newExpanded);
  };

  // Save new configuration
  const handleSave = async () => {
    if (!saveName.trim()) {
      alert('Please enter a save name');
      return;
    }

    try {
      const result = await saveConfiguration({
        name: saveName,
        data: JSON.stringify({ events: eventsData, globalRanges }),
        timestamp: Date.now(),
      });
      alert('Event configuration saved successfully!');
      setSaveName('');
      // Set as current config after saving
      if (result && result._id) {
        setCurrentConfigId(result._id);
        setCurrentConfigName(saveName);
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration');
    }
  };

  // Update existing configuration
  const handleUpdate = async () => {
    if (!currentConfigId) {
      alert('No configuration loaded to update');
      return;
    }

    try {
      await updateConfiguration({
        configId: currentConfigId,
        data: JSON.stringify({ events: eventsData, globalRanges }),
        timestamp: Date.now(),
      });
      alert('Configuration updated successfully!');
    } catch (error) {
      console.error('Failed to update configuration:', error);
      alert('Failed to update configuration');
    }
  };

  // Load configuration
  const handleLoadConfig = (configId: Id<"eventNodeConfigs">, configName: string) => {
    setCurrentConfigId(configId);
    setCurrentConfigName(configName);
    setShowLoadLightbox(false);
  };

  // Calculate and distribute essence rewards for a chapter
  const calculateEssenceDistribution = (chapterNumber: number) => {
    // This would normally analyze the 380 mek nodes in the chapter
    // For now, we'll use placeholder data for the 80 least abundant variations
    // In production, this would come from analyzing the actual mek distribution

    const startIndex = (chapterNumber - 1) * 20;
    const endIndex = startIndex + 20;
    const chapterEvents = eventsData.slice(startIndex, endIndex);

    // Apply the round-robin distribution pattern from the image
    const updatedEvents = chapterEvents.map((event, index) => {
      const eventNum = index + 1; // 1-20

      // Calculate essence ranks based on the pattern shown in the image
      const essenceRewards = [
        { variation: `Essence_${80 - index}`, abundanceRank: 80 - index }, // Most common of the 4
        { variation: `Essence_${60 - index}`, abundanceRank: 60 - index }, // Second tier
        { variation: `Essence_${40 - index}`, abundanceRank: 40 - index }, // Third tier
        { variation: `Essence_${20 - index}`, abundanceRank: 20 - index }, // Rarest of the 4
      ];

      return {
        ...event,
        essenceRewards
      };
    });

    // Update the events data with the new essence rewards
    const newEventsData = [...eventsData];
    updatedEvents.forEach((event, index) => {
      newEventsData[startIndex + index] = event;
    });

    setEventsData(newEventsData);
  };

  // Calculate total rewards
  const totalGold = eventsData.reduce((sum, event) => sum + event.goldReward, 0);
  const totalXP = eventsData.reduce((sum, event) => sum + event.xpReward, 0);

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-gray-800/30 rounded-lg p-4">
        <h4 className="text-sm font-bold text-purple-500/80 mb-3">Event Node Configuration (All 200 Events)</h4>

        {/* Save/Load/Update Controls */}
        <div className="mb-4 space-y-2">
          {currentConfigName && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded px-3 py-2 mb-2">
              <span className="text-xs text-purple-400">Current Config: </span>
              <span className="text-sm text-purple-300 font-semibold">{currentConfigName}</span>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="New configuration name..."
              className="flex-1 px-3 py-2 bg-black/50 border border-purple-500/30 rounded text-sm text-gray-300"
            />
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm transition-colors"
            >
              Save New
            </button>
            {currentConfigId && (
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
              >
                Update
              </button>
            )}
            <button
              onClick={() => setShowLoadLightbox(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm transition-colors"
            >
              Load
            </button>
          </div>
        </div>

        {/* Load Lightbox */}
        {showLoadLightbox && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" style={{ position: 'fixed', top: 0, left: 0 }} onClick={() => setShowLoadLightbox(false)}>
            <div className="bg-gray-900 border border-purple-500/50 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-purple-400 mb-4">Load Configuration</h3>

              {savedConfigs && savedConfigs.length > 0 ? (
                <div className="space-y-2">
                  {savedConfigs.map((config) => (
                    <div
                      key={config._id}
                      className="flex items-center justify-between bg-black/50 border border-purple-500/20 rounded p-3 hover:bg-purple-500/10 transition-colors"
                    >
                      <div>
                        <div className="text-sm text-purple-300 font-semibold">{config.name}</div>
                        <div className="text-xs text-gray-400">
                          Saved: {new Date(config.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadConfig(config._id, config.name)}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs transition-colors"
                        >
                          Load
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Delete "${config.name}"?`)) {
                              await deleteConfiguration({ configId: config._id });
                            }
                          }}
                          className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">No saved configurations</div>
              )}

              <button
                onClick={() => setShowLoadLightbox(false)}
                className="mt-4 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Bulk Name Entry */}
        <div className="mb-4 bg-black/30 rounded p-3">
          <h5 className="text-purple-400 text-sm font-bold mb-2">Bulk Event Names (200 names, comma-separated)</h5>
          <textarea
            value={bulkNames}
            onChange={(e) => setBulkNames(e.target.value)}
            placeholder="Event 1 name, Event 2 name, Event 3 name, ..."
            className="w-full px-3 py-2 bg-black/50 border border-purple-500/30 rounded text-sm text-gray-300 h-24 resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-400">
              {bulkNames.split(',').filter(n => n.trim()).length}/200 names entered
            </span>
            <button
              onClick={applyBulkNames}
              className="px-4 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs transition-colors"
            >
              Apply Names to All Events
            </button>
          </div>
        </div>

        {/* Global Range Controls */}
        <div className="mb-4 bg-black/30 rounded p-3">
          <h5 className="text-purple-400 text-sm font-bold mb-3">Global Reward Ranges (Events 1-200)</h5>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="text-yellow-400 text-xs">Gold Range</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  value={globalRanges.minGold}
                  onChange={(e) => setGlobalRanges({...globalRanges, minGold: Number(e.target.value)})}
                  className="w-24 px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-xs text-yellow-400"
                  placeholder="Min"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  value={globalRanges.maxGold}
                  onChange={(e) => setGlobalRanges({...globalRanges, maxGold: Number(e.target.value)})}
                  className="w-24 px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-xs text-yellow-400"
                  placeholder="Max"
                />
              </div>
              <select
                value={globalRanges.goldRounding}
                onChange={(e) => setGlobalRanges({...globalRanges, goldRounding: e.target.value as any})}
                className="w-full px-2 py-1 bg-black/50 border border-yellow-400/30 rounded text-xs text-yellow-400"
              >
                <option value="none">No Rounding</option>
                <option value="5">Round to 0 or 5</option>
                <option value="10">Round to 10s</option>
              </select>
            </div>

            <div>
              <label className="text-blue-400 text-xs">XP Range</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  value={globalRanges.minXP}
                  onChange={(e) => setGlobalRanges({...globalRanges, minXP: Number(e.target.value)})}
                  className="w-24 px-2 py-1 bg-black/50 border border-blue-400/30 rounded text-xs text-blue-400"
                  placeholder="Min"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  value={globalRanges.maxXP}
                  onChange={(e) => setGlobalRanges({...globalRanges, maxXP: Number(e.target.value)})}
                  className="w-24 px-2 py-1 bg-black/50 border border-blue-400/30 rounded text-xs text-blue-400"
                  placeholder="Max"
                />
              </div>
              <select
                value={globalRanges.xpRounding}
                onChange={(e) => setGlobalRanges({...globalRanges, xpRounding: e.target.value as any})}
                className="w-full px-2 py-1 bg-black/50 border border-blue-400/30 rounded text-xs text-blue-400"
              >
                <option value="none">No Rounding</option>
                <option value="5">Round to 0 or 5</option>
                <option value="10">Round to 10s</option>
              </select>
            </div>
          </div>
          <button
            onClick={applyGlobalRanges}
            className="px-4 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs transition-colors"
          >
            Apply to All Events
          </button>
        </div>

        {/* Events by Chapter (Collapsible) */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(chapter => {
            const chapterEvents = eventsData.slice((chapter - 1) * 20, chapter * 20);
            const chapterGold = chapterEvents.reduce((sum, e) => sum + e.goldReward, 0);
            const chapterXP = chapterEvents.reduce((sum, e) => sum + e.xpReward, 0);
            const isExpanded = expandedChapters.has(chapter);

            return (
              <div key={chapter} className="bg-black/30 rounded border border-purple-500/20">
                <div
                  onClick={() => toggleChapter(chapter)}
                  className="w-full px-3 py-2 flex items-center justify-between hover:bg-purple-500/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-purple-400 font-bold text-sm">
                      Chapter {chapter}
                    </span>
                    <span className="text-gray-400 text-xs">
                      (Events {(chapter - 1) * 20 + 1}-{chapter * 20})
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        calculateEssenceDistribution(chapter);
                      }}
                      className="px-2 py-0.5 bg-purple-600/50 hover:bg-purple-600 text-white rounded text-xs transition-colors"
                    >
                      Calculate Essences
                    </button>
                    <span className="text-yellow-400 text-xs">{chapterGold.toLocaleString()}G</span>
                    <span className="text-blue-400 text-xs">{chapterXP.toLocaleString()}XP</span>
                    <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-3 border-t border-purple-500/20">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Reorder events to be column-by-column instead of row-by-row */}
                      {[...Array(10)].map((_, rowIndex) => {
                        const leftIndex = rowIndex;
                        const rightIndex = rowIndex + 10;
                        const leftEvent = chapterEvents[leftIndex];
                        const rightEvent = chapterEvents[rightIndex];

                        return (
                          <React.Fragment key={rowIndex}>
                            {/* Left column event */}
                            {leftEvent && (
                              <div className="bg-black/50 border border-purple-500/10 rounded p-2 flex gap-2">
                                {/* Circular Thumbnail - Clickable */}
                                <img
                                  src={`/event-images/${leftEvent.eventNumber}.webp`}
                                  alt={`Event ${leftEvent.eventNumber}`}
                                  className="w-[52px] h-[52px] rounded-full object-cover border border-purple-500/30 flex-shrink-0 cursor-pointer hover:border-purple-400"
                                  onClick={() => setPreviewImage(leftEvent.eventNumber)}
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.style.display = 'none';
                                    const placeholder = img.nextElementSibling as HTMLElement;
                                    if (placeholder) placeholder.style.display = 'flex';
                                  }}
                                />
                                <div
                                  className="w-[52px] h-[52px] rounded-full bg-purple-500/20 border border-purple-500/30 flex-shrink-0 items-center justify-center text-xs text-purple-400 hidden cursor-pointer hover:border-purple-400"
                                  style={{ display: 'none' }}
                                  onClick={() => setPreviewImage(leftEvent.eventNumber)}
                                >
                                  {leftEvent.eventNumber}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-purple-400/60 text-xs">#{leftEvent.eventNumber}</span>
                                    <input
                                      type="text"
                                      value={leftEvent.name}
                                      onChange={(e) => updateEventName((chapter - 1) * 20 + leftIndex, e.target.value)}
                                      className="flex-1 px-1 py-0.5 bg-black/30 border border-purple-500/20 rounded text-xs text-gray-300"
                                      placeholder="Event name..."
                                    />
                                  </div>

                                  <div className="flex gap-3 mb-1">
                                    <input
                                      type="text"
                                      value={leftEvent.goldReward.toLocaleString()}
                                      onChange={(e) => updateEventRewards((chapter - 1) * 20 + leftIndex, Number(e.target.value.replace(/,/g, '')), leftEvent.xpReward)}
                                      className="w-20 px-1 py-0.5 bg-black/30 border border-yellow-400/20 rounded text-xs text-yellow-400"
                                    />
                                    <input
                                      type="text"
                                      value={leftEvent.xpReward.toLocaleString()}
                                      onChange={(e) => updateEventRewards((chapter - 1) * 20 + leftIndex, leftEvent.goldReward, Number(e.target.value.replace(/,/g, '')))}
                                      className="w-20 px-1 py-0.5 bg-black/30 border border-blue-400/20 rounded text-xs text-blue-400"
                                    />
                                  </div>

                                  {leftEvent.essenceRewards && leftEvent.essenceRewards.length > 0 && (
                                    <div className="text-xs text-purple-400/80 mt-1">
                                      Essences: {leftEvent.essenceRewards.map(e => e.abundanceRank).join(', ')}
                                    </div>
                                  )}

                                  {leftEvent.items && leftEvent.items.length > 0 && (
                                    <div className="text-xs text-purple-300/60">
                                      +{leftEvent.items.length} item{leftEvent.items.length > 1 ? 's' : ''}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Right column event */}
                            {rightEvent && (
                              <div className="bg-black/50 border border-purple-500/10 rounded p-2 flex gap-2">
                                {/* Circular Thumbnail - Clickable */}
                                <img
                                  src={`/event-images/${rightEvent.eventNumber}.webp`}
                                  alt={`Event ${rightEvent.eventNumber}`}
                                  className="w-[52px] h-[52px] rounded-full object-cover border border-purple-500/30 flex-shrink-0 cursor-pointer hover:border-purple-400"
                                  onClick={() => setPreviewImage(rightEvent.eventNumber)}
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.style.display = 'none';
                                    const placeholder = img.nextElementSibling as HTMLElement;
                                    if (placeholder) placeholder.style.display = 'flex';
                                  }}
                                />
                                <div
                                  className="w-[52px] h-[52px] rounded-full bg-purple-500/20 border border-purple-500/30 flex-shrink-0 items-center justify-center text-xs text-purple-400 hidden cursor-pointer hover:border-purple-400"
                                  style={{ display: 'none' }}
                                  onClick={() => setPreviewImage(rightEvent.eventNumber)}
                                >
                                  {rightEvent.eventNumber}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-purple-400/60 text-xs">#{rightEvent.eventNumber}</span>
                                    <input
                                      type="text"
                                      value={rightEvent.name}
                                      onChange={(e) => updateEventName((chapter - 1) * 20 + rightIndex, e.target.value)}
                                      className="flex-1 px-1 py-0.5 bg-black/30 border border-purple-500/20 rounded text-xs text-gray-300"
                                      placeholder="Event name..."
                                    />
                                  </div>

                                  <div className="flex gap-3 mb-1">
                                    <input
                                      type="text"
                                      value={rightEvent.goldReward.toLocaleString()}
                                      onChange={(e) => updateEventRewards((chapter - 1) * 20 + rightIndex, Number(e.target.value.replace(/,/g, '')), rightEvent.xpReward)}
                                      className="w-20 px-1 py-0.5 bg-black/30 border border-yellow-400/20 rounded text-xs text-yellow-400"
                                    />
                                    <input
                                      type="text"
                                      value={rightEvent.xpReward.toLocaleString()}
                                      onChange={(e) => updateEventRewards((chapter - 1) * 20 + rightIndex, rightEvent.goldReward, Number(e.target.value.replace(/,/g, '')))}
                                      className="w-20 px-1 py-0.5 bg-black/30 border border-blue-400/20 rounded text-xs text-blue-400"
                                    />
                                  </div>

                                  {rightEvent.essenceRewards && rightEvent.essenceRewards.length > 0 && (
                                    <div className="text-xs text-purple-400/80 mt-1">
                                      Essences: {rightEvent.essenceRewards.map(e => e.abundanceRank).join(', ')}
                                    </div>
                                  )}

                                  {rightEvent.items && rightEvent.items.length > 0 && (
                                    <div className="text-xs text-purple-300/60">
                                      +{rightEvent.items.length} item{rightEvent.items.length > 1 ? 's' : ''}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-purple-500/20 grid grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-purple-400/60">Total Gold (All 200): </span>
            <span className="text-yellow-400 font-bold">
              {totalGold.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-purple-400/60">Total XP (All 200): </span>
            <span className="text-blue-400 font-bold">
              {totalXP.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-purple-400/60">Total Events: </span>
            <span className="text-purple-400 font-bold">200</span>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          style={{ position: 'fixed', top: 0, left: 0 }}
          onClick={() => setPreviewImage(null)}
        >
          <div className="bg-gray-900 border border-purple-500/50 rounded-lg p-4 m-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={`/event-images/${previewImage}.webp`}
              alt={`Event ${previewImage}`}
              className="max-w-[600px] max-h-[600px] object-contain rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/event-images/placeholder.webp';
              }}
            />
            <div className="text-center mt-3">
              <div className="text-purple-400 font-bold">Event {previewImage}</div>
              <div className="text-gray-400 text-sm">{eventsData[previewImage - 1]?.name || `Event ${previewImage}`}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}