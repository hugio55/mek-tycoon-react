'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MechanicalToggle from '@/components/controls/MechanicalToggle';
import ProModeToggle from '@/components/controls/ProModeToggle';
import ColorToggleSwitch from '@/components/controls/ColorToggleSwitch';
import DottedToggleSwitch from '@/components/controls/DottedToggleSwitch';
import RadialSwitch from '@/components/RadialSwitch';

export default function ComponentsShowcasePage() {
  const router = useRouter();
  const [mechanicalSmall, setMechanicalSmall] = useState(false);
  const [mechanicalMedium, setMechanicalMedium] = useState(false);
  const [mechanicalLarge, setMechanicalLarge] = useState(true);
  const [proMode, setProMode] = useState(false);
  const [colorToggle, setColorToggle] = useState(false);
  const [dottedToggle, setDottedToggle] = useState(false);
  const [radialSwitch, setRadialSwitch] = useState(0);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-50" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 35px,
                rgba(250, 182, 23, 0.03) 35px,
                rgba(250, 182, 23, 0.03) 70px
              )
            `,
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Component Showcase
            </span>
          </h1>
          <p className="text-gray-400 text-lg">Interactive UI components for Mek Tycoon</p>
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.push('/admin')}
          className="mb-8 px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-yellow-400 rounded-lg transition-all text-gray-400 hover:text-white group"
        >
          <span className="mr-2 group-hover:-translate-x-1 inline-block transition-transform">←</span>
          Back to Admin
        </button>

        {/* Mechanical Toggle Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-yellow-400">Mechanical Toggle Switch</h2>
          <div className="mek-card-industrial mek-border-sharp-gold p-8 rounded-xl">
            <p className="text-gray-400 mb-8">
              Premium mechanical toggle with red knob rotation, metallic handle bar, and base color transition.
              Features industrial design with gold borders and smooth animations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* Small */}
              <div className="flex flex-col items-center space-y-4">
                <h3 className="text-xl font-semibold text-gray-300">Small</h3>
                <MechanicalToggle
                  checked={mechanicalSmall}
                  onChange={setMechanicalSmall}
                  label="Small Size"
                  size="small"
                />
                <div className="text-sm text-gray-400">
                  State: <span className={mechanicalSmall ? 'text-green-400' : 'text-red-400'}>
                    {mechanicalSmall ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>

              {/* Medium */}
              <div className="flex flex-col items-center space-y-4">
                <h3 className="text-xl font-semibold text-gray-300">Medium (Default)</h3>
                <MechanicalToggle
                  checked={mechanicalMedium}
                  onChange={setMechanicalMedium}
                  label="Medium Size"
                  size="medium"
                />
                <div className="text-sm text-gray-400">
                  State: <span className={mechanicalMedium ? 'text-green-400' : 'text-red-400'}>
                    {mechanicalMedium ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>

              {/* Large */}
              <div className="flex flex-col items-center space-y-4">
                <h3 className="text-xl font-semibold text-gray-300">Large</h3>
                <MechanicalToggle
                  checked={mechanicalLarge}
                  onChange={setMechanicalLarge}
                  label="Large Size"
                  size="large"
                />
                <div className="text-sm text-gray-400">
                  State: <span className={mechanicalLarge ? 'text-green-400' : 'text-red-400'}>
                    {mechanicalLarge ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="mt-8 pt-8 border-t border-gray-700">
              <h4 className="text-lg font-semibold mb-4 text-yellow-400">Key Features:</h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-400">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Red knob with radial gradient
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Rotation animation (-25° to +25°)
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Metallic handle bar with gradient
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Base color transition (gray to green)
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Industrial gold borders
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Keyboard accessible (Enter/Space)
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Hover effects with pulse animation
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Scalable with em-based sizing
                </li>
              </ul>
            </div>

            {/* Code Example */}
            <div className="mt-8 pt-8 border-t border-gray-700">
              <h4 className="text-lg font-semibold mb-4 text-yellow-400">Usage Example:</h4>
              <div className="bg-black/60 p-4 rounded-lg border border-gray-700 font-mono text-sm text-gray-300">
                <pre>{`<MechanicalToggle
  checked={isEnabled}
  onChange={setIsEnabled}
  label="Power"
  size="medium"
