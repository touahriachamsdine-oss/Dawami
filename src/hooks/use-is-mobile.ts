'use client';
import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768; // You can adjust this value

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Set the initial value after the component mounts
    checkScreenSize();
    
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Return the actual value only after it's been determined.
  // Before that, it's undefined, so consumers can choose to show a loading state.
  return isMobile;
}
