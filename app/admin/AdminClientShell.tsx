'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ListTodo } from 'lucide-react'
import EventFormPanel from './EventFormPanel'
import { deleteEvent, toggleTrending } from './actions'
import GenerateSeriesSlideover from './GenerateSeriesSlideover'
import { previewSeriesDatesAction, commitSeriesAction } from './series-actions'

type AdminClientShellProps = {
  initialEvents: any[]
}

export default function AdminClientShell({ initialEvents }: AdminClientShellProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any | null>(null)
  
  // State for our new Recurrence Generator
  const [isSeriesOpen, setIsSeriesOpen] = useState(false)

  const activeCount = initialEvents.length
  const trendingCount = initialEvents.filter(e => e.trending).length
  const tbaCount = initialEvents.filter(e => e.dateStatus !== 'EXACT').length

  const openNew = () => { setEditingEvent(null); setIsFormOpen(true); }
  const openEdit = (event: any) => { setEditingEvent(event); setIsFormOpen(true); }

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`DANGER: Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      await deleteEvent(id)
    }
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await toggleTrending(id, currentStatus)
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-6 pb-20">
        
        {/* STICKY COMMAND HEADER */}
        <header className="sticky top-0 z-30 -mx-4 border-b border-zinc-900 bg-black/80 px-4 py-4 backdrop-blur-md md:-mx-6 md:px-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-500 mb-1">Admin Control Room</p>
            <h1 className="text-2xl font-bold tracking-tight text-white">Event Operations Terminal</h1>
          </div>
          <div className="flex items-center gap-3">
            
            <Link href="/admin/requests" className="flex items-center gap-2 h-10 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm font-bold text-zinc-400 transition hover:bg-zinc-900 hover:text-white hover:border-zinc-700">
              <ListTodo className="w-4 h-4" />
              Request Queue
            </Link>
            
            {/* The new Generate Series Button */}
            <button onClick={() => setIsSeriesOpen(true)} className="h-10 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm font-bold text-cyan-400 transition hover:bg-zinc-900">
              Generate Series
            </button>
            
            <button onClick={openNew} className="h-10 rounded-xl bg-white px-5 text-sm font-black text-black transition hover:bg-zinc-200 hover:scale-[1.02]">
              + New Event
            </button>
          </div>
        </header>

        {/* KPI ROW */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4 mt-2">
          {[
            [activeCount, "Total Events", "border-zinc-800"],
            [trendingCount, "Trending Live", "border-emerald-500/30 bg-emerald-500/5"],
            [tbaCount, "Missing Dates (TBA)", "border-amber-500/30 bg-amber-500/5"],
            ["0", "Drafts", "border-zinc-800"],
          ].map(([value, label, styles], i) => (
            <div key={i} className={`rounded-2xl border ${styles} bg-zinc-950 p-5 relative overflow-hidden`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
              <p className="mt-2 text-4xl font-black tracking-tight text-white">{value}</p>
            </div>
          ))}
        </section>

        {/* MAIN DATA GRID */}
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden mt-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5 bg-zinc-900/30">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Active Schedule</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-950 border-b border-zinc-900 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
                <tr>
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Status / Date</th>
                  <th className="px-6 py-4">Trending</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/50">
                {initialEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-zinc-900/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-100 text-base">{event.title}</div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-1">/{event.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                        {event.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                        {event.dateStatus === 'EXACT' ? (
                          <div>
                            <div className="text-emerald-400 font-mono font-bold text-sm">
                              {new Date(event.dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{event.timeZone || 'UTC'}</div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-400">
                              {event.dateStatus.replace('_', ' ')}
                            </span>
                            {event.dateLabel && <div className="text-xs text-zinc-500 mt-1">{event.dateLabel}</div>}
                          </div>
                        )}
                    </td>
                    <td className="px-6 py-4">
                        <button onClick={() => handleToggle(event.id, event.trending)} className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition">
                          <div className={`w-3 h-3 rounded-full ${event.trending ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-zinc-700'}`}></div>
                        </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(event)} className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500">
                            Edit
                        </button>
                        <button onClick={() => handleDelete(event.id, event.title)} className="text-[11px] font-bold text-rose-400 hover:text-white transition-colors bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/30">
                            Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Standard Event Form */}
        {isFormOpen && <EventFormPanel event={editingEvent} onClose={() => setIsFormOpen(false)} />}
        
        {/* The New Series Generator Form */}
        <GenerateSeriesSlideover 
          open={isSeriesOpen} 
          onClose={() => setIsSeriesOpen(false)} 
          onPreviewGenerate={previewSeriesDatesAction} 
          onCommitSeries={commitSeriesAction} 
        />
        
      </div>
    </div>
  )
}