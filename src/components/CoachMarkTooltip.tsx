"use client";

interface SequenceInfo {
  sequenceId: string;
  currentIndex: number;
  totalSteps: number;
}

interface CoachMarkTooltipProps {
  x: number;
  y: number;
  anchor: "top" | "bottom" | "left" | "right";
  title?: string;
  text: string;
  showSkipButton: boolean;
  showNextButton: boolean;
  isMandatory: boolean;
  sequenceInfo?: SequenceInfo;
  onSkip: () => void;
  onNext: () => void;
  onSkipSequence?: () => void;
}

export default function CoachMarkTooltip({
  x,
  y,
  anchor,
  title,
  text,
  showSkipButton,
  showNextButton,
  isMandatory,
  sequenceInfo,
  onSkip,
  onNext,
  onSkipSequence,
}: CoachMarkTooltipProps) {
  // Calculate transform based on anchor position
  const getTransform = () => {
    switch (anchor) {
      case "top":
        return "translate(-50%, 0)";
      case "bottom":
        return "translate(-50%, -100%)";
      case "left":
        return "translate(0, -50%)";
      case "right":
        return "translate(-100%, -50%)";
      default:
        return "translate(-50%, 0)";
    }
  };

  return (
    <div
      className="absolute z-[10000] pointer-events-auto"
      style={{
        left: x,
        top: y,
        transform: getTransform(),
        animation: "fadeInTooltip 0.3s ease-out",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Liquid Glass Container */}
      <div
        className="relative w-[320px] overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(34,211,238,0.08)",
        }}
      >
        {/* Content */}
        <div className="p-5">
          {/* Title */}
          {title && (
            <h3
              className="text-lg font-bold tracking-wider mb-2"
              style={{
                fontFamily: "Orbitron, sans-serif",
                color: "#22d3ee",
                textShadow: "0 0 20px rgba(34, 211, 238, 0.5)",
              }}
            >
              {title}
            </h3>
          )}

          {/* Main Text */}
          <p
            className="text-sm leading-relaxed"
            style={{
              fontFamily: "Play, sans-serif",
              color: "rgba(255, 255, 255, 0.85)",
            }}
          >
            {text}
          </p>

          {/* Step Counter (if in sequence) */}
          {sequenceInfo && (
            <div
              className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between"
            >
              <span
                className="text-xs uppercase tracking-[0.15em]"
                style={{
                  fontFamily: "Play, sans-serif",
                  color: "rgba(255, 255, 255, 0.4)",
                }}
              >
                Step {sequenceInfo.currentIndex + 1} of {sequenceInfo.totalSteps}
              </span>

              {/* Progress dots */}
              <div className="flex gap-1.5">
                {Array.from({ length: sequenceInfo.totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{
                      background:
                        i < sequenceInfo.currentIndex
                          ? "#22d3ee"
                          : i === sequenceInfo.currentIndex
                          ? "linear-gradient(135deg, #22d3ee, #0891b2)"
                          : "rgba(255, 255, 255, 0.2)",
                      boxShadow:
                        i <= sequenceInfo.currentIndex
                          ? "0 0 8px rgba(34, 211, 238, 0.5)"
                          : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {(showSkipButton || showNextButton) && (
          <div
            className="px-5 py-4 flex items-center justify-between gap-3"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Skip Button */}
            {showSkipButton && (
              <button
                onClick={onSkip}
                className="px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all duration-200 hover:bg-white/10 rounded-lg"
                style={{
                  fontFamily: "Saira, sans-serif",
                  color: "rgba(255, 255, 255, 0.5)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                Skip
              </button>
            )}

            {/* Skip All (if in sequence and allowed) */}
            {sequenceInfo && onSkipSequence && !isMandatory && (
              <button
                onClick={onSkipSequence}
                className="px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all duration-200 hover:bg-white/10 rounded-lg"
                style={{
                  fontFamily: "Saira, sans-serif",
                  color: "rgba(255, 255, 255, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                Skip All
              </button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Next/Got it Button */}
            {showNextButton && (
              <button
                onClick={onNext}
                className="px-5 py-2 text-xs font-medium uppercase tracking-wider transition-all duration-200 rounded-lg"
                style={{
                  fontFamily: "Saira, sans-serif",
                  background: "linear-gradient(135deg, rgba(34,211,238,0.25), rgba(34,211,238,0.15))",
                  border: "1px solid rgba(34,211,238,0.3)",
                  color: "#22d3ee",
                  textShadow: "0 0 10px rgba(34, 211, 238, 0.5)",
                }}
              >
                {isMandatory ? "Got it" : "Next"}
              </button>
            )}
          </div>
        )}

        {/* Mandatory indicator */}
        {isMandatory && !showNextButton && (
          <div
            className="px-5 py-3 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span
              className="text-xs uppercase tracking-[0.15em]"
              style={{
                fontFamily: "Play, sans-serif",
                color: "rgba(34, 211, 238, 0.7)",
              }}
            >
              Click the highlighted element to continue
            </span>
          </div>
        )}

        {/* Decorative corner accents */}
        <div
          className="absolute top-0 left-0 w-6 h-6 pointer-events-none"
          style={{
            borderTop: "2px solid rgba(34, 211, 238, 0.4)",
            borderLeft: "2px solid rgba(34, 211, 238, 0.4)",
            borderTopLeftRadius: "16px",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-6 h-6 pointer-events-none"
          style={{
            borderBottom: "2px solid rgba(34, 211, 238, 0.4)",
            borderRight: "2px solid rgba(34, 211, 238, 0.4)",
            borderBottomRightRadius: "16px",
          }}
        />
      </div>

      {/* Inline animation styles */}
      <style>{`
        @keyframes fadeInTooltip {
          from {
            opacity: 0;
            transform: ${getTransform()} scale(0.95);
          }
          to {
            opacity: 1;
            transform: ${getTransform()} scale(1);
          }
        }
      `}</style>
    </div>
  );
}
