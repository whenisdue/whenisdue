import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHash, randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { after } from 'next/server';

type Body = {
  pathname?: string;
  slug?: string | null;
};

function normalizePath(pathname: string) {
  if (!pathname) return '/';
  const clean = pathname.split('?')[0].split('#')[0].trim();
  return clean.startsWith('/') ? clean : `/${clean}`;
}

function bucketDateUTC(d = new Date()) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function sha256(input: string) {
  return createHash('sha256').update(input).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const pathname = normalizePath(body.pathname || '/');
    const slug = body.slug ?? pathname.split('/').filter(Boolean).pop() ?? null;

    const cookieStore = await cookies();
    let visitorId = cookieStore.get('vid')?.value;
    let isNewVisitor = false;

    if (!visitorId) {
      visitorId = randomUUID();
      isNewVisitor = true;
    }

    const bucket = bucketDateUTC();
    const dedupeKey = sha256(`${pathname}:${visitorId}:${bucket}`);

    // Background Telemetry Task
    after(async () => {
      try {
        // 1. Ensure aggregate row exists
        await prisma.pageStat.upsert({
          where: { routePath: pathname },
          update: { pageViews: { increment: 1 }, slug },
          create: { routePath: pathname, slug, pageViews: 1 },
        });

        // 2. Increment unique page views only once per route/visitor/day
        await prisma.pageViewDedup.create({
          data: {
            dedupeKey,
            routePath: pathname,
            visitorId,
            bucketDate: bucket,
          },
        });

        // If the create succeeds (no unique constraint violation), it's a unique hit
        await prisma.pageStat.update({
          where: { routePath: pathname },
          data: { uniquePageViews: { increment: 1 } },
        });
      } catch (err: any) {
        // If it's a Prisma unique constraint error (P2002), we safely ignore it.
        // It just means they already visited this page today.
        if (err.code !== 'P2002') {
          console.error("Page view tracking failed:", err);
        }
      }
    });

    const res = NextResponse.json({ ok: true }, { status: 202 });

    // Plant the visitor cookie if they don't have one
    if (isNewVisitor) {
      res.cookies.set('vid', visitorId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }

    return res;
  } catch {
    // Never crash the client over an analytics failure
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}