"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MailWarning, ShieldCheck, Globe, LogOut, UserCircle } from "lucide-react";

// Props interface to handle verified session ID and failure counts
interface AdminSidebarProps {
  operatorId: string;
  initialFailureCount?: number;
}

export function AdminSidebar({ operatorId, initialFailureCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Notifications", href: "/admin/notifications", icon: MailWarning },
    { name: "Audit Trail", href: "/admin/audit", icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 sticky top-0 h-screen">
      
      {/* HEADER: Command Branding */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3 text-white">
        <div className="bg-blue-600 p-1.5 rounded-lg">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <span className="font-black text-xl uppercase tracking-widest leading-none">Command</span>
      </div>
      
      {/* NAVIGATION: Active-state aware links */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          // Highlight logic: Exact match for /admin, startsWith for others to catch nested routes
          const isActive = item.href === '/admin' 
            ? pathname === '/admin' 
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all group ${
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                  : "hover:bg-slate-800 hover:text-white text-slate-400"
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400"}`} />
              <span className="flex-1">{item.name}</span>

              {/* DYNAMIC FAILURE BADGE: ML-AUTO fixed for alignment */}
              {item.name === "Notifications" && initialFailureCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] leading-none px-1.5 py-1 rounded-full font-black animate-pulse shadow-sm shadow-red-900 ml-auto">
                  {initialFailureCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER: Operator identity and site exit */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
         <div className="flex items-center gap-3 px-2 py-2 mb-2">
           <UserCircle className="w-8 h-8 text-slate-600" />
           <div className="min-w-0">
             <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">Operator</p>
             <p className="text-xs font-bold text-slate-200 truncate">{operatorId}</p>
           </div>
         </div>
        <Link href="/" className="flex items-center gap-2 px-2 py-2 text-xs font-bold text-slate-500 hover:text-white transition-colors">
          <LogOut className="w-3 h-3" />
          Exit to Site
        </Link>
      </div>
    </aside>
  );
}