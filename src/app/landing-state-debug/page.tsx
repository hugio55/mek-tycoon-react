'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type ProgressionState =
  | 'WAITING_FOR_LOADER'
  | 'WAITING_FOR_CONSENT'
  | 'CONSENT_CLOSING'
  | 'MAIN_CONTENT'
  | 'CONTENT_COMPLETE'

export default function LandingStateDebugPage() {
  const router = useRouter()
  const [currentState, setCurrentState] = useState<ProgressionState>('WAITING_FOR_LOADER')
  const [eventLog, setEventLog] = useState<Array<{ time: string; event: string; state: ProgressionState }>>([])
  const [hasAudioConsent, setHasAudioConsent] = useState(false)

  useEffect(() => {
    // Check if user has audio consent in localStorage
    const consent = localStorage.getItem('mek-audio-consent')
    setHasAudioConsent(!!consent)
  }, [])

  const logEvent = (event: string, newState: ProgressionState) => {
    const time = new Date().toLocaleTimeString()
    setEventLog(prev => [...prev, { time, event, state: newState }])
    setCurrentState(newState)
  }

  const states: Array<{
    id: ProgressionState
    name: string
    description: string
    triggers: string
    visibleElements: string[]
  }> = [
    {
      id: 'WAITING_FOR_LOADER',
      name: 'State 1: Waiting for Loader',
      description: 'Universal loader is running (triangles + percentage)',
      triggers: 'Loader reaches 100% → WAITING_FOR_CONSENT (after 500ms delay)',
      visibleElements: ['Universal loader triangles', 'Percentage counter', 'Black background']
    },
    {
      id: 'WAITING_FOR_CONSENT',
      name: 'State 2: Waiting for Consent',
      description: 'Audio consent lightbox visible over dimmed background',
      triggers: 'User clicks Yes/No → CONSENT_CLOSING',
      visibleElements: ['Background image (60% opacity)', 'Audio consent lightbox', 'Yes/No buttons']
    },
    {
      id: 'CONSENT_CLOSING',
      name: 'State 3: Consent Closing',
      description: 'User made choice, lightbox fading out (500ms transition)',
      triggers: 'After 500ms fade → MAIN_CONTENT',
      visibleElements: ['Background image (60% opacity)', 'Fading audio consent lightbox']
    },
    {
      id: 'MAIN_CONTENT',
      name: 'State 4: Main Content',
      description: 'Logo + stars fading in, background goes full brightness',
      triggers: 'Logo video starts playing → CONTENT_COMPLETE',
      visibleElements: ['Background image (100% opacity)', 'WebGL stars (fading in)', 'Logo video (fading in)', 'Speaker icon']
    },
    {
      id: 'CONTENT_COMPLETE',
      name: 'State 5: Content Complete',
      description: 'Logo video loaded, phase cards now visible',
      triggers: 'Final state - stays here',
      visibleElements: ['Background image (100%)', 'WebGL stars (visible)', 'Logo video (visible)', 'Phase cards (appearing)', 'Speaker icon', 'Footer']
    }
  ]

  const getStateIndex = (state: ProgressionState) => {
    return states.findIndex(s => s.id === state)
  }

  const currentStateIndex = getStateIndex(currentState)

  return (
    <div className="min-h-screen bg-black text-yellow-400 p-8">
      {/* Header */}
      <div className="mb-8 border-b-2 border-yellow-500/30 pb-4">
        <h1 className="text-3xl font-bold mb-2">Landing Page State Machine Debug</h1>
        <p className="text-gray-400 text-sm">
          Visual representation of the landing page progression system
        </p>
        <button
          onClick={() => router.push('/landing')}
          className="mt-4 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 hover:bg-yellow-500/30 transition-colors"
        >
          ← Back to Landing Page
        </button>
      </div>

      {/* Current State Indicator */}
      <div className="mb-8 p-6 bg-yellow-500/10 border-2 border-yellow-500">
        <div className="text-sm text-gray-400 mb-2">CURRENT STATE</div>
        <div className="text-2xl font-bold">{states[currentStateIndex].name}</div>
        <div className="text-gray-300 mt-2">{states[currentStateIndex].description}</div>
        {hasAudioConsent && currentState === 'WAITING_FOR_LOADER' && (
          <div className="mt-3 text-sm text-green-400">
            ℹ️ Return visitor detected - will skip consent and go directly to MAIN_CONTENT
          </div>
        )}
      </div>

      {/* State Flow Diagram */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">State Flow Diagram</h2>
        <div className="space-y-3">
          {states.map((state, index) => {
            const isCurrent = currentState === state.id
            const isPast = currentStateIndex > index
            const isFuture = currentStateIndex < index

            return (
              <div key={state.id} className="relative">
                {/* State Box */}
                <div
                  className={`p-4 border-2 transition-all ${
                    isCurrent
                      ? 'bg-yellow-500/20 border-yellow-500 scale-105'
                      : isPast
                      ? 'bg-green-500/10 border-green-500/50 opacity-60'
                      : 'bg-gray-800/30 border-gray-600/50 opacity-40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-bold text-lg mb-1">{state.name}</div>
                      <div className="text-sm text-gray-400 mb-2">{state.description}</div>
                      <div className="text-xs text-gray-500 mb-3">
                        <span className="text-yellow-500/70">Trigger:</span> {state.triggers}
                      </div>

                      {/* Visible Elements */}
                      <div className="text-xs">
                        <div className="text-gray-500 mb-1">Visible Elements:</div>
                        <div className="flex flex-wrap gap-2">
                          {state.visibleElements.map((element, i) => (
                            <span
                              key={i}
                              className={`px-2 py-1 rounded ${
                                isCurrent
                                  ? 'bg-yellow-500/20 text-yellow-300'
                                  : isPast
                                  ? 'bg-green-500/20 text-green-300'
                                  : 'bg-gray-700/50 text-gray-500'
                              }`}
                            >
                              {element}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="ml-4">
                      {isCurrent && (
                        <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse" />
                      )}
                      {isPast && (
                        <div className="w-4 h-4 bg-green-500 rounded-full" />
                      )}
                      {isFuture && (
                        <div className="w-4 h-4 bg-gray-600 rounded-full" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Arrow to Next State */}
                {index < states.length - 1 && (
                  <div className="flex justify-center py-2">
                    <div className={`text-2xl ${isPast ? 'text-green-500' : 'text-gray-600'}`}>
                      ↓
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Real-Time Landing Page Controls */}
      <div className="mb-8 p-6 bg-blue-900/20 border-2 border-blue-500">
        <h2 className="text-xl font-bold mb-4">🎮 Real-Time Landing Page Control</h2>
        <div className="text-sm text-gray-400 mb-4">
          Open /landing in another tab and control its state from here in real-time
        </div>

        {/* Open Landing Page Button */}
        <div className="mb-4">
          <button
            onClick={() => window.open('/landing', '_blank')}
            className="px-4 py-2 bg-green-500/20 border-2 border-green-500/50 hover:bg-green-500/30 transition-colors font-bold"
          >
            🚀 Open Landing Page in New Tab
          </button>
          <div className="text-xs text-gray-500 mt-2">
            Tip: Arrange windows side-by-side to see changes instantly
          </div>
        </div>

        {/* State Control Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {states.map(state => (
            <button
              key={state.id}
              onClick={() => {
                // Send command to landing page via localStorage
                localStorage.setItem(
                  'mek-debug-trigger',
                  JSON.stringify({ action: 'set-state', state: state.id })
                );
                logEvent(`Sent command to landing page: ${state.name}`, state.id);

                // Also trigger storage event manually for same-tab testing
                window.dispatchEvent(
                  new StorageEvent('storage', {
                    key: 'mek-debug-trigger',
                    newValue: JSON.stringify({ action: 'set-state', state: state.id }),
                  })
                );
              }}
              className="px-3 py-2 text-sm border transition-colors bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30 hover:border-blue-500"
            >
              {state.name.replace('State ', '')}
            </button>
          ))}
        </div>

        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-200">
          <div className="font-bold mb-1">💡 How it works:</div>
          <ul className="list-disc list-inside space-y-1">
            <li>Click a state button above</li>
            <li>Landing page receives command via localStorage event</li>
            <li>Landing page instantly jumps to that state</li>
            <li>Watch the visual changes in real-time!</li>
          </ul>
        </div>
      </div>

      {/* Manual State Controls (Local to Debug Page) */}
      <div className="mb-8 p-6 bg-gray-900/50 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">📊 Local State Tracker</h2>
        <div className="text-sm text-gray-400 mb-4">
          Track state transitions locally (for reference only, does not affect landing page)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {states.map(state => (
            <button
              key={state.id}
              onClick={() => logEvent(`Local tracking: ${state.name}`, state.id)}
              className={`px-3 py-2 text-sm border transition-colors ${
                currentState === state.id
                  ? 'bg-yellow-500/30 border-yellow-500 cursor-not-allowed'
                  : 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-yellow-500/50'
              }`}
              disabled={currentState === state.id}
            >
              {state.name.replace('State ', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Common User Flows */}
      <div className="mb-8 p-6 bg-blue-900/20 border border-blue-500/30">
        <h2 className="text-xl font-bold mb-4">Common User Flows</h2>
        <div className="space-y-3">
          <div className="p-3 bg-black/30 border border-gray-700">
            <div className="font-bold text-sm mb-1">First-Time Visitor</div>
            <div className="text-xs text-gray-400 mb-2">
              WAITING_FOR_LOADER → WAITING_FOR_CONSENT → CONSENT_CLOSING → MAIN_CONTENT → CONTENT_COMPLETE
            </div>
            <button
              onClick={() => {
                setEventLog([])
                logEvent('🟡 Simulating first-time visitor flow', 'WAITING_FOR_LOADER')
                setTimeout(() => logEvent('✅ Loader reached 100% (500ms delay)', 'WAITING_FOR_CONSENT'), 1500)
                setTimeout(() => logEvent('👆 User clicked YES on audio consent', 'CONSENT_CLOSING'), 3000)
                setTimeout(() => logEvent('⏱️ 500ms fade completed', 'MAIN_CONTENT'), 3500)
                setTimeout(() => logEvent('🎬 Logo video started playing', 'CONTENT_COMPLETE'), 5000)
              }}
              className="px-3 py-1 text-xs bg-blue-500/20 border border-blue-500/50 hover:bg-blue-500/30"
            >
              Simulate Flow
            </button>
          </div>

          <div className="p-3 bg-black/30 border border-gray-700">
            <div className="font-bold text-sm mb-1">Return Visitor (Has Consent)</div>
            <div className="text-xs text-gray-400 mb-2">
              WAITING_FOR_LOADER → WAITING_FOR_CONSENT → MAIN_CONTENT (skips consent) → CONTENT_COMPLETE
            </div>
            <button
              onClick={() => {
                setEventLog([])
                logEvent('🟡 Simulating return visitor flow', 'WAITING_FOR_LOADER')
                setTimeout(() => logEvent('✅ Loader reached 100% (500ms delay)', 'WAITING_FOR_CONSENT'), 1500)
                setTimeout(() => logEvent('🔙 Found audio consent in localStorage - SKIPPING lightbox', 'MAIN_CONTENT'), 2000)
                setTimeout(() => logEvent('🎬 Logo video started playing', 'CONTENT_COMPLETE'), 3500)
              }}
              className="px-3 py-1 text-xs bg-blue-500/20 border border-blue-500/50 hover:bg-blue-500/30"
            >
              Simulate Flow
            </button>
          </div>

          <div className="p-3 bg-black/30 border border-gray-700">
            <div className="font-bold text-sm mb-1">Browser Back/Forward Issue (OLD BUG)</div>
            <div className="text-xs text-gray-400 mb-2">
              Audio consent appears over visible content - should be detected and corrected
            </div>
            <button
              onClick={() => {
                setEventLog([])
                logEvent('🚨 INVALID STATE: Audio consent showing but in CONTENT_COMPLETE state', 'CONTENT_COMPLETE')
                setTimeout(() => logEvent('🛡️ State validation detected invalid combination', 'CONTENT_COMPLETE'), 500)
                setTimeout(() => logEvent('🔧 Correcting state: CONTENT_COMPLETE → WAITING_FOR_CONSENT', 'WAITING_FOR_CONSENT'), 1000)
              }}
              className="px-3 py-1 text-xs bg-red-500/20 border border-red-500/50 hover:bg-red-500/30"
            >
              Trigger Bug Scenario
            </button>
          </div>
        </div>
      </div>

      {/* Event Log */}
      <div className="p-6 bg-gray-900/50 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Event Log</h2>
          <button
            onClick={() => setEventLog([])}
            className="px-3 py-1 text-xs bg-red-500/20 border border-red-500/50 hover:bg-red-500/30"
          >
            Clear Log
          </button>
        </div>

        {eventLog.length === 0 ? (
          <div className="text-gray-500 text-sm">No events logged yet</div>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
            {eventLog.map((log, i) => (
              <div key={i} className="flex gap-3 text-gray-400">
                <span className="text-gray-600">{log.time}</span>
                <span className="text-yellow-400">[{log.state}]</span>
                <span>{log.event}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Technical Details */}
      <div className="mt-8 p-6 bg-gray-900/30 border border-gray-700/50">
        <h2 className="text-xl font-bold mb-4">Technical Implementation Details</h2>
        <div className="space-y-4 text-sm">
          <div>
            <div className="text-yellow-400 font-bold mb-1">State Machine Type:</div>
            <div className="text-gray-400 font-mono text-xs bg-black/50 p-2 border border-gray-800">
              type ProgressionState = 'WAITING_FOR_LOADER' | 'WAITING_FOR_CONSENT' | 'CONSENT_CLOSING' | 'MAIN_CONTENT' | 'CONTENT_COMPLETE'
            </div>
          </div>

          <div>
            <div className="text-yellow-400 font-bold mb-1">Key Features:</div>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Single source of truth for progression state</li>
              <li>Explicit state transitions with logging</li>
              <li>Return visitor detection (checks localStorage for audio consent)</li>
              <li>Browser navigation validation (detects invalid state combinations)</li>
              <li>Debug triggers support (localStorage + postMessage)</li>
              <li>Legacy compatibility (animationStage synced with progressionState)</li>
            </ul>
          </div>

          <div>
            <div className="text-yellow-400 font-bold mb-1">Fixes Applied:</div>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>✅ Star blanket appearing after loader (background opacity now state-controlled)</li>
              <li>✅ Phase cards flashing early (only appear in CONTENT_COMPLETE state)</li>
              <li>✅ Audio lightbox appearing over content (state validation detects and corrects)</li>
              <li>✅ Browser back/forward causing invalid states (validation hook enforces consistency)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
