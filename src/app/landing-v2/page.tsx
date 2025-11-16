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
  const [titleFont, setTitleFont] = useState('Play');
  const [descFont, setDescFont] = useState('Saira');

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
        className="fixed inset-0"
        style={{
          backgroundImage: 'url(/colored-bg-1.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center calc(50% + 0px)',
          filter: expandedIndex !== null ? 'blur(4px)' : 'blur(0px)',
          transition: 'filter 500ms ease-in-out',
        }}
      />

      <div className="relative min-h-screen flex flex-col" style={{ zIndex: 10 }}>
        {mounted && (
          <div className="flex-1 flex flex-col items-center justify-center pb-8 pt-[20vh]">
            {/* Logo - centered slightly above middle */}
            <div className="flex items-center justify-center">
              {deviceType === 'macos' || deviceType === 'iphone' ? (
                <img
                  src="/random-images/Everydays_4.gif"
                  alt="Mek Tycoon Logo"
                  className={deviceType === 'iphone' ? 'max-w-[80vw] max-h-[80vh] object-contain' : 'max-w-[40vw] max-h-[40vh] object-contain'}
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
            </div>

            {/* Description - closer to logo */}
            <p className="text-white/80 text-sm tracking-wide mt-6" style={{ fontFamily: 'Saira, sans-serif' }}>
              An epic idle strategy game where Mekanism NFTs build empires.
            </p>

            {/* Join Beta button - 20% smaller, closer to description */}
            <div className="mt-8" style={{ transform: 'scale(0.8)' }}>
              <FillTextButton text="join beta" fontFamily="Play" />
            </div>

            {/* Phase cards - small gap below button */}
            <div className="w-full max-w-[680px] mx-auto mt-12 mb-[200px] flex flex-col gap-3">
              {displayPhases.map((card: PhaseCard, index: number) => {
                const isExpanded = expandedIndex === index;
                const isLocked = card.locked;
                const phaseLabel = `Phase ${['I', 'II', 'III', 'IV'][index]}`;

                return (
                  <div key={card._id} className="w-full">
                    <button
                      onClick={() => handleToggle(index, isLocked)}
                      disabled={isLocked}
                      className={`
                        w-full text-left relative overflow-hidden
                        ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'}
                      `}
                      style={{
                        height: '48px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                        backdropFilter: 'blur(4px)',
                        transition: 'all 200ms ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isLocked) {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLocked) {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))';
                        }
                      }}
                    >
                      <div className="h-full flex items-center justify-between px-6">
                        <h3
                          className="text-white uppercase tracking-wider font-medium"
                          style={{
                            fontFamily: 'Saira, sans-serif',
                            fontSize: '16px',
                          }}
                        >
                          {phaseLabel}
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
                        maxHeight: isExpanded ? '500px' : '0',
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
                            fontFamily: 'Saira, sans-serif',
                            fontSize: '16px',
                          }}
                        >
                          {card.title}
                        </h4>

                        {card.description && (
                          <p
                            className="text-white/75 leading-relaxed"
                            style={{
                              fontFamily: 'Play, sans-serif',
                              fontSize: '13px',
                              whiteSpace: 'pre-line',
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
          </div>
        )}

        <footer
          className="backdrop-blur-md md:backdrop-blur-lg bg-white/10 mt-auto relative overflow-hidden w-full"
          style={{ zIndex: 20, margin: 0 }}
        >
          {/* Honeycomb Pattern */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <pattern id="honeycomb" width="28" height="49" patternUnits="userSpaceOnUse">
                <path d="M14 0 L21 4 L21 12 L14 16 L7 12 L7 4 Z" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5"/>
                <path d="M0 24.5 L7 28.5 L7 36.5 L0 40.5 L-7 36.5 L-7 28.5 Z" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5"/>
                <path d="M28 24.5 L35 28.5 L35 36.5 L28 40.5 L21 36.5 L21 28.5 Z" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5"/>
              </pattern>
              <linearGradient id="fadeGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="white" stopOpacity="1" />
                <stop offset="60%" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <mask id="fadeMask">
                <rect x="0" y="0" width="100%" height="100%" fill="url(#fadeGradient)" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="url(#honeycomb)" mask="url(#fadeMask)" />
          </svg>

          <div className="container mx-auto px-6 py-8 relative">
            <div className="flex flex-col items-center gap-4">
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
