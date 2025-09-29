'use client'

import React, { useState } from 'react'

// Type definitions
type TabCategory = 'MEK_CHIPS' | 'UNIVERSAL_CHIPS' | 'ESSENCE' | 'FRAMES' | 'OEM'
type SortOption = 'price_low' | 'price_high' | 'recently_listed' | 'ending_soon' | 'my_listings'

interface ExchangeItem {
  id: string
  name: string
  category: TabCategory
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  quantity: number
  unitPrice: number
  totalPrice: number
  expiresIn: string
  seller: string
  image?: string
}

// Mock data
const mockItems: ExchangeItem[] = [
  {
    id: '1',
    name: 'NEURAL PROCESSOR MK-VII',
    category: 'MEK_CHIPS',
    rarity: 'epic',
    quantity: 3,
    unitPrice: 2500,
    totalPrice: 7500,
    expiresIn: '2h 15m',
    seller: 'TechRunner_99'
  },
  {
    id: '2',
    name: 'QUANTUM STABILIZER',
    category: 'UNIVERSAL_CHIPS',
    rarity: 'rare',
    quantity: 1,
    unitPrice: 4200,
    totalPrice: 4200,
    expiresIn: '45m',
    seller: 'NeonSamurai'
  },
  {
    id: '3',
    name: 'PLASMA ESSENCE CORE',
    category: 'ESSENCE',
    rarity: 'legendary',
    quantity: 5,
    unitPrice: 8900,
    totalPrice: 44500,
    expiresIn: '1d 3h',
    seller: 'VoidWalker'
  },
  {
    id: '4',
    name: 'TITANIUM FRAME X-90',
    category: 'FRAMES',
    rarity: 'uncommon',
    quantity: 12,
    unitPrice: 750,
    totalPrice: 9000,
    expiresIn: '5h 30m',
    seller: 'MekForge'
  },
  {
    id: '5',
    name: 'OEM COOLING SYSTEM',
    category: 'OEM',
    rarity: 'common',
    quantity: 25,
    unitPrice: 120,
    totalPrice: 3000,
    expiresIn: '12h',
    seller: 'PartsDealer'
  },
  {
    id: '6',
    name: 'SYNTH-WAVE PROCESSOR',
    category: 'MEK_CHIPS',
    rarity: 'rare',
    quantity: 2,
    unitPrice: 3300,
    totalPrice: 6600,
    expiresIn: '30m',
    seller: 'CircuitBreaker'
  }
]

const rarityColors = {
  common: 'border-gray-400/30 bg-gray-400/5',
  uncommon: 'border-green-400/30 bg-green-400/5',
  rare: 'border-blue-400/30 bg-blue-400/5',
  epic: 'border-purple-400/30 bg-purple-400/5',
  legendary: 'border-amber-400/30 bg-amber-400/5'
}

const rarityGlows = {
  common: '',
  uncommon: 'shadow-[0_0_20px_rgba(74,222,128,0.15)]',
  rare: 'shadow-[0_0_25px_rgba(96,165,250,0.2)]',
  epic: 'shadow-[0_0_30px_rgba(168,85,247,0.25)]',
  legendary: 'shadow-[0_0_40px_rgba(251,191,36,0.3)]'
}

