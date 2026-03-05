import Link from "next/link";

type ToolCard = {
  title: string;
  href: string;
  description: string;
  badge?: string;
};

const tools: ToolCard[] = [
  {
    title: "Days Until",
    href: "/tools/days-until",
    description: "The cleanest countdown from today.",
    badge: "Countdown",
  },
  {
    title: "When Should I Start?",
    href: "/tools/deadline-calculator",
    description: "Count backward from a deadline.",
    badge: "Planner",
  },
  {
    title: "Buffer Days",
    href: "/tools/buffer-days",
    description: "Add safety days so you don’t cut it close.",
    badge: "Safety",
  },
  {
    title: "Date Difference",
    href: "/tools/date-difference",
    description: "Compare two dates.",
    badge: "Calculator",
  },
];

export default function ToolsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Tools</h1>
      <p className="mt-2 text-sm opacity-75">
        Quiet utilities for time math — built to be reliable (timezone-safe) and fast.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {tools.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.05]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-base font-semibold tracking-tight">{t.title}</div>
              {t.badge ? (
                <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-xs opacity-80">
                  {t.badge}
                </span>
              ) : null}
            </div>

            <div className="mt-2 text-sm opacity-75 leading-relaxed">{t.description}</div>

            <div className="mt-4 text-sm opacity-70 group-hover:opacity-100 transition">
              Open →
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 text-xs opacity-55">
        Tip: These tools use local midnight parsing to avoid timezone drift.
      </div>
    </main>
  );
}
