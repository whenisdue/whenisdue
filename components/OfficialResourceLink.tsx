"use client";

import { ExternalLink } from "lucide-react";
import { sendGAEvent } from '@next/third-parties/google';

export default function OfficialResourceLink({ url, stateName }: { url: string, stateName: string }) {
  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => sendGAEvent('event', 'official_resource_click', { 
        state_name: stateName, 
        url: url 
      })}
      className="inline-flex items-center gap-3 bg-blue-600 text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 group"
    >
      Go to official {stateName} Site 
      <ExternalLink className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
    </a>
  );
}