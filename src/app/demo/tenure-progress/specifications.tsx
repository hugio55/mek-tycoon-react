'use client';

import React from 'react';

/**
 * TENURE PROGRESS BAR - DESIGN SPECIFICATIONS
 *
 * This file provides visual reference for designers and developers
 * showing exact color values, spacing, and visual effects used.
 */

export default function TenureProgressSpecifications() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-yellow-400 mek-text-industrial mb-2">
            Tenure Progress Bar - Design Specifications
          </h1>
          <p className="text-gray-400">
            Exact color values, dimensions, and visual effects reference
          </p>
        </div>

        {/* Color Palette */}
        <div className="mb-12 mek-card-industrial mek-border-sharp-gold p-8">
          <h2 className="text-2xl font-bold text-yellow-400 mek-text-industrial mb-6">
            Color Palette
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Primary Yellow */}
            <div>
              <div className="w-full h-24 bg-yellow-400 rounded mb-2 border-2 border-yellow-500/50" />
              <div className="text-sm font-mono text-yellow-400">#fab617</div>
              <div className="text-xs text-gray-400">Primary Yellow</div>
              <div className="text-xs text-gray-500 mt-1">
                RGB: 250, 182, 23<br />
                rgba(250, 182, 23, 1)
              </div>
            </div>

            {/* Gold Accent */}
            <div>
              <div className="w-full h-24 rounded mb-2 border-2 border-yellow-500/50" style={{ background: '#FFD700' }} />
              <div className="text-sm font-mono text-yellow-400">#FFD700</div>
              <div className="text-xs text-gray-400">Gold Accent</div>
              <div className="text-xs text-gray-500 mt-1">
                RGB: 255, 215, 0<br />
                Used in gradients
              </div>
            </div>

            {/* Border Color */}
            <div>
              <div className="w-full h-24 rounded mb-2 border-2" style={{ borderColor: 'rgba(250, 182, 23, 0.5)', background: 'rgba(250, 182, 23, 0.1)' }} />
              <div className="text-sm font-mono text-yellow-400">rgba(250, 182, 23, 0.5)</div>
              <div className="text-xs text-gray-400">Border Color</div>
              <div className="text-xs text-gray-500 mt-1">
                50% opacity yellow<br />
                Sharp industrial edges
              </div>
            </div>

            {/* Background */}
            <div>
              <div className="w-full h-24 rounded mb-2 border border-gray-700" style={{ background: 'rgba(0, 0, 0, 0.6)' }} />
              <div className="text-sm font-mono text-yellow-400">rgba(0, 0, 0, 0.6)</div>
              <div className="text-xs text-gray-400">Bar Background</div>
              <div className="text-xs text-gray-500 mt-1">
                60% opacity black<br />
                With backdrop blur
              </div>
            </div>
          </div>
        </div>

        {/* Gradient Specifications */}
        <div className="mb-12 mek-card-industrial mek-border-sharp-gold p-8">
          <h2 className="text-2xl font-bold text-yellow-400 mek-text-industrial mb-6">
            Fill Gradient Specification
          </h2>

          <div className="space-y-6">
            {/* Default/Compact Gradient */}
            <div>
              <div className="text-sm text-gray-300 font-medium mb-2">Default & Compact Styles:</div>
              <div className="h-16 rounded" style={{
                background: 'linear-gradient(90deg, rgba(250, 182, 23, 0.8), rgba(250, 182, 23, 1), rgba(255, 255, 255, 0.2))',
                border: '2px solid rgba(250, 182, 23, 0.4)'
              }} />
              <div className="mt-2 text-xs font-mono text-gray-400">
                linear-gradient(90deg, <br />
                &nbsp;&nbsp;rgba(250, 182, 23, 0.8),&nbsp;&nbsp;← Left edge (80% opacity)<br />
                &nbsp;&nbsp;rgba(250, 182, 23, 1),&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;← Center (100% opacity)<br />
                &nbsp;&nbsp;rgba(255, 255, 255, 0.2)&nbsp;&nbsp;&nbsp;← Right edge (white highlight)<br />
                )
              </div>
            </div>

            {/* Detailed Gradient */}
            <div>
              <div className="text-sm text-gray-300 font-medium mb-2">Detailed Style:</div>
              <div className="h-16 rounded" style={{
                background: 'linear-gradient(90deg, rgba(250, 182, 23, 0.7), rgba(250, 182, 23, 1), rgba(255, 215, 0, 0.9))',
                border: '2px solid rgba(250, 182, 23, 0.4)'
              }} />
              <div className="mt-2 text-xs font-mono text-gray-400">
                linear-gradient(90deg, <br />
                &nbsp;&nbsp;rgba(250, 182, 23, 0.7),&nbsp;&nbsp;← Left edge (70% opacity)<br />
                &nbsp;&nbsp;rgba(250, 182, 23, 1),&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;← Center (100% opacity)<br />
                &nbsp;&nbsp;rgba(255, 215, 0, 0.9)&nbsp;&nbsp;&nbsp;&nbsp;← Right edge (gold accent)<br />
                )
              </div>
            </div>
          </div>
        </div>

        {/* Dimensions */}
        <div className="mb-12 mek-card-industrial mek-border-sharp-gold p-8">
          <h2 className="text-2xl font-bold text-yellow-400 mek-text-industrial mb-6">
            Size Dimensions
          </h2>

          <div className="space-y-6">
            {/* Small */}
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="text-sm font-bold text-yellow-400 w-20">SMALL</div>
                <div className="flex-1 h-8 bg-gradient-to-r from-yellow-400/80 to-yellow-400 rounded border border-yellow-500/30" />
              </div>
              <div className="text-xs text-gray-400 ml-24">
                Container: h-8 (2rem) | Bar: h-5 (1.25rem) | Text: text-xs | Button: px-3 py-1
              </div>
            </div>

            {/* Medium */}
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="text-sm font-bold text-yellow-400 w-20">MEDIUM</div>
                <div className="flex-1 h-12 bg-gradient-to-r from-yellow-400/80 to-yellow-400 rounded border border-yellow-500/30" />
              </div>
              <div className="text-xs text-gray-400 ml-24">
                Container: h-12 (3rem) | Bar: h-7 (1.75rem) | Text: text-sm | Button: px-6 py-2
              </div>
            </div>

            {/* Large */}
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="text-sm font-bold text-yellow-400 w-20">LARGE</div>
                <div className="flex-1 h-16 bg-gradient-to-r from-yellow-400/80 to-yellow-400 rounded border border-yellow-500/30" />
              </div>
              <div className="text-xs text-gray-400 ml-24">
                Container: h-16 (4rem) | Bar: h-9 (2.25rem) | Text: text-base | Button: px-8 py-3
              </div>
            </div>
          </div>
        </div>

        {/* Animation Timings */}
        <div className="mb-12 mek-card-industrial mek-border-sharp-gold p-8">
          <h2 className="text-2xl font-bold text-yellow-400 mek-text-industrial mb-6">
            Animation Specifications
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <div className="text-yellow-400 font-bold mb-3 uppercase tracking-wider">Fill Animation</div>
              <ul className="space-y-2 text-gray-300">
                <li className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-mono text-yellow-400">700ms</span>
                </li>
                <li className="flex justify-between">
                  <span>Easing:</span>
                  <span className="font-mono text-yellow-400">ease-out</span>
                </li>
                <li className="flex justify-between">
                  <span>Property:</span>
                  <span className="font-mono text-yellow-400">width</span>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-yellow-400 font-bold mb-3 uppercase tracking-wider">Shimmer Effect</div>
              <ul className="space-y-2 text-gray-300">
                <li className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-mono text-yellow-400">2-3s</span>
                </li>
                <li className="flex justify-between">
                  <span>Easing:</span>
                  <span className="font-mono text-yellow-400">linear</span>
                </li>
                <li className="flex justify-between">
                  <span>Loop:</span>
                  <span className="font-mono text-yellow-400">infinite</span>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-yellow-400 font-bold mb-3 uppercase tracking-wider">Scan Line</div>
              <ul className="space-y-2 text-gray-300">
                <li className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-mono text-yellow-400">3s</span>
                </li>
                <li className="flex justify-between">
                  <span>Easing:</span>
                  <span className="font-mono text-yellow-400">linear</span>
                </li>
                <li className="flex justify-between">
                  <span>Style:</span>
                  <span className="font-mono text-yellow-400">detailed only</span>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-yellow-400 font-bold mb-3 uppercase tracking-wider">Particle Sweep</div>
              <ul className="space-y-2 text-gray-300">
                <li className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-mono text-yellow-400">2-3s</span>
                </li>
                <li className="flex justify-between">
                  <span>Trigger:</span>
                  <span className="font-mono text-yellow-400">100% complete</span>
                </li>
                <li className="flex justify-between">
                  <span>Style:</span>
                  <span className="font-mono text-yellow-400">all variants</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Visual Effects */}
        <div className="mb-12 mek-card-industrial mek-border-sharp-gold p-8">
          <h2 className="text-2xl font-bold text-yellow-400 mek-text-industrial mb-6">
            Visual Effects Reference
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Backdrop Blur */}
            <div>
              <div className="text-sm font-bold text-yellow-400 mb-3">Backdrop Blur (Glass Morphism)</div>
              <div className="h-32 relative overflow-hidden rounded">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/60 backdrop-blur-sm border border-yellow-500/30 p-4 rounded">
                    <div className="text-yellow-400 font-mono text-xs">backdrop-blur-sm</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shadow Glow */}
            <div>
              <div className="text-sm font-bold text-yellow-400 mb-3">Shadow Glow (Complete State)</div>
              <div className="h-32 bg-black/80 rounded flex items-center justify-center">
                <div
                  className="w-3/4 h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded"
                  style={{
                    boxShadow: '0 0 20px rgba(250, 182, 23, 0.8)'
                  }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-2 font-mono">
                box-shadow: 0 0 20px rgba(250, 182, 23, 0.8)
              </div>
            </div>

            {/* Hazard Stripes */}
            <div>
              <div className="text-sm font-bold text-yellow-400 mb-3">Hazard Stripes (Detailed Style)</div>
              <div
                className="h-32 rounded border border-yellow-500/30"
                style={{
                  background: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(250, 182, 23, 0.1) 10px,
                    rgba(250, 182, 23, 0.1) 20px
                  )`
                }}
              />
            </div>

            {/* Metal Scratches */}
            <div>
              <div className="text-sm font-bold text-yellow-400 mb-3">Metal Scratches (Detailed Style)</div>
              <div className="h-32 relative rounded bg-gray-800 border border-yellow-500/30 overflow-hidden">
                <div className="mek-overlay-scratches" />
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="mek-card-industrial mek-border-sharp-gold p-8">
          <h2 className="text-2xl font-bold text-yellow-400 mek-text-industrial mb-6">
            Typography Specifications
          </h2>

          <div className="space-y-6">
            {/* Label */}
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                TENURE PROGRESS
              </div>
              <div className="text-xs text-gray-500 mt-2 font-mono">
                text-xs | text-gray-400 | uppercase | tracking-wider | font-medium
              </div>
            </div>

            {/* Value */}
            <div>
              <div className="text-2xl font-bold text-yellow-400 mek-text-industrial">
                850 / 1000
              </div>
              <div className="text-xs text-gray-500 mt-2 font-mono">
                text-2xl | font-bold | text-yellow-400 | mek-text-industrial (Orbitron)
              </div>
            </div>

            {/* Percentage */}
            <div>
              <div className="text-lg font-bold tracking-wider text-yellow-400">
                85.0%
              </div>
              <div className="text-xs text-gray-500 mt-2 font-mono">
                text-lg | font-bold | tracking-wider | text-yellow-400
              </div>
            </div>

            {/* Button */}
            <div>
              <div className="inline-block px-6 py-2 text-sm font-bold uppercase tracking-wider text-black bg-yellow-400">
                LEVEL UP
              </div>
              <div className="text-xs text-gray-500 mt-2 font-mono">
                text-sm | font-bold | uppercase | tracking-wider | text-black | bg-yellow-400
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
