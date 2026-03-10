'use client';

import Link from "next/link";
import { motion } from "framer-motion";

type SeriesClientUIProps = {
  series: {
    title: string;
    description: string | null;
    events: Array<{
      id: string;
      slug: string;
      title: string;
      category: string;
      dueAt: Date | string | null;
    }>;
  };
};

function categoryToSlug(category: string) {
  return category.toLowerCase();
}

function categoryToLabel(category: string) {
  return category
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function SeriesClientUI({ series }: SeriesClientUIProps) {
  return (
    <main className="min-h-screen bg-black text-zinc-100 selection:bg-emerald-500/30">
      <section className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[2.5rem] border border-white/[0.08] bg-zinc-900/40 p-8 backdrop-blur-2xl sm:p-12"
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-[100px]" />

          <div className="relative z-10">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4 inline-block text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/80"
            >
              Intelligence Series
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl"
            >
              {series.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl"
            >
              {series.description ||
                "Synthesizing real-time data for high-impact milestones in this sector."}
            </motion.p>

            <div className="mt-10 flex flex-wrap gap-4 border-t border-white/[0.05] pt-10">
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-6 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Active Events
                </p>
                <p className="text-2xl font-black text-emerald-400">
                  {series.events.length}
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-6 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Status
                </p>
                <p className="text-2xl font-black text-zinc-100">Verified</p>
              </div>
            </div>
          </div>
        </motion.div>

        <section className="mt-20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mb-8 text-xs font-black uppercase tracking-[0.4em] text-zinc-600"
          >
            Operational Timeline
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1 } },
            }}
            className="grid gap-4"
          >
            {series.events.map((event) => (
              <Link
                key={event.id}
                href={`/${categoryToSlug(event.category)}/${event.slug}`}
                className="group block"
              >
                <motion.article
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 },
                  }}
                  className="relative flex items-center justify-between overflow-hidden rounded-3xl border border-white/[0.05] bg-zinc-900/30 p-6 transition-all duration-300 hover:border-emerald-500/30 hover:bg-zinc-900/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)]"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-emerald-500/70 transition-colors">
                      {categoryToLabel(event.category)}
                    </span>
                    <h3 className="text-xl font-bold text-zinc-100">
                      {event.title}
                    </h3>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-black tracking-tighter text-zinc-400 group-hover:text-white">
                      {event.dueAt
                        ? new Date(event.dueAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "TBA"}
                    </p>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-full w-1/3 bg-emerald-500/50" />
                    </div>
                  </div>
                </motion.article>
              </Link>
            ))}
          </motion.div>
        </section>
      </section>
    </main>
  );
}
