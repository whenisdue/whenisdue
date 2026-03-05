'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

// This tells TypeScript that Google AdSense will exist on the window object
declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

interface AdUnitProps {
  slot: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function AdUnit({ slot, className, style }: AdUnitProps) {
  const pathname = usePathname();
  const adRef = useRef<HTMLModElement>(null);
  const [status, setStatus] = useState<'loading' | 'filled' | 'unfilled'>('loading');

  useEffect(() => {
    // Reset status on route change
    setStatus('loading');
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && window.adsbygoogle) {
          try {
            // Guard against duplicate pushes in React 19 Strict Mode
            if (!adRef.current?.getAttribute('data-adsbygoogle-status')) {
              (window.adsbygoogle = window.adsbygoogle || []).push({});
            }
          } catch (e) {
            console.error("AdSense push failed:", e);
          }
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Load 200px before it enters viewport
    );

    if (adRef.current) observer.observe(adRef.current);

    // MutationObserver to detect if AdSense actually filled the slot
    const statusObserver = new MutationObserver(() => {
      const adStatus = adRef.current?.getAttribute('data-ad-status');
      if (adStatus === 'filled') setStatus('filled');
      if (adStatus === 'unfilled') setStatus('unfilled');
    });

    if (adRef.current) {
      statusObserver.observe(adRef.current, { attributes: true, attributeFilter: ['data-ad-status'] });
    }

    return () => {
      observer.disconnect();
      statusObserver.disconnect();
    };
  }, [pathname]);

  // If the ad fails to fill, we collapse the container to maintain UX
  if (status === 'unfilled') return null;

  return (
    <div 
      className={`ad-container w-full mx-auto my-8 flex flex-col items-center ${className}`}
      style={{ contain: 'layout' }} // Prevents ad internal shifts from affecting the whole page
    >
      <span className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Advertisement</span>
      
      <div className="w-full bg-zinc-900/50 rounded-xl overflow-hidden min-h-[100px] sm:min-h-[120px] md:min-h-[250px] lg:min-h-[280px]">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={style || { display: 'block' }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}