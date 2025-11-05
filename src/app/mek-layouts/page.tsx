'use client';

import { useState } from 'react';
import MekProfileLightbox from '@/components/MekProfileLightbox';

export default function MekLayoutsPage() {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="text-center">
        {/* Page Title */}
        <h1 className="text-4xl font-bold mb-6 text-yellow-400 uppercase tracking-wider font-orbitron">
          Mek Profile
        </h1>

        {/* Open Lightbox Button */}
        <button
          onClick={() => setIsLightboxOpen(true)}
          className="mek-button-primary px-8 py-4 text-lg font-bold uppercase tracking-wider"
        >
          View Mek Details
        </button>
      </div>

      {/* Lightbox Modal */}
      <MekProfileLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
}
