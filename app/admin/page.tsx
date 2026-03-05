"use client";

import React, { useState, useEffect } from 'react';
import { verifyAndBroadcast, deleteOccurrence } from './actions';

export default function AdminDashboard() {
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [seriesKey] = useState('ssa-ssdi-payments');
  const [newDate, setNewDate] = useState('');
  const [proof, setProof] = useState('');
  const [entryStatus, setEntryStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [recentEntries, setRecentEntries] = useState<any[]>([]);

  // 1. Fetch Stats & Entries
  const refreshData = async () => {
    try {
      const statsRes = await fetch('/api/admin/stats');
      const statsData = await statsRes.json();
      setSubscriberCount(statsData.activeSubscribers);

      // Fetch current database entries to show in the admin list
      const entriesRes = await fetch(`/api/series-data?key=${seriesKey}`);
      const entriesData = await entriesRes.json();
      setRecentEntries(entriesData.occurrences || []);
    } catch (err) {
      console.error("Refresh failed");
    }
  };

  useEffect(() => { refreshData(); }, [entryStatus]);

  // 2. Add Handler
  const handleAddDate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEntryStatus('saving');
    const result = await verifyAndBroadcast({ seriesKey, date: newDate, proof });
    setEntryStatus(result.success ? 'success' : 'error');
    if (result.success) {
      setNewDate('');
      setProof('');
      setTimeout(() => setEntryStatus('idle'), 3000);
    }
  };

  // 3. Delete Handler
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will remove the record from the public site.")) return;
    const result = await deleteOccurrence(id, seriesKey);
    if (result.success) refreshData();
  };

  return (
    <main className="min-h-screen bg-black text-white p-10 font-sans text-left">
      <header className="mb-12 border-b border-gray-800 pb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Mission Control</h1>
          <p className="text-gray-500 font-mono text-xs uppercase">Subscriber Count: {subscriberCount ?? "--"}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Entry Form */}
        <section className="bg-gray-900 border border-gray-800 p-8 rounded-3xl">
          <h2 className="text-xl font-bold mb-6 text-blue-400 italic underline">Verify New Date</h2>
          <form onSubmit={handleAddDate} className="space-y-4">
            <input type="date" required value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full bg-black border border-gray-700 p-4 rounded-xl font-mono" />
            <input type="url" placeholder="Evidence URL" value={proof} onChange={(e) => setProof(e.target.value)} className="w-full bg-black border border-gray-700 p-4 rounded-xl text-sm" />
            <button type="submit" className={`w-full py-4 rounded-xl font-black uppercase ${entryStatus === 'success' ? 'bg-green-600' : 'bg-white text-black'}`}>
              {entryStatus === 'idle' ? "Save & Broadcast" : entryStatus === 'saving' ? "Working..." : entryStatus === 'success' ? "Done" : "Broadcast Error (Check .env)"}
            </button>
          </form>
        </section>

        {/* Database Management List */}
        <section className="bg-gray-900 border border-gray-800 p-8 rounded-3xl">
          <h2 className="text-xl font-bold mb-6 text-red-500 italic underline">Manage Vault</h2>
          <div className="space-y-3">
            {recentEntries.map((occ) => (
              <div key={occ.id} className="flex justify-between items-center bg-black p-4 rounded-xl border border-gray-800">
                <span className="font-mono text-sm">{new Date(occ.date).toISOString().split('T')[0]}</span>
                <button onClick={() => handleDelete(occ.id)} className="text-[10px] font-black text-red-500 uppercase border border-red-900 px-3 py-1 rounded hover:bg-red-900/20">
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}