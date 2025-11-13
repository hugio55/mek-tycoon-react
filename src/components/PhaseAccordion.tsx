'use client';

import { useState, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface PhaseAccordionProps {
  phaseHeaderFont?: string;
  phaseHeaderFontSize?: number;
  phaseDescriptionFont?: string;
  phaseDescriptionFontSize?: number;
}

export default function PhaseAccordion({
  phaseHeaderFont = 'Orbitron',
  phaseHeaderFontSize = 16,
  phaseDescriptionFont = 'Inter',
  phaseDescriptionFontSize = 14,
}: PhaseAccordionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const phaseCards = useQuery(api.phaseCards.getAllPhaseCards);

  const handleToggle = (index: number, isLocked: boolean) => {
    if (isLocked) return;

    const newExpanded = expandedIndex === index ? null : index;
    setExpandedIndex(newExpanded);

    // Auto-scroll to show all buttons (mobile only)
    if (newExpanded !== null && window.innerWidth <= 768) {
      setTimeout(() => {
        // Get the first button position
        const firstButton = buttonRefs.current[0];

        if (firstButton) {
          const rect = firstButton.getBoundingClientRect();

          // Scroll so first button is near top of viewport
          // This ensures all 4 buttons + content fit on screen
          if (rect.top < 0 || rect.top > 100) { // If not already at top
            window.scrollBy({
              top: rect.top - 80, // 80px from top (below header)
              behavior: 'smooth'
            });
          }
        }
      }, 200); // Wait for expand animation (180ms + buffer)
    }
  };

  const formatDescription = (text: string) => {
    return text
      .split('\n')
      .map(line => {
        if (line.trim().startsWith('- ')) {
          line = '• ' + line.trim().substring(2);
        }
        line = line.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
        return line;
      })
      .join('<br/>');
  };

  if (!phaseCards || phaseCards.length === 0) {
    return (
      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="text-center text-gray-400 text-sm">Loading phases...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      {phaseCards.map((card, index) => {
        const isExpanded = expandedIndex === index;
        const isLocked = card.locked;

        return (
          <div key={card._id} className="relative">
            <button
              ref={(el) => (buttonRefs.current[index] = el)}
              onClick={() => handleToggle(index, isLocked)}
              disabled={isLocked}
              className={`
                w-full text-left relative overflow-hidden
                ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:scale-[0.985]'}
              `}
              style={{
                height: '46px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'transform 100ms ease-out, opacity 100ms ease-out',
                borderRadius: '8px',
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: isExpanded
                    ? 'linear-gradient(135deg, rgba(250,182,23,0.12), rgba(250,182,23,0.06))'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  transition: 'background 150ms ease-out',
                }}
              />

              <div className="relative h-full flex items-center justify-center px-4">
                <h3
                  style={{
                    fontFamily: phaseHeaderFont,
                    fontSize: `${phaseHeaderFontSize}px`,
                    fontWeight: '500',
                    color: '#fab617',
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                    textShadow: isExpanded ? '0 0 8px rgba(250, 182, 23, 0.25)' : 'none',
                    transition: 'text-shadow 150ms ease-out',
                  }}
                >
                  {card.header || card.title}
                </h3>

                <div
                  style={{
                    position: 'absolute',
                    right: '16px',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 150ms ease-out',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {isLocked ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10 2C7.79 2 6 3.79 6 6V8H5C3.9 8 3 8.9 3 10V16C3 17.1 3.9 18 5 18H15C16.1 18 17 17.1 17 16V10C17 8.9 16.1 8 15 8H14V6C14 3.79 12.21 2 10 2ZM10 4C11.13 4 12 4.87 12 6V8H8V6C8 4.87 8.87 4 10 4ZM10 12C10.55 12 11 12.45 11 13C11 13.55 10.55 14 10 14C9.45 14 9 13.55 9 13C9 12.45 9.45 12 10 12Z"
                        fill="rgba(250, 182, 23, 0.5)"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
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
              ref={(el) => (contentRefs.current[index] = el)}
              style={{
                display: 'grid',
                gridTemplateRows: isExpanded ? '1fr' : '0fr',
                transition: 'grid-template-rows 180ms ease-out',
              }}
            >
              <div style={{ overflow: 'hidden' }}>
                <div
                  className="mt-1 overflow-hidden"
                  style={{
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                    background: 'rgba(0, 0, 0, 0.35)',
                    borderRadius: '8px',
                  }}
                >
                  <div className="px-4 py-3">
                    <h4
                      style={{
                        fontFamily: phaseHeaderFont,
                        fontSize: `${phaseHeaderFontSize}px`,
                        fontWeight: '500',
                        color: '#fab617',
                        letterSpacing: '0.6px',
                        marginBottom: '8px',
                      }}
                    >
                      {card.title}
                    </h4>

                    {card.description && (
                      <div
                        style={{
                          fontFamily: phaseDescriptionFont,
                          fontSize: `${phaseDescriptionFontSize}px`,
                          color: 'rgba(255, 255, 255, 0.75)',
                          lineHeight: '1.6',
                        }}
                        dangerouslySetInnerHTML={{ __html: formatDescription(card.description) }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
