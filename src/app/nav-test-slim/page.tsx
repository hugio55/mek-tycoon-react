'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import '@/styles/typography-system.css'

export default function NavTestSlim() {
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

  const adminButton = { id: 'admin', label: 'ADMIN', dropdown: ['Dashboard', 'Logs', 'Config'] }

  return (
    <div className="min-h-screen p-8">
      {/* Title */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-michroma uppercase tracking-wide text-yellow-500 mb-2">
          Grid Navigation System
        </h1>
        <p className="text-gray-400 text-sm font-space">Multi-font navigation showcase with Oxanium as primary</p>
      </div>

      <div className="space-y-12">

        {/* Version 1: Rust Metal Cards */}
        <div>
          <h3 className="text-xs uppercase text-yellow-500/50 mb-2 text-center font-russo tracking-wider">Version 1: Oxanium + Russo One</h3>
          <div className="max-w-5xl mx-auto">
            {navItems.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-3 gap-2 mb-2">
                {row.map((item) => (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                      className={`
                        w-full relative px-5 py-2
                        ${item.isMain
                          ? 'bg-gradient-to-b from-yellow-900/40 via-amber-950/50 to-yellow-950/60 border-2 border-yellow-400 text-yellow-400 font-bold rounded-md shadow-[0_0_20px_rgba(250,182,23,0.3)] font-russo'
                          : 'bg-gradient-to-b from-stone-900/70 to-zinc-950/80 border border-amber-700/40 text-yellow-500/90 rounded-md font-oxanium'
                        }
                        hover:border-yellow-300 hover:text-yellow-300 hover:shadow-xl
                        transition-all duration-200
                        text-sm font-semibold uppercase tracking-wider
                      `}
                    >
                      {item.label}
                      {item.dropdown && (
                        <ChevronDown className="inline-block w-3 h-3 ml-2 opacity-50" />
                      )}
                    </button>

                    {/* Dropdown */}
                    {item.dropdown && activeDropdown === item.id && (
                      <div className="absolute top-full mt-1 left-0 z-50 w-full bg-gradient-to-b from-stone-950/95 to-black/95 backdrop-blur-md border border-amber-600/40 rounded-md shadow-2xl overflow-hidden">
                        {item.dropdown.map((option) => (
                          <div
                            key={option}
                            className="px-4 py-2 text-yellow-400/80 hover:bg-amber-900/30 hover:text-yellow-300 cursor-pointer font-saira text-xs uppercase tracking-wide transition-all duration-150 border-b border-stone-800/50 last:border-0"
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
            <div className="grid grid-cols-3 gap-2">
              <div className="col-start-3 relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === adminButton.id ? null : adminButton.id)}
                  className="w-full relative px-5 py-2 bg-gradient-to-b from-stone-900/70 to-zinc-950/80 border border-amber-700/40 text-yellow-500/90 rounded-md hover:border-yellow-300 hover:text-yellow-300 hover:shadow-xl transition-all duration-200 font-jetbrains text-xs uppercase tracking-wider"
                >
                  {adminButton.label}
                  <ChevronDown className="inline-block w-3 h-3 ml-2 opacity-50" />
                </button>
                {adminButton.dropdown && activeDropdown === adminButton.id && (
                  <div className="absolute top-full mt-1 left-0 z-50 w-full bg-gradient-to-b from-stone-950/95 to-black/95 backdrop-blur-md border border-amber-600/40 rounded-md shadow-2xl overflow-hidden">
                    {adminButton.dropdown.map((option) => (
                      <div
                        key={option}
                        className="px-4 py-2 text-yellow-400/80 hover:bg-amber-900/30 hover:text-yellow-300 cursor-pointer font-jetbrains text-[10px] uppercase tracking-wider transition-all duration-150 border-b border-stone-800/50 last:border-0"
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

        {/* Version 2: Dark Bronze Cards */}
        <div>
          <h3 className="text-xs uppercase text-yellow-500/50 mb-2 text-center font-audiowide tracking-wide">Version 2: Exo 2 + Space Grotesk</h3>
          <div className="max-w-5xl mx-auto">
            {navItems.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-3 gap-2 mb-2">
                {row.map((item) => (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                      className={`
                        w-full px-5 py-2
                        ${item.isMain
                          ? 'bg-gradient-to-br from-orange-950/60 via-amber-950/70 to-yellow-950/60 backdrop-blur-sm border-2 border-yellow-400 text-yellow-400 font-semibold shadow-[0_0_15px_rgba(250,182,23,0.3)] rounded font-audiowide'
                          : 'bg-gradient-to-b from-amber-950/40 to-stone-950/50 backdrop-blur-sm border border-orange-800/40 text-amber-400/80 rounded font-exo'
                        }
                        hover:border-yellow-300 hover:text-yellow-300 hover:shadow-[0_0_20px_rgba(250,182,23,0.4)]
                        transition-all duration-150
                        text-sm font-medium uppercase tracking-wide
                      `}
                    >
                      {item.label}
                      {item.dropdown && (
                        <ChevronDown className="inline-block w-3 h-3 ml-2 opacity-50" />
                      )}
                    </button>

                    {/* Dropdown */}
                    {item.dropdown && activeDropdown === item.id && (
                      <div className="absolute top-full mt-1 left-0 z-50 w-full backdrop-blur-md bg-gradient-to-b from-amber-950/90 to-stone-950/90 border border-orange-700/40 rounded shadow-xl">
                        {item.dropdown.map((option) => (
                          <div
                            key={option}
                            className="px-4 py-2 text-amber-400/70 hover:bg-gradient-to-r hover:from-orange-900/30 hover:to-transparent hover:text-yellow-300 cursor-pointer font-space text-xs tracking-wide transition-all duration-150"
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
            <div className="grid grid-cols-3 gap-2">
              <div className="col-start-3 relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === adminButton.id ? null : adminButton.id)}
                  className="w-full px-5 py-2 bg-gradient-to-b from-amber-950/40 to-stone-950/50 backdrop-blur-sm border border-orange-800/40 text-amber-400/80 rounded hover:border-yellow-300 hover:text-yellow-300 hover:shadow-[0_0_20px_rgba(250,182,23,0.4)] transition-all duration-150 font-jetbrains text-xs uppercase tracking-wide"
                >
                  {adminButton.label}
                  <ChevronDown className="inline-block w-3 h-3 ml-2 opacity-50" />
                </button>
                {adminButton.dropdown && activeDropdown === adminButton.id && (
                  <div className="absolute top-full mt-1 left-0 z-50 w-full backdrop-blur-md bg-gradient-to-b from-amber-950/90 to-stone-950/90 border border-orange-700/40 rounded shadow-xl">
                    {adminButton.dropdown.map((option) => (
                      <div
                        key={option}
                        className="px-4 py-2 text-amber-400/70 hover:bg-gradient-to-r hover:from-orange-900/30 hover:to-transparent hover:text-yellow-300 cursor-pointer font-jetbrains text-[10px] uppercase transition-all duration-150"
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

        {/* Version 3: Black Gold Industrial (RECOMMENDED) */}
        <div>
          <h3 className="text-xs uppercase text-yellow-500/50 mb-2 text-center font-blackops tracking-wide">Version 3: JetBrains Mono + Teko (RECOMMENDED)</h3>
          <div className="max-w-5xl mx-auto">
            {navItems.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-3 gap-2 mb-2">
                {row.map((item) => (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                      className={`
                        w-full relative px-5 py-2
                        ${item.isMain
                          ? 'bg-gradient-to-r from-yellow-600/25 via-orange-600/20 to-yellow-600/25 border-2 border-yellow-400 text-yellow-400 font-semibold rounded shadow-[inset_0_1px_0_rgba(250,204,21,0.2)] font-blackops'
                          : 'bg-black/70 border border-yellow-700/30 text-amber-500/90 rounded font-jetbrains'
                        }
                        hover:text-yellow-300 hover:border-yellow-300 hover:shadow-[0_0_15px_rgba(250,182,23,0.4)]
                        transition-all duration-200
                        text-xs font-medium uppercase tracking-wide
                      `}
                    >
                      {item.label}
                      {item.dropdown && (
                        <ChevronDown className="inline-block w-3 h-3 ml-2 opacity-50" />
                      )}
                    </button>

                    {/* Dropdown */}
                    {item.dropdown && activeDropdown === item.id && (
                      <div className="absolute top-full mt-1 left-0 z-50 w-full bg-black/90 backdrop-blur-sm border border-yellow-600/50 rounded shadow-xl">
                        {item.dropdown.map((option) => (
                          <div
                            key={option}
                            className="px-4 py-2 text-amber-400/70 hover:bg-gradient-to-r hover:from-yellow-600/20 hover:to-transparent hover:text-yellow-300 cursor-pointer font-teko text-base font-medium uppercase tracking-wide transition-all duration-150"
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
            <div className="grid grid-cols-3 gap-2">
              <div className="col-start-3 relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === adminButton.id ? null : adminButton.id)}
                  className="w-full relative px-5 py-2 bg-black/70 border border-yellow-700/30 text-amber-500/90 rounded hover:text-yellow-300 hover:border-yellow-300 hover:shadow-[0_0_15px_rgba(250,182,23,0.4)] transition-all duration-200 font-jetbrains text-xs uppercase tracking-wider"
                >
                  {adminButton.label}
                  <ChevronDown className="inline-block w-3 h-3 ml-2 opacity-50" />
                </button>
                {adminButton.dropdown && activeDropdown === adminButton.id && (
                  <div className="absolute top-full mt-1 left-0 z-50 w-full bg-black/90 backdrop-blur-sm border border-yellow-600/50 rounded shadow-xl">
                    {adminButton.dropdown.map((option) => (
                      <div
                        key={option}
                        className="px-4 py-2 text-amber-400/70 hover:bg-gradient-to-r hover:from-yellow-600/20 hover:to-transparent hover:text-yellow-300 cursor-pointer font-jetbrains text-[10px] uppercase tracking-wider transition-all duration-150"
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

        {/* Version 4: Metallic Cards */}
        <div>
          <h3 className="text-xs uppercase text-yellow-500/50 mb-2 text-center font-bebas tracking-widest">Version 4: Saira + Share Tech Mono</h3>
          <div className="max-w-5xl mx-auto">
            {navItems.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-3 gap-2 mb-2">
                {row.map((item) => (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                      className={`
                        w-full py-2 px-5 relative
                        ${item.isMain
                          ? 'bg-gradient-to-b from-yellow-900/30 via-yellow-800/20 to-yellow-900/30 border-2 border-yellow-400/70 text-yellow-400 font-bold rounded shadow-lg font-bebas tracking-widest text-lg'
                          : 'bg-gradient-to-b from-gray-800/60 to-gray-900/60 border border-gray-700/50 text-yellow-500/70 rounded font-saira text-sm'
                        }
                        hover:text-yellow-300 hover:border-yellow-400/50 hover:shadow-xl
                        transition-all duration-200
                        font-semibold uppercase
                      `}
                    >
                      {item.label}
                      {item.dropdown && (
                        <ChevronDown className="inline-block w-3 h-3 ml-2 opacity-50" />
                      )}
                    </button>

                    {/* Dropdown */}
                    {item.dropdown && activeDropdown === item.id && (
                      <div className="absolute top-full mt-1 left-0 z-50 w-full backdrop-blur-md bg-gray-900/85 shadow-2xl rounded border border-yellow-400/30">
                        {item.dropdown.map((option) => (
                          <div
                            key={option}
                            className="px-4 py-2 text-yellow-400/70 hover:text-yellow-300 hover:bg-yellow-500/10 cursor-pointer font-sharetech text-xs uppercase tracking-wide transition-all duration-150"
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
            <div className="grid grid-cols-3 gap-2">
              <div className="col-start-3 relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === adminButton.id ? null : adminButton.id)}
                  className="w-full py-2 px-5 relative bg-gradient-to-b from-gray-800/60 to-gray-900/60 border border-gray-700/50 text-yellow-500/70 rounded hover:text-yellow-300 hover:border-yellow-400/50 hover:shadow-xl transition-all duration-200 font-jetbrains text-xs uppercase tracking-wider"
                >
                  {adminButton.label}
                  <ChevronDown className="inline-block w-3 h-3 ml-2 opacity-50" />
                </button>
                {adminButton.dropdown && activeDropdown === adminButton.id && (
                  <div className="absolute top-full mt-1 left-0 z-50 w-full backdrop-blur-md bg-gray-900/85 shadow-2xl rounded border border-yellow-400/30">
                    {adminButton.dropdown.map((option) => (
                      <div
                        key={option}
                        className="px-4 py-2 text-yellow-400/70 hover:text-yellow-300 hover:bg-yellow-500/10 cursor-pointer font-jetbrains text-[10px] uppercase tracking-wider transition-all duration-150"
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

      </div>
    </div>
  )
}