"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function BotTestingAdmin() {
  const [activeTab, setActiveTab] = useState<'snapshot' | 'bots' | 'monitor'>('snapshot');
  const [snapshotStatus, setSnapshotStatus] = useState<'idle' | 'fetching' | 'complete' | 'error'>('idle');
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  const [timeJumpHours, setTimeJumpHours] = useState(24);
  const [jumpResult, setJumpResult] = useState<any>(null);

  // Bot control states
  const [botConfig, setBotConfig] = useState({
    totalBots: 100,
    behaviorPresets: {
      active: 20,    // Very active users
      moderate: 30,  // Regular users
      casual: 30,    // Occasional users
      dormant: 20    // Rarely active
    },
    simulationSpeed: 1, // 1x speed
    autoVerify: true,
    goldAccumulation: true
  });

  // Queries
  const testBots = useQuery(api.bots.getTestBots);
  const botStatus = useQuery(api.bots.getBotStatus);
  const activeWallets = useQuery(api.bots.getActiveWallets);

  // Mutations
  const createSnapshot = useMutation(api.bots.createWalletSnapshot);
  const initializeBots = useMutation(api.bots.initializeBots);
  const startBotSimulation = useMutation(api.bots.startSimulation);
  const stopBotSimulation = useMutation(api.bots.stopSimulation);
  const clearAllBots = useMutation(api.bots.clearAllBots);
  const simulationTick = useMutation(api.bots.simulationTick);
  const timeJump = useMutation(api.bots.timeJump);

  // Run simulation tick periodically
  useEffect(() => {
    if (botStatus?.isRunning) {
      const interval = setInterval(() => {
        simulationTick();
      }, 1000); // Tick every second

      return () => clearInterval(interval);
    }
  }, [botStatus?.isRunning, simulationTick]);

  const handleSnapshot = async () => {
    setSnapshotStatus('fetching');
    try {
      // In production, this would fetch from Blockfrost/Koios
      // For now, we'll simulate with mock data
      await createSnapshot({
        activeOnly: true,
        daysBack: 30
      });
      setSnapshotStatus('complete');
    } catch (error) {
      setSnapshotStatus('error');
    }
  };

  const handleInitializeBots = async () => {
    if (!activeWallets || activeWallets.length === 0) {
      alert('Please create a wallet snapshot first');
      return;
    }

    await initializeBots({
      config: botConfig,
      walletPool: activeWallets.slice(0, 500) // Use first 500 active wallets
    });
  };

  const handleStartSimulation = async () => {
    await startBotSimulation({
      speed: botConfig.simulationSpeed
    });
  };

  const handleStopSimulation = async () => {
    await stopBotSimulation();
  };

  const handleTimeJump = async () => {
    const result = await timeJump({ hours: timeJumpHours });
    setJumpResult(result);
    // Clear the result after 5 seconds
    setTimeout(() => setJumpResult(null), 5000);
  };

  // Calculate totals for behavior distribution
  const behaviorTotal = Object.values(botConfig.behaviorPresets).reduce((a: any, b: any) => a + b, 0);

  return (
    <div className="p-6">
      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-8 border-b border-yellow-500/30">
        {['snapshot', 'bots', 'monitor'].map((tab: any) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-3 px-6 font-orbitron uppercase tracking-wider transition-all ${
              activeTab === tab
                ? 'text-yellow-500 border-b-2 border-yellow-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'snapshot' && (
        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-yellow-500/30 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-yellow-500 mb-4 font-orbitron">
              WALLET SNAPSHOT
            </h2>

            <div className="space-y-4">
              <div className="bg-black/50 p-4 rounded border border-gray-700">
                <p className="text-sm text-gray-400 mb-2">Snapshot Configuration</p>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={true}
                      className="w-4 h-4 accent-yellow-500"
                      readOnly
                    />
                    <span>Only Active Wallets (Last 30 Days)</span>
                  </label>
                  <div className="text-sm text-gray-500">
                    This will fetch wallets with recent transactions or activity
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSnapshot}
                  disabled={snapshotStatus === 'fetching'}
                  className="px-6 py-3 bg-yellow-500/20 text-yellow-500 border border-yellow-500 hover:bg-yellow-500/30 transition-all font-orbitron uppercase tracking-wider disabled:opacity-50"
                >
                  {snapshotStatus === 'fetching' ? 'Fetching...' : 'Create Snapshot'}
                </button>

                {snapshotStatus === 'complete' && (
                  <div className="text-green-500">
                    ✓ Snapshot complete - {activeWallets?.length || 0} active wallets found
                  </div>
                )}
                {snapshotStatus === 'error' && (
                  <div className="text-red-500">
                    ✗ Error creating snapshot
                  </div>
                )}
              </div>

              {activeWallets && activeWallets.length > 0 && (
                <div className="bg-black/50 p-4 rounded border border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">Wallet Distribution</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total Active:</span>
                      <span className="ml-2 text-yellow-500 font-bold">{activeWallets.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Whales (50+ Meks):</span>
                      <span className="ml-2 text-blue-500 font-bold">
                        {activeWallets.filter((w: any) => w.mekCount > 50).length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Medium (10-50):</span>
                      <span className="ml-2 text-green-500 font-bold">
                        {activeWallets.filter((w: any) => w.mekCount >= 10 && w.mekCount <= 50).length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Small (1-10):</span>
                      <span className="ml-2 text-purple-500 font-bold">
                        {activeWallets.filter((w: any) => w.mekCount < 10).length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bots' && (
        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-yellow-500/30 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-yellow-500 mb-4 font-orbitron">
              BOT CONFIGURATION
            </h2>

            <div className="space-y-4">
              {/* Bot Count */}
              <div className="bg-black/50 p-4 rounded border border-gray-700">
                <p className="text-sm text-gray-400 mb-2">Total Bots to Create</p>
                <input
                  type="number"
                  value={botConfig.totalBots}
                  onChange={(e) => setBotConfig({...botConfig, totalBots: parseInt(e.target.value)})}
                  className="w-32 px-3 py-2 bg-black border border-yellow-500/30 rounded text-yellow-500"
                  min="1"
                  max="500"
                />
              </div>

              {/* Behavior Distribution */}
              <div className="bg-black/50 p-4 rounded border border-gray-700">
                <p className="text-sm text-gray-400 mb-3">
                  Behavior Distribution
                  {behaviorTotal !== botConfig.totalBots && (
                    <span className="ml-2 text-red-500">
                      (Total: {behaviorTotal} - should equal {botConfig.totalBots})
                    </span>
                  )}
                </p>
                <div className="space-y-2">
                  {Object.entries(botConfig.behaviorPresets).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="capitalize text-gray-300">{key} Users:</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => setBotConfig({
                            ...botConfig,
                            behaviorPresets: {
                              ...botConfig.behaviorPresets,
                              [key]: parseInt(e.target.value)
                            }
                          })}
                          className="w-20 px-2 py-1 bg-black border border-gray-600 rounded text-yellow-500"
                          min="0"
                        />
                        <span className="text-gray-500">bots</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simulation Settings */}
              <div className="bg-black/50 p-4 rounded border border-gray-700">
                <p className="text-sm text-gray-400 mb-3">Simulation Settings</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Simulation Speed:</span>
                    <select
                      value={botConfig.simulationSpeed}
                      onChange={(e) => setBotConfig({...botConfig, simulationSpeed: parseFloat(e.target.value)})}
                      className="px-3 py-1 bg-black border border-gray-600 rounded text-yellow-500"
                    >
                      <option value="0.5">0.5x (Slow)</option>
                      <option value="1">1x (Normal)</option>
                      <option value="2">2x (Fast)</option>
                      <option value="5">5x (Very Fast)</option>
                      <option value="10">10x (Ultra Fast)</option>
                    </select>
                  </div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={botConfig.autoVerify}
                      onChange={(e) => setBotConfig({...botConfig, autoVerify: e.target.checked})}
                      className="w-4 h-4 accent-yellow-500"
                    />
                    <span>Auto-Verify Wallets</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={botConfig.goldAccumulation}
                      onChange={(e) => setBotConfig({...botConfig, goldAccumulation: e.target.checked})}
                      className="w-4 h-4 accent-yellow-500"
                    />
                    <span>Simulate Gold Accumulation</span>
                  </label>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleInitializeBots}
                  disabled={!activeWallets || activeWallets.length === 0 || behaviorTotal !== botConfig.totalBots}
                  className="px-6 py-3 bg-green-500/20 text-green-500 border border-green-500 hover:bg-green-500/30 transition-all font-orbitron uppercase tracking-wider disabled:opacity-50"
                >
                  Initialize Bots
                </button>
                <button
                  onClick={handleStartSimulation}
                  disabled={!testBots || testBots.length === 0 || botStatus?.isRunning}
                  className="px-6 py-3 bg-yellow-500/20 text-yellow-500 border border-yellow-500 hover:bg-yellow-500/30 transition-all font-orbitron uppercase tracking-wider disabled:opacity-50"
                >
                  Start Simulation
                </button>
                <button
                  onClick={handleStopSimulation}
                  disabled={!botStatus?.isRunning}
                  className="px-6 py-3 bg-red-500/20 text-red-500 border border-red-500 hover:bg-red-500/30 transition-all font-orbitron uppercase tracking-wider disabled:opacity-50"
                >
                  Stop Simulation
                </button>
                <button
                  onClick={() => clearAllBots()}
                  className="px-6 py-3 bg-gray-500/20 text-gray-500 border border-gray-500 hover:bg-gray-500/30 transition-all font-orbitron uppercase tracking-wider"
                >
                  Clear All Bots
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'monitor' && (
        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-yellow-500/30 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-yellow-500 mb-4 font-orbitron">
              LIVE BOT MONITOR
            </h2>

            {botStatus && (
              <div className="space-y-4">
                {/* Status Overview */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-black/50 p-4 rounded border border-gray-700">
                    <p className="text-sm text-gray-400">Total Bots</p>
                    <p className="text-2xl font-bold text-yellow-500">{botStatus.totalBots}</p>
                  </div>
                  <div className="bg-black/50 p-4 rounded border border-gray-700">
                    <p className="text-sm text-gray-400">Active Now</p>
                    <p className="text-2xl font-bold text-green-500">{botStatus.activeBots}</p>
                  </div>
                  <div className="bg-black/50 p-4 rounded border border-gray-700">
                    <p className="text-sm text-gray-400">Verified</p>
                    <p className="text-2xl font-bold text-blue-500">{botStatus.verifiedBots}</p>
                  </div>
                  <div className="bg-black/50 p-4 rounded border border-gray-700">
                    <p className="text-sm text-gray-400">Total Gold</p>
                    <p className="text-2xl font-bold text-yellow-500">
                      {botStatus.totalGold?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>

                {/* Activity Log */}
                <div className="bg-black/50 p-4 rounded border border-gray-700">
                  <p className="text-sm text-gray-400 mb-3">Recent Activity</p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {testBots?.slice(0, 20).map((bot: any) => (
                      <div key={bot._id} className="flex items-center justify-between py-2 border-b border-gray-800">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            bot.isActive ? 'bg-green-500' : 'bg-gray-500'
                          }`} />
                          <span className="text-sm font-mono">{bot.walletAddress.slice(0, 20)}...</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            bot.behaviorType === 'active' ? 'bg-green-500/20 text-green-500' :
                            bot.behaviorType === 'moderate' ? 'bg-blue-500/20 text-blue-500' :
                            bot.behaviorType === 'casual' ? 'bg-yellow-500/20 text-yellow-500' :
                            'bg-gray-500/20 text-gray-500'
                          }`}>
                            {bot.behaviorType}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-400">Meks:</span>
                          <span className="text-blue-500 font-bold">{bot.mekCount}</span>
                          <span className="text-gray-400">Gold:</span>
                          <span className="text-yellow-500 font-bold">{bot.goldBalance}</span>
                          {bot.isVerified && (
                            <span className="text-green-500">✓ Verified</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulation Status */}
                <div className="bg-black/50 p-4 rounded border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Simulation Status</p>
                      <p className={`text-lg font-bold ${
                        botStatus.isRunning ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {botStatus.isRunning ? 'RUNNING' : 'STOPPED'}
                      </p>
                    </div>
                    {botStatus.isRunning && (
                      <div className="text-sm text-gray-400">
                        Speed: {botStatus.simulationSpeed}x
                      </div>
                    )}
                  </div>
                </div>

                {/* Time Jump Controls */}
                <div className="bg-black/50 p-4 rounded border border-gray-700">
                  <p className="text-sm text-gray-400 mb-3">Time Jump Controls</p>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm">Jump forward:</label>
                      <input
                        type="number"
                        value={timeJumpHours}
                        onChange={(e) => setTimeJumpHours(parseInt(e.target.value))}
                        className="w-20 px-2 py-1 bg-black border border-gray-600 rounded text-yellow-500"
                        min="1"
                        max="720"
                      />
                      <span className="text-sm text-gray-500">hours</span>
                    </div>
                    <button
                      onClick={handleTimeJump}
                      disabled={!testBots || testBots.length === 0}
                      className="px-4 py-2 bg-purple-500/20 text-purple-500 border border-purple-500 hover:bg-purple-500/30 transition-all text-sm font-orbitron uppercase tracking-wider disabled:opacity-50"
                    >
                      Jump Time
                    </button>
                    {timeJumpHours === 24 && (
                      <span className="text-xs text-gray-500">(1 day)</span>
                    )}
                    {timeJumpHours === 168 && (
                      <span className="text-xs text-gray-500">(1 week)</span>
                    )}
                    {timeJumpHours === 720 && (
                      <span className="text-xs text-gray-500">(30 days)</span>
                    )}
                  </div>
                  {jumpResult && (
                    <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded">
                      <p className="text-sm text-purple-400">Time Jump Complete!</p>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                        <div>
                          <span className="text-gray-400">Jumped:</span>
                          <span className="ml-2 text-purple-500">{jumpResult.hoursJumped} hours</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Gold Earned:</span>
                          <span className="ml-2 text-yellow-500">{jumpResult.totalGoldEarned?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Bots Updated:</span>
                          <span className="ml-2 text-blue-500">{jumpResult.botsUpdated}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Total Bots:</span>
                          <span className="ml-2 text-gray-300">{jumpResult.totalBots}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Behavior Distribution Chart */}
                {testBots && testBots.length > 0 && (
                  <div className="bg-black/50 p-4 rounded border border-gray-700">
                    <p className="text-sm text-gray-400 mb-3">Behavior Distribution</p>
                    <div className="space-y-2">
                      {['active', 'moderate', 'casual', 'dormant'].map((behavior: any) => {
                        const count = testBots.filter((b: any) => b.behaviorType === behavior).length;
                        const percentage = (count / testBots.length) * 100;

                        return (
                          <div key={behavior} className="flex items-center space-x-3">
                            <span className="w-20 text-sm capitalize">{behavior}:</span>
                            <div className="flex-1 bg-gray-800 rounded-full h-6 relative overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  behavior === 'active' ? 'bg-green-500' :
                                  behavior === 'moderate' ? 'bg-blue-500' :
                                  behavior === 'casual' ? 'bg-yellow-500' :
                                  'bg-gray-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center text-xs">
                                {count} ({percentage.toFixed(0)}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!botStatus && (
              <div className="text-center py-12 text-gray-500">
                No bots initialized. Please create bots first.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}