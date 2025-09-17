'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function NavVaried() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const navItems = [
    {
      id: 'hub',
      label: 'HUB',
      isMain: true
    },
    {
      id: 'operations',
      label: 'OPERATIONS',
      dropdown: ['Missions', 'Contracts', 'Research']
    },
    {
      id: 'production',
      label: 'PRODUCTION',
      dropdown: ['Factory', 'Assembly', 'Resources']
    },
    {
      id: 'meks',
      label: 'MEKS',
      dropdown: ['Collection', 'Upgrade', 'Trade']
    },
    {
      id: 'management',
      label: 'MANAGEMENT',
      dropdown: ['Stats', 'Inventory', 'Settings']
    },
    {
      id: 'scrapyard',
      label: 'SCRAP YARD',
      dropdown: ['Salvage', 'Parts', 'Recycle']
    },
    {
      id: 'admin',
      label: 'ADMIN',
      dropdown: ['Dashboard', 'Logs', 'Config']
    }
  ]

  return (
    <div className="min-h-screen bg-black p-8">
      {/* Title */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-orbitron uppercase tracking-wider text-yellow-500 mb-4">
          Varied Navigation Styles
        </h1>
        <p className="text-gray-400 text-sm">Distinctly different approaches</p>
      </div>

      <div className="space-y-10">

        {/* Version 1: Holographic Glass */}
        <div>
          <h3 className="text-xs uppercase text-yellow-500/50 mb-3 font-bold">Version 1: Holographic Glass</h3>
          <div className="flex gap-2 justify-center flex-wrap">
            {navItems.map((item) => (
              <div key={item.id} className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                  className={`
                    group relative px-4 py-1.5
                    ${item.isMain
                      ? 'bg-gradient-to-br from-yellow-500/10 via-transparent to-orange-500/10 backdrop-blur-sm border border-yellow-400/50 shadow-[0_0_15px_rgba(250,182,23,0.3)]'
                      : 'bg-white/[0.02] backdrop-blur-sm border border-yellow-500/20'
                    }
                    hover:bg-white/[0.05] hover:border-yellow-400/40
                    transition-all duration-300
                    rounded-sm
                  `}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

                  <span className={`relative font-mono text-xs ${
                    item.isMain
                      ? 'text-yellow-300 font-normal tracking-normal'
                      : 'text-yellow-500/70 tracking-tight'
                  }`}>
                    {item.label}
                  </span>
                  {item.dropdown && (
                    <ChevronDown className={`inline-block w-2 h-2 ml-1 text-yellow-500/30 transition-transform ${
                      activeDropdown === item.id ? 'rotate-180' : ''
                    }`} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Version 2: Circuit Board */}
        <div>
          <h3 className="text-xs uppercase text-yellow-500/50 mb-3 font-bold">Version 2: Circuit Board</h3>
          <div className="flex gap-3 justify-center flex-wrap">
            {navItems.map((item) => (
              <div key={item.id} className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                  className={`
                    group relative px-3 py-1
                    ${item.isMain
                      ? 'bg-black border-2 border-yellow-400 shadow-[inset_0_0_10px_rgba(250,182,23,0.2)]'
                      : 'bg-black border border-yellow-600/30'
                    }
                    hover:shadow-[inset_0_0_15px_rgba(250,182,23,0.3)]
                    transition-all duration-200
                  `}
                >
                  {/* Circuit pattern */}
                  <div className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `
                        linear-gradient(90deg, transparent 48%, rgba(250,182,23,0.3) 49%, rgba(250,182,23,0.3) 51%, transparent 52%),
                        linear-gradient(0deg, transparent 48%, rgba(250,182,23,0.3) 49%, rgba(250,182,23,0.3) 51%, transparent 52%)
                      `,
                      backgroundSize: '8px 8px'
                    }}
                  />

                  {/* Corner nodes */}
                  {item.isMain && (
                    <>
                      <div className="absolute top-0 left-0 w-1 h-1 bg-yellow-400 shadow-[0_0_3px_rgba(250,182,23,0.8)]" />
                      <div className="absolute top-0 right-0 w-1 h-1 bg-yellow-400 shadow-[0_0_3px_rgba(250,182,23,0.8)]" />
                      <div className="absolute bottom-0 left-0 w-1 h-1 bg-yellow-400 shadow-[0_0_3px_rgba(250,182,23,0.8)]" />
                      <div className="absolute bottom-0 right-0 w-1 h-1 bg-yellow-400 shadow-[0_0_3px_rgba(250,182,23,0.8)]" />
                    </>
                  )}

                  <span className={`relative text-[11px] ${
                    item.isMain
                      ? 'font-bold text-yellow-300 uppercase tracking-wider'
                      : 'font-normal text-yellow-600/70 lowercase'
                  }`}>
                    {item.label}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Version 3: Terminal Command */}
        <div>
          <h3 className="text-xs uppercase text-yellow-500/50 mb-3 font-bold">Version 3: Terminal Command</h3>
          <div className="flex gap-1 justify-center flex-wrap bg-black/80 border border-yellow-500/20 p-2 font-mono">
            {navItems.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <span className="text-yellow-600/30 px-1">|</span>}
                <button
                  onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                  className={`
                    group relative px-2 py-0.5
                    ${item.isMain
                      ? 'text-yellow-400 bg-yellow-500/10'
                      : 'text-yellow-600/50'
                    }
                    hover:bg-yellow-500/20 hover:text-yellow-300
                    transition-all duration-150
                  `}
                >
                  <span className="text-yellow-600/40 text-[10px]">{'>'}</span>
                  <span className={`text-[10px] ml-1 ${
                    item.isMain ? 'font-bold' : 'font-light'
                  }`}>
                    {item.label.toLowerCase()}
                  </span>
                  {item.isMain && (
                    <span className="text-yellow-400 text-[10px] ml-1 animate-pulse">_</span>
                  )}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Version 4: Brutalist Blocks */}
        <div>
          <h3 className="text-xs uppercase text-yellow-500/50 mb-3 font-bold">Version 4: Brutalist Blocks</h3>
          <div className="flex gap-2 justify-center flex-wrap">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                className={`
                  group relative
                  ${item.isMain
                    ? 'px-5 py-2 bg-yellow-500 text-black shadow-[4px_4px_0_rgba(250,182,23,0.3)]'
                    : 'px-4 py-1.5 bg-transparent text-yellow-500/60 border-2 border-yellow-600/30'
                  }
                  hover:translate-x-[-2px] hover:translate-y-[-2px]
                  hover:shadow-[6px_6px_0_rgba(250,182,23,0.4)]
                  transition-all duration-200
                  font-black text-[9px] uppercase tracking-[0.2em]
                `}
              >
                {item.label}
                {item.dropdown && (
                  <span className="ml-1 text-[8px] opacity-50">▼</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Version 5: Neon Outline */}
        <div>
          <h3 className="text-xs uppercase text-yellow-500/50 mb-3 font-bold">Version 5: Neon Outline</h3>
          <div className="flex gap-3 justify-center flex-wrap">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                className={`
                  group relative px-3 py-1
                  bg-transparent
                  ${item.isMain
                    ? 'text-yellow-300 shadow-[0_0_0_1px_rgba(250,182,23,1),0_0_10px_rgba(250,182,23,0.5),inset_0_0_10px_rgba(250,182,23,0.1)]'
                    : 'text-yellow-600/60 shadow-[0_0_0_1px_rgba(250,182,23,0.3)]'
                  }
                  hover:shadow-[0_0_0_1px_rgba(250,182,23,1),0_0_15px_rgba(250,182,23,0.7),inset_0_0_15px_rgba(250,182,23,0.2)]
                  hover:text-yellow-400
                  transition-all duration-300
                  font-light text-xs tracking-[0.3em] uppercase
                `}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Version 6: Data Stream */}
        <div>
          <h3 className="text-xs uppercase text-yellow-500/50 mb-3 font-bold">Version 6: Data Stream</h3>
          <div className="flex gap-2 justify-center flex-wrap">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                className={`
                  group relative px-3 py-1 overflow-hidden
                  ${item.isMain
                    ? 'bg-gradient-to-r from-black via-yellow-900/20 to-black border-y-2 border-yellow-400'
                    : 'bg-black/50 border-y border-yellow-600/20'
                  }
                  transition-all duration-200
                `}
              >
                {/* Scrolling data effect */}
                <div className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(250,182,23,0.5) 2px, rgba(250,182,23,0.5) 4px)',
                    animation: 'slideRight 3s linear infinite'
                  }}
                />

                <span className={`relative ${
                  item.isMain
                    ? 'text-[10px] font-mono text-yellow-300 tracking-[0.1em]'
                    : 'text-[9px] font-sans text-yellow-600/60 italic'
                }`}>
                  {item.isMain ? `[${item.label}]` : item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Version 7: Hextech */}
        <div>
          <h3 className="text-xs uppercase text-yellow-500/50 mb-3 font-bold">Version 7: Hextech</h3>
          <div className="flex gap-2 justify-center flex-wrap">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                className={`
                  group relative px-4 py-0.5
                  ${item.isMain
                    ? 'bg-gradient-to-br from-yellow-500/30 to-orange-600/30 text-yellow-300'
                    : 'bg-black/30 text-yellow-600/50'
                  }
                  border border-yellow-500/40
                  hover:border-yellow-400 hover:bg-yellow-500/10
                  transition-all duration-200
                `}
                style={{
                  clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)'
                }}
              >
                <span className={`${
                  item.isMain
                    ? 'text-[11px] font-extrabold uppercase tracking-widest'
                    : 'text-[10px] font-thin capitalize'
                }`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Version 8: Military Stencil */}
        <div>
          <h3 className="text-xs uppercase text-yellow-500/50 mb-3 font-bold">Version 8: Military Stencil (RECOMMENDED)</h3>
          <div className="flex gap-1.5 justify-center flex-wrap">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                className={`
                  group relative px-3 py-0.5
                  ${item.isMain
                    ? 'bg-yellow-500/20 border-l-4 border-r-4 border-yellow-400'
                    : 'bg-transparent border-l-2 border-r-2 border-yellow-600/30'
                  }
                  hover:bg-yellow-500/10
                  transition-all duration-150
                `}
              >
                {/* Stencil holes effect */}
                <div className="absolute top-0 left-2 right-2 h-[1px] bg-black" />
                <div className="absolute bottom-0 left-2 right-2 h-[1px] bg-black" />

                <span className={`relative ${
                  item.isMain
                    ? 'text-[10px] font-black text-yellow-400 uppercase tracking-[0.15em]'
                    : 'text-[9px] font-bold text-yellow-600/60 uppercase tracking-[0.1em]'
                }`}
                  style={{
                    textShadow: item.isMain ? '1px 1px 0 rgba(0,0,0,0.5)' : 'none'
                  }}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>

      <style jsx>{`
        @keyframes slideRight {
          from { transform: translateX(-10px); }
          to { transform: translateX(10px); }
        }
      `}</style>
    </div>
  )
}