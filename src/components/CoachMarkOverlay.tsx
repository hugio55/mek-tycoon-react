"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import CoachMarkArrow from "./CoachMarkArrow";
import CoachMarkTooltip from "./CoachMarkTooltip";

interface SpotlightPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CoachMarkStep {
  stepKey: string;
  name: string;
  targetType: "element" | "manual" | "hybrid";
  elementSelector?: string;
  manualPosition?: { x: number; y: number; width: number; height: number };
  positionOffset?: { top?: number; left?: number; right?: number; bottom?: number };
  spotlightShape: "rectangle" | "circle" | "pill";
  spotlightPadding: number;
  arrowPosition: "top" | "bottom" | "left" | "right" | "none";
  arrowOffset?: number;
  tooltipText: string;
  tooltipTitle?: string;
  tooltipPosition: "above" | "below" | "left" | "right" | "auto";
  isMandatory: boolean;
  allowBackdropClick: boolean;
  showSkipButton: boolean;
  showNextButton: boolean;
}

interface SequenceInfo {
  sequenceId: string;
  currentIndex: number;
  totalSteps: number;
}

interface CoachMarkOverlayProps {
  step: CoachMarkStep;
  sequenceInfo?: SequenceInfo;
  onComplete: () => void;
  onSkip: () => void;
  onSkipSequence?: () => void;
}

