"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function DiagnosticCoordsPage() {
  const data = useQuery(api.diagnosticTriangleCoords.analyzeTriangleCoordinates);

  if (!data) {
    return <div className="p-8 text-white">Loading diagnostic data...</div>;
  }

  if ('error' in data) {
    return <div className="p-8 text-red-500">{data.error}</div>;
  }

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <h1 className="text-3xl font-bold text-yellow-400 mb-6">
        Triangle Sprite Coordinate Analysis
      </h1>

      <div className="bg-gray-900 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">Overlay Found</h2>
        <p><strong>Key:</strong> {data.overlayKey}</p>
        <p><strong>Path:</strong> {data.imagePath}</p>
        <p><strong>Width:</strong> {data.imageWidth}px</p>
        <p><strong>Height:</strong> {data.imageHeight}px</p>
        <p><strong>Total Sprites:</strong> {data.totalSprites}</p>
      </div>

      {[data.heads, data.bodies, data.traits].map((section) => (
        <div key={section.label} className="bg-gray-900 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">
            {section.label} ({section.count} sprites)
          </h2>

          {section.count > 0 && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-green-400 mb-2">X Coordinates</h3>
                  <p>Min: {section.x.min.toFixed(2)}</p>
                  <p>Max: {section.x.max.toFixed(2)}</p>
                  <p>Avg: {section.x.avg.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-2">Y Coordinates</h3>
                  <p>Min: {section.y.min.toFixed(2)}</p>
                  <p>Max: {section.y.max.toFixed(2)}</p>
                  <p>Avg: {section.y.avg.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-purple-400 mb-2">Scale</h3>
                  <p>Min: {section.scale.min.toFixed(2)}</p>
                  <p>Max: {section.scale.max.toFixed(2)}</p>
                  <p>Avg: {section.scale.avg.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Sample Sprites</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left p-2">Name</th>
                      <th className="text-right p-2">X</th>
                      <th className="text-right p-2">Y</th>
                      <th className="text-right p-2">Scale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.samples.map((sample: any, i: number) => (
                      <tr key={i} className="border-b border-gray-800">
                        <td className="p-2">{sample.name}</td>
                        <td className="text-right p-2">{sample.x.toFixed(2)}</td>
                        <td className="text-right p-2">{sample.y.toFixed(2)}</td>
                        <td className="text-right p-2">{sample.scale.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ))}

      <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
        <h3 className="text-lg font-bold text-yellow-400 mb-2">What to Look For:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Do traits have similar X/Y ranges as heads/bodies?</li>
          <li>Is there a consistent offset (e.g., traits all shifted by +100px)?</li>
          <li>Are scale values significantly different between types?</li>
          <li>Do the coordinate ranges match the expected triangle sections?</li>
        </ul>
      </div>
    </div>
  );
}
