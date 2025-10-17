'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';

export default function BlueprintBuilder() {
  const [selectedMek, setSelectedMek] = useState('aa1-ak1-bc2');
  const [cannyLow, setCannyLow] = useState(20);
  const [cannyMid, setCannyMid] = useState(40);
  const [cannyHigh, setCannyHigh] = useState(60);
  const [outputSize, setOutputSize] = useState(2000);
  const [lineThickness, setLineThickness] = useState(1);
  const [overshootAmount, setOvershootAmount] = useState(8);
  const [gridOpacity, setGridOpacity] = useState(15);
  const [smoothness, setSmoothness] = useState(3);
  const [curviness, setCurviness] = useState(5);
  const [sketchiness, setSketchiness] = useState(0);
  const [detailDensity, setDetailDensity] = useState(50);
  const [enableAnnotations, setEnableAnnotations] = useState(true);
  const [annotationStyle, setAnnotationStyle] = useState<'straight' | 'angled'>('angled');
  const [annotationFontSize, setAnnotationFontSize] = useState(24);
  const [labelMargin, setLabelMargin] = useState(150);

  // Simplified annotation positions - just quadrants
  const [headPosition, setHeadPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-right');
  const [bodyPosition, setBodyPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-left');
  const [itemPosition, setItemPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right');
  const [rankPosition, setRankPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-left');
  const [mekNumberPosition, setMekNumberPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right');

  const [processing, setProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const processBlueprint = useCallback(async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/generate-blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mekCode: selectedMek,
          cannyLow,
          cannyMid,
          cannyHigh,
          outputSize,
          lineThickness,
          overshootAmount,
          gridOpacity,
          smoothness,
          curviness,
          sketchiness,
          detailDensity,
          enableAnnotations,
          annotationStyle,
          annotationFontSize,
          labelMargin,
          headPosition,
          bodyPosition,
          itemPosition,
          rankPosition,
          mekNumberPosition,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        if (resultImage) {
          URL.revokeObjectURL(resultImage);
        }
        setResultImage(url);
      } else {
        console.error('Failed to generate blueprint');
      }
    } catch (error) {
      console.error('Error generating blueprint:', error);
    } finally {
      setProcessing(false);
    }
  }, [selectedMek, cannyLow, cannyMid, cannyHigh, outputSize, lineThickness, overshootAmount, gridOpacity, smoothness, curviness, sketchiness, detailDensity, enableAnnotations, annotationStyle, annotationFontSize, labelMargin, headPosition, bodyPosition, itemPosition, rankPosition, mekNumberPosition, resultImage]);

  // Real-time generation with debouncing
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      processBlueprint();
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [cannyLow, cannyMid, cannyHigh, lineThickness, overshootAmount, gridOpacity, smoothness, curviness, sketchiness, detailDensity, enableAnnotations, annotationStyle, annotationFontSize, labelMargin, headPosition, bodyPosition, itemPosition, rankPosition, mekNumberPosition, selectedMek, processBlueprint]);

  return (
    <div className="min-h-screen bg-black text-gray-200">
      {/* Header */}
      <div className="bg-gray-900 border-b border-yellow-500/30 p-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold text-yellow-500 font-orbitron uppercase tracking-wider">
            Blueprint Builder
          </h1>
          <div className="flex items-center gap-4">
            {processing && (
              <div className="text-yellow-500 text-sm">
                <span className="inline-block animate-pulse">● Generating...</span>
              </div>
            )}
            {!processing && resultImage && (
              <div className="text-green-500 text-sm">✓ Ready</div>
            )}
            {resultImage && (
              <a
                href={resultImage}
                download={`blueprint-${selectedMek}-${Date.now()}.png`}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-6 rounded transition-colors uppercase tracking-wider text-sm"
              >
                Download
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="bg-gray-900 border-b border-yellow-500/30 p-6">
        <div className="max-w-screen-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Basic Settings */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-yellow-500 uppercase tracking-wider border-b border-yellow-500/30 pb-2">
                Basic Settings
              </h2>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Mek Code</label>
                <input
                  type="text"
                  value={selectedMek}
                  onChange={(e) => setSelectedMek(e.target.value)}
                  className="w-full bg-black border border-gray-600 text-yellow-500 px-3 py-2 rounded focus:border-yellow-500 focus:outline-none text-sm"
                  placeholder="e.g., aa1-ak1-bc2"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Output Size: {outputSize}px
                </label>
                <select
                  value={outputSize}
                  onChange={(e) => setOutputSize(Number(e.target.value))}
                  className="w-full bg-black border border-gray-600 text-yellow-500 px-3 py-2 rounded focus:border-yellow-500 focus:outline-none text-sm"
                >
                  <option value="1000">1000px</option>
                  <option value="2000">2000px</option>
                  <option value="3000">3000px</option>
                  <option value="4000">4000px</option>
                </select>
              </div>
            </div>

            {/* Edge Detection */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-yellow-500 uppercase tracking-wider border-b border-yellow-500/30 pb-2">
                Edge Detection
              </h2>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Low: {cannyLow}
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={cannyLow}
                  onChange={(e) => setCannyLow(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Fine details</p>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Mid: {cannyMid}
                </label>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={cannyMid}
                  onChange={(e) => setCannyMid(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Medium details</p>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  High: {cannyHigh}
                </label>
                <input
                  type="range"
                  min="40"
                  max="200"
                  value={cannyHigh}
                  onChange={(e) => setCannyHigh(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Strong edges</p>
              </div>
            </div>

            {/* Artistic Style */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-yellow-500 uppercase tracking-wider border-b border-yellow-500/30 pb-2">
                Artistic Style
              </h2>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Smoothness: {smoothness}
                </label>
                <input
                  type="range"
                  min="0"
                  max="9"
                  value={smoothness}
                  onChange={(e) => setSmoothness(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Line anti-aliasing</p>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Curviness: {curviness}
                </label>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={curviness}
                  onChange={(e) => setCurviness(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Curve smoothing strength</p>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Sketchiness: {sketchiness}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={sketchiness}
                  onChange={(e) => setSketchiness(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Hand-drawn variation</p>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Detail Density: {detailDensity}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={detailDensity}
                  onChange={(e) => setDetailDensity(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Amount of fine detail</p>
              </div>
            </div>

            {/* Line Style */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-yellow-500 uppercase tracking-wider border-b border-yellow-500/30 pb-2">
                Line Style
              </h2>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Thickness: {lineThickness}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={lineThickness}
                  onChange={(e) => setLineThickness(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Line weight</p>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Overshoot: {overshootAmount}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={overshootAmount}
                  onChange={(e) => setOvershootAmount(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Architectural marks</p>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Grid: {gridOpacity}
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={gridOpacity}
                  onChange={(e) => setGridOpacity(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Background grid</p>
              </div>

              {/* Presets */}
              <div className="pt-2">
                <label className="block text-xs text-gray-400 mb-2">Quick Presets</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setCannyLow(20); setCannyMid(40); setCannyHigh(60);
                      setSmoothness(3); setCurviness(5); setSketchiness(0);
                      setLineThickness(1); setOvershootAmount(8);
                    }}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 px-2 rounded text-xs"
                  >
                    Balanced
                  </button>
                  <button
                    onClick={() => {
                      setCannyLow(10); setCannyMid(30); setCannyHigh(50);
                      setSmoothness(5); setCurviness(7); setSketchiness(0);
                      setLineThickness(1); setOvershootAmount(5);
                    }}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 px-2 rounded text-xs"
                  >
                    Detail
                  </button>
                  <button
                    onClick={() => {
                      setCannyLow(40); setCannyMid(80); setCannyHigh(120);
                      setSmoothness(1); setCurviness(3); setSketchiness(5);
                      setLineThickness(2); setOvershootAmount(12);
                    }}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 px-2 rounded text-xs"
                  >
                    Sketch
                  </button>
                  <button
                    onClick={() => {
                      setCannyLow(15); setCannyMid(35); setCannyHigh(60);
                      setSmoothness(7); setCurviness(10); setSketchiness(0);
                      setLineThickness(1); setOvershootAmount(15);
                    }}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 px-2 rounded text-xs"
                  >
                    Smooth
                  </button>
                </div>
              </div>
            </div>

            {/* Annotations */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-yellow-500 uppercase tracking-wider border-b border-yellow-500/30 pb-2">
                Annotations
              </h2>

              <div>
                <label className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <input
                    type="checkbox"
                    checked={enableAnnotations}
                    onChange={(e) => setEnableAnnotations(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Enable Labels
                </label>
                <p className="text-xs text-gray-500">Auto-place in margins</p>
              </div>

              {enableAnnotations && (
                <>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Line Style</label>
                    <select
                      value={annotationStyle}
                      onChange={(e) => setAnnotationStyle(e.target.value as 'straight' | 'angled')}
                      className="w-full bg-black border border-gray-600 text-yellow-500 px-3 py-2 rounded focus:border-yellow-500 focus:outline-none text-sm"
                    >
                      <option value="straight">Straight</option>
                      <option value="angled">Angled (Elbow)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Margin Distance: {labelMargin}px
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="300"
                      value={labelMargin}
                      onChange={(e) => setLabelMargin(Number(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">How far into black area</p>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Font Size: {annotationFontSize}
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="48"
                      value={annotationFontSize}
                      onChange={(e) => setAnnotationFontSize(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* HEAD Position */}
                  <div className="pt-2 border-t border-gray-700">
                    <div className="text-xs font-bold text-yellow-400 mb-2">HEAD Corner</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setHeadPosition('top-left')}
                        className={`py-2 px-2 rounded text-xs ${headPosition === 'top-left' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
                      >
                        ↖ Top Left
                      </button>
                      <button
                        onClick={() => setHeadPosition('top-right')}
                        className={`py-2 px-2 rounded text-xs ${headPosition === 'top-right' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
                      >
                        Top Right ↗
                      </button>
                      <button
                        onClick={() => setHeadPosition('bottom-left')}
                        className={`py-2 px-2 rounded text-xs ${headPosition === 'bottom-left' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
                      >
                        ↙ Bottom Left
                      </button>
                      <button
                        onClick={() => setHeadPosition('bottom-right')}
                        className={`py-2 px-2 rounded text-xs ${headPosition === 'bottom-right' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
                      >
                        Bottom Right ↘
                      </button>
                    </div>
                  </div>

                  {/* BODY Position */}
                  <div className="pt-2 border-t border-gray-700">
                    <div className="text-xs font-bold text-yellow-400 mb-2">BODY Corner</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setBodyPosition('top-left')}
                        className={`py-2 px-2 rounded text-xs ${bodyPosition === 'top-left' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
                      >
                        ↖ Top Left
                      </button>
                      <button
                        onClick={() => setBodyPosition('top-right')}
                        className={`py-2 px-2 rounded text-xs ${bodyPosition === 'top-right' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
                      >
                        Top Right ↗
                      </button>
                      <button
                        onClick={() => setBodyPosition('bottom-left')}
                        className={`py-2 px-2 rounded text-xs ${bodyPosition === 'bottom-left' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
                      >
                        ↙ Bottom Left
                      </button>
                      <button
                        onClick={() => setBodyPosition('bottom-right')}
                        className={`py-2 px-2 rounded text-xs ${bodyPosition === 'bottom-right' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
                      >
                        Bottom Right ↘
                      </button>
                    </div>
                  </div>

                  {/* ITEM Position */}
                  <div className="pt-2 border-t border-gray-700">
                    <div className="text-xs font-bold text-yellow-400 mb-2">ITEM Corner</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setItemPosition('top-left')}
                        className={`py-2 px-2 rounded text-xs ${itemPosition === 'top-left' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
                      >
                        ↖ Top Left
                      </button>
                      <button
                        onClick={() => setItemPosition('top-right')}
                        className={`py-2 px-2 rounded text-xs ${itemPosition === 'top-right' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
                      >
                        Top Right ↗
                      </button>
                      <button
                        onClick={() => setItemPosition('bottom-left')}
                        className={`py-2 px-2 rounded text-xs ${itemPosition === 'bottom-left' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
                      >
                        ↙ Bottom Left
                      </button>
                      <button
                        onClick={() => setItemPosition('bottom-right')}
                        className={`py-2 px-2 rounded text-xs ${itemPosition === 'bottom-right' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
                      >
                        Bottom Right ↘
                      </button>
                    </div>
                  </div>

                  {/* RANK Position */}
                  <div className="pt-2 border-t border-gray-700">
                    <div className="text-xs font-bold text-yellow-400 mb-2">RANK Corner</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setRankPosition('top-left')}
                        className={`py-2 px-2 rounded text-xs ${rankPosition === 'top-left' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
                      >
                        ↖ Top Left
                      </button>
                      <button
                        onClick={() => setRankPosition('top-right')}
                        className={`py-2 px-2 rounded text-xs ${rankPosition === 'top-right' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
                      >
                        Top Right ↗
                      </button>
                      <button
                        onClick={() => setRankPosition('bottom-left')}
                        className={`py-2 px-2 rounded text-xs ${rankPosition === 'bottom-left' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
                      >
                        ↙ Bottom Left
                      </button>
                      <button
                        onClick={() => setRankPosition('bottom-right')}
                        className={`py-2 px-2 rounded text-xs ${rankPosition === 'bottom-right' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
                      >
                        Bottom Right ↘
                      </button>
                    </div>
                  </div>

                  {/* MEK NUMBER Position */}
                  <div className="pt-2 border-t border-gray-700">
                    <div className="text-xs font-bold text-yellow-400 mb-2">MEK NUMBER Corner</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setMekNumberPosition('top-left')}
                        className={`py-2 px-2 rounded text-xs ${mekNumberPosition === 'top-left' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
                      >
                        ↖ Top Left
                      </button>
                      <button
                        onClick={() => setMekNumberPosition('top-right')}
                        className={`py-2 px-2 rounded text-xs ${mekNumberPosition === 'top-right' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
                      >
                        Top Right ↗
                      </button>
                      <button
                        onClick={() => setMekNumberPosition('bottom-left')}
                        className={`py-2 px-2 rounded text-xs ${mekNumberPosition === 'bottom-left' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
                      >
                        ↙ Bottom Left
                      </button>
                      <button
                        onClick={() => setMekNumberPosition('bottom-right')}
                        className={`py-2 px-2 rounded text-xs ${mekNumberPosition === 'bottom-right' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}`}
                      >
                        Bottom Right ↘
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Preview */}
      <div className="bg-black p-4">
        <div className="max-w-screen-2xl mx-auto">
          <div className="bg-gray-950 border border-yellow-500/30 rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 340px)' }}>
            <div className="w-full h-full flex items-center justify-center">
              {resultImage ? (
                <Image
                  src={resultImage}
                  alt="Generated blueprint"
                  width={outputSize}
                  height={outputSize}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-gray-600 text-center p-8">
                  <p className="text-lg mb-2">Generating initial preview...</p>
                  <p className="text-sm">Adjust parameters above to update in real-time</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
