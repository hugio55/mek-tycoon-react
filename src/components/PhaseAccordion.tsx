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
  phaseHeaderFontSize = 24,
  phaseDescriptionFont = 'Arial',
  phaseDescriptionFontSize = 16,
}: PhaseAccordionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  const phaseCards = useQuery(api.phaseCards.getAllPhaseCards);

  const handleToggle = (index: number, isLocked: boolean) => {
    if (isLocked) return;
    setExpandedIndex(prev => prev === index ? null : index);
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
      <div className="flex flex-col gap-3 px-4 py-6">
        <div className="text-center text-gray-400">Loading phases...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-6">
      {phaseCards.map((card, index) => {
        const isExpanded = expandedIndex === index;
        const isLocked = card.locked;

        return (
          <div
            key={card._id}
            className="relative overflow-hidden rounded-lg"
            style={{
              transition: 'all 300ms ease-out',
            }}
          >
            <button
              onClick={() => handleToggle(index, isLocked)}
              disabled={isLocked}
              className={`
                w-full text-left
                relative
                ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
              `}
              style={{
                minHeight: '44px',
                touchAction: 'manipulation',
              }}
            >
              <div
                className="relative"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: isExpanded ? 'rgba(250,182,23,1)' : 'rgba(250,182,23,0.5)',
                  borderRadius: '0.5rem',
                  boxShadow: isExpanded
                    ? '0 10px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
                    : '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                  transition: 'border-color 300ms ease-out, box-shadow 300ms ease-out',
                  padding: '1rem',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <h3
                      className="text-[#fab617] tracking-wide uppercase"
                      style={{
                        fontFamily: phaseHeaderFont,
                        fontSize: `${phaseHeaderFontSize}px`,
                        fontWeight: 'bold',
                        textShadow: '0 0 10px rgba(250, 182, 23, 0.5)',
                      }}
                    >
                      {card.header || card.title}
                    </h3>
                    {card.subtitle && (
                      <p
                        className="text-gray-300/70 text-sm mt-1"
                        style={{
                          fontFamily: phaseDescriptionFont,
                        }}
                      >
                        {card.subtitle}
                      </p>
                    )}
                  </div>

                  <div
                    className="flex-shrink-0"
                    style={{
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 300ms ease-out',
                    }}
                  >
                    {isLocked ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 2C7.79 2 6 3.79 6 6V8H5C3.9 8 3 8.9 3 10V16C3 17.1 3.9 18 5 18H15C16.1 18 17 17.1 17 16V10C17 8.9 16.1 8 15 8H14V6C14 3.79 12.21 2 10 2ZM10 4C11.13 4 12 4.87 12 6V8H8V6C8 4.87 8.87 4 10 4ZM10 12C10.55 12 11 12.45 11 13C11 13.55 10.55 14 10 14C9.45 14 9 13.55 9 13C9 12.45 9.45 12 10 12Z"
                          fill="rgba(250, 182, 23, 0.6)"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5 8L10 13L15 8"
                          stroke="rgba(250, 182, 23, 0.8)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </button>

            <div
              ref={(el) => (contentRefs.current[index] = el)}
              style={{
                maxHeight: isExpanded ? '1000px' : '0px',
                overflow: 'hidden',
                transition: 'max-height 300ms ease-out',
                transform: 'translateZ(0)',
              }}
            >
              <div
                className="px-4 py-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.5), rgba(0,0,0,0.7))',
                  borderWidth: '0 2px 2px 2px',
                  borderStyle: 'solid',
                  borderColor: 'rgba(250,182,23,0.5)',
                  borderRadius: '0 0 0.5rem 0.5rem',
                  marginTop: '-0.5rem',
                }}
              >
                {card.imageUrl && (
                  <div
                    className="mb-4 rounded overflow-hidden"
                    style={{
                      aspectRatio: '16/9',
                      background: `url(${card.imageUrl}) center/cover`,
                      filter: 'grayscale(30%)',
                    }}
                  />
                )}

                <h4
                  className="text-[#fab617] mb-2 font-bold tracking-wide"
                  style={{
                    fontFamily: phaseHeaderFont,
                    fontSize: `${phaseHeaderFontSize * 0.75}px`,
                  }}
                >
                  {card.title}
                </h4>

                {card.description && (
                  <div
                    className="text-white/90 leading-relaxed"
                    style={{
                      fontFamily: phaseDescriptionFont,
                      fontSize: `${phaseDescriptionFontSize}px`,
                    }}
                    dangerouslySetInnerHTML={{ __html: formatDescription(card.description) }}
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
