import type { Metadata } from "next";
import "./globals.css";
import { GoogleAnalytics } from '@next/third-parties/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: "WhenIsDue | 2026 Food Benefits & EBT Payment Dates",
  description: "Find out exactly when your food benefits or EBT will be deposited in 2026. Official schedules for all 50 states.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50">
        <Header />
        
        {/* 🚀 FIXED: pt-20 ensures hero content isn't hidden under the fixed header */}
        <div className="pt-20 min-h-screen">
          {children}
        </div>

        <Footer />
      </body>
      <GoogleAnalytics gaId="G-XX24XLLQRG" />
    </html>
  );
}