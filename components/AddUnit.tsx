'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface AdUnitProps {
  slot: string;
  style?: React.CSSProperties;
  minHeight?: string;
}

export default function AdUnit({ slot, style, minHeight = '250px' }: AdUnitProps) {
  const pathname = usePathname();
  const adInited = useRef(false);

  useEffect(() => {
    // Reset the ref on pathname change to allow new push calls for SPA navigation
    adInited.current = false;

    const loadAd = () => {
      try {
        if (typeof window !== 'undefined' && (window as any).adsbygoogle && !adInited.current) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          adInited.current = true;
        }
      } catch (e) {
        console.error("AdSense initialization failed:", e);
      }
    };

    // Delay slightly to ensure hydration is complete and DOM is strictly stable
    const timer = setTimeout(loadAd, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [pathname]); // Crucial dependency for SPA route changes

  return (
    <div 
      className="ad-wrapper w-full my-6 bg-gray-900/20 rounded-xl overflow-hidden" 
      style={{ 
        minHeight, 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        contain: 'layout' // Isolates layout shifts from the rest of the document tree
      }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', ...style }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}