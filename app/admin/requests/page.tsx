import { prisma } from "@/lib/prisma";
import { Check, X, ExternalLink, Clock } from "lucide-react";
import { approveSubmission, rejectSubmission } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  // Fetch pending requests
  const pendingSubmissions = await prisma.eventSubmission.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black tracking-tighter mb-8 flex items-center gap-3">
          <Clock className="w-8 h-8 text-emerald-500" />
          Event Request Queue
        </h1>

        {pendingSubmissions.length === 0 ? (
          <div className="p-10 border border-zinc-800 rounded-3xl text-center text-zinc-500">
            No pending requests. You're all caught up!
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingSubmissions.map((sub) => (
              <div key={sub.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center hover:border-zinc-700 transition-colors">
                
                {/* Data Section */}
                <div>
                  <h2 className="text-xl font-bold text-zinc-100 mb-2">{sub.submittedTitle}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-500 uppercase tracking-widest">
                    <span>Date: <span className="text-emerald-400">{sub.submittedDate || "Unknown"}</span></span>
                    {sub.submittedSource && (
                      <a href={sub.submittedSource} target="_blank" className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
                        Source <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* --- GCA MERGED ACTION SECTION --- */}
                <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                  
                  {/* Reject Form */}
                  <form action={rejectSubmission.bind(null, sub.id)} className="flex-1 md:flex-none">
                    <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/50 rounded-xl transition-all">
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </form>

                  {/* Approve Form */}
                  <form action={approveSubmission.bind(null, sub.id)} className="flex-1 md:flex-none">
                    <button type="submit" className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold border border-emerald-500 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <Check className="w-4 h-4" /> Approve
                    </button>
                  </form>

                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}