export function getBaseUrl() {
  // Production / dev override
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;

  // Vercel preview URL (no protocol)
  const vercelUrl =
    process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  // Fallback
  return "https://whenisdue.com";
}