import React, { useState, useRef, useEffect } from 'react';

interface ColorOption {
  color: string;
  name: string;
}

interface ColorPalettePickerSmoothProps {
  colors: ColorOption[];
  onSelect?: (color: string, name: string) => void;
  onCopy?: (color: string) => void;
}

const ColorPalettePickerSmooth: React.FC<ColorPalettePickerSmoothProps> = ({
  colors,
  onSelect,
  onCopy
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  // Track z-indices separately with delayed reset
  const [zIndices, setZIndices] = useState<number[]>(colors.map(() => 1));
  const timeoutRefs = useRef<(NodeJS.Timeout | null)[]>(colors.map(() => null));

  const getScale = (index: number): number => {
    if (hoveredIndex === null) return 1;
    const distance = Math.abs(index - hoveredIndex);
    if (distance === 0) return 1.4;
    if (distance === 1) return 1.2;
    if (distance === 2) return 1.1;
    return 1;
  };

  const getTargetZIndex = (index: number): number => {
    if (hoveredIndex === null) return 1;
    const distance = Math.abs(index - hoveredIndex);
    if (distance === 0) return 100;
    if (distance === 1) return 50;
    if (distance === 2) return 25;
    return 1;
  };

  // Update z-indices with delayed reset for smooth transitions
  useEffect(() => {
    const newZIndices = [...zIndices];

    colors.forEach((_, index) => {
      const targetZ = getTargetZIndex(index);

      // Clear any pending timeout for this index
      if (timeoutRefs.current[index]) {
        clearTimeout(timeoutRefs.current[index]!);
        timeoutRefs.current[index] = null;
      }

      if (targetZ > newZIndices[index]) {
        // Increasing z-index: apply immediately
        newZIndices[index] = targetZ;
      } else if (targetZ < newZIndices[index]) {
        // Decreasing z-index: delay to let scale animation complete first
        timeoutRefs.current[index] = setTimeout(() => {
          setZIndices(prev => {
            const updated = [...prev];
            updated[index] = targetZ;
            return updated;
          });
        }, 300); // Delay z-index decrease
      }
    });

    setZIndices(newZIndices);

    return () => {
      timeoutRefs.current.forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [hoveredIndex]);

  const handleClick = async (color: string, name: string, index: number) => {
    onSelect?.(color, name);

    try {
      await navigator.clipboard.writeText(color);
      setCopiedIndex(index);
      onCopy?.(color);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div
      className="flex items-end"
      style={{
        transformStyle: 'preserve-3d',
        transform: 'perspective(1000px)',
        padding: '20px 10px',
      }}
    >
      {colors.map((item, index) => {
        const scale = getScale(index);
        const isHovered = hoveredIndex === index;
        const isCopied = copiedIndex === index;

        return (
          <button
            key={index}
            className="relative flex-shrink-0 border-none outline-none cursor-pointer"
            style={{
              width: '32px',
              height: '40px',
              transform: `scale(${scale})`,
              zIndex: zIndices[index],
              transition: 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => handleClick(item.color, item.name, index)}
            aria-label={item.name}
          >
            {/* Color swatch */}
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: item.color,
                borderRadius: '6px',
                transform: 'scale(1.15)',
                boxShadow: isHovered
                  ? `0 8px 20px ${item.color}60, 0 0 0 2px white`
                  : `0 2px 8px rgba(0,0,0,0.3)`,
                transition: 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 300ms ease',
              }}
            />

            {/* Tooltip */}
            <span
              className="absolute pointer-events-none whitespace-nowrap"
              style={{
                left: '50%',
                bottom: '55px',
                fontSize: '10px',
                lineHeight: '14px',
                transform: `translateX(-50%) translateY(${isHovered ? '0' : '5px'})`,
                padding: '4px 8px',
                backgroundColor: '#ffffff',
                color: '#000000',
                borderRadius: '6px',
                opacity: isHovered ? 1 : 0,
                visibility: isHovered ? 'visible' : 'hidden',
                transition: 'all 300ms ease',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              {isCopied ? 'Copied!' : item.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ColorPalettePickerSmooth;
