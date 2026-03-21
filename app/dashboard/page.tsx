import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns"; // Standardizing our dates
import { 
  LayoutDashboard, 
  Bell, 
  PlusCircle, 
  LogOut, 
  ShieldCheck,
  CalendarDays,
  User as UserIcon
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  // 1. SECURITY: If not logged in, go to login
  if (!session?.user) {
    redirect("/login");
  }

  // 2. DATA: Get only THIS user's saved benefits
  const subscriptions = await prisma.subscription.findMany({
    where: { subscriberId: session.user.id },
    orderBy: { createdAt: 'desc' }
  });

  // 3. FALLBACKS: Handle missing names/images
  const firstName = session.user.name?.split(' ')[0] ?? "Operator";
  const userImage = session.user.image;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="flex">
        {/* SIDEBAR */}
        <aside className="hidden md:flex w-72 bg-white border-r border-slate-200 h-screen sticky top-0 flex-col p-8">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-black text-slate-900 tracking-tight text-xl text-nowrap">WhenIsDue.</span>
          </div>

          <nav className="space-y-2 flex-grow">
            <a href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black text-sm">
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </a>
            <a href="/states" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-900 rounded-2xl font-bold text-sm transition-colors">
              <PlusCircle className="w-4 h-4" />
              Add Tracker
            </a>
          </nav>

          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
            <button className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-600 rounded-2xl font-bold text-sm transition-colors w-full">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-grow p-6 md:p-12">
          <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                Welcome back, {firstName}
              </h1>
              <p className="text-slate-500 font-medium">Monitoring your personalized 2026 issuance windows.</p>
            </div>
            
            <div className="flex items-center gap-3 bg-white p-2 pr-6 border border-slate-200 rounded-full shadow-sm w-fit">
              {userImage ? (
                <img src={userImage} className="w-10 h-10 rounded-full" alt="Profile" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Active ID</p>
                <p className="text-xs font-bold text-slate-700 leading-none">{session.user.email}</p>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* TRACKER LIST */}
            <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-10">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-xl font-black text-slate-900">Tracked Schedules</h2>
                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {subscriptions.length} Active
                </span>
              </div>

              {subscriptions.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <CalendarDays className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold mb-6">No benefit trackers configured yet.</p>
                  <a href="/states" className="inline-block bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-blue-600 transition-all">
                    Find My State
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{sub.stateCode} {sub.programCode}</p>
                        <p className="font-black text-slate-900">Last Case Digit: {sub.identifierValue}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expected Deposit</p>
                        <p className="font-black text-slate-900">
                          {format(new Date(sub.nextDepositDate), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AUDIT LOG */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden h-fit">
               <h2 className="text-xl font-black mb-10">Audit Intelligence</h2>
               <div className="space-y-6 relative z-10">
                 <div className="flex gap-4 items-start">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                   <p className="text-xs text-slate-400 leading-relaxed font-medium">
                     <span className="text-blue-400 font-bold uppercase tracking-tighter">Sync:</span> 2026-03-21 regional manuals verified for AL and FL.
                   </p>
                 </div>
                 <div className="flex gap-4 items-start">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                   <p className="text-xs text-slate-400 leading-relaxed font-medium">
                     <span className="text-green-400 font-bold uppercase tracking-tighter">Status:</span> Bitemporal auditing active. Holiday offsets applied.
                   </p>
                 </div>
               </div>
               <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl -mb-20 -mr-20" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}