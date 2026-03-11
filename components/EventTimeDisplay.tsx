'use client'

import { useEffect, useState } from 'react'

interface EventTimeDisplayProps {
  dueAt: Date
  officialZone: string
  compact?: boolean
  isHero?: boolean
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
    return <div className={`animate-pulse bg-slate-200 rounded ${isHero ? 'h-24 mt-4' : compact ? 'h-12 mt-3' : 'h-20'}`} />
  }

  const localTime = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(dueAt)
  const localDate = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: isHero ? 'numeric' : undefined }).format(dueAt)

  // 1. HERO MODE: Massive, high-contrast typography for 50+ readability
  if (isHero) {
    return (
      <div className="flex flex-col mt-3">
        <div className="text-slate-900 font-black text-4xl md:text-5xl tracking-tight mb-2">
          {localDate}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-700">{localTime}</span>
        </div>
      </div>
    )
  }

  // 2. COMPACT MODE
  if (compact) {
    return (
      <div className="flex flex-col mt-4 pt-4 border-t border-slate-200">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-1">
          <span className="text-lg font-bold text-slate-900 tracking-tight">{localDate}</span>
          <span className="text-sm font-semibold text-slate-600">{localTime}</span>
        </div>
        <div className="flex flex-col mt-1">
          <span className="text-[11px] text-slate-500 font-medium leading-tight">
            {localZoneName || localZoneID}
          </span>
        </div>
      </div>
    )
  }

  return null; // Full mode omitted for brevity, used in detail pages
}