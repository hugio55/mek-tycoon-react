'use client';

import { useEffect } from 'react';

export default function LandingV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Hide navigation bar when this layout mounts
    const navElements = document.querySelectorAll('nav, [class*="NavigationBar"], [class*="navigation"]');
    navElements.forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });

    // Restore navigation when component unmounts
    return () => {
      const navElements = document.querySelectorAll('nav, [class*="NavigationBar"], [class*="navigation"]');
      navElements.forEach(el => {
        (el as HTMLElement).style.display = '';
      });
    };
  }, []);

  return <>{children}</>;
}
