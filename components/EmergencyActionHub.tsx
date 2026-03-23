'use client';

import React from 'react';
import { Phone, ExternalLink, AlertTriangle, MapPin } from 'lucide-react';

interface Resource {
  id: string;
  name: string;
  type: string;
  value: string;
}

interface Props {
  resources: Resource[];
  stateName: string;
}

export default function EmergencyActionHub({ resources, stateName }: Props) {
  return (
    <div className="mt-12 space-y-8">
      {/* ⚠️ LATE PAYMENT WARNING SECTION */}
      <div className="bg-amber-50 border-4 border-amber-400 rounded-3xl p-8 shadow-md">
        <div className="flex items-center gap-4 mb-4">
          <AlertTriangle className="w-10 h-10 text-amber-600" />
          <h3 className="text-2xl font-black text-slate-900">Is your payment late?</h3>
        </div>
        <p className="text-lg font-bold text-slate-700 leading-snug mb-6">
          If your benefits did not arrive on your scheduled date, follow these 3 steps:
        </p>
        
        <div className="space-y-4">
          <div className="flex gap-4 items-start bg-white p-4 rounded-xl border-2 border-amber-100">
            <span className="bg-amber-400 text-slate-900 w-8 h-8 rounded-full flex items-center justify-center font-black shrink-0">1</span>
            <p className="text-base font-bold text-slate-800">Check your current balance using the EBT Customer Service number below.</p>
          </div>
          <div className="flex gap-4 items-start bg-white p-4 rounded-xl border-2 border-amber-100">
            <span className="bg-amber-400 text-slate-900 w-8 h-8 rounded-full flex items-center justify-center font-black shrink-0">2</span>
            <p className="text-base font-bold text-slate-800">Verify your case status on the official {stateName} portal.</p>
          </div>
          <div className="flex gap-4 items-start bg-white p-4 rounded-xl border-2 border-amber-100">
            <span className="bg-amber-400 text-slate-900 w-8 h-8 rounded-full flex items-center justify-center font-black shrink-0">3</span>
            <p className="text-base font-bold text-slate-800">If you still have no payment after 24 hours, call the DCF Help Line.</p>
          </div>
        </div>
      </div>

      {/* 📞 DIRECT CONTACT BUTTONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map((res) => (
          <a
            key={res.id}
            href={res.type === 'PHONE' ? `tel:${res.value}` : res.value}
            target={res.type === 'LINK' ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-white border-4 border-slate-200 hover:border-blue-600 p-6 rounded-3xl transition-all shadow-sm active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="bg-slate-100 p-3 rounded-2xl">
                {res.type === 'PHONE' ? <Phone className="w-6 h-6 text-blue-600" /> : <ExternalLink className="w-6 h-6 text-blue-600" />}
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-slate-500 uppercase tracking-tighter">{res.name}</p>
                <p className="text-xl font-black text-slate-900">{res.value}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
      
      {/* 📍 LOCAL HELP SECTION */}
      <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <h4 className="text-3xl font-black leading-tight">Need food immediately?</h4>
            <p className="text-xl font-bold text-blue-100">
              Local food pantries provide free groceries if you are waiting for your EBT deposit.
            </p>
          </div>
          <a 
            href="https://www.feedingflorida.org/find-food" 
            className="bg-white text-blue-600 px-8 py-5 rounded-2xl font-black text-xl shadow-lg hover:bg-blue-50 transition-colors shrink-0"
          >
            Find a Food Bank
          </a>
        </div>
      </div>
    </div>
  );
}