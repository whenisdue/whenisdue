'use client'

import { useEffect, useState } from 'react'

export default function EventTimeDisplay({ 
  dueAt, 
  officialZone 
}: { 
  dueAt: Date, 
  officialZone: string 
}) {
  const [mounted, setMounted] = useState(false)
  const [localZone, setLocalZone] = useState('UTC')

  useEffect(() => {
    setMounted(true)
    setLocalZone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')
  }, [])

  if (!mounted) return <div className="h-20 animate-pulse bg-zinc-900/50 rounded-xl" />

  const localTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
  }).format(dueAt)

  const localDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  }).format(dueAt)

  const officialTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: officialZone
  }).format(dueAt)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800">
      {/* Local Time */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 mb-1.5">Your Local Time</p>
        <p className="text-2xl font-bold text-white tabular-nums">{localTime}</p>
        <p className="text-sm text-zinc-400 mt-0.5">{localDate}</p>
        <p className="text-[10px] text-zinc-500 tracking-wider mt-2">DETECTED: {localZone}</p>
      </div>

      {/* Official Time */}
      <div className="md:pl-4 md:border-l border-zinc-800 pt-4 md:pt-0 border-t md:border-t-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1.5">Official Source Time</p>
        <p className="text-xl font-bold text-zinc-200 tabular-nums">{officialTime}</p>
        <p className="text-sm text-zinc-400 mt-0.5">
          {new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: officialZone }).format(dueAt)}
        </p>
        <p className="text-[10px] text-zinc-500 tracking-wider mt-2">ZONE: {officialZone}</p>
      </div>
    </div>
  )
}