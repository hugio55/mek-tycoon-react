'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface NumberTickerProps {
  value: number;
  startValue?: number;
  direction?: 'up' | 'down';
  delay?: number;
  decimalPlaces?: number;
  duration?: number;
  className?: string;
  formatOptions?: Intl.NumberFormatOptions;
}

// Spring physics simulation
function springAnimation(
  from: number,
  to: number,
  onUpdate: (value: number) => void,
  onComplete: () => void,
  damping = 60,
  stiffness = 100
): () => void {
  let position = from;
  let velocity = 0;
  const mass = 1;
  let animationFrame: number;
  let lastTime = performance.now();

  const step = () => {
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.064); // Cap delta to prevent jumps
    lastTime = currentTime;

    // Spring force: F = -k * x (where x is displacement from target)
    const displacement = position - to;
    const springForce = -stiffness * displacement;

    // Damping force: F = -c * v
    const dampingForce = -damping * velocity;

    // Total acceleration: a = F / m
    const acceleration = (springForce + dampingForce) / mass;

    // Update velocity and position
    velocity += acceleration * deltaTime;
    position += velocity * deltaTime;

    onUpdate(position);

    // Check if animation is essentially complete (very close to target with low velocity)
    const isComplete = Math.abs(displacement) < 0.01 && Math.abs(velocity) < 0.01;

    if (isComplete) {
      onUpdate(to); // Snap to final value
      onComplete();
    } else {
      animationFrame = requestAnimationFrame(step);
    }
  };

  animationFrame = requestAnimationFrame(step);

  // Return cancel function
  return () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  };
}

const NumberTicker: React.FC<NumberTickerProps> = ({
  value,
  startValue = 0,
  direction = 'up',
  delay = 0,
  decimalPlaces = 0,
  duration,
  className = '',
  formatOptions,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const cancelAnimation = useRef<(() => void) | null>(null);

  // Format number for display
  const formatNumber = useCallback((num: number) => {
    return Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
      ...formatOptions,
    }).format(Number(num.toFixed(decimalPlaces)));
  }, [decimalPlaces, formatOptions]);

  // Intersection observer for in-view detection
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasAnimated]);

  // Trigger animation when in view
  useEffect(() => {
    if (!isInView || hasAnimated) return;

    const timeoutId = setTimeout(() => {
      const from = direction === 'down' ? value : startValue;
      const to = direction === 'down' ? startValue : value;

      // Cancel any existing animation
      if (cancelAnimation.current) {
        cancelAnimation.current();
      }

      cancelAnimation.current = springAnimation(
        from,
        to,
        (currentValue) => {
          if (ref.current) {
            ref.current.textContent = formatNumber(currentValue);
          }
        },
        () => {
          setHasAnimated(true);
        }
      );
    }, delay * 1000);

    return () => {
      clearTimeout(timeoutId);
      if (cancelAnimation.current) {
        cancelAnimation.current();
      }
    };
  }, [isInView, hasAnimated, value, startValue, direction, delay, formatNumber]);

  // Update when value changes after initial animation
  useEffect(() => {
    if (!hasAnimated) return;

    // Cancel any existing animation
    if (cancelAnimation.current) {
      cancelAnimation.current();
    }

    // Get current displayed value
    const currentText = ref.current?.textContent || '0';
    const currentValue = parseFloat(currentText.replace(/,/g, '')) || 0;

    cancelAnimation.current = springAnimation(
      currentValue,
      value,
      (newValue) => {
        if (ref.current) {
          ref.current.textContent = formatNumber(newValue);
        }
      },
      () => {}
    );

    return () => {
      if (cancelAnimation.current) {
        cancelAnimation.current();
      }
    };
  }, [value, hasAnimated, formatNumber]);

  return (
    <span
      ref={ref}
      className={`inline-block tracking-wider tabular-nums ${className}`}
    >
      {formatNumber(direction === 'down' ? value : startValue)}
    </span>
  );
};

export default NumberTicker;
