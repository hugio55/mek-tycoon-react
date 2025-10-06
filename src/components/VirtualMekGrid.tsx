'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MekAsset } from './MekCard/types';

interface VirtualMekGridProps {
  meks: MekAsset[];
  renderMek: (mek: MekAsset, index: number) => React.ReactNode;
  className?: string;
}

export function VirtualMekGrid({ meks, renderMek, className }: VirtualMekGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: meks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 600,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className="w-full overflow-auto"
      style={{
        height: 'calc(100vh - 300px)',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderMek(meks[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
