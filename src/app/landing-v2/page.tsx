'use client';

import StarField from '@/components/StarField';

export default function LandingV2() {
  return (
    <div
      className="fixed inset-0 bg-black"
      style={{
        margin: 0,
        padding: 0,
        width: '100vw',
        height: '100vh',
      }}
    >
      <StarField />

      {/* Background Image - Planet */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/colored-bg-1.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          zIndex: 0,
        }}
      />
    </div>
  );
}
