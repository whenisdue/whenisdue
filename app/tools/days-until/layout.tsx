import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Days Until Calculator — When Is Due?",
  description: "Pick a target date and instantly see how many days are left from today.",
};

export default function DaysUntilLayout({ children }: { children: React.ReactNode }) {
  return children;
}
