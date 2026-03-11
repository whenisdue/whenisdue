import { requireAdminSession } from '@/lib/admin-session';
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Edit } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // SECURITY: Ensure only authorized admins can see this page
  await requireAdminSession();

  // Fetch all STATE events (the 50 SNAP pages)
  const events = await prisma.event.findMany({
    where: { category: "STATE" },
    orderBy: { title: 'asc' },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      scheduleRules: true,
    }
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Programmatic Data Coverage</h1>
        <p className="text-slate-600">Manage schedule matrices, FAQs, and structured SEO payloads across all states.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">State / Program</th>
                <th className="p-4">Data Status</th>
                <th className="p-4">Last Modified</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((event) => {
                // Determine Completeness: 
                // Our generic seed uses "Group / Identifier" as the first header.
                // If the header is different, we know real data has been injected!
                const rules = event.scheduleRules as any;
                const isComplete = rules?.headers?.[0] && rules.headers[0] !== "Group / Identifier";

                return (
                  <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-semibold text-slate-900">
                      {event.title.replace(" Deposit Schedule 2026", "")}
                    </td>
                    <td className="p-4">
                      {isComplete ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Complete
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-widest bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Needs Data
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(event.updatedAt)}
                    </td>
                    <td className="p-4 text-right">
                      <Link 
                        href={`/admin/events/${event.id}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Data
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}