import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Date Difference Engine | WhenIsDue Tools",
  description:
    "Compare two dates and see the gap in days, weeks, hours, and minutes.",
  alternates: { canonical: "/tools/date-difference" },
};

export default function DateDifferenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
