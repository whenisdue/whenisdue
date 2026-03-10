import { requireAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import AdminClientShell from './AdminClientShell'

// Force Next.js to dynamically render this page so the table is always fresh
export const dynamic = 'force-dynamic'

export default async function AdminControlRoom() {
  await requireAdminSession()

  const events = await prisma.event.findMany({
    orderBy: { dueAt: 'asc' },
  })

  return <AdminClientShell initialEvents={events} />
}