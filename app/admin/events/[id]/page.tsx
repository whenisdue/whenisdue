import { requireAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import DataEditorForm from './DataEditorForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession()
  const { id } = await params

  const event = await prisma.event.findUnique({
    where: { id }
  })

  if (!event) notFound()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/admin" className="text-sm font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Editing: {event.title}</h1>
        <p className="text-slate-600">Use the visual builder below to update the programmatic SEO rules for this state.</p>
      </div>

      {/* Load our interactive Client Form */}
      <DataEditorForm event={event} />
    </div>
  )
}