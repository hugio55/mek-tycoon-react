'use client';

import { useState } from 'react';
import GeneratingLoader from '@/components/loaders/GeneratingLoader';

type ColorScheme = {
  name: string;
  primary: string;
  secondary: string;
  tertiary: string;
  accent: string;
};

const COLOR_SCHEMES: ColorScheme[] = [
  {
    name: 'Light Cyan',
    primary: '#00d9ff',
    secondary: '#0284c7',
    tertiary: '#38bdf8',
    accent: '#7dd3fc'
  },
  {
    name: 'Ocean Blue',
    primary: '#3b82f6',
    secondary: '#1e40af',
    tertiary: '#60a5fa',
    accent: '#93c5fd'
  },
  {
    name: 'Teal',
    primary: '#06b6d4',
    secondary: '#14b8a6',
    tertiary: '#22d3ee',
    accent: '#5eead4'
  },
  {
    name: 'Ice Blue',
    primary: '#7dd3fc',
    secondary: '#38bdf8',
    tertiary: '#0ea5e9',
    accent: '#bae6fd'
  },
  {
    name: 'Deep Blue',
    primary: '#2563eb',
    secondary: '#1e3a8a',
    tertiary: '#3b82f6',
    accent: '#60a5fa'
  }
];

export default function MaintenancePage() {
  const [selectedScheme, setSelectedScheme] = useState<ColorScheme>(COLOR_SCHEMES[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Debug Color Selector */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="bg-black/80 border border-gray-600 text-gray-300 px-3 py-2 rounded text-xs hover:bg-black/90 transition-colors"
        >
          Color Scheme ▼
        </button>
        {isDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 bg-black/95 border border-gray-600 rounded shadow-xl min-w-[180px]">
            {COLOR_SCHEMES.map((scheme, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedScheme(scheme);
                  setIsDropdownOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-xs hover:bg-cyan-500/20 transition-colors ${
                  selectedScheme.name === scheme.name ? 'bg-cyan-500/30 text-cyan-300' : 'text-gray-300'
                }`}
              >
                {scheme.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content floating against background */}
      <div className="text-center space-y-8">
        {/* Generating Loader - 2x scale */}
        <div className="flex items-center justify-center" style={{ transform: 'scale(2)' }}>
          <GeneratingLoader
            text="Mek Tycoon is being built"
            colorScheme={selectedScheme}
          />
        </div>
      </div>
    </div>
  );
}
