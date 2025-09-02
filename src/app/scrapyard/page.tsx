'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function ScrapyardPage() {
  const router = useRouter()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const selectMode = (mode: string) => {
    if (mode === 'individual') {
      router.push('/scrapyard/individual')
    } else if (mode === 'dungeon') {
      router.push('/scrapyard/dungeons')
    } else if (mode === 'story') {
      alert('📖 Story Mode is coming soon!\n\nNarrative campaigns with character progression.')
    }
  }

  // Create sparkle effects like original
  useEffect(() => {
    const createSparkles = () => {
      const sparkle = document.createElement('div')
      sparkle.innerHTML = '✨'
      sparkle.style.position = 'fixed'
      sparkle.style.fontSize = Math.random() * 10 + 10 + 'px'
      sparkle.style.left = Math.random() * window.innerWidth + 'px'
      sparkle.style.top = Math.random() * window.innerHeight + 'px'
      sparkle.style.opacity = '0.7'
      sparkle.style.pointerEvents = 'none'
      sparkle.style.zIndex = '1'
      sparkle.style.transition = 'all 3s ease-out'
      
      document.body.appendChild(sparkle)
      
      setTimeout(() => {
        sparkle.style.transform = 'translateY(-100px)'
        sparkle.style.opacity = '0'
        setTimeout(() => sparkle.remove(), 3000)
      }, 100)
    }

    const interval = setInterval(createSparkles, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Arena Background Effects */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(circle at 20% 30%, rgba(250, 182, 23, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 80% 70%, rgba(250, 182, 23, 0.1) 0%, transparent 40%),
          radial-gradient(circle at 50% 50%, rgba(250, 182, 23, 0.05) 0%, transparent 60%)
        `,
        animation: 'pulse 15s ease-in-out infinite'
      }}></div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4">
            🥊 SCRAPYARD FIGHTING ARENA
          </h1>
          <p className="text-xl text-gray-400">Choose your battle style and prove your worth in the wasteland</p>
        </div>

        {/* Selection Cards Grid - matching original layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Individual Card */}
          <div 
            className="relative group cursor-pointer transform transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
            onClick={() => selectMode('individual')}
            onMouseEnter={() => setHoveredCard('individual')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              transform: hoveredCard === 'individual' ? 'translateY(-5px) scale(1.02) rotateX(2deg)' : ''
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border-2 border-yellow-500/40 rounded-2xl p-6 hover:border-yellow-500/80 transition-all shadow-2xl">
              <div className="text-5xl mb-3 text-center group-hover:scale-110 transition-transform">⚔️</div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-3 text-center">Individual</h2>
              <p className="text-gray-300 mb-4 text-sm text-center">
                Face single rivals in intense one-on-one combat.
              </p>
              <ul className="space-y-1 text-xs text-gray-400">
                <li className="flex items-center">
                  <span className="text-yellow-500 mr-2">•</span>
                  Quick focused battles
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-500 mr-2">•</span>
                  Difficulty scaling
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-500 mr-2">•</span>
                  Immediate rewards
                </li>
              </ul>
            </div>
          </div>

          {/* Story Card */}
          <div 
            className="relative group cursor-pointer transform transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
            onClick={() => selectMode('story')}
            onMouseEnter={() => setHoveredCard('story')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              transform: hoveredCard === 'story' ? 'translateY(-5px) scale(1.02) rotateX(2deg)' : ''
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border-2 border-blue-500/40 rounded-2xl p-6 hover:border-blue-500/80 transition-all shadow-2xl">
              <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                COMING SOON
              </div>
              <div className="text-5xl mb-3 text-center group-hover:scale-110 transition-transform">📖</div>
              <h2 className="text-2xl font-bold text-blue-400 mb-3 text-center">Story Mode</h2>
              <p className="text-gray-300 mb-4 text-sm text-center">
                Progress through narrative campaigns with unique characters.
              </p>
              <ul className="space-y-1 text-xs text-gray-400">
                <li className="flex items-center">
                  <span className="text-blue-500 mr-2">•</span>
                  Structured progression
                </li>
                <li className="flex items-center">
                  <span className="text-blue-500 mr-2">•</span>
                  Character development
                </li>
                <li className="flex items-center">
                  <span className="text-blue-500 mr-2">•</span>
                  Epic storylines
                </li>
              </ul>
            </div>
          </div>

          {/* Dungeon Card */}
          <div 
            className="relative group cursor-pointer transform transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
            onClick={() => selectMode('dungeon')}
            onMouseEnter={() => setHoveredCard('dungeon')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              transform: hoveredCard === 'dungeon' ? 'translateY(-5px) scale(1.02) rotateX(2deg)' : ''
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border-2 border-purple-500/40 rounded-2xl p-6 hover:border-purple-500/80 transition-all shadow-2xl">
              <div className="text-5xl mb-3 text-center group-hover:scale-110 transition-transform">🏰</div>
              <h2 className="text-2xl font-bold text-purple-400 mb-3 text-center">Dungeon</h2>
              <p className="text-gray-300 mb-4 text-sm text-center">
                Multi-floor dungeons with waves of machines and bosses.
              </p>
              <ul className="space-y-1 text-xs text-gray-400">
                <li className="flex items-center">
                  <span className="text-purple-500 mr-2">•</span>
                  Progressive difficulty
                </li>
                <li className="flex items-center">
                  <span className="text-purple-500 mr-2">•</span>
                  Boss encounters
                </li>
                <li className="flex items-center">
                  <span className="text-purple-500 mr-2">•</span>
                  Rare loot rewards
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}