import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhenIsDue | 2026 Benefit Schedules",
  description: "Official payment dates and issuance schedules for 2026.",
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
    </html>
  );
}