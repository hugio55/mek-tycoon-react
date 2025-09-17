'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function NavTest() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const navItems = [
    {
      id: 'hub',
      label: 'HUB',
      icon: '⬢',
      isMain: true
    },
    {
      id: 'operations',
      label: 'OPERATIONS',
      icon: '⚙',
      dropdown: ['Missions', 'Contracts', 'Research']
    },
    {
      id: 'production',
      label: 'PRODUCTION',
      icon: '⚡',
      dropdown: ['Factory', 'Assembly', 'Resources']
    },
    {
      id: 'meks',
      label: 'MEKS',
      icon: '★',
      dropdown: ['Collection', 'Upgrade', 'Trade']
    },
    {
      id: 'management',
      label: 'MANAGEMENT',
      icon: '📊',
      dropdown: ['Stats', 'Inventory', 'Settings']
    },
    {
      id: 'scrapyard',
      label: 'SCRAP YARD',
      icon: '🔧',
      dropdown: ['Salvage', 'Parts', 'Recycle']
    },
    {
      id: 'admin',
      label: 'ADMIN',
      icon: '⚡',
      dropdown: ['Dashboard', 'Logs', 'Config']
    }
  ]

  return (
    <div className="min-h-screen bg-black p-8">
      {/* Title */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-orbitron uppercase tracking-wider text-yellow-500 mb-4">
          Navigation Style Test
        </h1>
        <p className="text-gray-400">Testing new industrial sci-fi button designs</p>
      </div>

      {/* Original Reference */}
      <div className="mb-12">
        <h2 className="text-xl font-orbitron uppercase text-yellow-500/70 mb-4">Original Style Reference</h2>
        <div className="flex gap-4 justify-center flex-wrap p-4 bg-gray-900/50 rounded">
          <button className="px-6 py-3 bg-gradient-to-b from-gray-700/50 to-gray-800/50 border border-yellow-500/30 rounded text-yellow-500 font-orbitron uppercase">
            Old Style
          </button>
        </div>
      </div>

      {/* New Industrial Design */}
      <div className="space-y-12">
        <h2 className="text-xl font-orbitron uppercase text-yellow-500/70 mb-4">New Industrial Design</h2>

        {/* Version 1: Sharp Industrial */}
        <div>
          <h3 className="text-sm uppercase text-gray-500 mb-3">Version 1: Sharp Industrial</h3>
          <div className="flex gap-3 justify-center flex-wrap">
            {navItems.map((item) => (
              <div key={item.id} className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                  className={`
                    group relative px-6 py-3
                    ${item.isMain
                      ? 'bg-gradient-to-br from-yellow-600/20 to-orange-700/20 border-2 border-yellow-500'
                      : 'bg-gradient-to-br from-gray-900 to-gray-800 border border-yellow-500/50'
                    }
                    hover:border-yellow-400 hover:shadow-[0_0_20px_rgba(250,182,23,0.3)]
                    transition-all duration-300
                    clip-path-polygon
                    overflow-hidden
                  `}
                  style={{
                    clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)'
                  }}
                >
                  {/* Background effects */}
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(250,182,23,0.03)_10px,rgba(250,182,23,0.03)_20px)]" />

                  {/* Content */}
                  <div className="relative flex items-center gap-2">
                    <span className="text-yellow-500/70">{item.icon}</span>
                    <span className={`font-orbitron text-xs uppercase tracking-wider ${
                      item.isMain ? 'text-yellow-400 font-bold' : 'text-yellow-500/90'
                    }`}>
                      {item.label}
                    </span>
                    {item.dropdown && (
                      <ChevronDown className={`w-3 h-3 text-yellow-500/50 transition-transform ${
                        activeDropdown === item.id ? 'rotate-180' : ''
                      }`} />
                    )}
                  </div>

                  {/* Glow effect on hover */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/0 via-yellow-500/20 to-yellow-500/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
                </button>

                {/* Dropdown */}
                {item.dropdown && activeDropdown === item.id && (
                  <div className="absolute top-full mt-2 left-0 z-50 min-w-[150px] bg-gray-900/95 border border-yellow-500/30 backdrop-blur-sm">
                    {item.dropdown.map((option) => (
                      <div
                        key={option}
                        className="px-4 py-2 text-yellow-500/70 hover:bg-yellow-500/10 hover:text-yellow-400 cursor-pointer font-orbitron text-xs uppercase"
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Version 2: Hexagonal Industrial */}
        <div>
          <h3 className="text-sm uppercase text-gray-500 mb-3">Version 2: Hexagonal Frame</h3>
          <div className="flex gap-3 justify-center flex-wrap">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`
                  relative px-8 py-3 group
                  ${item.isMain
                    ? 'bg-black border-2 border-yellow-500 shadow-[0_0_15px_rgba(250,182,23,0.4)]'
                    : 'bg-black/90 border border-yellow-500/40'
                  }
                  hover:border-yellow-400 hover:shadow-[0_0_25px_rgba(250,182,23,0.5)]
                  transition-all duration-300
                  before:absolute before:inset-0
                  before:bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,rgba(250,182,23,0.05)_20px,rgba(250,182,23,0.05)_40px)]
                  after:absolute after:inset-0
                  after:bg-gradient-to-b after:from-yellow-500/10 after:to-transparent after:opacity-0 after:group-hover:opacity-100
                  after:transition-opacity
                `}
                style={{
                  clipPath: 'polygon(20px 0%, calc(100% - 20px) 0%, 100% 50%, calc(100% - 20px) 100%, 20px 100%, 0% 50%)'
                }}
              >
                <div className="relative flex items-center gap-2">
                  <span className={`${item.isMain ? 'text-yellow-400' : 'text-yellow-500/60'}`}>{item.icon}</span>
                  <span className={`font-orbitron text-xs uppercase tracking-widest ${
                    item.isMain ? 'text-yellow-400 font-bold' : 'text-yellow-500/80'
                  }`}>
                    {item.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Version 3: Military Terminal - ENHANCED */}
        <div>
          <h3 className="text-sm uppercase text-gray-500 mb-3">Version 3: Military Terminal - ENHANCED</h3>
          <div className="flex gap-1 justify-center flex-wrap bg-black p-4 border-t-2 border-b-2 border-yellow-500/30"
               style={{
                 backgroundImage: `
                   repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(250,182,23,0.02) 20px, rgba(250,182,23,0.02) 21px),
                   repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(250,182,23,0.01) 20px, rgba(250,182,23,0.01) 21px),
                   radial-gradient(ellipse at 30% 30%, rgba(250,182,23,0.03) 0%, transparent 40%)
                 `
               }}>
            {navItems.map((item, index) => (
              <div key={item.id} className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                  className={`
                    relative px-5 py-2.5 group overflow-hidden
                    ${item.isMain
                      ? 'bg-gradient-to-br from-yellow-500/20 via-orange-500/15 to-yellow-600/20 shadow-[inset_0_2px_10px_rgba(250,182,23,0.2)]'
                      : 'bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90'
                    }
                    border ${item.isMain
                      ? 'border-yellow-500/60 shadow-[0_0_15px_rgba(250,182,23,0.3)]'
                      : 'border-yellow-600/20 hover:border-yellow-500/40'
                    }
                    hover:shadow-[0_0_20px_rgba(250,182,23,0.4)]
                    transition-all duration-300
                    transform hover:scale-[1.02]
                  `}
                  style={{
                    clipPath: item.isMain
                      ? 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 30%, 100% 100%, 0% 100%, 0% 30%)'
                      : 'none'
                  }}
                >
                  {/* Metal texture overlay */}
                  <div className="absolute inset-0 opacity-20"
                       style={{
                         backgroundImage: `
                           repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 3px),
                           repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 3px)
                         `
                       }} />

                  {/* Scratches and wear marks */}
                  <div className="absolute inset-0 opacity-30"
                       style={{
                         backgroundImage: `
                           linear-gradient(105deg, transparent 40%, rgba(0,0,0,0.2) 40.5%, transparent 41%),
                           linear-gradient(85deg, transparent 65%, rgba(0,0,0,0.15) 65.5%, transparent 66%)
                         `
                       }} />

                  {/* Main hazard stripes for HUB */}
                  {item.isMain && (
                    <>
                      <div className="absolute inset-0 opacity-20"
                           style={{
                             background: `repeating-linear-gradient(
                               45deg,
                               transparent,
                               transparent 5px,
                               rgba(250,182,23,0.3) 5px,
                               rgba(250,182,23,0.3) 10px
                             )`
                           }} />
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-60" />
                      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-60" />
                    </>
                  )}

                  {/* Scan effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-500/20 to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-700 ease-out" />

                  {/* Left side accent bar */}
                  <div className={`absolute left-0 top-0 h-full w-1 ${
                    item.isMain
                      ? 'bg-gradient-to-b from-yellow-400 via-orange-400 to-yellow-400'
                      : 'bg-gradient-to-b from-yellow-600/30 to-transparent'
                  }`} />

                  {/* Content */}
                  <div className="relative flex items-center gap-2 px-1">
                    {/* Icon with glow effect for HUB */}
                    <span className={`relative ${
                      item.isMain
                        ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,182,23,0.8)]'
                        : 'text-yellow-600/40'
                    }`}>
                      {item.icon}
                      {item.isMain && (
                        <div className="absolute inset-0 blur-md bg-yellow-400/50 -z-10" />
                      )}
                    </span>

                    <div className="flex flex-col items-start">
                      <span className={`font-orbitron text-xs uppercase ${
                        item.isMain
                          ? 'text-yellow-400 font-black tracking-[0.3em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
                          : 'text-yellow-600/60 tracking-[0.2em] font-medium'
                      }`}>
                        {item.label}
                      </span>
                      {item.isMain && (
                        <span className="text-[7px] uppercase tracking-[0.3em] text-orange-500/60 font-bold">MAIN TERMINAL</span>
                      )}
                    </div>

                    {item.dropdown && (
                      <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${
                        item.isMain ? 'text-yellow-400/60' : 'text-yellow-600/30'
                      } ${activeDropdown === item.id ? 'rotate-180' : ''}`} />
                    )}
                  </div>

                  {/* Corner details */}
                  <div className="absolute top-0 right-0 w-3 h-3">
                    <div className={`absolute top-0 right-0 w-full h-[1px] ${
                      item.isMain ? 'bg-yellow-400/40' : 'bg-yellow-600/20'
                    }`} />
                    <div className={`absolute top-0 right-0 h-full w-[1px] ${
                      item.isMain ? 'bg-yellow-400/40' : 'bg-yellow-600/20'
                    }`} />
                  </div>

                  {/* Status LED */}
                  <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                    item.isMain
                      ? 'bg-yellow-400 shadow-[0_0_6px_rgba(250,182,23,0.8)] animate-pulse'
                      : 'bg-gray-600'
                  }`} />
                </button>

                {/* Enhanced Dropdown */}
                {item.dropdown && activeDropdown === item.id && (
                  <div className="absolute top-full mt-1 left-0 z-50 min-w-[160px] bg-gray-900/95 border border-yellow-500/30 backdrop-blur-md"
                       style={{
                         backgroundImage: `
                           linear-gradient(135deg, rgba(250,182,23,0.05) 0%, transparent 50%),
                           repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(250,182,23,0.02) 20px, rgba(250,182,23,0.02) 21px)
                         `
                       }}>
                    {item.dropdown.map((option, idx) => (
                      <div
                        key={option}
                        className="relative px-4 py-2.5 text-yellow-600/60 hover:bg-yellow-500/10 hover:text-yellow-400 cursor-pointer font-orbitron text-[10px] uppercase tracking-wider border-b border-yellow-600/10 last:border-0 transition-all"
                      >
                        <div className="absolute left-0 top-0 h-full w-[2px] bg-yellow-500/0 hover:bg-yellow-500/40 transition-all" />
                        <span className="relative flex items-center gap-2">
                          <span className="text-yellow-600/30">▸</span>
                          {option}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Version 4: FINAL INDUSTRIAL COMMAND */}
        <div className="mt-8 border-t-2 border-yellow-500/20 pt-8">
          <h3 className="text-sm uppercase text-yellow-500 mb-3 font-bold tracking-widest">Version 4: FINAL INDUSTRIAL COMMAND (RECOMMENDED)</h3>
          <div className="relative">
            {/* Background frame */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent" />

            <div className="relative flex gap-0.5 justify-center items-stretch bg-black p-2 border-y-4 border-yellow-600/20"
                 style={{
                   backgroundImage: `
                     linear-gradient(90deg, rgba(250,182,23,0.03) 0%, transparent 10%, transparent 90%, rgba(250,182,23,0.03) 100%),
                     repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(250,182,23,0.01) 40px, rgba(250,182,23,0.01) 41px)
                   `
                 }}>
              {navItems.map((item, index) => (
                <div key={item.id} className="relative flex">
                  {/* Separator bars between buttons */}
                  {index > 0 && (
                    <div className="w-[1px] bg-gradient-to-b from-transparent via-yellow-600/30 to-transparent" />
                  )}

                  <button
                    onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                    className={`
                      relative group overflow-hidden
                      ${item.isMain
                        ? 'px-8 py-4 min-w-[140px]'
                        : 'px-6 py-3 min-w-[120px]'
                      }
                      ${item.isMain
                        ? 'bg-gradient-to-b from-yellow-600/25 via-orange-600/20 to-yellow-700/25'
                        : 'bg-gradient-to-b from-gray-900/50 to-black/80'
                      }
                      hover:from-yellow-600/15 hover:to-yellow-700/20
                      transition-all duration-300
                    `}
                  >
                    {/* Industrial grunge texture */}
                    <div className="absolute inset-0 opacity-30"
                         style={{
                           backgroundImage: `
                             url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E")
                           `,
                           mixBlendMode: 'multiply'
                         }} />

                    {/* Top and bottom industrial borders */}
                    <div className={`absolute top-0 left-0 right-0 h-[1px] ${
                      item.isMain
                        ? 'bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent'
                        : 'bg-gradient-to-r from-transparent via-yellow-600/20 to-transparent'
                    }`} />
                    <div className={`absolute bottom-0 left-0 right-0 h-[1px] ${
                      item.isMain
                        ? 'bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent'
                        : 'bg-gradient-to-r from-transparent via-yellow-600/20 to-transparent'
                    }`} />

                    {/* Hazard pattern for HUB only */}
                    {item.isMain && (
                      <>
                        <div className="absolute -top-1 left-0 right-0 h-2 opacity-40"
                             style={{
                               background: `repeating-linear-gradient(
                                 90deg,
                                 #fab617 0px,
                                 #fab617 4px,
                                 #000 4px,
                                 #000 8px
                               )`
                             }} />
                        <div className="absolute -bottom-1 left-0 right-0 h-2 opacity-40"
                             style={{
                               background: `repeating-linear-gradient(
                                 90deg,
                                 #000 0px,
                                 #000 4px,
                                 #fab617 4px,
                                 #fab617 8px
                               )`
                             }} />
                      </>
                    )}

                    {/* Hover scan effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-500/0 to-transparent group-hover:via-yellow-500/10 transition-all duration-500" />

                    {/* Content container */}
                    <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                      {/* Icon */}
                      <span className={`text-lg ${
                        item.isMain
                          ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,182,23,0.6)]'
                          : 'text-yellow-600/50 group-hover:text-yellow-500/70'
                      } transition-all duration-300`}>
                        {item.icon}
                      </span>

                      {/* Label */}
                      <span className={`font-orbitron uppercase ${
                        item.isMain
                          ? 'text-[11px] font-black tracking-[0.25em] text-yellow-400'
                          : 'text-[9px] font-bold tracking-[0.2em] text-yellow-600/70 group-hover:text-yellow-500/80'
                      } transition-all duration-300`}>
                        {item.label}
                      </span>

                      {/* Subtitle for HUB */}
                      {item.isMain && (
                        <span className="text-[7px] uppercase tracking-[0.4em] text-orange-500/50 font-medium mt-0.5">
                          COMMAND
                        </span>
                      )}

                      {/* Dropdown indicator */}
                      {item.dropdown && (
                        <ChevronDown className={`w-2.5 h-2.5 ${
                          item.isMain ? 'text-yellow-400/50' : 'text-yellow-600/30'
                        } ${activeDropdown === item.id ? 'rotate-180' : ''} transition-transform duration-300`} />
                      )}
                    </div>

                    {/* Active/Power indicator */}
                    <div className={`absolute bottom-1 right-1 ${
                      item.isMain ? 'block' : 'hidden'
                    }`}>
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(250,182,23,0.8)]" />
                    </div>

                    {/* Side accent lines */}
                    <div className={`absolute left-0 top-1/4 bottom-1/4 w-[2px] ${
                      item.isMain
                        ? 'bg-gradient-to-b from-transparent via-yellow-400/40 to-transparent'
                        : 'bg-gradient-to-b from-transparent via-yellow-600/10 to-transparent opacity-0 group-hover:opacity-100'
                    } transition-opacity duration-300`} />
                    <div className={`absolute right-0 top-1/4 bottom-1/4 w-[2px] ${
                      item.isMain
                        ? 'bg-gradient-to-b from-transparent via-yellow-400/40 to-transparent'
                        : 'bg-gradient-to-b from-transparent via-yellow-600/10 to-transparent opacity-0 group-hover:opacity-100'
                    } transition-opacity duration-300`} />
                  </button>

                  {/* Industrial Dropdown */}
                  {item.dropdown && activeDropdown === item.id && (
                    <div className="absolute top-full mt-0.5 left-0 z-50 min-w-[140px]"
                         style={{
                           background: 'rgba(0,0,0,0.95)',
                           backdropFilter: 'blur(8px)',
                           border: '1px solid rgba(250,182,23,0.3)',
                           borderTop: '2px solid rgba(250,182,23,0.5)',
                           boxShadow: '0 10px 30px rgba(0,0,0,0.8), inset 0 1px 0 rgba(250,182,23,0.1)'
                         }}>
                      {item.dropdown.map((option, idx) => (
                        <div
                          key={option}
                          className="relative group/item px-4 py-3 cursor-pointer overflow-hidden"
                          style={{
                            background: idx % 2 === 0
                              ? 'rgba(250,182,23,0.02)'
                              : 'transparent',
                            borderBottom: '1px solid rgba(250,182,23,0.1)'
                          }}
                        >
                          {/* Hover effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/10 to-yellow-500/0 translate-x-[-100%] group-hover/item:translate-x-[100%] transition-transform duration-500" />

                          <div className="relative flex items-center gap-2">
                            <span className="text-yellow-600/40 group-hover/item:text-yellow-500 transition-colors">\u2022</span>
                            <span className="font-orbitron text-[10px] uppercase tracking-wider text-yellow-600/60 group-hover/item:text-yellow-400/80 transition-colors">
                              {option}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}