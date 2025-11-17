import { ReactNode, useState, useEffect } from 'react';

interface LandingContainerProps {
  children: ReactNode;
  backgroundOpacity: number;
  showFooter?: boolean;
  transitionDuration?: number;
  allowScroll?: boolean;
  minHeight?: string;
  height?: string;
  isLoading?: boolean;
}

export default function LandingContainer({
  children,
  backgroundOpacity,
  showFooter = true,
  transitionDuration = 2000,
  allowScroll = true,
  minHeight = 'auto',
  height = 'auto',
  isLoading = false
}: LandingContainerProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobile = /iphone|ipod|android/.test(userAgent);
    setIsMobile(mobile);
  }, []);

  return (
    <div
      className={`${isLoading ? '' : 'bg-black'} landing-scrollbar`}
      style={{
        overflowY: allowScroll ? 'auto' : 'hidden',
        minHeight,
        height
      }}
    >
      {/* Background image */}
      <div
        className="fixed inset-0 pointer-events-none transition-opacity ease-out"
        style={{
          backgroundImage: 'url(/colored-bg-1.webp)',
          backgroundSize: isMobile ? '180%' : 'cover',
          backgroundPosition: isMobile ? 'center calc(50% + 80px)' : 'center',
          opacity: isLoading ? 0 : backgroundOpacity,
          transitionDuration: `${transitionDuration}ms`,
          zIndex: 0,
        }}
      />

      <div className="relative w-full flex flex-col min-h-screen" style={{ zIndex: 10 }}>
        <div style={{ flexGrow: 1 }}>
          {children}
        </div>

        <footer
          className="w-full relative mt-auto transition-opacity duration-1000 ease-out"
          style={{
            marginTop: '50px',
            paddingTop: '32px',
            paddingBottom: '12px',
            opacity: showFooter ? 1 : 0,
            pointerEvents: showFooter ? 'auto' : 'none'
          }}
        >
            {/* Backdrop blur effect */}
            <div
              className="absolute"
              style={{
                top: 0,
                left: 0,
                right: '17px',
                bottom: 0,
                backdropFilter: 'blur(12px)',
                backgroundColor: 'rgba(255, 255, 255, 0.005)'
              }}
            />

            {/* Honeycomb pattern */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <pattern id="honeycomb" width="28" height="49" patternUnits="userSpaceOnUse">
                  <path d="M14 0 L21 4 L21 12 L14 16 L7 12 L7 4 Z" fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="0.5"/>
                  <path d="M0 24.5 L7 28.5 L7 36.5 L0 40.5 L-7 36.5 L-7 28.5 Z" fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="0.5"/>
                  <path d="M28 24.5 L35 28.5 L35 36.5 L28 40.5 L21 36.5 L21 28.5 Z" fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="0.5"/>
                </pattern>
                <linearGradient id="fadeGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="white" stopOpacity="1" />
                  <stop offset="80%" stopColor="white" stopOpacity="0" />
                </linearGradient>
                <mask id="fadeMask">
                  <rect x="0" y="0" width="100%" height="100%" fill="url(#fadeGradient)" />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="url(#honeycomb)" mask="url(#fadeMask)" />
            </svg>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              {/* OE Logo */}
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

              {/* Social Icons */}
              <div className="flex items-center gap-6 scale-[0.88]">
                <a
                  href="https://discord.gg/KnqMF6Ayyc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/42 hover:text-white transition-all hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </a>

                <a
                  href="https://x.com/Over___Exposed"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/42 hover:text-white transition-all hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>

                <a
                  href="https://www.overexposed.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/42 hover:text-white transition-all hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </a>
              </div>
            </div>
        </footer>
      </div>
    </div>
  );
}
