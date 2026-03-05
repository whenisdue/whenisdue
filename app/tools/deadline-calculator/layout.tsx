import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "When Should I Start? | WhenIsDue Tools",
  description:
    "Enter your deadline and how long the work takes — get the start date.",
  alternates: { canonical: "/tools/deadline-calculator" },
};

export default function DeadlineCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
