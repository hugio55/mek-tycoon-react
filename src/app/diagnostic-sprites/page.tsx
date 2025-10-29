"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function DiagnosticSpritesPage() {
  const diagnosticData = useQuery(api.diagnosticSpritePositions.diagnosticSpritePositions);

  if (!diagnosticData) {
    return <div className="p-8 text-white">Loading diagnostic data...</div>;
  }

  if ('error' in diagnosticData) {
    return <div className="p-8 text-red-400">Error: {diagnosticData.error}</div>;
  }

  return (
    <div className="p-8 text-white bg-black min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-yellow-400">Sprite Positioning Diagnostic</h1>

      <div className="mb-8 p-4 bg-gray-900 rounded border border-gray-700">
        <h2 className="text-xl font-bold mb-2">Overlay Dimensions</h2>
        <p>Width: {diagnosticData.overlayDimensions.width}px</p>
        <p>Height: {diagnosticData.overlayDimensions.height}px</p>
        <p>Total Sprites: {diagnosticData.totalSprites}</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Heads */}
        <div className="p-4 bg-green-900/20 rounded border border-green-700">
          <h2 className="text-xl font-bold mb-4 text-green-400">HEADS (Working ✓)</h2>
          {diagnosticData.heads.stats && (
            <>
              <div className="mb-4">
                <p className="font-bold">Statistics:</p>
                <p>Count: {diagnosticData.heads.stats.count}</p>
                <p>Avg Position: ({diagnosticData.heads.stats.avgX}, {diagnosticData.heads.stats.avgY})</p>
                <p>Avg Scale: {diagnosticData.heads.stats.avgScale}</p>
                <p>X Range: {diagnosticData.heads.stats.xRange}</p>
                <p>Y Range: {diagnosticData.heads.stats.yRange}</p>
              </div>
              <div>
                <p className="font-bold mb-2">Samples:</p>
                {diagnosticData.heads.samples.map((s: any, i: number) => (
                  <div key={i} className="text-xs mb-2 p-2 bg-black/30 rounded">
                    <p className="text-yellow-400">{s.name}</p>
                    <p>Position: ({s.x}, {s.y})</p>
                    <p>Scale: {s.scale}</p>
                    <p>Dimensions: {s.imageWidth}×{s.imageHeight}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bodies */}
        <div className="p-4 bg-green-900/20 rounded border border-green-700">
          <h2 className="text-xl font-bold mb-4 text-green-400">BODIES (Working ✓)</h2>
          {diagnosticData.bodies.stats && (
            <>
              <div className="mb-4">
                <p className="font-bold">Statistics:</p>
                <p>Count: {diagnosticData.bodies.stats.count}</p>
                <p>Avg Position: ({diagnosticData.bodies.stats.avgX}, {diagnosticData.bodies.stats.avgY})</p>
                <p>Avg Scale: {diagnosticData.bodies.stats.avgScale}</p>
                <p>X Range: {diagnosticData.bodies.stats.xRange}</p>
                <p>Y Range: {diagnosticData.bodies.stats.yRange}</p>
              </div>
              <div>
                <p className="font-bold mb-2">Samples:</p>
                {diagnosticData.bodies.samples.map((s: any, i: number) => (
                  <div key={i} className="text-xs mb-2 p-2 bg-black/30 rounded">
                    <p className="text-yellow-400">{s.name}</p>
                    <p>Position: ({s.x}, {s.y})</p>
                    <p>Scale: {s.scale}</p>
                    <p>Dimensions: {s.imageWidth}×{s.imageHeight}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Traits */}
        <div className="p-4 bg-red-900/20 rounded border border-red-700">
          <h2 className="text-xl font-bold mb-4 text-red-400">TRAITS (Broken ✗)</h2>
          {diagnosticData.traits.stats && (
            <>
              <div className="mb-4">
                <p className="font-bold">Statistics:</p>
                <p>Count: {diagnosticData.traits.stats.count}</p>
                <p>Avg Position: ({diagnosticData.traits.stats.avgX}, {diagnosticData.traits.stats.avgY})</p>
                <p>Avg Scale: {diagnosticData.traits.stats.avgScale}</p>
                <p>X Range: {diagnosticData.traits.stats.xRange}</p>
                <p>Y Range: {diagnosticData.traits.stats.yRange}</p>
              </div>
              <div>
                <p className="font-bold mb-2">Samples:</p>
                {diagnosticData.traits.samples.map((s: any, i: number) => (
                  <div key={i} className="text-xs mb-2 p-2 bg-black/30 rounded">
                    <p className="text-yellow-400">{s.name}</p>
                    <p>Position: ({s.x}, {s.y})</p>
                    <p>Scale: {s.scale}</p>
                    <p>Dimensions: {s.imageWidth}×{s.imageHeight}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
