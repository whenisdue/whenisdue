import type { Metadata } from "next";
import "./globals.css";
import { GoogleAnalytics } from '@next/third-parties/google';

export const metadata: Metadata = {
  title: "WhenIsDue | 2026 Food Benefits & EBT Payment Dates",
  description: "Find out exactly when your food benefits or EBT will be deposited in 2026. We track official schedules for all 50 states.",
};

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
      {/* 🚀 Safely injected without breaking the layout */}
      <GoogleAnalytics gaId="G-XX24XLLQRG" />
    </html>
  );
}