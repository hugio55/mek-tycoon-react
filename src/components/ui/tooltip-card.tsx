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

  const calculatePosition = (clientX: number, clientY: number) => {
    if (!contentRef.current) return { x: clientX + 12, y: clientY + 12 };

    const tooltip = contentRef.current;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Get tooltip dimensions
    const tooltipWidth = 240; // min-w-[15rem] = 240px
    const tooltipHeight = tooltip.scrollHeight || 100; // Fallback height

    let finalX = clientX + 12;
    let finalY = clientY + 12;

    // Check if tooltip goes beyond right edge
    if (finalX + tooltipWidth > viewportWidth) {
      finalX = clientX - tooltipWidth - 12;
    }

    // Check if tooltip goes beyond left edge
    if (finalX < 0) {
      finalX = 12;
    }

    // Check if tooltip goes beyond bottom edge
    if (finalY + tooltipHeight > viewportHeight) {
      finalY = clientY - tooltipHeight - 12;
    }

    // Check if tooltip goes beyond top edge
    if (finalY < 0) {
      finalY = 12;
    }

    return { x: finalX, y: finalY };
  };

  const updatePosition = (clientX: number, clientY: number) => {
    const newPosition = calculatePosition(clientX, clientY);
    setPosition(newPosition);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsVisible(true);
    updatePosition(e.clientX, e.clientY);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isVisible) return;
    updatePosition(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    updatePosition(touch.clientX, touch.clientY);
    setIsVisible(true);
  };

  const handleTouchEnd = () => {
    // Delay hiding to allow for tap interaction
    setTimeout(() => {
      setIsVisible(false);
    }, 2000);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Toggle visibility on click for mobile devices
    if (window.matchMedia("(hover: none)").matches) {
      e.preventDefault();
      if (isVisible) {
        setIsVisible(false);
      } else {
        updatePosition(e.clientX, e.clientY);
        setIsVisible(true);
      }
    }
  };

  // Recalculate position when tooltip content changes
  useEffect(() => {
    if (isVisible && contentRef.current && position.x !== 0) {
      const newPosition = calculatePosition(position.x, position.y);
      if (newPosition.x !== position.x || newPosition.y !== position.y) {
        setPosition(newPosition);
      }
    }
  }, [isVisible, content]);

  const tooltipContent = isVisible && (
    <AnimatePresence>
      <motion.div
        key="tooltip"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
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
        onMouseMove={handleMouseMove}
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
