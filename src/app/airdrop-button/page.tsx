'use client';

import React from 'react';
import HolographicButton from '@/components/ui/IndustrialButtons/HolographicButton';

export default function AirdropButtonTestPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-xs mx-auto">
        <HolographicButton
          text="Claim Your NFT"
          onClick={() => console.log('Claim clicked')}
          isActive={true}
          variant="yellow"
          alwaysOn={true}
          hideIcon={true}
          className="w-full [&>div]:h-full [&>div>div]:h-full [&>div>div]:!py-3 [&>div>div]:!px-6 [&_span]:!text-base [&_span]:!tracking-[0.15em]"
        />

        <p className="mt-6 text-center text-gray-500 text-sm">
          Test page - HolographicButton with particle effects
        </p>
      </div>
    </div>
  );
}