/>`}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Radial Switch Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-yellow-400">Radial Switch</h2>
          <div className="mek-card-industrial mek-border-sharp-gold p-8 rounded-xl">
            <p className="text-gray-400 mb-8">
              Circular rotating switch with gradient effects and smooth rotation animations.
              Features a rotating handle that moves in an arc pattern.
            </p>

            <div className="flex justify-center mb-8">
              <RadialSwitch
                options={['off', 'on']}
                defaultIndex={radialSwitch}
                onChange={(index) => setRadialSwitch(index)}
              />
            </div>

            <div className="text-center text-sm mb-8">
              State: <span className={radialSwitch === 1 ? 'text-green-400' : 'text-red-400'}>
                {radialSwitch === 1 ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* Features List */}
            <div className="mt-8 pt-8 border-t border-gray-700">
              <h4 className="text-lg font-semibold mb-4 text-yellow-400">Key Features:</h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-400">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Circular design with rotating handle
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Radial and conic gradient effects
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Smooth rotation animations
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Gold accent on selected state
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Multiple option support
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Keyboard accessible
                </li>
              </ul>
            </div>

            {/* Code Example */}
            <div className="mt-8 pt-8 border-t border-gray-700">
              <h4 className="text-lg font-semibold mb-4 text-yellow-400">Usage Example:</h4>
              <div className="bg-black/60 p-4 rounded-lg border border-gray-700 font-mono text-sm text-gray-300">
                <pre>{`<RadialSwitch
  options={['off', 'on']}
  defaultIndex={0}
  onChange={(index, value) => console.log(value)}
/>`}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Other Toggle Components */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-yellow-400">Other Toggle Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pro Mode Toggle */}
            <div className="mek-card-industrial mek-border-sharp-gold p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-6 text-center text-gray-300">Pro Mode Toggle</h3>
              <div className="flex justify-center mb-4">
                <ProModeToggle
                  enabled={proMode}
                  onChange={setProMode}
                  label="Pro Mode"
                />
              </div>
              <p className="text-sm text-gray-400 text-center">
                Safety guard with hexagonal lever
              </p>
              <div className="mt-4 text-center text-sm">
                State: <span className={proMode ? 'text-green-400' : 'text-red-400'}>
                  {proMode ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Color Toggle */}
            <div className="mek-card-industrial mek-border-sharp-gold p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-6 text-center text-gray-300">Color Toggle</h3>
              <div className="flex justify-center mb-4">
                <ColorToggleSwitch
                  checked={colorToggle}
                  onChange={setColorToggle}
                />
              </div>
              <p className="text-sm text-gray-400 text-center">
                Colorful gradient toggle switch
              </p>
              <div className="mt-4 text-center text-sm">
                State: <span className={colorToggle ? 'text-green-400' : 'text-red-400'}>
                  {colorToggle ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Dotted Toggle */}
            <div className="mek-card-industrial mek-border-sharp-gold p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-6 text-center text-gray-300">Dotted Toggle</h3>
              <div className="flex justify-center mb-4">
                <DottedToggleSwitch
                  checked={dottedToggle}
                  onChange={setDottedToggle}
                />
              </div>
              <p className="text-sm text-gray-400 text-center">
                Minimalist dotted border design
              </p>
              <div className="mt-4 text-center text-sm">
                State: <span className={dottedToggle ? 'text-green-400' : 'text-red-400'}>
                  {dottedToggle ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Component Info */}
        <div className="mek-card-industrial mek-border-sharp-gold p-8 rounded-xl">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">Component Information</h2>
          <div className="space-y-4 text-gray-400">
            <p>
              <strong className="text-white">Location:</strong> All toggle components are in{' '}
              <code className="text-yellow-400 bg-black/50 px-2 py-1 rounded">/src/components/controls/</code>
            </p>
            <p>
              <strong className="text-white">Styling:</strong> MechanicalToggle uses a companion CSS file for complex
              gradients and animations. Other components use inline styles and Tailwind classes.
            </p>
            <p>
              <strong className="text-white">Accessibility:</strong> All components support keyboard navigation
              (Enter/Space keys), ARIA attributes, and focus indicators.
            </p>
            <p>
              <strong className="text-white">Design System:</strong> Components follow the Mek Tycoon industrial
              design system with gold borders, sharp edges, and grunge overlays.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
