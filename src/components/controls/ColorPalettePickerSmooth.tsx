import React, { useState, useEffect } from 'react';

interface ColorOption {
  color: string;
  name: string;
}

interface ColorPalettePickerSmoothProps {
  colors: ColorOption[];
  onSelect?: (color: string, name: string) => void;
  onCopy?: (color: string) => void;
  showSlider?: boolean;
}

const ColorPalettePickerSmooth: React.FC<ColorPalettePickerSmoothProps> = ({
  colors,
  onSelect,
  onCopy,
  showSlider = true
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [sliderIndex, setSliderIndex] = useState<number>(0);
  const [isLifted, setIsLifted] = useState(false);
  const [isScaled, setIsScaled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile/touch device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(hover: none)').matches || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sequential animation: first lift, then scale
  useEffect(() => {
    if (hoveredIndex !== null) {
      // Start lift immediately
      setIsLifted(true);
      setIsScaled(false);
      // Scale after lift completes
      const scaleTimer = setTimeout(() => {
        setIsScaled(true);
      }, 150); // Wait for lift to complete
      return () => clearTimeout(scaleTimer);
    } else {
      // Reverse: scale down first, then drop
      setIsScaled(false);
      const dropTimer = setTimeout(() => {
        setIsLifted(false);
      }, 100);
      return () => clearTimeout(dropTimer);
    }
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

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(e.target.value);
    setSliderIndex(newIndex);
    setHoveredIndex(newIndex);
  };

  const handleSliderRelease = () => {
    // On release, trigger the click action for the selected color
    if (sliderIndex >= 0 && sliderIndex < colors.length) {
      handleClick(colors[sliderIndex].color, colors[sliderIndex].name, sliderIndex);
    }
  };

  // Active index is either hovered (desktop) or slider-selected (mobile)
  const activeIndex = hoveredIndex;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Color swatches */}
      <div
        className="flex items-end relative"
        style={{
          padding: '60px 15px 15px 15px',
        }}
      >
        {colors.map((item, index) => {
          const isActive = activeIndex === index;
          const isCopied = copiedIndex === index;

          // Calculate transform based on animation stage
          let transform = 'translateY(0) scale(1)';
          if (isActive && isLifted && isScaled) {
            transform = 'translateY(-35px) scale(1.4)';
          } else if (isActive && isLifted) {
            transform = 'translateY(-35px) scale(1)';
          }

          return (
            <div
              key={index}
              className="relative"
              style={{
                width: '40px',
                height: '50px',
              }}
              onMouseEnter={() => !isMobile && setHoveredIndex(index)}
              onMouseLeave={() => !isMobile && setHoveredIndex(null)}
            >
              {/* Invisible hover zone - larger and stable */}
              <div
                className="absolute cursor-pointer"
                style={{
                  top: '-10px',
                  left: '-4px',
                  width: '48px',
                  height: '70px',
                  zIndex: 10,
                }}
                onClick={() => handleClick(item.color, item.name, index)}
              />

              {/* Animated card container */}
              <div
                className="absolute bottom-0 left-0"
                style={{
                  width: '40px',
                  height: '46px',
                  transform,
                  zIndex: isActive ? 100 : 1,
                  transition: isActive
                    ? 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)'
                    : 'transform 150ms ease-out',
                  pointerEvents: 'none',
                }}
              >
                {/* Color swatch visual */}
                <div
                  style={{
                    width: '40px',
                    height: '46px',
                    backgroundColor: item.color,
                    borderRadius: '6px',
                    boxShadow: isActive
                      ? `0 14px 32px ${item.color}60, 0 8px 16px rgba(0,0,0,0.4), 0 0 0 2px white`
                      : `0 2px 6px rgba(0,0,0,0.25)`,
                    transition: 'box-shadow 200ms ease',
                  }}
                />

                {/* Tooltip */}
                <div
                  className="absolute pointer-events-none whitespace-nowrap"
                  style={{
                    left: '50%',
                    bottom: '54px',
                    fontSize: '10px',
                    lineHeight: '14px',
                    transform: 'translateX(-50%)',
                    padding: '4px 8px',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    borderRadius: '6px',
                    opacity: isActive && isScaled ? 1 : 0,
                    transition: 'opacity 150ms ease',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                >
                  {isCopied ? 'Copied!' : item.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile slider */}
      {showSlider && (
        <div className="w-full px-4 flex flex-col items-center gap-2">
          <input
            type="range"
            min={0}
            max={colors.length - 1}
            value={sliderIndex}
            onChange={handleSliderChange}
            onMouseUp={handleSliderRelease}
            onTouchEnd={handleSliderRelease}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${colors.map((c, i) =>
                `${c.color} ${(i / (colors.length - 1)) * 100}%`
              ).join(', ')})`,
              maxWidth: '280px',
            }}
          />
          <style>{`
            input[type="range"]::-webkit-slider-thumb {
              appearance: none;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: white;
              border: 3px solid ${colors[sliderIndex]?.color || '#fab617'};
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              cursor: pointer;
              transition: border-color 150ms ease;
            }
            input[type="range"]::-moz-range-thumb {
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: white;
              border: 3px solid ${colors[sliderIndex]?.color || '#fab617'};
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              cursor: pointer;
              transition: border-color 150ms ease;
            }
          `}</style>
          <span className="text-xs text-zinc-500">
            {colors[sliderIndex]?.name || ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default ColorPalettePickerSmooth;
