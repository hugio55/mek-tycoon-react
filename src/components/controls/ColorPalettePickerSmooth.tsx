import React, { useState } from 'react';

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
        padding: '50px 10px 10px 10px',
      }}
    >
      {colors.map((item, index) => {
        const isHovered = hoveredIndex === index;
        const isCopied = copiedIndex === index;

        return (
          <button
            key={index}
            className="relative flex-shrink-0 border-none outline-none cursor-pointer"
            style={{
              width: '32px',
              height: '40px',
              // Only the hovered card moves - slides up and scales
              transform: isHovered ? 'translateY(-30px) scale(1.35)' : 'translateY(0) scale(1)',
              zIndex: isHovered ? 100 : 1,
              transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), z-index 0ms',
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
                  ? `0 12px 28px ${item.color}60, 0 8px 16px rgba(0,0,0,0.4), 0 0 0 2px white`
                  : `0 2px 6px rgba(0,0,0,0.25)`,
                transition: 'box-shadow 300ms ease',
              }}
            />

            {/* Tooltip */}
            <span
              className="absolute pointer-events-none whitespace-nowrap"
              style={{
                left: '50%',
                bottom: '58px',
                fontSize: '10px',
                lineHeight: '14px',
                transform: `translateX(-50%)`,
                padding: '4px 8px',
                backgroundColor: '#ffffff',
                color: '#000000',
                borderRadius: '6px',
                opacity: isHovered ? 1 : 0,
                visibility: isHovered ? 'visible' : 'hidden',
                transition: 'opacity 200ms ease',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
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
