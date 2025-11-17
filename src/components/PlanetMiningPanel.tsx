'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from "@/convex/_generated/api";

interface PlanetMiningPanelProps {
  federationId: string;
  currentDiversity: number;
  isLeader: boolean;
}

const PLANETS = [
  { name: 'Mercury', difficulty: 50, duration: 2, color: 'from-gray-500 to-gray-600' },
  { name: 'Venus', difficulty: 75, duration: 4, color: 'from-orange-500 to-yellow-600' },
  { name: 'Mars', difficulty: 100, duration: 6, color: 'from-red-600 to-red-700' },
  { name: 'Jupiter', difficulty: 150, duration: 12, color: 'from-orange-400 to-brown-600' },
  { name: 'Saturn', difficulty: 200, duration: 18, color: 'from-yellow-300 to-yellow-500' },
  { name: 'Uranus', difficulty: 250, duration: 24, color: 'from-cyan-400 to-blue-500' },
  { name: 'Neptune', difficulty: 275, duration: 30, color: 'from-blue-600 to-indigo-700' },
  { name: 'Pluto', difficulty: 291, duration: 48, color: 'from-gray-700 to-gray-900' },
];

export default function PlanetMiningPanel({
  federationId,
  currentDiversity,
  isLeader,
}: PlanetMiningPanelProps) {
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});

  const activeMining = useQuery(api.federations.getActiveMining, { federationId });
  const miningHistory = useQuery(api.federations.getMiningHistory, { federationId });

  const startMining = useMutation(api.federations.startMining);
  const completeMining = useMutation(api.federations.completeMining);
  const cancelMining = useMutation(api.federations.cancelMining);

  // Update time remaining for active mining operations
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeMining) {
        const newTimeRemaining: Record<string, number> = {};
        activeMining.forEach((mining) => {
          const remaining = mining.completesAt - Date.now();
          newTimeRemaining[mining.miningId] = Math.max(0, remaining);
        });
        setTimeRemaining(newTimeRemaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeMining]);

  const handleStartMining = async (planetName: string, durationHours: number) => {
    try {
      await startMining({
        federationId,
        planetName,
        durationHours,
      });
      setSelectedPlanet(null);
    } catch (error) {
      alert(`Failed to start mining: ${error}`);
    }
  };

  const handleCompleteMining = async (miningId: string) => {
    try {
      const result = await completeMining({ miningId });
      alert(`Mining complete! Earned: ${JSON.stringify(result.resources)}`);
    } catch (error) {
      alert(`Failed to complete mining: ${error}`);
    }
  };

  const handleCancelMining = async (miningId: string) => {
    if (!confirm('Are you sure you want to cancel this mining operation?')) return;

    try {
      await cancelMining({ miningId });
    } catch (error) {
      alert(`Failed to cancel mining: ${error}`);
    }
  };

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const getSuccessRate = (difficulty: number) => {
    return Math.min(100, Math.floor((currentDiversity / difficulty) * 100));
  };

  return (
    <div className="space-y-6">
      {/* Active Mining Operations */}
      {activeMining && activeMining.length > 0 && (
        <div className="mek-card-industrial mek-border-sharp-gold p-6">
          <h2 className="mek-text-industrial text-2xl mb-4">ACTIVE MINING OPERATIONS</h2>
          <div className="space-y-4">
            {activeMining.map((mining) => {
              const remaining = timeRemaining[mining.miningId] || 0;
              const isComplete = remaining === 0;

              return (
                <div
                  key={mining.miningId}
                  className="bg-black/40 border-2 border-yellow-500/30 p-4 rounded"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-yellow-500 font-bold text-xl">{mining.planetName}</div>
                      <div className="text-gray-400 text-sm">
                        Success Rate: <span className="text-yellow-500">{mining.successRate}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {isComplete ? (
                        <div className="text-green-400 font-bold text-lg">COMPLETE!</div>
                      ) : (
                        <div className="text-blue-400 font-mono text-lg">{formatTime(remaining)}</div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-yellow-500/30">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-1000"
                        style={{
                          width: `${100 - (remaining / (mining.completesAt - mining.startedAt)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isComplete && (
                      <button
                        onClick={() => handleCompleteMining(mining.miningId)}
                        className="mek-button-primary flex-1 py-2"
                      >
                        COLLECT RESOURCES
                      </button>
                    )}
                    {isLeader && !isComplete && (
                      <button
                        onClick={() => handleCancelMining(mining.miningId)}
                        className="bg-red-600/20 border-2 border-red-600/50 px-4 py-2 text-red-400 hover:bg-red-600/40 rounded"
                      >
                        CANCEL
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Planet Selection */}
      {(!activeMining || activeMining.length === 0) && isLeader && (
        <div className="mek-card-industrial mek-border-sharp-gold p-6">
          <h2 className="mek-text-industrial text-2xl mb-4">START MINING OPERATION</h2>
          <p className="text-gray-400 mb-4">
            Your federation has <span className="text-yellow-500 font-bold">{currentDiversity}</span> unique
            variations. Higher diversity increases success rates.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PLANETS.map((planet) => {
              const successRate = getSuccessRate(planet.difficulty);
              const canMine = successRate > 0;

              return (
                <button
                  key={planet.name}
                  onClick={() => canMine && setSelectedPlanet(planet.name)}
                  disabled={!canMine}
                  className={`
                    p-4 rounded border-2 transition-all
                    ${canMine
                      ? selectedPlanet === planet.name
                        ? 'border-yellow-500 bg-yellow-500/20'
                        : 'border-gray-600/50 bg-black/40 hover:border-yellow-500/50'
                      : 'border-gray-700/30 bg-black/20 opacity-40 cursor-not-allowed'
                    }
                  `}
                >
                  <div className={`h-16 rounded bg-gradient-to-br ${planet.color} mb-2`} />
                  <div className="text-center">
                    <div className="font-bold text-yellow-500">{planet.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {planet.difficulty} variations
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{planet.duration}h duration</div>
                    <div className={`text-sm font-bold mt-2 ${successRate >= 75 ? 'text-green-400' : successRate >= 50 ? 'text-yellow-400' : successRate > 0 ? 'text-orange-400' : 'text-red-400'}`}>
                      {successRate}% success
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedPlanet && (
            <div className="mt-6 bg-black/40 border-2 border-yellow-500/30 p-4 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-yellow-500 font-bold text-lg">
                    Start mining {selectedPlanet}?
                  </div>
                  <div className="text-gray-400 text-sm">
                    Duration: {PLANETS.find((p) => p.name === selectedPlanet)?.duration}h
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleStartMining(
                        selectedPlanet,
                        PLANETS.find((p) => p.name === selectedPlanet)?.duration || 6
                      )
                    }
                    className="mek-button-primary px-6 py-2"
                  >
                    START
                  </button>
                  <button
                    onClick={() => setSelectedPlanet(null)}
                    className="bg-gray-600/20 border-2 border-gray-600/50 px-6 py-2 text-gray-400 hover:bg-gray-600/40 rounded"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mining History */}
      {miningHistory && miningHistory.length > 0 && (
        <div className="mek-card-industrial mek-border-sharp-gold p-6">
          <h2 className="mek-text-industrial text-2xl mb-4">MINING HISTORY</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {miningHistory.slice(0, 10).map((mining) => (
              <div
                key={mining.miningId}
                className="bg-black/20 border border-gray-600/30 p-3 rounded flex items-center justify-between"
              >
                <div>
                  <div className="text-yellow-500 font-bold">{mining.planetName}</div>
                  <div className="text-gray-500 text-xs">
                    {new Date(mining.completedAt || 0).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">{mining.successRate}%</div>
                  {mining.resourcesEarned && (
                    <div className="text-gray-400 text-xs">
                      {(mining.resourcesEarned as any).minerals || 0} minerals
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
