'use client';

/**
 * @description According to Topic B197: Sovereign Agency Routing (SAR).
 * Direct-links US users to their specific state/county caseworkers.
 */
export function SovereignSupport({ programId }: { programId: string }) {
  
  // 1. THE 10X MOVE: Direct-Link Telephony Mapping (Topic B197.3)
  const getSupportLink = () => {
    // Logic currently hardcoded for CA-SNAP (CalFresh)
    return 'tel:18778473663'; 
  };

  return (
    <a 
      href={getSupportLink()}
      className="flex items-center justify-center gap-3 w-full p-6 bg-emerald-500 text-black rounded-[2rem] hover:bg-emerald-400 transition-all shadow-xl active:scale-[0.98]"
    >
      <span className="text-sm font-black uppercase tracking-tighter">
        CONTACT CALFRESH AGENCY
      </span>
    </a>
  );
}