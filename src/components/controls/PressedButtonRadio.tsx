import React, { useState } from 'react';

interface RadioOption {
  value: string;
  label: string;
}

interface PressedButtonRadioProps {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  glowColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: { width: 60, height: 40, fontSize: 10, padding: 3, gap: 2 },
  md: { width: 90, height: 60, fontSize: 15, padding: 4, gap: 2 },
  lg: { width: 120, height: 80, fontSize: 18, padding: 5, gap: 3 },
};

const PressedButtonRadio: React.FC<PressedButtonRadioProps> = ({
  options,
  value: controlledValue,
  onChange,
  name = 'pressed-radio',
  glowColor = '#cae2fd',
  size = 'md',
}) => {
  const [internalValue, setInternalValue] = useState(options[0]?.value || '');

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
      className="flex items-center"
      style={{
        gap: `${config.gap}px`,
        backgroundColor: 'black',
        padding: `${config.padding}px`,
        borderRadius: '10px',
      }}
    >
      {options.map((option, index) => {
        const isChecked = selectedValue === option.value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        return (
          <label
            key={option.value}
            className="relative flex flex-col items-center justify-center cursor-pointer"
            style={{
              width: config.width,
              height: config.height,
              background: isChecked
                ? 'linear-gradient(to bottom, #1d1d1d, #1d1d1d)'
                : 'linear-gradient(to bottom, #333333, rgb(36, 35, 35))',
              borderTop: isChecked ? 'none' : '1px solid #4e4d4d',
              borderTopLeftRadius: isFirst ? '6px' : 0,
              borderBottomLeftRadius: isFirst ? '6px' : 0,
              borderTopRightRadius: isLast ? '6px' : 0,
              borderBottomRightRadius: isLast ? '6px' : 0,
              boxShadow: isChecked
                ? '0px 17px 5px 1px rgba(0, 0, 0, 0)'
                : '0px 17px 5px 1px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.1s linear',
            }}
          >
            {/* Glow effect behind checked item */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '103%',
                height: '100%',
                borderRadius: '10px',
                background: isChecked
                  ? `linear-gradient(to bottom, transparent 10%, ${glowColor}63, transparent 90%)`
                  : 'transparent',
                transition: 'all 0.1s linear',
                zIndex: 0,
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
              className="relative font-extrabold uppercase"
              style={{
                fontSize: config.fontSize,
                lineHeight: `${Math.round(config.fontSize * 0.8)}px`,
                color: 'black',
                textShadow: '-1px -1px 1px rgba(224, 224, 224, 0.1), 0px 2px 3px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.1s linear',
                zIndex: 1,
              }}
            >
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
};

export default PressedButtonRadio;
