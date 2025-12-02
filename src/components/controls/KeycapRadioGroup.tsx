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
}

const KeycapRadioGroup: React.FC<KeycapRadioGroupProps> = ({
  options,
  value: controlledValue,
  onChange,
  name = 'keycap-radio',
  accentColor = '#258ac3'
}) => {
  const [internalValue, setInternalValue] = useState(options[0]?.value || '');

  const selectedValue = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  return (
    <div
      className="flex items-center gap-[6px] bg-black p-[6px] rounded-lg overflow-hidden"
      style={{ height: '94px' }}
    >
      {options.map((option) => {
        const isChecked = selectedValue === option.value;

        return (
          <label
            key={option.value}
            className="relative flex flex-col items-center justify-between cursor-pointer"
            style={{
              width: '70px',
              height: '80px',
              backgroundColor: '#2a2a2a',
              borderRadius: isChecked ? '0 0 4px 4px' : '4px',
              padding: '8px 6px',
              borderTop: isChecked ? `1px solid ${accentColor}62` : '1px solid #383838',
              transition: 'all 0.1s linear',
              transform: isChecked ? 'perspective(200px) rotateX(-18deg)' : 'none',
              transformOrigin: '50% 40%',
              boxShadow: isChecked ? 'inset 0px -20px 15px 0px rgba(0, 0, 0, 0.5)' : 'none',
              marginTop: isChecked ? '6px' : '0',
              zIndex: 2,
            }}
          >
            {/* Back side (visible when pressed) */}
            <div
              className="absolute left-0 rounded-t"
              style={{
                top: '-10px',
                backgroundColor: '#2a2a2a',
                borderRadius: '4px 4px 2px 2px',
                width: '100%',
                height: '14px',
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
              className="font-extrabold uppercase leading-[12px] text-center"
              style={{
                fontSize: '15px',
                color: isChecked ? accentColor : 'black',
                textShadow: isChecked
                  ? `0px 0px 8px ${accentColor}, 1px 1px 2px rgb(0, 0, 0)`
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
                height: '4px',
                backgroundColor: isChecked ? '#1a1a1a' : '#2a2a2a',
                boxShadow: '0 0 3px 0px rgb(19, 19, 19)',
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
