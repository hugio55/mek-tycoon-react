'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Dungeon {
  id: string
  name: string
  floors: number
  totalFluxRequired: number
  turnLimit: number
  difficulty: 'normal' | 'hard' | 'nightmare'
  description: string
  rewards: string[]
  icon: string
  unlocked: boolean
}

const dungeons: Dungeon[] = [
  {
    id: 'factory-ruins',
    name: 'Abandoned Factory',
    floors: 3,
    totalFluxRequired: 500,
    turnLimit: 30,
    difficulty: 'normal',
    description: 'An old factory filled with dormant machines waiting to be powered',
    rewards: ['300 Gold', 'Factory Components', 'Mek Blueprint'],
    icon: '🏭',
    unlocked: true
  },
  {
    id: 'crystal-cavern',
    name: 'Crystal Cavern',
    floors: 4,
    totalFluxRequired: 800,
    turnLimit: 35,
    difficulty: 'normal',
    description: 'Deep caves filled with energy-hungry crystals',
    rewards: ['500 Gold', 'Crystal Clusters', 'Rare Gems'],
    icon: '💎',
    unlocked: true
  },
  {
    id: 'ancient-temple',
    name: 'Ancient Temple',
    floors: 5,
    totalFluxRequired: 1200,
    turnLimit: 40,
    difficulty: 'hard',
    description: 'A mysterious temple with powerful artifacts to energize',
    rewards: ['800 Gold', 'Ancient Relics', 'Legendary Material'],
    icon: '🏛️',
    unlocked: true
  },
  {
    id: 'mek-laboratory',
    name: 'Mek Research Lab',
    floors: 4,
    totalFluxRequired: 1000,
    turnLimit: 32,
    difficulty: 'hard',
    description: 'High-tech facility with advanced machines requiring flux',
    rewards: ['700 Gold', 'Tech Components', 'Mek Upgrade Kit'],
    icon: '🔬',
    unlocked: true
  },
  {
    id: 'void-fortress',
    name: 'Void Fortress',
    floors: 6,
    totalFluxRequired: 2000,
    turnLimit: 45,
    difficulty: 'nightmare',
    description: 'A fortress between dimensions with void-touched machines',
    rewards: ['1500 Gold', 'Void Essence', 'Mythic Blueprint'],
    icon: '🌌',
    unlocked: false
  },
  {
    id: 'quantum-nexus',
    name: 'Quantum Nexus',
    floors: 7,
    totalFluxRequired: 2500,
    turnLimit: 50,
    difficulty: 'nightmare',
    description: 'The ultimate challenge - a nexus of quantum-powered entities',
    rewards: ['2000 Gold', 'Quantum Cores', 'Ultimate Mek Part'],
    icon: '⚛️',
    unlocked: false
  }
]

export default function DungeonsPage() {
  const router = useRouter()
  const [selectedDungeon, setSelectedDungeon] = useState<Dungeon | null>(null)

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'normal': return 'text-green-400 border-green-400/30 bg-green-400/10'
      case 'hard': return 'text-orange-400 border-orange-400/30 bg-orange-400/10'
      case 'nightmare': return 'text-red-400 border-red-400/30 bg-red-400/10'
      default: return 'text-gray-400 border-gray-400/30 bg-gray-400/10'
    }
  }

  const startDungeon = (dungeon: Dungeon) => {
    if (dungeon.unlocked) {
      router.push(`/scrapyard/dungeon-run?dungeon=${dungeon.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-purple-500/20 p-6">
        <div className="container mx-auto">
          <button 
            onClick={() => router.push('/scrapyard')}
            className="text-purple-400 hover:text-purple-300 mb-4 flex items-center gap-2 transition-colors"
          >
            ← Back to Scrapyard
          </button>
          <h1 className="text-4xl font-orbitron font-bold text-purple-400">Dungeon Selection</h1>
          <p className="text-gray-400 mt-2">Choose a dungeon to explore and charge its machines</p>
        </div>
      </div>

      {/* Dungeons Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dungeons.map(dungeon => (
            <div
              key={dungeon.id}
              className={`relative bg-gray-900/50 backdrop-blur-sm border rounded-xl p-6 transition-all ${
                dungeon.unlocked 
                  ? 'border-purple-500/30 hover:border-purple-500/60 cursor-pointer group' 
                  : 'border-gray-700/50 opacity-50 cursor-not-allowed'
              }`}
              onClick={() => dungeon.unlocked && setSelectedDungeon(dungeon)}
            >
              {!dungeon.unlocked && (
                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-6xl">🔒</span>
                    <p className="text-gray-400 mt-2">Locked</p>
                  </div>
                </div>
              )}
              
              <div className="text-5xl mb-4 text-center group-hover:scale-110 transition-transform">
                {dungeon.icon}
              </div>
              <h3 className="text-2xl font-bold text-purple-400 mb-2 text-center">
                {dungeon.name}
              </h3>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${getDifficultyColor(dungeon.difficulty)}`}>
                {dungeon.difficulty.toUpperCase()}
              </div>
              <p className="text-gray-400 text-sm mb-4">
                {dungeon.description}
              </p>
              
              <div className="bg-gray-800/50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Floors:</span>
                  <span className="text-purple-400 font-bold">{dungeon.floors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Flux:</span>
                  <span className="text-yellow-400 font-bold">{dungeon.totalFluxRequired}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Turn Limit:</span>
                  <span className="text-orange-400 font-bold">{dungeon.turnLimit}</span>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Rewards:</p>
                <div className="flex flex-wrap gap-1">
                  {dungeon.rewards.slice(0, 2).map((reward, i) => (
                    <span key={i} className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded">
                      {reward}
                    </span>
                  ))}
                  {dungeon.rewards.length > 2 && (
                    <span className="text-xs text-purple-400">+{dungeon.rewards.length - 2} more</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Dungeon Modal */}
      {selectedDungeon && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-purple-500/50 rounded-2xl p-8 max-w-lg w-full">
            <div className="text-6xl mb-4 text-center">{selectedDungeon.icon}</div>
            <h2 className="text-3xl font-bold text-purple-400 mb-2 text-center">
              {selectedDungeon.name}
            </h2>
            <div className={`text-center mb-4 inline-block px-4 py-2 rounded-full ${getDifficultyColor(selectedDungeon.difficulty)}`}>
              {selectedDungeon.difficulty.toUpperCase()} DIFFICULTY
            </div>
            <p className="text-gray-300 mb-6">{selectedDungeon.description}</p>
            
            <div className="bg-gray-800 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Number of Floors:</span>
                <span className="text-purple-400 font-bold">{selectedDungeon.floors}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Flux Required:</span>
                <span className="text-yellow-400 font-bold">{selectedDungeon.totalFluxRequired}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Turn Limit:</span>
                <span className="text-orange-400 font-bold">{selectedDungeon.turnLimit} turns</span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-purple-400 mb-3">Completion Rewards:</h3>
              <ul className="space-y-2">
                {selectedDungeon.rewards.map((reward, i) => (
                  <li key={i} className="text-green-400 flex items-center gap-2">
                    <span className="text-green-500">★</span> {reward}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-400">
                <strong>Tip:</strong> Each floor contains multiple machines to charge. 
                Manage your spells wisely to complete all floors within the turn limit!
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => startDungeon(selectedDungeon)}
                className="flex-1 bg-purple-500 hover:bg-purple-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Enter Dungeon
              </button>
              <button
                onClick={() => setSelectedDungeon(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}