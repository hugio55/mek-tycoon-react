"use client";

import React, { useState } from 'react';
import Link from 'next/link';

type FluxType = 'static' | 'kinetic' | 'thermal' | 'resonant' | 'quantum';

interface Enemy {
  id: string;
  name: string;
  type: string;
  fluxRequired: number;
  turnsAllowed: number;
  description: string;
  powerBarColor: string;
  vulnerabilities: FluxType[]; // Weak to these types (2x flux)
  resistances: FluxType[]; // Resistant to these (0.5x flux)
  rewards: string[];
}

interface SpellPattern {
  id: string;
  name: string;
  rarity: 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'god';
  fluxValue: number;
  fluxType: FluxType; // The type of flux energy this spell generates
  complexity: number; // Based on sharp turns and length
  pattern: string; // SVG path data
  description: string;
}

export default function FluxPage() {
  const [selectedEnemy, setSelectedEnemy] = useState<Enemy | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<SpellPattern | null>(null);

  // Energizable Enemies with Vulnerabilities and Resistances
  const enemies: Enemy[] = [
    {
      id: 'crystal_core_01',
      name: 'Dormant Crystal Core',
      type: 'Crystal',
      fluxRequired: 200,
      turnsAllowed: 5,
      description: 'An ancient crystal that needs exactly 200 flux to activate without overloading.',
      powerBarColor: '#9333ea',
      vulnerabilities: ['resonance', 'harmonic'], // Crystals resonate with harmonic frequencies
      resistances: ['pulse', 'surge'], // Sharp pulses are absorbed
      rewards: ['Crystal Essence x3', 'Flux Capacitor Blueprint']
    },
    {
      id: 'mainframe_alpha',
      name: 'Corrupted Mainframe',
      type: 'Computer',
      fluxRequired: 350,
      turnsAllowed: 7,
      description: 'A malfunctioning AI system that requires precise flux injection to reboot.',
      powerBarColor: '#06b6d4',
      vulnerabilities: ['pulse', 'phase'], // Digital systems respond to pulses and phase shifts
      resistances: ['wave', 'cascade'], // Analog waves are filtered out
      rewards: ['Digital Essence x5', 'Code Fragment x10']
    },
    {
      id: 'power_relay',
      name: 'Power Relay Station',
      type: 'Machine',
      fluxRequired: 150,
      turnsAllowed: 4,
      description: 'A delicate relay that will explode if overcharged. Precision required!',
      powerBarColor: '#eab308',
      vulnerabilities: ['wave', 'surge'], // Power systems channel waves and surges well
      resistances: ['quantum', 'resonance'], // Too complex for simple relays
      rewards: ['Energy Cell x2', 'Copper Wiring x15']
    },
    {
      id: 'void_portal',
      name: 'Unstable Void Portal',
      type: 'Dimensional',
      fluxRequired: 500,
      turnsAllowed: 8,
      description: 'A tear in space that needs massive flux to stabilize before it collapses.',
      powerBarColor: '#7c3aed',
      vulnerabilities: ['quantum', 'phase'], // Dimensional rifts respond to quantum effects
      resistances: ['pulse', 'wave'], // Simple energies don't affect dimensional space
      rewards: ['Void Essence x7', 'Dimensional Key']
    },
    {
      id: 'mek_prototype',
      name: 'Prototype Mek Engine',
      type: 'Mechanical',
      fluxRequired: 275,
      turnsAllowed: 6,
      description: 'An experimental Mek core that needs careful energizing to activate.',
      powerBarColor: '#f97316',
      vulnerabilities: ['surge', 'cascade'], // Mechanical systems need power surges
      resistances: ['harmonic', 'phase'], // Too subtle for mechanical parts
      rewards: ['Mek Parts x20', 'Engine Blueprint']
    },
    {
      id: 'beacon_tower',
      name: 'Ancient Beacon',
      type: 'Structure',
      fluxRequired: 400,
      turnsAllowed: 10,
      description: 'A mysterious beacon that must be charged to send a signal to the stars.',
      powerBarColor: '#fbbf24',
      vulnerabilities: ['cascade', 'harmonic'], // Ancient tech uses cascading harmonics
      resistances: ['surge', 'pulse'], // Built to withstand power spikes
      rewards: ['Star Fragment x3', 'Beacon Map']
    },
    {
      id: 'bio_chamber',
      name: 'Stasis Bio-Chamber',
      type: 'Biological',
      fluxRequired: 225,
      turnsAllowed: 5,
      description: 'A life support system that needs exact flux levels to awaken its occupant.',
      powerBarColor: '#10b981',
      vulnerabilities: ['wave', 'resonance'], // Biological systems respond to waves
      resistances: ['quantum', 'cascade'], // Too chaotic for life support
      rewards: ['Bio Sample x4', 'DNA Sequence']
    },
    {
      id: 'quantum_lock',
      name: 'Quantum Lock',
      type: 'Security',
      fluxRequired: 180,
      turnsAllowed: 3,
      description: 'A high-security lock that requires rapid flux injection to crack.',
      powerBarColor: '#ef4444',
      vulnerabilities: ['quantum', 'pulse'], // Quantum security needs quantum keys
      resistances: ['wave', 'harmonic'], // Security filters out smooth patterns
      rewards: ['Security Chip x6', 'Access Card']
    }
  ];

  // Spell Patterns with varying complexity
  const spellPatterns: SpellPattern[] = [
    // Uncommon (Simple patterns, 1-2 turns, low flux)
    {
      id: 'spark',
      name: 'Spark',
      rarity: 'uncommon',
      fluxValue: 15,
      wavelength: 'static',
      complexity: 1,
      pattern: 'M 50 50 L 150 50', // Simple straight line
      description: 'A basic pulse discharge in a straight line.'
    },
    {
      id: 'arc',
      name: 'Arc',
      rarity: 'uncommon',
      fluxValue: 20,
      wavelength: 'kinetic',
      complexity: 2,
      pattern: 'M 50 100 Q 100 50, 150 100', // Simple curve
      description: 'A gentle wave arc of energy.'
    },
    {
      id: 'angle',
      name: 'Angle Strike',
      rarity: 'uncommon',
      fluxValue: 25,
      wavelength: 'thermal',
      complexity: 3,
      pattern: 'M 50 50 L 100 100 L 150 50', // Simple angle (1 turn)
      description: 'A sharp angular surge pattern.'
    },

    // Rare (2-3 turns, moderate flux)
    {
      id: 'zigzag',
      name: 'Zigzag Bolt',
      rarity: 'rare',
      fluxValue: 40,
      wavelength: 'thermal',
      complexity: 5,
      pattern: 'M 30 50 L 60 100 L 90 50 L 120 100 L 150 50', // Zigzag (3 turns)
      description: 'A surging zigzag pattern of energy.'
    },
    {
      id: 'square_wave',
      name: 'Square Wave',
      rarity: 'rare',
      fluxValue: 45,
      wavelength: 'static',
      complexity: 6,
      pattern: 'M 30 75 L 50 75 L 50 25 L 80 25 L 80 75 L 110 75 L 110 25 L 140 25', // Square wave (multiple 90° turns)
      description: 'A digital pulse wave pattern.'
    },
    {
      id: 'spiral_start',
      name: 'Spiral Initiate',
      rarity: 'rare',
      fluxValue: 50,
      wavelength: 'resonant',
      complexity: 7,
      pattern: 'M 100 100 L 100 50 L 50 50 L 50 150 L 150 150 L 150 30', // Rectangular spiral start
      description: 'The beginning of a resonating spiral.'
    },

    // Epic (4-5 turns, high flux)
    {
      id: 'lightning_fork',
      name: 'Lightning Fork',
      rarity: 'epic',
      fluxValue: 75,
      wavelength: 'static',
      complexity: 10,
      pattern: 'M 50 150 L 70 100 L 60 80 L 80 40 L 70 20 L 90 10 L 100 30 L 120 20 L 130 40', // Forked lightning
      description: 'A cascading fork pattern with multiple branches.'
    },
    {
      id: 'helix',
      name: 'Helix Surge',
      rarity: 'epic',
      fluxValue: 85,
      wavelength: 'resonant',
      complexity: 12,
      pattern: 'M 30 100 Q 50 50, 70 100 Q 90 150, 110 100 Q 130 50, 150 100', // Double helix
      description: 'A complex harmonic helix pattern.'
    },
    {
      id: 'maze_runner',
      name: 'Maze Runner',
      rarity: 'epic',
      fluxValue: 90,
      wavelength: 'quantum',
      complexity: 14,
      pattern: 'M 20 20 L 20 80 L 40 80 L 40 40 L 60 40 L 60 100 L 80 100 L 80 20 L 100 20 L 100 120 L 120 120 L 120 60', // Maze-like
      description: 'Phase-shift through a maze of flux channels.'
    },

    // Legendary (6-8 turns, very high flux)
    {
      id: 'fractal_path',
      name: 'Fractal Path',
      rarity: 'legendary',
      fluxValue: 120,
      wavelength: 'resonant',
      complexity: 18,
      pattern: 'M 10 100 L 30 100 L 30 80 L 50 80 L 50 100 L 70 100 L 70 60 L 90 60 L 90 100 L 110 100 L 110 40 L 130 40 L 130 100 L 150 100', // Fractal steps
      description: 'A fractal resonance of increasing complexity.'
    },
    {
      id: 'dragon_breath',
      name: 'Plasma Stream',
      rarity: 'legendary',
      fluxValue: 135,
      wavelength: 'static',
      complexity: 20,
      pattern: 'M 20 100 L 30 80 L 25 60 L 35 40 L 30 20 L 50 15 L 60 25 L 70 10 L 85 20 L 90 35 L 100 25 L 110 40 L 120 20 L 135 30 L 140 50', // Complex plasma stream
      description: 'A chaotic cascade of plasma energy.'
    },
    {
      id: 'quantum_leap',
      name: 'Quantum Leap',
      rarity: 'legendary',
      fluxValue: 150,
      wavelength: 'quantum',
      complexity: 22,
      pattern: 'M 10 10 L 10 30 L 30 30 L 30 10 L 50 10 L 50 50 L 30 50 L 30 70 L 70 70 L 70 30 L 90 30 L 90 90 L 50 90 L 50 110 L 110 110 L 110 50', // Quantum jumps
      description: 'Leap through quantum flux dimensions.'
    },

    // Mythic (9-12 turns, extreme flux)
    {
      id: 'infinity_loop',
      name: 'Infinity Loop',
      rarity: 'mythic',
      fluxValue: 200,
      wavelength: 'resonant',
      complexity: 28,
      pattern: 'M 50 75 Q 30 50, 50 25 Q 70 50, 90 25 Q 110 50, 130 25 Q 150 50, 130 75 Q 110 50, 90 75 Q 70 50, 50 75', // Figure-8 infinity
      description: 'An infinite harmonic loop of pure energy.'
    },
    {
      id: 'chaos_matrix',
      name: 'Chaos Matrix',
      rarity: 'mythic',
      fluxValue: 225,
      wavelength: 'quantum',
      complexity: 32,
      pattern: 'M 10 10 L 30 50 L 10 90 L 50 70 L 30 110 L 70 90 L 50 130 L 90 110 L 70 150 L 110 130 L 90 170 L 130 150 L 110 190 L 150 170', // Chaotic matrix
      description: 'A chaotic phase matrix of intersecting flux lines.'
    },

    // God Tier (15+ turns, maximum flux)
    {
      id: 'divine_mandala',
      name: 'Divine Mandala',
      rarity: 'god',
      fluxValue: 300,
      wavelength: 'quantum',
      complexity: 40,
      pattern: 'M 100 10 L 80 30 L 100 50 L 120 30 L 100 10 L 60 20 L 40 50 L 60 80 L 100 90 L 140 80 L 160 50 L 140 20 L 100 10 L 100 170 L 80 150 L 100 130 L 120 150 L 100 170', // Complex mandala
      description: 'A divine quantum mandala of ultimate power.'
    },
    {
      id: 'omega_sequence',
      name: 'Omega Sequence',
      rarity: 'god',
      fluxValue: 350,
      wavelength: 'resonant',
      complexity: 45,
      pattern: 'M 10 100 L 20 80 L 10 60 L 20 40 L 10 20 L 30 10 L 50 20 L 40 40 L 50 60 L 40 80 L 50 100 L 70 90 L 60 70 L 70 50 L 60 30 L 70 10 L 90 20 L 80 40 L 90 60 L 80 80 L 90 100', // Ultimate sequence
      description: 'The ultimate omega resonance - few can complete it.'
    }
  ];

  const getRarityColor = (rarity: SpellPattern['rarity']) => {
    switch (rarity) {
      case 'uncommon': return '#22c55e';
      case 'rare': return '#3b82f6';
      case 'epic': return '#a855f7';
      case 'legendary': return '#f97316';
      case 'mythic': return '#ef4444';
      case 'god': return '#fbbf24';
      default: return '#6b7280';
    }
  };

  const getWavelengthColor = (wavelength: FluxType) => {
    switch (wavelength) {
      case 'static': return '#60a5fa'; // Electric blue
      case 'kinetic': return '#f97316'; // Orange - motion/force
      case 'thermal': return '#ef4444'; // Red - heat
      case 'resonant': return '#a855f7'; // Purple - frequency
      case 'quantum': return '#10b981'; // Emerald - quantum probability
      default: return '#6b7280';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/scrapyard" className="text-yellow-400 hover:text-yellow-300 mb-4 inline-block">
            ← Back to Scrapyard
          </Link>
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              FLUX BATTLE SYSTEM
            </span>
          </h1>
          <p className="text-gray-400">
            Energize enemies to exact flux levels without overloading them. Master spell patterns to generate flux!
          </p>
        </div>

        {/* Enemies Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-yellow-400">Energizable Targets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {enemies.map((enemy) => (
              <div
                key={enemy.id}
                onClick={() => setSelectedEnemy(enemy)}
                className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-yellow-500 transition-all cursor-pointer"
              >
                <div className="mb-2">
                  <h3 className="font-bold text-lg">{enemy.name}</h3>
                  <span className="text-xs text-gray-500">{enemy.type}</span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm">
                    <span>Flux Required:</span>
                    <span className="text-cyan-400 font-bold">{enemy.fluxRequired}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Turn Limit:</span>
                    <span className="text-orange-400 font-bold">{enemy.turnsAllowed}</span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {enemy.vulnerabilities.slice(0, 2).map(v => (
                      <span
                        key={v}
                        className="text-xs px-1 py-0.5 rounded"
                        style={{
                          backgroundColor: `${getWavelengthColor(v)}30`,
                          color: getWavelengthColor(v),
                          border: `1px solid ${getWavelengthColor(v)}50`
                        }}
                        title={`Weak to ${v}`}
                      >
                        ↓{v}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: '0%',
                      backgroundColor: enemy.powerBarColor,
                      boxShadow: `0 0 10px ${enemy.powerBarColor}`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flux Type Matchup Chart */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-yellow-400">Flux Type Matchups</h2>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-3 border-b border-gray-700">Flux Type</th>
                    <th className="text-left p-3 border-b border-gray-700">Color</th>
                    <th className="text-left p-3 border-b border-gray-700">Strong Against (2x)</th>
                    <th className="text-left p-3 border-b border-gray-700">Weak Against (0.5x)</th>
                    <th className="text-left p-3 border-b border-gray-700">Best Targets</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800">
                    <td className="p-3 font-bold">
                      <span style={{ color: '#60a5fa' }}>⚡ Static</span>
                    </td>
                    <td className="p-3">
                      <div className="w-20 h-6 rounded" style={{ backgroundColor: '#60a5fa' }}></div>
                    </td>
                    <td className="p-3 text-green-400">Kinetic, Quantum</td>
                    <td className="p-3 text-red-400">Thermal</td>
                    <td className="p-3 text-gray-400">Computers, Security Systems</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="p-3 font-bold">
                      <span style={{ color: '#f97316' }}>💨 Kinetic</span>
                    </td>
                    <td className="p-3">
                      <div className="w-20 h-6 rounded" style={{ backgroundColor: '#f97316' }}></div>
                    </td>
                    <td className="p-3 text-green-400">Thermal, Resonant</td>
                    <td className="p-3 text-red-400">Static</td>
                    <td className="p-3 text-gray-400">Crystals, Mechanical Devices</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="p-3 font-bold">
                      <span style={{ color: '#ef4444' }}>🔥 Thermal</span>
                    </td>
                    <td className="p-3">
                      <div className="w-20 h-6 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                    </td>
                    <td className="p-3 text-green-400">Static, Quantum</td>
                    <td className="p-3 text-red-400">Kinetic</td>
                    <td className="p-3 text-gray-400">Biological, Power Systems</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="p-3 font-bold">
                      <span style={{ color: '#a855f7' }}>〰️ Resonant</span>
                    </td>
                    <td className="p-3">
                      <div className="w-20 h-6 rounded" style={{ backgroundColor: '#a855f7' }}></div>
                    </td>
                    <td className="p-3 text-green-400">Quantum, Thermal</td>
                    <td className="p-3 text-red-400">Kinetic</td>
                    <td className="p-3 text-gray-400">Ancient Structures, Crystals</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">
                      <span style={{ color: '#10b981' }}>🌌 Quantum</span>
                    </td>
                    <td className="p-3">
                      <div className="w-20 h-6 rounded" style={{ backgroundColor: '#10b981' }}></div>
                    </td>
                    <td className="p-3 text-green-400">Kinetic, Resonant</td>
                    <td className="p-3 text-red-400">Static, Thermal</td>
                    <td className="p-3 text-gray-400">Void Portals, Quantum Tech</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <p>• Strong Against: Deals 2x flux when target is vulnerable</p>
              <p>• Weak Against: Deals 0.5x flux when target resists</p>
              <p>• Normal: Deals 1x flux against neutral targets</p>
            </div>
          </div>
        </div>

        {/* Spell Patterns Section */}
        <div>
          <h2 className="text-3xl font-bold mb-6 text-yellow-400">Flux Spell Patterns</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {spellPatterns.map((spell) => (
              <div
                key={spell.id}
                onClick={() => setSelectedSpell(spell)}
                className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-yellow-500 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{spell.name}</h3>
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: `${getRarityColor(spell.rarity)}20`,
                      color: getRarityColor(spell.rarity),
                      border: `1px solid ${getRarityColor(spell.rarity)}50`
                    }}
                  >
                    {spell.rarity.toUpperCase()}
                  </span>
                </div>
                <div className="mb-2 h-20 bg-gray-800 rounded flex items-center justify-center relative">
                  <svg viewBox="0 0 200 200" className="w-full h-full p-2">
                    <path
                      d={spell.pattern}
                      stroke={getRarityColor(spell.rarity)}
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div
                    className="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${getWavelengthColor(spell.wavelength)}20`,
                      color: getWavelengthColor(spell.wavelength),
                      border: `1px solid ${getWavelengthColor(spell.wavelength)}50`
                    }}
                  >
                    {spell.wavelength}
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Flux:</span>
                  <span className="text-cyan-400 font-bold">+{spell.fluxValue}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Complexity:</span>
                  <span className="text-gray-400">{spell.complexity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Enemy Modal */}
        {selectedEnemy && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedEnemy(null)}
          >
            <div
              className="bg-gray-900 border border-yellow-500 rounded-lg p-6 max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-2">{selectedEnemy.name}</h3>
              <p className="text-gray-400 mb-4">{selectedEnemy.description}</p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="text-yellow-400">{selectedEnemy.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Flux Required:</span>
                  <span className="text-cyan-400 font-bold">{selectedEnemy.fluxRequired}</span>
                </div>
                <div className="flex justify-between">
                  <span>Turn Limit:</span>
                  <span className="text-orange-400 font-bold">{selectedEnemy.turnsAllowed}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-bold mb-2 text-green-400">Vulnerabilities (2x)</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedEnemy.vulnerabilities.map((v) => (
                      <span
                        key={v}
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor: `${getWavelengthColor(v)}30`,
                          color: getWavelengthColor(v),
                          border: `1px solid ${getWavelengthColor(v)}50`
                        }}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-red-400">Resistances (0.5x)</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedEnemy.resistances.map((r) => (
                      <span
                        key={r}
                        className="text-xs px-2 py-1 rounded opacity-60"
                        style={{
                          backgroundColor: `${getWavelengthColor(r)}20`,
                          color: getWavelengthColor(r),
                          border: `1px solid ${getWavelengthColor(r)}30`
                        }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <h4 className="font-bold mb-2">Rewards:</h4>
                <ul className="text-sm text-green-400">
                  {selectedEnemy.rewards.map((reward, i) => (
                    <li key={i}>• {reward}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setSelectedEnemy(null)}
                className="w-full py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Selected Spell Modal */}
        {selectedSpell && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedSpell(null)}
          >
            <div
              className="bg-gray-900 border border-yellow-500 rounded-lg p-6 max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-2">{selectedSpell.name}</h3>
              <span
                className="inline-block mb-4 px-3 py-1 rounded text-sm"
                style={{
                  backgroundColor: `${getRarityColor(selectedSpell.rarity)}20`,
                  color: getRarityColor(selectedSpell.rarity),
                  border: `1px solid ${getRarityColor(selectedSpell.rarity)}50`
                }}
              >
                {selectedSpell.rarity.toUpperCase()}
              </span>
              <p className="text-gray-400 mb-4">{selectedSpell.description}</p>
              <div className="mb-4 h-40 bg-gray-800 rounded flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-full h-full p-4">
                  <path
                    d={selectedSpell.pattern}
                    stroke={getRarityColor(selectedSpell.rarity)}
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Flux Generation:</span>
                  <span className="text-cyan-400 font-bold">+{selectedSpell.fluxValue}</span>
                </div>
                <div className="flex justify-between">
                  <span>Wavelength:</span>
                  <span
                    className="px-2 py-0.5 rounded text-sm"
                    style={{
                      backgroundColor: `${getWavelengthColor(selectedSpell.wavelength)}30`,
                      color: getWavelengthColor(selectedSpell.wavelength),
                      border: `1px solid ${getWavelengthColor(selectedSpell.wavelength)}50`
                    }}
                  >
                    {selectedSpell.wavelength}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Complexity Score:</span>
                  <span className="text-gray-400">{selectedSpell.complexity}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSpell(null)}
                className="w-full py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}