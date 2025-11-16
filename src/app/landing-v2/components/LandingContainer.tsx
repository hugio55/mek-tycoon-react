import { ReactNode } from 'react';

interface LandingContainerProps {
  children: ReactNode;
  backgroundOpacity: number;
}

export default function LandingContainer({ children, backgroundOpacity }: LandingContainerProps) {
  return (
    <div className="fixed inset-0 bg-black overflow-y-auto">
      <div
        className="fixed inset-0 transition-opacity duration-800 ease-out"
        style={{
          backgroundImage: 'url(/colored-bg-1.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center calc(50% + 0px)',
          opacity: backgroundOpacity,
        }}
      />

      <div className="relative min-h-screen flex flex-col" style={{ zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
}
