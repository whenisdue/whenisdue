"use client";

import { ExternalLink, Landmark, ShieldCheck } from "lucide-react";
import { sendGAEvent } from '@next/third-parties/google';

interface OfficialResourcesProps {
  stateName: string;
  officialUrl?: string;
  stateSlug: string;
}

export default function OfficialResources({ stateName, officialUrl, stateSlug }: OfficialResourcesProps) {
  // 1. Validation Guard: Fail silently but safely if data is missing
  if (!officialUrl) return null;

  const handleLinkClick = () => {
    // 2. Outbound Tracking: High-fidelity intent data
    sendGAEvent('event', 'official_resource_click', {
      state_name: stateName,
      state_slug: stateSlug,
      url: officialUrl
    });
  };

  return (
    <div className="mt-12 p-8 bg-blue-50/50 border-2 border-blue-100 rounded-[2.5rem] space-y-6">
      <div className="flex items-center gap-3 text-blue-600">
        <Landmark className="w-6 h-6" />
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
          Official {stateName} Resources
        </h3>
      </div>

      <p className="text-slate-700 font-bold text-lg leading-relaxed">
        To apply for benefits, renew your case, or report changes, please visit the 
        official {stateName} government assistance portal:
      </p>

      <a 
        href={officialUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleLinkClick}
        className="inline-flex items-center gap-4 px-8 py-5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 group"
      >
        Visit Official {stateName} Site
        <ExternalLink className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
      </a>

      <div className="pt-4 border-t border-blue-100 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        Verified Government Website
      </div>
    </div>
  );
}