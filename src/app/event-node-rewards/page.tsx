'use client';

import { useState, useEffect } from 'react';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
// Navigation is provided by Providers wrapper - no need to import

interface EventNode {
  eventNumber: number;
  name: string;
  goldReward: number;
  xpReward: number;
  items?: Array<{
    id: string;
    name: string;
    type: string;
    category?: string;
  }>;
}

interface ChapterData {
  chapter: number;
  minGold: number;
  maxGold: number;
  minXP: number;
  maxXP: number;
  events: EventNode[];
}

export default function EventNodeRewards() {
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [bulkNamesInput, setBulkNamesInput] = useState('');
  const [saveName, setSaveName] = useState('');
  const [selectedSaveId, setSelectedSaveId] = useState<Id<"eventNodeConfigs"> | null>(null);
  const [itemSearchTerms, setItemSearchTerms] = useState<{ [key: number]: string }>({});
  const [showItemSearch, setShowItemSearch] = useState<{ [key: number]: boolean }>({});
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  
  const saveConfiguration = useMutation(api.eventNodeRewards.saveConfiguration);
  const deleteConfiguration = useMutation(api.eventNodeRewards.deleteConfiguration);
  const savedConfigs = useQuery(api.eventNodeRewards.getConfigurations);
  const selectedConfig = useQuery(
    api.eventNodeRewards.loadConfiguration,
    selectedSaveId ? { configId: selectedSaveId } : "skip"
  );
  
  // Get search results for the active search
  const activeSearchTerm = activeSearchIndex !== null ? (itemSearchTerms[activeSearchIndex] || '') : '';
  const searchResults = useQuery(
    api.gameItemsSearch.searchGameItems,
    activeSearchTerm.length >= 2 ? { searchTerm: activeSearchTerm } : "skip"
  );

  const [chaptersData, setChaptersData] = useState<ChapterData[]>(() => {
    // Initialize with 10 chapters, each with 20 events
    const initialData: ChapterData[] = [];
    for (let chapter = 1; chapter <= 10; chapter++) {
      const events: EventNode[] = [];
      const startEvent = (chapter - 1) * 20 + 1;
      for (let i = 0; i < 20; i++) {
        events.push({
          eventNumber: startEvent + i,
          name: `Event ${startEvent + i}`,
          goldReward: 100 + (i * 45), // Default linear distribution 100-1000
          xpReward: 10 + (i * 5), // Default XP distribution 10-105
          items: []
        });
      }
      initialData.push({
        chapter,
        minGold: 100,
        maxGold: 1000,
        minXP: 10,
        maxXP: 105,
        events
      });
    }
    return initialData;
  });

  // Load selected configuration
  useEffect(() => {
    if (selectedConfig?.data) {
      try {
        const loadedData = JSON.parse(selectedConfig.data);
        setChaptersData(loadedData);
      } catch (error) {
        console.error('Failed to parse configuration data:', error);
      }
    }
  }, [selectedConfig]);

  // Calculate linear distribution of rewards
  const calculateRewards = (min: number, max: number): number[] => {
    const rewards: number[] = [];
    const step = (max - min) / 19; // 19 steps between 20 events
    for (let i = 0; i < 20; i++) {
      // Use floor for all but the last item to ensure last item gets max value
      if (i === 19) {
        rewards.push(max);
      } else {
        rewards.push(Math.floor(min + (step * i)));
      }
    }
    return rewards;
  };

  // Update gold range for current chapter
  const updateGoldRange = (minGold: number, maxGold: number) => {
    const newChaptersData = [...chaptersData];
    const chapterIndex = selectedChapter - 1;
    const goldRewards = calculateRewards(minGold, maxGold);
    
    newChaptersData[chapterIndex] = {
      ...newChaptersData[chapterIndex],
      minGold,
      maxGold,
      events: newChaptersData[chapterIndex].events.map((event, index) => ({
        ...event,
        goldReward: goldRewards[index]
      }))
    };
    
    setChaptersData(newChaptersData);
  };

  // Update XP range for current chapter
  const updateXPRange = (minXP: number, maxXP: number) => {
    const newChaptersData = [...chaptersData];
    const chapterIndex = selectedChapter - 1;
    const xpRewards = calculateRewards(minXP, maxXP);
    
    newChaptersData[chapterIndex] = {
      ...newChaptersData[chapterIndex],
      minXP,
      maxXP,
      events: newChaptersData[chapterIndex].events.map((event, index) => ({
        ...event,
        xpReward: xpRewards[index]
      }))
    };
    
    setChaptersData(newChaptersData);
  };

  // Update event name
  const updateEventName = (eventIndex: number, name: string) => {
    const newChaptersData = [...chaptersData];
    const chapterIndex = selectedChapter - 1;
    newChaptersData[chapterIndex].events[eventIndex].name = name;
    setChaptersData(newChaptersData);
  };

  // Get the image path for an event
  const getEventImagePath = (eventNumber: number) => {
    return `/event-images/event-${eventNumber}.png`;
  };

  // Add item to event
  const addItemToEvent = (eventIndex: number, item: any) => {
    const newChaptersData = [...chaptersData];
    const chapterIndex = selectedChapter - 1;
    if (!newChaptersData[chapterIndex].events[eventIndex].items) {
      newChaptersData[chapterIndex].events[eventIndex].items = [];
    }
    // Check if item already exists
    const exists = newChaptersData[chapterIndex].events[eventIndex].items?.some(
      i => i.id === item.id
    );
    if (!exists) {
      newChaptersData[chapterIndex].events[eventIndex].items?.push(item);
      setChaptersData(newChaptersData);
    }
    // Clear search
    setItemSearchTerms(prev => ({ ...prev, [eventIndex]: '' }));
    setShowItemSearch(prev => ({ ...prev, [eventIndex]: false }));
  };

  // Remove item from event
  const removeItemFromEvent = (eventIndex: number, itemId: string) => {
    const newChaptersData = [...chaptersData];
    const chapterIndex = selectedChapter - 1;
    newChaptersData[chapterIndex].events[eventIndex].items = 
      newChaptersData[chapterIndex].events[eventIndex].items?.filter(
        item => item.id !== itemId
      ) || [];
    setChaptersData(newChaptersData);
  };

  // Apply bulk names
  const applyBulkNames = () => {
    const names = bulkNamesInput.split(',').map(n => n.trim()).filter(n => n);
    if (names.length === 0) return;

    const newChaptersData = [...chaptersData];
    const chapterIndex = selectedChapter - 1;
    
    // Apply names to events (up to 20)
    for (let i = 0; i < Math.min(names.length, 20); i++) {
      newChaptersData[chapterIndex].events[i].name = names[i];
    }
    
    setChaptersData(newChaptersData);
    setBulkNamesInput('');
  };

  // Save configuration
  const handleSave = async () => {
    if (!saveName.trim()) {
      alert('Please enter a save name');
      return;
    }

    try {
      // Save the data as is (no images stored anymore)
      const dataToSave = chaptersData;
      
      await saveConfiguration({
        name: saveName,
        data: JSON.stringify(dataToSave),
        timestamp: Date.now(),
      });
      alert('Configuration saved successfully!');
      setSaveName('');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration');
    }
  };

  // Load configuration
  const handleLoad = (configId: Id<"eventNodeConfigs">) => {
    setSelectedSaveId(configId);
  };

  // Delete configuration
  const handleDelete = async (configId: Id<"eventNodeConfigs">) => {
    if (confirm('Are you sure you want to delete this save?')) {
      try {
        await deleteConfiguration({ configId });
        if (selectedSaveId === configId) {
          setSelectedSaveId(null);
        }
      } catch (error) {
        console.error('Failed to delete configuration:', error);
      }
    }
  };

  const currentChapter = chaptersData[selectedChapter - 1];

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8 font-orbitron text-center">
          Event Node Rewards Manager
        </h1>


        {/* Save/Load Controls */}
        <div className="mb-8 bg-gray-900/50 backdrop-blur-sm border border-yellow-400/20 rounded-lg p-6">
          <div className="flex flex-col gap-4">
            {/* Save Controls */}
            <div className="flex gap-4 items-center">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Enter save name..."
                className="flex-1 bg-black border border-yellow-400/30 text-yellow-400 px-4 py-2 rounded-lg focus:outline-none focus:border-yellow-400"
              />
              <button
                onClick={handleSave}
                className="bg-green-600/20 border border-green-600/50 text-green-400 px-6 py-2 rounded-lg hover:bg-green-600/30 transition-all"
              >
                Save Configuration
              </button>
            </div>

            {/* Saved Configurations List */}
            {savedConfigs && savedConfigs.length > 0 && (
              <div className="border-t border-yellow-400/20 pt-4">
                <h3 className="text-yellow-400 mb-2 font-semibold">Saved Configurations:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {savedConfigs.map((config) => (
                    <div
                      key={config._id}
                      className={`bg-black/50 border rounded-lg p-3 flex justify-between items-center ${
                        selectedSaveId === config._id
                          ? 'border-yellow-400 bg-yellow-400/10'
                          : 'border-yellow-400/20'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="text-yellow-400 text-sm font-semibold">{config.name}</div>
                        <div className="text-yellow-400/60 text-xs">
                          {new Date(config.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoad(config._id)}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDelete(config._id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chapter Selector */}
        <div className="mb-8 flex justify-center">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-yellow-400/20 rounded-lg p-6">
            <label className="block text-yellow-400 mb-2 font-semibold">
              Select Chapter
            </label>
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(Number(e.target.value))}
              className="bg-black border border-yellow-400/30 text-yellow-400 px-4 py-2 rounded-lg focus:outline-none focus:border-yellow-400 min-w-[200px]"
            >
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Chapter {i + 1} (Events {i * 20 + 1}-{(i + 1) * 20})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Names Input */}
        <div className="mb-8 bg-gray-900/50 backdrop-blur-sm border border-yellow-400/20 rounded-lg p-6">
          <label className="block text-yellow-400 mb-2 font-semibold">
            Bulk Event Names (comma-separated, up to 20)
          </label>
          <div className="flex gap-4">
            <textarea
              value={bulkNamesInput}
              onChange={(e) => setBulkNamesInput(e.target.value)}
              placeholder="Event 1, Event 2, Event 3, ..."
              className="flex-1 bg-black border border-yellow-400/30 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-yellow-400 min-h-[80px]"
            />
            <button
              onClick={applyBulkNames}
              className="bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 px-6 py-2 rounded-lg hover:bg-yellow-400/20 transition-all h-fit"
            >
              Apply Names
            </button>
          </div>
        </div>

        {/* Gold and XP Range Controls */}
        <div className="mb-8 grid grid-cols-2 gap-8">
          {/* Gold Range */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-yellow-400/20 rounded-lg p-6">
            <h3 className="text-yellow-400 font-bold mb-4">Gold Rewards</h3>
            <div className="flex gap-4">
              <div>
                <label className="block text-yellow-400/80 mb-1 text-sm">
                  Min (Event {(selectedChapter - 1) * 20 + 1})
                </label>
                <input
                  type="number"
                  value={currentChapter.minGold}
                  onChange={(e) => updateGoldRange(Number(e.target.value), currentChapter.maxGold)}
                  className="bg-black border border-yellow-400/30 text-yellow-400 px-4 py-2 rounded-lg focus:outline-none focus:border-yellow-400 w-32"
                />
              </div>
              <div>
                <label className="block text-yellow-400/80 mb-1 text-sm">
                  Max (Event {selectedChapter * 20})
                </label>
                <input
                  type="number"
                  value={currentChapter.maxGold}
                  onChange={(e) => updateGoldRange(currentChapter.minGold, Number(e.target.value))}
                  className="bg-black border border-yellow-400/30 text-yellow-400 px-4 py-2 rounded-lg focus:outline-none focus:border-yellow-400 w-32"
                />
              </div>
            </div>
          </div>

          {/* XP Range */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-yellow-400/20 rounded-lg p-6">
            <h3 className="text-yellow-400 font-bold mb-4">XP Rewards</h3>
            <div className="flex gap-4">
              <div>
                <label className="block text-yellow-400/80 mb-1 text-sm">
                  Min (Event {(selectedChapter - 1) * 20 + 1})
                </label>
                <input
                  type="number"
                  value={currentChapter.minXP}
                  onChange={(e) => updateXPRange(Number(e.target.value), currentChapter.maxXP)}
                  className="bg-black border border-yellow-400/30 text-yellow-400 px-4 py-2 rounded-lg focus:outline-none focus:border-yellow-400 w-32"
                />
              </div>
              <div>
                <label className="block text-yellow-400/80 mb-1 text-sm">
                  Max (Event {selectedChapter * 20})
                </label>
                <input
                  type="number"
                  value={currentChapter.maxXP}
                  onChange={(e) => updateXPRange(currentChapter.minXP, Number(e.target.value))}
                  className="bg-black border border-yellow-400/30 text-yellow-400 px-4 py-2 rounded-lg focus:outline-none focus:border-yellow-400 w-32"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Event Nodes Grid */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-yellow-400/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
            Chapter {selectedChapter} Events
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentChapter.events.map((event, index) => {
              const isActiveSearch = activeSearchIndex === index;
              const currentSearchResults = isActiveSearch ? searchResults : null;
              return (
              <div
                key={event.eventNumber}
                className="bg-black/50 border border-yellow-400/10 rounded-lg p-4 hover:border-yellow-400/30 transition-all"
              >
                {/* Event Header with Image */}
                <div className="flex items-center gap-3 mb-3">
                  {/* Event Image */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gray-800 border border-yellow-400/20 overflow-hidden flex items-center justify-center">
                      <img 
                        src={getEventImagePath(event.eventNumber)} 
                        alt={event.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <span className="text-yellow-400/40 text-xs hidden">IMG</span>
                    </div>
                  </div>
                  
                  {/* Event Info */}
                  <div className="flex-1">
                    <div className="text-yellow-400/60 text-xs">
                      Event {event.eventNumber}
                    </div>
                    <div className="flex gap-3 text-sm">
                      <span className="text-yellow-400 font-bold">
                        {event.goldReward} G
                      </span>
                      <span className="text-blue-400 font-bold">
                        {event.xpReward} XP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event Name Input */}
                <input
                  type="text"
                  value={event.name}
                  onChange={(e) => updateEventName(index, e.target.value)}
                  className="w-full bg-black/50 border border-yellow-400/20 text-white px-2 py-1 rounded focus:outline-none focus:border-yellow-400/50 text-sm mb-2"
                  placeholder="Event name..."
                />
                
                {/* Item Rewards Section */}
                <div className="mt-2 pt-2 border-t border-yellow-400/10">
                  {/* Show existing items */}
                  {event.items && event.items.length > 0 && (
                    <div className="mb-2">
                      {event.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-black/30 rounded px-2 py-1 mb-1 text-xs">
                          <span className="text-yellow-400/80">{item.name}</span>
                          <button
                            onClick={() => removeItemFromEvent(index, item.id)}
                            className="text-red-400 hover:text-red-300 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add Item Button / Search */}
                  {!showItemSearch[index] ? (
                    <button
                      onClick={() => {
                        setShowItemSearch(prev => ({ ...prev, [index]: true }));
                        setActiveSearchIndex(index);
                      }}
                      className="w-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 px-2 py-1 rounded text-xs hover:bg-yellow-400/20 transition-all"
                    >
                      + Add Item Reward
                    </button>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={itemSearchTerms[index] || ''}
                        onChange={(e) => {
                          setItemSearchTerms(prev => ({ ...prev, [index]: e.target.value }));
                          setActiveSearchIndex(index);
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            if (!itemSearchTerms[index]) {
                              setShowItemSearch(prev => ({ ...prev, [index]: false }));
                              if (activeSearchIndex === index) {
                                setActiveSearchIndex(null);
                              }
                            }
                          }, 200);
                        }}
                        placeholder="Search items (min 2 chars)..."
                        className="w-full bg-black/50 border border-yellow-400/20 text-white px-2 py-1 rounded text-xs focus:outline-none focus:border-yellow-400/50"
                        autoFocus
                      />
                      
                      {/* Search Results Dropdown */}
                      {currentSearchResults && currentSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-yellow-400/30 rounded-lg max-h-40 overflow-y-auto z-10">
                          {currentSearchResults.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => addItemToEvent(index, item)}
                              className="w-full text-left px-2 py-1 hover:bg-yellow-400/20 text-xs transition-all"
                            >
                              <div className="text-yellow-400">{item.name}</div>
                              <div className="text-yellow-400/60">{item.type} - {item.category}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 bg-gray-900/50 backdrop-blur-sm border border-yellow-400/20 rounded-lg p-6">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">Chapter Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-yellow-400/80">
            <div>
              <span className="text-yellow-400/60">Total Events: </span>
              <span className="font-bold">20</span>
            </div>
            <div>
              <span className="text-yellow-400/60">Gold Range: </span>
              <span className="font-bold">{currentChapter.minGold} - {currentChapter.maxGold}</span>
            </div>
            <div>
              <span className="text-yellow-400/60">XP Range: </span>
              <span className="font-bold">{currentChapter.minXP} - {currentChapter.maxXP}</span>
            </div>
            <div>
              <span className="text-yellow-400/60">Total Chapter Gold: </span>
              <span className="font-bold">
                {currentChapter.events.reduce((sum, event) => sum + event.goldReward, 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-yellow-400/60">Total Chapter XP: </span>
              <span className="font-bold">
                {currentChapter.events.reduce((sum, event) => sum + event.xpReward, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Export/Import Controls */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => {
              const dataStr = JSON.stringify(chaptersData, null, 2);
              const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
              const exportFileDefaultName = 'event-node-rewards.json';
              const linkElement = document.createElement('a');
              linkElement.setAttribute('href', dataUri);
              linkElement.setAttribute('download', exportFileDefaultName);
              linkElement.click();
            }}
            className="bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 px-6 py-2 rounded-lg hover:bg-yellow-400/20 transition-all"
          >
            Export Data
          </button>
          
          <label className="bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 px-6 py-2 rounded-lg hover:bg-yellow-400/20 transition-all cursor-pointer">
            Import Data
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const data = JSON.parse(event.target?.result as string);
                      setChaptersData(data);
                    } catch (error) {
                      console.error('Invalid JSON file');
                    }
                  };
                  reader.readAsText(file);
                }
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}