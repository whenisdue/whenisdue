import { getRelatedEvents } from "@/lib/recommendations";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";

export default async function RelatedEventsSection({ currentEvent }: { currentEvent: any }) {
  const recommendations = await getRelatedEvents(currentEvent);

  if (recommendations.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-zinc-900">
      <div className="flex items-center gap-2 mb-8">
        <Layers className="w-5 h-5 text-emerald-500" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">People Also Track</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {recommendations.map((rel: any) => (
          <Link key={rel.id} href={`/${rel.category.toLowerCase()}/${rel.slug}`} className="group bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 p-5 rounded-2xl transition-all">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2 block">{rel.category}</span>
            <h3 className="text-sm font-bold text-zinc-100 group-hover:text-white mb-3 line-clamp-1">{rel.title}</h3>
            <div className="flex items-center justify-between text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
              <span>View Tracking</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}