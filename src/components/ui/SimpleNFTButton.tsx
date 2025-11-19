'use client';

interface SimpleNFTButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  width?: string;
  height?: string;
  fontSize?: string;
  className?: string;
}

export default function SimpleNFTButton({
  text,
  onClick,
  disabled = false,
  width = 'auto',
  height = 'auto',
  fontSize = '15px',
  className = ''
}: SimpleNFTButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md font-semibold transition-all duration-300 ${
        disabled ? 'cursor-not-allowed opacity-60' : 'hover:scale-105'
      } ${className}`}
      style={{
        fontFamily: "'Saira', sans-serif",
        background: disabled ? '#4b5563' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        color: disabled ? '#9ca3af' : '#1a1a1a',
        boxShadow: disabled ? 'none' : '0 4px 15px rgba(251, 191, 36, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
        border: disabled ? '2px solid #6b7280' : '2px solid #fbbf24',
        letterSpacing: '0.1em',
        width,
        height,
        fontSize,
        padding: '12px 32px'
      }}
    >
      {text}
    </button>
  );
}
