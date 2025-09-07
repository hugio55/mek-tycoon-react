"use client";

import { useState, useRef } from "react";

interface VintageKnobProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

// Predefined step values
const STEP_VALUES = [1, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

export default function VintageKnob({ value, onChange, disabled = false }: VintageKnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const knobRef = useRef<HTMLDivElement>(null);

  // Find current step index
  const currentStepIndex = STEP_VALUES.findIndex(v => v === value) || 0;
  
  // Map step index to angle (-135 to 135 degrees)
  const stepToAngle = (stepIndex: number) => {
    const normalized = stepIndex / (STEP_VALUES.length - 1);
    return -135 + normalized * 270;
  };

  // Map angle to step index
  const angleToStep = (angle: number) => {
    const normalized = (angle + 135) / 270;
    const stepIndex = Math.round(normalized * (STEP_VALUES.length - 1));
    return Math.max(0, Math.min(STEP_VALUES.length - 1, stepIndex));
  };

  const currentAngle = stepToAngle(currentStepIndex);

  // Get display text for current value
  const getDisplayText = () => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
    }
    return value.toString();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    
    const rect = knobRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      
      if (angle < -180) angle += 360;
      if (angle > 180) angle -= 360;
      
      // Clamp angle between -135 and 135
      angle = Math.max(-135, Math.min(135, angle));
      
      const stepIndex = angleToStep(angle);
      onChange(STEP_VALUES[stepIndex]);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle direct clicks on step markers
  const handleStepClick = (stepIndex: number) => {
    if (disabled) return;
    onChange(STEP_VALUES[stepIndex]);
  };

  return (
    <div className="relative w-16 h-16 select-none">
      {/* Outer ring with step markers */}
      <div className="absolute inset-0 rounded-full bg-gray-900 border-2 border-gray-700">
        {/* Step markers */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 64">
          {STEP_VALUES.map((stepValue, i) => {
            const angle = stepToAngle(i);
            const rad = (angle - 90) * (Math.PI / 180);
            const x1 = 32 + 26 * Math.cos(rad);
            const y1 = 32 + 26 * Math.sin(rad);
            const x2 = 32 + 30 * Math.cos(rad);
            const y2 = 32 + 30 * Math.sin(rad);
            
            const isActive = i === currentStepIndex;
            
            return (
              <g key={i}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isActive ? "#facc15" : disabled ? "#374151" : "#9CA3AF"}
                  strokeWidth={isActive ? "2" : "1.5"}
                />
                {/* Clickable area for each step */}
                <circle
                  cx={32 + 28 * Math.cos(rad)}
                  cy={32 + 28 * Math.sin(rad)}
                  r="5"
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={() => handleStepClick(i)}
                />
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Inner knob */}
      <div 
        ref={knobRef}
        className={`absolute inset-2 rounded-full bg-gradient-to-b from-gray-700 to-gray-800 shadow-lg cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:from-gray-600 hover:to-gray-700'
        } ${isDragging ? 'from-gray-600 to-gray-700' : ''}`}
        onMouseDown={handleMouseDown}
        style={{
          transform: `rotate(${currentAngle}deg)`,
          transition: isDragging ? 'none' : 'transform 0.15s ease-out'
        }}
      >
        {/* Pointer line */}
        <div className="absolute top-1 left-1/2 w-0.5 h-3 bg-yellow-400 -translate-x-1/2" />
        
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-gray-900 -translate-x-1/2 -translate-y-1/2" />
      </div>
      
      {/* Value display */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-gray-400 font-mono">
        {getDisplayText()}
      </div>
    </div>
  );
}