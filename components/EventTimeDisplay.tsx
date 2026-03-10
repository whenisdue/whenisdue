'use client'

import { useEffect, useState } from 'react'

interface EventTimeDisplayProps {
  dueAt: Date
  officialZone: string
  compact?: boolean
  isHero?: boolean // <-- Added to allow massive text on the Hero
}

export default function EventTimeDisplay({ 
  dueAt, 
  officialZone,
  compact = false,
  isHero = false
}: EventTimeDisplayProps) {
  const [mounted, setMounted] = useState(false)
  const [localZoneName, setLocalZoneName] = useState('')
  const [localZoneID, setLocalZoneID] = useState('UTC')

  useEffect(() => {
    setMounted(true)
    const zoneID = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    setLocalZoneID(zoneID)

    const zoneName = new Intl.DateTimeFormat('en-US', { 
      timeZoneName: 'long' 
    }).formatToParts(new Date())
      .find(part => part.type === 'timeZoneName')?.value || ''
    
    setLocalZoneName(zoneName)
  }, [])

  if (!mounted) {
    return <div className={`animate-pulse bg-slate-800/50 rounded ${isHero ? 'h-24 mt-4' : compact ? 'h-12 mt-3' : 'h-20'}`} />
  }

  // THE FIX: Removed timeZoneName so "GMT+8" is gone forever
  const localTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', 
    minute: '2-digit'
  }).format(dueAt)

  const localDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short', 
    month: 'short', 
    day: 'numeric'
  }).format(dueAt)

  // --- 1. THE HERO MODE (Massive typography for the Primary Record Block) ---
  if (isHero) {
    return (
      <div className="flex flex-col mt-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
          <span className="text-3xl md:text-4xl font-black text-white tracking-tight">{localTime}</span>
          <span className="text-lg font-medium text-slate-400">{localDate}</span>
        </div>
        <div className="flex flex-col mt-1">
          <p className="text-[11px] text-blue-400 font-bold tracking-widest uppercase mb-0.5">
            Your Local Time
          </p>
          <span className="text-xs text-slate-500 font-medium">
            {localZoneName || localZoneID}
          </span>
        </div>
      </div>
    )
  }

  // --- 2. THE COMPACT MODE (Clean and scaled for Homepage Cards) ---
  if (compact) {
    return (
      <div className="flex flex-col mt-3 pt-3 border-t border-slate-800/60">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-1.5">
          <span className="text-xl font-black text-slate-100 tracking-tight">{localTime}</span>
          <span className="text-sm font-medium text-slate-400">{localDate}</span>
        </div>
        <div className="flex flex-col">
          <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase mb-0.5">
            Your Local Time
          </p>
          <span className="text-[10px] text-slate-500 font-medium leading-tight">
            {localZoneName || localZoneID}
          </span>
        </div>
      </div>
    )
  }

  // --- 3. THE FULL-SIZE COMPONENT (For individual Event Pages) ---
  const officialTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: officialZone
  }).format(dueAt)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">Your Local Time</p>
        </div>
        <p className="text-3xl font-black text-slate-50 tabular-nums">{localTime}</p>
        <p className="text-base text-slate-400 mt-0.5">{localDate}</p>
        <p className="text-[10px] text-slate-500 tracking-wider mt-2 italic">{localZoneName}</p>
      </div>
      <div className="md:pl-4 md:border-l border-slate-800 pt-4 md:pt-0 border-t md:border-t-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1.5">Official Source Time</p>
        <p className="text-xl font-bold text-slate-200 tabular-nums">{officialTime}</p>
        <p className="text-[10px] text-slate-500 tracking-wider mt-2">ZONE: {officialZone}</p>
      </div>
    </div>
  )
}