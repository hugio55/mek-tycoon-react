'use client';

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function PhaseILightboxTest() {
  const settings = useQuery(api.phaseILightbox.getPhaseILightboxSettings);
  const updateSettings = useMutation(api.phaseILightbox.updatePhaseILightboxSettings);
  const resetSettings = useMutation(api.phaseILightbox.resetPhaseILightboxSettings);

  if (settings === undefined) {
    return <div className="text-white p-4">Loading Phase I lightbox settings...</div>;
  }

  return (
    <div className="p-8 bg-black/50 text-white space-y-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-yellow-400 mb-6">Phase I Lightbox Settings Test</h2>

      <div className="space-y-3">
        <div className="border border-yellow-500/30 p-4 rounded">
          <h3 className="text-lg font-semibold mb-2">Content Text</h3>
          <p className="text-white/70">{settings.phaseILightboxContent}</p>
          <button
            onClick={() => updateSettings({
              phaseILightboxContent: "Updated content at " + new Date().toLocaleTimeString()
            })}
            className="mt-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded"
          >
            Update Content
          </button>
        </div>

        <div className="border border-yellow-500/30 p-4 rounded">
          <h3 className="text-lg font-semibold mb-2">Video Settings</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <label className="text-yellow-400">Scale:</label>
              <input
                type="number"
                step="0.1"
                value={settings.phaseIVideoScale}
                onChange={(e) => updateSettings({ phaseIVideoScale: parseFloat(e.target.value) })}
                className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1 mt-1"
              />
            </div>
            <div>
              <label className="text-yellow-400">Position X:</label>
              <input
                type="number"
                value={settings.phaseIVideoPositionX}
                onChange={(e) => updateSettings({ phaseIVideoPositionX: parseInt(e.target.value) })}
                className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1 mt-1"
              />
            </div>
            <div>
              <label className="text-yellow-400">Position Y:</label>
              <input
                type="number"
                value={settings.phaseIVideoPositionY}
                onChange={(e) => updateSettings({ phaseIVideoPositionY: parseInt(e.target.value) })}
                className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1 mt-1"
              />
            </div>
          </div>
        </div>

        <div className="border border-yellow-500/30 p-4 rounded">
          <h3 className="text-lg font-semibold mb-2">Backdrop Blur</h3>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="40"
              value={settings.phaseIBackdropBlur}
              onChange={(e) => updateSettings({ phaseIBackdropBlur: parseInt(e.target.value) })}
              className="flex-1"
            />
            <span className="text-yellow-400 w-12">{settings.phaseIBackdropBlur}px</span>
          </div>
        </div>

        <div className="border border-yellow-500/30 p-4 rounded">
          <h3 className="text-lg font-semibold mb-2">Typography</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <label className="text-yellow-400">Font:</label>
              <select
                value={settings.phaseITextFont}
                onChange={(e) => updateSettings({ phaseITextFont: e.target.value })}
                className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1 mt-1"
              >
                <option value="Arial">Arial</option>
                <option value="Orbitron">Orbitron</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
              </select>
            </div>
            <div>
              <label className="text-yellow-400">Font Size:</label>
              <input
                type="number"
                value={settings.phaseITextFontSize}
                onChange={(e) => updateSettings({ phaseITextFontSize: parseInt(e.target.value) })}
                className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1 mt-1"
              />
            </div>
            <div>
              <label className="text-yellow-400">Color:</label>
              <select
                value={settings.phaseITextColor}
                onChange={(e) => updateSettings({ phaseITextColor: e.target.value })}
                className="w-full bg-black/50 border border-yellow-500/30 rounded px-2 py-1 mt-1"
              >
                <option value="text-white/70">White 70%</option>
                <option value="text-white/90">White 90%</option>
                <option value="text-yellow-400/70">Yellow 70%</option>
                <option value="text-yellow-400/90">Yellow 90%</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={() => resetSettings()}
          className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded font-semibold"
        >
          Reset to Defaults
        </button>
      </div>

      <div className="mt-8 p-4 bg-black/70 border border-yellow-500/20 rounded">
        <h3 className="text-sm font-semibold text-yellow-400 mb-2">Current Settings JSON</h3>
        <pre className="text-xs text-white/50 overflow-auto">
          {JSON.stringify(settings, null, 2)}
        </pre>
      </div>
    </div>
  );
}
