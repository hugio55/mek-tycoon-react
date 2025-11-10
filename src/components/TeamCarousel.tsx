'use client';

import { useEffect, useRef, useState } from 'react';

interface TeamMember {
  name: string;
  role: string;
  imageUrl: string;
}

const TeamCarousel = () => {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  const teamMembers: TeamMember[] = [
    {
      name: 'Chief Engineer',
      role: 'System Architecture',
      imageUrl: 'https://ik.imagekit.io/hbzknb8rt/first_NmYcAzqEe.png?updatedAt=1718530162006',
    },
    {
      name: 'Lead Designer',
      role: 'Visual Development',
      imageUrl: 'https://ik.imagekit.io/hbzknb8rt/second_qc6a_kk7Q.png?updatedAt=1718530162051',
    },
    {
      name: 'Tactical Specialist',
      role: 'Combat Systems',
      imageUrl: 'https://ik.imagekit.io/hbzknb8rt/third_pEumrqiY0.png?updatedAt=1718530162006',
    },
    {
      name: 'Operations Director',
      role: 'Resource Management',
      imageUrl: 'https://ik.imagekit.io/hbzknb8rt/fourth_Vt3aW2HSA.png?updatedAt=1718530161928',
    },
    {
      name: 'Tech Lead',
      role: 'Systems Integration',
      imageUrl: 'https://ik.imagekit.io/hbzknb8rt/fifth_UW3U3lI55.png?updatedAt=1718530161802',
    },
    {
      name: 'Strategic Advisor',
      role: 'Mission Planning',
      imageUrl: 'https://ik.imagekit.io/hbzknb8rt/sixth_8Pp1BUzK5.png?updatedAt=1718530161894',
    },
  ];

  useEffect(() => {
    setMounted(true);

    // Hide scroll indicator after 5 seconds
    const timer = setTimeout(() => {
      setShowScrollIndicator(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateCarousel('prev');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateCarousel('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isAnimating]);

  // Touch gesture handling
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      const swipeDistance = touchStartY.current - touchEndY.current;
      const minSwipeDistance = 50;

      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0) {
          navigateCarousel('next');
        } else {
          navigateCarousel('prev');
        }
      }
    };

    carousel.addEventListener('touchstart', handleTouchStart);
    carousel.addEventListener('touchmove', handleTouchMove);
    carousel.addEventListener('touchend', handleTouchEnd);

    return () => {
      carousel.removeEventListener('touchstart', handleTouchStart);
      carousel.removeEventListener('touchmove', handleTouchMove);
      carousel.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentIndex, isAnimating]);

  const navigateCarousel = (direction: 'next' | 'prev') => {
    if (isAnimating) return;

    setIsAnimating(true);

    if (direction === 'next') {
      setCurrentIndex((prev) => (prev + 1) % teamMembers.length);
    } else {
      setCurrentIndex((prev) => (prev - 1 + teamMembers.length) % teamMembers.length);
    }

    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentIndex) return;

    setIsAnimating(true);
    setCurrentIndex(index);

    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  };

  const getCardClasses = (index: number) => {
    const diff = (index - currentIndex + teamMembers.length) % teamMembers.length;

    if (diff === 0) return 'team-card-center';
    if (diff === 1 || diff === -5) return 'team-card-down-1';
    if (diff === 2 || diff === -4) return 'team-card-down-2';
    if (diff === 5 || diff === -1) return 'team-card-up-1';
    if (diff === 4 || diff === -2) return 'team-card-up-2';
    return 'team-card-hidden';
  };

  if (!mounted) {
    return null;
  }

  const currentMember = teamMembers[currentIndex];

  return (
    <div className="w-full py-16 relative">
      {/* Section Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-yellow-400 text-center uppercase tracking-wider" style={{ fontFamily: 'Orbitron' }}>
          Team Command
        </h2>
        <div className="h-1 w-32 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mt-4" />
      </div>

      {/* Main Carousel Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Carousel Section */}
          <div className="relative flex items-center justify-center min-h-[600px] lg:min-h-[700px]">
            <div ref={carouselRef} className="team-carousel-container relative w-full h-full flex items-center justify-center">
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className={`team-card ${getCardClasses(index)}`}
                  onClick={() => goToSlide(index)}
                  style={{ cursor: index !== currentIndex ? 'pointer' : 'default' }}
                >
                  <img
                    src={member.imageUrl}
                    alt={member.name}
                    className="w-full h-full object-cover rounded-lg"
                  />

                  {/* Industrial corner accents */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-500/70" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-500/70" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-500/70" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-500/70" />
                </div>
              ))}
            </div>

            {/* Navigation Arrows - Desktop Only */}
            <div className="hidden lg:flex flex-col gap-4 absolute left-0 top-1/2 -translate-y-1/2 z-20">
              <button
                onClick={() => navigateCarousel('prev')}
                className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-md border-2 border-yellow-500/50 flex items-center justify-center text-yellow-400 hover:bg-yellow-500 hover:text-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(250,182,23,0.5)] hover:scale-110"
                aria-label="Previous member"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>

              <button
                onClick={() => navigateCarousel('next')}
                className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-md border-2 border-yellow-500/50 flex items-center justify-center text-yellow-400 hover:bg-yellow-500 hover:text-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(250,182,23,0.5)] hover:scale-110"
                aria-label="Next member"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex flex-col justify-center items-center lg:items-start gap-8">
            {/* Member Info */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                <div className="h-px flex-grow bg-gradient-to-r from-transparent to-yellow-500 max-w-[50px]" />
                <h3 className="text-3xl md:text-4xl font-bold text-yellow-400 uppercase tracking-wider transition-all duration-300" style={{ fontFamily: 'Orbitron' }}>
                  {currentMember.name}
                </h3>
                <div className="h-px flex-grow bg-gradient-to-l from-transparent to-yellow-500 max-w-[50px]" />
              </div>

              <p className="text-xl md:text-2xl text-gray-400 tracking-wider uppercase transition-all duration-300">
                {currentMember.role}
              </p>
            </div>

            {/* Navigation Arrows - Mobile Only */}
            <div className="flex lg:hidden gap-4">
              <button
                onClick={() => navigateCarousel('prev')}
                className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-md border-2 border-yellow-500/50 flex items-center justify-center text-yellow-400 hover:bg-yellow-500 hover:text-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(250,182,23,0.5)] hover:scale-110 rotate-90"
                aria-label="Previous member"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>

              <button
                onClick={() => navigateCarousel('next')}
                className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-md border-2 border-yellow-500/50 flex items-center justify-center text-yellow-400 hover:bg-yellow-500 hover:text-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(250,182,23,0.5)] hover:scale-110 rotate-90"
                aria-label="Next member"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Pagination Dots */}
            <div className="flex gap-3">
              {teamMembers.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full border transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-yellow-500 border-yellow-500 shadow-[0_0_15px_rgba(250,182,23,0.6)] scale-125'
                      : 'bg-transparent border-yellow-500/50 hover:bg-yellow-500/30 hover:scale-110'
                  }`}
                  aria-label={`Go to member ${index + 1}`}
                />
              ))}
            </div>

            {/* Scroll Indicator */}
            {showScrollIndicator && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 lg:relative lg:bottom-auto lg:left-auto lg:translate-x-0 flex flex-col items-center gap-2 animate-bounce opacity-70">
                <span className="text-yellow-400/60 text-sm uppercase tracking-wider">Scroll</span>
                <svg className="w-6 h-6 text-yellow-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Styles for 3D Card Stacking */}
      <style jsx>{`
        .team-carousel-container {
          perspective: 1000px;
        }

        .team-card {
          position: absolute;
          width: 450px;
          height: 225px;
          border-radius: 0.5rem;
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          border: 2px solid rgba(250, 182, 23, 0.3);
          overflow: hidden;
        }

        @media (max-width: 640px) {
          .team-card {
            width: 400px;
            height: 180px;
          }
        }

        .team-card-center {
          transform: translateY(0) scale(1.1);
          filter: grayscale(0);
          opacity: 1;
          z-index: 5;
          border-color: rgba(250, 182, 23, 0.6);
          box-shadow: 0 15px 50px rgba(250, 182, 23, 0.3);
        }

        .team-card-down-1 {
          transform: translateY(150px) scale(0.9);
          filter: grayscale(0.3);
          opacity: 0.85;
          z-index: 4;
        }

        .team-card-down-2 {
          transform: translateY(300px) scale(0.8);
          filter: grayscale(0.7);
          opacity: 0.6;
          z-index: 3;
        }

        .team-card-up-1 {
          transform: translateY(-150px) scale(0.9);
          filter: grayscale(0.3);
          opacity: 0.85;
          z-index: 4;
        }

        .team-card-up-2 {
          transform: translateY(-300px) scale(0.8);
          filter: grayscale(0.7);
          opacity: 0.6;
          z-index: 3;
        }

        .team-card-hidden {
          transform: translateY(500px) scale(0.5);
          opacity: 0;
          z-index: 1;
        }

        @media (max-width: 1024px) {
          .team-card-down-1 {
            transform: translateY(120px) scale(0.9);
          }

          .team-card-down-2 {
            transform: translateY(240px) scale(0.8);
          }

          .team-card-up-1 {
            transform: translateY(-120px) scale(0.9);
          }

          .team-card-up-2 {
            transform: translateY(-240px) scale(0.8);
          }
        }

        @media (max-width: 640px) {
          .team-card-down-1 {
            transform: translateY(100px) scale(0.9);
          }

          .team-card-down-2 {
            transform: translateY(200px) scale(0.8);
          }

          .team-card-up-1 {
            transform: translateY(-100px) scale(0.9);
          }

          .team-card-up-2 {
            transform: translateY(-200px) scale(0.8);
          }
        }
      `}</style>
    </div>
  );
};

export default TeamCarousel;
