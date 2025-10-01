'use client';

import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  fps: number;
  memoryUsed: number;
  memoryLimit: number;
  domNodes: number;
  mekCount: number;
  scrollPerformance: number;
}

export default function PerformanceMonitor({ mekCount = 0 }: { mekCount?: number }) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    fps: 60,
    memoryUsed: 0,
    memoryLimit: 0,
    domNodes: 0,
    mekCount,
    scrollPerformance: 100
  });
  const [isVisible, setIsVisible] = useState(true);

  // Monitor FPS
  useEffect(() => {
    // Check if performance API is available
    if (typeof window === 'undefined' || !window.performance || !window.performance.now) {
      return;
    }

    let frameCount = 0;
    let lastTime = window.performance.now();
    let rafId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = window.performance.now();

      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;

        setMetrics(prev => ({ ...prev, fps }));
      }

      rafId = requestAnimationFrame(measureFPS);
    };

    rafId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Monitor DOM nodes and memory
  useEffect(() => {
    const measurePerformance = () => {
      // Count DOM nodes
      const domNodes = document.getElementsByTagName('*').length;

      // Memory usage (if available)
      const perf = (performance as any);
      let memoryUsed = 0;
      let memoryLimit = 0;

      if (perf.memory) {
        memoryUsed = Math.round(perf.memory.usedJSHeapSize / 1048576); // Convert to MB
        memoryLimit = Math.round(perf.memory.jsHeapSizeLimit / 1048576);
      }

      // Measure render time
      const renderStart = window.performance?.now() || Date.now();
      requestAnimationFrame(() => {
        const renderTime = (window.performance?.now() || Date.now()) - renderStart;

        setMetrics(prev => ({
          ...prev,
          domNodes,
          memoryUsed,
          memoryLimit,
          renderTime: Math.round(renderTime * 100) / 100,
          mekCount
        }));
      });
    };

    // Initial measurement
    measurePerformance();

    // Measure every 2 seconds
    const interval = setInterval(measurePerformance, 2000);
    return () => clearInterval(interval);
  }, [mekCount]);

  // Monitor scroll performance
  useEffect(() => {
    // Check if performance API is available
    if (typeof window === 'undefined' || !window.performance || !window.performance.now) {
      return;
    }

    let scrollFrames = 0;
    let isScrolling = false;
    let scrollStart = 0;

    const handleScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
        scrollStart = window.performance.now();
        scrollFrames = 0;
      }

      scrollFrames++;

      // Debounce scroll end detection
      clearTimeout((window as any).scrollTimeout);
      (window as any).scrollTimeout = setTimeout(() => {
        const scrollTime = window.performance.now() - scrollStart;
        const expectedFrames = (scrollTime / 1000) * 60; // Expected at 60 FPS
        const scrollPerformance = Math.min(100, Math.round((scrollFrames / expectedFrames) * 100));

        setMetrics(prev => ({ ...prev, scrollPerformance }));
        isScrolling = false;
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Performance assessment
  const getPerformanceLevel = () => {
    if (metrics.fps >= 55 && metrics.scrollPerformance >= 90) return { level: 'Excellent', color: 'text-green-400' };
    if (metrics.fps >= 45 && metrics.scrollPerformance >= 75) return { level: 'Good', color: 'text-yellow-400' };
    if (metrics.fps >= 30 && metrics.scrollPerformance >= 60) return { level: 'Fair', color: 'text-orange-400' };
    return { level: 'Poor', color: 'text-red-400' };
  };

  const performance = getPerformanceLevel();

  // Recommendations based on metrics
  const getRecommendation = () => {
    if (metrics.domNodes > 5000) return 'High DOM node count - consider pagination';
    if (metrics.memoryUsed > 200) return 'High memory usage - consider lazy loading';
    if (metrics.fps < 30) return 'Low FPS - reduce animations or Mek count';
    if (metrics.scrollPerformance < 60) return 'Scroll lag detected - optimize rendering';
    if (mekCount > 50 && metrics.fps < 50) return 'Consider pagination for better performance';
    return 'Performance is optimal';
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-50 bg-black/80 backdrop-blur-sm border border-white/20 px-3 py-1 rounded text-xs text-white/60 hover:text-white/80 transition-colors"
      >
        Show Performance
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg p-3 w-64 font-mono text-xs">
      {/* Header */}
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/10">
        <h3 className="text-white/80 font-bold">Performance Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white/40 hover:text-white/60"
        >
          ✕
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <span className="text-white/60">Status:</span>
          <span className={`font-bold ${performance.color}`}>{performance.level}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-white/60">FPS:</span>
          <span className={metrics.fps < 30 ? 'text-red-400' : metrics.fps < 50 ? 'text-yellow-400' : 'text-green-400'}>
            {metrics.fps}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-white/60">Meks Loaded:</span>
          <span className={mekCount > 100 ? 'text-yellow-400' : 'text-white/80'}>{mekCount}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-white/60">DOM Nodes:</span>
          <span className={metrics.domNodes > 5000 ? 'text-yellow-400' : 'text-white/80'}>
            {metrics.domNodes.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-white/60">Memory:</span>
          <span className={metrics.memoryUsed > 200 ? 'text-yellow-400' : 'text-white/80'}>
            {metrics.memoryUsed}MB
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-white/60">Render Time:</span>
          <span className={metrics.renderTime > 16 ? 'text-yellow-400' : 'text-white/80'}>
            {metrics.renderTime}ms
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-white/60">Scroll Perf:</span>
          <span className={metrics.scrollPerformance < 60 ? 'text-red-400' : metrics.scrollPerformance < 80 ? 'text-yellow-400' : 'text-green-400'}>
            {metrics.scrollPerformance}%
          </span>
        </div>
      </div>

      {/* Recommendation */}
      <div className="mt-3 pt-2 border-t border-white/10">
        <div className="text-white/40 text-[10px]">Recommendation:</div>
        <div className="text-white/60 text-[11px] mt-0.5">{getRecommendation()}</div>
      </div>

      {/* Test Controls */}
      <div className="mt-3 pt-2 border-t border-white/10">
        <div className="text-white/40 text-[10px] mb-1">Performance Tests:</div>
        <div className="flex gap-1">
          <button
            onClick={() => {
              console.time('Render 50 Meks');
              window.dispatchEvent(new CustomEvent('loadMeks', { detail: { count: 50 } }));
              console.timeEnd('Render 50 Meks');
            }}
            className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[10px]"
          >
            50 Meks
          </button>
          <button
            onClick={() => {
              console.time('Render 100 Meks');
              window.dispatchEvent(new CustomEvent('loadMeks', { detail: { count: 100 } }));
              console.timeEnd('Render 100 Meks');
            }}
            className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[10px]"
          >
            100 Meks
          </button>
          <button
            onClick={() => {
              console.time('Render 200 Meks');
              window.dispatchEvent(new CustomEvent('loadMeks', { detail: { count: 200 } }));
              console.timeEnd('Render 200 Meks');
            }}
            className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[10px]"
          >
            200 Meks
          </button>
        </div>
      </div>
    </div>
  );
}