'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface Opponent {
  id: string
  name: string
  title: string
  icon: string
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme' | 'mystery'
  fluxRequired: number
  weakness: string
  weaknessType: 'electric' | 'ice' | 'fire' | 'poison'
  essenceReward: string
  goldReward: string
}

const opponents: Opponent[] = [
  {
    id: 'scrapbot',
    name: 'Scrap Bot',
    title: 'Rusty Training Dummy',
    icon: '🤖',
    difficulty: 'easy',
    fluxRequired: 120,
    weakness: 'Electric',
    weaknessType: 'electric',
    essenceReward: '+0.4 Bumblebee Essence',
    goldReward: '+4,500 Gold'
  },
  {
    id: 'raider',
    name: 'Wasteland Raider',
    title: 'Savage Fighter',
    icon: '💀',
    difficulty: 'medium',
    fluxRequired: 280,
    weakness: 'Glacier',
    weaknessType: 'ice',
    essenceReward: '+0.7 Glacier Essence',
    goldReward: '+7,200 Gold'
  },
  {
    id: 'golem',
    name: 'Iron Golem',
    title: 'Ancient Guardian',
    icon: '🗿',
    difficulty: 'hard',
    fluxRequired: 450,
    weakness: 'Lightning',
    weaknessType: 'electric',
    essenceReward: '+1.2 Lightning Essence',
    goldReward: '+12,000 Gold'
  },
  {
    id: 'assassin',
    name: 'Cyber Assassin',
    title: 'Silent Death',
    icon: '🥷',
    difficulty: 'hard',
    fluxRequired: 320,
    weakness: 'Fire',
    weaknessType: 'fire',
    essenceReward: '+0.9 Fire Essence',
    goldReward: '+9,800 Gold'
  },
  {
    id: 'apex',
    name: 'Apex Predator',
    title: 'Ultimate Challenge',
    icon: '🐉',
    difficulty: 'extreme',
    fluxRequired: 800,
    weakness: 'Absolute Zero',
    weaknessType: 'ice',
    essenceReward: '+2.5 Dragon Essence',
    goldReward: '+25,000 Gold'
  },
  {
    id: 'mystery',
    name: '??? ? ???',
    title: 'Unknown Entity',
    icon: '❓',
    difficulty: 'mystery',
    fluxRequired: 999,
    weakness: '???',
    weaknessType: 'poison',
    essenceReward: '+??? Essence',
    goldReward: '+??? Gold'
  }
]

export default function IndividualOpponentsPage() {
  const router = useRouter()
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({})

  const selectOpponent = (opponentId: string) => {
    router.push(`/scrapyard/battle?opponent=${opponentId}`)
  }

  const goBack = () => {
    router.push('/scrapyard')
  }

  const getDifficultyClass = (difficulty: string) => {
    const classes = {
      easy: 'bg-green-500/20 text-green-500 border border-green-500',
      medium: 'bg-yellow-500/20 text-yellow-500 border border-yellow-500',
      hard: 'bg-orange-500/20 text-orange-500 border border-orange-500',
      extreme: 'bg-red-500/20 text-red-500 border border-red-500',
      mystery: 'bg-purple-500/20 text-purple-500 border border-purple-500'
    }
    return classes[difficulty as keyof typeof classes] || classes.mystery
  }

  const getWeaknessClass = (type: string) => {
    const classes = {
      electric: 'bg-yellow-400/20 text-yellow-400 border border-yellow-400',
      ice: 'bg-cyan-400/20 text-cyan-400 border border-cyan-400',
      fire: 'bg-orange-500/20 text-orange-500 border border-orange-500',
      poison: 'bg-purple-600/20 text-purple-400 border border-purple-400'
    }
    return classes[type as keyof typeof classes] || classes.poison
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-gray-200 p-5">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={goBack}
          className="bg-gray-800/90 border-2 border-gray-600 text-yellow-500 px-4 py-2 rounded-md cursor-pointer text-sm font-bold mb-5 transition-all hover:border-yellow-500 hover:bg-gray-700/95 hover:scale-105"
        >
          ← Back to Selection
        </button>

        <p className="text-center text-lg mb-8 text-gray-400 opacity-80">
          Choose your opponent and prove your combat prowess
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {opponents.map((opponent) => (
            <div
              key={opponent.id}
              className="relative bg-gradient-to-br from-gray-800/95 to-gray-700/98 border-2 border-gray-600 rounded-lg p-4 cursor-pointer transition-all hover:border-orange-500 hover:shadow-[0_8px_25px_rgba(255,102,0,0.25)] hover:-translate-y-1 group"
              onClick={() => selectOpponent(opponent.id)}
            >
              {/* Card Glow Effect */}
              <div className="absolute inset-0 rounded-lg bg-gradient-radial from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

              {/* Header Section */}
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 rounded-full border-2 border-orange-500 bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-3xl mr-3 shadow-[0_0_12px_rgba(255,102,0,0.3)]">
                  {opponent.icon}
                </div>
                <div className="flex-1">
                  <div className="text-base font-bold text-orange-500 mb-1 uppercase tracking-wider">
                    {opponent.name}
                  </div>
                  <div className="text-xs text-gray-400 italic mb-1.5">
                    {opponent.title}
                  </div>
                  <div className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getDifficultyClass(opponent.difficulty)}`}>
                    {opponent.difficulty === 'mystery' ? '???' : opponent.difficulty}
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1.5 p-1.5 px-2.5 bg-black/30 border border-gray-600/30 rounded">
                  <div className="text-xs text-gray-300 flex items-center gap-1">
                    ⚡ Flux Required
                  </div>
                  <div className="text-sm font-bold text-red-400">
                    {opponent.id === 'mystery' ? '??? FLUX' : `${opponent.fluxRequired} FLUX`}
                  </div>
                </div>
              </div>

              {/* Weakness Section */}
              <div className="mt-2.5">
                <div className="flex justify-between items-center p-1.5 px-2.5 bg-black/30 border border-gray-600/30 rounded">
                  <div className="text-xs text-gray-300 flex items-center gap-1">
                    ⚡ Weakness
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getWeaknessClass(opponent.weaknessType)}`}>
                    {opponent.weakness}
                  </div>
                </div>
              </div>

              {/* Rewards Section */}
              <div className="mt-3 p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                <div className="text-xs text-yellow-500 font-bold mb-1.5 text-center">
                  🎆 Battle Rewards
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-[10px] border border-yellow-500">
                    {opponent.id === 'mystery' ? '???' : opponent.icon === '🤖' ? '🐝' : opponent.icon === '💀' ? '🧊' : opponent.icon === '🗿' ? '⚡' : opponent.icon === '🥷' ? '🔥' : opponent.icon === '🐉' ? '🐉' : '???'}
                  </div>
                  <div className="text-[11px] text-cyan-400 font-bold">
                    {opponent.essenceReward}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-[10px] border border-yellow-500">
                    🪙
                  </div>
                  <div className="text-[11px] text-yellow-500 font-bold">
                    {opponent.goldReward}
                  </div>
                </div>
              </div>

              {/* Fight Button */}
              <button className="w-full mt-3 py-2.5 bg-gradient-to-br from-orange-600 to-orange-700 border-none rounded-md text-white font-bold text-xs cursor-pointer transition-all hover:from-orange-500 hover:to-orange-600 hover:shadow-[0_4px_20px_rgba(255,102,0,0.4)] tracking-wider uppercase">
                Challenge
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}