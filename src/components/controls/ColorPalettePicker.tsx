import React, { useState } from 'react';

interface ColorOption {
  color: string;
  name: string;
}

interface ColorPalettePickerProps {
  colors: ColorOption[];
  onSelect?: (color: string, name: string) => void;
  onCopy?: (color: string) => void;
}

const ColorPalettePicker: React.FC<ColorPalettePickerProps> = ({
  colors,
  onSelect,
  onCopy
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const getScale = (index: number): number => {
    if (hoveredIndex === null) return 1;
    const distance = Math.abs(index - hoveredIndex);
    if (distance === 0) return 1.5;
    if (distance === 1) return 1.3;
    if (distance === 2) return 1.15;
    return 1;
  };

  const getZIndex = (index: number): number => {
    if (hoveredIndex === null) return 1;
    const distance = Math.abs(index - hoveredIndex);
    if (distance === 0) return 99999;
    if (distance === 1) return 9999;
    if (distance === 2) return 999;
    return 1;
  };

  const handleClick = async (color: string, name: string, index: number) => {
    onSelect?.(color, name);

    // Copy to clipboard
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
      className="flex"
      style={{
        transformStyle: 'preserve-3d',
        transform: 'perspective(1000px)',
      }}
    >
      {colors.map((item, index) => {
        const scale = getScale(index);
        const zIndex = getZIndex(index);
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
              zIndex,
              transition: '500ms cubic-bezier(0.175, 0.885, 0.32, 1.1)',
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => handleClick(item.color, item.name, index)}
            aria-label={item.name}
          >
            {/* Color swatch */}
            <span
              className="absolute inset-0 rounded-md pointer-events-none"
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: item.color,
                borderRadius: '6px',
                transform: isHovered ? 'scale(1.1)' : 'scale(1.2)',
                transition: '500ms cubic-bezier(0.175, 0.885, 0.32, 1.1)',
              }}
            />

            {/* Tooltip */}
            <span
              className="absolute pointer-events-none whitespace-nowrap"
              style={{
                left: '65%',
                bottom: '52px',
                fontSize: '8px',
                lineHeight: '12px',
                transform: 'translateX(-50%)',
                padding: '2px 0.25rem',
                backgroundColor: '#ffffff',
                color: '#000000',
                borderRadius: '6px',
                opacity: isHovered ? 1 : 0,
                visibility: isHovered ? 'visible' : 'hidden',
                transition: '500ms cubic-bezier(0.175, 0.885, 0.32, 1.1)',
                fontWeight: 600,
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

export default ColorPalettePicker;
