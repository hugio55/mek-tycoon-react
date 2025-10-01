'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MekGoldMiningRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the actual gold mining page
    router.replace('/mek-rate-logging');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-yellow-400 text-xl">Redirecting to Gold Mining System...</div>
    </div>
  );
}