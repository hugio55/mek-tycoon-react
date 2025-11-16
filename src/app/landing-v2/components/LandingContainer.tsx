import { ReactNode, useState, useEffect } from 'react';

interface LandingContainerProps {
  children: ReactNode;
  backgroundOpacity: number;
  showFooter?: boolean;
  transitionDuration?: number;
  allowScroll?: boolean;
  minHeight?: string;
  height?: string;
}

export default function LandingContainer({
  children,
  backgroundOpacity,
  showFooter = true,
  transitionDuration = 2000,
  allowScroll = true,
  minHeight = 'auto',
  height = 'auto'
}: LandingContainerProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobile = /iphone|ipod|android/.test(userAgent);
    setIsMobile(mobile);
  }, []);

  return (
    <div
      className="bg-black landing-scrollbar"
      style={{
        overflowY: allowScroll ? 'auto' : 'hidden',
        minHeight,
        height
      }}
    >
      {false && (
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
      )}

      <div className="relative w-full flex flex-col pb-8" style={{ zIndex: 10 }}>
        {children}

        {showFooter && (
          <footer className="mt-12 flex justify-center">
            <a
              href="https://www.overexposed.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all hover:scale-110"
            >
              <img
                src="/random-images/OE logo.png"
                alt="OE Logo"
                className="h-12 w-auto"
              />
            </a>
          </footer>
        )}
      </div>
    </div>
  );
}
