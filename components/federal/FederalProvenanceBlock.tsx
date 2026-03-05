import React from "react";

export function getFederalPublisher(url: string): string {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("govinfo.gov")) return "U.S. Government Publishing Office (GovInfo)";
  if (lowerUrl.includes("ssa.gov")) return "Social Security Administration";
  if (lowerUrl.includes("va.gov")) return "U.S. Department of Veterans Affairs";
  if (lowerUrl.includes("azureedge.us") || lowerUrl.includes("usda.gov")) return "U.S. Department of Agriculture (USDA FNS)";
  if (lowerUrl.includes("portal.ct.gov")) return "Connecticut Department of Social Services";
  if (lowerUrl.includes("bls.gov")) return "U.S. Bureau of Labor Statistics";
  if (lowerUrl.includes("irs.gov")) return "Internal Revenue Service";
  if (lowerUrl.includes("treasury.gov") || lowerUrl.includes("fiscaldata.treasury.gov")) return "U.S. Department of the Treasury";
  if (lowerUrl.includes("federalregister.gov")) return "Office of the Federal Register";
  if (lowerUrl.includes("cms.gov") || lowerUrl.includes("medicare.gov")) return "Centers for Medicare & Medicaid Services";
  return "U.S. Government";
}

export function getFederalSourceType(url: string, eventName: string = "", eventType: string = ""): string {
  const lowerUrl = url.toLowerCase();
  const lowerName = eventName.toLowerCase();

  // VA Statutory exception
  if (lowerUrl.includes("govinfo.gov") && eventType === "SCHEDULE" && lowerName.includes("va")) {
    return "Statutory basis: 38 U.S.C. §5120(e)–(f) (payment timing rule)";
  }
  
  if (lowerUrl.endsWith(".pdf")) return "Official publication (PDF)";
  if (lowerUrl.includes("/press/releases/") || lowerUrl.includes("/press/")) return "Official press release";
  
  return "Official government webpage";
}

export default function FederalProvenanceBlock({ event }: { event: any }) {
  if (event.category !== "federal" || !event.sourceUrl) return null;

  const publisherName = getFederalPublisher(event.sourceUrl);
  const sourceType = getFederalSourceType(event.sourceUrl, event.eventName, event.eventType);
  const lastVerified = event.lastVerifiedUtc ? event.lastVerifiedUtc.split("T")[0] : "N/A";

  const isVaStatutory = event.sourceUrl.toLowerCase().includes("govinfo.gov") && 
                        event.eventType === "SCHEDULE" && 
                        (event.eventName || "").toLowerCase().includes("va");

  return (
    <div className="mt-12 bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm max-w-3xl mx-auto">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Official Source</h3>
      <div className="space-y-1.5 text-sm text-slate-700">
        <p><strong className="font-semibold text-slate-900">Publisher:</strong> {publisherName}</p>
        <p><strong className="font-semibold text-slate-900">Source:</strong> {sourceType}</p>
        
        {isVaStatutory && (
          <p className="text-xs text-slate-500 italic mt-0.5">
            Rates table source: VA disability compensation rates (VA.gov) — see linked COLA/rates pages
          </p>
        )}
        
        <p className="truncate"><strong className="font-semibold text-slate-900">URL:</strong> <a href={event.sourceUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{event.sourceUrl}</a></p>
        <p><strong className="font-semibold text-slate-900">Last verified:</strong> {lastVerified}</p>
      </div>
    </div>
  );
}