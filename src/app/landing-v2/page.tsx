'use client';

import { useState, useEffect } from 'react';
import StarField from '@/components/StarField';
import FillTextButton from '@/components/controls/FillTextButton';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface PhaseCard {
  _id: string;
  title: string;
  description?: string;
  locked: boolean;
  order: number;
}

export default function LandingV2() {
  const [deviceType, setDeviceType] = useState<'macos' | 'iphone' | 'other'>('other');
  const [mounted, setMounted] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const phaseCards = useQuery(api.phaseCards.getAllPhaseCards);

  useEffect(() => {
    setMounted(true);
    const userAgent = navigator.userAgent.toLowerCase();

    if (/iphone|ipod/.test(userAgent)) {
      setDeviceType('iphone');
    } else if (/macintosh|mac os x|ipad/.test(userAgent)) {
      setDeviceType('macos');
    } else {
      setDeviceType('other');
    }

    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleToggle = (index: number, isLocked: boolean) => {
    if (isLocked) return;
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleCardClick = (index: number, isLocked: boolean) => {
    if (isLocked) return;
    setSelectedCardIndex(selectedCardIndex === index ? null : index);
  };

  const displayPhases = phaseCards?.slice(0, 4) || [];

  return (
    <div className="fixed inset-0 bg-black overflow-y-auto">
      <StarField />

      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/colored-bg-1.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center calc(50% + 200px)',
          filter: selectedCardIndex !== null ? 'blur(8px)' : 'none',
          transition: 'filter 300ms ease',
        }}
      />

      <div className="relative min-h-screen flex flex-col" style={{ zIndex: 10 }}>
        {mounted && (
          <div className="flex-1 flex flex-col items-center gap-4 px-4 py-8">
            {deviceType === 'macos' ? (
              <img
                src="/random-images/Everydays_4.gif"
                alt="Mek Tycoon Logo"
                className="max-w-[40vw] max-h-[40vh] object-contain"
              />
            ) : deviceType === 'iphone' ? (
              <img
                src="/random-images/logo GIF.gif"
                alt="Mek Tycoon Logo"
                className="max-w-[80vw] max-h-[80vh] object-contain"
              />
            ) : (
              <video
                autoPlay
                loop
                muted
                playsInline
                className="max-w-[40vw] max-h-[40vh] object-contain"
              >
                <source src="/random-images/Everydays_00000.webm" type="video/webm" />
              </video>
            )}

            <p className="text-white/80 text-xs tracking-wide" style={{ fontFamily: 'Saira, sans-serif' }}>
              An epic idle strategy game where Mekanism NFTs build empires.
            </p>

            <div className="mt-6">
              <FillTextButton text="join beta" fontFamily="Play" />
            </div>

            {isMobile ? (
              <div className="w-full max-w-2xl mt-12 flex flex-col gap-3">
                {displayPhases.map((card: PhaseCard, index: number) => {
                  const isExpanded = expandedIndex === index;
                  const isLocked = card.locked;

                  return (
                    <div key={card._id} className="w-full">
                      <button
                        onClick={() => handleToggle(index, isLocked)}
                        disabled={isLocked}
                        className={`
                          w-full text-left relative overflow-hidden
                          ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                        `}
                        style={{
                          height: '48px',
                          borderRadius: '8px',
                          background: isExpanded
                            ? 'linear-gradient(135deg, rgba(250,182,23,0.15), rgba(250,182,23,0.08))'
                            : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                          backdropFilter: 'blur(4px)',
                          transition: 'all 200ms ease',
                        }}
                      >
                        <div className="h-full flex items-center justify-between px-6">
                          <h3
                            className="text-yellow-400 uppercase tracking-wider font-medium"
                            style={{
                              fontFamily: 'Orbitron, sans-serif',
                              fontSize: '16px',
                            }}
                          >
                            {card.title}
                          </h3>

                          <div
                            style={{
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 200ms ease',
                            }}
                          >
                            {isLocked ? (
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                <path
                                  d="M10 2C7.79 2 6 3.79 6 6V8H5C3.9 8 3 8.9 3 10V16C3 17.1 3.9 18 5 18H15C16.1 18 17 17.1 17 16V10C17 8.9 16.1 8 15 8H14V6C14 3.79 12.21 2 10 2ZM10 4C11.13 4 12 4.87 12 6V8H8V6C8 4.87 8.87 4 10 4ZM10 12C10.55 12 11 12.45 11 13C11 13.55 10.55 14 10 14C9.45 14 9 13.55 9 13C9 12.45 9.45 12 10 12Z"
                                  fill="rgba(250, 182, 23, 0.5)"
                                />
                              </svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                <path
                                  d="M5 8L10 13L15 8"
                                  stroke="rgba(250, 182, 23, 0.7)"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                      </button>

                      <div
                        style={{
                          maxHeight: isExpanded ? '300px' : '0',
                          opacity: isExpanded ? 1 : 0,
                          overflow: 'hidden',
                          transition: 'all 400ms ease',
                        }}
                      >
                        <div
                          className="mt-2 px-6 py-4"
                          style={{
                            background: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: '8px',
                            backdropFilter: 'blur(8px)',
                          }}
                        >
                          <h4
                            className="text-yellow-400 uppercase tracking-wider font-medium mb-3"
                            style={{
                              fontFamily: 'Orbitron, sans-serif',
                              fontSize: '14px',
                            }}
                          >
                            {card.title}
                          </h4>

                          {card.description && (
                            <p
                              className="text-white/75 leading-relaxed"
                              style={{
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '14px',
                              }}
                            >
                              {card.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-12 flex gap-4 justify-center px-4">
                {displayPhases.map((card: PhaseCard) => (
                  <button
                    key={card._id}
                    onClick={() => handleCardClick(card)}
                    disabled={card.locked}
                    className={`
                      relative overflow-hidden
                      ${card.locked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}
                    `}
                    style={{
                      width: '160px',
                      height: '240px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(250,182,23,0.3)',
                      transition: 'all 300ms ease',
                    }}
                  >
                    <div className="h-full flex items-center justify-center">
                      <h3
                        className="text-yellow-400 uppercase tracking-wider font-medium text-center"
                        style={{
                          fontFamily: 'Orbitron, sans-serif',
                          fontSize: '18px',
                        }}
                      >
                        {card.title}
                      </h3>
                    </div>

                    {card.locked && (
                      <div className="absolute top-4 right-4">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path
                            d="M10 2C7.79 2 6 3.79 6 6V8H5C3.9 8 3 8.9 3 10V16C3 17.1 3.9 18 5 18H15C16.1 18 17 17.1 17 16V10C17 8.9 16.1 8 15 8H14V6C14 3.79 12.21 2 10 2ZM10 4C11.13 4 12 4.87 12 6V8H8V6C8 4.87 8.87 4 10 4ZM10 12C10.55 12 11 12.45 11 13C11 13.55 10.55 14 10 14C9.45 14 9 13.55 9 13C9 12.45 9.45 12 10 12Z"
                            fill="rgba(250, 182, 23, 0.5)"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedPhase && (
          <div
            className="fixed inset-0 flex items-center justify-center"
            style={{
              zIndex: 100,
              backdropFilter: 'blur(12px)',
              background: 'rgba(0, 0, 0, 0.7)',
            }}
            onClick={() => setSelectedPhase(null)}
          >
            <div
              className="relative max-w-2xl mx-4"
              style={{
                background: 'rgba(0, 0, 0, 0.9)',
                borderRadius: '16px',
                border: '2px solid rgba(250,182,23,0.5)',
                backdropFilter: 'blur(16px)',
                padding: '48px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPhase(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              <h2
                className="text-yellow-400 uppercase tracking-wider font-medium mb-6"
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '28px',
                }}
              >
                {selectedPhase.title}
              </h2>

              {selectedPhase.description && (
                <p
                  className="text-white/80 leading-relaxed"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                  }}
                >
                  {selectedPhase.description}
                </p>
              )}
            </div>
          </div>
        )}

        <footer
          className="backdrop-blur-md md:backdrop-blur-lg bg-white/10 mt-auto"
          style={{
            zIndex: 20,
            willChange: 'transform',
            transform: 'translateZ(0)'
          }}
        >
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col items-center gap-4">
              <a
                href="https://www.overexposed.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70"
              >
                <img
                  src="/random-images/OE logo.png"
                  alt="OE Logo"
                  className="h-12 w-auto"
                />
              </a>

              <div className="flex items-center gap-6">
                <a
                  href="https://discord.gg/KnqMF6Ayyc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-all hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </a>

                <a
                  href="https://x.com/Over___Exposed"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-all hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>

                <a
                  href="https://www.overexposed.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-all hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
