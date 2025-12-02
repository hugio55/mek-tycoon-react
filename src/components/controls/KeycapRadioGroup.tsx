import React, { useState } from 'react';

interface KeycapOption {
  value: string;
  label: string;
}

interface KeycapRadioGroupProps {
  options: KeycapOption[];
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  accentColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: { width: 45, height: 52, containerHeight: 62, fontSize: 10, padding: '5px 4px', gap: 4, backHeight: 10, bottomHeight: 3 },
  md: { width: 58, height: 66, containerHeight: 78, fontSize: 12, padding: '6px 5px', gap: 5, backHeight: 12, bottomHeight: 3 },
  lg: { width: 70, height: 80, containerHeight: 94, fontSize: 15, padding: '8px 6px', gap: 6, backHeight: 14, bottomHeight: 4 },
};

const KeycapRadioGroup: React.FC<KeycapRadioGroupProps> = ({
  options,
  value: controlledValue,
  onChange,
  name = 'keycap-radio',
  accentColor = '#258ac3',
  size = 'lg'
}) => {
  const [internalValue, setInternalValue] = useState(options[0]?.value || '');
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const selectedValue = controlledValue !== undefined ? controlledValue : internalValue;
  const config = sizeConfig[size];

  const handleChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  return (
    <div
      className="flex items-center bg-black rounded-lg overflow-hidden"
      style={{
        height: `${config.containerHeight}px`,
        padding: `${config.gap}px`,
        gap: `${config.gap}px`
      }}
    >
      {options.map((option) => {
        const isChecked = selectedValue === option.value;
        const isHovered = hoveredKey === option.value && !isChecked;

        return (
          <label
            key={option.value}
            className="relative flex flex-col items-center justify-between cursor-pointer"
            onMouseEnter={() => setHoveredKey(option.value)}
            onMouseLeave={() => setHoveredKey(null)}
            style={{
              width: `${config.width}px`,
              height: `${config.height}px`,
              backgroundColor: isHovered ? '#333333' : '#2a2a2a',
              borderRadius: isChecked ? '0 0 4px 4px' : '4px',
              padding: config.padding,
              borderTop: isChecked ? `1px solid ${accentColor}62` : '1px solid #383838',
              transition: 'all 0.1s linear',
              transform: isChecked
                ? 'perspective(200px) rotateX(-18deg)'
                : isHovered
                  ? 'translateY(-2px)'
                  : 'none',
              transformOrigin: '50% 40%',
              boxShadow: isChecked
                ? 'inset 0px -20px 15px 0px rgba(0, 0, 0, 0.5)'
                : isHovered
                  ? `0 4px 8px rgba(0,0,0,0.4), 0 0 12px ${accentColor}30`
                  : 'none',
              marginTop: isChecked ? '6px' : '0',
              zIndex: 2,
            }}
          >
            {/* Back side (visible when pressed) */}
            <div
              className="absolute left-0 rounded-t"
              style={{
                top: `-${Math.round(config.backHeight * 0.7)}px`,
                backgroundColor: '#2a2a2a',
                borderRadius: '4px 4px 2px 2px',
                width: '100%',
                height: `${config.backHeight}px`,
                boxShadow: `inset 0 5px 3px 1px rgba(0, 0, 0, 0.5), inset 0px -5px 2px 0px ${accentColor}1a`,
                transform: 'perspective(300px) rotateX(50deg)',
                zIndex: 1,
                opacity: isChecked ? 1 : 0,
                transition: 'all 0.1s linear',
              }}
            />

            {/* Hidden radio input */}
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isChecked}
              onChange={() => handleChange(option.value)}
              className="hidden"
            />

            {/* Text label */}
            <span
              className="font-extrabold uppercase text-center"
              style={{
                fontSize: `${config.fontSize}px`,
                lineHeight: `${Math.round(config.fontSize * 0.8)}px`,
                color: isChecked ? accentColor : isHovered ? '#555555' : 'black',
                textShadow: isChecked
                  ? `0px 0px 8px ${accentColor}, 1px 1px 2px rgb(0, 0, 0)`
                  : isHovered
                    ? `0px 0px 4px ${accentColor}40`
                    : '-1px -1px 1px rgba(224, 224, 224, 0.1)',
                transition: 'all 0.1s linear',
              }}
            >
              {option.label}
            </span>

            {/* Bottom indicator line */}
            <div
              className="w-full rounded-full"
              style={{
                height: `${config.bottomHeight}px`,
                backgroundColor: isChecked ? '#1a1a1a' : isHovered ? '#333333' : '#2a2a2a',
                boxShadow: isHovered ? `0 0 6px ${accentColor}30` : '0 0 3px 0px rgb(19, 19, 19)',
                borderTop: isChecked ? `1px solid ${accentColor}40` : '1px solid #383838',
                transition: 'all 0.1s linear',
              }}
            />
          </label>
        );
      })}
    </div>
  );
};

export default KeycapRadioGroup;
