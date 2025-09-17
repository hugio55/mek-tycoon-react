'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function NavGrid() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const navItems = [
    [
      { id: 'hub', label: 'HUB', isMain: true },
      { id: 'operations', label: 'OPERATIONS', dropdown: ['Missions', 'Contracts', 'Research'] },
      { id: 'production', label: 'PRODUCTION', dropdown: ['Factory', 'Assembly', 'Resources'] }
    ],
    [
      { id: 'meks', label: 'MEKS', dropdown: ['Collection', 'Upgrade', 'Trade'] },
      { id: 'management', label: 'MANAGEMENT', dropdown: ['Stats', 'Inventory', 'Settings'] },
      { id: 'scrapyard', label: 'SCRAP YARD', dropdown: ['Salvage', 'Parts', 'Recycle'] }
    ]
  ]

  // Extra admin button
  const adminButton = { id: 'admin', label: 'ADMIN', dropdown: ['Dashboard', 'Logs', 'Config'] }

  return (
    <div className="min-h-screen bg-black p-8">
      {/* Title */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-orbitron uppercase tracking-wider text-yellow-500 mb-4">
          Navigation Grid Styles
        </h1>
        <p className="text-gray-400 text-sm">Two rows, three columns layout</p>
      </div>

      <div className="space-y-16">

        {/* Version 1: Slim Industrial Grid */}
        <div>
          <h3 className="text-xs uppercase text-yellow-500/50 mb-4 font-bold text-center">Version 1: Slim Industrial Grid</h3>
          <div className="max-w-2xl mx-auto space-y-2">
            {navItems.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-3 gap-2">
                {row.map((item) => (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                      className={`
                        w-full group relative px-4 py-1.5
                        ${item.isMain
                          ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500'
                          : 'bg-black/50 border border-yellow-500/30'
                        }
                        hover:border-yellow-400 hover:bg-yellow-500/5
                        transition-all duration-200
                      `}
                    >
                      <span className={`font-orbitron text-[10px] uppercase tracking-widest ${
                        item.isMain ? 'text-yellow-400 font-semibold' : 'text-yellow-500/70'
                      }`}>
                        {item.label}
                      </span>
                      {item.dropdown && (
                        <ChevronDown className={`inline-block w-2 h-2 ml-1 text-yellow-500/40 transition-transform ${
                          activeDropdown === item.id ? 'rotate-180' : ''
                        }`} />
                      )}
                    </button>

                    {/* Dropdown */}
                    {item.dropdown && activeDropdown === item.id && (
                      <div className="absolute top-full mt-1 left-0 z-50 w-full bg-black/95 border border-yellow-500/20">
                        {item.dropdown.map((option) => (
                          <div
                            key={option}
                            className="px-3 py-1 text-yellow-500/60 hover:bg-yellow-500/10 hover:text-yellow-400 cursor-pointer font-orbitron text-[9px] uppercase tracking-wider"
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
            {/* Admin button separately */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-start-3 relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === adminButton.id ? null : adminButton.id)}
                  className="w-full group relative px-4 py-1.5 bg-black/50 border border-yellow-500/30 hover:border-yellow-400 hover:bg-yellow-500/5 transition-all duration-200"
                >
                  <span className="font-orbitron text-[10px] uppercase tracking-widest text-yellow-500/70">
                    {adminButton.label}
                  </span>
                  <ChevronDown className={`inline-block w-2 h-2 ml-1 text-yellow-500/40 transition-transform ${
                    activeDropdown === adminButton.id ? 'rotate-180' : ''
                  }`} />
                </button>
                {adminButton.dropdown && activeDropdown === adminButton.id && (
                  <div className="absolute top-full mt-1 left-0 z-50 w-full bg-black/95 border border-yellow-500/20">
                    {adminButton.dropdown.map((option) => (
                      <div
                        key={option}
                        className="px-3 py-1 text-yellow-500/60 hover:bg-yellow-500/10 hover:text-yellow-400 cursor-pointer font-orbitron text-[9px] uppercase tracking-wider"
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Version 2: Terminal Grid */}
        <div>
          <h3 className="text-xs uppercase text-yellow-500/50 mb-4 font-bold text-center">Version 2: Terminal Grid</h3>
          <div className="max-w-2xl mx-auto bg-black/80 border border-yellow-500/20 p-3">
            {navItems.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-3 gap-1 mb-1">
                {row.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                    className={`
                      group relative px-3 py-1
                      ${item.isMain
                        ? 'bg-yellow-500/15 text-yellow-400 border-l-2 border-yellow-400'
                        : 'bg-transparent text-yellow-600/50 border-l border-yellow-600/20'
                      }
                      hover:bg-yellow-500/10 hover:text-yellow-300
                      transition-all duration-150
                      text-left
                    `}
                  >
                    <span className="text-yellow-600/40 text-[10px] font-mono">{'>'}</span>
                    <span className={`text-[10px] ml-1 font-mono ${
                      item.isMain ? 'font-bold' : 'font-normal'
                    }`}>
                      {item.label.toLowerCase()}
                    </span>
                    {item.isMain && (
                      <span className="text-yellow-400 text-[10px] ml-1 animate-pulse">_</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
            <div className="grid grid-cols-3 gap-1">
              <div className="col-start-3">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === adminButton.id ? null : adminButton.id)}
                  className="w-full group relative px-3 py-1 bg-transparent text-yellow-600/50 border-l border-yellow-600/20 hover:bg-yellow-500/10 hover:text-yellow-300 transition-all duration-150 text-left"
                >
                  <span className="text-yellow-600/40 text-[10px] font-mono">{'>'}</span>
                  <span className="text-[10px] ml-1 font-mono font-normal">
                    {adminButton.label.toLowerCase()}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Version 3: Circuit Board Grid */}
        <div>
          <h3 className="text-xs uppercase text-yellow-500/50 mb-4 font-bold text-center">Version 3: Circuit Board Grid</h3>
          <div className="max-w-xl mx-auto">
            {navItems.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-3 gap-2 mb-2">
                {row.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                    className={`
                      group relative px-3 py-1.5
                      ${item.isMain
                        ? 'bg-black border-2 border-yellow-400 shadow-[inset_0_0_10px_rgba(250,182,23,0.2)]'
                        : 'bg-black border border-yellow-600/30'
                      }
                      hover:shadow-[inset_0_0_15px_rgba(250,182,23,0.3)]
                      transition-all duration-200
                    `}
                  >
                    {/* Circuit dots */}
                    {item.isMain && (
                      <>
                        <div className="absolute top-0 left-0 w-1 h-1 bg-yellow-400" />
                        <div className="absolute top-0 right-0 w-1 h-1 bg-yellow-400" />
                        <div className="absolute bottom-0 left-0 w-1 h-1 bg-yellow-400" />
                        <div className="absolute bottom-0 right-0 w-1 h-1 bg-yellow-400" />
                      </>
                    )}

                    <span className={`text-[10px] ${
                      item.isMain
                        ? 'font-bold text-yellow-300 uppercase tracking-wider'
                        : 'font-normal text-yellow-600/70 uppercase tracking-wide'
                    }`}>
                      {item.label}
                    </span>
                    {item.dropdown && (
                      <span className="ml-1 text-[8px] text-yellow-600/30">▼</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-start-3">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === adminButton.id ? null : adminButton.id)}
                  className="w-full group relative px-3 py-1.5 bg-black border border-yellow-600/30 hover:shadow-[inset_0_0_15px_rgba(250,182,23,0.3)] transition-all duration-200"
                >
                  <span className="text-[10px] font-normal text-yellow-600/70 uppercase tracking-wide">
                    {adminButton.label}
                  </span>
                  <span className="ml-1 text-[8px] text-yellow-600/30">▼</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Version 4: Military Stencil Grid (RECOMMENDED) */}
        <div>
          <h3 className="text-xs uppercase text-yellow-500/50 mb-4 font-bold text-center">Version 4: Military Stencil Grid (RECOMMENDED)</h3>
          <div className="max-w-2xl mx-auto">
            <div className="inline-block bg-black/50 border-2 border-yellow-600/30 p-2">
              {navItems.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-3 gap-1 mb-1">
                  {row.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                      className={`
                        group relative px-4 py-1
                        ${item.isMain
                          ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-l-4 border-r-4 border-yellow-400'
                          : 'bg-transparent border-l-2 border-r-2 border-yellow-600/30'
                        }
                        hover:bg-yellow-500/10
                        transition-all duration-150
                      `}
                    >
                      {/* Stencil holes */}
                      <div className="absolute top-0 left-3 right-3 h-[1px] bg-black" />
                      <div className="absolute bottom-0 left-3 right-3 h-[1px] bg-black" />

                      <span className={`relative ${
                        item.isMain
                          ? 'text-[11px] font-black text-yellow-400 uppercase tracking-[0.15em]'
                          : 'text-[10px] font-bold text-yellow-600/60 uppercase tracking-[0.1em]'
                      }`}
                        style={{
                          textShadow: item.isMain ? '1px 1px 0 rgba(0,0,0,0.5)' : 'none'
                        }}
                      >
                        {item.label}
                      </span>
                      {item.dropdown && (
                        <span className="ml-1 text-[8px] opacity-50">▼</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
              <div className="grid grid-cols-3 gap-1">
                <div className="col-start-3">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === adminButton.id ? null : adminButton.id)}
                    className="w-full group relative px-4 py-1 bg-transparent border-l-2 border-r-2 border-yellow-600/30 hover:bg-yellow-500/10 transition-all duration-150"
                  >
                    <div className="absolute top-0 left-3 right-3 h-[1px] bg-black" />
                    <div className="absolute bottom-0 left-3 right-3 h-[1px] bg-black" />
                    <span className="relative text-[10px] font-bold text-yellow-600/60 uppercase tracking-[0.1em]">
                      {adminButton.label}
                    </span>
                    <span className="ml-1 text-[8px] opacity-50">▼</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Version 5: Neon Grid */}
        <div>
          <h3 className="text-xs uppercase text-yellow-500/50 mb-4 font-bold text-center">Version 5: Neon Grid</h3>
          <div className="max-w-xl mx-auto">
            {navItems.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-3 gap-3 mb-3">
                {row.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                    className={`
                      group relative px-3 py-1
                      bg-transparent
                      ${item.isMain
                        ? 'text-yellow-300 shadow-[0_0_0_1px_rgba(250,182,23,1),0_0_10px_rgba(250,182,23,0.5)]'
                        : 'text-yellow-600/60 shadow-[0_0_0_1px_rgba(250,182,23,0.3)]'
                      }
                      hover:shadow-[0_0_0_1px_rgba(250,182,23,1),0_0_15px_rgba(250,182,23,0.7)]
                      hover:text-yellow-400
                      transition-all duration-300
                      font-light text-[10px] tracking-[0.2em] uppercase
                    `}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-start-3">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === adminButton.id ? null : adminButton.id)}
                  className="w-full group relative px-3 py-1 bg-transparent text-yellow-600/60 shadow-[0_0_0_1px_rgba(250,182,23,0.3)] hover:shadow-[0_0_0_1px_rgba(250,182,23,1),0_0_15px_rgba(250,182,23,0.7)] hover:text-yellow-400 transition-all duration-300 font-light text-[10px] tracking-[0.2em] uppercase"
                >
                  {adminButton.label}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Version 6: Holographic Glass Grid */}
        <div>
          <h3 className="text-xs uppercase text-yellow-500/50 mb-4 font-bold text-center">Version 6: Holographic Glass Grid</h3>
          <div className="max-w-2xl mx-auto">
            {navItems.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-3 gap-2 mb-2">
                {row.map((item) => (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                      className={`
                        w-full group relative px-4 py-1.5 overflow-hidden
                        ${item.isMain
                          ? 'bg-gradient-to-br from-yellow-500/10 via-transparent to-orange-500/10 backdrop-blur-sm border border-yellow-400/50'
                          : 'bg-white/[0.02] backdrop-blur-sm border border-yellow-500/20'
                        }
                        hover:bg-white/[0.05] hover:border-yellow-400/40
                        transition-all duration-300
                        rounded-sm
                      `}
                    >
                      {/* Shimmer */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

                      <span className={`relative font-mono text-[10px] ${
                        item.isMain
                          ? 'text-yellow-300 tracking-wider uppercase'
                          : 'text-yellow-500/70 tracking-wide uppercase'
                      }`}>
                        {item.label}
                      </span>
                      {item.dropdown && (
                        <span className="ml-1 text-[8px] text-yellow-500/30">▼</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ))}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-start-3 relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === adminButton.id ? null : adminButton.id)}
                  className="w-full group relative px-4 py-1.5 overflow-hidden bg-white/[0.02] backdrop-blur-sm border border-yellow-500/20 hover:bg-white/[0.05] hover:border-yellow-400/40 transition-all duration-300 rounded-sm"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <span className="relative font-mono text-[10px] text-yellow-500/70 tracking-wide uppercase">
                    {adminButton.label}
                  </span>
                  <span className="ml-1 text-[8px] text-yellow-500/30">▼</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}