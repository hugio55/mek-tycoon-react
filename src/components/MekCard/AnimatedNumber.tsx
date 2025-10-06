import { useState, useEffect, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
}

export function AnimatedNumber({ value, decimals = 1 }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const animationRef = useRef<number | null>(null);
  const startValueRef = useRef(value);

  useEffect(() => {
    const startValue = startValueRef.current;
    const endValue = value;
    const duration = 400; // Faster animation (was 800ms)
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * eased;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete - update start value for next animation
        startValueRef.current = endValue;
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value]); // Fixed: removed displayValue from dependencies

  return decimals === 0
    ? <>{Math.floor(displayValue).toLocaleString('en-US')}</>
    : <>{displayValue.toFixed(decimals)}</>;
}