export default function EquipmentExchangePage() {
  const [activeTab, setActiveTab] = useState<TabCategory>('MEK_CHIPS')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('recently_listed')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 })
  const [userCredits] = useState(127500)

  const tabs: { id: TabCategory; label: string }[] = [
    { id: 'MEK_CHIPS', label: 'MEK CHIPS' },
    { id: 'UNIVERSAL_CHIPS', label: 'UNIVERSAL CHIPS' },
    { id: 'ESSENCE', label: 'ESSENCE' },
    { id: 'FRAMES', label: 'FRAMES' },
    { id: 'OEM', label: 'OEM' }
  ]

  const filteredItems = mockItems.filter(item =>
    item.category === activeTab &&
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    item.unitPrice >= priceRange.min &&
    item.unitPrice <= priceRange.max
  )

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/50 to-black" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxsaW5lIHgxPSIwIiB5MT0iMCIgeDI9IjEwMCIgeTI9IjAiIHN0cm9rZT0iI2ZhYjYxNyIgc3Ryb2tlLXdpZHRoPSIwLjEiIG9wYWNpdHk9IjAuMSIvPjxsaW5lIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxMDAiIHN0cm9rZT0iI2ZhYjYxNyIgc3Ryb2tlLXdpZHRoPSIwLjEiIG9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />

      {/* Scan Line Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent animate-scan" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header Section */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <h1 className="text-4xl font-black text-white uppercase tracking-wider font-['Orbitron']">
                EQUIPMENT
                <span className="text-amber-400 ml-3 relative">
                  EXCHANGE
                  <div className="absolute -inset-1 bg-amber-400/20 blur-xl" />
                </span>
              </h1>
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg border border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm font-semibold uppercase tracking-wide">
                  Marketplace Active
                </span>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-md border border-amber-400/30 rounded-lg px-6 py-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400/5 to-amber-600/5" />
              <div className="relative flex items-center gap-3">
                <span className="text-gray-400 text-sm uppercase tracking-wider">Credits</span>
                <span className="text-2xl font-bold text-amber-400 font-['Orbitron'] relative">
                  {userCredits.toLocaleString()}
                  <div className="absolute -inset-2 bg-amber-400/20 blur-md" />
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="SEARCH EQUIPMENT DATABASE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 backdrop-blur-sm border border-amber-400/30 rounded-lg px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:bg-black/30 transition-all font-['Orbitron'] uppercase tracking-wide"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400/50">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-6 bg-black/20 backdrop-blur-sm p-2 rounded-lg border border-gray-800/30">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-6 py-3 rounded-md font-semibold text-sm uppercase tracking-wider transition-all
                  font-['Orbitron'] relative overflow-hidden group
                  ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 border border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                    : 'text-gray-400 hover:text-gray-300 border border-transparent hover:border-gray-700/50 hover:bg-gray-800/20'
                  }
                `}
              >
                {activeTab === tab.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 to-transparent animate-pulse" />
                )}
                <span className="relative">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Filter Controls */}
          <div className="flex gap-4 flex-wrap">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-amber-400/50 uppercase text-sm font-['Orbitron'] tracking-wide"
            >
              <option value="recently_listed">Sort Protocol: Recent</option>
              <option value="price_low">Sort Protocol: Price ↑</option>
              <option value="price_high">Sort Protocol: Price ↓</option>
              <option value="ending_soon">Sort Protocol: Expiring</option>
              <option value="my_listings">Sort Protocol: My Listings</option>
            </select>

            <button className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-lg px-4 py-2 text-gray-300 hover:border-amber-400/50 hover:text-amber-400 transition-all uppercase text-sm font-['Orbitron'] tracking-wide">
              Price Range: {priceRange.min} - {priceRange.max}
            </button>

            <button className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-lg px-4 py-2 text-gray-300 hover:border-amber-400/50 hover:text-amber-400 transition-all uppercase text-sm font-['Orbitron'] tracking-wide">
              Recently Listed
            </button>

            <button className="bg-black/20 backdrop-blur-sm border border-gray-700/50 rounded-lg px-4 py-2 text-gray-300 hover:border-amber-400/50 hover:text-amber-400 transition-all uppercase text-sm font-['Orbitron'] tracking-wide">
              Ending Soon
            </button>

            <button className="bg-black/20 backdrop-blur-sm border border-amber-400/50 rounded-lg px-4 py-2 text-amber-400 hover:bg-amber-400/10 transition-all uppercase text-sm font-['Orbitron'] tracking-wide">
              My Listings
            </button>
          </div>
        </header>

        {/* Item Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-20">
            <div className="text-gray-500 text-lg uppercase tracking-wider font-['Orbitron']">
              No Equipment Found
            </div>
            <div className="text-gray-600 text-sm mt-2">
              Adjust filters or check back later
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        .animate-scan {
          animation: scan 8s linear infinite;
        }
      `}</style>
    </div>
  )
}

// Item Card Component
function ItemCard({ item }: { item: ExchangeItem }) {
  const rarityLabel = item.rarity.toUpperCase()

  return (
    <div className={`
      relative group
      bg-black/20 backdrop-blur-md
      border ${rarityColors[item.rarity].split(' ')[0]}
      rounded-lg overflow-hidden
      transition-all duration-300
      hover:bg-black/30 hover:scale-[1.02]
      ${rarityGlows[item.rarity]}
    `}>
      {/* Corner Brackets */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-400/50" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-400/50" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-400/50" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-400/50" />

      {/* Hazard Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(251, 191, 36, 0.1) 10px,
          rgba(251, 191, 36, 0.1) 20px
        )" />
      </div>

      <div className="relative p-4">
        {/* Item Image Placeholder */}
        <div className={`
          aspect-square mb-4 rounded-lg overflow-hidden
          ${rarityColors[item.rarity]} relative
        `}>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 to-gray-900/50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl text-gray-700/30">⚙️</div>
          </div>

          {/* Rarity Badge */}
          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
            <span className={`
              ${item.rarity === 'legendary' ? 'text-amber-400' :
                item.rarity === 'epic' ? 'text-purple-400' :
                item.rarity === 'rare' ? 'text-blue-400' :
                item.rarity === 'uncommon' ? 'text-green-400' :
                'text-gray-400'}
            `}>
              {rarityLabel}
            </span>
          </div>
        </div>

        {/* Item Name */}
        <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wide mb-3 font-['Orbitron'] line-clamp-2">
          {item.name}
        </h3>

        {/* Item Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs uppercase tracking-wider">QTY</span>
            <span className="text-white font-semibold font-['Orbitron']">{item.quantity}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs uppercase tracking-wider">Unit Price</span>
            <span className="text-amber-400 font-bold font-['Orbitron']">
              {item.unitPrice.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs uppercase tracking-wider">Expires</span>
            <span className="text-orange-400 text-sm font-['Orbitron']">{item.expiresIn}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
            <span className="text-gray-500 text-xs uppercase tracking-wider">Seller</span>
            <span className="text-gray-400 text-xs">{item.seller}</span>
          </div>
        </div>

        {/* Acquire Button */}
        <button className="
          w-full py-3 rounded-lg font-bold uppercase tracking-wider
          bg-gradient-to-r from-amber-500/80 to-amber-600/80
          text-black hover:from-amber-400 hover:to-amber-500
          transition-all duration-300 relative overflow-hidden group
          font-['Orbitron'] text-sm
          shadow-[0_4px_20px_rgba(251,191,36,0.3)]
          hover:shadow-[0_6px_30px_rgba(251,191,36,0.5)]
        ">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                          -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <span className="relative">ACQUIRE</span>
        </button>
      </div>
    </div>
  )
}