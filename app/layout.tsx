import { GoogleAnalytics } from '@next/third-parties/google';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
      {/* 🚀 This is the modern Next.js way to add GA4 */}
      <GoogleAnalytics gaId="G-XX24XLLQRG" /> 
    </html>
  );
}