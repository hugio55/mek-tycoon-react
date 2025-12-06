"use client";

interface CoachMarkArrowProps {
  x: number;
  y: number;
  rotation: number;
}

export default function CoachMarkArrow({ x, y, rotation }: CoachMarkArrowProps) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        animation: "bounceArrow 1s ease-in-out infinite",
      }}
    >
      {/* Arrow SVG with cyan glow */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        style={{
          filter: "drop-shadow(0 0 8px rgba(34, 211, 238, 0.8)) drop-shadow(0 0 16px rgba(34, 211, 238, 0.5))",
        }}
      >
        {/* Arrow body */}
        <path
          d="M24 4 L24 36"
          stroke="#22d3ee"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Arrow head */}
        <path
          d="M12 26 L24 40 L36 26"
          stroke="#22d3ee"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Inner glow line */}
        <path
          d="M24 8 L24 32"
          stroke="rgba(255, 255, 255, 0.6)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* Pulsing ring effect */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ animation: "pulseRing 1.5s ease-out infinite" }}
      >
        <div
          className="w-12 h-12 rounded-full"
          style={{
            border: "2px solid rgba(34, 211, 238, 0.4)",
          }}
        />
      </div>

      {/* Inline animation styles */}
      <style>{`
        @keyframes bounceArrow {
          0%, 100% {
            transform: translate(-50%, -50%) rotate(${rotation}deg) translateY(0);
          }
          50% {
            transform: translate(-50%, -50%) rotate(${rotation}deg) translateY(8px);
          }
        }

        @keyframes pulseRing {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
