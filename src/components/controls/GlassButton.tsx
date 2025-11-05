'use client';

import { useState } from 'react';
import './GlassButton.css';

interface GlassButtonProps {
  text?: string;
  onClick?: () => void;
}

export default function GlassButton({
  text = 'Generate',
  onClick
}: GlassButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 125);
    onClick?.();
  };

  return (
    <div className="button-wrap">
      <button
        onClick={handleClick}
        className={isAnimating ? 'click-animate' : ''}
      >
        <span>{text}</span>
      </button>
      <div className="button-shadow"></div>
    </div>
  );
}
