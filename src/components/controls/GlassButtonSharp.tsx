'use client';

import './GlassButtonSharp.css';

interface GlassButtonSharpProps {
  text?: string;
  onClick?: () => void;
}

export default function GlassButtonSharp({
  text = 'Generate',
  onClick
}: GlassButtonSharpProps) {
  return (
    <div className="button-wrap-sharp">
      <button onClick={onClick}>
        <span>{text}</span>
      </button>
      <div className="button-shadow-sharp"></div>
    </div>
  );
}
