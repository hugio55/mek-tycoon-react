'use client';

import React, { useState } from 'react';

interface RadialSwitchProps {
  options?: string[];
  defaultIndex?: number;
  onChange?: (index: number, value: string) => void;
  className?: string;
}

export default function RadialSwitch({
  options = ['off', 'on'],
  defaultIndex = 0,
  onChange,
  className = ''
}: RadialSwitchProps) {
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);

  const handleChange = (index: number) => {
    setSelectedIndex(index);
    if (onChange) {
      onChange(index, options[index]);
    }
  };

  return (
    <div className={`radial-switch-container ${className}`}>
      <style jsx global>{`
        .radial-switch-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
        }

        .radial-switch-wrap {
          position: relative;
          width: 8em;
          height: 8em;
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 50%,
              #202020 0%,
              #202020 calc(50% - 2.0625em),
              #696969 calc(50% - 2em),
              #696969 calc(50% - 0.125em),
              transparent calc(50% - 0.125em)
            ),
            conic-gradient(from 270deg,
              #2f2f2f 0deg,
              #696969 35deg,
              #2f2f2f 70deg
            );
          transition: transform 0.35s ease;
        }

        .radial-switch-wrap::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: calc(100% - 4em);
          height: calc(100% - 4em);
          border-radius: 50%;
          background: radial-gradient(circle at 50% 50%,
            #202020 0%,
            #2f2f2f 100%
          );
          transform: translate(-50%, -50%);
          z-index: 1;
        }

        .radial-switch-input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .radial-switch-label {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-family: 'Orbitron', monospace;
          font-size: 0.875em;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #696969;
          cursor: pointer;
          z-index: 2;
          transition: color 0.35s ease;
          user-select: none;
        }

        .radial-switch-input:checked + .radial-switch-label {
          color: #fab617;
        }

        /* Rotation based on selected index */
        ${options.map((_, i) => `
          .radial-switch-wrap[data-selected="${i}"] {
            transform: rotate(${235 - i * 70}deg);
          }
        `).join('\n')}

        /* Handle (the moving part on the outer circle) */
        .radial-switch-handle {
          position: absolute;
          top: 0;
          left: 50%;
          width: 0.5em;
          height: 2em;
          background: linear-gradient(180deg, #fab617 0%, #d49614 100%);
          transform: translateX(-50%);
          border-radius: 0.25em;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }
      `}</style>

      <div
        className="radial-switch-wrap"
        role="group"
        aria-label="radial switch"
        data-selected={selectedIndex}
      >
        <div className="radial-switch-handle" />

        {options.map((option, index) => (
          <React.Fragment key={index}>
            <input
              type="radio"
              name="radial-switch"
              id={`radial-switch-${index}`}
              className="radial-switch-input"
              checked={selectedIndex === index}
              onChange={() => handleChange(index)}
            />
            <label
              htmlFor={`radial-switch-${index}`}
              className="radial-switch-label"
            >
              {option}
            </label>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
