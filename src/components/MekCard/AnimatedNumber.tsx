import { useState, useEffect, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
}

export function AnimatedNumber({ value, decimals = 1 }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = displayValue;
    const endValue = value;
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * eased;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
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
  }, [value, displayValue]);

  return decimals === 0
    ? <>{Math.floor(displayValue).toLocaleString('en-US')}</>
    : <>{displayValue.toFixed(decimals)}</>;
}
