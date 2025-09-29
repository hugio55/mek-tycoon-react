'use client';

import React, { useState } from 'react';
import {
  StoryModeTitleCard,
  HolographicTitle,
  CircuitBoardTitle,
  GlitchTitle,
  NeonCyberpunkTitle,
  MilitaryHUDTitle,
  SpaceStationTitle,
  MatrixDataTitle,
  IndustrialWarningTitle
} from '@/components/StoryModeTitleCards';
import '@/styles/story-title-cards.css';

export default function StoryTitleDemo() {
  const [chapter, setChapter] = useState('CHAPTER 1');
  const [showIndividual, setShowIndividual] = useState(false);

  const chapters = [
    'CHAPTER 1',
    'CHAPTER 2',
    'CHAPTER 3',
    'PROLOGUE',
    'EPILOGUE',
    'ACT I',
    'ACT II',
    'FINALE'
  ];

  const titleCards = [
    { component: HolographicTitle, name: 'Holographic Projection' },
    { component: CircuitBoardTitle, name: 'Circuit Board Matrix' },
    { component: GlitchTitle, name: 'Glitch Distortion' },
    { component: NeonCyberpunkTitle, name: 'Neon Cyberpunk' },
    { component: MilitaryHUDTitle, name: 'Military HUD' },
    { component: SpaceStationTitle, name: 'Space Station Display' },
    { component: MatrixDataTitle, name: 'Matrix Data Stream' },
    { component: IndustrialWarningTitle, name: 'Industrial Warning System' },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Main interactive title card with style selector */}
      {!showIndividual && <StoryModeTitleCard chapter={chapter} />}

      {/* Controls */}
      <div className="fixed right-4 top-24 z-40 bg-black/80 backdrop-blur-sm border border-yellow-500/50 p-4 space-y-4">
        <div>
          <label className="text-yellow-400 text-xs font-orbitron uppercase tracking-wider block mb-2">
            Chapter Select
          </label>
          <select
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            className="bg-black/60 border border-yellow-500/30 text-gray-300 px-3 py-1 text-sm focus:outline-none focus:border-yellow-400"
          >
            {chapters.map(ch => (
              <option key={ch} value={ch}>{ch}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowIndividual(!showIndividual)}
          className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-400 px-3 py-1 text-xs font-orbitron uppercase tracking-wider transition-colors"
        >
          {showIndividual ? 'Show Selector' : 'View All Styles'}
        </button>
      </div>

      {/* Individual showcase mode */}
      {showIndividual && (
        <div className="space-y-24 pb-24">
          {titleCards.map((card, index) => (
            <div key={index}>
              {/* Style name label */}
              <div className="text-yellow-500/50 text-sm font-mono uppercase tracking-wider px-8 mb-2">
                {index + 1}. {card.name}
              </div>
              {/* Render the title card */}
              <card.component chapter={chapter} />
            </div>
          ))}
        </div>
      )}

      {/* Demo content area */}
      {!showIndividual && (
        <div className="pt-32 px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Sample content cards */}
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-900/50 border border-gray-700/50 p-6">
                  <h3 className="text-gray-400 font-orbitron uppercase tracking-wider mb-2">
                    Mission {i}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Sample content to demonstrate sticky header behavior when scrolling.
                  </p>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className="mt-12 p-6 bg-gray-900/30 border border-gray-800">
              <h2 className="text-yellow-400 font-orbitron uppercase tracking-wider mb-4">
                Title Card System Instructions
              </h2>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>• Use the style selector (left dropdown) to switch between 8 different sci-fi aesthetics</li>
                <li>• Chapter selector (right panel) allows you to change the displayed chapter</li>
                <li>• Click "View All Styles" to see all variations at once</li>
                <li>• The selected style is saved in localStorage and persists across sessions</li>
                <li>• Each design includes unique animations and visual effects</li>
                <li>• Scroll down to see the sticky header behavior</li>
              </ul>
            </div>

            {/* More content for scrolling */}
            <div className="mt-12 space-y-6">
              {[7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className="bg-gray-900/50 border border-gray-700/50 p-6">
                  <h3 className="text-gray-400 font-orbitron uppercase tracking-wider mb-2">
                    Extended Mission {i}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Additional content to test scrolling behavior with the sticky title card header.
                    The title should remain at the top of the viewport while this content scrolls beneath it.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}