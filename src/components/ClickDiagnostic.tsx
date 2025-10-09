'use client';

import { useEffect, useState } from 'react';

export default function ClickDiagnostic() {
  const [clicks, setClicks] = useState<Array<{ x: number; y: number; target: string; time: number }>>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('[ClickDiagnostic] Component mounted');

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const click = {
        x: e.clientX,
        y: e.clientY,
        target: target.tagName + (target.className ? `.${target.className.split(' ')[0]}` : ''),
        time: Date.now()
      };
      console.log('[ClickDiagnostic] Click detected:', click);
      setClicks(prev => [...prev.slice(-4), click]);
    };

    document.addEventListener('click', handleClick, true); // Use capture phase
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-red-900/95 border-2 border-red-500 rounded-lg p-4 shadow-xl max-w-md">
      <h3 className="text-red-300 font-bold mb-2">🔍 Click Diagnostic</h3>
      <div className="text-xs text-gray-300 space-y-1">
        {clicks.length === 0 ? (
          <p>No clicks detected yet...</p>
        ) : (
          clicks.map((click, i) => (
            <div key={i} className="border-b border-red-500/30 pb-1">
              <div>Target: {click.target}</div>
              <div>Position: ({click.x}, {click.y})</div>
            </div>
          ))
        )}
      </div>
      <div className="mt-2 text-[10px] text-gray-400">
        If you see clicks here, React is working. If not, there's a blocking overlay.
      </div>
    </div>
  );
}
