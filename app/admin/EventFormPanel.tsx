'use client'

import { useActionState, useEffect, useState } from 'react'
import { saveEvent, ActionState } from './actions'
import { EventCategory, EventDateStatus } from '@prisma/client'
import { X } from 'lucide-react'

type EventFormPanelProps = {
  event?: any | null
  onClose: () => void
}

const initialState: ActionState = { ok: false }

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function EventFormPanel({ event, onClose }: EventFormPanelProps) {
  const [state, formAction, isPending] = useActionState(saveEvent, initialState)
  
  // Local state for dynamic UI changes
  const [title, setTitle] = useState(event?.title || '')
  const [slug, setSlug] = useState(event?.slug || '')
  const [slugEdited, setSlugEdited] = useState(!!event)
  const [dateStatus, setDateStatus] = useState<string>(event?.dateStatus || EventDateStatus.EXACT)

  // Auto-slug generator
  useEffect(() => {
    if (!slugEdited) setSlug(slugify(title))
  }, [title, slugEdited])

  // Close form automatically on success
  useEffect(() => {
    if (state.ok) onClose()
  }, [state.ok, onClose])

  // Helper to format exact dates for the datetime-local input
  const localDateTimeValue = event?.dueAt && event?.dateStatus === 'EXACT'
    ? new Date(event.dueAt.getTime() - event.dueAt.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    : ''

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      {/* Slide-over Panel */}
      <div className="w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 bg-zinc-900/30">
          <div>
            <h2 className="text-lg font-bold text-white">
              {event ? 'Edit Event' : 'New Event'}
            </h2>
            {event && <p className="text-xs text-zinc-500 font-mono mt-1">/{event.slug}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form action={formAction} className="flex-1 overflow-y-auto p-6 space-y-6">
          <input type="hidden" name="id" value={event?.id || ''} />
          
          {state.message && !state.ok && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 font-medium">
              {state.message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">Title</label>
              <input 
                name="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-sm text-white focus:border-emerald-500/50 focus:bg-zinc-950 outline-none transition" 
                placeholder="Event Title"
              />
              {state.fieldErrors?.title && <p className="text-xs text-rose-400 mt-1">{state.fieldErrors.title[0]}</p>}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">Slug</label>
              <input 
                name="slug" 
                value={slug} 
                onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }} 
                className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-sm text-white font-mono focus:border-emerald-500/50 focus:bg-zinc-950 outline-none transition" 
              />
              {state.fieldErrors?.slug && <p className="text-xs text-rose-400 mt-1">{state.fieldErrors.slug[0]}</p>}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">Category</label>
              <select name="category" defaultValue={event?.category || ''} className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-sm text-white focus:border-emerald-500/50 focus:bg-zinc-950 outline-none appearance-none">
                <option value="">Select...</option>
                <option value={EventCategory.FEDERAL}>Federal</option>
                <option value={EventCategory.GAMING}>Gaming</option>
                <option value={EventCategory.SHOPPING}>Shopping</option>
                <option value={EventCategory.TECH}>Tech</option>
                <option value={EventCategory.OTHER}>Other</option>
              </select>
              {state.fieldErrors?.category && <p className="text-xs text-rose-400 mt-1">{state.fieldErrors.category[0]}</p>}
            </div>

            <div className="pt-4 border-t border-zinc-800/50">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">Date Status</label>
              <select name="dateStatus" value={dateStatus} onChange={(e) => setDateStatus(e.target.value)} className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-sm text-white focus:border-emerald-500/50 focus:bg-zinc-950 outline-none appearance-none">
                <option value={EventDateStatus.EXACT}>Exact Date & Time</option>
                <option value={EventDateStatus.TBD_MONTH}>TBD (Month Known)</option>
                <option value={EventDateStatus.TBA}>Completely TBA</option>
              </select>
            </div>

            {/* CONDITIONAL DATE FIELDS */}
            {dateStatus === EventDateStatus.EXACT && (
              <div className="grid grid-cols-2 gap-3 p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Local Date</label>
                  <input type="date" name="localDate" defaultValue={localDateTimeValue.split('T')[0]} className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-lg px-3 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Local Time</label>
                  <input type="time" name="localTime" defaultValue={localDateTimeValue.split('T')[1]} className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-lg px-3 text-sm text-white outline-none" />
                  {state.fieldErrors?.localTime && <p className="text-[10px] text-rose-400 mt-1">{state.fieldErrors.localTime[0]}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Time Zone (IANA)</label>
                  <input name="timeZone" defaultValue={event?.timeZone || 'America/New_York'} className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-lg px-3 text-sm text-white outline-none" placeholder="America/New_York" />
                </div>
              </div>
            )}

            {dateStatus === EventDateStatus.TBD_MONTH && (
              <div className="grid grid-cols-2 gap-3 p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Month (1-12)</label>
                  <input type="number" name="displayMonth" defaultValue={event?.displayMonth || ''} placeholder="e.g. 11" className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-lg px-3 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Year</label>
                  <input type="number" name="displayYear" defaultValue={event?.displayYear || ''} placeholder="e.g. 2026" className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-lg px-3 text-sm text-white outline-none" />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">Editorial Label (Optional)</label>
              <input name="dateLabel" defaultValue={event?.dateLabel || ''} placeholder="e.g. Coming Fall 2026" className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-sm text-white outline-none" />
            </div>

            <div className="pt-4 flex items-center justify-between">
              <label className="text-sm font-bold text-white">Trending Feature</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="trending" value="true" defaultChecked={event?.trending || false} className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-zinc-950 border-t border-zinc-800">
            <button type="submit" disabled={isPending} className="w-full h-12 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition disabled:opacity-50">
              {isPending ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}