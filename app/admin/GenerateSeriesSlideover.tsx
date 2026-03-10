'use client'

import { useState, useTransition, useEffect } from 'react'
import { X } from 'lucide-react'
import type { GeneratedOccurrence } from './series-actions'

type Props = {
  open: boolean
  onClose: () => void
  onPreviewGenerate: (payload: any) => Promise<GeneratedOccurrence[]>
  onCommitSeries: (payload: any) => Promise<void>
}

export default function GenerateSeriesSlideover({ open, onClose, onPreviewGenerate, onCommitSeries }: Props) {
  const [title, setTitle] = useState('SSI Payment')
  const [category, setCategory] = useState('FEDERAL')
  const [seriesId, setSeriesId] = useState('ssi-payment-schedule')
  const [startDate, setStartDate] = useState('2026-01-01')
  const [dayOfMonth, setDayOfMonth] = useState('1')

  const [rows, setRows] = useState<GeneratedOccurrence[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [isPreviewing, startPreviewTransition] = useTransition()
  const [isCommitting, startCommitTransition] = useTransition()

  useEffect(() => { if (!open) { setRows([]); setError(''); setSuccess(''); } }, [open])

  function handlePreview() {
    setError(''); setSuccess('')
    startPreviewTransition(async () => {
      try {
        const previewRows = await onPreviewGenerate({
          title, category, seriesId, startDate, dayOfMonth: parseInt(dayOfMonth), count: 12
        })
        setRows(previewRows)
      } catch (err: any) { setError(err.message || 'Preview failed') }
    })
  }

  function handleCommit() {
    setError(''); setSuccess('')
    startCommitTransition(async () => {
      try {
        await onCommitSeries({
          title, category, seriesId, dates: rows.map(r => r.adjustedDateIso)
        })
        setSuccess('12 Events successfully committed to database!')
        setTimeout(onClose, 2000)
      } catch (err: any) { setError(err.message || 'Commit failed') }
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-zinc-950 border-l border-zinc-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right">
        
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 bg-zinc-900/30">
          <div>
            <h2 className="text-xl font-bold text-white">Generate Series</h2>
            <p className="text-xs text-zinc-400 mt-1">Calculate and commit 12 months of holiday-adjusted events.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: CONTROLS */}
          <div className="w-80 border-r border-zinc-800 p-6 overflow-y-auto space-y-5 bg-zinc-950">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Series Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-sm text-white outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-sm text-white outline-none focus:border-emerald-500">
                <option value="FEDERAL">Federal</option>
                <option value="GAMING">Gaming</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Series Slug</label>
              <input value={seriesId} onChange={e => setSeriesId(e.target.value)} className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-sm text-white outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Start Month (Anchor)</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-sm text-white outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1 block">Target Day of Month</label>
              <input type="number" min="1" max="31" value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-sm text-white outline-none focus:border-emerald-500" />
            </div>

            <button onClick={handlePreview} disabled={isPreviewing} className="w-full h-10 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition disabled:opacity-50 mt-4">
              {isPreviewing ? 'Calculating...' : 'Preview Dates'}
            </button>

            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{error}</div>}
            {success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg">{success}</div>}
          </div>

          {/* RIGHT: PREVIEW TABLE */}
          <div className="flex-1 p-6 overflow-y-auto bg-black">
            <h3 className="text-sm font-bold text-white mb-4">Verification Preview</h3>
            {rows.length === 0 ? (
              <div className="h-64 border border-dashed border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 text-sm">
                Set rules and click Preview to calculate schedule.
              </div>
            ) : (
              <div className="space-y-4">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500">
                      <th className="pb-3 font-medium">#</th>
                      <th className="pb-3 font-medium">Calculated Date (UTC)</th>
                      <th className="pb-3 font-medium">Rule Logic</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-b border-zinc-900/50">
                        <td className="py-3 text-zinc-400">{row.index}</td>
                        <td className="py-3">
                          <div className="inline-flex bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-emerald-400 font-mono font-bold">
                            {row.adjustedDateIso}
                          </div>
                        </td>
                        <td className="py-3 text-xs text-zinc-500">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <button onClick={handleCommit} disabled={isCommitting} className="w-full h-12 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  {isCommitting ? 'Writing to Database...' : 'Commit 12 Events to Database'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}