export default function CoachMarkOverlay({
  step,
  sequenceInfo,
  onComplete,
  onSkip,
  onSkipSequence,
}: CoachMarkOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [spotlightPos, setSpotlightPos] = useState<SpotlightPosition | null>(null);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Mount portal and lock body scroll
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Find target element and calculate spotlight position
  const calculateSpotlightPosition = useCallback(() => {
    let position: SpotlightPosition | null = null;

    if (step.targetType === "element" || step.targetType === "hybrid") {
      // Try to find element by selector
      const selector = step.elementSelector;
      if (selector) {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          setTargetElement(element);
          const rect = element.getBoundingClientRect();
          position = {
            x: rect.left - step.spotlightPadding,
            y: rect.top - step.spotlightPadding,
            width: rect.width + step.spotlightPadding * 2,
            height: rect.height + step.spotlightPadding * 2,
          };
        }
      }
    }

    if (step.targetType === "manual" || (step.targetType === "hybrid" && !position)) {
      // Use manual position (percentage-based)
      if (step.manualPosition) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        position = {
          x: (step.manualPosition.x / 100) * viewportWidth,
          y: (step.manualPosition.y / 100) * viewportHeight,
          width: step.manualPosition.width,
          height: step.manualPosition.height,
        };
      }
    }

    // Apply offsets if provided (for hybrid mode fine-tuning)
    if (position && step.positionOffset) {
      const { top, left, right, bottom } = step.positionOffset;
      if (top !== undefined) position.y += top;
      if (left !== undefined) position.x += left;
      if (right !== undefined) position.x -= right;
      if (bottom !== undefined) position.y -= bottom;
    }

    setSpotlightPos(position);
  }, [step]);

  // Recalculate on resize/scroll
  useEffect(() => {
    calculateSpotlightPosition();

    const handleResize = () => calculateSpotlightPosition();
    const handleScroll = () => calculateSpotlightPosition();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    // Also observe for layout changes
    const observer = new MutationObserver(() => {
      setTimeout(calculateSpotlightPosition, 50);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
      observer.disconnect();
    };
  }, [calculateSpotlightPosition]);

  // Handle clicks
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only process backdrop clicks, not spotlight clicks
    if (e.target !== e.currentTarget) return;

    if (step.allowBackdropClick && !step.isMandatory) {
      onSkip();
    }
  };

  const handleSpotlightClick = () => {
    if (step.isMandatory) {
      // For mandatory steps, clicking the spotlight completes the step
      onComplete();
    }
  };

  // Generate SVG mask path for spotlight cutout
  const generateMaskPath = (): string => {
    if (!spotlightPos) return "";

    const { x, y, width, height } = spotlightPos;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (step.spotlightShape === "circle") {
      // Circular spotlight - use the larger dimension as diameter
      const radius = Math.max(width, height) / 2;
      const cx = x + width / 2;
      const cy = y + height / 2;
      // Outer rectangle (full viewport), inner circle cutout
      return `
        M 0 0 L ${vw} 0 L ${vw} ${vh} L 0 ${vh} Z
        M ${cx} ${cy - radius}
        A ${radius} ${radius} 0 1 0 ${cx} ${cy + radius}
        A ${radius} ${radius} 0 1 0 ${cx} ${cy - radius}
      `;
    } else if (step.spotlightShape === "pill") {
      // Pill shape - rounded rectangle with radius = half height
      const radius = height / 2;
      return `
        M 0 0 L ${vw} 0 L ${vw} ${vh} L 0 ${vh} Z
        M ${x + radius} ${y}
        L ${x + width - radius} ${y}
        A ${radius} ${radius} 0 0 1 ${x + width - radius} ${y + height}
        L ${x + radius} ${y + height}
        A ${radius} ${radius} 0 0 1 ${x + radius} ${y}
      `;
    } else {
      // Rectangle with slight rounding
      const r = 8; // corner radius
      return `
        M 0 0 L ${vw} 0 L ${vw} ${vh} L 0 ${vh} Z
        M ${x + r} ${y}
        L ${x + width - r} ${y}
        Q ${x + width} ${y} ${x + width} ${y + r}
        L ${x + width} ${y + height - r}
        Q ${x + width} ${y + height} ${x + width - r} ${y + height}
        L ${x + r} ${y + height}
        Q ${x} ${y + height} ${x} ${y + height - r}
        L ${x} ${y + r}
        Q ${x} ${y} ${x + r} ${y}
      `;
    }
  };

  // Calculate arrow position relative to spotlight
  const getArrowPosition = () => {
    if (!spotlightPos || step.arrowPosition === "none") return null;

    const { x, y, width, height } = spotlightPos;
    const offset = step.arrowOffset || 0;
    const arrowSize = 40;

    switch (step.arrowPosition) {
      case "top":
        return {
          x: x + width / 2 + offset,
          y: y - arrowSize - 10,
          rotation: 180,
        };
      case "bottom":
        return {
          x: x + width / 2 + offset,
          y: y + height + 10,
          rotation: 0,
        };
      case "left":
        return {
          x: x - arrowSize - 10,
          y: y + height / 2 + offset,
          rotation: 90,
        };
      case "right":
        return {
          x: x + width + 10,
          y: y + height / 2 + offset,
          rotation: -90,
        };
      default:
        return null;
    }
  };

  // Calculate tooltip position relative to spotlight
  const getTooltipPosition = () => {
    if (!spotlightPos) return null;

    const { x, y, width, height } = spotlightPos;
    const tooltipWidth = 320;
    const tooltipHeight = 150; // Estimated
    const gap = 60; // Gap from spotlight edge (includes arrow space)

    // Auto-position: find best position that fits in viewport
    let pos = step.tooltipPosition;
    if (pos === "auto") {
      const spaceAbove = y;
      const spaceBelow = window.innerHeight - (y + height);
      const spaceLeft = x;
      const spaceRight = window.innerWidth - (x + width);

      if (spaceBelow >= tooltipHeight + gap) pos = "below";
      else if (spaceAbove >= tooltipHeight + gap) pos = "above";
      else if (spaceRight >= tooltipWidth + gap) pos = "right";
      else if (spaceLeft >= tooltipWidth + gap) pos = "left";
      else pos = "below"; // Fallback
    }

    switch (pos) {
      case "above":
        return {
          x: x + width / 2,
          y: y - gap,
          anchor: "bottom" as const,
        };
      case "below":
        return {
          x: x + width / 2,
          y: y + height + gap,
          anchor: "top" as const,
        };
      case "left":
        return {
          x: x - gap,
          y: y + height / 2,
          anchor: "right" as const,
        };
      case "right":
        return {
          x: x + width + gap,
          y: y + height / 2,
          anchor: "left" as const,
        };
      default:
        return {
          x: x + width / 2,
          y: y + height + gap,
          anchor: "top" as const,
        };
    }
  };

  const arrowPos = getArrowPosition();
  const tooltipPos = getTooltipPosition();

  if (!mounted) return null;

  const overlayContent = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999]"
      onClick={handleBackdropClick}
    >
      {/* Dark backdrop with SVG mask cutout */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ background: "transparent" }}
      >
        <defs>
          <mask id="spotlight-mask">
            {/* White = visible (blocked), Black = transparent (spotlight) */}
            <rect width="100%" height="100%" fill="white" />
            {spotlightPos && (
              <path d={generateMaskPath()} fill="black" fillRule="evenodd" />
            )}
          </mask>
        </defs>
        {/* Dark overlay with mask */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          style={{ backdropFilter: "blur(2px)" }}
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Spotlight glow effect */}
      {spotlightPos && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: spotlightPos.x - 4,
            top: spotlightPos.y - 4,
            width: spotlightPos.width + 8,
            height: spotlightPos.height + 8,
            borderRadius:
              step.spotlightShape === "circle"
                ? "50%"
                : step.spotlightShape === "pill"
                ? `${spotlightPos.height / 2 + 4}px`
                : "12px",
            boxShadow: `
              0 0 0 2px rgba(34, 211, 238, 0.6),
              0 0 20px rgba(34, 211, 238, 0.4),
              0 0 40px rgba(34, 211, 238, 0.2),
              inset 0 0 20px rgba(34, 211, 238, 0.1)
            `,
            animation: "pulseGlow 2s ease-in-out infinite",
          }}
        />
      )}

      {/* Clickable spotlight area (for mandatory steps) */}
      {spotlightPos && step.isMandatory && (
        <div
          className="absolute cursor-pointer"
          style={{
            left: spotlightPos.x,
            top: spotlightPos.y,
            width: spotlightPos.width,
            height: spotlightPos.height,
            borderRadius:
              step.spotlightShape === "circle"
                ? "50%"
                : step.spotlightShape === "pill"
                ? `${spotlightPos.height / 2}px`
                : "8px",
          }}
          onClick={handleSpotlightClick}
        />
      )}

      {/* Animated Arrow */}
      {arrowPos && (
        <CoachMarkArrow
          x={arrowPos.x}
          y={arrowPos.y}
          rotation={arrowPos.rotation}
        />
      )}

      {/* Tooltip */}
      {tooltipPos && (
        <CoachMarkTooltip
          x={tooltipPos.x}
          y={tooltipPos.y}
          anchor={tooltipPos.anchor}
          title={step.tooltipTitle}
          text={step.tooltipText}
          showSkipButton={step.showSkipButton}
          showNextButton={step.showNextButton}
          isMandatory={step.isMandatory}
          sequenceInfo={sequenceInfo}
          onSkip={onSkip}
          onNext={onComplete}
          onSkipSequence={onSkipSequence}
        />
      )}

      {/* Inline styles for animations */}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow:
              0 0 0 2px rgba(34, 211, 238, 0.6),
              0 0 20px rgba(34, 211, 238, 0.4),
              0 0 40px rgba(34, 211, 238, 0.2),
              inset 0 0 20px rgba(34, 211, 238, 0.1);
          }
          50% {
            box-shadow:
              0 0 0 3px rgba(34, 211, 238, 0.8),
              0 0 30px rgba(34, 211, 238, 0.6),
              0 0 60px rgba(34, 211, 238, 0.3),
              inset 0 0 30px rgba(34, 211, 238, 0.15);
          }
        }
      `}</style>
    </div>
  );

  return createPortal(overlayContent, document.body);
}
