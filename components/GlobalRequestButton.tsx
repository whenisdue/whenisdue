"use client";

import { useState } from "react";
import RequestEventModal from "./RequestEventModal";
import { PlusCircle } from "lucide-react";

export default function GlobalRequestButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-emerald-500 hover:bg-zinc-800 text-white px-4 py-3 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all group"
      >
        <PlusCircle className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-bold uppercase tracking-widest pr-1 hidden sm:block">
          Request Event
        </span>
      </button>

      {/* The Modal we just built */}
      <RequestEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}