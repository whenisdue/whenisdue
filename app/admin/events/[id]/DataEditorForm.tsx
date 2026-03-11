'use client'

import { useState } from 'react'
import { saveDeepData } from '@/app/actions/admin-data'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save } from 'lucide-react'

export default function DataEditorForm({ event }: { event: any }) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const [whatToExpect, setWhatToExpect] = useState(event.whatToExpect || "")
  
  const initialRules = event.scheduleRules || { headers: ["Group / Identifier", "Deposit Date"], rows: [], footerNote: "" }
  const [headers, setHeaders] = useState(initialRules.headers)
  const [rows, setRows] = useState<{identifier: string, date: string}[]>(initialRules.rows || [])
  const [footerNote, setFooterNote] = useState(initialRules.footerNote || "")

  const [faqs, setFaqs] = useState<{question: string, answer: string}[]>(event.faqData || [])

  const handleSave = async () => {
    setIsSaving(true)
    const payload = {
      whatToExpect,
      scheduleRules: { headers, rows, footerNote },
      faqData: faqs
    }
    await saveDeepData(event.id, payload)
    setIsSaving(false)
    router.push('/admin')
  }

  return (
    <div className="space-y-12 pb-24">
      {/* SECTION 1: Rule Explanation */}
      <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">1. The Rule Explanation</h2>
        <textarea 
          value={whatToExpect}
          onChange={(e) => setWhatToExpect(e.target.value)}
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="e.g. Texas distributes SNAP benefits between the 1st and 15th..."
        />
      </section>

      {/* SECTION 2: Schedule Table Builder */}
      <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900">2. Schedule Matrix</h2>
          <button onClick={() => setRows([...rows, { identifier: "", date: "" }])} className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Row
          </button>
        </div>

        {/* NEW: Editable Headers */}
        <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Left Header</label>
            <input 
              value={headers[0]}
              onChange={(e) => setHeaders([e.target.value, headers[1]])}
              className="w-full p-2 border border-slate-300 rounded-md bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Right Header</label>
            <input 
              value={headers[1]}
              onChange={(e) => setHeaders([headers[0], e.target.value])}
              className="w-full p-2 border border-slate-300 rounded-md bg-slate-50"
            />
          </div>
        </div>

        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-3 items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
              <input 
                value={row.identifier}
                onChange={(e) => { const newRows = [...rows]; newRows[i].identifier = e.target.value; setRows(newRows); }}
                placeholder="Identifier (e.g. 00-03)"
                className="flex-1 p-2 border border-slate-300 rounded-md"
              />
              <input 
                value={row.date}
                onChange={(e) => { const newRows = [...rows]; newRows[i].date = e.target.value; setRows(newRows); }}
                placeholder="Date (e.g. April 1, 2026)"
                className="flex-1 p-2 border border-slate-300 rounded-md"
              />
              <button onClick={() => setRows(rows.filter((_, idx) => idx !== i))} className="text-rose-500 p-2 hover:bg-rose-50 rounded-md">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {/* NEW: Editable Footer Note */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Table Footer Note (Optional)</label>
          <input 
            value={footerNote}
            onChange={(e) => setFooterNote(e.target.value)}
            placeholder="e.g. If your EDG is higher than 34..."
            className="w-full p-2 border border-slate-300 rounded-md bg-slate-50"
          />
        </div>
      </section>

      {/* SECTION 3: FAQ Builder */}
      <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900">3. Anxiety-Driven FAQs</h2>
          <button onClick={() => setFaqs([...faqs, { question: "", answer: "" }])} className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add FAQ
          </button>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="flex gap-3 items-start bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="flex-1 space-y-3">
                <input 
                  value={faq.question}
                  onChange={(e) => { const newFaqs = [...faqs]; newFaqs[i].question = e.target.value; setFaqs(newFaqs); }}
                  placeholder="Question"
                  className="w-full p-2 border border-slate-300 rounded-md font-semibold"
                />
                <textarea 
                  value={faq.answer}
                  onChange={(e) => { const newFaqs = [...faqs]; newFaqs[i].answer = e.target.value; setFaqs(newFaqs); }}
                  placeholder="Answer"
                  rows={2}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
              <button onClick={() => setFaqs(faqs.filter((_, idx) => idx !== i))} className="text-rose-500 p-2 hover:bg-rose-50 rounded-md mt-1">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Save Button */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-4xl mx-auto flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {isSaving ? "Saving..." : "Publish to Production"}
          </button>
        </div>
      </div>
    </div>
  )
}