'use client';

import { useState } from 'react';
import './GlassButtonSharp.css';

interface GlassButtonSharpProps {
  text?: string;
  onClick?: () => void;
}

export default function GlassButtonSharp({
  text = 'Generate',
  onClick
}: GlassButtonSharpProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 125);
    onClick?.();
  };

  return (
    <div className="button-wrap-sharp">
      <button
        onClick={handleClick}
        className={isAnimating ? 'click-animate' : ''}
      >
        <span>{text}</span>
      </button>
      <div className="button-shadow-sharp"></div>
    </div>
  );
}
