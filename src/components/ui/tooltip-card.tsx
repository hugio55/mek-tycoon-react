"use client";
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const Tooltip = ({
  content,
  children,
  containerClassName,
}: {
  content: string | React.ReactNode;
  children: React.ReactNode;
  containerClassName?: string;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  const calculatePosition = () => {
    if (!containerRef.current || !contentRef.current) return { x: 0, y: 0 };

    const trigger = containerRef.current.getBoundingClientRect();
    const tooltip = contentRef.current;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Get tooltip dimensions
    const tooltipWidth = 240; // min-w-[15rem] = 240px
    const tooltipHeight = tooltip.scrollHeight || 100; // Fallback height
    const gap = 8; // Gap between tooltip and trigger

    // Center tooltip horizontally over the trigger element
    let finalX = trigger.left + trigger.width / 2 - tooltipWidth / 2;

    // Position tooltip above the trigger element with gap
    let finalY = trigger.top - tooltipHeight - gap;

    // Check if tooltip goes beyond right edge
    if (finalX + tooltipWidth > viewportWidth - 12) {
      finalX = viewportWidth - tooltipWidth - 12;
    }

    // Check if tooltip goes beyond left edge
    if (finalX < 12) {
      finalX = 12;
    }

    // If tooltip doesn't fit above, position it below
    if (finalY < 12) {
      finalY = trigger.bottom + gap;
    }

    // Check if tooltip goes beyond bottom edge (when positioned below)
    if (finalY + tooltipHeight > viewportHeight - 12) {
      // Last resort: position next to element (right side)
      finalY = trigger.top;
      finalX = trigger.right + gap;

      // If that doesn't fit, try left side
      if (finalX + tooltipWidth > viewportWidth - 12) {
        finalX = trigger.left - tooltipWidth - gap;
      }

      // If nothing fits, just position at top of viewport
      if (finalX < 12) {
        finalX = 12;
        finalY = 12;
      }
    }

    return { x: finalX, y: finalY };
  };

  const updatePosition = () => {
    const newPosition = calculatePosition();
    setPosition(newPosition);
  };

  const handleMouseEnter = () => {
    setIsVisible(true);
    updatePosition();
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const handleTouchStart = () => {
    updatePosition();
    setIsVisible(true);
  };

  const handleTouchEnd = () => {
    // Delay hiding to allow for tap interaction
    setTimeout(() => {
      setIsVisible(false);
    }, 2000);
  };

  const handleClick = () => {
    // Toggle visibility on click for mobile devices
    if (window.matchMedia("(hover: none)").matches) {
      if (isVisible) {
        setIsVisible(false);
      } else {
        updatePosition();
        setIsVisible(true);
      }
    }
  };

  // Recalculate position when tooltip becomes visible or content changes
  useEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible, content]);

  // Handle window resize - recalculate tooltip position
  useEffect(() => {
    if (!isVisible) return;

    const handleResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true); // Capture scroll events

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isVisible]);

  const tooltipContent = isVisible && (
    <AnimatePresence>
      <motion.div
        key="tooltip"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
          mass: 0.5,
        }}
        className="pointer-events-none fixed z-[9999] min-w-[15rem] max-w-xs rounded-md border border-cyan-400/30 bg-black/95 shadow-lg backdrop-blur-sm ring-1 ring-cyan-400/20"
        style={{
          top: `${position.y}px`,
          left: `${position.x}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={contentRef}
          className="p-3 text-sm text-cyan-100"
        >
          {content}
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <>
      <div
        ref={containerRef}
        className={cn("relative inline-block", containerClassName)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        {children}
      </div>
      {mounted && isVisible && createPortal(tooltipContent, document.body)}
    </>
  );
};
