import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

export const alt = 'WhenIsDue Countdown';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// 1. Module-Scope Font Fetch (Reused across warm isolates)
const fontDataPromise = fetch(
  new URL('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf')
).then((res) => res.arrayBuffer());

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const event = await prisma.event.findUnique({
    where: { slug: slug.toLowerCase() },
    select: { title: true, category: true, dueAt: true }
  });

  if (!event) return new Response('Not Found', { status: 404 });

  // 2. Bucket the State
  const daysRemaining = event.dueAt 
    ? Math.max(0, Math.ceil((event.dueAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : "TBA";

  // 3. Grapheme-Safe Truncation (Prevents splitting emoji or CJK characters)
  const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
  const graphemes = Array.from(seg.segment(event.title)).map(x => x.segment);
  const safeTitle = graphemes.length > 55 ? graphemes.slice(0, 52).join('') + '...' : event.title;

  const fontData = await fontDataPromise;

  const image = new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          backgroundImage: 'radial-gradient(circle at 50% 50%, #10b98120 0%, #000 100%)',
          padding: '80px',
          fontFamily: '"Inter"',
        }}
      >
        {/* Category Badge */}
        <div style={{
          display: 'flex',
          fontSize: 24,
          fontWeight: 900,
          color: '#10b981',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          marginBottom: 30
        }}>
          {event.category}
        </div>

        {/* Title */}
        <div style={{
          display: 'flex',
          fontSize: 76,
          fontWeight: 900,
          color: '#fff',
          textAlign: 'center',
          lineHeight: 1.1,
          marginBottom: 60
        }}>
          {safeTitle}
        </div>

        {/* Countdown Box */}
        <div style={{
          display: 'flex',
          backgroundColor: '#111',
          border: '2px solid #222',
          borderRadius: '32px',
          padding: '30px 80px',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 96, fontWeight: 900, color: '#10b981', lineHeight: 1, marginBottom: 10 }}>
              {daysRemaining}
            </span>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {daysRemaining === 'TBA' ? 'Status' : 'Days Remaining'}
            </span>
          </div>
        </div>

        {/* Branding */}
        <div style={{
          position: 'absolute',
          bottom: 60,
          display: 'flex',
          fontSize: 24,
          fontWeight: 900,
          color: '#444',
          letterSpacing: '0.1em'
        }}>
          WHENISDUE.COM
        </div>
      </div>
    ),
    { 
      ...size,
      fonts: [{ name: 'Inter', data: fontData, weight: 900, style: 'normal' }]
    }
  );

  // 4. Aggressive Edge Caching with SWR
  image.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  // Cache at the CDN for 1 hour, serve stale up to 24 hours while regenerating
  image.headers.set('CDN-Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  return image;
}