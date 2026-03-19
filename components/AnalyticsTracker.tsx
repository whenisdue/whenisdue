'use client'

import { useEffect, useRef } from 'react'
import { track } from '@vercel/analytics'

interface AnalyticsTrackerProps {
  stateName: string;
  programCode: string;
}

export default function AnalyticsTracker({ stateName, programCode }: AnalyticsTrackerProps) {
  const tableTracked = useRef(false)

  useEffect(() => {
    // 1. Log a specific, high-intent page view
    track('program_page_view', { 
      state: stateName, 
      program: programCode 
    })

    // 2. The Forensic UX: Detect when the schedule table actually becomes visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // If the table enters the screen and we haven't tracked it yet...
          if (entry.isIntersecting && !tableTracked.current) {
            tableTracked.current = true;
            
            track('schedule_table_visible', {
              state: stateName,
              program: programCode
            });
            
            console.log(`[Analytics] Table visible event fired for ${stateName}`);
          }
        })
      },
      { threshold: 0.3 } // Triggers when 30% of the table is on screen
    )

    // Look for the specific ID of our schedule table
    const tableElement = document.getElementById('schedule-table')
    if (tableElement) {
      observer.observe(tableElement)
    }

    return () => {
      if (tableElement) observer.unobserve(tableElement)
      observer.disconnect()
    }
  }, [stateName, programCode])

  // This component renders nothing visually. It is a silent observer.
  return null;
}