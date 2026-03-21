import { prisma } from "@/lib/prisma"; 
import { getAdminSession } from "@/lib/admin-session";
import { redirect } from "next/navigation";
import { NotificationTable } from "./notification-table";

export default async function AdminNotificationsPage() {
  const session = await getAdminSession();
  
  // Guard: Redirect if not admin
  if (!session || session.role !== 'admin') {
    redirect("/");
  }

  // Fetch only the items that need attention (DEAD_LETTER)
  const failures = await prisma.notificationOutbox.findMany({
    where: { status: 'DEAD_LETTER' },
    include: {
      decision: {
        select: {
          notificationType: true,
          subscription: {
            select: { 
              subscriber: { 
                select: { email: true } 
              } 
            }
          }
        }
      }
    },
    orderBy: { processAt: 'desc' }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Notification Ops</h1>
        <p className="text-gray-500">Manage terminal delivery failures and trigger manual recoveries.</p>
      </header>

      {/* This will stay red until you save Block 2 below! */}
      <NotificationTable data={failures} />
    </div>
  );
}