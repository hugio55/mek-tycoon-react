'use client';

import { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface ArtPiece {
  id: number;
  title: string;
  artist: string;
  price: string;
  badge?: string;
  imageUrl: string;
}

const EmotionsSlider = () => {
  const [mounted, setMounted] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const artPieces: ArtPiece[] = [
    {
      id: 1,
      title: 'The Dream',
      artist: 'Kristina Makeeva',
      price: '2000 ADA',
      badge: 'Popular Now',
      imageUrl: 'https://bato-web-agency.github.io/DigitalArt/images/the-dream.webp',
    },
    {
      id: 2,
      title: 'Where Do We Go From Here?',
      artist: 'Felicia Simion',
      price: '3200 ADA',
      imageUrl: 'https://bato-web-agency.github.io/DigitalArt/images/where-do-we-go-from-here.webp',
    },
    {
      id: 3,
      title: 'Life Goes On',
      artist: 'Ashley Taylor',
      price: '1750 ADA',
      badge: 'New',
      imageUrl: 'https://bato-web-agency.github.io/DigitalArt/images/life-goes-on.webp',
    },
    {
      id: 4,
      title: 'My Soul Is Forever Yours',
      artist: 'Brooke Cagle',
      price: '4000 ADA',
      imageUrl: 'https://bato-web-agency.github.io/DigitalArt/images/my-soul-is-forever-yours.webp',
    },
    {
      id: 5,
      title: 'Going Crazy',
      artist: 'Drew Dizzy Graham',
      price: '2800 ADA',
      imageUrl: 'https://bato-web-agency.github.io/DigitalArt/images/going-crazy.webp',
    },
    {
      id: 6,
      title: 'Rage',
      artist: 'Rhand McCoy',
      price: '3500 ADA',
      badge: 'Hot',
      imageUrl: 'https://bato-web-agency.github.io/DigitalArt/images/rage.webp',
    },
    {
      id: 7,
      title: 'Calm Refuge',
      artist: 'Luemen Rutkowski',
      price: '2200 ADA',
      imageUrl: 'https://bato-web-agency.github.io/DigitalArt/images/calm-refuge.webp',
    },
    {
      id: 8,
      title: 'Leave Me Alone',
      artist: 'Charbel Saade',
      price: '1900 ADA',
      imageUrl: 'https://bato-web-agency.github.io/DigitalArt/images/leave-me-alone.webp',
    },
    {
      id: 9,
      title: 'Disillusion',
      artist: 'Giulia Bertelli',
      price: '2600 ADA',
      badge: 'Trending',
      imageUrl: 'https://bato-web-agency.github.io/DigitalArt/images/disillusion.webp',
    },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <div className="w-full py-16 relative">
      {/* Section Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-yellow-400 text-center uppercase tracking-wider" style={{ fontFamily: 'Orbitron' }}>
          Featured Collection
        </h2>
        <div className="h-1 w-32 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mt-4" />
      </div>

      {/* Swiper Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={30}
          slidesPerView={1}
          navigation={{
            prevEl: '.custom-swiper-button-prev',
            nextEl: '.custom-swiper-button-next',
          }}
          pagination={{
            el: '.custom-swiper-pagination',
            clickable: true,
          }}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          loop={true}
          breakpoints={{
            640: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 30,
            },
          }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          className="pb-16"
        >
          {artPieces.map((piece) => (
            <SwiperSlide key={piece.id}>
              <div className="group relative">
                {/* Card with industrial styling */}
                <div className="relative h-[400px] rounded-lg overflow-hidden border-2 border-yellow-500/30 bg-black/60 backdrop-blur-sm transition-all duration-300 hover:border-yellow-500/60 hover:shadow-[0_0_30px_rgba(250,182,23,0.3)]">
                  {/* Badge */}
                  {piece.badge && (
                    <div className="absolute top-4 left-4 z-10 bg-yellow-500/90 text-black px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                      {piece.badge}
                    </div>
                  )}

                  {/* Image Container */}
                  <div className="relative h-[280px] overflow-hidden">
                    <img
                      src={piece.imageUrl}
                      alt={piece.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

                    {/* Grunge overlay */}
                    <div className="absolute inset-0 bg-[url('/textures/scratches.png')] opacity-10 mix-blend-overlay pointer-events-none" />
                  </div>

                  {/* Content Area */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent">
                    {/* Title */}
                    <h3 className="text-lg font-bold text-yellow-400 mb-1 uppercase tracking-wide" style={{ fontFamily: 'Orbitron' }}>
                      {piece.title}
                    </h3>

                    {/* Artist */}
                    <p className="text-sm text-gray-400 mb-2 tracking-wider">
                      by {piece.artist}
                    </p>

                    {/* Bottom Row - Price and Button */}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-yellow-500 font-bold text-lg">
                        {piece.price}
                      </span>

                      <button className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-4 py-2 rounded text-sm font-bold uppercase tracking-wider hover:bg-yellow-500 hover:text-black transition-all duration-300 hover:shadow-[0_0_15px_rgba(250,182,23,0.5)]">
                        View More
                      </button>
                    </div>
                  </div>

                  {/* Industrial corner accents */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-500/50" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-500/50" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-500/50" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-500/50" />
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Navigation Buttons */}
        <button
          className="custom-swiper-button-prev absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/80 backdrop-blur-md border-2 border-yellow-500/50 flex items-center justify-center text-yellow-400 hover:bg-yellow-500 hover:text-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(250,182,23,0.5)] hover:scale-110 -translate-x-1/2"
          aria-label="Previous slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          className="custom-swiper-button-next absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/80 backdrop-blur-md border-2 border-yellow-500/50 flex items-center justify-center text-yellow-400 hover:bg-yellow-500 hover:text-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(250,182,23,0.5)] hover:scale-110 translate-x-1/2"
          aria-label="Next slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Custom Pagination */}
        <div className="custom-swiper-pagination flex justify-center gap-2 mt-8" />
      </div>

      {/* Custom Pagination Styling */}
      <style jsx global>{`
        .custom-swiper-pagination .swiper-pagination-bullet {
          width: 12px;
          height: 12px;
          background-color: rgba(250, 182, 23, 0.3);
          opacity: 1;
          border: 1px solid rgba(250, 182, 23, 0.5);
          transition: all 0.3s ease;
        }

        .custom-swiper-pagination .swiper-pagination-bullet-active {
          background-color: rgb(250, 182, 23);
          box-shadow: 0 0 15px rgba(250, 182, 23, 0.6);
          transform: scale(1.3);
        }

        .custom-swiper-pagination .swiper-pagination-bullet:hover {
          background-color: rgba(250, 182, 23, 0.6);
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default EmotionsSlider;
