import { ReactNode, useState, useEffect } from 'react';

interface LandingContainerProps {
  children: ReactNode;
  backgroundOpacity: number;
  showFooter?: boolean;
  transitionDuration?: number;
  allowScroll?: boolean;
}

export default function LandingContainer({ children, backgroundOpacity, showFooter = true, transitionDuration = 2000, allowScroll = true }: LandingContainerProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobile = /iphone|ipod|android/.test(userAgent);
    setIsMobile(mobile);
  }, []);

  return (
    <div
      className="bg-black flex flex-col landing-scrollbar"
      style={{
        overflowY: allowScroll ? 'auto' : 'hidden',
        minHeight: '100vh',
        height: 'fit-content'
      }}
    >
      <div
        className="fixed inset-0 transition-opacity ease-out pointer-events-none"
        style={{
          backgroundImage: 'url(/colored-bg-1.webp)',
          backgroundSize: isMobile ? '150%' : 'cover',
          backgroundPosition: isMobile ? 'center calc(50% - 75px)' : 'center calc(50% + 25px)',
          opacity: backgroundOpacity,
          transitionDuration: `${transitionDuration}ms`,
          zIndex: 0,
        }}
      />

      <div className="relative w-full flex flex-col pb-8" style={{ zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
}
