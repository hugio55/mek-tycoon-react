'use client';

import './GlassButton.css';

interface GlassButtonProps {
  text?: string;
  onClick?: () => void;
}

export default function GlassButton({
  text = 'Generate',
  onClick
}: GlassButtonProps) {
  return (
    <div className="button-wrap">
      <button onClick={onClick}>
        <span>{text}</span>
      </button>
      <div className="button-shadow"></div>
    </div>
  );
}
