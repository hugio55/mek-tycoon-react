"use client";

import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  containerClassName?: string;
}

export const Tooltip = ({ content, children, containerClassName }: TooltipProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const springConfig = { stiffness: 100, damping: 5 };
  const x = useMotionValue(0);

  const rotate = useSpring(
    useTransform(x, [-100, 100], [-8, 8]),
    springConfig
  );

  const translateX = useSpring(
    useTransform(x, [-100, 100], [-20, 20]),
    springConfig
  );

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const halfWidth = rect.width / 2;
    x.set(mouseX - halfWidth);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {children}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 260,
                damping: 20,
              },
            }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{
              translateX: translateX,
              rotate: rotate,
            }}
            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg shadow-xl z-50 pointer-events-none ${containerClassName || ""}`}
          >
            <div className="max-w-xs">
              {typeof content === "string" ? (
                <p className="text-sm">{content}</p>
              ) : (
                content
              )}
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="w-2 h-2 bg-neutral-900 dark:bg-neutral-100 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
