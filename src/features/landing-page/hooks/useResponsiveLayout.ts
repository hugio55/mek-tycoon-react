import { useEffect, useState } from 'react';

export function useResponsiveLayout(breakpoint: number = 1024) {
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [fixedViewportHeight, setFixedViewportHeight] = useState(0);

  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const wasMobile = isMobile;
      const nowMobile = width < breakpoint;

      if (wasMobile !== nowMobile) {
        // Viewport changed between mobile and desktop
      }

      setIsMobile(nowMobile);
      setWindowWidth(width);
      setViewportHeight(height);
    };

    // Set initial fixed viewport height (prevents mobile chrome URL bar jumping)
    setFixedViewportHeight(window.innerHeight);

    // Check viewport on mount
    checkViewport();

    // Listen for resize events
    window.addEventListener('resize', checkViewport);

    return () => window.removeEventListener('resize', checkViewport);
  }, [isMobile, breakpoint]);

  return {
    isMobile,
    windowWidth,
    viewportHeight,
    fixedViewportHeight,
  };
}
