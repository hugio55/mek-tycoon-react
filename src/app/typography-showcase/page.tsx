'use client';

import React, { useState } from 'react';
import { fonts, typography, typographyClasses, textGlow, getFontStyle } from '@/lib/typography';
import '@/styles/typography-system.css';

export default function TypographyShowcase() {
  const [activeEffect, setActiveEffect] = useState<string>('');
  const [glowColor, setGlowColor] = useState<string>('yellow');

  return (
    <div className="min-h-screen bg-black p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <h1 className="typo-hero-title text-yellow-400 mb-4">
          Typography System Showcase
        </h1>
        <p className="typo-description text-gray-400">
          Diverse fonts for different UI contexts - breaking away from monotonous Orbitron
        </p>
      </div>

      {/* Display Fonts Section */}
      <section className="max-w-7xl mx-auto mb-16">
        <h2 className="typo-section-header text-yellow-500 mb-8">Display Fonts</h2>

        <div className="grid gap-6 bg-gray-900/20 p-8 rounded-xl border border-gray-800">
          <div className="border-b border-gray-800 pb-4">
            <p className="typo-label-subtle text-gray-500 mb-2">Hero Title - Michroma</p>
            <h3 className="typo-hero-title text-yellow-400">
              MEK TYCOON COMMAND CENTER
            </h3>
          </div>

          <div className="border-b border-gray-800 pb-4">
            <p className="typo-label-subtle text-gray-500 mb-2">Page Title - Audiowide</p>
            <h3 className="typo-page-title text-blue-400">
              MISSION BRIEFING ALPHA
            </h3>
          </div>

          <div className="border-b border-gray-800 pb-4">
            <p className="typo-label-subtle text-gray-500 mb-2">Section Header - Russo One</p>
            <h3 className="typo-section-header text-orange-400">
              COMBAT STATISTICS
            </h3>
          </div>

          <div className="pb-4">
            <p className="typo-label-subtle text-gray-500 mb-2">Military Style - Black Ops One</p>
            <h3 className="typo-military text-red-500">
              THREAT LEVEL CRITICAL
            </h3>
          </div>
        </div>
      </section>

      {/* UI Fonts Section */}
      <section className="max-w-7xl mx-auto mb-16">
        <h2 className="typo-section-header text-yellow-500 mb-8">UI & Interface Fonts</h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-900/30 p-6 rounded-lg border border-gray-800">
            <h3 className="typo-card-title text-cyan-400 mb-4">Exo 2 - Card Title</h3>
            <p className="typo-card-subtitle text-gray-400 mb-3">Saira - Card Subtitle</p>
            <p className="typo-ui-primary text-gray-300 mb-3">
              Saira - Primary UI text for general interface elements and navigation items
            </p>
            <p className="typo-ui-secondary text-gray-400">
              Space Grotesk - Secondary UI text with better readability for longer content blocks
            </p>
          </div>

          <div className="bg-gray-900/30 p-6 rounded-lg border border-gray-800">
            <h3 className="typo-card-title text-purple-400 mb-4">Interface Labels</h3>
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="typo-label text-yellow-500">OXANIUM LABEL</span>
              <span className="typo-badge bg-blue-900/50 text-blue-300 px-2 py-1 rounded">SAIRA BADGE</span>
              <span className="typo-label-subtle text-gray-500">SUBTLE LABEL</span>
            </div>
            <p className="typo-description text-gray-400">
              Space Grotesk description text - perfect for explanatory content with excellent legibility
            </p>
          </div>
        </div>
      </section>

      {/* Data & Numbers Section */}
      <section className="max-w-7xl mx-auto mb-16">
        <h2 className="typo-section-header text-yellow-500 mb-8">Data & Technical Fonts</h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-900/30 p-6 rounded-lg border border-gray-800 text-center">
            <p className="typo-stat-label text-gray-500 mb-2">Gold Balance</p>
            <div className="typo-data-large text-yellow-400">
              1,234,567
            </div>
          </div>

          <div className="bg-gray-900/30 p-6 rounded-lg border border-gray-800 text-center">
            <p className="typo-stat-label text-gray-500 mb-2">Combat Power</p>
            <div className="typo-data-medium text-orange-400">
              98,765
            </div>
          </div>

          <div className="bg-gray-900/30 p-6 rounded-lg border border-gray-800 text-center">
            <p className="typo-stat-label text-gray-500 mb-2">Timer Countdown</p>
            <div className="typo-timer text-red-400">
              05:23:47
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-900/30 p-6 rounded-lg border border-gray-800">
          <h3 className="typo-tech-readout text-green-400 mb-4">SYSTEM DIAGNOSTICS</h3>
          <div className="font-jetbrains text-sm text-green-300 space-y-1">
            <div>CPU: 78.3% | RAM: 4.2GB/8GB | TEMP: 42°C</div>
            <div>NET: 152ms | FPS: 60 | RENDER: 16.7ms</div>
            <div>STATUS: OPERATIONAL | ALERTS: 0 | QUEUE: 12</div>
          </div>
        </div>
      </section>

      {/* Contextual Examples Section */}
      <section className="max-w-7xl mx-auto mb-16">
        <h2 className="typo-section-header text-yellow-500 mb-8">Contextual Typography by Page</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Hub Example */}
          <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/20 p-6 rounded-lg border border-yellow-500/30">
            <h3 className="font-michroma text-xl text-yellow-400 mb-3">HUB COMMAND</h3>
            <div className="space-y-2">
              <p className="font-saira text-gray-300">Resource Management</p>
              <div className="font-jetbrains text-2xl text-yellow-300">142,857</div>
              <p className="font-oxanium text-xs text-gray-500 uppercase tracking-wider">Gold per minute: 523</p>
            </div>
          </div>

          {/* Combat Example */}
          <div className="bg-gradient-to-b from-red-900/20 to-gray-900/20 p-6 rounded-lg border border-red-500/30">
            <h3 className="font-blackops text-xl text-red-400 mb-3">COMBAT ZONE</h3>
            <div className="space-y-2">
              <p className="font-russo text-gray-300">Enemy Forces Detected</p>
              <div className="font-sharetech text-2xl text-red-300">THREAT: HIGH</div>
              <p className="font-russo text-xs text-gray-500 uppercase">Shields: 85% | Ammo: 42</p>
            </div>
          </div>

          {/* Shop Example */}
          <div className="bg-gradient-to-b from-blue-900/20 to-gray-900/20 p-6 rounded-lg border border-blue-500/30">
            <h3 className="font-exo text-xl text-blue-400 mb-3">MARKETPLACE</h3>
            <div className="space-y-2">
              <p className="font-space text-gray-300">Premium Items</p>
              <div className="font-jetbrains text-2xl text-blue-300">24 NEW</div>
              <p className="font-oxanium text-xs text-gray-500 uppercase tracking-wider">Sale ends: 2:45:30</p>
            </div>
          </div>

          {/* Crafting Example */}
          <div className="bg-gradient-to-b from-purple-900/20 to-gray-900/20 p-6 rounded-lg border border-purple-500/30">
            <h3 className="font-audiowide text-xl text-purple-400 mb-3">WORKSHOP</h3>
            <div className="space-y-2">
              <p className="font-oxanium text-gray-300">Component Assembly</p>
              <div className="font-sharetech text-2xl text-purple-300">78.5%</div>
              <p className="font-oxanium text-xs text-gray-500 uppercase tracking-wider">Time remaining: 4:20</p>
            </div>
          </div>

          {/* Leaderboard Example */}
          <div className="bg-gradient-to-b from-yellow-900/20 to-gray-900/20 p-6 rounded-lg border border-yellow-500/30">
            <h3 className="font-bebas text-2xl text-yellow-400 mb-3 tracking-wider">LEADERBOARD</h3>
            <div className="space-y-2">
              <p className="font-saira text-gray-300">Global Rank</p>
              <div className="font-teko text-4xl text-yellow-300 leading-none">#1,337</div>
              <p className="font-saira text-xs text-gray-500 uppercase">Top 5% worldwide</p>
            </div>
          </div>

          {/* Admin Example */}
          <div className="bg-gradient-to-b from-green-900/20 to-gray-900/20 p-6 rounded-lg border border-green-500/30">
            <h3 className="font-jetbrains text-xl text-green-400 mb-3">ADMIN PANEL</h3>
            <div className="space-y-2">
              <p className="font-sharetech text-gray-300">Database Status</p>
              <div className="font-jetbrains text-lg text-green-300">CONNECTED</div>
              <p className="font-jetbrains text-xs text-gray-500">Latency: 12ms | Q: 0</p>
            </div>
          </div>
        </div>
      </section>

      {/* Button Variations */}
      <section className="max-w-7xl mx-auto mb-16">
        <h2 className="typo-section-header text-yellow-500 mb-8">Button Typography</h2>

        <div className="flex flex-wrap gap-4">
          <button className="px-6 py-3 bg-yellow-500 text-black typo-button-primary hover:bg-yellow-400 transition-colors">
            PRIMARY ACTION
          </button>

          <button className="px-5 py-2.5 bg-blue-600 text-white typo-button-secondary hover:bg-blue-500 transition-colors">
            SECONDARY BUTTON
          </button>

          <button className="px-4 py-2 bg-gray-700 text-gray-200 typo-button-small hover:bg-gray-600 transition-colors">
            SMALL BUTTON
          </button>

          <button className="px-6 py-3 bg-red-600 text-white font-russo tracking-wider hover:bg-red-500 transition-colors">
            RUSSO ONE BUTTON
          </button>

          <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-audiowide hover:from-purple-500 hover:to-blue-500 transition-all">
            AUDIOWIDE GRADIENT
          </button>
        </div>
      </section>

      {/* Special Effects */}
      <section className="max-w-7xl mx-auto mb-16">
        <h2 className="typo-section-header text-yellow-500 mb-8">Typography Effects</h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-900/30 p-6 rounded-lg border border-gray-800">
            <h3 className="typo-card-title text-cyan-400 mb-6">Text Effects</h3>

            <div className="space-y-4">
              <div>
                <button
                  onClick={() => setActiveEffect(activeEffect === 'glitch' ? '' : 'glitch')}
                  className="typo-button-small bg-gray-700 text-gray-300 px-3 py-1 rounded mb-2"
                >
                  Toggle Glitch
                </button>
                <h4
                  className={`font-audiowide text-2xl text-yellow-400 ${activeEffect === 'glitch' ? 'typo-glitch' : ''}`}
                  data-text="SYSTEM ERROR"
                >
                  SYSTEM ERROR
                </h4>
              </div>

              <div>
                <button
                  onClick={() => setActiveEffect(activeEffect === 'distort' ? '' : 'distort')}
                  className="typo-button-small bg-gray-700 text-gray-300 px-3 py-1 rounded mb-2"
                >
                  Toggle Distort
                </button>
                <h4 className={`font-russo text-2xl text-orange-400 ${activeEffect === 'distort' ? 'typo-distort' : ''}`}>
                  UNSTABLE FIELD
                </h4>
              </div>

              <div>
                <button
                  onClick={() => setActiveEffect(activeEffect === 'scan' ? '' : 'scan')}
                  className="typo-button-small bg-gray-700 text-gray-300 px-3 py-1 rounded mb-2"
                >
                  Toggle Scan
                </button>
                <h4 className={`font-michroma text-2xl text-blue-400 ${activeEffect === 'scan' ? 'typo-scan' : ''}`}>
                  SCANNING DATA
                </h4>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/30 p-6 rounded-lg border border-gray-800">
            <h3 className="typo-card-title text-purple-400 mb-6">Text Glow Effects</h3>

            <div className="space-y-3">
              <div className="flex gap-2 mb-4">
                {Object.keys(textGlow).map((color) => (
                  <button
                    key={color}
                    onClick={() => setGlowColor(color)}
                    className={`px-3 py-1 text-xs rounded ${
                      glowColor === color ? 'bg-gray-600' : 'bg-gray-700'
                    } text-gray-300`}
                  >
                    {color.toUpperCase()}
                  </button>
                ))}
              </div>

              <h4
                className="font-audiowide text-2xl"
                style={{
                  color: glowColor === 'yellow' ? '#fab617' :
                         glowColor === 'blue' ? '#3b82f6' :
                         glowColor === 'red' ? '#ef4444' :
                         glowColor === 'green' ? '#22c55e' :
                         glowColor === 'cyan' ? '#22d3ee' :
                         glowColor === 'purple' ? '#8b5cf6' :
                         '#fb923c',
                  ...textGlow[glowColor as keyof typeof textGlow]
                }}
              >
                ENERGY SIGNATURE
              </h4>
            </div>
          </div>
        </div>
      </section>

      {/* Font Comparison Table */}
      <section className="max-w-7xl mx-auto mb-16">
        <h2 className="typo-section-header text-yellow-500 mb-8">Font Family Comparison</h2>

        <div className="overflow-x-auto">
          <table className="w-full bg-gray-900/30 border border-gray-800">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-4 text-left typo-label text-gray-400">Font Name</th>
                <th className="p-4 text-left typo-label text-gray-400">Best Use Case</th>
                <th className="p-4 text-left typo-label text-gray-400">Sample</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800">
                <td className="p-4 typo-ui-secondary text-gray-300">Michroma</td>
                <td className="p-4 typo-ui-secondary text-gray-400">Hero titles, main branding</td>
                <td className="p-4 font-michroma text-yellow-400 text-xl">ADVANCED SYSTEMS</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-4 typo-ui-secondary text-gray-300">Audiowide</td>
                <td className="p-4 typo-ui-secondary text-gray-400">Section headers, emphasis</td>
                <td className="p-4 font-audiowide text-yellow-400 text-xl">TACTICAL DISPLAY</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-4 typo-ui-secondary text-gray-300">Russo One</td>
                <td className="p-4 typo-ui-secondary text-gray-400">Military/combat UI</td>
                <td className="p-4 font-russo text-yellow-400 text-xl">DEFENSE PROTOCOL</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-4 typo-ui-secondary text-gray-300">Black Ops One</td>
                <td className="p-4 typo-ui-secondary text-gray-400">Warnings, military alerts</td>
                <td className="p-4 font-blackops text-yellow-400 text-xl">CRITICAL ALERT</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-4 typo-ui-secondary text-gray-300">Exo 2</td>
                <td className="p-4 typo-ui-secondary text-gray-400">Clean UI, shop/market</td>
                <td className="p-4 font-exo text-yellow-400 text-xl">Market Interface</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-4 typo-ui-secondary text-gray-300">Saira</td>
                <td className="p-4 typo-ui-secondary text-gray-400">Body text, UI labels</td>
                <td className="p-4 font-saira text-yellow-400 text-xl">Interface Elements</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-4 typo-ui-secondary text-gray-300">Space Grotesk</td>
                <td className="p-4 typo-ui-secondary text-gray-400">Descriptions, readable text</td>
                <td className="p-4 font-space text-yellow-400 text-xl">System Information</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-4 typo-ui-secondary text-gray-300">Oxanium</td>
                <td className="p-4 typo-ui-secondary text-gray-400">Labels, small UI text</td>
                <td className="p-4 font-oxanium text-yellow-400 text-xl">STATUS INDICATOR</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-4 typo-ui-secondary text-gray-300">JetBrains Mono</td>
                <td className="p-4 typo-ui-secondary text-gray-400">Data, numbers, code</td>
                <td className="p-4 font-jetbrains text-yellow-400 text-xl">1,234,567.89</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-4 typo-ui-secondary text-gray-300">Share Tech Mono</td>
                <td className="p-4 typo-ui-secondary text-gray-400">Technical readouts</td>
                <td className="p-4 font-sharetech text-yellow-400 text-xl">SYSTEM.STATUS.OK</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-4 typo-ui-secondary text-gray-300">Teko</td>
                <td className="p-4 typo-ui-secondary text-gray-400">Large numbers, timers</td>
                <td className="p-4 font-teko text-yellow-400 text-3xl">12:34:56</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-4 typo-ui-secondary text-gray-300">Bebas Neue</td>
                <td className="p-4 typo-ui-secondary text-gray-400">Impact text, headlines</td>
                <td className="p-4 font-bebas text-yellow-400 text-2xl tracking-wider">MAXIMUM POWER</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}