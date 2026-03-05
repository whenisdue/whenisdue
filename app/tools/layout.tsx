import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tools | WhenIsDue",
  description:
    "Quick utilities for time math — built to be reliable (timezone-safe) and fast.",
  alternates: { canonical: "/tools" },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
