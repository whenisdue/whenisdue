import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { AdminSidebar } from "./admin-sidebar"; 
import { getDeadLetterCount } from "./actions"; // Import the counter we just made

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. THE BOUNCER: Server-side check
  const session = await getAdminSession();
  
  if (!session || session.role !== 'admin') {
    redirect("/");
  }

  // 2. DATA FETCH: Get real-time failure counts for the sidebar badge
  const failureCount = await getDeadLetterCount();

  return (
    <div className="flex min-h-screen bg-slate-50">
      
      {/* 3. THE SIDEBAR: Pass verified ID and the failure count */}
      <AdminSidebar 
        operatorId={session.sub} 
        initialFailureCount={failureCount} 
      />

      {/* 4. THE CONTENT: Render the child pages */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}