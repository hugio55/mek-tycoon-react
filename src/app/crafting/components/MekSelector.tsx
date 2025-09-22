'use client';

import { useState } from 'react';
import { CraftedItem, UserMek } from '../types';
import { USER_MEKS } from '../constants';

interface MekSelectorProps {
  craftedItem: CraftedItem;
  onSelectMek: (mekId: string) => void;
  onClose: () => void;
}

type ThemeOption = 'high-contrast' | 'medium-contrast' | 'soft' | 'minimal';

const themes = {
  'high-contrast': {
    name: 'High Contrast (Original)',
    background: 'bg-black/90',
    cardBg: 'from-gray-900 to-gray-800',
    cardBorder: 'border-gray-600',
    cardHover: 'hover:border-yellow-400',
    slotInactive: 'border-gray-600 bg-gray-700',
    slotActive: 'border-green-400',
    buttonBg: 'bg-green-500 hover:bg-green-600',
    disabledBg: 'bg-gray-700',
    textPrimary: 'text-white',
    textSecondary: 'text-gray-400'
  },
  'medium-contrast': {
    name: 'Medium Contrast',
    background: 'bg-gray-900/85',
    cardBg: 'from-gray-800 to-gray-700',
    cardBorder: 'border-gray-500',
    cardHover: 'hover:border-yellow-500',
    slotInactive: 'border-gray-500 bg-gray-600',
    slotActive: 'border-green-400',
    buttonBg: 'bg-green-500 hover:bg-green-600',
    disabledBg: 'bg-gray-600',
    textPrimary: 'text-gray-100',
    textSecondary: 'text-gray-300'
  },
  'soft': {
    name: 'Soft',
    background: 'bg-gray-800/80',
    cardBg: 'from-gray-700 to-gray-600',
    cardBorder: 'border-gray-500',
    cardHover: 'hover:border-yellow-500',
    slotInactive: 'border-gray-500 bg-gray-600',
    slotActive: 'border-green-500',
    buttonBg: 'bg-green-600 hover:bg-green-700',
    disabledBg: 'bg-gray-600',
    textPrimary: 'text-gray-100',
    textSecondary: 'text-gray-300'
  },
  'minimal': {
    name: 'Minimal',
    background: 'bg-gray-700/75',
    cardBg: 'from-gray-600 to-gray-500',
    cardBorder: 'border-gray-400',
    cardHover: 'hover:border-yellow-600',
    slotInactive: 'border-gray-400 bg-gray-500',
    slotActive: 'border-green-500',
    buttonBg: 'bg-green-600 hover:bg-green-700',
    disabledBg: 'bg-gray-500',
    textPrimary: 'text-gray-50',
    textSecondary: 'text-gray-200'
  }
};

export default function MekSelector({ craftedItem, onSelectMek, onClose }: MekSelectorProps) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(() => {
    // Load saved theme preference from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mekSelectorTheme');
      if (saved && saved in themes) {
        return saved as ThemeOption;
      }
    }
    return 'high-contrast';
  });

  const theme = themes[selectedTheme];

  const handleThemeChange = (newTheme: ThemeOption) => {
    setSelectedTheme(newTheme);
    // Save theme preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('mekSelectorTheme', newTheme);
    }
  };

  return (
    <div className={`fixed inset-0 ${theme.background} backdrop-blur-sm z-50 overflow-y-auto`}>
      {/* Theme Selector - Floating at top, outside main content */}
      <div className="fixed top-4 left-4 z-[60]">
        <select
          value={selectedTheme}
          onChange={(e) => handleThemeChange(e.target.value as ThemeOption)}
          className="px-3 py-1.5 bg-gray-800/90 border border-gray-600 rounded text-sm text-gray-200 hover:bg-gray-700 focus:outline-none focus:border-yellow-500"
        >
          {Object.entries(themes).map(([key, value]) => (
            <option key={key} value={key}>{value.name}</option>
          ))}
        </select>
      </div>

      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-yellow-400">Select a Mek to Equip {craftedItem.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {USER_MEKS.map(mek => {
              const slotAvailable =
                (craftedItem.type === 'heads' && !mek.headFilled) ||
                (craftedItem.type === 'bodies' && !mek.bodyFilled) ||
                (craftedItem.type === 'traits' && !mek.traitFilled);

              return (
                <div
                  key={mek.id}
                  className={`relative bg-gradient-to-b ${theme.cardBg} rounded-xl border-2 ${theme.cardBorder} overflow-hidden transition-all ${theme.cardHover}`}
                  style={{
                    opacity: slotAvailable ? 1 : 0.7
                  }}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className={`text-xl font-bold ${theme.textPrimary}`}>{mek.name}</h3>
                      <div className={`text-xs ${theme.textSecondary}`}>ID: {mek.id}</div>
                    </div>

                    {/* Mek Image Placeholder */}
                    <div className={`w-full h-48 bg-gradient-to-br ${theme.cardBg} rounded-lg mb-4 flex items-center justify-center`}>
                      <span className="text-6xl">🤖</span>
                    </div>

                    {/* Equipment Slots */}
                    <div className="flex justify-around mb-4">
                      <div className="text-center">
                        <div className={`w-12 h-12 rounded-full border-2 ${mek.headFilled ? theme.slotInactive : theme.slotActive} flex items-center justify-center`}>
                          {mek.headFilled ? '📷' : '➕'}
                        </div>
                        <div className={`text-xs ${theme.textSecondary} mt-1`}>Head</div>
                      </div>
                      <div className="text-center">
                        <div className={`w-12 h-12 rounded-full border-2 ${mek.bodyFilled ? theme.slotInactive : theme.slotActive} flex items-center justify-center`}>
                          {mek.bodyFilled ? '🤖' : '➕'}
                        </div>
                        <div className={`text-xs ${theme.textSecondary} mt-1`}>Body</div>
                      </div>
                      <div className="text-center">
                        <div className={`w-12 h-12 rounded-full border-2 ${mek.traitFilled ? theme.slotInactive : theme.slotActive} flex items-center justify-center`}>
                          {mek.traitFilled ? '⚡' : '➕'}
                        </div>
                        <div className={`text-xs ${theme.textSecondary} mt-1`}>Trait</div>
                      </div>
                    </div>

                    {/* Action Button */}
                    {slotAvailable ? (
                      <button
                        onClick={() => onSelectMek(mek.id)}
                        className={`w-full px-4 py-3 ${theme.buttonBg} text-black font-bold rounded-lg transition-all hover:scale-105`}
                      >
                        SELECT
                      </button>
                    ) : (
                      <div className={`w-full px-4 py-3 ${theme.disabledBg} ${theme.textSecondary} text-center rounded-lg`}>
                        {craftedItem.type.slice(0, -1)} Slot Filled
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}